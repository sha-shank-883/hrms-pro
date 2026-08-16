require('dotenv').config();
const { pool } = require('../config/database');

async function migrateSuperAdminNotificationColumns() {
  console.log('=== Adding Super Admin notification tracking columns ===');
  await pool.query(`
    ALTER TABLE shared.super_admins 
    ADD COLUMN IF NOT EXISTS last_notifications_read_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS read_notification_ids JSONB DEFAULT '[]'::jsonb;
  `);
  console.log('✅ Columns added to shared.super_admins successfully');
  process.exit(0);
}

migrateSuperAdminNotificationColumns().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
