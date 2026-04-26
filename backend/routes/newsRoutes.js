const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

const upload = require('../middleware/uploadMiddleware');

// Public route: Get published news
router.get('/', newsController.getNews);

// Admin routes - must be before /:id to avoid conflicts
router.get('/all', verifyToken, verifyRole(['admin']), newsController.getAllNews);

// Admin: aggregate analytics summary
router.get('/analytics/summary', verifyToken, verifyRole(['admin']), newsController.getAnalyticsSummary);

// Admin: detailed view list per news article
router.get('/analytics/:news_id/views', verifyToken, verifyRole(['admin']), newsController.getNewsViewers);

// Public route: Get single news by ID (must be after /all)
router.get('/:id', newsController.getNewsById);

// Admin: Create news with multiple images
router.post('/', verifyToken, verifyRole(['admin']), upload.array('images', 10), newsController.createNews);

// Admin: Update news with multiple images
router.put('/:id', verifyToken, verifyRole(['admin']), upload.array('images', 10), newsController.updateNews);

// Admin: Delete news
router.delete('/:id', verifyToken, verifyRole(['admin']), newsController.deleteNews);

// Admin: Add images to existing news
router.post('/images', verifyToken, verifyRole(['admin']), upload.array('images', 10), newsController.addNewsImages);

module.exports = router;
