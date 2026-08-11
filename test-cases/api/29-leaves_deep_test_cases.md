# Leaves Module — Deep API Test Cases (110 tests)

## 1.1 Create Leave — 15 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| L1 | Apply leave with valid data | POST | `/api/leaves` | `{ leave_type_id, from_date, to_date, reason }` | 201 | Leave created |
| L2 | Apply leave with missing leave_type | POST | `/api/leaves` | No leave_type_id | 400 | Validation error |
| L3 | Apply leave with missing dates | POST | `/api/leaves` | `{ leave_type_id: 1 }` | 400 | Dates required |
| L4 | Apply leave with past date | POST | `/api/leaves` | Date in past (no backdate) | 400 | Cannot backdate |
| L5 | Apply leave with to_date before from_date | POST | `/api/leaves` | `from_date: "2025-01-10", to_date: "2025-01-05"` | 400 | Invalid range |
| L6 | Apply leave exceeding balance | POST | `/api/leaves` | Request 20 days, only 10 remaining | 400 | Insufficient balance |
| L7 | Apply leave without auth | POST | `/api/leaves` | No token | 401 | Unauthorized |
| L8 | Apply leave with SQL injection in reason | POST | `/api/leaves` | `{ reason: "'; DROP TABLE leaves; --" }` | 201 | Sanitized |
| L9 | Apply leave with XSS in reason | POST | `/api/leaves` | `{ reason: "<script>alert('xss')</script>" }` | 201 | HTML-encoded |
| L10 | Apply half-day leave | POST | `/api/leaves` | `{ half_day: true }` | 201 | Half day |
| L11 | Apply leave with attachment | POST | `/api/leaves` | With file upload | 201 | Document attached |
| L12 | Apply comp-off leave | POST | `/api/leaves` | `{ leave_type: "comp-off" }` | 201 | Comp-off type |
| L13 | Apply leave overlapping existing | POST | `/api/leaves` | Same dates as existing approved | 409 | Overlap detected |
| L14 | Apply leave on holiday | POST | `/api/leaves` | Date is a holiday | 201 | Deducted normally |
| L15 | Apply leave on weekend | POST | `/api/leaves` | Sat/Sun | 200 | Weekend excluded from count |

## 1.2 List Leaves — 12 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| L16 | List own leaves | GET | `/api/leaves` | Employee token | 200 | Own leaves |
| L17 | List all leaves (admin) | GET | `/api/leaves?all=true` | Admin token | 200 | All employees |
| L18 | List with status filter | GET | `/api/leaves?status=pending` | Valid auth | 200 | Pending only |
| L19 | List with date range | GET | `/api/leaves?from=2025-01-01&to=2025-01-31` | Valid auth | 200 | Filtered by date |
| L20 | List with employee filter | GET | `/api/leaves?employee_id=1` | Manager/admin | 200 | Specific employee |
| L21 | List pagination | GET | `/api/leaves?page=1&limit=10` | Valid auth | 200 | Paginated |
| L22 | List sorted by date | GET | `/api/leaves?sort=from_date&order=desc` | Valid auth | 200 | Sorted |
| L23 | List empty result | GET | `/api/leaves?status=rejected` | No rejections | 200 | Empty array |
| L24 | List without auth | GET | `/api/leaves` | No token | 401 | Unauthorized |
| L25 | List team leaves (manager) | GET | `/api/leaves?team=true` | Manager token | 200 | Team leaves |
| L26 | List cross-tenant (employee from other tenant) | GET | `/api/leaves?employee_id=1` | Wrong tenant | 404 | Blocked |
| L27 | List with leave_type filter | GET | `/api/leaves?leave_type_id=1` | Valid auth | 200 | Filtered by type |

## 1.3 Leave Balance — 10 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| L28 | Get my leave balance | GET | `/api/leaves/balance` | Valid auth | 200 | Balance per type |
| L29 | Get employee leave balance (manager) | GET | `/api/leaves/balance?employee_id=1` | Manager token | 200 | Employee balance |
| L30 | Get balance without auth | GET | `/api/leaves/balance` | No token | 401 | Unauthorized |
| L31 | Balance includes annual/medical/casual | GET | `/api/leaves/balance` | Valid auth | 200 | All types |
| L32 | Balance includes `total`, `used`, `remaining` | GET | `/api/leaves/balance` | Valid auth | 200 | Breakdown |
| L33 | Balance resets at fiscal year | GET | `/api/leaves/balance` | Compare Jan vs Dec | 200 | Proper calculations |
| L34 | Zero balance for new employee | GET | `/api/leaves/balance` | New hire | 200 | Zero or prorated |
| L35 | Negative balance not possible | GET | `/api/leaves/balance` | After over-use | 200 | Shows 0 not negative |
| L36 | Balance cross-tenant | GET | `/api/leaves/balance?employee_id=1` | Wrong tenant | 404 | Blocked |
| L37 | Balance with carry-forward | GET | `/api/leaves/balance` | Previous year carry | 200 | Carry included |

