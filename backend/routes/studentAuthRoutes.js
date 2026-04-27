// Student authentication & self-service portal.
// Students log in with their registration code (e.g. 2026/SOF/001) + password.
// Default password = last 4 digits of contact_phone (or "0000" if none).
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const SECRET = process.env.JWT_SECRET || 'supersecretgardenkey2026';

// Idempotent migration — add password fields to students table
async function init() {
    try {
        const [cols] = await db.query('SHOW COLUMNS FROM students');
        const have = cols.map(c => c.Field);
        const stmts = [];
        if (!have.includes('password_hash'))
            stmts.push("ALTER TABLE students ADD COLUMN password_hash VARCHAR(255) DEFAULT NULL");
        if (!have.includes('must_change_password'))
            stmts.push("ALTER TABLE students ADD COLUMN must_change_password TINYINT(1) DEFAULT 1");
        if (!have.includes('last_login'))
            stmts.push("ALTER TABLE students ADD COLUMN last_login TIMESTAMP NULL DEFAULT NULL");
        if (!have.includes('default_password_hint'))
            stmts.push("ALTER TABLE students ADD COLUMN default_password_hint VARCHAR(20) DEFAULT NULL");
        for (const s of stmts) { await db.query(s); }

        // Backfill any students that don't yet have a password_hash
        const [missing] = await db.query(
            'SELECT id, contact_phone, reg_number FROM students WHERE password_hash IS NULL'
        );
        for (const s of missing) {
            const hint = computeDefaultPassword(s.contact_phone, s.reg_number);
            const hash = bcrypt.hashSync(hint, 10);
            await db.execute(
                'UPDATE students SET password_hash = ?, default_password_hint = ?, must_change_password = 1 WHERE id = ?',
                [hash, hint, s.id]
            );
        }
        console.log('✅ Student auth columns ready (' + missing.length + ' backfilled)');
    } catch (e) {
        console.error('student-auth init:', e.message);
    }
}

function computeDefaultPassword(phone, reg) {
    const p = String(phone || '').replace(/\D/g, '');
    if (p.length >= 4) return p.slice(-4);
    const r = String(reg || '').replace(/\D/g, '');
    if (r.length >= 4) return r.slice(-4);
    return '0000';
}

init();

// Middleware
function studentOnly(req, res, next) {
    let token = req.headers['authorization'] || '';
    if (token.startsWith('Bearer ')) token = token.slice(7);
    if (!token) return res.status(401).json({ message: 'Injira mbere' });
    try {
        const decoded = jwt.verify(token, SECRET);
        if (decoded.role !== 'student' || !decoded.studentId) {
            return res.status(403).json({ message: 'Iyi konti si iy\'umunyeshuri' });
        }
        req.student = decoded;
        next();
    } catch (e) {
        return res.status(401).json({ message: 'Token sibyo' });
    }
}

// POST /api/student-auth/login
router.post('/login', async (req, res) => {
    try {
        const code = String(req.body.code || req.body.username || '').trim();
        const password = String(req.body.password || '');
        if (!code || !password) {
            return res.status(400).json({ message: 'Andika kode n\'ijambobanga' });
        }

        const [rows] = await db.execute(
            `SELECT id, reg_number, first_name, last_name, trade, level, gender,
                    contact_phone, contact_email, current_status, conduct_points,
                    gpa, attendance_rate, year_enrolled, password_hash, must_change_password
             FROM students WHERE reg_number = ? LIMIT 1`,
            [code]
        );
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Kode y\'umunyeshuri ntiboneka' });
        }
        const s = rows[0];
        if (!s.password_hash) {
            return res.status(401).json({ message: 'Konti ntiramara gushyirwaho ijambobanga. Hamagara ubuyobozi.' });
        }
        if (!bcrypt.compareSync(password, s.password_hash)) {
            return res.status(401).json({ message: 'Ijambobanga sibyo' });
        }

        await db.execute('UPDATE students SET last_login = NOW() WHERE id = ?', [s.id]);

        const token = jwt.sign(
            {
                role: 'student',
                studentId: s.id,
                id: s.id,
                reg_number: s.reg_number,
                first_name: s.first_name,
                last_name: s.last_name
            },
            SECRET
        );

        res.json({
            accessToken: token,
            id: s.id,
            role: 'student',
            reg_number: s.reg_number,
            first_name: s.first_name,
            last_name: s.last_name,
            trade: s.trade,
            level: s.level,
            gender: s.gender,
            phone: s.contact_phone,
            email: s.contact_email,
            current_status: s.current_status,
            conduct_points: s.conduct_points,
            gpa: s.gpa,
            attendance_rate: s.attendance_rate,
            year_enrolled: s.year_enrolled,
            must_change_password: !!s.must_change_password
        });
    } catch (e) {
        console.error('student login:', e);
        res.status(500).json({ message: 'Ikibazo cya server' });
    }
});

