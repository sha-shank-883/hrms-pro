# Employees Module — Deep API Test Cases (115 tests)

## 1.1 Create Employee — 18 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| E1 | Create with required fields | POST | `/api/employees` | `{ first_name, last_name, email, department_id, designation }` | 201 | Returns employee |
| E2 | Create with missing first_name | POST | `/api/employees` | No first_name | 400 | Validation error |
| E3 | Create with missing email | POST | `/api/employees` | No email | 400 | Email required |
| E4 | Create with duplicate email | POST | `/api/employees` | Same email as E1 | 409 | Duplicate email |
| E5 | Create with invalid email | POST | `/api/employees` | `email: "notanemail"` | 400 | Invalid email |
| E6 | Create with SQL injection in fields | POST | `/api/employees` | `first_name: "'; DROP TABLE employees; --"` | 201 | Sanitized |
| E7 | Create with XSS in first_name | POST | `/api/employees` | `first_name: "<script>alert(1)</script>"` | 201 | HTML-encoded |
| E8 | Create with all optional fields | POST | `/api/employees` | `{ first_name, last_name, email, phone, employee_code, pan, bank_account, uan, esic, date_of_birth, date_of_joining, gender, address, city, state, pincode, emergency_contact }` | 201 | All stored |
| E9 | Create with employee_code duplicate | POST | `/api/employees` | Same employee_code as E8 | 409 | Duplicate code |
| E10 | Create as employee (unauthorized) | POST | `/api/employees` | Employee token | 403 | Forbidden |
| E11 | Create without auth | POST | `/api/employees` | No token | 401 | Unauthorized |
| E12 | Create with empty body | POST | `/api/employees` | `{}` | 400 | Validation errors |
| E13 | Create with negative department_id | POST | `/api/employees` | `department_id: -1` | 400 | Invalid dept |
| E14 | Create with non-existent department_id | POST | `/api/employees` | `department_id: 99999` | 400 | FK violation |
| E15 | Create with very long first_name (100+) | POST | `/api/employees` | `first_name: "A".repeat(200)` | 400 | Length limit |
| E16 | Create with phone number validation | POST | `/api/employees` | `phone: "abc"` | 400 | Invalid phone |
| E17 | Create with Unicode name | POST | `/api/employees` | `first_name: "José"` | 201 | Unicode accepted |
| E18 | Create with gender validation | POST | `/api/employees` | `gender: "X"` | 400 | Invalid gender |

## 1.2 List Employees — 18 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| E19 | List all employees | GET | `/api/employees` | Valid auth | 200 | Returns array |
| E20 | List with pagination | GET | `/api/employees?page=1&limit=20` | Valid auth | 200 | `data`, `total`, `page`, `limit` |
| E21 | List with search (name) | GET | `/api/employees?search=John` | Valid auth | 200 | Filtered |
| E22 | List with search (email) | GET | `/api/employees?search=john@example.com` | Valid auth | 200 | Filtered by email |
| E23 | List with department filter | GET | `/api/employees?department_id=1` | Valid auth | 200 | Only that dept |
| E24 | List with status filter (active) | GET | `/api/employees?status=active` | Valid auth | 200 | Active only |
| E25 | List with status filter (inactive) | GET | `/api/employees?status=inactive` | Valid auth | 200 | Inactive only |
| E26 | List sorted by name | GET | `/api/employees?sort=first_name&order=asc` | Valid auth | 200 | Alpha sorted |
| E27 | List sorted by date_of_joining | GET | `/api/employees?sort=date_of_joining&order=desc` | Valid auth | 200 | Sorted by join date |
| E28 | List with empty result | GET | `/api/employees?search=__nonexistent__` | Valid auth | 200 | Empty array |
| E29 | List cross-tenant isolation | GET | `/api/employees` | Tenant A → Tenant B header | 403 | Blocked |
| E30 | List without auth | GET | `/api/employees` | No token | 401 | Unauthorized |
| E31 | List with employee_code filter | GET | `/api/employees?employee_code=EMP001` | Valid auth | 200 | Filtered |
| E32 | List with date range filter | GET | `/api/employees?joined_after=2024-01-01&joined_before=2024-12-31` | Valid auth | 200 | Within range |
| E33 | List with multiple filters combined | GET | `/api/employees?department_id=1&status=active&search=John` | Valid auth | 200 | Combined |
| E34 | List page beyond total | GET | `/api/employees?page=999` | Valid auth | 200 | Empty array |
| E35 | List with limit=0 | GET | `/api/employees?limit=0` | Valid auth | 400 | Invalid limit |
| E36 | List with includes manager info | GET | `/api/employees?include=manager` | Valid auth | 200 | Manager details |

