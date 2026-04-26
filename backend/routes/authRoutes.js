const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

// PUBLIC routes
router.post('/login', authController.login);
router.post('/register-parent', authController.registerParent);
router.get('/locations', authController.getLocations);

// Admin-only staff management
router.post('/users', [verifyToken, verifyRole(['admin'])], authController.createUser);
router.get('/users', [verifyToken, verifyRole(['admin'])], authController.getUsers);
router.put('/users/:id', [verifyToken, verifyRole(['admin'])], authController.updateUser);
router.delete('/users/:id', [verifyToken, verifyRole(['admin'])], authController.deleteUser);

// Staff profile update (any authenticated user)
router.put('/profile', verifyToken, authController.updateProfile);

module.exports = router;
