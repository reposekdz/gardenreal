const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOAD_BASE = path.join(__dirname, '..', 'public', 'uploads');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const folder = req.query.folder || 'general';
        const dest = path.join(UPLOAD_BASE, folder);
        fs.mkdirSync(dest, { recursive: true });
        cb(null, dest);
    },
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, unique + path.extname(file.originalname));
    }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 }, fileFilter: (req, file, cb) => file.mimetype.startsWith('image/') ? cb(null, true) : cb(new Error('Images only'), false) });

const adminOnly = [verifyToken, verifyRole(['admin'])];

// ─── SCHOOL INFO ────────────────────────────────────────────────────────────

// GET all sections
router.get('/school-info', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM school_info WHERE is_active = TRUE ORDER BY section');
        res.json(rows);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET single section
router.get('/school-info/:section', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM school_info WHERE section = ?', [req.params.section]);
        if (!rows.length) return res.status(404).json({ message: 'Section not found' });
        res.json(rows[0]);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT update section (admin)
router.put('/school-info/:section', ...adminOnly, async (req, res) => {
    try {
        const { title, subtitle, description, phone, email, address, location, map_url, opening_hours, facebook_url, twitter_url, instagram_url, youtube_url } = req.body;
        const [existing] = await db.query('SELECT id FROM school_info WHERE section = ?', [req.params.section]);
        if (existing.length === 0) {
            await db.query(
                'INSERT INTO school_info (section, title, subtitle, description, phone, email, address, location, map_url, opening_hours, facebook_url, twitter_url, instagram_url, youtube_url) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
                [req.params.section, title, subtitle, description, phone, email, address, location, map_url, opening_hours, facebook_url, twitter_url, instagram_url, youtube_url]
            );
        } else {
            await db.query(
                'UPDATE school_info SET title=?, subtitle=?, description=?, phone=?, email=?, address=?, location=?, map_url=?, opening_hours=?, facebook_url=?, twitter_url=?, instagram_url=?, youtube_url=?, updated_at=NOW() WHERE section=?',
                [title, subtitle, description, phone, email, address, location, map_url, opening_hours, facebook_url, twitter_url, instagram_url, youtube_url, req.params.section]
            );
        }
        res.json({ message: 'School info updated' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── SCHOOL STATS ────────────────────────────────────────────────────────────

// GET all stats (public)
router.get('/school-stats', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM school_stats WHERE is_active = TRUE ORDER BY display_order');
        res.json(rows);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET all stats including inactive (admin)
router.get('/school-stats/all', ...adminOnly, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM school_stats ORDER BY display_order');
        res.json(rows);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST create stat (admin)
router.post('/school-stats', ...adminOnly, async (req, res) => {
    try {
        const { stat_key, stat_value, label, icon, display_order } = req.body;
        if (!stat_key || !stat_value || !label) return res.status(400).json({ message: 'stat_key, stat_value, label required' });
        const [result] = await db.query(
            'INSERT INTO school_stats (stat_key, stat_value, label, icon, display_order) VALUES (?,?,?,?,?)',
            [stat_key, stat_value, label, icon || null, display_order || 0]
        );
        res.status(201).json({ message: 'Stat created', id: result.insertId });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT update stat (admin)
router.put('/school-stats/:id', ...adminOnly, async (req, res) => {
    try {
        const { stat_value, label, icon, display_order, is_active } = req.body;
        await db.query(
            'UPDATE school_stats SET stat_value=?, label=?, icon=?, display_order=?, is_active=? WHERE id=?',
            [stat_value, label, icon, display_order, is_active !== undefined ? is_active : true, req.params.id]
        );
        res.json({ message: 'Stat updated' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE stat (admin)
router.delete('/school-stats/:id', ...adminOnly, async (req, res) => {
    try {
        await db.query('DELETE FROM school_stats WHERE id=?', [req.params.id]);
        res.json({ message: 'Stat deleted' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── GALLERY ─────────────────────────────────────────────────────────────────

// Ensure gallery table exists
const ensureGalleryTable = async () => {
    await db.query(`
        CREATE TABLE IF NOT EXISTS gallery (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(200),
            description TEXT,
            image_url VARCHAR(500) NOT NULL,
            folder VARCHAR(100) DEFAULT 'gallery',
            category VARCHAR(100) DEFAULT 'General',
            display_order INT DEFAULT 0,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
};

// GET gallery (public)
router.get('/gallery', async (req, res) => {
    try {
        await ensureGalleryTable();
        const category = req.query.category;
        let query = 'SELECT * FROM gallery WHERE is_active = TRUE';
        const params = [];
        if (category) { query += ' AND category = ?'; params.push(category); }
        query += ' ORDER BY display_order ASC, created_at DESC';
        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET gallery all (admin)
router.get('/gallery/all', ...adminOnly, async (req, res) => {
    try {
        await ensureGalleryTable();
        const [rows] = await db.query('SELECT * FROM gallery ORDER BY display_order ASC, created_at DESC');
        res.json(rows);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST add gallery image with upload (admin)
router.post('/gallery', ...adminOnly, upload.single('image'), async (req, res) => {
    try {
        await ensureGalleryTable();
        const { title, description, category, display_order } = req.body;
        let image_url = req.body.image_url || null;
        const folder = req.query.folder || 'gallery';
        if (req.file) image_url = `/uploads/${folder}/${req.file.filename}`;
        if (!image_url) return res.status(400).json({ message: 'image_url or file required' });
        const [result] = await db.query(
            'INSERT INTO gallery (title, description, image_url, folder, category, display_order) VALUES (?,?,?,?,?,?)',
            [title || null, description || null, image_url, folder, category || 'General', display_order || 0]
        );
        res.status(201).json({ message: 'Gallery image added', id: result.insertId, image_url });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST bulk add gallery images (admin)
router.post('/gallery/bulk', ...adminOnly, upload.array('images', 20), async (req, res) => {
    try {
        await ensureGalleryTable();
        const { category } = req.body;
        const folder = req.query.folder || 'gallery';
        if (!req.files || req.files.length === 0) return res.status(400).json({ message: 'No files uploaded' });
        const values = req.files.map(f => [null, null, `/uploads/${folder}/${f.filename}`, folder, category || 'General', 0]);
        await db.query('INSERT INTO gallery (title, description, image_url, folder, category, display_order) VALUES ?', [values]);
        res.json({ message: `${req.files.length} images added`, count: req.files.length });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT update gallery item (admin)
router.put('/gallery/:id', ...adminOnly, upload.single('image'), async (req, res) => {
    try {
        const { title, description, category, display_order, is_active } = req.body;
        const folder = req.query.folder || 'gallery';
        let extra = '';
        const params = [title, description, category, display_order, is_active !== undefined ? is_active : true];
        if (req.file) { extra = ', image_url=?'; params.push(`/uploads/${folder}/${req.file.filename}`); }
        params.push(req.params.id);
        await db.query(`UPDATE gallery SET title=?, description=?, category=?, display_order=?, is_active=?${extra} WHERE id=?`, params);
        res.json({ message: 'Gallery item updated' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE gallery item (admin)
router.delete('/gallery/:id', ...adminOnly, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT image_url FROM gallery WHERE id=?', [req.params.id]);
        if (rows.length) {
            const filePath = path.join(__dirname, '..', 'public', rows[0].image_url);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
        await db.query('DELETE FROM gallery WHERE id=?', [req.params.id]);
        res.json({ message: 'Gallery item deleted' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── CONTACT MESSAGES ────────────────────────────────────────────────────────

// POST submit contact message (public)
router.post('/contact', async (req, res) => {
    try {
        const { name, email, phone, subject, message } = req.body;
        if (!name || !email || !subject || !message) return res.status(400).json({ message: 'Fill all required fields' });
        const [result] = await db.query(
            'INSERT INTO contact_messages (name, email, phone, subject, message) VALUES (?,?,?,?,?)',
            [name, email, phone || null, subject, message]
        );
        res.status(201).json({ message: 'Message sent successfully!', id: result.insertId });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET all contact messages (admin)
router.get('/contact-messages', ...adminOnly, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM contact_messages ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT mark message read (admin)
router.put('/contact-messages/:id/read', ...adminOnly, async (req, res) => {
    try {
        await db.query('UPDATE contact_messages SET is_read = TRUE WHERE id=?', [req.params.id]);
        res.json({ message: 'Marked as read' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE contact message (admin)
router.delete('/contact-messages/:id', ...adminOnly, async (req, res) => {
    try {
        await db.query('DELETE FROM contact_messages WHERE id=?', [req.params.id]);
        res.json({ message: 'Message deleted' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── LEADERSHIP ──────────────────────────────────────────────────────────────

router.get('/leadership', async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT id, first_name, last_name, role, phone FROM users WHERE role IN ('admin','dod','accountant','stock_manager') ORDER BY created_at ASC"
        );
        res.json(rows);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── HERO SLIDES WITH IMAGE UPLOAD ───────────────────────────────────────────

// POST upload image for hero slide (admin)
router.post('/hero/upload', ...adminOnly, upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const folder = req.query.folder || 'hero';
    res.json({ url: `/uploads/${folder}/${req.file.filename}` });
});

// POST upload image for trade card (admin)
router.post('/trades/upload', ...adminOnly, upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    res.json({ url: `/uploads/trade card image/${req.file.filename}` });
});

// ─── GALLERIES (for trade details page) ──────────────────────────────────────────

router.get('/student-columns', async (req, res) => {
    try {
        // Return default student columns that can be displayed in table
        const columns = [
            { key: 'reg_number', label: 'Reg Number', type: 'text', visible: true },
            { key: 'first_name', label: 'First Name', type: 'text', visible: true },
            { key: 'last_name', label: 'Last Name', type: 'text', visible: true },
            { key: 'gender', label: 'Gender', type: 'text', visible: true },
            { key: 'trade', label: 'Trade', type: 'text', visible: true },
            { key: 'level', label: 'Level', type: 'text', visible: true },
            { key: 'current_status', label: 'Status', type: 'text', visible: true },
            { key: 'contact_phone', label: 'Phone', type: 'text', visible: true },
            { key: 'guardian_name', label: 'Guardian', type: 'text', visible: true },
            { key: 'guardian_phone', label: 'Guardian Phone', type: 'text', visible: true },
            { key: 'address_district', label: 'District', type: 'text', visible: false },
            { key: 'year_enrolled', label: 'Year', type: 'text', visible: false },
            { key: 'student_type', label: 'Type', type: 'text', visible: false },
            { key: 'created_at', label: 'Created', type: 'date', visible: false }
        ];
        res.json(columns);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── HOME PAGE CONTENT ───────────────────────────────────────────────────────────

router.get('/home', async (req, res) => {
    try {
        const db = require('../db');

        // Get hero slides - handle missing is_active column
        let slides = [];
        try {
            [slides] = await db.query('SELECT * FROM hero_slides WHERE is_active = TRUE ORDER BY order_index ASC');
        } catch (e) {
            try {
                [slides] = await db.query('SELECT * FROM hero_slides ORDER BY order_index ASC');
            } catch (e2) {
                slides = [];
            }
        }

        // Get school stats
        let stats = [];
        try {
            [stats] = await db.query('SELECT * FROM school_stats WHERE is_active = TRUE ORDER BY display_order ASC');
        } catch (e) {
            try {
                [stats] = await db.query('SELECT * FROM school_stats ORDER BY display_order ASC');
            } catch (e2) {
                stats = [];
            }
        }

        // Get latest news
        let news = [];
        try {
            [news] = await db.query('SELECT * FROM news ORDER BY created_at DESC LIMIT 3');
        } catch (e) {
            news = [];
        }

        // Get trades - handle missing is_active column
        let trades = [];
        try {
            [trades] = await db.query('SELECT * FROM trades WHERE is_active = TRUE ORDER BY name ASC');
        } catch (e) {
            try {
                [trades] = await db.query('SELECT * FROM trades ORDER BY name ASC');
            } catch (e2) {
                trades = [];
            }
        }

        // Get school info
        let aboutInfo = [];
        try {
            [aboutInfo] = await db.query("SELECT * FROM school_info WHERE section = 'about' AND is_active = TRUE");
        } catch (e) {
            try {
                [aboutInfo] = await db.query("SELECT * FROM school_info WHERE section = 'about'");
            } catch (e2) {
                aboutInfo = [];
            }
        }

        res.json({
            hero_slides: slides,
            stats: stats,
            latest_news: news,
            trades: trades,
            about: aboutInfo[0] || null
        });
    } catch (err) {
        console.error('Error fetching home content:', err);
        res.status(500).json({ message: err.message });
    }
});

// ─── GALLERIES (for trade details page) ──────────────────────────────────────────

router.get('/galleries', async (req, res) => {
    try {
        const db = require('../db');
        const { trade_name, category } = req.query;

        // Get gallery images
        let query = 'SELECT * FROM gallery WHERE is_active = TRUE';
        const params = [];

        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }

        query += ' ORDER BY display_order ASC, created_at DESC';

        const [gallery] = await db.query(query, params);
        res.json(gallery);
    } catch (err) {
        // If table doesn't exist, return empty array
        res.json([]);
    }
});

module.exports = router;