## 1.3 Get Single Employee — 10 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| E37 | Get by ID | GET | `/api/employees/:id` | Valid auth | 200 | Employee object |
| E38 | Get by non-existent ID | GET | `/api/employees/:id` | `id: 99999` | 404 | Not found |
| E39 | Get by invalid ID format | GET | `/api/employees/:id` | `id: "abc"` | 400 | Invalid ID |
| E40 | Get without auth | GET | `/api/employees/:id` | No token | 401 | Unauthorized |
| E41 | Get cross-tenant employee | GET | `/api/employees/:id` | Tenant A, ID from Tenant B | 404 | Isolated |
| E42 | Get includes department info | GET | `/api/employees/:id` | Valid auth | 200 | `department_name` |
| E43 | Get includes payroll fields | GET | `/api/employees/:id` | Valid auth | 200 | `employee_code`, `pan`, `bank_account` |
| E44 | Get self (same user) | GET | `/api/employees/:id` | Employee viewing own profile | 200 | Access granted |
| E45 | Get other employee as peer | GET | `/api/employees/:id` | Employee viewing another | 200 | Limited fields |
| E46 | Get by employee_code | GET | `/api/employees/code/EMP001` | Valid auth | 200 | Found by code |

## 1.4 Update Employee — 15 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| E47 | Update name | PUT | `/api/employees/:id` | `{ first_name: "Updated" }` | 200 | Name updated |
| E48 | Update department | PUT | `/api/employees/:id` | `{ department_id: 2 }` | 200 | Dept changed |
| E49 | Update status to inactive | PUT | `/api/employees/:id` | `{ status: "inactive" }` | 200 | Deactivated |
| E50 | Update to duplicate email | PUT | `/api/employees/:id` | Email of another employee | 409 | Duplicate |
| E51 | Update to empty first_name | PUT | `/api/employees/:id` | `{ first_name: "" }` | 400 | Validation error |
| E52 | Update payroll fields | PUT | `/api/employees/:id` | `{ pan: "ABCDE1234F", bank_account: "1234567890", uan: "UAN1234567890", esic: "ESIC123456" }` | 200 | Payroll fields updated |
| E53 | Update with SQL injection | PUT | `/api/employees/:id` | `{ first_name: "'; UPDATE employees SET salary=999999; --" }` | 200 | Sanitized |
| E54 | Update with XSS | PUT | `/api/employees/:id` | `{ first_name: "<img src=x onerror=alert(1)>" }` | 200 | HTML-encoded |
| E55 | Update non-existent | PUT | `/api/employees/:id` | `id: 99999` | 404 | Not found |
| E56 | Update without auth | PUT | `/api/employees/:id` | No token | 401 | Unauthorized |
| E57 | Update as employee (self) | PUT | `/api/employees/:id` | Employee editing own limited fields | 200 | Limited update |
| E58 | Update as employee (other) | PUT | `/api/employees/:id` | Employee editing another | 403 | Forbidden |
| E59 | Update with empty body | PUT | `/api/employees/:id` | `{}` | 200 | No changes |
| E60 | Update cross-tenant | PUT | `/api/employees/:id` | Tenant A, ID from Tenant B | 404 | Blocked |
| E61 | Update with invalid phone | PUT | `/api/employees/:id` | `{ phone: "notaphone" }` | 400 | Invalid phone |

## 1.5 Delete Employee — 10 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| E62 | Delete employee | DELETE | `/api/employees/:id` | Admin token | 200 | Soft/hard deleted |
| E63 | Delete non-existent | DELETE | `/api/employees/:id` | `id: 99999` | 404 | Not found |
| E64 | Delete without auth | DELETE | `/api/employees/:id` | No token | 401 | Unauthorized |
| E65 | Delete as employee | DELETE | `/api/employees/:id` | Employee token | 403 | Forbidden |
| E66 | Delete as manager (subordinate) | DELETE | `/api/employees/:id` | Manager token | 403 | Can't delete |
| E67 | Delete cross-tenant | DELETE | `/api/employees/:id` | Tenant A, ID from Tenant B | 404 | Blocked |
| E68 | Delete with invalid ID | DELETE | `/api/employees/:id` | `id: "abc"` | 400 | Invalid |
| E69 | Delete then recreate | DELETE → POST | Same email | After delete | 201 | Can recreate |
| E70 | Delete employee with active records | DELETE | `/api/employees/:id` | Has tasks, attendance, leaves | 409 | FK constraint |
| E71 | Delete by email endpoint | DELETE | `/api/employees/by-email/:email` | Admin token | 200 | Deleted by email |

## 1.6 Org Chart — 8 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| E72 | Get org chart | GET | `/api/employees/org-chart` | Valid auth | 200 | Hierarchical structure |
| E73 | Get org chart as employee | GET | `/api/employees/org-chart` | Employee token | 200 | Can view |
| E74 | Get org chart without auth | GET | `/api/employees/org-chart` | No token | 401 | Unauthorized |
| E75 | Org chart root node | GET | `/api/employees/org-chart` | Valid auth | 200 | Has top-level managers |
| E76 | Org chart includes reporting structure | GET | `/api/employees/org-chart` | Valid auth | 200 | `children` or `reports` |
| E77 | Org chart with circular reference | GET | `/api/employees/org-chart` | If manager_id loop exists | 200 | Handles gracefully |
| E78 | Org chart single employee | GET | `/api/employees/org-chart` | No managers | 200 | Single node |
| E79 | Org chart cross-tenant | GET | `/api/employees/org-chart` | Tenant → wrong header | 403 | Blocked |

