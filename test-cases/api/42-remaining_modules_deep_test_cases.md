# Remaining Modules — Deep API Test Cases (120 tests)

## 1.1 Email Templates — 20 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| E1 | Create email template | POST | `/api/email-templates` | `{ name, subject, body, variables }` | 201 | Template created |
| E2 | Create with missing subject | POST | `/api/email-templates` | No subject | 400 | Required |
| E3 | Create with missing body | POST | `/api/email-templates` | No body | 400 | Required |
| E4 | Create duplicate name | POST | `/api/email-templates` | Same name as E1 | 409 | Duplicate |
| E5 | Create without auth | POST | `/api/email-templates` | No token | 401 | Unauthorized |
| E6 | Create as employee | POST | `/api/email-templates` | Employee | 403 | Forbidden |
| E7 | Create with SQL injection | POST | `/api/email-templates` | `{ body: "'; DROP TABLE email_templates; --" }` | 201 | Sanitized |
| E8 | Create with XSS in body | POST | `/api/email-templates` | `{ body: "<script>alert(1)</script>" }` | 201 | HTML-encoded |
| E9 | List templates | GET | `/api/email-templates` | Valid auth | 200 | Array |
| E10 | List without auth | GET | `/api/email-templates` | No token | 401 | Unauthorized |
| E11 | Get single template | GET | `/api/email-templates/:id` | Valid auth | 200 | Template object |
| E12 | Get non-existent | GET | `/api/email-templates/:id` | `id: 99999` | 404 | Not found |
| E13 | Update template | PUT | `/api/email-templates/:id` | `{ subject: "New Subject" }` | 200 | Updated |
| E14 | Update with empty body | PUT | `/api/email-templates/:id` | `{ body: "" }` | 400 | Required |
| E15 | Delete template | DELETE | `/api/email-templates/:id` | Admin | 200 | Deleted |
| E16 | Delete non-existent | DELETE | `/api/email-templates/:id` | `id: 99999` | 404 | Not found |
| E17 | Send templated email | POST | `/api/email-templates/:id/send` | `{ to, variables: { name: "John" } }` | 200 | Email queued |
| E18 | Send with missing variables | POST | `/api/email-templates/:id/send` | `{ to: "test@example.com" }` | 400 | Variables required |
| E19 | Send with invalid recipient | POST | `/api/email-templates/:id/send` | `{ to: "invalid" }` | 400 | Invalid email |
| E20 | Send template without auth | POST | `/api/email-templates/:id/send` | No token | 401 | Unauthorized |

## 1.2 Search — 15 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| E21 | Global search | GET | `/api/search?q=john` | Valid auth | 200 | Results |
| E22 | Search without query | GET | `/api/search` | No q param | 400 | Query required |
| E23 | Search with empty query | GET | `/api/search?q=` | Empty string | 400 | Required |
| E24 | Search with short query | GET | `/api/search?q=a` | 1 character | 200 | Min length? |
| E25 | Search without auth | GET | `/api/search` | No token | 401 | Unauthorized |
| E26 | Search in employees module | GET | `/api/search?q=john&module=employees` | Valid auth | 200 | Employees only |
| E27 | Search in departments module | GET | `/api/search?q=eng&module=departments` | Valid auth | 200 | Departments only |
| E28 | Search with pagination | GET | `/api/search?q=john&page=1&limit=10` | Valid auth | 200 | Paginated |
| E29 | Search returns grouped results | GET | `/api/search?q=john` | Valid auth | 200 | `employees`, `departments`, etc. |
| E30 | Search with special characters | GET | `/api/search?q=o%27brien` | URL encoded | 200 | Handles |
| E31 | Search with SQL injection | GET | `/api/search?q=' UNION SELECT * FROM users--` | Valid auth | 200 | Sanitized |
| E32 | Search cross-tenant isolation | GET | `/api/search?q=john` | Wrong tenant | 403 | Blocked |
| E33 | Search with no results | GET | `/api/search?q=__nonexistent__` | Valid auth | 200 | Empty results |
| E34 | Search rate limiting | GET | `/api/search?q=x` x 100 | Rapid | 429 | Limited |
| E35 | Search with unicode query | GET | `/api/search?q=José` | Valid auth | 200 | Unicode works |

