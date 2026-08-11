# Departments Module - Test Cases (`/api/departments`)

## Endpoints
- `GET /api/departments` - List all
- `GET /api/departments/:id` - Get by ID
- `POST /api/departments` - Create (admin/manager)
- `PUT /api/departments/:id` - Update (admin/manager)
- `DELETE /api/departments/:id` - Delete (admin only)

---

| # | Test Case | Method | Endpoint | Expected Result | Auth |
|---|---|---|---|---|---|
| DEP-001 | Get all departments (admin) | GET | `/api/departments` | 200 OK, returns array | Admin JWT |
| DEP-002 | Get all departments (employee) | GET | `/api/departments` | 200 OK, returns array | Employee JWT |
| DEP-003 | Get all departments without auth | GET | `/api/departments` | 401 Unauthorized | None |
| DEP-004 | Get department by valid ID | GET | `/api/departments/:id` | 200 OK, single department | JWT |
| DEP-005 | Get department by non-existent ID | GET | `/api/departments/:id` | 404 Not Found | JWT |
| DEP-006 | Get department by invalid ID (string) | GET | `/api/departments/abc` | 400 or 404 | JWT |
| DEP-007 | Get department by ID with SQL injection | GET | `/api/departments/1 OR 1=1` | 400 or returns single (no injection) | JWT |
| DEP-008 | Get department response has required fields | GET | `/api/departments/:id` | id, department_name in response | JWT |
| DEP-009 | Create department with valid data (admin) | POST | `/api/departments` | 201 Created | Admin JWT |
| DEP-010 | Create department with empty name | POST | `/api/departments` | 400 Validation error | Admin JWT |
| DEP-011 | Create department with duplicate name | POST | `/api/departments` | 409 Conflict | Admin JWT |
| DEP-012 | Create department as employee | POST | `/api/departments` | 403 Forbidden | Employee JWT |
| DEP-013 | Create department without auth | POST | `/api/departments` | 401 Unauthorized | None |
| DEP-014 | Create department with SQL injection in name | POST | `/api/departments` | 400 or stored safely | Admin JWT |
| DEP-015 | Create department with XSS in name | POST | `/api/departments` | 201, stored as literal text | Admin JWT |
| DEP-016 | Create department with budget field | POST | `/api/departments` | 201, budget saved | Admin JWT |
| DEP-017 | Create department with very long name (255+ chars) | POST | `/api/departments` | 400 Validation error | Admin JWT |
| DEP-018 | Create department with special characters | POST | `/api/departments` | 201 Created | Admin JWT |
| DEP-019 | Update department with valid data (admin) | PUT | `/api/departments/:id` | 200 OK | Admin JWT |
| DEP-020 | Update department with empty name | PUT | `/api/departments/:id` | 400 Validation error | Admin JWT |
| DEP-021 | Update department as employee | PUT | `/api/departments/:id` | 403 Forbidden | Employee JWT |
| DEP-022 | Update department without auth | PUT | `/api/departments/:id` | 401 Unauthorized | None |
| DEP-023 | Update non-existent department | PUT | `/api/departments/:id` | 404 Not Found | Admin JWT |
| DEP-024 | Update department name to duplicate | PUT | `/api/departments/:id` | 409 Conflict | Admin JWT |
| DEP-025 | Update department budget field | PUT | `/api/departments/:id` | 200 OK, budget updated | Admin JWT |
| DEP-026 | Update department as manager | PUT | `/api/departments/:id` | 200 OK | Manager JWT |
| DEP-027 | Delete department as admin | DELETE | `/api/departments/:id` | 200 OK (soft/hard delete) | Admin JWT |
| DEP-028 | Delete department as employee | DELETE | `/api/departments/:id` | 403 Forbidden | Employee JWT |
| DEP-029 | Delete department as manager | DELETE | `/api/departments/:id` | 403 Forbidden | Manager JWT |
| DEP-030 | Delete department without auth | DELETE | `/api/departments/:id` | 401 Unauthorized | None |
| DEP-031 | Delete non-existent department | DELETE | `/api/departments/:id` | 404 Not Found | Admin JWT |
| DEP-032 | Delete department with employees assigned | DELETE | `/api/departments/:id` | 409 Conflict or 200 with null dept | Admin JWT |
| DEP-033 | Pagination: GET with page & limit params | GET | `/api/departments?page=1&limit=10` | 200 with pagination | JWT |
| DEP-034 | Pagination: GET with invalid page | GET | `/api/departments?page=-1` | 400 or returns first page | JWT |
| DEP-035 | Sorting: GET with sort param | GET | `/api/departments?sort=name&order=asc` | 200, sorted results | JWT |
| DEP-036 | Create department then GET confirms creation | POST then GET | `/api/departments` | Department appears in list | Admin JWT |
| DEP-037 | Update department then GET by ID confirms update | PUT then GET | `/api/departments/:id` | Updated name reflected | Admin JWT |
| DEP-038 | Delete department then GET returns 404 | DELETE then GET | `/api/departments/:id` | 404 Not Found | Admin JWT |
| DEP-039 | Tenant isolation: Tenant A's depts not visible to Tenant B | GET | `/api/departments` | Only tenant's own departments | Cross-tenant |
| DEP-040 | Create with missing tenant header | POST | `/api/departments` | 400 Missing tenant | Admin, no tenant |
| DEP-041 | Response format has success, data fields | GET | `/api/departments` | `{ success: true, data: [...] }` | JWT |
| DEP-042 | Error format has success, message fields | GET | `/api/departments/99999` | `{ success: false, message: "..." }` | JWT |
| DEP-043 | Idempotent: GET multiple times returns same structure | GET | `/api/departments` | Consistent response format | JWT |
| DEP-044 | Filter: GET with search query | GET | `/api/departments?search=eng` | Filtered results | JWT |
| DEP-045 | Rate limiting applies | GET | `/api/departments` | 429 after threshold | JWT |
| DEP-046 | Department list includes employee_count field | GET | `/api/departments` | employee_count present | JWT |
| DEP-047 | Create department: manager optional field | POST | `/api/departments` | 201, manager_id can be null | Admin JWT |
| DEP-048 | Update department: clear budget field | PUT | `/api/departments/:id` | 200, budget becomes null | Admin JWT |
| DEP-049 | Create department with numeric name | POST | `/api/departments` | 400 or 201 (depends on validation) | Admin JWT |
| DEP-050 | Multiple deletes on same ID (idempotent) | DELETE | `/api/departments/:id` | First 200, second 404 (already deleted) | Admin JWT |
| DEP-051 | Update department with only description, no name | PUT | `/api/departments/:id` | 200 OK (partial update) | Admin JWT |
| DEP-052 | Create department with description field | POST | `/api/departments` | 201, description saved | Admin JWT |
| DEP-053 | Get department with invalid ID format | GET | `/api/departments/1.5` | 400 or 404 | JWT |
| DEP-054 | Large payload: create with 10KB description | POST | `/api/departments` | 201 or 413 | Admin JWT |
| DEP-055 | Auth: employee with departments:read permission | GET | `/api/departments` | 200 OK | Permission JWT |

---

**Total: 55 test cases**
