const mysql = require('mysql2/promise');
require('dotenv').config();

// Support both individual connection parameters and external database URLs
let poolConfig;

if (process.env.DATABASE_URL) {
    // External database (Aiven, Render, etc.)
    poolConfig = {
        uri: process.env.DATABASE_URL,
        waitForConnections: true,
        connectionLimit: 5,
        queueLimit: 0,
        connectTimeout: 30000, // 30 seconds timeout
        ssl: {
            rejectUnauthorized: false
        }
    };
} else {
    // Local development or manual configuration
    poolConfig = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'garden_tvet',
        waitForConnections: true,
        connectionLimit: 5,
        queueLimit: 0,
        connectTimeout: 30000 // 30 seconds timeout for local connections
    };
}

const pool = mysql.createPool(poolConfig);

// Export pool directly for controllers that use db.query()
// Also export getDb for routes that use getDb()
const getDb = () => pool;

// Test connection and fix applications table schema
const initDatabase = async () => {
    let connection;
    try {
        connection = await pool.getConnection();
        console.log('Database connected successfully');

        // Check if applications table exists
        const [tables] = await connection.query(
            "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ? AND table_name = 'applications'",
            [process.env.DB_NAME || 'garden_tvet']
        );

        if (tables[0].count === 0) {
            // Create applications table
            await connection.query(`
                CREATE TABLE applications (
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
            console.log('✅ Applications table created');
        } else {
            // Check if trade column exists
            const [columns] = await connection.query(
                "SELECT COUNT(*) as count FROM information_schema.columns WHERE table_schema = ? AND table_name = 'applications' AND column_name = 'trade'",
                [process.env.DB_NAME || 'garden_tvet']
            );

            if (columns[0].count === 0) {
                // Add trade column
                await connection.query(
                    "ALTER TABLE applications ADD COLUMN trade VARCHAR(100) NOT NULL DEFAULT 'software'"
                );
                console.log('✅ Added trade column to applications table');
            }

            // Check if level column exists
            const [levelCol] = await connection.query(
                "SELECT COUNT(*) as count FROM information_schema.columns WHERE table_schema = ? AND table_name = 'applications' AND column_name = 'level'",
                [process.env.DB_NAME || 'garden_tvet']
            );

            if (levelCol[0].count === 0) {
                // Add level column
                await connection.query(
                    "ALTER TABLE applications ADD COLUMN level VARCHAR(50) NOT NULL DEFAULT 'Level 3 - Foundation'"
                );
                console.log('✅ Added level column to applications table');
            }

            // Check if review_notes column exists
            const [reviewCol] = await connection.query(
                "SELECT COUNT(*) as count FROM information_schema.columns WHERE table_schema = ? AND table_name = 'applications' AND column_name = 'review_notes'",
                [process.env.DB_NAME || 'garden_tvet']
            );

            if (reviewCol[0].count === 0) {
                await connection.query(
                    "ALTER TABLE applications ADD COLUMN review_notes TEXT"
                );
                console.log('✅ Added review_notes column to applications table');
            }

            // Check if reviewed_at column exists
            const [reviewedCol] = await connection.query(
                "SELECT COUNT(*) as count FROM information_schema.columns WHERE table_schema = ? AND table_name = 'applications' AND column_name = 'reviewed_at'",
                [process.env.DB_NAME || 'garden_tvet']
            );

            if (reviewedCol[0].count === 0) {
                await connection.query(
                    "ALTER TABLE applications ADD COLUMN reviewed_at TIMESTAMP NULL"
                );
                console.log('✅ Added reviewed_at column to applications table');
            }

            console.log('✅ Applications table ready');
        }

        // Check if hero_slides table exists
        const [heroTables] = await connection.query(
            "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ? AND table_name = 'hero_slides'",
            [process.env.DB_NAME || 'garden_tvet']
        );

        if (heroTables[0].count === 0) {
            // Create hero_slides table
            await connection.query(`
                CREATE TABLE hero_slides (
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
            console.log('✅ Hero slides table created');
        } else {
            console.log('✅ Hero slides table ready');
        }

        // Check if notifications table exists
        const [notifTables] = await connection.query(
            "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ? AND table_name = 'notifications'",
            [process.env.DB_NAME || 'garden_tvet']
        );

        if (notifTables[0].count === 0) {
            await connection.query(`
                CREATE TABLE notifications (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    title VARCHAR(255) NOT NULL,
                    message TEXT,
                    type ENUM('info', 'success', 'warning', 'error', 'sms', 'payment', 'grade', 'discipline', 'application') DEFAULT 'info',
                    priority ENUM('low', 'normal', 'urgent') DEFAULT 'normal',
                    is_read BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            console.log('✅ Notifications table created');
        } else {
            console.log('✅ Notifications table ready');
        }

        // Ensure admin user exists with correct credentials
        const bcrypt = require('bcryptjs');
        const adminPasswordHash = bcrypt.hashSync('admin123', 10);

        // Check if admin exists by username only (email column may not exist)
        const [adminCheck] = await connection.query(
            "SELECT id FROM users WHERE username = 'admin'"
        );

        if (adminCheck.length === 0) {
            // Insert new admin user (without email column)
            await connection.query(
                `INSERT INTO users (username, password, first_name, last_name, phone, role) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                ['admin', adminPasswordHash, 'System', 'Admin', '+250780000000', 'admin']
            );
            console.log('✅ Admin user created');
        } else {
            // Update existing admin user
            await connection.query(
                "UPDATE users SET password = ?, first_name = 'System', last_name = 'Admin', role = 'admin', phone = '+250780000000' WHERE username = 'admin'",
                [adminPasswordHash]
            );
            console.log('✅ Admin user updated');
        }

        // Create school_info table
        const [schoolInfoTable] = await connection.query(
            "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ? AND table_name = 'school_info'",
            [process.env.DB_NAME || 'garden_tvet']
        );

        if (schoolInfoTable[0].count === 0) {
            await connection.query(`
                CREATE TABLE school_info (
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
                )
            `);
            console.log('✅ School info table created');

            // Insert default data
            await connection.query(`
                INSERT INTO school_info (section, title, subtitle, description, phone, email, address, location, opening_hours) VALUES
                ('about', 'About Garden TVET School', 'Excellence in Technical and Vocational Education', 'Garden TVET School is a leading technical and vocational education and training institution committed to providing quality education that empowers students with practical skills for the modern workforce.', '+250 780 000 000', 'info@gardentvet.rw', 'Kigali, Rwanda', 'Kigali City', 'Mon-Fri: 7:00 AM - 5:00 PM'),
                ('contact', 'Contact Us', 'Get in Touch with Us', 'We are here to answer any questions you may have about our programs, admissions, or general inquiries.', '+250 780 000 000', 'info@gardentvet.rw', 'Kigali, Rwanda', 'Kigali City', 'Mon-Fri: 7:00 AM - 5:00 PM'),
                ('services', 'Our Services', 'Comprehensive TVET Programs', 'We offer a range of technical and vocational training programs designed to equip students with practical skills.', '+250 780 000 000', 'info@gardentvet.rw', 'Kigali, Rwanda', 'Kigali City', 'Mon-Fri: 7:00 AM - 5:00 PM')
            `);
        }

        // Create contact_messages table
        const [contactTable] = await connection.query(
            "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ? AND table_name = 'contact_messages'",
            [process.env.DB_NAME || 'garden_tvet']
        );

        if (contactTable[0].count === 0) {
            await connection.query(`
                CREATE TABLE contact_messages (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    email VARCHAR(100) NOT NULL,
                    phone VARCHAR(50),
                    subject VARCHAR(200) NOT NULL,
                    message TEXT NOT NULL,
                    is_read BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            console.log('✅ Contact messages table created');
        }

        // Create school_stats table
        const [statsTable] = await connection.query(
            "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ? AND table_name = 'school_stats'",
            [process.env.DB_NAME || 'garden_tvet']
        );

        if (statsTable[0].count === 0) {
            await connection.query(`
                CREATE TABLE school_stats (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    stat_key VARCHAR(50) NOT NULL UNIQUE,
                    stat_value VARCHAR(50) NOT NULL,
                    label VARCHAR(100) NOT NULL,
                    icon VARCHAR(50),
                    display_order INT DEFAULT 0,
                    is_active BOOLEAN DEFAULT TRUE
                )
            `);
            console.log('✅ School stats table created');

            await connection.query(`
                INSERT INTO school_stats (stat_key, stat_value, label, icon, display_order) VALUES
                ('students', '1200+', 'Students Enrolled', 'Users', 1),
                ('teachers', '45+', 'Qualified Teachers', 'GraduationCap', 2),
                ('trades', '3', 'Trade Programs', 'BookOpen', 3),
                ('years', '15+', 'Years of Excellence', 'Award', 4),
                ('graduates', '5000+', 'Graduates', 'Trophy', 5),
                ('partners', '20+', 'Industry Partners', 'Handshake', 6)
            `);
        }

        // Create fees table
        const [feesTable] = await connection.query(
            "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ? AND table_name = 'fees'",
            [process.env.DB_NAME || 'garden_tvet']
        );

        if (feesTable[0].count === 0) {
            await connection.query(`
                CREATE TABLE fees (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    term VARCHAR(50) NOT NULL,
                    trade VARCHAR(100) NOT NULL,
                    level VARCHAR(50) NOT NULL,
                    amount DECIMAL(10,2) NOT NULL,
                    description TEXT,
                    due_date DATE,
                    student_category ENUM('public', 'private', 'both') DEFAULT 'both',
                    is_active BOOLEAN DEFAULT TRUE,
                    created_by INT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            `);
            console.log('✅ Fees table created');
        }

        // Create payments table
        const [paymentsTable] = await connection.query(
            "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ? AND table_name = 'payments'",
            [process.env.DB_NAME || 'garden_tvet']
        );

        if (paymentsTable[0].count === 0) {
            await connection.query(`
                CREATE TABLE payments (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    student_id INT NOT NULL,
                    fee_id INT,
                    amount_paid DECIMAL(10,2) NOT NULL,
                    payment_method ENUM('cash', 'bank_transfer', 'mobile_money', 'credit_card') DEFAULT 'cash',
                    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    receipt_number VARCHAR(50),
                    recorded_by INT,
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (student_id) REFERENCES students(id),
                    FOREIGN KEY (fee_id) REFERENCES fees(id),
                    FOREIGN KEY (recorded_by) REFERENCES users(id)
                )
            `);
            console.log('✅ Payments table created');
        } else {
            console.log('✅ Payments table ready');
        }

        // Create attendance table
        const [attendanceTable] = await connection.query(
            "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ? AND table_name = 'attendance'",
            [process.env.DB_NAME || 'garden_tvet']
        );

        if (attendanceTable[0].count === 0) {
            await connection.query(`
                CREATE TABLE attendance (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    student_id INT NOT NULL,
                    date DATE NOT NULL,
                    status ENUM('present', 'absent', 'late', 'excused') NOT NULL,
                    recorded_by INT,
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
                    FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL,
                    UNIQUE KEY unique_attendance (student_id, date)
                )
            `);
            console.log('✅ Attendance table created');
        } else {
            console.log('✅ Attendance table ready');
        }

        // --- SCHEMAS FIXES FOR MISSING COLUMNS ---

        // Check parent_link_requests for created_at
        try {
            const [parentLinkCols] = await connection.query(
                "SELECT COUNT(*) as count FROM information_schema.columns WHERE table_schema = ? AND table_name = 'parent_link_requests' AND column_name = 'created_at'",
                [process.env.DB_NAME || 'garden_tvet']
            );
            if (parentLinkCols[0].count === 0) {
                await connection.query("ALTER TABLE parent_link_requests ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
                console.log('✅ Added created_at to parent_link_requests');
            }
        } catch (e) { console.error('Error fixing parent_link_requests:', e.message); }

        // Add reg_number, relationship, notes columns to parent_link_requests if missing
        try {
            const extras = ['reg_number VARCHAR(100) NULL', 'relationship VARCHAR(50) NULL', 'notes VARCHAR(500) NULL'];
            for (const col of extras) {
                const colName = col.split(' ')[0];
                const [rows] = await connection.query(
                    "SELECT COUNT(*) as count FROM information_schema.columns WHERE table_schema = ? AND table_name = 'parent_link_requests' AND column_name = ?",
                    [process.env.DB_NAME || 'garden_tvet', colName]
                );
                if (rows[0].count === 0) {
                    await connection.query(`ALTER TABLE parent_link_requests ADD COLUMN ${col}`);
                    console.log(`✅ Added ${colName} to parent_link_requests`);
                }
            }
        } catch (e) { console.error('Error adding extra cols to parent_link_requests:', e.message); }

        // Check stock_items for missing columns
        try {
            const [stockItemsTable] = await connection.query(
                "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ? AND table_name = 'stock_items'",
                [process.env.DB_NAME || 'garden_tvet']
            );

            if (stockItemsTable[0].count === 0) {
                await connection.query(`
                    CREATE TABLE stock_items (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        item_name VARCHAR(200) NOT NULL,
                        item_code VARCHAR(100),
                        category VARCHAR(50) DEFAULT 'other',
                        quantity INT DEFAULT 0,
                        unit VARCHAR(50) DEFAULT 'pieces',
                        min_quantity INT DEFAULT 5,
                        location VARCHAR(200),
                        supplier VARCHAR(200),
                        purchase_date DATE,
                        purchase_price DECIMAL(10,2),
                        description TEXT,
                        status VARCHAR(50) DEFAULT 'available',
                        last_restocked DATE,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                    )
                `);
                console.log('✅ stock_items table created');
            } else {
                const addStockCol = async (col, type) => {
                    const [exists] = await connection.query(
                        "SELECT COUNT(*) as count FROM information_schema.columns WHERE table_schema = ? AND table_name = 'stock_items' AND column_name = ?",
                        [process.env.DB_NAME || 'garden_tvet', col]
                    );
                    if (exists[0].count === 0) {
                        await connection.query(`ALTER TABLE stock_items ADD COLUMN ${col} ${type}`);
                        console.log(`✅ Added ${col} to stock_items`);
                    }
                };
                await addStockCol('item_code', 'VARCHAR(100)');
                await addStockCol('category', 'VARCHAR(50) DEFAULT "other"');
                await addStockCol('unit', 'VARCHAR(50) DEFAULT "pieces"');
                await addStockCol('min_quantity', 'INT DEFAULT 5');
                await addStockCol('location', 'VARCHAR(200)');
                await addStockCol('supplier', 'VARCHAR(200)');
                await addStockCol('purchase_date', 'DATE');
                await addStockCol('purchase_price', 'DECIMAL(10,2)');
                await addStockCol('description', 'TEXT');
                await addStockCol('last_restocked', 'DATE');
            }
        } catch (e) { console.error('Error fixing stock_items:', e.message); }

        // Check stock_transactions table
        try {
            const [stockTransTable] = await connection.query(
                "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ? AND table_name = 'stock_transactions'",
                [process.env.DB_NAME || 'garden_tvet']
            );

            if (stockTransTable[0].count === 0) {
                await connection.query(`
                    CREATE TABLE stock_transactions (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        item_id INT NOT NULL,
                        transaction_type ENUM('purchase', 'usage', 'adjustment', 'damage', 'disposal', 'return') NOT NULL,
                        quantity INT NOT NULL,
                        quantity_before INT NOT NULL,
                        quantity_after INT NOT NULL,
                        unit_price DECIMAL(10,2),
                        total_price DECIMAL(10,2),
                        reference VARCHAR(100),
                        notes TEXT,
                        recorded_by INT,
                        transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (item_id) REFERENCES stock_items(id) ON DELETE CASCADE
                    )
                `);
                console.log('✅ stock_transactions table created');
            }
        } catch (e) { console.error('Error fixing stock_transactions:', e.message); }

        // ===== Drop transaction_reference from payments (no longer used) =====
        try {
            const [txCol] = await connection.query(
                "SELECT COUNT(*) as count FROM information_schema.columns WHERE table_schema = ? AND table_name = 'payments' AND column_name = 'transaction_reference'",
                [process.env.DB_NAME || 'garden_tvet']
            );
            if (txCol[0].count > 0) {
                await connection.query("ALTER TABLE payments DROP COLUMN transaction_reference");
                console.log('✅ Removed transaction_reference column from payments');
            }
        } catch (e) { console.error('Error dropping transaction_reference:', e.message); }

        // Ensure payment_status column exists on payments
        try {
            const [psCol] = await connection.query(
                "SELECT COUNT(*) as count FROM information_schema.columns WHERE table_schema = ? AND table_name = 'payments' AND column_name = 'payment_status'",
                [process.env.DB_NAME || 'garden_tvet']
            );
            if (psCol[0].count === 0) {
                await connection.query("ALTER TABLE payments ADD COLUMN payment_status VARCHAR(20) DEFAULT 'partial'");
                console.log('✅ Added payment_status to payments');
            }
        } catch (e) { console.error('Error adding payment_status:', e.message); }

        // ===== Add term_start_date / term_end_date to fees =====
        try {
            const addFeeCol = async (col, type) => {
                const [exists] = await connection.query(
                    "SELECT COUNT(*) as count FROM information_schema.columns WHERE table_schema = ? AND table_name = 'fees' AND column_name = ?",
                    [process.env.DB_NAME || 'garden_tvet', col]
                );
                if (exists[0].count === 0) {
                    await connection.query(`ALTER TABLE fees ADD COLUMN ${col} ${type}`);
                    console.log(`✅ Added ${col} to fees`);
                }
            };
            await addFeeCol('term_start_date', 'DATE');
            await addFeeCol('term_end_date', 'DATE');
        } catch (e) { console.error('Error adding term dates to fees:', e.message); }

        // ===== Add start_time, end_time, lesson to leave_requests =====
        try {
            const [lrTable] = await connection.query(
                "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ? AND table_name = 'leave_requests'",
                [process.env.DB_NAME || 'garden_tvet']
            );
            if (lrTable[0].count > 0) {
                const addLrCol = async (col, type) => {
                    const [exists] = await connection.query(
                        "SELECT COUNT(*) as count FROM information_schema.columns WHERE table_schema = ? AND table_name = 'leave_requests' AND column_name = ?",
                        [process.env.DB_NAME || 'garden_tvet', col]
                    );
                    if (exists[0].count === 0) {
                        await connection.query(`ALTER TABLE leave_requests ADD COLUMN ${col} ${type}`);
                        console.log(`✅ Added ${col} to leave_requests`);
                    }
                };
                await addLrCol('start_time', 'TIME NULL');
                await addLrCol('end_time', 'TIME NULL');
                await addLrCol('lesson', 'VARCHAR(200) NULL');
                await addLrCol('actual_return_time', 'DATETIME NULL');
                await addLrCol('returned_by', 'INT NULL');
                await addLrCol('return_notes', 'VARCHAR(500) NULL');
            }
        } catch (e) { console.error('Error adding columns to leave_requests:', e.message); }

        // ===== Ensure news engagement tables exist =====
        try {
            await connection.query(`
                CREATE TABLE IF NOT EXISTS news_engagement (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    news_id INT NOT NULL,
                    user_id INT NULL,
                    guest_session_id VARCHAR(120) NULL,
                    engagement_type ENUM('view','like','share') NOT NULL DEFAULT 'view',
                    platform VARCHAR(40) DEFAULT 'website',
                    ip_address VARCHAR(64) NULL,
                    user_agent VARCHAR(255) NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_news_id (news_id),
                    INDEX idx_user_id (user_id),
                    INDEX idx_engagement_type (engagement_type)
                )
            `);
            await connection.query(`
                CREATE TABLE IF NOT EXISTS news_comments (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    news_id INT NOT NULL,
                    user_id INT NULL,
                    guest_name VARCHAR(120) DEFAULT 'Anonymous',
                    comment TEXT NOT NULL,
                    parent_comment_id INT NULL,
                    is_approved TINYINT(1) DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_news_id (news_id)
                )
            `);
            const addNewsCol = async (col, type) => {
                const [ex] = await connection.query(
                    "SELECT COUNT(*) as count FROM information_schema.columns WHERE table_schema = ? AND table_name = 'news' AND column_name = ?",
                    [process.env.DB_NAME || 'garden_tvet', col]
                );
                if (ex[0].count === 0) {
                    await connection.query(`ALTER TABLE news ADD COLUMN ${col} ${type}`);
                    console.log(`✅ Added ${col} to news`);
                }
            };
            await addNewsCol('views_count', 'INT DEFAULT 0');
            await addNewsCol('likes_count', 'INT DEFAULT 0');
            await addNewsCol('shares_count', 'INT DEFAULT 0');
            await addNewsCol('comments_count', 'INT DEFAULT 0');
        } catch (e) { console.error('Error setting up news engagement tables:', e.message); }

        connection.release();
    } catch (err) {
        console.error('Error initializing database:', err);
        if (connection) connection.release();
    }
};

// ────────────────────────────────────────────────────────────────────
// Academic Year + Term migrations (idempotent)
// ────────────────────────────────────────────────────────────────────
const initAcademic = async () => {
    let connection;
    try {
        connection = await pool.getConnection();

        await connection.query(`
            CREATE TABLE IF NOT EXISTS academic_years (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(50) NOT NULL UNIQUE,
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                status ENUM('planning','active','closed') DEFAULT 'active',
                is_current TINYINT(1) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                closed_at TIMESTAMP NULL,
                closed_by INT NULL,
                INDEX idx_is_current (is_current),
                INDEX idx_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS academic_terms (
                id INT AUTO_INCREMENT PRIMARY KEY,
                academic_year_id INT NOT NULL,
                term_number TINYINT NOT NULL,
                name VARCHAR(50) NOT NULL,
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                status ENUM('upcoming','active','ended') DEFAULT 'upcoming',
                ended_at TIMESTAMP NULL,
                ended_by INT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY uniq_year_term (academic_year_id, term_number),
                CONSTRAINT fk_term_year FOREIGN KEY (academic_year_id)
                    REFERENCES academic_years(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS student_promotions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id INT NOT NULL,
                from_academic_year_id INT NULL,
                to_academic_year_id INT NULL,
                from_trade VARCHAR(100) NULL,
                to_trade VARCHAR(100) NULL,
                from_level VARCHAR(50) NULL,
                to_level VARCHAR(50) NULL,
                action ENUM('enrolled','promoted','retained','graduated','transferred') NOT NULL,
                notes TEXT NULL,
                created_by INT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_student (student_id),
                INDEX idx_from_year (from_academic_year_id),
                INDEX idx_to_year (to_academic_year_id),
                INDEX idx_action (action)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

        // students extensions
        const tryAlter = async (sql) => {
            try { await connection.query(sql); } catch (_) { /* exists */ }
        };
        await tryAlter(`ALTER TABLE students ADD COLUMN photo_url VARCHAR(500) NULL`);
        await tryAlter(`ALTER TABLE students ADD COLUMN academic_year_id INT NULL`);
        await tryAlter(`ALTER TABLE students ADD COLUMN graduation_status ENUM('in_progress','graduated') DEFAULT 'in_progress'`);
        await tryAlter(`ALTER TABLE students ADD COLUMN application_id INT NULL`);
        await tryAlter(`ALTER TABLE students MODIFY COLUMN current_status ENUM('active','sick','left','suspended','on_leave','expelled','graduated') DEFAULT 'active'`);
        await tryAlter(`ALTER TABLE students MODIFY COLUMN student_type ENUM('private','public','government','bursary','sponsored') DEFAULT 'private'`);
        await tryAlter(`ALTER TABLE students ADD INDEX idx_academic_year (academic_year_id)`);

        // applications extensions
        await tryAlter(`ALTER TABLE applications ADD COLUMN enrolled_student_id INT NULL`);
        await tryAlter(`ALTER TABLE applications ADD COLUMN enrolled_at TIMESTAMP NULL`);
        await tryAlter(`ALTER TABLE applications ADD COLUMN enrolled_trade VARCHAR(100) NULL`);
        await tryAlter(`ALTER TABLE applications ADD COLUMN enrolled_level VARCHAR(50) NULL`);
        await tryAlter(`ALTER TABLE applications ADD COLUMN enrolled_academic_year_id INT NULL`);
        await tryAlter(`ALTER TABLE applications ADD COLUMN waitlisted TINYINT(1) DEFAULT 0`);
        // Allow a 4th status value used by the controller
        try {
            await connection.query(`
                ALTER TABLE applications
                MODIFY COLUMN status ENUM('pending','approved','rejected','waitlisted') DEFAULT 'pending'
            `);
        } catch (_) {}

        console.log('✅ Academic-year / promotion tables ready');

        // ─── Employer directory & outreach ──────────────────────────
        await connection.query(`
            CREATE TABLE IF NOT EXISTS employers (
                id INT PRIMARY KEY AUTO_INCREMENT,
                company_name      VARCHAR(200) NOT NULL,
                contact_person    VARCHAR(150) NULL,
                email             VARCHAR(200) NULL,
                phone             VARCHAR(50)  NULL,
                sector            VARCHAR(120) NULL,
                address           VARCHAR(300) NULL,
                website           VARCHAR(300) NULL,
                preferred_trades  VARCHAR(300) NULL,
                notes             TEXT NULL,
                status            ENUM('active','inactive','archived') DEFAULT 'active',
                created_by        INT NULL,
                created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at        DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_company (company_name),
                INDEX idx_sector  (sector),
                INDEX idx_status  (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS employer_outreach (
                id INT PRIMARY KEY AUTO_INCREMENT,
                employer_id      INT NOT NULL,
                recipient_email  VARCHAR(200) NOT NULL,
                subject          VARCHAR(300) NOT NULL,
                message          TEXT NULL,
                attached_pdf     TINYINT(1) DEFAULT 1,
                filter_year_id   INT NULL,
                filter_trade     VARCHAR(120) NULL,
                filter_search    VARCHAR(200) NULL,
                graduate_count   INT DEFAULT 0,
                status           ENUM('sent','failed','queued') DEFAULT 'sent',
                error            VARCHAR(500) NULL,
                sent_by          INT NULL,
                sent_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_employer (employer_id),
                INDEX idx_status   (status),
                INDEX idx_sent_at  (sent_at),
                CONSTRAINT fk_outreach_employer
                    FOREIGN KEY (employer_id) REFERENCES employers(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS email_log (
                id INT PRIMARY KEY AUTO_INCREMENT,
                recipient     VARCHAR(500) NOT NULL,
                subject       VARCHAR(500) NOT NULL,
                status        ENUM('sent','failed','queued') DEFAULT 'sent',
                error         VARCHAR(1000) NULL,
                message_id    VARCHAR(300) NULL,
                category      VARCHAR(80)  NULL,
                related_id    INT NULL,
                body_preview  TEXT NULL,
                sent_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_status   (status),
                INDEX idx_category (category),
                INDEX idx_sent_at  (sent_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('✅ Employer / outreach / email_log tables ready');

        connection.release();
    } catch (err) {
        console.error('Academic-year migration error:', err.message);
        if (connection) connection.release();
    }
};

// Initialize database on module load - handle connection errors gracefully
initDatabase()
    .then(() => initAcademic())
    .catch(err => {
        console.log('Database will initialize on first API request');
    });

// Export pool directly so controllers can use db.query()
// Also export getDb as a named export for backward compatibility
pool.getDb = () => pool;
module.exports = pool;
