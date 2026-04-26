const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { getDb } = require('../db');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

// Evidence file storage
const EVIDENCE_DIR = path.join(__dirname, '..', 'public', 'uploads', 'discipline-evidence');
fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
const evidenceStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, EVIDENCE_DIR),
    filename: (req, file, cb) => {
        const safe = (file.originalname || 'file').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
        cb(null, `${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${safe}`);
    }
});
const evidenceUpload = multer({
    storage: evidenceStorage,
    limits: { fileSize: 25 * 1024 * 1024, files: 8 }, // 25MB each, max 8
    fileFilter: (req, file, cb) => {
        const ok = /^(image\/(png|jpe?g|gif|webp)|application\/pdf|video\/(mp4|webm|quicktime)|audio\/(mpeg|mp3|ogg|wav))$/.test(file.mimetype);
        if (!ok) return cb(new Error('Unsupported file type'));
        cb(null, true);
    }
});

// POST /api/discipline/evidence/upload — upload one or more evidence files
router.post('/evidence/upload', verifyToken, (req, res) => {
    if (!['admin', 'dod', 'director', 'teacher', 'parent'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Not authorized' });
    }
    evidenceUpload.array('files', 8)(req, res, (err) => {
        if (err) return res.status(400).json({ message: err.message });
        const files = (req.files || []).map(f => ({
            url: `/uploads/discipline-evidence/${f.filename}`,
            name: f.originalname,
            size: f.size,
            type: f.mimetype,
            uploaded_at: new Date().toISOString()
        }));
        res.json({ success: true, files });
    });
});

// ==================== DISCIPLINE RECORDS ====================

// Get all discipline records
router.get('/', verifyToken, async (req, res) => {
    try {
        const db = getDb();
        const { student_id, action_type, status, date_from, date_to } = req.query;

        let query = `
            SELECT d.*, s.first_name, s.last_name, s.reg_number, s.trade, s.level,
                   u.first_name as recorded_by_name, u.last_name as recorded_by_last
            FROM discipline_records d
            LEFT JOIN students s ON d.student_id = s.id
            LEFT JOIN users u ON d.recorded_by = u.id
            WHERE 1=1
        `;
        const params = [];

        // Admins, DOD, directors, and teachers can view discipline records
        const allowedRoles = ['admin', 'dod', 'director_of_discipline', 'director', 'teacher'];
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        if (student_id) {
            query += ' AND d.student_id = ?';
            params.push(student_id);
        }
        if (action_type) {
            query += ' AND d.action_type = ?';
            params.push(action_type);
        }
        if (date_from) {
            query += ' AND d.created_at >= ?';
            params.push(date_from);
        }
        if (date_to) {
            query += ' AND d.created_at <= ?';
            params.push(date_to);
        }

        query += ' ORDER BY d.created_at DESC';

        const records = await db.query(query, params);
        res.json(records);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create discipline record
router.post('/', verifyToken, async (req, res) => {
    try {
        if (!['admin', 'dod', 'director', 'teacher'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Not authorized to create discipline records' });
        }

        const { student_id, action_type, description, severity, incident_date, location, witness_names, follow_up_required, follow_up_date, evidence_files, points_deducted } = req.body;

        if (!student_id || !action_type || !description) {
            return res.status(400).json({ message: 'Student, action type, and description are required' });
        }

        const db = getDb();
        const evidenceJson = JSON.stringify(Array.isArray(evidence_files) ? evidence_files : []);
        const result = await db.query(
            `INSERT INTO discipline_records (student_id, action_type, description, severity, incident_date, location, witness_names, evidence_files, recorded_by, follow_up_required, follow_up_date, points_deducted) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [student_id, action_type, description, severity || 'low', incident_date || new Date(), location || null, witness_names || null, evidenceJson, req.user.id, follow_up_required || false, follow_up_date || null, points_deducted || 0]
        );

        // Update student status if needed
        if (action_type === 'suspension' || action_type === 'punish') {
            await db.query('UPDATE students SET current_status = "suspended" WHERE id = ?', [student_id]);
        } else if (action_type === 'sick') {
            await db.query('UPDATE students SET current_status = "sick" WHERE id = ?', [student_id]);
        } else if (action_type === 'leave' || action_type === 'conduct_removal') {
            await db.query('UPDATE students SET current_status = "left" WHERE id = ?', [student_id]);
        }

        res.status(201).json({ message: 'Discipline record created', id: result.insertId });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update discipline record
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const db = getDb();

        const [record] = await db.query('SELECT * FROM discipline_records WHERE id = ?', [req.params.id]);

        if (!record.length) {
            return res.status(404).json({ message: 'Record not found' });
        }

        if (!['admin', 'dod', 'director', 'teacher'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Not authorized to update discipline records' });
        }

        const { action_type, description, severity, status, location, witness_names, follow_up_required, follow_up_date, resolution_notes } = req.body;

        await db.query(
            `UPDATE discipline_records SET action_type = ?, description = ?, severity = ?, status = ?, location = ?, witness_names = ?, follow_up_required = ?, follow_up_date = ?, resolution_notes = ?
             WHERE id = ?`,
            [action_type, description, severity, status || record[0].status, location, witness_names, follow_up_required, follow_up_date, resolution_notes, req.params.id]
        );

        res.json({ message: 'Discipline record updated' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delete discipline record
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        if (!['admin', 'dod', 'director', 'teacher'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Not authorized to delete discipline records' });
        }

        const db = getDb();

        // Get record first
        const [record] = await db.query('SELECT student_id, action_type FROM discipline_records WHERE id = ?', [req.params.id]);

        if (record.length > 0) {
            // Restore student status if needed
            if (record[0].action_type === 'suspension' || record[0].action_type === 'punish') {
                await db.query('UPDATE students SET current_status = "active" WHERE id = ?', [record[0].student_id]);
            }
        }

        await db.query('DELETE FROM discipline_records WHERE id = ?', [req.params.id]);
        res.json({ message: 'Discipline record deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Resolve discipline record
router.put('/:id/resolve', verifyToken, async (req, res) => {
    try {
        if (!['admin', 'dod', 'director', 'teacher'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Not authorized to resolve discipline records' });
        }

        const db = getDb();
        const { resolution_notes } = req.body;

        await db.query(
            `UPDATE discipline_records SET status = 'resolved', resolved_by = ?, resolved_at = NOW(), resolution_date = CURDATE(), resolution_notes = ?
             WHERE id = ?`,
            [req.user.id, resolution_notes || null, req.params.id]
        );

        // Restore student status
        const [record] = await db.query('SELECT student_id, action_type FROM discipline_records WHERE id = ?', [req.params.id]);
        if (record.length > 0 && (record[0].action_type === 'suspension' || record[0].action_type === 'punish')) {
            await db.query('UPDATE students SET current_status = "active" WHERE id = ?', [record[0].student_id]);
        }

        res.json({ message: 'Discipline record resolved' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ==================== STATS & REPORTS ====================

// Get discipline statistics
router.get('/stats', verifyToken, async (req, res) => {
    try {
        const db = getDb();
        const { period } = req.query;

        let dateFilter = '';
        if (period === 'week') {
            dateFilter = 'AND d.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
        } else if (period === 'month') {
            dateFilter = 'AND d.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
        }

        const stats = {};

        // Total records
        const [total] = await db.query('SELECT COUNT(*) as count FROM discipline_records');
        stats.total_records = total.count;

        // Records by type
        const byType = await db.query(`
            SELECT action_type, COUNT(*) as count FROM discipline_records 
            GROUP BY action_type
        `);
        stats.by_type = byType;

        // Recent trends
        const [recent] = await db.query(`
            SELECT COUNT(*) as count FROM discipline_records 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        `);
        stats.last_30_days = recent.count;

        // Pending appeals
        const [appeals] = await db.query('SELECT COUNT(*) as count FROM discipline_appeals WHERE status = "pending"');
        stats.pending_appeals = appeals.count;

        // Active suspensions
        const [suspensions] = await db.query(`SELECT COUNT(*) as count FROM discipline_records WHERE action_type IN ('suspension', 'punish') AND status = 'active'`);
        stats.active_suspensions = suspensions.count;

        // By severity
        const bySeverity = await db.query(`
            SELECT severity, COUNT(*) as count FROM discipline_records GROUP BY severity
        `);
        stats.by_severity = bySeverity;

        // By trade
        const byTrade = await db.query(`
            SELECT s.trade, COUNT(*) as count 
            FROM discipline_records d 
            JOIN students s ON d.student_id = s.id 
            GROUP BY s.trade
        `);
        stats.by_trade = byTrade;

        res.json(stats);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get discipline dashboard
router.get('/dashboard', verifyToken, async (req, res) => {
    try {
        const db = getDb();

        // Today's incidents
        const [[today]] = await db.query('SELECT COUNT(*) as count FROM discipline_records WHERE DATE(created_at) = CURDATE()');

        // This week
        const [[week]] = await db.query('SELECT COUNT(*) as count FROM discipline_records WHERE YEARWEEK(created_at) = YEARWEEK(CURDATE())');

        // This month
        const [[month]] = await db.query('SELECT COUNT(*) as count FROM discipline_records WHERE YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE())');

        // Active cases
        const [[active]] = await db.query("SELECT COUNT(*) as count FROM discipline_records WHERE status = 'active'");

        // Recent records
        const [recentRecords] = await db.query(`
            SELECT d.*, s.first_name, s.last_name, s.reg_number, s.trade
            FROM discipline_records d
            JOIN students s ON d.student_id = s.id
            ORDER BY d.created_at DESC LIMIT 10
        `);

        // Top offenders
        const [topOffenders] = await db.query(`
            SELECT s.id, s.first_name, s.last_name, s.trade, s.level, COUNT(*) as incident_count
            FROM discipline_records d
            JOIN students s ON d.student_id = s.id
            WHERE d.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
            GROUP BY s.id
            ORDER BY incident_count DESC LIMIT 10
        `);

        res.json({
            today_incidents: today.count,
            this_week: week.count,
            this_month: month.count,
            active_cases: active.count,
            recent_records: recentRecords,
            top_offenders: topOffenders
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ==================== LEAVE REQUESTS ====================

// Get all leave requests
router.get('/leaves', verifyToken, async (req, res) => {
    try {
        const db = getDb();
        const { status, leave_type } = req.query;

        let query = `
            SELECT lr.*, 
                   s.first_name as student_name, s.last_name as student_lastname, s.reg_number,
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

        const requests = await db.query(query, params);
        res.json(requests);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Submit leave request
router.post('/leaves', verifyToken, async (req, res) => {
    try {
        const { leave_type, start_date, end_date, reason, student_id, start_time, end_time, lesson } = req.body;

        if (!leave_type || !start_date || !end_date || !reason) {
            return res.status(400).json({ message: 'All required fields must be filled' });
        }

        const db = getDb();

        let staffId = null;
        let studentId = null;

        if (req.user.role === 'parent' && student_id) {
            studentId = student_id;
        } else if (req.user.role === 'teacher' && student_id) {
            // Teacher can submit on behalf of a student
            studentId = student_id;
            staffId = req.user.id;
        } else {
            staffId = req.user.id;
        }

        // Calculate total days
        const start = new Date(start_date);
        const end = new Date(end_date);
        const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

        const result = await db.query(
            `INSERT INTO leave_requests (student_id, staff_id, leave_type, start_date, end_date, total_days, reason, start_time, end_time, lesson)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [studentId, staffId, leave_type, start_date, end_date, totalDays, reason, start_time || null, end_time || null, lesson || null]
        );

        // AUTO SMS to linked parents on every leave/sick request
        if (studentId) {
            try {
                const smsService = require('../utils/smsService');
                const isSick = /sick/i.test(leave_type);
                const data = {
                    leave_type,
                    start_date: String(start_date).slice(0,10),
                    end_date: String(end_date).slice(0,10),
                    total_days: totalDays,
                    reason,
                    start_time: start_time || '',
                    end_time: end_time || '',
                    lesson: lesson || ''
                };
                const timeText = (start_time || end_time) ? ` (${start_time || '?'} → ${end_time || '?'})` : '';
                const lessonText = lesson ? ` Isomo riraburiwe: ${lesson}.` : '';
                const fallback = isSick
                    ? `[Garden TVET] Umwana wanyu yabonye uburwayi (${leave_type}). Kuva ${data.start_date}${timeText} kugeza ${data.end_date} (${totalDays} iminsi).${lessonText} Impamvu: ${reason}.`
                    : `[Garden TVET] Hari icyifuzo cy'uruhushya cyatanzwe k'umwana wanyu (${leave_type}) — kuva ${data.start_date}${timeText} kugeza ${data.end_date} (${totalDays} iminsi).${lessonText} Impamvu: ${reason}.`;
                await smsService.sendToStudentParents(studentId, isSick ? 'student_sick' : 'leave_submitted', data, 'rw', fallback);
            } catch (smsErr) {
                console.error('Leave SMS notification failed:', smsErr.message);
            }
        }

        res.status(201).json({ message: 'Leave request submitted', id: result.insertId });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Approve/reject leave request
router.put('/leaves/:id', verifyToken, async (req, res) => {
    try {
        if (!['admin', 'dod', 'director'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Not authorized to review leave requests' });
        }

        const { status, review_notes } = req.body;

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const db = getDb();
        await db.query(
            `UPDATE leave_requests SET status = ?, reviewed_by = ?, reviewed_at = NOW(), review_notes = ?
             WHERE id = ?`,
            [status, req.user.id, review_notes || null, req.params.id]
        );

        // AUTO SMS to linked parents on approval/rejection
        try {
            const rows = await db.query(
                `SELECT student_id, leave_type, start_date, end_date, total_days FROM leave_requests WHERE id = ?`,
                [req.params.id]
            );
            const lr = Array.isArray(rows) ? rows[0] : null;
            if (lr && lr.student_id) {
                const smsService = require('../utils/smsService');
                const data = {
                    leave_type: lr.leave_type,
                    start_date: String(lr.start_date).slice(0,10),
                    end_date: String(lr.end_date).slice(0,10),
                    total_days: lr.total_days,
                    review_notes: review_notes || ''
                };
                const verb = status === 'approved' ? 'CYEMEJWE' : 'CYANZWE';
                const fallback = `[Garden TVET] Uruhushya rw'umwana wanyu (${lr.leave_type}, ${data.start_date} → ${data.end_date}) ${verb}. ${review_notes ? 'Impamvu: ' + review_notes : ''}`.trim();
                await smsService.sendToStudentParents(
                    lr.student_id,
                    status === 'approved' ? 'leave_approved' : 'leave_rejected',
                    data, 'rw', fallback
                );
            }
        } catch (smsErr) {
            console.error('Leave review SMS failed:', smsErr.message);
        }

        res.json({ message: `Leave request ${status}` });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Mark a leave request as RETURNED — auto-records actual return time
router.put('/leaves/:id/return', verifyToken, async (req, res) => {
    try {
        if (!['admin', 'dod', 'director', 'teacher'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Not authorized to mark returns' });
        }

        const { return_notes } = req.body || {};
        const db = getDb();

        const [existing] = await db.query(
            'SELECT * FROM leave_requests WHERE id = ?',
            [req.params.id]
        );
        if (!existing || existing.length === 0) {
            return res.status(404).json({ message: 'Leave request not found' });
        }
        const lr = existing[0];
        if (lr.actual_return_time) {
            return res.status(400).json({ message: 'Already marked as returned' });
        }

        await db.query(
            `UPDATE leave_requests
             SET actual_return_time = NOW(), returned_by = ?, return_notes = ?, status = IF(status = 'pending', 'approved', status)
             WHERE id = ?`,
            [req.user.id, return_notes || null, req.params.id]
        );

        // Auto-SMS to linked parents that the student is back
        try {
            if (lr.student_id) {
                const smsService = require('../utils/smsService');
                const [stRows] = await db.query(
                    'SELECT first_name, last_name, reg_number FROM students WHERE id = ?',
                    [lr.student_id]
                );
                const st = stRows[0] || {};
                const nowStr = new Date().toLocaleString('en-GB', { hour12: false });
                const fallback = `[Garden TVET] Umwana wanyu ${st.first_name || ''} ${st.last_name || ''} (${st.reg_number || ''}) yagarutse ku ishuri kuri ${nowStr}.${return_notes ? ' Inyandiko: ' + return_notes : ''} Murakoze!`;
                await smsService.sendToStudentParents(
                    lr.student_id,
                    'student_returned',
                    {
                        student_name: `${st.first_name || ''} ${st.last_name || ''}`.trim(),
                        reg_number: st.reg_number || '',
                        actual_return_time: nowStr,
                        return_notes: return_notes || ''
                    },
                    'rw',
                    fallback
                );
            }
        } catch (smsErr) {
            console.error('Mark-returned SMS failed:', smsErr.message);
        }

        res.json({ message: 'Marked as returned and parents notified', actual_return_time: new Date().toISOString() });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ==================== DISCIPLINE APPEALS ====================

// Get discipline appeals
router.get('/appeals', verifyToken, async (req, res) => {
    try {
        const db = getDb();
        const { status } = req.query;

        let query = `
            SELECT da.*, d.action_type, d.description as discipline_description,
                   s.first_name as student_name, s.last_name as student_lastname, s.reg_number,
                   u.first_name as parent_name, u.last_name as parent_lastname
            FROM discipline_appeals da
            LEFT JOIN discipline_records d ON da.discipline_id = d.id
            LEFT JOIN students s ON d.student_id = s.id
            LEFT JOIN users u ON da.parent_id = u.id
            WHERE 1=1
        `;
        const params = [];

        if (status) {
            query += ' AND da.status = ?';
            params.push(status);
        }

        query += ' ORDER BY da.created_at DESC';

        const appeals = await db.query(query, params);
        res.json(appeals);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Submit appeal
router.post('/appeals', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'parent') {
            return res.status(403).json({ message: 'Only parents can submit appeals' });
        }

        const { discipline_id, appeal_reason } = req.body;

        if (!discipline_id || !appeal_reason) {
            return res.status(400).json({ message: 'Discipline record and appeal reason are required' });
        }

        const db = getDb();

        const [discipline] = await db.query('SELECT student_id FROM discipline_records WHERE id = ?', [discipline_id]);

        if (!discipline.length) {
            return res.status(404).json({ message: 'Discipline record not found' });
        }

        const [link] = await db.query(
            'SELECT * FROM parent_student_links WHERE parent_id = ? AND student_id = ? AND status = "approved"',
            [req.user.id, discipline[0].student_id]
        );

        if (!link.length) {
            return res.status(403).json({ message: 'You are not linked to this student' });
        }

        const result = await db.query(
            `INSERT INTO discipline_appeals (discipline_id, parent_id, appeal_reason) 
             VALUES (?, ?, ?)`,
            [discipline_id, req.user.id, appeal_reason]
        );

        // Update status to appealed
        await db.query('UPDATE discipline_records SET status = "appealed" WHERE id = ?', [discipline_id]);

        res.status(201).json({ message: 'Appeal submitted successfully', id: result.insertId });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Decide on appeal
router.put('/appeals/:id', verifyToken, async (req, res) => {
    try {
        if (!['admin', 'dod', 'director'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Not authorized to decide appeals' });
        }

        const { status, decision_notes } = req.body;

        if (!['accepted', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const db = getDb();
        await db.query(
            `UPDATE discipline_appeals SET status = ?, decided_by = ?, decided_at = NOW(), decision_notes = ?
             WHERE id = ?`,
            [status, req.user.id, decision_notes || null, req.params.id]
        );

        if (status === 'accepted') {
            const [appeal] = await db.query('SELECT discipline_id FROM discipline_appeals WHERE id = ?', [req.params.id]);
            if (appeal.length) {
                await db.query('UPDATE discipline_records SET status = "resolved" WHERE id = ?', [appeal[0].discipline_id]);
            }
        }

        res.json({ message: `Appeal ${status}` });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ==================== STUDENT BEHAVIOR ====================

// Get student behavior history
router.get('/student/:student_id/history', verifyToken, async (req, res) => {
    try {
        const db = getDb();

        const [records] = await db.query(
            `SELECT * FROM discipline_records WHERE student_id = ? ORDER BY created_at DESC`,
            [req.params.student_id]
        );

        const summary = {
            total: records.length,
            warnings: records.filter(r => r.action_type === 'warning').length,
            suspensions: records.filter(r => r.action_type === 'suspension').length,
            resolved: records.filter(r => r.status === 'resolved').length
        };

        res.json({ records, summary });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ==================== EXPORT ====================

// Export discipline records
router.get('/export', verifyToken, async (req, res) => {
    try {
        const db = getDb();
        const { start_date, end_date, format } = req.query;

        let query = `
            SELECT d.created_at, d.action_type, d.description, d.severity, d.status,
                   s.first_name, s.last_name, s.reg_number, s.trade, s.level
            FROM discipline_records d
            JOIN students s ON d.student_id = s.id
        `;

        const params = [];
        if (start_date && end_date) {
            query += ' WHERE d.created_at BETWEEN ? AND ?';
            params.push(start_date, end_date);
        }

        query += ' ORDER BY d.created_at DESC';

        const records = await db.query(query, params);

        if (format === 'json') {
            res.json(records);
        } else {
            const headers = ['Date', 'Student', 'Reg Number', 'Trade', 'Level', 'Action', 'Severity', 'Status'];
            const rows = records.map(r => [
                new Date(r.created_at).toLocaleDateString(),
                `${r.first_name} ${r.last_name}`,
                r.reg_number,
                r.trade,
                r.level,
                r.action_type,
                r.severity,
                r.status
            ]);

            const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
            res.send(csv);
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ==================== GLOBAL CONDUCT SHEETS ====================

// Get global conduct sheet for all students across all trades
router.get('/conduct-sheet', verifyToken, async (req, res) => {
    try {
        const db = getDb();
        const { trade, level, status, search } = req.query;

        // Get all students with their discipline summary (include ALL statuses)
        let query = `
            SELECT 
                s.id as student_id,
                s.first_name,
                s.last_name,
                s.reg_number,
                s.trade,
                s.level,
                s.current_status,
                s.guardian_name,
                s.guardian_phone,
                COUNT(DISTINCT d.id) as total_incidents,
                SUM(CASE WHEN d.status = 'active' THEN 1 ELSE 0 END) as active_incidents,
                SUM(CASE WHEN d.action_type IN ('suspension', 'punish') THEN 1 ELSE 0 END) as suspension_count,
                SUM(CASE WHEN d.action_type = 'conduct_good' THEN 1 ELSE 0 END) as good_conduct_count,
                MAX(d.created_at) as last_incident_date,
                GROUP_CONCAT(DISTINCT CONCAT(d.action_type, ': ', LEFT(d.description, 50)) SEPARATOR ' | ') as recent_actions
            FROM students s
            LEFT JOIN discipline_records d ON s.id = d.student_id
            WHERE 1=1
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

        if (status && status !== 'all') {
            query += ' AND s.current_status = ?';
            params.push(status);
        }

        if (search) {
            query += ' AND (s.first_name LIKE ? OR s.last_name LIKE ? OR s.reg_number LIKE ?)';
            const searchPattern = `%${search}%`;
            params.push(searchPattern, searchPattern, searchPattern);
        }

        query += ' GROUP BY s.id ORDER BY s.trade, s.level, s.last_name';

        const [students] = await db.execute(query, params);

        // Calculate conduct status for each student
        const conductSheet = (students || []).map(student => {
            let conductStatus = 'good';
            let conductColor = 'green';

            if (student.suspension_count > 0) {
                conductStatus = 'suspended';
                conductColor = 'red';
            } else if (student.active_incidents > 2) {
                conductStatus = 'warning';
                conductColor = 'orange';
            } else if (student.active_incidents > 0) {
                conductStatus = 'monitoring';
                conductColor = 'yellow';
            }

            return {
                ...student,
                conduct_status: conductStatus,
                conduct_color: conductColor
            };
        });

        // Get summary by trade
        const [byTrade] = await db.query(`
            SELECT 
                s.trade,
                COUNT(DISTINCT s.id) as total_students,
                SUM(CASE WHEN d.action_type IN ('suspension', 'punish') THEN 1 ELSE 0 END) as suspensions,
                SUM(CASE WHEN d.status = 'active' THEN 1 ELSE 0 END) as active_cases
            FROM students s
            LEFT JOIN discipline_records d ON s.id = d.student_id
            GROUP BY s.trade
        `);

        // Get summary by level
        const [byLevel] = await db.query(`
            SELECT 
                s.level,
                COUNT(DISTINCT s.id) as total_students,
                SUM(CASE WHEN d.action_type IN ('suspension', 'punish') THEN 1 ELSE 0 END) as suspensions
            FROM students s
            LEFT JOIN discipline_records d ON s.id = d.student_id
            GROUP BY s.level
        `);

        res.json({
            students: conductSheet,
            summary: {
                total_students: conductSheet.length,
                by_trade: byTrade,
                by_level: byLevel,
                good_conduct: conductSheet.filter(s => s.conduct_status === 'good').length,
                warning: conductSheet.filter(s => s.conduct_status === 'warning').length,
                monitoring: conductSheet.filter(s => s.conduct_status === 'monitoring').length,
                suspended: conductSheet.filter(s => s.conduct_status === 'suspended').length
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update student conduct status
router.put('/conduct/:studentId', verifyToken, async (req, res) => {
    try {
        if (!['admin', 'dod', 'director', 'teacher'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { studentId } = req.params;
        const { notes } = req.body;

        // Add a conduct note (positive or negative)
        const db = getDb();
        const actionType = notes?.toLowerCase().includes('good') || notes?.toLowerCase().includes('excellent')
            ? 'conduct_good'
            : 'conduct_note';

        await db.query(
            `INSERT INTO discipline_records (student_id, action_type, description, severity, recorded_by, status)
             VALUES (?, ?, ?, 'low', ?, 'resolved')`,
            [studentId, actionType, notes || 'Conduct updated', req.user.id]
        );

        res.json({ message: 'Conduct updated successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ==================== SMS BROADCAST FOR DOD ====================

// Get all parents for broadcast (linked parents + applicants with phone) — supports gender filter
router.get('/broadcast/parents', verifyToken, async (req, res) => {
    try {
        if (!['admin', 'dod', 'director', 'director_of_discipline', 'accountant', 'teacher'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const db = getDb();
        const { trade, level, gender, include_applicants } = req.query;

        // Get linked parents with their children info
        let linkedQuery = `
            SELECT DISTINCT 
                u.id as parent_id,
                u.first_name as parent_first,
                u.last_name as parent_last,
                u.phone as parent_phone,
                s.first_name as student_first,
                s.last_name as student_last,
                s.reg_number,
                s.trade,
                s.level,
                s.gender,
                'linked' as source
            FROM parent_student_links psl
            JOIN users u ON psl.parent_id = u.id
            JOIN students s ON psl.student_id = s.id
            WHERE (psl.status = 'approved' OR psl.link_status = 'approved') AND u.phone IS NOT NULL
        `;
        const linkedParams = [];

        if (trade && trade !== 'all') {
            linkedQuery += ' AND s.trade = ?';
            linkedParams.push(trade);
        }
        if (level && level !== 'all') {
            linkedQuery += ' AND s.level = ?';
            linkedParams.push(level);
        }
        if (gender && gender !== 'all') {
            linkedQuery += ' AND s.gender = ?';
            linkedParams.push(gender);
        }

        const linkedParents = await db.query(linkedQuery, linkedParams);

        // Get applicants if requested
        let applicants = [];
        if (include_applicants === 'true') {
            let appQuery = `
                SELECT DISTINCT 
                    NULL as parent_id,
                    first_name as parent_first,
                    last_name as parent_last,
                    phone as parent_phone,
                    NULL as student_first,
                    NULL as student_last,
                    NULL as reg_number,
                    trade,
                    level,
                    gender,
                    'applicant' as source
                FROM applications 
                WHERE phone IS NOT NULL AND status = 'approved'
            `;
            const appParams = [];

            if (trade && trade !== 'all') {
                appQuery += ' AND trade = ?';
                appParams.push(trade);
            }
            if (level && level !== 'all') {
                appQuery += ' AND level = ?';
                appParams.push(level);
            }
            if (gender && gender !== 'all') {
                appQuery += ' AND gender = ?';
                appParams.push(gender);
            }

            applicants = await db.query(appQuery, appParams);
        }

        res.json({
            linked: linkedParents,
            applicants: applicants,
            total: linkedParents.length + applicants.length
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Send SMS to all parents (broadcast)
router.post('/broadcast/sms', verifyToken, async (req, res) => {
    try {
        if (!['admin', 'dod', 'director', 'director_of_discipline', 'accountant'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { message, recipient_type, trade, level, gender } = req.body;

        if (!message) {
            return res.status(400).json({ message: 'Message is required' });
        }

        const db = getDb();
        const smsService = require('../utils/smsService');
        let recipients = [];

        // Get linked parents (with gender support)
        let linkedQuery = `
            SELECT DISTINCT u.id as parent_id, u.phone, u.first_name, s.gender
            FROM parent_student_links psl
            JOIN users u ON psl.parent_id = u.id
            JOIN students s ON psl.student_id = s.id
            WHERE (psl.status = 'approved' OR psl.link_status = 'approved') AND u.phone IS NOT NULL
        `;
        const params = [];

        if (trade && trade !== 'all') { linkedQuery += ' AND s.trade = ?'; params.push(trade); }
        if (level && level !== 'all') { linkedQuery += ' AND s.level = ?'; params.push(level); }
        if (gender && gender !== 'all') { linkedQuery += ' AND s.gender = ?'; params.push(gender); }

        const linked = await db.query(linkedQuery, params);
        recipients = linked;

        // Include applicants if requested
        if (recipient_type === 'all' || recipient_type === 'applicants') {
            let appQ = `SELECT DISTINCT phone, first_name, NULL as parent_id, gender FROM applications WHERE phone IS NOT NULL AND status = 'approved'`;
            const appP = [];
            if (trade && trade !== 'all') { appQ += ' AND trade = ?'; appP.push(trade); }
            if (level && level !== 'all') { appQ += ' AND level = ?'; appP.push(level); }
            if (gender && gender !== 'all') { appQ += ' AND gender = ?'; appP.push(gender); }
            const apps = await db.query(appQ, appP);
            recipients = [...recipients, ...apps];
        }

        // De-duplicate by phone
        const seen = new Set();
        recipients = recipients.filter(r => {
            if (!r.phone || seen.has(r.phone)) return false;
            seen.add(r.phone);
            return true;
        });

        let sentCount = 0;
        let failedCount = 0;
        const fullMsg = `Garden TVET: ${message}`;

        for (const recipient of recipients) {
            try {
                const result = await smsService.sendSMS(recipient.phone, fullMsg);
                // Log to sms_logs (unified log)
                try {
                    await db.query(
                        'INSERT INTO sms_logs (phone, message, status, sent_by, recipient_id, created_at) VALUES (?,?,?,?,?,NOW())',
                        [recipient.phone, fullMsg, result.success ? 'sent' : 'failed', req.user.id, recipient.parent_id || null]
                    );
                } catch (_) { }
                if (result.success) sentCount++; else failedCount++;
            } catch (smsErr) {
                console.error('SMS failed for', recipient.phone, smsErr.message);
                failedCount++;
            }
        }

        res.json({
            success: true,
            message: `Message sent to ${sentCount} recipients`,
            recipients_count: recipients.length,
            sent_count: sentCount,
            failed_count: failedCount
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Clear/remove all discipline records for a student (conduct removal)
router.delete('/clear/:studentId', verifyToken, async (req, res) => {
    try {
        if (!['admin', 'dod', 'director', 'director_of_discipline'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Not authorized to clear conduct records' });
        }

        const { studentId } = req.params;
        const { clear_type } = req.body; // 'all' or 'active'

        const db = getDb();

        if (clear_type === 'all') {
            // Delete all discipline records for this student
            await db.query('DELETE FROM discipline_records WHERE student_id = ?', [studentId]);
            // Reset student status to active
            await db.query('UPDATE students SET current_status = "active" WHERE id = ?', [studentId]);
            res.json({ message: 'All conduct records cleared for student' });
        } else {
            // Delete only active records
            await db.query('DELETE FROM discipline_records WHERE student_id = ? AND status = "active"', [studentId]);
            res.json({ message: 'Active conduct records cleared for student' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