## 1.4 Approve / Reject — 15 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| L38 | Approve pending leave | PUT | `/api/leaves/:id/approve` | Manager token | 200 | Approved |
| L39 | Approve already approved leave | PUT | `/api/leaves/:id/approve` | Already approved | 400 | Already approved |
| L40 | Approve rejected leave | PUT | `/api/leaves/:id/approve` | Already rejected | 400 | Cannot approve rejected |
| L41 | Approve without auth | PUT | `/api/leaves/:id/approve` | No token | 401 | Unauthorized |
| L42 | Approve as employee | PUT | `/api/leaves/:id/approve` | Employee token | 403 | Forbidden |
| L43 | Approve non-existent leave | PUT | `/api/leaves/:id/approve` | `id: 99999` | 404 | Not found |
| L44 | Reject pending leave | PUT | `/api/leaves/:id/reject` | Manager token | 200 | Rejected |
| L45 | Reject with reason | PUT | `/api/leaves/:id/reject` | `{ reason: "Understaffed" }` | 200 | Reason stored |
| L46 | Reject already rejected | PUT | `/api/leaves/:id/reject` | Already rejected | 400 | Already rejected |
| L47 | Reject without auth | PUT | `/api/leaves/:id/reject` | No token | 401 | Unauthorized |
| L48 | Approve cross-department (not manager) | PUT | `/api/leaves/:id/approve` | Manager of different dept | 403 | Not their team |
| L49 | Manager approves own leave | PUT | `/api/leaves/:id/approve` | Manager approves own | 403 | Cannot self-approve |
| L50 | Bulk approve | PUT | `/api/leaves/bulk-approve` | `{ ids: [1,2,3] }` | 200 | All approved |
| L51 | Bulk reject | PUT | `/api/leaves/bulk-reject` | `{ ids: [4,5,6], reason: "Ops" }` | 200 | All rejected |
| L52 | Approve with SQL injection in reason | PUT | `/api/leaves/:id/reject` | `{ reason: "'; UPDATE users SET role='admin' --" }` | 200 | Sanitized |

## 1.5 Leave Types — 8 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| L53 | List leave types | GET | `/api/leaves/types` | Valid auth | 200 | Types array |
| L54 | Create leave type | POST | `/api/leaves/types` | `{ name, days_per_year }` | 201 | Type created |
| L55 | Create leave type duplicate name | POST | `/api/leaves/types` | Same name | 409 | Duplicate |
| L56 | Create leave type without days | POST | `/api/leaves/types` | `{ name: "Special" }` | 201 | Default days |
| L57 | Update leave type | PUT | `/api/leaves/types/:id` | `{ days_per_year: 15 }` | 200 | Updated |
| L58 | Delete leave type | DELETE | `/api/leaves/types/:id` | Admin token | 200 | Deleted |
| L59 | Delete leave type in use | DELETE | `/api/leaves/types/:id` | Leaves exist | 409 | Cannot delete |
| L60 | Leave types without auth | GET | `/api/leaves/types` | No token | 401 | Unauthorized |

## 1.6 Statistics — 8 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| L61 | Get leave statistics | GET | `/api/leaves/statistics` | Valid auth | 200 | Stats object |
| L62 | Get department leave stats | GET | `/api/leaves/statistics?department_id=1` | Admin | 200 | Dept stats |
| L63 | Get monthly leave stats | GET | `/api/leaves/statistics?month=3&year=2025` | Valid auth | 200 | Monthly |
| L64 | Stats include pending/approved/rejected counts | GET | `/api/leaves/statistics` | Valid auth | 200 | Status counts |
| L65 | Stats include most used leave type | GET | `/api/leaves/statistics` | Valid auth | 200 | Type breakdown |
| L66 | Stats without auth | GET | `/api/leaves/statistics` | No token | 401 | Unauthorized |
| L67 | Stats cross-tenant | GET | `/api/leaves/statistics` | Wrong tenant | 403 | Blocked |
| L68 | Stats as employee (own dept) | GET | `/api/leaves/statistics` | Employee token | 403 | Limited view |

## 1.7 Calendar View — 5 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| L69 | Get leave calendar | GET | `/api/leaves/calendar?month=3&year=2025` | Valid auth | 200 | Calendar events |
| L70 | Calendar shows approved leaves | GET | `/api/leaves/calendar` | Valid auth | 200 | Only approved |
| L71 | Calendar includes employee names | GET | `/api/leaves/calendar` | Admin | 200 | Names visible |
| L72 | Calendar for team (manager) | GET | `/api/leaves/calendar?team=true` | Manager | 200 | Team calendar |
| L73 | Calendar without auth | GET | `/api/leaves/calendar` | No token | 401 | Unauthorized |

