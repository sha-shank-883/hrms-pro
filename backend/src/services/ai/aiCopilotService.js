const { generateWithFallback } = require('./providerFactory');
const { sanitizeInput } = require('./aiSanitizer');
const { getToolsForRole, executeAuthorizedTool } = require('./toolRegistry');
const conversationState = require('./conversationState');
const { resolveRelativeDate, resolveRelativePeriod, formatDate } = require('./dateResolver');

const DAYS_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * HR AI Operations Agent Orchestrator
 * Understands user intent, inspects data, disambiguates entities, validates slots,
 * executes domain tools with independent RBAC, verifies DB writes, and logs audits.
 */
class HRAIOperationsOrchestrator {
  /**
   * Process incoming user request with full agent workflow
   */
  async processUserMessage({ message, conversationHistory = [], userContext, tenantContext, isConfirmed = false, confirmedAction = null }) {
    const { user, isSuperAdmin } = userContext;
    const role = user?.role || 'employee';
    const userId = user?.userId || user?.id || 'anon';
    const sessionId = `session_${tenantContext?.tenantId || 'default'}_${userId}`;
    const userName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.email || 'User';

    // 1. Sanitize user query and resolve active pronouns against conversational entity stack
    const rawSanitized = sanitizeInput(message);
    const sanitizedQuery = conversationState.resolvePronouns(rawSanitized, sessionId);

    const now = new Date();
    const currentISODate = formatDate(now);
    const currentDayName = DAYS_NAMES[now.getDay()];
    const currentTimestampStr = now.toISOString();

    const historySnippet = (conversationHistory || [])
      .slice(-8)
      .map(m => `${m.sender === 'user' ? 'User' : 'HRAgent'}: ${m.text}`)
      .join('\n');

    // Handle Direct Confirmed Action Execution
    if (isConfirmed && confirmedAction && confirmedAction.toolName) {
      console.log(`[HR AI Agent] Executing confirmed sensitive action: ${confirmedAction.toolName}`);
      const toolResult = await executeAuthorizedTool(
        confirmedAction.toolName,
        confirmedAction.args || {},
        userContext,
        tenantContext,
        true // isConfirmed = true
      );

      // Clear workflow state if completed
      conversationState.clearWorkflow(sessionId);

      return {
        reply: toolResult.message || `Action ${confirmedAction.toolName} executed successfully.`,
        tool_executed: confirmedAction.toolName,
        tool_result: toolResult,
        action_cards: toolResult.action_card ? [toolResult.action_card] : [],
        timestamp: new Date().toISOString()
      };
    }

    // 2. Retrieve Role-Filtered Tool Definitions (Strict Server Authorization)
    const availableTools = getToolsForRole(role, isSuperAdmin);

    // 3. Construct HR AI Operations Agent System Prompt with Real-Time Calendar Grounding
    const systemPrompt = `You are the lead HR AI Operations Agent for an enterprise HRMS platform.
You are assisting ${userName} whose authenticated system role is "${role.toUpperCase()}" ${isSuperAdmin ? '(GLOBAL SUPER ADMIN)' : ''}.

TEMPORAL & CALENDAR GROUNDING:
- Current Server Timestamp: ${currentTimestampStr}
- Today's Date: ${currentISODate} (${currentDayName})
- Current Year: ${now.getFullYear()}
- Current Month: ${now.getMonth() + 1}

OPERATIONAL AGENT GUIDELINES:
1. Understand the user's intent: Determine if the request is informational, analytical, operational/action, multi-step, or ambiguous.
2. Tool-First Operation: Always inspect available HRMS data and use domain tools rather than making assumptions.
3. Disambiguation: If a search returns multiple matching employees (e.g. multiple "Rahul"s), never guess — present the list and ask the user which employee they mean.
4. Slot Validation: If mandatory information for an action (e.g. employee creation, leave dates) is missing, ask for the missing details clearly instead of guessing or inventing fake data.
5. Zero Hallucination: Never invent employees, salaries, leave balances, attendance records, policies, or operation outcomes.
6. Response Style: Communicate like an experienced, highly capable HR Operations Manager — professional, concise, proactive, and clear. Avoid generic filler phrases ("Sure! I can help with that"). Directly provide the result.
7. Security & Boundaries: Never expose chain-of-thought. Never bypass role or tenant boundaries.

CONVERSATION RECENT HISTORY:
${historySnippet || '(No prior conversation in this session)'}`;

    const toolPrompt = `User Query: "${sanitizedQuery}"

Analyze the request against available domain tools:
${JSON.stringify(availableTools.map(t => ({ name: t.name, domain: t.domain, description: t.description, type: t.type, isSensitive: t.isSensitive })), null, 2)}

Respond with a JSON object:
{
  "intent": "informational" | "analytical" | "operational" | "multi_step" | "ambiguous",
  "should_call_tool": boolean,
  "tool_name": string (or null),
  "tool_arguments": object (or {}),
  "direct_reply": string (use if asking a clarifying/missing-slot question or providing a direct answer)
}
Return ONLY valid JSON.`;

    let toolDecision = { should_call_tool: false, direct_reply: "I am your HR AI Operations Agent. How can I assist you with employee profiles, attendance, payroll, leaves, or organizational analytics today?" };

    try {
      const fullPrompt = `${systemPrompt}\n\n${toolPrompt}`;
      const aiResponse = await generateWithFallback(fullPrompt);
      const rawResponse = aiResponse?.response || aiResponse?.text || '';

      const parsed = this._parseJSON(rawResponse);
      if (parsed && (parsed.tool_name || parsed.direct_reply)) {
        toolDecision = parsed;
      } else if (rawResponse && rawResponse.trim().length > 10 && !rawResponse.includes('{') && !rawResponse.includes('```')) {
        toolDecision = { should_call_tool: false, direct_reply: rawResponse.trim() };
      } else {
        toolDecision = this._heuristicAgentRouter(sanitizedQuery, conversationHistory, role, isSuperAdmin, sessionId);
      }
    } catch (e) {
      console.warn('[HR AI Agent] Provider tool selection notice:', e.message);
      toolDecision = this._heuristicAgentRouter(sanitizedQuery, conversationHistory, role, isSuperAdmin, sessionId);
    }

    let toolResult = null;
    let actionCards = [];

    // 4. Execute Selected Tool with Server Authorization & Verification
    if (toolDecision.should_call_tool && toolDecision.tool_name) {
      try {
        toolResult = await executeAuthorizedTool(
          toolDecision.tool_name,
          toolDecision.tool_arguments || {},
          userContext,
          tenantContext,
          false
        );

        if (toolResult?.action_card) {
          actionCards.push(toolResult.action_card);
        }

        // Update active entity reference stack on successful employee resolution
        if (toolResult?.data) {
          const d = toolResult.data;
          if (d.employee_id || d.id) {
            conversationState.setActiveEntity(sessionId, {
              id: d.employee_id || d.id,
              name: d.name || `${d.first_name || ''} ${d.last_name || ''}`.trim(),
              code: d.employee_code,
              department: d.department_name
            });
          }
        }

        // If tool requires sensitive action confirmation
        if (toolResult?.requiresConfirmation) {
          return {
            reply: toolResult.message,
            tool_executed: toolDecision.tool_name,
            tool_result: toolResult,
            requires_confirmation: true,
            confirmation_token: toolResult.confirmationToken,
            pending_action: {
              toolName: toolResult.toolName,
              args: toolResult.args
            },
            action_cards: [],
            timestamp: new Date().toISOString()
          };
        }

        // If tool requires employee disambiguation
        if (toolResult?.disambiguation_needed) {
          const optionsList = (toolResult.disambiguation_options || []).map((opt, idx) =>
            `${idx + 1}. **${opt.name || opt.label || opt.id}** (${opt.employee_code || ''}) — *${opt.position || ''}*, ${opt.department || ''}`
          ).join('\n');

          return {
            reply: `I found **${toolResult.count}** records matching your request:\n\n${optionsList}\n\n👉 **Which one did you mean?** Please specify the name, code, or ID.`,
            tool_executed: toolDecision.tool_name,
            tool_result: toolResult,
            disambiguation_options: toolResult.disambiguation_options,
            action_cards: [],
            timestamp: new Date().toISOString()
          };
        }
      } catch (err) {
        console.error(`[HR AI Agent Tool Error] ${toolDecision.tool_name}:`, err.message);
        toolResult = { success: false, message: `Tool execution failed: ${err.message}` };
      }
    }

    // 5. Generate Final Explanation (Concise, Professional, Fact-Grounded)
    let finalAnswer = '';
    if (toolResult) {
      const synthesisPrompt = `
${systemPrompt}

User asked: "${sanitizedQuery}"
Tool executed: "${toolDecision.tool_name}"
Tool Output Data: ${JSON.stringify(toolResult, null, 2)}

Provide a concise, professional HR manager explanation of the result.
Highlight key numbers/status in bold. Never expose internal tool names or raw database JSON.`;

      try {
        const synthRes = await generateWithFallback(synthesisPrompt);
        finalAnswer = synthRes?.response || synthRes?.text || toolResult.message || `Operation completed.`;
      } catch (_) {
        finalAnswer = toolResult.message || `Here is the requested information.`;
      }
    } else {
      finalAnswer = toolDecision.direct_reply || "How can I assist you with HR operations, employee records, or analytics today?";
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
   * Contextual Quick Suggestions based on authenticated role
   */
  getQuickSuggestions(role = 'employee', isSuperAdmin = false) {
    if (isSuperAdmin || role === 'super_admin') {
      return [
        { label: '📊 Platform MRR & Revenue', prompt: 'What is our total platform revenue and tenant breakdown?' },
        { label: '🏢 Active Company Tenants', prompt: 'Show all registered company tenants and subscription plans' },
        { label: '⚙️ Global Health Overview', prompt: 'Show system health and operational metrics' }
      ];
    }

    if (role === 'admin' || role === 'hr') {
      return [
        { label: '👥 Search Employees', prompt: 'Search employees in Engineering' },
        { label: '⏱️ Today\'s Attendance Summary', prompt: 'Show company attendance summary for today' },
        { label: '🏖️ Pending Leave Requests', prompt: 'Show all pending leave requests' },
        { label: '💰 Payroll Cost Analysis', prompt: 'Analyze monthly payroll costs and department breakdown' },
        { label: '📊 Headcount Overview', prompt: 'Show total company headcount metrics' }
      ];
    }

    if (role === 'manager') {
      return [
        { label: '👥 Team Attendance Summary', prompt: 'Show attendance summary for my team today' },
        { label: '🏖️ Pending Team Leaves', prompt: 'Are there any pending leave requests in my department?' },
        { label: '📝 My Leave Balance', prompt: 'What is my current leave balance?' }
      ];
    }

    // Standard Employee
    return [
      { label: '🏖️ My Leave Balance', prompt: 'What is my current leave balance?' },
      { label: '📅 My Attendance This Month', prompt: 'Show my attendance summary for this month' },
      { label: '💵 My Salary Breakdown', prompt: 'What is my current monthly salary and PF deduction?' },
      { label: '🎯 My Goals & OKRs', prompt: 'Show my active performance goals' }
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

  /**
   * Deterministic Fallback & Multi-Turn Slot Collector Router
   */
  _heuristicAgentRouter(query, conversationHistory = [], role = 'employee', isSuperAdmin = false, sessionId = 'default') {
    const q = query.toLowerCase();

    // 1. Employee Creation / Onboarding Intent
    const isEmployeeCreation = /(?:create|add|hire|new)\s+(?:an?\s+)?(?:employe|employee|worker|staff|member|profile)/i.test(q) ||
      (/\bname\b/i.test(q) && (/\bsal[a-z]*\b/i.test(q) || /\bemail\b/i.test(q) || /\bpos[a-z]*\b/i.test(q) || /\bdep[a-z]*\b/i.test(q)));

    const lastBotMsg = [...(conversationHistory || [])].reverse().find(m => m.sender !== 'user')?.text || '';
    const isOngoingEmployeeWizard = lastBotMsg.includes('employee profile') || lastBotMsg.includes('Information Collected So Far') || lastBotMsg.includes('Please provide the remaining');

    if (isEmployeeCreation || isOngoingEmployeeWizard) {
      // Extract slots only from the current turn and update session workflow state
      const currentTurnSlots = {};

      const emailMatch = query.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
      if (emailMatch) currentTurnSlots.email = emailMatch[1].trim();

      const salMatch = query.match(/(?:sal[a-z]*|pay|ctc|wage)\s*(?:is|:|=)?\s*(?:₹|rs\.?)?\s*(\d+(?:,\d+)*(?:\.\d+)?k?)/i);
      if (salMatch) {
        let rawVal = salMatch[1].toLowerCase().replace(/,/g, '');
        currentTurnSlots.salary = rawVal.endsWith('k') ? parseFloat(rawVal.replace('k', '')) * 1000 : parseFloat(rawVal);
      }

      const posMatch = query.match(/(?:pos[a-z]*|desig[a-z]*|role|title|job)\s*(?:is|:|=)?\s*([A-Za-z0-9\s]+?)(?:\||,|$|\bsal|\bemail|\bdep|\bname|\bphone|\bgender)/i);
      if (posMatch && posMatch[1].trim().length > 1 && !['is', 'a', 'the', 'new'].includes(posMatch[1].trim().toLowerCase())) {
        currentTurnSlots.position = posMatch[1].trim();
      }

      const deptMatch = query.match(/(?:dep[a-z]*|team)\s*(?:is|:|=)?\s*([A-Za-z0-9\s]+?)(?:\||,|$|\bsal|\bemail|\bpos|\bdesig|\bname|\bphone|\bgender)/i);
      if (deptMatch && deptMatch[1].trim().length > 1 && !['is', 'a', 'the', 'new'].includes(deptMatch[1].trim().toLowerCase())) {
        currentTurnSlots.department_name = deptMatch[1].trim();
      }

      const phoneMatch = query.match(/(?:phone|mob[a-z]*|contact|cell)\s*(?:is|:|=)?\s*(\+?\d[\d\s-]{8,14}\d)/i);
      if (phoneMatch) currentTurnSlots.phone = phoneMatch[1].trim();

      const genderMatch = query.match(/(?:gender|sex)\s*(?:is|:|=)?\s*(male|female|other)/i);
      if (genderMatch) currentTurnSlots.gender = genderMatch[1].toLowerCase().trim();

      const nameMatch = query.match(/(?:name\s*(?:is|:|=)?\s*|employe[a-z]*\s+)([A-Za-z]+(?:\s+[A-Za-z]+)?)/i);
      if (nameMatch) {
        const parts = nameMatch[1].trim().split(/\s+/);
        if (!['is', 'a', 'new', 'an', 'the'].includes(parts[0].toLowerCase())) {
          currentTurnSlots.first_name = parts[0];
          if (parts.length > 1) currentTurnSlots.last_name = parts.slice(1).join(' ');
        }
      }

      // Update state store
      const slots = conversationState.updateWorkflowSlots(sessionId, 'create_employee', currentTurnSlots);

      // Check missing mandatory fields
      const missing = [];
      if (!slots.first_name) missing.push('1️⃣ **Full Name** (e.g. Sarah Connor)');
      if (!slots.email) missing.push('2️⃣ **Work Email** (e.g. sarah@company.com)');
      if (!slots.position) missing.push('3️⃣ **Job Designation / Role** (e.g. Senior Software Engineer)');
      if (!slots.department_name) missing.push('4️⃣ **Department** (e.g. Engineering, Sales, HR)');
      if (!slots.salary) missing.push('5️⃣ **Monthly Base Salary (₹)**');

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

        return { should_call_tool: false, direct_reply: reply };
      }

      // Clear workflow on completion
      conversationState.clearWorkflow(sessionId);

      return {
        should_call_tool: true,
        tool_name: 'createEmployee',
        tool_arguments: slots
      };
    }

    // 2. Employee Search / Disambiguation
    if (q.includes('search employee') || q.includes('find employee') || q.includes('who is') || q.includes('look up')) {
      const words = query.split(/\s+/).filter(w => !['search', 'for', 'find', 'who', 'is', 'the', 'look', 'up', 'employee', 'named', 'profile'].includes(w.toLowerCase()));
      const target = words.join(' ') || 'all';
      return { should_call_tool: true, tool_name: 'searchEmployees', tool_arguments: { query_text: target } };
    }

    // 3. Employee Deactivation / Termination (Sensitive Action)
    if (q.includes('terminate') || q.includes('deactivate employee') || q.includes('remove employee') || q.includes('fire')) {
      const targetName = query.split(/\s+/).filter(w => !['terminate', 'deactivate', 'remove', 'fire', 'employee', 'please', 'the', 'an', 'a', 'this'].includes(w.toLowerCase())).join(' ').trim();
      if (!targetName) {
        return {
          should_call_tool: false,
          direct_reply: `Which employee would you like to deactivate or terminate? Please specify their **Full Name** or **Employee Code**.`
        };
      }
      return { should_call_tool: true, tool_name: 'deactivateEmployee', tool_arguments: { employee_name: targetName, reason: 'Deactivated via HR operations' } };
    }

    // 4. Attendance
    if (q.includes('missing punch') || q.includes('unpunched') || q.includes('forgot to clock out')) {
      return { should_call_tool: true, tool_name: 'getMissingPunches', tool_arguments: { limit: 10 } };
    }

    if (q.includes('regularize') || (q.includes('mark') && q.includes('attendance'))) {
      const relDate = resolveRelativeDate(query) || formatDate(new Date());
      return { should_call_tool: true, tool_name: 'regularizeAttendance', tool_arguments: { date: relDate, status: 'present' } };
    }

    if (q.includes('attendance') || q.includes('present') || q.includes('absent') || q.includes('late')) {
      const relDate = resolveRelativeDate(query);
      return { should_call_tool: true, tool_name: 'getAttendanceSummary', tool_arguments: { date: relDate || (q.includes('today') ? formatDate(new Date()) : null) } };
    }

    // 5. Leaves
    if (q.includes('leave balance') || q.includes('remaining leave') || q.includes('how many leaves')) {
      const words = query.split(/\s+/).filter(w => !['what', 'is', 'my', 'the', 'leave', 'leaves', 'balance', 'remaining', 'for', 'of'].includes(w.toLowerCase()));
      const empTarget = words.join(' ').trim();
      return { should_call_tool: true, tool_name: 'getLeaveBalance', tool_arguments: empTarget ? { employee_name: empTarget } : {} };
    }

    if (q.includes('approve leave')) {
      const idMatch = query.match(/#?(\d+)/);
      return { should_call_tool: true, tool_name: 'approveLeave', tool_arguments: idMatch ? { leave_id: parseInt(idMatch[1], 10) } : {} };
    }

    if (q.includes('apply leave') || q.includes('take leave') || q.includes('request leave')) {
      return {
        should_call_tool: false,
        direct_reply: `I can help submit your leave request! 🏖️\n\nPlease let me know:\n1️⃣ **Leave Type** (Annual, Sick, Casual, Unpaid)\n2️⃣ **Start Date & End Date** (YYYY-MM-DD)\n3️⃣ **Reason for absence**`
      };
    }

    if (q.includes('leave')) {
      return { should_call_tool: true, tool_name: 'getLeaveRequests', tool_arguments: { status: 'pending' } };
    }

    // 6. Payroll & Salaries
    if (q.includes('salary') || q.includes('payslip') || q.includes('pay breakdown')) {
      const words = query.split(/\s+/).filter(w => !['what', 'is', 'my', 'the', 'salary', 'payslip', 'breakdown', 'for', 'of'].includes(w.toLowerCase()));
      const empTarget = words.join(' ').trim();
      return { should_call_tool: true, tool_name: 'getSalary', tool_arguments: empTarget ? { employee_name: empTarget } : {} };
    }

    if (q.includes('finalize payroll') || q.includes('process payroll')) {
      const period = resolveRelativePeriod(query);
      return { should_call_tool: true, tool_name: 'finalizePayroll', tool_arguments: { month: period.month, year: period.year } };
    }

    if (q.includes('payroll cost') || q.includes('payroll expense') || q.includes('payroll increase')) {
      return { should_call_tool: true, tool_name: 'getPayrollCostAnalysis', tool_arguments: {} };
    }

    // 7. Organization & Headcount
    if (q.includes('headcount') || q.includes('how many employees') || q.includes('total staff')) {
      return { should_call_tool: true, tool_name: 'getHeadcount', tool_arguments: {} };
    }

    if (q.includes('department') || q.includes('dept')) {
      return { should_call_tool: true, tool_name: 'getDepartments', tool_arguments: {} };
    }

    if (q.includes('holiday') || q.includes('calendar')) {
      return { should_call_tool: true, tool_name: 'getHolidays', tool_arguments: {} };
    }

    if (q.includes('policy') || q.includes('rules')) {
      return { should_call_tool: true, tool_name: 'getPolicies', tool_arguments: { policy_name: 'all' } };
    }

    // 8. Performance & Goals
    if (q.includes('goal') || q.includes('okr') || q.includes('appraisal')) {
      return { should_call_tool: true, tool_name: 'getGoals', tool_arguments: {} };
    }

    // 9. Super Admin
    if (isSuperAdmin && (q.includes('tenant') || q.includes('mrr') || q.includes('platform'))) {
      return { should_call_tool: true, tool_name: 'getSaaSOPSOverview', tool_arguments: {} };
    }

    return {
      should_call_tool: false,
      direct_reply: `I am your HR AI Operations Agent. You can ask me to search employees, check attendance & missing punches, view leave balances, analyze payroll costs, manage OKRs, or retrieve company policies!`
    };
  }
}

module.exports = new HRAIOperationsOrchestrator();
