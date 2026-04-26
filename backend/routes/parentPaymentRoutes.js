const express = require('express');
const router = express.Router();
const { getFeesForParent, makePayment, getPaymentHistory, remindParentToPay, uploadReceipt, getAllPaymentsWithReceipts, verifyReceipt, getPendingReceiptsCount } = require('../controllers/parentPaymentController');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Staff roles that can access payment management
const staffRoles = ['admin', 'accountant'];

// All routes require parent role
router.get('/fees', verifyToken, verifyRole(['parent']), getFeesForParent);
router.post('/pay', verifyToken, verifyRole(['parent']), makePayment);
router.get('/history', verifyToken, verifyRole(['parent']), getPaymentHistory);

// Parent: Upload receipt for payment (with image)
router.post('/receipt', verifyToken, verifyRole(['parent']), upload.single('receipt'), uploadReceipt);

// Staff: Get all payments with receipts
router.get('/all', verifyToken, verifyRole(staffRoles), getAllPaymentsWithReceipts);

// Staff: Verify or reject receipt
router.put('/receipt/verify', verifyToken, verifyRole(staffRoles), verifyReceipt);

// Staff: Get pending receipts count
router.get('/pending-count', verifyToken, verifyRole(staffRoles), getPendingReceiptsCount);

// Admin, Accountant: Remind parents to pay
router.post('/remind', verifyToken, verifyRole(['admin', 'accountant']), remindParentToPay);

module.exports = router;
