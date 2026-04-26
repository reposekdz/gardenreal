const db = require('../db');
const bcrypt = require('bcryptjs');

const fixPasswords = async () => {
    try {
        console.log('Generating password hashes...');
        const adminHash = bcrypt.hashSync('admin123', 10);
        const dodHash = bcrypt.hashSync('dod123', 10);
        const accountantHash = bcrypt.hashSync('accountant123', 10);
        const stockHash = bcrypt.hashSync('stock123', 10);

        console.log('Updating admin password...');
        const [r1] = await db.execute('UPDATE users SET password = ? WHERE username = ?', [adminHash, 'admin']);
        console.log('Admin updated, rows:', r1.affectedRows);

        console.log('Updating dod password...');
        const [r2] = await db.execute('UPDATE users SET password = ? WHERE username = ?', [dodHash, 'dod']);
        console.log('DOD updated, rows:', r2.affectedRows);

        console.log('Updating accountant password...');
        const [r3] = await db.execute('UPDATE users SET password = ? WHERE username = ?', [accountantHash, 'accountant']);
        console.log('Accountant updated, rows:', r3.affectedRows);

        console.log('Updating stock_manager password...');
        const [r4] = await db.execute('UPDATE users SET password = ? WHERE username = ?', [stockHash, 'stock_manager']);
        console.log('Stock updated, rows:', r4.affectedRows);

        // Verify
        console.log('\nVerifying passwords...');
        const [users] = await db.execute('SELECT username, role FROM users WHERE role != "parent"');
        console.log('Staff users:', JSON.stringify(users));

        // Test admin login
        const [adminUser] = await db.execute('SELECT * FROM users WHERE username = ?', ['admin']);
        if (adminUser.length > 0) {
            console.log('\nAdmin password test (admin123):', bcrypt.compareSync('admin123', adminUser[0].password));
            console.log('Admin password test (password123):', bcrypt.compareSync('password123', adminUser[0].password));
        }

        console.log('\nDone!');
    } catch (error) {
        console.error('Error:', error.message);
    }
    process.exit(0);
};

fixPasswords();
