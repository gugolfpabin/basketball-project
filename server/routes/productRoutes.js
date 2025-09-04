//server/routes/productRoutes.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController'); 
const uploadController = require('../controllers/uploadController');

    
router.get('/products', productController.getAllProducts);
router.get('/products/:id', productController.getOneProduct);
router.post('/products', productController.createProduct);

router.delete('/products/:productId/variants/:variantId', productController.deleteProductVariant);
router.put('/products/:productId', productController.updateProduct);


module.exports = router;
    