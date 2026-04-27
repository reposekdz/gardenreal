const db = require('../db');
const smsService = require('../utils/smsService');

// Get comprehensive student statistics
exports.getStudentStats = async (req, res) => {
    try {
        // Total students
        const [totalResult] = await db.execute('SELECT COUNT(*) as total FROM students');
        const total = totalResult[0].total;

        // Status breakdown
        const [statusStats] = await db.execute(`
            SELECT current_status, COUNT(*) as count 
            FROM students 
            GROUP BY current_status
        `);

        // Trade breakdown
        const [tradeStats] = await db.execute(`
            SELECT trade, COUNT(*) as count 
            FROM students 
            GROUP BY trade 
            ORDER BY count DESC
        `);

        // Level breakdown
        const [levelStats] = await db.execute(`
            SELECT level, COUNT(*) as count 
            FROM students 
            GROUP BY level 
            ORDER BY level
        `);

        // Gender breakdown
        const [genderStats] = await db.execute(`
            SELECT gender, COUNT(*) as count 
            FROM students 
            GROUP BY gender
        `);

        // Trade-Level breakdown (for matrix view)
        const [tradeLevelStats] = await db.execute(`
            SELECT trade, level, COUNT(*) as count 
            FROM students 
            GROUP BY trade, level 
            ORDER BY trade, level
        `);

        // Year enrolled stats
        const [yearStats] = await db.execute(`
            SELECT year_enrolled, COUNT(*) as count 
            FROM students 
            WHERE year_enrolled IS NOT NULL 
            GROUP BY year_enrolled 
            ORDER BY year_enrolled DESC
        `);

        // District breakdown (from address)
        const [districtStats] = await db.execute(`
            SELECT address_district as district, COUNT(*) as count 
            FROM students 
            WHERE address_district IS NOT NULL AND address_district != ''
            GROUP BY address_district 
            ORDER BY count DESC
            LIMIT 10
        `);

        res.json({
            total,
            byStatus: statusStats,
            byTrade: tradeStats,
            byLevel: levelStats,
            byGender: genderStats,
            byTradeLevel: tradeLevelStats,
            byYear: yearStats,
            byDistrict: districtStats
        });
    } catch (error) {
        console.error('Error getting student stats:', error);
        res.status(500).json({ message: 'Habaye ikibazo' });
    }
};

