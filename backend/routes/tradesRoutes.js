const express = require('express');
const router = express.Router();
const tradesController = require('../controllers/tradesController');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const tradeUploadDir = path.join(__dirname, '..', 'public', 'uploads', 'trade card image');
fs.mkdirSync(tradeUploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, tradeUploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname))
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 }, fileFilter: (req, file, cb) => file.mimetype.startsWith('image/') ? cb(null, true) : cb(new Error('Images only'), false) });

// Get all trades with levels
router.get('/', tradesController.getTrades);
// Get all unique levels
router.get('/levels', tradesController.getAllLevels);
// Get trade-level statistics
router.get('/stats', tradesController.getTradeLevelStats);
// Create trade - admin only
router.post('/', verifyToken, verifyRole(['admin']), upload.single('image'), tradesController.createTrade);
// Update trade - admin only
router.put('/:id', verifyToken, verifyRole(['admin']), upload.single('image'), tradesController.updateTrade);
// Delete trade - admin only
router.delete('/:id', verifyToken, verifyRole(['admin']), tradesController.deleteTrade);

module.exports = router;
