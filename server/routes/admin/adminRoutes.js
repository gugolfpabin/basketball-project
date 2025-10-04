// server/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../../controllers/admin/adminController');
const verifyToken = require('../../middleware/authMiddleware');
// อาจจะต้องสร้าง middleware ใหม่สำหรับเช็คว่าเป็น admin หรือไม่ (verifyAdmin)

// GET /api/admin/orders - ดึงออเดอร์ทั้งหมด
// ในอนาคตควรใส่ middleware เช็คว่าเป็น admin ด้วย เช่น verifyAdmin
router.get('/orders', verifyToken, adminController.getAllOrders);

module.exports = router;