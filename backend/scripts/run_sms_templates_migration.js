/**
 * Run SMS Templates Migration
 * Usage: node scripts/run_sms_templates_migration.js
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
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

        const migrationPath = path.join(__dirname, '..', 'phase18_sms_templates.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        console.log('📦 Running SMS templates migration...');

        const statements = sql.split(';').filter(s => s.trim());

        for (const statement of statements) {
            if (statement.trim()) {
                try {
                    await connection.query(statement);
                } catch (err) {
                    if (!err.message.includes('Duplicate') && !err.message.includes('already exists')) {
                        console.log('⚠️ Statement warning:', err.message);
                    }
                }
            }
        }

        console.log('✅ SMS templates migration completed!');

        const [templates] = await connection.query('SELECT COUNT(*) as count FROM sms_templates');
        console.log(`✅ ${templates[0].count} SMS templates created`);

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

runMigration();
