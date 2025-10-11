const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const verifyToken = require('../middleware/authMiddleware');

router.post('/add', verifyToken, cartController.addToCart);
router.get('/', verifyToken, cartController.getCart);
router.post('/validate-stock', verifyToken, cartController.validateStock);
router.delete('/remove/:cartItemId', verifyToken, cartController.removeCartItem);
router.put('/update/:cartItemId', verifyToken, cartController.updateCartItem);

module.exports = router;