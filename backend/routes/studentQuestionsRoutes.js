const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/studentQuestionsController');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

const teacherOrAdmin = verifyRole(['teacher', 'admin', 'dod']);

// Public
router.post('/', ctrl.submit);
router.get('/public', ctrl.publicAnswered);

// Authenticated (teacher/admin/dod)
router.get('/', verifyToken, teacherOrAdmin, ctrl.list);
router.get('/pending-count', verifyToken, teacherOrAdmin, ctrl.pendingCount);
router.patch('/:id/answer', verifyToken, teacherOrAdmin, ctrl.answer);
router.patch('/:id/status', verifyToken, teacherOrAdmin, ctrl.setStatus);
router.delete('/:id', verifyToken, teacherOrAdmin, ctrl.remove);

module.exports = router;
