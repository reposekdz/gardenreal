const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');
const smsService = require('../utils/smsService');

// Helper function to send SMS via centralized smsService
async function sendSMS(phoneNumber, message) {
    try {
        const result = await smsService.sendSMS(phoneNumber, message);
        return result;
    } catch (e) {
        console.error('SMS error:', e.message);
        return { success: false, error: e.message };
    }
}

// Get all SMS reminders
router.get('/reminders', verifyToken, async (req, res) => {
    try {
        const db = getDb();
        const { status, parent_id, student_id } = req.query;

        let query = `
            SELECT sr.*, u.phone as parent_phone, u.first_name as parent_name,
                   s.first_name as student_name, s.last_name as student_lastname, s.reg_number
            FROM sms_reminders sr
            LEFT JOIN users u ON sr.parent_id = u.id
            LEFT JOIN students s ON sr.student_id = s.id
            WHERE 1=1
        `;
        const params = [];

        if (status) {
            query += ' AND sr.status = ?';
            params.push(status);
        }
        if (parent_id) {
            query += ' AND sr.parent_id = ?';
            params.push(parent_id);
        }
        if (student_id) {
            query += ' AND sr.student_id = ?';
            params.push(student_id);
        }

        query += ' ORDER BY sr.created_at DESC';

        const reminders = await db.query(query, params);
        res.json(reminders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Send single SMS reminder
router.post('/send', verifyToken, async (req, res) => {
    try {
        const { parent_id, phone, student_id, message, reminder_type, amount_due, due_date } = req.body;

        // Allow either parent_id OR phone
        if (!parent_id && !phone) {
            return res.status(400).json({ message: 'Parent ID or phone number is required' });
        }
        if (!message) {
            return res.status(400).json({ message: 'Message is required' });
        }

        const db = getDb();
        let phoneNumber = phone;

        // Get parent phone number if parent_id provided
        if (!phoneNumber && parent_id) {
            const [parent] = await db.query('SELECT phone FROM users WHERE id = ?', [parent_id]);
            if (!parent || !parent.phone) {
                return res.status(400).json({ message: 'Parent phone number not found' });
            }
            phoneNumber = parent.phone;
        }

        // Save reminder to database first
        const [result] = await db.query(
            `INSERT INTO sms_reminders (parent_id, student_id, reminder_type, message, amount_due, due_date, status, sent_at)
             VALUES (?, ?, ?, ?, ?, ?, 'sent', NOW())`,
            [parent_id, student_id || null, reminder_type || 'general', message, amount_due || null, due_date || null]
        );

        // Try to send SMS
        const smsResult = await sendSMS(phoneNumber, message);

        if (!smsResult.success) {
            // Update status to failed
            await db.query(
                'UPDATE sms_reminders SET status = ?, error_message = ? WHERE id = ?',
                ['failed', smsResult.error, result.insertId]
            );
            return res.status(500).json({ message: 'Failed to send SMS', error: smsResult.error });
        }

        // Update with Africa Talking ID
        await db.query(
            'UPDATE sms_reminders SET africas_talking_id = ?, status = ? WHERE id = ?',
            [smsResult.data?.SMSMessageData?.Recipients?.[0]?.messageId || 'sent', 'delivered', result.insertId]
        );

        res.json({ message: 'SMS sent successfully', id: result.insertId });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get cron jobs
router.get('/cron-jobs', verifyToken, async (req, res) => {
    try {
        const db = getDb();
        const jobs = await db.query('SELECT * FROM cron_jobs ORDER BY id');
        res.json(jobs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update cron job
router.put('/cron-jobs/:id', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const { is_active, config, schedule_time, schedule_day, schedule_type } = req.body;

        const db = getDb();
        await db.query(
            `UPDATE cron_jobs SET is_active = ?, config = ?, schedule_time = ?, schedule_day = ?, schedule_type = ? WHERE id = ?`,
            [is_active, JSON.stringify(config || {}), schedule_time, schedule_day, schedule_type, req.params.id]
        );

        res.json({ message: 'Cron job updated successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Trigger cron job manually
router.post('/cron-jobs/:id/run', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const db = getDb();

        // Get cron job details
        const [job] = await db.query('SELECT * FROM cron_jobs WHERE id = ?', [req.params.id]);

        if (!job) {
            return res.status(404).json({ message: 'Cron job not found' });
        }

        if (job.job_type === 'sms_reminder') {
            // Find parents with overdue fees
            const config = typeof job.config === 'string' ? JSON.parse(job.config) : job.config;

            const debtors = await db.query(`
                SELECT DISTINCT u.id as parent_id, u.phone, u.first_name, u.last_name,
                       s.id as student_id, s.first_name as student_name, s.last_name, s.trade, s.level,
                       SUM(f.amount) as total_fee, COALESCE(SUM(p.amount_paid), 0) as total_paid,
                       (SUM(f.amount) - COALESCE(SUM(p.amount_paid), 0)) as balance
                FROM fee_structures f
                JOIN students s ON s.trade = f.trade AND s.level = f.level AND s.current_status = 'active'
                LEFT JOIN parent_student_links psl ON psl.student_id = s.id AND psl.status = 'approved'
                LEFT JOIN users u ON u.id = psl.parent_id AND u.phone IS NOT NULL
                LEFT JOIN payments p ON p.student_id = s.id
                GROUP BY u.id, s.id
                HAVING balance > 0
            `);

            let sent = 0;
            let failed = 0;

            for (const debtor of debtors) {
                if (debtor.phone) {
                    const message = config?.message_template ||
                        `Dear parent, fees payment for ${debtor.student_name} is due. Balance: ${debtor.balance} RWF. Please pay to avoid interruption.`;

                    const smsResult = await sendSMS(debtor.phone, message);

                    await db.query(
                        `INSERT INTO sms_reminders (parent_id, student_id, reminder_type, message, amount_due, status, sent_at)
                         VALUES (?, ?, 'payment_reminder', ?, ?, 'sent', NOW())`,
                        [debtor.parent_id, debtor.student_id, message, debtor.balance]
                    );

                    if (smsResult.success) sent++;
                    else failed++;
                }
            }

            // Update cron job status
            await db.query(
                'UPDATE cron_jobs SET status = ?, last_run = NOW() WHERE id = ?',
                ['completed', req.params.id]
            );

            res.json({ message: `SMS reminders sent: ${sent} successful, ${failed} failed` });
        } else {
            res.status(400).json({ message: 'Cron job type not supported for manual run' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get SMS balance — unified to use the same enriched smsService used by /api/finance/sms/balance.
// Available to any signed-in staff (admin / dod / accountant / director / etc.) so they can see real airtime.
router.get('/balance', verifyToken, async (req, res) => {
    try {
        const smsService = require('../utils/smsService');
        const balance = await smsService.getSMSBalance();
        res.json(balance);
    } catch (err) {
        console.error('Balance check error:', err.message);
        res.status(500).json({
            success: false,
            balance: 'Error',
            balance_display: 'Unavailable',
            currency: 'RWF',
            mode: 'error',
            error: err.message
        });
    }
});

// Webhook for Africa Talking delivery reports
router.post('/webhook', async (req, res) => {
    try {
        const { status, phoneNumber, linkId } = req.body;

        if (linkId) {
            const db = getDb();
            await db.query(
                'UPDATE sms_reminders SET status = ? WHERE africas_talking_id = ?',
                [status === 'Success' ? 'delivered' : 'failed', linkId]
            );
        }

        res.json({ status: 'OK' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;

// SMS Balance endpoint
router.get('/balance', verifyToken, async (req, res) => {
    try {
        const smsService = require('../utils/smsService');
        const balance = await smsService.getSMSBalance();
        res.json(balance);
    } catch (error) {
        console.error('Error getting SMS balance:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get all parents with optional search
router.get('/parents', verifyToken, async (req, res) => {
    try {
        const db = getDb();
        const { search } = req.query;

        let query = `
            SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.created_at,
                   (SELECT COUNT(*) FROM parent_student_links WHERE parent_id = u.id AND status = 'approved') as linked_children
            FROM users u 
            WHERE u.role = 'parent'
        `;
        const params = [];

        if (search) {
            query += ' AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.phone LIKE ? OR u.email LIKE ?)';
            const searchPattern = `%${search}%`;
            params.push(searchPattern, searchPattern, searchPattern, searchPattern);
        }

        query += ' ORDER BY u.created_at DESC';

        const parents = await db.query(query, params);
        res.json(parents);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get students for discipline form (filtered by trade and level)
router.get('/students-for-discipline', verifyToken, async (req, res) => {
    try {
        const db = getDb();
        const { trade, level } = req.query;

        let query = `
            SELECT s.id, s.first_name, s.last_name, s.reg_number, s.trade, s.level, s.gender,
                   s.current_status
            FROM students s
            WHERE s.current_status = 'active'
        `;
        const params = [];

        if (trade && trade !== 'all') {
            query += ' AND s.trade = ?';
            params.push(trade);
        }

        if (level && level !== 'all') {
            query += ' AND s.level = ?';
            params.push(level);
        }

        query += ' ORDER BY s.trade, s.level, s.first_name';

        const students = await db.query(query, params);
        res.json(students);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Broadcast SMS to all parents — supports trade/level/gender cohort filters
router.post('/broadcast', verifyToken, async (req, res) => {
    try {
        if (!['admin', 'dod', 'accountant', 'director'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { message, trade_filter, level_filter, gender_filter } = req.body;

        if (!message) {
            return res.status(400).json({ message: 'Message is required' });
        }

        const db = getDb();

        // Build parent query based on filters
        let parentQuery = `
            SELECT DISTINCT u.id as parent_id, u.phone, u.first_name as parent_first, u.last_name as parent_last
            FROM users u
            LEFT JOIN parent_student_links psl ON psl.parent_id = u.id AND (psl.status = 'approved' OR psl.link_status = 'approved')
            LEFT JOIN students s ON s.id = psl.student_id
            WHERE u.role = 'parent' AND u.phone IS NOT NULL AND u.phone != ''
        `;
        const parentParams = [];

        if (trade_filter && trade_filter !== 'all') {
            parentQuery += ' AND s.trade = ?';
            parentParams.push(trade_filter);
        }

        if (level_filter && level_filter !== 'all') {
            parentQuery += ' AND s.level = ?';
            parentParams.push(level_filter);
        }

        if (gender_filter && gender_filter !== 'all') {
            parentQuery += ' AND s.gender = ?';
            parentParams.push(gender_filter);
        }

        const parents = await db.query(parentQuery, parentParams);

        if (parents.length === 0) {
            return res.status(404).json({ message: 'No parents found with the specified criteria' });
        }

        let sent = 0;
        let failed = 0;
        const results = [];

        for (const parent of parents) {
            if (parent.phone) {
                const smsResult = await sendSMS(parent.phone, message);

                // Save to database
                await db.query(
                    `INSERT INTO sms_reminders (parent_id, reminder_type, message, status, sent_at)
                     VALUES (?, 'broadcast', ?, ?, NOW())`,
                    [parent.id, message, smsResult.success ? 'sent' : 'failed']
                );

                if (smsResult.success) sent++;
                else failed++;

                results.push({
                    parent: `${parent.parent_first} ${parent.parent_last}`,
                    phone: parent.phone,
                    status: smsResult.success ? 'sent' : 'failed'
                });
            }
        }

        res.json({
            message: `Broadcast completed: ${sent} sent, ${failed} failed`,
            total: parents.length,
            sent,
            failed,
            results
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get all unique trades and levels for filters
router.get('/filters-data', verifyToken, async (req, res) => {
    try {
        const db = getDb();

        const trades = await db.query('SELECT DISTINCT trade FROM students WHERE trade IS NOT NULL ORDER BY trade');
        const levels = await db.query('SELECT DISTINCT level FROM students WHERE level IS NOT NULL ORDER BY level');

        res.json({
            trades: trades.map(t => t.trade),
            levels: levels.map(l => l.level)
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
