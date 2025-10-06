//server/routes/productRoutes.js
const express = require('express');
const router = express.Router();
const productController = require('../../controllers/admin/productController');

const uploadController = require('../../controllers/admin/uploadController');


    
router.get('/products', productController.getAllProducts);
router.get('/products/:id', productController.getOneProduct);
router.post('/products', productController.createProduct);

// router.delete('/products/:productId/variants/:variantId', productController.deleteProductVariant);
router.put('/products/:productId', productController.updateProduct);
router.delete('/products/variants/:variantId', productController.deleteVariant)
router.delete('/products/:productId', productController.deleteProduct);
module.exports = router;
    