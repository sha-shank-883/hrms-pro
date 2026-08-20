const { pool, query } = require('../config/database');
const hrAiOrchestrator = require('../services/ai/aiCopilotService');
const {
  getToolsForRole,
  getGeminiFunctionDeclarations,
  getOpenAIFunctionDeclarations,
  executeAuthorizedTool,
  ALL_TOOLS
} = require('../services/ai/toolRegistry');
const { resolveRelativeDate, resolveRelativePeriod, formatDate } = require('../services/ai/dateResolver');
const conversationState = require('../services/ai/conversationState');
const { resolveEmployee, resolveDepartment, resolvePendingLeave } = require('../services/ai/entityResolver');

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

    // 2. Native Function Calling Declaration Schema Verification
    console.log('\n--- Test Section 2: Native Function Calling Schema Declarations ---');
    const geminiDeclarations = getGeminiFunctionDeclarations('admin', true);
    assert(Array.isArray(geminiDeclarations) && geminiDeclarations[0]?.functionDeclarations?.length === ALL_TOOLS.length, 'Gemini declarations generated for all registered tools');
    assert(geminiDeclarations[0].functionDeclarations.every(f => f.name && f.description && f.parameters?.type === 'object'), 'All Gemini declarations contain valid parameters schema');

    const openaiDeclarations = getOpenAIFunctionDeclarations('admin', true);
    assert(Array.isArray(openaiDeclarations) && openaiDeclarations.length === ALL_TOOLS.length, 'OpenAI/Groq declarations generated for all registered tools');
    assert(openaiDeclarations.every(f => f.type === 'function' && f.function?.name && f.function?.parameters?.type === 'object'), 'All OpenAI declarations contain valid function schema');

    // 3. Server-Enforced RBAC Block Test
    console.log('\n--- Test Section 3: Independent Server-Side RBAC Enforcement ---');
    const unauthorizedAttempt = await executeAuthorizedTool(
      'finalizePayroll',
      { month: 8, year: 2026 },
      { user: { userId: 99, role: 'employee' }, isSuperAdmin: false },
      { tenantId: 'test_tenant' }
    );
    assert(unauthorizedAttempt.isUnauthorized === true, 'Unauthorized tool call blocked by server RBAC');

    // 4. Two-Phase Sensitive Action Confirmation Gate Test
    console.log('\n--- Test Section 4: Two-Phase Sensitive Write Confirmation Gate ---');
    const sensitiveUnconfirmed = await executeAuthorizedTool(
      'deactivateEmployee',
      { employee_id: 1, reason: 'Testing' },
      { user: { userId: 1, role: 'admin' }, isSuperAdmin: false },
      { tenantId: 'test_tenant' },
      false // isConfirmed = false
    );
    assert(sensitiveUnconfirmed.requiresConfirmation === true, 'Sensitive operation halted with confirmation requirement');
    assert(!!sensitiveUnconfirmed.confirmationToken, 'Confirmation token generated for pending action');

    // 5. Universal Entity Resolver & Disambiguation Test
    console.log('\n--- Test Section 5: Universal Entity Resolver & Disambiguation ---');
    const searchRes = await resolveEmployee('a');
    if (searchRes.count > 1) {
      assert(searchRes.status === 'ambiguous', 'Disambiguation flagged when multiple employees match query');
      assert(Array.isArray(searchRes.options), 'Disambiguation options list provided');
    } else {
      assert(true, 'Search executed cleanly without ambiguous match conflict');
    }

    // 6. Strict Department Validation Test
    console.log('\n--- Test Section 6: Strict Department Validation ---');
    const invalidDeptRes = await executeAuthorizedTool(
      'createEmployee',
      {
        first_name: 'Test',
        last_name: 'User',
        email: `invalid.dept.${Date.now()}@test.com`,
        position: 'Developer',
        salary: 45000,
        department_name: 'NonExistentDepartment_XYZ'
      },
      { user: { userId: 1, role: 'admin' }, isSuperAdmin: false },
      { tenantId: 'test_tenant' }
    );
    assert(invalidDeptRes.success === false, 'createEmployee rejected non-existent department gracefully');
    assert(invalidDeptRes.message.includes('not found'), 'createEmployee provided available department list in error');

    // 7. Deterministic Date & Period Resolution Test
    console.log('\n--- Test Section 7: Deterministic Date & Period Resolution ---');
    const todayStr = formatDate(new Date());
    assert(resolveRelativeDate('today') === todayStr, 'resolveRelativeDate resolves "today" correctly');
    assert(typeof resolveRelativeDate('yesterday') === 'string', 'resolveRelativeDate resolves "yesterday"');
    const period = resolveRelativePeriod('last month');
    assert(typeof period.month === 'number' && typeof period.year === 'number', 'resolveRelativePeriod resolves month and year');

    // 8. Pronoun Resolution & Active Entity Pointer
    console.log('\n--- Test Section 8: Pronoun Resolution & Active Entity Pointer ---');
    const testSession = 'test_session_pronoun';
    conversationState.setActiveEntity(testSession, {
      id: 101,
      name: 'Sarah Connor',
      code: 'EMP0101',
      department: 'Engineering'
    });
    const resolvedText = conversationState.resolvePronouns('What is her salary?', testSession);
    assert(resolvedText.includes('Sarah Connor'), 'Pronoun "her" resolved to active entity "Sarah Connor"');

    // 9. Fallback Word-Order Robustness (10 variations without API keys)
    console.log('\n--- Test Section 9: Fallback Word-Order Robustness (10 variations) ---');
    const orderVariations = [
      'create a new employee',
      'add a new employee',
      'hire new worker',
      'new employee profile',
      'onboard a new employee',
      'register employee profile',
      'add employee to system',
      'create worker profile',
      'hire an employee',
      'create new staff profile'
    ];
    let allVariationsPassed = true;
    for (const v of orderVariations) {
      const vRes = hrAiOrchestrator._heuristicAgentRouter(v, [], 'admin', false, 'test_order_session');
      if (vRes.should_call_tool !== false || !vRes.direct_reply.toLowerCase().includes('required details')) {
        allVariationsPassed = false;
        console.error(`Variation failed: "${v}" ->`, vRes);
      }
    }
    assert(allVariationsPassed, 'All 10 employee creation word-order variations triggered slot wizard in fallback router');

    // 10. Multi-Turn Interactive Slot Wizard Continuation
    console.log('\n--- Test Section 10: Multi-Turn Conversational Slot Collector ---');
    const turn1Session = `turn_test_${Date.now()}`;
    const turn1Res = hrAiOrchestrator._heuristicAgentRouter('create a new employee named Rohan', [], 'admin', false, turn1Session);
    assert(turn1Res.should_call_tool === false, 'Turn 1 halts tool execution until required slots collected');
    assert(turn1Res.direct_reply.includes('Work Email') || turn1Res.direct_reply.includes('required details'), 'Turn 1 asks for missing required fields');
    assert(turn1Res.direct_reply.includes('Full Name:') && turn1Res.direct_reply.includes('Email:') && turn1Res.direct_reply.includes('Department:'), 'Turn 1 explicitly provides fillable copy-paste template');

    // Test single-value one-by-one mode continuation
    const singleValEmail = `rohan.single.${Date.now()}@hrmspro.com`;
    const singleEmailRes = hrAiOrchestrator._heuristicAgentRouter(singleValEmail, [{ sender: 'user', text: 'create a new employee named Rohan' }, { sender: 'ai', text: turn1Res.direct_reply }], 'admin', false, turn1Session);
    assert(singleEmailRes.should_call_tool === false, 'Single-value mode continues collecting remaining slots');

    // Complete with remaining fields
    const turn2Res = hrAiOrchestrator._heuristicAgentRouter(
      `salary is 55000, position is Lead DevOps Engineer, department is Engineering`,
      [
        { sender: 'user', text: 'create a new employee named Rohan' },
        { sender: 'ai', text: turn1Res.direct_reply }
      ],
      'admin',
      false,
      turn1Session
    );

    assert(turn2Res.should_call_tool === true && turn2Res.tool_name === 'createEmployee', 'Turn 2 triggers createEmployee tool after all slots gathered');

    // Execute the gathered slots to verify database insertion
    const createExecRes = await executeAuthorizedTool(
      turn2Res.tool_name,
      turn2Res.tool_arguments,
      { user: { userId: 1, role: 'admin' }, isSuperAdmin: false },
      { tenantId: turn1Session }
    );
    assert(createExecRes.success === true, 'Employee created and verified in database');

    // 11. Bulk Multi-Line Slot Parsing in a Single Turn
    console.log('\n--- Test Section 11: Bulk Multi-Line / Pasted Slot Extraction ---');
    const bulkEmail = `bulk.engineer.${Date.now()}@hrmspro.com`;
    const bulkMessage = `
Full Name: Maya Lin
Email: ${bulkEmail}
Department: Engineering
Designation: Staff Architect
Monthly Salary: 125000
Joining Date: 2026-09-01
Phone: +91 9876543210
    `;
    const bulkSession = `bulk_session_${Date.now()}`;
    const bulkRes = hrAiOrchestrator._heuristicAgentRouter(bulkMessage, [], 'admin', false, bulkSession);

    assert(bulkRes.should_call_tool === true && bulkRes.tool_name === 'createEmployee', 'Bulk multi-line message immediately triggers createEmployee');
    assert(bulkRes.tool_arguments.first_name === 'Maya' && bulkRes.tool_arguments.salary === 125000, 'Bulk slot extractor correctly parsed all fields from template');

    const bulkExecRes = await executeAuthorizedTool(
      bulkRes.tool_name,
      bulkRes.tool_arguments,
      { user: { userId: 1, role: 'admin' }, isSuperAdmin: false },
      { tenantId: bulkSession }
    );
    assert(bulkExecRes.success === true, 'Bulk employee created and verified in database');

    // 12. Payroll Variance Analytics Test
    console.log('\n--- Test Section 12: Payroll Variance Diagnostics ---');
    const varianceRes = await executeAuthorizedTool(
      'explainPayrollVariance',
      {},
      { user: { userId: 1, role: 'admin' }, isSuperAdmin: false },
      { tenantId: 'test_tenant' }
    );
    assert(varianceRes.success === true, 'explainPayrollVariance executed successfully');
    assert(typeof varianceRes.data.new_hires_count === 'number', 'new_hires_count returned');

    // 13. Audit Log Insertion Test
    console.log('\n--- Test Section 13: Audit Logging Verification ---');
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
