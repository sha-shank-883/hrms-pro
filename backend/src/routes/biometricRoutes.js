const express = require('express');
const router = express.Router();
const biometricController = require('../controllers/biometricController');

// ZKTeco ADMS raw string format receiver
router.post('/zkteco', biometricController.handleZktecoWebhook);

// Universal JSON Webhook (for CAMS, local bridge agents, etc.)
router.post('/universal', biometricController.handleUniversalWebhook);

module.exports = router;
