const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { pool } = require('../config/database');

const checkProductionReady = async () => {
  const client = await pool.connect();
  try {
    console.log('🔍 Running Production Readiness Check...');
    let scores = { success: 0, total: 0 };

    const runCheck = async (name, query, expected = true) => {
      scores.total++;
      try {
        const res = await client.query(query);
        const passed = expected === true ? res.rows.length > 0 : res.rows[0].count > 0;
        if (passed) {
          console.log(`✅ [PASS] ${name}`);
          scores.success++;
          return true;
        } else {
          console.warn(`⚠️ [FAIL] ${name}`);
          return false;
        }
      } catch (e) {
        console.error(`❌ [ERROR] ${name}: ${e.message}`);
        return false;
      }
    };

    // 1. Check Tables in tenant_default
    await runCheck('Shifts Table Exists', "SELECT table_name FROM information_schema.tables WHERE table_schema = 'tenant_default' AND table_name = 'shifts'");
    await runCheck('Employee Shifts Table Exists', "SELECT table_name FROM information_schema.tables WHERE table_schema = 'tenant_default' AND table_name = 'employee_shifts'");

    // 2. Check Columns in tenant_default.attendance
    await runCheck('Geofencing Lat Column', "SELECT column_name FROM information_schema.columns WHERE table_schema = 'tenant_default' AND table_name = 'attendance' AND column_name = 'check_in_latitude'");
    await runCheck('Geofencing Lon Column', "SELECT column_name FROM information_schema.columns WHERE table_schema = 'tenant_default' AND table_name = 'attendance' AND column_name = 'check_in_longitude'");

    // 3. Check Settings Initialization (Grace Period as proxy)
    await runCheck('Grace Period Setting Exists', "SELECT setting_key FROM tenant_default.settings WHERE setting_key = 'grace_period'");

    // 4. Verify start script in package.json (manual-ish check via log)
    console.log('ℹ️ Manual Check: Verify package.json "start" script includes "add_shift_tables.js"');

    console.log(`\n📊 Final Score: ${scores.success}/${scores.total} checks passed.`);
    
    if (scores.success === scores.total) {
      console.log('🚀 SYSTEM IS PRODUCTION READY!');
      process.exit(0);
    } else {
      console.error('⛔ SYSTEM IS NOT FULLY READY. Check the warnings above.');
      process.exit(1);
    }
  } catch (error) {
    console.error('💥 Critical check failure:', error);
    process.exit(1);
  } finally {
    client.release();
  }
};

checkProductionReady();
