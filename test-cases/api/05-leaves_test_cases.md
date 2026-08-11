# Leaves Module - Test Cases (`/api/leaves`)

## Endpoints
- `GET /api/leaves` - List requests
- `GET /api/leaves/statistics` - Statistics
- `GET /api/leaves/balance/:employee_id` - Single employee balance
- `GET /api/leaves/balance` - All balances (admin/manager)
- `GET /api/leaves/:id` - Get by ID
- `POST /api/leaves` - Create request
- `PUT /api/leaves/:id` - Update request
- `PUT /api/leaves/:id/approve` - Approve (admin/manager)
- `PUT /api/leaves/:id/reject` - Reject (admin/manager)
- `DELETE /api/leaves/:id` - Delete
- `POST /api/leaves/comp-off` - Request comp-off
- `PUT /api/leaves/comp-off/:id` - Update comp-off status
- `GET /api/leaves/comp-off` - List comp-off requests

---

| # | Test Case | Method | Endpoint | Expected Result | Auth |
|---|---|---|---|---|---|
| LEV-001 | Get all leave requests (admin) | GET | `/api/leaves` | 200 OK, records array | Admin JWT |
| LEV-002 | Get all leave requests (employee) | GET | `/api/leaves` | 200 OK, own records | Employee JWT |
| LEV-003 | Get leaves without auth | GET | `/api/leaves` | 401 Unauthorized | None |
| LEV-004 | Get leaves with status filter | GET | `/api/leaves?status=pending` | 200, filtered | JWT |
| LEV-005 | Get leaves with date range filter | GET | `/api/leaves?start_date=2026-01-01&end_date=2026-03-31` | 200, filtered | JWT |
| LEV-006 | Get leaves with employee filter (admin) | GET | `/api/leaves?employee_id=1` | 200, filtered by employee | Admin JWT |
| LEV-007 | Get leave statistics | GET | `/api/leaves/statistics` | 200 OK, stats object | JWT |
| LEV-008 | Get leave statistics without auth | GET | `/api/leaves/statistics` | 401 Unauthorized | None |
| LEV-009 | Get leave balance for specific employee | GET | `/api/leaves/balance/:employee_id` | 200 OK, balance data | JWT |
| LEV-010 | Get leave balance for non-existent employee | GET | `/api/leaves/balance/:employee_id` | 404 Not Found | JWT |
| LEV-011 | Get all leave balances (admin) | GET | `/api/leaves/balance` | 200 OK, all balances | Admin JWT |
| LEV-012 | Get all leave balances (employee) | GET | `/api/leaves/balance` | 403 Forbidden | Employee JWT |
| LEV-013 | Get leave request by ID | GET | `/api/leaves/:id` | 200 OK, single record | JWT |
| LEV-014 | Get leave request by non-existent ID | GET | `/api/leaves/:id` | 404 Not Found | JWT |
| LEV-015 | Get leave request as employee (own) | GET | `/api/leaves/:id` | 200 OK | Employee JWT |
| LEV-016 | Get leave request as employee (other's) | GET | `/api/leaves/:id` | 403 Forbidden | Employee JWT |
| LEV-017 | Create leave request with valid data | POST | `/api/leaves` | 201 Created | JWT |
| LEV-018 | Create leave request without auth | POST | `/api/leaves` | 401 Unauthorized | None |
| LEV-019 | Create leave request with missing employee_id | POST | `/api/leaves` | 400 Validation error | JWT |
| LEV-020 | Create leave request with missing leave_type | POST | `/api/leaves` | 400 Validation error | JWT |
| LEV-021 | Create leave request with missing dates | POST | `/api/leaves` | 400 Validation error | JWT |
| LEV-022 | Create leave request with invalid leave_type | POST | `/api/leaves` | 400 Validation error | JWT |
| LEV-023 | Create leave request with end_date before start_date | POST | `/api/leaves` | 400 Validation error | JWT |
| LEV-024 | Create leave request exceeding balance | POST | `/api/leaves` | 400 Insufficient balance | JWT |
| LEV-025 | Create leave request with overlapping dates | POST | `/api/leaves` | 409 Conflict | JWT |
| LEV-026 | Create leave request with future date range | POST | `/api/leaves` | 201 Created | JWT |
| LEV-027 | Create leave request for past date | POST | `/api/leaves` | 400 Cannot apply for past | JWT |
| LEV-028 | Update leave request (own, pending only) | PUT | `/api/leaves/:id` | 200 OK | JWT |
| LEV-029 | Update leave request after approval | PUT | `/api/leaves/:id` | 400 Cannot modify approved | JWT |
| LEV-030 | Update leave request as admin (any) | PUT | `/api/leaves/:id` | 200 OK | Admin JWT |
| LEV-031 | Approve leave request | PUT | `/api/leaves/:id/approve` | 200 OK | Admin/Manager JWT |
| LEV-032 | Approve as employee | PUT | `/api/leaves/:id/approve` | 403 Forbidden | Employee JWT |
| LEV-033 | Approve non-existent leave | PUT | `/api/leaves/:id/approve` | 404 Not Found | Admin JWT |
| LEV-034 | Approve already approved leave | PUT | `/api/leaves/:id/approve` | 400 Already approved | Admin JWT |
| LEV-035 | Reject leave request | PUT | `/api/leaves/:id/reject` | 200 OK | Admin/Manager JWT |
| LEV-036 | Reject with comments | PUT | `/api/leaves/:id/reject` | 200, comments saved | Admin JWT |
| LEV-037 | Delete leave request (own, pending) | DELETE | `/api/leaves/:id` | 200 OK | JWT |
| LEV-038 | Delete leave request (admin, any) | DELETE | `/api/leaves/:id` | 200 OK | Admin JWT |
| LEV-039 | Delete approved leave request | DELETE | `/api/leaves/:id` | 400 Cannot delete approved | JWT |
| LEV-040 | Create comp-off request | POST | `/api/leaves/comp-off` | 201 Created | JWT |
| LEV-041 | Create comp-off with missing date | POST | `/api/leaves/comp-off` | 400 Validation error | JWT |
| LEV-042 | Get comp-off requests | GET | `/api/leaves/comp-off` | 200 OK | JWT |
| LEV-043 | Approve comp-off request | PUT | `/api/leaves/comp-off/:id` | 200 OK | Admin/Manager JWT |
| LEV-044 | Reject comp-off request | PUT | `/api/leaves/comp-off/:id` | 200, status=rejected | Admin/Manager JWT |
| LEV-045 | Balance response includes sick, casual, earned types | GET | `/api/leaves/balance/:employee_id` | Balance breakdown by type | JWT |
| LEV-046 | Tenant isolation: leaves isolated per tenant | GET | `/api/leaves` | Only own tenant data | Cross-tenant |
| LEV-047 | SQL injection in reason field | POST | `/api/leaves` | 201, parameterized safely | JWT |
| LEV-048 | XSS in reason field | POST | `/api/leaves` | 201, stored as literal text | JWT |
| LEV-049 | Pagination on leave list | GET | `/api/leaves?page=1&limit=10` | 200 with pagination | JWT |
| LEV-050 | Create leave for 1 day (single day) | POST | `/api/leaves` | 201 Created | JWT |
| LEV-051 | Create leave for multi-day range | POST | `/api/leaves` | 201 Created | JWT |
| LEV-052 | Approve with auto-deduction from balance | PUT + GET | approve then check balance | Balance reduced | Admin JWT |
| LEV-053 | Email notification sent on approval | PUT | `/api/leaves/:id/approve` | Notification/log created | Admin JWT |
| LEV-054 | Leave request with attachment | POST | `/api/leaves` | 201, attachment saved | JWT |
| LEV-055 | Statistics include pending, approved, rejected counts | GET | `/api/leaves/statistics` | All status counts present | JWT |

---

**Total: 55 test cases**