// GET /api/student-auth/me — full portal data
router.get('/me', studentOnly, async (req, res) => {
    try {
        const sid = req.student.studentId;

        const [profileRows] = await db.execute(
            `SELECT s.id, s.reg_number, s.first_name, s.last_name, s.trade, s.level,
                    s.gender, s.contact_phone, s.contact_email, s.current_status,
                    s.conduct_points, s.gpa, s.attendance_rate, s.year_enrolled,
                    s.guardian_name, s.guardian_phone, s.guardian_relation,
                    s.address_province, s.address_district, s.address_sector,
                    s.address_cell, s.address_village, s.date_of_birth,
                    s.student_type, s.created_at, s.last_login,
                    s.must_change_password
             FROM students s WHERE s.id = ?`,
            [sid]
        );
        if (profileRows.length === 0) return res.status(404).json({ message: 'Konti ntiboneka' });
        const profile = profileRows[0];

        // Grades
        let grades = [];
        try {
            const [g] = await db.execute(
                `SELECT id, subject, term, academic_year, grade_type, score, max_score,
                        percentage, grade_letter, notes, created_at
                 FROM student_grades WHERE student_id = ? ORDER BY created_at DESC LIMIT 200`,
                [sid]
            );
            grades = g;
        } catch {}

        // Exam results (older table)
        let examResults = [];
        try {
            const [e] = await db.execute(
                `SELECT id, subject, exam_type, score, max_score, term, year, created_at
                 FROM exam_results WHERE student_id = ? ORDER BY created_at DESC LIMIT 100`,
                [sid]
            );
            examResults = e;
        } catch {}

        // Attendance summary (last 90 days)
        let attendance = { present: 0, absent: 0, late: 0, excused: 0, recent: [] };
        try {
            const [counts] = await db.execute(
                `SELECT status, COUNT(*) AS c
                 FROM attendance
                 WHERE student_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
                 GROUP BY status`,
                [sid]
            );
            counts.forEach(r => { attendance[r.status] = Number(r.c); });
            const [recent] = await db.execute(
                `SELECT date, status, notes FROM attendance
                 WHERE student_id = ? ORDER BY date DESC LIMIT 30`,
                [sid]
            );
            attendance.recent = recent;
        } catch {}

        // Fees + payments
        let fees = [];
        let paid = 0;
        let owed = 0;
        try {
            const [feeRows] = await db.execute(
                `SELECT id, term, amount, description, due_date, student_category
                 FROM fees
                 WHERE trade = ? AND level = ? AND is_active = 1
                   AND (student_category = 'both' OR student_category = ?)
                 ORDER BY created_at DESC`,
                [profile.trade, profile.level, profile.student_type || 'private']
            );
            fees = feeRows;
            const [payRows] = await db.execute(
                `SELECT id, fee_id, amount_paid, payment_date, payment_method,
                        transaction_ref, payment_status, receipt_number, notes
                 FROM payments WHERE student_id = ? ORDER BY payment_date DESC`,
                [sid]
            );
            paid = payRows.reduce((sum, p) => sum + Number(p.amount_paid || 0), 0);
            const totalFees = fees.reduce((s, f) => s + Number(f.amount || 0), 0);
            owed = Math.max(0, totalFees - paid);
            fees = fees.map(f => ({
                ...f,
                payments: payRows.filter(p => p.fee_id === f.id)
            }));
            profile.fees_paid = paid;
            profile.fees_owed = owed;
            profile.payments = payRows;
        } catch {}

        // Discipline / conduct records
        let conductRecords = [];
        try {
            const [d] = await db.execute(
                `SELECT id, action_type, description, severity, incident_date,
                        location, points_deducted, status, created_at
                 FROM discipline_records WHERE student_id = ? ORDER BY incident_date DESC LIMIT 50`,
                [sid]
            );
            conductRecords = d;
        } catch {}

        // Notifications targeted at student via parents (best-effort)
        let notifications = [];
        try {
            const [n] = await db.execute(
                `SELECT id, type, title, message, created_at, is_read
                 FROM notifications
                 WHERE related_id = ? AND (related_type = 'student' OR target_role = 'student')
                 ORDER BY created_at DESC LIMIT 30`,
                [sid]
            );
            notifications = n;
        } catch {}

        res.json({
            profile,
            grades,
            exam_results: examResults,
            attendance,
            fees,
            conduct_records: conductRecords,
            notifications
        });
    } catch (e) {
        console.error('student me:', e);
        res.status(500).json({ message: 'Ikibazo cya server' });
    }
});

// POST /api/student-auth/change-password
router.post('/change-password', studentOnly, async (req, res) => {
    try {
        const { current_password, new_password } = req.body || {};
        if (!new_password || String(new_password).length < 4) {
            return res.status(400).json({ message: 'Ijambobanga rishya rigomba kuba ririmo nibura inyuguti 4' });
        }
        const [rows] = await db.execute(
            'SELECT password_hash FROM students WHERE id = ?',
            [req.student.studentId]
        );
        if (rows.length === 0) return res.status(404).json({ message: 'Konti ntiboneka' });
        if (!bcrypt.compareSync(String(current_password || ''), rows[0].password_hash)) {
            return res.status(401).json({ message: 'Ijambobanga rya kera sibyo' });
        }
        const newHash = bcrypt.hashSync(String(new_password), 10);
        await db.execute(
            'UPDATE students SET password_hash = ?, must_change_password = 0, default_password_hint = NULL WHERE id = ?',
            [newHash, req.student.studentId]
        );
        res.json({ message: 'Ijambobanga rihinduwe neza' });
    } catch (e) {
        console.error('change password:', e);
        res.status(500).json({ message: 'Ikibazo cya server' });
    }
});

module.exports = router;
module.exports.computeDefaultPassword = computeDefaultPassword;
