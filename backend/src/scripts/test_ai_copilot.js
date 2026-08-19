const { executeCopilotTool } = require('../services/ai/aiCopilotTools');
const aiCopilotService = require('../services/ai/aiCopilotService');
const { pool, query } = require('../config/database');

async function runCopilotTests() {
  console.log('====================================================');
  console.log('🤖 STARTING ENTERPRISE AI COPILOT SUITE VERIFICATION');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  try {
    // 1. Ensure a test employee exists in database
    await query(`
      INSERT INTO employees (first_name, last_name, email, phone, position, salary, status, hire_date)
      VALUES ('Aman', 'Sharma', 'aman.sharma@example.com', '9876543210', 'Senior Fullstack Engineer', 85000, 'active', '2024-01-15')
      ON CONFLICT (email) DO UPDATE SET salary = 85000, status = 'active'
    `);

    // ----------------------------------------------------
    // TEST 1: HR/Admin Employee Lookup (Full Financials)
    // ----------------------------------------------------
    console.log('[TEST 1] HR/Admin Looking up Employee "Aman"...');
    const hrContext = {
      user: { role: 'admin', userId: 1, email: 'admin@hrmspro.online' },
      tenantId: 'default',
      isSuperAdmin: false
    };

    const hrLookup = await executeCopilotTool('lookup_employee', { search_query: 'Aman' }, hrContext, {});
    if (hrLookup.success && hrLookup.data[0].salary.includes('₹85,000')) {
      console.log('✅ PASS: Admin successfully fetched Aman\'s salary (₹85,000) & profile link:', hrLookup.data[0].link);
      passed++;
    } else {
      console.error('❌ FAIL: Admin employee lookup failed:', hrLookup);
      failed++;
    }

    // ----------------------------------------------------
    // TEST 2: Employee Role Permission Boundary (RBAC)
    // ----------------------------------------------------
    console.log('\n[TEST 2] Regular Employee looking up Aman\'s salary (Must be Restricted)...');
    const empContext = {
      user: { role: 'employee', userId: 999, email: 'other.employee@example.com' },
      tenantId: 'default',
      isSuperAdmin: false
    };

    const empLookup = await executeCopilotTool('lookup_employee', { search_query: 'Aman' }, empContext, {});
    if (empLookup.success && empLookup.data[0].salary.includes('RESTRICTED')) {
      console.log('✅ PASS: Regular employee was correctly restricted from seeing Aman\'s salary:', empLookup.data[0].salary);
      passed++;
    } else {
      console.error('❌ FAIL: RBAC boundary breached or failed:', empLookup);
      failed++;
    }

    // ----------------------------------------------------
    // TEST 3: Payroll Calculation with Mathematical Deductions
    // ----------------------------------------------------
    console.log('\n[TEST 3] Admin Calculating Payroll for Aman (Base ₹85k + ₹10k Bonus - 2 Days Unpaid)...');
    const calcResult = await executeCopilotTool('calculate_payroll', {
      employee_name: 'Aman',
      bonus_amount: 10000,
      unpaid_leave_days: 2,
      tax_rate_percent: 10
    }, hrContext, {});

    if (calcResult.success && calcResult.calculation.estimated_net_take_home) {
      console.log('✅ PASS: Payroll breakdown calculated accurately:');
      console.log('   - Base Salary:', calcResult.calculation.base_monthly_salary);
      console.log('   - Bonus Added:', calcResult.calculation.bonus_added);
      console.log('   - Unpaid Deductions:', calcResult.calculation.unpaid_leave_deductions);
      console.log('   - Provident Fund (12%):', calcResult.calculation.provident_fund_pf);
      console.log('   - Estimated Net Take-Home:', calcResult.calculation.estimated_net_take_home);
      passed++;
    } else {
      console.error('❌ FAIL: Payroll calculation failed:', calcResult);
      failed++;
    }

    // ----------------------------------------------------
    // TEST 4: Mark Attendance Direct Tool Execution
    // ----------------------------------------------------
    console.log('\n[TEST 4] Admin Marking Attendance for Aman as Present (09:30 AM)...');
    const attResult = await executeCopilotTool('mark_attendance', {
      employee_name: 'Aman',
      status: 'present',
      clock_in: '09:30:00'
    }, hrContext, {});

    if (attResult.success) {
      console.log('✅ PASS: Attendance marked successfully:', attResult.message);
      passed++;
    } else {
      console.error('❌ FAIL: Attendance marking failed:', attResult);
      failed++;
    }

    // ----------------------------------------------------
    // TEST 5: Super Admin Platform Metrics Query
    // ----------------------------------------------------
    console.log('\n[TEST 5] Super Admin Querying Global Platform Metrics...');
    const superAdminContext = {
      user: { role: 'super_admin', userId: 1, email: 'info@hrmspro.online', isSuperAdmin: true },
      tenantId: 'global',
      isSuperAdmin: true
    };

    const saResult = await executeCopilotTool('superadmin_platform_metrics', { metric_type: 'overview' }, superAdminContext, {});
    if (saResult.success && saResult.action_card) {
      console.log('✅ PASS: Super Admin metrics query executed:');
      console.log('   - Active Tenants:', saResult.active_tenants);
      console.log('   - Platform Revenue:', saResult.total_platform_revenue);
      passed++;
    } else {
      console.error('❌ FAIL: Super admin metrics query failed:', saResult);
      failed++;
    }

    // ----------------------------------------------------
    // TEST 6: Contextual Suggestions per Role
    // ----------------------------------------------------
    console.log('\n[TEST 6] Testing Role Suggestions Engine...');
    const saSuggestions = aiCopilotService.getQuickSuggestions('super_admin', true);
    const hrSuggestions = aiCopilotService.getQuickSuggestions('admin', false);
    const empSuggestions = aiCopilotService.getQuickSuggestions('employee', false);

    if (saSuggestions.length > 0 && hrSuggestions.length > 0 && empSuggestions.length > 0) {
      console.log(`✅ PASS: Generated ${saSuggestions.length} Super Admin, ${hrSuggestions.length} HR, and ${empSuggestions.length} Employee suggestions.`);
      passed++;
    } else {
      console.error('❌ FAIL: Role suggestions generation failed');
      failed++;
    }

    console.log('\n====================================================');
    console.log(`🎉 VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('💥 UNCAUGHT ERROR IN TEST SUITE:', err);
    process.exit(1);
  }
}

runCopilotTests();
