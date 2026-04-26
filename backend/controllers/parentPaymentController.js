const db = require('../db');
const credentials = {
    apiKey: process.env.AFRICASTALKING_API_KEY || 'YOUR_API_KEY',
    username: process.env.AFRICASTALKING_USERNAME || 'sandbox'
};

// Only initialize if credentials are properly configured
let AfricasTalking, sms;
if (process.env.AFRICASTALKING_API_KEY && process.env.AFRICASTALKING_API_KEY !== 'YOUR_API_KEY') {
    AfricasTalking = require('africastalking')(credentials);
    sms = AfricasTalking.SMS;
}

// Parent: Get available fee structures for their linked children
const getFeesForParent = async (req, res) => {
    const parentId = req.user.userId;
    try {
        // Get approved children
        const [children] = await db.query(
            `SELECT s.*, psl.id as link_id FROM students s
             JOIN parent_student_links psl ON s.id = psl.student_id
             WHERE psl.parent_id = ? AND psl.link_status = 'approved'`,
            [parentId]
        );
        if (children.length === 0) return res.json({ children: [], fees: [] });

        // Get fee structures for each child's trade/level
        // We'll retrieve all fees and let frontend filter
        const [fees] = await db.query('SELECT * FROM fees');
        res.json({ children, fees });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching payment data' });
    }
};

