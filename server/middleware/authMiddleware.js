// server/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            // ถ้าไม่มี Token ส่งมาเลย
            return res.status(401).json({ message: 'Authentication token required.' });
        }

        const token = authHeader.split(' ')[1];
        
        // ตรวจสอบว่ามี secret key ใน .env หรือไม่
        if (!process.env.JWT_SECRET) {
            console.error("FATAL ERROR: JWT_SECRET is not defined in .env file.");
            return res.status(500).json({ message: "Server configuration error." });
        }

        // ถอดรหัส Token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // เพิ่มข้อมูล user ที่ถอดรหัสแล้วเข้าไปใน request เพื่อให้ controller อื่นๆ ใช้งานต่อได้
        req.user = decoded; 
        
        next(); // อนุญาตให้ผ่านไปได้

    } catch (error) {
        // ถ้า Token ไม่ถูกต้องหรือหมดอายุ
        console.error("Auth middleware error:", error.message);
        res.status(401).json({ message: 'Invalid or expired token.' });
    }
};