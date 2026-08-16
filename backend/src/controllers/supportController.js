const { query, transaction } = require('../config/database');
const { getFAQMatch, recordFeedback, searchFAQs, getAllCategories } = require('../services/faqService');
const { getAIResponse } = require('../services/aiService');
const ticketService = require('../services/ticketService');
const emailService = require('../services/supportEmailService');
const asyncHandler = require('../utils/asyncHandler');
const { NotFoundError, UnauthorizedError, ForbiddenError, ValidationError, ConflictError, AppError } = require('../utils/errors');

const ensureSupportTables = async () => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS faq_categories (
        category_id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        display_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS faq_articles (
        article_id SERIAL PRIMARY KEY,
        category_id INTEGER REFERENCES faq_categories(category_id) ON DELETE CASCADE,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        keywords JSONB DEFAULT '[]'::jsonb,
        helpful_count INTEGER DEFAULT 0,
        not_helpful_count INTEGER DEFAULT 0,
        is_published BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS support_agents (
        agent_id SERIAL PRIMARY KEY,
        user_id INTEGER,
        is_available BOOLEAN DEFAULT true,
        max_concurrent_chats INTEGER DEFAULT 5,
        current_chats INTEGER DEFAULT 0,
        auto_assign BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS support_chats (
        chat_id SERIAL PRIMARY KEY,
        user_id INTEGER,
        agent_id INTEGER,
        status VARCHAR(50) DEFAULT 'active',
        source VARCHAR(50) DEFAULT 'widget',
        is_ai_active BOOLEAN DEFAULT true,
        ai_confidence DECIMAL(5,4),
        department VARCHAR(100),
        priority VARCHAR(20) DEFAULT 'normal',
        unread_count INTEGER DEFAULT 0,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP,
        closed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS support_messages (
        message_id SERIAL PRIMARY KEY,
        chat_id INTEGER REFERENCES support_chats(chat_id) ON DELETE CASCADE,
        sender_id INTEGER,
        sender_type VARCHAR(20) NOT NULL,
        message TEXT NOT NULL,
        message_type VARCHAR(50) DEFAULT 'text',
        attachment_url VARCHAR(500),
        attachment_name VARCHAR(255),
        attachment_size INTEGER,
        metadata JSONB DEFAULT '{}'::jsonb,
        is_read BOOLEAN DEFAULT false,
        read_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (_) {}
};

const CHAT = {};

CHAT.createOrGetChat = asyncHandler(async (req, res) => {
  let userId = req.user?.userId || req.user?.id || 1;
  const { department } = req.body;

  try {
    let result = await query(
      `SELECT * FROM support_chats WHERE user_id = $1 AND status IN ('active', 'waiting') ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );

    if (result.rows.length > 0) {
      return res.json({ success: true, data: result.rows[0], existing: true });
    }

    const newChat = await query(
      `INSERT INTO support_chats (user_id, department, status, is_ai_active) VALUES ($1, $2, 'active', true) RETURNING *`,
      [userId, department || 'general']
    );

    await query(
      `INSERT INTO support_messages (chat_id, sender_id, sender_type, message_type, message)
       VALUES ($1, NULL, 'system', 'system', '👋 Welcome! How can we help you today?')`,
      [newChat.rows[0].chat_id]
    );

    return res.status(201).json({ success: true, data: newChat.rows[0] });
  } catch (err) {
    if (err.message && (err.message.includes('does not exist') || err.message.includes('foreign key'))) {
      await ensureSupportTables();
      const retryChat = await query(
        `INSERT INTO support_chats (user_id, department, status, is_ai_active) VALUES ($1, $2, 'active', true) RETURNING *`,
        [userId, department || 'general']
      );
      await query(
        `INSERT INTO support_messages (chat_id, sender_id, sender_type, message_type, message)
         VALUES ($1, NULL, 'system', 'system', '👋 Welcome! How can we help you today?')`,
        [retryChat.rows[0].chat_id]
      );
      return res.status(201).json({ success: true, data: retryChat.rows[0] });
    }
    throw err;
  }
});

CHAT.getChatHistory = asyncHandler(async (req, res) => {
  const { chatId } = req.params;

  const messages = await query(
    `SELECT m.*, u.email as sender_email
     FROM support_messages m
     LEFT JOIN users u ON m.sender_id = u.user_id
     WHERE m.chat_id = $1
     ORDER BY m.created_at ASC`,
    [chatId]
  );

  const chat = await query(
    `SELECT c.*, u.email as user_email FROM support_chats c LEFT JOIN users u ON c.user_id = u.user_id WHERE c.chat_id = $1`,
    [chatId]
  );

  if (chat.rows.length === 0) {
    throw new NotFoundError('Chat not found');
  }

  res.json({
    success: true,
    data: {
      chat: chat.rows[0],
      messages: messages.rows
    }
  });
});

CHAT.getMyChats = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { page = 1, limit = 20, status } = req.query;

  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
  const offset = (pageNum - 1) * limitNum;

  let queryText = `SELECT c.*, (SELECT COUNT(*) FROM support_messages WHERE chat_id = c.chat_id) as message_count FROM support_chats c WHERE c.user_id = $1`;
  let countText = `SELECT COUNT(*) as total FROM support_chats c WHERE c.user_id = $1`;
  const params = [userId];
  const countParams = [userId];
  let paramCount = 2;

  if (status) {
    queryText += ` AND c.status = $${paramCount}`;
    countText += ` AND c.status = $${paramCount}`;
    params.push(status);
    countParams.push(status);
    paramCount++;
  }

  queryText += ` ORDER BY c.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
  params.push(limitNum, offset);

  const countResult = await query(countText, countParams);
  const total = parseInt(countResult.rows[0].total);

  const result = await query(queryText, params);

  res.json({
    success: true,
    data: result.rows,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) }
  });
});

CHAT.closeChat = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const result = await query(
    `UPDATE support_chats SET status = 'closed', closed_at = NOW(), updated_at = NOW() WHERE chat_id = $1 RETURNING *`,
    [chatId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Chat not found');
  }

  await query(
    `INSERT INTO support_messages (chat_id, sender_id, sender_type, message_type, message)
     VALUES ($1, NULL, 'system', 'system', 'Chat closed. Thank you for contacting us!')`,
    [chatId]
  );

  res.json({ success: true, data: result.rows[0] });
});

CHAT.resolveChat = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const result = await query(
    `UPDATE support_chats SET status = 'resolved', resolved_at = NOW(), updated_at = NOW() WHERE chat_id = $1 RETURNING *`,
    [chatId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Chat not found');
  }

  res.json({ success: true, data: result.rows[0] });
});

const FAQ = {};

FAQ.list = asyncHandler(async (req, res) => {
  const { search, category, page, limit } = req.query;
  const result = await searchFAQs(search, category, page, limit);
  res.json({ success: true, ...result });
});

FAQ.getById = asyncHandler(async (req, res) => {
  const result = await query('SELECT a.*, c.name as category_name FROM faq_articles a LEFT JOIN faq_categories c ON a.category_id = c.category_id WHERE a.article_id = $1', [req.params.id]);
  if (result.rows.length === 0) throw new NotFoundError('FAQ not found');
  res.json({ success: true, data: result.rows[0] });
});

FAQ.create = asyncHandler(async (req, res) => {
  const { category_id, question, answer, keywords } = req.body;
  const result = await query(
    `INSERT INTO faq_articles (category_id, question, answer, keywords) VALUES ($1, $2, $3, $4) RETURNING *`,
    [category_id, question, answer, JSON.stringify(keywords || [])]
  );
  res.status(201).json({ success: true, data: result.rows[0] });
});

FAQ.update = asyncHandler(async (req, res) => {
  const { category_id, question, answer, keywords, is_published } = req.body;
  const result = await query(
    `UPDATE faq_articles SET category_id = COALESCE($1, category_id), question = COALESCE($2, question), answer = COALESCE($3, answer), keywords = COALESCE($4, keywords::jsonb), is_published = COALESCE($5, is_published), updated_at = NOW() WHERE article_id = $6 RETURNING *`,
    [category_id, question, answer, keywords ? JSON.stringify(keywords) : null, is_published, req.params.id]
  );
  if (result.rows.length === 0) throw new NotFoundError('FAQ not found');
  res.json({ success: true, data: result.rows[0] });
});

FAQ.remove = asyncHandler(async (req, res) => {
  const result = await query('DELETE FROM faq_articles WHERE article_id = $1 RETURNING *', [req.params.id]);
  if (result.rows.length === 0) throw new NotFoundError('FAQ not found');
  res.json({ success: true, message: 'FAQ deleted' });
});

FAQ.feedback = asyncHandler(async (req, res) => {
  const { helpful } = req.body;
  await recordFeedback(req.params.id, helpful);
  res.json({ success: true });
});

FAQ.categories = asyncHandler(async (req, res) => {
  const categories = await getAllCategories();
  res.json({ success: true, data: categories });
});

FAQ.createCategory = asyncHandler(async (req, res) => {
  try {
    const { name, slug, description, display_order } = req.body;
    const result = await query(
      `INSERT INTO faq_categories (name, slug, description, display_order) VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, slug, description || '', display_order || 0]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      throw new ConflictError('Category slug already exists');
    }
    throw error;
  }
});

FAQ.updateCategory = asyncHandler(async (req, res) => {
  const { name, slug, description, display_order, is_active } = req.body;
  const result = await query(
    `UPDATE faq_categories SET name = COALESCE($1, name), slug = COALESCE($2, slug), description = COALESCE($3, description), display_order = COALESCE($4, display_order), is_active = COALESCE($5, is_active), updated_at = NOW() WHERE category_id = $6 RETURNING *`,
    [name, slug, description, display_order, is_active, req.params.id]
  );
  if (result.rows.length === 0) throw new NotFoundError('Category not found');
  res.json({ success: true, data: result.rows[0] });
});

FAQ.deleteCategory = asyncHandler(async (req, res) => {
  const result = await query('DELETE FROM faq_categories WHERE category_id = $1 RETURNING *', [req.params.id]);
  if (result.rows.length === 0) throw new NotFoundError('Category not found');
  res.json({ success: true, message: 'Category deleted' });
});

const TICKET = {};

TICKET.list = asyncHandler(async (req, res) => {
  const { status, priority, category, search, page, limit, assigned_to } = req.query;
  const isAdminOrManager = req.user.role === 'admin' || req.user.role === 'manager';

  const filters = {
    status,
    priority,
    category,
    search,
    page,
    limit
  };

  if (!isAdminOrManager) {
    filters.userId = req.user.userId;
  }

  if (assigned_to && isAdminOrManager) {
    filters.assignedTo = assigned_to;
  }

  const result = await ticketService.listTickets(filters);
  res.json({ success: true, ...result });
});

TICKET.getById = asyncHandler(async (req, res) => {
  const ticket = await ticketService.getTicket(req.params.id);
  if (!ticket) throw new NotFoundError('Ticket not found');

  const comments = await ticketService.getTicketComments(req.params.id, req.user.role === 'admin' || req.user.role === 'manager');

  res.json({ success: true, data: { ...ticket, comments } });
});

TICKET.create = asyncHandler(async (req, res) => {
  const { subject, description, category, priority } = req.body;

  if (!subject) {
    throw new ValidationError('Subject is required');
  }

  const ticket = await ticketService.createTicket({
    userId: req.user.userId,
    subject,
    description,
    category: category || 'general',
    priority: priority || 'normal',
    source: 'manual'
  });

  try {
    await emailService.notifyNewTicket({
      userEmail: req.user.email,
      ticketNumber: ticket.ticket_number,
      subject: ticket.subject,
      priority: ticket.priority
    });
  } catch (emailError) {
    console.error('[SupportController] Error sending email:', emailError);
  }

  res.status(201).json({ success: true, data: ticket });
});

TICKET.updateStatus = asyncHandler(async (req, res) => {
  const { status, resolution_notes } = req.body;
  const ticket = await ticketService.updateTicketStatus(req.params.id, status, resolution_notes);

  if (!ticket) throw new NotFoundError('Ticket not found');

  try {
    const userResult = await query('SELECT email FROM users WHERE user_id = $1', [ticket.user_id]);
    if (userResult.rows.length > 0) {
      await emailService.notifyTicketUpdate({
        userEmail: userResult.rows[0].email,
        ticketNumber: ticket.ticket_number,
        status: ticket.status,
        comment: resolution_notes
      });
    }
  } catch (emailError) {
    console.error('[SupportController] Error sending email:', emailError);
  }

  res.json({ success: true, data: ticket });
});

TICKET.assign = asyncHandler(async (req, res) => {
  const { agent_id } = req.body;
  const ticket = await ticketService.assignTicket(req.params.id, agent_id);
  if (!ticket) throw new NotFoundError('Ticket not found');
  res.json({ success: true, data: ticket });
});

TICKET.addComment = asyncHandler(async (req, res) => {
  const { comment, is_internal, attachment_url } = req.body;

  if (!comment) {
    throw new ValidationError('Comment is required');
  }

  const result = await ticketService.addComment({
    ticketId: req.params.id,
    userId: req.user.userId,
    comment,
    isInternal: is_internal || false,
    attachmentUrl: attachment_url
  });

  res.status(201).json({ success: true, data: result });
});

TICKET.stats = asyncHandler(async (req, res) => {
  const stats = await ticketService.getTicketStats();
  const agentResult = await query(
    `SELECT COUNT(*) as total, SUM(CASE WHEN current_chats > 0 THEN 1 ELSE 0 END) as busy FROM support_agents WHERE is_available = true`
  );
  res.json({
    success: true,
    data: {
      ...stats,
      available_agents: parseInt(agentResult.rows[0]?.total || 0),
      busy_agents: parseInt(agentResult.rows[0]?.busy || 0)
    }
  });
});

const AI = {};

AI.ask = asyncHandler(async (req, res) => {
  const { message, chatId } = req.body;

  if (!message) {
    throw new ValidationError('Message is required');
  }

  const faqResult = await getFAQMatch(message);

  if (faqResult.matched && faqResult.article) {
    return res.json({
      success: true,
      data: {
        response: faqResult.article.answer,
        type: 'faq',
        article_id: faqResult.article.article_id,
        confidence: faqResult.confidence,
        faq_matched: true
      }
    });
  }

  const aiResult = await getAIResponse(message, chatId, req.user.userId);

  if (aiResult.success) {
    res.json({
      success: true,
      data: {
        response: aiResult.response,
        type: 'ai',
        confidence: aiResult.confidence,
        provider: aiResult.provider,
        faq_matched: false,
        needs_ticket: aiResult.confidence < 0.4
      }
    });
  } else {
    res.json({
      success: true,
      data: {
        response: aiResult.error || 'Unable to process your request. A ticket has been created.',
        type: 'error',
        needs_ticket: true,
        faq_matched: false
      }
    });
  }
});

const ADMIN = {};

ADMIN.getActiveChats = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
  const offset = (pageNum - 1) * limitNum;

  let queryText = `
    SELECT c.*, u.email as user_email,
      (SELECT COUNT(*) FROM support_messages WHERE chat_id = c.chat_id AND sender_type = 'user' AND is_read = false) as unread
    FROM support_chats c
    LEFT JOIN users u ON c.user_id = u.user_id
    WHERE 1=1
  `;
  let countText = `SELECT COUNT(*) as total FROM support_chats c WHERE 1=1`;
  const params = [];
  const countParams = [];
  let paramCount = 1;

  if (status) {
    const statuses = status.split(',');
    const placeholders = statuses.map((_, i) => `$${paramCount + i}`);
    queryText += ` AND c.status IN (${placeholders.join(',')})`;
    countText += ` AND c.status IN (${placeholders.join(',')})`;
    params.push(...statuses);
    countParams.push(...statuses);
    paramCount += statuses.length;
  } else {
    queryText += ` AND c.status IN ('active', 'waiting')`;
    countText += ` AND c.status IN ('active', 'waiting')`;
  }

  queryText += ` ORDER BY c.updated_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
  params.push(limitNum, offset);

  const countResult = await query(countText, countParams);
  const total = parseInt(countResult.rows[0].total);

  const result = await query(queryText, params);

  res.json({
    success: true,
    data: result.rows,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) }
  });
});

ADMIN.getDashboard = asyncHandler(async (req, res) => {
  const [ticketStats, chatStats, faqStats, aiStats] = await Promise.all([
    ticketService.getTicketStats(),
    query(`
      SELECT
        COUNT(*) as total_chats,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_chats,
        COUNT(CASE WHEN status = 'waiting' THEN 1 END) as waiting_chats,
        COUNT(CASE WHEN is_ai_active = true AND status = 'active' THEN 1 END) as ai_chats
      FROM support_chats
    `),
    query(`SELECT COUNT(*) as total FROM faq_articles WHERE is_published = true`),
    query(`
      SELECT COUNT(*) as total_queries,
        COALESCE(AVG(confidence), 0) as avg_confidence,
        COUNT(CASE WHEN is_faq_match = true THEN 1 END) as faq_matches
      FROM ai_logs WHERE created_at >= NOW() - INTERVAL '7 days'
    `)
  ]);

  const recentActivity = await query(`
    SELECT 'ticket' as type, ticket_number as ref, subject as description, created_at
    FROM support_tickets ORDER BY created_at DESC LIMIT 5
  `);

  res.json({
    success: true,
    data: {
      tickets: ticketStats,
      chats: chatStats.rows[0],
      faqs: faqStats.rows[0],
      ai: aiStats.rows[0],
      recent_activity: recentActivity.rows
    }
  });
});

ADMIN.getAgents = asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT sa.*, u.email, u.role FROM support_agents sa LEFT JOIN users u ON sa.user_id = u.user_id ORDER BY sa.is_available DESC, u.email`
  );
  res.json({ success: true, data: result.rows });
});

ADMIN.updateAgent = asyncHandler(async (req, res) => {
  const { is_available, max_concurrent_chats, auto_assign } = req.body;
  const result = await query(
    `UPDATE support_agents SET is_available = COALESCE($1, is_available), max_concurrent_chats = COALESCE($2, max_concurrent_chats), auto_assign = COALESCE($3, auto_assign), updated_at = NOW() WHERE agent_id = $4 RETURNING *`,
    [is_available, max_concurrent_chats, auto_assign, req.params.id]
  );
  if (result.rows.length === 0) throw new NotFoundError('Agent not found');
  res.json({ success: true, data: result.rows[0] });
});

ADMIN.addAgent = asyncHandler(async (req, res) => {
  const { user_id } = req.body;

  const existing = await query('SELECT * FROM support_agents WHERE user_id = $1', [user_id]);
  if (existing.rows.length > 0) {
    throw new ConflictError('User is already a support agent');
  }

  const result = await query(
    `INSERT INTO support_agents (user_id) VALUES ($1) RETURNING *`,
    [user_id]
  );
  res.status(201).json({ success: true, data: result.rows[0] });
});

ADMIN.removeAgent = asyncHandler(async (req, res) => {
  const result = await query('DELETE FROM support_agents WHERE agent_id = $1 RETURNING *', [req.params.id]);
  if (result.rows.length === 0) throw new NotFoundError('Agent not found');
  res.json({ success: true, message: 'Agent removed' });
});

const CANNED = {};

CANNED.list = asyncHandler(async (req, res) => {
  const { category } = req.query;
  let queryText = 'SELECT * FROM canned_replies WHERE is_active = true';
  const params = [];

  if (category) {
    queryText += ' AND category = $1';
    params.push(category);
  }

  queryText += ' ORDER BY category, title';
  const result = await query(queryText, params);
  res.json({ success: true, data: result.rows });
});

CANNED.create = asyncHandler(async (req, res) => {
  const { title, content, category, shortcuts } = req.body;
  const result = await query(
    `INSERT INTO canned_replies (title, content, category, shortcuts) VALUES ($1, $2, $3, $4) RETURNING *`,
    [title, content, category || 'general', JSON.stringify(shortcuts || [])]
  );
  res.status(201).json({ success: true, data: result.rows[0] });
});

CANNED.update = asyncHandler(async (req, res) => {
  const { title, content, category, shortcuts, is_active } = req.body;
  const result = await query(
    `UPDATE canned_replies SET title = COALESCE($1, title), content = COALESCE($2, content), category = COALESCE($3, category), shortcuts = COALESCE($4, shortcuts::jsonb), is_active = COALESCE($5, is_active), updated_at = NOW() WHERE reply_id = $6 RETURNING *`,
    [title, content, category, shortcuts ? JSON.stringify(shortcuts) : null, is_active, req.params.id]
  );
  if (result.rows.length === 0) throw new NotFoundError('Canned reply not found');
  res.json({ success: true, data: result.rows[0] });
});

CANNED.remove = asyncHandler(async (req, res) => {
  const result = await query('DELETE FROM canned_replies WHERE reply_id = $1 RETURNING *', [req.params.id]);
  if (result.rows.length === 0) throw new NotFoundError('Canned reply not found');
  res.json({ success: true, message: 'Canned reply deleted' });
});

module.exports = {
  CHAT,
  FAQ,
  TICKET,
  AI,
  ADMIN,
  CANNED
};
