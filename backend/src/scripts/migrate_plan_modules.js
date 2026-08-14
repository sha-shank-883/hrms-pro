const { pool } = require('../config/database');

async function migratePlanModules() {
    console.log('🔄 Starting SaaS Plan Modules & Dynamic Entitlements Migration...');

    try {
        await pool.query(`CREATE SCHEMA IF NOT EXISTS shared`);

        // 1. Create shared.plan_configs table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS shared.plan_configs (
                plan_id VARCHAR(50) PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                price_inr NUMERIC(10,2) DEFAULT 0,
                price_usd NUMERIC(10,2) DEFAULT 0,
                employee_limit INTEGER DEFAULT 15,
                modules JSONB NOT NULL DEFAULT '[]',
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Created or verified shared.plan_configs table.');

        // 2. Add custom_modules and employee_limit to shared.tenants if not exists
        await pool.query(`
            ALTER TABLE shared.tenants 
            ADD COLUMN IF NOT EXISTS custom_modules JSONB DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS employee_limit INTEGER DEFAULT 15;
        `);
        console.log('✅ Added custom_modules and employee_limit columns to shared.tenants.');

        // 3. Seed default plan configurations if not present
        const defaultPlans = [
            {
                plan_id: 'free',
                name: 'Free Tier',
                description: 'Essential core HR, attendance, leaves, tasks and documents for small teams.',
                price_inr: 0,
                price_usd: 0,
                employee_limit: 10,
                modules: [
                    'core_hr',
                    'attendance',
                    'leaves',
                    'tasks',
                    'documents'
                ]
            },
            {
                plan_id: 'hatch',
                name: 'Hatch (Starter)',
                description: 'For growing businesses needing Performance reviews and standard analytics.',
                price_inr: 299,
                price_usd: 4,
                employee_limit: 25,
                modules: [
                    'core_hr',
                    'attendance',
                    'leaves',
                    'tasks',
                    'documents',
                    'performance',
                    'reports_analytics'
                ]
            },
            {
                plan_id: 'scale',
                name: 'Scale (Pro)',
                description: 'Comprehensive suite including Payroll, Asset Management, and Team Chat.',
                price_inr: 799,
                price_usd: 10,
                employee_limit: 100,
                modules: [
                    'core_hr',
                    'attendance',
                    'leaves',
                    'tasks',
                    'documents',
                    'performance',
                    'payroll',
                    'assets',
                    'chat',
                    'reports_analytics'
                ]
            },
            {
                plan_id: 'enterprise',
                name: 'Enterprise',
                description: 'All modules unlocked with Biometrics hardware sync, ATS recruitment, and Audit Logs.',
                price_inr: 1499,
                price_usd: 20,
                employee_limit: 1000,
                modules: [
                    'core_hr',
                    'attendance',
                    'leaves',
                    'tasks',
                    'documents',
                    'performance',
                    'payroll',
                    'recruitment',
                    'assets',
                    'chat',
                    'biometrics',
                    'live_activity',
                    'reports_analytics',
                    'audit_logs'
                ]
            }
        ];

        for (const plan of defaultPlans) {
            await pool.query(`
                INSERT INTO shared.plan_configs (plan_id, name, description, price_inr, price_usd, employee_limit, modules)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (plan_id) DO UPDATE 
                SET name = EXCLUDED.name,
                    description = EXCLUDED.description,
                    employee_limit = EXCLUDED.employee_limit,
                    updated_at = CURRENT_TIMESTAMP
                WHERE shared.plan_configs.modules IS NULL OR jsonb_array_length(shared.plan_configs.modules) = 0;
            `, [plan.plan_id, plan.name, plan.description, plan.price_inr, plan.price_usd, plan.employee_limit, JSON.stringify(plan.modules)]);
        }

        // Check if rows already had modules or if we need to ensure they have modules
        for (const plan of defaultPlans) {
            const check = await pool.query('SELECT modules FROM shared.plan_configs WHERE plan_id = $1', [plan.plan_id]);
            if (!check.rows[0] || !check.rows[0].modules || check.rows[0].modules.length === 0) {
                await pool.query('UPDATE shared.plan_configs SET modules = $1 WHERE plan_id = $2', [JSON.stringify(plan.modules), plan.plan_id]);
            }
        }

        console.log('✅ Default plan tiers and module entitlements verified.');
        console.log('🎉 Plan Modules migration finished successfully!\n');

    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        throw err;
    } finally {
        await pool.end();
    }
}

migratePlanModules();
