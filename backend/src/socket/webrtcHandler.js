// WebRTC Signaling for calls
const setupWebRTCSocket = (io, socket, connectedUsers) => {
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
};

module.exports = setupWebRTCSocket;
