const db = require('../db');

// Get engagement stats for news
exports.getEngagementStats = async (req, res) => {
    try {
        const { news_id } = req.params;

        const [news] = await db.query(
            'SELECT views_count, likes_count, shares_count FROM news WHERE id = ?',
            [news_id]
        );

        if (!news.length) {
            return res.status(404).json({ message: 'News not found' });
        }

        // Check if current user liked
        const user_id = req.user?.id || null;
        const guest_session_id = req.headers['x-guest-id'] || null;

        const [liked] = await db.query(
            'SELECT id FROM news_engagement WHERE news_id = ? AND (user_id = ? OR guest_session_id = ?) AND engagement_type = "like"',
            [news_id, user_id, guest_session_id]
        );

        res.json({
            views: news[0].views_count || 0,
            likes: news[0].likes_count || 0,
            shares: news[0].shares_count || 0,
            isLiked: liked.length > 0
        });
    } catch (error) {
        console.error('Error getting engagement stats:', error);
        res.status(500).json({ message: 'Failed to get engagement stats' });
    }
};

// Record a view
exports.recordView = async (req, res) => {
    try {
        const { news_id } = req.params;
        const user_id = req.user?.id || null;
        const guest_session_id = req.headers['x-guest-id'] || null;

        // Record the view engagement
        await db.query(
            'INSERT INTO news_engagement (news_id, user_id, guest_session_id, engagement_type, platform) VALUES (?, ?, ?, ?, ?)',
            [news_id, user_id, guest_session_id, 'view', 'website']
        );

        // Update views count
        await db.query('UPDATE news SET views_count = views_count + 1 WHERE id = ?', [news_id]);

        res.json({ success: true, message: 'View recorded' });
    } catch (error) {
        console.error('Error recording view:', error);
        res.status(500).json({ message: 'Failed to record view' });
    }
};

// Toggle like
exports.toggleLike = async (req, res) => {
    try {
        const { news_id } = req.params;
        const user_id = req.user?.id || null;
        const guest_session_id = req.headers['x-guest-id'] || `guest_${Date.now()}`;

        // Check for existing like
        const [existing] = await db.query(
            'SELECT id FROM news_engagement WHERE news_id = ? AND (user_id = ? OR guest_session_id = ?) AND engagement_type = "like"',
            [news_id, user_id, guest_session_id]
        );

        if (existing.length > 0) {
            // Unlike (remove like)
            await db.query(
                'DELETE FROM news_engagement WHERE news_id = ? AND (user_id = ? OR guest_session_id = ?) AND engagement_type = "like"',
                [news_id, user_id, guest_session_id]
            );
            await db.query('UPDATE news SET likes_count = likes_count - 1 WHERE id = ?', [news_id]);

            const [[{ likes_count }]] = await db.query('SELECT likes_count FROM news WHERE id = ?', [news_id]);

            return res.json({ liked: false, likes: likes_count || 0 });
        } else {
            // Add like
            await db.query(
                'INSERT INTO news_engagement (news_id, user_id, guest_session_id, engagement_type, platform) VALUES (?, ?, ?, ?, ?)',
                [news_id, user_id, guest_session_id, 'like', 'website']
            );
            await db.query('UPDATE news SET likes_count = likes_count + 1 WHERE id = ?', [news_id]);

            const [[{ likes_count }]] = await db.query('SELECT likes_count FROM news WHERE id = ?', [news_id]);

            return res.json({ liked: true, likes: likes_count || 0 });
        }
    } catch (error) {
        console.error('Error toggling like:', error);
        res.status(500).json({ message: 'Failed to toggle like' });
    }
};

