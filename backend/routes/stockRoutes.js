const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const stockController = require('../controllers/stockController');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

const staffRoles = ['admin', 'stock_manager', 'dod', 'accountant'];

// Image upload (modern stock cards)
const imgStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'public', 'uploads', 'stock')),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `stock-${Date.now()}-${Math.round(Math.random()*1e9)}${ext}`);
    }
});
const imgUpload = multer({
    storage: imgStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (/^image\/(jpe?g|png|webp|gif)$/.test(file.mimetype)) cb(null, true);
        else cb(new Error('Only image files (jpg, png, webp, gif) are allowed'));
    }
});

router.post('/upload-image',
    [verifyToken, verifyRole(staffRoles)],
    imgUpload.single('image'),
    (req, res) => {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
        res.status(201).json({
            message: 'Image uploaded',
            url: `/uploads/stock/${req.file.filename}`,
            filename: req.file.filename,
            size: req.file.size
        });
    }
);

// Stock Items CRUD
router.post('/', [verifyToken, verifyRole(staffRoles)], stockController.addItem);
router.get('/', [verifyToken, verifyRole(['admin', 'stock_manager', 'dod', 'accountant', 'parent'])], stockController.getItems);
router.get('/:id', [verifyToken, verifyRole(staffRoles)], stockController.getItemById);
router.put('/:id', [verifyToken, verifyRole(staffRoles)], stockController.updateItem);
router.delete('/:id', [verifyToken, verifyRole(['admin'])], stockController.deleteItem);

// Stock Transactions
router.post('/transactions', [verifyToken, verifyRole(staffRoles)], stockController.addTransaction);
router.get('/transactions', [verifyToken, verifyRole(staffRoles)], stockController.getTransactions);
router.get('/:id/transactions', [verifyToken, verifyRole(staffRoles)], stockController.getItemTransactions);

// Stock Reports
router.get('/reports/low-stock', [verifyToken, verifyRole(staffRoles)], stockController.getLowStockItems);
router.get('/reports/category/:category', [verifyToken, verifyRole(staffRoles)], stockController.getItemsByCategory);
router.get('/reports/summary', [verifyToken, verifyRole(['admin', 'stock_manager', 'dod', 'accountant'])], stockController.getStockSummary);

// Advanced Stock Features
router.get('/reports/valuation', [verifyToken, verifyRole(staffRoles)], stockController.getStockValuation);
router.get('/reports/suppliers', [verifyToken, verifyRole(staffRoles)], stockController.getSuppliersReport);
router.get('/reports/depleted', [verifyToken, verifyRole(staffRoles)], stockController.getDepletedItems);
router.get('/export', [verifyToken, verifyRole(staffRoles)], stockController.exportStock);
router.get('/search', [verifyToken, verifyRole(staffRoles)], stockController.searchStock);

// Barcode/QR code generation for items
router.get('/:id/barcode', [verifyToken, verifyRole(staffRoles)], stockController.generateBarcode);

module.exports = router;
