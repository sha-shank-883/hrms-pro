const { query, transaction } = require('../config/database');

const generateTicketNumber = async () => {
  const prefix = 'SUP';
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const result = await query(
    `SELECT COUNT(*) as count FROM support_tickets WHERE ticket_number LIKE $1`,
    [`${prefix}-${dateStr}-%`]
  );
  const count = parseInt(result.rows[0].count) + 1;
  return `${prefix}-${dateStr}-${String(count).padStart(4, '0')}`;
};

const createTicket = async ({ userId, subject, description, category, priority, source, chatId }) => {
  return transaction(async (client) => {
    const ticketNumber = await generateTicketNumber();

    const result = await client.query(
      `INSERT INTO support_tickets (ticket_number, user_id, subject, description, category, priority, source, chat_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'open')
       RETURNING *`,
      [ticketNumber, userId, subject, description || '', category || 'general', priority || 'normal', source || 'auto', chatId || null]
    );

    return result.rows[0];
  });
};

const assignTicket = async (ticketId, agentId) => {
  try {
    const result = await query(
      `UPDATE support_tickets SET assigned_to = $1, updated_at = NOW() WHERE ticket_id = $2 RETURNING *`,
      [agentId, ticketId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('[TicketService] Error assigning ticket:', error);
    throw error;
  }
};

const updateTicketStatus = async (ticketId, status, resolutionNotes = null) => {
  try {
    const updates = [];
    const params = [];
    let paramCount = 1;

    updates.push(`status = $${paramCount++}`);
    params.push(status);

    if (status === 'resolved') {
      updates.push(`resolved_at = NOW()`);
    }
    if (status === 'closed') {
      updates.push(`closed_at = NOW()`);
    }
    if (resolutionNotes) {
      updates.push(`resolution_notes = $${paramCount++}`);
      params.push(resolutionNotes);
    }

    updates.push(`updated_at = NOW()`);

    const result = await query(
      `UPDATE support_tickets SET ${updates.join(', ')} WHERE ticket_id = $${paramCount} RETURNING *`,
      [...params, ticketId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('[TicketService] Error updating ticket status:', error);
    throw error;
  }
};

const getTicket = async (ticketId) => {
  try {
    const result = await query(
      `SELECT t.*, 
              u.email as user_email, 
              a.user_id as agent_user_id,
              (SELECT COUNT(*) FROM ticket_comments WHERE ticket_id = t.ticket_id) as comment_count
       FROM support_tickets t
       LEFT JOIN users u ON t.user_id = u.user_id
       LEFT JOIN support_agents a ON t.assigned_to = a.agent_id
       WHERE t.ticket_id = $1`,
      [ticketId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('[TicketService] Error getting ticket:', error);
    throw error;
  }
};

const getTicketByNumber = async (ticketNumber) => {
  try {
    const result = await query(
      'SELECT * FROM support_tickets WHERE ticket_number = $1',
      [ticketNumber]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('[TicketService] Error getting ticket by number:', error);
    throw error;
  }
};

const listTickets = async ({ userId, assignedTo, status, priority, category, page = 1, limit = 20, search }) => {
  try {
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const offset = (pageNum - 1) * limitNum;

    let queryText = `
      SELECT t.*, u.email as user_email,
        (SELECT COUNT(*) FROM ticket_comments WHERE ticket_id = t.ticket_id) as comment_count
      FROM support_tickets t
      LEFT JOIN users u ON t.user_id = u.user_id
      WHERE 1=1
    `;
    let countQuery = `SELECT COUNT(*) as total FROM support_tickets t WHERE 1=1`;
    const params = [];
    const countParams = [];
    let paramCount = 1;

    if (userId) {
      queryText += ` AND t.user_id = $${paramCount}`;
      countQuery += ` AND t.user_id = $${paramCount}`;
      params.push(userId);
      countParams.push(userId);
      paramCount++;
    }

    if (assignedTo) {
      queryText += ` AND t.assigned_to = $${paramCount}`;
      countQuery += ` AND t.assigned_to = $${paramCount}`;
      params.push(assignedTo);
      countParams.push(assignedTo);
      paramCount++;
    }

    if (status) {
      const statuses = status.split(',');
      const placeholders = statuses.map((_, i) => `$${paramCount + i}`);
      queryText += ` AND t.status IN (${placeholders.join(',')})`;
      countQuery += ` AND t.status IN (${placeholders.join(',')})`;
      params.push(...statuses);
      countParams.push(...statuses);
      paramCount += statuses.length;
    }

    if (priority) {
      queryText += ` AND t.priority = $${paramCount}`;
      countQuery += ` AND t.priority = $${paramCount}`;
      params.push(priority);
      countParams.push(priority);
      paramCount++;
    }

    if (category) {
      queryText += ` AND t.category = $${paramCount}`;
      countQuery += ` AND t.category = $${paramCount}`;
      params.push(category);
      countParams.push(category);
      paramCount++;
    }

    if (search) {
      queryText += ` AND (t.subject ILIKE $${paramCount} OR t.description ILIKE $${paramCount} OR t.ticket_number ILIKE $${paramCount})`;
      countQuery += ` AND (t.subject ILIKE $${paramCount} OR t.description ILIKE $${paramCount} OR t.ticket_number ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      countParams.push(`%${search}%`);
      paramCount++;
    }

    const countResult = await query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    queryText += ` ORDER BY t.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limitNum, offset);

    const result = await query(queryText, params);

    return {
      tickets: result.rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    };
  } catch (error) {
    console.error('[TicketService] Error listing tickets:', error);
    throw error;
  }
};

const addComment = async ({ ticketId, userId, comment, isInternal, attachmentUrl }) => {
  try {
    const result = await query(
      `INSERT INTO ticket_comments (ticket_id, user_id, comment, is_internal, attachment_url)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [ticketId, userId, comment, isInternal || false, attachmentUrl || null]
    );

    await query(
      `UPDATE support_tickets SET updated_at = NOW() WHERE ticket_id = $1`,
      [ticketId]
    );

    return result.rows[0];
  } catch (error) {
    console.error('[TicketService] Error adding comment:', error);
    throw error;
  }
};

const getTicketComments = async (ticketId, includeInternal = false) => {
  try {
    let queryText = `
      SELECT c.*, u.email as user_email
      FROM ticket_comments c
      LEFT JOIN users u ON c.user_id = u.user_id
      WHERE c.ticket_id = $1
    `;
    if (!includeInternal) {
      queryText += ` AND c.is_internal = false`;
    }
    queryText += ` ORDER BY c.created_at ASC`;

    const result = await query(queryText, [ticketId]);
    return result.rows;
  } catch (error) {
    console.error('[TicketService] Error getting ticket comments:', error);
    throw error;
  }
};

const getTicketStats = async () => {
  try {
    const result = await query(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'open' THEN 1 END) as open,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved,
        COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed,
        COUNT(CASE WHEN priority = 'urgent' THEN 1 END) as urgent,
        COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as last_24h,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as last_7d
      FROM support_tickets
    `);
    return result.rows[0];
  } catch (error) {
    console.error('[TicketService] Error getting ticket stats:', error);
    throw error;
  }
};

const createTicketFromChat = async (chatId, userId, message) => {
  try {
    const ticket = await createTicket({
      userId,
      subject: `Unresolved chat - ${message.slice(0, 100)}`,
      description: `Auto-created from unresolved support chat.\n\nMessage: ${message}`,
      category: 'general',
      source: 'chat',
      chatId
    });

    await query(
      `UPDATE support_chats SET status = 'waiting' WHERE chat_id = $1`,
      [chatId]
    );

    return ticket;
  } catch (error) {
    console.error('[TicketService] Error creating ticket from chat:', error);
    throw error;
  }
};

module.exports = {
  createTicket,
  assignTicket,
  updateTicketStatus,
  getTicket,
  getTicketByNumber,
  listTickets,
  addComment,
  getTicketComments,
  getTicketStats,
  createTicketFromChat
};
