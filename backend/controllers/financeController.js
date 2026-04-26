const db = require('../db');
const smsService = require('../utils/smsService');

// Helper to send SMS and save notification - uses smsService
const sendSMS = async (phone, message, recipientId = null) => {
    try {
        // Use the centralized smsService
        const result = await smsService.sendSMS(phone, message);

        // Log SMS to database
        await db.execute(
            'INSERT INTO sms_logs (phone, message, status, recipient_id) VALUES (?, ?, ?, ?)',
            [phone, message, result.success ? 'sent' : 'failed', recipientId]
        );

        // Save notification for parent if recipientId provided
        if (recipientId) {
            await db.execute(
                'INSERT INTO parent_notifications (parent_id, message, notification_type) VALUES (?, ?, ?)',
                [recipientId, message, 'payment_reminder']
            );
        }
    } catch (e) {
        console.error('SMS error:', e.message);
        try {
            await db.execute(
                'INSERT INTO sms_logs (phone, message, status, recipient_id) VALUES (?, ?, ?, ?)',
                [phone, message, 'failed', recipientId]
            );
        } catch (logErr) { console.error('SMS log error:', logErr.message); }
    }
};

// ==================== SMS BALANCE ====================

// Get SMS balance from Africa's Talking
exports.getSMSBalance = async (req, res) => {
    try {
        const balance = await smsService.getSMSBalance();

        // Also get SMS usage stats from database
        const [stats] = await db.execute(`
            SELECT 
                COUNT(*) as total_sms,
                SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
            FROM sms_logs
        `);

        res.json({
            ...balance,
            stats: stats[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ==================== FEE MANAGEMENT ====================

// Get all trades and levels for bulk fee setting (REAL - from trades table + students)
exports.getTradesAndLevels = async (req, res) => {
    try {
        const [tradeRows] = await db.query('SELECT id, name, levels FROM trades ORDER BY name ASC');

        // Also union with any unique trade/level pairs from students table
        let studentLevels = [];
        try {
            const [rows] = await db.query('SELECT DISTINCT trade, level FROM students WHERE trade IS NOT NULL AND level IS NOT NULL');
            studentLevels = rows;
        } catch (_) { studentLevels = []; }

        const trades = tradeRows.map(t => {
            let levels = [];
            try {
                if (t.levels) {
                    const parsed = typeof t.levels === 'string' ? JSON.parse(t.levels) : t.levels;
                    if (Array.isArray(parsed)) levels = parsed;
                }
            } catch (_) { /* ignore */ }

            // Merge with student-derived levels for this trade
            studentLevels.filter(s => s.trade === t.name).forEach(s => {
                if (s.level && !levels.includes(s.level)) levels.push(s.level);
            });

            return { name: t.name, levels };
        });

        res.json({ trades });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Bulk create fees for all trades/levels with different fees for public/private
exports.bulkCreateFees = async (req, res) => {
    try {
        const {
            term,
            description,
            due_date,
            term_start_date,
            term_end_date,
            public_fee_amount,
            private_fee_amount,
            both_fee_amount,
            category, // 'public' | 'private' | 'both'
            trades,   // 'all' or single trade name OR array of trade names
            levels    // 'all' or array of level names
        } = req.body;

        const created_by = req.user.id;

        // Restrict to Term 1/2/3 only
        const termPart = String(term || '').split(' ')[0];
        if (!['Term', 'Trimester'].includes(termPart) && !['Term 1', 'Term 2', 'Term 3'].some(t => String(term).startsWith(t))) {
            return res.status(400).json({ message: 'Term must be Term 1, Term 2 or Term 3' });
        }
        const validTermPrefix = ['Term 1', 'Term 2', 'Term 3'];
        if (!validTermPrefix.some(p => String(term).startsWith(p))) {
            return res.status(400).json({ message: 'Term must be Term 1, Term 2 or Term 3' });
        }

        // Load real trades from DB
        const [tradeRows] = await db.query('SELECT name, levels FROM trades');
        const allTrades = tradeRows.map(t => {
            let lv = [];
            try { lv = typeof t.levels === 'string' ? JSON.parse(t.levels) : (t.levels || []); } catch (_) { lv = []; }
            return { name: t.name, levels: Array.isArray(lv) ? lv : [] };
        });

        // Also merge student-derived levels per trade
        try {
            const [studentLv] = await db.query('SELECT DISTINCT trade, level FROM students WHERE trade IS NOT NULL AND level IS NOT NULL');
            studentLv.forEach(s => {
                const t = allTrades.find(tr => tr.name === s.trade);
                if (t && !t.levels.includes(s.level)) t.levels.push(s.level);
            });
        } catch (_) { /* ignore */ }

        // Filter target trades
        let targetTrades = allTrades;
        if (trades && trades !== 'all') {
            const tradeList = Array.isArray(trades) ? trades : [trades];
            targetTrades = allTrades.filter(t => tradeList.includes(t.name));
        }

        if (targetTrades.length === 0) {
            return res.status(400).json({ message: 'No matching trades found. Add trades first.' });
        }

        let feesCreated = 0;
        const errors = [];
        const feeDescription = description || `Fees for ${term}`;

        for (const trade of targetTrades) {
            const targetLevels = (!levels || levels === 'all')
                ? trade.levels
                : trade.levels.filter(l => (Array.isArray(levels) ? levels : [levels]).includes(l));

            for (const level of targetLevels) {
                try {
                    if (category === 'both' && both_fee_amount) {
                        await db.execute(
                            `INSERT INTO fees (term, trade, level, amount, description, due_date, term_start_date, term_end_date, created_by, student_category)
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'both')`,
                            [term, trade.name, level, both_fee_amount, feeDescription, due_date || null, term_start_date || null, term_end_date || null, created_by]
                        );
                        feesCreated++;
                    } else if (category === 'public' && public_fee_amount) {
                        await db.execute(
                            `INSERT INTO fees (term, trade, level, amount, description, due_date, term_start_date, term_end_date, created_by, student_category)
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'public')`,
                            [term, trade.name, level, public_fee_amount, feeDescription, due_date || null, term_start_date || null, term_end_date || null, created_by]
                        );
                        feesCreated++;
                    } else if (category === 'private' && private_fee_amount) {
                        await db.execute(
                            `INSERT INTO fees (term, trade, level, amount, description, due_date, term_start_date, term_end_date, created_by, student_category)
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'private')`,
                            [term, trade.name, level, private_fee_amount, feeDescription, due_date || null, term_start_date || null, term_end_date || null, created_by]
                        );
                        feesCreated++;
                    } else if (public_fee_amount || private_fee_amount) {
                        // Create both rows when both prices provided without category=both
                        if (public_fee_amount) {
                            await db.execute(
                                `INSERT INTO fees (term, trade, level, amount, description, due_date, term_start_date, term_end_date, created_by, student_category)
                                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'public')`,
                                [term, trade.name, level, public_fee_amount, feeDescription, due_date || null, term_start_date || null, term_end_date || null, created_by]
                            );
                            feesCreated++;
                        }
                        if (private_fee_amount) {
                            await db.execute(
                                `INSERT INTO fees (term, trade, level, amount, description, due_date, term_start_date, term_end_date, created_by, student_category)
                                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'private')`,
                                [term, trade.name, level, private_fee_amount, feeDescription, due_date || null, term_start_date || null, term_end_date || null, created_by]
                            );
                            feesCreated++;
                        }
                    }
                } catch (err) {
                    errors.push(`${trade.name} - ${level}: ${err.message}`);
                }
            }
        }

        // Broadcast SMS to linked parents about the new fees
        let smsResult = { sent: 0, failed: 0, total: 0 };
        if (feesCreated > 0) {
            try {
                const dueText = due_date ? ` Inguzanyo: kwishyura mbere ya ${String(due_date).slice(0, 10)}.` : '';
                const periodText = term_start_date && term_end_date
                    ? ` ${term} (${String(term_start_date).slice(0, 10)} → ${String(term_end_date).slice(0, 10)})`
                    : ` ${term}`;

                if (!trades || trades === 'all') {
                    const msg = `Garden TVET: Imisanzu ya${periodText} yashyizweho. Reba portal y'ababyeyi kugira mubone amafaranga yose.${dueText} Murakoze!`;
                    smsResult = await smsService.broadcastToParents(msg);
                } else {
                    const tradeList = Array.isArray(trades) ? trades : [trades];
                    let totSent = 0, totFailed = 0, totTotal = 0;
                    for (const tName of tradeList) {
                        const msg = `Garden TVET: Imisanzu ya${periodText} ya ${tName} yashyizweho. Reba portal y'ababyeyi kugira mubone amafaranga.${dueText} Murakoze!`;
                        const r = await smsService.broadcastToParents(msg, tName);
                        totSent += r.sent || 0;
                        totFailed += r.failed || 0;
                        totTotal += r.total || 0;
                    }
                    smsResult = { sent: totSent, failed: totFailed, total: totTotal };
                }
            } catch (smsErr) {
                console.error('Bulk fee SMS broadcast failed:', smsErr.message);
            }
        }

        res.status(201).json({
            message: `Successfully created ${feesCreated} fee records${smsResult.sent ? ` and notified ${smsResult.sent} parents via SMS` : ''}`,
            feesCreated,
            sms: smsResult,
            errors: errors.length > 0 ? errors : null
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Create new fee structure
exports.createFee = async (req, res) => {
    try {
        const { term, trade, level, amount, description, due_date, student_category } = req.body;
        const created_by = req.user.id;

        const [result] = await db.execute(
            'INSERT INTO fees (term, trade, level, amount, description, due_date, created_by, student_category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [term, trade, level, amount, description || null, due_date || null, created_by, student_category || 'both']
        );

        res.status(201).json({ message: 'Fee structure added', feeId: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete all fees (accountant only)
exports.deleteAllFees = async (req, res) => {
    try {
        const { term, trade, confirm_delete } = req.body;

        if (!confirm_delete) {
            return res.status(400).json({ message: 'Please confirm deletion by setting confirm_delete to true' });
        }

        let query = 'DELETE FROM fees WHERE 1=1';
        const params = [];

        if (term && term !== 'all') {
            query += ' AND term = ?';
            params.push(term);
        }
        if (trade && trade !== 'all') {
            query += ' AND trade = ?';
            params.push(trade);
        }

        const [result] = await db.execute(query, params);

        res.status(200).json({
            message: `Successfully deleted ${result.affectedRows} fee records`,
            deletedCount: result.affectedRows
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all fees
exports.getFees = async (req, res) => {
    try {
        const [fees] = await db.execute('SELECT * FROM fees ORDER BY created_at DESC');
        res.status(200).json(fees);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get fee by ID
exports.getFeeById = async (req, res) => {
    try {
        const { id } = req.params;
        const [fees] = await db.execute('SELECT * FROM fees WHERE id = ?', [id]);
        if (fees.length === 0) {
            return res.status(404).json({ message: 'Fee not found' });
        }
        res.status(200).json(fees[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get current term fee for a trade and level
exports.getCurrentFee = async (req, res) => {
    try {
        const { trade, level, term, student_type } = req.query;
        let query = 'SELECT * FROM fees WHERE trade = ? AND level = ? AND is_active = 1';
        const params = [trade, level];

        if (term) {
            query += ' AND term = ?';
            params.push(term);
        }

        // Filter by student category (public/private)
        if (student_type) {
            query += ' AND (student_category = ? OR student_category = "both")';
            params.push(student_type);
        }

        query += ' ORDER BY created_at DESC LIMIT 1';

        const [fees] = await db.execute(query, params);
        if (fees.length === 0) {
            return res.status(404).json({ message: 'No fee found for this trade/level' });
        }
        res.status(200).json(fees[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update fee
exports.updateFee = async (req, res) => {
    try {
        const { id } = req.params;
        const { term, trade, level, amount, description, due_date, is_active } = req.body;

        await db.execute(
            'UPDATE fees SET term = ?, trade = ?, level = ?, amount = ?, description = ?, due_date = ?, is_active = ? WHERE id = ?',
            [term, trade, level, amount, description, due_date, is_active, id]
        );

        res.status(200).json({ message: 'Fee updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete fee
exports.deleteFee = async (req, res) => {
    try {
        const { id } = req.params;
        await db.execute('DELETE FROM fees WHERE id = ?', [id]);
        res.json({ message: 'Fee deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ==================== PAYMENT MANAGEMENT ====================

// Record payment with balance check
exports.recordPayment = async (req, res) => {
    try {
        const { student_id, fee_id, amount_paid, payment_method, notes, payment_date, send_sms } = req.body;

        if (!student_id || !amount_paid) {
            return res.status(400).json({ message: 'student_id and amount_paid are required' });
        }
        const recorded_by = req.user.id;

        // Generate receipt number
        const [receiptResult] = await db.execute('SELECT COUNT(*) as count FROM payments');
        const receiptNumber = `RCP-${Date.now()}-${(receiptResult[0]?.count ?? 0) + 1}`;

        // Use custom payment date if provided
        const dateValue = payment_date || new Date();

        // Calculate balance if fee_id is provided
        let balanceInfo = null;
        let totalPaid = 0;
        let totalFee = 0;
        let remainingBalance = 0;
        let paymentStatus = 'partial';

        if (fee_id) {
            // Get the fee details
            const [feeResult] = await db.execute('SELECT * FROM fees WHERE id = ?', [fee_id]);
            if (feeResult.length > 0) {
                totalFee = parseFloat(feeResult[0].amount);

                // Get total payments for this student and fee
                const [paidResult] = await db.execute(
                    'SELECT COALESCE(SUM(amount_paid), 0) as total_paid FROM payments WHERE student_id = ? AND fee_id = ?',
                    [student_id, fee_id]
                );
                totalPaid = parseFloat(paidResult[0].total_paid);

                // Calculate remaining balance
                remainingBalance = totalFee - (totalPaid + parseFloat(amount_paid));

                // Determine payment status
                if (remainingBalance <= 0) {
                    paymentStatus = 'full';
                    remainingBalance = 0;
                } else if (totalPaid + parseFloat(amount_paid) >= totalFee * 0.5) {
                    paymentStatus = 'partial';
                } else {
                    paymentStatus = 'partial';
                }

                balanceInfo = {
                    totalFee,
                    totalPaid: totalPaid + parseFloat(amount_paid),
                    remainingBalance,
                    paymentStatus,
                    isInsufficient: remainingBalance > 0
                };
            }
        }

        const [result] = await db.execute(
            `INSERT INTO payments (student_id, fee_id, amount_paid, payment_method, notes, receipt_number, recorded_by, payment_date, payment_status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [student_id, fee_id || null, amount_paid, payment_method || 'cash', notes || null, receiptNumber, recorded_by, dateValue, paymentStatus]
        );

        // Get student and fee info for SMS
        const [studentResult] = await db.execute(
            `SELECT s.first_name, s.last_name, s.guardian_phone, s.student_category, f.term, f.amount as total_fee
             FROM students s 
             LEFT JOIN fees f ON f.id = ?
             WHERE s.id = ?`,
            [fee_id, student_id]
        );

        if (studentResult.length > 0 && studentResult[0].guardian_phone && send_sms !== false) {
            const student = studentResult[0];
            let message = '';

            if (balanceInfo) {
                if (balanceInfo.isInsufficient) {
                    message = `Amakuru meza! Umwana ${student.first_name} ${student.last_name} (${student.term || 'igiciro'}) yishyuye: ${amount_paid} RWF. Byishyuwe byose: ${balanceInfo.totalPaid} / ${totalFee} RWF. Asigaje: ${remainingBalance} RWF. Receipt: ${receiptNumber}.`;
                } else {
                    message = `Amakuru meza! Umwana ${student.first_name} ${student.last_name} (${student.term || 'igiciro'}) yishyuye: ${amount_paid} RWF. Yishyuye byose! Igiciro cyose: ${balanceInfo.totalPaid} RWF. Receipt: ${receiptNumber}. Murakoze!`;
                }
            } else {
                message = `Amakuru meza! Kwishyura kw'umwana ${student.first_name} ${student.last_name} kwishyuwe: ${amount_paid} RWF. Receipt: ${receiptNumber}. Murakoze!`;
            }
            await sendSMS(student.guardian_phone, message);
        }

        res.status(201).json({
            message: balanceInfo ? (balanceInfo.isInsufficient ? 'Payment recorded - Balance remaining' : 'Payment recorded - Fully paid!') : 'Payment recorded',
            paymentId: result.insertId,
            receiptNumber,
            balance: balanceInfo
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all payments
exports.getPayments = async (req, res) => {
    try {
        const { status, method, date_from, date_to, trade, level } = req.query;

        let query = `
            SELECT p.*, s.first_name, s.last_name, s.reg_number, s.guardian_phone, s.trade, s.level,
                   f.term, f.amount as total_fee, f.trade as fee_trade, f.level as fee_level,
                   u.first_name as recorded_by_name, u.last_name as recorded_by_last
            FROM payments p 
            JOIN students s ON p.student_id = s.id 
            LEFT JOIN fees f ON p.fee_id = f.id 
            LEFT JOIN users u ON p.recorded_by = u.id
            WHERE 1=1
        `;
        const params = [];

        if (method) {
            query += ' AND p.payment_method = ?';
            params.push(method);
        }
        if (date_from) {
            query += ' AND DATE(p.payment_date) >= ?';
            params.push(date_from);
        }
        if (date_to) {
            query += ' AND DATE(p.payment_date) <= ?';
            params.push(date_to);
        }
        if (trade) {
            query += ' AND s.trade = ?';
            params.push(trade);
        }
        if (level) {
            query += ' AND s.level = ?';
            params.push(level);
        }

        query += ' ORDER BY p.payment_date DESC';

        const [payments] = await db.execute(query, params);
        res.status(200).json(payments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get single payment
exports.getPaymentById = async (req, res) => {
    try {
        const { id } = req.params;
        const [payments] = await db.execute(
            `SELECT p.*, s.first_name, s.last_name, s.reg_number, f.term, f.amount as total_fee, f.trade, f.level
             FROM payments p 
             JOIN students s ON p.student_id = s.id 
             LEFT JOIN fees f ON p.fee_id = f.id
             WHERE p.id = ?`,
            [id]
        );
        if (payments.length === 0) {
            return res.status(404).json({ message: 'Payment not found' });
        }
        res.status(200).json(payments[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete payment
exports.deletePayment = async (req, res) => {
    try {
        const { id } = req.params;
        await db.execute('DELETE FROM payments WHERE id = ?', [id]);
        res.json({ message: 'Payment deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update payment
exports.updatePayment = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount_paid, payment_method, notes } = req.body;

        await db.execute(
            'UPDATE payments SET amount_paid = ?, payment_method = ?, notes = ? WHERE id = ?',
            [amount_paid, payment_method, notes, id]
        );

        res.status(200).json({ message: 'Payment updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ==================== AUTO REMIND SMS ====================

// Send payment reminder to parent with detailed balance info
exports.sendPaymentReminder = async (req, res) => {
    try {
        const { student_id, custom_message, include_details } = req.body;

        // Get student and parent info from parent_student_links
        const [students] = await db.execute(
            `SELECT s.first_name, s.last_name, s.guardian_phone, s.trade, s.level, s.student_category,
                    COALESCE(SUM(f.amount), 0) as total_fee,
                    COALESCE((SELECT SUM(amount_paid) FROM payments WHERE student_id = s.id), 0) as total_paid,
                    psl.parent_id,
                    f.term as fee_term
             FROM students s
             LEFT JOIN fees f ON f.is_active = 1 AND f.trade = s.trade AND f.level = s.level AND (f.student_category = s.student_category OR f.student_category = 'both')
             LEFT JOIN parent_student_links psl ON psl.student_id = s.id AND psl.link_status = 'approved'
             WHERE s.id = ?
             GROUP BY s.id, psl.parent_id, f.term`,
            [student_id]
        );

        if (students.length === 0) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Find the student with a parent link
        const student = students.find(s => s.parent_id) || students[0];
        const totalFee = parseFloat(student.total_fee) || 0;
        const totalPaid = parseFloat(student.total_paid) || 0;
        const balance = totalFee - totalPaid;
        const percentPaid = totalFee > 0 ? Math.round((totalPaid / totalFee) * 100) : 0;

        // Determine payment status and urgency
        let urgency = 'normal';
        let statusMessage = '';

        if (balance <= 0) {
            urgency = 'none';
            statusMessage = 'wishyuye byose!';
        } else if (percentPaid >= 75) {
            urgency = 'low';
            statusMessage = `yarengutse ${percentPaid}%`;
        } else if (percentPaid >= 50) {
            urgency = 'medium';
            statusMessage = `afite ${percentPaid}% yishyuye`;
        } else if (percentPaid >= 25) {
            urgency = 'high';
            statusMessage = `agaragaye akenewe, ari ${percentPaid}% yishyuye`;
        } else {
            urgency = 'critical';
            statusMessage = `akenewe cyane, ntashyura!`;
        }

        // Get phone number (prefer parent's phone, fallback to guardian)
        const phone = student.parent_id ?
            (await db.execute('SELECT phone FROM users WHERE id = ?', [student.parent_id]))[0]?.[0]?.phone :
            student.guardian_phone;

        if (!phone) {
            return res.status(400).json({ message: 'No parent phone number' });
        }

        let message = custom_message;

        if (!message) {
            // Generate detailed reminder message based on balance status
            if (balance <= 0) {
                message = `Garden TVET: Muraho! Umwana ${student.first_name} ${student.last_name} (${student.trade} ${student.level}) ${statusMessage} Murakoze niby安ose!`;
            } else if (include_details) {
                message = `Garden TVET: Muraho, umwana ${student.first_name} ${student.last_name} (${student.fee_term || student.trade + ' ' + student.level}) ${statusMessage} Ikiguzi: ${balance} RWF. Nyamuneka wishyura. Murakoze!`;
            } else {
                message = `Garden TVET: Muraho, umwana ${student.first_name} ${student.last_name} (${student.trade} ${student.level}) afite ikiguzi cya ${balance} RWF. Nyamuneka wishyura. Murakoze!`;
            }
        }

        // Send SMS with parent_id for notification tracking
        await sendSMS(phone, message, student.parent_id);

        res.status(200).json({
            message: 'Reminder sent successfully',
            phone,
            balanceInfo: {
                totalFee,
                totalPaid,
                balance,
                percentPaid,
                urgency,
                statusMessage
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to send reminder' });
    }
};

// Broadcast reminders to all debtors - Now supports trade/level/gender filters OR specific student IDs
exports.broadcastPaymentReminders = async (req, res) => {
    try {
        const { trade, level, gender, min_balance, max_balance, message_template, student_ids } = req.body;

        // Get debtors with parent links
        let query = `
            SELECT s.id, s.first_name, s.last_name, s.guardian_phone, s.trade, s.level, s.gender,
                   COALESCE(SUM(f.amount), 0) as total_fee,
                   COALESCE((SELECT SUM(amount_paid) FROM payments WHERE student_id = s.id), 0) as total_paid,
                   psl.parent_id,
                   u.phone as parent_phone
            FROM students s
            LEFT JOIN fees f ON f.is_active = 1 AND f.trade = s.trade AND f.level = s.level
            LEFT JOIN parent_student_links psl ON psl.student_id = s.id AND (psl.status = 'approved' OR psl.link_status = 'approved')
            LEFT JOIN users u ON psl.parent_id = u.id
            WHERE s.current_status = 'active'
        `;
        const params = [];

        // If specific student IDs are provided, use those
        if (student_ids && Array.isArray(student_ids) && student_ids.length > 0) {
            const placeholders = student_ids.map(() => '?').join(',');
            query += ` AND s.id IN (${placeholders})`;
            params.push(...student_ids);
        } else {
            // Otherwise use trade/level/gender filters
            if (trade && trade !== 'all' && trade !== '') {
                query += ' AND s.trade = ?';
                params.push(trade);
            }
            if (level && level !== 'all' && level !== '') {
                query += ' AND s.level = ?';
                params.push(level);
            }
            if (gender && gender !== 'all' && gender !== '') {
                query += ' AND s.gender = ?';
                params.push(gender);
            }
        }

        query += ' GROUP BY s.id, psl.parent_id';

        // Add balance filter using HAVING
        const havingClauses = [];
        if (min_balance) {
            havingClauses.push('(COALESCE(SUM(f.amount), 0) - COALESCE((SELECT SUM(amount_paid) FROM payments WHERE student_id = s.id), 0)) >= ?');
            params.push(min_balance);
        }
        if (max_balance) {
            havingClauses.push('(COALESCE(SUM(f.amount), 0) - COALESCE((SELECT SUM(amount_paid) FROM payments WHERE student_id = s.id), 0)) <= ?');
            params.push(max_balance);
        }
        if (havingClauses.length > 0) {
            query += ' HAVING ' + havingClauses.join(' AND ');
        }

        const [debtors] = await db.execute(query, params);

        // Filter by balance > 0 and have valid phone
        const validDebtors = debtors.filter(d => {
            const balance = (d.total_fee || 0) - (d.total_paid || 0);
            return balance > 0 && (d.parent_phone || d.guardian_phone);
        });

        let sentCount = 0;
        let failedCount = 0;

        for (const debtor of validDebtors) {
            const balance = (debtor.total_fee || 0) - (debtor.total_paid || 0);
            const message = message_template || `Garden TVET: Muraho ${debtor.first_name}, umwana ${debtor.last_name} (${debtor.trade} ${debtor.level}) afite ikiguzi cya ${balance} RWF. Nyamuneka wishyure. Murakoze!`;

            // Use parent's phone if available, otherwise use guardian phone
            const phone = debtor.parent_phone || debtor.guardian_phone;

            try {
                // Pass parent_id to save notification
                await sendSMS(phone, message, debtor.parent_id);
                sentCount++;
            } catch (e) {
                failedCount++;
            }
        }

        res.status(200).json({
            message: `Reminders sent: ${sentCount}`,
            total_debtors: validDebtors.length,
            sent: sentCount,
            failed: failedCount
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to broadcast reminders' });
    }
};

// ==================== PAYMENT STATUS FILTERS ====================

// Get students by payment status (half paid, full paid, etc)
exports.getStudentsByPaymentStatus = async (req, res) => {
    try {
        const { status, trade, level } = req.query;

        let query = `
            SELECT s.id, s.first_name, s.last_name, s.reg_number, s.trade, s.level,
                   COALESCE(SUM(f.amount), 0) as total_fee,
                   COALESCE((SELECT SUM(amount_paid) FROM payments WHERE student_id = s.id), 0) as total_paid
            FROM students s
            LEFT JOIN fees f ON f.is_active = 1 AND f.trade = s.trade AND f.level = s.level
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

        query += ' GROUP BY s.id';

        const [students] = await db.execute(query, params);

        // Filter by payment status
        let filtered = students.map(s => {
            const totalFee = s.total_fee || 0;
            const paid = s.total_paid || 0;
            const balance = totalFee - paid;
            const percentage = totalFee > 0 ? (paid / totalFee) * 100 : 0;

            let paymentStatus = 'unpaid';
            if (totalFee === 0 || paid === 0) paymentStatus = 'unpaid';
            else if (balance <= 0) paymentStatus = 'paid';
            else if (percentage >= 75) paymentStatus = 'mostly_paid';
            else if (percentage >= 50) paymentStatus = 'half_paid';
            else if (percentage > 0) paymentStatus = 'partial';

            return { ...s, balance, percentage: percentage.toFixed(1), payment_status: paymentStatus };
        });

        if (status && status !== 'all') {
            filtered = filtered.filter(s => s.payment_status === status);
        }

        res.status(200).json(filtered);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ==================== FINANCIAL REPORTS ====================

// Financial summary - Enhanced
exports.getFinancialSummary = async (req, res) => {
    try {
        const { year, term } = req.query;

        // Active fees count
        const [[totalFees]] = await db.execute('SELECT COUNT(*) as count FROM fees WHERE is_active = 1');

        // Total payments collected
        const [[totalPayments]] = await db.execute('SELECT COALESCE(SUM(amount_paid), 0) as total FROM payments');

        // This month
        const [[thisMonth]] = await db.execute(
            `SELECT COALESCE(SUM(amount_paid), 0) as total FROM payments 
             WHERE YEAR(payment_date) = YEAR(CURDATE()) AND MONTH(payment_date) = MONTH(CURDATE())`
        );

        // Last month
        const [[lastMonth]] = await db.execute(
            `SELECT COALESCE(SUM(amount_paid), 0) as total FROM payments 
             WHERE YEAR(payment_date) = YEAR(CURDATE()) AND MONTH(payment_date) = MONTH(CURDATE() - 1)`
        );

        // This week
        const [[thisWeek]] = await db.execute(
            `SELECT COALESCE(SUM(amount_paid), 0) as total FROM payments 
             WHERE YEARWEEK(payment_date) = YEARWEEK(CURDATE())`
        );

        // Active students
        const [[totalStudents]] = await db.execute('SELECT COUNT(*) as count FROM students WHERE current_status = "active"');

        // Get payment methods breakdown
        const [byMethod] = await db.execute(
            `SELECT payment_method, SUM(amount_paid) as total, COUNT(*) as count 
             FROM payments GROUP BY payment_method`
        );

        // Get daily payments for last 7 days
        const [dailyPayments] = await db.execute(
            `SELECT DATE(payment_date) as date, SUM(amount_paid) as total, COUNT(*) as count
             FROM payments 
             WHERE payment_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
             GROUP BY DATE(payment_date)
             ORDER BY date DESC`
        );

        // Get by trade
        const [byTrade] = await db.execute(
            `SELECT s.trade, SUM(p.amount_paid) as total, COUNT(*) as count
             FROM payments p
             JOIN students s ON p.student_id = s.id
             GROUP BY s.trade`
        );

        // Get by level
        const [byLevel] = await db.execute(
            `SELECT s.level, SUM(p.amount_paid) as total, COUNT(*) as count
             FROM payments p
             JOIN students s ON p.student_id = s.id
             GROUP BY s.level`
        );

        // Calculate growth
        const growth = lastMonth.total > 0 ? ((thisMonth.total - lastMonth.total) / lastMonth.total * 100).toFixed(1) : 0;

        res.status(200).json({
            active_fees: totalFees.count,
            total_collected: totalPayments.total,
            this_month: thisMonth.total,
            last_month: lastMonth.total,
            this_week: thisWeek.total,
            this_month_growth: growth,
            active_students: totalStudents.count,
            by_method: byMethod,
            daily_payments: dailyPayments,
            by_trade: byTrade,
            by_level: byLevel
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get debtors - Enhanced with more details and trade/level/gender filters
exports.getDebtors = async (req, res) => {
    try {
        const { min_balance, max_balance, trade, level, gender } = req.query;

        let query = `
            SELECT s.*,
                   COALESCE(SUM(f.amount), 0) as total_fee,
                   COALESCE((SELECT SUM(amount_paid) FROM payments WHERE student_id = s.id), 0) as total_paid,
                   (COALESCE(SUM(f.amount), 0) - COALESCE((SELECT SUM(amount_paid) FROM payments WHERE student_id = s.id), 0)) as balance,
                   (SELECT COUNT(*) FROM payments WHERE student_id = s.id) as payment_count,
                   (SELECT MAX(payment_date) FROM payments WHERE student_id = s.id) as last_payment_date
            FROM students s
            LEFT JOIN fees f ON f.is_active = 1 AND f.trade = s.trade AND f.level = s.level
                AND (f.student_category = s.student_category OR f.student_category = 'both' OR f.student_category IS NULL)
            WHERE s.current_status = 'active'
        `;

        const params = [];

        // Add trade filter
        if (trade) {
            query += ' AND s.trade = ?';
            params.push(trade);
        }

        // Add level filter
        if (level) {
            query += ' AND s.level = ?';
            params.push(level);
        }

        // Add gender filter
        if (gender) {
            query += ' AND s.gender = ?';
            params.push(gender);
        }

        query += ' GROUP BY s.id';

        if (min_balance || max_balance) {
            query += ' HAVING ';
            const conditions = [];
            if (min_balance) {
                conditions.push('balance >= ?');
                params.push(min_balance);
            }
            if (max_balance) {
                conditions.push('balance <= ?');
                params.push(max_balance);
            }
            query += conditions.join(' AND ');
        }

        query += ' ORDER BY balance DESC';

        const [debtors] = await db.execute(query, params);
        res.status(200).json(debtors);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Revenue by period - Enhanced
exports.getRevenueByPeriod = async (req, res) => {
    try {
        const { start_date, end_date, group_by } = req.query;

        let query = '';
        let params = [];

        if (group_by === 'month') {
            query = `SELECT DATE_FORMAT(payment_date, '%Y-%m') as period, SUM(amount_paid) as total, COUNT(*) as count
                     FROM payments`;
        } else if (group_by === 'year') {
            query = `SELECT YEAR(payment_date) as period, SUM(amount_paid) as total, COUNT(*) as count
                     FROM payments`;
        } else {
            query = `SELECT DATE(payment_date) as date, SUM(amount_paid) as daily_total, COUNT(*) as transaction_count
                     FROM payments`;
        }

        if (start_date && end_date) {
            query += ' WHERE payment_date BETWEEN ? AND ?';
            params = [start_date, end_date];
        } else {
            query += ' WHERE MONTH(payment_date) = MONTH(CURDATE()) AND YEAR(payment_date) = YEAR(CURDATE())';
        }

        if (group_by === 'month') {
            query += ' GROUP BY DATE_FORMAT(payment_date, \'%Y-%m\') ORDER BY period DESC';
        } else if (group_by === 'year') {
            query += ' GROUP BY YEAR(payment_date) ORDER BY period DESC';
        } else {
            query += ' GROUP BY DATE(payment_date) ORDER BY date DESC';
        }

        const [revenue] = await db.execute(query, params);

        // Also get summary by trade
        const [byTrade] = await db.execute(
            `SELECT s.trade, SUM(p.amount_paid) as total, COUNT(*) as count
             FROM payments p
             JOIN students s ON p.student_id = s.id
             ${start_date && end_date ? 'WHERE p.payment_date BETWEEN ? AND ?' : 'WHERE MONTH(p.payment_date) = MONTH(CURDATE()) AND YEAR(p.payment_date) = YEAR(CURDATE())'}
             GROUP BY s.trade`,
            start_date && end_date ? [start_date, end_date] : []
        );

        // Get summary by payment method
        const [byMethod] = await db.execute(
            `SELECT p.payment_method, SUM(p.amount_paid) as total, COUNT(*) as count
             FROM payments p
             ${start_date && end_date ? 'WHERE p.payment_date BETWEEN ? AND ?' : 'WHERE MONTH(p.payment_date) = MONTH(CURDATE()) AND YEAR(p.payment_date) = YEAR(CURDATE())'}
             GROUP BY p.payment_method`,
            start_date && end_date ? [start_date, end_date] : []
        );

        // Calculate totals
        const total = revenue.reduce((sum, r) => sum + parseFloat(r.total || r.daily_total || 0), 0);

        res.status(200).json({
            revenue: revenue,
            by_trade: byTrade,
            by_method: byMethod,
            total: total
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get student payment history
exports.getStudentPaymentHistory = async (req, res) => {
    try {
        const { student_id } = req.params;

        const [payments] = await db.execute(
            `SELECT p.*, f.term, f.trade as fee_trade, f.level as fee_level
             FROM payments p
             LEFT JOIN fees f ON p.fee_id = f.id
             WHERE p.student_id = ?
             ORDER BY p.payment_date DESC`,
            [student_id]
        );

        // Get fee totals
        const [feeTotals] = await db.execute(
            `SELECT COALESCE(SUM(amount), 0) as total_fees FROM fees WHERE is_active = 1`
        );

        const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount_paid), 0);
        const totalFees = parseFloat(feeTotals[0].total_fees);

        res.status(200).json({
            payments,
            summary: {
                total_fees: totalFees,
                total_paid: totalPaid,
                balance: totalFees - totalPaid,
                payment_count: payments.length
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ==================== INVOICE MANAGEMENT ====================

// Generate invoice from fees
exports.generateInvoice = async (req, res) => {
    try {
        const { student_id, fee_id, description } = req.body;

        // Get student and fee info
        const [student] = await db.execute('SELECT * FROM students WHERE id = ?', [student_id]);
        if (student.length === 0) {
            return res.status(404).json({ message: 'Student not found' });
        }

        let fee = null;
        if (fee_id) {
            [fee] = await db.execute('SELECT * FROM fees WHERE id = ?', [fee_id]);
            if (fee.length > 0) {
                fee = fee[0];
            }
        }

        // Generate invoice number
        const [count] = await db.execute('SELECT COUNT(*) as count FROM payments');
        const invoiceNumber = `INV-${Date.now()}-${count.count + 1}`;

        res.status(200).json({
            invoice_number: invoiceNumber,
            student: student[0],
            fee: fee,
            description: description || `Invoice for ${student[0].first_name} ${student[0].last_name}`,
            amount: fee ? fee.amount : 0,
            due_date: fee ? fee.due_date : null
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ==================== REMINDERS & NOTIFICATIONS ====================

// Remind parent to pay
exports.remindParent = async (req, res) => {
    try {
        const { student_id, message } = req.body;

        const [students] = await db.execute(
            `SELECT s.first_name, s.last_name, s.guardian_phone, s.guardian_name, s.trade, s.level,
             COALESCE(SUM(f.amount), 0) as total_fee,
             (SELECT COALESCE(SUM(amount_paid), 0) FROM payments WHERE student_id = s.id) as total_paid
             FROM students s
             LEFT JOIN fees f ON f.is_active = 1
             WHERE s.id = ?
             GROUP BY s.id`,
            [student_id]
        );

        if (students.length === 0) {
            return res.status(404).json({ message: 'Student not found' });
        }

        const student = students[0];
        const balance = student.total_fee - student.total_paid;

        if (!student.guardian_phone) {
            return res.status(400).json({ message: 'No guardian phone number' });
        }

        const reminderMsg = message || `Murikana ${student.guardian_name || 'Murakaza neza'}, umwana ${student.first_name} ${student.last_name} (${student.trade} - ${student.level}) ari kugira ikibanza ${balance > 0 ? 'ya ' + balance.toLocaleString() + ' RWF' : 'mu kwishyura'}. Mungire amafaranga wo kwishyura vuba. Murakoze!`;

        await sendSMS(student.guardian_phone, reminderMsg);

        res.json({ message: 'Ubutumwa bwo kwigusha bwoherejwe!', sent_to: student.guardian_phone });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Send bulk reminders to all debtors
exports.remindAllDebtors = async (req, res) => {
    try {
        const debtors = await getDebtorsInternal();

        let sent = 0;
        let failed = 0;

        for (const debtor of debtors) {
            if (debtor.guardian_phone && debtor.balance > 0) {
                try {
                    const message = `Murikana ${debtor.guardian_name || ''}, umwana ${debtor.first_name} ${debtor.last_name} ari kugira ikibanza ya ${debtor.balance.toLocaleString()} RWF. Mungire amafaranga wo kwishyura vuba. Murakoze!`;
                    await sendSMS(debtor.guardian_phone, message);
                    sent++;
                } catch (e) {
                    failed++;
                }
            } else {
                failed++;
            }
        }

        res.json({ message: `Ubutumwa bwoherejwe: ${sent} byagenze neza, ${failed} byanze` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Helper function to get debtors
async function getDebtorsInternal() {
    const [debtors] = await db.execute(
        `SELECT s.*, 
         COALESCE(SUM(f.amount), 0) as total_fee, 
         COALESCE((SELECT SUM(amount_paid) FROM payments WHERE student_id = s.id), 0) as total_paid,
         (COALESCE(SUM(f.amount), 0) - COALESCE((SELECT SUM(amount_paid) FROM payments WHERE student_id = s.id), 0)) as balance
         FROM students s
         LEFT JOIN fees f ON f.is_active = 1
         WHERE s.current_status = 'active'
         GROUP BY s.id
         HAVING balance > 0
         ORDER BY balance DESC`
    );
    return debtors;
}

// ==================== EXPENSE TRACKING ====================

// Record expense (simplified)
exports.recordExpense = async (req, res) => {
    try {
        const { description, amount, category, payment_method, reference, notes } = req.body;
        const recorded_by = req.user.id;

        // Generate reference
        const [count] = await db.execute('SELECT COUNT(*) as count FROM payments');
        const refNumber = `EXP-${Date.now()}-${count.count + 1}`;

        // Record as negative payment (expense)
        // In a real system, you'd have a separate expenses table
        // For now, we just return success
        res.status(201).json({
            message: 'Expense recorded',
            reference: refNumber,
            amount: amount,
            category: category
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get expense summary
exports.getExpenseSummary = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        let dateFilter = '';
        const params = [];

        if (start_date && end_date) {
            dateFilter = 'WHERE payment_date BETWEEN ? AND ?';
            params.push(start_date, end_date);
        }

        // Get totals
        const [[total]] = await db.execute(
            `SELECT COALESCE(SUM(amount_paid), 0) as total FROM payments ${dateFilter}`,
            params
        );

        // Get by method for the period
        const [byMethod] = await db.execute(
            `SELECT payment_method, SUM(amount_paid) as total, COUNT(*) as count 
             FROM payments ${dateFilter ? 'WHERE payment_method IS NOT NULL' : ''}
             GROUP BY payment_method`,
            params
        );

        res.status(200).json({
            total_expenses: total.total,
            by_method: byMethod
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ==================== REPORTS ====================

// Get comprehensive financial report
exports.getComprehensiveReport = async (req, res) => {
    try {
        const { start_date, end_date, report_type } = req.query;

        // Get payments
        const [payments] = await db.execute(
            `SELECT p.*, s.first_name, s.last_name, s.reg_number, s.trade, s.level,
                    f.term, f.amount as fee_amount
             FROM payments p
             JOIN students s ON p.student_id = s.id
             LEFT JOIN fees f ON p.fee_id = f.id
             ${start_date && end_date ? 'WHERE p.payment_date BETWEEN ? AND ?' : 'WHERE MONTH(p.payment_date) = MONTH(CURDATE()) AND YEAR(p.payment_date) = YEAR(CURDATE())'}
             ORDER BY p.payment_date DESC`,
            start_date && end_date ? [start_date, end_date] : []
        );

        // Get fees
        const [fees] = await db.execute(
            `SELECT * FROM fees WHERE is_active = 1 ORDER BY created_at DESC`
        );

        // Get summary
        const summary = {
            total_collected: 0,
            total_expected: 0,
            student_count: new Set(payments.map(p => p.student_id)).size,
            transaction_count: payments.length,
            average_payment: 0
        };

        payments.forEach(p => {
            summary.total_collected += parseFloat(p.amount_paid);
        });

        fees.forEach(f => {
            summary.total_expected += parseFloat(f.amount);
        });

        summary.average_payment = summary.transaction_count > 0
            ? (summary.total_collected / summary.transaction_count).toFixed(2)
            : 0;

        res.status(200).json({
            payments,
            fees,
            summary
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Export payments to CSV data
exports.exportPayments = async (req, res) => {
    try {
        const { start_date, end_date, format } = req.query;

        let query = `
            SELECT p.payment_date, p.receipt_number, p.amount_paid, p.payment_method,
                   p.notes,
                   s.first_name, s.last_name, s.reg_number, s.trade, s.level,
                   f.term as fee_term, f.amount as fee_amount,
                   u.first_name as recorded_by_first, u.last_name as recorded_by_last
            FROM payments p
            JOIN students s ON p.student_id = s.id
            LEFT JOIN fees f ON p.fee_id = f.id
            LEFT JOIN users u ON p.recorded_by = u.id
        `;

        const params = [];
        if (start_date && end_date) {
            query += ' WHERE p.payment_date BETWEEN ? AND ?';
            params.push(start_date, end_date);
        }

        query += ' ORDER BY p.payment_date DESC';

        const [payments] = await db.execute(query, params);

        if (format === 'json') {
            res.status(200).json(payments);
        } else {
            // Return CSV data as string
            const headers = ['Date', 'Receipt', 'Student Name', 'Reg Number', 'Trade', 'Level', 'Amount', 'Method', 'Recorded By'];
            const rows = payments.map(p => [
                new Date(p.payment_date).toLocaleDateString(),
                p.receipt_number,
                `${p.first_name} ${p.last_name}`,
                p.reg_number,
                p.trade,
                p.level,
                p.amount_paid,
                p.payment_method,
                `${p.recorded_by_first || ''} ${p.recorded_by_last || ''}`.trim()
            ]);

            const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
            res.status(200).send(csv);
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get dashboard statistics for finance
exports.getFinanceDashboard = async (req, res) => {
    try {
        // Today's collections
        const [[todayTotal]] = await db.execute(
            `SELECT COALESCE(SUM(amount_paid), 0) as total FROM payments WHERE DATE(payment_date) = CURDATE()`
        );

        // This week's collections
        const [[weekTotal]] = await db.execute(
            `SELECT COALESCE(SUM(amount_paid), 0) as total FROM payments WHERE YEARWEEK(payment_date) = YEARWEEK(CURDATE())`
        );

        // This month's collections
        const [[monthTotal]] = await db.execute(
            `SELECT COALESCE(SUM(amount_paid), 0) as total FROM payments WHERE YEAR(payment_date) = YEAR(CURDATE()) AND MONTH(payment_date) = MONTH(CURDATE())`
        );

        // Outstanding balance
        const [[expectedTotal]] = await db.execute(
            `SELECT COALESCE(SUM(amount), 0) as total FROM fees WHERE is_active = 1`
        );

        const [[collectedTotal]] = await db.execute(
            `SELECT COALESCE(SUM(amount_paid), 0) as total FROM payments`
        );

        // Recent payments
        const [recentPayments] = await db.execute(
            `SELECT p.*, s.first_name, s.last_name, s.reg_number 
             FROM payments p
             JOIN students s ON p.student_id = s.id
             ORDER BY p.payment_date DESC LIMIT 10`
        );

        // Top debtors
        const [topDebtors] = await db.execute(
            `SELECT s.id, s.first_name, s.last_name, s.reg_number, s.trade, s.level,
             COALESCE(SUM(f.amount), 0) as total_fee, 
             COALESCE((SELECT SUM(amount_paid) FROM payments WHERE student_id = s.id), 0) as total_paid,
             (COALESCE(SUM(f.amount), 0) - COALESCE((SELECT SUM(amount_paid) FROM payments WHERE student_id = s.id), 0)) as balance
             FROM students s
             LEFT JOIN fees f ON f.is_active = 1
             WHERE s.current_status = 'active'
             GROUP BY s.id
             HAVING balance > 0
             ORDER BY balance DESC LIMIT 10`
        );

        // Payment methods breakdown
        const [methodsBreakdown] = await db.execute(
            `SELECT payment_method, SUM(amount_paid) as total, COUNT(*) as count 
             FROM payments 
             WHERE YEAR(payment_date) = YEAR(CURDATE()) AND MONTH(payment_date) = MONTH(CURDATE())
             GROUP BY payment_method`
        );

        res.status(200).json({
            today: todayTotal.total,
            this_week: weekTotal.total,
            this_month: monthTotal.total,
            expected_total: expectedTotal.total,
            collected_total: collectedTotal.total,
            outstanding: expectedTotal.total - collectedTotal.total,
            recent_payments: recentPayments,
            top_debtors: topDebtors,
            methods_breakdown: methodsBreakdown
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
