const asyncHandler = require('../utils/asyncHandler');
const aiCopilotService = require('../services/ai/aiCopilotService');

/**
 * Handle AI Copilot Chat Request
 */
const chatWithCopilot = asyncHandler(async (req, res) => {
  const { message, conversationHistory } = req.body;

  if (!message || typeof message !== 'string' || message.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Message prompt is required.'
    });
  }

  const userContext = {
    user: req.user,
    tenantId: req.tenant?.tenant_id || req.headers['x-tenant-id'] || 'default',
    isSuperAdmin: !!(req.user?.isSuperAdmin || req.user?.role === 'super_admin')
  };

  const tenantContext = {
    tenantId: userContext.tenantId,
    plan: req.tenantPlan || 'scale'
  };

  const result = await aiCopilotService.processUserMessage({
    message: message.trim(),
    conversationHistory: conversationHistory || [],
    userContext,
    tenantContext
  });

  res.json({
    success: true,
    data: result
  });
});

/**
 * Get Contextual Suggestions based on User Role
 */
const getSuggestions = asyncHandler(async (req, res) => {
  const role = req.user?.role || 'employee';
  const isSuperAdmin = !!(req.user?.isSuperAdmin || req.user?.role === 'super_admin');

  const suggestions = aiCopilotService.getQuickSuggestions(role, isSuperAdmin);

  res.json({
    success: true,
    data: suggestions
  });
});

module.exports = {
  chatWithCopilot,
  getSuggestions
};
