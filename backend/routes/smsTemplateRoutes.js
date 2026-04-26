const express = require('express');
const router = express.Router();
const smsTemplateController = require('../controllers/smsTemplateController');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

// Get all templates
router.get('/', verifyToken, smsTemplateController.getAllTemplates);

// Get template by key
router.get('/key/:key', verifyToken, smsTemplateController.getTemplateByKey);

// Create template (admin only)
router.post('/', verifyToken, verifyRole(['admin']), smsTemplateController.createTemplate);

// Update template (admin only)
router.put('/:id', verifyToken, verifyRole(['admin']), smsTemplateController.updateTemplate);

// Delete template (admin only)
router.delete('/:id', verifyToken, verifyRole(['admin']), smsTemplateController.deleteTemplate);

module.exports = router;
