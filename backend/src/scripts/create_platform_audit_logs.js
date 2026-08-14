const { pool } = require('../config/database');

async function migrate() {
  try {
    console.log('🔄 Creating shared.platform_audit_logs table...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shared.platform_audit_logs (
        id SERIAL PRIMARY KEY,
        action VARCHAR(100) NOT NULL,
        category VARCHAR(50) NOT NULL DEFAULT 'tenant_mgmt', -- 'auth', 'impersonation', 'tenant_mgmt', 'billing', 'plan_change', 'backup_restore', 'broadcast', 'security'
        actor_email VARCHAR(255) NOT NULL,
        actor_role VARCHAR(50) DEFAULT 'super_admin',
        target_tenant_id VARCHAR(100),
        details JSONB DEFAULT '{}'::jsonb,
        ip_address VARCHAR(100),
        user_agent TEXT,
        status VARCHAR(20) DEFAULT 'success', -- 'success', 'failure'
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_platform_audit_action ON shared.platform_audit_logs (action);
      CREATE INDEX IF NOT EXISTS idx_platform_audit_tenant ON shared.platform_audit_logs (target_tenant_id);
      CREATE INDEX IF NOT EXISTS idx_platform_audit_created ON shared.platform_audit_logs (created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_platform_audit_category ON shared.platform_audit_logs (category);
    `);

    console.log('✅ Created shared.platform_audit_logs successfully');
  } catch (err) {
    console.error('❌ Error migrating platform audit logs table:', err);
  } finally {
    process.exit(0);
  }
}

migrate();
