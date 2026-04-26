const db = require('../db');
const smsService = require('../utils/smsService');

// Helper to send SMS - uses centralized smsService
async function sendSMS(phone, message) {
    try {
        const result = await smsService.sendSMS(phone, message);
        return result;
    } catch (e) {
        console.error('SMS error:', e.message);
        return { success: false, error: e.message };
    }
}

// Replace template variables with actual data
function fillTemplate(template, data) {
    let filled = template;
    Object.keys(data).forEach(key => {
        filled = filled.replace(new RegExp(`{{${key}}}`, 'g'), data[key] || '');
    });
    return filled;
}

// ==================== DEBTOR MANAGEMENT ====================

// Get all debtors with parent information
exports.getDebtorsWithParents = async (req, res) => {
    try {
        const { min_balance, trade, level } = req.query;

        let query = `
            SELECT 
                s.id as student_id,
                s.first_name as student_first_name,
                s.last_name as student_last_name,
                s.reg_number,
                s.trade,
                s.level,
                s.guardian_name,
                s.guardian_phone,
                COALESCE(SUM(f.amount), 0) as total_fee,
                COALESCE((SELECT SUM(amount_paid) FROM payments WHERE student_id = s.id), 0) as total_paid,
                (COALESCE(SUM(f.amount), 0) - COALESCE((SELECT SUM(amount_paid) FROM payments WHERE student_id = s.id), 0)) as balance,
                (SELECT MAX(payment_date) FROM payments WHERE student_id = s.id) as last_payment_date,
                (SELECT COUNT(*) FROM payments WHERE student_id = s.id) as payment_count,
                psl.parent_id,
                u.first_name as parent_first_name,
                u.last_name as parent_last_name,
                u.phone as parent_phone,
                u.email as parent_email
            FROM students s
            LEFT JOIN fees f ON f.is_active = 1
            LEFT JOIN parent_student_links psl ON psl.student_id = s.id AND psl.link_status = 'approved'
            LEFT JOIN users u ON psl.parent_id = u.id
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

        query += ' GROUP BY s.id, psl.parent_id';

        if (min_balance) {
            query += ' HAVING balance >= ?';
            params.push(min_balance);
        } else {
            query += ' HAVING balance > 0';
        }

        query += ' ORDER BY balance DESC';

        const [debtors] = await db.execute(query, params);

        // Filter out debtors without valid phone numbers
        const validDebtors = debtors.filter(d => d.parent_phone || d.guardian_phone);

        res.status(200).json(validDebtors);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ==================== MANUAL REMINDERS ====================

// Send manual reminder to a parent
exports.sendManualReminder = async (req, res) => {
    try {
        const { student_id, parent_id, message, custom_message } = req.body;
        const created_by = req.user.id;

        if (!student_id) {
            return res.status(400).json({ message: 'Student ID is required' });
        }

        // Get student and parent info
        let query = `
            SELECT s.*, 
                   u.id as parent_id, u.phone as parent_phone, u.first_name as parent_first_name, u.last_name as parent_last_name,
                   COALESCE(SUM(f.amount), 0) as total_fee,
                   (SELECT COALESCE(SUM(amount_paid), 0) FROM payments WHERE student_id = s.id) as total_paid
            FROM students s
            LEFT JOIN parent_student_links psl ON psl.student_id = s.id AND psl.link_status = 'approved'
            LEFT JOIN users u ON psl.parent_id = u.id
            LEFT JOIN fees f ON f.is_active = 1
            WHERE s.id = ?
            GROUP BY s.id, u.id
        `;

        const [results] = await db.execute(query, [student_id]);

        if (results.length === 0) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // If specific parent requested, filter results
        let debtors = results;
        if (parent_id) {
            debtors = results.filter(r => r.parent_id === parseInt(parent_id));
        }

        if (debtors.length === 0) {
            return res.status(404).json({ message: 'No parent linked to this student' });
        }

        // Get default template if not provided
        let templateMsg = custom_message;
        if (!templateMsg) {
            const [templates] = await db.execute(
                "SELECT template_content FROM payment_reminder_templates WHERE template_name = 'Balance Reminder' AND is_active = 1 LIMIT 1"
            );
            if (templates.length > 0) {
                templateMsg = templates[0].template_content;
            } else {
                templateMsg = "Muraho mwiriwe, umwana {{student_name}} afite ikibanza ya {{balance}} RWF. Mwakifashishamo kwishyura vuba. Murakoze!";
            }
        }

        let sent = 0;
        let failed = 0;
        const resultsList = [];

        for (const debtor of debtors) {
            const balance = debtor.total_fee - debtor.total_paid;
            const phone = debtor.parent_phone || debtor.guardian_phone;

            if (!phone) {
                failed++;
                continue;
            }

            // Fill template with actual data
            const finalMessage = message || fillTemplate(templateMsg, {
                student_name: `${debtor.first_name} ${debtor.last_name}`,
                reg_number: debtor.reg_number,
                balance: balance.toLocaleString(),
                trade: debtor.trade,
                level: debtor.level,
                parent_name: debtor.parent_first_name || ''
            });

            // Send SMS
            const smsResult = await sendSMS(phone, finalMessage);

            // Record in payment_reminders table
            await db.execute(
                `INSERT INTO payment_reminders (student_id, parent_id, reminder_type, message_content, amount_due, balance_at_time, sms_status, sent_via, africas_talking_id, sent_at, created_by)
                 VALUES (?, ?, 'manual', ?, ?, ?, ?, ?, ?, NOW(), ?)`,
                [
                    student_id,
                    debtor.parent_id,
                    finalMessage,
                    debtor.total_fee,
                    balance,
                    smsResult.success ? 'sent' : 'failed',
                    'africa_talking',
                    smsResult.data?.SMSMessageData?.Recipients?.[0]?.messageId || null,
                    created_by
                ]
            );

            // Also save to parent_notifications for parent dashboard
            if (debtor.parent_id) {
                try {
                    await db.execute(
                        'INSERT INTO parent_notifications (parent_id, message, notification_type) VALUES (?, ?, ?)',
                        [debtor.parent_id, finalMessage, 'payment_reminder']
                    );
                } catch (notifErr) {
                    console.error('Failed to save notification:', notifErr.message);
                }
            }

            // Also save to sms_logs
            try {
                await db.execute(
                    'INSERT INTO sms_logs (phone, message, status, recipient_id, sent_by) VALUES (?, ?, ?, ?, ?)',
                    [phone, finalMessage, smsResult.success ? 'sent' : 'failed', debtor.parent_id, created_by]
                );
            } catch (smsLogErr) {
                console.error('Failed to log SMS:', smsLogErr.message);
            }

            if (smsResult.success) {
                sent++;
                resultsList.push({ parent: `${debtor.parent_first_name} ${debtor.parent_last_name}`, phone, status: 'sent' });
            } else {
                failed++;
                resultsList.push({ parent: `${debtor.parent_first_name} ${debtor.parent_last_name}`, phone, status: 'failed', error: smsResult.error });
            }
        }

        // Update statistics
        const today = new Date().toISOString().split('T')[0];
        await db.execute(
            `INSERT INTO reminder_statistics (date, total_reminders_sent, successful_deliveries, failed_deliveries)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE 
                total_reminders_sent = total_reminders_sent + ?,
                successful_deliveries = successful_deliveries + ?,
                failed_deliveries = failed_deliveries + ?`,
            [today, sent + failed, sent, failed, sent + failed, sent, failed]
        );

        res.status(200).json({
            message: `Reminders sent: ${sent} successful, ${failed} failed`,
            sent,
            failed,
            results: resultsList
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Send bulk reminders to multiple debtors
exports.sendBulkReminders = async (req, res) => {
    try {
        const { student_ids, message, custom_message, exclude_zero_balance } = req.body;
        const created_by = req.user.id;

        if (!student_ids || student_ids.length === 0) {
            return res.status(400).json({ message: 'At least one student ID is required' });
        }

        // Get template message
        let templateMsg = custom_message;
        if (!templateMsg) {
            const [templates] = await db.execute(
                "SELECT template_content FROM payment_reminder_templates WHERE template_name = 'Balance Reminder' AND is_active = 1 LIMIT 1"
            );
            if (templates.length > 0) {
                templateMsg = templates[0].template_content;
            } else {
                templateMsg = "Muraho mwiriwe, umwana {{student_name}} afite ikibanza ya {{balance}} RWF. Mwakifashishamo kwishyura vuba. Murakoze!";
            }
        }

        const debtors = await getDebtorsForIds(student_ids, exclude_zero_balance);

        let sent = 0;
        let failed = 0;
        let skipped = 0;
        const resultsList = [];

        for (const debtor of debtors) {
            const balance = debtor.total_fee - debtor.total_paid;
            const phone = debtor.parent_phone || debtor.guardian_phone;

            if (!phone) {
                skipped++;
                continue;
            }

            // Fill template
            const finalMessage = message || fillTemplate(templateMsg, {
                student_name: `${debtor.student_first_name} ${debtor.student_last_name}`,
                reg_number: debtor.reg_number,
                balance: balance.toLocaleString(),
                trade: debtor.trade,
                level: debtor.level,
                parent_name: debtor.parent_first_name || ''
            });

            // Send SMS
            const smsResult = await sendSMS(phone, finalMessage);

            // Record
            await db.execute(
                `INSERT INTO payment_reminders (student_id, parent_id, reminder_type, message_content, amount_due, balance_at_time, sms_status, sent_via, africas_talking_id, sent_at, created_by)
                 VALUES (?, ?, 'bulk', ?, ?, ?, ?, ?, ?, NOW(), ?)`,
                [
                    debtor.student_id,
                    debtor.parent_id,
                    finalMessage,
                    debtor.total_fee,
                    balance,
                    smsResult.success ? 'sent' : 'failed',
                    'africa_talking',
                    smsResult.data?.SMSMessageData?.Recipients?.[0]?.messageId || null,
                    created_by
                ]
            );

            // Also save to parent_notifications for parent dashboard
            if (debtor.parent_id) {
                try {
                    await db.execute(
                        'INSERT INTO parent_notifications (parent_id, message, notification_type) VALUES (?, ?, ?)',
                        [debtor.parent_id, finalMessage, 'payment_reminder']
                    );
                } catch (notifErr) {
                    console.error('Failed to save notification:', notifErr.message);
                }
            }

            // Also save to sms_logs
            try {
                await db.execute(
                    'INSERT INTO sms_logs (phone, message, status, recipient_id, sent_by) VALUES (?, ?, ?, ?, ?)',
                    [phone, finalMessage, smsResult.success ? 'sent' : 'failed', debtor.parent_id, created_by]
                );
            } catch (smsLogErr) {
                console.error('Failed to log SMS:', smsLogErr.message);
            }

            if (smsResult.success) {
                sent++;
                resultsList.push({ student: `${debtor.student_first_name} ${debtor.student_last_name}`, phone, status: 'sent' });
            } else {
                failed++;
                resultsList.push({ student: `${debtor.student_first_name} ${debtor.student_last_name}`, phone, status: 'failed' });
            }
        }

        // Update statistics
        const today = new Date().toISOString().split('T')[0];
        await db.execute(
            `INSERT INTO reminder_statistics (date, total_reminders_sent, successful_deliveries, failed_deliveries)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE 
                total_reminders_sent = total_reminders_sent + ?,
                successful_deliveries = successful_deliveries + ?,
                failed_deliveries = failed_deliveries + ?`,
            [today, sent + failed, sent, failed, sent + failed, sent, failed]
        );

        res.status(200).json({
            message: `Bulk reminders completed: ${sent} sent, ${failed} failed, ${skipped} skipped`,
            sent,
            failed,
            skipped,
            results: resultsList
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Remind all debtors
exports.remindAllDebtors = async (req, res) => {
    try {
        const { message, custom_message, min_balance } = req.body;
        const created_by = req.user.id;

        // Get all debtors
        const [debtors] = await db.execute(`
            SELECT 
                s.id as student_id,
                s.first_name as student_first_name,
                s.last_name as student_last_name,
                s.reg_number,
                s.trade,
                s.level,
                s.guardian_name,
                s.guardian_phone,
                COALESCE(SUM(f.amount), 0) as total_fee,
                (SELECT COALESCE(SUM(amount_paid), 0) FROM payments WHERE student_id = s.id) as total_paid,
                psl.parent_id,
                u.first_name as parent_first_name,
                u.last_name as parent_last_name,
                u.phone as parent_phone
            FROM students s
            LEFT JOIN fees f ON f.is_active = 1
            LEFT JOIN parent_student_links psl ON psl.student_id = s.id AND psl.link_status = 'approved'
            LEFT JOIN users u ON psl.parent_id = u.id
            WHERE s.current_status = 'active'
            GROUP BY s.id
            HAVING (COALESCE(SUM(f.amount), 0) - (SELECT COALESCE(SUM(amount_paid), 0) FROM payments WHERE student_id = s.id)) > 0
            ${min_balance ? `AND (COALESCE(SUM(f.amount), 0) - (SELECT COALESCE(SUM(amount_paid), 0) FROM payments WHERE student_id = s.id)) >= ${min_balance}` : ''}
            ORDER BY (COALESCE(SUM(f.amount), 0) - (SELECT COALESCE(SUM(amount_paid), 0) FROM payments WHERE student_id = s.id)) DESC
        `);

        // Get template
        let templateMsg = custom_message;
        if (!templateMsg) {
            const [templates] = await db.execute(
                "SELECT template_content FROM payment_reminder_templates WHERE template_name = 'Balance Reminder' AND is_active = 1 LIMIT 1"
            );
            if (templates.length > 0) {
                templateMsg = templates[0].template_content;
            } else {
                templateMsg = "Muraho mwiriwe, umwana {{student_name}} afite ikibanza ya {{balance}} RWF. Mwakifashishamo kwishyura vuba. Murakoze!";
            }
        }

        let sent = 0;
        let failed = 0;
        let skipped = 0;
        const resultsList = [];

        for (const debtor of debtors) {
            const balance = debtor.total_fee - debtor.total_paid;
            const phone = debtor.parent_phone || debtor.guardian_phone;

            if (!phone) {
                skipped++;
                continue;
            }

            const finalMessage = message || fillTemplate(templateMsg, {
                student_name: `${debtor.student_first_name} ${debtor.student_last_name}`,
                reg_number: debtor.reg_number,
                balance: balance.toLocaleString(),
                trade: debtor.trade,
                level: debtor.level,
                parent_name: debtor.parent_first_name || ''
            });

            const smsResult = await sendSMS(phone, finalMessage);

            await db.execute(
                `INSERT INTO payment_reminders (student_id, parent_id, reminder_type, message_content, amount_due, balance_at_time, sms_status, sent_via, africas_talking_id, sent_at, created_by)
                 VALUES (?, ?, 'bulk', ?, ?, ?, ?, ?, ?, NOW(), ?)`,
                [
                    debtor.student_id,
                    debtor.parent_id,
                    finalMessage,
                    debtor.total_fee,
                    balance,
                    smsResult.success ? 'sent' : 'failed',
                    'africa_talking',
                    smsResult.data?.SMSMessageData?.Recipients?.[0]?.messageId || null,
                    created_by
                ]
            );

            // Also save to parent_notifications for parent dashboard
            if (debtor.parent_id) {
                try {
                    await db.execute(
                        'INSERT INTO parent_notifications (parent_id, message, notification_type) VALUES (?, ?, ?)',
                        [debtor.parent_id, finalMessage, 'payment_reminder']
                    );
                } catch (notifErr) {
                    console.error('Failed to save notification:', notifErr.message);
                }
            }

            // Also save to sms_logs
            try {
                await db.execute(
                    'INSERT INTO sms_logs (phone, message, status, recipient_id, sent_by) VALUES (?, ?, ?, ?, ?)',
                    [phone, finalMessage, smsResult.success ? 'sent' : 'failed', debtor.parent_id, created_by]
                );
            } catch (smsLogErr) {
                console.error('Failed to log SMS:', smsLogErr.message);
            }

            if (smsResult.success) {
                sent++;
                resultsList.push({ student: `${debtor.student_first_name} ${debtor.student_last_name}`, phone, status: 'sent' });
            } else {
                failed++;
            }
        }

        // Update statistics
        const today = new Date().toISOString().split('T')[0];
        await db.execute(
            `INSERT INTO reminder_statistics (date, total_reminders_sent, successful_deliveries, failed_deliveries, parents_reminded, students_with_debtors)
             VALUES (?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE 
                total_reminders_sent = total_reminders_sent + ?,
                successful_deliveries = successful_deliveries + ?,
                failed_deliveries = failed_deliveries + ?,
                parents_reminded = parents_reminded + ?,
                students_with_debtors = students_with_debtors + ?`,
            [today, sent, sent, failed, sent, debtors.length - skipped, sent, sent, failed, sent, debtors.length - skipped]
        );

        res.status(200).json({
            message: `All debtors reminded: ${sent} sent, ${failed} failed, ${skipped} no phone`,
            sent,
            failed,
            skipped,
            total_debtors: debtors.length
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Helper function to get debtors for specific IDs
async function getDebtorsForIds(studentIds, excludeZeroBalance = true) {
    const placeholders = studentIds.map(() => '?').join(',');
    const query = `
        SELECT 
            s.id as student_id,
            s.first_name as student_first_name,
            s.last_name as student_last_name,
            s.reg_number,
            s.trade,
            s.level,
            s.guardian_name,
            s.guardian_phone,
            COALESCE(SUM(f.amount), 0) as total_fee,
            (SELECT COALESCE(SUM(amount_paid), 0) FROM payments WHERE student_id = s.id) as total_paid,
            psl.parent_id,
            u.first_name as parent_first_name,
            u.last_name as parent_last_name,
            u.phone as parent_phone
        FROM students s
        LEFT JOIN fees f ON f.is_active = 1
        LEFT JOIN parent_student_links psl ON psl.student_id = s.id AND psl.link_status = 'approved'
        LEFT JOIN users u ON psl.parent_id = u.id
        WHERE s.id IN (${placeholders})
        GROUP BY s.id, psl.parent_id
    `;

    const [results] = await db.execute(query, studentIds);

    if (excludeZeroBalance) {
        return results.filter(r => (r.total_fee - r.total_paid) > 0);
    }
    return results;
}

// ==================== AUTO-REMINDER SETTINGS ====================

// Get auto-reminder settings
exports.getAutoReminderSettings = async (req, res) => {
    try {
        const [settings] = await db.execute('SELECT * FROM auto_reminder_settings ORDER BY id DESC LIMIT 1');

        if (settings.length === 0) {
            // Return default settings
            return res.status(200).json({
                is_enabled: false,
                reminder_type: 'weekly',
                schedule_day: 'monday',
                schedule_time: '08:00:00',
                min_balance_threshold: 0,
                message_template: 'Muraho mwiriwe, umwana {{student_name}} afite ikibanza ya {{balance}} RWF. Mwakifashishamo kwishyura vuba. Murakoze!'
            });
        }

        res.status(200).json(settings[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update auto-reminder settings
exports.updateAutoReminderSettings = async (req, res) => {
    try {
        const {
            is_enabled,
            reminder_type,
            schedule_day,
            schedule_time,
            min_balance_threshold,
            exclude_paid_students,
            message_template,
            include_balance_details,
            include_student_info,
            send_to_primary_parent,
            send_to_all_parents
        } = req.body;

        const created_by = req.user.id;

        // Check if settings exist
        const [existing] = await db.execute('SELECT id FROM auto_reminder_settings LIMIT 1');

        if (existing.length > 0) {
            // Update existing
            await db.execute(`
                UPDATE auto_reminder_settings SET
                    is_enabled = ?,
                    reminder_type = ?,
                    schedule_day = ?,
                    schedule_time = ?,
                    min_balance_threshold = ?,
                    exclude_paid_students = ?,
                    message_template = ?,
                    include_balance_details = ?,
                    include_student_info = ?,
                    send_to_primary_parent = ?,
                    send_to_all_parents = ?,
                    updated_at = NOW()
                WHERE id = ?
            `, [
                is_enabled,
                reminder_type || 'weekly',
                schedule_day || 'monday',
                schedule_time || '08:00:00',
                min_balance_threshold || 0,
                exclude_paid_students !== false,
                message_template,
                include_balance_details !== false,
                include_student_info !== false,
                send_to_primary_parent !== false,
                send_to_all_parents || false,
                existing[0].id
            ]);
        } else {
            // Insert new
            await db.execute(`
                INSERT INTO auto_reminder_settings (
                    is_enabled, reminder_type, schedule_day, schedule_time,
                    min_balance_threshold, exclude_paid_students, message_template,
                    include_balance_details, include_student_info, send_to_primary_parent,
                    send_to_all_parents, created_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                is_enabled || false,
                reminder_type || 'weekly',
                schedule_day || 'monday',
                schedule_time || '08:00:00',
                min_balance_threshold || 0,
                exclude_paid_students !== false,
                message_template || 'Muraho mwiriwe, umwana {{student_name}} afite ikibanza ya {{balance}} RWF. Mwakifashishamo kwishyura vuba. Murakoze!',
                include_balance_details !== false,
                include_student_info !== false,
                send_to_primary_parent !== false,
                send_to_all_parents || false,
                created_by
            ]);
        }

        res.status(200).json({ message: 'Auto-reminder settings updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Trigger auto-reminder manually
exports.triggerAutoReminder = async (req, res) => {
    try {
        const created_by = req.user.id;

        // Get current settings
        const [settings] = await db.execute('SELECT * FROM auto_reminder_settings LIMIT 1');

        if (settings.length === 0 || !settings[0].is_enabled) {
            return res.status(400).json({ message: 'Auto-reminder is not enabled' });
        }

        const config = settings[0];

        // Get debtors
        let query = `
            SELECT 
                s.id as student_id,
                s.first_name as student_first_name,
                s.last_name as student_last_name,
                s.reg_number,
                s.trade,
                s.level,
                s.guardian_name,
                s.guardian_phone,
                COALESCE(SUM(f.amount), 0) as total_fee,
                (SELECT COALESCE(SUM(amount_paid), 0) FROM payments WHERE student_id = s.id) as total_paid,
                psl.parent_id,
                u.first_name as parent_first_name,
                u.last_name as parent_last_name,
                u.phone as parent_phone
            FROM students s
            LEFT JOIN fees f ON f.is_active = 1
            LEFT JOIN parent_student_links psl ON psl.student_id = s.id AND psl.link_status = 'approved'
            LEFT JOIN users u ON psl.parent_id = u.id
            WHERE s.current_status = 'active'
            GROUP BY s.id
            HAVING (COALESCE(SUM(f.amount), 0) - (SELECT COALESCE(SUM(amount_paid), 0) FROM payments WHERE student_id = s.id)) >= ?
        `;

        const [debtors] = await db.execute(query, [config.min_balance_threshold || 0]);

        let sent = 0;
        let failed = 0;
        let skipped = 0;

        for (const debtor of debtors) {
            const balance = debtor.total_fee - debtor.total_paid;
            const phone = debtor.parent_phone || debtor.guardian_phone;

            if (!phone) {
                skipped++;
                continue;
            }

            // Fill template
            const finalMessage = fillTemplate(config.message_template, {
                student_name: `${debtor.student_first_name} ${debtor.student_last_name}`,
                reg_number: debtor.reg_number,
                balance: balance.toLocaleString(),
                trade: debtor.trade,
                level: debtor.level,
                parent_name: debtor.parent_first_name || ''
            });

            const smsResult = await sendSMS(phone, finalMessage);

            await db.execute(
                `INSERT INTO payment_reminders (student_id, parent_id, reminder_type, message_content, amount_due, balance_at_time, sms_status, sent_via, africas_talking_id, sent_at, created_by)
                 VALUES (?, ?, 'auto', ?, ?, ?, ?, ?, ?, NOW(), ?)`,
                [
                    debtor.student_id,
                    debtor.parent_id,
                    finalMessage,
                    debtor.total_fee,
                    balance,
                    smsResult.success ? 'sent' : 'failed',
                    'africa_talking',
                    smsResult.data?.SMSMessageData?.Recipients?.[0]?.messageId || null,
                    created_by
                ]
            );

            if (smsResult.success) sent++;
            else failed++;
        }

        // Update last run time
        await db.execute('UPDATE auto_reminder_settings SET last_run_at = NOW() WHERE id = ?', [config.id]);

        // Update statistics
        const today = new Date().toISOString().split('T')[0];
        await db.execute(
            `INSERT INTO reminder_statistics (date, total_reminders_sent, successful_deliveries, failed_deliveries, parents_reminded, total_balance_notified)
             VALUES (?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE 
                total_reminders_sent = total_reminders_sent + ?,
                successful_deliveries = successful_deliveries + ?,
                failed_deliveries = failed_deliveries + ?,
                parents_reminded = parents_reminded + ?`,
            [today, sent, sent, failed, sent, sent, sent, failed, sent]
        );

        res.status(200).json({
            message: `Auto-reminder completed: ${sent} sent, ${failed} failed, ${skipped} skipped`,
            sent,
            failed,
            skipped
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ==================== REMINDER TEMPLATES ====================

// Get all reminder templates
exports.getReminderTemplates = async (req, res) => {
    try {
        const [templates] = await db.execute('SELECT * FROM payment_reminder_templates ORDER BY id DESC');
        res.status(200).json(templates);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Create reminder template
exports.createReminderTemplate = async (req, res) => {
    try {
        const { template_name, template_content, is_active } = req.body;
        const created_by = req.user.id;

        const [result] = await db.execute(
            'INSERT INTO payment_reminder_templates (template_name, template_content, is_active, created_by) VALUES (?, ?, ?, ?)',
            [template_name, template_content, is_active !== false, created_by]
        );

        res.status(201).json({ message: 'Template created', templateId: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update reminder template
exports.updateReminderTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const { template_name, template_content, is_active } = req.body;

        await db.execute(
            'UPDATE payment_reminder_templates SET template_name = ?, template_content = ?, is_active = ?, updated_at = NOW() WHERE id = ?',
            [template_name, template_content, is_active, id]
        );

        res.status(200).json({ message: 'Template updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete reminder template
exports.deleteReminderTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        await db.execute('DELETE FROM payment_reminder_templates WHERE id = ?', [id]);
        res.status(200).json({ message: 'Template deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ==================== REMINDER HISTORY ====================

// Get reminder history
exports.getReminderHistory = async (req, res) => {
    try {
        const { student_id, parent_id, reminder_type, start_date, end_date, limit = 50 } = req.query;

        let query = `
            SELECT pr.*, 
                   s.first_name as student_first_name, s.last_name as student_last_name, s.reg_number,
                   u.first_name as parent_first_name, u.last_name as parent_last_name, u.phone as parent_phone
            FROM payment_reminders pr
            LEFT JOIN students s ON pr.student_id = s.id
            LEFT JOIN users u ON pr.parent_id = u.id
            WHERE 1=1
        `;
        const params = [];

        if (student_id) {
            query += ' AND pr.student_id = ?';
            params.push(student_id);
        }
        if (parent_id) {
            query += ' AND pr.parent_id = ?';
            params.push(parent_id);
        }
        if (reminder_type) {
            query += ' AND pr.reminder_type = ?';
            params.push(reminder_type);
        }
        if (start_date) {
            query += ' AND DATE(pr.sent_at) >= ?';
            params.push(start_date);
        }
        if (end_date) {
            query += ' AND DATE(pr.sent_at) <= ?';
            params.push(end_date);
        }

        query += ' ORDER BY pr.sent_at DESC LIMIT ?';
        params.push(parseInt(limit));

        const [reminders] = await db.execute(query, params);
        res.status(200).json(reminders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ==================== REMINDER STATISTICS ====================

// Get reminder statistics
exports.getReminderStatistics = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        let query = 'SELECT * FROM reminder_statistics WHERE 1=1';
        const params = [];

        if (start_date) {
            query += ' AND date >= ?';
            params.push(start_date);
        }
        if (end_date) {
            query += ' AND date <= ?';
            params.push(end_date);
        }

        query += ' ORDER BY date DESC';

        const [stats] = await db.execute(query, params);

        // Get totals
        const [[totals]] = await db.execute(`
            SELECT 
                SUM(total_reminders_sent) as total_sent,
                SUM(successful_deliveries) as total_delivered,
                SUM(failed_deliveries) as total_failed,
                SUM(parents_reminded) as total_parents,
                SUM(total_balance_notified) as total_balance
            FROM reminder_statistics
        `);

        res.status(200).json({
            statistics: stats,
            totals: {
                total_sent: totals.total_sent || 0,
                total_delivered: totals.total_delivered || 0,
                total_failed: totals.total_failed || 0,
                total_parents: totals.total_parents || 0,
                total_balance: totals.total_balance || 0
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ==================== REMINDER EXCLUSIONS ====================

// Add reminder exclusion
exports.addExclusion = async (req, res) => {
    try {
        const { parent_id, student_id, reason } = req.body;
        const excluded_by = req.user.id;

        await db.execute(
            'INSERT INTO reminder_exclusions (parent_id, student_id, reason, excluded_by) VALUES (?, ?, ?, ?)',
            [parent_id, student_id || null, reason, excluded_by]
        );

        res.status(201).json({ message: 'Parent excluded from reminders' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Remove reminder exclusion
exports.removeExclusion = async (req, res) => {
    try {
        const { id } = req.params;
        await db.execute('DELETE FROM reminder_exclusions WHERE id = ?', [id]);
        res.status(200).json({ message: 'Exclusion removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get exclusions
exports.getExclusions = async (req, res) => {
    try {
        const [exclusions] = await db.execute(`
            SELECT re.*, 
                   u.first_name as parent_first_name, u.last_name as parent_last_name, u.phone as parent_phone,
                   s.first_name as student_first_name, s.last_name as student_last_name
            FROM reminder_exclusions re
            LEFT JOIN users u ON re.parent_id = u.id
            LEFT JOIN students s ON re.student_id = s.id
            ORDER BY re.excluded_at DESC
        `);
        res.status(200).json(exclusions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = exports;