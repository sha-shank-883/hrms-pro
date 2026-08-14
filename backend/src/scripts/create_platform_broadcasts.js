const { pool } = require('../config/database');

async function migrate() {
  try {
    console.log('🔄 Creating shared.platform_broadcasts table...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shared.platform_broadcasts (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'info', -- 'info', 'warning', 'critical', 'maintenance'
        target_tier VARCHAR(50) DEFAULT 'all', -- 'all', 'free', 'hatch', 'scale', 'enterprise'
        is_active BOOLEAN DEFAULT true,
        starts_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP WITH TIME ZONE,
        dismissible BOOLEAN DEFAULT true,
        created_by VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_broadcasts_active_tier ON shared.platform_broadcasts (is_active, target_tier);
    `);

    console.log('✅ Created shared.platform_broadcasts successfully');
  } catch (err) {
    console.error('❌ Error migrating broadcasts table:', err);
  } finally {
    process.exit(0);
  }
}

migrate();
