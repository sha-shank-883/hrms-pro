const { pool } = require('../config/database');

async function migrateAIIntelligenceModule() {
  console.log('--- Migrating AI HR Intelligence Suite Module ---');
  try {
    // 1. Update shared.plan_configs to include 'ai_assistant' in scale and enterprise plans
    const plansRes = await pool.query('SELECT plan_id, modules FROM shared.plan_configs');
    for (const plan of plansRes.rows) {
      let modules = Array.isArray(plan.modules) ? [...plan.modules] : [];
      const planId = (plan.plan_id || '').toLowerCase();

      if (['scale', 'enterprise', 'professional'].includes(planId)) {
        if (!modules.includes('ai_assistant')) {
          modules.push('ai_assistant');
          await pool.query(
            'UPDATE shared.plan_configs SET modules = $1, updated_at = CURRENT_TIMESTAMP WHERE plan_id = $2',
            [JSON.stringify(modules), plan.plan_id]
          );
          console.log(`[Plan Config] Added 'ai_assistant' to plan: ${plan.plan_id}`);
        }
      }
    }

    // 2. Ensure each existing tenant schema has the ai_screening_evaluations table
    const existingSchemasRes = await pool.query(
      "SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast', 'shared', 'public')"
    );
    const existingSchemas = new Set(existingSchemasRes.rows.map(r => r.schema_name));

    const tenantsRes = await pool.query('SELECT tenant_id FROM shared.tenants');
    for (const t of tenantsRes.rows) {
      const tId = t.tenant_id;
      if (!tId || !existingSchemas.has(tId)) continue;

      await pool.query(`
        CREATE TABLE IF NOT EXISTS "${tId}".ai_screening_evaluations (
          id SERIAL PRIMARY KEY,
          job_id INTEGER,
          application_id INTEGER,
          candidate_name VARCHAR(255),
          match_score INTEGER,
          fit_verdict VARCHAR(50),
          strengths JSONB DEFAULT '[]'::jsonb,
          gaps JSONB DEFAULT '[]'::jsonb,
          interview_questions JSONB DEFAULT '[]'::jsonb,
          summary_notes TEXT,
          raw_evaluation JSONB DEFAULT '{}'::jsonb,
          created_by INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS "${tId}".ai_action_logs (
          id SERIAL PRIMARY KEY,
          user_id INTEGER,
          feature_type VARCHAR(100) NOT NULL,
          prompt_summary TEXT,
          model_used VARCHAR(100),
          tokens_estimated INTEGER DEFAULT 0,
          latency_ms INTEGER DEFAULT 0,
          status VARCHAR(50) DEFAULT 'success',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }

    console.log('[Migration] AI Intelligence Suite migration completed successfully.');
  } catch (error) {
    console.error('[Migration Error] Failed to migrate AI Intelligence module:', error.message);
    throw error;
  }
}

if (require.main === module) {
  migrateAIIntelligenceModule()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { migrateAIIntelligenceModule };
