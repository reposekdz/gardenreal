const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');

// Get all notifications for current user
router.get('/', verifyToken, async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        const { type, priority, is_read, page = 1, limit = 20 } = req.query;

        let query = 'SELECT * FROM notifications WHERE user_id = ?';
        const params = [userId];

        if (type) {
            query += ' AND notification_type = ?';
            params.push(type);
        }

        if (priority) {
            query += ' AND priority = ?';
            params.push(priority);
        }

        if (is_read !== undefined) {
            query += ' AND is_read = ?';
            params.push(is_read === 'true' ? 1 : 0);
        }

        // Get total count
        let countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
        const [[{ total }]] = await db.execute(countQuery, params);

        // Add pagination
        const offset = (page - 1) * limit;
        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        const notifications = await db.execute(query, params);

        // Get unread count
        const [[{ unread_count }]] = await db.execute(
            'SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = ? AND is_read = FALSE',
            [userId]
        );

        // Get unread by priority
        const unreadByPriority = await db.execute(
            `SELECT priority, COUNT(*) as count FROM notifications 
             WHERE user_id = ? AND is_read = FALSE GROUP BY priority`,
            [userId]
        );

        res.json({
            notifications: notifications[0] || [],
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            },
            unread_count,
            unread_by_priority: unreadByPriority[0] || []
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching notifications' });
    }
});

// Get notification stats
router.get('/stats', verifyToken, async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;

        const [[{ total }]] = await db.execute(
            'SELECT COUNT(*) as total FROM notifications WHERE user_id = ?',
            [userId]
        );

        const [[{ unread_count }]] = await db.execute(
            'SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = ? AND is_read = FALSE',
            [userId]
        );

        const [[{ unread_urgent }]] = await db.execute(
            'SELECT COUNT(*) as unread_urgent FROM notifications WHERE user_id = ? AND is_read = FALSE AND priority = "urgent"',
            [userId]
        );

        // Get notifications by type
        const byType = await db.execute(
            `SELECT notification_type, COUNT(*) as count FROM notifications 
             WHERE user_id = ? GROUP BY notification_type ORDER BY count DESC`,
            [userId]
        );

        // Get notifications by date (last 7 days)
        const byDate = await db.execute(
            `SELECT DATE(created_at) as date, COUNT(*) as count FROM notifications 
             WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
             GROUP BY DATE(created_at) ORDER BY date DESC`,
            [userId]
        );

        res.json({
            total,
            unread_count,
            unread_urgent,
            by_type: byType[0] || [],
            by_date: byDate[0] || []
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching notification stats' });
    }
});

// Get unread count
router.get('/unread-count', verifyToken, async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;

        const [[{ unread_count }]] = await db.execute(
            'SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = ? AND is_read = FALSE',
            [userId]
        );

        const [[{ unread_urgent }]] = await db.execute(
            'SELECT COUNT(*) as unread_urgent FROM notifications WHERE user_id = ? AND is_read = FALSE AND priority = "urgent"',
            [userId]
        );

        res.json({ unread_count, unread_urgent });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching unread count' });
    }
});

// Mark single notification as read
router.put('/:id/read', verifyToken, async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;

        await db.execute(
            'UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE id = ? AND user_id = ?',
            [req.params.id, userId]
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
        const userId = req.user.userId || req.user.id;

        await db.execute(
            'UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE user_id = ?',
            [userId]
        );

        res.json({ message: 'All marked as read' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating notifications' });
    }
});

// Delete single notification
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;

        await db.execute(
            'DELETE FROM notifications WHERE id = ? AND user_id = ?',
            [req.params.id, userId]
        );

        res.json({ message: 'Notification deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting notification' });
    }
});

// Delete all read notifications
router.delete('/clear-read', verifyToken, async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;

        await db.execute(
            'DELETE FROM notifications WHERE user_id = ? AND is_read = TRUE',
            [userId]
        );

        res.json({ message: 'Read notifications cleared' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error clearing notifications' });
    }
});

