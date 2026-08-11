const jwt = require('jsonwebtoken');
const { query, tenantStorage } = require('../config/database');
const { encrypt, decrypt } = require('../utils/crypto');

const setupChatSocket = (io, socket, connectedUsers, broadcastOnlineUsers) => {
  // User joins with their user ID & Token for authentication
  socket.on('join', (data) => {
    if (!data) return;
    // Support both object and direct userId for backwards compatibility (temporary)
    const { userId, token } = (data && typeof data === 'object') ? data : { userId: data, token: null };

    tenantStorage.run(socket.tenantId, async () => {
      try {
        console.log(`[SOCKET] Join request: user ${userId}, socket ${socket.id}, tenant ${socket.tenantId}`);
        
        if (!userId) {
          console.error('[SOCKET] Join attempt without userId');
          return;
        }

        // Security: Verify token matches the userId
        if (token) {
          try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (decoded.userId !== parseInt(userId) && decoded.userId !== userId) {
              console.error(`[SOCKET] Security Violation: User ${decoded.userId} attempted to join as ${userId}`);
              socket.emit('error', { message: 'Authentication mismatch: Token does not match requested User ID' });
              return;
            }
          } catch (err) {
            console.error('[SOCKET] Invalid token during join:', err.message);
            socket.emit('error', { message: 'Invalid or expired authentication token' });
            return;
          }
        } else if (process.env.NODE_ENV === 'production') {
          console.error('[SOCKET] Unauthenticated join attempt in production');
          socket.emit('error', { message: 'Authentication required for chat' });
          return;
        }

        // Concurrency: Add socketId to Set
        if (!connectedUsers.has(userId)) {
          connectedUsers.set(userId, new Set());
        }
        connectedUsers.get(userId).add(socket.id);
        
        socket.userId = userId;
        console.log(`[SOCKET] User ${userId} joined successfully. Active sockets for user: ${connectedUsers.get(userId).size}`);
        broadcastOnlineUsers();
      } catch (error) {
        console.error('[SOCKET] Error in join event:', error);
      }
    });
  });

  // Send message
  socket.on('send_message', (data) => {
    if (!data) return;
    tenantStorage.run(socket.tenantId, async () => {
      console.log('[SOCKET] Received send_message event');
      const { receiver_id, message, attachment_url, attachment_type, attachment_name } = data;
      const sender_id = socket.userId; // Get sender_id from the authenticated socket connection

      console.log(`[SOCKET] Processing message from sender_id: ${sender_id} to receiver_id: ${receiver_id} (Tenant: ${socket.tenantId})`);
      const { reply_to_id } = data;

      if (!sender_id) {
        console.error('[SOCKET] Sender ID not found in socket. User might not have joined.');
        socket.emit('error', { message: 'Authentication error: Please reconnect.' });
        return;
      }

      const userSockets = connectedUsers.get(receiver_id);

      // Basic validation
      if (!receiver_id || (!message && !attachment_url)) {
        console.error('Invalid message data:', { receiver_id, message, attachment_url });
        socket.emit('error', { message: 'Invalid message data' });
        return;
      }

      // Encrypt message before saving to database
      const encryptedMessage = encrypt(message);
      query(
        `INSERT INTO chat_messages (sender_id, receiver_id, message, attachment_url, attachment_type, attachment_name, reply_to_id) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING message_id, created_at`,
        [sender_id, receiver_id, encryptedMessage, attachment_url || null, attachment_type || null, attachment_name || null, reply_to_id || null]
      ).then(async (result) => {
        const { message_id, created_at } = result.rows[0];

        // Fetch parent message details if it's a reply
        let reply_to = null;
        if (reply_to_id) {
          const parentRes = await query('SELECT message_id, message, sender_id, attachment_url, attachment_type FROM chat_messages WHERE message_id = $1', [reply_to_id]);
          if (parentRes.rows.length > 0) {
            reply_to = parentRes.rows[0];
            reply_to.message = decrypt(reply_to.message);
          }
        }

        // Prepare message data for transmission
        const messageData = {
          message_id,
          sender_id,
          receiver_id,
          message: message, // Send decrypted message to recipient over WSS
          created_at,
          attachment_url,
          attachment_type,
          attachment_name,
          reply_to_id,
          reply_to
        };

        // Send to receiver if connected
        const receiverSockets = connectedUsers.get(receiver_id);
        if (receiverSockets && receiverSockets.size > 0) {
          console.log(`Sending message to receiver ${receiver_id} via ${receiverSockets.size} sockets`);
          
          // Update delivery status in DB
          query(`UPDATE chat_messages SET is_delivered = true, delivered_at = NOW() WHERE message_id = $1`, [message_id]);
          messageData.is_delivered = true;

          receiverSockets.forEach(sId => {
            io.to(sId).emit('receive_message', messageData);
          });
        } else {
          console.log(`Receiver ${receiver_id} not connected or not found`);
        }

        // Send back to sender for real-time UI update
        socket.emit('receive_message', messageData);

      }).catch(error => {
        console.error('Error saving message to database:', error);
        socket.emit('error', { message: 'Failed to send message' });
      });
    });
  });

  // Mark messages as read
  socket.on('mark_read', (data) => {
    if (!data) return;
    tenantStorage.run(socket.tenantId, async () => {
      const { sender_id } = data; // The user whose messages I am reading (the other person)
      const receiver_id = socket.userId; // Me

      if (!sender_id) return;

      try {
        await query(
          `UPDATE chat_messages SET is_read = true WHERE sender_id = $1 AND receiver_id = $2 AND is_read = false`,
          [sender_id, receiver_id]
        );

        // Notify the sender that I read their messages
        const senderSockets = connectedUsers.get(sender_id);
        if (senderSockets) {
          senderSockets.forEach(sId => {
            io.to(sId).emit('messages_read', {
              reader_id: receiver_id
            });
          });
        }
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });
  });

  // Typing indicator
  socket.on('typing', (data) => {
    const { receiver_id, sender_id } = data;
    const receiverSockets = connectedUsers.get(receiver_id);

    if (receiverSockets) {
      receiverSockets.forEach(sId => {
        io.to(sId).emit('user_typing', { sender_id });
      });
    }
  });

  // Stop typing
  socket.on('stop_typing', (data) => {
    const { receiver_id, sender_id } = data;
    const receiverSockets = connectedUsers.get(receiver_id);

    if (receiverSockets) {
      receiverSockets.forEach(sId => {
        io.to(sId).emit('user_stop_typing', { sender_id });
      });
    }
  });

  // Message reactions
  socket.on('message_reaction', (data) => {
    if (!data) return;
    tenantStorage.run(socket.tenantId, async () => {
      try {
        const { messageId, reaction } = data;
        const userId = socket.userId;
        if (!userId || !messageId) return;

        // Save to DB
        await query(
          `INSERT INTO message_reactions (message_id, user_id, reaction)
           VALUES ($1, $2, $3)
           ON CONFLICT (message_id, user_id)
           DO UPDATE SET reaction = EXCLUDED.reaction, created_at = NOW()`,
          [messageId, userId, reaction]
        );

        // Get conversation partners to notify
        const msgRes = await query(
          'SELECT sender_id, receiver_id, channel_id FROM chat_messages WHERE message_id = $1',
          [messageId]
        );
        
        if (msgRes.rows.length > 0) {
          const { sender_id, receiver_id, channel_id } = msgRes.rows[0];
          
          const reactionData = { messageId, reaction, userId };

          if (channel_id) {
            // Channel reaction
            io.to(`channel_${channel_id}`).emit('message_reaction', reactionData);
          } else {
            // Direct message reaction
            const partnerId = sender_id === userId ? receiver_id : sender_id;
            const partnerSockets = connectedUsers.get(partnerId);
            if (partnerSockets) {
              partnerSockets.forEach(sId => io.to(sId).emit('message_reaction', reactionData));
            }
            // Send back to sender's other sockets
            const mySockets = connectedUsers.get(userId);
            if (mySockets) {
              mySockets.forEach(sId => {
                if (sId !== socket.id) io.to(sId).emit('message_reaction', reactionData);
              });
            }
          }
        }
      } catch (error) {
        console.error('[SOCKET] Error saving reaction:', error);
      }
    });
  });
  // Star/Unstar message
  socket.on('star_message', (data) => {
    if (!data) return;
    tenantStorage.run(socket.tenantId, async () => {
      try {
        const { messageId, isStarred } = data;
        const userId = socket.userId;
        if (!userId || !messageId) return;

        await query(
          'UPDATE chat_messages SET is_starred = $1 WHERE message_id = $2 AND (sender_id = $3 OR receiver_id = $3)',
          [isStarred, messageId, userId]
        );

        // Notify partners
        const msgRes = await query('SELECT sender_id, receiver_id, channel_id FROM chat_messages WHERE message_id = $1', [messageId]);
        if (msgRes.rows.length > 0) {
          const { sender_id, receiver_id, channel_id } = msgRes.rows[0];
          const starData = { messageId, isStarred };
          if (channel_id) {
            io.to(`channel_${channel_id}`).emit('message_starred', starData);
          } else {
            const partnerId = sender_id === userId ? receiver_id : sender_id;
            const partnerSockets = connectedUsers.get(partnerId);
            if (partnerSockets) partnerSockets.forEach(sId => io.to(sId).emit('message_starred', starData));
            const mySockets = connectedUsers.get(userId);
            if (mySockets) mySockets.forEach(sId => { if (sId !== socket.id) io.to(sId).emit('message_starred', starData); });
          }
        }
      } catch (error) {
        console.error('[SOCKET] Star error:', error);
      }
    });
  });

  // Edit message via socket
  socket.on('edit_message', (data) => {
    if (!data) return;
    tenantStorage.run(socket.tenantId, async () => {
      try {
        const { messageId, message } = data;
        const userId = socket.userId;
        if (!userId || !messageId || !message) return;

        const encryptedMessage = encrypt(message);
        const result = await query(
          'UPDATE chat_messages SET message = $1, is_edited = true, updated_at = NOW() WHERE message_id = $2 AND sender_id = $3 RETURNING *',
          [encryptedMessage, messageId, userId]
        );

        if (result.rows.length > 0) {
          const updatedMessage = result.rows[0];
          const editData = { messageId, message, is_edited: true };
          if (updatedMessage.channel_id) {
            io.to(`channel_${updatedMessage.channel_id}`).emit('message_edited', editData);
          } else {
            const receiverId = updatedMessage.receiver_id;
            const partnerSockets = connectedUsers.get(receiverId);
            if (partnerSockets) partnerSockets.forEach(sId => io.to(sId).emit('message_edited', editData));
            const mySockets = connectedUsers.get(userId);
            if (mySockets) mySockets.forEach(sId => { if (sId !== socket.id) io.to(sId).emit('message_edited', editData); });
          }
        }
      } catch (error) {
        console.error('[SOCKET] Edit error:', error);
      }
    });
  });

  // Delete message via socket
  socket.on('delete_message', (data) => {
    if (!data) return;
    tenantStorage.run(socket.tenantId, async () => {
      try {
        const { messageId } = data;
        const userId = socket.userId;
        if (!userId || !messageId) return;

        const result = await query(
          'UPDATE chat_messages SET is_deleted = true, message = $1 WHERE message_id = $2 AND sender_id = $3 RETURNING *',
          [encrypt('🚫 Message Redacted'), messageId, userId]
        );

        if (result.rows.length > 0) {
          const deletedMessage = result.rows[0];
          const delData = { messageId, is_deleted: true };
          if (deletedMessage.channel_id) {
            io.to(`channel_${deletedMessage.channel_id}`).emit('message_deleted', delData);
          } else {
            const receiverId = deletedMessage.receiver_id;
            const partnerSockets = connectedUsers.get(receiverId);
            if (partnerSockets) partnerSockets.forEach(sId => io.to(sId).emit('message_deleted', delData));
            const mySockets = connectedUsers.get(userId);
            if (mySockets) mySockets.forEach(sId => { if (sId !== socket.id) io.to(sId).emit('message_deleted', delData); });
          }
        }
      } catch (error) {
        console.error('[SOCKET] Delete error:', error);
      }
    });
  });

  // Join Channel
  socket.on('join_channel', (data) => {
    if (!data || !data.channel_id) return;
    const roomName = `channel_${data.channel_id}`;
    socket.join(roomName);
    console.log(`[SOCKET] User ${socket.userId} joined channel ${data.channel_id}`);
  });

  // Leave Channel
  socket.on('leave_channel', (data) => {
    if (!data || !data.channel_id) return;
    const roomName = `channel_${data.channel_id}`;
    socket.leave(roomName);
    console.log(`[SOCKET] User ${socket.userId} left channel ${data.channel_id}`);
  });

  // Send Channel Message
  socket.on('send_channel_message', (data) => {
    if (!data || !data.channel_id || !data.message) return;
    
    tenantStorage.run(socket.tenantId, async () => {
      try {
        const sender_id = socket.userId;
        if (!sender_id) return;

        const { channel_id, message, attachment_url, attachment_type, attachment_name, reply_to_id } = data;
        
        // Save message directly (cannot use chatController due to circular dependency with server.js)
        const encryptedMessage = encrypt(message);
        const result = await query(
          `INSERT INTO chat_messages (sender_id, channel_id, message, attachment_url, attachment_type, attachment_name, reply_to_id) 
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING message_id, created_at`,
          [sender_id, channel_id, encryptedMessage, attachment_url || null, attachment_type || null, attachment_name || null, reply_to_id || null]
        );

        const { message_id, created_at } = result.rows[0];

        // Fetch parent message details if it's a reply
        let reply_to = null;
        if (reply_to_id) {
          const parentRes = await query('SELECT message_id, message, sender_id, attachment_url, attachment_type FROM chat_messages WHERE message_id = $1', [reply_to_id]);
          if (parentRes.rows.length > 0) {
            reply_to = parentRes.rows[0];
            reply_to.message = decrypt(reply_to.message);
          }
        }

        const messageData = {
          message_id,
          sender_id,
          channel_id,
          message: message, // Decrypted message for real-time UI
          created_at,
          attachment_url,
          attachment_type,
          attachment_name,
          reply_to_id,
          reply_to
        };

        // Broadcast to everyone in the room
        io.to(`channel_${channel_id}`).emit('receive_channel_message', messageData);
        console.log(`[SOCKET] Broadcasted message to channel_${channel_id}`);
      } catch (error) {
        console.error('[SOCKET] Error saving channel message:', error);
        socket.emit('error', { message: 'Failed to send channel message' });
      }
    });
  });

  // Disconnect
  socket.on('disconnect', () => {
    if (socket.userId && connectedUsers.has(socket.userId)) {
      const userSockets = connectedUsers.get(socket.userId);
      userSockets.delete(socket.id);
      
      if (userSockets.size === 0) {
        connectedUsers.delete(socket.userId);
        console.log(`User ${socket.userId} fully disconnected (no active tabs)`);
        broadcastOnlineUsers();
      } else {
        console.log(`Socket ${socket.id} closed for user ${socket.userId}. Remaining tabs: ${userSockets.size}`);
      }
    }
    console.log('Client disconnected:', socket.id);
  });
};

module.exports = setupChatSocket;
