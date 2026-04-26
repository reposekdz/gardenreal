const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkSchema() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'garden_tvet'
    });

    try {
        console.log('--- parent_link_requests ---');
        try {
            const [cols] = await pool.execute('DESCRIBE parent_link_requests');
            console.table(cols);
        } catch (e) { console.log('parent_link_requests table error:', e.message); }

        console.log('\n--- stock_items ---');
        try {
            const [cols] = await pool.execute('DESCRIBE stock_items');
            console.table(cols);
        } catch (e) { console.log('stock_items table error:', e.message); }

        console.log('\n--- stock_transactions ---');
        try {
            const [cols] = await pool.execute('DESCRIBE stock_transactions');
            console.table(cols);
        } catch (e) { console.log('stock_transactions table error:', e.message); }

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await pool.end();
    }
}

checkSchema();
