// สมมติว่านี่คือไฟล์ routes/categoryRoutes.js ของคุณ

const express = require('express');
const router = express.Router();

// ข้อมูลหมวดหมู่จำลอง (ในการใช้งานจริงต้องดึงจากฐานข้อมูล)
const mockCategories = [
  { id: 1, categoryName: 'เสื้อบาสเกตบอล' },
  { id: 2, categoryName: 'เสื้อ T-Shirt' },
  { id: 3, categoryName: 'กางเกงบาสเกตบอล' },
  { id: 4, categoryName: 'รองเท้าบาสเกตบอล' },
  { id: 5, categoryName: 'ถุงเท้า' },
];

// สร้าง GET route สำหรับ /api/categories
router.get('/categories', (req, res) => {
  try {
    res.json(mockCategories);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;