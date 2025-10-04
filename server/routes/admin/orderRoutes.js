// server/routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const orderController = require('../../controllers/admin/orderController');
const verifyToken = require('../../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

const slipStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/slips'); // โฟลเดอร์สำหรับเก็บสลิป
    },
    filename: (req, file, cb) => {
        cb(null, `slip-${Date.now()}${path.extname(file.originalname)}`);
    }
});
const uploadSlip = multer({ storage: slipStorage });


// Route สำหรับสร้างออเดอร์และ QR Code แบบ Manual
router.post('/create-manual', verifyToken, orderController.createManualOrder);
router.post('/upload-slip/:orderId', verifyToken, uploadSlip.single('slipImage'), orderController.uploadSlip);
router.post('/cancel/:orderId', verifyToken, orderController.cancelOrder);

module.exports = router;