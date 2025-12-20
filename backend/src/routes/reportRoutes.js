const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const reportController = require('../controllers/reportController');

// Routes
router.get('/dashboard', authenticateToken, reportController.getDashboardStats);
router.get('/attendance', authenticateToken, authorizeRole('admin', 'manager'), reportController.getAttendanceReport);
router.get('/leave', authenticateToken, authorizeRole('admin', 'manager'), reportController.getLeaveReport);
router.get('/payroll', authenticateToken, authorizeRole('admin', 'manager'), reportController.getPayrollReport);
router.get('/employee', authenticateToken, authorizeRole('admin', 'manager'), reportController.getEmployeeReport);
router.get('/demographics', authenticateToken, authorizeRole('admin', 'manager'), reportController.getEmployeeDemographics);
router.get('/recruitment', authenticateToken, authorizeRole('admin', 'manager'), reportController.getRecruitmentReport);
router.get('/attendance-trends', authenticateToken, authorizeRole('admin', 'manager'), reportController.getAttendanceTrends);
router.get('/employee-demographics', authenticateToken, authorizeRole('admin', 'manager'), reportController.getEmployeeDemographics);

// Advanced Analytics Routes
router.get('/turnover-prediction', authenticateToken, authorizeRole('admin', 'manager'), reportController.getTurnoverPrediction);
router.get('/performance-analytics', authenticateToken, authorizeRole('admin', 'manager'), reportController.getPerformanceAnalytics);
router.get('/payroll-trends', authenticateToken, authorizeRole('admin', 'manager'), reportController.getPayrollTrends);
router.get('/churn-risk', authenticateToken, authorizeRole('admin'), reportController.getChurnRiskAnalysis);

module.exports = router;
