const { getConversationContext } = require('./contextHelper');

const SYSTEM_PROMPT = `You are an HRMS support assistant helping users with attendance, payroll, leave management, employee onboarding, permissions, and HR workflows.

Available features: employee management, attendance tracking, leave management, payroll, tasks, performance reviews, recruitment, document management, chat, reports, analytics, settings, assets management, shifts, onboarding.

Answer concisely and helpfully. If you cannot resolve the issue, recommend creating a support ticket. Keep responses under 200 words. Be professional and friendly.`;

const RATE_LIMIT_WINDOW = 60000;
const RATE_LIMIT_MAX = 60;
const rateLimitStore = new Map();

const generateResponse = async (message, chatId = null, userId = null, options = {}) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      response: null,
      error: 'Groq API key not configured',
      needsTicket: true,
      confidence: 0,
      provider: 'groq'
    };
  }

  const rateCheck = checkRateLimit(userId);
  if (!rateCheck.allowed) {
    return {
      success: false, response: null,
      error: `Rate limit exceeded. Try again in ${rateCheck.retryAfter}s.`,
      needsTicket: true, confidence: 0, provider: 'groq'
    };
  }

  const model = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
  const baseUrl = 'https://api.groq.com/openai/v1/chat/completions';
  const startTime = Date.now();

  try {
    const conversationHistory = options.messages || (chatId ? await getConversationContext(chatId) : []);

    const messages = options.messages || [
      { role: 'system', content: options.systemInstruction || SYSTEM_PROMPT },
      ...conversationHistory.map(m => ({
        role: m.role || (m.sender_type === 'user' ? 'user' : 'assistant'),
        content: m.content || m.message
      })),
      { role: 'user', content: message }
    ];

    const reqBody = {
      model: model,
      messages,
      temperature: options.temperature !== undefined ? options.temperature : 0.7,
      max_tokens: options.maxOutputTokens || 1000
    };

    if (options.tools && options.tools.length > 0) {
      reqBody.tools = options.tools;
      reqBody.tool_choice = 'auto';
    }

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(reqBody)
    });

    if (!response.ok) {
      const errorBody = await response.text();
      const isQuota = response.status === 429 || response.status === 402;

      // If model not found, retry once with standard llama-3.1-8b-instant
      if (response.status === 404 && model !== 'llama-3.1-8b-instant') {
        reqBody.model = 'llama-3.1-8b-instant';
        const retryRes = await fetch(baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify(reqBody)
        });
        if (retryRes.ok) {
          const data = await retryRes.json();
          const choice = data.choices?.[0]?.message;
          const toolCalls = choice?.tool_calls;

          if (toolCalls && toolCalls.length > 0) {
            const tc = toolCalls[0];
            let parsedArgs = {};
            try { parsedArgs = JSON.parse(tc.function?.arguments || '{}'); } catch (_) {}
            return {
              success: true,
              hasFunctionCall: true,
              functionCall: {
                name: tc.function?.name,
                args: parsedArgs,
                toolCallId: tc.id
              },
              assistantMessage: choice,
              messages,
              provider: 'groq',
              model: 'llama-3.1-8b-instant',
              responseTimeMs: Date.now() - startTime
            };
          }

          const text = choice?.content || '';
          return {
            success: true,
            hasFunctionCall: false,
            response: text,
            confidence: estimateConfidence(text, message),
            provider: 'groq',
            model: 'llama-3.1-8b-instant',
            responseTimeMs: Date.now() - startTime
          };
        }
      }

      if (isQuota) {
        return {
          success: false, response: null,
          error: 'AI service is busy. Please try again shortly.',
          needsTicket: true, confidence: 0, provider: 'groq', retryable: true
        };
      }
      throw new Error(`Groq API error: ${response.status} ${errorBody}`);
    }

    const data = await response.json();
    const choice = data.choices?.[0]?.message;
    const toolCalls = choice?.tool_calls;
    const responseTime = Date.now() - startTime;

    if (toolCalls && toolCalls.length > 0) {
      const tc = toolCalls[0];
      let parsedArgs = {};
      try { parsedArgs = JSON.parse(tc.function?.arguments || '{}'); } catch (_) {}
      return {
        success: true,
        hasFunctionCall: true,
        functionCall: {
          name: tc.function?.name,
          args: parsedArgs,
          toolCallId: tc.id
        },
        assistantMessage: choice,
        messages,
        provider: 'groq',
        model,
        responseTimeMs
      };
    }

    const text = choice?.content || '';
    const confidence = estimateConfidence(text, message);

    return {
      success: true,
      hasFunctionCall: false,
      response: text,
      confidence,
      provider: 'groq',
      model,
      responseTimeMs: responseTime
    };
  } catch (error) {
    if (error.message?.includes('rate_limit') || error.message?.includes('429')) {
      return {
        success: false, response: null,
        error: 'AI service is busy. Please try again shortly.',
        needsTicket: true, confidence: 0, provider: 'groq', retryable: true
      };
    }
    throw error;
  }
};

const sendFunctionResult = async (messages, assistantMessage, toolCallId, toolResult) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  const model = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
  const baseUrl = 'https://api.groq.com/openai/v1/chat/completions';

  try {
    const updatedMessages = [
      ...messages,
      assistantMessage,
      {
        role: 'tool',
        tool_call_id: toolCallId,
        content: typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult)
      }
    ];

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: updatedMessages,
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (err) {
    console.warn('[GroqProvider] Error in sendFunctionResult:', err.message);
    return null;
  }
};

const checkRateLimit = (userId) => {
  const now = Date.now();
  const key = userId || 'anonymous';
  const record = rateLimitStore.get(key);
  if (!record || now - record.windowStart > RATE_LIMIT_WINDOW) {
    rateLimitStore.set(key, { windowStart: now, count: 1 });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }
  if (record.count >= RATE_LIMIT_MAX) {
    const retryAfter = Math.ceil((RATE_LIMIT_WINDOW - (now - record.windowStart)) / 1000);
    return { allowed: false, retryAfter };
  }
  record.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - record.count };
};

const estimateConfidence = (response, query) => {
  if (!response || response.length < 5) return 0.1;
  let score = 0.3;
  if (response.length > 10) score += 0.1;
  if (response.length > 50) score += 0.15;
  if (!response.includes('I\'m sorry') && !response.includes('I cannot help')) score += 0.1;
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const responseLower = response.toLowerCase();
  const matchedWords = queryWords.filter(w => responseLower.includes(w)).length;
  score += (queryWords.length > 0 ? matchedWords / queryWords.length : 0) * 0.2;
  if (/\d+\.\s/.test(response)) score += 0.1;
  return Math.min(1, Math.max(0, score));
};

module.exports = {
  name: 'groq',
  generateResponse,
  sendFunctionResult,
  estimateConfidence
};
