const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

// All staff roles can access students
const staffRoles = ['admin', 'dod', 'director_of_discipline', 'accountant', 'stock_manager', 'teacher', 'librarian', 'director', 'registrar'];

// Get students - admin, dod, director_of_discipline, accountant only
router.get('/', verifyToken, verifyRole(['admin', 'dod', 'director_of_discipline', 'accountant']), studentController.getStudents);
// Get student statistics
router.get('/stats', verifyToken, verifyRole(['admin', 'dod', 'director_of_discipline', 'accountant']), studentController.getStudentStats);
router.get('/search', verifyToken, studentController.getStudentsByContext);
// Create student - admin, dod, director_of_discipline, accountant, stock_manager, teacher, director, registrar can add students
router.post('/', verifyToken, verifyRole(['admin', 'dod', 'director_of_discipline', 'accountant', 'stock_manager', 'teacher', 'director', 'registrar']), studentController.createStudent);
router.put('/:id', verifyToken, verifyRole(['admin', 'dod', 'director_of_discipline', 'accountant', 'stock_manager', 'teacher', 'director', 'registrar']), studentController.updateStudent);
router.delete('/:id', verifyToken, verifyRole(['admin']), studentController.deleteStudent);
// Student status management - admin, dod, director_of_discipline, accountant, director
router.put('/:id/status', verifyToken, verifyRole(['admin', 'dod', 'director_of_discipline', 'accountant', 'director']), studentController.updateStudentStatus);
// Discipline actions - admin, dod, accountant, director
router.post('/:id/remove-conduct', verifyToken, verifyRole(['admin', 'dod', 'director_of_discipline', 'accountant', 'director']), studentController.removeConductAndNotify);
router.post('/:id/reinstate', verifyToken, verifyRole(['admin', 'dod', 'director_of_discipline', 'accountant', 'director']), studentController.reinstateStudent);
// Leave - admin, dod, accountant, director
router.post('/:id/leave', verifyToken, verifyRole(['admin', 'dod', 'director_of_discipline', 'accountant', 'director']), studentController.makeStudentLeave);
// Notify parents - admin, dod, accountant, director (for payment reminders)
router.post('/:id/notify-parents', verifyToken, verifyRole(['admin', 'dod', 'director_of_discipline', 'accountant', 'director']), studentController.notifyParents);
// Broadcast - admin, dod, accountant, director
router.post('/broadcast', verifyToken, verifyRole(['admin', 'dod', 'director_of_discipline', 'accountant', 'director']), studentController.broadcastToParents);
// Import - admin only
router.post('/import', verifyToken, verifyRole(['admin']), studentController.importStudents);

module.exports = router;
