const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('../db');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

const NOTES_DIR = path.join(__dirname, '..', 'public', 'uploads', 'course-notes');
const COVERS_DIR = path.join(__dirname, '..', 'public', 'uploads', 'course-covers');
fs.mkdirSync(NOTES_DIR, { recursive: true });
fs.mkdirSync(COVERS_DIR, { recursive: true });

const TRADES = {
    auto: {
        code: 'auto',
        name: 'Automobile Technology',
        name_rw: 'Ubuhanga bw\u2019Imodoka',
        levels: ['Level 3', 'Level 4', 'Level 5'],
        icon: 'car',
        color: 'from-blue-500 to-blue-700'
    },
    bdc: {
        code: 'bdc',
        name: 'Building and Construction',
        name_rw: 'Ubwubatsi n\u2019Iyubakwa',
        levels: ['Level 3', 'Level 4', 'Level 5'],
        icon: 'hard-hat',
        color: 'from-amber-500 to-amber-700'
    },
    sod: {
        code: 'sod',
        name: 'Software Development',
        name_rw: 'Ikoranabuhanga (Mudasobwa)',
        levels: ['Level 3', 'Level 4', 'Level 5'],
        icon: 'code',
        color: 'from-emerald-500 to-emerald-700'
    },
    driving: {
        code: 'driving',
        name: 'Driving Rules (Amategeko Yumuhanda)',
        name_rw: 'Kwiga Gutwara Ibinyabiziga',
        levels: ['Theory (Amategeko)', 'Road Signs (Ibimenyetso)', 'Practical (Gukoresha)', 'Test Prep (Itegure ry\u2019Ikizamini)'],
        icon: 'car',
        color: 'from-rose-500 to-rose-700'
    }
};

const initCourseNotesTable = async () => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS course_notes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                trade_code VARCHAR(20) NOT NULL,
                trade_name VARCHAR(100) NOT NULL,
                level VARCHAR(50) NOT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                file_path VARCHAR(500) NOT NULL,
                file_name VARCHAR(255) NOT NULL,
                file_size INT,
                cover_image VARCHAR(500),
                view_count INT DEFAULT 0,
                download_count INT DEFAULT 0,
                uploaded_by INT,
                uploaded_by_name VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_trade_level (trade_code, level)
            )
        `);
        // Migrate existing tables
        const [cols] = await db.query("SHOW COLUMNS FROM course_notes");
        const names = cols.map(c => c.Field);
        if (!names.includes('cover_image')) {
            await db.query("ALTER TABLE course_notes ADD COLUMN cover_image VARCHAR(500) AFTER file_size");
        }
        if (!names.includes('view_count')) {
            await db.query("ALTER TABLE course_notes ADD COLUMN view_count INT DEFAULT 0");
        }
        if (!names.includes('download_count')) {
            await db.query("ALTER TABLE course_notes ADD COLUMN download_count INT DEFAULT 0");
        }
        console.log('\u2705 Course notes table ready');
    } catch (e) {
        console.error('Error creating course_notes table:', e.message);
    }
};
initCourseNotesTable();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === 'cover') return cb(null, COVERS_DIR);
        cb(null, NOTES_DIR);
    },
    filename: (req, file, cb) => {
        const safe = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + '-' + safe);
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 30 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.fieldname === 'cover') {
            if (file.mimetype.startsWith('image/')) return cb(null, true);
            return cb(new Error('Cover must be an image'), false);
        }
        if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
            return cb(null, true);
        }
        cb(new Error('Only PDF files are allowed for notes'), false);
    }
});

router.get('/trades', async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT trade_code, level, COUNT(*) AS notes_count
             FROM course_notes GROUP BY trade_code, level`
        );
        const counts = {};
        rows.forEach(r => {
            counts[r.trade_code] = counts[r.trade_code] || { total: 0, by_level: {} };
            counts[r.trade_code].total += r.notes_count;
            counts[r.trade_code].by_level[r.level] = r.notes_count;
        });
        const data = Object.values(TRADES).map(t => ({
            ...t,
            notes_count: counts[t.code]?.total || 0,
            notes_by_level: counts[t.code]?.by_level || {}
        }));
        res.json(data);
    } catch (e) {
        console.error('GET /trades error:', e);
        res.status(500).json({ message: 'Failed to load trades' });
    }
});

router.get('/trades/:code', (req, res) => {
    const trade = TRADES[req.params.code];
    if (!trade) return res.status(404).json({ message: 'Trade not found' });
    res.json(trade);
});

router.get('/', async (req, res) => {
    try {
        const { trade_code, level, q } = req.query;
        let sql = `SELECT id, trade_code, trade_name, level, title, description,
                          file_name, file_size, cover_image, view_count, download_count,
                          uploaded_by_name, created_at
                   FROM course_notes WHERE 1=1`;
        const params = [];
        if (trade_code) { sql += ' AND trade_code = ?'; params.push(trade_code); }
        if (level) { sql += ' AND level = ?'; params.push(level); }
        if (q && q.trim()) {
            sql += ' AND (title LIKE ? OR description LIKE ? OR uploaded_by_name LIKE ?)';
            const like = `%${q.trim()}%`;
            params.push(like, like, like);
        }
        sql += ' ORDER BY created_at DESC';
        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (e) {
        console.error('GET / error:', e);
        res.status(500).json({ message: 'Failed to load notes' });
    }
});

router.get('/:id/cover', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT cover_image FROM course_notes WHERE id = ?', [req.params.id]);
        if (!rows.length || !rows[0].cover_image) return res.status(404).end();
        const fullPath = path.join(COVERS_DIR, path.basename(rows[0].cover_image));
        if (!fs.existsSync(fullPath)) return res.status(404).end();
        res.sendFile(fullPath);
    } catch (e) {
        res.status(500).end();
    }
});

