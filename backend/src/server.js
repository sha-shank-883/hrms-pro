const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const { pool, query, tenantStorage } = require('./config/database');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { sanitizeBody } = require('./middleware/validate');

// Import routes
const authRoutes = require('./routes/authRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const taskRoutes = require('./routes/taskRoutes');
const payrollRoutes = require('./routes/payrollRoutes');
const recruitmentRoutes = require('./routes/recruitmentRoutes');
const documentRoutes = require('./routes/documentRoutes');
const chatRoutes = require('./routes/chatRoutes');
const reportRoutes = require('./routes/reportRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const performanceRoutes = require('./routes/performanceRoutes');
const tenantRoutes = require('./routes/tenantRoutes');

// Initialize express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Rate limiting (skip for unauthenticated settings calls)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for settings endpoint when unauthenticated
    return req.path === '/settings' && !req.headers.authorization;
  }
});

// Middleware
app.use(helmet()); // Security headers
app.use(compression()); // Compress responses
app.use(cors({
  origin: [process.env.FRONTEND_URL || 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev')); // Logging
app.use(sanitizeBody); // Input sanitization
// app.use('/api/', limiter); // Rate limiting - DISABLED for development

// Multi-tenancy Middleware
const tenantMiddleware = require('./middleware/tenantMiddleware');
app.use('/api', tenantMiddleware);

// Temporary Debug Route for Multi-Tenancy
app.get('/api/tenant-info', (req, res) => {
  if (!req.tenant) {
    return res.status(400).json({ error: 'No tenant context found' });
  }
  res.json({
    message: 'Tenant Context Verified',
    tenant_id: req.tenant.tenant_id,
    tenant_name: req.tenant.name
  });
});

// Serve static files (uploads)
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/recruitment', recruitmentRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/assets', require('./routes/assetRoutes'));
app.use('/api/audit-logs', require('./routes/auditRoutes'));
app.use('/api/tenants', tenantRoutes);

const connectedUsers = new Map();

const broadcastOnlineUsers = () => {
  const onlineUserIds = Array.from(connectedUsers.keys());
  io.emit('update_online_users', onlineUserIds);
};

io.on('connection', (socket) => {
  // Get tenant ID from handshake
  const tenantId = socket.handshake.query.tenantId || 'tenant_default';
  socket.tenantId = tenantId;
  console.log(`New client connected: ${socket.id} (Tenant: ${tenantId})`);

  // User joins with their user ID
  socket.on('join', (userId) => {
    tenantStorage.run(socket.tenantId, async () => {
      try {
        console.log(`[SOCKET] Join request received for userId: ${userId}, socket: ${socket.id}, tenant: ${socket.tenantId}`);
        if (!userId) {
          console.error('[SOCKET] Join attempt without userId');
          return;
        }
        connectedUsers.set(userId, socket.id);
        socket.userId = userId;
        console.log(`[SOCKET] User ${userId} joined successfully. Connected users: ${connectedUsers.size}`);
        broadcastOnlineUsers();
      } catch (error) {
        console.error('[SOCKET] Error in join event:', error);
      }
    });
  });

  // Send message
  socket.on('send_message', (data) => {
    tenantStorage.run(socket.tenantId, async () => {
      console.log('[SOCKET] Received send_message event:', JSON.stringify(data));
      const { receiver_id, message, attachment_url, attachment_type, attachment_name } = data;
      const sender_id = socket.userId; // Get sender_id from the authenticated socket connection

      console.log(`[SOCKET] Processing message from sender_id: ${sender_id} to receiver_id: ${receiver_id} (Tenant: ${socket.tenantId})`);

      if (!sender_id) {
        console.error('[SOCKET] Sender ID not found in socket. User might not have joined.');
        socket.emit('error', { message: 'Authentication error: Please reconnect.' });
        return;
      }

      const receiverSocketId = connectedUsers.get(receiver_id);

      // Basic validation
      if (!receiver_id || (!message && !attachment_url)) {
        console.error('Invalid message data:', { receiver_id, message, attachment_url });
        socket.emit('error', { message: 'Invalid message data' });
        return;
      }

      // TODO: Implement message encryption before saving to database
      // For now, saving message to database
      query(
        `INSERT INTO chat_messages (sender_id, receiver_id, message, attachment_url, attachment_type, attachment_name) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING message_id, created_at`,
        [sender_id, receiver_id, message, attachment_url || null, attachment_type || null, attachment_name || null]
      ).then(result => {
        const { message_id, created_at } = result.rows[0];

        // Prepare message data for transmission
        const messageData = {
          message_id,
          sender_id,
          receiver_id,
          message, // TODO: Implement decryption for recipient
          created_at,
          attachment_url,
          attachment_type,
          attachment_name
        };

        // Send to receiver if connected
        if (receiverSocketId) {
          console.log(`Sending message to receiver ${receiver_id} via socket ${receiverSocketId}`);
          // TODO: Implement encryption for real-time transmission
          io.to(receiverSocketId).emit('receive_message', messageData);
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
        const senderSocketId = connectedUsers.get(sender_id);
        if (senderSocketId) {
          io.to(senderSocketId).emit('messages_read', {
            reader_id: receiver_id
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
    const receiverSocketId = connectedUsers.get(receiver_id);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit('user_typing', { sender_id });
    }
  });

  // Stop typing
  socket.on('stop_typing', (data) => {
    const { receiver_id, sender_id } = data;
    const receiverSocketId = connectedUsers.get(receiver_id);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit('user_stop_typing', { sender_id });
    }
  });

  // WebRTC Signaling for calls
  socket.on('initiate_call', (data) => {
    const { receiver_id, caller_id, caller_name, callType, offer } = data;
    const receiverSocketId = connectedUsers.get(receiver_id);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit('call_initiated', {
        caller_id,
        caller_name,
        callType,
        offer
      });
    }
  });

  socket.on('accept_call', (data) => {
    const { caller_id, answer } = data;
    const callerSocketId = connectedUsers.get(caller_id);

    if (callerSocketId) {
      io.to(callerSocketId).emit('call_accepted', { answer });
    }
  });

  socket.on('reject_call', (data) => {
    const { caller_id } = data;
    const callerSocketId = connectedUsers.get(caller_id);

    if (callerSocketId) {
      io.to(callerSocketId).emit('call_rejected');
    }
  });

  socket.on('ice_candidate', (data) => {
    const { receiver_id, candidate } = data;
    const receiverSocketId = connectedUsers.get(receiver_id);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit('ice_candidate', { candidate });
    }
  });

  socket.on('end_call', (data) => {
    const { receiver_id } = data;
    const receiverSocketId = connectedUsers.get(receiver_id);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit('call_ended');
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    if (socket.userId) {
      connectedUsers.delete(socket.userId);
      console.log(`User ${socket.userId} disconnected`);
      broadcastOnlineUsers();
    }
    console.log('Client disconnected:', socket.id);
  });
});

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log('');
  console.log('🚀 ============================================');
  console.log(`   HRMS Pro Server Running`);
  console.log('   ============================================');
  console.log(`   📍 Server: http://localhost:${PORT}`);
  console.log(`   🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   📊 Database: PostgreSQL`);
  console.log(`   💬 WebSocket: Enabled`);
  console.log('   ============================================');
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    pool.end(() => {
      console.log('Database pool closed');
      process.exit(0);
    });
  });
});

module.exports = { app, io };