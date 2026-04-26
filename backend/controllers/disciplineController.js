const db = require('../db');
const smsService = require('../utils/smsService');

// ==================== DISCIPLINE RECORDS ====================

// Add discipline record
exports.addDisciplineRecord = async (req, res) => {
    try {
        const {
            student_id, action_type, description, severity,
            incident_date, location, witness_names,
            evidence_files, parent_notified, follow_up_required, follow_up_date,
            removal_reason, points_deducted
        } = req.body;
        const recorded_by = req.user.id;

        // Use incident date or default to now
        const incidentDateValue = incident_date || new Date();

        const [result] = await db.execute(
            `INSERT INTO discipline_records 
             (student_id, action_type, description, severity, incident_date, location, witness_names, evidence_files, recorded_by, follow_up_required, follow_up_date, removal_reason, points_deducted) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [student_id, action_type, description, severity || 'low', incidentDateValue, location || null, witness_names || null, JSON.stringify(evidence_files || []), recorded_by, follow_up_required || false, follow_up_date || null, removal_reason || null, points_deducted || 0]
        );

        // Calculate remaining conduct points for conduct removal
        let conductInfo = null;
        if (action_type === 'conduct_removal') {
            // Get current conduct points (default max is 100)
            const [studentResult] = await db.execute('SELECT conduct_points FROM students WHERE id = ?', [student_id]);
            const currentPoints = studentResult[0]?.conduct_points || 100;
            const remainingPoints = Math.max(0, currentPoints - (points_deducted || 10));

            // Update student's conduct points
            await db.execute('UPDATE students SET conduct_points = ? WHERE id = ?', [remainingPoints, student_id]);

            conductInfo = {
                previousPoints: currentPoints,
                deducted: points_deducted || 10,
                remainingPoints
            };
        }

        // Update student status based on action type
        if (action_type === 'sick') {
            await db.execute('UPDATE students SET current_status = ? WHERE id = ?', ['sick', student_id]);
        } else if (action_type === 'leave' || action_type === 'conduct_removal') {
            await db.execute('UPDATE students SET current_status = ? WHERE id = ?', ['left', student_id]);
        } else if (action_type === 'punish' || action_type === 'suspension') {
            await db.execute('UPDATE students SET current_status = ? WHERE id = ?', ['suspended', student_id]);
        }

        // Notify Parents if required
        let notificationSent = false;
        if (parent_notified) {
            if (['warning', 'conduct_good', 'punish'].includes(action_type)) {
                smsService.notifyDisciplineIncident(student_id, action_type, description)
                    .catch(err => console.log('SMS notification error:', err.message));
            } else {
                smsService.notifyStudentStatusChange(student_id, action_type, description)
                    .catch(err => console.log('SMS notification error:', err.message));
            }
            notificationSent = true;

            // Update parent notification status
            await db.execute(
                'UPDATE discipline_records SET parent_notified = TRUE, parent_notified_at = NOW() WHERE id = ?',
                [result.insertId]
            );
        }

        res.status(201).json({
            message: 'Record added successfully',
            recordId: result.insertId,
            conductInfo,
            notificationSent
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all discipline records
exports.getDisciplineRecords = async (req, res) => {
    try {
        const { student_id, action_type, status, severity, date_from, date_to, trade, level } = req.query;

        let query = `
            SELECT d.*, s.first_name, s.last_name, s.reg_number, s.trade, s.level, s.guardian_phone, s.guardian_name,
                   u.first_name as recorded_by_first, u.last_name as recorded_by_last,
                   r.first_name as resolved_by_first, r.last_name as resolved_by_last
            FROM discipline_records d 
            JOIN students s ON d.student_id = s.id 
            LEFT JOIN users u ON d.recorded_by = u.id 
            LEFT JOIN users r ON d.resolved_by = r.id
            WHERE 1=1
        `;
        const params = [];

        if (student_id) {
            query += ' AND d.student_id = ?';
            params.push(student_id);
        }
        if (action_type) {
            query += ' AND d.action_type = ?';
            params.push(action_type);
        }
        if (status) {
            query += ' AND d.status = ?';
            params.push(status);
        }
        if (severity) {
            query += ' AND d.severity = ?';
            params.push(severity);
        }
        if (date_from) {
            query += ' AND DATE(d.created_at) >= ?';
            params.push(date_from);
        }
        if (date_to) {
            query += ' AND DATE(d.created_at) <= ?';
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

        query += ' ORDER BY d.created_at DESC';

        const [records] = await db.execute(query, params);
        res.status(200).json(records);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get single discipline record
exports.getDisciplineRecordById = async (req, res) => {
    try {
        const { id } = req.params;
        const [records] = await db.execute(
            `SELECT d.*, s.first_name, s.last_name, s.reg_number, s.trade, s.level, s.guardian_phone, s.guardian_name,
                    u.first_name as recorded_by_first, u.last_name as recorded_by_last
             FROM discipline_records d 
             JOIN students s ON d.student_id = s.id 
             LEFT JOIN users u ON d.recorded_by = u.id
             WHERE d.id = ?`,
            [id]
        );
        if (records.length === 0) {
            return res.status(404).json({ message: 'Record not found' });
        }
        res.status(200).json(records[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update discipline record
exports.updateDisciplineRecord = async (req, res) => {
    try {
        const { id } = req.params;
        const { action_type, description, severity, status, location, witness_names, follow_up_required, follow_up_date } = req.body;

        // Check if record exists
        const [existing] = await db.execute('SELECT * FROM discipline_records WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Record not found' });
        }

        await db.execute(
            `UPDATE discipline_records SET 
             action_type = ?, description = ?, severity = ?, status = ?, 
             location = ?, witness_names = ?, follow_up_required = ?, follow_up_date = ?,
             updated_at = NOW()
             WHERE id = ?`,
            [action_type, description, severity, status || existing[0].status, location, witness_names, follow_up_required, follow_up_date, id]
        );

        res.status(200).json({ message: 'Record updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete discipline record
exports.deleteDisciplineRecord = async (req, res) => {
    try {
        const { id } = req.params;

        // Get record first to restore student status
        const [record] = await db.execute('SELECT * FROM discipline_records WHERE id = ?', [id]);

        if (record.length > 0) {
            // If it was a suspension or sick, restore status
            if (record[0].action_type === 'suspension' || record[0].action_type === 'punish') {
                await db.execute('UPDATE students SET current_status = "active" WHERE id = ?', [record[0].student_id]);
            }
        }

        await db.execute('DELETE FROM discipline_records WHERE id = ?', [id]);
        res.json({ message: 'Record deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Resolve discipline record
exports.resolveDisciplineRecord = async (req, res) => {
    try {
        const { id } = req.params;
        const { resolution_notes } = req.body;
        const resolved_by = req.user.id;

        await db.execute(
            `UPDATE discipline_records SET 
             status = 'resolved', 
             resolved_by = ?, 
             resolved_at = NOW(),
             resolution_date = CURDATE(),
             resolution_notes = ?
             WHERE id = ?`,
            [resolved_by, resolution_notes, id]
        );

        // Restore student to active if it was a suspension
        const [record] = await db.execute('SELECT student_id, action_type FROM discipline_records WHERE id = ?', [id]);
        if (record.length > 0 && (record[0].action_type === 'suspension' || record[0].action_type === 'punish')) {
            await db.execute('UPDATE students SET current_status = "active" WHERE id = ?', [record[0].student_id]);
        }

        res.status(200).json({ message: 'Record resolved' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ==================== DISCIPLINE STATISTICS ====================

// Get discipline statistics
exports.getDisciplineStats = async (req, res) => {
    try {
        const { period } = req.query;

        let dateFilter = '';
        if (period === 'week') {
            dateFilter = 'AND d.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
        } else if (period === 'month') {
            dateFilter = 'AND d.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
        } else if (period === 'term') {
            dateFilter = 'AND d.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)';
        }

        // Total records
        const [[total]] = await db.execute('SELECT COUNT(*) as count FROM discipline_records');

        // Records by type
        const [byType] = await db.execute(
            `SELECT action_type, COUNT(*) as count FROM discipline_records WHERE 1=1 ${dateFilter.replace('AND', 'WHERE')} GROUP BY action_type`
        );

        // Records by severity
        const [bySeverity] = await db.execute(
            `SELECT severity, COUNT(*) as count FROM discipline_records GROUP BY severity`
        );

        // Records by status
        const [byStatus] = await db.execute(
            `SELECT status, COUNT(*) as count FROM discipline_records GROUP BY status`
        );

        // Records by trade
        const [byTrade] = await db.execute(
            `SELECT s.trade, COUNT(*) as count 
             FROM discipline_records d 
             JOIN students s ON d.student_id = s.id 
             GROUP BY s.trade`
        );

        // Recent trends
        const [recent] = await db.execute(
            `SELECT DATE(created_at) as date, COUNT(*) as count 
             FROM discipline_records 
             WHERE created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY)
             GROUP BY DATE(created_at)
             ORDER BY date DESC`
        );

        // Active suspensions
        const [[activeSuspensions]] = await db.execute(
            `SELECT COUNT(*) as count FROM discipline_records 
             WHERE action_type IN ('suspension', 'punish') AND status = 'active'`
        );

        // Pending follow-ups
        const [[pendingFollowUps]] = await db.execute(
            `SELECT COUNT(*) as count FROM discipline_records 
             WHERE follow_up_required = TRUE AND status = 'active' AND follow_up_date <= CURDATE()`
        );

        res.status(200).json({
            total_records: total.count,
            by_type: byType,
            by_severity: bySeverity,
            by_status: byStatus,
            by_trade: byTrade,
            recent_trends: recent,
            active_suspensions: activeSuspensions.count,
            pending_follow_ups: pendingFollowUps.count
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get discipline dashboard
exports.getDisciplineDashboard = async (req, res) => {
    try {
        // Today's incidents
        const [[todayIncidents]] = await db.execute(
            `SELECT COUNT(*) as count FROM discipline_records WHERE DATE(created_at) = CURDATE()`
        );

        // This week
        const [[weekIncidents]] = await db.execute(
            `SELECT COUNT(*) as count FROM discipline_records WHERE YEARWEEK(created_at) = YEARWEEK(CURDATE())`
        );

        // This month
        const [[monthIncidents]] = await db.execute(
            `SELECT COUNT(*) as count FROM discipline_records WHERE YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE())`
        );

        // Active cases
        const [[activeCases]] = await db.execute(
            `SELECT COUNT(*) as count FROM discipline_records WHERE status = 'active'`
        );

        // Resolved this month
        const [[resolvedThisMonth]] = await db.execute(
            `SELECT COUNT(*) as count FROM discipline_records 
             WHERE status = 'resolved' AND YEAR(resolved_at) = YEAR(CURDATE()) AND MONTH(resolved_at) = MONTH(CURDATE())`
        );

        // Recent records
        const [recentRecords] = await db.execute(
            `SELECT d.*, s.first_name, s.last_name, s.reg_number, s.trade, s.level
             FROM discipline_records d
             JOIN students s ON d.student_id = s.id
             ORDER BY d.created_at DESC LIMIT 10`
        );

        // Top offenders (by count)
        const [topOffenders] = await db.execute(
            `SELECT s.id, s.first_name, s.last_name, s.reg_number, s.trade, s.level, COUNT(*) as incident_count
             FROM discipline_records d
             JOIN students s ON d.student_id = s.id
             WHERE d.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
             GROUP BY s.id
             ORDER BY incident_count DESC LIMIT 10`
        );

        // By action type this month
        const [byActionType] = await db.execute(
            `SELECT action_type, COUNT(*) as count 
             FROM discipline_records 
             WHERE YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE())
             GROUP BY action_type`
        );

        res.status(200).json({
            today: todayIncidents.count,
            this_week: weekIncidents.count,
            this_month: monthIncidents.count,
            active_cases: activeCases.count,
            resolved_this_month: resolvedThisMonth.count,
            recent_records: recentRecords,
            top_offenders: topOffenders,
            by_action_type: byActionType
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ==================== NOTIFICATIONS ====================

// Notify parent
exports.notifyParent = async (req, res) => {
    try {
        const { student_id, message } = req.body;

        const result = await notifyParent(student_id, 'notification', message || 'Urgent message from school regarding your child.');

        if (result) {
            res.json({ message: 'Parent notified successfully' });
        } else {
            res.status(400).json({ message: 'Failed to notify parent' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Bulk notify parents
exports.bulkNotifyParents = async (req, res) => {
    try {
        const { trade, level, message } = req.body;

        let query = `SELECT DISTINCT s.id, s.guardian_phone, s.first_name, s.last_name FROM students s WHERE s.current_status = 'active'`;
        const params = [];

        if (trade) {
            query += ' AND s.trade = ?';
            params.push(trade);
        }
        if (level) {
            query += ' AND s.level = ?';
            params.push(level);
        }

        const [students] = await db.execute(query, params);

        let sent = 0;
        let failed = 0;

        for (const student of students) {
            if (student.guardian_phone) {
                try {
                    const msg = message || `Dear Parent of ${student.first_name} ${student.last_name}, please contact the school regarding your child's behavior.`;
                    await sms.send({
                        to: [student.guardian_phone.startsWith('+') ? student.guardian_phone : `+250${student.guardian_phone.replace(/^0/, '')}`],
                        message: msg
                    });
                    sent++;
                } catch (e) {
                    failed++;
                }
            } else {
                failed++;
            }
        }

        res.json({ message: `Notifications sent: ${sent} successful, ${failed} failed`, sent, failed });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ==================== STUDENT BEHAVIOR ====================

