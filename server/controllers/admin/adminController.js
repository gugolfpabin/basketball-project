// server/controllers/adminController.js
const db = require('../../db');

// ฟังก์ชันสำหรับดึงข้อมูลออเดอร์ทั้งหมด
exports.getAllOrders = async (req, res) => {
    try {
        // ดึงข้อมูลออเดอร์ทั้งหมด โดยเชื่อม (JOIN) กับตาราง member เพื่อเอาชื่อลูกค้ามาด้วย
        const [orders] = await db.query(
            `SELECT o.Order_ID, m.FirstName, m.LastName, o.TotalPrice, o.Status, o.CreatedAt
             FROM \`orders\` o
             JOIN \`member\` m ON o.Member_ID = m.Member_ID
             ORDER BY o.CreatedAt DESC` // เรียงจากออเดอร์ใหม่สุดไปเก่าสุด
        );

        res.status(200).json(orders);

    } catch (error) {
        console.error("Get all orders error:", error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดบนเซิร์ฟเวอร์' });
    }
};