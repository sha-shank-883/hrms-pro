# Employees Module - Test Cases (`/api/employees`)

## Endpoints
- `GET /api/employees` - List (pagination, filters)
- `GET /api/employees/chat` - Employees for chat
- `GET /api/employees/org-chart` - Org chart
- `GET /api/employees/:id` - Get by ID
- `GET /api/employees/user/:userId` - Get by user ID
- `GET /api/employees/:id/qrcode` - Generate QR code
- `POST /api/employees` - Create (admin)
- `POST /api/employees/delete-by-email` - Delete by email (admin)
- `PUT /api/employees/:id` - Full update
- `PATCH /api/employees/:id` - Partial update
- `DELETE /api/employees/:id` - Delete (admin)

---

| # | Test Case | Method | Endpoint | Expected Result | Auth |
|---|---|---|---|---|---|
| EMP-001 | Get all employees with pagination | GET | `/api/employees?page=1&limit=10` | 200 OK, paginated list | Admin JWT |
| EMP-002 | Get all employees without auth | GET | `/api/employees` | 401 Unauthorized | None |
| EMP-003 | Get all employees as employee | GET | `/api/employees` | 403 Forbidden | Employee JWT |
| EMP-004 | Get all employees as manager | GET | `/api/employees` | 200 OK | Manager JWT |
| EMP-005 | Get employees filtered by department | GET | `/api/employees?department_id=1` | 200, filtered list | Admin JWT |
| EMP-006 | Get employees filtered by status | GET | `/api/employees?status=active` | 200, filtered list | Admin JWT |
| EMP-007 | Get employees with search query | GET | `/api/employees?search=john` | 200, matching list | Admin JWT |
| EMP-008 | Get employees pagination: page numbers correct | GET | `/api/employees?page=1&limit=5` | Total pages, current page in response | Admin JWT |
| EMP-009 | Get employees pagination: empty page | GET | `/api/employees?page=999&limit=10` | 200, empty data array | Admin JWT |
| EMP-010 | Get employees with sort params | GET | `/api/employees?sort=first_name&order=asc` | 200, sorted results | Admin JWT |
| EMP-011 | Get employee by valid ID | GET | `/api/employees/:id` | 200 OK, employee data | Admin JWT |
| EMP-012 | Get employee by non-existent ID | GET | `/api/employees/:id` | 404 Not Found | Admin JWT |
| EMP-013 | Get employee by ID as employee (own record) | GET | `/api/employees/:id` | 200 OK (own record) | Employee JWT |
| EMP-014 | Get employee by ID as employee (other record) | GET | `/api/employees/:id` | 403 Forbidden | Employee JWT |
| EMP-015 | Get employee by invalid ID | GET | `/api/employees/abc` | 400 or 404 | Admin JWT |
| EMP-016 | Get employee by user ID | GET | `/api/employees/user/:userId` | 200 OK | Admin JWT |
| EMP-017 | Get employee by non-existent user ID | GET | `/api/employees/user/:userId` | 404 Not Found | Admin JWT |
| EMP-018 | Get employee QR code | GET | `/api/employees/:id/qrcode` | 200 OK, QR image/data | Admin JWT |
| EMP-019 | Get employee QR code for non-existent employee | GET | `/api/employees/:id/qrcode` | 404 Not Found | Admin JWT |
| EMP-020 | Get org chart | GET | `/api/employees/org-chart` | 200 OK, hierarchy | Admin JWT |
| EMP-021 | Get org chart as employee | GET | `/api/employees/org-chart` | 403 Forbidden | Employee JWT |
| EMP-022 | Get employees for chat | GET | `/api/employees/chat` | 200 OK, employee list | JWT |
| EMP-023 | Get employees for chat with search | GET | `/api/employees/chat?search=john` | 200, filtered results | JWT |
| EMP-024 | Create employee with valid data | POST | `/api/employees` | 201 Created | Admin JWT |
| EMP-025 | Create employee with existing email | POST | `/api/employees` | 409 Conflict | Admin JWT |
| EMP-026 | Create employee as manager | POST | `/api/employees` | 403 Forbidden | Manager JWT |
| EMP-027 | Create employee without auth | POST | `/api/employees` | 401 Unauthorized | None |
| EMP-028 | Create employee with missing first_name | POST | `/api/employees` | 400 Validation error | Admin JWT |
| EMP-029 | Create employee with missing email | POST | `/api/employees` | 400 Validation error | Admin JWT |
| EMP-030 | Create employee with invalid email format | POST | `/api/employees` | 400 Validation error | Admin JWT |
| EMP-031 | Create employee with SQL injection | POST | `/api/employees` | 400 or stored safely | Admin JWT |
| EMP-032 | Create employee with XSS in name | POST | `/api/employees` | 201, stored as literal text | Admin JWT |
| EMP-033 | Create employee with all optional fields | POST | `/api/employees` | 201 Created | Admin JWT |
| EMP-034 | Create employee with photo upload | POST | `/api/employees` | 201 with photo_url | Admin JWT |
| EMP-035 | Update employee with valid data | PUT | `/api/employees/:id` | 200 OK | Admin JWT |
| EMP-036 | Update employee as employee (own record) | PUT | `/api/employees/:id` | 200 OK | Employee JWT |
| EMP-037 | Update employee as employee (other record) | PUT | `/api/employees/:id` | 403 Forbidden | Employee JWT |
| EMP-038 | Update employee with empty required field | PUT | `/api/employees/:id` | 400 Validation error | Admin JWT |
| EMP-039 | Update employee to existing email | PUT | `/api/employees/:id` | 409 Conflict | Admin JWT |
| EMP-040 | Partially update employee (PATCH) | PATCH | `/api/employees/:id` | 200 OK | Admin JWT |
| EMP-041 | Partially update with single field | PATCH | `/api/employees/:id` | 200, only that field changes | Admin JWT |
| EMP-042 | Delete employee as admin | DELETE | `/api/employees/:id` | 200 OK | Admin JWT |
| EMP-043 | Delete employee as manager | DELETE | `/api/employees/:id` | 403 Forbidden | Manager JWT |
| EMP-044 | Delete employee as employee | DELETE | `/api/employees/:id` | 403 Forbidden | Employee JWT |
| EMP-045 | Delete non-existent employee | DELETE | `/api/employees/:id` | 404 Not Found | Admin JWT |
| EMP-046 | Delete by email with valid email | POST | `/api/employees/delete-by-email` | 200 OK | Admin JWT |
| EMP-047 | Delete by email with non-existent email | POST | `/api/employees/delete-by-email` | 404 Not Found | Admin JWT |
| EMP-048 | Delete by email without email field | POST | `/api/employees/delete-by-email` | 400 Validation error | Admin JWT |
| EMP-049 | Employee response has all required fields | GET | `/api/employees/:id` | id, first_name, last_name, email, role, status | JWT |
| EMP-050 | Create employee with future hire_date | POST | `/api/employees` | 201 or 400 (depends on validation) | Admin JWT |
| EMP-051 | Create employee with very long name | POST | `/api/employees` | 400 (exceeds varchar limit) | Admin JWT |
| EMP-052 | Tenant isolation: different tenant employees isolated | GET | `/api/employees` | Only own tenant's employees | Cross-tenant |
| EMP-053 | Employee count in pagination matches total | GET | `/api/employees?page=1&limit=10` | total count matches DB | Admin JWT |
| EMP-054 | Update employee status to inactive | PUT | `/api/employees/:id` | 200, employee deactivated | Admin JWT |
| EMP-055 | Create employee then verify by user/:userId | POST + GET | `/api/employees` + `/user/:userId` | Consistent data | Admin JWT |

---

**Total: 55 test cases**
