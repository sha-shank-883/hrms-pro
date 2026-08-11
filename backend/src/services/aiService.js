const { query } = require('../config/database');
const { generateWithFallback, getActiveProvider, getAvailableProviders } = require('./ai/providerFactory');

const DAILY_AI_LIMIT = parseInt(process.env.DAILY_AI_LIMIT_PER_USER || '10');

const responseCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000;

const getCacheKey = (message) => {
  return message.toLowerCase().replace(/\s+/g, ' ').trim();
};

const getFromCache = (message) => {
  const key = getCacheKey(message);
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    responseCache.delete(key);
    return null;
  }
  return entry;
};

const setCache = (message, response, confidence, provider) => {
  const key = getCacheKey(message);
  responseCache.set(key, {
    response,
    confidence,
    provider,
    timestamp: Date.now()
  });
  if (responseCache.size > 2000) {
    const oldest = [...responseCache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
    if (oldest) responseCache.delete(oldest[0]);
  }
};

const checkDailyQuota = async (userId) => {
  if (!userId) return { allowed: true, remaining: DAILY_AI_LIMIT };

  try {
    const result = await query(
      `SELECT COUNT(*) as count FROM ai_logs
       WHERE user_id = $1 AND is_faq_match = false
       AND created_at >= CURRENT_DATE`,
      [userId]
    );
    const used = parseInt(result.rows[0].count);
    const remaining = Math.max(0, DAILY_AI_LIMIT - used);
    return { allowed: remaining > 0, remaining, used };
  } catch (error) {
    return { allowed: true, remaining: DAILY_AI_LIMIT };
  }
};

const getAIResponse = async (message, chatId = null, userId = null) => {
  const startTime = Date.now();

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return { success: false, error: 'Empty message', confidence: 0, needsTicket: false, provider: 'none' };
  }

  const cached = getFromCache(message);
  if (cached) {
    console.log(`[AI Service] Cache hit for: "${message.substring(0, 50)}..."`);
    return {
      success: true,
      response: cached.response,
      confidence: cached.confidence,
      provider: `${cached.provider}(cached)`,
      responseTimeMs: 0,
      fromCache: true
    };
  }

  const quota = await checkDailyQuota(userId);
  if (!quota.allowed) {
    console.log(`[AI Service] User ${userId} daily AI quota exhausted (${quota.used}/${DAILY_AI_LIMIT})`);
    return {
      success: false,
      error: `Daily AI query limit reached (${DAILY_AI_LIMIT}/day). A support ticket has been created for further assistance.`,
      confidence: 0,
      provider: 'quota',
      needsTicket: true,
      quotaExceeded: true
    };
  }

  const activeProvider = getActiveProvider();
  if (!activeProvider) {
    await logAIInteraction({ chatId, userId, query: message, response: null, provider: 'none', confidence: 0, responseTime: 0, isFAQMatch: false, metadata: { error: 'No AI provider configured' } });
    return { success: false, error: 'AI service is not configured. Set an AI provider API key in .env', confidence: 0, needsTicket: false, provider: 'none' };
  }

  try {
    const result = await generateWithFallback(message, chatId, userId);
    const responseTime = Date.now() - startTime;

    await logAIInteraction({ chatId, userId, query: message, response: result.response || null, provider: result.provider || 'unknown', confidence: result.confidence || 0, responseTime, isFAQMatch: false, metadata: { fromFallback: !!result.fromFallback, error: result.error || null } });

    if (result.success) {
      setCache(message, result.response, result.confidence, result.provider);
      return { success: true, response: result.response, confidence: result.confidence || 0, provider: result.provider, responseTimeMs: responseTime, fromFallback: !!result.fromFallback };
    }

    return { success: false, error: result.error || 'AI service unavailable. A support ticket has been created.', confidence: result.confidence || 0, provider: result.provider || 'unknown', needsTicket: result.needsTicket !== false, retryable: result.retryable || false };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('[AI Service] Unexpected error:', error.message);
    await logAIInteraction({ chatId, userId, query: message, response: null, provider: 'unknown', confidence: 0, responseTime, isFAQMatch: false, metadata: { error: error.message, stack: error.stack } });
    return { success: false, error: 'An unexpected error occurred. A support ticket has been created.', confidence: 0, provider: 'unknown', needsTicket: true };
  }
};

const logAIInteraction = async ({ chatId, userId, query: queryText, response, provider, confidence, responseTime, isFAQMatch, faqArticleId, metadata }) => {
  try {
    await query(
      `INSERT INTO ai_logs (chat_id, user_id, query_text, response_text, provider, confidence, is_faq_match, faq_article_id, response_time_ms, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [chatId, userId, queryText, response, provider, confidence || 0, isFAQMatch || false, faqArticleId || null, responseTime || 0, JSON.stringify(metadata || {})]
    );
  } catch (error) {
    console.error('[AI Service] Error logging AI interaction:', error.message);
  }
};

module.exports = {
  getAIResponse,
  logAIInteraction,
  getActiveProvider,
  getAvailableProviders
};
