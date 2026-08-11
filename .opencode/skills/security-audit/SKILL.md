---
name: security-audit
description: >
  Use when implementing or auditing security controls — authentication,
  authorization, input validation, tenant isolation, rate limiting, and
  vulnerability prevention for the HRMS web + mobile system.
---

# Security Audit

## Authentication (verifying identity)

### JWT
- Token issued on login via `POST /api/auth/login`
- Verified by `protect` middleware on every protected route
- Contains `{ userId, role, tenantId, email }` — NEVER store passwords in JWT
- Expiry: 24h (configurable via `JWT_EXPIRE` env var)
- Secret: `JWT_SECRET` env var — must be strong in production

### Password Storage
- Hashed with `bcrypt` (10 rounds)
- Never stored in plaintext
- Never returned in API responses

### 2FA
- TOTP-based (time-based one-time password)
- QR code generated on setup, verified on login
- Secret stored encrypted in `two_factor_secret` column

### Mobile Biometrics
- Uses `expo-local-authentication` (fingerprint / face ID)
- Device-level only — token is still validated server-side

## Authorization (what you can do)

### Role-Based (RBAC)
```javascript
// Middleware
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, error: 'Forbidden' });
  }
  next();
};

// Usage
router.get('/admin-only', protect, authorize('admin'), controller.action);
```

### Permission-Based (Fine-Grained)
```javascript
// Check in controller:
if (!req.user.permissions?.includes('payroll:read')) {
  return res.status(403).json({ success: false, error: 'Forbidden' });
}
```

### Frontend UI Gating
```javascript
import { hasAccess } from '../utils/permissions';

// In JSX:
{hasAccess(user?.role, user?.permissions, ['payroll:read']) && (
  <NavItem to="/payroll" label="Payroll" />
)}
```

### Mobile UI Gating
```typescript
import { canOpenModule } from '../utils/permissions';

// In navigator:
{canOpenModule('chat', user, mobileConfig) && (
  <Tab.Screen name="Chat" component={ChatScreen} />
)}
```

## Input Validation

### Server-Side (Primary Defense)
Always validate with `express-validator`:

```javascript
const { body, validationResult } = require('express-validator');

router.post('/',
  body('email').isEmail().normalizeEmail(),
  body('name').notEmpty().trim().escape(),
  body('age').optional().isInt({ min: 0, max: 120 }),
  body('website').optional().isURL(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  },
  controller.create
);
```

### NEVER Trust the Client
- Validate every field on every request
- Check types, lengths, formats, allowed values
- Use `trim()` to strip whitespace
- Use `escape()` or parameterized queries against SQL injection
- Reject unexpected fields

## SQL Injection Prevention

**Policy: ZERO raw string concatenation in SQL.**

```javascript
// ✅ SAFE — parameterized
await pool.query('SELECT * FROM users WHERE email = $1', [email]);

// ❌ UNSAFE — concatenation
await pool.query(`SELECT * FROM users WHERE email = '${email}'`);
```

- All queries MUST use `$1, $2, ...` placeholders
- Even "safe" fields like department_id must be parameterized
- Dynamic ORDER BY must use allowlist, not interpolation
- Dynamic table/schema names must be validated against allowlist

## XSS Prevention

### Backend
- `express-validator`'s `escape()` strips HTML tags
- Stored XSS is prevented by parameterized queries (data stored as-is, not executed)
- HTML in stored data is the frontend's responsibility to sanitize

### Frontend (React)
- React escapes by default in JSX (`{variable}` is safe)
- Avoid `dangerouslySetInnerHTML`
- If you must render HTML, use DOMPurify:
  ```javascript
  import DOMPurify from 'dompurify';
  <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />
  ```

## Tenant Isolation

- `x-tenant-id` header is REQUIRED on every request
- `tenantMiddleware` extracts it → `req.tenantId`
- ALL queries scope to `"${req.tenantId}".table_name`
- Cross-tenant access returns 401/403
- Super-admin routes check tenant === 'tenant_default'
- Rate limiter: 1000 req/15min per IP (not per tenant)

## Rate Limiting

```javascript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  message: { success: false, error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);
```

## Security Headers

```javascript
const helmet = require('helmet');
app.use(helmet()); // Sets: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, etc.
```

## Body Size Limits

```javascript
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
```

## Security Checklist

### Every Endpoint
- [ ] Requires authentication (`protect` middleware)?
- [ ] Enforces authorization (`authorize` + role check)?
- [ ] Validates ALL inputs with `express-validator`?
- [ ] Uses parameterized queries (no string concatenation)?
- [ ] Scoped to correct tenant schema?
- [ ] Returns minimal data (no password_hash, secrets)?

### Every Feature
- [ ] SQL injection attempt returns 400, not 500?
- [ ] XSS payload stored as literal text, not executed?
- [ ] Duplicate submission returns predictable error?
- [ ] Invalid/expired JWT returns 401?
- [ ] Missing tenant header returns 400?
- [ ] Large payload (>10MB) returns 413?

### Production Readiness
- [ ] `JWT_SECRET` is a strong random value (not in code)?
- [ ] `CORS` allows only known origins?
- [ ] Rate limiting enabled?
- [ ] Helmet middleware active?
- [ ] No secrets in `.env` committed to git?
- [ ] Error messages don't leak internals (stack traces)?

## What NOT to Do

- Never log passwords, tokens, or secrets
- Never return password_hash in API responses
- Never use eval() or similar in backend code
- Never disable CSRF protection on mutation endpoints
- Never trust `req.headers`, `req.query`, or `req.body` without validation
- Never expose internal IDs in URLs if they could be enumerated (use UUIDs for public-facing resources)
