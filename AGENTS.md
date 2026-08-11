# HRMS Pro — Development Workflow

## Golden Rule

Every new implementation MUST be accompanied by:
1. Test cases in `TEST_PLAN.md`
2. Security checks
3. Functionality checks
4. Documentation updates
5. **Skills are automatically loaded** — see Workflow Phase 0 below

---

## Skills Reference

Each skill enforces production-grade conventions for its domain. The system **automatically** determines which skills apply to every task.

| Skill | When It Applies | What It Covers |
|---|---|---|
| **backend-architecture** | Any backend work (routes, controllers, middleware, error handling, API design) | Express patterns, multi-tenancy, response format, error handling |
| **ui-design** | Any frontend or mobile UI work (components, pages, styling, layout, animations, marketing site) | Tailwind spacing system, typography, color palette, cards, shadows, tables, buttons, mobile patterns, glassmorphism, micro-animations, onboarding |
| **code-quality** | Any code change — always loaded | ESLint config, error handling patterns, status codes, async handler patterns |
| **database-design** | Schema changes, migrations, indexes, queries, tenant isolation | SQL conventions, migration scripts, query optimization, tenant schema design |
| **deploy** | Before pushing to GitHub, deploying, or reviewing production readiness | Secret checks, localhost URLs, CORS, .gitignore, env vars |
| **performance-optimization** | Slow queries, large bundle sizes, inefficient renders, mobile lag | Query optimization, chunk splitting, memoization, lazy loading |
| **security-audit** | Auth/authorization changes, input handling, file upload, tenant isolation | JWT verification, role checks, SQL injection prevention, XSS, rate limiting |
| **testing-protocol** | Any implementation task — always loaded | Test case format, API testing with PowerShell, error logging format |

### How to Load a Skill
```markdown
<skill>skill-name</skill>
```

---

## Workflow

### Phase 0: Auto-Load Skills (MANDATORY — First Step of Every Task)

Before anything else, analyze the task and automatically load ALL applicable skills:

1. **Analyze the task** — what domains does it touch?
   - Backend code? → `backend-architecture`
   - Frontend/Mobile code? → `ui-design`
   - Database schema/queries? → `database-design`
   - Auth/permissions/input handling? → `security-audit`
   - Any code at all? → `code-quality`
   - Writing tests? → `testing-protocol`

2. **Load all matching skills simultaneously** — never skip this step
   ```markdown
   <skill>backend-architecture</skill>
   <skill>database-design</skill>
   <skill>security-audit</skill>
   <skill>testing-protocol</skill>
   <skill>code-quality</skill>
   ```

3. **Proceed to Phase 1** only after all skills are loaded.

### Phase 1: Understand & Plan

Before writing any code:
- Read the relevant existing files to understand conventions
- Check `TEST_PLAN.md` for existing test patterns in the same module
- Check `BACKEND_API_ENDPOINTS_SUMMARY.md` for API patterns
- Skills were already loaded in Phase 0 — apply their guidelines
- Identify what files will be created or modified
- Identify what test cases are needed

### Phase 2: Write Test Cases First

Add test entries to `TEST_PLAN.md` under the appropriate phase/section. Every test case MUST cover:

#### Functionality Checks
- **CRUD**: Create, Read, Update, Delete (if applicable)
- **Happy path**: Standard successful operation
- **Validation**: Empty fields, wrong types, missing required fields
- **Edge cases**: Boundary values, null inputs, duplicates
- **Idempotency**: Repeated operations don't corrupt state

#### Security Checks
- **Authentication**: Does the endpoint require auth? Does it reject unauthenticated requests?
- **Authorization**: Does it enforce role/permission checks? Can employee access admin endpoints?
- **Input validation**: SQL injection in string fields, XSS in text fields
- **Data isolation**: Tenant A cannot access Tenant B's data
- **Rate limiting**: (implicit — verified by server config)

### Phase 3: Implement

Write code following the project's existing conventions and the loaded skill's guidelines:
- **Backend**: Express routes, controllers, parameterized queries → apply `backend-architecture`
- **Frontend**: React components, Tailwind CSS, hasAccess for permissions → apply `ui-design`
- **Mobile**: TypeScript, React Native, AppNavigator for routing → apply `ui-design`
- **Database**: Schema, migrations, queries → apply `database-design`
- **Security**: Auth, authorization, input validation → apply `security-audit`

### Phase 4: Test

Run tests in small focused batches. For each test:
1. Execute the endpoint/component
2. Verify the response matches expectations
3. If it fails:
   - Determine if it's a real bug or test data issue
   - Log real bugs in `TEST_ERRORS.md` with format:
     ```markdown
     ### ERROR-NNN - Brief Title
     - **Phase**: Phase X
     - **Test Ref**: #X.X.X
     - **Module**: Module Name
     - **Expected**: [expected result]
     - **Actual**: [actual result]
     - **Severity**: Critical / High / Medium / Low
     ```
   - False positives (test data issues) mark as FALSE POSITIVE
   - Real bugs — fix immediately, do NOT leave unfixed

### Phase 5: Document

Update these files as needed:
- `TEST_PLAN.md`: Test cases already added in Phase 2; update status
- `TEST_ERRORS.md`: Log bugs found; update summary statistics
- `PLAN.md`: Track implementation progress (if a formal plan exists)
- `PROJECT_SUMMARY.md` / `IMPLEMENTATION_SUMMARY.md`: Note what was built

### Phase 6: Verify

Before declaring done:
- **Lint**: Run the project's linter
- **Typecheck**: Run TypeScript check (if applicable)
- **Build**: Verify the project builds without errors
- **UI review**: For frontend/mobile work, verify against ui-design skill's checklists (spacing, typography, component patterns, dark mode, responsive)
- **Skill audit**: Re-check that ALL skills loaded in Phase 0 were applied. If any skill's checks were missed, go back and address them.
- **Final pass**: Re-read your changes and confirm they match the requirements

---

## Project-Specific Reminders

### Backend
- Server runs on port 5001
- Database: PostgreSQL on 5432, database `hrms_db`
- All queries use parameterized queries via `pool.query()`
- Auth: JWT in `Authorization: Bearer <token>` header
- Tenant: `x-tenant-id` header required on every request
- Rate limit: 1000 requests per 15 minutes per IP
- Body size limit: 10MB (express.json)

### Frontend
- Vite dev server on port 5173
- Auth context: `useAuth()` for user + token
- Permissions: `hasAccess(roles, permissions)` for UI gating
- Tailwind CSS for styling

### Mobile
- TypeScript + React Native
- AppNavigator.tsx for all routing
- Auth context: `useAuth()` for user + token

---

## Test Credentials

Use these when API tests require authentication:
- **Admin**: `info@hrmspro.online` / `Hrmspro@123` (role=admin, super-admin access)

## What to Do When Stuck

- If you hit a persistent error, investigate the root cause before trying workarounds
- Check the server logs (stdout/stderr) for error messages
- Check the database directly via psql if needed
- If an approach isn't working after 3 attempts, step back and reconsider
