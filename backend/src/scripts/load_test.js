const http = require('http');

const BASE_URL = 'http://localhost:5001';
const TENANT_ID = 'tenant_default';

let authToken = '';
let resultsCount = 0;

async function makeRequest(path, method = 'GET', body = null, headers = {}) {
  return new Promise((resolve) => {
    const startTime = process.hrtime();
    const url = new URL(path, BASE_URL);
    
    const requestHeaders = {
      'x-tenant-id': TENANT_ID,
      'Content-Type': 'application/json',
      ...headers
    };
    if (authToken) {
      requestHeaders['Authorization'] = `Bearer ${authToken}`;
    }

    const payload = body ? JSON.stringify(body) : null;
    if (payload) {
      requestHeaders['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(url, { method, headers: requestHeaders }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const diff = process.hrtime(startTime);
        const latencyMs = (diff[0] * 1000) + (diff[1] / 1e6);
        if (path === '/api/auth/login' && res.statusCode === 200) {
          try {
            const parsed = JSON.parse(data);
            authToken = parsed.data?.token || parsed.token || '';
          } catch (e) {}
        }
        if (res.statusCode >= 400 && resultsCount < 3) {
          resultsCount++;
          console.log(`⚠️ Request Debug [${path}]: HTTP ${res.statusCode} | Body: ${data.substring(0, 100)}`);
        }
        resolve({
          statusCode: res.statusCode,
          latencyMs,
          success: res.statusCode >= 200 && res.statusCode < 400
        });
      });
    });

    req.on('error', (err) => {
      const diff = process.hrtime(startTime);
      const latencyMs = (diff[0] * 1000) + (diff[1] / 1e6);
      resolve({
        statusCode: 0,
        latencyMs,
        success: false,
        error: err.message
      });
    });

    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

async function login() {
  console.log('🔑 Authenticating load test user...');
  let res = await makeRequest('/api/auth/login', 'POST', {
    email: 'info@hrmspro.online',
    password: 'Hrmspro@123'
  });
  if (!res.success) {
    res = await makeRequest('/api/auth/login', 'POST', {
      email: 'admin@hrmspro.com',
      password: 'password123'
    });
  }
  if (res.success) {
    console.log(`✅ Login Successful (${res.latencyMs.toFixed(2)} ms)`);
  } else {
    console.error(`❌ Login Failed! HTTP ${res.statusCode}`);
  }
}

async function runBenchmark(name, path, method = 'GET', body = null, concurrency = 20, totalRequests = 200) {
  console.log(`\n🚀 Testing: ${name} [${method} ${path}] | Concurrency: ${concurrency} | Total: ${totalRequests}`);
  
  const results = [];
  const startTime = Date.now();
  let completed = 0;

  async function worker() {
    while (completed < totalRequests) {
      completed++;
      const res = await makeRequest(path, method, body);
      results.push(res);
    }
  }

  const workers = [];
  for (let i = 0; i < concurrency; i++) {
    workers.push(worker());
  }

  await Promise.all(workers);
  const totalTimeSec = (Date.now() - startTime) / 1000;

  const latencies = results.map(r => r.latencyMs).sort((a, b) => a - b);
  const totalSuccess = results.filter(r => r.success).length;
  const totalFail = results.length - totalSuccess;
  const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  const p50 = latencies[Math.floor(latencies.length * 0.50)] || 0;
  const p90 = latencies[Math.floor(latencies.length * 0.90)] || 0;
  const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;
  const rps = (results.length / totalTimeSec).toFixed(2);

  console.log(`   📊 Results for ${name}:`);
  console.log(`      - Total Requests: ${results.length} | Success: ${totalSuccess} | Failed: ${totalFail}`);
  console.log(`      - Throughput: ${rps} req/sec`);
  console.log(`      - Latency: Avg = ${avgLatency.toFixed(2)} ms | P50 = ${p50.toFixed(2)} ms | P90 = ${p90.toFixed(2)} ms | P99 = ${p99.toFixed(2)} ms`);

  return { name, path, method, rps, avgLatency, p50, p90, p99, totalSuccess, totalFail };
}

async function runSuite() {
  console.log('====================================================');
  console.log('⚡ HRMS Pro API Load & Performance Benchmark ⚡');
  console.log('====================================================');

  await login();

  const report = [];
  report.push(await runBenchmark('Health Check', '/health', 'GET', null, 50, 500));
  report.push(await runBenchmark('Departments List', '/api/departments', 'GET', null, 25, 250));
  report.push(await runBenchmark('Employees List', '/api/employees', 'GET', null, 25, 250));
  report.push(await runBenchmark('Tasks List', '/api/tasks', 'GET', null, 25, 250));
  report.push(await runBenchmark('Dashboard Analytics', '/api/reports/dashboard', 'GET', null, 20, 200));
  report.push(await runBenchmark('System Search', '/api/search?q=test', 'GET', null, 20, 200));
  report.push(await runBenchmark('Audit Logs', '/api/audit-logs', 'GET', null, 20, 200));

  console.log('\n====================================================');
  console.log(' SUMMARY BENCHMARK REPORT');
  console.log('====================================================');
  console.table(report.map(r => ({
    Endpoint: r.name,
    'Req/Sec': r.rps,
    'Avg (ms)': r.avgLatency.toFixed(1),
    'P50 (ms)': r.p50.toFixed(1),
    'P90 (ms)': r.p90.toFixed(1),
    'P99 (ms)': r.p99.toFixed(1),
    Pass: `${r.totalSuccess}/${r.totalSuccess + r.totalFail}`
  })));
}

runSuite().catch(console.error);