## 1.8 Authorization — 15 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| L74 | Employee can apply own leave | POST | `/api/leaves` | Employee token | 201 | Allowed |
| L75 | Employee can view own leaves | GET | `/api/leaves` | Employee token | 200 | Own records |
| L76 | Employee can view own balance | GET | `/api/leaves/balance` | Employee token | 200 | Own balance |
| L77 | Employee cannot approve | PUT | `/api/leaves/:id/approve` | Employee token | 403 | Forbidden |
| L78 | Employee cannot reject | PUT | `/api/leaves/:id/reject` | Employee token | 403 | Forbidden |
| L79 | Employee cannot view others' leaves | GET | `/api/leaves?employee_id=2` | Employee token | 403 | Forbidden |
| L80 | Manager can approve team | PUT | `/api/leaves/:id/approve` | Manager token (team) | 200 | Allowed |
| L81 | Manager can view team leaves | GET | `/api/leaves?team=true` | Manager token | 200 | Team visible |
| L82 | Manager cannot approve outside team | PUT | `/api/leaves/:id/approve` | Manager of other dept | 403 | Forbidden |
| L83 | Admin can approve any | PUT | `/api/leaves/:id/approve` | Admin token | 200 | Allowed |
| L84 | Admin can view any | GET | `/api/leaves?employee_id=1` | Admin token | 200 | Allowed |
| L85 | Super Admin bypasses all | ALL | All endpoints | Super admin | 200 | Unrestricted |
| L86 | Cross-tenant admin cannot view | GET | `/api/leaves?employee_id=1` | Tenant A, emp in Tenant B | 404 | Blocked |
| L87 | Cannot approve own leave | PUT | `/api/leaves/:id/approve` | Self-approval attempt | 403 | Blocked |
| L88 | Cannot reject own leave | PUT | `/api/leaves/:id/reject` | Self-rejection attempt | 403 | Blocked |

## 1.9 Edge Cases — 15 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| L89 | Apply 1-day leave | POST | `/api/leaves` | Same from and to date | 201 | 1 day |
| L90 | Apply 365-day leave | POST | `/api/leaves` | Full year | 400 | Exceeds max |
| L91 | Cancel pending leave | PUT | `/api/leaves/:id/cancel` | Owner token | 200 | Cancelled |
| L92 | Cancel approved leave | PUT | `/api/leaves/:id/cancel` | Owner token | 200 | Cancelled (balance restored) |
| L93 | Cancel rejected leave | PUT | `/api/leaves/:id/cancel` | Already rejected | 400 | Cannot cancel |
| L94 | Cancel leave not owned | PUT | `/api/leaves/:id/cancel` | Different employee | 403 | Forbidden |
| L95 | Apply leave during notice period | POST | `/api/leaves` | Employee on notice | 200 | Allowed |
| L96 | Leave balance depleted (0 remaining) | POST | `/api/leaves` | Used all leave | 400 | Insufficient balance |
| L97 | Leave on public holiday (auto-approved?) | POST | `/api/leaves` | Holiday date | 200 | Deducted or not? |
| L98 | Leave spanning weekend | POST | `/api/leaves` | Mon-Fri | 201 | 5 days (not 7) |
| L99 | Leave spanning holiday | POST | `/api/leaves` | Includes holiday | 201 | Holiday excluded |
| L100 | Apply leave with duplicate dates | POST | `/api/leaves` | Same dates as approved | 409 | Overlap |
| L101 | Emergency leave (retrospective) | POST | `/api/leaves` | Backdate 3 days | 400 | No backdate |
| L102 | Leave with half-day AM | POST | `/api/leaves` | `{ half_day: true, half_day_session: "first" }` | 201 | AM session |
| L103 | Leave with half-day PM | POST | `/api/leaves` | `{ half_day: true, half_day_session: "second" }` | 201 | PM session |

## 1.10 Comp-Off Integration — 10 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| L104 | Apply comp-off leave with balance | POST | `/api/leaves` | Type: comp-off, has balance | 201 | Deducts comp-off |
| L105 | Apply comp-off without balance | POST | `/api/leaves` | Type: comp-off, no balance | 400 | No balance |
| L106 | Comp-off auto-approval | PUT | `/api/leaves/:id/approve` | Comp-off type | 200 | or auto approved |
| L107 | Combine comp-off with annual | POST | `/api/leaves` | Mixed types | 400 | Not allowed |
| L108 | Comp-off expiry | GET | `/api/leaves/balance` | Expired comp-offs | 200 | Zeroed out |
| L109 | Comp-off carry forward | GET | `/api/leaves/balance` | End of year | 200 | Max carry limit |
| L110 | Comp-off approval workflow | POST → PUT | Apply → approve | Full flow | 201 → 200 | Complete lifecycle |

Total: 15 + 12 + 10 + 15 + 8 + 8 + 5 + 15 + 15 + 10 = **110 tests**