// Get students with advanced filtering
exports.getStudents = async (req, res) => {
    try {
        const { trade, level, status, search, gender, year, district, page = 1, limit = 50, student_type } = req.query;
        let query = 'SELECT * FROM students WHERE 1=1';
        const params = [];

        if (trade) { query += ' AND trade = ?'; params.push(trade); }
        if (level) { query += ' AND level = ?'; params.push(level); }
        if (status) { query += ' AND current_status = ?'; params.push(status); }
        if (gender) { query += ' AND gender = ?'; params.push(gender); }
        if (year) { query += ' AND year_enrolled = ?'; params.push(year); }
        if (district) { query += ' AND address_district = ?'; params.push(district); }
        if (student_type) { query += ' AND student_type = ?'; params.push(student_type); }
        if (search) {
            query += ' AND (first_name LIKE ? OR last_name LIKE ? OR reg_number LIKE ? OR contact_phone LIKE ? OR guardian_name LIKE ?)';
            const searchPattern = `%${search}%`;
            params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
        }

        query += ' ORDER BY created_at DESC';

        // Add pagination — interpolate sanitized integers because mysql2 prepared
        // statements reject placeholders for LIMIT/OFFSET on some MariaDB versions.
        const safeLimit = Math.max(1, Math.min(500, parseInt(limit, 10) || 50));
        const safePage = Math.max(1, parseInt(page, 10) || 1);
        const offset = (safePage - 1) * safeLimit;
        query += ` LIMIT ${safeLimit} OFFSET ${offset}`;

        const [students] = await db.query(query, params);

        // Get total count for pagination
        let countQuery = 'SELECT COUNT(*) as total FROM students WHERE 1=1';
        const countParams = [];
        if (trade) { countQuery += ' AND trade = ?'; countParams.push(trade); }
        if (level) { countQuery += ' AND level = ?'; countParams.push(level); }
        if (status) { countQuery += ' AND current_status = ?'; countParams.push(status); }
        if (gender) { countQuery += ' AND gender = ?'; countParams.push(gender); }
        if (year) { countQuery += ' AND year_enrolled = ?'; countParams.push(year); }
        if (district) { countQuery += ' AND address_district = ?'; countParams.push(district); }
        if (student_type) { countQuery += ' AND student_type = ?'; countParams.push(student_type); }
        if (search) {
            countQuery += ' AND (first_name LIKE ? OR last_name LIKE ? OR reg_number LIKE ? OR contact_phone LIKE ?)';
            const searchPattern = `%${search}%`;
            countParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
        }

        const [countResult] = await db.execute(countQuery, countParams);
        const total = countResult[0].total;

        res.json({
            students,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ikibazo cya server' });
    }
};

// Create student (admin, dod, accountant)
exports.createStudent = async (req, res) => {
    try {
        const {
            reg_number, first_name, last_name, trade, level, gender,
            contact_phone, contact_email, date_of_birth,
            guardian_name, guardian_phone, guardian_relation,
            address_province, address_district, address_sector, address_cell, address_village,
            student_type, academic_year_id
        } = req.body;

        if (!first_name || !last_name || !trade || !level) {
            return res.status(400).json({ message: 'Uzuza amakuru yose asabwa (izina, trade, level)' });
        }

        // Auto-generate registration number if not provided
        let finalRegNumber = reg_number;
        if (!finalRegNumber || finalRegNumber.trim() === '') {
            // Get current year
            const currentYear = new Date().getFullYear();

            // Get trade code (first 2-3 letters uppercase)
            const tradeCode = trade.substring(0, 3).toUpperCase().replace(/\s+/g, '');

            // Get total students for this trade and year to generate sequential number
            const [countResult] = await db.execute(
                'SELECT COUNT(*) as count FROM students WHERE trade = ? AND year_enrolled = ?',
                [trade, currentYear]
            );
            const nextNumber = (countResult[0].count || 0) + 1;

            // Format: YEAR/TRADE/NNN (e.g., 2025/SD/001)
            finalRegNumber = `${currentYear}/${tradeCode}/${String(nextNumber).padStart(3, '0')}`;
        }

        // Check if reg_number already exists
        const [existing] = await db.execute('SELECT id FROM students WHERE reg_number = ?', [finalRegNumber]);
        if (existing.length > 0) {
            // If auto-generated and conflicts, try with higher number
            const currentYear = new Date().getFullYear();
            const tradeCode = trade.substring(0, 3).toUpperCase().replace(/\s+/g, '');
            const [countResult] = await db.execute(
                'SELECT COUNT(*) as count FROM students WHERE trade = ? AND year_enrolled = ?',
                [trade, currentYear]
            );
            const nextNumber = (countResult[0].count || 0) + 2;
            finalRegNumber = `${currentYear}/${tradeCode}/${String(nextNumber).padStart(3, '0')}`;
        }

        // Get current year for year_enrolled
        const yearEnrolled = new Date().getFullYear();

        // Resolve academic_year_id: if not provided, default to current active year
        let resolvedYearId = academic_year_id ? Number(academic_year_id) : null;
        if (!resolvedYearId) {
            const [[cur]] = await db.execute(
                'SELECT id FROM academic_years WHERE is_current = 1 LIMIT 1'
            );
            resolvedYearId = cur ? cur.id : null;
        }

        const [result] = await db.execute(
            `INSERT INTO students (reg_number, first_name, last_name, trade, level, gender,
             contact_phone, contact_email, date_of_birth, guardian_name, guardian_phone, guardian_relation,
             address_province, address_district, address_sector, address_cell, address_village,
             current_status, student_type, year_enrolled, academic_year_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)`,
            [finalRegNumber, first_name, last_name, trade, level, gender || 'Male',
                contact_phone || null, contact_email || null, date_of_birth || null,
                guardian_name || null, guardian_phone || null, guardian_relation || null,
                address_province || null, address_district || null, address_sector || null,
                address_cell || null, address_village || null, student_type || 'private',
                yearEnrolled, resolvedYearId]
        );

        // Log this enrollment in promotion history when we have a year context
        if (resolvedYearId) {
            try {
                await db.execute(
                    `INSERT INTO student_promotions
                        (student_id, from_academic_year_id, to_academic_year_id,
                         from_trade, to_trade, from_level, to_level, action, notes, created_by)
                     VALUES (?, NULL, ?, ?, ?, NULL, ?, 'enrolled', 'manual create', ?)`,
                    [result.insertId, resolvedYearId, trade, trade, level, req.user?.id || null]
                );
            } catch (e) { /* non-fatal */ }
        }

        // Notify parents via SMS
        const studentId = result.insertId;
        smsService.notifyStudentCreated(studentId, {
            reg_number: finalRegNumber,
            trade,
            level,
            student_name: `${first_name} ${last_name}`
        }).catch(err => console.log('SMS notification skipped:', err.message));

        // Generate a default password so the student can log in via the portal.
        // Default = last 4 digits of contact_phone (or "0000" fallback).
        try {
            const bcrypt = require('bcryptjs');
            const { computeDefaultPassword } = require('../routes/studentAuthRoutes');
            const hint = computeDefaultPassword(contact_phone, finalRegNumber);
            const hash = bcrypt.hashSync(hint, 10);
            await db.execute(
                'UPDATE students SET password_hash = ?, default_password_hint = ?, must_change_password = 1 WHERE id = ?',
                [hash, hint, studentId]
            );
            // SMS the credentials to the student (best effort)
            if (contact_phone) {
                const msg = `Murakaza neza ${first_name} kuri Garden TVET! Kode yawe: ${finalRegNumber}, Ijambobanga: ${hint}. Hindura ijambobanga unjira bwa mbere.`;
                smsService.sendSMS(contact_phone, msg).catch(() => {});
            }
        } catch (e) { console.log('Default password setup skipped:', e.message); }

        res.status(201).json({
            message: 'Umunyeshuri yanditswe neza!',
            studentId: result.insertId,
            reg_number: finalRegNumber
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ikibazo cya server' });
    }
};

// Update student
exports.updateStudent = async (req, res) => {
    const { id } = req.params;
    const {
        first_name, last_name, trade, level, gender, contact_phone, contact_email,
        guardian_name, guardian_phone, guardian_relation,
        address_province, address_district, address_sector, address_cell, address_village,
        student_type
    } = req.body;
    try {
        // Get old student data for comparison
        const [oldData] = await db.query('SELECT * FROM students WHERE id = ?', [id]);
        const oldStudent = oldData[0] || {};

        await db.execute(
            `UPDATE students SET first_name=?, last_name=?, trade=?, level=?, gender=?, 
             contact_phone=?, contact_email=?, guardian_name=?, guardian_phone=?, guardian_relation=?,
             address_province=?, address_district=?, address_sector=?, address_cell=?, address_village=?,
             student_type=? 
             WHERE id=?`,
            [first_name, last_name, trade, level, gender,
                contact_phone, contact_email, guardian_name, guardian_phone, guardian_relation,
                address_province, address_district, address_sector, address_cell, address_village,
                student_type || 'private', id]
        );

        // Notify parents if significant changes (trade, level, status changes)
        const changes = [];
        if (oldStudent.trade !== trade) changes.push(`trade: ${oldStudent.trade} → ${trade}`);
        if (oldStudent.level !== level) changes.push(`level: ${oldStudent.level} → ${level}`);
        if (oldStudent.current_status !== 'active') changes.push(`status: ${oldStudent.current_status} → active`);

        if (changes.length > 0) {
            smsService.notifyStudentUpdated(id, { changes: changes.join(', '), student_name: `${first_name} ${last_name}` })
                .catch(err => console.log('SMS notification skipped:', err.message));
        }

        res.json({ message: 'Amakuru y\'umunyeshuri aravunjwe' });
    } catch (error) {
        res.status(500).json({ message: 'Ikibazo cya server' });
    }
};

// Delete student
exports.deleteStudent = async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    try {
        // Get student info before deletion for notification
        const [students] = await db.query('SELECT first_name, last_name FROM students WHERE id = ?', [id]);

        // Delete the student
        await db.execute('DELETE FROM students WHERE id = ?', [id]);

        // Notify parents
        if (students.length > 0) {
            smsService.notifyStudentDeleted(id, reason || 'Student removed from system')
                .catch(err => console.log('SMS notification skipped:', err.message));
        }

        res.json({ message: 'Umunyeshuri yasibwe mu makuru' });
    } catch (error) {
        res.status(500).json({ message: 'Ikibazo cya server' });
    }
};

// Update student status (active, sick, on_leave, suspended, expelled)
exports.updateStudentStatus = async (req, res) => {
    const { id } = req.params;
    const { current_status, reason } = req.body;
    try {
        await db.execute('UPDATE students SET current_status = ? WHERE id = ?', [current_status, id]);

        // Notify parents via SMS using the new SMS service
        if (reason || current_status !== 'active') {
            smsService.notifyStudentStatusChange(id, current_status, reason)
                .catch(err => console.log('SMS notification skipped:', err.message));
        }

        res.json({ message: 'Sitati y\'umunyeshuri yaravunjwe. Ababyeyi batumwiriye.' });
    } catch (error) {
        res.status(500).json({ message: 'Ikibazo cya server' });
    }
};

// Remove conduct (expel)
exports.removeConductAndNotify = async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    try {
        await db.execute('UPDATE students SET current_status = "expelled" WHERE id = ?', [id]);

        // Log discipline record
        await db.execute(
            'INSERT INTO discipline_records (student_id, action_type, description, created_by) VALUES (?, "conduct_removed", ?, ?)',
            [id, reason || 'Conduct yavanyweho', req.user.id]
        );

        // Notify parents using SMS service
        smsService.notifyStudentStatusChange(id, 'expelled', reason)
            .catch(err => console.log('SMS notification skipped:', err.message));

        res.json({ message: 'Conduct yavanyweho. Ababyeyi batumwiriye SMS.' });
    } catch (error) {
        res.status(500).json({ message: 'Ikibazo cya server' });
    }
};

// Reinstate student (remove expel/conduct status)
exports.reinstateStudent = async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    try {
        await db.execute('UPDATE students SET current_status = "active" WHERE id = ?', [id]);

        // Log discipline record
        await db.execute(
            'INSERT INTO discipline_records (student_id, action_type, description, created_by) VALUES (?, "reinstatement", ?, ?)',
            [id, reason || 'Umunyeshuri yagaruriwe status', req.user.id]
        );

        // Notify parents using SMS service
        smsService.notifyStudentStatusChange(id, 'active', reason)
            .catch(err => console.log('SMS notification skipped:', err.message));

        res.json({ message: 'Umunyeshuri yagaruriwe. Ababyeyi batumwiriye SMS.' });
    } catch (error) {
        res.status(500).json({ message: 'Ikibazo cya server' });
    }
};

// Make student go on leave
exports.makeStudentLeave = async (req, res) => {
    const { id } = req.params;
    const { reason, return_date } = req.body;
    try {
        await db.execute('UPDATE students SET current_status = "on_leave" WHERE id = ?', [id]);
        await db.execute(
            'INSERT INTO discipline_records (student_id, action_type, description, created_by) VALUES (?, "student_leave", ?, ?)',
            [id, reason || 'Uruhushya rwo kuva', req.user.id]
        );

        // Notify parents using SMS service
        smsService.notifyStudentStatusChange(id, 'on_leave', reason, return_date)
            .catch(err => console.log('SMS notification skipped:', err.message));

        res.json({ message: 'Umunyeshuri yahawe uruhushya. Ababyeyi batumwiriye SMS.' });
    } catch (error) {
        res.status(500).json({ message: 'Ikibazo cya server' });
    }
};

// Notify parents of a student
exports.notifyParents = async (req, res) => {
    const { id } = req.params;
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: 'Andika ubutumwa' });
    try {
        const [stuRows] = await db.query('SELECT first_name, last_name FROM students WHERE id = ?', [id]);
        const stu = stuRows[0];

        const result = await smsService.sendToStudentParents(id, null, { message }, 'rw', message);

        res.json({ message: `SMS yoherejwe ku babyeyi ${result.sent}` });
    } catch (error) {
        res.status(500).json({ message: 'Ikibazo cya server' });
    }
};

