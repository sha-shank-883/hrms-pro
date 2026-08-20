const asyncHandler = require('../utils/asyncHandler');
const aiCopilotService = require('../services/ai/aiCopilotService');

/**
 * Handle AI Copilot Chat Request
 */
const chatWithCopilot = asyncHandler(async (req, res) => {
  const { message, conversationHistory, isConfirmed, confirmedAction } = req.body;

  if ((!message || typeof message !== 'string' || message.trim() === '') && !isConfirmed) {
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
    message: (message || '').trim(),
    conversationHistory: conversationHistory || [],
    userContext,
    tenantContext,
    isConfirmed: !!isConfirmed,
    confirmedAction: confirmedAction || null
  });

  res.json({
    success: true,
    data: result
  });
});

/**
 * Handle Streaming AI Copilot Chat Request (Server-Sent Events)
 */
const streamChatWithCopilot = asyncHandler(async (req, res) => {
  const { message, conversationHistory, isConfirmed, confirmedAction } = req.body;

  if ((!message || typeof message !== 'string' || message.trim() === '') && !isConfirmed) {
    return res.status(400).json({ success: false, message: 'Message prompt is required.' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const userContext = {
    user: req.user,
    tenantId: req.tenant?.tenant_id || req.headers['x-tenant-id'] || 'default',
    isSuperAdmin: !!(req.user?.isSuperAdmin || req.user?.role === 'super_admin')
  };

  const tenantContext = {
    tenantId: userContext.tenantId,
    plan: req.tenantPlan || 'scale'
  };

  // 1. Emit initial thinking status
  res.write(`data: ${JSON.stringify({ type: 'status', message: 'Analyzing request & inspecting organizational context...' })}\n\n`);

  try {
    const result = await aiCopilotService.processUserMessage({
      message: (message || '').trim(),
      conversationHistory: conversationHistory || [],
      userContext,
      tenantContext,
      isConfirmed: !!isConfirmed,
      confirmedAction: confirmedAction || null,
      onProgress: (statusText) => {
        res.write(`data: ${JSON.stringify({ type: 'status', message: statusText })}\n\n`);
      }
    });

    // 2. Emit streamed text chunks if reply exists
    if (result?.reply) {
      const words = result.reply.split(' ');
      for (let i = 0; i < words.length; i += 4) {
        const slice = words.slice(i, i + 4).join(' ') + ' ';
        res.write(`data: ${JSON.stringify({ type: 'chunk', text: slice })}\n\n`);
      }
    }

    // 3. Emit final completed payload
    res.write(`data: ${JSON.stringify({ type: 'done', data: result })}\n\n`);
    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
    res.end();
  }
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
  streamChatWithCopilot,
  getSuggestions
};
