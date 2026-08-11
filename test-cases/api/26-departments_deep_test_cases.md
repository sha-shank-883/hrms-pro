# Departments Module — Deep API Test Cases (105 tests)

## 1.1 Create Department — 15 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| D1 | Create with valid name + budget | POST | `/api/departments` | `{ name: "Engineering", budget: 500000 }` | 201 | Returns department object |
| D2 | Create with empty name | POST | `/api/departments` | `{ name: "" }` | 400 | Validation error |
| D3 | Create with missing name | POST | `/api/departments` | `{ budget: 100000 }` | 400 | Name required |
| D4 | Create with duplicate name | POST | `/api/departments` | Same name as D1 | 409 | Duplicate error |
| D5 | Create with zero budget | POST | `/api/departments` | `{ name: "Zero Budget", budget: 0 }` | 201 | Budget defaults or zero allowed |
| D6 | Create with negative budget | POST | `/api/departments` | `{ name: "Negative", budget: -5000 }` | 400 | Negative not allowed |
| D7 | Create with very long name (100+) | POST | `/api/departments` | `{ name: "A".repeat(150) }` | 400 | Length validation |
| D8 | Create with special chars in name | POST | `/api/departments` | `{ name: "R&D (Engineering) - Level 1" }` | 201 | Special chars accepted |
| D9 | Create with SQL injection in name | POST | `/api/departments` | `{ name: "'; DROP TABLE departments; --" }` | 201 | Sanitized, created safely |
| D10 | Create with XSS in name | POST | `/api/departments` | `{ name: "<script>alert('xss')</script>" }` | 201 | Stored HTML-encoded |
| D11 | Create with non-integer budget | POST | `/api/departments` | `{ name: "Test", budget: "abc" }` | 400 | Budget must be number |
| D12 | Create as employee | POST | `/api/departments` | Employee token | 403 | Forbidden |
| D13 | Create without auth | POST | `/api/departments` | No token | 401 | Unauthorized |
| D14 | Create with large budget (>1 billion) | POST | `/api/departments` | `{ name: "Large", budget: 9999999999 }` | 201 | Accepts large number |
| D15 | Create with decimal budget | POST | `/api/departments` | `{ name: "Decimal", budget: 50000.50 }` | 201 | Accepts decimal |

## 1.2 List Departments — 15 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| D16 | List all departments | GET | `/api/departments` | Valid auth | 200 | Returns array |
| D17 | List returns pagination | GET | `/api/departments?page=1&limit=10` | Valid auth | 200 | `data`, `total`, `page`, `limit` |
| D18 | List with empty results | GET | `/api/departments` | Fresh tenant | 200 | Empty array `[]` |
| D19 | List with search filter | GET | `/api/departments?search=Engineering` | Valid auth | 200 | Filtered results |
| D20 | List with sort by name | GET | `/api/departments?sort=name&order=asc` | Valid auth | 200 | Sorted alphabetically |
| D21 | List with sort by budget | GET | `/api/departments?sort=budget&order=desc` | Valid auth | 200 | Sorted by budget desc |
| D22 | List page beyond total | GET | `/api/departments?page=999` | Valid auth | 200 | Empty array |
| D23 | List with negative page | GET | `/api/departments?page=-1` | Valid auth | 200 | Defaults to page 1 |
| D24 | List with invalid limit | GET | `/api/departments?limit=abc` | Valid auth | 400 | Validation error |
| D25 | List without auth | GET | `/api/departments` | No token | 401 | Unauthorized |
| D26 | List cross-tenant isolation | GET | `/api/departments` | Tenant A token → Tenant DB | 200 | Only tenant A depts |
| D27 | List using employee token | GET | `/api/departments` | Employee token | 200 | Employee can read |
| D28 | List with includes employee count | GET | `/api/departments` | Valid auth | 200 | `employee_count` field present |
| D29 | List with budget totals | GET | `/api/departments` | Valid auth | 200 | Budget values returned |
| D30 | List with date range filter | GET | `/api/departments?created_after=2025-01-01` | Valid auth | 200 | Filtered by date |

## 1.3 Get Single Department — 10 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| D31 | Get by valid ID | GET | `/api/departments/:id` | Valid auth | 200 | Department object |
| D32 | Get by non-existent ID | GET | `/api/departments/:id` | `id: 99999` | 404 | Not found |
| D33 | Get with invalid ID format | GET | `/api/departments/:id` | `id: "abc"` | 400 | Invalid ID |
| D34 | Get with negative ID | GET | `/api/departments/:id` | `id: -1` | 400 | Invalid ID |
| D35 | Get with SQL injection in ID | GET | `/api/departments/:id` | `id: "1 OR 1=1"` | 400 | Not injected |
| D36 | Get without auth | GET | `/api/departments/:id` | No token | 401 | Unauthorized |
| D37 | Get cross-tenant ID | GET | `/api/departments/:id` | Tenant A, ID from tenant B | 404 | Not found (isolated) |
| D38 | Get includes employee count | GET | `/api/departments/:id` | Valid auth | 200 | `employee_count` field |
| D39 | Get includes manager info | GET | `/api/departments/:id` | Valid auth | 200 | `manager_id`, `manager_name` |
| D40 | Get by UUID if using UUID | GET | `/api/departments/:id` | Valid UUID | 200 | Or 400 if not UUID-based |

