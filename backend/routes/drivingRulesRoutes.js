const express = require('express');
const router = express.Router();
const db = require('../db');

// Create driving_rules_users table if not exists
const initDrivingRulesTable = async () => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS driving_rules_users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                national_id VARCHAR(20) UNIQUE NOT NULL,
                phone VARCHAR(20) NOT NULL,
                email VARCHAR(100),
                password VARCHAR(255) NOT NULL,
                quiz_score INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Driving rules users table ready');
    } catch (error) {
        console.error('Error creating driving_rules_users table:', error);
    }
};

initDrivingRulesTable();

// Register a new user
router.post('/register', async (req, res) => {
    try {
        const { firstName, lastName, nationalId, phone, email, password } = req.body;

        // Validation
        if (!firstName || !lastName || !nationalId || !phone || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        // Check if national ID already exists
        const [existing] = await db.query(
            'SELECT id FROM driving_rules_users WHERE national_id = ?',
            [nationalId]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'National ID already registered'
            });
        }

        // Hash password
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        const [result] = await db.query(
            `INSERT INTO driving_rules_users 
            (first_name, last_name, national_id, phone, email, password) 
            VALUES (?, ?, ?, ?, ?, ?)`,
            [firstName, lastName, nationalId, phone, email || null, hashedPassword]
        );

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                id: result.insertId,
                firstName,
                lastName,
                nationalId,
                phone
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { nationalId, password } = req.body;

        if (!nationalId || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide national ID and password'
            });
        }

        // Find user
        const [users] = await db.query(
            'SELECT * FROM driving_rules_users WHERE national_id = ?',
            [nationalId]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const user = users[0];

        // Check password
        const bcrypt = require('bcryptjs');
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate simple token (in production, use JWT)
        const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                id: user.id,
                firstName: user.first_name,
                lastName: user.last_name,
                nationalId: user.national_id,
                phone: user.phone,
                email: user.email,
                quizScore: user.quiz_score,
                token
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Update quiz score
router.put('/score', async (req, res) => {
    try {
        const { userId, score } = req.body;

        if (!userId || score === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Please provide user ID and score'
            });
        }

        await db.query(
            'UPDATE driving_rules_users SET quiz_score = ? WHERE id = ?',
            [score, userId]
        );

        res.json({
            success: true,
            message: 'Quiz score updated'
        });
    } catch (error) {
        console.error('Update score error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Get user profile
router.get('/profile/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [users] = await db.query(
            'SELECT id, first_name, last_name, national_id, phone, email, quiz_score, created_at FROM driving_rules_users WHERE id = ?',
            [id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = users[0];

        res.json({
            success: true,
            data: {
                id: user.id,
                firstName: user.first_name,
                lastName: user.last_name,
                nationalId: user.national_id,
                phone: user.phone,
                email: user.email,
                quizScore: user.quiz_score,
                createdAt: user.created_at
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;
