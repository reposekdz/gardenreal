const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const smsService = require('../utils/smsService');

// Helper to send SMS - uses centralized smsService
const sendSMS = async (phone, message) => {
    try {
        const result = await smsService.sendSMS(phone, message);
        // Log SMS to database
        await db.execute(
            'INSERT INTO sms_logs (phone, message, status) VALUES (?, ?, ?)',
            [phone, message, result.success ? 'sent' : 'failed']
        );
    } catch (e) {
        console.error('SMS error:', e.message);
        // Log failed SMS
        try {
            await db.execute(
                'INSERT INTO sms_logs (phone, message, status) VALUES (?, ?, ?)',
                [phone, message, 'failed']
            );
        } catch (logErr) { console.error('SMS log error:', logErr.message); }
    }
};

// PUBLIC: Register as parent
exports.registerParent = async (req, res) => {
    try {
        const { first_name, last_name, phone, password, province, district, sector } = req.body;
        if (!first_name || !last_name || !phone || !password) {
            return res.status(400).json({ message: 'Uzuza amakuru yose asabwa' });
        }

        // Normalize phone number to standard Rwandan format (07XXXXXXXX)
        const cleanPhone = phone.replace(/\+|\s/g, '');
        let normalizedPhone;

        // If already 12 digits starting with 250, use as-is
        if (cleanPhone.length === 12 && cleanPhone.startsWith('250')) {
            normalizedPhone = cleanPhone;
        }
        // If 10 digits starting with 7, add leading 0
        else if (cleanPhone.length === 10 && cleanPhone.startsWith('7')) {
            normalizedPhone = '0' + cleanPhone;
        }
        // If 9 digits starting with 7, add leading 07
        else if (cleanPhone.length === 9 && cleanPhone.startsWith('7')) {
            normalizedPhone = '07' + cleanPhone;
        }
        // If already starts with 0, use as-is
        else if (cleanPhone.startsWith('0')) {
            normalizedPhone = cleanPhone;
        }
        // Otherwise add 0 prefix
        else {
            normalizedPhone = '0' + cleanPhone;
        }

        console.log('Register parent - phone normalization:', { original: phone, cleaned: cleanPhone, normalized: normalizedPhone });

        const [existing] = await db.execute('SELECT id FROM users WHERE phone = ?', [normalizedPhone]);
        if (existing.length > 0) {
            return res.status(409).json({ message: 'Nimero ya telefone isanzwe ikoreshwa. Injira kuri konti yawe.' });
        }
        const hashedPassword = bcrypt.hashSync(password, 10);
        const username = `parent_${normalizedPhone}`;
        const [result] = await db.execute(
            'INSERT INTO users (username, password, first_name, last_name, phone, role, province, district, sector) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [username, hashedPassword, first_name, last_name, normalizedPhone, 'parent', province || null, district || null, sector || null]
        );
        // Welcome SMS
        await sendSMS(normalizedPhone, `Murakaza neza ${first_name} kuri Garden TVET School! Konti yawe nk'umubyeyi yashyizweho neza. Shakisha abana bawe kuri app.`);
        res.status(201).json({ message: 'Konti yashyizweho neza!', userId: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Staff login - supports username, phone, and email for all user types
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ message: 'Uzuza amakuru yose' });

        let rows = [];
        const cleanPhone = username.replace(/\+|\s/g, '');

        // Check if input looks like a phone number (10-12 digits)
        const isPhone = /^\d{10,12}$/.test(cleanPhone);

        if (isPhone) {
            // Normalize phone number to standard Rwandan format (07XXXXXXXX)
            let phoneToSearch;

            // If already 12 digits starting with 250, use as-is
            if (cleanPhone.length === 12 && cleanPhone.startsWith('250')) {
                phoneToSearch = cleanPhone;
            }
            // If 10 digits starting with 7, add leading 0
            else if (cleanPhone.length === 10 && cleanPhone.startsWith('7')) {
                phoneToSearch = '0' + cleanPhone;
            }
            // If 9 digits starting with 7, add leading 07
            else if (cleanPhone.length === 9 && cleanPhone.startsWith('7')) {
                phoneToSearch = '07' + cleanPhone;
            }
            // If starts with 0, use as-is
            else if (cleanPhone.startsWith('0')) {
                phoneToSearch = cleanPhone;
            }
            // Otherwise add 0 prefix
            else {
                phoneToSearch = '0' + cleanPhone;
            }

            console.log('Login attempt - phone search:', { cleanPhone, phoneToSearch, isPhone });

            // First try phone for parents (with role filter)
            [rows] = await db.execute('SELECT * FROM users WHERE phone = ? AND role = "parent"', [phoneToSearch]);
            console.log('Query 1 (parent by phone):', phoneToSearch, 'results:', rows.length);

            // If not found, try phone for staff/admin (not just parents)
            if (rows.length === 0) {
                [rows] = await db.execute('SELECT * FROM users WHERE phone = ? AND role != "parent"', [phoneToSearch]);
                console.log('Query 2 (staff by phone):', phoneToSearch, 'results:', rows.length);
            }

            // Also try phone without role filter as final fallback
            if (rows.length === 0) {
                [rows] = await db.execute('SELECT * FROM users WHERE phone = ?', [phoneToSearch]);
                console.log('Query 3 (any by phone):', phoneToSearch, 'results:', rows.length);
            }

            // Try alternate phone formats if still not found
            if (rows.length === 0) {
                // Try with +250 prefix
                const plus250Phone = cleanPhone.startsWith('250') ? cleanPhone : '250' + cleanPhone.replace(/^0/, '');
                [rows] = await db.execute('SELECT * FROM users WHERE phone = ?', [plus250Phone]);
                console.log('Query 4 (+250 format):', plus250Phone, 'results:', rows.length);
            }

            // Try with 0 prefix regardless
            if (rows.length === 0) {
                const zeroPhone = cleanPhone.startsWith('0') ? cleanPhone : '0' + cleanPhone;
                [rows] = await db.execute('SELECT * FROM users WHERE phone = ?', [zeroPhone]);
                console.log('Query 5 (0 prefix):', zeroPhone, 'results:', rows.length);
            }
        }

        // Try email login if not found by phone
        if (rows.length === 0 && username.includes('@')) {
            [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [username]);
            console.log('Query by email:', username, 'results:', rows.length);
        }

        // Try username login as final fallback (includes admin, staff, etc.)
        if (rows.length === 0) {
            console.log('Trying username search for:', username);
            [rows] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
            console.log('Query by username:', username, 'results:', rows.length);
        }

        // Debug: show all users if still not found
        if (rows.length === 0) {
            console.log('User not found! Checking what users exist in DB...');
            const [allUsers] = await db.execute('SELECT id, username, phone, role FROM users LIMIT 10');
            console.log('Sample users in DB:', allUsers);
        }

        if (rows.length === 0) return res.status(404).json({ message: 'Konti ntiboneka' });

        const user = rows[0];
        if (!bcrypt.compareSync(password, user.password)) {
            return res.status(401).json({ message: 'Ijambobanga sibyo' });
        }

        const token = jwt.sign(
            { userId: user.id, id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET || 'supersecretgardenkey2026'
        );
        res.status(200).json({
            id: user.id, username: user.username,
            first_name: user.first_name, last_name: user.last_name,
            role: user.role, phone: user.phone,
            province: user.province, district: user.district, sector: user.sector,
            accessToken: token
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Admin: Create staff account (dod, accountant, stock_manager, admin)
exports.createUser = async (req, res) => {
    try {
        const { username, password, first_name, last_name, phone, role } = req.body;
        const allowedRoles = ['admin', 'dod', 'accountant', 'stock_manager', 'teacher'];

        // Validate role - must be one of the allowed roles
        if (!role || !allowedRoles.includes(role)) {
            return res.status(400).json({ message: 'Urwego rudasabwa. Hitamo: admin, dod, accountant, stock_manager, teacher' });
        }

        // Check if username already exists
        const [existing] = await db.execute('SELECT id FROM users WHERE username = ?', [username]);
        if (existing.length > 0) return res.status(400).json({ message: 'Izina ryakoreshwa ikoreshwa' });

        // Check if phone already exists
        if (phone) {
            const [existingPhone] = await db.execute('SELECT id FROM users WHERE phone = ?', [phone]);
            if (existingPhone.length > 0) return res.status(400).json({ message: 'Nimero ya telefone isanzwe ikoreshwa' });
        }

        const hashedPassword = bcrypt.hashSync(password, 10);

        // Explicitly insert with the role value
        const [result] = await db.execute(
            'INSERT INTO users (username, password, first_name, last_name, phone, role) VALUES (?, ?, ?, ?, ?, ?)',
            [username, hashedPassword, first_name, last_name, phone || null, role]
        );

        // SMS credentials to new staff
        if (phone) {
            await sendSMS(phone, `Murakaza neza ${first_name}! Konti yawe ya Garden TVET:\nUsername: ${username}\nPassword: ${password}\nUnjire kuri: gardentvet.rw`);
        }
        res.status(201).json({ message: 'Konti yashyizweho! SMS yoherejwe.', userId: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Admin: Get all staff users
exports.getUsers = async (req, res) => {
    try {
        const [users] = await db.execute(
            `SELECT id, username, first_name, last_name, phone, role, province, district, sector, created_at 
             FROM users WHERE role != 'parent' ORDER BY created_at DESC`
        );
        res.status(200).json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Admin: Update a staff user
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { first_name, last_name, phone, role, password } = req.body;
        const allowedRoles = ['admin', 'dod', 'accountant', 'stock_manager', 'teacher'];

        if (role && !allowedRoles.includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        // Check phone uniqueness if changing
        if (phone) {
            const [existing] = await db.execute('SELECT id FROM users WHERE phone = ? AND id != ?', [phone, id]);
            if (existing.length > 0) return res.status(400).json({ message: 'Phone number already in use' });
        }

        let query = 'UPDATE users SET ';
        const params = [];
        if (first_name) { query += 'first_name = ?, '; params.push(first_name); }
        if (last_name) { query += 'last_name = ?, '; params.push(last_name); }
        if (phone !== undefined) { query += 'phone = ?, '; params.push(phone || null); }
        if (role) { query += 'role = ?, '; params.push(role); }
        if (password) {
            const hashedPassword = bcrypt.hashSync(password, 10);
            query += 'password = ?, ';
            params.push(hashedPassword);
        }

        if (params.length === 0) return res.status(400).json({ message: 'No fields to update' });

        query = query.slice(0, -2) + ' WHERE id = ? AND role != \'parent\'';
        params.push(id);

        await db.execute(query, params);

        if (phone && password) {
            await sendSMS(phone, `Amakuru yawe ya Garden TVET yahinduwe. Username: ${req.body.username || ''} Password: ${password}`);
        }

        res.json({ message: 'Staff updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Admin: Delete a staff user
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Get user info before deletion for notification
        const [users] = await db.execute('SELECT first_name, last_name, phone FROM users WHERE id = ?', [id]);
        const deletedUser = users[0];

        // Get admin name for notification
        const [adminUser] = await db.execute('SELECT first_name FROM users WHERE id = ?', [req.user.userId || req.user.id]);
        const adminName = adminUser[0]?.first_name || 'Admin';

        // Delete the user
        await db.execute('DELETE FROM users WHERE id = ? AND role != "admin"', [id]);

        // Send SMS notification to deleted staff
        if (deletedUser?.phone) {
            smsService.notifyStaffDeleted(id, adminName)
                .catch(err => console.log('Staff deletion SMS skipped:', err.message));
        }

        res.json({ message: 'Konti yasibwe' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Staff: Update own profile (password and phone)
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        const { currentPassword, newPassword, phone, first_name, last_name } = req.body;

        // Get current user
        const [users] = await db.execute('SELECT * FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = users[0];

        // Verify current password
        if (newPassword && !bcrypt.compareSync(currentPassword, user.password)) {
            return res.status(401).json({ message: 'Ijambobanga riheruka s ibyo' });
        }

        // Update fields
        let query = 'UPDATE users SET ';
        let params = [];

        if (first_name) {
            query += 'first_name = ?, ';
            params.push(first_name);
        }
        if (last_name) {
            query += 'last_name = ?, ';
            params.push(last_name);
        }
        if (phone) {
            query += 'phone = ?, ';
            params.push(phone);
        }
        if (newPassword) {
            const hashedPassword = bcrypt.hashSync(newPassword, 10);
            query += 'password = ?, ';
            params.push(hashedPassword);
        }

        if (params.length === 0) {
            return res.status(400).json({ message: 'No fields to update' });
        }

        query = query.slice(0, -2) + ' WHERE id = ?';
        params.push(userId);

        await db.execute(query, params);

        // Send SMS notification
        if (phone && phone !== user.phone) {
            await sendSMS(phone, `Umwirondoro wawe wahinduwe kuri Garden TVET.`);
        }
        if (newPassword) {
            await sendSMS(user.phone, `Ijambobanga ryawe ryahinduwe kuri Garden TVET.`);
        }

        res.json({ message: 'Umwirondoro wahinduwe neza!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Admin: Get Rwanda locations
exports.getLocations = async (req, res) => {
    const locations = require('../utils/rwandaLocations');
    res.json(locations);
};
