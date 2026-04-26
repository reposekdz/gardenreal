const db = require('../db');
const path = require('path');

// Get all published news with images
const getNews = async (req, res) => {
    try {
        const [news] = await db.query('SELECT * FROM news WHERE is_published = TRUE ORDER BY created_at DESC');

        // Get images for each news (only if table exists)
        try {
            for (const n of news) {
                const [images] = await db.query(
                    'SELECT * FROM news_images WHERE news_id = ? ORDER BY display_order ASC, is_primary DESC',
                    [n.id]
                );
                n.images = images || [];
                n.image_url = n.image_url || (images?.length > 0 ? images[0].image_url : null);
            }
        } catch (imgErr) {
            // news_images table might not exist yet
            console.log('news_images table not available:', imgErr.message);
            news.forEach(n => n.images = []);
        }

        res.json(news);
    } catch (error) {
        console.error('getNews error:', error);
        res.status(500).json({ message: 'Error fetching news: ' + error.message });
    }
};

// Get single news by ID with images
const getNewsById = async (req, res) => {
    try {
        const { id } = req.params;
        const [news] = await db.query('SELECT * FROM news WHERE id = ?', [id]);

        if (news.length === 0) {
            return res.status(404).json({ message: 'News not found' });
        }

        const n = news[0];

        // Get images (only if table exists)
        try {
            const [images] = await db.query(
                'SELECT * FROM news_images WHERE news_id = ? ORDER BY display_order ASC, is_primary DESC',
                [id]
            );
            n.images = images || [];
        } catch (imgErr) {
            console.log('news_images table not available:', imgErr.message);
            n.images = [];
        }

        // Increment view count (only if column exists)
        try {
            await db.query('UPDATE news SET view_count = view_count + 1 WHERE id = ?', [id]);
        } catch (vcErr) {
            // view_count column might not exist
        }

        res.json(n);
    } catch (error) {
        console.error('getNewsById error:', error);
        res.status(500).json({ message: 'Error fetching news: ' + error.message });
    }
};

// Admin: Get all news (published & unpublished) with images
const getAllNews = async (req, res) => {
    try {
        const [news] = await db.query('SELECT * FROM news ORDER BY created_at DESC');

        // Get images for each news (only if table exists)
        try {
            for (const n of news) {
                const [images] = await db.query(
                    'SELECT * FROM news_images WHERE news_id = ? ORDER BY display_order ASC, is_primary DESC',
                    [n.id]
                );
                n.images = images || [];
            }
        } catch (imgErr) {
            console.log('news_images table not available:', imgErr.message);
            news.forEach(n => n.images = []);
        }

        res.json(news);
    } catch (error) {
        console.error('getAllNews error:', error);
        res.status(500).json({ message: 'Error fetching all news: ' + error.message });
    }
};

// Admin: Create news with multiple images
const createNews = async (req, res) => {
    const { title_rw, title_en, content_rw, content_en, summary, category, is_published, is_featured, location, video_url } = req.body;
    const author_id = req.user.userId;

    // Handle multiple images from req.files
    const images = req.files || [];

    try {
        // Create main image from first file if exists
        let mainImageUrl = null;
        if (images.length > 0) {
            mainImageUrl = `/uploads/${images[0].filename}`;
        }

        // Try full query first, fallback to basic if columns missing
        let result;
        try {
            [result] = await db.query(
                `INSERT INTO news (title_rw, title_en, content_rw, content_en, summary, category, image_url, is_published, is_featured, location, video_url, author_id) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [title_rw, title_en, content_rw, content_en, summary || '', category || 'announcement', mainImageUrl, is_published === 'true' || is_published === true, is_featured === 'true' || is_featured === true, location || '', video_url || '', author_id]
            );
        } catch (colErr) {
            // Fallback to basic columns
            [result] = await db.query(
                `INSERT INTO news (title_rw, title_en, content_rw, content_en, image_url, is_published, author_id) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [title_rw, title_en, content_rw, content_en, mainImageUrl, is_published === 'true' || is_published === true, author_id]
            );
        }

        const newsId = result.insertId;

        // Save multiple images (only if table exists)
        try {
            for (let i = 0; i < images.length; i++) {
                const img = images[i];
                await db.query(
                    'INSERT INTO news_images (news_id, image_url, display_order, is_primary) VALUES (?, ?, ?, ?)',
                    [newsId, `/uploads/${img.filename}`, i, i === 0]
                );
            }
        } catch (imgErr) {
            console.log('Could not save images:', imgErr.message);
        }

        res.status(201).json({ message: 'News created successfully', id: newsId });
    } catch (error) {
        console.error('createNews error:', error);
        res.status(500).json({ message: 'Error creating news: ' + error.message });
    }
};

