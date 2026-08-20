const hrAiOrchestrator = require('../services/ai/aiCopilotService');

async function testIntentPhrasings() {
  console.log('================================================================');
  console.log('🧪 TESTING KEYWORD-PRESENCE INTENT ROUTING PHRASING VARIATIONS');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assertRouter(query, expectedToolOrIntent, testName) {
    const res = hrAiOrchestrator._heuristicAgentRouter(query, [], 'admin', false, 'test_session');
    let matched = false;

    if (expectedToolOrIntent === 'createEmployeeWizard') {
      matched = res.should_call_tool === false && (res.direct_reply.toLowerCase().includes('required details') || res.direct_reply.toLowerCase().includes('missing'));
    } else if (expectedToolOrIntent === 'createEmployeeTool') {
      matched = res.should_call_tool === true && res.tool_name === 'createEmployee';
    } else {
      matched = res.should_call_tool === true && res.tool_name === expectedToolOrIntent;
    }

    if (matched) {
      console.log(`✅ [PASS] "${query}" -> ${expectedToolOrIntent}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] "${query}" -> Expected: ${expectedToolOrIntent}, Got: tool=${res.tool_name}, should_call=${res.should_call_tool}, reply=${(res.direct_reply || '').substring(0, 40)}...`);
      failed++;
    }
  }

  // 1. Employee Creation Phrasings (15+ variations)
  console.log('--- 1. Employee Creation Phrasings ---');
  const creationQueries = [
    'create a new employee',
    'add a new employee',
    'hire a new employee',
    'onboard a new employee',
    'register a new staff member',
    'new employee profile',
    'create employee named Rahul',
    'hire new worker for engineering',
    'add staff profile',
    'onboard candidate into team',
    'create worker profile',
    'add employee to system',
    'hire someone new for the company',
    'register employee profile',
    'create a new staff person'
  ];
  creationQueries.forEach(q => assertRouter(q, 'createEmployeeWizard', q));

  // 2. Employee Search Phrasings (15+ variations)
  console.log('\n--- 2. Employee Search Phrasings ---');
  const searchQueries = [
    'search employees in Engineering',
    'find employee John',
    'lookup staff member Sarah',
    'who is Rahul Sharma',
    'show employee list',
    'list all employees',
    'get directory of staff',
    'search for employee named Alex',
    'find workers in sales',
    'show people in product team',
    'directory of all employees',
    'look up colleague profile',
    'filter employees by department',
    'who is in the marketing team',
    'show team profiles'
  ];
  searchQueries.forEach(q => assertRouter(q, 'searchEmployees', q));

  // 3. Leave Balance Phrasings (15+ variations)
  console.log('\n--- 3. Leave Balance Phrasings ---');
  const leaveBalanceQueries = [
    'what is my leave balance',
    'how many leaves do I have left',
    'show remaining PTO',
    'check my vacation balance',
    'leave quota remaining',
    'how many casual leaves left',
    'my time off balance',
    'check leave balance for Sarah',
    'how many vacation days available',
    'remaining holiday balance',
    'check annual leave status',
    'what leaves are left for me',
    'my remaining leave days',
    'check employee leave quota',
    'view my paid time off'
  ];
  leaveBalanceQueries.forEach(q => assertRouter(q, 'getLeaveBalance', q));

  // 4. Attendance Summary Phrasings (15+ variations)
  console.log('\n--- 4. Attendance Summary Phrasings ---');
  const attendanceQueries = [
    'show today attendance summary',
    'who is present today',
    'attendance records for this month',
    'company attendance report',
    'check absent employees today',
    'show punctuality report',
    'daily attendance check',
    'how many staff are present today',
    'attendance statistics for today',
    'who is absent from work today',
    'show clock in summary',
    'monthly attendance overview',
    'attendance status of the team',
    'show today punches overview',
    'view attendance records'
  ];
  attendanceQueries.forEach(q => assertRouter(q, 'getAttendanceSummary', q));

  // 5. Missing Punches Phrasings (8+ variations)
  console.log('\n--- 5. Missing Punches Phrasings ---');
  const missingPunchQueries = [
    'show missing punches',
    'find unpunched attendance records',
    'who forgot to clock out',
    'missing clockout punches',
    'unclocked attendance records',
    'list missing punch entries',
    'employees with missing punch',
    'show unpunched clock records'
  ];
  missingPunchQueries.forEach(q => assertRouter(q, 'getMissingPunches', q));

  // 6. Payroll & Salaries Phrasings (15+ variations)
  console.log('\n--- 6. Payroll & Salaries Phrasings ---');
  const payrollQueries = [
    'finalize payroll for August 2026',
    'run payroll for this month',
    'process monthly payroll',
    'close payroll for 8/2026',
    'disburse payroll run',
    'execute payroll for current month',
    'what is my salary breakdown',
    'show my payslip details',
    'what is my net salary and PF',
    'compensation info for Rahul',
    'payroll cost analysis',
    'show payroll expenses and budget',
    'why did payroll increase this month',
    'explain payroll variance',
    'monthly payroll cost summary'
  ];
  payrollQueries.forEach(q => {
    if (q.includes('finalize') || q.includes('run payroll') || q.includes('process monthly payroll') || q.includes('close payroll') || q.includes('disburse') || q.includes('execute payroll')) {
      assertRouter(q, 'finalizePayroll', q);
    } else if (q.includes('variance') || q.includes('increase')) {
      assertRouter(q, 'explainPayrollVariance', q);
    } else if (q.includes('cost') || q.includes('expense')) {
      assertRouter(q, 'getPayrollCostAnalysis', q);
    } else {
      assertRouter(q, 'getSalary', q);
    }
  });

  // 7. Company Policies & Holidays Phrasings (10+ variations)
  console.log('\n--- 7. Company Policies & Holidays ---');
  const companyQueries = [
    'what is the company leave policy',
    'attendance rules and working hours',
    'probation guidelines and policy',
    'company handbook rules',
    'show official holiday calendar',
    'upcoming company holidays this year',
    'festival days off calendar',
    'list all company departments',
    'org structure and departments',
    'show company headcount overview'
  ];
  companyQueries.forEach(q => {
    if (q.includes('holiday') || q.includes('festival')) {
      assertRouter(q, 'getHolidays', q);
    } else if (q.includes('department') || q.includes('org structure')) {
      assertRouter(q, 'getDepartments', q);
    } else if (q.includes('headcount')) {
      assertRouter(q, 'getHeadcount', q);
    } else {
      assertRouter(q, 'getPolicies', q);
    }
  });

  console.log('\n================================================================');
  console.log(`📊 INTENT PHRASING TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

testIntentPhrasings().catch(err => {
  console.error('Test script error:', err);
  process.exit(1);
});
