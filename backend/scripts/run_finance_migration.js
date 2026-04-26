// Run finance tables migration
const db = require('../db');

async function runMigration() {
    try {
        console.log('Checking fees table...');

        // Add missing columns to fees table if they don't exist
        try {
            await db.execute(`ALTER TABLE fees ADD COLUMN description TEXT`);
            console.log('✅ Added description column');
        } catch (e) {
            console.log('Description column already exists or error:', e.message);
        }

        try {
            await db.execute(`ALTER TABLE fees ADD COLUMN due_date DATE`);
            console.log('✅ Added due_date column');
        } catch (e) {
            console.log('Due_date column already exists or error:', e.message);
        }

        // Add sample fees data if none exist
        const [existing] = await db.execute('SELECT COUNT(*) as count FROM fees');
        if (existing[0].count === 0) {
            console.log('Adding sample fees...');
            await db.execute(`
                INSERT INTO fees (term, trade, level, amount, student_category, is_active) VALUES
                ('Term 1 2026', 'Software Development', 'Level 3', 150000, 'both', TRUE),
                ('Term 1 2026', 'Software Development', 'Level 4', 150000, 'both', TRUE),
                ('Term 1 2026', 'Software Development', 'Level 5', 150000, 'both', TRUE),
                ('Term 1 2026', 'Automobile Technology', 'Level 3', 150000, 'both', TRUE),
                ('Term 1 2026', 'Automobile Technology', 'Level 4A', 150000, 'both', TRUE),
                ('Term 1 2026', 'Automobile Technology', 'Level 4B', 150000, 'both', TRUE),
                ('Term 1 2026', 'Automobile Technology', 'Level 5A', 150000, 'both', TRUE),
                ('Term 1 2026', 'Automobile Technology', 'Level 5B', 150000, 'both', TRUE),
                ('Term 1 2026', 'Building & Construction', 'Level 3', 150000, 'both', TRUE),
                ('Term 1 2026', 'Building & Construction', 'Level 4', 150000, 'both', TRUE),
                ('Term 1 2026', 'Building & Construction', 'Level 5', 150000, 'both', TRUE)
            `);
            console.log('✅ Sample fees added');
        } else {
            console.log('Fees already exist, skipping sample data');
        }

        console.log('Creating payments table...');

        // Create payments table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS payments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id INT NOT NULL,
                fee_id INT,
                amount_paid DECIMAL(10,2) NOT NULL,
                payment_method ENUM('cash', 'bank_transfer', 'mobile_money', 'credit_card') DEFAULT 'cash',
                payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                transaction_reference VARCHAR(100),
                receipt_number VARCHAR(50),
                recorded_by INT,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        console.log('✅ Payments table created');

        console.log('Finance tables migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error.message);
        process.exit(1);
    }
}

runMigration();
