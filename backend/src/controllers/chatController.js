const { query } = require('../config/database');
const { encrypt, decrypt } = require('../utils/crypto');
const asyncHandler = require('../utils/asyncHandler');
const { NotFoundError, UnauthorizedError, ForbiddenError, ValidationError, ConflictError, AppError } = require('../utils/errors');

// Get chat messages with pagination
const getMessages = asyncHandler(async (req, res) => {
  const { user1_id, user2_id, page = 1, limit = 20 } = req.query; // Higher limit for chat
  const currentUserId = req.user.userId;

  // Validate pagination parameters
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20)); // Max 100 per page
  const offset = (pageNum - 1) * limitNum;

  let queryText = `
    SELECT cm.*, 
           us.email as sender_email,
           ur.email as receiver_email,
           (SELECT json_build_object(
              'message_id', rm.message_id, 
              'message', rm.message, 
              'sender_id', rm.sender_id,
              'attachment_url', rm.attachment_url,
              'attachment_type', rm.attachment_type
            )
            FROM chat_messages rm 
            WHERE rm.message_id = cm.reply_to_id
           ) as reply_to,
           COALESCE(
             (SELECT json_agg(json_build_object('userId', user_id, 'reaction', reaction))
              FROM message_reactions
              WHERE message_id = cm.message_id
             ), '[]'
           ) as reactions
    FROM chat_messages cm
    JOIN users us ON cm.sender_id = us.user_id
    LEFT JOIN users ur ON cm.receiver_id = ur.user_id
    WHERE 1=1
  `;
  let countQueryText = `
    SELECT COUNT(*) as total
    FROM chat_messages cm
    JOIN users us ON cm.sender_id = us.user_id
    LEFT JOIN users ur ON cm.receiver_id = ur.user_id
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
  const decryptedRows = result.rows.map(row => {
    const decrypted = {
      ...row,
      message: decrypt(row.message)
    };
    if (decrypted.reply_to && decrypted.reply_to.message) {
      decrypted.reply_to.message = decrypt(decrypted.reply_to.message);
    }
    return decrypted;
  });

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
});

// Send message
const sendMessage = asyncHandler(async (req, res) => {
  const { receiver_id, message, attachment_url, attachment_type, attachment_name, reply_to_id } = req.body;
  const sender_id = req.user.userId;

  const encryptedMessage = encrypt(message);

  const result = await query(
    `INSERT INTO chat_messages (sender_id, receiver_id, message, attachment_url, attachment_type, attachment_name, reply_to_id) 
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [sender_id, receiver_id, encryptedMessage, attachment_url || null, attachment_type || null, attachment_name || null, reply_to_id || null]
  );

  const insertedData = result.rows[0];
  insertedData.message = message; // return decrypted for immediate UI use

  res.status(201).json({
    success: true,
    message: 'Message sent successfully',
    data: insertedData,
  });
});

// Mark messages as read
const markAsRead = asyncHandler(async (req, res) => {
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
});

// Get unread message count
const getUnreadCount = asyncHandler(async (req, res) => {
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
});

// Get conversation list
const getConversations = asyncHandler(async (req, res) => {
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
         CASE WHEN sender_id = $1 THEN u_receiver.email ELSE u_sender.email END as other_user_email,
         CASE WHEN sender_id = $1 THEN COALESCE(ur.first_name, u_receiver.first_name, u_receiver.email) ELSE COALESCE(us.first_name, u_sender.first_name, u_sender.email) END as other_user_first_name,
         CASE WHEN sender_id = $1 THEN COALESCE(ur.last_name, u_receiver.last_name, '') ELSE COALESCE(us.last_name, u_sender.last_name, '') END as other_user_last_name,
         CASE WHEN sender_id = $1 THEN COALESCE(ur.profile_image, u_receiver.avatar, '') ELSE COALESCE(us.profile_image, u_sender.avatar, '') END as other_user_avatar,
         cm.message as last_message,
         cm.created_at as last_message_time,
         cm.attachment_type,
         COUNT(CASE WHEN receiver_id = $1 AND is_read = false THEN 1 END) OVER (PARTITION BY 
           CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END) as unread_count
       FROM chat_messages cm
       JOIN users u_sender ON cm.sender_id = u_sender.user_id
       LEFT JOIN users u_receiver ON cm.receiver_id = u_receiver.user_id
       LEFT JOIN employees us ON u_sender.user_id = us.user_id
       LEFT JOIN employees ur ON u_receiver.user_id = ur.user_id
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
});

