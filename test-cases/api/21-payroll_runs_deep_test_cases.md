# Deep Payroll Runs API Test Cases — 100+ Tests

## Payroll Runs CRUD — State Machine Testing

### Create Run
| # | Test Case | Method | Endpoint | Expected | Auth |
|---|---|---|---|---|---|
| PR-D001 | Create run with valid month(3) and year(2026) | POST | `/api/payroll-runs` | 201, status=draft, has run_id | Admin |
| PR-D002 | Create run with month=1 (boundary min) | POST | `/api/payroll-runs` | 201, created | Admin |
| PR-D003 | Create run with month=12 (boundary max) | POST | `/api/payroll-runs` | 201, created | Admin |
| PR-D004 | Create run with month=0 (invalid) | POST | `/api/payroll-runs` | 400, validation error | Admin |
| PR-D005 | Create run with month=13 (invalid) | POST | `/api/payroll-runs` | 400, validation error | Admin |
| PR-D006 | Create run with month=2.5 (float, not int) | POST | `/api/payroll-runs` | 400, validation error | Admin |
| PR-D007 | Create run with month=null | POST | `/api/payroll-runs` | 400, validation error | Admin |
| PR-D008 | Create run with month='abc' | POST | `/api/payroll-runs` | 400, validation error | Admin |
| PR-D009 | Create run with year=1900 (past) | POST | `/api/payroll-runs` | 201, created (no year validation) | Admin |
| PR-D010 | Create run with year=2100 (future) | POST | `/api/payroll-runs` | 201, created | Admin |
| PR-D011 | Create run with year=null | POST | `/api/payroll-runs` | 400, validation error | Admin |
| PR-D012 | Create run with year='abc' | POST | `/api/payroll-runs` | 400, validation error | Admin |
| PR-D013 | Create run with both missing fields (empty body) | POST | `/api/payroll-runs` | 400, two validation errors | Admin |
| PR-D014 | Create run with extra fields (notes) | POST | `/api/payroll-runs` | 201, notes saved in DB | Admin |
| PR-D015 | Create run with very long notes (5000 chars) | POST | `/api/payroll-runs` | 201, notes truncated or saved | Admin |
| PR-D016 | Create run with special chars in notes | POST | `/api/payroll-runs` | 201, XSS safe | Admin |
| PR-D017 | Create run with notes as HTML <script> tags | POST | `/api/payroll-runs` | 201, stored as literal text | Admin |
| PR-D018 | Create run as manager | POST | `/api/payroll-runs` | 403 Forbidden | Manager |
| PR-D019 | Create run as employee | POST | `/api/payroll-runs` | 403 Forbidden | Employee |
| PR-D020 | Create run without auth | POST | `/api/payroll-runs` | 401 Unauthorized | None |
| PR-D021 | Create duplicate run (same month/year combo) | POST | `/api/payroll-runs` | 409 Conflict | Admin |
| PR-D022 | Create duplicate after deleting the first | POST | `/api/payroll-runs` | 201, allowed (deleted run gone) | Admin |
| PR-D023 | Create duplicate after archiving the first | POST | `/api/payroll-runs` | 409 Conflict (archived still counts) | Admin |
| PR-D024 | Create run triggers audit log | POST | `/api/payroll-runs` | 201, audit_log has CREATE_RUN | Admin |
| PR-D025 | Create run returns standard envelope | POST | `/api/payroll-runs` | 201, `{ success, message, data }` | Admin |
| PR-D026 | Create run response has run_id, status, timestamps | POST | `/api/payroll-runs` | 201, data.run_id, data.status, data.created_at present | Admin |

