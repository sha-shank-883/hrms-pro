const { query } = require('../config/database');

// Get chat messages with pagination
const getMessages = async (req, res) => {
  try {
    const { user1_id, user2_id, page = 1, limit = 20 } = req.query; // Higher limit for chat
    const currentUserId = req.user.userId;

    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20)); // Max 100 per page
    const offset = (pageNum - 1) * limitNum;

    let queryText = `
      SELECT cm.*, 
             us.email as sender_email,
             ur.email as receiver_email
      FROM chat_messages cm
      JOIN users us ON cm.sender_id = us.user_id
      JOIN users ur ON cm.receiver_id = ur.user_id
      WHERE 1=1
    `;
    let countQueryText = `
      SELECT COUNT(*) as total
      FROM chat_messages cm
      JOIN users us ON cm.sender_id = us.user_id
      JOIN users ur ON cm.receiver_id = ur.user_id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (user2_id) {
      // Filter by conversation between current user and specific user
      queryText += ` AND ((cm.sender_id = $${paramCount} AND cm.receiver_id = $${paramCount + 1}) 
                      OR (cm.sender_id = $${paramCount + 1} AND cm.receiver_id = $${paramCount}))`;
      countQueryText += ` AND ((cm.sender_id = $${paramCount} AND cm.receiver_id = $${paramCount + 1}) 
                      OR (cm.sender_id = $${paramCount + 1} AND cm.receiver_id = $${paramCount}))`;
      params.push(currentUserId, user2_id);
      paramCount += 2;
    } else {
      // Get all messages for current user
      queryText += ` AND (cm.sender_id = $${paramCount} OR cm.receiver_id = $${paramCount})`;
      countQueryText += ` AND (cm.sender_id = $${paramCount} OR cm.receiver_id = $${paramCount})`;
      params.push(currentUserId);
      paramCount++;
    }

    queryText += ' ORDER BY cm.created_at ASC';

    // Add pagination to main query
    queryText += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    const paginatedParams = [...params, limitNum, offset];

    // Get total count
    const countResult = await query(countQueryText, params);
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limitNum);

    // Get paginated results
    const result = await query(queryText, paginatedParams);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        currentPage: pageNum,
        totalPages: totalPages,
        totalItems: total,
        itemsPerPage: limitNum,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages',
      error: error.message,
    });
  }
};

// Send message
const sendMessage = async (req, res) => {
  try {
    const { receiver_id, message, attachment_url, attachment_type, attachment_name } = req.body;
    const sender_id = req.user.userId;

    const result = await query(
      `INSERT INTO chat_messages (sender_id, receiver_id, message, attachment_url, attachment_type, attachment_name) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [sender_id, receiver_id, message, attachment_url || null, attachment_type || null, attachment_name || null]
    );

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message,
    });
  }
};

// Mark messages as read
const markAsRead = async (req, res) => {
  try {
    const { message_ids } = req.body;

    const result = await query(
      'UPDATE chat_messages SET is_read = true, read_at = CURRENT_TIMESTAMP WHERE message_id = ANY($1) RETURNING *',
      [message_ids]
    );

    res.json({
      success: true,
      message: 'Messages marked as read',
      count: result.rowCount,
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark messages as read',
      error: error.message,
    });
  }
};

// Get unread message count
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await query(
      'SELECT COUNT(*) as unread_count FROM chat_messages WHERE receiver_id = $1 AND is_read = false',
      [userId]
    );

    res.json({
      success: true,
      data: {
        unread_count: parseInt(result.rows[0].unread_count),
      },
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count',
      error: error.message,
    });
  }
};

// Get conversation list
const getConversations = async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log('Getting conversations for user:', userId);

    const result = await query(
      `SELECT DISTINCT ON (other_user_id) 
              other_user_id,
              other_user_email,
              other_user_first_name,
              other_user_last_name,
              last_message,
              last_message_time,
              unread_count
       FROM (
         SELECT 
           CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END as other_user_id,
           CASE WHEN sender_id = $1 THEN ur.email ELSE us.email END as other_user_email,
           CASE WHEN sender_id = $1 THEN ur.first_name ELSE us.first_name END as other_user_first_name,
           CASE WHEN sender_id = $1 THEN ur.last_name ELSE us.last_name END as other_user_last_name,
           cm.message as last_message,
           cm.created_at as last_message_time,
           COUNT(CASE WHEN receiver_id = $1 AND is_read = false THEN 1 END) OVER (PARTITION BY 
             CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END) as unread_count
         FROM chat_messages cm
         JOIN users u_sender ON cm.sender_id = u_sender.user_id
         JOIN users u_receiver ON cm.receiver_id = u_receiver.user_id
         JOIN employees us ON u_sender.user_id = us.user_id
         JOIN employees ur ON u_receiver.user_id = ur.user_id
         WHERE sender_id = $1 OR receiver_id = $1
         ORDER BY cm.created_at DESC
       ) conversations
       ORDER BY other_user_id, last_message_time DESC`,
      [userId]
    );

    console.log('Conversations query result:', result.rows);
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversations',
      error: error.message,
    });
  }
};

// Delete message
const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Only allow sender to delete
    const result = await query(
      'DELETE FROM chat_messages WHERE message_id = $1 AND sender_id = $2 RETURNING *',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Message not found or unauthorized',
      });
    }

    res.json({
      success: true,
      message: 'Message deleted successfully',
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete message',
      error: error.message,
    });
  }
};

// Delete entire conversation between two users
const deleteConversation = async (req, res) => {
  try {
    const { userId: otherUserId } = req.params;
    const currentUserId = req.user.userId;

    // Delete all messages where current user is the sender and other user is the receiver
    // AND where other user is the sender and current user is the receiver
    const result = await query(
      `DELETE FROM chat_messages 
       WHERE (sender_id = $1 AND receiver_id = $2) 
       OR (sender_id = $2 AND receiver_id = $1) 
       RETURNING *`,
      [currentUserId, otherUserId]
    );

    res.json({
      success: true,
      message: `Deleted ${result.rowCount} messages from conversation`,
      deletedCount: result.rowCount
    });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete conversation',
      error: error.message,
    });
  }
};

module.exports = {
  getMessages,
  sendMessage,
  markAsRead,
  getUnreadCount,
  getConversations,
  deleteMessage,
  deleteConversation
};