// Get notification settings
router.get('/settings', verifyToken, async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;

        let [settings] = await db.execute(
            'SELECT * FROM notification_settings WHERE user_id = ?',
            [userId]
        );

        if (settings.length === 0) {
            // Create default settings
            const [result] = await db.execute(
                'INSERT INTO notification_settings (user_id) VALUES (?)',
                [userId]
            );
            settings = [{ id: result.insertId, user_id: userId, sms_notifications: true }];
        }

        res.json(settings[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching settings' });
    }
});

// Update notification settings
router.put('/settings', verifyToken, async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        const {
            sms_notifications, email_notifications, push_notifications,
            notify_student_status, notify_grades, notify_payments,
            notify_discipline, notify_applications, notify_announcements,
            notify_staff_changes
        } = req.body;

        await db.execute(
            `INSERT INTO notification_settings (user_id, sms_notifications, email_notifications, push_notifications,
             notify_student_status, notify_grades, notify_payments, notify_discipline, 
             notify_applications, notify_announcements, notify_staff_changes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE 
             sms_notifications = VALUES(sms_notifications),
             email_notifications = VALUES(email_notifications),
             push_notifications = VALUES(push_notifications),
             notify_student_status = VALUES(notify_student_status),
             notify_grades = VALUES(notify_grades),
             notify_payments = VALUES(notify_payments),
             notify_discipline = VALUES(notify_discipline),
             notify_applications = VALUES(notify_applications),
             notify_announcements = VALUES(notify_announcements),
             notify_staff_changes = VALUES(notify_staff_changes)`,
            [userId, sms_notifications, email_notifications, push_notifications,
                notify_student_status, notify_grades, notify_payments,
                notify_discipline, notify_applications, notify_announcements,
                notify_staff_changes]
        );

        res.json({ message: 'Settings updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating settings' });
    }
});

// Admin: Get all notifications (for admin dashboard)
router.get('/all', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const { page = 1, limit = 50, type, user_id } = req.query;

        let query = 'SELECT n.*, u.first_name, u.last_name, u.role as user_role FROM notifications n LEFT JOIN users u ON n.user_id = u.id WHERE 1=1';
        const params = [];

        if (type) {
            query += ' AND n.notification_type = ?';
            params.push(type);
        }

        if (user_id) {
            query += ' AND n.user_id = ?';
            params.push(user_id);
        }

        // Get total count
        let countQuery = query.replace('SELECT n.*, u.first_name, u.last_name, u.role as user_role', 'SELECT COUNT(*) as total');
        const [[{ total }]] = await db.execute(countQuery, params);

        // Add pagination
        const offset = (page - 1) * limit;
        query += ' ORDER BY n.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        const notifications = await db.execute(query, params);

        res.json({
            notifications: notifications[0] || [],
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching notifications' });
    }
});

// Admin: Send announcement to all users
router.post('/announce', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const { title, message, priority, user_roles, trade_filter } = req.body;

        if (!title || !message) {
            return res.status(400).json({ message: 'Title and message required' });
        }

        // Get target users
        let userQuery = 'SELECT id FROM users WHERE 1=1';
        const userParams = [];

        if (user_roles && user_roles.length > 0) {
            userQuery += ' AND role IN (?)';
            userParams.push(user_roles.join(','));
        }

        const [users] = await db.execute(userQuery, userParams);

        let sent = 0;
        for (const user of users) {
            await db.execute(
                `INSERT INTO notifications (user_id, title, message, notification_type, priority, action_url, action_label)
                 VALUES (?, ?, ?, 'announcement', ?, '/announcements', 'View')`,
                [user.id, title, message, priority || 'normal']
            );
            sent++;
        }

        res.json({ message: `Announcement sent to ${sent} users`, sent });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error sending announcement' });
    }
});

module.exports = router;

// Get SMS history for current user
router.get('/sms-history', verifyToken, async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;

        // Get user's phone
        const [users] = await db.execute('SELECT phone FROM users WHERE id = ?', [userId]);
        const userPhone = users[0]?.phone;

        const [logs] = await db.execute(
            `SELECT * FROM sms_logs 
             WHERE phone = ? OR recipient_id = ? 
             ORDER BY created_at DESC LIMIT 50`,
            [userPhone, userId]
        );

        res.json(logs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching SMS history' });
    }
});
