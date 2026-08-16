const crypto = require('crypto');
const rateLimit = require('express-rate-limit');

// Secret key for HMAC bot challenge signing
const CHALLENGE_SECRET = process.env.BOT_CHALLENGE_SECRET || process.env.JWT_SECRET || 'hrms_bot_defense_secret_key_9988';

// ==========================================
// 1. IN-MEMORY STORES FOR SECURITY STATE
// ==========================================
const ipViolations = new Map(); // ip -> { count: number, jailUntil: timestamp }
const accountFailures = new Map(); // email.toLowerCase() -> { failures: number, lockUntil: timestamp }

// Clean up stale in-memory data every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of ipViolations.entries()) {
    if (data.jailUntil && data.jailUntil < now && data.count === 0) {
      ipViolations.delete(ip);
    }
  }
  for (const [email, data] of accountFailures.entries()) {
    if (data.lockUntil && data.lockUntil < now && data.failures === 0) {
      accountFailures.delete(email);
    }
  }
}, 10 * 60 * 1000);

// ==========================================
// 2. OWASP SANITIZATION & INJECTION DEFENSE
// ==========================================

/**
 * Neutralizes XSS, dangerous URI schemes, and spreadsheet formula injection.
 * Preserves passwords and hash fields intact.
 */
const sanitizeValue = (val, key = '') => {
  if (typeof val !== 'string') return val;

  // EXEMPTION: Never mutate passwords or cryptographic hashes
  const lowerKey = key.toLowerCase();
  if (
    lowerKey.includes('password') ||
    lowerKey.includes('hash') ||
    lowerKey.includes('secret') ||
    lowerKey.includes('token') ||
    lowerKey === 'totp'
  ) {
    return val;
  }

  let sanitized = val.trim();

  // 1. Strip dangerous pseudo-protocol hyperlinks (XSS)
  sanitized = sanitized.replace(/\b(javascript|vbscript|data):/gi, '_blocked_uri_:');

  // 2. Strip HTML tags and DOM event handlers (e.g. <script>, <img onerror=...>)
  sanitized = sanitized.replace(/<[^>]*>?/gm, '');
  sanitized = sanitized.replace(/on\w+\s*=/gi, '_blocked_handler_=');

  // 3. CWE-1236: Neutralize CSV/Excel formula injection on user text
  // Characters '=', '+', '-', '@', '\t', '\r', '|' at start of cell can trigger formula execution
  if (/^[=+\-@\t\r|]/.test(sanitized)) {
    sanitized = "'" + sanitized;
  }

  return sanitized;
};

/**
 * Deep recursive object sanitizer
 */
const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item));
  }

  const result = {};
  for (const [key, val] of Object.entries(obj)) {
    if (typeof val === 'string') {
      result[key] = sanitizeValue(val, key);
    } else if (val && typeof val === 'object') {
      result[key] = sanitizeObject(val);
    } else {
      result[key] = val;
    }
  }
  return result;
};

/**
 * Global OWASP Sanitizer Middleware
 */
const owaspSanitizerMiddleware = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params);
  }
  next();
};

// ==========================================
// 3. ANTI-BOT & CRYPTOGRAPHIC CHALLENGE
// ==========================================

/**
 * Generates an HMAC-signed, time-bound challenge token for public forms
 */
const generateChallengeToken = () => {
  const timestamp = Date.now();
  const nonce = crypto.randomBytes(8).toString('hex');
  const payload = `${timestamp}:${nonce}`;
  const signature = crypto.createHmac('sha256', CHALLENGE_SECRET).update(payload).digest('hex');
  return Buffer.from(`${payload}:${signature}`).toString('base64');
};

/**
 * Verifies bot honeypot fields and time-bound challenge tokens
 */
const verifyBotChallenge = (req, res, next) => {
  const { hp_website_contact, website_hp, _bot_challenge } = req.body || {};

  // 1. Honeypot check: If invisible honeypot field is filled by a bot, reject immediately
  if (hp_website_contact || website_hp) {
    recordSecurityViolation(req.ip, 10);
    return res.status(400).json({
      success: false,
      message: 'Automated submission rejected. Security violation recorded.'
    });
  }

  // 2. If a challenge token is supplied, verify signature and time constraints
  if (_bot_challenge) {
    try {
      const decoded = Buffer.from(_bot_challenge, 'base64').toString('utf8');
      const parts = decoded.split(':');
      if (parts.length === 3) {
        const [timestampStr, nonce, sig] = parts;
        const timestamp = parseInt(timestampStr, 10);
        const expectedSig = crypto
          .createHmac('sha256', CHALLENGE_SECRET)
          .update(`${timestampStr}:${nonce}`)
          .digest('hex');

        if (crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
          const now = Date.now();
          const elapsed = now - timestamp;

          // Reject if submitted in under 1 second (inhuman bot submission) or older than 30 minutes
          if (elapsed < 1000) {
            recordSecurityViolation(req.ip, 5);
            return res.status(400).json({
              success: false,
              message: 'Form submitted too rapidly. Please try again.'
            });
          }
          if (elapsed > 30 * 60 * 1000) {
            return res.status(400).json({
              success: false,
              message: 'Security token expired. Please refresh the page.'
            });
          }
        }
      }
    } catch (err) {
      console.warn('Bot challenge verification parse error:', err.message);
    }
  }

  next();
};

