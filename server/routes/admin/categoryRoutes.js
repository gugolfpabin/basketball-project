const express = require('express');
const router = express.Router();
const categoryController = require('../../controllers/admin/categoryController');
const verifyToken = require('../../middleware/authMiddleware');

// GET /api/admin/categories
router.get('/categories', verifyToken, categoryController.getAllCategories);

module.exports = router;