const express = require('express');
const router = express.Router();
const newsEngagementController = require('../controllers/newsEngagementController');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

// Get engagement stats for a news article
router.get('/:news_id', newsEngagementController.getEngagementStats);

// Record a view
router.post('/:news_id/view', newsEngagementController.recordView);

// Toggle like
router.post('/:news_id/like', newsEngagementController.toggleLike);

// Get comments for a news article
router.get('/:news_id/comments', newsEngagementController.getComments);

// Add a comment (any user or guest)
router.post('/:news_id/comments', newsEngagementController.addComment);

// Delete a comment (admin only)
router.delete('/comment/:id', verifyToken, verifyRole(['admin']), newsEngagementController.deleteComment);

module.exports = router;
