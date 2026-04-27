// Teacher self-service endpoints:
//   • Read-only students list (no add/modify)
//   • Engagement summary across the teacher's own notes (likes / reactions /
//     comments / bookmarks / raised-hand questions)
//   • Comments feed on the teacher's notes
//   • Conduct entries the teacher records (writes to discipline_records)
const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

const teacherOrAdmin = verifyRole(['teacher', 'admin']);

// ─── READ-ONLY STUDENTS ──────────────────────────────────────────────────────
router.get('/students', verifyToken, teacherOrAdmin, async (req, res) => {
    try {
        const { trade, level, status, q } = req.query;
        const where = [];
        const params = [];
        if (trade)  { where.push('s.trade = ?');           params.push(trade); }
        if (level)  { where.push('s.level = ?');           params.push(level); }
        if (status) { where.push('s.current_status = ?');  params.push(status); }
        if (q) {
            where.push('(s.first_name LIKE ? OR s.last_name LIKE ? OR s.reg_number LIKE ?)');
            params.push(`%${q}%`, `%${q}%`, `%${q}%`);
        }
        const sql = `
            SELECT s.id, s.reg_number, s.first_name, s.last_name, s.trade, s.level,
                   s.gender, s.contact_phone, s.current_status, s.conduct_points,
                   s.gpa, s.attendance_rate, s.year_enrolled
            FROM students s
            ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
            ORDER BY s.trade, s.level, s.last_name, s.first_name
            LIMIT 1000
        `;
        const [rows] = await db.execute(sql, params);
        res.json(rows);
    } catch (e) {
        console.error('teacher students:', e);
        res.status(500).json({ message: 'Failed to load students' });
    }
});

