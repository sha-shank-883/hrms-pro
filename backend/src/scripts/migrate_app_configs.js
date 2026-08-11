const { pool } = require('../config/database');

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('Creating shared.app_configs table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS shared.app_configs (
        id SERIAL PRIMARY KEY,
        config_key TEXT UNIQUE NOT NULL,
        config_value JSONB NOT NULL,
        category TEXT,
        is_public BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Seed some initial mobile configs
    console.log('Seeding initial app configs...');
    const initialConfigs = [
      {
        key: 'mobile_branding',
        value: {
          primaryColor: '#6366f1',
          accentColor: '#4f46e5',
          logoUrl: null,
          appName: 'HRMS PRO'
        },
        category: 'branding',
        is_public: true
      },
      {
        key: 'mobile_features',
        value: {
          enableChat: true,
          enableBiometrics: true,
          enableFaceId: false,
          enableGeofencing: true
        },
        category: 'features',
        is_public: false
      },
      {
        key: 'mobile_maintenance',
        value: {
          isUnderMaintenance: false,
          minAppVersion: '1.0.0',
          message: 'System upgrade in progress.'
        },
        category: 'system',
        is_public: true
      }
    ];

    for (const config of initialConfigs) {
      await client.query(
        `INSERT INTO shared.app_configs (config_key, config_value, category, is_public)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (config_key) DO UPDATE 
         SET config_value = $2, category = $3, is_public = $4, updated_at = CURRENT_TIMESTAMP`,
        [config.key, config.value, config.category, config.is_public]
      );
    }

    await client.query('COMMIT');
    console.log('Migration completed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
  } finally {
    client.release();
    process.exit(0);
  }
}

migrate();
