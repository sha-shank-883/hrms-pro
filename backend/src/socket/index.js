const setupChatSocket = require('./chatHandler');
const setupWebRTCSocket = require('./webrtcHandler');
const { setupSupportSocket } = require('./supportSocket');

const setupSocketHandlers = (io, connectedUsers) => {
  io.on('connection', (socket) => {
    const tenantId = socket.handshake.query.tenantId || 'tenant_default';
    socket.tenantId = tenantId;
    socket.join(tenantId);
    console.log(`New client connected: ${socket.id} (Tenant: ${tenantId})`);

    const broadcastOnlineUsers = () => {
      const onlineUserIds = Array.from(connectedUsers.keys());
      io.emit('update_online_users', onlineUserIds);
    };

    setupChatSocket(io, socket, connectedUsers, broadcastOnlineUsers);
    setupWebRTCSocket(io, socket, connectedUsers);
  });

  setupSupportSocket(io, connectedUsers);
};

module.exports = { setupSocketHandlers };
