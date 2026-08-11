# Attendance Module - Test Cases (`/api/attendance`)

## Endpoints
- `GET /api/attendance` - List records
- `GET /api/attendance/today` - Today's status
- `GET /api/attendance/history` - History
- `POST /api/attendance/clock-in` - Clock in
- `POST /api/attendance/clock-out` - Clock out
- `POST /api/attendance` - Manual entry (admin/manager)
- `PUT /api/attendance/:id` - Update (admin/manager)
- `DELETE /api/attendance/:id` - Delete (admin)
- `POST /api/attendance/regularize` - Request regularization
- `PUT /api/attendance/regularize/:id` - Approve/reject
- `GET /api/attendance/regularize` - List regularization requests

---

| # | Test Case | Method | Endpoint | Expected Result | Auth |
|---|---|---|---|---|---|
| ATT-001 | Get attendance records (admin) | GET | `/api/attendance` | 200 OK, records array | Admin JWT |
| ATT-002 | Get attendance records (employee) | GET | `/api/attendance` | 200 OK, own records | Employee JWT |
| ATT-003 | Get attendance without auth | GET | `/api/attendance` | 401 Unauthorized | None |
| ATT-004 | Get attendance with date filter | GET | `/api/attendance?start_date=2026-01-01&end_date=2026-01-31` | 200, filtered records | JWT |
| ATT-005 | Get attendance with employee filter (admin) | GET | `/api/attendance?employee_id=1` | 200, filtered | Admin JWT |
| ATT-006 | Get today's attendance | GET | `/api/attendance/today` | 200 OK | JWT |
| ATT-007 | Get today's attendance without auth | GET | `/api/attendance/today` | 401 Unauthorized | None |
| ATT-008 | Get attendance history | GET | `/api/attendance/history` | 200 OK, paginated history | JWT |
| ATT-009 | Get attendance history with date range | GET | `/api/attendance/history?from=2026-01-01&to=2026-03-31` | 200, filtered | JWT |
| ATT-010 | Clock in with valid employee ID | POST | `/api/attendance/clock-in` | 201 Created | Employee JWT |
| ATT-011 | Clock in without auth | POST | `/api/attendance/clock-in` | 401 Unauthorized | None |
| ATT-012 | Clock in with missing employee_id | POST | `/api/attendance/clock-in` | 400 Validation error | JWT |
| ATT-013 | Clock in when already clocked in (no clock-out) | POST | `/api/attendance/clock-in` | 400 Already clocked in | JWT |
| ATT-014 | Clock in with invalid employee_id | POST | `/api/attendance/clock-in` | 400 or 404 | JWT |
| ATT-015 | Clock out with valid employee ID | POST | `/api/attendance/clock-out` | 200 OK | JWT |
| ATT-016 | Clock out without clocking in first | POST | `/api/attendance/clock-out` | 400 No active session | JWT |
| ATT-017 | Clock out with missing employee_id | POST | `/api/attendance/clock-out` | 400 Validation error | JWT |
| ATT-018 | Clock in/out flow (complete cycle) | POST | clock-in then clock-out | Both succeed | JWT |
| ATT-019 | Clock in with GPS coordinates | POST | `/api/attendance/clock-in` (with lat/lng) | 201, location saved | JWT |
| ATT-020 | Create manual attendance record (admin) | POST | `/api/attendance` | 201 Created | Admin JWT |
| ATT-021 | Create manual attendance as employee | POST | `/api/attendance` | 403 Forbidden | Employee JWT |
| ATT-022 | Create manual attendance with missing fields | POST | `/api/attendance` | 400 Validation error | Admin JWT |
| ATT-023 | Create manual attendance with future date | POST | `/api/attendance` | 400 or 201 (depends on validation) | Admin JWT |
| ATT-024 | Create duplicate attendance (same employee + date) | POST | `/api/attendance` | 409 Conflict | Admin JWT |
| ATT-025 | Update attendance record | PUT | `/api/attendance/:id` | 200 OK | Admin JWT |
| ATT-026 | Update attendance as employee | PUT | `/api/attendance/:id` | 403 Forbidden | Employee JWT |
| ATT-027 | Update non-existent attendance | PUT | `/api/attendance/:id` | 404 Not Found | Admin JWT |
| ATT-028 | Delete attendance record | DELETE | `/api/attendance/:id` | 200 OK | Admin JWT |
| ATT-029 | Delete attendance as manager | DELETE | `/api/attendance/:id` | 403 Forbidden | Manager JWT |
| ATT-030 | Delete non-existent attendance | DELETE | `/api/attendance/:id` | 404 Not Found | Admin JWT |
| ATT-031 | Request regularization | POST | `/api/attendance/regularize` | 201 Created | Employee JWT |
| ATT-032 | Request regularization with missing date | POST | `/api/attendance/regularize` | 400 Validation error | JWT |
| ATT-033 | Request regularization with reason | POST | `/api/attendance/regularize` | 201, reason saved | JWT |
| ATT-034 | Get regularization requests (admin) | GET | `/api/attendance/regularize` | 200 OK, all requests | Admin JWT |
| ATT-035 | Get regularization requests (employee) | GET | `/api/attendance/regularize` | 200 OK, own requests | Employee JWT |
| ATT-036 | Approve regularization request | PUT | `/api/attendance/regularize/:id` | 200 OK, status=approved | Admin JWT |
| ATT-037 | Reject regularization request | PUT | `/api/attendance/regularize/:id` | 200 OK, status=rejected | Admin JWT |
| ATT-038 | Approve regularization as employee | PUT | `/api/attendance/regularize/:id` | 403 Forbidden | Employee JWT |
| ATT-039 | Approve non-existent regularization | PUT | `/api/attendance/regularize/:id` | 404 Not Found | Admin JWT |
| ATT-040 | Approve already-approved regularization | PUT | `/api/attendance/regularize/:id` | 400 Already processed | Admin JWT |
| ATT-041 | Response format: success, data fields | GET | `/api/attendance` | `{ success, data }` | JWT |
| ATT-042 | Clock in with SQL injection in notes | POST | `/api/attendance/clock-in` | 201, parameterized safely | JWT |
| ATT-043 | Tenant isolation: attendance data isolated | GET | `/api/attendance` | Only own tenant data | Cross-tenant |
| ATT-044 | Attendance with XSS in notes field | POST | `/api/attendance` | 201, stored as literal | Admin JWT |
| ATT-045 | Get attendance history pagination | GET | `/api/attendance/history?page=1&limit=5` | 200, paginated | JWT |
| ATT-046 | Create regularization for past date | POST | `/api/attendance/regularize` | 201 Created | Employee JWT |
| ATT-047 | Create regularization for future date | POST | `/api/attendance/regularize` | 400 Cannot regularize future | Employee JWT |
| ATT-048 | Get attendance with status filter | GET | `/api/attendance?status=present` | 200, filtered | JWT |
| ATT-049 | Delete attendance then GET returns 404 | DELETE + GET | workflow | 404 Not Found | Admin JWT |
| ATT-050 | Update regularization with comments | PUT | `/api/attendance/regularize/:id` | 200, admin comments saved | Admin JWT |
| ATT-051 | Clock in with biometric device ID | POST | `/api/attendance/clock-in` | 201, device_id saved | JWT |
| ATT-052 | Get attendance without tenant header | GET | `/api/attendance` | 400 Missing tenant | JWT, no tenant |
| ATT-053 | Rate limiting on clock-in | POST | `/api/attendance/clock-in` | 429 after threshold | JWT |
| ATT-054 | Regularization with attached proof/document | POST | `/api/attendance/regularize` | 201, attachment saved | Employee JWT |
| ATT-055 | Bulk attendance operations | GET | `/api/attendance?limit=100` | 200 with 100 records | Admin JWT |

---

**Total: 55 test cases**