## 1.7 Chat Listing — 5 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| E80 | Get chat listing | GET | `/api/employees/chat-listing` | Valid auth | 200 | Array of employees |
| E81 | Get chat listing without auth | GET | `/api/employees/chat-listing` | No token | 401 | Unauthorized |
| E82 | Chat listing includes online status | GET | `/api/employees/chat-listing` | Valid auth | 200 | `is_online` field |
| E83 | Chat listing pagination | GET | `/api/employees/chat-listing?page=1&limit=50` | Valid auth | 200 | Paginated |
| E84 | Chat listing excludes self | GET | `/api/employees/chat-listing` | Valid auth | 200 | Self not included |

## 1.8 QR Code — 5 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| E85 | Get QR code for employee | GET | `/api/employees/:id/qr` | Valid auth | 200 | QR image (PNG/SVG) |
| E86 | Get QR for non-existent | GET | `/api/employees/:id/qr` | `id: 99999` | 404 | Not found |
| E87 | Get QR without auth | GET | `/api/employees/:id/qr` | No token | 401 | Unauthorized |
| E88 | QR code return format | GET | `/api/employees/:id/qr` | Valid auth | 200 | Content-Type image |
| E89 | QR code cross-tenant | GET | `/api/employees/:id/qr` | Tenant A, ID from Tenant B | 404 | Blocked |

## 1.9 Authorization & Security — 15 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| E90 | Admin full CRUD | ALL | All endpoints | Admin token | 200/201 | Full access |
| E91 | Manager can CRUD subordinates | ALL | `/api/employees` | Manager token | 200 | Limited |
| E92 | Employee read own profile | GET | `/api/employees/:id` | Employee, own ID | 200 | Can read |
| E93 | Employee cannot read sensitive fields of others | GET | `/api/employees/:id` | Employee, other ID | 200 | Limited fields |
| E94 | Employee cannot create | POST | `/api/employees` | Employee token | 403 | Forbidden |
| E95 | Employee cannot delete | DELETE | `/api/employees/:id` | Employee token | 403 | Forbidden |
| E96 | Mass assignment protection | PUT | `/api/employees/:id` | `{ id: 999, role: "super-admin" }` | 200 | Protected |
| E97 | Cross-tenant data isolation | GET | `/api/employees` | Tenant A, Tenant B header | 403 | Blocked |
| E98 | SQL injection in list params | GET | `/api/employees?search=' UNION SELECT * FROM users--` | Valid token | 200 | Sanitized |
| E99 | SQL injection in department_id | GET | `/api/employees?department_id=1 OR 1=1` | Valid token | 200 | Sanitized |
| E100 | Rate limiting | GET | `/api/employees` x 1000 | Valid token | 429 | Rate limited |
| E101 | Concurrent update on same employee | PUT x2 | Same ID, different fields | Both at once | 200 | No corruption |
| E102 | Exposed password_hash | GET | `/api/employees/:id` | Valid auth | 200 | No password_hash |
| E103 | Exposed reset_token | GET | `/api/employees/:id` | Valid auth | 200 | No reset_token |
| E104 | Exposed JWT secret | GET | `/api/employees/:id` | Valid auth | 200 | No secret |

## 1.10 Edge Cases — 11 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| E105 | 1000 employees then list | POST x1000 → GET | Bulk create | Unique data | 201, 200 | All returned paginated |
| E106 | Employee with no department | POST | `/api/employees` | No department_id | 201 | Null dept allowed |
| E107 | Employee with same name (John Smith x2) | POST x2 | Same name, diff email | Two employees | 201 both | Same name OK |
| E108 | Phone number formatting | PUT | `/api/employees/:id` | `phone: "+1 (555) 123-4567"` | 200 | Formats accepted |
| E109 | Date of birth validation (future) | POST | `/api/employees` | `date_of_birth: "2099-01-01"` | 400 | Future not allowed |
| E110 | Date of joining validation (future) | POST | `/api/employees` | `date_of_joining: "2099-01-01"` | 200 | Future OK? |
| E111 | Unicode address | POST | `/api/employees` | `address: "123 Main St, 北京, China"` | 201 | Unicode stored |
| E112 | Email with + alias | POST | `/api/employees` | `email: "test+alias@example.com"` | 201 | + alias accepted |
| E113 | Employee status toggle (active→inactive→active) | PUT x2 | Toggle status | Both transitions | 200 | Works both ways |
| E114 | Bulk import from array | POST | `/api/employees/bulk` | `{ employees: [...] }` | 201 | Bulk created |
| E115 | Bulk import with some invalid | POST | `/api/employees/bulk` | Mixed valid/invalid | 207 | Partial success |

Total: 18 + 18 + 10 + 15 + 10 + 8 + 5 + 5 + 15 + 11 = **115 tests**
