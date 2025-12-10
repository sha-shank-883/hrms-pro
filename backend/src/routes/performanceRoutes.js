const express = require('express');
const router = express.Router();
const performanceController = require('../controllers/performanceController');
const { authenticateToken } = require('../middleware/auth');
const tenantMiddleware = require('../middleware/tenantMiddleware');

// Apply middlewares
router.use(tenantMiddleware);
router.use(authenticateToken);

// --- Goals Routes ---
router.get('/goals', performanceController.getGoals);
router.post('/goals', performanceController.createGoal);
router.put('/goals/:id', performanceController.updateGoal);
router.delete('/goals/:id', performanceController.deleteGoal);

// --- Cycle Routes ---
router.get('/cycles', performanceController.getCycles);
router.post('/cycles', performanceController.createCycle);

// --- Review Routes ---
router.get('/reviews', performanceController.getReviews);
router.get('/reviews/:id', performanceController.getReviewById);
router.post('/reviews', performanceController.createReview);
router.put('/reviews/:id', performanceController.updateReview);

module.exports = router;
