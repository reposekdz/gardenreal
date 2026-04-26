/**
 * Run Grades Migration
 * Usage: node scripts/run_grades_migration.js
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    // Get database config from environment or use defaults
    const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'garden_tvet',
        multipleStatements: true
    };

    let connection;

    try {
        console.log('🔌 Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to database');

        // Read the migration file
        const migrationPath = path.join(__dirname, '..', 'phase17_grades.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        console.log('📦 Running grades migration...');

        // Split by semicolon and execute each statement
        const statements = sql.split(';').filter(s => s.trim());

        for (const statement of statements) {
            if (statement.trim()) {
                try {
                    await connection.query(statement);
                } catch (err) {
                    // Ignore duplicate column errors
                    if (!err.message.includes('Duplicate column')) {
                        console.log('⚠️ Statement warning:', err.message);
                    }
                }
            }
        }

        console.log('✅ Grades migration completed successfully!');

        // Verify the table was created
        const [tables] = await connection.query('SHOW TABLES LIKE "student_grades"');
        if (tables.length > 0) {
            console.log('✅ Table student_grades created/verified');
        }

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run the migration
runMigration();
