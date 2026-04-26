/**
 * Garden TVET School - Run All SQL Migrations
 * 
 * This script runs all SQL migration files to set up the database.
 * 
 * USAGE:
 *   node scripts/run_all_sql.js
 * 
 * Prerequisites:
 *   - MySQL server must be running
 *   - Database credentials in .env file
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

const DB_NAME = process.env.DB_NAME || 'garden_tvet';

// SQL files to run in order
const SQL_FILES = [
    // Base schema
    'database.sql',

    // Phase updates
    'phase6_update.sql',
    'phase8_update.sql',
    'phase9_update.sql',
    'phase10_complete_schema.sql',
    'phase11_applications.sql',
    'phase11_advanced_features.sql',
    'phase12_news_images.sql',
    'phase13_payment_receipts.sql',
    'phase14_payment_reminders.sql',
    'phase15_fix_hero.sql',
    'phase16_sms_notifications.sql',
    'phase17_grades.sql',
    'phase18_sms_templates.sql',
    'phase19_news_engagement.sql',

    // Additional setup
    'hero_slides.sql',
    'school_info.sql',
    'add_default_trades.sql',
    'add_default_admin.sql',
    'fix_trades.sql'
];

async function runSQLFile(connection, filePath) {
    console.log(`📄 Running: ${path.basename(filePath)}`);
    const sql = fs.readFileSync(filePath, 'utf8');

    const statements = sql.split(';').filter(s => s.trim().length > 0);

    for (const statement of statements) {
        if (statement.trim().length > 0) {
            try {
                await connection.query(statement);
            } catch (err) {
                // Ignore duplicate key and column exists errors
                if (!err.message.includes('Duplicate entry') &&
                    !err.message.includes('already exists') &&
                    !err.message.includes('Unknown column')) {
                    console.log(`   ⚠️  ${err.message.split('\n')[0]}`);
                }
            }
        }
    }
    console.log(`   ✅ Done`);
}

async function main() {
    console.log('🚀 Garden TVET School - Running All SQL Migrations');
    console.log('================================================\n');

    let connection;
    try {
        // Connect to MySQL
        console.log('📡 Connecting to MySQL...');
        connection = await mysql.createConnection(DB_CONFIG);
        console.log('✅ Connected\n');

        // Create database if not exists
        console.log('📦 Creating database if needed...');
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${DB_NAME}`);
        await connection.query(`USE ${DB_NAME}`);
        console.log(`✅ Database "${DB_NAME}" ready\n`);

        // Run each SQL file
        console.log('📥 Running SQL migrations...\n');

        for (const sqlFile of SQL_FILES) {
            const filePath = path.join(__dirname, '..', sqlFile);

            if (fs.existsSync(filePath)) {
                await runSQLFile(connection, filePath);
            } else {
                console.log(`⚠️  File not found: ${sqlFile}`);
            }
        }

        console.log('\n================================================');
        console.log('🎉 All SQL Migrations Complete!');
        console.log('================================================\n');

        // Show summary
        const [tables] = await connection.query('SHOW TABLES');
        console.log(`📋 Total tables: ${tables.length}`);

    } catch (error) {
        console.error('\n❌ Error:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

main();