// Record engagement (view, like, share)
exports.recordEngagement = async (req, res) => {
    try {
        const { news_id, engagement_type, platform } = req.body;
        const user_id = req.user?.id || null;
        const guest_session_id = req.headers['x-guest-id'] || null;

        if (!news_id || !engagement_type) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Check for duplicate like from same user/guest
        if (engagement_type === 'like') {
            const existing = await db.query(
                'SELECT id FROM news_engagement WHERE news_id = ? AND (user_id = ? OR guest_session_id = ?) AND engagement_type = "like"',
                [news_id, user_id, guest_session_id]
            );

            if (existing.length > 0) {
                // Unlike (remove like)
                await db.query(
                    'DELETE FROM news_engagement WHERE news_id = ? AND (user_id = ? OR guest_session_id = ?) AND engagement_type = "like"',
                    [news_id, user_id, guest_session_id]
                );
                await db.query('UPDATE news SET likes_count = likes_count - 1 WHERE id = ?', [news_id]);
                return res.json({ liked: false, message: 'Like removed' });
            }
        }

        // Record engagement
        await db.query(
            'INSERT INTO news_engagement (news_id, user_id, guest_session_id, engagement_type, platform) VALUES (?, ?, ?, ?, ?)',
            [news_id, user_id, guest_session_id, engagement_type, platform || 'website']
        );

        // Update news counters
        const updateField = engagement_type === 'view' ? 'views_count' :
            engagement_type === 'like' ? 'likes_count' : 'shares_count';
        await db.query(`UPDATE news SET ${updateField} = ${updateField} + 1 WHERE id = ?`, [news_id]);

        res.json({
            success: true,
            liked: engagement_type === 'like' ? true : null,
            message: `${engagement_type} recorded`
        });
    } catch (error) {
        console.error('Error recording engagement:', error);
        res.status(500).json({ message: 'Failed to record engagement' });
    }
};

// Get comments for news
exports.getComments = async (req, res) => {
    try {
        const { news_id } = req.params;
        const { page = 1, limit = 50 } = req.query;

        const offset = (page - 1) * limit;

        const comments = await db.query(
            `SELECT c.*, u.first_name as user_first_name, u.last_name as user_last_name, u.role as user_role
             FROM news_comments c
             LEFT JOIN users u ON c.user_id = u.id
             WHERE c.news_id = ? AND c.is_approved = TRUE AND c.parent_comment_id IS NULL
             ORDER BY c.created_at DESC
             LIMIT ? OFFSET ?`,
            [news_id, parseInt(limit), offset]
        );

        // Get replies for each comment
        for (const comment of comments) {
            const replies = await db.query(
                `SELECT c.*, u.first_name as user_first_name, u.last_name as user_last_name, u.role as user_role
                 FROM news_comments c
                 LEFT JOIN users u ON c.user_id = u.id
                 WHERE c.parent_comment_id = ? AND c.is_approved = TRUE
                 ORDER BY c.created_at ASC`,
                [comment.id]
            );
            comment.replies = replies;
        }

        const [[{ total }]] = await db.query(
            'SELECT COUNT(*) as total FROM news_comments WHERE news_id = ? AND is_approved = TRUE AND parent_comment_id IS NULL',
            [news_id]
        );

        res.json(comments);
    } catch (error) {
        console.error('Error getting comments:', error);
        res.status(500).json({ message: 'Failed to get comments' });
    }
};

// Add comment
exports.addComment = async (req, res) => {
    try {
        const { news_id } = req.params;
        const { content, authorName, parent_comment_id } = req.body;
        const user_id = req.user?.id || null;

        if (!content) {
            return res.status(400).json({ message: 'Comment content is required' });
        }

        const guest_name = authorName || 'Anonymous';

        const result = await db.query(
            'INSERT INTO news_comments (news_id, user_id, guest_name, comment, parent_comment_id) VALUES (?, ?, ?, ?, ?)',
            [news_id, user_id, guest_name, content, parent_comment_id || null]
        );

        // Update comments count
        await db.query('UPDATE news SET comments_count = comments_count + 1 WHERE id = ?', [news_id]);

        // Return the new comment
        const [newComment] = await db.query('SELECT * FROM news_comments WHERE id = ?', [result.insertId]);

        res.status(201).json(newComment[0]);
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ message: 'Failed to add comment' });
    }
};

// Delete comment (admin only)
exports.deleteComment = async (req, res) => {
    try {
        const { id } = req.params;

        // Get comment to find news_id
        const [comment] = await db.query('SELECT news_id FROM news_comments WHERE id = ?', [id]);

        if (!comment.length) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        await db.query('DELETE FROM news_comments WHERE id = ? OR parent_comment_id = ?', [id, id]);

        // Update comments count
        await db.query('UPDATE news SET comments_count = comments_count - 1 WHERE id = ?', [comment[0].news_id]);

        res.json({ message: 'Comment deleted' });
    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({ message: 'Failed to delete comment' });
    }
};
