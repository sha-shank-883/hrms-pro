const { pool } = require('../config/database');

async function migrateNotifications() {
  const client = await pool.connect();
  try {
    console.log('🔄 Starting Notifications Migration across all tenant schemas...');

    // 1. Get all tenants
    const tenantsRes = await client.query('SELECT tenant_id FROM shared.tenants');
    const tenantIds = tenantsRes.rows.map(r => r.tenant_id);

    // Also include default tenant if exists
    if (!tenantIds.includes('tenant_default')) {
      tenantIds.push('tenant_default');
    }

    for (const tenantId of tenantIds) {
      console.log(`📦 Applying notification tables to schema: "${tenantId}"`);

      // Ensure tenant schema exists
      await client.query(`CREATE SCHEMA IF NOT EXISTS "${tenantId}";`);

      // 2. Create user_notifications table in tenant schema
      await client.query(`
        CREATE TABLE IF NOT EXISTS "${tenantId}".user_notifications (
          id SERIAL PRIMARY KEY,
          user_id INTEGER,
          module VARCHAR(50) NOT NULL DEFAULT 'system',
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          action_url VARCHAR(255),
          is_read BOOLEAN DEFAULT FALSE,
          read_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_user_notif_user ON "${tenantId}".user_notifications(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_notif_read ON "${tenantId}".user_notifications(is_read);
        CREATE INDEX IF NOT EXISTS idx_user_notif_module ON "${tenantId}".user_notifications(module);
      `);

      // 3. Create tenant_notification_settings table in tenant schema
      await client.query(`
        CREATE TABLE IF NOT EXISTS "${tenantId}".tenant_notification_settings (
          id SERIAL PRIMARY KEY,
          enable_web_push BOOLEAN DEFAULT TRUE,
          enable_in_app_sound BOOLEAN DEFAULT TRUE,
          enable_email_alerts BOOLEAN DEFAULT TRUE,
          event_rules JSONB DEFAULT '{
            "leave_request": {"in_app": true, "email": true, "push": true},
            "leave_approval": {"in_app": true, "email": true, "push": true},
            "task_assigned": {"in_app": true, "email": true, "push": true},
            "payroll_published": {"in_app": true, "email": true, "push": true},
            "attendance_regularization": {"in_app": true, "email": true, "push": true},
            "expense_claim": {"in_app": true, "email": true, "push": true},
            "chat_message": {"in_app": true, "email": false, "push": true},
            "system_announcement": {"in_app": true, "email": true, "push": true}
          }'::jsonb,
          vapid_public_key TEXT,
          vapid_private_key TEXT,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        INSERT INTO "${tenantId}".tenant_notification_settings (id, enable_web_push, enable_in_app_sound, enable_email_alerts)
        VALUES (1, true, true, true)
        ON CONFLICT (id) DO NOTHING;
      `);
    }

    console.log('✅ Notifications Migration completed successfully for all tenants.');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  migrateNotifications()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = migrateNotifications;
