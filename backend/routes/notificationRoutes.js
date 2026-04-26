const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');

// Get parent notifications
router.get('/', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'parent') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const [notifications] = await db.execute(
            'SELECT * FROM parent_notifications WHERE parent_id = ? ORDER BY created_at DESC LIMIT 50',
            [req.user.id]
        );

        // Get unread count
        const [[{ unread_count }]] = await db.execute(
            'SELECT COUNT(*) as unread_count FROM parent_notifications WHERE parent_id = ? AND is_read = FALSE',
            [req.user.id]
        );

        // Return as array for frontend compatibility
        res.json(notifications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching notifications' });
    }
});

// Mark notification as read
router.put('/:id/read', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'parent') {
            return res.status(403).json({ message: 'Access denied' });
        }

        await db.execute(
            'UPDATE parent_notifications SET is_read = TRUE WHERE id = ? AND parent_id = ?',
            [req.params.id, req.user.id]
        );

        res.json({ message: 'Marked as read' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating notification' });
    }
});

// Mark all as read
router.put('/read-all', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'parent') {
            return res.status(403).json({ message: 'Access denied' });
        }

        await db.execute(
            'UPDATE parent_notifications SET is_read = TRUE WHERE parent_id = ?',
            [req.user.id]
        );

        res.json({ message: 'All marked as read' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating notifications' });
    }
});

// Get SMS history
router.get('/sms-history', verifyToken, async (req, res) => {
    try {
        // Get SMS logs for this parent's phone
        const [logs] = await db.execute(
            `SELECT * FROM sms_logs WHERE phone = (SELECT phone FROM users WHERE id = ?) OR recipient_id = ? 
             ORDER BY created_at DESC LIMIT 50`,
            [req.user.id, req.user.id]
        );

        res.json(logs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching SMS history' });
    }
});

// Contact school (parent sends message)
router.post('/contact', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'parent') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { subject, message } = req.body;

        // Save the contact message
        await db.execute(
            'INSERT INTO parent_notifications (parent_id, message, notification_type, is_read) VALUES (?, ?, ?, TRUE)',
            [req.user.id, `📬 Parent Contact - ${subject}: ${message}`, 'parent_contact']
        );

        // Notify admin/staff about the contact
        const [admins] = await db.execute(
            "SELECT id FROM users WHERE role = 'admin'"
        );

        for (const admin of admins) {
            await db.execute(
                'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
                [admin.id, 'Parent Contact', `Parent ${req.user.name || req.user.email} sent: ${subject} - ${message}`, 'parent_contact']
            );
        }

        res.json({ message: 'Message sent to school successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error sending message' });
    }
});

module.exports = router;