## 1.4 Update Department — 15 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| D41 | Update name only | PUT | `/api/departments/:id` | `{ name: "New Name" }` | 200 | Name updated |
| D42 | Update budget only | PUT | `/api/departments/:id` | `{ budget: 750000 }` | 200 | Budget updated |
| D43 | Update both name and budget | PUT | `/api/departments/:id` | `{ name: "Full", budget: 1000000 }` | 200 | Both updated |
| D44 | Update to empty name | PUT | `/api/departments/:id` | `{ name: "" }` | 400 | Validation error |
| D45 | Update to duplicate name | PUT | `/api/departments/:id` | Name that already exists | 409 | Duplicate |
| D46 | Update with negative budget | PUT | `/api/departments/:id` | `{ budget: -100 }` | 400 | Negative not allowed |
| D47 | Update non-existent department | PUT | `/api/departments/:id` | `id: 99999` | 404 | Not found |
| D48 | Update without auth | PUT | `/api/departments/:id` | No token | 401 | Unauthorized |
| D49 | Update as employee | PUT | `/api/departments/:id` | Employee token | 403 | Forbidden |
| D50 | Update with SQL injection in name | PUT | `/api/departments/:id` | `{ name: "'; UPDATE departments SET budget=999999; --" }` | 200 | Sanitized |
| D51 | Update with XSS in name | PUT | `/api/departments/:id` | `{ name: "<img src=x onerror=alert(1)>" }` | 200 | HTML-encoded |
| D52 | Update with empty body | PUT | `/api/departments/:id` | `{}` | 200 | No changes (idempotent) |
| D53 | Update with extra unknown fields | PUT | `/api/departments/:id` | `{ name: "Test", extra: true }` | 200 | Ignores extra fields |
| D54 | Update cross-tenant | PUT | `/api/departments/:id` | Tenant A, ID from tenant B | 404 | Isolated |
| D55 | Update budget to 0 | PUT | `/api/departments/:id` | `{ budget: 0 }` | 200 | Zero budget allowed |

## 1.5 Delete Department — 10 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| D56 | Delete existing department | DELETE | `/api/departments/:id` | Admin token | 200 | Deleted |
| D57 | Delete non-existent | DELETE | `/api/departments/:id` | `id: 99999` | 404 | Not found |
| D58 | Delete without auth | DELETE | `/api/departments/:id` | No token | 401 | Unauthorized |
| D59 | Delete as employee | DELETE | `/api/departments/:id` | Employee token | 403 | Forbidden |
| D60 | Delete department with employees | DELETE | `/api/departments/:id` | Depts with employees | 409 | Cannot delete (FK constraint) |
| D61 | Delete cross-tenant | DELETE | `/api/departments/:id` | Tenant A, ID from tenant B | 404 | Isolated |
| D62 | Delete with invalid ID format | DELETE | `/api/departments/:id` | `id: "abc"` | 400 | Invalid ID |
| D63 | Delete then recreate same name | DELETE → POST | Delete → create | Same name | 201 | Can recreate |
| D64 | Delete then list | DELETE → GET | Delete → list | After delete | 200 | Department not in list |
| D65 | Delete with SQL injection in ID | DELETE | `/api/departments/:id` | `id: "1; DELETE FROM departments; --"` | 400 | Not injected |

## 1.6 Budget — 10 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| D66 | Get budget summary | GET | `/api/departments/budget/summary` | Admin token | 200 | Total budget, utilized |
| D67 | Get budget summary as employee | GET | `/api/departments/budget/summary` | Employee token | 403 | Forbidden |
| D68 | Get budget summary without auth | GET | `/api/departments/budget/summary` | No token | 401 | Unauthorized |
| D69 | Budget across fiscal year | GET | `/api/departments/budget?fiscal_year=2025` | Admin token | 200 | Filtered by year |
| D70 | Set department budget | PUT | `/api/departments/:id/budget` | `{ budget: 500000 }` | 200 | Budget set |
| D71 | Set budget to zero | PUT | `/api/departments/:id/budget` | `{ budget: 0 }` | 200 | Zero allowed |
| D72 | Set budget to negative | PUT | `/api/departments/:id/budget` | `{ budget: -100 }` | 400 | Negative rejected |
| D73 | Budget history | GET | `/api/departments/:id/budget/history` | Admin token | 200 | Change history |
| D74 | Budget summary includes department breakdown | GET | `/api/departments/budget/summary` | Admin token | 200 | Per-department breakdown |
| D75 | Budget utilization percentage | GET | `/api/departments/budget/summary` | Admin token | 200 | `utilization_pct` field |

