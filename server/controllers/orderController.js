// server/controllers/orderController.js
const db = require('../db');
const generatePayload = require('promptpay-qr');
const qrcode = require('qrcode');

exports.createManualOrder = async (req, res) => {
    const memberId = req.user.id;
    const { items, subtotal } = req.body; // รับรายการสินค้าและยอดรวมจาก Frontend

    // ตรวจสอบข้อมูลเบื้องต้น
    if (!items || items.length === 0) {
        return res.status(400).json({ message: "ตะกร้าสินค้าว่างเปล่า" });
    }

    let connection;
    // try {
    //     connection = await db.getConnection();
    //     await connection.beginTransaction();
try {
        connection = await db.getConnection();
        await connection.beginTransaction();
        for (const item of items) {
            // 1.1 เช็คสต็อกก่อนว่ามีของพอหรือไม่ (FOR UPDATE เพื่อล็อคแถว)
            const [rows] = await connection.query(
                'SELECT Stock FROM product_variants WHERE Variant_ID = ? FOR UPDATE', 
                [item.variantId]
            );
            if (rows.length === 0 || rows[0].Stock < item.quantity) {
                // ถ้าของไม่พอ ให้ยกเลิกทุกอย่าง
                await connection.rollback();
                return res.status(400).json({ message: `สินค้า ${item.productName || ''} มีในสต็อกไม่เพียงพอ` });
            }
            // 1.2 ถ้าของพอ ให้ลดสต็อกทันที
            await connection.query(
                'UPDATE product_variants SET Stock = Stock - ? WHERE Variant_ID = ?',
                [item.quantity, item.variantId]
            );
        }
        // 1. สร้างออเดอร์หลักในตาราง `orders`
        const [newOrder] = await connection.query(
            'INSERT INTO `orders` (Member_ID, TotalPrice, Status, CreatedAt) VALUES (?, ?, ?, NOW())',
            [memberId, subtotal, 'pending'] 
        );
 

        const orderId = newOrder.insertId;

        // 2. (Optional แต่แนะนำ) บันทึกรายละเอียดสินค้าลงในตาราง `orderdetails`
        for (const item of items) {
            await connection.query(
                'INSERT INTO `orderdetails` (Order_ID, Variant_ID, Quantity, UnitPrice) VALUES (?, ?, ?, ?)',
                [orderId, item.variantId, item.quantity, item.unitPrice]
            );
        }
        
        // 3. สร้าง QR Code
        const promptpayId = '097-294-5671'; // <<-- ใส่เบอร์ PromptPay ของร้านคุณตรงนี้!
        const amount = parseFloat(subtotal);
        const payload = generatePayload(promptpayId, { amount });

        // แปลง payload เป็นรูปภาพ QR Code (ในรูปแบบ Data URL)
        const qrCodeImage = await qrcode.toDataURL(payload);

        await connection.commit();

        // 4. ส่งข้อมูลกลับไปให้ Frontend
        res.status(200).json({
            orderId: orderId,
            qrCodeImage: qrCodeImage,
            totalAmount: amount,
            expiresAt: Date.now() + 5 * 60 * 1000 // ส่งเวลาหมดอายุ (5 นาทีจากนี้)
        });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Create manual order error:", error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสร้างออเดอร์' });
    } finally {
        if (connection) connection.release();
    }
};

exports.uploadSlip = async (req, res) => {
    const { orderId } = req.params;
    const memberId = req.user.id;

    // ตรวจสอบว่ามีไฟล์อัปโหลดมาหรือไม่
    if (!req.file) {
        return res.status(400).json({ message: 'กรุณาแนบไฟล์สลิป' });
    }

    const slipImageUrl = `/slips/${req.file.filename}`; // Path ที่จะเก็บลง DB

    try {
        // ตรวจสอบว่าเป็นออเดอร์ของ user คนนี้จริงหรือไม่
        const [orders] = await db.query(
            'SELECT * FROM `orders` WHERE Order_ID = ? AND Member_ID = ?',
            [orderId, memberId]
        );

        if (orders.length === 0) {
            return res.status(404).json({ message: 'ไม่พบออเดอร์นี้' });
        }

        // อัปเดต DB ด้วย URL ของสลิป และเปลี่ยนสถานะเป็น "รอตรวจสอบ"
        await db.query(
            "UPDATE `orders` SET SlipImageURL = ?, Status = 'verifying' WHERE Order_ID = ?",
            [slipImageUrl, orderId]
        );
        const [cartRows] = await db.query('SELECT Cart_ID FROM cart WHERE Member_ID = ?', [memberId]);
        if (cartRows.length > 0) {
            const cartId = cartRows[0].Cart_ID;
            // สั่งลบ cartitem ทั้งหมดที่อยู่ในตะกร้าของผู้ใช้คนนี้
            await db.query('DELETE FROM cartitem WHERE Cart_ID = ?', [cartId]);
        }
        res.status(200).json({ message: 'อัปโหลดสลิปสำเร็จ! เราจะตรวจสอบและแจ้งผลให้คุณทราบ' });

    } catch (error) {
        console.error("Upload slip error:", error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดบนเซิร์ฟเวอร์' });
    }
};

exports.cancelOrder = async (req, res) => {
    const { orderId } = req.params;
    const memberId = req.user.id;

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const [orders] = await connection.query(
            "SELECT * FROM `orders` WHERE Order_ID = ? AND Member_ID = ? AND Status = 'pending' FOR UPDATE",
            [orderId, memberId]
        );

        if (orders.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'ไม่พบออเดอร์ที่สามารถยกเลิกได้' });
        }

        // --- ส่วนคืนสต็อก ---
        const [orderDetails] = await connection.query(
            'SELECT * FROM `orderdetails` WHERE Order_ID = ?',
            [orderId]
        );
        for (const item of orderDetails) {
            await connection.query(
                'UPDATE product_variants SET Stock = Stock + ? WHERE Variant_ID = ?',
                [item.Quantity, item.Variant_ID]
            );
        }

        // --- เปลี่ยนสถานะออเดอร์ ---
        await connection.query(
            "UPDATE `orders` SET Status = 'cancelled' WHERE Order_ID = ?",
            [orderId]
        );

        await connection.commit();
        res.status(200).json({ message: 'ยกเลิกออเดอร์สำเร็จ' });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Cancel order error:", error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดบนเซิร์ฟเวอร์' });
    } finally {
        if (connection) connection.release();
    }
};