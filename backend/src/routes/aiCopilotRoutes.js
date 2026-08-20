const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const checkModuleAccess = require('../middleware/checkModuleAccess');
const aiCopilotController = require('../controllers/aiCopilotController');

// All AI Copilot endpoints require authentication and plan entitlement (Super Admins bypass module gates automatically)
router.use(authenticateToken);
router.use(checkModuleAccess('ai_assistant'));

// 1. Process Natural Language Prompt with Tool Calling
router.post('/chat', aiCopilotController.chatWithCopilot);

// 2. Real-time Streaming SSE Chat with Tool Execution Status
router.post('/chat-stream', aiCopilotController.streamChatWithCopilot);

// 3. Get Contextual Suggestions based on User Role
router.get('/suggestions', aiCopilotController.getSuggestions);

module.exports = router;
