const express = require('express');
const router = express.Router();
const parentController = require('../controllers/parentController');
const gradeController = require('../controllers/gradeController');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

// Only admin, dod, accountant can access parent linking
const staffRoles = ['admin', 'dod', 'accountant'];

// Helper: list of student IDs linked to the calling parent (handles both status / link_status columns)
async function getLinkedStudentIds(parentId) {
    const db = require('../db');
    const [links] = await db.execute(
        `SELECT DISTINCT student_id FROM parent_student_links
         WHERE parent_id = ?
           AND (status = 'approved' OR status = 'linked'
                OR link_status = 'approved' OR link_status = 'linked')`,
        [parentId]
    );
    return links.map(l => l.student_id);
}

// Parent: get grades for their children
router.get('/grades', verifyToken, verifyRole(['parent']), async (req, res) => {
    try {
        const { student_id } = req.query;
        const db = require('../db');
        const studentIds = await getLinkedStudentIds(req.user.id);

        if (studentIds.length === 0) return res.json([]);

        if (student_id && !studentIds.includes(parseInt(student_id))) {
            return res.status(403).json({ message: 'Not authorized for this student' });
        }

        const ids = student_id ? [parseInt(student_id)] : studentIds;
        const placeholders = ids.map(() => '?').join(',');
        const [grades] = await db.execute(
            `SELECT sg.*, s.first_name, s.last_name, s.reg_number,
                    u.first_name as recorded_by_name, u.last_name as recorded_by_last
             FROM student_grades sg
             JOIN students s ON sg.student_id = s.id
             LEFT JOIN users u ON sg.recorded_by = u.id
             WHERE sg.student_id IN (${placeholders})
             ORDER BY sg.created_at DESC`,
            ids
        );
        res.json(grades);
    } catch (err) {
        console.error('Error fetching parent grades:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Parent: get attendance for their children
router.get('/attendance', verifyToken, verifyRole(['parent']), async (req, res) => {
    try {
        const { student_id } = req.query;
        const db = require('../db');
        const studentIds = await getLinkedStudentIds(req.user.id);

        if (studentIds.length === 0) return res.json([]);
        if (student_id && !studentIds.includes(parseInt(student_id))) {
            return res.status(403).json({ message: 'Not authorized for this student' });
        }

        const ids = student_id ? [parseInt(student_id)] : studentIds;
        const placeholders = ids.map(() => '?').join(',');
        const [attendance] = await db.execute(
            `SELECT a.*, s.first_name, s.last_name
             FROM attendance a JOIN students s ON a.student_id = s.id
             WHERE a.student_id IN (${placeholders})
             ORDER BY a.date DESC LIMIT 200`,
            ids
        );
        res.json(attendance);
    } catch (err) {
        console.error('Error fetching parent attendance:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Parent: get discipline records for their children
router.get('/discipline', verifyToken, verifyRole(['parent']), async (req, res) => {
    try {
        const { student_id } = req.query;
        const db = require('../db');
        const studentIds = await getLinkedStudentIds(req.user.id);

        if (studentIds.length === 0) return res.json([]);
        if (student_id && !studentIds.includes(parseInt(student_id))) {
            return res.status(403).json({ message: 'Not authorized for this student' });
        }

        const ids = student_id ? [parseInt(student_id)] : studentIds;
        const placeholders = ids.map(() => '?').join(',');
        const [records] = await db.execute(
            `SELECT dr.*,
                    s.first_name, s.last_name, s.reg_number,
                    u.first_name as recorded_by_first, u.last_name as recorded_by_last,
                    CONCAT(COALESCE(u.first_name,''), ' ', COALESCE(u.last_name,'')) as recorded_by_name
             FROM discipline_records dr
             JOIN students s ON dr.student_id = s.id
             LEFT JOIN users u ON dr.recorded_by = u.id
             WHERE dr.student_id IN (${placeholders})
             ORDER BY dr.incident_date DESC, dr.created_at DESC LIMIT 200`,
            ids
        );
        res.json(records);
    } catch (err) {
        console.error('Error fetching parent discipline:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Parent: get fees summary for one of their children (totals + payment history)
router.get('/fees-summary', verifyToken, verifyRole(['parent']), async (req, res) => {
    try {
        const { student_id } = req.query;
        if (!student_id) return res.status(400).json({ message: 'student_id is required' });
        const db = require('../db');
        const studentIds = await getLinkedStudentIds(req.user.id);
        if (!studentIds.includes(parseInt(student_id))) {
            return res.status(403).json({ message: 'Not authorized for this student' });
        }

        const [[student]] = await db.execute(
            'SELECT id, first_name, last_name, reg_number, trade, level FROM students WHERE id = ?',
            [student_id]
        );
        if (!student) return res.status(404).json({ message: 'Student not found' });

        const [feesRows] = await db.execute(
            `SELECT COALESCE(SUM(amount), 0) as total_fee
             FROM fees
             WHERE is_active = 1 AND trade = ? AND level = ?`,
            [student.trade, student.level]
        );
        const total_fee = parseFloat(feesRows[0]?.total_fee || 0);

        const [paidRows] = await db.execute(
            'SELECT COALESCE(SUM(amount_paid), 0) as total_paid FROM payments WHERE student_id = ?',
            [student_id]
        );
        const total_paid = parseFloat(paidRows[0]?.total_paid || 0);
        const balance = Math.max(0, total_fee - total_paid);

        const [payments] = await db.execute(
            `SELECT id, amount_paid, payment_method, payment_date, receipt_number, notes, payment_status, created_at
             FROM payments WHERE student_id = ? ORDER BY payment_date DESC, created_at DESC LIMIT 50`,
            [student_id]
        );

        res.json({
            student,
            total_fee,
            total_paid,
            balance,
            percent_paid: total_fee > 0 ? Math.round((total_paid / total_fee) * 100) : 0,
            payments
        });
    } catch (err) {
        console.error('Error fetching parent fees-summary:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Parent: get all SMS messages sent to this parent (logs from sms_logs by phone OR recipient_id)
router.get('/sms-logs', verifyToken, verifyRole(['parent']), async (req, res) => {
    try {
        const db = require('../db');
        const [me] = await db.execute('SELECT phone FROM users WHERE id = ?', [req.user.id]);
        const phone = me[0]?.phone || null;

        const [logs] = await db.execute(
            `SELECT id, phone, message, status, created_at, recipient_id
             FROM sms_logs
             WHERE recipient_id = ? OR (phone IS NOT NULL AND phone = ?)
             ORDER BY created_at DESC LIMIT 100`,
            [req.user.id, phone]
        );
        res.json(logs);
    } catch (err) {
        console.error('Error fetching parent sms-logs:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Parent: payment reminders sent to them (uses sms_reminders table)
router.get('/payment-reminders', verifyToken, verifyRole(['parent']), async (req, res) => {
    try {
        const db = require('../db');
        const [reminders] = await db.execute(
            `SELECT sr.*, s.first_name as student_first, s.last_name as student_last, s.reg_number
             FROM sms_reminders sr
             LEFT JOIN students s ON sr.student_id = s.id
             WHERE sr.parent_id = ?
             ORDER BY sr.sent_at DESC LIMIT 50`,
            [req.user.id]
        );
        res.json(reminders);
    } catch (err) {
        // Fallback: derive from sms_logs (payment_reminder type messages)
        try {
            const db = require('../db');
            const [me] = await db.execute('SELECT phone FROM users WHERE id = ?', [req.user.id]);
            const phone = me[0]?.phone || null;
            const [logs] = await db.execute(
                `SELECT id, message, status, created_at, phone
                 FROM sms_logs
                 WHERE (recipient_id = ? OR phone = ?) AND message LIKE '%ikiguzi%'
                 ORDER BY created_at DESC LIMIT 50`,
                [req.user.id, phone]
            );
            return res.json(logs);
        } catch (_) {
            res.status(500).json({ message: 'Server error', error: err.message });
        }
    }
});

// Parent: submit a link request (describes child - admin manually matches)
router.post('/link-request', verifyToken, verifyRole(['parent']), parentController.submitLinkRequest);
// Parent: get their own link requests status
router.get('/my-requests', verifyToken, verifyRole(['parent']), parentController.getMyLinkRequests);
// Parent: get their approved/linked children
router.get('/students', verifyToken, verifyRole(['parent']), parentController.getParentStudents);

// Staff: get linked students for a specific parent
router.get('/:parentId/students', verifyToken, verifyRole(staffRoles), async (req, res) => {
    try {
        const { parentId } = req.params;
        const db = require('../db');

        const [links] = await db.execute(
            `SELECT 
                psl.id,
                psl.status,
                psl.relationship,
                psl.is_primary,
                psl.created_at,
                s.id as student_id,
                s.first_name,
                s.last_name,
                s.reg_number,
                s.trade,
                s.level
            FROM parent_student_links psl
            JOIN students s ON psl.student_id = s.id
            WHERE psl.parent_id = ?
            ORDER BY psl.is_primary DESC, psl.created_at DESC`,
            [parentId]
        );

        // Format the response
        const formatted = links.map(link => ({
            id: link.id,
            student_id: link.student_id,
            student_name: `${link.first_name} ${link.last_name}`,
            student_trade: link.trade,
            student_level: link.level,
            reg_number: link.reg_number,
            status: link.status,
            relationship: link.relationship,
            is_primary: link.is_primary
        }));

        res.json(formatted);
    } catch (error) {
        console.error('Error getting parent students:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// All staff: get all link requests from parents
router.get('/link-requests', verifyToken, verifyRole(staffRoles), parentController.getAllLinkRequests);

// All staff: manually link parent to a student + SMS
router.post('/admin-link', verifyToken, verifyRole(staffRoles), parentController.adminLinkParentToStudent);

// All staff: reject a link request + SMS
router.put('/link-requests/:id/reject', verifyToken, verifyRole(staffRoles), parentController.rejectLinkRequest);

// Admin: approve/reject old-style direct links
router.put('/link/:id', verifyToken, verifyRole(['admin', 'director', 'registrar']), parentController.approveLink);

// Direct link parent to student (POST version for frontend compatibility)
router.post('/link', verifyToken, verifyRole(['admin', 'dod', 'accountant']), async (req, res) => {
    try {
        const { student_id, parent_id, relationship, send_sms } = req.body;
        if (!student_id || !parent_id) {
            return res.status(400).json({ message: 'student_id and parent_id are required' });
        }

        const db = require('../db');

        // Check if link already exists
        const [existing] = await db.query(
            'SELECT id FROM parent_student_links WHERE parent_id = ? AND student_id = ?',
            [parent_id, student_id]
        );

        if (existing.length > 0) {
            // Update existing link
            await db.query(
                'UPDATE parent_student_links SET status = "approved", relationship = ? WHERE id = ?',
                [relationship || 'parent', existing[0].id]
            );
            return res.json({ message: 'Link updated successfully' });
        }

        // Create new link
        await db.query(
            'INSERT INTO parent_student_links (parent_id, student_id, relationship, status) VALUES (?, ?, ?, "approved")',
            [parent_id, student_id, relationship || 'parent']
        );

        // Send SMS notification to parent if enabled (default: true)
        if (send_sms !== false) {
            try {
                // Get parent and student details for SMS
                const [parentResult] = await db.query(
                    'SELECT first_name, phone FROM users WHERE id = ?',
                    [parent_id]
                );
                const [studentResult] = await db.query(
                    'SELECT first_name, last_name, reg_number, trade, level FROM students WHERE id = ?',
                    [student_id]
                );

                if (parentResult.length > 0 && studentResult.length > 0) {
                    const parent = parentResult[0];
                    const student = studentResult[0];

                    // Format phone number
                    let phone = parent.phone;
                    if (phone && !phone.startsWith('+')) {
                        phone = phone.startsWith('0') ? `+250${phone.slice(1)}` : `+250${phone}`;
                    }

                    // Send SMS
                    const message = `Murakaza neza! ${parent.first_name}, uri kugize umubyeyi w'umwana ${student.first_name} ${student.last_name} muri Garden TVET School. ${student.trade} - ${student.level}. Nimero y'ibregistrement: ${student.reg_number}.`;

                    const smsService = require('../utils/smsService');
                    smsService.sendSMS(phone, message).catch(err => console.error('SMS error:', err));
                }
            } catch (smsErr) {
                console.error('Error sending SMS notification:', smsErr);
                // Don't fail the main operation if SMS fails
            }
        }

        res.status(201).json({ message: 'Parent linked to student successfully' });
    } catch (err) {
        console.error('Error linking parent:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Admin: pending direct links
router.get('/pending-links', verifyToken, verifyRole(staffRoles), parentController.getPendingLinks);

// All staff: get all approved links
router.get('/linked-students', verifyToken, verifyRole(staffRoles), parentController.getAllLinkedStudents);

// All staff: unlink parent from student
router.delete('/unlink/:id', verifyToken, verifyRole(staffRoles), parentController.unlinkParentStudent);

// Delete a parent (admin only)
router.delete('/:id', verifyToken, verifyRole(['admin']), parentController.deleteParent);

// Get all parents (for staff)
router.get('/', verifyToken, verifyRole(staffRoles), async (req, res) => {
    try {
        const { search, phone } = req.query;
        let query = 'SELECT id, first_name, last_name, email, phone, created_at FROM users WHERE role = "parent"';
        const params = [];

        if (search) {
            query += ' AND (first_name LIKE ? OR last_name LIKE ? OR phone LIKE ? OR email LIKE ?)';
            const searchPattern = `%${search}%`;
            params.push(searchPattern, searchPattern, searchPattern, searchPattern);
        }

        if (phone) {
            query += ' AND phone LIKE ?';
            params.push(`%${phone}%`);
        }

        query += ' ORDER BY created_at DESC';

        const db = require('../db');
        const [parents] = await db.execute(query, params);
        res.json(parents);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Find parent by phone (for linking from applications)
router.get('/find', verifyToken, verifyRole(staffRoles), async (req, res) => {
    try {
        const { phone } = req.query;
        if (!phone) return res.status(400).json({ message: 'Phone is required' });

        const [parents] = await require('../db').execute(
            'SELECT id, first_name, last_name, email, phone FROM users WHERE role = "parent" AND phone LIKE ? LIMIT 1',
            [`%${phone}%`]
        );

        if (parents.length === 0) {
            return res.status(404).json({ message: 'Parent not found' });
        }
        res.json(parents);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get parents linked to a specific student
router.get('/student/:studentId', verifyToken, verifyRole(staffRoles), parentController.getParentsByStudent);

// Get parents who applied for a specific trade/level (and optionally gender)
// Returns: applications, pending link-requests, eligible enrolled students, and already-linked parents
router.get('/by-trade-level', verifyToken, verifyRole(staffRoles), async (req, res) => {
    try {
        const { trade, level, gender } = req.query;

        if (!trade || !level) {
            return res.status(400).json({ message: 'Trade and level are required' });
        }

        const db = require('../db');

        // 1) Approved applications matching trade/level (+ optional gender)
        let appQuery = `
            SELECT DISTINCT
                a.id as application_id,
                a.phone as phone,
                a.first_name as applicant_first,
                a.last_name as applicant_last,
                a.gender,
                a.trade,
                a.level,
                a.status as application_status,
                a.applied_at,
                u.id as parent_id,
                u.first_name as parent_first_name,
                u.last_name as parent_last_name
            FROM applications a
            LEFT JOIN users u ON u.phone = a.phone AND u.role = 'parent'
            WHERE a.trade = ? AND a.level = ? AND a.status = 'approved'`;
        const appParams = [trade, level];
        if (gender) { appQuery += ' AND a.gender = ?'; appParams.push(gender); }
        appQuery += ' ORDER BY a.applied_at DESC';
        const [applications] = await db.execute(appQuery, appParams);

        // 2) Pending parent link requests for this cohort
        const [linkRequests] = await db.execute(
            `SELECT
                lr.id as request_id,
                lr.student_name,
                lr.student_trade,
                lr.student_level,
                lr.status as request_status,
                lr.created_at,
                u.id as parent_id,
                u.first_name,
                u.last_name,
                u.phone
            FROM parent_link_requests lr
            LEFT JOIN users u ON u.id = lr.parent_id
            WHERE lr.student_trade = ? AND lr.student_level = ? AND lr.status = 'pending'
            ORDER BY lr.created_at DESC`,
            [trade, level]
        );

        // 3) Enrolled students matching the cohort (so admin can directly link)
        let stuQuery = `
            SELECT id, reg_number, first_name, last_name, gender, trade, level,
                   guardian_name, guardian_phone, contact_phone, current_status
            FROM students
            WHERE trade = ? AND level = ?`;
        const stuParams = [trade, level];
        if (gender) { stuQuery += ' AND gender = ?'; stuParams.push(gender); }
        stuQuery += ' ORDER BY first_name, last_name';
        const [students] = await db.execute(stuQuery, stuParams);

        // 4) Parents already linked to students in this cohort
        let linkedQuery = `
            SELECT DISTINCT
                u.id as parent_id, u.first_name, u.last_name, u.phone, u.username,
                s.id as student_id, s.reg_number, s.first_name as student_first,
                s.last_name as student_last, s.gender, s.trade, s.level,
                psl.relationship, psl.status as link_status
            FROM parent_student_links psl
            JOIN users u ON u.id = psl.parent_id
            JOIN students s ON s.id = psl.student_id
            WHERE s.trade = ? AND s.level = ? AND psl.status = 'approved'`;
        const linkedParams = [trade, level];
        if (gender) { linkedQuery += ' AND s.gender = ?'; linkedParams.push(gender); }
        linkedQuery += ' ORDER BY s.first_name';
        const [linkedParents] = await db.execute(linkedQuery, linkedParams);

        res.json({
            filters: { trade, level, gender: gender || null },
            applications,
            linkRequests,
            students,
            linkedParents,
            counts: {
                applications: applications.length,
                pendingRequests: linkRequests.length,
                eligibleStudents: students.length,
                linkedParents: linkedParents.length
            }
        });
    } catch (err) {
        console.error('Error fetching parents by trade/level:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

module.exports = router;
