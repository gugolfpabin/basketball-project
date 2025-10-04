// server/controllers/orderController.js
const db = require('../../db');
const generatePayload = require('promptpay-qr');
const qrcode = require('qrcode');

exports.getAllOrders = async (req, res) => {
    try {
        
        const [orders] = await db.query(
            `SELECT o.Order_ID, m.FirstName, m.LastName, o.TotalPrice, o.Status, o.CreatedAt
             FROM \`orders\` o
             JOIN \`member\` m ON o.Member_ID = m.Member_ID
             ORDER BY o.CreatedAt DESC` 
        );

        res.status(200).json(orders);

    } catch (error) {
        console.error("Get all orders error:", error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดบนเซิร์ฟเวอร์' });
    }
};

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
        // for (const item of items) {
        //     // 1.1 เช็คสต็อกก่อนว่ามีของพอหรือไม่ (FOR UPDATE เพื่อล็อคแถว)
        //     const [rows] = await connection.query(
        //         'SELECT Stock FROM product_variants WHERE Variant_ID = ? FOR UPDATE', 
        //         [item.variantId]
        //     );
        //     if (rows.length === 0 || rows[0].Stock < item.quantity) {
        //         // ถ้าของไม่พอ ให้ยกเลิกทุกอย่าง
        //         await connection.rollback();
        //         return res.status(400).json({ message: `สินค้า ${item.productName || ''} มีในสต็อกไม่เพียงพอ` });
        //     }
        //     // 1.2 ถ้าของพอ ให้ลดสต็อกทันที
        //     await connection.query(
        //         'UPDATE product_variants SET Stock = Stock - ? WHERE Variant_ID = ?',
        //         [item.quantity, item.variantId]
        //     );
        // }
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
        // const [orderDetails] = await connection.query(
        //     'SELECT * FROM `orderdetails` WHERE Order_ID = ?',
        //     [orderId]
        // );
        // for (const item of orderDetails) {
        //     await connection.query(
        //         'UPDATE product_variants SET Stock = Stock + ? WHERE Variant_ID = ?',
        //         [item.Quantity, item.Variant_ID]
        //     );
        // }

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

exports.getOrderById = async (req, res) => {
    const { orderId } = req.params;
    let connection;
    try {
        connection = await db.getConnection();
        const [orderRows] = await connection.query(
            `SELECT 
                o.*,m.Title, m.FirstName, m.LastName, m.Email, m.Phone, m.Address,
                s.SubdistrictName, s.PostalCode, d.DistrictName, p.ProvinceName
             FROM \`orders\` o
             JOIN \`member\` m ON o.Member_ID = m.Member_ID
             LEFT JOIN \`subdistrict\` s ON m.Subdistrict_ID = s.Subdistrict_ID
             LEFT JOIN \`district\` d ON s.District_ID = d.District_ID
             LEFT JOIN \`province\` p ON d.Province_ID = p.Province_ID
             WHERE o.Order_ID = ?`,
            [orderId]
        );
      

        if (orderRows.length === 0) {
            return res.status(404).json({ message: 'ไม่พบออเดอร์' });
        }
        const order = orderRows[0];

        const [detailRows] = await connection.query(
            `SELECT 
                od.Quantity, od.UnitPrice, 
                p.ProductName, 
                pv.color, pv.size, 
                (SELECT PictureURL FROM picture pi 
                 WHERE pi.Product_ID = p.Product_ID AND pi.Color = pv.color AND ImageType = 'front' 
                 LIMIT 1) as PictureURL
             FROM \`orderdetails\` od
             JOIN \`product_variants\` pv ON od.Variant_ID = pv.Variant_ID
             JOIN \`product\` p ON pv.Product_ID = p.Product_ID
             WHERE od.Order_ID = ?`,
            [orderId]
        );
        order.details = detailRows;
        
        res.status(200).json(order);
    } catch (error) {
        console.error("Get order by id error:", error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดบนเซิร์ฟเวอร์' });
    } finally {
        if (connection) connection.release();
    }
};

exports.updateOrderStatus = async (req, res) =>{
    const { orderId } = req.params;
    const { status: newStatus, adminNotes } = req.body;

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const [orders] = await connection.query('SELECT * FROM `orders` WHERE Order_ID = ? FOR UPDATE', [orderId]);
        if (orders.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'ไม่พบออเดอร์' });
        }
        const oldStatus = orders[0].Status;

        // --- Logic การจัดการสต็อกที่สมบูรณ์และปลอดภัย ---
        const [orderDetails] = await connection.query('SELECT * FROM `orderdetails` WHERE Order_ID = ?', [orderId]);

        // กรณีที่ 1: ออเดอร์ถูก "ยืนยัน" (ตัดสต็อก)
        if (oldStatus !== 'completed' && newStatus === 'completed') {
            for (const item of orderDetails) {
                // 👇 **เพิ่ม SELECT ... FOR UPDATE เข้ามาเพื่อป้องกัน Race Condition**
                const [rows] = await connection.query(
                    'SELECT Stock FROM product_variants WHERE Variant_ID = ? FOR UPDATE', 
                    [item.Variant_ID]
                );
                
                if (rows.length === 0 || rows[0].Stock < item.Quantity) {
                    await connection.rollback();
                    return res.status(400).json({ message: `สินค้า ID ${item.Variant_ID} ในสต็อกไม่เพียงพอ` });
                }
                
                // ตัดสต็อก
                await connection.query(
                    'UPDATE product_variants SET Stock = Stock - ? WHERE Variant_ID = ?',
                    [item.Quantity, item.Variant_ID]
                );
            }
        }
        // กรณีที่ 2: ออเดอร์เคย "สำเร็จ" แล้วถูกเปลี่ยนเป็นสถานะอื่น (คืนสต็อก)
        else if (oldStatus === 'completed' && newStatus !== 'completed') {
            for (const item of orderDetails) {
                await connection.query(
                    'UPDATE product_variants SET Stock = Stock + ? WHERE Variant_ID = ?',
                    [item.Quantity, item.Variant_ID]
                );
            }
        }
        await connection.query(
            'UPDATE `orders` SET Status = ?, AdminNotes = ? WHERE Order_ID = ?',
            [newStatus, adminNotes, orderId]
        );
       
        await connection.query('UPDATE `orders` SET Status = ? WHERE Order_ID = ?', [newStatus, orderId]);
        
        await connection.commit();
        res.status(200).json({ message: 'อัปเดตสถานะออเดอร์สำเร็จ' });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Update order status error:", error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดบนเซิร์ฟเวอร์' });
    } finally {
        if (connection) connection.release();
    }
};