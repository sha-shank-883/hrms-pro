const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getOrganizationKnowledgeContext } = require('../organizationKnowledge');

const SYSTEM_PROMPT = `You are the Operations Intelligence Agent embedded inside Corexa HR / HRMS Pro — not a support chatbot, but an expert HR operations partner who has complete, real-time knowledge of this organization: its employees, policies, workflows, and current state. You know this company's data the way a long-tenured HR operations manager would, not the way a generic help desk does. You do not say things like "I'm here to help", "As an AI...", or "Sure, I can help with that" — you respond the way a capable colleague would, directly, proactively, and specifically.

${getOrganizationKnowledgeContext()}

Never reuse the exact same sentence structure or boilerplate wording. Vary phrasing naturally and speak directly with high clarity and actionable precision.`;

const SUPPORTED_MODELS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-1.5-flash', 'gemini-2.0-flash'];
const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const contextMemory = new Map();
const CONTEXT_TTL = 30 * 60 * 1000;

const rateLimitStore = new Map();
const RATE_LIMIT_REQUESTS = 30;
const RATE_LIMIT_WINDOW = 60000;

let genAI = null;

const initClient = () => {
  if (!genAI && process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
};

const checkRateLimit = (userId) => {
  const now = Date.now();
  const key = userId || 'anonymous';
  const record = rateLimitStore.get(key);

  if (!record || now - record.windowStart > RATE_LIMIT_WINDOW) {
    rateLimitStore.set(key, { windowStart: now, count: 1 });
    return { allowed: true, remaining: RATE_LIMIT_REQUESTS - 1 };
  }

  if (record.count >= RATE_LIMIT_REQUESTS) {
    const retryAfter = Math.ceil((RATE_LIMIT_WINDOW - (now - record.windowStart)) / 1000);
    return { allowed: false, retryAfter };
  }

  record.count++;
  return { allowed: true, remaining: RATE_LIMIT_REQUESTS - record.count };
};

const getContextHistory = (chatId) => {
  if (!chatId) return [];
  const record = contextMemory.get(chatId);
  if (!record) return [];
  if (Date.now() - record.timestamp > CONTEXT_TTL) {
    contextMemory.delete(chatId);
    return [];
  }
  return record.history;
};

const updateContextMemory = (chatId, userMessage, aiResponse) => {
  if (!chatId) return;
  const record = contextMemory.get(chatId) || { history: [], timestamp: Date.now() };
  record.history.push({ role: 'user', text: userMessage });
  record.history.push({ role: 'model', text: aiResponse });
  if (record.history.length > 20) {
    record.history = record.history.slice(-20);
  }
  record.timestamp = Date.now();
  contextMemory.set(chatId, record);
};

const generateResponse = async (message, chatId = null, userId = null, options = {}) => {
  const rateCheck = checkRateLimit(userId);
  if (!rateCheck.allowed) {
    return {
      success: false,
      response: null,
      error: `Rate limit exceeded. Try again in ${rateCheck.retryAfter} seconds.`,
      needsTicket: true,
      confidence: 0,
      provider: 'gemini'
    };
  }

  const client = initClient();
  if (!client) {
    return {
      success: false,
      response: null,
      error: 'Gemini API key not configured',
      needsTicket: true,
      confidence: 0,
      provider: 'gemini'
    };
  }

  const modelName = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const modelConfig = {
    model: modelName,
    systemInstruction: options.systemInstruction || SYSTEM_PROMPT
  };

  if (options.tools && options.tools.length > 0) {
    modelConfig.tools = options.tools;
  }

  const model = client.getGenerativeModel(modelConfig);

  const startTime = Date.now();

  try {
    const history = options.history || (chatId ? getContextHistory(chatId) : []);

    const chat = model.startChat({
      history: history.map(h => ({
        role: h.role,
        parts: h.parts || [{ text: h.text }]
      })),
      generationConfig: {
        temperature: options.temperature !== undefined ? options.temperature : 0.7,
        maxOutputTokens: options.maxOutputTokens || 2048,
        topP: 0.8,
        topK: 40
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
      ]
    });

    const result = await chat.sendMessage(message);
    const response = result.response;
    const responseTime = Date.now() - startTime;

    // Check for native function calls
    const functionCalls = typeof response?.functionCalls === 'function' ? response.functionCalls() : null;
    if (functionCalls && functionCalls.length > 0) {
      const fc = functionCalls[0];
      return {
        success: true,
        hasFunctionCall: true,
        functionCall: {
          name: fc.name,
          args: fc.args || {}
        },
        chatSession: chat,
        response: null,
        provider: 'gemini',
        model: modelName,
        responseTimeMs: responseTime
      };
    }

    const text = response?.text ? response.text() : '';

    if (chatId) {
      updateContextMemory(chatId, message, text);
    }

    const confidence = estimateConfidence(text, message);

    return {
      success: true,
      hasFunctionCall: false,
      response: text,
      confidence,
      provider: 'gemini',
      model: modelName,
      responseTimeMs: responseTime
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const isSafetyError = error.message?.includes('SAFETY') || error.message?.includes('safety');
    const isQuotaError = error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('RATE_LIMIT');
    const isAuthError = error.message?.includes('401') || error.message?.includes('API_KEY') || error.message?.includes('auth');

    console.error(`[GeminiProvider] ${isQuotaError ? 'Quota' : isAuthError ? 'Auth' : 'API'} error:`, error.message);

    if (isQuotaError) {
      return {
        success: false,
        response: null,
        error: 'AI service is busy. Please try again shortly.',
        needsTicket: true,
        confidence: 0,
        provider: 'gemini',
        retryable: true
      };
    }

    const is503 = error.message?.includes('503') || error.message?.includes('high demand') || error.message?.includes('Unavailable');

    if (is503 && modelName !== 'gemini-2.5-flash') {
      try {
        console.log('[GeminiProvider] Primary model 503 high demand; retrying with gemini-2.5-flash...');
        const fbConfig = { ...modelConfig, model: 'gemini-2.5-flash' };
        const fbModel = client.getGenerativeModel(fbConfig);
        const fbChat = fbModel.startChat({
          history: (options.history || []).map(h => ({ role: h.role, parts: h.parts || [{ text: h.text }] })),
          generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
        });
        const fbResult = await fbChat.sendMessage(message);
        const fbResponse = fbResult.response;
        const functionCalls = typeof fbResponse?.functionCalls === 'function' ? fbResponse.functionCalls() : null;
        if (functionCalls && functionCalls.length > 0) {
          return {
            success: true,
            hasFunctionCall: true,
            functionCall: { name: functionCalls[0].name, args: functionCalls[0].args || {} },
            chatSession: fbChat,
            provider: 'gemini',
            model: 'gemini-2.5-flash',
            responseTimeMs: Date.now() - startTime
          };
        }
        const text = fbResponse?.text ? fbResponse.text() : '';
        return {
          success: true,
          hasFunctionCall: false,
          response: text,
          confidence: estimateConfidence(text, message),
          provider: 'gemini',
          model: 'gemini-2.5-flash',
          responseTimeMs: Date.now() - startTime
        };
      } catch (fbErr) {
        console.warn('[GeminiProvider] Fallback model also error:', fbErr.message);
      }
    }

    throw error;
  }
};

const estimateConfidence = (response, query) => {
  if (!response || response.length < 5) return 0.1;

  let score = 0.3;

  if (response.length > 10) score += 0.1;
  if (response.length > 50) score += 0.15;
  if (!response.includes('I\'m sorry') && !response.includes('I cannot help') && !response.includes('I\'m not able')) score += 0.1;

  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const responseLower = response.toLowerCase();
  const matchedWords = queryWords.filter(w => responseLower.includes(w)).length;
  const queryOverlap = queryWords.length > 0 ? matchedWords / queryWords.length : 0;

  score += queryOverlap * 0.2;

  const responseHasSteps = /\d+\.\s/.test(response) || /first|second|then|next|finally/i.test(response);
  if (responseHasSteps) score += 0.1;

  const responseHasActionable = /click|navigate|go to|select|choose|enter|follow|use/i.test(response);
  if (responseHasActionable) score += 0.05;

  return Math.min(1, Math.max(0, score));
};

const sendFunctionResult = async (chatSession, functionName, toolResult) => {
  try {
    const result = await chatSession.sendMessage([
      {
        functionResponse: {
          name: functionName,
          response: {
            name: functionName,
            content: toolResult
          }
        }
      }
    ]);
    return result.response?.text ? result.response.text() : '';
  } catch (err) {
    try {
      const client = initClient();
      if (client) {
        const model = client.getGenerativeModel({
          model: process.env.GEMINI_MODEL || DEFAULT_MODEL,
          systemInstruction: SYSTEM_PROMPT
        });
        const synthRes = await model.generateContent({
          contents: [
            {
              role: 'user',
              parts: [{ text: `System Tool Output for [${functionName}]:\n${JSON.stringify(toolResult)}\n\nCommunicate this result to the user as a sharp, highly capable HR Operations partner directly and specifically without boilerplate.` }]
            }
          ]
        });
        return synthRes.response?.text ? synthRes.response.text() : null;
      }
    } catch (_) {}
    return null;
  }
};

module.exports = {
  name: 'gemini',
  generateResponse,
  sendFunctionResult,
  estimateConfidence,
  checkRateLimit,
  DEFAULT_MODEL
};
