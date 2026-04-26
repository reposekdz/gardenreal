const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

router.get('/stats', verifyToken, verifyRole(['admin', 'dod', 'accountant', 'stock_manager', 'parent']), dashboardController.getStats);

module.exports = router;
