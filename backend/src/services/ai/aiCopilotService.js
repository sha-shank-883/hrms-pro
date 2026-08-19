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

    // 1. Sanitize user input & format conversation history
    const sanitizedQuery = sanitizeInput(message);
    const historySnippet = (conversationHistory || [])
      .slice(-8)
      .map(m => `${m.sender === 'user' ? 'User' : 'Copilot'}: ${m.text}`)
      .join('\n');

    // 2. Build system instructions with deep database architecture and validation requirements
    const systemPrompt = `You are HRMS Pro AI Copilot, an enterprise HRMS database engineer and operational assistant.
You are assisting ${userName} whose role is "${role.toUpperCase()}" ${isSuperAdmin ? '(GLOBAL SUPER ADMIN)' : ''}.

CONVERSATIONAL HISTORY (RECENT CHAT TURNS):
${historySnippet || '(No prior conversation in this session)'}

DATABASE ARCHITECTURE & STRICT MODULE VALIDATION RULES:
1. EMPLOYEES MODULE:
   - Primary Identifier: employee_id (SERIAL), employee_code (VARCHAR, formatted as 'EMP' + LPAD(employee_id, 4, '0'))
   - Core Profile (Frontend & Backend Validations):
     * first_name: VARCHAR(100) NOT NULL [Mandatory]
     * last_name: VARCHAR(100) [Optional]
     * email: VARCHAR(255) NOT NULL & UNIQUE in users and employees [Mandatory]
     * position: VARCHAR(100) (e.g. 'Senior AI Engineer', 'PHP Developer') [Mandatory for organization]
     * department_id: INTEGER FK to departments [Mandatory for organization]
     * salary: DECIMAL(15,2) monthly base salary [Mandatory for payroll calculations]
     * employment_type: ENUM ('full-time', 'part-time', 'contract', 'intern', defaults to 'full-time')
     * status: ENUM ('active', 'inactive', 'on_leave', 'resigned', 'terminated', defaults to 'active')
     * joining_date / hire_date: DATE (YYYY-MM-DD, defaults to CURRENT_DATE if unspecified)
   - Indian Statutory & Banking Compliance:
     * pan: VARCHAR(10) (Permanent Account Number format: 5 letters, 4 numbers, 1 letter, e.g. ABCDE1234F)
     * bank_account: VARCHAR(100) & bank_name: VARCHAR(100) & ifsc_code: VARCHAR(11) (e.g. HDFC0001234)
     * uan: VARCHAR(50) (12-digit PF Universal Account Number) & esic: VARCHAR(50) (17-digit ESIC code)
     * reporting_manager_id: INTEGER FK to employees

2. ATTENDANCE & SHIFTS MODULE:
   - Schema: attendance_id (SERIAL), employee_id (NOT NULL), date (DATE NOT NULL, defaults to today), status ('present', 'absent', 'half-day'), clock_in (TIME), clock_out (TIME), total_hours (DECIMAL)

3. LEAVES & HOLIDAYS MODULE:
   - Mandatory Fields: employee_id (NOT NULL), leave_type ('annual', 'sick', 'casual', 'maternity', 'paternity', 'unpaid'), start_date (DATE), end_date (DATE), reason (TEXT)
   - Automated Calculation: days_count = Math.ceil((end_date - start_date) / (1000*60*60*24)) + 1
   - Status Workflow: 'pending' -> 'approved' | 'rejected'

4. PAYROLL & COMPENSATION MODULE:
   - Mandatory Fields: employee_id (NOT NULL), month (1-12), year (e.g. 2026), basic_salary (DECIMAL)
   - Calculation Formulas:
     * gross_earnings = base_salary + bonus + allowances (HRA, Special)
     * pf_deduction = 12% of basic_salary
     * esic_deduction = 0.75% of basic_salary (only applicable if basic_salary <= ₹21,000)
     * unpaid_leave_deduction = unpaid_days * (base_salary / 30)
     * tds_tax = taxable_salary * tax_rate
     * net_pay = gross_earnings - (pf_deduction + esic_deduction + unpaid_leave_deduction + tds_tax)

5. DEPARTMENTS MODULE:
   - Mandatory: department_name (VARCHAR(255) NOT NULL, UNIQUE case-insensitive)
   - Optional: description (TEXT), manager_id (FK to employees), budget (NUMERIC), location (VARCHAR)

6. TASKS & WORKFLOWS MODULE:
   - Mandatory: title (VARCHAR(255) NOT NULL), created_by (user_id NOT NULL)
   - Optional: description (TEXT), priority ('low', 'medium', 'high', 'urgent', defaults to 'medium'), status ('todo', 'in_progress', 'completed', 'cancelled', defaults to 'todo'), due_date (DATE), task_assignments (task_id, employee_id)

7. PERFORMANCE & OKRs MODULE:
   - Mandatory: employee_id (NOT NULL), title (VARCHAR(200) NOT NULL)
   - Optional: description (TEXT), category ('General', 'Technical', 'Sales', defaults to 'General'), priority ('low', 'medium', 'high'), progress (0-100), due_date (DATE), key_results array

8. RECRUITMENT & HIRING MODULE:
   - Job Postings: title (NOT NULL), department_id, experience_required ('2+ years'), salary_range ('₹8L - ₹12L'), location ('Remote', 'On-site'), requirements, responsibilities, status ('open', 'closed')
   - Job Applications: job_id (NOT NULL), applicant_name (NOT NULL), email (NOT NULL), phone, resume_url, status ('applied', 'screening', 'interview', 'offered', 'hired', 'rejected')

9. HARDWARE ASSETS MODULE:
   - Mandatory: name (VARCHAR(255) NOT NULL), type (ENUM 'Laptop', 'Monitor', 'Mobile', 'Peripheral', 'Furniture' NOT NULL)
   - Optional: serial_number (VARCHAR UNIQUE), cost (NUMERIC), vendor (VARCHAR), status ('Available', 'Assigned', 'Maintenance', defaults to 'Available'), assigned_to (FK to employees)

10. HELPDESK & SUPPORT MODULE:
    - Mandatory: subject (VARCHAR(255) NOT NULL), user_id (NOT NULL)
    - Optional: description (TEXT), category ('IT Support', 'Payroll', 'HR Policy', 'Hardware', 'General'), priority ('low', 'normal', 'high', 'urgent', defaults to 'normal'), status ('open', 'in_progress', 'resolved', 'closed')

11. SAAS MULTI-TENANCY PLATFORM:
    - Global Schema: shared.tenants (tenant_id PK, name NOT NULL, subscription_plan 'hatch'|'scale'|'enterprise', employee_limit: hatch=15, scale=50, enterprise=9999)
    - Tenant Schema Isolation: All company operations query isolated tenant schemas.

STEP-BY-STEP CONVERSATIONAL WIZARD & SLOT-FILLING RULES:
1. When a user asks to CREATE or ADD an entity with incomplete details (e.g. "create a new employee", "apply leave", "create a task"):
   - DO NOT make up fake data and DO NOT call the tool prematurely with missing mandatory values.
   - Act as an intelligent step-by-step assistant and ask for the missing fields sequentially:
     * EMPLOYEE CREATION WIZARD:
       - If Name/Email missing: Ask for **Full Name** and **Work Email**.
       - If Position/Department missing: Ask for **Designation** and **Department** (Engineering, Sales, HR, etc.).
       - If Salary missing: Ask for **Monthly Base Salary (₹)** and **Employment Type**.
       - Once required fields are gathered across the conversation history: Call the \`create_employee\` tool immediately!
     * LEAVE APPLICATION WIZARD:
       - Ask for Leave Type, Dates (From - To), and Reason before executing.
     * TASK CREATION WIZARD:
       - Ask for Task Title, Assignee, Priority, and Due Date before executing.
     * ASSET REGISTRATION WIZARD:
       - Ask for Asset Name, Type (Laptop/Monitor), Serial Number, and Cost.
2. When all required information has been provided (either in a single detailed prompt or over multiple turns in the chat history):
   - Set "should_call_tool" to true, select the tool name, and extract all parameters from current and past messages in this conversation.
   - Execute the database write and return an interactive Action Card with a direct view link!

ROLE PERMISSION BOUNDARIES:
- Super Admin: Cross-tenant SaaS metrics, subscriptions, platform logs.
- Admin / HR: Full CRUD across employees, payroll, attendance, jobs, assets, and departments.
- Manager: Team attendance, department tasks, and leave approval.
- Employee: Self-service (Clock-in/out, Apply leaves, View self-payslip, View own goals). Block requests for other employees' financial/statutory data.`;

    // 3. Check if tools should be triggered or if conversational wizard should ask next step
    const toolPrompt = `
User Query: "${sanitizedQuery}"

Analyze the User Query along with Conversation History:
1. If the user provided all required details to execute an operation, call the tool.
2. If the user wants to start a creation workflow (e.g. "create an employee", "apply leave", "create task") but mandatory fields are missing, set should_call_tool: false and in direct_reply ask for the first missing required fields in a friendly, guided wizard format.
3. If the user is answering a previous question from the wizard, extract all collected fields from history + current message and either ask the next question OR execute the tool if all required fields are now ready.

Available Tools:
${JSON.stringify(COPILOT_TOOL_DEFINITIONS.map(t => ({ name: t.name, description: t.description })), null, 2)}

Respond with a JSON object:
{
  "should_call_tool": boolean,
  "tool_name": string (or null),
  "tool_arguments": object (or {}),
  "direct_reply": string (use if asking next wizard step or for direct response)
}
Return ONLY valid JSON.`;

    let toolDecision = { should_call_tool: false, direct_reply: "I am your HRMS Pro AI Copilot. How can I assist you with employees, payroll, attendance, or leaves today?" };

    try {
      const fullDecisionPrompt = `${systemPrompt}\n\n${toolPrompt}`;
      const aiResponse = await generateWithFallback(fullDecisionPrompt);
      const rawAiDecision = aiResponse?.response || aiResponse?.text || '';

      const parsed = this._parseJSON(rawAiDecision);
      if (parsed && (parsed.tool_name || parsed.direct_reply)) {
        toolDecision = parsed;
      } else if (rawAiDecision && rawAiDecision.trim().length > 10 && !rawAiDecision.includes('{') && !rawAiDecision.includes('```')) {
        // Direct natural response from the LLM
        toolDecision = { should_call_tool: false, direct_reply: rawAiDecision.trim() };
      } else {
        toolDecision = this._heuristicToolPicker(sanitizedQuery, conversationHistory);
      }
    } catch (e) {
      console.warn('[AI Copilot] Provider tool selection notice:', e.message);
      toolDecision = this._heuristicToolPicker(sanitizedQuery, conversationHistory);
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

  _heuristicToolPicker(query, conversationHistory = []) {
    const q = query.toLowerCase();
    const allText = [...(conversationHistory || []).map(m => m.text), query].join(' ');

    // 1. EMPLOYEES CRUD (Typo resilient: employe, employee, salry, salary, engeering, etc.)
    const isEmployeeCreation = /(?:create|add|hire|new)\s+(?:an?\s+)?(?:employe|employee|worker|staff|member|profile)/i.test(q) ||
      (/\bname\b/i.test(q) && (/\bsal[a-z]*\b/i.test(q) || /\bemail\b/i.test(q) || /\bpos[a-z]*\b/i.test(q) || /\bdep[a-z]*\b/i.test(q)));

    if (isEmployeeCreation) {
      // Extract parameters from current query and history
      const emailMatch = allText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i);
      const email = emailMatch ? emailMatch[0] : null;

      const salMatch = allText.match(/(?:sal[a-z]*|pay|ctc|wage)\s*(?:is|:|=)?\s*(?:₹|rs\.?)?\s*(\d+(?:,\d+)*(?:\.\d+)?)/i);
      const salary = salMatch ? parseFloat(salMatch[1].replace(/,/g, '')) : null;

      const posMatch = allText.match(/(?:pos[a-z]*|desig[a-z]*|role|title)\s*(?:is|:|=)?\s*([A-Za-z0-9\s]+?)(?:,|$|\bsal|\bemail|\bdep|\bname)/i);
      const position = posMatch ? posMatch[1].trim() : 'Software Engineer';

      const deptMatch = allText.match(/(?:dep[a-z]*|team)\s*(?:is|:|=)?\s*([A-Za-z0-9\s]+?)(?:,|$|\bsal|\bemail|\bpos|\bdesig|\bname)/i);
      const department_name = deptMatch ? deptMatch[1].trim() : null;

      const nameMatch = allText.match(/(?:name\s*(?:is|:|=)?\s*|employe[a-z]*\s+)([A-Za-z]+(?:\s+[A-Za-z]+)?)/i);
      let firstName = nameMatch ? nameMatch[1].trim() : null;
      if (firstName && ['is', 'a', 'new', 'an'].includes(firstName.toLowerCase())) firstName = null;

      // If we have at least a Name and an Email or Salary, proceed to create!
      if (firstName && (email || salary || department_name)) {
        const cleanEmail = email || `${firstName.toLowerCase().replace(/\s+/g, '')}@company.com`;
        const cleanSalary = salary || 50000;
        return {
          should_call_tool: true,
          tool_name: 'create_employee',
          tool_arguments: {
            first_name: firstName,
            email: cleanEmail,
            salary: cleanSalary,
            position,
            department_name
          }
        };
      }

      // If details are still missing, initiate or continue the interactive wizard
      return {
        should_call_tool: false,
        direct_reply: `Let's set up the new employee profile! 👤\n\nTo ensure complete database & payroll integrity, please provide:\n1️⃣ **Full Name** (e.g., Sarah Connor)\n2️⃣ **Work Email** (e.g., sarah@company.com)\n3️⃣ **Designation / Job Title**\n4️⃣ **Department** (e.g., Engineering, Sales)\n5️⃣ **Monthly Base Salary (₹)**\n\n*(You can reply with all details in one sentence)*`
      };
    }

    // Check if user is replying to an active employee creation wizard in conversation history
    const lastBotMsg = [...(conversationHistory || [])].reverse().find(m => m.sender !== 'user')?.text || '';
    if (lastBotMsg.includes('set up the new employee profile') || lastBotMsg.includes('Full Name') || lastBotMsg.includes('Work Email')) {
      const emailMatch = q.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i);
      const salMatch = q.match(/(?:sal[a-z]*|pay|ctc|wage)?\s*(?:is|:|=)?\s*(?:₹|rs\.?)?\s*(\d+(?:,\d+)*(?:\.\d+)?)/i);
      const words = query.trim().split(/\s+/);

      if (words.length > 0 && !q.includes('help') && !q.includes('what')) {
        const name = words.slice(0, 2).join(' ');
        const email = emailMatch ? emailMatch[0] : `${name.toLowerCase().replace(/\s+/g, '')}@company.com`;
        const salary = salMatch && salMatch[1] ? parseFloat(salMatch[1].replace(/,/g, '')) : 50000;

        return {
          should_call_tool: true,
          tool_name: 'create_employee',
          tool_arguments: {
            first_name: name,
            email,
            salary,
            position: 'Software Developer'
          }
        };
      }
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

    if (q.includes('apply leave') || q.includes('take leave') || q.includes('request leave')) {
      return {
        should_call_tool: false,
        direct_reply: "I can help submit your leave request! 🏖️\n\nPlease let me know:\n1️⃣ **Leave Type** (Casual, Sick, Annual, Unpaid)\n2️⃣ **Start Date & End Date** (e.g., next Monday to Tuesday)\n3️⃣ **Reason for absence**"
      };
    }

    if (q.includes('leave') || q.includes('vacation') || q.includes('holiday')) {
      return { should_call_tool: true, tool_name: 'manage_leave', tool_arguments: { action: 'check_balance' } };
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

    if ((q.includes('department') || q.includes('headcount')) && !q.includes('employee') && !q.includes('employe')) {
      return { should_call_tool: true, tool_name: 'list_departments', tool_arguments: {} };
    }

    // 6. Tasks
    if (q.includes('create task') || q.includes('assign task') || q.includes('new task')) {
      return {
        should_call_tool: false,
        direct_reply: "Let's assign a new task! 📋\n\nPlease provide:\n1️⃣ **Task Title / Summary**\n2️⃣ **Assignee Name** (Employee to work on it)\n3️⃣ **Priority** (Low, Medium, High, Urgent)\n4️⃣ **Due Date**"
      };
    }

    if (q.includes('delete task') || q.includes('remove task')) {
      return { should_call_tool: true, tool_name: 'delete_task', tool_arguments: { task_title: 'Task' } };
    }

    if (q.includes('update task') || (q.includes('mark task') && q.includes('complete'))) {
      return { should_call_tool: true, tool_name: 'update_task', tool_arguments: { status: 'completed' } };
    }

    // 7. Goals
    if (q.includes('create goal') || q.includes('new goal') || q.includes('add goal')) {
      return {
        should_call_tool: false,
        direct_reply: "Let's define a new OKR / Goal! 🎯\n\nPlease provide:\n1️⃣ **Goal Title**\n2️⃣ **Target Completion Date**\n3️⃣ **Priority** (High / Medium)"
      };
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
      return {
        should_call_tool: false,
        direct_reply: "Let's register a new hardware asset! 💻\n\nPlease provide:\n1️⃣ **Device Name & Model** (e.g., MacBook Pro M3 Max)\n2️⃣ **Category** (Laptop, Monitor, Mobile, Peripheral)\n3️⃣ **Serial Number**\n4️⃣ **Purchase Cost**"
      };
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
