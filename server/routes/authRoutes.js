const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', authController.registerUser);
router.post('/login', authController.loginUser);

router.get('/profile', authMiddleware, authController.getUserProfile);
router.put('/profile', authMiddleware, authController.updateUserProfile);
router.put('/change-password', authMiddleware, authController.changePassword);

module.exports = router;
