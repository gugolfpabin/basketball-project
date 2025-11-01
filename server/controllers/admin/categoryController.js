const db = require('../../db');

exports.getAllCategories = async (req, res) => {
    try {
        const [categories] = await db.query("SELECT * FROM category ORDER BY CategoryName ASC");
        res.status(200).json(categories);
    } catch (error) {
        console.error("Get all categories error:", error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดบนเซิร์ฟเวอร์' });
    }
};