### List Runs
| # | Test Case | Method | Endpoint | Expected | Auth |
|---|---|---|---|---|---|
| PR-D027 | List all runs (no filters) | GET | `/api/payroll-runs` | 200, paginated list | Admin |
| PR-D028 | List runs with status=draft | GET | `/api/payroll-runs?status=draft` | 200, only draft runs | Admin |
| PR-D029 | List runs with status=finalized | GET | `/api/payroll-runs?status=finalized` | 200, only finalized | Admin |
| PR-D030 | List runs with status=paid | GET | `/api/payroll-runs?status=paid` | 200, only paid | Admin |
| PR-D031 | List runs with status=archived | GET | `/api/payroll-runs?status=archived` | 200, only archived | Admin |
| PR-D032 | List runs with status=MADEUP (invalid) | GET | `/api/payroll-runs?status=MADEUP` | 200, empty array | Admin |
| PR-D033 | List runs with status= (empty) | GET | `/api/payroll-runs?status=` | 200, all runs (empty ignored) | Admin |
| PR-D034 | List runs with year=2026 | GET | `/api/payroll-runs?year=2026` | 200, 2026 runs | Admin |
| PR-D035 | List runs with year=0 | GET | `/api/payroll-runs?year=0` | 200, empty/zero-year runs | Admin |
| PR-D036 | List runs with year=2026&status=draft (combined) | GET | `/api/payroll-runs?year=2026&status=draft` | 200, filtered by both | Admin |
| PR-D037 | List runs page=1, limit=2 (pagination) | GET | `/api/payroll-runs?page=1&limit=2` | 200, 2 items, totalPages computed | Admin |
| PR-D038 | List runs page=2 (page beyond data) | GET | `/api/payroll-runs?page=2` | 200, empty array | Admin |
| PR-D039 | List runs page=0 (clamped to 1) | GET | `/api/payroll-runs?page=0` | 200, page=1 data | Admin |
| PR-D040 | List runs page=-1 (clamped to 1) | GET | `/api/payroll-runs?page=-1` | 200, page=1 data | Admin |
| PR-D041 | List runs page=abc (fallback to 1) | GET | `/api/payroll-runs?page=abc` | 200, page=1 data | Admin |
| PR-D042 | List runs limit=200 (capped at 100) | GET | `/api/payroll-runs?limit=200` | 200, limit=100 applied | Admin |
| PR-D043 | List runs limit=0 (clamped to 1) | GET | `/api/payroll-runs?limit=0` | 200, limit=1 | Admin |
| PR-D044 | List runs limit=abc (fallback to 10) | GET | `/api/payroll-runs?limit=abc` | 200, limit=10 | Admin |
| PR-D045 | List runs as manager (authorized) | GET | `/api/payroll-runs` | 200, full list | Manager |
| PR-D046 | List runs as employee (not authorized) | GET | `/api/payroll-runs` | 403 Forbidden | Employee |
| PR-D047 | List runs without auth | GET | `/api/payroll-runs` | 401 Unauthorized | None |
| PR-D048 | List runs pagination response has all fields | GET | `/api/payroll-runs` | 200, `{ currentPage, totalPages, totalItems, itemsPerPage }` | Admin |
| PR-D049 | List runs sorted DESC by year, month | GET | `/api/payroll-runs` | 200, most recent first | Admin |
| PR-D050 | List runs with X-Tenant-ID from tenant A | GET | `/api/payroll-runs` | 200, only tenant A's runs | Admin |

### Get Run By ID
| # | Test Case | Method | Endpoint | Expected | Auth |
|---|---|---|---|---|---|
| PR-D051 | Get run by valid ID | GET | `/api/payroll-runs/:id` | 200, run + payslips + summary | Admin |
| PR-D052 | Get run includes payslips array | GET | `/api/payroll-runs/:id` | 200, data.payslips is array | Admin |
| PR-D053 | Get run includes summary with total/paid/pending | GET | `/api/payroll-runs/:id` | 200, data.summary has total/paid/pending | Admin |
| PR-D054 | Get run payslips have employee_name, department, status | GET | `/api/payroll-runs/:id` | 200, each payslip has fields | Admin |
| PR-D055 | Get run with non-existent ID | GET | `/api/payroll-runs/999999` | 404, NotFoundError | Admin |
| PR-D056 | Get run with string ID (abc) | GET | `/api/payroll-runs/abc` | 500 or 404 (PG error or coercion) | Admin |
| PR-D057 | Get run with negative ID (-1) | GET | `/api/payroll-runs/-1` | 404, NotFoundError | Admin |
| PR-D058 | Get run as employee who has payslip in this run | GET | `/api/payroll-runs/:id` | 200, limited view | Employee |
| PR-D059 | Get run as employee without payslip in this run | GET | `/api/payroll-runs/:id` | 200, empty payslips array | Employee |
| PR-D060 | Get run as manager | GET | `/api/payroll-runs/:id` | 200, full details | Manager |
| PR-D061 | Get run without auth | GET | `/api/payroll-runs/:id` | 401 Unauthorized | None |
| PR-D062 | Get run: verify tenant isolation | GET | `/api/payroll-runs/:id` | 404 (run in tenant B, not A) | Admin |

