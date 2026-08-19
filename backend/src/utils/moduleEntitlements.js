const { pool } = require('../config/database');

// Default fallback modules if database plan config is temporarily unreachable
const DEFAULT_FALLBACK_MODULES = {
  free: ['core_hr', 'attendance', 'leaves', 'tasks', 'documents'],
  hatch: ['core_hr', 'attendance', 'leaves', 'tasks', 'documents', 'performance', 'reports_analytics'],
  scale: ['core_hr', 'attendance', 'leaves', 'tasks', 'documents', 'performance', 'payroll', 'assets', 'chat', 'reports_analytics', 'ai_assistant'],
  enterprise: ['core_hr', 'attendance', 'leaves', 'tasks', 'documents', 'performance', 'payroll', 'recruitment', 'assets', 'chat', 'biometrics', 'live_activity', 'reports_analytics', 'audit_logs', 'ai_assistant']
};

/**
 * Resolves the active module list for a given tenant.
 * Hierarchy:
 * 1. If tenant has `custom_modules` defined (not null), that explicit list is used.
 * 2. Otherwise, the module list configured in `shared.plan_configs` for `tenant.subscription_plan` is used.
 * 3. Core HR is always guaranteed to prevent platform lockout.
 *
 * @param {string} tenantId - Tenant identifier (e.g. 'tenant_default')
 * @param {object} [dbClient] - Optional pool or client to execute queries
 * @returns {Promise<{ plan: string, modules: string[], isCustom: boolean, isExpired: boolean, status: string }>}
 */
async function getTenantActiveModules(tenantId, dbClient = pool) {
  if (!tenantId) {
    return {
      plan: 'free',
      modules: DEFAULT_FALLBACK_MODULES.free,
      isCustom: false,
      isExpired: false,
      status: 'active'
    };
  }

  try {
    const tenantRes = await dbClient.query(
      `SELECT subscription_plan, subscription_expiry, custom_modules, status 
       FROM shared.tenants 
       WHERE tenant_id = $1`,
      [tenantId]
    );

    if (tenantRes.rows.length === 0) {
      return {
        plan: 'free',
        modules: DEFAULT_FALLBACK_MODULES.free,
        isCustom: false,
        isExpired: false,
        status: 'active'
      };
    }

    const tenant = tenantRes.rows[0];
    const plan = (tenant.subscription_plan || 'free').toLowerCase();
    const isExpired = tenant.subscription_expiry ? new Date(tenant.subscription_expiry) < new Date() : false;

    // Check if Super Admin assigned custom modules
    if (tenant.custom_modules && Array.isArray(tenant.custom_modules) && tenant.custom_modules.length > 0) {
      const customSet = new Set(tenant.custom_modules);
      customSet.add('core_hr'); // Always guaranteed
      return {
        plan,
        modules: Array.from(customSet),
        isCustom: true,
        isExpired,
        status: tenant.status || 'active'
      };
    }

    // Lookup plan config from shared.plan_configs
    const planRes = await dbClient.query(
      `SELECT modules FROM shared.plan_configs WHERE plan_id = $1 AND is_active = true`,
      [plan]
    );

    let resolvedModules = [];
    if (planRes.rows.length > 0 && Array.isArray(planRes.rows[0].modules) && planRes.rows[0].modules.length > 0) {
      resolvedModules = planRes.rows[0].modules;
    } else {
      resolvedModules = DEFAULT_FALLBACK_MODULES[plan] || DEFAULT_FALLBACK_MODULES.free;
    }

    const finalSet = new Set(resolvedModules);
    finalSet.add('core_hr'); // Always guaranteed

    return {
      plan,
      modules: Array.from(finalSet),
      isCustom: false,
      isExpired,
      status: tenant.status || 'active'
    };
  } catch (err) {
    console.error('Error resolving tenant modules:', err.message);
    return {
      plan: 'free',
      modules: DEFAULT_FALLBACK_MODULES.free,
      isCustom: false,
      isExpired: false,
      status: 'active'
    };
  }
}

module.exports = {
  getTenantActiveModules,
  DEFAULT_FALLBACK_MODULES
};