// ─── CONDUCT ─────────────────────────────────────────────────────────────────
router.post('/conduct', verifyToken, teacherOrAdmin, async (req, res) => {
    try {
        const {
            student_id, action_type, description, severity,
            location, points_deducted, incident_date, witness_names
        } = req.body;
        if (!student_id || !action_type || !description) {
            return res.status(400).json({ message: 'Uzuza umunyeshuri, ubwoko n\'ibisobanuro' });
        }

        const [result] = await db.execute(
            `INSERT INTO discipline_records
             (student_id, action_type, description, severity, incident_date, location,
              witness_names, evidence_files, recorded_by, follow_up_required, points_deducted)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                student_id, action_type, String(description).slice(0, 4000),
                severity || 'low', incident_date || new Date(), location || null,
                witness_names || null, JSON.stringify([]), req.user.id, false,
                Number(points_deducted) || 0
            ]
        );

        // Deduct conduct points if applicable
        if (Number(points_deducted) > 0) {
            const [[stu]] = await db.query('SELECT conduct_points FROM students WHERE id = ?', [student_id]);
            const before = Number(stu?.conduct_points ?? 100);
            const after = Math.max(0, before - Number(points_deducted));
            await db.execute('UPDATE students SET conduct_points = ? WHERE id = ?', [after, student_id]);
        }

        res.status(201).json({ message: 'Imyitwarire yanditswe neza', id: result.insertId });
    } catch (e) {
        console.error('teacher conduct add:', e);
        res.status(500).json({ message: 'Failed to record conduct' });
    }
});

router.get('/conduct', verifyToken, teacherOrAdmin, async (req, res) => {
    try {
        const onlyMine = req.user.role === 'teacher';
        const params = [];
        let whereClause = '';
        if (onlyMine) { whereClause = 'WHERE d.recorded_by = ?'; params.push(req.user.id); }

        const sql = `
            SELECT d.id, d.action_type, d.description, d.severity, d.incident_date,
                   d.location, d.points_deducted, d.status, d.parent_notified, d.created_at,
                   s.id AS student_id, s.reg_number, s.first_name, s.last_name,
                   s.trade, s.level, s.conduct_points
            FROM discipline_records d
            LEFT JOIN students s ON d.student_id = s.id
            ${whereClause}
            ORDER BY d.created_at DESC
            LIMIT 500
        `;
        const [rows] = await db.execute(sql, params);
        res.json(rows);
    } catch (e) {
        console.error('teacher conduct list:', e);
        res.status(500).json({ message: 'Failed to load conduct records' });
    }
});

// ─── ENGAGEMENT SUMMARY ──────────────────────────────────────────────────────
// Aggregated view of likes / reactions / comments / bookmarks / raised-hand
// questions across notes uploaded by this teacher.
router.get('/engagement', verifyToken, teacherOrAdmin, async (req, res) => {
    try {
        const onlyMine = req.user.role === 'teacher';
        const noteFilter = onlyMine ? 'AND n.uploaded_by = ?' : '';
        const noteParams = onlyMine ? [req.user.id] : [];

        const [perNote] = await db.execute(`
            SELECT n.id, n.title, n.trade_code, n.trade_name, n.level,
                   n.cover_image, n.view_count, n.download_count, n.created_at,
                   (SELECT COUNT(*) FROM note_comments c WHERE c.note_id = n.id) AS comment_count,
                   (SELECT COUNT(*) FROM note_reactions r WHERE r.note_id = n.id) AS reaction_count,
                   (SELECT COUNT(*) FROM note_reactions r WHERE r.note_id = n.id AND r.reaction = 'like') AS like_count,
                   (SELECT COUNT(*) FROM note_reactions r WHERE r.note_id = n.id AND r.reaction = 'helpful') AS helpful_count,
                   (SELECT COUNT(*) FROM note_reactions r WHERE r.note_id = n.id AND r.reaction = 'love') AS love_count,
                   (SELECT COUNT(*) FROM note_reactions r WHERE r.note_id = n.id AND r.reaction = 'question') AS hand_count,
                   (SELECT COUNT(*) FROM note_bookmarks b WHERE b.note_id = n.id) AS bookmark_count
            FROM course_notes n
            WHERE 1=1 ${noteFilter}
            ORDER BY n.created_at DESC
            LIMIT 200
        `, noteParams);

        // Totals
        const totals = perNote.reduce((acc, n) => {
            acc.notes        += 1;
            acc.views        += Number(n.view_count) || 0;
            acc.downloads    += Number(n.download_count) || 0;
            acc.comments     += Number(n.comment_count) || 0;
            acc.likes        += Number(n.like_count) || 0;
            acc.helpful      += Number(n.helpful_count) || 0;
            acc.love         += Number(n.love_count) || 0;
            acc.raised_hands += Number(n.hand_count) || 0;
            acc.bookmarks    += Number(n.bookmark_count) || 0;
            return acc;
        }, { notes: 0, views: 0, downloads: 0, comments: 0, likes: 0, helpful: 0, love: 0, raised_hands: 0, bookmarks: 0 });

        // Pending student questions in the teacher's trades (best effort)
        let pendingQuestions = 0;
        try {
            const [[r]] = await db.query(
                `SELECT COUNT(*) AS c FROM student_questions WHERE status = 'pending'`
            );
            pendingQuestions = Number(r?.c || 0);
        } catch {}

        res.json({ totals: { ...totals, pending_questions: pendingQuestions }, notes: perNote });
    } catch (e) {
        console.error('teacher engagement:', e);
        res.status(500).json({ message: 'Failed to load engagement' });
    }
});

// ─── COMMENTS FEED on teacher's notes ────────────────────────────────────────
router.get('/notes/comments', verifyToken, teacherOrAdmin, async (req, res) => {
    try {
        const onlyMine = req.user.role === 'teacher';
        const where = ['1=1'];
        const params = [];
        if (onlyMine) { where.push('n.uploaded_by = ?'); params.push(req.user.id); }

        const [rows] = await db.execute(`
            SELECT c.id, c.body, c.likes, c.created_at, c.commenter_role, c.commenter_name,
                   c.parent_comment_id,
                   n.id AS note_id, n.title AS note_title, n.trade_code, n.level
            FROM note_comments c
            INNER JOIN course_notes n ON n.id = c.note_id
            WHERE ${where.join(' AND ')}
            ORDER BY c.created_at DESC
            LIMIT 200
        `, params);
        res.json(rows);
    } catch (e) {
        console.error('teacher comments feed:', e);
        res.status(500).json({ message: 'Failed to load comments' });
    }
});

// ─── BOOKMARKS feed (who saved my notes) ─────────────────────────────────────
router.get('/notes/bookmarks', verifyToken, teacherOrAdmin, async (req, res) => {
    try {
        const onlyMine = req.user.role === 'teacher';
        const where = ['1=1'];
        const params = [];
        if (onlyMine) { where.push('n.uploaded_by = ?'); params.push(req.user.id); }
        const [rows] = await db.execute(`
            SELECT b.id, b.owner_name, b.created_at,
                   n.id AS note_id, n.title AS note_title, n.trade_code, n.level
            FROM note_bookmarks b
            INNER JOIN course_notes n ON n.id = b.note_id
            WHERE ${where.join(' AND ')}
            ORDER BY b.created_at DESC
            LIMIT 200
        `, params);
        res.json(rows);
    } catch (e) {
        console.error('teacher bookmarks feed:', e);
        res.status(500).json({ message: 'Failed to load bookmarks' });
    }
});

module.exports = router;
