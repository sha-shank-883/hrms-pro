const { generateWithFallback, providers } = require('./providerFactory');
const { sanitizeInput } = require('./aiSanitizer');
const {
  getToolsForRole,
  getGeminiFunctionDeclarations,
  getOpenAIFunctionDeclarations,
  executeAuthorizedTool
} = require('./toolRegistry');
const conversationState = require('./conversationState');
const { resolveRelativeDate, resolveRelativePeriod, formatDate } = require('./dateResolver');
const { getOrganizationKnowledgeContext, getDynamicOrgKnowledgeContext, getLiveOrgSnapshot } = require('./organizationKnowledge');

const DAYS_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * HR AI Operations Agent Orchestrator
 * Understands user intent via native LLM function calling or keyword-presence scoring,
 * inspects data, disambiguates entities, validates slots, executes domain tools with
 * independent RBAC, verifies DB writes, and logs audits.
 */
class HRAIOperationsOrchestrator {
  /**
   * Process incoming user request with full agent workflow
   */
  async processUserMessage({ message, conversationHistory = [], userContext, tenantContext, isConfirmed = false, confirmedAction = null, onProgress = null }) {
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
    const geminiTools = getGeminiFunctionDeclarations(role, isSuperAdmin);
    const groqTools = getOpenAIFunctionDeclarations(role, isSuperAdmin);

    // 3. Construct HR AI Operations Agent System Prompt with Real-Time Calendar Grounding, Live Org Context & Organization Knowledge
    const orgKnowledgeContext = await getDynamicOrgKnowledgeContext(tenantContext?.tenantId);
    const liveOrgSnapshot = await getLiveOrgSnapshot(userContext, tenantContext);

    const systemPrompt = `You are the Operations Intelligence Agent embedded inside Corexa HR / HRMS Pro — not a support chatbot, but an expert HR operations partner who has complete, real-time knowledge of this organization: its employees, policies, workflows, and current state. You know this company's data the way a long-tenured HR operations manager would, not the way a generic help desk does. You do not say things like "I'm here to help", "As an AI language model...", or "Sure, I can help with that" — you respond the way a capable colleague would, directly, proactively, and specifically.

Assisting: ${userName} | Authenticated System Role: "${role.toUpperCase()}" ${isSuperAdmin ? '(GLOBAL SUPER ADMIN)' : ''}

TEMPORAL & CALENDAR GROUNDING:
- Current Server Timestamp: ${currentTimestampStr}
- Today's Date: ${currentISODate} (${currentDayName})
- Current Year: ${now.getFullYear()}
- Current Month: ${now.getMonth() + 1}

${liveOrgSnapshot}

${orgKnowledgeContext}

PROACTIVE GUIDANCE BEHAVIOR:
- After completing an action, proactively suggest 1-3 logical next steps if a clear workflow follows (e.g. after creating an employee: "Would you like me to configure their initial leave quotas and assign onboarding hardware assets?").
- If a user's request suggests they are unfamiliar with the complete procedural sequence (e.g. "I need to fire someone" or "I want to promote someone"), guide them step-by-step through the required compliance, approval, and settlement stages rather than blindly executing a single raw mutation.
- If you detect a common pattern (e.g. month-end payroll approaching or high unregularized attendance punches), proactively highlight it.
- When explaining findings, concisely state WHY, not just WHAT (e.g. "Leave balance is 3 days — note this employee is on probation until {{date}}, which restricts unearned leave encashment").

NATURAL CONVERSATION & ANTI-REPETITION RULES:
1. Never reuse the exact same sentence structure, opening greeting, or boilerplate phrasing you've used earlier in this conversation. Vary your phrasing naturally, the way a real person would when explaining something for a second time or in a new context.
2. Avoid generic bot templates. Speak directly with concrete details.
3. Understand the user's intent: Determine if the request is informational, analytical, operational/action, multi-step, or ambiguous.
4. Tool-First Operation: Always inspect available HRMS data and call appropriate domain tools with structured parameters.
5. Disambiguation: If a search returns multiple matching employees, present the list concisely and ask the user which employee they mean.
6. Proactive Slot-Filling: If mandatory information for an action is missing, explain what details are needed and offer a natural, copy-paste template tailored to the missing fields.
7. Zero Hallucination: Never invent employees, salaries, leave balances, attendance records, policies, or operation outcomes.
8. Security & Boundaries: Never expose chain-of-thought. Never bypass role or tenant boundaries.

CONVERSATION RECENT HISTORY:
${historySnippet || '(No prior conversation in this session)'}`;

    let toolExecuted = null;
    let toolResult = null;
    let finalReply = '';
    let actionCards = [];

    // 4. Try Native Function Calling with Configured Provider (Gemini / Groq)
    let aiResponse = null;
    try {
      aiResponse = await generateWithFallback(sanitizedQuery, null, userId, {
        systemInstruction: systemPrompt,
        toolsMap: {
          gemini: geminiTools,
          groq: groqTools
        }
      });
    } catch (e) {
      console.warn('[HR AI Agent] AI Provider call notice:', e.message);
    }

    // Check if Provider issued a Native Function Call
    if (aiResponse && aiResponse.success && aiResponse.hasFunctionCall && aiResponse.functionCall) {
      const { name: toolName, args: toolArgs } = aiResponse.functionCall;
      toolExecuted = toolName;
      console.log(`[AI Engine: LLM_NATIVE] Handled via ${aiResponse.provider} with function call: ${toolName}`);

      if (typeof onProgress === 'function') {
        const friendlyName = toolName.replace(/([A-Z])/g, ' $1').toLowerCase();
        onProgress(`Executing ${friendlyName} in HRMS database...`);
      }

      try {
        toolResult = await executeAuthorizedTool(
          toolName,
          toolArgs || {},
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

        // Check if tool requires confirmation token
        if (toolResult?.requiresConfirmation) {
          return {
            reply: toolResult.message,
            tool_executed: toolName,
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

        // Check if tool requires employee disambiguation
        if (toolResult?.disambiguation_needed) {
          const optionsList = (toolResult.disambiguation_options || []).map((opt, idx) =>
            `${idx + 1}. **${opt.name || opt.label || opt.id}** (${opt.employee_code || ''}) — *${opt.position || ''}*, ${opt.department || ''}`
          ).join('\n');

          return {
            reply: `I found **${toolResult.count}** records matching your request:\n\n${optionsList}\n\n👉 **Which one did you mean?** Please specify the name, code, or ID.`,
            tool_executed: toolName,
            tool_result: toolResult,
            disambiguation_options: toolResult.disambiguation_options,
            action_cards: [],
            timestamp: new Date().toISOString()
          };
        }

        // 5. Collapsed Single-Roundtrip Multi-Turn Synthesis
        if (aiResponse.provider === 'gemini' && aiResponse.chatSession && providers.gemini) {
          const synth = await providers.gemini.sendFunctionResult(aiResponse.chatSession, toolName, toolResult);
          finalReply = synth || toolResult.message || 'Operation completed.';
        } else if (aiResponse.provider === 'groq' && aiResponse.assistantMessage && providers.groq) {
          const synth = await providers.groq.sendFunctionResult(
            aiResponse.messages || [],
            aiResponse.assistantMessage,
            aiResponse.functionCall.toolCallId,
            toolResult
          );
          finalReply = synth || toolResult.message || 'Operation completed.';
        } else {
          finalReply = toolResult.message || 'Operation completed.';
        }
      } catch (err) {
        console.error(`[HR AI Agent Tool Error] ${toolName}:`, err.message);
        toolResult = { success: false, message: `Tool execution failed: ${err.message}` };
        finalReply = toolResult.message;
      }

      // Compute proactive suggested next actions
      const suggestedActions = this._computeSuggestedNextActions(toolExecuted, toolResult);

      return {
        reply: finalReply,
        tool_executed: toolExecuted,
        tool_result: toolResult,
        action_cards: actionCards,
        suggested_next_actions: suggestedActions,
        timestamp: new Date().toISOString()
      };
    }

    // Direct LLM reply without function call (e.g. conversational answer, slot questions)
    if (aiResponse && aiResponse.success && aiResponse.response && aiResponse.response.trim() !== '') {
      return {
        reply: aiResponse.response.trim(),
        tool_executed: null,
        tool_result: null,
        action_cards: [],
        timestamp: new Date().toISOString()
      };
    }

    // 6. Keyword-Presence Scoring Heuristic Router (Offline / Fallback Path)
    console.warn(`[AI Engine: HEURISTIC_FALLBACK] LLM provider was unconfigured or returned no actionable plan; invoking offline heuristic router.`);
    const heuristicDecision = this._heuristicAgentRouter(sanitizedQuery, conversationHistory, role, isSuperAdmin, sessionId);

    if (heuristicDecision.should_call_tool && heuristicDecision.tool_name) {
      toolExecuted = heuristicDecision.tool_name;
      if (typeof onProgress === 'function') {
        const friendlyName = heuristicDecision.tool_name.replace(/([A-Z])/g, ' $1').toLowerCase();
        onProgress(`Accessing ${friendlyName} in HRMS database...`);
      }
      try {
        toolResult = await executeAuthorizedTool(
          heuristicDecision.tool_name,
          heuristicDecision.tool_arguments || {},
          userContext,
          tenantContext,
          false
        );

        if (toolResult?.action_card) {
          actionCards.push(toolResult.action_card);
        }

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

        if (toolResult?.requiresConfirmation) {
          return {
            reply: toolResult.message,
            tool_executed: toolExecuted,
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

        if (toolResult?.disambiguation_needed) {
          const optionsList = (toolResult.disambiguation_options || []).map((opt, idx) =>
            `${idx + 1}. **${opt.name || opt.label || opt.id}** (${opt.employee_code || ''}) — *${opt.position || ''}*, ${opt.department || ''}`
          ).join('\n');

          return {
            reply: `I found **${toolResult.count}** records matching your request:\n\n${optionsList}\n\n👉 **Which one did you mean?** Please specify the name, code, or ID.`,
            tool_executed: toolExecuted,
            tool_result: toolResult,
            disambiguation_options: toolResult.disambiguation_options,
            action_cards: [],
            timestamp: new Date().toISOString()
          };
        }

        finalReply = toolResult.message || 'Operation completed successfully.';
      } catch (err) {
        toolResult = { success: false, message: `Tool execution failed: ${err.message}` };
        finalReply = toolResult.message;
      }
    } else {
      finalReply = heuristicDecision.direct_reply || 'How can I assist you with HR operations, employee records, attendance, or payroll today?';
    }

    return {
      reply: finalReply,
      tool_executed: toolExecuted,
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

    return [
      { label: '🏖️ My Leave Balance', prompt: 'What is my current leave balance?' },
      { label: '📅 My Attendance This Month', prompt: 'Show my attendance summary for this month' },
      { label: '💵 My Salary Breakdown', prompt: 'What is my current monthly salary and PF deduction?' },
      { label: '🎯 My Goals & OKRs', prompt: 'Show my active performance goals' }
    ];
  }

  /**
   * Bulk and Multi-Line Slot Parser for Structured Inputs
   */
  _extractSlots(query, sessionId) {
    const rawSlots = {};
    const text = query.trim();

    // 1. Bulk Key-Value Extraction (handles multi-line, colons, bullets, and pipes)
    const lines = text.split(/[\r\n|•;,]+/);
    for (const line of lines) {
      const match = line.match(/^\s*(?:-\s*)?([A-Za-z\s_]+?)\s*[:=]\s*(.+)$/i);
      if (match) {
        const key = match[1].toLowerCase().trim().replace(/[\s_]+/g, '');
        const val = match[2].trim();

        if (['name', 'fullname', 'employeename'].includes(key)) {
          const parts = val.split(/\s+/);
          rawSlots.first_name = parts[0];
          if (parts.length > 1) rawSlots.last_name = parts.slice(1).join(' ');
        } else if (['email', 'workemail', 'mail'].includes(key)) {
          rawSlots.email = val.replace(/[<>\s]/g, '');
        } else if (['salary', 'basesalary', 'monthlysalary', 'pay', 'ctc', 'wage'].includes(key)) {
          let sVal = val.toLowerCase().replace(/[^0-9.k]/g, '');
          rawSlots.salary = sVal.endsWith('k') ? parseFloat(sVal.replace('k', '')) * 1000 : parseFloat(sVal);
        } else if (['dept', 'department', 'team', 'division'].includes(key)) {
          rawSlots.department_name = val;
        } else if (['position', 'role', 'designation', 'job', 'jobtitle', 'title'].includes(key)) {
          rawSlots.position = val;
        } else if (['phone', 'mobile', 'contact', 'cell'].includes(key)) {
          rawSlots.phone = val;
        } else if (['gender', 'sex'].includes(key)) {
          rawSlots.gender = val.toLowerCase();
        } else if (['joiningdate', 'doj', 'hiredate'].includes(key)) {
          rawSlots.joining_date = val;
        } else if (['pan'].includes(key)) {
          rawSlots.pan = val.toUpperCase();
        }
      }
    }

    // 2. Inline Natural Language Regex Extractors (for unlabelled or mixed queries)
    if (!rawSlots.email) {
      const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
      if (emailMatch) rawSlots.email = emailMatch[1].trim();
    }

    if (!rawSlots.salary) {
      const salMatch = text.match(/(?:sal[a-z]*|pay|ctc|wage)\s*(?:is|:|=)?\s*(?:₹|rs\.?)?\s*(\d+(?:,\d+)*(?:\.\d+)?k?)/i);
      if (salMatch) {
        let rawVal = salMatch[1].toLowerCase().replace(/,/g, '');
        rawSlots.salary = rawVal.endsWith('k') ? parseFloat(rawVal.replace('k', '')) * 1000 : parseFloat(rawVal);
      }
    }

    if (!rawSlots.position) {
      const posMatch = text.match(/(?:pos[a-z]*|desig[a-z]*|role|title|job)\s*(?:is|:|=)?\s*([A-Za-z0-9\s]+?)(?:\||,|$|\bsal|\bemail|\bdep|\bname|\bphone|\bgender)/i);
      if (posMatch && posMatch[1].trim().length > 1 && !['is', 'a', 'the', 'new', 'an'].includes(posMatch[1].trim().toLowerCase())) {
        rawSlots.position = posMatch[1].trim();
      }
    }

    if (!rawSlots.department_name) {
      const deptMatch = text.match(/(?:dep[a-z]*|team)\s*(?:is|:|=)?\s*([A-Za-z0-9\s]+?)(?:\||,|$|\bsal|\bemail|\bpos|\bdesig|\bname|\bphone|\bgender)/i);
      if (deptMatch && deptMatch[1].trim().length > 1 && !['is', 'a', 'the', 'new', 'an'].includes(deptMatch[1].trim().toLowerCase())) {
        rawSlots.department_name = deptMatch[1].trim();
      }
    }

    if (!rawSlots.phone) {
      const phoneMatch = text.match(/(?:phone|mob[a-z]*|contact|cell)\s*(?:is|:|=)?\s*(\+?\d[\d\s-]{8,14}\d)/i);
      if (phoneMatch) rawSlots.phone = phoneMatch[1].trim();
    }

    if (!rawSlots.gender) {
      const genderMatch = text.match(/(?:gender|sex)\s*(?:is|:|=)?\s*(male|female|other)/i);
      if (genderMatch) rawSlots.gender = genderMatch[1].toLowerCase().trim();
    }

    if (!rawSlots.first_name) {
      const nameMatch = text.match(/(?:named\s+|name\s*(?:is|:|=)\s*|employe[a-z]*\s+named\s+)([A-Za-z]+(?:\s+[A-Za-z]+)?)/i);
      if (nameMatch) {
        const parts = nameMatch[1].trim().split(/\s+/);
        if (!['is', 'a', 'new', 'an', 'the', 'named'].includes(parts[0].toLowerCase())) {
          rawSlots.first_name = parts[0];
          if (parts.length > 1) rawSlots.last_name = parts.slice(1).join(' ');
        }
      }
    }

    // 3. Contextual Single-Value Fallback (when user responds field-by-field without labels)
    const existing = conversationState.getWorkflowSlots(sessionId, 'create_employee') || {};
    const cleanText = text.trim();
    if (!rawSlots.email && cleanText.includes('@') && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanText)) {
      rawSlots.email = cleanText;
    } else if (!rawSlots.salary && /^(?:₹|rs\.?)?\s*(\d+(?:,\d+)*(?:\.\d+)?k?)$/i.test(cleanText)) {
      const match = cleanText.match(/^(?:₹|rs\.?)?\s*(\d+(?:,\d+)*(?:\.\d+)?k?)$/i);
      let sVal = match[1].toLowerCase().replace(/,/g, '');
      rawSlots.salary = sVal.endsWith('k') ? parseFloat(sVal.replace('k', '')) * 1000 : parseFloat(sVal);
    } else if (!rawSlots.joining_date && /^\d{4}-\d{2}-\d{2}$/.test(cleanText)) {
      rawSlots.joining_date = cleanText;
    } else if (Object.keys(existing).length > 0 && !cleanText.includes('\n') && cleanText.length < 50) {
      const isCommand = ['create', 'add', 'hire', 'onboard', 'cancel', 'reset', 'exit'].some(c => cleanText.toLowerCase().startsWith(c));
      if (!isCommand) {
        if (!existing.first_name && !rawSlots.first_name && /^[A-Za-z\s]{2,40}$/.test(cleanText)) {
          const parts = cleanText.split(/\s+/);
          rawSlots.first_name = parts[0];
          if (parts.length > 1) rawSlots.last_name = parts.slice(1).join(' ');
        } else if (existing.first_name && !existing.department_name && !rawSlots.department_name && !existing.email) {
          // If email is missing, we don't guess dept yet unless specified
        } else if (existing.first_name && existing.email && !existing.department_name && !rawSlots.department_name) {
          rawSlots.department_name = cleanText;
        } else if (existing.first_name && existing.email && existing.department_name && !existing.position && !rawSlots.position) {
          rawSlots.position = cleanText;
        }
      }
    }

    // Merge into session state
    return conversationState.updateWorkflowSlots(sessionId, 'create_employee', rawSlots);
  }

  /**
   * Keyword-Presence Scoring & Deterministic Fallback Router
   */
  _heuristicAgentRouter(query, conversationHistory = [], role = 'employee', isSuperAdmin = false, sessionId = 'default') {
    const q = query.toLowerCase();
    const tokens = q.split(/[^a-z0-9_#@]+/).filter(Boolean);
    const hasToken = (token) => tokens.includes(token);
    const hasAnyToken = (list) => list.some(t => tokens.includes(t) || q.includes(t));

    const lastBotMsg = [...(conversationHistory || [])].reverse().find(m => m.sender !== 'user')?.text || '';
    const isOngoingEmployeeWizard = lastBotMsg.includes('employee profile') ||
      lastBotMsg.includes('Information Collected So Far') ||
      lastBotMsg.includes('Required details from HR') ||
      lastBotMsg.includes('required details from HR') ||
      lastBotMsg.includes('You can answer these one at a time');

    // 1. Employee Creation Intent Scoring
    const createActions = ['create', 'add', 'hire', 'onboard', 'new', 'register'];
    const employeeTargets = ['employee', 'staff', 'worker', 'profile', 'member', 'person', 'candidate', 'user'];
    const hasCreateAction = hasAnyToken(createActions);
    const hasEmployeeTarget = hasAnyToken(employeeTargets);
    const hasSlotKeywords = (hasToken('name') || q.includes('named')) && (hasAnyToken(['sal', 'salary', 'email', 'pos', 'position', 'dept', 'department']));

    if ((hasCreateAction && hasEmployeeTarget) || hasSlotKeywords || isOngoingEmployeeWizard) {
      const slots = this._extractSlots(query, sessionId);

      // Validate required fields
      const missing = [];
      if (!slots.first_name) missing.push('1️⃣ **Full Name** (e.g. Sarah Connor)');
      if (!slots.email) missing.push('2️⃣ **Work Email** (e.g. sarah@company.com)');
      if (!slots.position) missing.push('3️⃣ **Job Designation / Role** (e.g. Senior Software Engineer)');
      if (!slots.department_name) missing.push('4️⃣ **Department** (e.g. Engineering, Sales, HR)');
      if (!slots.salary) missing.push('5️⃣ **Monthly Base Salary (₹)**');

      if (missing.length > 0) {
        const collectedList = [];
        if (slots.first_name) collectedList.push(`• **Full Name**: ${slots.first_name} ${slots.last_name || ''}`.trim());
        if (slots.email) collectedList.push(`• **Work Email**: ${slots.email}`);
        if (slots.position) collectedList.push(`• **Designation**: ${slots.position}`);
        if (slots.department_name) collectedList.push(`• **Department**: ${slots.department_name}`);
        if (slots.salary) collectedList.push(`• **Monthly Salary**: ₹${Number(slots.salary).toLocaleString('en-IN')}`);
        if (slots.phone) collectedList.push(`• **Phone**: ${slots.phone}`);
        if (slots.gender) collectedList.push(`• **Gender**: ${slots.gender.toUpperCase()}`);

        const openers = [
          "To register this employee profile, I need a few mandatory details:",
          "Please share the following required parameters to complete the onboarding record:",
          "I will set up this employee record. Kindly provide the missing details below:"
        ];
        const randomOpener = openers[Math.floor(Math.random() * openers.length)];

        let reply = `${randomOpener}\n\n`;
        if (collectedList.length > 0) {
          reply += `📋 **Details Received:**\n${collectedList.join('\n')}\n\n`;
        }
        reply += `👉 **Pending Fields:**\n${missing.join('\n')}\n\n`;
        reply += `You can provide these individually, or copy and paste this filled in:\n\n` +
          `Full Name: ${slots.first_name ? `${slots.first_name} ${slots.last_name || ''}`.trim() : ''}\n` +
          `Email: ${slots.email || ''}\n` +
          `Department: ${slots.department_name || ''}\n` +
          `Designation: ${slots.position || ''}\n` +
          `Monthly Salary: ${slots.salary || ''}\n` +
          `Joining Date: ${slots.joining_date || ''}`;

        return { should_call_tool: false, direct_reply: reply };
      }

      conversationState.clearWorkflow(sessionId);
      return {
        should_call_tool: true,
        tool_name: 'createEmployee',
        tool_arguments: slots
      };
    }

    // 2. Company Policies Check (high priority if rules, policy, or guidelines mentioned)
    if (hasAnyToken(['policy', 'policies', 'rules', 'handbook', 'guidelines', 'threshold', 'probation', 'working hours', 'work hours', 'overtime'])) {
      return { should_call_tool: true, tool_name: 'getPolicies', tool_arguments: { policy_name: 'all' } };
    }

    // 3. Employee Deactivation / Termination
    const termActions = ['terminate', 'deactivate', 'remove', 'fire', 'offboard', 'delete'];
    if (hasAnyToken(termActions) && hasAnyToken(employeeTargets)) {
      const words = query.split(/\s+/).filter(w => !['terminate', 'deactivate', 'remove', 'fire', 'employee', 'please', 'the', 'an', 'a', 'this', 'worker', 'staff'].includes(w.toLowerCase()));
      const targetName = words.join(' ').trim();
      if (!targetName) {
        return {
          should_call_tool: false,
          direct_reply: 'Which employee would you like to deactivate or terminate? Please specify their **Full Name** or **Employee Code**.'
        };
      }
      return { should_call_tool: true, tool_name: 'deactivateEmployee', tool_arguments: { employee_name: targetName, reason: 'Deactivated via HR operations' } };
    }

    // 4. Missing Punches / Unpunched / Unclocked Check
    if (hasAnyToken(['missing', 'unpunched', 'unclocked', 'forgot']) && hasAnyToken(['punch', 'punches', 'clock', 'clockout', 'clock-out', 'attendance', 'records'])) {
      return { should_call_tool: true, tool_name: 'getMissingPunches', tool_arguments: { limit: 10 } };
    }

    // 5. Leave Balance & PTO Check
    const isLeaveBalanceQuery = (hasAnyToken(['leave', 'leaves', 'pto', 'vacation', 'time-off', 'timeoff', 'time off', 'paid time off']) &&
      hasAnyToken(['balance', 'remaining', 'left', 'available', 'quota', 'how many', 'status', 'check', 'my', 'days', 'view', 'get'])) ||
      (q.includes('holiday') && hasAnyToken(['balance', 'remaining', 'left', 'available']));

    if (isLeaveBalanceQuery) {
      const ignore = ['what', 'is', 'my', 'the', 'leave', 'leaves', 'balance', 'remaining', 'for', 'of', 'how', 'many', 'do', 'i', 'have', 'left', 'pto', 'vacation', 'status', 'view', 'paid', 'time', 'off', 'holiday'];
      const words = query.split(/\s+/).filter(w => !ignore.includes(w.toLowerCase()));
      const empTarget = words.join(' ').trim();
      return { should_call_tool: true, tool_name: 'getLeaveBalance', tool_arguments: empTarget ? { employee_name: empTarget } : {} };
    }

    // 6. Approve Leave
    if (hasAnyToken(['approve', 'grant', 'accept']) && hasAnyToken(['leave', 'leaves', 'pto', 'request', 'application'])) {
      const idMatch = query.match(/#?(\d+)/);
      return { should_call_tool: true, tool_name: 'approveLeave', tool_arguments: idMatch ? { leave_id: parseInt(idMatch[1], 10) } : {} };
    }

    // 7. Apply Leave
    if (hasAnyToken(['apply', 'request', 'take', 'book', 'submit']) && hasAnyToken(['leave', 'leaves', 'vacation', 'time-off', 'timeoff', 'time off', 'pto'])) {
      return {
        should_call_tool: false,
        direct_reply: `I can help submit your leave request! 🏖️\n\nPlease let me know:\n1️⃣ **Leave Type** (Annual, Sick, Casual, Unpaid)\n2️⃣ **Start Date & End Date** (YYYY-MM-DD)\n3️⃣ **Reason for absence**`
      };
    }

    // 8. View Leave Requests (General)
    if (hasAnyToken(['leave', 'leaves', 'pto']) && hasAnyToken(['requests', 'applications', 'pending', 'approvals', 'status'])) {
      return { should_call_tool: true, tool_name: 'getLeaveRequests', tool_arguments: { status: 'pending' } };
    }

    // 9. Employee Search / Directory
    const searchActions = ['search', 'find', 'lookup', 'look', 'who', 'show', 'list', 'filter', 'get', 'directory'];
    const isWhoQuery = (q.startsWith('who is') || q.includes('who is')) && !hasAnyToken(['absent', 'present', 'late', 'on leave']);
    if (isWhoQuery || (hasAnyToken(searchActions) && hasAnyToken(['employee', 'employees', 'staff', 'worker', 'workers', 'team', 'profiles', 'people', 'colleague']))) {
      const ignore = ['search', 'for', 'find', 'who', 'is', 'the', 'look', 'up', 'employee', 'employees', 'named', 'profile', 'profiles', 'show', 'list', 'all', 'directory'];
      const words = query.split(/\s+/).filter(w => !ignore.includes(w.toLowerCase()));
      const target = words.join(' ').trim() || 'all';
      return { should_call_tool: true, tool_name: 'searchEmployees', tool_arguments: { query_text: target } };
    }

    // 10. Attendance Regularization
    if (hasAnyToken(['regularize', 'regularization', 'adjust']) || (hasToken('mark') && hasAnyToken(['attendance', 'present', 'absent']))) {
      const relDate = resolveRelativeDate(query) || formatDate(new Date());
      return { should_call_tool: true, tool_name: 'regularizeAttendance', tool_arguments: { date: relDate, status: 'present' } };
    }

    // 11. Attendance Summary
    if (hasAnyToken(['attendance', 'present', 'absent', 'punctuality', 'clock-in', 'clock-ins', 'clock in', 'clock', 'punches'])) {
      const relDate = resolveRelativeDate(query);
      return { should_call_tool: true, tool_name: 'getAttendanceSummary', tool_arguments: { date: relDate || (q.includes('today') ? formatDate(new Date()) : null) } };
    }

    // 12. Finalize Payroll
    if (hasAnyToken(['finalize', 'run', 'process', 'close', 'disburse', 'execute']) && hasAnyToken(['payroll', 'salaries', 'payout'])) {
      const period = resolveRelativePeriod(query);
      return { should_call_tool: true, tool_name: 'finalizePayroll', tool_arguments: { month: period.month, year: period.year } };
    }

    // 13. Payroll Cost Analysis & Variance
    if (hasAnyToken(['payroll', 'salaries', 'compensation']) && hasAnyToken(['cost', 'costs', 'expense', 'expenses', 'spend', 'analysis', 'budget', 'variance', 'increase'])) {
      if (q.includes('variance') || q.includes('increase') || q.includes('why') || q.includes('difference')) {
        return { should_call_tool: true, tool_name: 'explainPayrollVariance', tool_arguments: {} };
      }
      return { should_call_tool: true, tool_name: 'getPayrollCostAnalysis', tool_arguments: {} };
    }

    // 14. Salary & Payslip Info
    if (hasAnyToken(['salary', 'payslip', 'pay', 'ctc', 'compensation', 'earnings', 'deductions', 'pf', 'net pay', 'wage'])) {
      const ignore = ['what', 'is', 'my', 'the', 'salary', 'payslip', 'breakdown', 'for', 'of', 'show', 'view', 'get', 'info', 'net', 'pay'];
      const words = query.split(/\s+/).filter(w => !ignore.includes(w.toLowerCase()));
      const empTarget = words.join(' ').trim();
      return { should_call_tool: true, tool_name: 'getSalary', tool_arguments: empTarget ? { employee_name: empTarget } : {} };
    }

    // 15. Headcount & Analytics
    if (hasAnyToken(['headcount', 'head count', 'total employees', 'total staff', 'employee count', 'workforce', 'strength'])) {
      return { should_call_tool: true, tool_name: 'getHeadcount', tool_arguments: {} };
    }

    // 16. Departments
    if (hasAnyToken(['department', 'departments', 'teams', 'divisions', 'org structure'])) {
      return { should_call_tool: true, tool_name: 'getDepartments', tool_arguments: {} };
    }

    // 17. Holidays
    if (hasAnyToken(['holiday', 'holidays', 'calendar', 'days off', 'festival'])) {
      return { should_call_tool: true, tool_name: 'getHolidays', tool_arguments: {} };
    }

    // 18. Goals & OKRs
    if (hasAnyToken(['goal', 'goals', 'okr', 'okrs', 'kpi', 'performance', 'target', 'targets', 'appraisal'])) {
      return { should_call_tool: true, tool_name: 'getGoals', tool_arguments: {} };
    }

    // 19. Super Admin Platform Health
    if (isSuperAdmin && hasAnyToken(['tenant', 'tenants', 'mrr', 'platform', 'saas', 'subscriptions', 'revenue'])) {
      return { should_call_tool: true, tool_name: 'getSaaSOPSOverview', tool_arguments: {} };
    }

    // 20. Company / Tenant Subscription Plan & Limits (handles typos like "mysusbcription")
    if (hasAnyToken(['subscription', 'subscriptions', 'susbcription', 'mysusbcription', 'pricing', 'tier', 'upgrade plan', 'billing plan', 'employee limit', 'quota']) ||
        (hasAnyToken(['plan', 'billing']) && hasAnyToken(['my', 'our', 'current', 'about', 'what', 'details', 'info', 'check']))) {
      return { should_call_tool: true, tool_name: 'getTenantSubscription', tool_arguments: {} };
    }

    return {
      should_call_tool: false,
      direct_reply: 'I am your HR AI Operations Agent. You can ask me to search employees, check attendance & missing punches, view leave balances, analyze payroll costs, check your subscription plan, manage OKRs, or retrieve company policies!'
    };
  }

  /**
   * Generates proactive suggested next steps based on executed tool outcome
   */
  _computeSuggestedNextActions(toolName, toolResult) {
    if (!toolResult || !toolResult.success) return [];

    const suggestionsMap = {
      createEmployee: [
        { label: '🎯 Set Leave Balance Quota', prompt: `Set up standard annual leave balance for new employee` },
        { label: '💻 Assign Hardware Assets', prompt: `Assign laptop and workstation assets to this new employee` },
        { label: '📋 View Onboarding Checklist', prompt: `Show onboarding document requirements for this employee` }
      ],
      deactivateEmployee: [
        { label: '💼 Process F&F Settlement', prompt: `Initiate Full & Final settlement and leave encashment calculations` },
        { label: '📦 Asset Return Checklist', prompt: `View assets assigned to this employee for recovery` },
        { label: '🔒 Revoke System Access', prompt: `Confirm IT login revocation and generate relieving letter` }
      ],
      updateEmployee: [
        { label: '🔍 View Updated Profile', prompt: `Show full profile details for this employee` },
        { label: '💰 Check Payroll Impact', prompt: `Recalculate monthly salary deductions with new compensation` }
      ],
      mark_attendance: [
        { label: '📊 Monthly Attendance Rate', prompt: `Show attendance summary for this month` },
        { label: '⚠️ Check Missing Punches', prompt: `List all missing punches requiring regularization` }
      ],
      regularizeAttendance: [
        { label: '📅 View Updated Shift Logs', prompt: `Show attendance records for this week` },
        { label: '✅ Review Pending Requests', prompt: `Check if there are any remaining pending regularization requests` }
      ],
      createLeaveRequest: [
        { label: '🏖️ Check Remaining Leave Balance', prompt: `Show my remaining leave balance` },
        { label: '👥 Team Absence Calendar', prompt: `Who is on leave from my department this week?` }
      ],
      approveLeave: [
        { label: '📋 Next Pending Approvals', prompt: `Show next pending leave requests awaiting my approval` },
        { label: '📈 Department Staffing Impact', prompt: `Check department coverage for upcoming week` }
      ],
      calculatePayroll: [
        { label: '📝 Finalize Payroll Run', prompt: `Finalize payroll and lock registers for this month` },
        { label: '📑 Download Salary Sheet', prompt: `Export bank transfer and salary register summary` }
      ]
    };

    return suggestionsMap[toolName] || [
      { label: '🏢 View Organization Stats', prompt: `Show current active headcount and department breakdown` },
      { label: '📜 Check Company Policies', prompt: `What are the company policies regarding leave and working hours?` }
    ];
  }
}

module.exports = new HRAIOperationsOrchestrator();
