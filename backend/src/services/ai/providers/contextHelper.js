const { query } = require('../../../config/database');

const inMemoryContext = new Map();
const CONTEXT_TTL = 30 * 60 * 1000;

const getConversationContext = async (chatId) => {
  try {
    const result = await query(
      `SELECT sender_type, message FROM support_messages
       WHERE chat_id = $1 AND sender_type IN ('user', 'ai')
       ORDER BY created_at DESC LIMIT 10`,
      [chatId]
    );
    return result.rows.reverse();
  } catch (error) {
    console.error('[ContextHelper] Error getting conversation context:', error);
    return [];
  }
};

const getMemoryContext = (chatId) => {
  if (!chatId) return [];
  const record = inMemoryContext.get(chatId);
  if (!record) return [];
  if (Date.now() - record.timestamp > CONTEXT_TTL) {
    inMemoryContext.delete(chatId);
    return [];
  }
  return record.history;
};

const updateMemoryContext = (chatId, userMessage, aiResponse) => {
  if (!chatId) return;
  const record = inMemoryContext.get(chatId) || { history: [], timestamp: Date.now() };
  record.history.push({ role: 'user', text: userMessage });
  record.history.push({ role: 'assistant', text: aiResponse });
  if (record.history.length > 20) {
    record.history = record.history.slice(-20);
  }
  record.timestamp = Date.now();
  inMemoryContext.set(chatId, record);
};

const clearMemoryContext = (chatId) => {
  inMemoryContext.delete(chatId);
};

module.exports = {
  getConversationContext,
  getMemoryContext,
  updateMemoryContext,
  clearMemoryContext
};
