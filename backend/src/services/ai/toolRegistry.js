const { query } = require('../../config/database');
const employeeTools = require('./tools/employeeTools');
const attendanceTools = require('./tools/attendanceTools');
const leaveTools = require('./tools/leaveTools');
const payrollTools = require('./tools/payrollTools');
const companyTools = require('./tools/companyTools');
const performanceTools = require('./tools/performanceTools');
const analyticsTools = require('./tools/analyticsTools');
const communicationTools = require('./tools/communicationTools');
const superadminTools = require('./tools/superadminTools');

const ALL_TOOLS = [
  ...employeeTools,
  ...attendanceTools,
  ...leaveTools,
  ...payrollTools,
  ...companyTools,
  ...performanceTools,
  ...analyticsTools,
  ...communicationTools,
  ...superadminTools
];

const TOOL_MAP = new Map();
ALL_TOOLS.forEach(t => TOOL_MAP.set(t.name, t));

/**
 * Filter available tools based on user's authenticated role
 */
function getToolsForRole(role = 'employee', isSuperAdmin = false) {
  return ALL_TOOLS.filter(tool => {
    if (isSuperAdmin) return true;
    if (tool.requiredRole.includes(role)) return true;
    return false;
  }).map(tool => ({
    name: tool.name,
    domain: tool.domain,
    description: tool.description,
    type: tool.type,
    isSensitive: !!tool.isSensitive,
    parameters: tool.parameters
  }));
}

/**
 * Format role-filtered tools into Google Gemini FunctionDeclaration objects
 */
function getGeminiFunctionDeclarations(role = 'employee', isSuperAdmin = false) {
  const tools = getToolsForRole(role, isSuperAdmin);
  const functionDeclarations = tools.map(t => ({
    name: t.name,
    description: t.description,
    parameters: t.parameters || { type: 'object', properties: {} }
  }));

  return [{ functionDeclarations }];
}

/**
 * Format role-filtered tools into OpenAI / Groq tool declarations
 */
function getOpenAIFunctionDeclarations(role = 'employee', isSuperAdmin = false) {
  const tools = getToolsForRole(role, isSuperAdmin);
  return tools.map(t => ({
    type: 'function',
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters || { type: 'object', properties: {} }
    }
  }));
}

/**
 * Record action in audit log table
 */
async function recordAuditLog({ userId, role, action, entityType, entityId, details, tenantId }) {
  try {
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, created_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
      [userId || null, `AI_AGENT:${action}`, entityType || 'AI_OPERATION', entityId ? String(entityId) : null, JSON.stringify({ role, tenantId, ...details })]
    );
  } catch (err) {
    // Non-blocking fallback
    console.warn('[ToolRegistry] Audit log notice:', err.message);
  }
}

/**
 * Server-Enforced Tool Execution with Independent Authorization, Confirmation Gate & Audit Logging
 */
async function executeAuthorizedTool(toolName, args, userContext, tenantContext, isConfirmed = false) {
  const { user, isSuperAdmin } = userContext;
  const role = user?.role || 'employee';
  const userId = user?.userId || user?.id;
  const tenantId = tenantContext?.tenantId || 'default';

  const tool = TOOL_MAP.get(toolName);
  if (!tool) {
    return {
      success: false,
      error: `Unknown tool "${toolName}". Operation aborted.`
    };
  }

  // 1. Independent Server RBAC Authorization
  const hasAccess = isSuperAdmin || tool.requiredRole.includes(role);
  if (!hasAccess) {
    await recordAuditLog({
      userId,
      role,
      action: `${toolName}:BLOCKED_UNAUTHORIZED`,
      entityType: tool.domain,
      details: { args, reason: 'RBAC boundary violation' },
      tenantId
    });

    return {
      success: false,
      isUnauthorized: true,
      message: `Permission Denied: Your current role (${role.toUpperCase()}) is not authorized to execute ${toolName}.`
    };
  }

  // 2. Sensitive Write Human Confirmation Gate
  if (tool.isSensitive && !isConfirmed) {
    const confirmationToken = `CONFIRM_${toolName}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return {
      success: false,
      requiresConfirmation: true,
      confirmationToken,
      toolName,
      args,
      message: `⚠️ **Action Confirmation Required:**\n\nExecuting **${toolName}** is a sensitive, high-impact operation.\n\nAre you sure you want to proceed?`
    };
  }

  // 3. Execution inside Tenant Sandbox
  try {
    const executionContext = {
      user,
      isSuperAdmin,
      tenantId,
      role
    };

    console.log(`[HR AI Agent] Executing ${toolName} [${tool.type}] for User: ${userId} (${role}) | Tenant: ${tenantId}`);
    const result = await tool.execute(args, executionContext);

    // 4. Audit Log Successful Execution
    await recordAuditLog({
      userId,
      role,
      action: `${toolName}:${result.success ? 'SUCCESS' : 'FAILED'}`,
      entityType: tool.domain,
      entityId: result.data?.id || result.data?.employee_id || null,
      details: { args, success: result.success, message: result.message },
      tenantId
    });

    return result;
  } catch (execError) {
    console.error(`[HR AI Agent] Error executing tool ${toolName}:`, execError);

    await recordAuditLog({
      userId,
      role,
      action: `${toolName}:ERROR`,
      entityType: tool.domain,
      details: { args, error: execError.message },
      tenantId
    });

    return {
      success: false,
      error: execError.message,
      message: `Operation failed while executing ${toolName}: ${execError.message}`
    };
  }
}

module.exports = {
  ALL_TOOLS,
  TOOL_MAP,
  getToolsForRole,
  getGeminiFunctionDeclarations,
  getOpenAIFunctionDeclarations,
  executeAuthorizedTool
};
