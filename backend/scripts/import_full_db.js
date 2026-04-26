/**
 * Full Database Import Script
 * Imports all tables from the exported database to Aiven
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    uri: process.env.DATABASE_URL,
    waitForConnections: true,
    connectionLimit: 10,
    ssl: { rejectUnauthorized: false }
});

async function importFullDatabase() {
    const dbPath = path.join(__dirname, '..', 'full exported db', 'garden_tvet.sql');
    console.log('Reading SQL file from:', dbPath);

    let sql = fs.readFileSync(dbPath, 'utf8');

    // Replace database name if needed
    sql = sql.replace(/`garden_tvet`/g, '`defaultdb`');
    sql = sql.replace(/garden_tvet\./g, 'defaultdb.');

    console.log('Importing full database to Aiven...');

    // Split by CREATE TABLE and INSERT INTO for better handling
    const createTableMatches = sql.match(/CREATE TABLE[^;]+;/gi) || [];
    const insertMatches = sql.match(/INSERT INTO[^;]+;/gi) || [];

    console.log('Found', createTableMatches.length, 'CREATE statements');
    console.log('Found', insertMatches.length, 'INSERT statements');

    // First, create all tables
    for (const stmt of createTableMatches) {
        try {
            await pool.query(stmt);
            console.log('Created table');
        } catch (err) {
            if (err.code === 'ER_TABLE_EXISTS_ERROR') {
                // Table exists, that's okay
            } else {
                // Log important errors
                if (!err.message.includes('already exists')) {
                    console.log('Table error:', err.code);
                }
            }
        }
    }

    console.log('\\nTables created. Now importing data...');

    // Then insert data
    let successCount = 0;
    let errorCount = 0;

    for (const stmt of insertMatches) {
        try {
            await pool.query(stmt);
            successCount++;
        } catch (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                // Duplicate entry, skip
            } else {
                errorCount++;
            }
        }
    }

    console.log('Data import complete:', successCount, 'inserts,', errorCount, 'warnings');

    // Show final tables
    const [tables] = await pool.query('SHOW TABLES');
    console.log('\\n=== TABLES IN DATABASE NOW ===');
    tables.forEach(t => console.log(Object.values(t)[0]));
    console.log('Total:', tables.length, 'tables');

    // Show sample data counts
    console.log('\\n=== DATA SUMMARY ===');
    const tableNames = tables.map(t => Object.values(t)[0]);
    for (const tableName of tableNames.slice(0, 10)) {
        try {
            const [count] = await pool.query(`SELECT COUNT(*) as cnt FROM \`${tableName}\``);
            console.log(`${tableName}: ${count[0].cnt} rows`);
        } catch (e) {
            console.log(`${tableName}: error`);
        }
    }

    pool.end();
    console.log('\\n✅ Database import complete!');
}

importFullDatabase().catch(err => {
    console.error('Import failed:', err.message);
    process.exit(1);
});