### Finalize Run (State: draft → finalized)
| # | Test Case | Method | Endpoint | Expected | Auth |
|---|---|---|---|---|---|
| PR-D063 | Finalize a draft run (with payslips) | PUT | `/api/payroll-runs/:id/finalize` | 200, status=finalized, totals computed | Admin |
| PR-D064 | Finalize run: verify totals were computed | PUT | `/api/payroll-runs/:id/finalize` | 200, run.total_employees > 0 | Admin |
| PR-D065 | Finalize run: total_gross equals sum of payslip gross | PUT | `/api/payroll-runs/:id/finalize` | 200, total_gross matches SUM() | Admin |
| PR-D066 | Finalize run: total_deductions equals sum of deductions | PUT | `/api/payroll-runs/:id/finalize` | 200, total_deductions matches SUM() | Admin |
| PR-D067 | Finalize run: total_net equals sum of net_pay | PUT | `/api/payroll-runs/:id/finalize` | 200, total_net matches SUM() | Admin |
| PR-D068 | Finalize run without payslips (empty run) | PUT | `/api/payroll-runs/:id/finalize` | 200, all totals = 0 | Admin |
| PR-D069 | Finalize already-finalized run | PUT | `/api/payroll-runs/:id/finalize` | 400, ValidationError | Admin |
| PR-D070 | Finalize already-paid run | PUT | `/api/payroll-runs/:id/finalize` | 400, ValidationError | Admin |
| PR-D071 | Finalize already-archived run | PUT | `/api/payroll-runs/:id/finalize` | 400, ValidationError | Admin |
| PR-D072 | Finalize non-existent run | PUT | `/api/payroll-runs/999999/finalize` | 404, NotFoundError | Admin |
| PR-D073 | Finalize as manager | PUT | `/api/payroll-runs/:id/finalize` | 403 Forbidden | Manager |
| PR-D074 | Finalize without auth | PUT | `/api/payroll-runs/:id/finalize` | 401 Unauthorized | None |
| PR-D075 | Finalize triggers audit log | PUT | `/api/payroll-runs/:id/finalize` | 200, audit_log has FINALIZE_RUN | Admin |
| PR-D076 | Finalize returns updated run data | PUT | `/api/payroll-runs/:id/finalize` | 200, data.status='finalized' | Admin |

### Pay Run (State: finalized → paid)
| # | Test Case | Method | Endpoint | Expected | Auth |
|---|---|---|---|---|---|
| PR-D077 | Pay a finalized run | PUT | `/api/payroll-runs/:id/pay` | 200, status=paid, finalized_at set | Admin |
| PR-D078 | Pay run: verify payslips updated to paid | PUT | `/api/payroll-runs/:id/pay` | 200, all payslips.payment_status='paid' | Admin |
| PR-D079 | Pay run: payslips get payment_date | PUT | `/api/payroll-runs/:id/pay` | 200, payslips.payment_date set to today | Admin |
| PR-D080 | Pay run: payslips get payment_method=bank_transfer | PUT | `/api/payroll-runs/:id/pay` | 200, payslips.payment_method='bank_transfer' | Admin |
| PR-D081 | Pay run with custom payment_method=cash | PUT | `/api/payroll-runs/:id/pay` | 200, method='cash' | Admin |
| PR-D082 | Pay run with custom payment_date | PUT | `/api/payroll-runs/:id/pay` | 200, date applied | Admin |
| PR-D083 | Pay run with empty body (method defaults) | PUT | `/api/payroll-runs/:id/pay` | 200, default method='bank_transfer' | Admin |
| PR-D084 | Pay draft run (not finalized) | PUT | `/api/payroll-runs/:id/pay` | 400, must finalize first | Admin |
| PR-D085 | Pay already-paid run | PUT | `/api/payroll-runs/:id/pay` | 400, cannot re-pay | Admin |
| PR-D086 | Pay archived run | PUT | `/api/payroll-runs/:id/pay` | 400, archived not payable | Admin |
| PR-D087 | Pay non-existent run | PUT | `/api/payroll-runs/999999/pay` | 404, NotFoundError | Admin |
| PR-D088 | Pay as manager | PUT | `/api/payroll-runs/:id/pay` | 403 Forbidden | Manager |
| PR-D089 | Pay without auth | PUT | `/api/payroll-runs/:id/pay` | 401 Unauthorized | None |
| PR-D090 | Pay triggers audit log | PUT | `/api/payroll-runs/:id/pay` | 200, audit_log has PAY_RUN | Admin |
| PR-D091 | Pay returns success message | PUT | `/api/payroll-runs/:id/pay` | 200, msg includes 'paid' | Admin |

### Archive Run (State: any → archived)
| # | Test Case | Method | Endpoint | Expected | Auth |
|---|---|---|---|---|---|
| PR-D092 | Archive a finalized run | PUT | `/api/payroll-runs/:id/archive` | 200, status=archived | Admin |
| PR-D093 | Archive a paid run | PUT | `/api/payroll-runs/:id/archive` | 200, status=archived | Admin |
| PR-D094 | Archive a draft run | PUT | `/api/payroll-runs/:id/archive` | 400, cannot archive draft | Admin |
| PR-D095 | Archive already-archived run | PUT | `/api/payroll-runs/:id/archive` | 200, idempotent (stays archived) | Admin |
| PR-D096 | Archive non-existent run | PUT | `/api/payroll-runs/999999/archive` | 404, NotFoundError | Admin |
| PR-D097 | Archive as manager | PUT | `/api/payroll-runs/:id/archive` | 403 Forbidden | Manager |
| PR-D098 | Archive triggers audit log | PUT | `/api/payroll-runs/:id/archive` | 200, audit_log has ARCHIVE_RUN | Admin |

