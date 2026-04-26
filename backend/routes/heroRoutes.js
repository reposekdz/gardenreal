const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

const heroUploadDir = path.join(__dirname, '..', 'public', 'uploads', 'hero');
fs.mkdirSync(heroUploadDir, { recursive: true });
const heroStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, heroUploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname))
});
const heroUpload = multer({ storage: heroStorage, limits: { fileSize: 10 * 1024 * 1024 }, fileFilter: (req, file, cb) => file.mimetype.startsWith('image/') ? cb(null, true) : cb(new Error('Images only'), false) });

// Get all active hero slides (public)
router.get('/', async (req, res) => {
    try {
        const [slides] = await db.execute(
            'SELECT * FROM hero_slides WHERE is_active = TRUE ORDER BY order_index ASC'
        );
        res.json(slides);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all hero slides (admin)
router.get('/all', [verifyToken, verifyRole(['admin'])], async (req, res) => {
    try {
        const [slides] = await db.execute(
            'SELECT * FROM hero_slides ORDER BY order_index ASC'
        );
        res.json(slides);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Upload image for hero slide (admin)
router.post('/upload-image', [verifyToken, verifyRole(['admin'])], heroUpload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    res.json({ url: `/uploads/hero/${req.file.filename}` });
});

// Create hero slide (admin) — supports multipart for image upload
router.post('/', [verifyToken, verifyRole(['admin'])], heroUpload.single('image'), async (req, res) => {
    try {
        let { title, subtitle, image_url, button_text, button_link, order_index, is_active } = req.body;
        if (req.file) image_url = `/uploads/hero/${req.file.filename}`;
        const [result] = await db.execute(
            'INSERT INTO hero_slides (title, subtitle, image_url, button_text, button_link, order_index, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [title, subtitle, image_url, button_text, button_link, order_index || 0, is_active !== false && is_active !== 'false']
        );
        res.status(201).json({ message: 'Slide created', id: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update hero slide (admin) — supports multipart for image upload
router.put('/:id', [verifyToken, verifyRole(['admin'])], heroUpload.single('image'), async (req, res) => {
    try {
        const { id } = req.params;
        let { title, subtitle, image_url, button_text, button_link, order_index, is_active } = req.body;
        if (req.file) image_url = `/uploads/hero/${req.file.filename}`;
        await db.execute(
            'UPDATE hero_slides SET title=?, subtitle=?, image_url=?, button_text=?, button_link=?, order_index=?, is_active=? WHERE id=?',
            [title, subtitle, image_url, button_text, button_link, order_index, is_active !== false && is_active !== 'false', id]
        );
        res.json({ message: 'Slide updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete hero slide (admin)
router.delete('/:id', [verifyToken, verifyRole(['admin'])], async (req, res) => {
    try {
        const { id } = req.params;

        await db.execute('DELETE FROM hero_slides WHERE id = ?', [id]);

        res.json({ message: 'Slide deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
