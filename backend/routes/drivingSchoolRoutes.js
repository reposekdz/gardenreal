const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const path = require('path');
const multer = require('multer');
const stockController = require('../controllers/stockController');

// Simple middleware to populate req.user for stockController compatibility
const instructorAuth = async (req, res, next) => {
    let token = req.headers['authorization'];
    if (!token) {
        // Fallback: check query or body for instructorId if no token (less secure but matches current pattern)
        const instructorId = req.query.instructorId || req.body.instructorId || req.params.instructorId;
        if (instructorId) {
            req.user = { id: instructorId, role: 'instructor' };
            return next();
        }
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (token.startsWith('Bearer ')) token = token.slice(7);
    try {
        const decoded = Buffer.from(token, 'base64').toString();
        const [id] = decoded.split(':');
        req.user = { id: parseInt(id), role: 'instructor' };
        next();
    } catch (e) {
        next(); // Proceed anyway, controller will handle missing user if needed
    }
};

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../public/uploads/driving-courses'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Initialize tables
const initDrivingSchoolTables = async () => {
    try {
        // Driving instructors table
        await db.query(`
            CREATE TABLE IF NOT EXISTS driving_instructors (
                id INT AUTO_INCREMENT PRIMARY KEY,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                national_id VARCHAR(20) UNIQUE NOT NULL,
                phone VARCHAR(20) NOT NULL,
                email VARCHAR(100),
                password VARCHAR(255) NOT NULL,
                license_number VARCHAR(50),
                specialization VARCHAR(100),
                experience_years INT,
                photo VARCHAR(255),
                bio TEXT,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Driving courses table
        await db.query(`
            CREATE TABLE IF NOT EXISTS driving_courses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(200) NOT NULL,
                title_kinya VARCHAR(200) NOT NULL,
                description TEXT,
                description_kinya TEXT,
                category VARCHAR(50),
                level VARCHAR(50),
                duration_hours INT,
                price DECIMAL(10,2),
                thumbnail VARCHAR(255),
                instructor_id INT,
                is_published BOOLEAN DEFAULT FALSE,
                order_num INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (instructor_id) REFERENCES driving_instructors(id)
            )
        `);

        // Course lessons table
        await db.query(`
            CREATE TABLE IF NOT EXISTS driving_lessons (
                id INT AUTO_INCREMENT PRIMARY KEY,
                course_id INT NOT NULL,
                title VARCHAR(200) NOT NULL,
                title_kinya VARCHAR(200) NOT NULL,
                content TEXT,
                content_kinya TEXT,
                video_url VARCHAR(255),
                duration_minutes INT,
                order_num INT DEFAULT 0,
                is_published BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (course_id) REFERENCES driving_courses(id) ON DELETE CASCADE
            )
        `);

        // Driving learners table
        await db.query(`
            CREATE TABLE IF NOT EXISTS driving_learners (
                id INT AUTO_INCREMENT PRIMARY KEY,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                national_id VARCHAR(20) UNIQUE NOT NULL,
                phone VARCHAR(20) NOT NULL,
                email VARCHAR(100),
                date_of_birth DATE,
                address VARCHAR(200),
                assigned_instructor_id INT,
                enrolled_courses TEXT,
                progress JSON,
                status ENUM('pending', 'active', 'completed', 'suspended') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (assigned_instructor_id) REFERENCES driving_instructors(id)
            )
        `);

        // Course enrollments
        await db.query(`
            CREATE TABLE IF NOT EXISTS driving_enrollments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                learner_id INT NOT NULL,
                course_id INT NOT NULL,
                progress_percent INT DEFAULT 0,
                completed_lessons JSON,
                started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP NULL,
                FOREIGN KEY (learner_id) REFERENCES driving_learners(id),
                FOREIGN KEY (course_id) REFERENCES driving_courses(id),
                UNIQUE KEY unique_enrollment (learner_id, course_id)
            )
        `);

        // Quiz questions
        await db.query(`
            CREATE TABLE IF NOT EXISTS driving_quiz_questions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                course_id INT,
                question TEXT NOT NULL,
                question_kinya TEXT NOT NULL,
                options JSON NOT NULL,
                correct_answer INT NOT NULL,
                explanation TEXT,
                explanation_kinya TEXT,
                points INT DEFAULT 1,
                order_num INT DEFAULT 0,
                is_active BOOLEAN DEFAULT TRUE,
                FOREIGN KEY (course_id) REFERENCES driving_courses(id) ON DELETE CASCADE
            )
        `);

        // Stock/inventory table
        await db.query(`
            CREATE TABLE IF NOT EXISTS driving_stock (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(200) NOT NULL,
                name_kinya VARCHAR(200),
                category VARCHAR(50),
                quantity INT DEFAULT 0,
                price DECIMAL(10,2),
                description TEXT,
                instructor_id INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (instructor_id) REFERENCES driving_instructors(id)
            )
        `);

        // Learner quiz results
        await db.query(`
            CREATE TABLE IF NOT EXISTS driving_quiz_results (
                id INT AUTO_INCREMENT PRIMARY KEY,
                learner_id INT NOT NULL,
                course_id INT,
                score INT NOT NULL,
                total_questions INT NOT NULL,
                passed BOOLEAN DEFAULT FALSE,
                taken_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (learner_id) REFERENCES driving_learners(id),
                FOREIGN KEY (course_id) REFERENCES driving_courses(id)
            )
        `);

        // Payment verification table
        await db.query(`
            CREATE TABLE IF NOT EXISTS driving_payments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                national_id VARCHAR(20) NOT NULL,
                sender_name VARCHAR(100) NOT NULL,
                phone VARCHAR(20) NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                payment_code VARCHAR(20) NOT NULL,
                status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
                verified_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Learning materials (PDFs, docs) - read only
        await db.query(`
            CREATE TABLE IF NOT EXISTS driving_materials (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(200) NOT NULL,
                title_kinya VARCHAR(200),
                description TEXT,
                description_kinya TEXT,
                file_path VARCHAR(255) NOT NULL,
                file_type VARCHAR(50),
                category VARCHAR(50),
                instructor_id INT,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (instructor_id) REFERENCES driving_instructors(id)
            )
        `);

        // Assessments table
        await db.query(`
            CREATE TABLE IF NOT EXISTS driving_assessments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(200) NOT NULL,
                title_kinya VARCHAR(200),
                description TEXT,
                description_kinya TEXT,
                course_id INT,
                questions JSON NOT NULL,
                duration_minutes INT,
                passing_score INT DEFAULT 70,
                instructor_id INT,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (course_id) REFERENCES driving_courses(id),
                FOREIGN KEY (instructor_id) REFERENCES driving_instructors(id)
            )
        `);

        // Road Signs table
        await db.query(`
            CREATE TABLE IF NOT EXISTS driving_road_signs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(200) NOT NULL,
                description TEXT,
                category VARCHAR(50) NOT NULL,
                image_url VARCHAR(255) NOT NULL,
                instructor_id INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (instructor_id) REFERENCES driving_instructors(id)
            )
        `);

        console.log('✅ Driving school tables ready');
    } catch (error) {
        console.error('Error creating driving school tables:', error);
    }
};

