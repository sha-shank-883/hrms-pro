const { query } = require('../../../config/database');

/**
 * Super Admin SaaS Platform Domain Tools for HR AI Operations Agent
 */
const superadminTools = [
  {
    name: 'getSaaSOPSOverview',
    domain: 'superadmin',
    description: 'Retrieve global SaaS metrics: active company tenants, MRR revenue, subscription tiers. Restricted exclusively to Super Admin.',
    type: 'read',
    isSensitive: false,
    requiredRole: ['super_admin'],
    parameters: {
      type: 'object',
      properties: {}
    },
    execute: async (args, context) => {
      const res = await query('SELECT tenant_id, name, subscription_plan, employee_limit, created_at FROM shared.tenants ORDER BY created_at DESC');
      const totalTenants = res.rows.length;
      const plans = { hatch: 0, scale: 0, enterprise: 0 };
      res.rows.forEach(t => {
        const p = (t.subscription_plan || 'hatch').toLowerCase();
        if (plans[p] !== undefined) plans[p]++;
      });

      const pricing = { hatch: 999, scale: 2999, enterprise: 9999 };
      const estMRR = (plans.hatch * pricing.hatch) + (plans.scale * pricing.scale) + (plans.enterprise * pricing.enterprise);

      return {
        success: true,
        data: {
          total_tenants: totalTenants,
          plan_distribution: plans,
          estimated_mrr_inr: estMRR,
          recent_tenants: res.rows.slice(0, 5)
        },
        message: `Global Platform Health:\n• **Active Company Tenants**: **${totalTenants}**\n• **Plan Distribution**: Hatch (${plans.hatch}), Scale (${plans.scale}), Enterprise (${plans.enterprise})\n• **Estimated Platform MRR**: **₹${Number(estMRR).toLocaleString('en-IN')}**`
      };
    }
  }
];

module.exports = superadminTools;
