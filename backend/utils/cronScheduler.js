const cron = require('node-cron');
const db = require('../db');
const smsService = require('./smsService');

// Internal helper that mirrors paymentReminderController.triggerAutoReminder but
// without HTTP req/res (so we can call it from a scheduler).
async function runAutoReminder(triggerType = 'auto') {
    try {
        const [settingsRows] = await db.execute(
            'SELECT * FROM auto_reminder_settings ORDER BY id DESC LIMIT 1'
        );
        if (settingsRows.length === 0 || !settingsRows[0].is_enabled) {
            return { skipped: true, reason: 'auto reminders disabled' };
        }
        const settings = settingsRows[0];
        const minBalance = settings.min_balance_threshold || 0;
        const template =
            settings.message_template ||
            'Muraho, umwana {{student_name}} afite ikibanza ya {{balance}} RWF. Mwakifashishamo kwishyura vuba. Murakoze!';

        const [debtors] = await db.execute(`
            SELECT
                s.id   AS student_id,
                s.first_name AS student_first_name,
                s.last_name  AS student_last_name,
                s.reg_number, s.trade, s.level, s.guardian_phone,
                COALESCE(SUM(f.amount), 0) AS total_fee,
                (SELECT COALESCE(SUM(amount_paid),0) FROM payments WHERE student_id = s.id) AS total_paid,
                psl.parent_id,
                u.first_name AS parent_first_name,
                u.last_name  AS parent_last_name,
                u.phone      AS parent_phone
            FROM students s
            LEFT JOIN fees f ON f.is_active = 1
            LEFT JOIN parent_student_links psl ON psl.student_id = s.id AND psl.link_status = 'approved'
            LEFT JOIN users u ON psl.parent_id = u.id
            WHERE s.current_status = 'active'
            GROUP BY s.id, psl.parent_id
            HAVING (COALESCE(SUM(f.amount),0) - (SELECT COALESCE(SUM(amount_paid),0) FROM payments WHERE student_id = s.id)) >= ?
            ORDER BY (COALESCE(SUM(f.amount),0) - (SELECT COALESCE(SUM(amount_paid),0) FROM payments WHERE student_id = s.id)) DESC
        `, [minBalance]);

        let sent = 0, failed = 0, skipped = 0;
        for (const d of debtors) {
            const balance = (d.total_fee || 0) - (d.total_paid || 0);
            if (balance <= 0) { skipped++; continue; }
            const phone = d.parent_phone || d.guardian_phone;
            if (!phone) { skipped++; continue; }

            const msg = template
                .replace(/\{\{student_name\}\}/g, `${d.student_first_name} ${d.student_last_name}`)
                .replace(/\{\{reg_number\}\}/g, d.reg_number || '')
                .replace(/\{\{balance\}\}/g, Number(balance).toLocaleString())
                .replace(/\{\{trade\}\}/g, d.trade || '')
                .replace(/\{\{level\}\}/g, d.level || '')
                .replace(/\{\{parent_name\}\}/g, d.parent_first_name || '');

            const r = await smsService.sendSMS(phone, msg);

            try {
                await db.execute(
                    `INSERT INTO payment_reminders
                       (student_id, parent_id, reminder_type, message_content, amount_due, balance_at_time, sms_status, sent_via, sent_at)
                     VALUES (?, ?, 'auto', ?, ?, ?, ?, 'africa_talking', NOW())`,
                    [d.student_id, d.parent_id, msg, d.total_fee, balance, r.success ? 'sent' : 'failed']
                );
            } catch (_) {}

            if (r.success) sent++; else failed++;
        }

        const today = new Date().toISOString().split('T')[0];
        try {
            await db.execute(
                `INSERT INTO reminder_statistics
                   (date, total_reminders_sent, successful_deliveries, failed_deliveries)
                 VALUES (?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                    total_reminders_sent  = total_reminders_sent  + ?,
                    successful_deliveries = successful_deliveries + ?,
                    failed_deliveries     = failed_deliveries     + ?`,
                [today, sent + failed, sent, failed, sent + failed, sent, failed]
            );
        } catch (_) {}

        try {
            await db.execute(
                'UPDATE auto_reminder_settings SET last_run_at = NOW() WHERE id = ?',
                [settings.id]
            );
        } catch (_) {}

        console.log(`[cron:auto-reminder] ${triggerType} — sent=${sent} failed=${failed} skipped=${skipped} of ${debtors.length}`);
        return { sent, failed, skipped, total: debtors.length };
    } catch (err) {
        console.error('[cron:auto-reminder] error:', err.message);
        return { error: err.message };
    }
}

// Public: notify staff (admin + stock_manager) that an item is low/depleted.
async function notifyStockManagersLowStock(item) {
    try {
        const [staff] = await db.execute(
            "SELECT id, phone, first_name FROM users WHERE role IN ('admin','stock_manager') AND phone IS NOT NULL AND phone <> ''"
        );
        if (!staff.length) return { skipped: true };
        const verb = item.status === 'depleted' ? 'YASHIZE' : 'IRI HASI';
        const msg = `[Garden TVET] Stock ${verb}: "${item.item_name}" (${item.category||'item'}) — ${item.quantity}${item.unit?(' '+item.unit):''} (min ${item.min_quantity}). Subiramo cyangwa ushyiremo.`;
        let sent = 0;
        for (const u of staff) {
            const r = await smsService.sendSMS(u.phone, msg);
            if (r.success) sent++;
            try {
                await db.execute(
                    'INSERT INTO sms_logs (phone, message, status, recipient_id) VALUES (?,?,?,?)',
                    [u.phone, msg, r.success ? 'sent' : 'failed', u.id]
                );
            } catch (_) {}
        }
        return { sent, total: staff.length };
    } catch (err) {
        console.error('[stock-low-sms] error:', err.message);
        return { error: err.message };
    }
}

// Boot the cron jobs. Reads settings every hour and decides whether to run today.
function startCronJobs() {
    // Run hourly; honor schedule_time + reminder_type from auto_reminder_settings.
    cron.schedule('0 * * * *', async () => {
        try {
            const [rows] = await db.execute(
                'SELECT * FROM auto_reminder_settings ORDER BY id DESC LIMIT 1'
            );
            if (!rows.length || !rows[0].is_enabled) return;
            const s = rows[0];
            const now = new Date();
            const hour = now.getHours();
            const wantHour = parseInt(String(s.schedule_time || '08:00').split(':')[0], 10);
            if (hour !== wantHour) return;

            const dayName = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
            const dayNum = now.getDate();
            const type = (s.reminder_type || 'weekly').toLowerCase();

            let due = false;
            if (type === 'daily') due = true;
            else if (type === 'weekly') due = (s.schedule_day || 'monday').toLowerCase() === dayName;
            else if (type === 'monthly') due = dayNum === parseInt(s.schedule_day || '1', 10);

            // Avoid double-run within the same hour
            if (s.last_run_at) {
                const last = new Date(s.last_run_at);
                if (now - last < 55 * 60 * 1000) return;
            }
            if (due) await runAutoReminder('cron');
        } catch (err) {
            console.error('[cron] tick error:', err.message);
        }
    });
    console.log('⏰ Cron scheduler started (auto payment reminders, hourly tick)');
}

module.exports = { startCronJobs, runAutoReminder, notifyStockManagersLowStock };