// Parent: Make a payment for their child
const makePayment = async (req, res) => {
    const parentId = req.user.userId;
    const { student_id, fee_id, amount_paid, payment_method, transaction_ref, notes } = req.body;

    if (!student_id || !fee_id || !amount_paid) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        // Verify parent is linked to this student
        const [links] = await db.query(
            `SELECT * FROM parent_student_links WHERE parent_id = ? AND student_id = ? AND link_status = 'approved'`,
            [parentId, student_id]
        );
        if (links.length === 0) {
            return res.status(403).json({ message: 'You are not linked to this student' });
        }

        // Record the payment
        const [result] = await db.query(
            'INSERT INTO payments (student_id, fee_id, amount_paid, payment_method, transaction_ref, notes) VALUES (?, ?, ?, ?, ?, ?)',
            [student_id, fee_id, amount_paid, payment_method || 'bank_transfer', transaction_ref || '', notes || '']
        );

        const paymentId = result.insertId;

        // Handle receipt upload if provided
        if (req.file) {
            const receiptUrl = `/uploads/${req.file.filename}`;
            await db.query(
                'INSERT INTO payment_receipts (payment_id, student_id, parent_id, receipt_image_url, description) VALUES (?, ?, ?, ?, ?)',
                [paymentId, student_id, parentId, receiptUrl, notes || 'Payment receipt']
            );
        }

        // Get student & parent info for SMS receipt
        const [students] = await db.query('SELECT * FROM students WHERE id = ?', [student_id]);
        const [parents] = await db.query('SELECT * FROM users WHERE id = ?', [parentId]);
        const [feeInfo] = await db.query('SELECT * FROM fees WHERE id = ?', [fee_id]);

        const student = students[0];
        const parent = parents[0];
        const fee = feeInfo[0];

        // Send SMS receipt to parent
        if (parent && parent.phone && sms) {
            const msg = `Murakoze! Kwishyura kwa ${student.first_name} ${student.last_name} (${fee?.term || ''}) kwa ${amount_paid} RWF kwakiriwe. Receipi #${paymentId}. Garden TVET School.`;
            try {
                await sms.send({
                    to: [parent.phone.startsWith('+') ? parent.phone : `+250${parent.phone}`],
                    message: msg
                });
            } catch (smsErr) {
                console.error('SMS receipt failed:', smsErr);
            }
        }

        res.status(201).json({
            message: 'Payment recorded successfully',
            payment_id: paymentId
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error recording payment' });
    }
};

// Parent: View payment history for their children
const getPaymentHistory = async (req, res) => {
    const parentId = req.user.userId;
    try {
        const [payments] = await db.query(
            `SELECT p.*, s.first_name, s.last_name, s.reg_number, f.term, f.amount as fee_amount
             FROM payments p
             JOIN students s ON p.student_id = s.id
             JOIN parent_student_links psl ON s.id = psl.student_id
             LEFT JOIN fees f ON p.fee_id = f.id
             WHERE psl.parent_id = ? AND psl.link_status = 'approved'
             ORDER BY p.payment_date DESC`,
            [parentId]
        );
        res.json(payments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching payment history' });
    }
};

// Admin, Accountant: Remind parents to pay
const remindParentToPay = async (req, res) => {
    try {
        const { student_id, message } = req.body;
        if (!student_id || !message) {
            return res.status(400).json({ message: 'Missing student_id or message' });
        }

        const [parents] = await db.query(
            `SELECT u.phone, u.first_name 
             FROM parent_student_links psl
             JOIN users u ON psl.parent_id = u.id
             WHERE psl.student_id = ? AND psl.status = 'approved'`,
            [student_id]
        );

        if (parents.length === 0) {
            return res.status(404).json({ message: 'Nta babyeyi uyu munyeshuri afite' });
        }

        // Check if SMS is configured
        if (!process.env.AFRICASTALKING_API_KEY || process.env.AFRICASTALKING_API_KEY === 'YOUR_API_KEY') {
            console.log('SMS not configured. Would send to:', parents.map(p => p.phone));
            return res.json({ message: `Message logged (SMS not configured): ${parents.length} parents` });
        }

        const AT = require('africastalking')(credentials);
        for (const parent of parents) {
            const to = parent.phone.startsWith('+') ? parent.phone : `+250${parent.phone.replace(/^0/, '')}`;
            await AT.SMS.send({ to: [to], message: `Garden TVET: Muraho ${parent.first_name}. ${message}` });
        }

        res.json({ message: `Kwibutsa byoherejwe kuri SMS ${parents.length}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Habaye ikibazo mu kohereza SMS' });
    }
};

// Parent: Upload receipt for an existing payment
const uploadReceipt = async (req, res) => {
    const parentId = req.user.userId;
    const { payment_id, description } = req.body;

    if (!payment_id) {
        return res.status(400).json({ message: 'Payment ID is required' });
    }

    if (!req.file) {
        return res.status(400).json({ message: 'Receipt image is required' });
    }

    try {
        // Verify parent is linked to this payment's student
        const [payments] = await db.query(
            `SELECT p.* FROM payments p
             JOIN parent_student_links psl ON p.student_id = psl.student_id
             WHERE p.id = ? AND psl.parent_id = ? AND psl.link_status = 'approved'`,
            [payment_id, parentId]
        );

        if (payments.length === 0) {
            return res.status(403).json({ message: 'You are not authorized to upload receipt for this payment' });
        }

        const payment = payments[0];
        const receiptUrl = `/uploads/${req.file.filename}`;

        // Check if receipt already exists
        const [existing] = await db.query(
            'SELECT id FROM payment_receipts WHERE payment_id = ?',
            [payment_id]
        );

        if (existing.length > 0) {
            // Update existing receipt
            await db.query(
                'UPDATE payment_receipts SET receipt_image_url = ?, description = ?, status = ? WHERE payment_id = ?',
                [receiptUrl, description || '', 'pending', payment_id]
            );
        } else {
            // Insert new receipt
            await db.query(
                'INSERT INTO payment_receipts (payment_id, student_id, parent_id, receipt_image_url, description) VALUES (?, ?, ?, ?, ?)',
                [payment_id, payment.student_id, parentId, receiptUrl, description || '']
            );
        }

        res.status(201).json({ message: 'Receipt uploaded successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error uploading receipt' });
    }
};

// Accountant/Admin: Get all payments with receipts
const getAllPaymentsWithReceipts = async (req, res) => {
    try {
        const [payments] = await db.query(
            `SELECT 
                p.id as payment_id,
                p.student_id,
                p.fee_id,
                p.amount_paid,
                p.payment_date,
                p.payment_method,
                p.transaction_ref,
                p.notes,
                s.first_name as student_first_name,
                s.last_name as student_last_name,
                s.reg_number,
                s.trade,
                s.level as student_level,
                pr.id as receipt_id,
                pr.receipt_image_url,
                pr.description as receipt_description,
                pr.status as receipt_status,
                pr.created_at as receipt_uploaded_at,
                u.first_name as parent_first_name,
                u.last_name as parent_last_name,
                u.phone as parent_phone
             FROM payments p
             JOIN students s ON p.student_id = s.id
             LEFT JOIN payment_receipts pr ON p.id = pr.payment_id
             LEFT JOIN users u ON pr.parent_id = u.id
             ORDER BY p.payment_date DESC
             LIMIT 100`
        );
        res.json(payments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching payments' });
    }
};

// Accountant/Admin: Verify or reject receipt
const verifyReceipt = async (req, res) => {
    const { receipt_id, status } = req.body;
    const userId = req.user.userId;

    if (!receipt_id || !status) {
        return res.status(400).json({ message: 'Receipt ID and status are required' });
    }

    if (!['verified', 'rejected', 'pending'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    try {
        await db.query(
            'UPDATE payment_receipts SET status = ?, verified_by = ?, verified_at = NOW() WHERE id = ?',
            [status, userId, receipt_id]
        );

        res.json({ message: `Receipt ${status} successfully` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating receipt status' });
    }
};

// Accountant/Admin: Get pending receipts count
const getPendingReceiptsCount = async (req, res) => {
    try {
        const [result] = await db.query(
            "SELECT COUNT(*) as count FROM payment_receipts WHERE status = 'pending'"
        );
        res.json({ count: result[0].count });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error counting receipts' });
    }
};

module.exports = {
    getFeesForParent,
    makePayment,
    getPaymentHistory,
    remindParentToPay,
    uploadReceipt,
    getAllPaymentsWithReceipts,
    verifyReceipt,
    getPendingReceiptsCount
};
