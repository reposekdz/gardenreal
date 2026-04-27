const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

// Public route: Submit application
router.post('/', applicationController.submitApplication);

// All staff routes: Get all applications
router.get('/', verifyToken, verifyRole(['admin', 'accountant', 'director_of_discipline', 'dod', 'stock_manager']), applicationController.getApplications);

// Get single application by ID
router.get('/:id', verifyToken, verifyRole(['admin', 'director_of_discipline', 'dod', 'stock_manager']), applicationController.getApplicationById);

// Update application status (approve/reject/waitlist) - triggers SMS
router.put('/:id', verifyToken, verifyRole(['admin', 'accountant', 'director_of_discipline', 'dod', 'stock_manager']), applicationController.updateApplicationStatus);

// Enroll an applicant as a real student (admin / registrar / director only)
router.post('/:id/enroll', verifyToken, verifyRole(['admin', 'director', 'registrar', 'director_of_discipline', 'dod']), applicationController.enrollApplicant);

// Get application statistics
router.get('/stats/summary', verifyToken, verifyRole(['admin', 'director_of_discipline', 'dod', 'accountant', 'stock_manager']), applicationController.getApplicationStats);

// Bulk update applications
router.post('/bulk-update', verifyToken, verifyRole(['admin', 'director_of_discipline', 'dod', 'stock_manager']), applicationController.bulkUpdateApplications);

// Export applications to CSV
router.get('/export', verifyToken, verifyRole(['admin', 'director_of_discipline', 'dod', 'stock_manager']), applicationController.exportApplications);

module.exports = router;
