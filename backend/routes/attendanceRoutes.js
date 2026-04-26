const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');

// Bulk record attendance
router.post('/bulk', attendanceController.recordBulkAttendance);

// Get attendance overview for a specific date, trade, and level
router.get('/overview', attendanceController.getAttendanceOverview);

// Get student attendance history
router.get('/student/:studentId', attendanceController.getStudentAttendance);

// Get attendance summary
router.get('/summary', attendanceController.getAttendanceSummary);

module.exports = router;
