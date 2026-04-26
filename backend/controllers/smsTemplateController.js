const db = require('../db');

// Get all SMS templates
exports.getAllTemplates = async (req, res) => {
    try {
        const { active_only } = req.query;

        let query = 'SELECT * FROM sms_templates';
        if (active_only === 'true') {
            query += ' WHERE is_active = TRUE';
        }
        query += ' ORDER BY template_name';

        const templates = await db.query(query);
        res.json(templates);
    } catch (error) {
        console.error('Error fetching templates:', error);
        res.status(500).json({ message: 'Failed to fetch templates' });
    }
};

// Get template by key
exports.getTemplateByKey = async (req, res) => {
    try {
        const { key } = req.params;

        const [template] = await db.query(
            'SELECT * FROM sms_templates WHERE template_key = ?',
            [key]
        );

        if (!template.length) {
            return res.status(404).json({ message: 'Template not found' });
        }

        res.json(template[0]);
    } catch (error) {
        console.error('Error fetching template:', error);
        res.status(500).json({ message: 'Failed to fetch template' });
    }
};

// Create template
exports.createTemplate = async (req, res) => {
    try {
        const { template_key, template_name, message_rw, message_en, message_fr, is_active } = req.body;

        if (!template_key || !template_name || !message_rw) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const result = await db.query(
            `INSERT INTO sms_templates (template_key, template_name, message_rw, message_en, message_fr, is_active, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [template_key, template_name, message_rw, message_en || null, message_fr || null, is_active !== false, req.user?.id || null]
        );

        res.status(201).json({ message: 'Template created', id: result.insertId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Template key already exists' });
        }
        console.error('Error creating template:', error);
        res.status(500).json({ message: 'Failed to create template' });
    }
};

// Update template
exports.updateTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const { template_name, message_rw, message_en, message_fr, is_active } = req.body;

        await db.query(
            `UPDATE sms_templates SET template_name = ?, message_rw = ?, message_en = ?, message_fr = ?, is_active = ?, updated_by = ?
             WHERE id = ?`,
            [template_name, message_rw, message_en, message_fr, is_active, req.user?.id || null, id]
        );

        res.json({ message: 'Template updated' });
    } catch (error) {
        console.error('Error updating template:', error);
        res.status(500).json({ message: 'Failed to update template' });
    }
};

// Delete template
exports.deleteTemplate = async (req, res) => {
    try {
        const { id } = req.params;

        await db.query('DELETE FROM sms_templates WHERE id = ?', [id]);

        res.json({ message: 'Template deleted' });
    } catch (error) {
        console.error('Error deleting template:', error);
        res.status(500).json({ message: 'Failed to delete template' });
    }
};

// Generate message from template
exports.generateMessage = async (templateKey, data, language = 'rw') => {
    try {
        const [template] = await db.query(
            'SELECT * FROM sms_templates WHERE template_key = ? AND is_active = TRUE',
            [templateKey]
        );

        if (!template.length) {
            return null;
        }

        let message = template[0][`message_${language}`] || template[0].message_rw;

        // Replace placeholders with data
        for (const [key, value] of Object.entries(data)) {
            message = message.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
        }

        return message;
    } catch (error) {
        console.error('Error generating message:', error);
        return null;
    }
};
