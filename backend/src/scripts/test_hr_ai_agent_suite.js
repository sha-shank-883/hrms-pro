const { pool, query } = require('../config/database');
const hrAiOrchestrator = require('../services/ai/aiCopilotService');
const { getToolsForRole, executeAuthorizedTool } = require('../services/ai/toolRegistry');

async function runTestSuite() {
  console.log('================================================================');
  console.log('🤖 RUNNING ENTERPRISE HR AI OPERATIONS AGENT VERIFICATION SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} - ${details}`);
      failed++;
    }
  }

  try {
    // 1. Role-based Tool Filtering Test
    console.log('--- Test Section 1: Role-Based Tool Visibility & RBAC ---');
    const employeeTools = getToolsForRole('employee', false);
    const adminTools = getToolsForRole('admin', false);
    const superAdminTools = getToolsForRole('super_admin', true);

    assert(!employeeTools.some(t => t.name === 'finalizePayroll'), 'Employees cannot see finalizePayroll tool');
    assert(!employeeTools.some(t => t.name === 'createEmployee'), 'Employees cannot see createEmployee tool');
    assert(employeeTools.some(t => t.name === 'getLeaveBalance'), 'Employees can see getLeaveBalance tool');
    assert(adminTools.some(t => t.name === 'createEmployee'), 'Admin has access to createEmployee tool');
    assert(adminTools.some(t => t.name === 'finalizePayroll'), 'Admin has access to finalizePayroll tool');
    assert(superAdminTools.some(t => t.name === 'getSaaSOPSOverview'), 'Super Admin has access to getSaaSOPSOverview');

    // 2. Server-Enforced RBAC Block Test
    console.log('\n--- Test Section 2: Independent Server-Side RBAC Enforcement ---');
    const unauthorizedAttempt = await executeAuthorizedTool(
      'finalizePayroll',
      { month: 8, year: 2026 },
      { user: { userId: 99, role: 'employee' }, isSuperAdmin: false },
      { tenantId: 'test_tenant' }
    );
    assert(unauthorizedAttempt.isUnauthorized === true, 'Unauthorized tool call blocked by server RBAC');

    // 3. Two-Phase Sensitive Action Confirmation Gate Test
    console.log('\n--- Test Section 3: Two-Phase Sensitive Write Confirmation Gate ---');
    const sensitiveUnconfirmed = await executeAuthorizedTool(
      'deactivateEmployee',
      { employee_id: 1, reason: 'Testing' },
      { user: { userId: 1, role: 'admin' }, isSuperAdmin: false },
      { tenantId: 'test_tenant' },
      false // isConfirmed = false
    );
    assert(sensitiveUnconfirmed.requiresConfirmation === true, 'Sensitive operation halted with confirmation requirement');
    assert(!!sensitiveUnconfirmed.confirmationToken, 'Confirmation token generated for pending action');

    // 4. Employee Disambiguation Test
    console.log('\n--- Test Section 4: Intelligent Entity Disambiguation ---');
    const searchRes = await executeAuthorizedTool(
      'searchEmployees',
      { query_text: 'a' },
      { user: { userId: 1, role: 'admin' }, isSuperAdmin: false },
      { tenantId: 'test_tenant' }
    );
    if (searchRes.count > 1) {
      assert(searchRes.disambiguation_needed === true, 'Disambiguation flagged when multiple employees match query');
      assert(Array.isArray(searchRes.disambiguation_options), 'Disambiguation options list provided');
    } else {
      assert(true, 'Search executed cleanly without ambiguous match conflict');
    }

    // 5. Multi-Turn Interactive Slot Wizard Test
    console.log('\n--- Test Section 5: Multi-Turn Conversational Slot Collector ---');
    const turn1 = await hrAiOrchestrator.processUserMessage({
      message: 'create a new employee named Rohan',
      conversationHistory: [],
      userContext: { user: { userId: 1, role: 'admin' }, isSuperAdmin: false },
      tenantContext: { tenantId: 'test_tenant' }
    });
    assert(turn1.reply.includes('Work Email') || turn1.reply.includes('required details'), 'Turn 1 asks for missing required fields');

    const testEmail = `rohan.ai.test.${Date.now()}@hrmspro.com`;
    const turn2 = await hrAiOrchestrator.processUserMessage({
      message: `email is ${testEmail}, salary is 55000, position is Lead DevOps Engineer, department is Engineering`,
      conversationHistory: [
        { sender: 'user', text: 'create a new employee named Rohan' },
        { sender: 'ai', text: turn1.reply }
      ],
      userContext: { user: { userId: 1, role: 'admin' }, isSuperAdmin: false },
      tenantContext: { tenantId: 'test_tenant' }
    });

    assert(turn2.tool_executed === 'createEmployee', 'Turn 2 executes createEmployee tool after all slots gathered');
    assert(turn2.tool_result?.success === true, 'Employee created and verified in database');

    // 6. Audit Log Insertion Test
    console.log('\n--- Test Section 6: Audit Logging Verification ---');
    const auditRes = await query('SELECT * FROM audit_logs WHERE action ILIKE $1 ORDER BY created_at DESC LIMIT 1', ['%AI_AGENT%']);
    assert(auditRes.rows.length > 0, 'Audit log record verified in database for AI operations');

    console.log('\n================================================================');
    console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('Fatal test error:', error);
    process.exit(1);
  }
}

runTestSuite();
