const express = require('express');
const router = express.Router();
const paymentReminderController = require('../controllers/paymentReminderController');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

const staffRoles = ['admin', 'accountant'];

// ==================== DEBTORS ====================

// Get all debtors with parent information
router.get('/debtors', [verifyToken, verifyRole(staffRoles)], paymentReminderController.getDebtorsWithParents);

// ==================== MANUAL REMINDERS ====================

// Send manual reminder to a parent
router.post('/send', [verifyToken, verifyRole(staffRoles)], paymentReminderController.sendManualReminder);

// Send bulk reminders
router.post('/send-bulk', [verifyToken, verifyRole(staffRoles)], paymentReminderController.sendBulkReminders);

// Remind all debtors
router.post('/remind-all', [verifyToken, verifyRole(staffRoles)], paymentReminderController.remindAllDebtors);

// ==================== AUTO-REMINDER SETTINGS ====================

// Get auto-reminder settings
router.get('/auto-settings', [verifyToken, verifyRole(staffRoles)], paymentReminderController.getAutoReminderSettings);

// Update auto-reminder settings
router.put('/auto-settings', [verifyToken, verifyRole(staffRoles)], paymentReminderController.updateAutoReminderSettings);

// Trigger auto-reminder manually
router.post('/trigger-auto', [verifyToken, verifyRole(staffRoles)], paymentReminderController.triggerAutoReminder);

// ==================== REMINDER TEMPLATES ====================

// Get all templates
router.get('/templates', [verifyToken, verifyRole(staffRoles)], paymentReminderController.getReminderTemplates);

// Create template
router.post('/templates', [verifyToken, verifyRole(staffRoles)], paymentReminderController.createReminderTemplate);

// Update template
router.put('/templates/:id', [verifyToken, verifyRole(staffRoles)], paymentReminderController.updateReminderTemplate);

// Delete template
router.delete('/templates/:id', [verifyToken, verifyRole(staffRoles)], paymentReminderController.deleteReminderTemplate);

// ==================== REMINDER HISTORY ====================

// Get reminder history
router.get('/history', [verifyToken, verifyRole(staffRoles)], paymentReminderController.getReminderHistory);

// ==================== REMINDER STATISTICS ====================

// Get statistics
router.get('/statistics', [verifyToken, verifyRole(staffRoles)], paymentReminderController.getReminderStatistics);

// ==================== EXCLUSIONS ====================

// Add exclusion
router.post('/exclusions', [verifyToken, verifyRole(staffRoles)], paymentReminderController.addExclusion);

// Remove exclusion
router.delete('/exclusions/:id', [verifyToken, verifyRole(staffRoles)], paymentReminderController.removeExclusion);

// Get exclusions
router.get('/exclusions', [verifyToken, verifyRole(staffRoles)], paymentReminderController.getExclusions);

module.exports = router;