# Payroll Module - Test Cases (`/api/payroll`)

## Endpoints
- `GET /api/payroll` - List records
- `GET /api/payroll/statistics` - Statistics
- `GET /api/payroll/:id` - Get by ID
- `GET /api/payroll/:id/payslip` - Get payslip
- `GET /api/payroll/my-payslips` - Employee's payslips
- `POST /api/payroll` - Create (admin/manager)
- `PUT /api/payroll/:id` - Update (admin/manager)
- `PUT /api/payroll/:id/process` - Process payment (admin/manager)
- `DELETE /api/payroll/:id` - Delete (admin)
- `POST /api/payroll/generate` - Auto-generate (admin/manager)
- `POST /api/payroll/generate-bulk` - Bulk generate (admin/manager)
- `POST /api/payroll/tax-declarations` - Submit tax declaration
- `GET /api/payroll/tax-declarations` - List tax declarations
- `PUT /api/payroll/tax-declarations/:id` - Update tax declaration status

---

| # | Test Case | Method | Endpoint | Expected Result | Auth |
|---|---|---|---|---|---|
| PAY-001 | Get payroll records (admin) | GET | `/api/payroll` | 200 OK, records array | Admin JWT |
| PAY-002 | Get payroll records (employee) | GET | `/api/payroll` | 200 OK, own records | Employee JWT |
| PAY-003 | Get payroll without auth | GET | `/api/payroll` | 401 Unauthorized | None |
| PAY-004 | Get payroll filtered by month/year | GET | `/api/payroll?month=3&year=2026` | 200, filtered | JWT |
| PAY-005 | Get payroll filtered by employee | GET | `/api/payroll?employee_id=1` | 200, filtered (admin) | Admin JWT |
| PAY-006 | Get payroll filtered by status | GET | `/api/payroll?payment_status=paid` | 200, filtered | JWT |
| PAY-007 | Get payroll with pagination | GET | `/api/payroll?page=1&limit=10` | 200 with pagination | JWT |
| PAY-008 | Get payroll statistics | GET | `/api/payroll/statistics` | 200 OK, stats object | JWT |
| PAY-009 | Get payroll statistics (employee) | GET | `/api/payroll/statistics` | 200 OK, own stats | Employee JWT |
| PAY-010 | Get payroll by ID | GET | `/api/payroll/:id` | 200 OK, single record | JWT |
| PAY-011 | Get payroll by non-existent ID | GET | `/api/payroll/:id` | 404 Not Found | JWT |
| PAY-012 | Get payslip | GET | `/api/payroll/:id/payslip` | 200 OK, payslip data | JWT |
| PAY-013 | Get payslip for non-existent record | GET | `/api/payroll/:id/payslip` | 404 Not Found | JWT |
| PAY-014 | Get my payslips (employee) | GET | `/api/payroll/my-payslips` | 200 OK, own payslips | Employee JWT |
| PAY-015 | Get my payslips (admin) | GET | `/api/payroll/my-payslips` | 200 OK (if linked) | Admin JWT |
| PAY-016 | Get my payslips without auth | GET | `/api/payroll/my-payslips` | 401 Unauthorized | None |
| PAY-017 | Create payroll record with valid data | POST | `/api/payroll` | 201 Created | Admin JWT |
| PAY-018 | Create payroll as employee | POST | `/api/payroll` | 403 Forbidden | Employee JWT |
| PAY-019 | Create payroll with missing employee_id | POST | `/api/payroll` | 400 Validation error | Admin JWT |
| PAY-020 | Create payroll with missing basic_salary | POST | `/api/payroll` | 400 Validation error | Admin JWT |
| PAY-021 | Create payroll with zero basic_salary | POST | `/api/payroll` | 400 or 201 (depends) | Admin JWT |
| PAY-022 | Create duplicate payroll (same emp + month/year) | POST | `/api/payroll` | 409 Conflict | Admin JWT |
| PAY-023 | Update payroll record | PUT | `/api/payroll/:id` | 200 OK | Admin JWT |
| PAY-024 | Update already processed payroll | PUT | `/api/payroll/:id` | 400 Cannot modify paid | Admin JWT |
| PAY-025 | Update non-existent payroll | PUT | `/api/payroll/:id` | 404 Not Found | Admin JWT |
| PAY-026 | Process payment | PUT | `/api/payroll/:id/process` | 200 OK, status=paid | Admin JWT |
| PAY-027 | Process payment as employee | PUT | `/api/payroll/:id/process` | 403 Forbidden | Employee JWT |
| PAY-028 | Process non-existent payment | PUT | `/api/payroll/:id/process` | 404 Not Found | Admin JWT |
| PAY-029 | Process already-paid payroll | PUT | `/api/payroll/:id/process` | 400 Already processed | Admin JWT |
| PAY-030 | Process payment with different methods | PUT | `/api/payroll/:id/process` | 200 for bank_transfer, cash, check | Admin JWT |
| PAY-031 | Delete payroll record | DELETE | `/api/payroll/:id` | 200 OK | Admin JWT |
| PAY-032 | Delete payroll as manager | DELETE | `/api/payroll/:id` | 403 Forbidden | Manager JWT |
| PAY-033 | Delete non-existent payroll | DELETE | `/api/payroll/:id` | 404 Not Found | Admin JWT |
| PAY-034 | Auto-generate payroll for employee | POST | `/api/payroll/generate` | 201 Created | Admin JWT |
| PAY-035 | Auto-generate with missing employee_id | POST | `/api/payroll/generate` | 400 Validation error | Admin JWT |
| PAY-036 | Auto-generate for non-existent employee | POST | `/api/payroll/generate` | 404 Not Found | Admin JWT |
| PAY-037 | Auto-generate duplicate (exists) | POST | `/api/payroll/generate` | 409 Conflict | Admin JWT |
| PAY-038 | Bulk generate payroll | POST | `/api/payroll/generate-bulk` | 200 OK, summary | Admin JWT |
| PAY-039 | Bulk generate as employee | POST | `/api/payroll/generate-bulk` | 403 Forbidden | Employee JWT |
| PAY-040 | Bulk generate with missing month/year | POST | `/api/payroll/generate-bulk` | 400 Validation error | Admin JWT |
| PAY-041 | Submit tax declaration | POST | `/api/payroll/tax-declarations` | 201 Created | JWT |
| PAY-042 | Submit tax declaration (employee) | POST | `/api/payroll/tax-declarations` | 201, own declaration | Employee JWT |
| PAY-043 | Submit tax declaration with missing data | POST | `/api/payroll/tax-declarations` | 400 Validation error | JWT |
| PAY-044 | Submit duplicate tax declaration (same year) | POST | `/api/payroll/tax-declarations` | 409 Conflict | JWT |
| PAY-045 | Get tax declarations | GET | `/api/payroll/tax-declarations` | 200 OK | JWT |
| PAY-046 | Get tax declarations (employee sees own) | GET | `/api/payroll/tax-declarations` | 200, own only | Employee JWT |
| PAY-047 | Approve tax declaration | PUT | `/api/payroll/tax-declarations/:id` | 200 OK | Admin JWT |
| PAY-048 | Reject tax declaration | PUT | `/api/payroll/tax-declarations/:id` | 200 OK | Admin JWT |
| PAY-049 | Approve tax declaration as employee | PUT | `/api/payroll/tax-declarations/:id` | 403 Forbidden | Employee JWT |
| PAY-050 | Update non-existent tax declaration | PUT | `/api/payroll/tax-declarations/:id` | 404 Not Found | Admin JWT |
| PAY-051 | Payroll statistics include pending, paid totals | GET | `/api/payroll/statistics` | Status breakdown present | JWT |
| PAY-052 | Tenant isolation: payroll isolated | GET | `/api/payroll` | Only own tenant | Cross-tenant |
| PAY-053 | Payslip includes all salary components | GET | `/api/payroll/:id/payslip` | basic, allowances, deductions, tax, net | JWT |
| PAY-054 | Create with SQL injection in notes | POST | `/api/payroll` | 201/400, parameterized | Admin JWT |
| PAY-055 | Response format: standard envelope | GET | `/api/payroll` | `{ success, data }` or `{ success, data, pagination }` | JWT |

---

**Total: 55 test cases**
