const { getTenantActiveModules } = require('../utils/moduleEntitlements');

/**
 * Middleware to restrict API route access based on tenant plan module entitlements.
 * Super Admins always bypass module checks.
 *
 * @param {string} requiredModule - The module key (e.g. 'payroll', 'recruitment', 'assets', 'chat')
 */
const checkModuleAccess = (requiredModule) => {
  return async (req, res, next) => {
    try {
      // 1. Global Super Admin bypasses all module restrictions
      if (req.user?.isSuperAdmin === true || req.user?.role === 'super_admin') {
        return next();
      }

      // 2. Identify Tenant Context
      const tenantId = req.tenant?.tenant_id || req.headers['x-tenant-id'] || req.user?.tenant_id;

      if (!tenantId) {
        // Without tenant context on tenant-scoped route, pass through to normal auth/tenant validators
        return next();
      }

      // 3. Resolve Active Modules
      const entitlement = await getTenantActiveModules(tenantId);
      req.tenantModules = entitlement.modules;
      req.tenantPlan = entitlement.plan;

      // 4. Verify Module Entitlement
      if (entitlement.modules.includes(requiredModule) || entitlement.modules.includes('all')) {
        return next();
      }

      // 5. Friendly, Non-Breaking 403 Forbidden with Structured Metadata
      return res.status(403).json({
        success: false,
        code: 'MODULE_LOCKED',
        module: requiredModule,
        message: `The '${requiredModule}' module is not enabled in your organization's current subscription plan. Please upgrade your plan or contact your Super Admin to unlock this module.`,
        plan: entitlement.plan,
        upgradeUrl: '/settings?tab=billing'
      });
    } catch (err) {
      console.error(`Module entitlement check error for module '${requiredModule}':`, err);
      // Fail safely to avoid blocking system if database check fails unexpectedly
      return next();
    }
  };
};

module.exports = checkModuleAccess;
