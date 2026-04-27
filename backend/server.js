const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const db = require('./db');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Database initialization - Create tables if they don't exist
const initDatabase = async () => {
    try {
        // Create applications table if not exists
        await db.query(`
            CREATE TABLE IF NOT EXISTS applications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                gender VARCHAR(20),
                date_of_birth DATE,
                phone VARCHAR(20) NOT NULL,
                email VARCHAR(100),
                province VARCHAR(100),
                district VARCHAR(100),
                sector VARCHAR(100),
                trade VARCHAR(100) NOT NULL,
                level VARCHAR(50) NOT NULL,
                previous_school VARCHAR(200),
                previous_sector VARCHAR(100),
                has_laptop VARCHAR(10),
                heard_from VARCHAR(100),
                motivation TEXT,
                status ENUM('pending', 'approved', 'rejected', 'waitlisted') DEFAULT 'pending',
                review_notes TEXT,
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                reviewed_at TIMESTAMP NULL
            )
        `);
        console.log('✅ Applications table ready');

        // Create trades table if not exists
        await db.query(`
            CREATE TABLE IF NOT EXISTS trades (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                icon VARCHAR(50),
                image_url VARCHAR(255),
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Trades table ready');

        // Insert default trades if table is empty
        const [existingTrades] = await db.query('SELECT COUNT(*) as count FROM trades');
        if (existingTrades[0].count === 0) {
            await db.query(`
                INSERT INTO trades (name, description, image_url) VALUES
                ('Software Development', 'Learn programming and software development skills', '/uploads/trade card image/sod.jpg'),
                ('Automobile Technology', 'Master automotive repair and maintenance', '/uploads/trade card image/auto.jpg'),
                ('Building and Construction', 'Civil engineering and construction skills', '/uploads/trade card image/bdc.jpg')
            `);
            console.log('✅ Default trades inserted');
        }

        // Create hero_slides table if not exists
        await db.query(`
            CREATE TABLE IF NOT EXISTS hero_slides (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(200) NOT NULL,
                subtitle TEXT,
                image_url VARCHAR(500) NOT NULL,
                button_text VARCHAR(100),
                button_link VARCHAR(200),
                order_index INT DEFAULT 0,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Hero slides table ready');

        // Insert default hero slides if table is empty
        const [existingSlides] = await db.query('SELECT COUNT(*) as count FROM hero_slides');
        if (existingSlides[0].count === 0) {
            await db.query(`
                INSERT INTO hero_slides (title, subtitle, image_url, button_text, button_link, order_index, is_active) VALUES
                ('Shape Your Future', 'Garden TVET School empowers you with hands-on skills and expert knowledge', '/uploads/school view/IMG-20250222-WA0013.jpg', 'Apply Now', '/apply', 1, TRUE),
                ('Learn from Experts', 'Our teachers are industry professionals with years of experience', '/uploads/school view/IMG-20250222-WA0015.jpg', 'Learn More', '/about', 2, TRUE),
                ('Build Your Career', 'Get practical skills that employers are looking for', '/uploads/school view/IMG-20250222-WA0017.jpg', 'View Programs', '/services', 3, TRUE)
            `);
            console.log('✅ Default hero slides inserted');
        }

        // Add missing columns to students table (if they don't exist)
        try {
            await db.query(`ALTER TABLE students ADD COLUMN contact_email VARCHAR(100) AFTER contact_phone`);
        } catch (e) { /* Column may already exist */ }
        try {
            await db.query(`ALTER TABLE students ADD COLUMN guardian_name VARCHAR(100) AFTER contact_email`);
        } catch (e) { /* Column may already exist */ }
        try {
            await db.query(`ALTER TABLE students ADD COLUMN guardian_phone VARCHAR(20) AFTER guardian_name`);
        } catch (e) { /* Column may already exist */ }
        try {
            await db.query(`ALTER TABLE students ADD COLUMN guardian_relation VARCHAR(50) AFTER guardian_phone`);
        } catch (e) { /* Column may already exist */ }
        try {
            await db.query(`ALTER TABLE students ADD COLUMN address_province VARCHAR(50) AFTER guardian_relation`);
        } catch (e) { /* Column may already exist */ }
        try {
            await db.query(`ALTER TABLE students ADD COLUMN address_district VARCHAR(50) AFTER address_province`);
        } catch (e) { /* Column may already exist */ }
        try {
            await db.query(`ALTER TABLE students ADD COLUMN address_sector VARCHAR(50) AFTER address_district`);
        } catch (e) { /* Column may already exist */ }
        try {
            await db.query(`ALTER TABLE students ADD COLUMN address_cell VARCHAR(50) AFTER address_sector`);
        } catch (e) { /* Column may already exist */ }
        try {
            await db.query(`ALTER TABLE students ADD COLUMN address_village VARCHAR(50) AFTER address_cell`);
        } catch (e) { /* Column may already exist */ }
        try {
            await db.query(`ALTER TABLE students ADD COLUMN year_enrolled YEAR AFTER level`);
        } catch (e) { /* Column may already exist */ }
        console.log('✅ Student table columns verified');

        // Add is_active column to fees table if not exists
        try {
            await db.query(`ALTER TABLE fees ADD COLUMN is_active BOOLEAN DEFAULT TRUE`);
        } catch (e) { /* Column may already exist */ }
        try {
            await db.query(`ALTER TABLE fees ADD COLUMN created_by INT`);
        } catch (e) { /* Column may already exist */ }
        try {
            await db.query(`ALTER TABLE fees ADD COLUMN student_category ENUM('public', 'private', 'both') DEFAULT 'both'`);
        } catch (e) { /* Column may already exist */ }
        console.log('✅ Fees table columns verified');

        // Add student_type column to students table if not exists
        try {
            await db.query(`ALTER TABLE students ADD COLUMN student_type ENUM('public', 'private') DEFAULT 'private'`);
        } catch (e) { /* Column may already exist */ }
        console.log('✅ Students table columns verified');

        // Stock items: image url for modern card UI
        try {
            await db.query(`ALTER TABLE stock_items ADD COLUMN image_url VARCHAR(500) NULL`);
        } catch (e) { /* exists */ }
        console.log('✅ Stock items image_url verified');

        // Driving lessons: pdf, image, attachments and description for richer content
        try { await db.query(`ALTER TABLE driving_lessons ADD COLUMN pdf_url VARCHAR(500) NULL`); } catch (e) {}
        try { await db.query(`ALTER TABLE driving_lessons ADD COLUMN image_url VARCHAR(500) NULL`); } catch (e) {}
        try { await db.query(`ALTER TABLE driving_lessons ADD COLUMN attachments JSON NULL`); } catch (e) {}
        try { await db.query(`ALTER TABLE driving_lessons ADD COLUMN description TEXT NULL`); } catch (e) {}
        console.log('✅ Driving lessons upload columns verified');

        // Auto reminder settings: last_run_at for cron de-dup
        try { await db.query(`ALTER TABLE auto_reminder_settings ADD COLUMN last_run_at TIMESTAMP NULL`); } catch (e) {}

        // Make sure upload directories exist
        const fs = require('fs');
        for (const dir of ['stock','driving-lessons']) {
            const full = path.join(__dirname, 'public', 'uploads', dir);
            try { fs.mkdirSync(full, { recursive: true }); } catch (_) {}
        }

    } catch (error) {
        console.error('❌ Database init error:', error.message);
    }
};

// Import Routes
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const disciplineRoutes = require('./routes/disciplineRoutes');
const financeRoutes = require('./routes/financeRoutes');
const stockRoutes = require('./routes/stockRoutes');
const parentRoutes = require('./routes/parentRoutes');

// Import new Phase 6 routes
const newsRoutes = require('./routes/newsRoutes');
const contentRoutes = require('./routes/contentRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const parentPaymentRoutes = require('./routes/parentPaymentRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const smsRoutes = require('./routes/smsRoutes');
const heroRoutes = require('./routes/heroRoutes');
const paymentReminderRoutes = require('./routes/paymentReminderRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const gradeRoutes = require('./routes/gradeRoutes');
const smsTemplateRoutes = require('./routes/smsTemplateRoutes');
const newsEngagementRoutes = require('./routes/newsEngagementRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const academicYearRoutes = require('./routes/academicYearRoutes');

// Mount Routes
app.use('/api/auth', authRoutes);

// Debug endpoint to check parent users
app.get('/api/debug/parents', async (req, res) => {
    try {
        const [users] = await db.execute('SELECT id, username, phone, role FROM users WHERE role = "parent"');
        res.json({ count: users.length, users });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.use('/api/students', studentRoutes);
app.use('/api/discipline', disciplineRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/parents', parentRoutes);
app.use('/api/parent-messages', require('./routes/parentMessageRoutes'));
app.use('/api/news', newsRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/parent-payments', parentPaymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/trades', require('./routes/tradesRoutes'));
app.use('/api/hero', heroRoutes);
app.use('/api/payment-reminders', paymentReminderRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/notifications2', require('./routes/enhancedNotificationRoutes'));
app.use('/api/media', require('./routes/mediaRoutes'));
app.use('/api/grades', gradeRoutes);
app.use('/api/sms-templates', smsTemplateRoutes);
app.use('/api/news-engagement', newsEngagementRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/academic-years', academicYearRoutes);
app.use('/api/employers', require('./routes/employerRoutes'));
app.use('/api/driving-rules', require('./routes/drivingRulesRoutes'));
app.use('/api/driving-school', require('./routes/drivingSchoolRoutes'));
app.use('/api/course-notes', require('./routes/courseNotesRoutes'));
app.use('/api/student-questions', require('./routes/studentQuestionsRoutes'));
app.use('/api/learning', require('./routes/learningRoutes'));
app.use('/api/realtime', require('./routes/realtimeRoutes'));
app.use('/api/student-auth', require('./routes/studentAuthRoutes'));
app.use('/api/teacher', require('./routes/teacherRoutes'));

// General route
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Garden TVET API is running' });
});

const PORT = process.env.PORT || 5000;

// Start server after database init
initDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        try {
            const { startCronJobs } = require('./utils/cronScheduler');
            startCronJobs();
        } catch (e) {
            console.error('Failed to start cron scheduler:', e.message);
        }
    });
});
