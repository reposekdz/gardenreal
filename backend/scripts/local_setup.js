/**
 * Garden TVET School - Quick Local Setup Script
 * 
 * This script sets up a complete local MySQL database for development.
 * 
 * PREREQUISITES:
 * 1. Install XAMPP (https://www.apachefriends.org/) - includes MySQL
 * 2. OR Install MySQL standalone (https://dev.mysql.com/downloads/mysql/)
 * 3. Start MySQL service
 * 
 * USAGE:
 *   node scripts/local_setup.js
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
};

const DB_NAME = 'garden_tvet';

const schema = `
-- =====================================================
-- GARDEN TVET SCHOOL - COMPLETE DATABASE SCHEMA
-- =====================================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    role ENUM('admin', 'dod', 'accountant', 'stock_manager', 'parent') NOT NULL,
    avatar VARCHAR(255),
    province VARCHAR(50),
    district VARCHAR(50),
    sector VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_role (role),
    INDEX idx_phone (phone),
    INDEX idx_username (username)
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reg_number VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    gender ENUM('male', 'female'),
    date_of_birth DATE,
    trade VARCHAR(100) NOT NULL,
    level VARCHAR(50) NOT NULL,
    year_enrolled YEAR,
    contact_phone VARCHAR(20),
    contact_email VARCHAR(100),
    guardian_name VARCHAR(100),
    guardian_phone VARCHAR(20),
    guardian_relation VARCHAR(50),
    address_province VARCHAR(50),
    address_district VARCHAR(50),
    address_sector VARCHAR(50),
    address_cell VARCHAR(50),
    address_village VARCHAR(50),
    photo_url VARCHAR(255),
    current_status ENUM('active', 'sick', 'left', 'suspended', 'graduated', 'expelled') DEFAULT 'active',
    graduation_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_reg_number (reg_number),
    INDEX idx_trade (trade),
    INDEX idx_level (level),
    INDEX idx_status (current_status)
);

-- Parent-Student Links
CREATE TABLE IF NOT EXISTS parent_student_links (
    id INT AUTO_INCREMENT PRIMARY KEY,
    parent_id INT NOT NULL,
    student_id INT NOT NULL,
    relationship VARCHAR(50) DEFAULT 'parent',
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    approved_by INT,
    approved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_link (parent_id, student_id)
);

-- Discipline Records
CREATE TABLE IF NOT EXISTS discipline_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    action_type ENUM('sick', 'leave', 'punish', 'conduct_good', 'conduct_removal', 'warning', 'suspension', 'student_leave', 'reinstatement') NOT NULL,
    description TEXT NOT NULL,
    severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'low',
    recorded_by INT,
    status ENUM('active', 'resolved', 'appealed') DEFAULT 'active',
    resolution_date DATE,
    resolution_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_student (student_id),
    INDEX idx_action_type (action_type),
    INDEX idx_status (status)
);

-- Fees Structure
CREATE TABLE IF NOT EXISTS fees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    term VARCHAR(50) NOT NULL,
    trade VARCHAR(100) NOT NULL,
    level VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    description VARCHAR(255),
    due_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_term (term),
    INDEX idx_trade_level (trade, level)
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    fee_id INT,
    amount_paid DECIMAL(10, 2) NOT NULL,
    payment_method ENUM('cash', 'bank_transfer', 'mobile_money', 'card', 'other') DEFAULT 'cash',
    transaction_reference VARCHAR(100),
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    recorded_by INT,
    notes TEXT,
    receipt_number VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (fee_id) REFERENCES fees(id) ON DELETE SET NULL,
    FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_student (student_id),
    INDEX idx_payment_date (payment_date),
    INDEX idx_receipt (receipt_number)
);

-- Stock Items
CREATE TABLE IF NOT EXISTS stock_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_name VARCHAR(100) NOT NULL,
    item_code VARCHAR(50),
    category ENUM('equipment', 'supplies', 'furniture', 'electronics', 'tools', 'stationery', 'other') DEFAULT 'other',
    quantity INT DEFAULT 0,
    unit VARCHAR(20) DEFAULT 'pieces',
    min_quantity INT DEFAULT 5,
    location VARCHAR(100),
    supplier VARCHAR(100),
    purchase_date DATE,
    purchase_price DECIMAL(10, 2),
    status ENUM('available', 'low_stock', 'depleted', 'under_maintenance', 'damaged') DEFAULT 'available',
    description TEXT,
    last_restocked DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_status (status),
    INDEX idx_name (item_name)
);

-- Stock Transactions
CREATE TABLE IF NOT EXISTS stock_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    transaction_type ENUM('purchase', 'usage', 'adjustment', 'damage', 'disposal', 'return') NOT NULL,
    quantity INT NOT NULL,
    quantity_before INT NOT NULL,
    quantity_after INT NOT NULL,
    unit_price DECIMAL(10, 2),
    total_price DECIMAL(10, 2),
    reference VARCHAR(100),
    notes TEXT,
    recorded_by INT,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES stock_items(id) ON DELETE CASCADE,
    FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_item (item_id),
    INDEX idx_type (transaction_type),
    INDEX idx_date (transaction_date)
);

-- News
CREATE TABLE IF NOT EXISTS news (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    summary VARCHAR(300),
    category ENUM('announcement', 'event', 'notice', 'achievement', 'sports', 'academic') DEFAULT 'announcement',
    image_url VARCHAR(255),
    author_id INT,
    is_published BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    publish_date DATE,
    expiry_date DATE,
    view_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_category (category),
    INDEX idx_published (is_published),
    INDEX idx_publish_date (publish_date)
);

-- CMS Pages
CREATE TABLE IF NOT EXISTS cms_pages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    page_key VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    meta_description VARCHAR(300),
    hero_image VARCHAR(255),
    is_published BOOLEAN DEFAULT FALSE,
    updated_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_key (page_key)
);

-- Trades
CREATE TABLE IF NOT EXISTS trades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE,
    description TEXT,
    duration_years INT DEFAULT 3,
    levels JSON,
    is_active BOOLEAN DEFAULT TRUE,
    icon VARCHAR(50),
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_active (is_active)
);

-- Applications
CREATE TABLE IF NOT EXISTS applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    gender ENUM('male', 'female') NOT NULL,
    date_of_birth DATE,
    province VARCHAR(50),
    district VARCHAR(50),
    sector VARCHAR(50),
    trade VARCHAR(100) NOT NULL,
    level VARCHAR(50) NOT NULL,
    previous_school VARCHAR(200),
    previous_sector VARCHAR(100),
    has_laptop VARCHAR(10),
    heard_from VARCHAR(100),
    motivation TEXT,
    status ENUM('pending', 'reviewed', 'accepted', 'rejected', 'waitlisted') DEFAULT 'pending',
    reviewed_by INT,
    review_notes TEXT,
    reviewed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_trade (trade)
);

-- Hero Slides
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
);

-- School Info
CREATE TABLE IF NOT EXISTS school_info (
    id INT AUTO_INCREMENT PRIMARY KEY,
    section VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(200),
    subtitle VARCHAR(500),
    description TEXT,
    phone VARCHAR(50),
    email VARCHAR(100),
    address VARCHAR(500),
    location VARCHAR(200),
    map_url TEXT,
    opening_hours VARCHAR(200),
    facebook_url VARCHAR(200),
    twitter_url VARCHAR(200),
    instagram_url VARCHAR(200),
    youtube_url VARCHAR(200),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Contact Messages
CREATE TABLE IF NOT EXISTS contact_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    subject VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- School Stats
CREATE TABLE IF NOT EXISTS school_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    stat_key VARCHAR(50) NOT NULL UNIQUE,
    stat_value VARCHAR(50) NOT NULL,
    label VARCHAR(100) NOT NULL,
    icon VARCHAR(50),
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

-- Settings
CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(50) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description VARCHAR(200),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_key (setting_key)
);

-- SMS Logs
CREATE TABLE IF NOT EXISTS sms_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phone VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    status ENUM('sent', 'failed', 'pending') DEFAULT 'sent',
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

const defaultData = async (connection) => {
    console.log('📝 Inserting default data...');

    // Hash password for default users
    const adminPassword = bcrypt.hashSync('2026', 10);
    const dodPassword = bcrypt.hashSync('dod123', 10);
    const accountantPassword = bcrypt.hashSync('accountant123', 10);
    const stockPassword = bcrypt.hashSync('stock123', 10);

    // Insert default users
    await connection.query(`
        INSERT IGNORE INTO users (username, password, first_name, last_name, phone, email, role) VALUES
        ('admin', ?, 'System', 'Admin', '+250780000000', 'admin@garden.rw', 'admin'),
        ('dod', ?, 'John', 'Mugisha', '+250780000001', 'dod@garden.rw', 'dod'),
        ('accountant', ?, 'Mary', 'Uwase', '+250780000002', 'accountant@garden.rw', 'accountant'),
        ('stock_manager', ?, 'Peter', 'Nkusi', '+250780000003', 'stock@garden.rw', 'stock_manager')
    `, [adminPassword, dodPassword, accountantPassword, stockPassword]);

    // Insert default trades
    await connection.query(`
        INSERT IGNORE INTO trades (name, code, description, icon, image_url) VALUES
        ('Software Development', 'SD', 'Learn programming and software development skills', 'code', '/uploads/trade card image/sod.jpg'),
        ('Automobile Technology', 'AT', 'Master automotive repair and maintenance', 'car', '/uploads/trade card image/auto.jpg'),
        ('Building and Construction', 'BC', 'Civil engineering and construction skills', 'hard-hat', '/uploads/trade card image/bdc.jpg')
    `);

    // Insert default students
    await connection.query(`
        INSERT IGNORE INTO students (reg_number, first_name, last_name, gender, trade, level, current_status, contact_phone) VALUES
        ('GTVET2025001', 'Jean', 'Mugisha', 'male', 'Software Development', 'Level 1', 'active', '+250788111111'),
        ('GTVET2025002', 'Marie', 'Uwase', 'female', 'Automobile Technology', 'Level 1', 'active', '+250788222222'),
        ('GTVET2025003', 'Pierre', 'Niyonkuru', 'male', 'Building and Construction', 'Level 2', 'active', '+250788333333'),
        ('GTVET2025004', 'Grace', 'Mukamana', 'female', 'Software Development', 'Level 2', 'active', '+250788444444'),
        ('GTVET2025005', 'Paul', 'Bizimana', 'male', 'Automobile Technology', 'Level 3', 'active', '+250788555555')
    `);

    // Insert default fees
    await connection.query(`
        INSERT IGNORE INTO fees (term, trade, level, amount, description) VALUES
        ('Term 1 2025', 'Software Development', 'Level 1', 150000, 'First term fees for Level 1 Software Development'),
        ('Term 1 2025', 'Automobile Technology', 'Level 1', 120000, 'First term fees for Level 1 Automobile Technology'),
        ('Term 1 2025', 'Building and Construction', 'Level 1', 100000, 'First term fees for Level 1 Building and Construction'),
        ('Term 1 2025', 'Software Development', 'Level 2', 150000, 'First term fees for Level 2 Software Development'),
        ('Term 1 2025', 'Software Development', 'Level 3', 150000, 'First term fees for Level 3 Software Development')
    `);

    // Insert default stock items
    await connection.query(`
        INSERT IGNORE INTO stock_items (item_name, item_code, category, quantity, min_quantity, status) VALUES
        ('Laptop Computer', 'LAP-001', 'electronics', 15, 5, 'available'),
        ('Projector', 'PROJ-001', 'electronics', 3, 2, 'available'),
        ('Office Desk', 'FURN-001', 'furniture', 20, 5, 'available'),
        ('Office Chair', 'FURN-002', 'furniture', 25, 5, 'available'),
        ('Whiteboard Marker', 'STAT-001', 'stationery', 50, 20, 'available'),
        ('Exercise Book', 'STAT-002', 'stationery', 200, 50, 'available'),
        ('Tool Kit - Automotive', 'TOOL-001', 'tools', 10, 3, 'available'),
        ('Safety Helmet', 'SAFE-001', 'equipment', 30, 10, 'available')
    `);

    // Insert hero slides
    await connection.query(`
        INSERT IGNORE INTO hero_slides (title, subtitle, image_url, button_text, button_link, order_index, is_active) VALUES
        ('Shape Your Future', 'Garden TVET School empowers you with hands-on skills', 'http://localhost:5000/uploads/school view/IMG-20250222-WA0013.jpg', 'Apply Now', '/apply', 1, TRUE),
        ('Learn from Experts', 'Our teachers are industry professionals', 'http://localhost:5000/uploads/school view/IMG-20250222-WA0015.jpg', 'Learn More', '/about', 2, TRUE),
        ('Build Your Career', 'Get practical skills that employers need', 'http://localhost:5000/uploads/school view/IMG-20250222-WA0017.jpg', 'View Programs', '/services', 3, TRUE)
    `);

    // Insert school info
    await connection.query(`
        INSERT IGNORE INTO school_info (section, title, subtitle, description, phone, email, address, location, opening_hours) VALUES
        ('about', 'About Garden TVET School', 'Excellence in Technical and Vocational Education', 'Garden TVET School is a leading technical and vocational education and training institution.', '+250 780 000 000', 'info@gardentvet.rw', 'Kigali, Rwanda', 'Kigali City', 'Mon-Fri: 7:00 AM - 5:00 PM'),
        ('contact', 'Contact Us', 'Get in Touch with Us', 'We are here to answer any questions you may have.', '+250 780 000 000', 'info@gardentvet.rw', 'Kigali, Rwanda', 'Kigali City', 'Mon-Fri: 7:00 AM - 5:00 PM'),
        ('services', 'Our Services', 'Comprehensive TVET Programs', 'We offer a range of technical and vocational training programs.', '+250 780 000 000', 'info@gardentvet.rw', 'Kigali, Rwanda', 'Kigali City', 'Mon-Fri: 7:00 AM - 5:00 PM')
    `);

    // Insert school stats
    await connection.query(`
        INSERT IGNORE INTO school_stats (stat_key, stat_value, label, icon, display_order) VALUES
        ('students', '500+', 'Students Enrolled', 'Users', 1),
        ('teachers', '25+', 'Qualified Teachers', 'GraduationCap', 2),
        ('trades', '3', 'Trade Programs', 'BookOpen', 3),
        ('years', '10+', 'Years of Excellence', 'Award', 4)
    `);

    // Insert settings
    await connection.query(`
        INSERT IGNORE INTO settings (setting_key, setting_value, setting_type, description) VALUES
        ('school_name', 'Garden TVET School', 'string', 'School name'),
        ('school_phone', '+250788000000', 'string', 'Contact phone'),
        ('school_email', 'info@gardentvet.rw', 'string', 'Contact email'),
        ('school_address', 'Kigali, Rwanda', 'string', 'School address'),
        ('current_academic_year', '2025-2026', 'string', 'Current academic year'),
        ('current_term', 'Term 1 2025', 'string', 'Current term')
    `);

    console.log('✅ Default data inserted successfully');
};

async function setup() {
    console.log('🚀 Garden TVET School - Local Database Setup');
    console.log('=============================================\n');

    let connection;
    try {
        // Connect to MySQL server
        console.log('📡 Connecting to MySQL...');
        connection = await mysql.createConnection(DB_CONFIG);
        console.log('✅ Connected to MySQL server\n');

        // Create database if not exists
        console.log(`📦 Creating database "${DB_NAME}"...`);
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${DB_NAME}`);
        await connection.query(`USE ${DB_NAME}`);
        console.log(`✅ Database "${DB_NAME}" ready\n`);

        // Create tables
        console.log('📋 Creating tables...');
        await connection.query(schema);
        console.log('✅ All tables created\n');

        // Insert default data
        await defaultData(connection);

        console.log('\n=============================================');
        console.log('🎉 SETUP COMPLETE!');
        console.log('=============================================\n');

        console.log('📝 DEFAULT LOGIN CREDENTIALS:');
        console.log('----------------------------');
        console.log('🔴 Admin:    username: admin    | password: 2026');
        console.log('🟣 DoD:      username: dod      | password: dod123');
        console.log('🟢 Accountant: username: accountant | password: accountant123');
        console.log('🟡 Stock:    username: stock_manager | password: stock123');
        console.log('\n');

        console.log('📌 NEXT STEPS:');
        console.log('1. Update backend/.env with your DB credentials:');
        console.log('   DB_HOST=localhost');
        console.log('   DB_USER=root');
        console.log('   DB_PASSWORD=your_password');
        console.log('   DB_NAME=garden_tvet');
        console.log('\n2. Start the backend: cd backend && node server.js');
        console.log('3. Start the frontend: cd frontend && npm run dev');
        console.log('\n');

    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        console.log('\n💡 Make sure MySQL is running!');
        console.log('   - Install XAMPP and start MySQL');
        console.log('   - OR install MySQL standalone');
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

setup();
