const { pool } = require('../config/database');

async function updatePlans() {
  try {
    await pool.query(`
      UPDATE shared.plan_configs SET name = 'Starter' WHERE plan_id = 'hatch' OR name ILIKE '%hatch%';
      UPDATE shared.plan_configs SET name = 'Professional' WHERE plan_id = 'scale' OR name ILIKE '%scale%';
      UPDATE shared.plan_configs SET name = 'Enterprise' WHERE plan_id = 'enterprise' OR name ILIKE '%enterprise%';
    `);
    const plans = await pool.query('SELECT plan_id, name, employee_limit, price_inr, price_usd FROM shared.plan_configs ORDER BY employee_limit ASC');
    console.log('✅ Updated Plan Names in Database:');
    console.table(plans.rows);
  } catch (e) {
    console.error('Error updating plans:', e.message);
  } finally {
    process.exit(0);
  }
}

updatePlans();
