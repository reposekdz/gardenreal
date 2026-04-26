const db = require('../db');
const smsService = require('../utils/smsService');

// SMS helper function - uses centralized smsService
const sendSMS = async (phone, message) => {
    try {
        const result = await smsService.sendSMS(phone, message);
        console.log(result.success ? 'SMS sent to' : 'SMS failed to', phone);
    } catch (e) {
        console.error('SMS error:', e.message);
    }
};

// Public: Submit Application - Enhanced with more fields including parent info
const submitApplication = async (req, res) => {
    const {
        // Student fields
        first_name, last_name, gender, date_of_birth,
        phone, email, province, district, sector,
        trade, level, previous_school, previous_sector,
        has_laptop, heard_from, motivation,
        // Parent fields (if parent application)
        parent_name
    } = req.body;

    // Enhanced validation
    if (!first_name || !last_name || !phone || !trade || !level) {
        return res.status(400).json({ message: 'Required fields missing' });
    }

    try {
        const [result] = await db.query(
            `INSERT INTO applications (
                first_name, last_name, gender, date_of_birth,
                phone, email, province, district, sector,
                trade, level, previous_school, previous_sector,
                has_laptop, heard_from, motivation,
                status, applied_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())`,
            [
                first_name, last_name, gender || null, date_of_birth || null,
                phone, email || null, province || null, district || null, sector || null,
                trade, level, previous_school || null, previous_sector || null,
                has_laptop || null, heard_from || null, motivation || null
            ]
        );

        const applicationId = `GDN-${Date.now()}`;

        // Send SMS confirmation to applicant
        const smsMessage = `Murakaza neza ${first_name}! Ubusabe bwawe bwo kwiga muri Garden TVET (${trade}) bw Registiriye. Uzabona SMS iyo busuzume. ID: ${applicationId}`;
        await sendSMS(phone, smsMessage);

        // If parent_name is provided, this is a parent application
        if (parent_name) {
            console.log('Parent application submitted by:', parent_name);
        }

        res.status(201).json({
            message: 'Application submitted successfully!',
            id: result.insertId,
            application_id: applicationId
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error submitting application' });
    }
};

// Admin: Get all applications with filters
const getApplications = async (req, res) => {
    try {
        const { status, trade, date_from, date_to } = req.query;

        let query = 'SELECT * FROM applications WHERE 1=1';
        const params = [];

        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }
        if (trade) {
            query += ' AND trade = ?';
            params.push(trade);
        }
        if (date_from) {
            query += ' AND applied_at >= ?';
            params.push(date_from);
        }
        if (date_to) {
            query += ' AND applied_at <= ?';
            params.push(date_to);
        }

        query += ' ORDER BY applied_at DESC';

        const [applications] = await db.execute(query, params);
        res.json(applications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching applications' });
    }
};

// Admin: Get single application by ID
const getApplicationById = async (req, res) => {
    const { id } = req.params;
    try {
        const [apps] = await db.execute('SELECT * FROM applications WHERE id = ?', [id]);
        if (apps.length === 0) {
            return res.status(404).json({ message: 'Application not found' });
        }
        res.json(apps[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching application' });
    }
};

// Admin: Approve/Reject Application with notes
const updateApplicationStatus = async (req, res) => {
    const { id } = req.params;
    const { status, review_notes } = req.body; // 'approved' or 'rejected'

    if (!['approved', 'rejected', 'waitlisted'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    try {
        // 1. Get the application details first
        const [apps] = await db.execute('SELECT * FROM applications WHERE id = ?', [id]);
        if (apps.length === 0) return res.status(404).json({ message: 'Application not found' });

        const app = apps[0];

        // 2. Update status with notes
        await db.execute(
            'UPDATE applications SET status = ?, review_notes = ?, reviewed_at = NOW() WHERE id = ?',
            [status, review_notes || null, id]
        );

        // 3. Prepare SMS notification
        let smsMessage = '';
        const name = app.first_name;

        if (status === 'approved') {
            smsMessage = `Mwaramutse ${name}! Ubusabe bwawe bwo kwiga muri Garden TVET (${app.trade}) bwemejwe. Urakaza neza kugira ibanga!`;
        } else if (status === 'waitlisted') {
            smsMessage = `Mwaramutse ${name}, ubusabe bwawe bwo muri Garden TVET bugize urutonde rugahagarika. Duzahagira ubutumwa bukurikiye.`;
        } else {
            smsMessage = `Murakoze ${name}, tubabajwe no kubamenyesha ko ubusabe bwanyu muri Garden TVET butemejwe. Mungaragize ikindi.`;
        }

        // 4. Send SMS Notification (if phone exists)
        if (app.phone) {
            try {
                const AT = require('africastalking')({
                    apiKey: process.env.AFRICASTALKING_API_KEY,
                    username: process.env.AFRICASTALKING_USERNAME
                });
                const to = app.phone.startsWith('+') ? app.phone : `+250${app.phone.replace(/^0/, '')}`;
                await AT.SMS.send({ to: [to], message: smsMessage });
                console.log('Application SMS sent to', app.phone);
            } catch (smsError) {
                console.error('SMS error:', smsError.message);
            }
        }

        res.json({
            message: `Application ${status} successfully`,
            status: status,
            sent_sms: !!app.phone
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating application' });
    }
};

// Admin: Get application statistics
const getApplicationStats = async (req, res) => {
    try {
        const [stats] = await db.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
                SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
                SUM(CASE WHEN status = 'waitlisted' THEN 1 ELSE 0 END) as waitlisted,
                SUM(CASE WHEN trade = 'software' OR trade LIKE '%software%' THEN 1 ELSE 0 END) as software_apps,
                SUM(CASE WHEN trade = 'automobile' OR trade LIKE '%automobile%' THEN 1 ELSE 0 END) as automobile_apps,
                SUM(CASE WHEN trade = 'building' OR trade LIKE '%building%' THEN 1 ELSE 0 END) as building_apps
            FROM applications
        `);
        res.json(stats[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching stats' });
    }
};

// Bulk update applications
const bulkUpdateApplications = async (req, res) => {
    try {
        const { application_ids, status, review_notes } = req.body;

        if (!application_ids || !Array.isArray(application_ids) || application_ids.length === 0) {
            return res.status(400).json({ message: 'Application IDs required' });
        }

        if (!status) {
            return res.status(400).json({ message: 'Status required' });
        }

        const placeholders = application_ids.map(() => '?').join(',');
        const [result] = await db.query(
            `UPDATE applications SET status = ?, review_notes = ?, reviewed_at = NOW() WHERE id IN (${placeholders})`,
            [status, review_notes || '', ...application_ids]
        );

        // Get updated applications for SMS
        const [updatedApps] = await db.query(
            `SELECT * FROM applications WHERE id IN (${placeholders})`,
            application_ids
        );

        // Send SMS notifications
        for (const app of updatedApps) {
            if (app.phone) {
                let message = '';
                if (status === 'approved') {
                    message = `Murakoze! Application yawe ya ${app.first_name} ${app.last_name} yemeruwe. Jya kugira nibuka. Garden TVET`;
                } else if (status === 'rejected') {
                    message = `Muraho ${app.first_name}, application yawe ntabishimiwe. Ubuzirwa. Garden TVET`;
                }
                if (message) await sendSMS(app.phone, message);
            }
        }

        res.json({ message: `${result.affectedRows} applications updated`, updated: result.affectedRows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating applications' });
    }
};

// Export applications to CSV
const exportApplications = async (req, res) => {
    try {
        const { status, trade, date_from, date_to } = req.query;

        let query = 'SELECT * FROM applications WHERE 1=1';
        const params = [];

        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }
        if (trade) {
            query += ' AND trade = ?';
            params.push(trade);
        }
        if (date_from) {
            query += ' AND DATE(applied_at) >= ?';
            params.push(date_from);
        }
        if (date_to) {
            query += ' AND DATE(applied_at) <= ?';
            params.push(date_to);
        }

        query += ' ORDER BY applied_at DESC';

        const [applications] = await db.query(query, params);

        // Create CSV
        const headers = ['First Name', 'Last Name', 'Gender', 'Phone', 'Email', 'Trade', 'Level', 'Status', 'Applied Date'];
        const rows = applications.map(app => [
            app.first_name,
            app.last_name,
            app.gender,
            app.phone,
            app.email || '',
            app.trade,
            app.level,
            app.status,
            new Date(app.applied_at).toLocaleDateString()
        ]);

        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=applications.csv');
        res.send(csv);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error exporting applications' });
    }
};

module.exports = {
    submitApplication,
    getApplications,
    getApplicationById,
    updateApplicationStatus,
    getApplicationStats,
    bulkUpdateApplications,
    exportApplications
};
