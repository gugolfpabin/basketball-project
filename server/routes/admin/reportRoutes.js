const express = require('express');
const router = express.Router();
const reportController = require('../../controllers/admin/reportController');
const verifyToken = require('../../middleware/authMiddleware');

// GET /api/admin/reports/sales
router.get('/sales', verifyToken, reportController.getSalesReport);

module.exports = router;