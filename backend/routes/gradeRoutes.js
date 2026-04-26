const express = require('express');
const router = express.Router();
const gradeController = require('../controllers/gradeController');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

// Get grades (with optional filters)
router.get('/', verifyToken, gradeController.getGrades);

// Get student performance summary
router.get('/student/:student_id', verifyToken, gradeController.getStudentPerformance);

// Get grade statistics for a student
router.get('/stats/:student_id', verifyToken, gradeController.getGradeStats);

// Get grade history (active and archived)
router.get('/history', verifyToken, gradeController.getGradeHistory);

// Get archived grades only
router.get('/archived', verifyToken, gradeController.getArchivedGrades);

// Add new grade
router.post('/', verifyToken, verifyRole(['admin', 'dod', 'director', 'teacher']), gradeController.addGrade);

// Update grade
router.put('/:id', verifyToken, verifyRole(['admin', 'dod', 'director', 'teacher']), gradeController.updateGrade);

// Delete grade
router.delete('/:id', verifyToken, verifyRole(['admin', 'dod', 'director']), gradeController.deleteGrade);

module.exports = router;
