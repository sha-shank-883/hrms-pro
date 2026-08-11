const { io: Client } = require('socket.io-client');
const http = require('http');

const SERVER_URL = 'http://localhost:5001';
const TENANT_ID = 'default';

let passed = 0;
let failed = 0;
const results = [];
let capturedMsgId = null;

const apiPost = (path, body, headers = {}) => new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const url = new URL(path, SERVER_URL);
    const opts = {
        hostname: url.hostname, port: url.port, path: url.pathname,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data), 'X-Tenant-ID': TENANT_ID, ...headers }
    };
    const req = http.request(opts, res => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve(JSON.parse(body)));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
});

const apiGet = (path, headers = {}) => new Promise((resolve, reject) => {
    const url = new URL(path, SERVER_URL);
    const opts = {
        hostname: url.hostname, port: url.port, path: url.pathname + (url.search || ''),
        method: 'GET',
        headers: { 'X-Tenant-ID': TENANT_ID, ...headers }
    };
    const req = http.request(opts, res => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve(JSON.parse(body)));
    });
    req.on('error', reject);
    req.end();
});

const test = async (name, fn) => {
    try {
        await fn();
        results.push({ name, status: '✅ PASS' });
        passed++;
    } catch (err) {
        results.push({ name, status: '❌ FAIL', error: err.message });
        failed++;
        console.error(`  ❌ ${name}: ${err.message}`);
    }
};

const wait = (ms) => new Promise(r => setTimeout(r, ms));

const socketConnect = (userId, token) => new Promise((resolve, reject) => {
    const s = Client(SERVER_URL, { query: { tenantId: TENANT_ID } });
    s.on('connect', () => {
        s.emit('join', { userId, token });
        setTimeout(() => resolve(s), 500);
    });
    s.on('connect_error', reject);
    setTimeout(() => reject(new Error('Socket connection timeout')), 5000);
});

