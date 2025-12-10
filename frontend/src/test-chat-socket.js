import io from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5001';
const SENDER_ID = 18; // Ensure these IDs exist in your DB
const RECEIVER_ID = 19;

console.log(`Connecting to ${SOCKET_URL}...`);

const socket = io(SOCKET_URL);

socket.on('connect', () => {
    console.log('Connected to server with ID:', socket.id);

    // 1. Join
    console.log(`Joining as user ${SENDER_ID}...`);
    socket.emit('join', SENDER_ID);

    // Wait a bit then send message
    setTimeout(() => {
        console.log(`Sending message to ${RECEIVER_ID}...`);
        socket.emit('send_message', {
            receiver_id: RECEIVER_ID,
            message: 'Test message from socket client script ' + new Date().toISOString()
        });
    }, 1000);
});

socket.on('receive_message', (data) => {
    console.log('Received message:', data);
    if (data.message.includes('Test message from socket client script')) {
        console.log('SUCCESS: Message round-trip complete!');
        socket.disconnect();
        process.exit(0);
    }
});

socket.on('error', (err) => {
    console.error('Socket error:', err);
});

// Timeout
setTimeout(() => {
    console.log('Timeout waiting for response.');
    socket.disconnect();
    process.exit(1);
}, 5000);