// Admin: Update news with multiple images
const updateNews = async (req, res) => {
    const { id } = req.params;
    const { title_rw, title_en, title_fr, content_rw, content_en, content_fr, summary, category, is_published, is_featured, location, video_url, existing_images, delete_images } = req.body;

    const images = req.files || [];

    try {
        // Handle image deletions
        if (delete_images) {
            const imagesToDelete = delete_images.split(',').filter(Boolean);
            for (const imgId of imagesToDelete) {
                await db.query('DELETE FROM news_images WHERE id = ?', [imgId]);
            }
        }

        // Add new images
        for (let i = 0; i < images.length; i++) {
            const img = images[i];
            await db.query(
                'INSERT INTO news_images (news_id, image_url, display_order) VALUES (?, ?, ?)',
                [id, `/uploads/${img.filename}`, 100 + i]
            );
        }

        // Get first image as main
        const [currentImages] = await db.query('SELECT image_url FROM news_images WHERE news_id = ? ORDER BY display_order ASC LIMIT 1', [id]);
        const mainImageUrl = currentImages.length > 0 ? currentImages[0].image_url : null;

        let query = `UPDATE news SET title_rw = ?, title_en = ?, title_fr = ?, content_rw = ?, content_en = ?, content_fr = ?, 
                     summary = ?, category = ?, image_url = ?, is_published = ?, is_featured = ?, location = ?, video_url = ?`;
        let params = [title_rw, title_en, title_fr, content_rw, content_en, content_fr, summary, category, mainImageUrl,
            is_published === 'true' || is_published === true, is_featured === 'true' || is_featured === true, location, video_url];

        query += ' WHERE id = ?';
        params.push(id);

        await db.query(query, params);
        res.json({ message: 'News updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating news' });
    }
};

// Admin: Delete news (images will be deleted via CASCADE)
const deleteNews = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM news WHERE id = ?', [id]);
        res.json({ message: 'News deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting news' });
    }
};

// Admin: Add images to existing news
const addNewsImages = async (req, res) => {
    const { news_id } = req.body;
    const images = req.files || [];

    try {
        for (const img of images) {
            await db.query(
                'INSERT INTO news_images (news_id, image_url) VALUES (?, ?)',
                [news_id, `/uploads/${img.filename}`]
            );
        }
        res.json({ message: 'Images added' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error adding images' });
    }
};

// Admin: Aggregate analytics summary across all news (totals + per-article)
const getAnalyticsSummary = async (req, res) => {
    try {
        const [totals] = await db.query(`
            SELECT
                COUNT(*) as total_news,
                COALESCE(SUM(views_count), 0) as total_views,
                COALESCE(SUM(likes_count), 0) as total_likes,
                COALESCE(SUM(comments_count), 0) as total_comments,
                COALESCE(SUM(shares_count), 0) as total_shares,
                SUM(CASE WHEN is_published = 1 THEN 1 ELSE 0 END) as published_count
            FROM news
        `);

        const [perArticle] = await db.query(`
            SELECT n.id, n.title_rw, n.title_en, n.category, n.is_published, n.image_url,
                   n.created_at, n.views_count, n.likes_count, n.shares_count, n.comments_count,
                   (SELECT COUNT(DISTINCT user_id) FROM news_engagement
                    WHERE news_id = n.id AND engagement_type = 'view' AND user_id IS NOT NULL) as unique_user_views,
                   (SELECT COUNT(DISTINCT guest_session_id) FROM news_engagement
                    WHERE news_id = n.id AND engagement_type = 'view' AND guest_session_id IS NOT NULL) as unique_guest_views
            FROM news n
            ORDER BY n.created_at DESC
        `);

        const [trend] = await db.query(`
            SELECT DATE(created_at) as day,
                   SUM(engagement_type = 'view') as views,
                   SUM(engagement_type = 'like') as likes,
                   SUM(engagement_type = 'share') as shares
            FROM news_engagement
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY DATE(created_at)
            ORDER BY day ASC
        `);

        res.json({
            totals: totals[0] || {},
            articles: perArticle || [],
            trend: trend || []
        });
    } catch (error) {
        console.error('getAnalyticsSummary error:', error);
        res.status(500).json({ message: 'Error fetching analytics: ' + error.message });
    }
};

// Admin: Detailed list of who viewed a specific news article
const getNewsViewers = async (req, res) => {
    try {
        const { news_id } = req.params;
        const { limit = 100 } = req.query;

        const [viewers] = await db.query(`
            SELECT ne.id, ne.user_id, ne.guest_session_id, ne.engagement_type,
                   ne.platform, ne.ip_address, ne.created_at,
                   u.first_name, u.last_name, u.role, u.email, u.phone
            FROM news_engagement ne
            LEFT JOIN users u ON ne.user_id = u.id
            WHERE ne.news_id = ?
            ORDER BY ne.created_at DESC
            LIMIT ?
        `, [news_id, parseInt(limit)]);

        const [counts] = await db.query(`
            SELECT engagement_type, COUNT(*) as count
            FROM news_engagement
            WHERE news_id = ?
            GROUP BY engagement_type
        `, [news_id]);

        res.json({ viewers, counts });
    } catch (error) {
        console.error('getNewsViewers error:', error);
        res.status(500).json({ message: 'Error fetching viewers: ' + error.message });
    }
};

module.exports = {
    getNews,
    getNewsById,
    getAllNews,
    createNews,
    updateNews,
    deleteNews,
    addNewsImages,
    getAnalyticsSummary,
    getNewsViewers
};
