const express = require('express');
const router = express.Router();
const adminOrderController = require('../../controllers/admin/adminOrderController');
const orderController = require('../../controllers/orderController')
const verifyToken = require('../../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

const slipStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/slips');
    },
    filename: (req, file, cb) => {
        cb(null, `slip-${Date.now()}${path.extname(file.originalname)}`);
    }
});
const uploadSlip = multer({ storage: slipStorage });


router.post('/create-manual', verifyToken, orderController.createManualOrder);
router.post('/upload-slip/:orderId', verifyToken, uploadSlip.single('slipImage'), orderController.uploadSlip);
router.post('/cancel/:orderId', verifyToken, orderController.cancelOrder);
router.get('/my-history', verifyToken, orderController.getOrderHistory);
router.post('/delete-pending/:orderId', verifyToken, orderController.deletePendingOrder);

router.get('/', verifyToken, adminOrderController.getAllOrders);

router.get('/:orderId', verifyToken, adminOrderController.getOrderById);
router.put('/:orderId/status', verifyToken, adminOrderController.updateOrderStatus);


module.exports = router;