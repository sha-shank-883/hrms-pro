const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const checkModuleAccess = require('../middleware/checkModuleAccess');
const aiIntelligenceController = require('../controllers/aiIntelligenceController');

// All AI Intelligence routes are strictly gated by authentication, admin/manager role, and 'ai_assistant' subscription module entitlement
router.use(authenticateToken);
router.use(authorizeRole('admin', 'manager'));
router.use(checkModuleAccess('ai_assistant'));

// 1. Resume Screening & Match Scoring
router.post('/screen-resume', aiIntelligenceController.screenResume);

// 2. Batch Candidate Screening & Ranking
router.post('/batch-screen-candidates', aiIntelligenceController.batchScreenCandidates);

// 3. Job Description Generator
router.post('/generate-job-description', aiIntelligenceController.generateJobDescription);

// 4. Smart HR Email Drafter
router.post('/draft-email', aiIntelligenceController.draftEmail);

// 5. Employee Performance Appraisal Summary
router.post('/performance-summary', aiIntelligenceController.generateEmployeePerformanceSummary);

// 6. Company Executive Workforce & Productivity Insights
router.post('/executive-insights', aiIntelligenceController.generateExecutiveInsights);

// 7. Tenant Usage & AI Quota
router.get('/quota-status', aiIntelligenceController.getAIQuotaStatus);

module.exports = router;
