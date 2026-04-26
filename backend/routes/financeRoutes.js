const express = require('express');
const router = express.Router();
const financeController = require('../controllers/financeController');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

const financeRoles = ['admin', 'accountant'];
const viewRoles = [...financeRoles];

// Fee Management
router.post('/fees', [verifyToken, verifyRole(financeRoles)], financeController.createFee);
router.get('/fees', [verifyToken, verifyRole(viewRoles)], financeController.getFees);
router.get('/fees/:id', [verifyToken, verifyRole(viewRoles)], financeController.getFeeById);
router.get('/fees/current', [verifyToken, verifyRole(viewRoles)], financeController.getCurrentFee);
router.put('/fees/:id', [verifyToken, verifyRole(financeRoles)], financeController.updateFee);
router.delete('/fees/:id', [verifyToken, verifyRole(['admin', 'accountant'])], financeController.deleteFee);
router.delete('/fees', [verifyToken, verifyRole(['admin', 'accountant'])], financeController.deleteAllFees);

// Bulk Fee Management
router.get('/fees/trades-levels', [verifyToken], financeController.getTradesAndLevels);
router.post('/fees/bulk', [verifyToken, verifyRole(financeRoles)], financeController.bulkCreateFees);

// Payment Management
router.post('/payments', [verifyToken, verifyRole(financeRoles)], financeController.recordPayment);
router.get('/payments', [verifyToken, verifyRole(viewRoles)], financeController.getPayments);
router.get('/payments/:id', [verifyToken, verifyRole(viewRoles)], financeController.getPaymentById);
router.put('/payments/:id', [verifyToken, verifyRole(financeRoles)], financeController.updatePayment);
router.delete('/payments/:id', [verifyToken, verifyRole(['admin'])], financeController.deletePayment);

// Student Payment History
router.get('/student/:student_id/payments', [verifyToken, verifyRole(financeRoles)], financeController.getStudentPaymentHistory);

// Financial Reports
router.get('/reports/summary', [verifyToken, verifyRole(financeRoles)], financeController.getFinancialSummary);
router.get('/reports/dashboard', [verifyToken, verifyRole(financeRoles)], financeController.getFinanceDashboard);
router.get('/reports/debtors', [verifyToken, verifyRole(financeRoles)], financeController.getDebtors);
router.get('/reports/revenue', [verifyToken, verifyRole(financeRoles)], financeController.getRevenueByPeriod);
router.get('/reports/comprehensive', [verifyToken, verifyRole(financeRoles)], financeController.getComprehensiveReport);
router.get('/reports/expenses', [verifyToken, verifyRole(financeRoles)], financeController.getExpenseSummary);

// Export
router.get('/export', [verifyToken, verifyRole(financeRoles)], financeController.exportPayments);

// Invoice
router.get('/invoice/generate', [verifyToken, verifyRole(financeRoles)], financeController.generateInvoice);

// SMS Reminders
router.post('/remind', [verifyToken, verifyRole(financeRoles)], financeController.remindParent);
router.post('/remind/all', [verifyToken, verifyRole(financeRoles)], financeController.remindAllDebtors);

// Auto Remind SMS (new)
router.post('/remind/single', [verifyToken, verifyRole(financeRoles)], financeController.sendPaymentReminder);
router.post('/remind/broadcast', [verifyToken, verifyRole(financeRoles)], financeController.broadcastPaymentReminders);

// SMS Balance - All staff can view
router.get('/sms/balance', [verifyToken], financeController.getSMSBalance);

// Payment Status Filters
router.get('/students/status', [verifyToken, verifyRole(financeRoles)], financeController.getStudentsByPaymentStatus);

// Expense Tracking
router.post('/expenses', [verifyToken, verifyRole(financeRoles)], financeController.recordExpense);

module.exports = router;
