# Holidays Module - Test Cases (`/api/holidays`)

| # | Test Case | Method | Endpoint | Expected Result | Auth |
|---|---|---|---|---|---|
| HOL-001 | Get holidays (admin) | GET | `/api/holidays` | 200 OK, holiday array | JWT |
| HOL-002 | Get holidays (employee) | GET | `/api/holidays` | 200 OK | Employee JWT |
| HOL-003 | Get holidays without auth | GET | `/api/holidays` | 401 Unauthorized | None |
| HOL-004 | Get holidays filtered by year | GET | `/api/holidays?year=2026` | 200, filtered | JWT |
| HOL-005 | Get holidays filtered by type | GET | `/api/holidays?type=national` | 200, filtered | JWT |
| HOL-006 | Get holidays with pagination | GET | `/api/holidays?page=1&limit=20` | 200 with pagination | JWT |
| HOL-007 | Get my restricted holidays | GET | `/api/holidays/my-restricted` | 200 OK | JWT |
| HOL-008 | Get my restricted holidays without auth | GET | `/api/holidays/my-restricted` | 401 Unauthorized | None |
| HOL-009 | Opt-in to restricted holiday | POST | `/api/holidays/opt-in` | 200 OK | JWT |
| HOL-010 | Opt-in to already opted holiday | POST | `/api/holidays/opt-in` | 409 Already opted | JWT |
| HOL-011 | Opt-in to non-existent restricted holiday | POST | `/api/holidays/opt-in` | 404 Not Found | JWT |
| HOL-012 | Opt-in without auth | POST | `/api/holidays/opt-in` | 401 Unauthorized | None |
| HOL-013 | Create holiday (admin) | POST | `/api/holidays` | 201 Created | Admin JWT |
| HOL-014 | Create holiday as employee | POST | `/api/holidays` | 403 Forbidden | Employee JWT |
| HOL-015 | Create holiday with missing name | POST | `/api/holidays` | 400 Validation error | Admin JWT |
| HOL-016 | Create holiday with missing date | POST | `/api/holidays` | 400 Validation error | Admin JWT |
| HOL-017 | Create holiday as manager | POST | `/api/holidays` | 201 Created | Manager JWT |
| HOL-018 | Create duplicate holiday (same name + date) | POST | `/api/holidays` | 409 Conflict | Admin JWT |
| HOL-019 | Create holiday with past date | POST | `/api/holidays` | 201 (or 400) | Admin JWT |
| HOL-020 | Create holiday with type field | POST | `/api/holidays` | 201, type saved | Admin JWT |
| HOL-021 | Create holiday as restricted | POST | `/api/holidays` | 201, restricted=true | Admin JWT |
| HOL-022 | Create holiday with XSS in name | POST | `/api/holidays` | 201, stored as literal | Admin JWT |
| HOL-023 | Update holiday | PUT | `/api/holidays/:id` | 200 OK | Admin JWT |
| HOL-024 | Update holiday as employee | PUT | `/api/holidays/:id` | 403 Forbidden | Employee JWT |
| HOL-025 | Update non-existent holiday | PUT | `/api/holidays/:id` | 404 Not Found | Admin JWT |
| HOL-026 | Update holiday date | PUT | `/api/holidays/:id` | 200, date changed | Admin JWT |
| HOL-027 | Update holiday name | PUT | `/api/holidays/:id` | 200, name changed | Admin JWT |
| HOL-028 | Delete holiday | DELETE | `/api/holidays/:id` | 200 OK | Admin JWT |
| HOL-029 | Delete holiday as manager | DELETE | `/api/holidays/:id` | 403 Forbidden | Manager JWT |
| HOL-030 | Delete non-existent holiday | DELETE | `/api/holidays/:id` | 404 Not Found | Admin JWT |
| HOL-031 | Opt-in then verify my-restricted includes it | POST + GET | workflow | Holiday appears in list | JWT |
| HOL-032 | Opt-out (if available) | - | - | Removed from restricted list | JWT |
| HOL-033 | Holiday list sorted by date | GET | `/api/holidays?sort=date&order=asc` | 200, sorted | JWT |
| HOL-034 | Create holiday on weekend | POST | `/api/holidays` | 201 | Admin JWT |
| HOL-035 | Create holiday on existing holiday date | POST | `/api/holidays` | 409 Conflict | Admin JWT |
| HOL-036 | SQL injection in holiday name | POST | `/api/holidays` | 201, parameterized | Admin JWT |
| HOL-037 | Tenant isolation: holidays isolated | GET | `/api/holidays` | Only own tenant | Cross-tenant |
| HOL-038 | Get holidays returns restricted field | GET | `/api/holidays` | is_restricted/type in response | JWT |
| HOL-039 | Create holiday without auth | POST | `/api/holidays` | 401 Unauthorized | None |
| HOL-040 | Delete holiday as admin with opt-ins | DELETE | `/api/holidays/:id` | 200, cascaded or blocked | Admin JWT |
| HOL-041 | Create then GET confirms | POST + GET | workflow | Holiday visible in list | Admin JWT |
| HOL-042 | Update then GET confirms | PUT + GET | workflow | Updated values reflected | Admin JWT |
| HOL-043 | Delete then GET returns 404 | DELETE + GET | workflow | 404 Not Found | Admin JWT |
| HOL-044 | Holiday response includes employee_opted if applicable | GET | `/api/holidays` | opt_in_status for employee | JWT |
| HOL-045 | Holiday with description field | POST | `/api/holidays` | 201, description saved | Admin JWT |
| HOL-046 | Create holiday with multiple types | POST | `/api/holidays` | 201 | Admin JWT |
| HOL-047 | Get holidays for specific month | GET | `/api/holidays?month=12&year=2026` | 200, December holidays | JWT |
| HOL-048 | Year filter required validation | GET | `/api/holidays` (no filter) | 200, upcoming holidays | JWT |
| HOL-049 | Response format: success + data | GET | `/api/holidays` | `{ success, data }` | JWT |
| HOL-050 | Opt-in for non-restricted holiday | POST | `/api/holidays/opt-in` | 400 Not a restricted holiday | JWT |
| HOL-051 | Create holiday as manager | POST | `/api/holidays` | 201 Created | Manager JWT |
| HOL-052 | Update holiday as manager | PUT | `/api/holidays/:id` | 200 OK | Manager JWT |
| HOL-053 | Holiday list: upcoming first, past later | GET | `/api/holidays` | Sort order | JWT |
| HOL-054 | Create holiday with date in invalid format | POST | `/api/holidays` | 400 Validation error | Admin JWT |
| HOL-055 | Bulk create holidays | POST | `/api/holidays` ×5 | 201 ×5 | Admin JWT |

---

**Total: 55 test cases**
