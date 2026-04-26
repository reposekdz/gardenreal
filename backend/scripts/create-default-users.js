// This script creates default admin users for the Garden TVET School Management System
// Run with: node backend/scripts/create-default-users.js

const bcrypt = require('bcryptjs');
const db = require('../db');

async function createDefaultUsers() {
    try {
        console.log('Creating default users...');

        // Default admin user
        const adminPassword = 'admin123';
        const adminHash = bcrypt.hashSync(adminPassword, 10);

        // Check if admin exists
        const [existingAdmin] = await db.execute('SELECT id FROM users WHERE username = ?', ['admin']);

        if (existingAdmin.length === 0) {
            await db.execute(
                'INSERT INTO users (username, password, first_name, last_name, phone, role) VALUES (?, ?, ?, ?, ?, ?)',
                ['admin', adminHash, 'System', 'Administrator', '+250780000000', 'admin']
            );
            console.log('✅ Admin user created (username: admin, password: admin123)');
        } else {
            console.log('ℹ️  Admin user already exists');
        }

        // Default DOD user
        const dodPassword = 'dod123';
        const dodHash = bcrypt.hashSync(dodPassword, 10);

        const [existingDod] = await db.execute('SELECT id FROM users WHERE username = ?', ['dod']);

        if (existingDod.length === 0) {
            await db.execute(
                'INSERT INTO users (username, password, first_name, last_name, phone, role) VALUES (?, ?, ?, ?, ?, ?)',
                ['dod', dodHash, 'Jean', 'Muhutu', '+250780000001', 'dod']
            );
            console.log('✅ DOD user created (username: dod, password: dod123)');
        } else {
            console.log('ℹ️  DOD user already exists');
        }

        // Default Accountant user
        const accountantPassword = 'accountant123';
        const accountantHash = bcrypt.hashSync(accountantPassword, 10);

        const [existingAccountant] = await db.execute('SELECT id FROM users WHERE username = ?', ['accountant']);

        if (existingAccountant.length === 0) {
            await db.execute(
                'INSERT INTO users (username, password, first_name, last_name, phone, role) VALUES (?, ?, ?, ?, ?, ?)',
                ['accountant', accountantHash, 'Marie', 'Mukamana', '+250780000002', 'accountant']
            );
            console.log('✅ Accountant user created (username: accountant, password: accountant123)');
        } else {
            console.log('ℹ️  Accountant user already exists');
        }

        // Show all users
        const [users] = await db.execute('SELECT id, username, first_name, last_name, role, phone FROM users WHERE role IN ("admin", "dod", "accountant") ORDER BY role');
        console.log('\n📋 Current staff users:');
        users.forEach(u => console.log(`   - ${u.username} (${u.first_name} ${u.last_name}) - ${u.role}`));

        console.log('\n✅ Default users setup complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating users:', error.message);
        process.exit(1);
    }
}

createDefaultUsers();
