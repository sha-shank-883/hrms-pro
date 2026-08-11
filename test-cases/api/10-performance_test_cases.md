# Performance Module - Test Cases (`/api/performance`)

## Endpoints
- `GET /api/performance/goals` - List goals
- `POST /api/performance/goals` - Create goal
- `PUT /api/performance/goals/:id` - Update goal
- `DELETE /api/performance/goals/:id` - Delete goal
- `PUT /api/performance/key-results/:id` - Update key result
- `GET /api/performance/cycles` - List cycles
- `POST /api/performance/cycles` - Create cycle
- `GET /api/performance/reviews` - List reviews
- `GET /api/performance/reviews/:id` - Get review by ID
- `POST /api/performance/reviews` - Create review
- `PUT /api/performance/reviews/:id` - Update review

---

| # | Test Case | Method | Endpoint | Expected Result | Auth |
|---|---|---|---|---|---|
| PRF-001 | Get goals (admin) | GET | `/api/performance/goals` | 200 OK, goal array | Admin JWT |
| PRF-002 | Get goals (employee) | GET | `/api/performance/goals` | 200 OK, own goals | Employee JWT |
| PRF-003 | Get goals without auth | GET | `/api/performance/goals` | 401 Unauthorized | None |
| PRF-004 | Get goals filtered by employee | GET | `/api/performance/goals?employee_id=1` | 200, filtered | JWT |
| PRF-005 | Get goals filtered by status | GET | `/api/performance/goals?status=in_progress` | 200, filtered | JWT |
| PRF-006 | Get goals with search | GET | `/api/performance/goals?search=revenue` | 200, matching | JWT |
| PRF-007 | Create goal with valid data | POST | `/api/performance/goals` | 201 Created | JWT |
| PRF-008 | Create goal without auth | POST | `/api/performance/goals` | 401 Unauthorized | None |
| PRF-009 | Create goal with missing title | POST | `/api/performance/goals` | 400 Validation error | JWT |
| PRF-010 | Create goal with key results | POST | `/api/performance/goals` | 201, KR saved | JWT |
| PRF-011 | Create goal with target value | POST | `/api/performance/goals` | 201, target saved | JWT |
| PRF-012 | Create goal with deadline | POST | `/api/performance/goals` | 201, deadline saved | JWT |
| PRF-013 | Create goal with past deadline | POST | `/api/performance/goals` | 400 or 201 | JWT |
| PRF-014 | Create goal with SQL injection | POST | `/api/performance/goals` | 201, parameterized | JWT |
| PRF-015 | Create goal with XSS in title | POST | `/api/performance/goals` | 201, stored as literal | JWT |
| PRF-016 | Update goal | PUT | `/api/performance/goals/:id` | 200 OK | JWT |
| PRF-017 | Update non-existent goal | PUT | `/api/performance/goals/:id` | 404 Not Found | JWT |
| PRF-018 | Update goal progress | PUT | `/api/performance/goals/:id` | 200, progress updated | JWT |
| PRF-019 | Delete goal | DELETE | `/api/performance/goals/:id` | 200 OK | JWT |
| PRF-020 | Delete non-existent goal | DELETE | `/api/performance/goals/:id` | 404 Not Found | JWT |
| PRF-021 | Delete goal with reviews linked | DELETE | `/api/performance/goals/:id` | 409 or cascaded | JWT |
| PRF-022 | Update key result | PUT | `/api/performance/key-results/:id` | 200 OK | JWT |
| PRF-023 | Update non-existent key result | PUT | `/api/performance/key-results/:id` | 404 Not Found | JWT |
| PRF-024 | Update key result with progress | PUT | `/api/performance/key-results/:id` | 200, progress updated | JWT |
| PRF-025 | Update key result with 100% completion | PUT | `/api/performance/key-results/:id` | 200, status completed if all 100% | JWT |
| PRF-026 | Get cycles | GET | `/api/performance/cycles` | 200 OK, cycle array | JWT |
| PRF-027 | Get cycles without auth | GET | `/api/performance/cycles` | 401 Unauthorized | None |
| PRF-028 | Create cycle with valid data | POST | `/api/performance/cycles` | 201 Created | JWT |
| PRF-029 | Create cycle with missing name | POST | `/api/performance/cycles` | 400 Validation error | JWT |
| PRF-030 | Create cycle with overlapping dates | POST | `/api/performance/cycles` | 409 Conflict | JWT |
| PRF-031 | Get reviews | GET | `/api/performance/reviews` | 200 OK, review array | JWT |
| PRF-032 | Get reviews (employee sees own) | GET | `/api/performance/reviews` | 200, own reviews | Employee JWT |
| PRF-033 | Get reviews filtered by status | GET | `/api/performance/reviews?status=pending` | 200, filtered | JWT |
| PRF-034 | Get review by ID | GET | `/api/performance/reviews/:id` | 200 OK | JWT |
| PRF-035 | Get non-existent review | GET | `/api/performance/reviews/:id` | 404 Not Found | JWT |
| PRF-036 | Create review with valid data | POST | `/api/performance/reviews` | 201 Created | JWT |
| PRF-037 | Create review without auth | POST | `/api/performance/reviews` | 401 Unauthorized | None |
| PRF-038 | Create review with missing reviewee | POST | `/api/performance/reviews` | 400 Validation error | JWT |
| PRF-039 | Create review with missing reviewer | POST | `/api/performance/reviews` | 400 Validation error | JWT |
| PRF-040 | Create duplicate review (same cycle + employee) | POST | `/api/performance/reviews` | 409 Conflict | JWT |
| PRF-041 | Update review | PUT | `/api/performance/reviews/:id` | 200 OK | JWT |
| PRF-042 | Update review with scores | PUT | `/api/performance/reviews/:id` | 200, scores saved | JWT |
| PRF-043 | Update submitted review | PUT | `/api/performance/reviews/:id` | 400 Cannot modify submitted | JWT |
| PRF-044 | Update non-existent review | PUT | `/api/performance/reviews/:id` | 404 Not Found | JWT |
| PRF-045 | Goal response includes key_results array | GET | `/api/performance/goals/:id` | key_results in response | JWT |
| PRF-046 | Tenant isolation: performance data isolated | GET | `/api/performance/goals` | Only own tenant | Cross-tenant |
| PRF-047 | Create goal assigned to multiple employees | POST | `/api/performance/goals` | 201, multi-assignment | JWT |
| PRF-048 | Review includes rating/score fields | GET | `/api/performance/reviews/:id` | rating, scores fields present | JWT |
| PRF-049 | Cycle start/end dates validated | POST | `/api/performance/cycles` | end_date after start_date | JWT |
| PRF-050 | Create goal with category | POST | `/api/performance/goals` | 201, category saved | JWT |
| PRF-051 | Get cycles with active/inactive status | GET | `/api/performance/cycles` | status field present | JWT |
| PRF-052 | Pagination on goals list | GET | `/api/performance/goals?page=1&limit=10` | 200 with pagination | JWT |
| PRF-053 | Delete review | DELETE | Not in routes | - | - |
| PRF-054 | Response format: success + data | GET | `/api/performance/goals` | `{ success, data }` | JWT |
| PRF-055 | Goal progress auto-updates from key results | PUT + GET | update KR, check goal | Goal progress = avg(KR progress) | JWT |

---

**Total: 55 test cases**
