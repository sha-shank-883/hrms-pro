const asyncHandler = require('../utils/asyncHandler');
const { pool, tenantStorage } = require('../config/database');
const aiCopilotService = require('../services/ai/aiCopilotService');

/**
 * Resolve authentic user and tenant identity with strict multi-tenant isolation
 */
async function resolveUserTenantContext(req) {
  let resolvedTenantId = req.user?.tenant_id || req.tenant?.tenant_id || req.headers['x-tenant-id'];
  const user = req.user || {};
  const isSuperAdmin = !!(user.isSuperAdmin || user.role === 'super_admin');

  // If tenantId is not in header/user, safely look up which company tenant owns this user session
  if ((!resolvedTenantId || resolvedTenantId === 'default') && user.email) {
    try {
      const tenantsRes = await pool.query('SELECT tenant_id FROM shared.tenants WHERE status = $1', ['active']);
      for (const t of tenantsRes.rows) {
        try {
          const uRes = await pool.query(`SELECT user_id, role FROM "${t.tenant_id}".users WHERE email = $1 LIMIT 1`, [user.email]);
          if (uRes.rows.length > 0) {
            resolvedTenantId = t.tenant_id;
            break;
          }
        } catch (_) {}
      }
    } catch (_) {}
  }

  if (!resolvedTenantId) {
    resolvedTenantId = 'default';
  }

  const userContext = {
    user: {
      ...user,
      tenantId: resolvedTenantId
    },
    tenantId: resolvedTenantId,
    isSuperAdmin
  };

  const tenantContext = {
    tenantId: resolvedTenantId,
    plan: req.tenantPlan || 'scale'
  };

  return { userContext, tenantContext, resolvedTenantId };
}

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

  const { userContext, tenantContext, resolvedTenantId } = await resolveUserTenantContext(req);

  const result = await new Promise((resolve, reject) => {
    tenantStorage.run(resolvedTenantId, async () => {
      try {
        const out = await aiCopilotService.processUserMessage({
          message: (message || '').trim(),
          conversationHistory: conversationHistory || [],
          userContext,
          tenantContext,
          isConfirmed: !!isConfirmed,
          confirmedAction: confirmedAction || null
        });
        resolve(out);
      } catch (err) {
        reject(err);
      }
    });
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

  const { userContext, tenantContext, resolvedTenantId } = await resolveUserTenantContext(req);

  // 1. Emit initial thinking status
  res.write(`data: ${JSON.stringify({ type: 'status', message: 'Analyzing request & inspecting organizational context...' })}\n\n`);

  try {
    const result = await new Promise((resolve, reject) => {
      tenantStorage.run(resolvedTenantId, async () => {
        try {
          const out = await aiCopilotService.processUserMessage({
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
          resolve(out);
        } catch (err) {
          reject(err);
        }
      });
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
