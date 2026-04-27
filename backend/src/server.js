const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const { pool, query, tenantStorage } = require('./config/database');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { sanitizeBody } = require('./middleware/validate');
const fs = require('fs');
const path = require('path');
const { encrypt, decrypt } = require('./utils/crypto');

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
const emailTemplateRoutes = require('./routes/emailTemplateRoutes');
const performanceRoutes = require('./routes/performanceRoutes');
const tenantRoutes = require('./routes/tenantRoutes');
const searchRoutes = require('./routes/searchRoutes');

// Initialize express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
// Initialize Socket.IO
const io = socketIo(server, {
  cors: {
    origin: true,
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

// Middleware to attach io to req
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
})); // Security headers
app.use(compression()); // Compress responses
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev')); // Logging
app.use(sanitizeBody); // Input sanitization
// app.use('/api/', limiter); // Rate limiting - DISABLED for development

// ONE-OFF DATABASE SETUP ROUTE (For Render deployment)
app.get('/api/setup-db', async (req, res) => {
  const setupPassword = req.headers['x-setup-password'] || req.query.password;
  const envPassword = process.env.SETUP_PASSWORD || 'ChangeMe123'; // Default placeholder

  if (process.env.NODE_ENV === 'production' && setupPassword !== envPassword) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Setup password required in production' });
  }

  const client = await pool.connect();
  try {
    console.log('🔄 Starting Database Setup via HTTP...');

    // 1. Create Shared Schema and Global Tables
    const sharedSchemaPath = path.join(__dirname, 'config/shared_schema.sql');
    if (fs.existsSync(sharedSchemaPath)) {
      const sharedSchemaSql = fs.readFileSync(sharedSchemaPath, 'utf8');
      await client.query(sharedSchemaSql);
      console.log('✅ Shared schema and core tables verified.');
    } else {
      await client.query(`CREATE SCHEMA IF NOT EXISTS shared`);
    }

    // Ensure Global Marketing/CMS Tables exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS shared.website_settings (
        id SERIAL PRIMARY KEY,
        primary_color VARCHAR(50),
        font_family VARCHAR(100),
        logo_url TEXT,
        header_links JSONB DEFAULT '[]',
        footer_columns JSONB DEFAULT '[]',
        sections JSONB DEFAULT '[]',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS shared.cms_pages (
        id SERIAL PRIMARY KEY,
        slug VARCHAR(255) UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        content_html TEXT,
        sections JSONB DEFAULT '[]',
        meta_title VARCHAR(255),
        meta_description TEXT,
        published_status VARCHAR(50) DEFAULT 'published',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Global CMS tables verified.');

    // 2. Create Default Tenant
    const defaultTenantId = 'tenant_default';
    await client.query(`
      INSERT INTO shared.tenants (tenant_id, name, status)
      VALUES ($1, $2, 'active')
      ON CONFLICT (tenant_id) DO NOTHING
    `, [defaultTenantId, 'Default Company']);

    // 4. Run Migration for ALL Tenants
    const tenantsResult = await client.query('SELECT tenant_id FROM shared.tenants');
    const tenants = tenantsResult.rows;
    
    const tenantSchemaPath = path.join(__dirname, 'config/tenant_schema.sql');
    const hasTenantSchema = fs.existsSync(tenantSchemaPath);
    const tenantSchemaSql = hasTenantSchema ? fs.readFileSync(tenantSchemaPath, 'utf8') : '';

    console.log(`🔄 Syncing schema for ${tenants.length} tenants...`);

    for (const tenant of tenants) {
      const tId = tenant.tenant_id;
      try {
        console.log(`   - Syncing tenant: ${tId}`);
        await client.query(`CREATE SCHEMA IF NOT EXISTS "${tId}"`);
        await client.query(`SET search_path TO "${tId}"`);
        
        if (hasTenantSchema) {
          await client.query(tenantSchemaSql);
        }

        // CRITICAL: Ensure permissions and security columns exist in the users table for THIS tenant
        await client.query(`
          ALTER TABLE users 
          ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]'::jsonb,
          ADD COLUMN IF NOT EXISTS is_two_factor_enabled BOOLEAN DEFAULT false,
          ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255),
          ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
          ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP
        `);

        // Ensure Admin User Exists for this tenant
        await client.query(`
          INSERT INTO users (email, password_hash, role) 
          VALUES ('admin@hrmspro.com', '$2b$10$ZI0JCV5V.vT7b4sMK/FUA.xOFngGT9VQ64TK.ug4EvYwlda2FyTou', 'admin')
          ON CONFLICT (email) DO NOTHING
        `);
      } catch (tenantError) {
        console.error(`   ❌ Failed to sync tenant ${tId}:`, tenantError.message);
      }
    }

    res.json({ 
      success: true, 
      message: `Database setup and schema synchronization completed for ${tenants.length} tenants!` 
    });
  } catch (error) {
    console.error('Setup failed:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    client.release();
  }
});

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
app.use('/api/holidays', require('./routes/holidayRoutes'));
app.use('/api/shifts', require('./routes/shiftRoutes'));
app.use('/api/email-templates', emailTemplateRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/cms', require('./routes/cmsRoutes'));
app.use('/api/leads', require('./routes/leadRoutes'));
app.use('/api/website-settings', require('./routes/websiteSettingsRoutes'));

const connectedUsers = new Map(); // userId -> Set of socketIds

const broadcastOnlineUsers = () => {
  const onlineUserIds = Array.from(connectedUsers.keys());
  io.emit('update_online_users', onlineUserIds);
};

io.on('connection', (socket) => {
  // Get tenant ID from handshake
  const tenantId = socket.handshake.query.tenantId || 'tenant_default';
  socket.tenantId = tenantId;
  socket.join(tenantId); // Join tenant-specific room
  console.log(`New client connected: ${socket.id} (Tenant: ${tenantId})`);

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
      console.log('[SOCKET] Received send_message event:', JSON.stringify(data));
      const { receiver_id, message, attachment_url, attachment_type, attachment_name } = data;
      const sender_id = socket.userId; // Get sender_id from the authenticated socket connection

      console.log(`[SOCKET] Processing message from sender_id: ${sender_id} to receiver_id: ${receiver_id} (Tenant: ${socket.tenantId})`);

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

      // TODO: Implement message encryption before saving to database
      // For now, saving message to database
      const encryptedMessage = encrypt(message);
      query(
        `INSERT INTO chat_messages (sender_id, receiver_id, message, attachment_url, attachment_type, attachment_name) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING message_id, created_at`,
        [sender_id, receiver_id, encryptedMessage, attachment_url || null, attachment_type || null, attachment_name || null]
      ).then(result => {
        const { message_id, created_at } = result.rows[0];

        // Prepare message data for transmission
        const messageData = {
          message_id,
          sender_id,
          receiver_id,
          message: message, // Send decrypted message to recipient over WSS
          created_at,
          attachment_url,
          attachment_type,
          attachment_name
        };

        // Send to receiver if connected
        const receiverSockets = connectedUsers.get(receiver_id);
        if (receiverSockets && receiverSockets.size > 0) {
          console.log(`Sending message to receiver ${receiver_id} via ${receiverSockets.size} sockets`);
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

  // WebRTC Signaling for calls
  socket.on('initiate_call', (data) => {
    const { receiver_id, caller_id, caller_name, callType, offer } = data;
    const receiverSockets = connectedUsers.get(receiver_id);

    if (receiverSockets) {
      receiverSockets.forEach(sId => {
        io.to(sId).emit('call_initiated', {
          caller_id,
          caller_name,
          callType,
          offer
        });
      });
    }
  });

  socket.on('accept_call', (data) => {
    const { caller_id, answer } = data;
    const callerSockets = connectedUsers.get(caller_id);

    if (callerSockets) {
      callerSockets.forEach(sId => {
        io.to(sId).emit('call_accepted', { answer });
      });
    }
  });

  socket.on('reject_call', (data) => {
    const { caller_id } = data;
    const callerSockets = connectedUsers.get(caller_id);

    if (callerSockets) {
      callerSockets.forEach(sId => {
        io.to(sId).emit('call_rejected');
      });
    }
  });

  socket.on('ice_candidate', (data) => {
    const { receiver_id, candidate } = data;
    const receiverSockets = connectedUsers.get(receiver_id);

    if (receiverSockets) {
      receiverSockets.forEach(sId => {
        io.to(sId).emit('ice_candidate', { candidate });
      });
    }
  });

  socket.on('end_call', (data) => {
    const { receiver_id } = data;
    const receiverSockets = connectedUsers.get(receiver_id);

    if (receiverSockets) {
      receiverSockets.forEach(sId => {
        io.to(sId).emit('call_ended');
      });
    }
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

// Handle server startup errors (like EADDRINUSE)
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ FATAL ERROR: Port ${PORT} is already in use.`);
    console.error('   Please kill the process holding the port or use a different PORT.');
    process.exit(1);
  } else {
    console.error('❌ Server error:', error);
  }
});

// Graceful shutdown function
const shutdown = (signal) => {
  console.log(`\n[${signal}] signal received: closing HTTP server`);
  server.close(() => {
    console.log('HTTP server closed');
    pool.end(() => {
      console.log('Database pool closed');
      process.exit(0);
    });
  });
};

// Handle termination signals
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = { app, io };