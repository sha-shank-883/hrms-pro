const { executeCopilotTool } = require('../services/ai/aiCopilotTools');
const aiCopilotService = require('../services/ai/aiCopilotService');
const { pool, query } = require('../config/database');

async function testFullCrudSuite() {
  console.log('====================================================');
  console.log('🤖 STARTING FULL-MODULE AI CRUD COPILOT TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  const hrContext = {
    user: { role: 'admin', userId: 1, email: 'admin@hrmspro.online' },
    tenantId: 'default',
    isSuperAdmin: false
  };

  const employeeContext = {
    user: { role: 'employee', userId: 999, email: 'employee@hrmspro.online' },
    tenantId: 'default',
    isSuperAdmin: false
  };

  const superAdminContext = {
    user: { role: 'super_admin', userId: 1, email: 'info@hrmspro.online', isSuperAdmin: true },
    tenantId: 'global',
    isSuperAdmin: true
  };

  try {
    // ----------------------------------------------------
    // TEST 1: Employees CRUD (Create -> Lookup -> Update -> Deactivate)
    // ----------------------------------------------------
    console.log('[TEST 1] Employee Module Full CRUD...');
    const createEmp = await executeCopilotTool('create_employee', {
      first_name: 'TestDev',
      last_name: 'Automation',
      email: `test.dev.${Date.now()}@example.com`,
      phone: '9988776655',
      position: 'Senior AI Engineer',
      salary: 95000
    }, hrContext, {});

    if (createEmp.success && createEmp.data?.employee_id) {
      console.log('  ✅ 1a. Created Employee:', createEmp.data.first_name, createEmp.data.employee_code);
      passed++;
    } else {
      console.error('  ❌ 1a. Create employee failed:', createEmp);
      failed++;
    }

    const updateEmp = await executeCopilotTool('update_employee', {
      employee_name: 'TestDev',
      salary: 105000,
      position: 'Principal AI Architect'
    }, hrContext, {});

    if (updateEmp.success) {
      console.log('  ✅ 1b. Updated Employee:', updateEmp.message);
      passed++;
    } else {
      console.error('  ❌ 1b. Update employee failed:', updateEmp);
      failed++;
    }

    const deactEmp = await executeCopilotTool('deactivate_employee', {
      employee_name: 'TestDev',
      reason: 'Contract Complete'
    }, hrContext, {});

    if (deactEmp.success) {
      console.log('  ✅ 1c. Deactivated Employee:', deactEmp.message);
      passed++;
    } else {
      console.error('  ❌ 1c. Deactivate employee failed:', deactEmp);
      failed++;
    }

    // ----------------------------------------------------
    // TEST 2: Tasks Module CRUD (Create -> Update -> Delete)
    // ----------------------------------------------------
    console.log('\n[TEST 2] Tasks Module Full CRUD...');
    const createTask = await executeCopilotTool('create_task', {
      title: 'Automated CI/CD Verification Task',
      description: 'Run deployment tests',
      priority: 'urgent',
      due_date: '2026-09-01'
    }, hrContext, {});

    if (createTask.success) {
      console.log('  ✅ 2a. Task Created:', createTask.message);
      passed++;
    } else {
      console.error('  ❌ 2a. Create task failed:', createTask);
      failed++;
    }

    const updateTask = await executeCopilotTool('update_task', {
      task_title: 'Automated CI/CD',
      status: 'completed',
      progress: 100
    }, hrContext, {});

    if (updateTask.success) {
      console.log('  ✅ 2b. Task Updated:', updateTask.message);
      passed++;
    } else {
      console.error('  ❌ 2b. Update task failed:', updateTask);
      failed++;
    }

    const deleteTask = await executeCopilotTool('delete_task', {
      task_title: 'Automated CI/CD'
    }, hrContext, {});

    if (deleteTask.success) {
      console.log('  ✅ 2c. Task Deleted:', deleteTask.message);
      passed++;
    } else {
      console.error('  ❌ 2c. Delete task failed:', deleteTask);
      failed++;
    }

    // ----------------------------------------------------
    // TEST 3: Goals & Performance Module CRUD
    // ----------------------------------------------------
    console.log('\n[TEST 3] Performance & Goals Module CRUD...');
    const createGoal = await executeCopilotTool('create_goal', {
      title: 'Automate 100% Core API Workflows',
      priority: 'high',
      due_date: '2026-12-31'
    }, hrContext, {});

    if (createGoal.success) {
      console.log('  ✅ 3a. Goal Created:', createGoal.message);
      passed++;
    } else {
      console.error('  ❌ 3a. Create goal failed:', createGoal);
      failed++;
    }

    const updateGoal = await executeCopilotTool('update_goal_progress', {
      goal_title: 'Automate 100%',
      progress: 90,
      status: 'in_progress'
    }, hrContext, {});

    if (updateGoal.success) {
      console.log('  ✅ 3b. Goal Progress Updated:', updateGoal.message);
      passed++;
    } else {
      console.error('  ❌ 3b. Update goal failed:', updateGoal);
      failed++;
    }

    // ----------------------------------------------------
    // TEST 4: Assets & Hardware Management CRUD
    // ----------------------------------------------------
    console.log('\n[TEST 4] Assets Module CRUD...');
    const createAsset = await executeCopilotTool('create_asset', {
      name: 'MacBook Pro M3 Max 36GB',
      asset_type: 'Laptop',
      serial_number: `MBP-${Date.now().toString().slice(-6)}`,
      cost: 249999,
      vendor: 'Apple Authorized'
    }, hrContext, {});

    if (createAsset.success) {
      console.log('  ✅ 4a. Asset Created:', createAsset.message);
      passed++;
    } else {
      console.error('  ❌ 4a. Create asset failed:', createAsset);
      failed++;
    }

    const assignAsset = await executeCopilotTool('assign_asset', {
      asset_name_or_serial: 'MacBook Pro M3',
      employee_name: 'Aman',
      action: 'assign'
    }, hrContext, {});

    if (assignAsset.success) {
      console.log('  ✅ 4b. Asset Assigned:', assignAsset.message);
      passed++;
    } else {
      console.error('  ❌ 4b. Assign asset failed:', assignAsset);
      failed++;
    }

    // ----------------------------------------------------
    // TEST 5: Helpdesk Support Ticket CRUD
    // ----------------------------------------------------
    console.log('\n[TEST 5] Helpdesk Support Module CRUD...');
    const createTicket = await executeCopilotTool('create_support_ticket', {
      subject: 'VPN Configuration Assistance',
      description: 'Need configuration file for remote development',
      category: 'IT Support',
      priority: 'high'
    }, employeeContext, {});

    if (createTicket.success) {
      console.log('  ✅ 5a. Support Ticket Created:', createTicket.message);
      passed++;
    } else {
      console.error('  ❌ 5a. Create ticket failed:', createTicket);
      failed++;
    }

    // ----------------------------------------------------
    // TEST 6: Super Admin Platform Operations
    // ----------------------------------------------------
    console.log('\n[TEST 6] Super Admin Platform Ops...');
    const saTenant = await executeCopilotTool('superadmin_create_tenant', {
      tenant_id: `test_corp_${Date.now().toString().slice(-4)}`,
      name: 'Test Enterprise Corp',
      subscription_plan: 'scale'
    }, superAdminContext, {});

    if (saTenant.success) {
      console.log('  ✅ 6a. Tenant Created:', saTenant.message);
      passed++;
    } else {
      console.error('  ❌ 6a. Create tenant failed:', saTenant);
      failed++;
    }

    // ----------------------------------------------------
    // TEST 7: RBAC Boundary Check on Employee Role
    // ----------------------------------------------------
    console.log('\n[TEST 7] RBAC Boundary Restrictions (Employee trying to create employee)...');
    const blockedOp = await executeCopilotTool('create_employee', {
      first_name: 'Hacker',
      email: 'hacker@example.com'
    }, employeeContext, {});

    if (blockedOp.success === false && blockedOp.message.includes('Permission Denied')) {
      console.log('  ✅ 7. RBAC Blocked unauthorized employee mutation as expected:', blockedOp.message);
      passed++;
    } else {
      console.error('  ❌ 7. Security violation: non-admin was not blocked:', blockedOp);
      failed++;
    }

    console.log('\n====================================================');
    console.log(`🎉 FULL CRUD VERIFICATION RESULT: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('💥 Test suite crashed:', err);
    process.exit(1);
  }
}

testFullCrudSuite();
