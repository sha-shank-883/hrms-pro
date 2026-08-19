const { getAIProvider } = require('./providerFactory');
const { sanitizePrompt } = require('./aiSanitizer');
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
    const sanitizedQuery = sanitizePrompt(message);

    // 2. Build system instructions tailored to user role and permission constraints
    const systemPrompt = `You are HRMS Pro Copilot, an intelligent enterprise HR & operations assistant.
You are assisting ${userName} whose role is "${role.toUpperCase()}" ${isSuperAdmin ? '(GLOBAL SUPER ADMIN)' : ''}.

ROLE CONSTRAINTS & BEHAVIOR:
1. Super Admin: Can view all platform data, revenue, active tenants, and system health.
2. Admin / HR: Can view/edit all company employees, mark attendance, calculate salaries, post jobs, and manage assets.
3. Manager: Can view team attendance, direct reports, and approve leave requests.
4. Employee: Can only view their own leave balances, attendance, and payslips. If an employee asks for another employee's private details (like salary or PAN), explain politely that access is restricted to their own account.

AVAILABLE CAPABILITIES:
- If the user asks for data (e.g. employee details, attendance, salary, assets, platform metrics, posting jobs, calculating net pay), YOU MUST USE THE PROVIDED TOOLS to fetch exact real-time numbers from the database.
- Always provide helpful, structured markdown answers with emojis, bullet points, and key calculation steps.
- When you execute a tool, incorporate the result naturally in your response.`;

    // 3. Obtain AI provider
    const provider = getAIProvider();

    // 4. Check if tools should be triggered
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
      const rawAiDecision = await provider.generateCompletion([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: toolPrompt }
      ], { temperature: 0.1, maxTokens: 800 });

      const parsed = this._parseJSON(rawAiDecision);
      if (parsed && parsed.tool_name) {
        toolDecision = parsed;
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
User asked: "${sanitizedQuery}"
Tool executed: "${toolDecision.tool_name}"
Tool output data: ${JSON.stringify(toolResult, null, 2)}

Generate a friendly, concise, professional response summarizing the answer directly to the user.
Highlight key figures (salary, hours, counts, status) in bold. Mention available actions.`;

      try {
        finalAnswer = await provider.generateCompletion([
          { role: 'system', content: systemPrompt },
          { role: 'user', content: synthesisPrompt }
        ], { temperature: 0.3, maxTokens: 1000 });
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

    if (q.includes('salary') || q.includes('pan') || q.includes('who is') || q.includes('find employee') || q.includes('profile')) {
      const words = query.split(/\s+/);
      const name = words.find(w => w.length > 2 && !['what', 'is', 'the', 'salary', 'for', 'current', 'employee', 'named', 'details', 'check'].includes(w.toLowerCase())) || 'Aman';
      return { should_call_tool: true, tool_name: 'lookup_employee', tool_arguments: { search_query: name } };
    }

    if (q.includes('calculate') && (q.includes('pay') || q.includes('net') || q.includes('bonus') || q.includes('deduct'))) {
      return { should_call_tool: true, tool_name: 'calculate_payroll', tool_arguments: { employee_name: 'Aman', bonus_amount: 5000 } };
    }

    if (q.includes('mark') && (q.includes('attendance') || q.includes('present') || q.includes('absent') || q.includes('clock'))) {
      return { should_call_tool: true, tool_name: 'mark_attendance', tool_arguments: { employee_name: 'Aman', status: 'present', clock_in: '09:30 AM' } };
    }

    if (q.includes('absent') || q.includes('attendance') || q.includes('late') || q.includes('clock-in')) {
      return { should_call_tool: true, tool_name: 'query_attendance', tool_arguments: { date: 'today' } };
    }

    if (q.includes('leave') || q.includes('vacation') || q.includes('holiday')) {
      return { should_call_tool: true, tool_name: 'manage_leave', tool_arguments: { action: 'check_balance' } };
    }

    if (q.includes('job') || q.includes('opening') || q.includes('post') || q.includes('hiring')) {
      return { should_call_tool: true, tool_name: 'create_job_opening', tool_arguments: { title: 'Software Engineer', location: 'Remote' } };
    }

    if (q.includes('asset') || q.includes('laptop') || q.includes('device') || q.includes('monitor')) {
      return { should_call_tool: true, tool_name: 'query_assets', tool_arguments: {} };
    }

    if (q.includes('revenue') || q.includes('tenant') || q.includes('mrr') || q.includes('platform')) {
      return { should_call_tool: true, tool_name: 'superadmin_platform_metrics', tool_arguments: { metric_type: 'overview' } };
    }

    return { should_call_tool: false, direct_reply: "I can help you look up employee salaries, calculate payroll breakdowns, mark attendance, check leave balances, or post job openings. What would you like to do?" };
  }
}

module.exports = new AICopilotService();
