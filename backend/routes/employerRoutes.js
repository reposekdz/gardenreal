const express = require('express');
const router = express.Router();
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');
const ctrl = require('../controllers/employerController');

const READ   = ['admin', 'director', 'registrar', 'dod', 'director_of_discipline', 'accountant'];
const WRITE  = ['admin', 'director', 'registrar'];
const SEND   = ['admin', 'director', 'registrar'];

router.get('/email/status',   verifyToken, verifyRole(READ),  ctrl.emailStatus);
router.get('/outreach',       verifyToken, verifyRole(READ),  ctrl.listOutreach);
router.post('/send-roster',   verifyToken, verifyRole(SEND),  ctrl.sendRoster);

router.get('/',               verifyToken, verifyRole(READ),  ctrl.listEmployers);
router.get('/:id',            verifyToken, verifyRole(READ),  ctrl.getEmployer);
router.post('/',              verifyToken, verifyRole(WRITE), ctrl.createEmployer);
router.put('/:id',            verifyToken, verifyRole(WRITE), ctrl.updateEmployer);
router.delete('/:id',         verifyToken, verifyRole(WRITE), ctrl.deleteEmployer);

module.exports = router;
