const mysql = require('mysql2/promise');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function runMigration() {
    // Create connection
    let poolConfig;
    if (process.env.DATABASE_URL) {
        poolConfig = {
            uri: process.env.DATABASE_URL,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            ssl: { rejectUnauthorized: false }
        };
    } else {
        poolConfig = {
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'garden_tvet',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        };
    }

    const pool = mysql.createPool(poolConfig);

    try {
        // Read SQL file
        const sqlFile = path.join(__dirname, '..', 'phase14_payment_reminders.sql');
        const sql = fs.readFileSync(sqlFile, 'utf8');

        console.log('Running migration: phase14_payment_reminders.sql');

        // Split by semicolons and execute each statement
        // Use a more robust approach - execute whole blocks
        const lines = sql.split('\n');
        let currentStatement = '';
        let statementCount = 0;

        for (const line of lines) {
            // Skip comments and empty lines
            if (line.trim().startsWith('--') || !line.trim()) continue;

            currentStatement += line + ' ';

            // Check if we've reached a complete statement
            if (line.trim().endsWith(';')) {
                statementCount++;
                try {
                    await pool.query(currentStatement);
                    console.log(`Statement ${statementCount} executed successfully`);
                } catch (err) {
                    // Show error but continue (may be "already exists")
                    if (err.message.includes('already exists')) {
                        console.log(`Statement ${statementCount}: Table already exists (OK)`);
                    } else {
                        console.error(`Statement ${statementCount} error:`, err.message.substring(0, 100));
                    }
                }
                currentStatement = '';
            }
        }

        console.log('\nMigration completed!');

        // Verify tables were created
        const [tables] = await pool.query("SHOW TABLES LIKE 'payment_reminder%'");
        console.log('\nCreated tables:', tables.map(t => Object.values(t)[0]));

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runMigration();