const asyncHandler = require('../utils/asyncHandler');
const { pool, tenantStorage } = require('../config/database');
const aiCopilotService = require('../services/ai/aiCopilotService');

/**
 * Resolve authentic user and tenant identity with strict multi-tenant isolation
 */
async function resolveUserTenantContext(req) {
  const user = req.user || {};
  const isSuperAdmin = !!(user.isSuperAdmin || user.role === 'super_admin');

  let resolvedTenantId = null;

  // 1. If user is Super Admin, accept explicitly requested tenant or default to master tenant
  if (isSuperAdmin) {
    resolvedTenantId = req.headers['x-tenant-id'] || user.tenant_id || 'tenant_default';
    if (resolvedTenantId === 'default') resolvedTenantId = 'tenant_default';
  } else {
    // 2. Verified JWT tenant_id (cryptographically signed, tamper-proof)
    if (user.tenant_id && user.tenant_id !== 'default') {
      resolvedTenantId = user.tenant_id;
    }

    // 3. Verified middleware tenant context
    if (!resolvedTenantId && req.tenant?.tenant_id && req.tenant.tenant_id !== 'default') {
      resolvedTenantId = req.tenant.tenant_id;
    }

    // 4. Header verification: Only trust x-tenant-id if user genuinely exists in that tenant schema
    if (!resolvedTenantId && req.headers['x-tenant-id'] && req.headers['x-tenant-id'] !== 'default') {
      const candidateTenant = req.headers['x-tenant-id'];
      try {
        const check = await pool.query(
          `SELECT user_id FROM "${candidateTenant}".users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
          [user.email]
        );
        if (check.rows.length > 0) {
          resolvedTenantId = candidateTenant;
        }
      } catch (_) {}
    }

    // 5. Look up by company ownership / contact_email in shared.tenants
    if (!resolvedTenantId && user.email) {
      try {
        const ownerRes = await pool.query(
          `SELECT tenant_id FROM shared.tenants WHERE LOWER(contact_email) = LOWER($1) AND status = 'active' ORDER BY created_at DESC LIMIT 1`,
          [user.email]
        );
        if (ownerRes.rows.length > 0) {
          resolvedTenantId = ownerRes.rows[0].tenant_id;
        }
      } catch (_) {}
    }

    // 6. Direct schema scan matching user.email (ordered by created_at DESC to prioritize active customer tenant)
    if (!resolvedTenantId && user.email) {
      try {
        const tenantsRes = await pool.query(
          `SELECT tenant_id FROM shared.tenants WHERE status = 'active' AND tenant_id NOT IN ('default') ORDER BY created_at DESC`
        );
        for (const t of tenantsRes.rows) {
          try {
            const uRes = await pool.query(
              `SELECT user_id FROM "${t.tenant_id}".users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
              [user.email]
            );
            if (uRes.rows.length > 0) {
              resolvedTenantId = t.tenant_id;
              break;
            }
          } catch (_) {}
        }
      } catch (_) {}
    }
  }

  if (!resolvedTenantId) {
    resolvedTenantId = 'tenant_default';
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
