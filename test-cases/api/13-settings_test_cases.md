# Settings Module - Test Cases (`/api/settings`)

| # | Test Case | Method | Endpoint | Expected Result | Auth |
|---|---|---|---|---|---|
| SET-001 | Get settings (admin) | GET | `/api/settings` | 200 OK, settings object | Admin JWT |
| SET-002 | Get settings (employee) | GET | `/api/settings` | 200 OK | Employee JWT |
| SET-003 | Get settings without auth | GET | `/api/settings` | 401 Unauthorized | None |
| SET-004 | Get specific setting by key | GET | `/api/settings/:key` | 200 OK | JWT |
| SET-005 | Get non-existent setting key | GET | `/api/settings/:key` | 404 Not Found | JWT |
| SET-006 | Get setting without auth | GET | `/api/settings/:key` | 401 Unauthorized | None |
| SET-007 | Create setting (admin) | POST | `/api/settings` | 201 Created | Admin JWT |
| SET-008 | Create setting without admin | POST | `/api/settings` | 403 Forbidden | Employee JWT |
| SET-009 | Create setting without auth | POST | `/api/settings` | 401 Unauthorized | None |
| SET-010 | Create setting with missing key | POST | `/api/settings` | 400 Validation error | Admin JWT |
| SET-011 | Create setting with missing value | POST | `/api/settings` | 400 Validation error | Admin JWT |
| SET-012 | Create duplicate setting key | POST | `/api/settings` | 409 Conflict | Admin JWT |
| SET-013 | Create setting with various value types | POST | `/api/settings` | 201, string/number/JSON saved | Admin JWT |
| SET-014 | Update setting by key | PUT | `/api/settings/:key` | 200 OK | Admin JWT |
| SET-015 | Update non-existent setting | PUT | `/api/settings/:key` | 404 Not Found | Admin JWT |
| SET-016 | Update setting as employee | PUT | `/api/settings/:key` | 403 Forbidden | Employee JWT |
| SET-017 | Bulk update settings | PUT | `/api/settings` | 200 OK | Admin JWT |
| SET-018 | Bulk update with JSON body | PUT | `/api/settings` | 200, all settings updated | Admin JWT |
| SET-019 | Bulk update with invalid keys | PUT | `/api/settings` | 200, valid ones updated | Admin JWT |
| SET-020 | Bulk update as employee | PUT | `/api/settings` | 403 Forbidden | Employee JWT |
| SET-021 | Delete setting | DELETE | `/api/settings/:key` | 200 OK | Admin JWT |
| SET-022 | Delete non-existent setting | DELETE | `/api/settings/:key` | 404 Not Found | Admin JWT |
| SET-023 | Delete setting as employee | DELETE | `/api/settings/:key` | 403 Forbidden | Employee JWT |
| SET-024 | Get settings returns object with all keys | GET | `/api/settings` | settings as key-value object | JWT |
| SET-025 | Create then GET confirms creation | POST + GET | workflow | New setting in response | Admin JWT |
| SET-026 | Update then GET confirms update | PUT + GET | workflow | Updated value reflected | Admin JWT |
| SET-027 | Delete then GET returns 404 | DELETE + GET | workflow | 404 Not Found | Admin JWT |
| SET-028 | XSS injection in setting value | POST | `/api/settings` | 201, stored as literal | Admin JWT |
| SET-029 | SQL injection in setting key | POST | `/api/settings` | 201/400, parameterized | Admin JWT |
| SET-030 | Setting value with special characters | POST | `/api/settings` | 201, stored correctly | Admin JWT |
| SET-031 | Setting value with boolean | POST | `/api/settings` | 201, "true"/"false" saved | Admin JWT |
| SET-032 | Setting value with JSON | POST | `/api/settings` | 201, JSON string saved | Admin JWT |
| SET-033 | Setting value with number | POST | `/api/settings` | 201, numeric string | Admin JWT |
| SET-034 | Settings pagination if applicable | GET | `/api/settings?page=1&limit=20` | 200 with pagination | JWT |
| SET-035 | Tenant isolation: settings per tenant | GET | `/api/settings` | Isolated per tenant | Cross-tenant |
| SET-036 | Create setting with empty key | POST | `/api/settings` | 400 Validation error | Admin JWT |
| SET-037 | Create setting with empty value | POST | `/api/settings` | 400 Validation error | Admin JWT |
| SET-038 | Bulk update empty body | PUT | `/api/settings` (empty {}) | 200, no changes | Admin JWT |
| SET-039 | Bulk update with 50+ settings | PUT | `/api/settings` | 200, all saved | Admin JWT |
| SET-040 | Get setting with very long key | GET | `/api/settings/:key` | 404 (key doesn't exist) | JWT |
| SET-041 | Update setting with very long value | PUT | `/api/settings/:key` | 200 | Admin JWT |
| SET-042 | Settings response format | GET | `/api/settings` | `{ success, data: {...} }` | JWT |
| SET-043 | Error response for invalid setting key | GET | `/api/settings/@@invalid` | 404 with message | JWT |
| SET-044 | Setting changes persist after server restart | Workflow | - | Settings persist | - |
| SET-045 | Consecutive creates with different keys | POST | `/api/settings` ×3 | 201 ×3 | Admin JWT |
| SET-046 | Create setting as manager | POST | `/api/settings` | 403 Forbidden | Manager JWT |
| SET-047 | Update setting as manager | PUT | `/api/settings/:key` | 403 Forbidden | Manager JWT |
| SET-048 | Delete setting as manager | DELETE | `/api/settings/:key` | 403 Forbidden | Manager JWT |
| SET-049 | Setting key with dots/periods | POST | `/api/settings` | 201, key saved as-is | Admin JWT |
| SET-050 | Setting key with special chars (underscore, hyphen) | POST | `/api/settings` | 201 | Admin JWT |
| SET-051 | Rate limiting on settings | GET | `/api/settings` | 429 after threshold | JWT |
| SET-052 | Settings include public/private visibility | GET | `/api/settings` | Visibility field present | JWT |
| SET-053 | Public settings accessible without auth | GET | `/api/settings?public=true` | 200 (if endpoint exists) | None |
| SET-054 | Multiple concurrent setting updates | PUT | `/api/settings` (parallel) | All updates applied | Admin JWT |
| SET-055 | Setting key max length enforced | POST | `/api/settings` with 500 char key | 400 | Admin JWT |

---

**Total: 55 test cases**
