const { io: socketIO } = require('socket.io-client');
const http = require('http');

function request(method, path, headers, body) {
  return new Promise((resolve, reject) => {
    const opts = { hostname: 'localhost', port: 5001, path, method, headers };
    const req = http.request(opts, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function test() {
  const loginRes = await request('POST', '/api/auth/login',
    { 'Content-Type': 'application/json', 'x-tenant-id': 'tenant_default' },
    JSON.stringify({ email: 'info@hrmspro.online', password: 'hrmspro@123' })
  );
  const userId = loginRes.data.user.userId;
  const token = loginRes.data.token;
  console.log('Logged in as user:', userId);

  const chatRes = await request('POST', '/api/support/chat/start',
    { 'Content-Type': 'application/json', 'x-tenant-id': 'tenant_default', 'Authorization': 'Bearer ' + token },
    JSON.stringify({})
  );
  const chatId = chatRes.data.chat_id;
  console.log('Chat started:', chatId, '| AI active:', chatRes.data.is_ai_active);

  const socket = socketIO('http://localhost:5001', { query: { tenantId: 'tenant_default' } });

  let responseCount = 0;

  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
    socket.emit('support:join', { userId, role: loginRes.data.user.role });

    socket.on('support:receive_message', (msg) => {
      responseCount++;
      console.log('RECEIVED #' + responseCount + ':', msg.sender_type, '|', (msg.message || '').substring(0, 100));
    });

    socket.on('support:error', (err) => {
      console.error('Socket error:', JSON.stringify(err));
    });

    setTimeout(() => {
      console.log('\nSending message...');
      socket.emit('support:send_message', { chatId, message: 'What is the company leave policy?' });
    }, 1000);

    setTimeout(() => {
      console.log('\n=== RESULT ===');
      if (responseCount > 0) {
        console.log('PASS: Got ' + responseCount + ' response(s)');
      } else {
        console.log('FAIL: No response received');
      }
      socket.disconnect();
      process.exit(0);
    }, 15000);
  });

  socket.on('connect_error', (err) => {
    console.error('Socket connect error:', err.message);
    process.exit(1);
  });
}
test().catch(e => { console.error('Fatal:', e); process.exit(1); });
