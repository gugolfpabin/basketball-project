const express = require('express');
const router = express.Router();

const mockCategories = [
  { id: 1, categoryName: 'เสื้อบาสเกตบอล' },
  { id: 2, categoryName: 'เสื้อ T-Shirt' },
  { id: 3, categoryName: 'กางเกงบาสเกตบอล' },
  { id: 4, categoryName: 'รองเท้าบาสเกตบอล' },
  { id: 5, categoryName: 'ถุงเท้า' },
];

router.get('/categories', (req, res) => {
  try {
    res.json(mockCategories);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;