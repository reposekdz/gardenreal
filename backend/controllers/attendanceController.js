const { getDb } = require('../db');
const smsService = require('../utils/smsService');

/**
 * Record attendance for multiple students
 * POST /api/attendance/bulk
 */
exports.recordBulkAttendance = async (req, res) => {
    const connection = await getDb().getConnection();
    try {
        await connection.beginTransaction();
        const { date, attendanceData, recordedBy } = req.body;

        if (!date || !attendanceData || !Array.isArray(attendanceData)) {
            return res.status(400).json({ success: false, message: 'Invalid data provided' });
        }

        const results = [];
        const smsPromises = [];

        for (const record of attendanceData) {
            const { studentId, status, notes } = record;

            // Insert or update attendance
            await connection.query(
                `INSERT INTO attendance (student_id, date, status, recorded_by, notes) 
                 VALUES (?, ?, ?, ?, ?) 
                 ON DUPLICATE KEY UPDATE status = VALUES(status), recorded_by = VALUES(recorded_by), notes = VALUES(notes)`,
                [studentId, date, status, recordedBy, notes || '']
            );

            // Fetch student name for SMS if not present/excused
            if (status === 'absent' || status === 'late') {
                smsPromises.push(smsService.notifyAttendance(studentId, date, status, notes));
            }

            results.push({ studentId, status, success: true });
        }

        await connection.commit();
        
        // Wait for SMS notifications to be sent (don't block the response but ensure they are started)
        Promise.all(smsPromises).catch(err => console.error('SMS broadcast error:', err));

        res.json({ 
            success: true, 
            message: 'Attendance recorded successfully', 
            count: results.length 
        });
    } catch (error) {
        await connection.rollback();
        console.error('Attendance recording error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    } finally {
        connection.release();
    }
};

/**
 * Get attendance overview for a specific trade and level on a date
 * GET /api/attendance/overview
 */
exports.getAttendanceOverview = async (req, res) => {
    try {
        const { date, trade, level } = req.query;
        const db = getDb();

        const [records] = await db.execute(
            `SELECT s.id, s.first_name, s.last_name, s.reg_number, a.status, a.notes, a.date
             FROM students s
             LEFT JOIN attendance a ON s.id = a.student_id AND a.date = ?
             WHERE s.trade = ? AND s.level = ? AND s.current_status = 'active'
             ORDER BY s.last_name, s.first_name`,
            [date, trade, level]
        );

        res.json({ success: true, data: records });
    } catch (error) {
        console.error('Error fetching attendance overview:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Get attendance history for a specific student
 * GET /api/attendance/student/:studentId
 */
exports.getStudentAttendance = async (req, res) => {
    try {
        const { studentId } = req.params;
        const db = getDb();

        const [records] = await db.execute(
            `SELECT * FROM attendance WHERE student_id = ? ORDER BY date DESC`,
            [studentId]
        );

        res.json({ success: true, data: records });
    } catch (error) {
        console.error('Error fetching student attendance:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Get attendance summary for a trade and level (percentage)
 * GET /api/attendance/summary
 */
exports.getAttendanceSummary = async (req, res) => {
    try {
        const { trade, level, startDate, endDate } = req.query;
        const db = getDb();

        const [summary] = await db.execute(
            `SELECT 
                status, 
                COUNT(*) as count
             FROM attendance a
             JOIN students s ON a.student_id = s.id
             WHERE s.trade = ? AND s.level = ? 
             AND a.date BETWEEN ? AND ?
             GROUP BY status`,
            [trade, level, startDate, endDate]
        );

        res.json({ success: true, data: summary });
    } catch (error) {
        console.error('Error fetching attendance summary:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
