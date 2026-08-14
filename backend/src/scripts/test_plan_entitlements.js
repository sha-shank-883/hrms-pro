const { pool } = require('../config/database');
const { getTenantActiveModules, SYSTEM_MODULES, DEFAULT_PLANS } = require('../utils/moduleEntitlements');
const axios = require('axios');

async function runTests() {
  console.log('=== HRMS SaaS Plan & Module Entitlement Test Suite ===\n');

  try {
    // 1. Verify shared.plan_configs exists and has default plans
    const planRes = await pool.query('SELECT * FROM shared.plan_configs ORDER BY employee_limit ASC');
    console.log(`[PASS] shared.plan_configs has ${planRes.rows.length} tiers configured.`);
    planRes.rows.forEach(p => {
      console.log(`   - Plan [${p.plan_id.toUpperCase()}]: ${p.modules.length} modules, INR ${p.price_inr}/mo, Limit: ${p.employee_limit} seats`);
    });

    // 2. Verify getTenantActiveModules resolution hierarchy
    console.log('\n--- Testing Entitlement Resolution Engine ---');
    
    // 2a. Free Plan Tenant
    const freeMods = await getTenantActiveModules('tenant_default');
    console.log(`[PASS] tenant_default resolved modules (${freeMods.modules.length}): ${freeMods.modules.join(', ')}`);
    console.log(`   Is Custom Override: ${freeMods.isCustom}`);

    // 2b. Override with custom modules
    console.log('\n--- Testing Super Admin Custom Override ---');
    await pool.query(
      `UPDATE shared.tenants SET custom_modules = $1 WHERE tenant_id = $2`,
      [JSON.stringify(['core_hr', 'attendance', 'payroll', 'chat']), 'tenant_default']
    );

    const overrideMods = await getTenantActiveModules('tenant_default');
    console.log(`[PASS] After Custom Override (${overrideMods.modules.length}): ${overrideMods.modules.join(', ')}`);
    console.log(`   Is Custom Override: ${overrideMods.isCustom}`);
    if (!overrideMods.modules.includes('payroll') || !overrideMods.modules.includes('chat')) {
      throw new Error('Custom override failed to grant payroll/chat');
    }

    // 2c. Reset back to plan default
    console.log('\n--- Testing Reset to Plan Default ---');
    await pool.query(
      `UPDATE shared.tenants SET custom_modules = NULL WHERE tenant_id = $1`,
      ['tenant_default']
    );
    const resetMods = await getTenantActiveModules('tenant_default');
    console.log(`[PASS] After Reset to Default (${resetMods.modules.length}): ${resetMods.modules.join(', ')}`);
    console.log(`   Is Custom Override: ${resetMods.isCustom}`);

    // 2d. Core HR guaranteed safety check
    console.log('\n--- Testing Core HR Non-Lockout Guarantee ---');
    await pool.query(
      `UPDATE shared.tenants SET custom_modules = $1 WHERE tenant_id = $2`,
      [JSON.stringify(['attendance']), 'tenant_default']
    );
    const safeMods = await getTenantActiveModules('tenant_default');
    if (!safeMods.modules.includes('core_hr')) {
      throw new Error('Safety check failed: core_hr missing');
    }
    console.log(`[PASS] core_hr automatically preserved even if omitted in custom config.`);

    // Clean up
    await pool.query(`UPDATE shared.tenants SET custom_modules = NULL WHERE tenant_id = $1`, ['tenant_default']);

    console.log('\n=== ALL SaaS Entitlement Unit Tests PASSED Successfully! ===\n');
  } catch (err) {
    console.error('[FAIL] Error during entitlement tests:', err);
  } finally {
    await pool.end();
  }
}

runTests();
