---
name: code-quality
description: >
  Use when reviewing code, enforcing style, setting up linting/typechecking,
  writing error handling, logging, or establishing project conventions for
  backend (Node.js), frontend (React), and mobile (React Native).
---

# Code Quality

## Error Handling

### Backend Controller Pattern
```javascript
const createDepartment = async (req, res) => {
  try {
    const { department_name, description } = req.body;
    const schema = req.tenantId;

    const result = await pool.query(
      `INSERT INTO "${schema}".departments (department_name, description)
       VALUES ($1, $2) RETURNING *`,
      [department_name, description]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({ success: false, error: 'Failed to create department' });
  }
};
```

### Never Swallow Errors Silently
```javascript
// ❌ BAD — silent failure
try { await riskyOp(); } catch (e) {}

// ✅ GOOD — log it
try { await riskyOp(); } catch (e) {
  console.error('Operation failed:', e.message);
  throw e; // or handle gracefully
}
```

### Use Status Codes Correctly
| Scenario | Code |
|---|---|
| Success | 200 |
| Created | 201 |
| No content (delete) | 200 or 204 |
| Validation error | 400 |
| Unauthenticated | 401 |
| Forbidden (no perms) | 403 |
| Not found | 404 |
| Conflict (duplicate) | 409 |
| Rate limited | 429 |
| Server error | 500 |

## Logging Standards

### Backend
```javascript
// Info level — normal operations
console.log(`[ModuleName] Created department ${id}`);

// Error level — something went wrong
console.error(`[ModuleName] Failed to create department:`, error);

// Warn level — unexpected but handled
console.warn(`[ModuleName] Rate limit approaching for IP ${ip}`);

// Debug (only during development)
console.debug(`[ModuleName] Query params:`, params);
```

### Never Log
- Passwords, password hashes, or reset tokens
- JWT secrets or full tokens
- API keys
- Complete user data objects with sensitive fields

## Naming Conventions

### Backend (JavaScript, CommonJS)
```javascript
// Files: camelCase
emailService.js, authController.js

// Variables/functions: camelCase
const getDepartment = async (req, res) => {}

// Classes: PascalCase (rare in this project)
class EmailTemplate {}

// Constants: UPPER_SNAKE
const MAX_RETRIES = 3;
const JWT_EXPIRE = '24h';

// Database columns: snake_case
// SQL: UPPERCASE keywords
SELECT * FROM users WHERE email = $1
```

### Frontend (React, JSX)
```javascript
// Components: PascalCase
function EmployeeCard({ employee }) {}

// Hooks: camelCase, starts with 'use'
const useAuth = () => {}

// Files: PascalCase for components
EmployeeCard.jsx, Dashboard.jsx

// CSS classes: Tailwind utility classes

// Event handlers: handle{Event}
const handleSubmit = () => {}
const handleClick = () => {}
```

### Mobile (React Native, TypeScript)
```typescript
// Same as frontend plus:
// Types/Interfaces: PascalCase (prefix I optional)
interface User { id: number; email: string; }
type Employee = { ... }

// StyleSheet keys: camelCase
const styles = StyleSheet.create({
  container: { flex: 1 },
  headerText: { fontSize: 18 }
});
```

## File Organization

### Keep Files Focused
- One controller function per business operation (not split across files)
- Keep routes files < 100 lines (extract validation to reusable arrays if needed)
- Keep controllers < 200 lines (extract business logic to services)

### Import Order (Backend)
```javascript
// 1. Node built-ins
const crypto = require('crypto');

// 2. Third-party
const express = require('express');

// 3. Local modules
const pool = require('../database');
const { sendEmail } = require('../services/emailService');

// 4. Config / constants
const { JWT_SECRET } = process.env;
```

### Import Order (Frontend/Mobile)
```jsx
// 1. React / React Native
import React, { useState } from 'react';
import { View, Text } from 'react-native';

// 2. Third-party
import { useNavigate } from 'react-router-dom';

// 3. Context / Hooks
import { useAuth } from '../context/AuthContext';

// 4. Components
import NavItem from './NavItem';

// 5. Assets / Styles
import logo from '../assets/logo.png';
```

## Testing Standards

### What to Test
- Every API endpoint: happy path + validation errors + auth errors
- Every React component: renders without crash + handles missing data
- Every mobile screen: renders in navigator + handles loading/error states

### Test API Endpoints
```powershell
# 1. Happy path
Invoke-RestMethod -Uri "http://localhost:5001/api/departments" -Headers $headers

# 2. Validation error
Invoke-RestMethod -Uri "http://localhost:5001/api/departments" -Method POST `
  -Headers $headers -Body '{"department_name":""}'

# 3. Auth error
Invoke-RestMethod -Uri "http://localhost:5001/api/departments" -Method POST `
  -Headers @{"Content-Type"="application/json"; "x-tenant-id"="tenant_default"} `
  -Body '{"department_name":"Test"}'
```

## Code Review Checklist

### Before Committing
- [ ] No console.log left in production code (use proper logging)?
- [ ] No commented-out code blocks?
- [ ] No TODO/FIXME without associated ticket?
- [ ] All error paths handled?
- [ ] No SQL injection vulnerabilities (parameterized queries)?
- [ ] All inputs validated?
- [ ] Auth + auth middleware applied correctly?
- [ ] Proper HTTP status codes used?
- [ ] Response format consistent (`{ success, data/error }`)?
- [ ] No secrets or keys exposed?
- [ ] `.env` not committed?

### For Frontend Changes
- [ ] Works without API (loading/error states)?
- [ ] Responsive on mobile viewport?
- [ ] No unused imports?
- [ ] Component not re-rendering unnecessarily?
- [ ] Keyboard handling correct on mobile?
- [ ] Dark mode considered (if applicable)?

### For Backend Changes
- [ ] Query scoped to correct tenant?
- [ ] Pagination applied on list endpoints?
- [ ] No N+1 queries introduced?
- [ ] Validation rejects invalid/empty input?
- [ ] Rate limiting considered for new endpoints?

### For Mobile Changes
- [ ] TypeScript compiles with `--noEmit` (0 errors)?
- [ ] Screen registered in `AppNavigator.tsx`?
- [ ] Module gated behind `canOpenModule` if restricted?
- [ ] Works offline (graceful error state)?
- [ ] Pull-to-refresh implemented for data screens?
