/**
 * Garden TVET School - Complete Database Migration Script
 * 
 * This script imports all SQL files to create a complete, fully functional database.
 * It processes files in the correct order to maintain referential integrity.
 * 
 * USAGE:
 *   node scripts/import_all_sql.js
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
};

const DB_NAME = 'garden_tvet';

// List of SQL files in the order they should be executed
const SQL_FILES = [
    // Phase 1 - Base schema
    'database.sql',

    // Phase 6 - News and content
    'phase6_update.sql',

    // Phase 8 - Additional updates
    'phase8_update.sql',

    // Phase 9 - More updates
    'phase9_update.sql',

    // Phase 10 - Complete schema
    'phase10_complete_schema.sql',

    // Phase 11 - Applications and advanced features
    'phase11_applications.sql',
    'phase11_advanced_features.sql',

    // Phase 12-19 - Additional features
    'phase12_news_images.sql',
    'phase13_payment_receipts.sql',
    'phase14_payment_reminders.sql',
    'phase15_fix_hero.sql',
    'phase16_sms_notifications.sql',
    'phase17_grades.sql',
    'phase18_sms_templates.sql',
    'phase19_news_engagement.sql',

    // Additional SQL files
    'hero_slides.sql',
    'school_info.sql',
    'add_default_trades.sql',
    'add_default_admin.sql',
    'fix_trades.sql'
];

async function importSQLFile(connection, filePath) {
    console.log(`📄 Importing: ${path.basename(filePath)}`);
    const sql = fs.readFileSync(filePath, 'utf8');

    // Split by semicolon and filter empty statements
    const statements = sql.split(';').filter(s => s.trim().length > 0);

    for (const statement of statements) {
        if (statement.trim().length > 0) {
            try {
                await connection.query(statement);
            } catch (err) {
                // Ignore duplicate key errors and certain other errors
                if (!err.message.includes('Duplicate entry') &&
                    !err.message.includes('already exists') &&
                    !err.message.includes('Unknown column')) {
                    console.log(`   ⚠️  Warning: ${err.message.split('\n')[0]}`);
                }
            }
        }
    }
    console.log(`   ✅ Done`);
}

async function setup() {
    console.log('🚀 Garden TVET School - Complete Database Import');
    console.log('================================================\n');

    let connection;
    try {
        // Connect to MySQL server
        console.log('📡 Connecting to MySQL...');
        connection = await mysql.createConnection(DB_CONFIG);
        console.log('✅ Connected to MySQL server\n');

        // Drop existing database
        console.log('🗑️  Dropping existing database...');
        await connection.query(`DROP DATABASE IF EXISTS ${DB_NAME}`);
        console.log(`✅ Database "${DB_NAME}" dropped\n`);

        // Create database
        console.log('📦 Creating database...');
        await connection.query(`CREATE DATABASE ${DB_NAME}`);
        await connection.query(`USE ${DB_NAME}`);
        console.log(`✅ Database "${DB_NAME}" created\n`);

        // Import all SQL files
        console.log('📥 Importing SQL files...\n');

        for (const sqlFile of SQL_FILES) {
            const filePath = path.join(__dirname, '..', sqlFile);

            if (fs.existsSync(filePath)) {
                await importSQLFile(connection, filePath);
            } else {
                console.log(`⚠️  File not found: ${sqlFile}`);
            }
        }

        console.log('\n================================================');
        console.log('🎉 DATABASE IMPORT COMPLETE!');
        console.log('================================================\n');

        // Show summary
        console.log('📊 Database Summary:');

        const [tables] = await connection.query('SHOW TABLES');
        console.log(`   📋 Tables created: ${tables.length}`);

        const [userCount] = await connection.query('SELECT COUNT(*) as count FROM users');
        console.log(`   👥 Users: ${userCount[0].count}`);

        const [studentCount] = await connection.query('SELECT COUNT(*) as count FROM students');
        console.log(`   🎓 Students: ${studentCount[0].count}`);

        const [tradeCount] = await connection.query('SELECT COUNT(*) as count FROM trades');
        console.log(`   📚 Trades: ${tradeCount[0].count}`);

        console.log('\n✅ The database is now ready with real, functional data!');

    } catch (error) {
        console.error('\n❌ Import failed:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

setup();