const runTests = async () => {
    console.log('========================================');
    console.log('PHASE 1.5: SOCKET.IO REAL-TIME EVENTS');
    console.log('========================================\n');

    // Login
    const loginRes = await apiPost('/api/auth/login', { email: 'admin@hrmspro.com', password: 'admin123' });
    const token = loginRes.data.token;
    const userId = loginRes.data.user.userId;
    console.log(`📋 Logged in as user ${userId}`);

    // Register and login a test user
    const testEmail = `socket_test_${Date.now()}@test.com`;
    const regRes = await apiPost('/api/auth/register', { email: testEmail, password: 'Test@123', name: 'Socket Test' });
    const testUserId = regRes.data?.user?.userId || regRes.data?.userId;
    console.log(`📋 Test user ID: ${testUserId}`);
    const testLogin = await apiPost('/api/auth/login', { email: testEmail, password: 'Test@123' });
    const testToken = testLogin.data.token;
    console.log(`📋 Test user token obtained\n`);

    // 1.5.1 Connection
    await test('1.5.1 Socket connection with tenant ID', async () => {
        const s = Client(SERVER_URL, { query: { tenantId: TENANT_ID } });
        await new Promise((resolve, reject) => {
            s.on('connect', () => { s.close(); resolve(); });
            s.on('connect_error', reject);
            setTimeout(() => reject(new Error('Connection timeout')), 5000);
        });
    });

    // Connect sockets
    const socket = await socketConnect(userId, token);
    console.log('  ✅ User socket connected');
    const socket2 = await socketConnect(testUserId, testToken);
    console.log('  ✅ Test user socket connected');

    // 1.5.3 Invalid token
    await test('1.5.3 join event with invalid token', async () => {
        const badSocket = Client(SERVER_URL, { query: { tenantId: TENANT_ID } });
        const result = await new Promise(resolve => {
            badSocket.on('connect', () => {
                badSocket.emit('join', { userId: 9999, token: 'bad-token' });
                badSocket.on('error', (err) => { badSocket.close(); resolve(true); });
                setTimeout(() => { badSocket.close(); resolve(false); }, 2000);
            });
        });
        if (!result) throw new Error('Expected error was not emitted');
    });

    // 1.5.4 Send & receive — capture message_id for subsequent tests
    await test('1.5.4 send_message event', async () => {
        const received = new Promise(resolve => {
            socket2.on('receive_message', (data) => {
                capturedMsgId = data.message_id;
                if (data.message === 'Socket test message') resolve(true);
            });
        });
        socket.emit('send_message', { receiver_id: testUserId, message: 'Socket test message' });
        const ok = await Promise.race([received, wait(3000).then(() => false)]);
        if (!ok) throw new Error('Message not received by target socket');
        if (!capturedMsgId) throw new Error('No message_id in received message');
    });

    // 1.5.5 Mark read
    await test('1.5.5 mark_read event', async () => {
        if (!capturedMsgId) throw new Error('No messages exist');
        socket.emit('mark_read', { sender_id: testUserId, messageIds: [capturedMsgId] });
        await wait(300);
    });

    // 1.5.6 Typing
    await test('1.5.6 typing / stop_typing events', async () => {
        const typing = new Promise(resolve => { socket2.once('user_typing', () => resolve(true)); });
        socket.emit('typing', { receiver_id: testUserId });
        const ok = await Promise.race([typing, wait(2000).then(() => false)]);
        if (!ok) throw new Error('Typing indicator not received');
        socket.emit('stop_typing', { receiver_id: testUserId });
        await wait(300);
    });

    // 1.5.7 Message reactions
    await test('1.5.7 message_reaction event', async () => {
        if (!capturedMsgId) throw new Error('No messages');
        socket.emit('message_reaction', { messageId: capturedMsgId, reaction: '👍' });
        await wait(300);
    });

    // 1.5.8 Star message
    await test('1.5.8 star_message event', async () => {
        if (!capturedMsgId) throw new Error('No messages');
        socket.emit('star_message', { messageId: capturedMsgId });
        await wait(300);
    });

    // 1.5.9 Edit message
    await test('1.5.9 edit_message event', async () => {
        if (!capturedMsgId) throw new Error('No messages');
        socket.emit('edit_message', { messageId: capturedMsgId, newMessage: 'Edited!' });
        await wait(300);
    });

    // 1.5.10 Delete message
    await test('1.5.10 delete_message event', async () => {
        if (!capturedMsgId) throw new Error('No messages');
        socket.emit('delete_message', { messageId: capturedMsgId });
        await wait(300);
    });

    // 1.5.11 Call signaling
    await test('1.5.11 initiate_call / accept_call / reject_call', async () => {
        const callReceived = new Promise(resolve => { socket2.once('call_initiated', () => resolve(true)); });
        socket.emit('initiate_call', { receiver_id: testUserId });
        const ok = await Promise.race([callReceived, wait(3000).then(() => false)]);
        if (!ok) throw new Error('Call not received');
        socket2.emit('accept_call', { caller_id: userId, answer: { sdp: 'test-answer' } });
        await wait(300);
        socket.emit('end_call', { receiver_id: testUserId });
        await wait(300);
    });

    // 1.5.12 ICE candidates
    await test('1.5.12 ice_candidate event', async () => {
        socket.emit('ice_candidate', { receiver_id: testUserId, candidate: { sdp: 'test-ice' } });
        await wait(300);
    });

    // 1.5.13 End call
    await test('1.5.13 end_call event', async () => {
        const endReceived = new Promise(resolve => { socket2.once('call_ended', () => resolve(true)); });
        // First initiate call so we have a call to end
        socket.emit('initiate_call', { receiver_id: testUserId });
        await wait(500);
        socket.emit('end_call', { receiver_id: testUserId });
        const ok = await Promise.race([endReceived, wait(2000).then(() => false)]);
        if (!ok) throw new Error('Call end not received');
    });

    // 1.5.14 Join/Leave channel
    await test('1.5.14 join_channel / leave_channel', async () => {
        socket.emit('join_channel', { channel_id: 'test-channel' });
        await wait(200);
        socket.emit('leave_channel', { channel_id: 'test-channel' });
        await wait(200);
    });

    // Create a channel via API for channel message test
    const channelRes = await apiPost('/api/chat/channels', { name: 'Test Channel', description: 'For Socket.IO test' }, { Authorization: `Bearer ${token}` });
    const channelId = channelRes.data?.channel_id || channelRes.data?.id;
    if (!channelId) console.log('  ⚠ Could not create channel (may already exist)');

    // 1.5.15 Channel message
    await test('1.5.15 send_channel_message', async () => {
        const cid = channelId || '1';
        socket.emit('join_channel', { channel_id: cid });
        socket2.emit('join_channel', { channel_id: cid });
        await wait(500);
        const received = new Promise(resolve => { socket2.once('receive_channel_message', () => resolve(true)); });
        socket.emit('send_channel_message', { channel_id: cid, message: 'Hello channel!' });
        const ok = await Promise.race([received, wait(3000).then(() => false)]);
        if (!ok) throw new Error('Channel message not received');
    });

    // 1.5.16 Disconnect
    await test('1.5.16 disconnect event', async () => {
        const oldId = socket.id;
        socket.close();
        await wait(500);
        // Reconnect
        const newSocket = await socketConnect(userId, token);
        Object.assign(socket, newSocket);
    });

    // 1.5.17 Multiple tabs — also captures update_online_users broadcast
    let onlineBroadcastOk = false;
    await test('1.5.17 Multiple tabs: same user connects twice', async () => {
        // Listen for the broadcast that happens when tab2 disconnects
        socket2.on('update_online_users', (users) => { onlineBroadcastOk = Array.isArray(users) && users.length > 0; });
        const tab2 = await socketConnect(userId, token);
        await wait(500);
        tab2.close();
        await wait(500);
    });

    // 1.5.18 Online users
    await test('1.5.18 update_online_users broadcast', async () => {
        if (!onlineBroadcastOk) throw new Error('Online users not broadcast');
    });

    // Cleanup
    socket.close();
    socket2.close();

    // Results
    console.log(`\n========================================`);
    console.log(`PHASE 1.5 RESULTS: ✅ ${passed} / ❌ ${failed}`);
    console.log(`========================================`);
    results.forEach(r => console.log(`${r.status} ${r.name}`));
    console.log(`========================================\n`);
};

runTests().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