// Get students linked to a parent (for admin linking flow)
exports.getStudentsByContext = async (req, res) => {
    try {
        const { trade, level } = req.query;
        let query = 'SELECT id, reg_number, first_name, last_name, trade, level, gender, current_status FROM students WHERE 1=1';
        const params = [];
        if (trade) { query += ' AND trade = ?'; params.push(trade); }
        if (level) { query += ' AND level = ?'; params.push(level); }
        query += ' ORDER BY first_name ASC';
        const [students] = await db.execute(query, params);
        res.json(students);
    } catch (error) {
        res.status(500).json({ message: 'Ikibazo cya server' });
    }
};

// Broadcast SMS to all parents of selected students
exports.broadcastToParents = async (req, res) => {
    try {
        const { message, trade, level } = req.body;
        if (!message) return res.status(400).json({ message: 'Andika ubutumwa' });

        const result = await smsService.broadcastToParents(message, trade, level);

        res.json({ message: `SMS yoherejwe ku babyeyi ${result.sent}!` });
    } catch (error) {
        console.error('Broadcast error:', error);
        res.status(500).json({ message: 'Ikibazo cya server mugihe cyo kohereza SMS' });
    }
};

// Bulk Import Students from Excel/JSON
exports.importStudents = async (req, res) => {
    try {
        const { students } = req.body; // Array of student objects
        if (!Array.isArray(students) || students.length === 0) {
            return res.status(400).json({ message: 'Nta banyeshuri babonetse' });
        }

        let imported = 0;
        let skipped = 0;

        for (const stu of students) {
            const { reg_number, first_name, last_name, trade, level, gender, contact_phone } = stu;
            if (!reg_number || !first_name || !last_name || !trade || !level) {
                skipped++;
                continue;
            }

            const [existing] = await db.execute('SELECT id FROM students WHERE reg_number = ?', [reg_number]);
            if (existing.length > 0) {
                skipped++;
                continue;
            }

            await db.execute(
                'INSERT INTO students (reg_number, first_name, last_name, trade, level, gender, contact_phone, current_status) VALUES (?, ?, ?, ?, ?, ?, ?, "active")',
                [String(reg_number), String(first_name), String(last_name), String(trade), String(level), gender || 'Male', contact_phone || '']
            );
            imported++;
        }

        res.json({ message: `Akinjijwe: ${imported}. Asimbutswe (Kuko basanzwe cyangwa amakuru atuzuye): ${skipped}` });
    } catch (error) {
        console.error('Import error:', error);
        res.status(500).json({ message: 'Ikibazo cya server mugihe cyo kwinjiza' });
    }
};
