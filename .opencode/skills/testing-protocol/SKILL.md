---
name: testing-protocol
description: >
  Use when writing test cases, running tests, logging bugs in TEST_PLAN.md or
  TEST_ERRORS.md, or verifying a new implementation's correctness. Covers
  backend API testing with PowerShell, database verification via psql, and
  frontend/mobile build checks.
---

# Testing Protocol

A detailed reference for testing new implementations in the HRMS Pro project.

## Where Test Info Lives

| File | Purpose |
|---|---|
| `TEST_PLAN.md` | All planned/reusable test cases, organized by phase |
| `TEST_ERRORS.md` | Bugs found during testing, with root cause analysis |

## Test Case Template

When adding tests to `TEST_PLAN.md`, use this pattern:

```markdown
### Module Name (`/api/endpoint`)
| # | Test Case | Expected Result |
|---|---|---|
| X.X.1 | `GET /api/endpoint` | 200 with list |
| X.X.2 | `POST /api/endpoint` with valid data | 201 Created |
| X.X.3 | `PUT /api/endpoint/:id` with invalid data | 400 Validation error |
| X.X.4 | `DELETE /api/endpoint/:id` | 200 Deleted |
| X.X.5 | Request without auth token | 401 Unauthorized |
| X.X.6 | SQL injection in name field | 400 or stored safely |
| X.X.7 | XSS in text field | Stored as literal text |
| X.X.8 | Duplicate entry | 400/409 Conflict |
```

## Testing Cheat Sheet

### Test Credentials
- **Admin Token**: `info@hrmspro.online` / `hrmspro@123` (role=admin, super-admin access)
- **Tenant ID**: `tenant_default`
- **Server**: `http://localhost:5001`

### Backend Token
```powershell
$login = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/login" -Method POST `
  -Headers @{"Content-Type"="application/json"; "x-tenant-id"="tenant_default"} `
  -Body '{"email":"info@hrmspro.online","password":"hrmspro@123"}'
$token = $login.data.token
$headers = @{"Authorization"="Bearer $token"; "x-tenant-id"="tenant_default"}
```

### Common Requests
```powershell
# GET
Invoke-RestMethod -Uri "http://localhost:5001/api/departments" -Headers $headers

# POST
Invoke-RestMethod -Uri "http://localhost:5001/api/departments" -Method POST `
  -Headers $headers -Body '{"department_name":"Test","description":"test"}'

# PUT
Invoke-RestMethod -Uri "http://localhost:5001/api/departments/1" -Method PUT `
  -Headers $headers -Body '{"department_name":"Updated"}'

# DELETE
Invoke-RestMethod -Uri "http://localhost:5001/api/departments/1" -Method DELETE `
  -Headers $headers
```

### Database Check
```powershell
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -d hrms_db -c "SELECT * FROM tenant_default.table_name LIMIT 5"
```

### Frontend Build
```powershell
Set-Location frontend; npx vite build
```

### Mobile TypeScript
```powershell
Set-Location mobile; npx tsc --noEmit
```

## Error Logging Template

When a real bug is found, add to `TEST_ERRORS.md`:

```markdown
### ERROR-NNN - Brief Title
- **Date**: YYYY-MM-DD
- **Phase**: Phase X
- **Test Ref**: #X.X.X
- **Module**: Module Name
- **Expected**: [expected result]
- **Actual**: [actual result]
- **Severity**: Critical / High / Medium / Low
- **Root Cause**: [why it happened]
- **Fix**: [how it was fixed / pending]
```
