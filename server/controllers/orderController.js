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
try {
        connection = await db.getConnection();
        await connection.beginTransaction();
        
        // --- ส่วนกันสต็อก  ---
        for (const item of items) {
            const [rows] = await connection.query(
                'SELECT Stock FROM product_variants WHERE Variant_ID = ? FOR UPDATE', 
                [item.variantId]
            );
            if (rows.length === 0 || rows[0].Stock < item.quantity) {
                await connection.rollback();
                return res.status(400).json({ message: `สินค้า ${item.productName || ''} มีในสต็อกไม่เพียงพอ` });
            }
            // ลดสต็อกทันที
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


// exports.getOrderHistory = async (req, res) => {
//     try {
//         const memberId = req.user.id;
//         const { status } = req.query;

//         let baseQuery = `
//             SELECT
//                 o.Order_ID, o.CreatedAt, o.TotalPrice, o.Status, o.AdminNotes,
//                 od.Quantity, od.UnitPrice,
//                 p.ProductName,
//                 pv.Color, pv.Size,
//                 pi.PictureURL
//             FROM \`orders\` o
//             JOIN \`orderdetails\` od ON o.Order_ID = od.Order_ID
//             JOIN \`product_variants\` pv ON od.Variant_ID = pv.Variant_ID
//             JOIN \`product\` p ON pv.Product_ID = p.Product_ID
//             LEFT JOIN (
//                 SELECT Product_ID, Color, PictureURL, ROW_NUMBER() OVER(PARTITION BY Product_ID, Color ORDER BY Picture_ID) as rn
//                 FROM \`picture\` WHERE ImageType = 'front'
//             ) pi ON p.Product_ID = pi.Product_ID AND pv.Color = pi.Color AND pi.rn = 1
//             WHERE o.Member_ID = ?
//         `;
//         const params = [memberId];

//         if (status && status !== 'all') {
//             baseQuery += ' AND o.Status = ?';
//             params.push(status);
//         }

//         baseQuery += ' ORDER BY o.CreatedAt DESC, o.Order_ID';

//         const [rows] = await db.query(baseQuery, params);

//         // จัดกลุ่มข้อมูลสินค้าให้อยู่ในแต่ละออเดอร์
//         const ordersMap = {};
//         for (const row of rows) {
//             if (!ordersMap[row.Order_ID]) {
//                 ordersMap[row.Order_ID] = {
//                     Order_ID: row.Order_ID,
//                     CreatedAt: row.CreatedAt,
//                     TotalPrice: row.TotalPrice,
//                     Status: row.Status,
//                     AdminNotes: row.AdminNotes,
//                     details: []
//                 };
//             }
//             ordersMap[row.Order_ID].details.push({
//                 ProductName: row.ProductName,
//                 PictureURL: row.PictureURL,
//                 Color: row.Color,
//                 Size: row.Size,
//                 Quantity: row.Quantity,
//                 UnitPrice: row.UnitPrice
//             });
//         }

//         const finalOrders = Object.values(ordersMap);
//         res.status(200).json(finalOrders);

//     } catch (error) {
//         console.error("Get order history error:", error);
//         res.status(500).json({ message: 'เกิดข้อผิดพลาดบนเซิร์ฟเวอร์' });
//     }
// };

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
