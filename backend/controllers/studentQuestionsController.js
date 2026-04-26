const db = require('../db');

const initTable = async () => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS student_questions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_name VARCHAR(150) NOT NULL,
                trade_code VARCHAR(20) NOT NULL,
                trade_name VARCHAR(120),
                level VARCHAR(80) NOT NULL,
                question TEXT NOT NULL,
                contact VARCHAR(120),
                status ENUM('pending', 'answered', 'closed') DEFAULT 'pending',
                answer TEXT,
                answered_by INT NULL,
                answered_by_name VARCHAR(150),
                answered_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_status (status),
                INDEX idx_trade (trade_code, level)
            )
        `);
        console.log('✅ Student questions table ready');
    } catch (err) {
        console.error('student_questions init failed:', err.message);
    }
};
initTable();

// Public: submit a question
exports.submit = async (req, res) => {
    try {
        const { student_name, trade_code, trade_name, level, question, contact } = req.body;
        if (!student_name || !trade_code || !level || !question) {
            return res.status(400).json({ message: 'student_name, trade_code, level, and question are required' });
        }
        if (String(question).trim().length < 5) {
            return res.status(400).json({ message: 'Question is too short' });
        }
        const [result] = await db.execute(
            `INSERT INTO student_questions (student_name, trade_code, trade_name, level, question, contact)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                String(student_name).trim().slice(0, 150),
                String(trade_code).trim().slice(0, 20),
                trade_name ? String(trade_name).slice(0, 120) : null,
                String(level).trim().slice(0, 80),
                String(question).trim().slice(0, 4000),
                contact ? String(contact).trim().slice(0, 120) : null
            ]
        );
        res.status(201).json({
            success: true,
            id: result.insertId,
            message: 'Ikibazo cyawe cyoherejwe kuri mwarimu. Murakoze!'
        });
    } catch (err) {
        console.error('submit question:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// Auth: list questions (with filters)
exports.list = async (req, res) => {
    try {
        const { status, trade_code, level, q } = req.query;
        const where = [];
        const params = [];
        if (status && ['pending', 'answered', 'closed'].includes(status)) {
            where.push('status = ?');
            params.push(status);
        }
        if (trade_code) {
            where.push('trade_code = ?');
            params.push(trade_code);
        }
        if (level) {
            where.push('level = ?');
            params.push(level);
        }
        if (q) {
            where.push('(student_name LIKE ? OR question LIKE ?)');
            params.push(`%${q}%`, `%${q}%`);
        }
        const sql = `SELECT * FROM student_questions ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY (status = 'pending') DESC, created_at DESC LIMIT 500`;
        const [rows] = await db.execute(sql, params);
        const [countRows] = await db.execute(
            `SELECT
                SUM(status = 'pending') AS pending,
                SUM(status = 'answered') AS answered,
                SUM(status = 'closed') AS closed,
                COUNT(*) AS total
             FROM student_questions`
        );
        res.json({ items: rows, counts: countRows[0] });
    } catch (err) {
        console.error('list questions:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// Auth: count of pending (for badge)
exports.pendingCount = async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT COUNT(*) AS pending FROM student_questions WHERE status = 'pending'`
        );
        res.json({ pending: rows[0]?.pending || 0 });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Auth (teacher/admin): answer a question
exports.answer = async (req, res) => {
    try {
        const { id } = req.params;
        const { answer } = req.body;
        if (!answer || String(answer).trim().length < 2) {
            return res.status(400).json({ message: 'Answer is required' });
        }
        const teacherId = req.user?.id || null;
        const teacherName = req.user
            ? [req.user.first_name, req.user.last_name].filter(Boolean).join(' ').trim() || req.user.username
            : 'Mwarimu';
        await db.execute(
            `UPDATE student_questions
             SET answer = ?, status = 'answered', answered_by = ?, answered_by_name = ?, answered_at = NOW()
             WHERE id = ?`,
            [String(answer).trim().slice(0, 4000), teacherId, teacherName, id]
        );
        const [rows] = await db.execute(`SELECT * FROM student_questions WHERE id = ?`, [id]);
        if (!rows.length) return res.status(404).json({ message: 'Not found' });
        res.json({ success: true, item: rows[0] });
    } catch (err) {
        console.error('answer question:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// Auth: close (mark resolved without answer) or reopen
exports.setStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!['pending', 'answered', 'closed'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }
        await db.execute(`UPDATE student_questions SET status = ? WHERE id = ?`, [status, id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Auth (admin/teacher): delete
exports.remove = async (req, res) => {
    try {
        const { id } = req.params;
        await db.execute(`DELETE FROM student_questions WHERE id = ?`, [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Public: list answered Q&A for a trade/level (so other students can learn from answers)
exports.publicAnswered = async (req, res) => {
    try {
        const { trade_code, level } = req.query;
        const where = [`status = 'answered'`];
        const params = [];
        if (trade_code) { where.push('trade_code = ?'); params.push(trade_code); }
        if (level) { where.push('level = ?'); params.push(level); }
        const [rows] = await db.execute(
            `SELECT id, student_name, trade_code, trade_name, level, question, answer, answered_by_name, answered_at, created_at
             FROM student_questions WHERE ${where.join(' AND ')}
             ORDER BY answered_at DESC LIMIT 200`,
            params
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};
