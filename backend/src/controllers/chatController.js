const { query } = require('../config/database');
const { encrypt, decrypt } = require('../utils/crypto');

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
    
    // Decrypt messages
    const decryptedRows = result.rows.map(row => ({
      ...row,
      message: decrypt(row.message)
    }));

    res.json({
      success: true,
      data: decryptedRows,
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

    const encryptedMessage = encrypt(message);

    const result = await query(
      `INSERT INTO chat_messages (sender_id, receiver_id, message, attachment_url, attachment_type, attachment_name) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [sender_id, receiver_id, encryptedMessage, attachment_url || null, attachment_type || null, attachment_name || null]
    );

    const insertedData = result.rows[0];
    insertedData.message = message; // return decrypted for immediate UI use

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: insertedData,
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

    
    
    // Decrypt last messages
    const decryptedConversations = result.rows.map(row => ({
      ...row,
      last_message: decrypt(row.last_message)
    }));
    
    res.json({
      success: true,
      data: decryptedConversations,
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

// Add reaction to message
const addReaction = async (req, res) => {
  try {
    const { message_id, reaction } = req.body;
    const userId = req.user.userId;

    // First check if message exists and user can access it
    const messageCheck = await query(
      'SELECT * FROM chat_messages WHERE message_id = $1 AND (sender_id = $2 OR receiver_id = $2)',
      [message_id, userId]
    );

    if (messageCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Message not found or unauthorized',
      });
    }

    // Insert or update reaction
    const result = await query(
      `INSERT INTO message_reactions (message_id, user_id, reaction, created_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (message_id, user_id)
       DO UPDATE SET reaction = EXCLUDED.reaction, created_at = NOW()
       RETURNING *`,
      [message_id, userId, reaction]
    );

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      const message = messageCheck.rows[0];
      const receiverId = message.sender_id === userId ? message.receiver_id : message.sender_id;
      const receiverSockets = req.app.get('connectedUsers')?.get(receiverId);

      if (receiverSockets) {
        receiverSockets.forEach(socketId => {
          io.to(socketId).emit('message_reaction', {
            messageId: message_id,
            reaction,
            userId
          });
        });
      }
    }

    res.json({
      success: true,
      message: 'Reaction added successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Add reaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add reaction',
      error: error.message,
    });
  }
};

// Create a new channel
const createChannel = async (req, res) => {
  try {
    const { name, description, is_private, type = 'group' } = req.body;
    const userId = req.user.userId;

    const result = await query(
      `INSERT INTO chat_channels (name, description, is_private, type, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, description, is_private || false, type, userId]
    );
    const channel = result.rows[0];

    // Add creator to participants
    await query(
      `INSERT INTO chat_participants (channel_id, user_id, role)
       VALUES ($1, $2, 'admin')`,
      [channel.id, userId]
    );

    res.status(201).json({ success: true, data: channel });
  } catch (error) {
    console.error('Create channel error:', error);
    res.status(500).json({ success: false, message: 'Failed to create channel' });
  }
};

// Get channels for user
const getChannels = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get public channels + private channels the user is a part of
    const result = await query(`
      SELECT c.*, 
             (SELECT COUNT(*) FROM chat_participants cp WHERE cp.channel_id = c.id) as participant_count,
             CASE WHEN cp2.user_id IS NOT NULL THEN true ELSE false END as is_joined
      FROM chat_channels c
      LEFT JOIN chat_participants cp2 ON c.id = cp2.channel_id AND cp2.user_id = $1
      WHERE c.is_private = false OR cp2.user_id IS NOT NULL
      ORDER BY c.created_at DESC
    `, [userId]);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get channels error:', error);
    res.status(500).json({ success: false, message: 'Failed to get channels' });
  }
};

// Join channel
const joinChannel = async (req, res) => {
  try {
    const { id: channelId } = req.params;
    const userId = req.user.userId;

    // Check if channel exists and is public
    const channelRes = await query(`SELECT * FROM chat_channels WHERE id = $1`, [channelId]);
    if (channelRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Channel not found' });
    }
    const channel = channelRes.rows[0];

    if (channel.is_private) {
      return res.status(403).json({ success: false, message: 'Cannot join private channel' });
    }

    await query(
      `INSERT INTO chat_participants (channel_id, user_id, role)
       VALUES ($1, $2, 'member') ON CONFLICT DO NOTHING`,
      [channelId, userId]
    );

    res.json({ success: true, message: 'Joined channel successfully' });
  } catch (error) {
    console.error('Join channel error:', error);
    res.status(500).json({ success: false, message: 'Failed to join channel' });
  }
};

// Get channel messages
const getChannelMessages = async (req, res) => {
  try {
    const { id: channelId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const userId = req.user.userId;

    // Verify user is a participant
    const partRes = await query(`SELECT * FROM chat_participants WHERE channel_id = $1 AND user_id = $2`, [channelId, userId]);
    if (partRes.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Not a participant of this channel' });
    }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const offset = (pageNum - 1) * limitNum;

    const queryText = `
      SELECT cm.*, 
             us.email as sender_email
      FROM chat_messages cm
      JOIN users us ON cm.sender_id = us.user_id
      WHERE cm.channel_id = $1
      ORDER BY cm.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await query(queryText, [channelId, limitNum, offset]);

    const countRes = await query(`SELECT COUNT(*) FROM chat_messages WHERE channel_id = $1`, [channelId]);
    const total = parseInt(countRes.rows[0].count);

    const decryptedRows = result.rows.map(row => ({
      ...row,
      message: decrypt(row.message)
    }));

    decryptedRows.reverse();

    res.json({
      success: true,
      data: decryptedRows,
      pagination: {
        currentPage: pageNum,
        totalItems: total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get channel messages error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
};

module.exports = {
  getMessages,
  sendMessage,
  markAsRead,
  getUnreadCount,
  getConversations,
  deleteMessage,
  deleteConversation,
  addReaction,
  createChannel,
  getChannels,
  joinChannel,
  getChannelMessages
};
