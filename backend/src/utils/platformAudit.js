const { pool } = require('../config/database');

/**
 * Log a privileged platform-wide Super Admin administrative action
 * @param {Object} params
 * @param {string} params.action - e.g. 'IMPERSONATE_TENANT', 'CREATE_TENANT', 'UPDATE_PLAN', 'RESTORE_BACKUP'
 * @param {string} params.category - 'auth', 'impersonation', 'tenant_mgmt', 'billing', 'plan_change', 'backup_restore', 'broadcast', 'security'
 * @param {string} params.actor_email - Super Admin email
 * @param {string} [params.actor_role='super_admin']
 * @param {string} [params.target_tenant_id] - Target tenant workspace ID
 * @param {Object} [params.details={}] - Context metadata
 * @param {string} [params.ip_address]
 * @param {string} [params.user_agent]
 * @param {string} [params.status='success'] - 'success' | 'failure'
 */
async function logPlatformAudit({
  action,
  category = 'tenant_mgmt',
  actor_email,
  actor_role = 'super_admin',
  target_tenant_id = null,
  details = {},
  ip_address = null,
  user_agent = null,
  status = 'success'
}) {
  try {
    if (!action || !actor_email) return;
    
    await pool.query(`
      INSERT INTO shared.platform_audit_logs 
        (action, category, actor_email, actor_role, target_tenant_id, details, ip_address, user_agent, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      action,
      category,
      actor_email,
      actor_role,
      target_tenant_id,
      JSON.stringify(details || {}),
      ip_address,
      user_agent,
      status
    ]);
  } catch (err) {
    console.error('Failed to write platform audit log:', err.message);
  }
}

module.exports = { logPlatformAudit };