initDrivingSchoolTables();

// ==================== INSTRUCTOR ROUTES ====================

// Instructor registration
router.post('/instructor/register', async (req, res) => {
    try {
        const { firstName, lastName, nationalId, phone, email, password, licenseNumber, specialization, experienceYears } = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await db.query(
            `INSERT INTO driving_instructors 
            (first_name, last_name, national_id, phone, email, password, license_number, specialization, experience_years) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [firstName, lastName, nationalId, phone, email, hashedPassword, licenseNumber, specialization, experienceYears]
        );

        res.json({ success: true, message: 'Instructor registered', data: { id: result.insertId } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Instructor login
router.post('/instructor/login', async (req, res) => {
    try {
        const { nationalId, password } = req.body;

        const [instructors] = await db.query(
            'SELECT * FROM driving_instructors WHERE national_id = ?',
            [nationalId]
        );

        if (instructors.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const instructor = instructors[0];
        const isMatch = await bcrypt.compare(password, instructor.password);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = Buffer.from(`${instructor.id}:${Date.now()}`).toString('base64');

        res.json({
            success: true,
            data: {
                id: instructor.id,
                firstName: instructor.first_name,
                lastName: instructor.last_name,
                phone: instructor.phone,
                email: instructor.email,
                specialization: instructor.specialization,
                licenseNumber: instructor.license_number,
                photo: instructor.photo,
                token
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get all instructors
router.get('/instructors', async (req, res) => {
    try {
        const [instructors] = await db.query(
            'SELECT id, first_name, last_name, phone, email, specialization, experience_years, photo, bio, is_active FROM driving_instructors WHERE is_active = TRUE'
        );
        res.json({ success: true, data: instructors });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get instructor by ID
router.get('/instructors/:id', async (req, res) => {
    try {
        const [instructors] = await db.query(
            'SELECT * FROM driving_instructors WHERE id = ?',
            [req.params.id]
        );
        if (instructors.length === 0) {
            return res.status(404).json({ success: false, message: 'Instructor not found' });
        }
        res.json({ success: true, data: instructors[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ==================== COURSE ROUTES ====================

// Create course (instructor only)
router.post('/courses', upload.single('thumbnail'), async (req, res) => {
    try {
        const { title, titleKinya, description, descriptionKinya, category, level, durationHours, price, instructorId } = req.body;

        const [result] = await db.query(
            `INSERT INTO driving_courses 
            (title, title_kinya, description, description_kinya, category, level, duration_hours, price, thumbnail, instructor_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [title, titleKinya, description, descriptionKinya, category, level, durationHours, price, req.file?.filename, instructorId]
        );

        res.json({ success: true, message: 'Course created', data: { id: result.insertId } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get all published courses
router.get('/courses', async (req, res) => {
    try {
        const [courses] = await db.query(
            `SELECT c.*, CONCAT(i.first_name, ' ', i.last_name) as instructor_name 
            FROM driving_courses c 
            LEFT JOIN driving_instructors i ON c.instructor_id = i.id 
            WHERE c.is_published = TRUE 
            ORDER BY c.order_num`
        );
        res.json({ success: true, data: courses });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get course by ID with lessons
router.get('/courses/:id', async (req, res) => {
    try {
        const [courses] = await db.query(
            `SELECT c.*, CONCAT(i.first_name, ' ', i.last_name) as instructor_name 
            FROM driving_courses c 
            LEFT JOIN driving_instructors i ON c.instructor_id = i.id 
            WHERE c.id = ?`,
            [req.params.id]
        );

        if (courses.length === 0) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        const [lessons] = await db.query(
            'SELECT * FROM driving_lessons WHERE course_id = ? AND is_published = TRUE ORDER BY order_num',
            [req.params.id]
        );

        res.json({ success: true, data: { ...courses[0], lessons } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Multer config for lesson uploads (PDF + image + extra attachments)
const lessonStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '../public/uploads/driving-lessons')),
    filename: (req, file, cb) => {
        const safe = (file.originalname || 'file').replace(/[^a-zA-Z0-9._-]/g, '_');
        cb(null, `${Date.now()}-${Math.round(Math.random()*1e9)}-${safe}`);
    }
});
const lessonUpload = multer({
    storage: lessonStorage,
    limits: { fileSize: 30 * 1024 * 1024 } // 30MB per file
}).fields([
    { name: 'pdf', maxCount: 1 },
    { name: 'image', maxCount: 1 },
    { name: 'attachments', maxCount: 8 }
]);

// Add lesson to course (now with optional pdf/image/attachments multipart upload)
router.post('/courses/:courseId/lessons', lessonUpload, async (req, res) => {
    try {
        const {
            title, titleKinya, content, contentKinya, description,
            videoUrl, durationMinutes, orderNum, isPublished
        } = req.body;

        const pdf_url   = req.files?.pdf?.[0]   ? `/uploads/driving-lessons/${req.files.pdf[0].filename}`   : (req.body.pdfUrl   || null);
        const image_url = req.files?.image?.[0] ? `/uploads/driving-lessons/${req.files.image[0].filename}` : (req.body.imageUrl || null);
        const attachments = req.files?.attachments?.length
            ? req.files.attachments.map(f => ({
                name: f.originalname,
                url: `/uploads/driving-lessons/${f.filename}`,
                mime: f.mimetype,
                size: f.size
            }))
            : null;

        const [result] = await db.query(
            `INSERT INTO driving_lessons
            (course_id, title, title_kinya, content, content_kinya, description, video_url, duration_minutes, order_num, is_published, pdf_url, image_url, attachments)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                req.params.courseId, title, titleKinya || title, content || null, contentKinya || null,
                description || null, videoUrl || null, durationMinutes || null, orderNum || 0,
                isPublished === 'true' || isPublished === true ? 1 : 0,
                pdf_url, image_url,
                attachments ? JSON.stringify(attachments) : null
            ]
        );

        res.json({
            success: true,
            message: 'Lesson added',
            data: { id: result.insertId, pdf_url, image_url, attachments }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
});

// Update lesson with optional new uploads
router.put('/lessons/:id', lessonUpload, async (req, res) => {
    try {
        const id = req.params.id;
        const [existing] = await db.query('SELECT * FROM driving_lessons WHERE id = ?', [id]);
        if (!existing.length) return res.status(404).json({ success: false, message: 'Lesson not found' });
        const cur = existing[0];

        const pdf_url = req.files?.pdf?.[0]
            ? `/uploads/driving-lessons/${req.files.pdf[0].filename}`
            : (req.body.pdfUrl !== undefined ? req.body.pdfUrl : cur.pdf_url);
        const image_url = req.files?.image?.[0]
            ? `/uploads/driving-lessons/${req.files.image[0].filename}`
            : (req.body.imageUrl !== undefined ? req.body.imageUrl : cur.image_url);
        const attachments = req.files?.attachments?.length
            ? JSON.stringify(req.files.attachments.map(f => ({
                name: f.originalname,
                url: `/uploads/driving-lessons/${f.filename}`,
                mime: f.mimetype, size: f.size
            })))
            : cur.attachments;

        await db.query(
            `UPDATE driving_lessons SET
              title = ?, title_kinya = ?, content = ?, content_kinya = ?, description = ?,
              video_url = ?, duration_minutes = ?, order_num = ?, is_published = ?,
              pdf_url = ?, image_url = ?, attachments = ?
             WHERE id = ?`,
            [
                req.body.title || cur.title,
                req.body.titleKinya || cur.title_kinya,
                req.body.content !== undefined ? req.body.content : cur.content,
                req.body.contentKinya !== undefined ? req.body.contentKinya : cur.content_kinya,
                req.body.description !== undefined ? req.body.description : cur.description,
                req.body.videoUrl !== undefined ? req.body.videoUrl : cur.video_url,
                req.body.durationMinutes !== undefined ? req.body.durationMinutes : cur.duration_minutes,
                req.body.orderNum !== undefined ? req.body.orderNum : cur.order_num,
                req.body.isPublished !== undefined
                    ? (req.body.isPublished === 'true' || req.body.isPublished === true ? 1 : 0)
                    : cur.is_published,
                pdf_url, image_url, attachments,
                id
            ]
        );
        res.json({ success: true, message: 'Lesson updated', data: { id, pdf_url, image_url } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
});

// Delete lesson
router.delete('/lessons/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM driving_lessons WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Lesson deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Public: get a single lesson with all content (for student reader)
router.get('/lessons/:id', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM driving_lessons WHERE id = ?', [req.params.id]);
        if (!rows.length) return res.status(404).json({ success: false, message: 'Not found' });
        const lesson = rows[0];
        if (lesson.attachments && typeof lesson.attachments === 'string') {
            try { lesson.attachments = JSON.parse(lesson.attachments); } catch (_) {}
        }
        res.json({ success: true, data: lesson });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get all lessons for a course
router.get('/courses/:courseId/lessons', async (req, res) => {
    try {
        const [lessons] = await db.query(
            'SELECT * FROM driving_lessons WHERE course_id = ? ORDER BY order_num',
            [req.params.courseId]
        );
        res.json({ success: true, data: lessons });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ==================== LEARNER ROUTES ====================

// Learner registration
router.post('/learner/register', async (req, res) => {
    try {
        const { firstName, lastName, nationalId, phone, email, dateOfBirth, address, assignedInstructorId } = req.body;

        // Generate temporary password
        const tempPassword = Math.random().toString(36).slice(-6);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        const [result] = await db.query(
            `INSERT INTO driving_learners 
            (first_name, last_name, national_id, phone, email, date_of_birth, address, assigned_instructor_id, password) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [firstName, lastName, nationalId, phone, email, dateOfBirth, address, assignedInstructorId, hashedPassword]
        );

        res.json({
            success: true,
            message: 'Learner registered',
            data: {
                id: result.insertId,
                temporaryPassword: tempPassword
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Learner login
router.post('/learner/login', async (req, res) => {
    try {
        const { nationalId, password } = req.body;

        const [learners] = await db.query(
            'SELECT * FROM driving_learners WHERE national_id = ?',
            [nationalId]
        );

        if (learners.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const learner = learners[0];
        const isMatch = await bcrypt.compare(password, learner.password);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = Buffer.from(`${learner.id}:${Date.now()}`).toString('base64');

        // Get enrolled courses
        const [enrollments] = await db.query(
            `SELECT e.*, c.title, c.title_kinya, c.thumbnail 
            FROM driving_enrollments e 
            JOIN driving_courses c ON e.course_id = c.id 
            WHERE e.learner_id = ?`,
            [learner.id]
        );

        res.json({
            success: true,
            data: {
                id: learner.id,
                firstName: learner.first_name,
                lastName: learner.last_name,
                phone: learner.phone,
                email: learner.email,
                status: learner.status,
                enrollments,
                token
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Enroll in course
router.post('/enroll', async (req, res) => {
    try {
        const { learnerId, courseId } = req.body;

        await db.query(
            'INSERT IGNORE INTO driving_enrollments (learner_id, course_id) VALUES (?, ?)',
            [learnerId, courseId]
        );

        res.json({ success: true, message: 'Enrolled successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Update progress
router.put('/enroll/:enrollmentId/progress', async (req, res) => {
    try {
        const { progressPercent, completedLessons } = req.body;

        await db.query(
            'UPDATE driving_enrollments SET progress_percent = ?, completed_lessons = ? WHERE id = ?',
            [progressPercent, JSON.stringify(completedLessons), req.params.enrollmentId]
        );

        res.json({ success: true, message: 'Progress updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get instructor's learners
router.get('/instructor/:instructorId/learners', async (req, res) => {
    try {
        const [learners] = await db.query(
            `SELECT l.*, GROUP_CONCAT(c.title_kinya) as enrolled_courses 
            FROM driving_learners l 
            LEFT JOIN driving_enrollments e ON l.id = e.learner_id 
            LEFT JOIN driving_courses c ON e.course_id = c.id 
            WHERE l.assigned_instructor_id = ? 
            GROUP BY l.id`,
            [req.params.instructorId]
        );
        res.json({ success: true, data: learners });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ==================== QUIZ ROUTES ====================

// Add quiz question
router.post('/quiz/questions', async (req, res) => {
    try {
        const { courseId, question, questionKinya, options, correctAnswer, explanation, explanationKinya, points, orderNum } = req.body;

        const [result] = await db.query(
            `INSERT INTO driving_quiz_questions 
            (course_id, question, question_kinya, options, correct_answer, explanation, explanation_kinya, points, order_num) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [courseId, question, questionKinya, JSON.stringify(options), correctAnswer, explanation, explanationKinya, points, orderNum]
        );

        res.json({ success: true, message: 'Question added', data: { id: result.insertId } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get quiz questions for a course
router.get('/quiz/:courseId/questions', async (req, res) => {
    try {
        const [questions] = await db.query(
            'SELECT * FROM driving_quiz_questions WHERE course_id = ? AND is_active = TRUE ORDER BY order_num',
            [req.params.courseId]
        );

        const formatted = questions.map(q => ({
            ...q,
            options: JSON.parse(q.options)
        }));

        res.json({ success: true, data: formatted });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Submit quiz
router.post('/quiz/submit', async (req, res) => {
    try {
        const { learnerId, courseId, answers } = req.body;

        const [questions] = await db.query(
            'SELECT * FROM driving_quiz_questions WHERE course_id = ? AND is_active = TRUE',
            [courseId]
        );

        let score = 0;
        questions.forEach((q, index) => {
            if (answers[index] === q.correct_answer) {
                score += q.points;
            }
        });

        const passed = score >= (questions.length * 0.7);

        await db.query(
            'INSERT INTO driving_quiz_results (learner_id, course_id, score, total_questions, passed) VALUES (?, ?, ?, ?, ?)',
            [learnerId, courseId, score, questions.length, passed]
        );

        res.json({
            success: true,
            data: {
                score,
                total: questions.length,
                passed,
                percentage: Math.round((score / questions.length) * 100)
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get quiz results for learner
router.get('/learner/:learnerId/results', async (req, res) => {
    try {
        const [results] = await db.query(
            `SELECT q.*, c.title_kinya as course_name 
            FROM driving_quiz_results q 
            JOIN driving_courses c ON q.course_id = c.id 
            WHERE q.learner_id = ? 
            ORDER BY q.taken_at DESC`,
            [req.params.learnerId]
        );
        res.json({ success: true, data: results });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ==================== STOCK ROUTES ====================
// Stock routes are handled below in the consolidated section

// Update learner status
router.put('/learner/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        await db.query('UPDATE driving_learners SET status = ? WHERE id = ?', [status, req.params.id]);
        res.json({ success: true, message: 'Status updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});// ==================== ADVANCED STOCK ROUTES (linked to stockController) ====================

router.post('/stock', instructorAuth, (req, res) => stockController.addItem(req, res));
router.get('/stock', instructorAuth, (req, res) => stockController.getItems(req, res));
router.get('/stock/:instructorId', instructorAuth, (req, res) => stockController.getItems(req, res)); // We return all for now as it's shared
router.put('/stock/:id', instructorAuth, (req, res) => stockController.updateItem(req, res));
router.delete('/stock/:id', instructorAuth, (req, res) => stockController.deleteItem(req, res));

// Transactions
router.post('/stock/transactions', instructorAuth, (req, res) => stockController.addTransaction(req, res));
router.get('/stock/:id/transactions', instructorAuth, stockController.getItemTransactions);

// Reports
router.get('/stock-reports/summary', instructorAuth, stockController.getStockSummary);
router.get('/stock-reports/low-stock', instructorAuth, stockController.getLowStockItems);
router.get('/stock-reports/valuation', instructorAuth, stockController.getStockValuation);

// Delete learner
router.delete('/learner/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM driving_learners WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Learner deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Delete course
router.delete('/courses/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM driving_courses WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Course deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Delete quiz question
router.delete('/quiz/questions/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM driving_quiz_questions WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Question deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get all learners (for instructor)
router.get('/learners', async (req, res) => {
    try {
        const [learners] = await db.query(
            `SELECT l.*, GROUP_CONCAT(c.title_kinya) as enrolled_courses 
            FROM driving_learners l 
            LEFT JOIN driving_enrollments e ON l.id = e.learner_id 
            LEFT JOIN driving_courses c ON e.course_id = c.id 
            GROUP BY l.id
            ORDER BY l.created_at DESC`
        );
        res.json({ success: true, data: learners });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get all quiz questions
router.get('/quiz/questions', async (req, res) => {
    try {
        const [questions] = await db.query(
            'SELECT q.*, c.title_kinya as course_name FROM driving_quiz_questions q LEFT JOIN driving_courses c ON q.course_id = c.id ORDER BY q.order_num'
        );
        const formatted = questions.map(q => ({
            ...q,
            options: JSON.parse(q.options)
        }));
        res.json({ success: true, data: formatted });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ==================== PAYMENT ROUTES ====================

// Submit payment for verification
router.post('/payment/verify', async (req, res) => {
    try {
        const { nationalId, senderName, phone, amount, paymentCode } = req.body;

        // Verify payment code (123456)
        if (paymentCode !== '123456') {
            return res.status(400).json({ success: false, message: 'Ikode yitiriwe ntabwo ikiriho' });
        }

        // Verify amount (5000 Rwf)
        if (parseFloat(amount) !== 5000) {
            return res.status(400).json({ success: false, message: 'Igiciro gishyizwe nibura 5000 Rwf' });
        }

        const [result] = await db.query(
            `INSERT INTO driving_payments (national_id, sender_name, phone, amount, payment_code, status) 
            VALUES (?, ?, ?, ?, ?, 'pending')`,
            [nationalId, senderName, phone, amount, paymentCode]
        );

        res.json({
            success: true,
            message: 'Ihereye ryoherejwe. Bizagaragara mu minuti mike.',
            data: { id: result.insertId }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Check payment status
router.get('/payment/status/:nationalId', async (req, res) => {
    try {
        const [payments] = await db.query(
            'SELECT * FROM driving_payments WHERE national_id = ? ORDER BY created_at DESC LIMIT 1',
            [req.params.nationalId]
        );

        if (payments.length === 0) {
            return res.json({ success: true, data: { verified: false, status: 'none' } });
        }

        const payment = payments[0];
        // Auto-verify if code is correct and amount is 5000
        if (payment.payment_code === '123456' && payment.amount >= 5000 && payment.status === 'pending') {
            await db.query(
                'UPDATE driving_payments SET status = ?, verified_at = NOW() WHERE id = ?',
                ['verified', payment.id]
            );
            payment.status = 'verified';
        }

        res.json({
            success: true,
            data: {
                verified: payment.status === 'verified',
                status: payment.status,
                verifiedAt: payment.verified_at
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ==================== MATERIALS ROUTES ====================

// Upload material (instructor)
router.post('/materials', upload.single('file'), async (req, res) => {
    try {
        const { title, titleKinya, description, descriptionKinya, category, instructorId } = req.body;

        const [result] = await db.query(
            `INSERT INTO driving_materials (title, title_kinya, description, description_kinya, file_path, file_type, category, instructor_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [title, titleKinya, description, descriptionKinya, req.file?.filename, req.file?.mimetype, category, instructorId]
        );

        res.json({ success: true, message: 'Ibyapa byashyizweho', data: { id: result.insertId } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get all materials (for learners who paid)
router.get('/materials', async (req, res) => {
    try {
        const [materials] = await db.query(
            `SELECT m.*, CONCAT(i.first_name, ' ', i.last_name) as instructor_name 
            FROM driving_materials m 
            LEFT JOIN driving_instructors i ON m.instructor_id = i.id 
            WHERE m.is_active = TRUE 
            ORDER BY m.created_at DESC`
        );
        res.json({ success: true, data: materials });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Delete material (instructor)
router.delete('/materials/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM driving_materials WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Ibyapa byasibytwe' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Seed default theory questions
const seedTheoryQuestions = async () => {
    try {
        const [existing] = await db.query('SELECT COUNT(*) as count FROM driving_quiz_questions WHERE course_id IS NULL');
        if (existing[0].count > 0) return;

        const theoryQuestions = [
            { question: 'Ikinyabiziga cyose cyangwa ibinyabiziga bigenda bigomba kugira:', question_kinya: 'Ikinyabiziga cyose cyangwa ibinyabiziga bigenda bigomba kugira:', options: JSON.stringify(['Umuyobozi', 'Umuherekeza', 'A na B ni ibisubizo by ukuri', 'Nta gisubizo cy ukuri kirimo']), correct_answer: 2, explanation: 'Ikinyabiziga kigomba kugira umuyobozi n umuherekeza', explanation_kinya: 'Ikinyabiziga kigomba kugira umuyobozi n umuherekeza', course_id: null, order_num: 1 },
            { question: 'Ijambo "akayira" bivuga inzira nyabagendwa ifunganye yagenewe gusa:', question_kinya: 'Ijambo "akayira" bivuga inzira nyabagendwa ifunganye yagenewe gusa:', options: JSON.stringify(['Abanyamaguru', 'Ibinyabiziga bigendera ku biziga bibiri', 'A na B ni ibisubizo by ukuri', 'Nta gisubizo cy ukuri kirimo']), correct_answer: 2, explanation: 'Akayira ni inzira yagenewe abanyamaguru n ibinyabiziga bibiri', explanation_kinya: 'Akayira ni inzira yagenewe abanyamaguru n ibinyabiziga bibiri', course_id: null, order_num: 2 },
            { question: 'Umurongo uciyemo uduce umenyesha ahegereye umurongo ushobora kuzuzwa n uturanga gukata tw ibara ryera utwo turanga cyerekezo tumenyesha:', question_kinya: 'Umurongo uciyemo uduce umenyesha ahegereye umurongo ushobora kuzuzwa n uturanga gukata tw ibara ryera utwo turanga cyerekezo tumenyesha:', options: JSON.stringify(['Igisate cy umuhanda abayobozi bagomba gukurikira', 'Ahegereye umurongo ukomeje', 'Igabanurwa ry umubarew ibisate by umuhanda mu cyerekezo bajyamo', 'A na C nibyo']), correct_answer: 3, explanation: 'Iryo ruhuro rugabanya ibisate', explanation_kinya: 'Iryo ruhuro rugabanya ibisate', course_id: null, order_num: 3 },
            { question: 'Ahantu ho kugendera mu muhanda herekanwa n ibimenyetso bimurika ibinyabiziga ntibishobora kuhagenda:', question_kinya: 'Ahantu ho kugendera mu muhanda herekanwa n ibimenyetso bimurika ibinyabiziga ntibishobora kuhagenda:', options: JSON.stringify(['Biteganye', 'Ku murongo umwe', 'A na B nibyo', 'Nta gisubizo cy ukuri kirimo']), correct_answer: 3, explanation: 'Ibyo bitari ibisubizo by ukuri', explanation_kinya: 'Ibyo bitari ibisubizo by ukuri', course_id: null, order_num: 4 },
            { question: 'Ibinyabiziga bikurikira bigomba gukorerwa isuzumwa buri mwaka:', question_kinya: 'Ibinyabiziga bikurikira bigomba gukorerwa isuzumwa buri mwaka:', options: JSON.stringify(['Ibinyabiziga bigenewe gutwara abagenzi mu rusange', 'Ibinyabiziga bigenewe gutwara ibintu birengeje toni 3.5', 'Ibinyabiziga bigenewe kwigisha gutwara', 'Nta gisubizo cy ukuri kirimo']), correct_answer: 3, explanation: 'Ibinyabiziga byose bigomba isuzumwa', explanation_kinya: 'Ibinyabiziga byose bigomba isuzumwa', course_id: null, order_num: 5 },
            { question: 'Ubugari bwa romoruki ikuruwe n ikinyamitende itatu ntibugomba kurenza ibipimo bikurikira:', question_kinya: 'Ubugari bwa romoruki ikuruwe n ikinyamitende itatu ntibugomba kurenza ibipimo bikurikira:', options: JSON.stringify(['cm75', 'cm125', 'cm265', 'Nta gisubizo cy ukuri']), correct_answer: 2, explanation: 'Ubugari bwa romoruki ntibugomba kurenza 265cm', explanation_kinya: 'Ubugari bwa romoruki ntibugomba kurenza 265cm', course_id: null, order_num: 6 },
            { question: 'Uburebure bw ibinyabiziga bikurikira ntibugomba kurenga metero 11:', question_kinya: 'Uburebure bw ibinyabiziga bikurikira ntibugomba kurenga metero 11:', options: JSON.stringify(['Ibifite umutambiko umwe uhuza imipira', 'Ibifite imitambiko ibiri ikurikiranye mu bugari bwayo', 'Makuzungu', 'Nta gisubizo cy ukuri']), correct_answer: 3, explanation: 'Ntabwo iri gisubizo', explanation_kinya: 'Ntabwo iri gisubizo', course_id: null, order_num: 7 },
            { question: 'Ikinyabiziga kibujijwe guhagarara akanya kanini aha hakurikira:', question_kinya: 'Ikinyabiziga kibujijwe guhagarara akanya kanini aha hakurikira:', options: JSON.stringify(['Ahatarengeje metro 1 imbere cyangwa inyuma y ikinyabiziga gihagaze', 'Ahantu hari ibimenyetso bibuza byabugenewe', 'Aho abanyamaguru banyura mu muhanda ngo bakikire inkomyi', 'Ibisubizo byose nibyo']), correct_answer: 3, explanation: 'Byose ni ibibujijwe', explanation_kinya: 'Byose ni ibibujijwe', course_id: null, order_num: 8 },
            { question: 'Kunyuranaho bikorerwa:', question_kinya: 'Kunyuranaho bikorerwa:', options: JSON.stringify(['Mu ruhande rw iburyo gusa', 'Igihe cyose ni ibumoso', 'Iburyo iyo unyura ku nyamaswa', 'Nta gisubizo cy ukuri kirimo']), correct_answer: 2, explanation: 'Kunyuranaho bikorerwa iburyo iyo unyura ku nyamaswa', explanation_kinya: 'Kunyuranaho bikorerwa iburyo iyo unyura ku nyamaswa', course_id: null, order_num: 9 },
            { question: 'Icyapa cyerekana umuvuduko ntarengwa ikinyabiziga kitagomba kurenza gishyirwa gusa ku binyabiziga bifite uburemere ntarengwa bukurikira:', question_kinya: 'Icyapa cyerekana umuvuduko ntarengwa ikinyabiziga kitagomba kurenza gishyirwa gusa ku binyabiziga bifite uburemere ntarengwa bukurikira:', options: JSON.stringify(['Burenga toni 1', 'Burenga toni 2', 'Burenga toni 24', 'Nta gisubizo cy ukuri kirimo']), correct_answer: 2, explanation: 'Ku binyabiziga burenga toni 2', explanation_kinya: 'Ku binyabiziga burenga toni 2', course_id: null, order_num: 10 },
            { question: 'Ahatari mu nsisiro umuvuduko ntarengwa mu isaha wa velomoteri ni:', question_kinya: 'Ahatari mu nsisiro umuvuduko ntarengwa mu isaha wa velomoteri ni:', options: JSON.stringify(['Km50', 'Km40', 'Km30', 'Nta gisubizo cy ukuri']), correct_answer: 2, explanation: 'Umuvuduko ni Km30 mu nsisiro', explanation_kinya: 'Umuvuduko ni Km30 mu nsisiro', course_id: null, order_num: 11 },
            { question: 'Umuyobozi ugenda mu muhanda igihe ubugari bwawo budatuma anyuranaho nta nkomyi ashobora kunyura mu kayira k abanyamaguru ariko amaze kureba ibi bikurikira:', question_kinya: 'Umuyobozi ugenda mu muhanda igihe ubugari bwawo budatuma anyuranaho nta nkomyi ashobora kunyura mu kayira k abanyamaguru ariko amaze kureba ibi bikurikira:', options: JSON.stringify(['Umuvuduko w abanyamaguru', 'Ubugari bw umuhanda', 'Umubare w abanyamaguru', 'Nta gisubizo cy ukuri kirimo']), correct_answer: 2, explanation: 'Ugira icyo areba kugira ngo anyuranaho', explanation_kinya: 'Ugira icyo areba kugira ngo anyuranaho', course_id: null, order_num: 12 },
            { question: 'Ku byerekeye kwerekana ibinyabiziga n ukumurika kwabyo ndetse no kwerekana ihindura ry ibyerekezo byabyo. Birabujijwe gukora andi matara cyangwa utugarurarumuri uretse ibitegetswe ariko ntibireba amatara akurikira:', question_kinya: 'Ku byerekeye kwerekana ibinyabiziga n ukumurika kwabyo ndetse no kwerekana ihindura ry ibyerekezo byabyo. Birabujijwe gukora andi matara cyangwa utugarurarumuri uretse ibitegetswe ariko ntibireba amatara akurikira:', options: JSON.stringify(['Amatara ndanga', 'Amatara ari imbere mu modoka', 'Amatara ndangaburumbarare', 'Ibisubizo byose nibyo']), correct_answer: 3, explanation: 'Birabujijwe gukora andi matara', explanation_kinya: 'Birabujijwe gukora andi matara', course_id: null, order_num: 13 },
            { question: 'Iyo nta mategeko awugabanya by umwihariko umuvuduko ntarengwa w amapikipiki mu isaha ni:', question_kinya: 'Iyo nta mategeko awugabanya by umwihariko umuvuduko ntarengwa w amapikipiki mu isaha ni:', options: JSON.stringify(['Km25', 'Km70', 'Km40', 'Nta gisubizo cy ukuri kirimo']), correct_answer: 0, explanation: 'Umuvuduko w amapikipiki ni Km25', explanation_kinya: 'Umuvuduko w amapikipiki ni Km25', course_id: null, order_num: 14 },
            { question: 'Uburyo bukoreshwa kugirango ikinyabiziga kigende gahoro igihe feri idakora neza babwita:', question_kinya: 'Uburyo bukoreshwa kugirango ikinyabiziga kigende gahoro igihe feri idakora neza babwita:', options: JSON.stringify(['Feri y urugendo', 'Feri yo guhagarara umwanya munini', 'Feri yo gutabara', 'Nta gisubizo cy ukuri kirimo']), correct_answer: 1, explanation: 'Feri yo guhagarara igenda neza', explanation_kinya: 'Feri yo guhagarara igenda neza', course_id: null, order_num: 15 },
            { question: 'Nibura ikinyabiziga gitegetswe kugira uduhanagurakirahure tungahe:', question_kinya: 'Nibura ikinyabiziga gitegetswe kugira uduhanagurakirahure tungahe:', options: JSON.stringify(['2', '3', '1', 'Nta gisubizo cy ukuri kirimo']), correct_answer: 0, explanation: 'Ikinyabiziga kigomba kugira uduhanagurakirahure 2', explanation_kinya: 'Ikinyabiziga kigomba kugira uduhanagurakirahure 2', course_id: null, order_num: 16 },
            { question: 'Amatara maremare y ikinyabiziga agomba kuzimwa mu bihe bikurikira:', question_kinya: 'Amatara maremare y ikinyabiziga agomba kuzimwa mu bihe bikurikira:', options: JSON.stringify(['Iyo umuhanda umurikiye umuyobozi abusha kureba muri metero 20', 'Iyo ikinyabiziga kigiye kubisikana n ibindi', 'Iyo ari mu nsisiro', 'Ibisubizo byose ni ukuri']), correct_answer: 3, explanation: 'Amatara maremare agomba kuzimwa mu byose', explanation_kinya: 'Amatara maremare agomba kuzimwa mu byose', course_id: null, order_num: 17 },
            { question: 'Ikinyabiziga ntigishobora kugira amatara arenga abiri y ubwoko bumwe keretse kubyerekeye amatara akurikira:', question_kinya: 'Ikinyabiziga ntigishobora kugira amatara arenga abiri y ubwoko bumwe keretse kubyerekeye amatara akurikira:', options: JSON.stringify(['Itara ndangamubyimba', 'Itara ryerekana icyerekezo', 'Itara ndangaburumbarare', 'Ibisubizo byose ni ukuri']), correct_answer: 3, explanation: 'Ntabwo igira amatara arenga abiri', explanation_kinya: 'Ntabwo igira amatara arenga abiri', course_id: null, order_num: 18 },
            { question: 'Ubugari bwa romoruki ikuruwe n igare cyangwa velomoteri ntiburenza ibipimo bikurikira:', question_kinya: 'Ubugari bwa romoruki ikuruwe n igare cyangwa velomoteri ntiburenza ibipimo bikurikira:', options: JSON.stringify(['cm25', 'cm125', 'cm45', 'Nta gisubizo cy ukuri kirimo']), correct_answer: 2, explanation: 'Uburebure ntiburenza 45cm', explanation_kinya: 'Uburebure ntiburenza 45cm', course_id: null, order_num: 19 },
            { question: 'Ibinyabiziga bikoreshwa nka tagisi bitegerereza abantu mu nzira nyabagendwa bishobora gushyirwaho itara ryerekana ko ikinyabiziga kitakodeshejwe. Iryo tara rishyirwaho ku buryo bukurikira:', question_kinya: 'Ibinyabiziga bikoreshwa nka tagisi bitegerereza abantu mu nzira nyabagendwa bishobora gushyirwaho itara ryerekana ko ikinyabiziga kitakodeshejwe. Iryo tara rishyirwaho ku buryo bukurikira:', options: JSON.stringify(['Ni itara ry icyatsi rishyirwa imbere ku kinyabiziga', 'Ni itara ry icyatsi rishyirwa ibumoso', 'Ni itara ry umuhondo rishyirwa inyuma', 'A na C ni ibisubizo by ukuri']), correct_answer: 3, explanation: 'Iryo tara rishyirwa imbere cyangwa inyuma', explanation_kinya: 'Iryo tara rishyirwa imbere cyangwa inyuma', course_id: null, order_num: 20 }
        ];

        for (const q of theoryQuestions) {
            await db.query(
                `INSERT INTO driving_quiz_questions (question, question_kinya, options, correct_answer, explanation, explanation_kinya, course_id, order_num) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [q.question, q.question_kinya, q.options, q.correct_answer, q.explanation, q.explanation_kinya, q.course_id, q.order_num]
            );
        }
        console.log('✅ Theory questions seeded');
    } catch (error) {
        console.error('Error seeding theory questions:', error);
    }
};

// Run seeding after tables are created
setTimeout(seedTheoryQuestions, 1000);

// ==================== ASSESSMENTS ROUTES ====================

// Create assessment (instructor)
router.post('/assessments', async (req, res) => {
    try {
        const { title, titleKinya, description, descriptionKinya, courseId, questions, durationMinutes, passingScore, instructorId } = req.body;

        const [result] = await db.query(
            `INSERT INTO driving_assessments (title, title_kinya, description, description_kinya, course_id, questions, duration_minutes, passing_score, instructor_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [title, titleKinya, description, descriptionKinya, courseId, JSON.stringify(questions), durationMinutes, passingScore, instructorId]
        );

        res.json({ success: true, message: 'Ibarura ryashyizweho', data: { id: result.insertId } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get all assessments
router.get('/assessments', async (req, res) => {
    try {
        const [assessments] = await db.query(
            `SELECT a.*, c.title_kinya as course_name, CONCAT(i.first_name, ' ', i.last_name) as instructor_name 
            FROM driving_assessments a 
            LEFT JOIN driving_courses c ON a.course_id = c.id 
            LEFT JOIN driving_instructors i ON a.instructor_id = i.id 
            WHERE a.is_active = TRUE 
            ORDER BY a.created_at DESC`
        );
        res.json({ success: true, data: assessments });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});// Get assessment by ID
router.get('/assessments/:id', async (req, res) => {
    try {
        const [assessments] = await db.query(
            'SELECT * FROM driving_assessments WHERE id = ?',
            [req.params.id]
        );

        if (assessments.length === 0) {
            return res.status(404).json({ success: false, message: 'Ibarura ntiraboneka' });
        }

        const assessment = assessments[0];
        assessment.questions = JSON.parse(assessment.questions);

        res.json({ success: true, data: assessment });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Delete assessment (instructor)
router.delete('/assessments/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM driving_assessments WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Ibarura ryasibytwe' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ==================== ROAD SIGNS ROUTES ====================

// Upload road sign (instructor)
router.post('/road-signs', upload.single('image'), async (req, res) => {
    try {
        const { title, description, category, instructorId } = req.body;

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Ifoto irakenewe' });
        }

        const [result] = await db.query(
            `INSERT INTO driving_road_signs (title, description, category, image_url, instructor_id) 
            VALUES (?, ?, ?, ?, ?)`,
            [title, description, category, req.file.filename, instructorId]
        );

        res.json({ success: true, message: 'Icyapa cyashyizweho', data: { id: result.insertId } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get all road signs
router.get('/road-signs', async (req, res) => {
    try {
        const [signs] = await db.query('SELECT * FROM driving_road_signs ORDER BY id DESC');
        res.json({ success: true, data: signs });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get instructor's road signs
router.get('/instructor/:instructorId/road-signs', async (req, res) => {
    try {
        const [signs] = await db.query(
            'SELECT * FROM driving_road_signs WHERE instructor_id = ? ORDER BY id DESC',
            [req.params.instructorId]
        );
        res.json({ success: true, data: signs });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Delete road sign
router.delete('/road-signs/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM driving_road_signs WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Icyapa cyasibwe' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ==================== NOTIFICATIONS ROUTES ====================

// Create notification
router.post('/notifications', async (req, res) => {
    try {
        const { instructorId, message, type } = req.body;
        await db.query(
            `CREATE TABLE IF NOT EXISTS driving_notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                instructor_id INT NOT NULL,
                message TEXT NOT NULL,
                type VARCHAR(50) DEFAULT 'info',
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (instructor_id) REFERENCES driving_instructors(id)
            )`
        );
        const [result] = await db.query(
            'INSERT INTO driving_notifications (instructor_id, message, type) VALUES (?, ?, ?)',
            [instructorId, message, type || 'info']
        );
        res.json({ success: true, data: { id: result.insertId } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get notifications for instructor
router.get('/instructor/:instructorId/notifications', async (req, res) => {
    try {
        // Create table if it doesn't exist
        await db.query(`
            CREATE TABLE IF NOT EXISTS driving_notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                instructor_id INT NOT NULL,
                message TEXT NOT NULL,
                type VARCHAR(50) DEFAULT 'info',
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (instructor_id) REFERENCES driving_instructors(id)
            )
        `);

        const [notifications] = await db.query(
            'SELECT * FROM driving_notifications WHERE instructor_id = ? ORDER BY created_at DESC LIMIT 20',
            [req.params.instructorId]
        );

        // If no real notifications, return some contextual ones
        if (notifications.length === 0) {
            const [newLearners] = await db.query(
                'SELECT COUNT(*) as count FROM driving_learners WHERE assigned_instructor_id = ? AND created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)',
                [req.params.instructorId]
            );
            const mockNotifs = [];
            if (newLearners[0].count > 0) {
                mockNotifs.push({
                    id: 1, message: `Abanyeshuri ${newLearners[0].count} bashya bayiyandikishije mu cyumweru gishize`, type: 'info', is_read: false, created_at: new Date().toISOString()
                });
            }
            mockNotifs.push({ id: 2, message: 'Ibyapa bishya by umuhanda byashyizweho', type: 'success', is_read: true, created_at: new Date(Date.now() - 86400000).toISOString() });
            return res.json({ success: true, data: mockNotifs });
        }

        res.json({ success: true, data: notifications });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Mark notification as read
router.put('/notifications/:id/read', async (req, res) => {
    try {
        await db.query('UPDATE driving_notifications SET is_read = TRUE WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ==================== CALENDAR EVENTS ROUTES ====================

// Create calendar event
router.post('/calendar', async (req, res) => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS driving_calendar (
                id INT AUTO_INCREMENT PRIMARY KEY,
                instructor_id INT NOT NULL,
                title VARCHAR(200) NOT NULL,
                description TEXT,
                event_type ENUM('class','assessment','meeting','test','other') DEFAULT 'class',
                start_time DATETIME NOT NULL,
                end_time DATETIME NOT NULL,
                location VARCHAR(200),
                attendees TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (instructor_id) REFERENCES driving_instructors(id)
            )
        `);
        const { instructorId, title, description, eventType, startTime, endTime, location } = req.body;
        const [result] = await db.query(
            'INSERT INTO driving_calendar (instructor_id, title, description, event_type, start_time, end_time, location) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [instructorId, title, description, eventType || 'class', startTime, endTime, location]
        );
        res.json({ success: true, message: 'Event created', data: { id: result.insertId } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get calendar events for instructor
router.get('/instructor/:instructorId/calendar', async (req, res) => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS driving_calendar (
                id INT AUTO_INCREMENT PRIMARY KEY,
                instructor_id INT NOT NULL,
                title VARCHAR(200) NOT NULL,
                description TEXT,
                event_type ENUM('class','assessment','meeting','test','other') DEFAULT 'class',
                start_time DATETIME NOT NULL,
                end_time DATETIME NOT NULL,
                location VARCHAR(200),
                attendees TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (instructor_id) REFERENCES driving_instructors(id)
            )
        `);

        const [events] = await db.query(
            'SELECT * FROM driving_calendar WHERE instructor_id = ? ORDER BY start_time ASC',
            [req.params.instructorId]
        );

        // If no events, return helpful mock data
        if (events.length === 0) {
            const now = new Date();
            return res.json({
                success: true,
                data: [
                    { id: 1, title: 'Isuzuma ry\'Amategeko', description: 'Ikwirakwizwa ry\'ikibazo', event_type: 'assessment', start_time: new Date(now.getTime() + 86400000).toISOString(), end_time: new Date(now.getTime() + 90000000).toISOString(), location: 'Isoko' },
                    { id: 2, title: 'Inama n\'Abanyeshuri', description: 'Impaka z\'imyigire', event_type: 'meeting', start_time: new Date(now.getTime() + 172800000).toISOString(), end_time: new Date(now.getTime() + 176400000).toISOString(), location: 'Gasabo' }
                ]
            });
        }

        res.json({ success: true, data: events });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Delete calendar event
router.delete('/calendar/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM driving_calendar WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Event deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ==================== REPORTS ROUTES ====================

// Get instructor reports/analytics
router.get('/instructor/:instructorId/reports', async (req, res) => {
    try {
        const instructorId = req.params.instructorId;

        // Total learners
        const [learnersCount] = await db.query(
            'SELECT COUNT(*) as total, SUM(CASE WHEN status = "active" THEN 1 ELSE 0 END) as active, SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END) as completed FROM driving_learners WHERE assigned_instructor_id = ?',
            [instructorId]
        );

        // Total courses
        const [coursesCount] = await db.query(
            'SELECT COUNT(*) as total FROM driving_courses WHERE instructor_id = ?',
            [instructorId]
        );

        // Quiz pass rate
        const [quizStats] = await db.query(
            `SELECT COUNT(*) as total, SUM(CASE WHEN passed = 1 THEN 1 ELSE 0 END) as passed 
            FROM driving_quiz_results qr 
            JOIN driving_learners l ON qr.learner_id = l.id 
            WHERE l.assigned_instructor_id = ?`,
            [instructorId]
        );

        // Materials count
        const [materialsCount] = await db.query(
            'SELECT COUNT(*) as total FROM driving_materials WHERE instructor_id = ?',
            [instructorId]
        );

        // Road signs count
        const [signsCount] = await db.query(
            'SELECT COUNT(*) as total FROM driving_road_signs WHERE instructor_id = ?',
            [instructorId]
        );

        const totalQuizzes = quizStats[0].total || 0;
        const passedQuizzes = quizStats[0].passed || 0;
        const passRate = totalQuizzes > 0 ? Math.round((passedQuizzes / totalQuizzes) * 100) : 0;

        res.json({
            success: true,
            data: {
                learners: {
                    total: learnersCount[0].total || 0,
                    active: learnersCount[0].active || 0,
                    completed: learnersCount[0].completed || 0
                },
                courses: coursesCount[0].total || 0,
                materials: materialsCount[0].total || 0,
                roadSigns: signsCount[0].total || 0,
                quizzes: {
                    total: totalQuizzes,
                    passed: passedQuizzes,
                    passRate
                },
                revenue: (learnersCount[0].active || 0) * 5000  // Estimated 5000 Rwf per learner
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ==================== LEADERBOARD ROUTES ====================

// Get top learners leaderboard
router.get('/leaderboard', async (req, res) => {
    try {
        const [topLearners] = await db.query(`
            SELECT 
                l.id, 
                CONCAT(l.first_name, ' ', l.last_name) as name,
                l.phone,
                COUNT(qr.id) as quizzes_taken,
                COALESCE(MAX(qr.score * 100 / NULLIF(qr.total_questions, 0)), 0) as best_score,
                COALESCE(AVG(qr.score * 100 / NULLIF(qr.total_questions, 0)), 0) as avg_score,
                SUM(CASE WHEN qr.passed = 1 THEN 1 ELSE 0 END) as quizzes_passed
            FROM driving_learners l
            LEFT JOIN driving_quiz_results qr ON l.id = qr.learner_id
            GROUP BY l.id
            ORDER BY avg_score DESC, quizzes_passed DESC
            LIMIT 10
        `);

        res.json({ success: true, data: topLearners });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ==================== INSTRUCTOR PROFILE ROUTES ====================

// Update instructor profile
router.put('/instructor/:id/profile', upload.single('photo'), async (req, res) => {
    try {
        const { firstName, lastName, phone, email, specialization, experienceYears, bio } = req.body;
        const photoField = req.file ? ', photo = ?' : '';
        const params = [firstName, lastName, phone, email, specialization, experienceYears, bio];
        if (req.file) params.push(req.file.filename);
        params.push(req.params.id);

        await db.query(
            `UPDATE driving_instructors SET first_name = ?, last_name = ?, phone = ?, email = ?, specialization = ?, experience_years = ?, bio = ?${photoField} WHERE id = ?`,
            params
        );

        res.json({ success: true, message: 'Amakuru yawe yarungutse' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Update learner
router.put('/learner/:id', async (req, res) => {
    try {
        const { firstName, lastName, phone, email, status } = req.body;
        await db.query(
            'UPDATE driving_learners SET first_name = ?, last_name = ?, phone = ?, email = ?, status = ? WHERE id = ?',
            [firstName, lastName, phone, email, status, req.params.id]
        );
        res.json({ success: true, message: 'Amakuru yarungutse' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Update course publish status
router.put('/courses/:id/publish', async (req, res) => {
    try {
        const { isPublished } = req.body;
        await db.query('UPDATE driving_courses SET is_published = ? WHERE id = ?', [isPublished, req.params.id]);
        res.json({ success: true, message: 'Course updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get instructor dashboard summary
router.get('/instructor/:instructorId/dashboard', async (req, res) => {
    try {
        const id = req.params.instructorId;

        const [[learnersRow]] = await db.query('SELECT COUNT(*) as total FROM driving_learners WHERE assigned_instructor_id = ?', [id]);
        const [[activeRow]] = await db.query('SELECT COUNT(*) as total FROM driving_learners WHERE assigned_instructor_id = ? AND status = "active"', [id]);
        const [[coursesRow]] = await db.query('SELECT COUNT(*) as total FROM driving_courses WHERE instructor_id = ?', [id]);
        const [[stockRow]] = await db.query('SELECT COALESCE(SUM(quantity), 0) as total FROM driving_stock WHERE instructor_id = ?', [id]);
        const [[signsRow]] = await db.query('SELECT COUNT(*) as total FROM driving_road_signs WHERE instructor_id = ?', [id]);
        const [[materialsRow]] = await db.query('SELECT COUNT(*) as total FROM driving_materials WHERE instructor_id = ?', [id]);

        res.json({
            success: true,
            data: {
                totalLearners: learnersRow.total,
                activeLearners: activeRow.total,
                totalCourses: coursesRow.total,
                totalStock: stockRow.total,
                totalSigns: signsRow.total,
                totalMaterials: materialsRow.total
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});



// Stock Routes linked to stockController
router.post('/stock', instructorAuth, (req, res) => stockController.addItem(req, res));
router.get('/stock/:instructorId', instructorAuth, (req, res) => stockController.getItems(req, res));
router.put('/stock/:id', instructorAuth, (req, res) => stockController.updateItem(req, res));
router.delete('/stock/:id', instructorAuth, (req, res) => stockController.deleteItem(req, res));

// Transaction Routes
router.post('/stock/transactions', instructorAuth, (req, res) => stockController.addTransaction(req, res));
router.get('/stock/:id/transactions', instructorAuth, (req, res) => stockController.getItemTransactions(req, res));

// Reports
router.get('/stock-reports/summary', instructorAuth, (req, res) => stockController.getStockSummary(req, res));

module.exports = router;
