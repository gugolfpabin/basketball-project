// server/controllers/orderController.js
const db = require('../db');
const generatePayload = require('promptpay-qr');
const qrcode = require('qrcode');





exports.createManualOrder = async (req, res) => {
    const memberId = req.user.id;
    const { items, subtotal } = req.body;

    if (!items || items.length === 0) {
        return res.status(400).json({ message: "ตะกร้าสินค้าว่างเปล่า" });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const [newOrder] = await connection.query(
            'INSERT INTO `orders` (Member_ID, TotalPrice, Status, CreatedAt) VALUES (?, ?, ?, NOW())',
            [memberId, subtotal, 'pending'] 
        );
        const orderId = newOrder.insertId;

        for (const item of items) {
            // 1. ดึงข้อมูล Stock และ "Cost" ของสินค้า
            const [variantRows] = await connection.query(
                'SELECT Stock, Cost FROM product_variants WHERE Variant_ID = ? FOR UPDATE', 
                [item.variantId]
            );
            
            if (variantRows.length === 0 || variantRows[0].Stock < item.quantity) {
                await connection.rollback();
                return res.status(400).json({ message: `สินค้า ${item.productName || ''} มีในสต็อกไม่เพียงพอ` });
            }

            await connection.query(
                'UPDATE product_variants SET Stock = Stock - ? WHERE Variant_ID = ?',
                [item.quantity, item.variantId]
            );

            // 2. บันทึกรายละเอียดสินค้าลงใน `orderdetails` พร้อมกับ "Cost" ที่ดึงมาได้
            await connection.query(
                'INSERT INTO `orderdetails` (Order_ID, Variant_ID, Quantity, UnitPrice, UnitCost) VALUES (?, ?, ?, ?, ?)',
                [orderId, item.variantId, item.quantity, item.unitPrice, variantRows[0].Cost] 
            );
        }
        
        const promptpayId = '097-294-5671';
        const amount = parseFloat(subtotal);
        const payload = generatePayload(promptpayId, { amount });
        const qrCodeImage = await qrcode.toDataURL(payload);

        await connection.commit();

        res.status(200).json({
            orderId: orderId,
            qrCodeImage: qrCodeImage,
            totalAmount: amount,
            expiresAt: Date.now() + 5 * 60 * 1000
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


        // --- ส่วนคืนสต็อก  ---
        const [orderDetails] = await connection.query('SELECT * FROM `orderdetails` WHERE Order_ID = ?', [orderId]);
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


exports.getOrderHistory = async (req, res) => {
    try {
        const memberId = req.user.id;
        // รับค่า page จาก frontend, ถ้าไม่ส่งมาให้เป็นหน้า 1
        const { status, page = 1 } = req.query;
        const limit = 10; // 👈 กำหนดให้แสดง 10 รายการต่อหน้า
        const offset = (page - 1) * limit;

        // --- ส่วนที่ 1: นับจำนวนออเดอร์ทั้งหมด (โดยไม่นับ pending) ---
        let countSql = "SELECT COUNT(*) as total FROM `orders` WHERE Member_ID = ? AND Status != 'pending'";
        const countParams = [memberId];
        if (status && status !== 'all') {
            countSql += ' AND Status = ?';
            countParams.push(status);
        }
        const [countRows] = await db.query(countSql, countParams);
        const totalOrders = countRows[0].total;
        const totalPages = Math.ceil(totalOrders / limit);

        // --- ส่วนที่ 2: ดึงข้อมูลออเดอร์ของหน้าปัจจุบัน (โดยไม่เอา pending) ---
        let ordersQuery = `
            SELECT Order_ID, CreatedAt, TotalPrice, Status, AdminNotes
            FROM \`orders\`
            WHERE Member_ID = ? AND Status != 'pending'
        `;
        const params = [memberId];
        if (status && status !== 'all') {
            ordersQuery += ' AND Status = ?';
            params.push(status);
        }
        ordersQuery += ' ORDER BY CreatedAt DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const [orders] = await db.query(ordersQuery, params);
        
        // ถ้าไม่เจอออเดอร์ในหน้านี้ ก็ส่งค่าว่างกลับไป
        if (orders.length === 0) {
            return res.status(200).json({ orders: [], totalPages: totalPages });
        }

        // --- ส่วนที่ 3: ดึงรายละเอียดสินค้าของออเดอร์ที่หาเจอ ---
        const orderIds = orders.map(o => o.Order_ID);
        const detailsQuery = `
            SELECT
                od.Order_ID, od.Quantity, od.UnitPrice, p.ProductName,
                pv.color, pv.size, pi.PictureURL  
            FROM \`orderdetails\` od
            JOIN \`product_variants\` pv ON od.Variant_ID = pv.Variant_ID
            JOIN \`product\` p ON pv.Product_ID = p.Product_ID
            LEFT JOIN (
                SELECT Product_ID, Color, PictureURL, ROW_NUMBER() OVER(PARTITION BY Product_ID, Color ORDER BY Picture_ID) as rn
                FROM \`picture\` WHERE ImageType = 'front'
            ) pi ON p.Product_ID = pi.Product_ID AND pv.color = pi.Color AND pi.rn = 1
            WHERE od.Order_ID IN (?)
        `;
        const [details] = await db.query(detailsQuery, [orderIds]);

        // นำ details ไปใส่ในแต่ละ order
        orders.forEach(order => {
            order.details = details.filter(d => d.Order_ID === order.Order_ID);
        });

        // --- ส่วนที่ 4: ส่งข้อมูลทั้งหมดกลับไป ---
        res.status(200).json({
            orders: orders,
            totalPages: totalPages
        });

    } catch (error) {
        console.error("Get order history error:", error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดบนเซิร์ฟเวอร์' });
    }
};
exports.deletePendingOrder = async (req, res) => {
    const { orderId } = req.params;
    const memberId = req.user.id;

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. ตรวจสอบออเดอร์ให้แน่ใจว่าเป็นของ User คนนี้ และมีสถานะเป็น 'pending' เท่านั้น
        const [orders] = await connection.query(
            "SELECT Status FROM `orders` WHERE Order_ID = ? AND Member_ID = ?",
            [orderId, memberId]
        );

        if (orders.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'ไม่พบออเดอร์' });
        }
        if (orders[0].Status !== 'pending') {
            await connection.rollback();
            return res.status(400).json({ message: 'ไม่สามารถลบออเดอร์ที่ไม่ใช่สถานะ pending ได้' });
        }

        // 2. คืนสต็อกสินค้ากลับเข้าระบบ
        const [orderDetails] = await connection.query('SELECT * FROM `orderdetails` WHERE Order_ID = ?', [orderId]);
        for (const item of orderDetails) {
            await connection.query(
                'UPDATE product_variants SET Stock = Stock + ? WHERE Variant_ID = ?',
                [item.Quantity, item.Variant_ID]
            );
        }

        // 3. ลบข้อมูลที่เกี่ยวข้อง (ลูก) ก่อน
        await connection.query('DELETE FROM `orderdetails` WHERE Order_ID = ?', [orderId]);

        // 4. ลบออเดอร์หลัก (แม่)
        await connection.query('DELETE FROM `orders` WHERE Order_ID = ?', [orderId]);
        
        await connection.commit();
        res.status(200).json({ message: 'ลบออเดอร์ที่ยังไม่ชำระเงินสำเร็จ' });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Delete pending order error:", error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดบนเซิร์ฟเวอร์' });
    } finally {
        if (connection) connection.release();
    }
};