## 1.3 Upload — 15 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| E36 | Upload file | POST | `/api/upload` | Multipart file | 201 | File uploaded |
| E37 | Upload without file | POST | `/api/upload` | No file | 400 | Required |
| E38 | Upload without auth | POST | `/api/upload` | No token | 401 | Unauthorized |
| E39 | Upload with very large file | POST | `/api/upload` | File >10MB | 400 | Too large |
| E40 | Upload with invalid file type | POST | `/api/upload` | `.exe` file | 400 | Invalid type |
| E41 | Upload image file | POST | `/api/upload` | JPEG image | 201 | Stored |
| E42 | Upload document (PDF) | POST | `/api/upload` | PDF file | 201 | Stored |
| E43 | Upload for chat | POST | `/api/upload/chat` | File for chat | 201 | Chat file |
| E44 | Upload returns file URL | POST | `/api/upload` | Valid file | 201 | `url` in response |
| E45 | Upload returns file_id | POST | `/api/upload` | Valid file | 201 | `id` in response |
| E46 | Upload with path traversal in filename | POST | `/api/upload` | `../../etc/passwd` filename | 400 | Blocked |
| E47 | Upload with zero-byte file | POST | `/api/upload` | Empty file | 400 | Invalid |
| E48 | Upload duplicate filename | POST | `/api/upload` | Same filename twice | 201 both | Unique stored |
| E49 | Delete uploaded file | DELETE | `/api/upload/:id` | Owner | 200 | Deleted |
| E50 | Delete without auth | DELETE | `/api/upload/:id` | No token | 401 | Unauthorized |

## 1.4 Mobile Config — 10 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| E51 | Get public mobile config | GET | `/api/mobile-config` | No auth | 200 | Public config |
| E52 | Get all config (admin) | GET | `/api/mobile-config/all` | Admin | 200 | Full config |
| E53 | Get all without auth | GET | `/api/mobile-config/all` | No token | 401 | Unauthorized |
| E54 | Get all as employee | GET | `/api/mobile-config/all` | Employee | 403 | Forbidden |
| E55 | Update config | PUT | `/api/mobile-config` | `{ key: "value" }` | 200 | Updated |
| E56 | Update without auth | PUT | `/api/mobile-config` | No token | 401 | Unauthorized |
| E57 | Update as admin (non super) | PUT | `/api/mobile-config` | Admin | 403 | Forbidden |
| E58 | Config includes app version | GET | `/api/mobile-config` | Public | 200 | `min_version`, `latest_version` |
| E59 | Config includes features | GET | `/api/mobile-config` | Public | 200 | `features` object |
| E60 | Config includes branding | GET | `/api/mobile-config` | Public | 200 | `primary_color`, `logo` |

## 1.5 Audit Logs — 15 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| E61 | List audit logs | GET | `/api/audit-logs` | Admin token | 200 | Array |
| E62 | List without auth | GET | `/api/audit-logs` | No token | 401 | Unauthorized |
| E63 | List as employee | GET | `/api/audit-logs` | Employee | 403 | Forbidden |
| E64 | List with module filter | GET | `/api/audit-logs?module=employees` | Admin | 200 | Module only |
| E65 | List with action filter | GET | `/api/audit-logs?action=CREATE` | Admin | 200 | Create only |
| E66 | List with user filter | GET | `/api/audit-logs?user_id=1` | Admin | 200 | By user |
| E67 | List with date range | GET | `/api/audit-logs?from=2025-01-01&to=2025-01-31` | Admin | 200 | Date range |
| E68 | List with pagination | GET | `/api/audit-logs?page=1&limit=50` | Admin | 200 | Paginated |
| E69 | List sorted by timestamp | GET | `/api/audit-logs?sort=created_at&order=desc` | Admin | 200 | Most recent |
| E70 | List with search | GET | `/api/audit-logs?search=delete` | Admin | 200 | Searched |
| E71 | Log entry format verification | GET | `/api/audit-logs` | Admin | 200 | `action`, `module`, `user_id`, `details`, `ip_address` |
| E72 | Log includes IP address | GET | `/api/audit-logs` | Admin | 200 | `ip_address` field |
| E73 | Log includes user agent | GET | `/api/audit-logs` | Admin | 200 | `user_agent` field |
| E74 | Log cross-tenant isolation | GET | `/api/audit-logs` | Wrong tenant | 403 | Blocked |
| E75 | Audit log export | GET | `/api/audit-logs/export?format=csv` | Admin | 200 | CSV export |

## 1.6 Public ID Card — 5 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| E76 | Get public ID card | GET | `/api/view/id-card/:id` | No auth | 200 | Public ID card |
| E77 | Get non-existent ID | GET | `/api/view/id-card/:id` | `id: 99999` | 404 | Not found |
| E78 | ID card includes employee photo | GET | `/api/view/id-card/:id` | Public | 200 | Photo URL |
| E79 | ID card includes employee details | GET | `/api/view/id-card/:id` | Public | 200 | `name`, `designation`, `department` |
| E80 | ID card rate limiting | GET | `/api/view/id-card/:id` x 100 | Rapid | 429 | Limited |

