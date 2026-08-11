# Shifts Module - Test Cases (`/api/shifts`)

| # | Test Case | Method | Endpoint | Expected Result | Auth |
|---|---|---|---|---|---|
| SHF-001 | Get all shifts | GET | `/api/shifts` | 200 OK, shift array | JWT |
| SHF-002 | Get shifts without auth | GET | `/api/shifts` | 401 Unauthorized | None |
| SHF-003 | Get shifts (employee view) | GET | `/api/shifts` | 200 OK | Employee JWT |
| SHF-004 | Create shift (admin) | POST | `/api/shifts` | 201 Created | Admin JWT |
| SHF-005 | Create shift as employee | POST | `/api/shifts` | 403 Forbidden | Employee JWT |
| SHF-006 | Create shift without auth | POST | `/api/shifts` | 401 Unauthorized | None |
| SHF-007 | Create shift with name | POST | `/api/shifts` | 201 | Admin JWT |
| SHF-008 | Create shift with start/end time | POST | `/api/shifts` | 201, times saved | Admin JWT |
| SHF-009 | Create shift with missing name | POST | `/api/shifts` | 400 Validation error | Admin JWT |
| SHF-010 | Create shift where end < start | POST | `/api/shifts` | 400 Invalid time range | Admin JWT |
| SHF-011 | Create night shift (end next day) | POST | `/api/shifts` | 201 | Admin JWT |
| SHF-012 | Create shift with break time | POST | `/api/shifts` | 201, break saved | Admin JWT |
| SHF-013 | Create shift with description | POST | `/api/shifts` | 201 | Admin JWT |
| SHF-014 | Update shift | PUT | `/api/shifts/:id` | 200 OK | Admin JWT |
| SHF-015 | Update shift as employee | PUT | `/api/shifts/:id` | 403 Forbidden | Employee JWT |
| SHF-016 | Update non-existent shift | PUT | `/api/shifts/:id` | 404 Not Found | Admin JWT |
| SHF-017 | Update shift times | PUT | `/api/shifts/:id` | 200, times updated | Admin JWT |
| SHF-018 | Delete shift | DELETE | `/api/shifts/:id` | 200 OK | Admin JWT |
| SHF-019 | Delete shift as manager | DELETE | `/api/shifts/:id` | 403 Forbidden | Manager JWT |
| SHF-020 | Delete shift assigned to employees | DELETE | `/api/shifts/:id` | 409 Conflict or cascaded | Admin JWT |
| SHF-021 | Delete non-existent shift | DELETE | `/api/shifts/:id` | 404 Not Found | Admin JWT |
| SHF-022 | Get shift assignments | GET | `/api/shifts/assignments` | 200 OK, assignments array | JWT |
| SHF-023 | Get assignments without auth | GET | `/api/shifts/assignments` | 401 Unauthorized | None |
| SHF-024 | Assign shift to employee | POST | `/api/shifts/assign` | 200 OK | Admin JWT |
| SHF-025 | Assign shift without auth | POST | `/api/shifts/assign` | 401 Unauthorized | None |
| SHF-026 | Assign shift as employee | POST | `/api/shifts/assign` | 403 Forbidden | Employee JWT |
| SHF-027 | Assign shift to non-existent employee | POST | `/api/shifts/assign` | 404 Not Found | Admin JWT |
| SHF-028 | Assign non-existent shift | POST | `/api/shifts/assign` | 404 Not Found | Admin JWT |
| SHF-029 | Assign shift with effective dates | POST | `/api/shifts/assign` | 200, dates saved | Admin JWT |
| SHF-030 | Assign same shift twice to same employee | POST | `/api/shifts/assign` | 409 Conflict | Admin JWT |
| SHF-031 | Delete shift assignment | DELETE | `/api/shifts/assignments/:id` | 200 OK | Admin JWT |
| SHF-032 | Delete non-existent assignment | DELETE | `/api/shifts/assignments/:id` | 404 Not Found | Admin JWT |
| SHF-033 | Delete assignment as employee | DELETE | `/api/shifts/assignments/:id` | 403 Forbidden | Employee JWT |
| SHF-034 | Assign then GET assignments | POST + GET | workflow | Assignment in list | Admin JWT |
| SHF-035 | Delete assignment then GET | DELETE + GET | workflow | Removed from list | Admin JWT |
| SHF-036 | Create shift as manager | POST | `/api/shifts` | 201 Created | Manager JWT |
| SHF-037 | Update shift as manager | PUT | `/api/shifts/:id` | 200 OK | Manager JWT |
| SHF-038 | Assign shift as manager | POST | `/api/shifts/assign` | 200 OK | Manager JWT |
| SHF-039 | Shift response includes employee count | GET | `/api/shifts` | employee_count field | JWT |
| SHF-040 | Assignment specifies weekdays | POST | `/api/shifts/assign` | 201, weekdays saved | Admin JWT |
| SHF-041 | Create shift with multiple time slots | POST | `/api/shifts` | 201 | Admin JWT |
| SHF-042 | Tenant isolation | GET | `/api/shifts` | Only own tenant | Cross-tenant |
| SHF-043 | SQL injection in shift name | POST | `/api/shifts` | 201, parameterized | Admin JWT |
| SHF-044 | XSS in shift name | POST | `/api/shifts` | 201, stored as literal | Admin JWT |
| SHF-045 | Pagination on shifts | GET | `/api/shifts?page=1&limit=10` | 200 with pagination | JWT |
| SHF-046 | Create then GET confirms | POST + GET | workflow | New shift visible | Admin JWT |
| SHF-047 | Update then GET confirms | PUT + GET | workflow | Changes reflected | Admin JWT |
| SHF-048 | Delete then GET returns 404 | DELETE + GET | workflow | 404 Not Found | Admin JWT |
| SHF-049 | Assign with overlapping dates (same employee) | POST | `/api/shifts/assign` | 409 Overlap conflict | Admin JWT |
| SHF-050 | Get shifts sorted by name | GET | `/api/shifts?sort=name&order=asc` | 200, sorted | JWT |
| SHF-051 | Shift time format validation (HH:MM) | POST | `/api/shifts` | Invalid format = 400 | Admin JWT |
| SHF-052 | Rate limiting on shift operations | POST | `/api/shifts` | 429 after threshold | Admin JWT |
| SHF-053 | Shift assignment with end_date before start_date | POST | `/api/shifts/assign` | 400 Validation error | Admin JWT |
| SHF-054 | Response format: success + data | GET | `/api/shifts` | `{ success, data }` | JWT |
| SHF-055 | Create shift with grace period | POST | `/api/shifts` | 201, grace period saved | Admin JWT |

---

**Total: 55 test cases**