router.get('/:id/view', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM course_notes WHERE id = ?', [req.params.id]);
        if (!rows.length) return res.status(404).json({ message: 'Note not found' });
        const note = rows[0];
        const fullPath = path.join(NOTES_DIR, path.basename(note.file_path));
        if (!fs.existsSync(fullPath)) return res.status(404).json({ message: 'File missing' });
        await db.execute('UPDATE course_notes SET view_count = view_count + 1 WHERE id = ?', [req.params.id]);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${note.file_name}"`);
        fs.createReadStream(fullPath).pipe(res);
    } catch (e) {
        console.error('View error:', e);
        res.status(500).json({ message: 'View failed' });
    }
});

router.get('/:id/download', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM course_notes WHERE id = ?', [req.params.id]);
        if (!rows.length) return res.status(404).json({ message: 'Note not found' });
        const note = rows[0];
        const fullPath = path.join(NOTES_DIR, path.basename(note.file_path));
        if (!fs.existsSync(fullPath)) return res.status(404).json({ message: 'File missing' });
        await db.execute('UPDATE course_notes SET download_count = download_count + 1 WHERE id = ?', [req.params.id]);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${note.file_name}"`);
        fs.createReadStream(fullPath).pipe(res);
    } catch (e) {
        console.error('Download error:', e);
        res.status(500).json({ message: 'Download failed' });
    }
});

router.post(
    '/',
    [verifyToken, verifyRole(['teacher', 'admin'])],
    upload.fields([{ name: 'file', maxCount: 1 }, { name: 'cover', maxCount: 1 }]),
    async (req, res) => {
        const cleanup = () => {
            if (req.files?.file?.[0]?.path && fs.existsSync(req.files.file[0].path)) {
                try { fs.unlinkSync(req.files.file[0].path); } catch {}
            }
            if (req.files?.cover?.[0]?.path && fs.existsSync(req.files.cover[0].path)) {
                try { fs.unlinkSync(req.files.cover[0].path); } catch {}
            }
        };
        try {
            const { trade_code, level, title, description } = req.body;
            const fileEntry = req.files?.file?.[0];
            const coverEntry = req.files?.cover?.[0];
            if (!fileEntry) { cleanup(); return res.status(400).json({ message: 'PDF file is required' }); }
            const trade = TRADES[trade_code];
            if (!trade) { cleanup(); return res.status(400).json({ message: 'Invalid trade_code' }); }
            if (!trade.levels.includes(level)) { cleanup(); return res.status(400).json({ message: 'Invalid level for this trade' }); }
            if (!title || !title.trim()) { cleanup(); return res.status(400).json({ message: 'Title is required' }); }
            const teacherName = req.user.username || `User ${req.user.id}`;
            const filePath = path.basename(fileEntry.path);
            const coverPath = coverEntry ? path.basename(coverEntry.path) : null;
            const [result] = await db.execute(
                `INSERT INTO course_notes
                 (trade_code, trade_name, level, title, description, file_path, file_name, file_size, cover_image, uploaded_by, uploaded_by_name)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    trade.code, trade.name, level, title.trim(), description || null,
                    filePath, fileEntry.originalname, fileEntry.size, coverPath,
                    req.user.id, teacherName
                ]
            );
            res.status(201).json({ message: 'Note uploaded', id: result.insertId });
        } catch (e) {
            console.error('Upload error:', e);
            cleanup();
            res.status(500).json({ message: 'Upload failed' });
        }
    }
);

router.delete('/:id', [verifyToken, verifyRole(['teacher', 'admin'])], async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM course_notes WHERE id = ?', [req.params.id]);
        if (!rows.length) return res.status(404).json({ message: 'Note not found' });
        const note = rows[0];
        if (req.user.role === 'teacher' && note.uploaded_by !== req.user.id) {
            return res.status(403).json({ message: 'You can only delete your own notes' });
        }
        const fullPath = path.join(NOTES_DIR, path.basename(note.file_path));
        if (fs.existsSync(fullPath)) {
            try { fs.unlinkSync(fullPath); } catch {}
        }
        if (note.cover_image) {
            const cp = path.join(COVERS_DIR, path.basename(note.cover_image));
            if (fs.existsSync(cp)) { try { fs.unlinkSync(cp); } catch {} }
        }
        await db.execute('DELETE FROM course_notes WHERE id = ?', [req.params.id]);
        res.json({ message: 'Note deleted' });
    } catch (e) {
        console.error('Delete error:', e);
        res.status(500).json({ message: 'Delete failed' });
    }
});

module.exports = router;
module.exports.TRADES = TRADES;
