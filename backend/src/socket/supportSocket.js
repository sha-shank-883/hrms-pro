const { query, tenantStorage } = require('../config/database');
const { getFAQMatch } = require('../services/faqService');
const { getAIResponse } = require('../services/aiService');
const { createTicketFromChat } = require('../services/ticketService');
const { notifyNewTicket } = require('../services/supportEmailService');

const SUPPORT_EVENTS = {
  JOIN_SUPPORT: 'support:join',
  LEAVE_SUPPORT: 'support:leave',
  SEND_MESSAGE: 'support:send_message',
  RECEIVE_MESSAGE: 'support:receive_message',
  TYPING: 'support:typing',
  STOP_TYPING: 'support:stop_typing',
  MARK_READ: 'support:mark_read',
  AGENT_ASSIGN: 'support:agent_assign',
  AGENT_JOIN: 'support:agent_join',
  HUMAN_HANDOFF: 'support:human_handoff',
  ERROR: 'support:error'
};

const connectedAgents = new Map();
const activeSupportUsers = new Map();

const setupSupportSocket = (io, connectedUsers) => {
  io.on('connection', (socket) => {
    const tenantId = socket.handshake.query.tenantId || 'tenant_default';
    socket.tenantId = tenantId;

    socket.on(SUPPORT_EVENTS.JOIN_SUPPORT, (data) => {
      if (!data) return;
      tenantStorage.run(socket.tenantId, async () => {
        try {
          const { userId, role } = data;
          if (!userId) return;

          socket.supportUserId = userId;
          socket.supportRole = role;

          if (role === 'admin' || role === 'manager') {
            socket.join(`support_agents_${tenantId}`);
            connectedAgents.set(userId, { socketId: socket.id, userId, role, tenantId });
            updateAgentAvailability(userId, true);
          } else {
            socket.join(`support_user_${userId}`);
            activeSupportUsers.set(userId, { socketId: socket.id, userId, tenantId });
          }

          console.log(`[SupportSocket] User ${userId} (${role}) joined support. Tenant: ${tenantId}`);
        } catch (error) {
          console.error('[SupportSocket] Error in join support:', error);
        }
      });
    });

    socket.on(SUPPORT_EVENTS.SEND_MESSAGE, (data) => {
      if (!data) return;
      tenantStorage.run(socket.tenantId, async () => {
        try {
          const { chatId, message, attachmentUrl, attachmentName, attachmentSize } = data;
          const userId = socket.supportUserId;
          const role = socket.supportRole;

          if (!userId || !chatId || !message) {
            socket.emit(SUPPORT_EVENTS.ERROR, { message: 'Invalid message data' });
            return;
          }

          let chat = await getChat(chatId);
          if (!chat) {
            socket.emit(SUPPORT_EVENTS.ERROR, { message: 'Chat not found' });
            return;
          }

          const senderType = (role === 'admin' || role === 'manager') ? 'agent' : 'user';

          const msgResult = await query(
            `INSERT INTO support_messages (chat_id, sender_id, sender_type, message, attachment_url, attachment_name, attachment_size)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [chatId, userId, senderType, message, attachmentUrl || null, attachmentName || null, attachmentSize || null]
          );

          const savedMessage = msgResult.rows[0];

          if (chat.is_ai_active && !chat.agent_id) {
            await processAutoReply(io, socket, chatId, message, userId, socket.tenantId, savedMessage.message_id);
          } else if (senderType === 'user') {
            await query(
              `UPDATE support_chats SET unread_count = unread_count + 1, updated_at = NOW() WHERE chat_id = $1`,
              [chatId]
            );

            io.to(`support_agents_${tenantId}`).emit(SUPPORT_EVENTS.RECEIVE_MESSAGE, {
              ...savedMessage,
              chat
            });
          } else {
            await query(
              `UPDATE support_chats SET unread_count = 0, updated_at = NOW() WHERE chat_id = $1`,
              [chatId]
            );

            io.to(`support_user_${chat.user_id}`).emit(SUPPORT_EVENTS.RECEIVE_MESSAGE, savedMessage);

            if (chat.agent_id) {
              const agent = connectedAgents.get(chat.agent_id);
              if (agent) {
                io.to(agent.socketId).emit(SUPPORT_EVENTS.RECEIVE_MESSAGE, savedMessage);
              }
            }
          }

        } catch (error) {
          console.error('[SupportSocket] Error sending message:', error);
          socket.emit(SUPPORT_EVENTS.ERROR, { message: 'Failed to send message' });
        }
      });
    });

    socket.on(SUPPORT_EVENTS.TYPING, (data) => {
      if (!data) return;
      const { chatId, userId } = data;
      const role = socket.supportRole;

      if (role === 'admin' || role === 'manager') {
        socket.to(`support_user_${userId}`).emit(SUPPORT_EVENTS.TYPING, { chatId, userId });
      } else {
        io.to(`support_agents_${tenantId}`).emit(SUPPORT_EVENTS.TYPING, { chatId, userId });
      }
    });

    socket.on(SUPPORT_EVENTS.STOP_TYPING, (data) => {
      if (!data) return;
      const { chatId, userId } = data;
      const role = socket.supportRole;

      if (role === 'admin' || role === 'manager') {
        socket.to(`support_user_${userId}`).emit(SUPPORT_EVENTS.STOP_TYPING, { chatId, userId });
      } else {
        io.to(`support_agents_${tenantId}`).emit(SUPPORT_EVENTS.STOP_TYPING, { chatId, userId });
      }
    });

    socket.on(SUPPORT_EVENTS.MARK_READ, (data) => {
      if (!data) return;
      tenantStorage.run(socket.tenantId, async () => {
        try {
          const { chatId } = data;
          await query(
            `UPDATE support_messages SET is_read = true, read_at = NOW() WHERE chat_id = $1 AND sender_type != 'agent' AND is_read = false`,
            [chatId]
          );
          await query(`UPDATE support_chats SET unread_count = 0 WHERE chat_id = $1`, [chatId]);
        } catch (error) {
          console.error('[SupportSocket] Error marking read:', error);
        }
      });
    });

    socket.on(SUPPORT_EVENTS.AGENT_JOIN, (data) => {
      if (!data) return;
      tenantStorage.run(socket.tenantId, async () => {
        try {
          const { chatId, agentId } = data;
          await query(
            `UPDATE support_chats SET agent_id = $1, status = 'active', is_ai_active = false WHERE chat_id = $2`,
            [agentId, chatId]
          );

          const chat = await getChat(chatId);
          if (chat) {
            io.to(`support_user_${chat.user_id}`).emit(SUPPORT_EVENTS.AGENT_JOIN, { chatId, agentId });

            await query(
              `INSERT INTO support_messages (chat_id, sender_id, sender_type, message_type, message)
               VALUES ($1, $2, 'system', 'handoff', 'An agent has joined the conversation.')`,
              [chatId, agentId]
            );
          }
        } catch (error) {
          console.error('[SupportSocket] Error agent join:', error);
        }
      });
    });

    socket.on(SUPPORT_EVENTS.HUMAN_HANDOFF, (data) => {
      if (!data) return;
      tenantStorage.run(socket.tenantId, async () => {
        try {
          const { chatId } = data;
          await query(
            `UPDATE support_chats SET is_ai_active = false, status = 'waiting' WHERE chat_id = $1`,
            [chatId]
          );

          await query(
            `INSERT INTO support_messages (chat_id, sender_id, sender_type, message_type, message)
             VALUES ($1, NULL, 'system', 'handoff', 'Requesting human agent assistance...')`,
            [chatId]
          );

          io.to(`support_agents_${tenantId}`).emit(SUPPORT_EVENTS.HUMAN_HANDOFF, { chatId });
        } catch (error) {
          console.error('[SupportSocket] Error human handoff:', error);
        }
      });
    });

    socket.on('disconnect', () => {
      if (socket.supportUserId) {
        if (socket.supportRole === 'admin' || socket.supportRole === 'manager') {
          connectedAgents.delete(socket.supportUserId);
        } else {
          activeSupportUsers.delete(socket.supportUserId);
        }
      }
    });
  });
};

const emitResponse = (io, socket, userId, data) => {
  socket.emit(SUPPORT_EVENTS.RECEIVE_MESSAGE, data);
};

const processAutoReply = async (io, socket, chatId, message, userId, tenantId, messageId) => {
  try {
    const faqResult = await getFAQMatch(message);

    if (faqResult.matched && faqResult.article) {
      const faqReply = await query(
        `INSERT INTO support_messages (chat_id, sender_id, sender_type, message_type, message, metadata)
         VALUES ($1, NULL, 'ai', 'faq', $2, $3) RETURNING *`,
        [chatId, faqResult.article.answer, JSON.stringify({ articleId: faqResult.article.article_id, confidence: faqResult.confidence })]
      );

      emitResponse(io, socket, userId, faqReply.rows[0]);
      return;
    }

    const aiResult = await getAIResponse(message, chatId, userId);

    if (aiResult.success) {
      const aiReply = await query(
        `INSERT INTO support_messages (chat_id, sender_id, sender_type, message_type, message, metadata)
         VALUES ($1, NULL, 'ai', 'ai', $2, $3) RETURNING *`,
        [chatId, aiResult.response, JSON.stringify({ confidence: aiResult.confidence, provider: aiResult.provider })]
      );

      emitResponse(io, socket, userId, aiReply.rows[0]);

      if (aiResult.confidence < 0.4) {
        const ticket = await createTicketFromChat(chatId, userId, message);
        const systemMsg = await query(
          `INSERT INTO support_messages (chat_id, sender_id, sender_type, message_type, message)
           VALUES ($1, NULL, 'system', 'system', $2) RETURNING *`,
          [chatId, `A support ticket has been created: ${ticket.ticket_number}. An agent will follow up.`]
        );

        emitResponse(io, socket, userId, systemMsg.rows[0]);
        io.to(`support_agents_${tenantId}`).emit('support:new_ticket', { ticket, chatId });
      }
    } else if (aiResult.needsTicket) {
      const ticket = await createTicketFromChat(chatId, userId, message);
      const systemMsg = await query(
        `INSERT INTO support_messages (chat_id, sender_id, sender_type, message_type, message)
         VALUES ($1, NULL, 'system', 'system', $2) RETURNING *`,
        [chatId, `A support ticket has been created: ${ticket.ticket_number}. An agent will follow up.`]
      );

      emitResponse(io, socket, userId, systemMsg.rows[0]);
      io.to(`support_agents_${tenantId}`).emit('support:new_ticket', { ticket, chatId });
    } else {
      const fallbackMsg = await query(
        `INSERT INTO support_messages (chat_id, sender_id, sender_type, message_type, message)
         VALUES ($1, NULL, 'system', 'system', $2) RETURNING *`,
        [chatId, 'AI service is currently unavailable. A support agent has been notified and will assist you shortly.']
      );
      emitResponse(io, socket, userId, fallbackMsg.rows[0]);
    }
  } catch (error) {
    console.error('[SupportSocket] Error processing auto-reply:', error);
    try {
      const errMsg = await query(
        `INSERT INTO support_messages (chat_id, sender_id, sender_type, message_type, message)
         VALUES ($1, NULL, 'system', 'system', $2) RETURNING *`,
        [chatId, 'Sorry, I encountered an error processing your request. A support agent has been notified.']
      );
      emitResponse(io, socket, userId, errMsg.rows[0]);
    } catch (e) {
      console.error('[SupportSocket] Failed to send error fallback:', e);
    }
  }
};

const updateAgentAvailability = async (userId, available) => {
  try {
    await query(
      `INSERT INTO support_agents (user_id, is_available) VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET is_available = $2, updated_at = NOW()`,
      [userId, available]
    );
  } catch (error) {
    console.error('[SupportSocket] Error updating agent availability:', error);
  }
};

const getChat = async (chatId) => {
  try {
    const result = await query(
      `SELECT c.*, u.email as user_email FROM support_chats c LEFT JOIN users u ON c.user_id = u.user_id WHERE c.chat_id = $1`,
      [chatId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('[SupportSocket] Error getting chat:', error);
    return null;
  }
};

module.exports = { setupSupportSocket, SUPPORT_EVENTS };