## 1.7 Authorization & Security — 15 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| D76 | Admin can create/read/update/delete | ALL | All endpoints | Admin token | 200/201 | Full access |
| D77 | Manager can create/read/update (not delete) | POST/PUT/DELETE | All | Manager token | 200/201 for C/R/U, 403 for D | Can't delete |
| D78 | Employee read-only | POST/PUT/DELETE | All | Employee token | 200 for GET, 403 for others | Read only |
| D79 | Super Admin bypasses all checks | ALL | All endpoints | Super admin token | 200 | Unrestricted |
| D80 | Rate limiting (100 rapid requests) | GET | `/api/departments` | Valid token | 429 after ~1000 | Rate limited |
| D81 | Mass assignment protection | PUT | `/api/departments/:id` | `{ id: 999, created_at: "now" }` | 200 | Protected fields ignored |
| D82 | Query param injection in search | GET | `/api/departments?search=abc' UNION SELECT * FROM users--` | Valid token | 200 | Not injected |
| D83 | Order by SQL injection | GET | `/api/departments?sort=name; DROP TABLE--` | Valid token | 400 | Sanitized |
| D84 | Pagination overflow (page=1000000) | GET | `/api/departments?page=1000000` | Valid token | 200 | Empty array, no crash |
| D85 | Limit overflow (limit=1000000) | GET | `/api/departments?limit=1000000` | Valid token | 200 | Capped at max |
| D86 | IDOR: Tenant A tries to access Tenant B via ID | GET | `/api/departments/:id` | Tenant A → Tenant B ID | 404 | Blocked |
| D87 | IDOR: update cross-tenant | PUT | `/api/departments/:id` | Tenant A → Tenant B ID | 404 | Blocked |
| D88 | IDOR: delete cross-tenant | DELETE | `/api/departments/:id` | Tenant A → Tenant B ID | 404 | Blocked |
| D89 | Concurrent update race condition | PUT x2 | Same dept, two requests | Different budgets | 200 both | Last write wins, no corruption |
| D90 | Token with revoked access still blocked | GET | `/api/departments` | Revoked token | 401 | Access denied |

## 1.8 Edge Cases — 15 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| D91 | Name with only spaces | POST | `/api/departments` | `{ name: "   " }` | 400 | Trims to empty → error |
| D92 | Name with leading/trailing spaces | POST | `/api/departments` | `{ name: "  Engineering  " }` | 201 | Trimmed stored |
| D93 | Unicode department name | POST | `/api/departments` | `{ name: "開発部門 (Engineering)" }` | 201 | Unicode stored |
| D94 | Emoji in name | POST | `/api/departments` | `{ name: "🎯 Engineering 🚀" }` | 201 | Emoji accepted |
| D95 | Create 100 departments then list | POST x100 → GET | Bulk create | Unique names | 201 x100, 200 | All 100 listed |
| D96 | Delete department then create with same name | DELETE → POST | Same name | After delete | 201 | Name reuse allowed |
| D97 | Update department then verify with GET | PUT → GET | Update → verify | Changed fields | 200 both | Matches |
| D98 | Empty string name in query param | GET | `/api/departments?search=` | Valid auth | 200 | Returns all |
| D99 | Special characters in search | GET | `/api/departments?search=%24%5E%26` | Valid auth | 200 | URL-encoded handled |
| D100 | Try SQL in search | GET | `/api/departments?search=' UNION SELECT * FROM pg_tables--` | Valid auth | 200 | Sanitized |
| D101 | Binary/non-UTF8 in name | POST | `/api/departments` | Binary string | 400 | Rejected |
| D102 | Name starting with number | POST | `/api/departments` | `{ name: "123 Department" }` | 201 | Numbers allowed |
| D103 | Name with only numbers | POST | `/api/departments` | `{ name: "12345" }` | 201 | Accepts numeric names |
| D104 | Budget with scientific notation | PUT | `/api/departments/:id/budget` | `{ budget: 1e10 }` | 200 | Accepted |
| D105 | Budget with string number | PUT | `/api/departments/:id/budget` | `{ budget: "500000" }` | 200 | Type coerced |

Total: 15 + 15 + 10 + 15 + 10 + 10 + 15 + 15 = **105 tests**