// Get student behavior history
exports.getStudentBehaviorHistory = async (req, res) => {
    try {
        const { student_id } = req.params;

        const [records] = await db.execute(
            `SELECT * FROM discipline_records 
             WHERE student_id = ?
             ORDER BY created_at DESC`,
            [student_id]
        );

        // Get summary
        const summary = {
            total_records: records.length,
            warnings: records.filter(r => r.action_type === 'warning').length,
            suspensions: records.filter(r => r.action_type === 'suspension' || r.action_type === 'punish').length,
            good_conduct: records.filter(r => r.action_type === 'conduct_good').length,
            resolved: records.filter(r => r.status === 'resolved').length,
            pending: records.filter(r => r.status === 'active').length
        };

        res.status(200).json({ records, summary });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ==================== REPORTS & EXPORTS ====================

// Export discipline records
exports.exportDisciplineRecords = async (req, res) => {
    try {
        const { start_date, end_date, format } = req.query;

        let query = `
            SELECT d.created_at, d.action_type, d.description, d.severity, d.status, d.location,
                   s.first_name, s.last_name, s.reg_number, s.trade, s.level,
                   u.first_name as recorded_by
            FROM discipline_records d
            JOIN students s ON d.student_id = s.id
            LEFT JOIN users u ON d.recorded_by = u.id
        `;

        const params = [];
        if (start_date && end_date) {
            query += ' WHERE d.created_at BETWEEN ? AND ?';
            params.push(start_date, end_date);
        }

        query += ' ORDER BY d.created_at DESC';

        const [records] = await db.execute(query, params);

        if (format === 'json') {
            res.status(200).json(records);
        } else {
            const headers = ['Date', 'Student Name', 'Reg Number', 'Trade', 'Level', 'Action', 'Severity', 'Status', 'Location', 'Recorded By'];
            const rows = records.map(r => [
                new Date(r.created_at).toLocaleDateString(),
                `${r.first_name} ${r.last_name}`,
                r.reg_number,
                r.trade,
                r.level,
                r.action_type,
                r.severity,
                r.status,
                r.location || '',
                r.recorded_by || ''
            ]);

            const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
            res.status(200).send(csv);
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ==================== LEAVE REQUESTS ====================

// Get leave requests
exports.getLeaveRequests = async (req, res) => {
    try {
        const { status, leave_type } = req.query;

        let query = `
            SELECT lr.*, 
                   s.first_name as student_name, s.last_name as student_lastname, s.reg_number, s.trade, s.level,
                   u.first_name as staff_name, u.last_name as staff_lastname
            FROM leave_requests lr
            LEFT JOIN students s ON lr.student_id = s.id
            LEFT JOIN users u ON lr.staff_id = u.id
            WHERE 1=1
        `;
        const params = [];

        if (status) {
            query += ' AND lr.status = ?';
            params.push(status);
        }
        if (leave_type) {
            query += ' AND lr.leave_type = ?';
            params.push(leave_type);
        }

        query += ' ORDER BY lr.created_at DESC';

        const [requests] = await db.execute(query, params);
        res.status(200).json(requests);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Submit leave request
exports.submitLeaveRequest = async (req, res) => {
    try {
        const { leave_type, start_date, end_date, reason, student_id } = req.body;

        if (!leave_type || !start_date || !end_date || !reason) {
            return res.status(400).json({ message: 'All required fields must be filled' });
        }

        let staffId = null;
        let studentId = null;

        if (req.user.role === 'parent' && student_id) {
            studentId = student_id;
        } else {
            staffId = req.user.id;
        }

        // Calculate total days
        const start = new Date(start_date);
        const end = new Date(end_date);
        const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

        const [result] = await db.execute(
            `INSERT INTO leave_requests (student_id, staff_id, leave_type, start_date, end_date, total_days, reason) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [studentId, staffId, leave_type, start_date, end_date, totalDays, reason]
        );

        res.status(201).json({ message: 'Leave request submitted', id: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Review leave request
exports.reviewLeaveRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, review_notes } = req.body;

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        await db.execute(
            `UPDATE leave_requests SET status = ?, reviewed_by = ?, reviewed_at = NOW(), review_notes = ?
             WHERE id = ?`,
            [status, req.user.id, review_notes || null, id]
        );

        res.json({ message: `Leave request ${status}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ==================== APPEALS ====================

// Get appeals
exports.getAppeals = async (req, res) => {
    try {
        const { status } = req.query;

        let query = `
            SELECT da.*, d.action_type, d.description as discipline_description,
                   s.first_name as student_name, s.last_name as student_lastname, s.reg_number,
                   u.first_name as parent_name, u.last_name as parent_lastname,
                   r.first_name as decided_by_name, r.last_name as decided_by_last
            FROM discipline_appeals da
            LEFT JOIN discipline_records d ON da.discipline_id = d.id
            LEFT JOIN students s ON d.student_id = s.id
            LEFT JOIN users u ON da.parent_id = u.id
            LEFT JOIN users r ON da.decided_by = r.id
            WHERE 1=1
        `;
        const params = [];

        if (status) {
            query += ' AND da.status = ?';
            params.push(status);
        }

        query += ' ORDER BY da.created_at DESC';

        const [appeals] = await db.execute(query, params);
        res.status(200).json(appeals);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Submit appeal
exports.submitAppeal = async (req, res) => {
    try {
        const { discipline_id, appeal_reason, evidence_files } = req.body;

        if (!discipline_id || !appeal_reason) {
            return res.status(400).json({ message: 'Discipline record and appeal reason are required' });
        }

        const [discipline] = await db.execute('SELECT student_id FROM discipline_records WHERE id = ?', [discipline_id]);

        if (!discipline.length) {
            return res.status(404).json({ message: 'Discipline record not found' });
        }

        // Check if parent is linked
        if (req.user.role === 'parent') {
            const [link] = await db.execute(
                'SELECT * FROM parent_student_links WHERE parent_id = ? AND student_id = ? AND status = "approved"',
                [req.user.id, discipline[0].student_id]
            );

            if (!link.length) {
                return res.status(403).json({ message: 'You are not linked to this student' });
            }
        }

        const [result] = await db.execute(
            `INSERT INTO discipline_appeals (discipline_id, parent_id, appeal_reason, evidence_files) 
             VALUES (?, ?, ?, ?)`,
            [discipline_id, req.user.id, appeal_reason, JSON.stringify(evidence_files || [])]
        );

        // Update discipline record status
        await db.execute(
            'UPDATE discipline_records SET status = "appealed" WHERE id = ?',
            [discipline_id]
        );

        res.status(201).json({ message: 'Appeal submitted successfully', id: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Decide appeal
exports.decideAppeal = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, decision_notes } = req.body;

        if (!['accepted', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        await db.execute(
            `UPDATE discipline_appeals SET status = ?, decided_by = ?, decided_at = NOW(), decision_notes = ?
             WHERE id = ?`,
            [status, req.user.id, decision_notes || null, id]
        );

        // If accepted, update the discipline record
        if (status === 'accepted') {
            const [appeal] = await db.execute('SELECT discipline_id FROM discipline_appeals WHERE id = ?', [id]);
            if (appeal.length) {
                await db.execute(
                    'UPDATE discipline_records SET status = "resolved", resolved_by = ?, resolved_at = NOW() WHERE id = ?',
                    [req.user.id, appeal[0].discipline_id]
                );
            }
        }

        res.json({ message: `Appeal ${status}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ==================== HELPER FUNCTIONS ====================

// Removed internal notifyParent in favor of smsService
