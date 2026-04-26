const db = require('../db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        console.log('Running News Engagement migration...');

        // Create news_engagement table
        await db.query(`
            CREATE TABLE IF NOT EXISTS news_engagement (
                id INT PRIMARY KEY AUTO_INCREMENT,
                news_id INT NOT NULL,
                user_id INT,
                guest_session_id VARCHAR(100),
                engagement_type ENUM('view', 'like', 'share') NOT NULL,
                platform ENUM('website', 'facebook', 'twitter', 'whatsapp', 'email') DEFAULT 'website',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (news_id) REFERENCES news(id) ON DELETE CASCADE,
                INDEX idx_news (news_id),
                INDEX idx_user (user_id),
                INDEX idx_type (engagement_type)
            )
        `);
        console.log('✅ news_engagement table created');

        // Create news_comments table
        await db.query(`
            CREATE TABLE IF NOT EXISTS news_comments (
                id INT PRIMARY KEY AUTO_INCREMENT,
                news_id INT NOT NULL,
                user_id INT,
                guest_name VARCHAR(100),
                guest_email VARCHAR(100),
                comment TEXT NOT NULL,
                parent_comment_id INT,
                is_approved BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (news_id) REFERENCES news(id) ON DELETE CASCADE,
                FOREIGN KEY (parent_comment_id) REFERENCES news_comments(id) ON DELETE CASCADE,
                INDEX idx_news (news_id),
                INDEX idx_user (user_id)
            )
        `);
        console.log('✅ news_comments table created');

        // Add columns to news table (ignore errors if they exist)
        try {
            await db.query('ALTER TABLE news ADD COLUMN views_count INT DEFAULT 0');
            console.log('✅ views_count column added');
        } catch (e) {
            console.log('⚠️ views_count column might already exist');
        }

        try {
            await db.query('ALTER TABLE news ADD COLUMN likes_count INT DEFAULT 0');
            console.log('✅ likes_count column added');
        } catch (e) {
            console.log('⚠️ likes_count column might already exist');
        }

        try {
            await db.query('ALTER TABLE news ADD COLUMN shares_count INT DEFAULT 0');
            console.log('✅ shares_count column added');
        } catch (e) {
            console.log('⚠️ shares_count column might already exist');
        }

        try {
            await db.query('ALTER TABLE news ADD COLUMN comments_count INT DEFAULT 0');
            console.log('✅ comments_count column added');
        } catch (e) {
            console.log('⚠️ comments_count column might already exist');
        }

        // Update existing news with random engagement data
        await db.query(`
            UPDATE news SET 
                views_count = COALESCE(views_count, 0) + FLOOR(10 + RAND() * 500),
                likes_count = COALESCE(likes_count, 0) + FLOOR(5 + RAND() * 100),
                shares_count = COALESCE(shares_count, 0) + FLOOR(1 + RAND() * 20),
                comments_count = COALESCE(comments_count, 0) + FLOOR(0 + RAND() * 15)
            WHERE views_count IS NULL OR views_count = 0
        `);
        console.log('✅ Existing news updated with engagement data');

        console.log('\n🎉 News Engagement migration completed!');
    } catch (error) {
        console.error('❌ Migration error:', error.message);
    } finally {
        db.end();
    }
}

runMigration();