// Delete message
const deleteMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  // Only allow sender to delete
  const result = await query(
    'UPDATE chat_messages SET is_deleted = true, message = $1 WHERE message_id = $2 AND sender_id = $3 RETURNING *',
    [encrypt('🚫 Message Redacted'), id, userId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Message not found or unauthorized');
  }

  // Notify via socket
  const io = req.app.get('io');
  if (io) {
    const message = result.rows[0];
    const data = { messageId: id, is_deleted: true };
    if (message.channel_id) {
      io.to(`channel_${message.channel_id}`).emit('message_deleted', data);
    } else {
      const receiverId = message.receiver_id;
      const receiverSockets = req.app.get('connectedUsers')?.get(String(receiverId));
      if (receiverSockets) {
        receiverSockets.forEach(socketId => io.to(socketId).emit('message_deleted', data));
      }
    }
  }

  res.json({
    success: true,
    message: 'Message deleted successfully',
  });
});

// Edit message
const editMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;
  const userId = req.user.userId;

  if (!message) {
    throw new ValidationError('Message content required');
  }

  const encryptedMessage = encrypt(message);

  const result = await query(
    'UPDATE chat_messages SET message = $1, is_edited = true, updated_at = NOW() WHERE message_id = $2 AND sender_id = $3 RETURNING *',
    [encryptedMessage, id, userId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Message not found or unauthorized');
  }

  const updatedMessage = result.rows[0];
  updatedMessage.message = message; // return decrypted

  // Notify via socket
  const io = req.app.get('io');
  if (io) {
    const data = { messageId: id, message, is_edited: true };
    if (updatedMessage.channel_id) {
      io.to(`channel_${updatedMessage.channel_id}`).emit('message_edited', data);
    } else {
      const receiverId = updatedMessage.receiver_id;
      const receiverSockets = req.app.get('connectedUsers')?.get(String(receiverId));
      if (receiverSockets) {
        receiverSockets.forEach(socketId => io.to(socketId).emit('message_edited', data));
      }
    }
  }

  res.json({
    success: true,
    message: 'Message updated successfully',
    data: updatedMessage
  });
});

// Delete entire conversation between two users
const deleteConversation = asyncHandler(async (req, res) => {
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
});

// Add reaction to message
const addReaction = asyncHandler(async (req, res) => {
  const { message_id, reaction } = req.body;
  const userId = req.user.userId;

  // First check if message exists and user can access it
  const messageCheck = await query(
    'SELECT * FROM chat_messages WHERE message_id = $1 AND (sender_id = $2 OR receiver_id = $2)',
    [message_id, userId]
  );

  if (messageCheck.rows.length === 0) {
    throw new NotFoundError('Message not found or unauthorized');
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
});

// Create a new channel
const createChannel = asyncHandler(async (req, res) => {
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
});

// Get channels for user
const getChannels = asyncHandler(async (req, res) => {
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
});

// Join channel
const joinChannel = asyncHandler(async (req, res) => {
  const { id: channelId } = req.params;
  const userId = req.user.userId;

  // Check if channel exists and is public
  const channelRes = await query(`SELECT * FROM chat_channels WHERE id = $1`, [channelId]);
  if (channelRes.rows.length === 0) {
    throw new NotFoundError('Channel not found');
  }
  const channel = channelRes.rows[0];

  if (channel.is_private) {
    throw new ForbiddenError('Cannot join private channel');
  }

  await query(
    `INSERT INTO chat_participants (channel_id, user_id, role)
     VALUES ($1, $2, 'member') ON CONFLICT DO NOTHING`,
    [channelId, userId]
  );

  res.json({ success: true, message: 'Joined channel successfully' });
});

// Get channel messages
const getChannelMessages = asyncHandler(async (req, res) => {
  const { id: channelId } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const userId = req.user.userId;

  // Verify user is a participant
  const partRes = await query(`SELECT * FROM chat_participants WHERE channel_id = $1 AND user_id = $2`, [channelId, userId]);
  if (partRes.rows.length === 0) {
    throw new ForbiddenError('Not a participant of this channel');
  }

  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
  const offset = (pageNum - 1) * limitNum;

  const queryText = `
    SELECT cm.*, 
           us.email as sender_email,
           COALESCE(
             (SELECT json_agg(json_build_object('userId', user_id, 'reaction', reaction))
              FROM message_reactions
              WHERE message_id = cm.message_id
             ), '[]'
           ) as reactions
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
});

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
  getChannelMessages,
  editMessage
};
