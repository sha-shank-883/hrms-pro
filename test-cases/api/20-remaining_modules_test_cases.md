# Remaining Backend Modules - Test Cases

## Email Templates (`/api/email-templates`)

| # | Test Case | Method | Endpoint | Expected Result | Auth |
|---|---|---|---|---|---|
| EML-001 | Get templates (admin) | GET | `/api/email-templates` | 200 OK | Admin JWT |
| EML-002 | Get templates without admin | GET | `/api/email-templates` | 403 Forbidden | Employee JWT |
| EML-003 | Get template by ID | GET | `/api/email-templates/:id` | 200 OK | Admin JWT |
| EML-004 | Create template | POST | `/api/email-templates` | 201 Created | Admin JWT |
| EML-005 | Create template with missing name | POST | `/api/email-templates` | 400 Validation error | Admin JWT |
| EML-006 | Create template with missing subject | POST | `/api/email-templates` | 400 Validation error | Admin JWT |
| EML-007 | Create template with HTML body | POST | `/api/email-templates` | 201, body_html saved | Admin JWT |
| EML-008 | Create template with variables | POST | `/api/email-templates` | 201, variables saved | Admin JWT |
| EML-009 | Update template | PUT | `/api/email-templates/:id` | 200 OK | Admin JWT |
| EML-010 | Update non-existent template | PUT | `/api/email-templates/:id` | 404 Not Found | Admin JWT |
| EML-011 | Delete template | DELETE | `/api/email-templates/:id` | 200 OK | Admin JWT |
| EML-012 | Send templated email | POST | `/api/email-templates/send` | 200 OK | Admin JWT |
| EML-013 | Send email with missing recipients | POST | `/api/email-templates/send` | 400 Validation error | Admin JWT |
| EML-014 | Send email with non-existent template | POST | `/api/email-templates/send` | 404 Not Found | Admin JWT |
| EML-015 | XSS in template body | POST | `/api/email-templates` | Stored as literal | Admin JWT |
| EML-016 | Create template with text body | POST | `/api/email-templates` | 201, body_text saved | Admin JWT |
| EML-017 | Create duplicate template name | POST | `/api/email-templates` | 409 Conflict | Admin JWT |
| EML-018 | Tenant isolation | GET | `/api/email-templates` | Own tenant only | Cross-tenant |
| EML-019 | Pagination on templates | GET | `/api/email-templates?page=1&limit=10` | 200 with pagination | Admin JWT |
| EML-020 | Send email as manager | POST | `/api/email-templates/send` | 200 OK | Manager JWT |

## Search (`/api/search`)

| # | Test Case | Method | Endpoint | Expected Result | Auth |
|---|---|---|---|---|---|
| SRH-021 | Search with valid query | GET | `/api/search?q=john` | 200 OK, results array | JWT |
| SRH-022 | Search without auth | GET | `/api/search?q=test` | 401 Unauthorized | None |
| SRH-023 | Search with empty query | GET | `/api/search?q=` | 200, empty/no results | JWT |
| SRH-024 | Search with short query (1 char) | GET | `/api/search?q=a` | 200, no/minimal results | JWT |
| SRH-025 | Search across multiple modules | GET | `/api/search?q=engineer` | Results from employees, jobs, tasks | JWT |
| SRH-026 | Search with special characters | GET | `/api/search?q=test@123` | 200, safe handling | JWT |
| SRH-027 | Search with SQL injection | GET | `/api/search?q=test' OR 1=1` | Parameterized, safe | JWT |
| SRH-028 | Search results include module type | GET | `/api/search?q=john` | Each result has type field | JWT |
| SRH-029 | Search pagination | GET | `/api/search?q=test&page=1&limit=10` | 200 with pagination | JWT |
| SRH-030 | Tenant isolation on search | GET | `/api/search?q=test` | Own tenant only | Cross-tenant |

## Upload (`/api/upload`)

| # | Test Case | Method | Endpoint | Expected Result | Auth |
|---|---|---|---|---|---|
| UPL-031 | Upload file | POST | `/api/upload` | 201, file_url returned | JWT |
| UPL-032 | Upload file to chat | POST | `/api/upload/chat` | 201, file_url returned | JWT |
| UPL-033 | Upload without file | POST | `/api/upload` | 400 No file | JWT |
| UPL-034 | Upload without auth | POST | `/api/upload` | 401 Unauthorized | None |
| UPL-035 | Upload invalid file type | POST | `/api/upload` | 400 Invalid type | JWT |
| UPL-036 | Upload very large file | POST | `/api/upload` | 413 Too large | JWT |
| UPL-037 | Delete uploaded file | DELETE | `/api/upload/:filename` | 200 OK | JWT |
| UPL-038 | Delete non-existent file | DELETE | `/api/upload/:filename` | 404 Not Found | JWT |
| UPL-039 | Delete file without auth | DELETE | `/api/upload/:filename` | 401 Unauthorized | None |
| UPL-040 | Upload + verify file accessible | POST + GET | workflow | File accessible via URL | JWT |

## Mobile Config (`/api/mobile-config`)

| # | Test Case | Method | Endpoint | Expected Result | Auth |
|---|---|---|---|---|---|
| MCF-041 | Get public config (no auth) | GET | `/api/mobile-config/public` | 200 OK | None |
| MCF-042 | Get all configs (admin) | GET | `/api/mobile-config/all` | 200 OK | Admin JWT |
| MCF-043 | Get all configs without auth | GET | `/api/mobile-config/all` | 401 Unauthorized | None |
| MCF-044 | Update config by key | PUT | `/api/mobile-config/:key` | 200 OK | SuperAdmin JWT |
| MCF-045 | Update config as non-superadmin | PUT | `/api/mobile-config/:key` | 403 Forbidden | Admin JWT |
| MCF-046 | Update non-existent config key | PUT | `/api/mobile-config/:key` | 404 Not Found | SuperAdmin JWT |
| MCF-047 | Update config with valid JSON value | PUT | `/api/mobile-config/:key` | 200, value saved | SuperAdmin JWT |

## Audit Logs (`/api/audit-logs`)

| # | Test Case | Method | Endpoint | Expected Result | Auth |
|---|---|---|---|---|---|
| AUD-048 | Get audit logs (admin) | GET | `/api/audit-logs` | 200 OK, log array | Admin JWT |
| AUD-049 | Get audit logs as employee | GET | `/api/audit-logs` | 403 Forbidden | Employee JWT |
| AUD-050 | Get audit logs without auth | GET | `/api/audit-logs` | 401 Unauthorized | None |
| AUD-051 | Get logs with action filter | GET | `/api/audit-logs?action=CREATE_EMPLOYEE` | 200, filtered | Admin JWT |
| AUD-052 | Get logs with date range | GET | `/api/audit-logs?start_date=2026-01-01&end_date=2026-03-31` | 200, filtered | Admin JWT |
| AUD-053 | Get logs with user filter | GET | `/api/audit-logs?user_id=1` | 200, filtered | Admin JWT |
| AUD-054 | Pagination on audit logs | GET | `/api/audit-logs?page=1&limit=20` | 200 with pagination | Admin JWT |
| AUD-055 | Log response includes all fields | GET | `/api/audit-logs` | id, user, action, module, timestamp, details | Admin JWT |

---

**Total: 55 test cases**