## 1.7 Health & Tenant Info — 8 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| E81 | Health check | GET | `/health` | No auth | 200 | `status: "ok"` |
| E82 | Health returns uptime | GET | `/health` | No auth | 200 | `uptime` field |
| E83 | Health returns DB status | GET | `/health` | No auth | 200 | `database: "connected"` |
| E84 | Health returns version | GET | `/health` | No auth | 200 | `version` field |
| E85 | Tenant info with valid header | GET | `/api/tenant-info` | Valid x-tenant-id | 200 | `tenant_id`, `name` |
| E86 | Tenant info without header | GET | `/api/tenant-info` | No header | 400 | Required |
| E87 | Tenant info with invalid tenant | GET | `/api/tenant-info` | Non-existent tenant | 404 | Not found |
| E88 | Health check response time | GET | `/health` | No auth | 200 | < 500ms |

## 1.8 Onboarding / Offboarding — 10 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| E89 | Create onboarding checklist | POST | `/api/onboarding` | `{ employee_id, items, due_date }` | 201 | Created |
| E90 | Create with missing employee | POST | `/api/onboarding` | No employee_id | 400 | Required |
| E91 | List onboarding tasks | GET | `/api/onboarding?employee_id=1` | Valid auth | 200 | Array |
| E92 | Update onboarding item status | PUT | `/api/onboarding/:id/items/:itemId` | `{ completed: true }` | 200 | Updated |
| E93 | Create offboarding checklist | POST | `/api/offboarding` | `{ employee_id, items, exit_date }` | 201 | Created |
| E94 | List offboarding tasks | GET | `/api/offboarding?employee_id=1` | Valid auth | 200 | Array |
| E95 | Offboarding with exit interview | POST | `/api/offboarding/:id/interview` | `{ feedback, reason }` | 200 | Stored |
| E96 | Complete onboarding | PUT | `/api/onboarding/:id/complete` | Admin | 200 | Completed |
| E97 | Onboarding without auth | POST | `/api/onboarding` | No token | 401 | Unauthorized |
| E98 | Onboarding cross-tenant | GET | `/api/onboarding` | Wrong tenant | 403 | Blocked |

## 1.9 Authorization — 12 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| E99 | Admin can manage email templates | ALL | Email-templates | Admin | 200 | Full |
| E100 | Employee cannot manage email templates | POST/PUT/DELETE | Email-templates | Employee | 403 | Forbidden |
| E101 | Admin can view audit logs | GET | Audit-logs | Admin | 200 | Allowed |
| E102 | Employee cannot view audit logs | GET | Audit-logs | Employee | 403 | Forbidden |
| E103 | Public can use health/tenant-info | GET | Health | No auth | 200 | Public |
| E104 | Public can view ID card | GET | ID card | No auth | 200 | Public |
| E105 | Super admin manages mobile config | PUT | Mobile-config | Super admin | 200 | Allowed |
| E106 | Admin cannot manage mobile config | PUT | Mobile-config | Admin | 403 | Forbidden |
| E107 | Cross-tenant isolation on search | GET | Search | Wrong tenant | 403 | Blocked |
| E108 | Cross-tenant isolation on audit logs | GET | Audit-logs | Wrong tenant | 403 | Blocked |
| E109 | Rate limiting on upload | POST | Upload x 50 | Rapid large files | 429 | Limited |
| E110 | SQL injection in search | GET | Search?q='UNION... | Valid | 200 | Sanitized |

## 1.10 Edge Cases — 10 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| E111 | Upload with same content hash | POST | Upload x2 | Same file | 201 both | Dedup? |
| E112 | Upload with Unicode filename | POST | Upload | Chinese filename | 201 | Stored |
| E113 | Search with stop words | GET | `/api/search?q=the+a+an` | Common words | 200 | Ignored |
| E114 | Search with boolean operators | GET | `/api/search?q=john+AND+doe` | Valid auth | 200 | Handled or literal |
| E115 | Email template with complex HTML body | POST | Email-templates | Rich HTML | 201 | Stored |
| E116 | Email template with image embed | POST | Email-templates | `<img>` tags | 201 | Sanitized |
| E117 | Mobile config with invalid JSON | PUT | Mobile-config | Invalid JSON | 400 | Parse error |
| E118 | Audit log with large details | GET | Audit-logs | Big entry | 200 | Truncated? |
| E119 | Audit log cleaning/retention | DELETE | `/api/audit-logs/clean` | Admin | 200 | Old logs purged |
| E120 | Onboarding with 50 checklist items | POST | Onboarding | 50 items | 201 | All stored |

Total: 20 + 15 + 15 + 10 + 15 + 5 + 8 + 10 + 12 + 10 = **120 tests**
