const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');
const smsService = require('../utils/smsService');
const bus = require('../utils/realtimeBus');

const STAFF_ROLES = ['admin', 'director', 'dod', 'teacher', 'accountant', 'registrar', 'hod'];

// Ensure tables exist (idempotent)
async function ensureTables() {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS parent_message_threads (
            id INT AUTO_INCREMENT PRIMARY KEY,
            parent_id INT NOT NULL,
            student_id INT DEFAULT NULL,
            subject VARCHAR(255) NOT NULL,
            category VARCHAR(50) DEFAULT 'general',
            status ENUM('open', 'closed') DEFAULT 'open',
            last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            unread_by_parent INT DEFAULT 0,
            unread_by_staff INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_parent (parent_id),
            INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    await db.execute(`
        CREATE TABLE IF NOT EXISTS parent_messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            thread_id INT NOT NULL,
            sender_role ENUM('parent', 'staff') NOT NULL,
            sender_id INT NOT NULL,
            body TEXT NOT NULL,
            attachment_url VARCHAR(500) DEFAULT NULL,
            sms_sent TINYINT(1) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_thread (thread_id),
            FOREIGN KEY (thread_id) REFERENCES parent_message_threads(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
}
ensureTables().catch(e => console.error('parent_messages tables init:', e.message));

// ─── PARENT ROUTES ────────────────────────────────────────────────────────────

// Parent: list MY threads
router.get('/my-threads', verifyToken, verifyRole(['parent']), async (req, res) => {
    try {
        const [threads] = await db.execute(`
            SELECT t.*,
                   s.first_name AS student_first, s.last_name AS student_last, s.reg_number,
                   (SELECT body FROM parent_messages WHERE thread_id = t.id ORDER BY created_at DESC LIMIT 1) AS last_body,
                   (SELECT sender_role FROM parent_messages WHERE thread_id = t.id ORDER BY created_at DESC LIMIT 1) AS last_sender_role
            FROM parent_message_threads t
            LEFT JOIN students s ON t.student_id = s.id
            WHERE t.parent_id = ?
            ORDER BY t.last_message_at DESC
        `, [req.user.id]);
        res.json(threads);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Parent: open a thread (returns messages and marks read)
router.get('/threads/:id', verifyToken, async (req, res) => {
    try {
        const [tRows] = await db.execute(
            'SELECT * FROM parent_message_threads WHERE id = ?',
            [req.params.id]
        );
        if (tRows.length === 0) return res.status(404).json({ message: 'Nta butumwa bubonetse' });
        const thread = tRows[0];

        const isParent = req.user.role === 'parent' && thread.parent_id === req.user.id;
        const isStaff = STAFF_ROLES.includes(req.user.role);
        if (!isParent && !isStaff) return res.status(403).json({ message: 'Ntibyemewe' });

        const [messages] = await db.execute(`
            SELECT m.*,
                   u.first_name AS sender_first, u.last_name AS sender_last, u.role AS sender_user_role
            FROM parent_messages m
            LEFT JOIN users u ON m.sender_id = u.id
            WHERE m.thread_id = ?
            ORDER BY m.created_at ASC
        `, [req.params.id]);

        // Mark as read for the requester side
        if (isParent) {
            await db.execute('UPDATE parent_message_threads SET unread_by_parent = 0 WHERE id = ?', [req.params.id]);
        } else if (isStaff) {
            await db.execute('UPDATE parent_message_threads SET unread_by_staff = 0 WHERE id = ?', [req.params.id]);
        }

        res.json({ thread, messages });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Parent: create new thread
router.post('/threads', verifyToken, verifyRole(['parent']), async (req, res) => {
    try {
        const { subject, body, category, student_id } = req.body;
        if (!subject || !body) return res.status(400).json({ message: 'Andika umutwe n\'ubutumwa' });

        // Validate student_id belongs to this parent (if provided)
        let validStudentId = null;
        if (student_id) {
            const [linkRows] = await db.execute(
                `SELECT id FROM parent_student_links
                 WHERE parent_id = ? AND student_id = ? AND status IN ('approved', 'linked') LIMIT 1`,
                [req.user.id, student_id]
            );
            if (linkRows.length > 0) validStudentId = student_id;
        }

        const [tResult] = await db.execute(
            `INSERT INTO parent_message_threads (parent_id, student_id, subject, category, unread_by_staff)
             VALUES (?, ?, ?, ?, 1)`,
            [req.user.id, validStudentId, subject, category || 'general']
        );
        const threadId = tResult.insertId;

        await db.execute(
            'INSERT INTO parent_messages (thread_id, sender_role, sender_id, body) VALUES (?, ?, ?, ?)',
            [threadId, 'parent', req.user.id, body]
        );

        res.status(201).json({ message: 'Ubutumwa bwoherejwe', thread_id: threadId });
    } catch (err) {
        console.error('create thread error:', err);
        res.status(500).json({ message: err.message });
    }
});

// Parent OR Staff: reply to a thread
router.post('/threads/:id/reply', verifyToken, async (req, res) => {
    try {
        const { body, send_sms } = req.body;
        if (!body || !body.trim()) return res.status(400).json({ message: 'Andika ubutumwa' });

        const [tRows] = await db.execute(
            'SELECT * FROM parent_message_threads WHERE id = ?',
            [req.params.id]
        );
        if (tRows.length === 0) return res.status(404).json({ message: 'Thread not found' });
        const thread = tRows[0];

        const isParent = req.user.role === 'parent' && thread.parent_id === req.user.id;
        const isStaff = STAFF_ROLES.includes(req.user.role);
        if (!isParent && !isStaff) return res.status(403).json({ message: 'Ntibyemewe' });
        if (thread.status === 'closed') return res.status(400).json({ message: 'Iki giciro cyarafunzwe' });

        const senderRole = isParent ? 'parent' : 'staff';
        let smsSent = 0;

        // If staff replies and chooses to also SMS the parent → send via Africa's Talking
        if (isStaff && send_sms) {
            try {
                const [pRows] = await db.execute('SELECT phone, first_name FROM users WHERE id = ?', [thread.parent_id]);
                if (pRows.length > 0 && pRows[0].phone) {
                    const fallback = `[Garden TVET] Igisubizo ku "${thread.subject}": ${body.substring(0, 140)}${body.length > 140 ? '…' : ''}`;
                    await smsService.sendSMS(pRows[0].phone, fallback);
                    smsSent = 1;
                }
            } catch (smsErr) {
                console.error('reply SMS failed:', smsErr.message);
            }
        }

        const [insertResult] = await db.execute(
            'INSERT INTO parent_messages (thread_id, sender_role, sender_id, body, sms_sent) VALUES (?, ?, ?, ?, ?)',
            [req.params.id, senderRole, req.user.id, body, smsSent]
        );

        // Bump thread + flip unread counters for the other side
        if (isParent) {
            await db.execute(
                'UPDATE parent_message_threads SET last_message_at = NOW(), unread_by_staff = unread_by_staff + 1 WHERE id = ?',
                [req.params.id]
            );
            // Push to all staff
            try {
                bus.broadcastStaff('parent_message', {
                    thread_id: Number(req.params.id),
                    subject: thread.subject,
                    body: body.substring(0, 200),
                    parent_id: thread.parent_id,
                    created_at: new Date().toISOString()
                });
            } catch {}
        } else {
            await db.execute(
                'UPDATE parent_message_threads SET last_message_at = NOW(), unread_by_parent = unread_by_parent + 1 WHERE id = ?',
                [req.params.id]
            );
            // Persist to parent_notifications and push to parent in real time
            try {
                await db.execute(
                    `INSERT INTO parent_notifications (parent_id, title, message, notification_type, is_read)
                     VALUES (?, ?, ?, 'general', 0)`,
                    [
                        thread.parent_id,
                        `Igisubizo ku "${thread.subject}"`,
                        body.substring(0, 240)
                    ]
                );
            } catch (e) { /* table may not exist on older DBs */ }
            try {
                bus.publish(`parent:${thread.parent_id}`, 'message_reply', {
                    thread_id: Number(req.params.id),
                    message_id: insertResult.insertId,
                    subject: thread.subject,
                    body: body.substring(0, 240),
                    sms_sent: !!smsSent,
                    created_at: new Date().toISOString()
                });
            } catch {}
        }

        res.json({ message: 'Igisubizo cyoherejwe', sms_sent: smsSent, message_id: insertResult.insertId });
    } catch (err) {
        console.error('reply error:', err);
        res.status(500).json({ message: err.message });
    }
});

// Parent or staff: close a thread
router.put('/threads/:id/close', verifyToken, async (req, res) => {
    try {
        const [tRows] = await db.execute('SELECT parent_id FROM parent_message_threads WHERE id = ?', [req.params.id]);
        if (tRows.length === 0) return res.status(404).json({ message: 'Not found' });
        const isOwner = req.user.role === 'parent' && tRows[0].parent_id === req.user.id;
        const isStaff = STAFF_ROLES.includes(req.user.role);
        if (!isOwner && !isStaff) return res.status(403).json({ message: 'Ntibyemewe' });

        await db.execute("UPDATE parent_message_threads SET status = 'closed' WHERE id = ?", [req.params.id]);
        res.json({ message: 'Iki giciro cyafunzwe' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─── STAFF ROUTES ─────────────────────────────────────────────────────────────

// Staff: list ALL threads
router.get('/admin/threads', verifyToken, verifyRole(STAFF_ROLES), async (req, res) => {
    try {
        const { status } = req.query;
        let sql = `
            SELECT t.*,
                   p.first_name AS parent_first, p.last_name AS parent_last, p.phone AS parent_phone,
                   s.first_name AS student_first, s.last_name AS student_last, s.reg_number,
                   (SELECT body FROM parent_messages WHERE thread_id = t.id ORDER BY created_at DESC LIMIT 1) AS last_body,
                   (SELECT sender_role FROM parent_messages WHERE thread_id = t.id ORDER BY created_at DESC LIMIT 1) AS last_sender_role,
                   (SELECT COUNT(*) FROM parent_messages WHERE thread_id = t.id) AS message_count
            FROM parent_message_threads t
            LEFT JOIN users p ON t.parent_id = p.id
            LEFT JOIN students s ON t.student_id = s.id
        `;
        const params = [];
        if (status) {
            sql += ' WHERE t.status = ?';
            params.push(status);
        }
        sql += ' ORDER BY t.unread_by_staff DESC, t.last_message_at DESC';

        const [threads] = await db.execute(sql, params);
        res.json(threads);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Staff: counters for navigation
router.get('/admin/counts', verifyToken, verifyRole(STAFF_ROLES), async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT
                COUNT(*) AS total_threads,
                SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) AS open_threads,
                SUM(CASE WHEN unread_by_staff > 0 THEN 1 ELSE 0 END) AS unread_threads,
                COALESCE(SUM(unread_by_staff), 0) AS total_unread_messages
            FROM parent_message_threads
        `);
        res.json(rows[0] || {});
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Parent: counters
router.get('/my-counts', verifyToken, verifyRole(['parent']), async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT
                COUNT(*) AS total_threads,
                COALESCE(SUM(unread_by_parent), 0) AS total_unread
            FROM parent_message_threads
            WHERE parent_id = ?
        `, [req.user.id]);
        res.json(rows[0] || {});
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
