const { generateWithFallback, getActiveProvider } = require('./providerFactory');
const { sanitizeInput } = require('./aiSanitizer');
const { COPILOT_TOOL_DEFINITIONS, executeCopilotTool } = require('./aiCopilotTools');

/**
 * AI Copilot Orchestration Service
 * Executes user prompts, selects tools, enforces RBAC, and returns interactive responses.
 */
class AICopilotService {
  /**
   * Process a chat prompt from any user (Super Admin, HR, Manager, Employee)
   */
  async processUserMessage({ message, conversationHistory = [], userContext, tenantContext }) {
    const { user, isSuperAdmin } = userContext;
    const role = user?.role || 'employee';
    const userName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.email || 'User';

    // 1. Sanitize user input
    const sanitizedQuery = sanitizeInput(message);

    // 2. Build system instructions with deep database architecture and validation requirements
    const systemPrompt = `You are HRMS Pro AI Copilot, an enterprise HRMS database engineer and operational assistant.
You are assisting ${userName} whose role is "${role.toUpperCase()}" ${isSuperAdmin ? '(GLOBAL SUPER ADMIN)' : ''}.

DATABASE ARCHITECTURE & MANDATORY SCHEMA SPECIFICATIONS:
1. EMPLOYEES MODULE:
   - Primary Identifier: employee_id (SERIAL), employee_code (VARCHAR, formatted as 'EMP' + LPAD(employee_id, 4, '0'))
   - Core Profile: first_name (Mandatory NOT NULL), last_name, email (Mandatory NOT NULL & UNIQUE), phone, position/designation (e.g. 'Senior AI Engineer')
   - HR & Hierarchy: department_id (FOREIGN KEY to departments), reporting_manager_id (FOREIGN KEY to employees)
   - Employment & Dates: joining_date / hire_date (DATE, defaults to CURRENT_DATE if not provided), employment_type ('Full-time', 'Part-time', 'Contract', 'Intern'), status ('active', 'inactive', 'on_leave', 'resigned', 'terminated')
   - Payroll & Statutory: salary (DECIMAL(15,2) monthly base), pan (10-character PAN), bank_account, bank_name, ifsc_code, uan (12-digit PF), esic (17-digit insurance)
   - Data Integrity: When creating an employee, always capture first_name, email, position, department, and salary. Automatically assign employee_code and set joining_date.

2. ATTENDANCE & SHIFTS MODULE:
   - Schema: attendance_id (SERIAL), employee_id (NOT NULL), date (DATE NOT NULL), status ('present', 'absent', 'half-day'), clock_in (TIME), clock_out (TIME), total_hours (DECIMAL)

3. LEAVES & HOLIDAYS MODULE:
   - Schema: leave_id (SERIAL), employee_id (NOT NULL), leave_type ('annual', 'sick', 'casual', 'maternity', 'paternity', 'unpaid'), start_date (DATE), end_date (DATE), reason (TEXT), status ('pending', 'approved', 'rejected')

4. PAYROLL & COMPENSATION MODULE:
   - Calculations: gross_earnings = base_salary + bonus; deductions = PF (12% of basic) + ESIC (0.75% if basic <= 21000) + unpaid_leave_deductions (unpaid_days * (salary/30)) + TDS; net_pay = gross_earnings - deductions.

5. TASKS & WORKFLOWS MODULE:
   - Schema: task_id (SERIAL), title (Mandatory NOT NULL), description, priority ('low', 'medium', 'high', 'urgent'), status ('todo', 'in_progress', 'completed', 'cancelled'), due_date (DATE), created_by (user_id), task_assignments (task_id, employee_id)

6. PERFORMANCE & OKRs MODULE:
   - Schema: goals (goal_id, employee_id, title, description, category, priority, progress [0-100], due_date, status), key_results (kr_id, goal_id, title, target_value, current_value)

7. RECRUITMENT & HIRING MODULE:
   - Schema: job_postings (job_id, title, department_id, experience_required, salary_range, location, requirements, status), job_applications (application_id, job_id, applicant_name, email, status)

8. HARDWARE ASSETS MODULE:
   - Schema: assets (asset_id, name, type, serial_number, cost, vendor, status ['Available', 'Assigned', 'Maintenance'], assigned_to [employee_id])

9. HELPDESK & SUPPORT MODULE:
   - Schema: support_tickets (ticket_id, ticket_number, user_id, subject, description, category, priority, status ['open', 'in_progress', 'resolved', 'closed'], resolution_notes)

10. SAAS MULTI-TENANCY & GLOBAL PLATFORM:
    - Global Platform Schema: shared.tenants, shared.payment_logs, shared.plan_configs ('hatch', 'scale', 'enterprise')
    - Tenant Schema Isolation: Every tenant company operates in isolated schema (e.g. "tenant_default" or "<tenant_id>").

ROLE PERMISSION BOUNDARIES:
- Super Admin: Cross-tenant SaaS metrics, subscriptions, platform logs.
- Admin / HR: Full CRUD across employees, payroll, attendance, jobs, assets, and departments.
- Manager: Team attendance, department tasks, and leave approval.
- Employee: Self-service (Clock-in/out, Apply leaves, View self-payslip, View own goals). Block requests for other employees' financial/statutory data.

AI EXECUTION GUIDELINES:
- When the user provides partial information for a creation action (e.g., just name and salary), synthesize sensible enterprise defaults (e.g. joining_date = today, employment_type = 'Full-time') and clearly mention the configured fields in the response.
- Always provide structured, elegant markdown responses with key metric highlights, emojis, and clear next steps.`;

    // 3. Check if tools should be triggered
    // We provide tool descriptions in prompt format for resilient multi-provider tool resolution
    const toolPrompt = `
User Query: "${sanitizedQuery}"

Analyze if this query requires executing one of the following tools:
${JSON.stringify(COPILOT_TOOL_DEFINITIONS.map(t => ({ name: t.name, description: t.description })), null, 2)}

Respond with a JSON object:
{
  "should_call_tool": boolean,
  "tool_name": string (or null),
  "tool_arguments": object (or {}),
  "direct_reply": string (use if no tool is required or for general advice)
}
Return ONLY valid JSON.`;

    let toolDecision = { should_call_tool: false, direct_reply: "I am your HRMS Pro AI Copilot. How can I assist you with employees, payroll, attendance, or leaves today?" };

    try {
      const fullDecisionPrompt = `${systemPrompt}\n\n${toolPrompt}`;
      const aiResponse = await generateWithFallback(fullDecisionPrompt);
      const rawAiDecision = aiResponse?.response || aiResponse?.text || '';

      const parsed = this._parseJSON(rawAiDecision);
      if (parsed && parsed.tool_name) {
        toolDecision = parsed;
      } else {
        // Use heuristic tool picker if LLM response didn't produce structured JSON
        toolDecision = this._heuristicToolPicker(sanitizedQuery);
      }
    } catch (e) {
      console.warn('[AI Copilot] Provider tool selection notice:', e.message);
      // Fallback: heuristic pattern matching
      toolDecision = this._heuristicToolPicker(sanitizedQuery);
    }

    let toolResult = null;
    let actionCards = [];

    // 5. Execute Tool if Selected
    if (toolDecision.should_call_tool && toolDecision.tool_name) {
      try {
        toolResult = await executeCopilotTool(
          toolDecision.tool_name,
          toolDecision.tool_arguments || {},
          userContext,
          tenantContext
        );

        if (toolResult?.action_card) {
          actionCards.push(toolResult.action_card);
        }
      } catch (err) {
        console.error(`[AI Copilot Tool Error] ${toolDecision.tool_name}:`, err.message);
        toolResult = { success: false, message: `Tool execution encountered an error: ${err.message}` };
      }
    }

    // 6. Generate Final Conversational Answer with Tool Evidence
    let finalAnswer = '';
    if (toolResult) {
      const synthesisPrompt = `
${systemPrompt}

User asked: "${sanitizedQuery}"
Tool executed: "${toolDecision.tool_name}"
Tool output data: ${JSON.stringify(toolResult, null, 2)}

Generate a friendly, concise, professional response summarizing the answer directly to the user.
Highlight key figures (salary, hours, counts, status) in bold. Mention available actions.`;

      try {
        const synthRes = await generateWithFallback(synthesisPrompt);
        finalAnswer = synthRes?.response || synthRes?.text || toolResult.message || `Here is the requested information for **${sanitizedQuery}**.`;
      } catch (_) {
        finalAnswer = toolResult.message || `Here is the requested information for **${sanitizedQuery}**.`;
      }
    } else {
      finalAnswer = toolDecision.direct_reply || "I am here to assist with HR analytics, attendance, payroll calculation, and employee records.";
    }

    return {
      reply: finalAnswer,
      tool_executed: toolDecision.tool_name || null,
      tool_result: toolResult,
      action_cards: actionCards,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get Contextual Quick Suggestion Pills Based on User Role
   */
  getQuickSuggestions(role = 'employee', isSuperAdmin = false) {
    if (isSuperAdmin || role === 'super_admin') {
      return [
        { label: '📊 Platform MRR & Revenue', prompt: 'What is our total platform revenue and tenant breakdown?' },
        { label: '🏢 Active Scale VIP Tenants', prompt: 'Show active tenants on Scale VIP subscription tier' },
        { label: '⚙️ System Health & Audit', prompt: 'Show system health and recent audit summary' }
      ];
    }

    if (role === 'admin' || role === 'hr') {
      return [
        { label: '💰 Check Employee Salary', prompt: 'What is Aman\'s salary, joining date, and position?' },
        { label: '⏱️ Today\'s Attendance', prompt: 'Who is absent or late today?' },
        { label: '🧮 Calculate Take-Home Pay', prompt: 'Calculate Aman\'s take-home pay with 10% bonus and 2 unpaid leave days' },
        { label: '📢 Post New Job Opening', prompt: 'Post a new job opening for Senior Frontend Engineer, Remote, $90k-$120k' },
        { label: '💻 Available Assets', prompt: 'List all available laptops in company assets' }
      ];
    }

    if (role === 'manager') {
      return [
        { label: '👥 Team Attendance Today', prompt: 'Show attendance for my department today' },
        { label: '🏖️ Pending Team Leaves', prompt: 'Are there any pending leave requests in my team?' },
        { label: '📝 My Leave Balance', prompt: 'How many casual and sick leave days do I have left?' }
      ];
    }

    // Default Employee suggestions
    return [
      { label: '🏖️ My Leave Balance', prompt: 'What is my current leave balance?' },
      { label: '📅 My Attendance This Month', prompt: 'Show my clock-in and attendance history for this month' },
      { label: '💵 My Salary & Payslip Info', prompt: 'What is my current salary and position?' },
      { label: '💻 My Assigned Assets', prompt: 'Which assets or devices are assigned to me?' }
    ];
  }

  _parseJSON(text) {
    if (!text) return null;
    try {
      const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const cleaned = match ? match[1].trim() : text.trim();
      return JSON.parse(cleaned);
    } catch (_) {
      try {
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        if (start !== -1 && end !== -1) {
          return JSON.parse(text.substring(start, end + 1));
        }
      } catch (__) {}
      return null;
    }
  }

  _heuristicToolPicker(query) {
    const q = query.toLowerCase();

    // 1. Employees CRUD
    if ((q.includes('create employee') || q.includes('add employee') || q.includes('hire employee') || q.includes('new employee'))) {
      const words = query.split(/\s+/);
      const name = words[words.findIndex(w => ['employee', 'add', 'create'].includes(w.toLowerCase())) + 1] || 'New';
      return { should_call_tool: true, tool_name: 'create_employee', tool_arguments: { first_name: name, email: `${name.toLowerCase()}@example.com` } };
    }

    if (q.includes('update employee') || (q.includes('update') && (q.includes('salary') || q.includes('position')))) {
      return { should_call_tool: true, tool_name: 'update_employee', tool_arguments: { employee_name: 'Aman' } };
    }

    if (q.includes('deactivate employee') || q.includes('terminate employee') || q.includes('remove employee')) {
      return { should_call_tool: true, tool_name: 'deactivate_employee', tool_arguments: { employee_name: 'Aman' } };
    }

    if (q.includes('salary') || q.includes('pan') || q.includes('who is') || q.includes('find employee') || q.includes('profile')) {
      const words = query.split(/\s+/);
      const name = words.find(w => w.length > 2 && !['what', 'is', 'the', 'salary', 'for', 'current', 'employee', 'named', 'details', 'check'].includes(w.toLowerCase())) || 'Aman';
      return { should_call_tool: true, tool_name: 'lookup_employee', tool_arguments: { search_query: name } };
    }

    // 2. Attendance
    if (q.includes('mark') && (q.includes('attendance') || q.includes('present') || q.includes('absent') || q.includes('clock'))) {
      return { should_call_tool: true, tool_name: 'mark_attendance', tool_arguments: { employee_name: 'Aman', status: 'present', clock_in: '09:30 AM' } };
    }

    if (q.includes('absent') || q.includes('attendance') || q.includes('late') || q.includes('clock-in')) {
      return { should_call_tool: true, tool_name: 'query_attendance', tool_arguments: { date: 'today' } };
    }

    // 3. Leaves
    if (q.includes('approve leave') || q.includes('reject leave')) {
      return { should_call_tool: true, tool_name: 'approve_or_reject_leave', tool_arguments: { decision: q.includes('approve') ? 'approved' : 'rejected' } };
    }

    if (q.includes('leave') || q.includes('vacation') || q.includes('holiday')) {
      return { should_call_tool: true, tool_name: 'manage_leave', tool_arguments: { action: q.includes('apply') ? 'apply_leave' : 'check_balance' } };
    }

    // 4. Payroll
    if (q.includes('payroll run') || (q.includes('generate') && q.includes('payroll'))) {
      return { should_call_tool: true, tool_name: 'generate_payroll_run', tool_arguments: { month: new Date().getMonth() + 1, year: new Date().getFullYear() } };
    }

    if (q.includes('calculate') && (q.includes('pay') || q.includes('net') || q.includes('bonus') || q.includes('deduct'))) {
      return { should_call_tool: true, tool_name: 'calculate_payroll', tool_arguments: { employee_name: 'Aman', bonus_amount: 5000 } };
    }

    // 5. Departments
    if (q.includes('create department') || q.includes('add department')) {
      return { should_call_tool: true, tool_name: 'create_department', tool_arguments: { department_name: 'Product Development' } };
    }

    if (q.includes('department') || q.includes('headcount')) {
      return { should_call_tool: true, tool_name: 'list_departments', tool_arguments: {} };
    }

    // 6. Tasks
    if (q.includes('create task') || q.includes('assign task') || q.includes('new task')) {
      return { should_call_tool: true, tool_name: 'create_task', tool_arguments: { title: 'New Task Assignment', priority: 'medium' } };
    }

    if (q.includes('delete task') || q.includes('remove task')) {
      return { should_call_tool: true, tool_name: 'delete_task', tool_arguments: { task_title: 'Task' } };
    }

    if (q.includes('update task') || (q.includes('mark task') && q.includes('complete'))) {
      return { should_call_tool: true, tool_name: 'update_task', tool_arguments: { status: 'completed' } };
    }

    // 7. Goals
    if (q.includes('create goal') || q.includes('new goal') || q.includes('add goal')) {
      return { should_call_tool: true, tool_name: 'create_goal', tool_arguments: { title: 'Quarterly Objective', priority: 'high' } };
    }

    if (q.includes('update goal') || q.includes('goal progress')) {
      return { should_call_tool: true, tool_name: 'update_goal_progress', tool_arguments: { progress: 80 } };
    }

    // 8. Recruitment
    if (q.includes('job') || q.includes('opening') || q.includes('post') || q.includes('hiring')) {
      return { should_call_tool: true, tool_name: 'create_job_opening', tool_arguments: { title: 'Software Engineer', location: 'Remote' } };
    }

    // 9. Assets
    if (q.includes('create asset') || q.includes('add asset') || q.includes('add laptop')) {
      return { should_call_tool: true, tool_name: 'create_asset', tool_arguments: { name: 'Dell XPS 15', serial_number: `DL-${Date.now().toString().slice(-4)}` } };
    }

    if (q.includes('assign asset') || q.includes('return asset')) {
      return { should_call_tool: true, tool_name: 'assign_asset', tool_arguments: { asset_name_or_serial: 'Laptop', action: q.includes('return') ? 'return' : 'assign' } };
    }

    if (q.includes('asset') || q.includes('laptop') || q.includes('device') || q.includes('monitor')) {
      return { should_call_tool: true, tool_name: 'query_assets', tool_arguments: {} };
    }

    // 10. Helpdesk Tickets
    if (q.includes('ticket') || q.includes('support issue') || q.includes('open ticket')) {
      return { should_call_tool: true, tool_name: 'create_support_ticket', tool_arguments: { subject: 'Support Assistance Required', category: 'IT Support' } };
    }

    // 11. Super Admin
    if (q.includes('revenue') || q.includes('tenant') || q.includes('mrr') || q.includes('platform')) {
      return { should_call_tool: true, tool_name: 'superadmin_platform_metrics', tool_arguments: { metric_type: 'overview' } };
    }

    return { should_call_tool: false, direct_reply: "I am your HRMS Pro AI Copilot. You can ask me to create employees, calculate payroll, mark attendance, post job openings, create tasks, assign assets, or manage leave requests directly!" };
  }
}

module.exports = new AICopilotService();
