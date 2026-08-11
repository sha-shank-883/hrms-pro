---
name: backend-architecture
description: >
  Use when designing or reviewing backend architecture — route design, controller
  patterns, middleware structure, error handling, API response conventions, and
  file organization for Express.js projects with multi-tenancy.
---

# Backend Architecture

## File Organization

Every feature module follows this structure:

```
src/
  routes/       # Route definitions + validation middleware
  controllers/  # Request handling, orchestration
  services/     # Business logic (optional, extracted from heavy controllers)
  models/       # Database query helpers
  middleware/   # Auth, tenant, error handlers
  scripts/      # One-off DB migrations, seeders, utilities
  config/       # Schema SQL, constants
```

## Route → Controller → DB Flow

```
client → route (validation) → controller (logic) → pool.query() (DB) → response
```

### Route Layer Only
- Define HTTP method + path
- Attach `protect`, `authorize()` middleware
- Attach `express-validator` chains
- Call controller function

### Controller Layer
- Extract validated data from `req`
- Call `pool.query()` with parameterized queries
- Transform response shape if needed
- Wrap in try/catch, let errors bubble to global error handler

## Middleware Stack Order

```javascript
app.use(express.json({ limit: '10mb' }));
app.use(cors());
app.use(helmet());
app.use('/api/', rateLimiter);
app.use(tenantMiddleware);          // extracts x-tenant-id → req.tenantId
app.use('/api/', routes);
app.use(errorHandler);              // catches all thrown errors
```

## Response Conventions

### Success
```javascript
res.status(200).json({ success: true, data: [...] });
res.status(201).json({ success: true, data: {...}, message: 'Created' });
```

### Error
```javascript
res.status(400).json({ success: false, error: 'Validation error' });
res.status(401).json({ success: false, error: 'Unauthorized' });
res.status(404).json({ success: false, error: 'Not found' });
res.status(500).json({ success: false, error: 'Server error' });
```

## Tenant Isolation Pattern

Every controller must scope queries by `req.tenantId`:

```javascript
const schema = req.tenantId; // e.g. 'tenant_default'
const result = await pool.query(
  `SELECT * FROM "${schema}".departments WHERE department_id = $1`,
  [id]
);
```

If a route is cross-schema (super-admin), use `SET search_path TO public` explicitly.

## Parameterized Queries (MANDATORY)

NEVER concatenate user input into SQL strings. Always use `$1, $2, ...` placeholders:

```javascript
// ✅ CORRECT
await pool.query('SELECT * FROM users WHERE email = $1', [email]);

// ❌ WRONG
await pool.query(`SELECT * FROM users WHERE email = '${email}'`);
```

## Error Handling Pattern

### Async Handler Wrapper
```javascript
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
```

### Global Error Handler
```javascript
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});
```

## Validation Pattern (express-validator)

```javascript
const { body, param, query, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

// In routes file:
router.post('/',
  body('email').isEmail(),
  body('name').notEmpty().trim(),
  body('age').optional().isInt({ min: 0, max: 120 }),
  validate,
  controller.create
);
```

## Authentication Middleware

The `protect` middleware:
1. Extracts `Authorization: Bearer <token>`
2. Verifies JWT with `jwt.verify()`
3. Attaches `req.user` with `{ userId, role, tenantId, email }`
4. Returns 401 if invalid/expired

## Authorization Middleware

```javascript
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }
    next();
  };
};

// Usage in routes:
router.get('/', protect, authorize('admin', 'manager'), controller.list);
```

## Key Conventions

- Use `require()` (CommonJS) throughout backend
- Export from controllers as named exports, import with destructuring
- Keep routes files clean (no business logic)
- One controller file per module (not one function per file)
- Use `try/catch` in every controller, or wrap with `asyncHandler`
- Validate ALL inputs, even if they're "internal"
- Return consistent response shapes (`{ success, data/error }`)
