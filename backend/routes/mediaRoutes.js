const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

const UPLOAD_BASE = path.join(__dirname, '..', 'public', 'uploads');

// Dynamic storage — folder determined by req.body.folder or query param
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const folder = req.query.folder || req.body.folder || 'general';
        const dest = path.join(UPLOAD_BASE, folder);
        fs.mkdirSync(dest, { recursive: true });
        cb(null, dest);
    },
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, unique + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Images only'), false);
    }
});

// POST /api/media/upload?folder=hero  — upload single image
router.post('/upload', verifyToken, verifyRole(['admin']), upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const folder = req.query.folder || req.body.folder || 'general';
    const url = `/uploads/${folder}/${req.file.filename}`;
    res.json({ url, filename: req.file.filename, folder, size: req.file.size });
});

// POST /api/media/upload-multiple?folder=gallery — upload up to 20 images
router.post('/upload-multiple', verifyToken, verifyRole(['admin']), upload.array('images', 20), (req, res) => {
    if (!req.files || req.files.length === 0) return res.status(400).json({ message: 'No files uploaded' });
    const folder = req.query.folder || req.body.folder || 'general';
    const files = req.files.map(f => ({
        url: `/uploads/${folder}/${f.filename}`,
        filename: f.filename,
        size: f.size
    }));
    res.json({ files, count: files.length });
});

// GET /api/media/list?folder=hero — list all images in a folder
router.get('/list', verifyToken, verifyRole(['admin']), (req, res) => {
    const folder = req.query.folder || 'general';
    const dir = path.join(UPLOAD_BASE, folder);
    if (!fs.existsSync(dir)) return res.json({ files: [], folder });
    const exts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const files = fs.readdirSync(dir)
        .filter(f => exts.includes(path.extname(f).toLowerCase()))
        .map(f => {
            const stat = fs.statSync(path.join(dir, f));
            return { filename: f, url: `/uploads/${folder}/${f}`, size: stat.size, modified: stat.mtime };
        })
        .sort((a, b) => new Date(b.modified) - new Date(a.modified));
    res.json({ files, folder, count: files.length });
});

// GET /api/media/folders — list all upload folders
router.get('/folders', verifyToken, verifyRole(['admin']), (req, res) => {
    if (!fs.existsSync(UPLOAD_BASE)) return res.json({ folders: [] });
    const folders = fs.readdirSync(UPLOAD_BASE, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => {
            const dir = path.join(UPLOAD_BASE, d.name);
            const exts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
            const count = fs.readdirSync(dir).filter(f => exts.includes(path.extname(f).toLowerCase())).length;
            return { name: d.name, count };
        });
    res.json({ folders });
});

// DELETE /api/media/delete — delete a specific file
router.delete('/delete', verifyToken, verifyRole(['admin']), (req, res) => {
    const { folder, filename } = req.body;
    if (!folder || !filename) return res.status(400).json({ message: 'folder and filename required' });
    // Security: prevent path traversal
    const safe = path.basename(filename);
    const filePath = path.join(UPLOAD_BASE, folder, safe);
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'File not found' });
    fs.unlinkSync(filePath);
    res.json({ message: 'File deleted' });
});

module.exports = router;
