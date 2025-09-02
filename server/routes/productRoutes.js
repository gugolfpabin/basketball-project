const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController'); 

    
router.get('/products', productController.getAllProducts);
router.get('/products/:id', productController.getOneProduct);
router.post('/products', productController.createProduct);

router.delete('/products/:productId/variants/:variantId', productController.deleteProductVariant);
router.put('/products/:productId/variants/:variantId', productController.updateProductVariant);

module.exports = router;
    