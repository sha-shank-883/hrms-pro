const { pool } = require('../config/database');

async function migrate() {
  try {
    console.log('🔄 Creating shared.tenant_backup_archives table...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shared.tenant_backup_archives (
        id SERIAL PRIMARY KEY,
        tenant_id VARCHAR(100) NOT NULL,
        tenant_name VARCHAR(255),
        filename VARCHAR(255) NOT NULL,
        file_size_bytes BIGINT DEFAULT 0,
        table_count INT DEFAULT 0,
        record_count INT DEFAULT 0,
        backup_type VARCHAR(50) DEFAULT 'manual', -- 'manual', 'scheduled', 'system'
        snapshot_data JSONB,
        created_by VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_backup_archives_tenant ON shared.tenant_backup_archives (tenant_id);
      CREATE INDEX IF NOT EXISTS idx_backup_archives_created ON shared.tenant_backup_archives (created_at DESC);
    `);

    console.log('✅ Created shared.tenant_backup_archives successfully');
  } catch (err) {
    console.error('❌ Error migrating backup archives table:', err);
  } finally {
    process.exit(0);
  }
}

migrate();
