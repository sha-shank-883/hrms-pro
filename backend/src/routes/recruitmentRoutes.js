const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const recruitmentController = require('../controllers/recruitmentController');

// Validation rules
const jobPostingValidation = [
  body('title').notEmpty().withMessage('Job title is required'),
  body('description').notEmpty().withMessage('Description is required'),
];

const applicationValidation = [
  body('job_id').isInt().withMessage('Valid job ID is required'),
  body('applicant_name').notEmpty().withMessage('Applicant name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
];

// Job Postings Routes
router.get('/jobs', authenticateToken, recruitmentController.getAllJobPostings);
router.get('/jobs/:id', authenticateToken, recruitmentController.getJobPostingById);
router.post('/jobs', authenticateToken, authorizeRole('admin', 'manager'), jobPostingValidation, validate, recruitmentController.createJobPosting);
router.put('/jobs/:id', authenticateToken, authorizeRole('admin', 'manager'), recruitmentController.updateJobPosting);
router.delete('/jobs/:id', authenticateToken, authorizeRole('admin'), recruitmentController.deleteJobPosting);

// Job Applications Routes
router.get('/applications', authenticateToken, authorizeRole('admin', 'manager'), recruitmentController.getAllApplications);
router.post('/applications', applicationValidation, validate, recruitmentController.createApplication);
router.put('/applications/:id', authenticateToken, authorizeRole('admin', 'manager'), recruitmentController.updateApplicationStatus);
router.delete('/applications/:id', authenticateToken, authorizeRole('admin'), recruitmentController.deleteApplication);

// Resume Parsing Route
const { upload } = require('../controllers/documentController');
router.post('/resume/parse', authenticateToken, upload.single('resume'), recruitmentController.parseResume);

module.exports = router;
