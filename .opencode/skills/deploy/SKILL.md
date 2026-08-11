---
name: deploy
description: >
  Use before pushing to GitHub, deploying to production, or when reviewing
  deployment readiness. Checks for hardcoded secrets, localhost URLs, CORS
  misconfigurations, .gitignore completeness, environment variable coverage,
  and production safety.
---

# Deploy Checklist

## Before Every Push to GitHub

### 1. Secrets & Sensitive Data — BLOCKED
- [ ] No `.env` files are staged (`git diff --cached --name-only | findstr .env`)
- [ ] No API keys, passwords, or tokens in source code
- [ ] No hardcoded JWT secrets or DB credentials
- [ ] No `console.log` leaking sensitive data
- [ ] `.gitignore` covers all env/config files

Run this check:
```powershell
# Check for secrets in staged files
git diff --cached -S "xsmtpsib\|SMTP_PASS\|JWT_SECRET\|password_hash\|apiKey"
# Check .env is not staged
git diff --cached --name-only | findstr ".env"
```

### 2. Hardcoded Localhost URLs — BLOCKED
- [ ] Frontend `VITE_API_URL` uses env var, not hardcoded
- [ ] Socket connections use env-derived URL, not hardcoded `localhost`
- [ ] Mobile `API_URL` uses env var, not hardcoded IP
- [ ] CORS origin uses `FRONTEND_URL` env var, not hardcoded
- [ ] No port-5000 references (should be 5001)
- [ ] Test scripts with localhost are excluded from commit

### 3. .gitignore Completeness
- [ ] `.env` — env files at any level
- [ ] `node_modules/` — dependencies
- [ ] `dist/`, `build/`, `.next/` — build outputs
- [ ] `*.log` — server/error logs
- [ ] `*.txt` — runtime temp files (server_stdout, test_token, etc.)
- [ ] `.vscode/`, `.idea/` — editor settings
- [ ] `coverage/` — test coverage reports
- [ ] `*.local` — local-only config overrides

## Before Deploying to Production

### 4. Environment Variables
Every env var must have a fallback OR be explicitly required:

| Variable | Where | Required? |
|---|---|---|
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | backend | ✅ Required |
| `JWT_SECRET` | backend | ✅ Required (must be strong in prod) |
| `JWT_EXPIRE` | backend | Optional (default: 24h) |
| `PORT` | backend | Optional (default: 5001) |
| `FRONTEND_URL` | backend | ✅ Required (CORS + reset links) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | backend | Optional (email disabled if missing) |
| `SMTP_FROM_EMAIL`, `SMTP_FROM_NAME` | backend | Optional (falls back to SMTP_USER) |
| `VITE_API_URL` | frontend | ✅ Required (API base URL) |
| `NODE_ENV` | backend | Optional (default: development) |

Verify all env vars are set before starting:
```javascript
const required = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'JWT_SECRET', 'FRONTEND_URL'];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`Missing required env var: ${key}`);
    process.exit(1);
  }
}
```

### 5. CORS Configuration
```javascript
// backend/src/server.js — MUST use env var, not hardcoded
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
};
app.use(cors(corsOptions));
```

If there are multiple allowed origins (e.g., custom domain + Vercel preview), use an array:
```javascript
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',');
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
```

### 6. Dynamic URLs Check
Every `localhost` or hardcoded URL in SOURCE code (not test scripts) must use an env var:

```powershell
# Find hardcoded localhost in source files (exclude test scripts)
Get-ChildItem -Recurse -Include "*.js","*.jsx","*.ts","*.tsx" |
  Where-Object { $_.FullName -notmatch "(scripts|test|mock|spec|__tests__)" } |
  Select-String -Pattern "localhost|192\.168\.|127\.0\.0\.1" |
  Select-Object FileName, LineNumber, Line
```

### 7. Mobile API URL
The mobile app must use a configurable API URL, not a hardcoded IP:

```typescript
// ✅ GOOD — env var with fallback
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5001/api';

// ❌ BAD — hardcoded local IP
export const API_URL = 'http://192.168.1.5:5001/api';
```

For React Native/Expo, use `EXPO_PUBLIC_*` env vars (exposed to client at build time):
```
EXPO_PUBLIC_API_URL=https://api.hrmspro.com/api
```

### 8. Build Verification
```powershell
# Backend
Set-Location backend
node -e "require('./src/server')"  # Starts without crash?

# Frontend
Set-Location frontend
npx vite build                       # Production build passes?
npx tsc --noEmit                     # TypeScript errors?

# Mobile
Set-Location mobile
npx tsc --noEmit                     # TypeScript 0 errors?
```

## Post-Deploy Verification

### 9. Smoke Tests
```powershell
# 1. Health check
curl -f https://api.hrmspro.com/health

# 2. Login works
curl -X POST https://api.hrmspro.com/api/auth/login \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: tenant_default" \
  -d '{"email":"admin@hrmspro.com","password":"<password>"}'

# 3. Frontend loads
curl -f https://hrmspro.com | findstr "root"

# 4. CORS not blocking
curl -H "Origin: https://hrmspro.com" -H "x-tenant-id: tenant_default" \
  -I https://api.hrmspro.com/api/departments | findstr "Access-Control"
```

### 10. Security Verification
- [ ] `/health` endpoint is NOT behind auth (needed for monitoring)
- [ ] All other endpoints require auth
- [ ] Rate limiting is active (test with rapid requests)
- [ ] Helmet headers present (check with `curl -I`)
- [ ] No stack traces in error responses
- [ ] CORS blocks unknown origins
- [ ] Body size limit is appropriate (10mb default)

## Rollback Plan

If deployment fails:
1. **Git revert**: `git revert HEAD --no-edit && git push`
2. **Env rollback**: Restore previous `.env` values
3. **DB rollback**: Run undo migration if one exists
4. **Verify**: Run smoke tests again

## Summary: Push-or-Block Decision

```
                    ┌──────────────────────────┐
                    │  git add . && git status │
                    └──────────┬───────────────┘
                               │
                    ┌──────────▼──────────────┐
                    │  Secrets in staged?     │──── BLOCK ❌
                    └──────────┬───────────────┘
                               │ No
                    ┌──────────▼──────────────┐
                    │  Hardcoded localhost     │
                    │  in source code?         │──── BLOCK ❌
                    └──────────┬───────────────┘
                               │ No
                    ┌──────────▼──────────────┐
                    │  .gitignore covers all  │
                    │  generated files?       │──── BLOCK ❌
                    └──────────┬───────────────┘
                               │ Yes
                    ┌──────────▼──────────────┐
                    │  Build passes?          │──── BLOCK ❌
                    └──────────┬───────────────┘
                               │ Yes
                    ┌──────────▼──────────────┐
                    │  ✅ PUSH SAFE           │
                    └─────────────────────────┘
```