### Delete Run
| # | Test Case | Method | Endpoint | Expected | Auth |
|---|---|---|---|---|---|
| PR-D099 | Delete a draft run (no payslips) | DELETE | `/api/payroll-runs/:id` | 200, deleted | Admin |
| PR-D100 | Delete a draft run WITH payslips (cascade) | DELETE | `/api/payroll-runs/:id` | 200, payslips cascade-deleted | Admin |
| PR-D101 | Verify payslips cascade-deleted with run | DELETE | `/api/payroll-runs/:id` | 200, payslip rows removed | Admin |
| PR-D102 | Delete finalized run (not allowed) | DELETE | `/api/payroll-runs/:id` | 400, only draft can be deleted | Admin |
| PR-D103 | Delete paid run (not allowed) | DELETE | `/api/payroll-runs/:id` | 400, only draft can be deleted | Admin |
| PR-D104 | Delete archived run (not allowed) | DELETE | `/api/payroll-runs/:id` | 400, only draft can be deleted | Admin |
| PR-D105 | Delete non-existent run | DELETE | `/api/payroll-runs/999999` | 404, NotFoundError | Admin |
| PR-D106 | Delete as manager | DELETE | `/api/payroll-runs/:id` | 403 Forbidden | Manager |
| PR-D107 | Delete without auth | DELETE | `/api/payroll-runs/:id` | 401 Unauthorized | None |
| PR-D108 | Delete triggers audit log | DELETE | `/api/payroll-runs/:id` | 200, audit_log has DELETE_RUN | Admin |

### Full Lifecycle State Machine
| # | Test Case | Steps | Expected |
|---|---|---|---|
| PR-D109 | Happy path: create → finalize → pay → archive | POST → PUT/finalize → PUT/pay → PUT/archive | Each step succeeds, status transitions: draft→finalized→paid→archived |
| PR-D110 | Create → delete (draft lifecycle) | POST → DELETE | Created as draft, deleted successfully |
| PR-D111 | Create → finalize → archive (skip pay) | POST → PUT/finalize → PUT/archive | finalized→archived (skip payment) |
| PR-D112 | Create → pay (skip finalize) | POST → PUT/pay | Error: must finalize first |
| PR-D113 | Multi-create different months | POST (month 1), POST (month 2) | Both created, no conflict |
| PR-D114 | Full cycle with payslip generation | POST → generate payslips → finalize → pay | Totals computed from payslips |

### Cross-Tenant Isolation
| # | Test Case | Steps | Expected |
|---|---|---|---|
| PR-D115 | Tenant A creates run, tenant B lists | Tenant A POST, Tenant B GET | Tenant B does not see Tenant A's run |
| PR-D116 | Tenant A creates run, tenant B GET by ID | Tenant B GET /:id (Tenant A's run) | 404 or empty |
| PR-D117 | Tenant A finalizes run, doesn't affect Tenant B | Tenant A finalizes, Tenant B list unaffected | Isolated |
| PR-D118 | Tenant A deletes run, Tenant B unaffected | Tenant A deletes, Tenant B list unchanged | Isolated |

### Idempotency & Race Conditions
| # | Test Case | Steps | Expected |
|---|---|---|---|
| PR-D119 | Double-click finalize (rapid consecutive) | Two finalize calls in parallel | First succeeds, second errors |
| PR-D120 | Double-click pay (rapid consecutive) | Two pay calls in parallel | First succeeds, second errors |
| PR-D121 | Finalize after another admin already paid | Admin A finalizes, Admin B pays, Admin A tries finalize again | Error: already paid |
| PR-D122 | Concurrent create same period (race) | Two simultaneous POST same month/year | One succeeds (201), one conflicts (409) |

## Summary
- **Create Run**: 26 tests (PR-D001 to PR-D026)
- **List Runs**: 24 tests (PR-D027 to PR-D050)
- **Get Run By ID**: 12 tests (PR-D051 to PR-D062)
- **Finalize Run**: 14 tests (PR-D063 to PR-D076)
- **Pay Run**: 15 tests (PR-D077 to PR-D091)
- **Archive Run**: 7 tests (PR-D092 to PR-D098)
- **Delete Run**: 10 tests (PR-D099 to PR-D108)
- **Lifecycle State Machine**: 6 tests (PR-D109 to PR-D114)
- **Cross-Tenant Isolation**: 4 tests (PR-D115 to PR-D118)
- **Race Conditions**: 4 tests (PR-D119 to PR-D122)
- **Total**: **122 test cases**
