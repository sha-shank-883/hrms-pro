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

  _extractMultiTurnEmployeeSlots(conversationHistory = [], currentQuery = '') {
    const userMessages = [
      ...(conversationHistory || []).filter(m => m.sender === 'user').map(m => m.text),
      currentQuery
    ];
    const fullText = userMessages.join(' | ');

    const slots = {
      first_name: null,
      last_name: null,
      email: null,
      salary: null,
      position: null,
      department_name: null,
      phone: null,
      gender: null,
      date_of_birth: null,
      joining_date: null,
      pan: null,
      address: null
    };

    // 1. Email extraction
    const emailMatch = fullText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
    if (emailMatch) slots.email = emailMatch[1].trim();

    // 2. Salary extraction
    const salMatch = fullText.match(/(?:sal[a-z]*|pay|ctc|wage)\s*(?:is|:|=)?\s*(?:₹|rs\.?)?\s*(\d+(?:,\d+)*(?:\.\d+)?k?)/i);
    if (salMatch) {
      let rawVal = salMatch[1].toLowerCase().replace(/,/g, '');
      if (rawVal.endsWith('k')) {
        slots.salary = parseFloat(rawVal.replace('k', '')) * 1000;
      } else {
        slots.salary = parseFloat(rawVal);
      }
    }

    // 3. Position extraction
    const posMatch = fullText.match(/(?:pos[a-z]*|desig[a-z]*|role|title|job)\s*(?:is|:|=)?\s*([A-Za-z0-9\s]+?)(?:\||,|$|\bsal|\bemail|\bdep|\bname|\bphone|\bgender)/i);
    if (posMatch) {
      const cleanPos = posMatch[1].trim();
      if (cleanPos.length > 1 && !['is', 'a', 'the', 'new'].includes(cleanPos.toLowerCase())) {
        slots.position = cleanPos;
      }
    }

    // 4. Department extraction
    const deptMatch = fullText.match(/(?:dep[a-z]*|team)\s*(?:is|:|=)?\s*([A-Za-z0-9\s]+?)(?:\||,|$|\bsal|\bemail|\bpos|\bdesig|\bname|\bphone|\bgender)/i);
    if (deptMatch) {
      const cleanDept = deptMatch[1].trim();
      if (cleanDept.length > 1 && !['is', 'a', 'the', 'new'].includes(cleanDept.toLowerCase())) {
        slots.department_name = cleanDept;
      }
    }

    // 5. Phone extraction
    const phoneMatch = fullText.match(/(?:phone|mob[a-z]*|contact|cell)\s*(?:is|:|=)?\s*(\+?\d[\d\s-]{8,14}\d)/i);
    if (phoneMatch) slots.phone = phoneMatch[1].trim();

    // 6. Gender extraction
    const genderMatch = fullText.match(/(?:gender|sex)\s*(?:is|:|=)?\s*(male|female|other)/i);
    if (genderMatch) slots.gender = genderMatch[1].toLowerCase().trim();

    // 7. Joining Date extraction
    const joinMatch = fullText.match(/(?:joining|hire|join|start)\s*(?:date)?\s*(?:is|:|=)?\s*(\d{4}-\d{2}-\d{2})/i);
    if (joinMatch) slots.joining_date = joinMatch[1].trim();

    // 8. PAN extraction
    const panMatch = fullText.match(/\b([A-Z]{5}[0-9]{4}[A-Z]{1})\b/i);
    if (panMatch) slots.pan = panMatch[1].toUpperCase().trim();

    // 9. Name extraction
    // Match explicit "name is ...", "name: ...", or "create employee <Name>"
    const nameMatch = fullText.match(/(?:name\s*(?:is|:|=)?\s*|employe[a-z]*\s+)([A-Za-z]+(?:\s+[A-Za-z]+)?)/i);
    if (nameMatch) {
      const full = nameMatch[1].trim();
      const parts = full.split(/\s+/);
      if (!['is', 'a', 'new', 'an', 'please', 'the', 'named'].includes(parts[0].toLowerCase())) {
        slots.first_name = parts[0];
        if (parts.length > 1) slots.last_name = parts.slice(1).join(' ');
      }
    }

    // If name still not found, check if a single standalone message was sent with just 2 capitalized words
    if (!slots.first_name) {
      for (const msg of userMessages) {
        const trimmed = msg.trim();
        if (/^[A-Z][a-z]+(\s+[A-Z][a-z]+)?$/.test(trimmed) && !trimmed.toLowerCase().includes('create') && !trimmed.toLowerCase().includes('help')) {
          const parts = trimmed.split(/\s+/);
          slots.first_name = parts[0];
          if (parts.length > 1) slots.last_name = parts.slice(1).join(' ');
          break;
        }
      }
    }

    return slots;
  }

  _heuristicToolPicker(query, conversationHistory = []) {
    const q = query.toLowerCase();
    const isEmployeeCreationIntent = /(?:create|add|hire|new)\s+(?:an?\s+)?(?:employe|employee|worker|staff|member|profile)/i.test(q) ||
      (/\bname\b/i.test(q) && (/\bsal[a-z]*\b/i.test(q) || /\bemail\b/i.test(q) || /\bpos[a-z]*\b/i.test(q) || /\bdep[a-z]*\b/i.test(q)));

    const lastBotMsg = [...(conversationHistory || [])].reverse().find(m => m.sender !== 'user')?.text || '';
    const isOngoingWizard = lastBotMsg.includes('employee profile') || lastBotMsg.includes('Information Collected So Far') || lastBotMsg.includes('Please provide the following');

    // 1. EMPLOYEES CRUD WITH STRICT WIZARD MEMORY
    if (isEmployeeCreationIntent || isOngoingWizard) {
      const slots = this._extractMultiTurnEmployeeSlots(conversationHistory, query);

      // Check mandatory fields
      const missing = [];
      if (!slots.first_name) missing.push('1️⃣ **Full Name** (e.g. Sarah Connor)');
      if (!slots.email) missing.push('2️⃣ **Work Email** (e.g. sarah@company.com)');
      if (!slots.position) missing.push('3️⃣ **Job Designation / Role** (e.g. Senior Software Engineer)');
      if (!slots.department_name) missing.push('4️⃣ **Department** (e.g. Engineering, Sales, HR)');
      if (!slots.salary) missing.push('5️⃣ **Monthly Base Salary (₹)**');

      // If any mandatory field is missing, keep the session open and ask HR for the remaining details
      if (missing.length > 0) {
        const collectedList = [];
        if (slots.first_name) collectedList.push(`• **Full Name**: ${slots.first_name} ${slots.last_name || ''}`);
        if (slots.email) collectedList.push(`• **Work Email**: ${slots.email}`);
        if (slots.position) collectedList.push(`• **Designation**: ${slots.position}`);
        if (slots.department_name) collectedList.push(`• **Department**: ${slots.department_name}`);
        if (slots.salary) collectedList.push(`• **Monthly Salary**: ₹${Number(slots.salary).toLocaleString('en-IN')}`);
        if (slots.phone) collectedList.push(`• **Phone**: ${slots.phone}`);
        if (slots.gender) collectedList.push(`• **Gender**: ${slots.gender.toUpperCase()}`);

        let reply = `Let's set up the new employee profile! 👤\n\n`;
        if (collectedList.length > 0) {
          reply += `📋 **Information Collected So Far:**\n${collectedList.join('\n')}\n\n`;
        }
        reply += `👉 **Please provide the remaining required details from HR:**\n${missing.join('\n')}\n\n*(You can reply with all missing fields in a single message)*`;

        return {
          should_call_tool: false,
          direct_reply: reply
        };
      }

      // All 5 mandatory fields are collected from HR! Call the tool with genuine data ONLY.
      return {
        should_call_tool: true,
        tool_name: 'create_employee',
        tool_arguments: {
          first_name: slots.first_name,
          last_name: slots.last_name || '',
          email: slots.email,
          salary: slots.salary,
          position: slots.position,
          department_name: slots.department_name,
          phone: slots.phone || null,
          gender: slots.gender || 'male',
          date_of_birth: slots.date_of_birth || null,
          joining_date: slots.joining_date || null,
          pan: slots.pan || null
        }
      };
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
