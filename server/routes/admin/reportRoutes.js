const express = require('express');
const router = express.Router();
const reportController = require('../../controllers/admin/reportController');
const verifyToken = require('../../middleware/authMiddleware');

router.get('/sales', verifyToken, reportController.getSalesReport);

module.exports = router;