const io = require('socket.io-client');

const SOCKET_URL = 'http://localhost:5001';
const SENDER_ID = 18; // Ensure these IDs exist in your DB
const RECEIVER_ID = 19;



const socket = io(SOCKET_URL);

socket.on('connect', () => {
    

    // 1. Join
    
    socket.emit('join', SENDER_ID);

    // Wait a bit then send message
    setTimeout(() => {
        
        socket.emit('send_message', {
            receiver_id: RECEIVER_ID,
            message: 'Test message from socket client script ' + new Date().toISOString()
        });
    }, 1000);
});

socket.on('receive_message', (data) => {
    
    if (data.message.includes('Test message from socket client script')) {
        
        socket.disconnect();
        process.exit(0);
    }
});

socket.on('error', (err) => {
    console.error('Socket error:', err);
});

// Timeout
setTimeout(() => {
    
    socket.disconnect();
    process.exit(1);
}, 5000);