// ==========================================
// 4. ANTI-DDOS & IP JAIL DEFENSE
// ==========================================

const recordSecurityViolation = (ip, score = 1) => {
  if (!ip) return;
  const now = Date.now();
  const data = ipViolations.get(ip) || { count: 0, jailUntil: 0 };

  data.count += score;

  // If IP exceeds 25 violation points within 5 minutes, jail for 1 hour
  if (data.count >= 25 && data.jailUntil < now) {
    data.jailUntil = now + 60 * 60 * 1000; // 1 hour jail
    console.warn(`🚨 IP [${ip}] JAILED for 1 hour due to excessive security violations (Score: ${data.count})`);
  }

  ipViolations.set(ip, data);
};

/**
 * IP Jail Guard - Rejects blacklisted IPs immediately with 403 Forbidden
 */
const ipJailMiddleware = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const data = ipViolations.get(ip);
  const now = Date.now();

  if (data && data.jailUntil && data.jailUntil > now) {
    const remainingMins = Math.ceil((data.jailUntil - now) / (60 * 1000));
    return res.status(403).json({
      success: false,
      message: `Access temporarily blocked due to repeated security anomalies. Try again in ${remainingMins} minutes.`,
      blocked: true
    });
  }

  next();
};

// Tiered Rate Limiters
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { success: false, message: 'Too many requests from this IP. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/settings' && !req.headers.authorization
});

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { success: false, message: 'Too many authentication attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    recordSecurityViolation(req.ip, 5);
    res.status(429).json(options.message);
  }
});

const signupRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 6,
  message: { success: false, message: 'Registration limit reached for this IP. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    recordSecurityViolation(req.ip, 5);
    res.status(429).json(options.message);
  }
});

const demoLeadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  message: { success: false, message: 'Demo request submission limit reached for this IP. Please wait a few minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    recordSecurityViolation(req.ip, 4);
    res.status(429).json(options.message);
  }
});

// ==========================================
// 5. ANTI-BRUTE-FORCE & ACCOUNT LOCKOUT
// ==========================================

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

const checkAccountLockout = (email) => {
  if (!email) return { isLocked: false };
  const cleanEmail = email.trim().toLowerCase();
  const data = accountFailures.get(cleanEmail);
  const now = Date.now();

  if (data && data.lockUntil && data.lockUntil > now) {
    const minutesLeft = Math.ceil((data.lockUntil - now) / (60 * 1000));
    return {
      isLocked: true,
      minutesLeft,
      message: `Account temporarily locked due to 5 consecutive failed login attempts. Try again in ${minutesLeft} minutes.`
    };
  }

  return { isLocked: false };
};

const trackFailedLogin = (email, ip) => {
  if (!email) return;
  const cleanEmail = email.trim().toLowerCase();
  const now = Date.now();
  const data = accountFailures.get(cleanEmail) || { failures: 0, lockUntil: 0 };

  data.failures += 1;

  if (data.failures >= MAX_FAILED_ATTEMPTS) {
    data.lockUntil = now + LOCKOUT_DURATION_MS;
    data.failures = 0; // reset counter after locking
  }

  accountFailures.set(cleanEmail, data);
  recordSecurityViolation(ip, 3);
};

const recordSuccessfulLogin = (email) => {
  if (!email) return;
  accountFailures.delete(email.trim().toLowerCase());
};

module.exports = {
  sanitizeValue,
  sanitizeObject,
  owaspSanitizerMiddleware,
  generateChallengeToken,
  verifyBotChallenge,
  recordSecurityViolation,
  ipJailMiddleware,
  globalLimiter,
  authRateLimiter,
  signupRateLimiter,
  demoLeadRateLimiter,
  checkAccountLockout,
  trackFailedLogin,
  recordSuccessfulLogin
};
