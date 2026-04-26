const mysql = require('mysql2/promise');
require('dotenv').config();

async function cleanupUsers() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'garden_tvet'
        });

        console.log('Connected to database');

        // First, show current users
        console.log('\n=== Current users before cleanup ===');
        const [beforeUsers] = await connection.query('SELECT id, username, first_name, last_name, role, phone FROM users');
        console.table(beforeUsers);

        // Delete users with empty/blank role (broken accounts)
        console.log('\n=== Deleting users with empty role ===');
        await connection.query('DELETE FROM users WHERE role = "" OR role IS NULL');

        // Delete test users
        console.log('\n=== Deleting test users ===');
        const testUsernames = [
            'test', 'test1', 'test2', 'test3', 'demo',
            'user', 'staff', 'teacher', 'student', 'parent1', 'parent2',
            'testuser', 'admin123', 'password', 'demo123', 'sfatt'
        ];

        for (const username of testUsernames) {
            await connection.query('DELETE FROM users WHERE username = ?', [username]);
        }

        // Delete users with no username
        await connection.query('DELETE FROM users WHERE username IS NULL OR username = ""');

        // Delete users with invalid roles
        const validRoles = ['admin', 'dod', 'accountant', 'stock_manager', 'parent', 'teacher', 'director_of_discipline', 'librarian', 'registrar', 'director'];
        await connection.query('DELETE FROM users WHERE role NOT IN (?)', [validRoles]);

        // Create proper admin account if not exists
        const bcrypt = require('bcryptjs');
        const hashedPassword = bcrypt.hashSync('admin123', 10);

        await connection.query(`
            INSERT IGNORE INTO users (username, password, first_name, last_name, phone, email, role)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, ['admin', hashedPassword, 'System', 'Admin', '+250000000000', 'admin@garden.rw', 'admin']);

        // Show remaining users
        console.log('\n=== Users after cleanup ===');
        const [afterUsers] = await connection.query('SELECT id, username, first_name, last_name, role, phone FROM users');
        console.table(afterUsers);

        console.log('\n✅ Cleanup complete!');
        console.log('Admin credentials: username=admin, password=admin123');
        console.log('\nTo create new staff accounts:');
        console.log('1. Login as admin');
        console.log('2. Go to Staff Manager');
        console.log('3. Add new staff with proper role (dod, accountant, or stock_manager)');

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        if (connection) await connection.end();
    }
}

cleanupUsers();
