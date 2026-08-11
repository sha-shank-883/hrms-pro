# Payroll V3 — Email Queue, Export & Audit Logging

## Email Queue (`/api/email-queue`)

### List Queue (`GET /api/email-queue`)
| # | Test Case | Method | Endpoint | Expected | Auth |
|---|---|---|---|---|---|
| EQ-001 | List email queue (admin) | GET | `/api/email-queue` | 200, queue array with pagination | Admin JWT |
| EQ-002 | List queue filtered by status=pending | GET | `/api/email-queue?status=pending` | 200, filtered pending items | Admin JWT |
| EQ-003 | List queue filtered by status=sent | GET | `/api/email-queue?status=sent` | 200, filtered sent items | Admin JWT |
| EQ-004 | List queue filtered by status=failed | GET | `/api/email-queue?status=failed` | 200, filtered failed items | Admin JWT |
| EQ-005 | List queue filtered by status=cancelled | GET | `/api/email-queue?status=cancelled` | 200, filtered cancelled items | Admin JWT |
| EQ-006 | List queue with pagination (page=1, limit=5) | GET | `/api/email-queue?page=1&limit=5` | 200, pagination metadata | Admin JWT |
| EQ-007 | List queue page=2 when less than 1 page | GET | `/api/email-queue?page=2` | 200, empty array | Admin JWT |
| EQ-008 | List queue limit=0 (clamped to minimum) | GET | `/api/email-queue?limit=0` | 200, limit coerced to 1 | Admin JWT |
| EQ-009 | List queue limit=999 (clamped to max 100) | GET | `/api/email-queue?limit=999` | 200, limit coerced to 100 | Admin JWT |
| EQ-010 | List queue limit negative | GET | `/api/email-queue?limit=-5` | 200, limit coerced to 1 | Admin JWT |
| EQ-011 | List queue invalid status (unknown status) | GET | `/api/email-queue?status=invalid_status` | 200, empty array (no validation) | Admin JWT |
| EQ-012 | List queue empty (no items match filter) | GET | `/api/email-queue?status=sent` | 200, empty data array | Admin JWT |
| EQ-013 | List queue as manager | GET | `/api/email-queue` | 403 Forbidden | Manager JWT |
| EQ-014 | List queue as employee | GET | `/api/email-queue` | 403 Forbidden | Employee JWT |
| EQ-015 | List queue without auth | GET | `/api/email-queue` | 401 Unauthorized | None |
| EQ-016 | List queue page param is string (page=abc) | GET | `/api/email-queue?page=abc` | 200, page coerced to 1 | Admin JWT |
| EQ-017 | List queue limit param is string (limit=abc) | GET | `/api/email-queue?limit=abc` | 200, limit coerced to 20 | Admin JWT |
| EQ-018 | List queue includes employee_name in items | GET | `/api/email-queue` | 200, items have employee_name field | Admin JWT |

### Queue Stats (`GET /api/email-queue/stats`)
| # | Test Case | Method | Endpoint | Expected | Auth |
|---|---|---|---|---|---|
| EQ-019 | Get queue stats with all counts | GET | `/api/email-queue/stats` | 200, stats object with pending/sent/failed/cancelled/total | Admin JWT |
| EQ-020 | Get queue stats when queue is empty | GET | `/api/email-queue/stats` | 200, all counts zero | Admin JWT |
| EQ-021 | Get queue stats as manager | GET | `/api/email-queue/stats` | 403 Forbidden | Manager JWT |
| EQ-022 | Get queue stats as employee | GET | `/api/email-queue/stats` | 403 Forbidden | Employee JWT |
| EQ-023 | Get queue stats without auth | GET | `/api/email-queue/stats` | 401 Unauthorized | None |
| EQ-024 | Stats response format matches expected keys | GET | `/api/email-queue/stats` | 200, `{ pending, sent, failed, cancelled, total }` | Admin JWT |

### Retry Queue Item (`POST /api/email-queue/:id/retry`)
| # | Test Case | Method | Endpoint | Expected | Auth |
|---|---|---|---|---|---|
| EQ-025 | Retry a failed queue item | POST | `/api/email-queue/:id/retry` | 200, status reset to pending | Admin JWT |
| EQ-026 | Retry non-existent queue item | POST | `/api/email-queue/:id/retry` | 404 Not Found | Admin JWT |
| EQ-027 | Retry queue item as manager | POST | `/api/email-queue/:id/retry` | 403 Forbidden | Manager JWT |
| EQ-028 | Retry queue item as employee | POST | `/api/email-queue/:id/retry` | 403 Forbidden | Employee JWT |
| EQ-029 | Retry queue item without auth | POST | `/api/email-queue/:id/retry` | 401 Unauthorized | None |
| EQ-030 | Retry with non-numeric ID | POST | `/api/email-queue/abc/retry` | 500 Internal Server Error (PG error) | Admin JWT |
| EQ-031 | Retry already-sent item (idempotent) | POST | `/api/email-queue/:id/retry` | 200, resets to pending | Admin JWT |
| EQ-032 | Retry already-cancelled item (idempotent) | POST | `/api/email-queue/:id/retry` | 200, resets to pending | Admin JWT |
| EQ-033 | Retry triggers audit log | POST | `/api/email-queue/:id/retry` | 200, audit_log table has RETRY_EMAIL entry | Admin JWT |
| EQ-034 | Retry returns updated row data | POST | `/api/email-queue/:id/retry` | 200, data contains queue item fields | Admin JWT |

### Cancel Queue Item (`DELETE /api/email-queue/:id`)
| # | Test Case | Method | Endpoint | Expected | Auth |
|---|---|---|---|---|---|
| EQ-035 | Cancel a pending queue item | DELETE | `/api/email-queue/:id` | 200, status changed to cancelled | Admin JWT |
| EQ-036 | Cancel non-existent queue item | DELETE | `/api/email-queue/:id` | 404 Not Found | Admin JWT |
| EQ-037 | Cancel queue item as manager | DELETE | `/api/email-queue/:id` | 403 Forbidden | Manager JWT |
| EQ-038 | Cancel queue item as employee | DELETE | `/api/email-queue/:id` | 403 Forbidden | Employee JWT |
| EQ-039 | Cancel queue item without auth | DELETE | `/api/email-queue/:id` | 401 Unauthorized | None |
| EQ-040 | Cancel with non-numeric ID | DELETE | `/api/email-queue/abc` | 500 Internal Server Error (PG error) | Admin JWT |
| EQ-041 | Cancel already-cancelled item (idempotent) | DELETE | `/api/email-queue/:id` | 200, remains cancelled | Admin JWT |
| EQ-042 | Cancel already-sent item | DELETE | `/api/email-queue/:id` | 200, overwrites to cancelled | Admin JWT |
| EQ-043 | Cancel triggers audit log | DELETE | `/api/email-queue/:id` | 200, audit_log table has CANCEL_EMAIL entry | Admin JWT |
| EQ-044 | Cancel returns updated row data | DELETE | `/api/email-queue/:id` | 200, data contains queue item fields | Admin JWT |

---

## Export (`/api/export`)

### Export Payslips (`GET /api/export/payslips`)
| # | Test Case | Method | Endpoint | Expected | Auth |
|---|---|---|---|---|---|
| EX-001 | Export payslips CSV (no filters) | GET | `/api/export/payslips` | 200, CSV file download with BOM | Admin JWT |
| EX-002 | Export payslips filtered by run_id | GET | `/api/export/payslips?run_id=1` | 200, CSV filtered by run | Admin JWT |
| EX-003 | Export payslips filtered by month+year | GET | `/api/export/payslips?month=3&year=2026` | 200, CSV filtered by period | Admin JWT |
| EX-004 | Export payslips filtered by payment_status | GET | `/api/export/payslips?payment_status=paid` | 200, CSV filtered by status | Admin JWT |
| EX-005 | Export payslips with all filters combined | GET | `/api/export/payslips?run_id=1&month=3&year=2026&payment_status=paid` | 200, CSV with all filters | Admin JWT |
| EX-006 | Export payslips as manager | GET | `/api/export/payslips` | 200, CSV download allowed | Manager JWT |
| EX-007 | Export payslips as employee | GET | `/api/export/payslips` | 403 Forbidden | Employee JWT |
| EX-008 | Export payslips without auth | GET | `/api/export/payslips` | 401 Unauthorized | None |
| EX-009 | Export payslips with invalid month (non-numeric) | GET | `/api/export/payslips?month=abc` | 200, empty CSV (month NaN → 0 results) | Admin JWT |
| EX-010 | Export payslips with invalid year (non-numeric) | GET | `/api/export/payslips?year=xyz` | 200, empty CSV (year NaN → 0 results) | Admin JWT |
| EX-011 | Export payslips non-existent run_id | GET | `/api/export/payslips?run_id=999999` | 200, empty CSV with headers | Admin JWT |
| EX-012 | Export payslips empty result set | GET | `/api/export/payslips?month=1&year=2000` | 200, headers-only CSV | Admin JWT |
| EX-013 | Export payslips CSV Content-Type header | GET | `/api/export/payslips` | 200, Content-Type: text/csv | Admin JWT |
| EX-014 | Export payslips filename format | GET | `/api/export/payslips` | 200, filename = payslips_YYYY-MM-DD.csv | Admin JWT |
| EX-015 | Export payslips CSV has BOM prefix (UTF-8) | GET | `/api/export/payslips` | 200, first bytes are BOM | Admin JWT |
| EX-016 | Export payslips with month=0 (invalid month) | GET | `/api/export/payslips?month=0` | 200, empty CSV | Admin JWT |
| EX-017 | Export payslips with month=13 (invalid month) | GET | `/api/export/payslips?month=13` | 200, empty CSV | Admin JWT |

### Export Runs (`GET /api/export/runs`)
| # | Test Case | Method | Endpoint | Expected | Auth |
|---|---|---|---|---|---|
| EX-018 | Export payroll runs CSV (no filters) | GET | `/api/export/runs` | 200, CSV file download | Admin JWT |
| EX-019 | Export runs filtered by status | GET | `/api/export/runs?status=draft` | 200, CSV filtered by status | Admin JWT |
| EX-020 | Export runs filtered by year | GET | `/api/export/runs?year=2026` | 200, CSV filtered by year | Admin JWT |
| EX-021 | Export runs with all filters | GET | `/api/export/runs?status=paid&year=2026` | 200, CSV with combined filters | Admin JWT |
| EX-022 | Export runs as manager | GET | `/api/export/runs` | 200, CSV download allowed | Manager JWT |
| EX-023 | Export runs as employee | GET | `/api/export/runs` | 403 Forbidden | Employee JWT |
| EX-024 | Export runs without auth | GET | `/api/export/runs` | 401 Unauthorized | None |
| EX-025 | Export runs with invalid year | GET | `/api/export/runs?year=abc` | 200, empty CSV | Admin JWT |
| EX-026 | Export runs with invalid status | GET | `/api/export/runs?status=invalid_status` | 200, empty CSV | Admin JWT |
| EX-027 | Export runs empty result set | GET | `/api/export/runs?year=2000` | 200, headers-only CSV | Admin JWT |
| EX-028 | Export runs filename format | GET | `/api/export/runs` | 200, filename = payroll_runs_YYYY-MM-DD.csv | Admin JWT |

### Export Earnings Breakdown (`GET /api/export/earnings`)
| # | Test Case | Method | Endpoint | Expected | Auth |
|---|---|---|---|---|---|
| EX-029 | Export earnings breakdown with run_id | GET | `/api/export/earnings?run_id=1` | 200, CSV file download | Admin JWT |
| EX-030 | Export earnings as manager | GET | `/api/export/earnings?run_id=1` | 200, CSV download allowed | Manager JWT |
| EX-031 | Export earnings as employee | GET | `/api/export/earnings?run_id=1` | 403 Forbidden | Employee JWT |
| EX-032 | Export earnings without auth | GET | `/api/export/earnings?run_id=1` | 401 Unauthorized | None |
| EX-033 | Export earnings missing run_id | GET | `/api/export/earnings` | 400 Bad Request, run_id required | Admin JWT |
| EX-034 | Export earnings empty run_id | GET | `/api/export/earnings?run_id=` | 400 Bad Request, run_id required | Admin JWT |
| EX-035 | Export earnings non-existent run_id | GET | `/api/export/earnings?run_id=999999` | 200, empty CSV | Admin JWT |
| EX-036 | Export earnings non-numeric run_id | GET | `/api/export/earnings?run_id=abc` | 500 Internal Server Error (PG error) | Admin JWT |
| EX-037 | Export earnings filename format | GET | `/api/export/earnings?run_id=1` | 200, filename = earnings_breakdown_{runId}_YYYY-MM-DD.csv | Admin JWT |
| EX-038 | Export earnings empty result (no payslips in run) | GET | `/api/export/earnings?run_id=1` | 200, headers-only CSV | Admin JWT |

---

## Payslip Templates — Audit Logging (`/api/payslip-templates`)

| # | Test Case | Method | Endpoint | Expected | Auth |
|---|---|---|---|---|---|
| AL-001 | Create template triggers audit log | POST | `/api/payslip-templates` | 201, audit_log has CREATE_PAYSLIP_TEMPLATE | Admin JWT |
| AL-002 | Update template triggers audit log | PUT | `/api/payslip-templates/:id` | 200, audit_log has UPDATE_PAYSLIP_TEMPLATE | Admin JWT |
| AL-003 | Set default triggers audit log | PUT | `/api/payslip-templates/:id/set-default` | 200, audit_log has SET_DEFAULT_TEMPLATE | Admin JWT |
| AL-004 | Delete template triggers audit log | DELETE | `/api/payslip-templates/:id` | 200, audit_log has DELETE_PAYSLIP_TEMPLATE | Admin JWT |
| AL-005 | Retry email triggers audit log | POST | `/api/email-queue/:id/retry` | 200, audit_log has RETRY_EMAIL | Admin JWT |
| AL-006 | Cancel email triggers audit log | DELETE | `/api/email-queue/:id` | 200, audit_log has CANCEL_EMAIL | Admin JWT |
| AL-007 | Audit log entries have correct action_type | as above | as above | audit_log.action_type matches expected string | Admin JWT |
| AL-008 | Audit log entries have correct module_name | as above | as above | audit_log.module = PAYROLL or EMAIL | Admin JWT |
| AL-009 | Audit log entries store user_id | as above | as above | audit_log.user_id matches req.user.userId | Admin JWT |
| AL-010 | Audit log entries have non-null timestamp | as above | as above | audit_log.created_at is not null | Admin JWT |

---

## Response Format & Compliance

| # | Test Case | Method | Endpoint | Expected | Auth |
|---|---|---|---|---|---|
| RFC-001 | Email queue list uses standard envelope | GET | `/api/email-queue` | 200, `{ success: true, data, pagination }` | Admin JWT |
| RFC-002 | Email queue stats uses standard envelope | GET | `/api/email-queue/stats` | 200, `{ success: true, data }` | Admin JWT |
| RFC-003 | Retry response uses standard envelope | POST | `/api/email-queue/:id/retry` | 200, `{ success: true, message, data }` | Admin JWT |
| RFC-004 | Cancel response uses standard envelope | DELETE | `/api/email-queue/:id` | 200, `{ success: true, message, data }` | Admin JWT |
| RFC-005 | 401 response format for email queue | GET | `/api/email-queue` | 401, `{ success: false, message }` | None |
| RFC-006 | 403 response format for email queue | GET | `/api/email-queue` | 403, `{ success: false, message }` | Employee JWT |
| RFC-007 | 404 response format for retry | POST | `/api/email-queue/999999/retry` | 404, `{ success: false, message }` | Admin JWT |
| RFC-008 | Export error response format (400) | GET | `/api/export/earnings` | 400, `{ success: false, message }` | Admin JWT |

---

## Edge Cases

| # | Test Case | Method | Endpoint | Expected | Auth |
|---|---|---|---|---|---|
| EC-001 | Email queue no items exist | GET | `/api/email-queue` | 200, empty array, totalItems=0 | Admin JWT |
| EC-002 | Retry on item that is currently being processed | POST | `/api/email-queue/:id/retry` | 200, status force-reset to pending | Admin JWT |
| EC-003 | Cancel on item that is already cancelled | DELETE | `/api/email-queue/:id` | 200, idempotent (no error) | Admin JWT |
| EC-004 | Retry cascading — retry after cancel | POST | `/api/email-queue/:id/retry` | 200, re-queues cancelled item | Admin JWT |
| EC-005 | Export concurrent requests | GET | `/api/export/payslips` | 200, separate temp files | Admin JWT |
| EC-006 | Export with special characters in data | GET | `/api/export/payslips` | 200, CSV properly escaped | Admin JWT |
| EC-007 | Salary export with decimal values | GET | `/api/export/payslips` | 200, numeric precision preserved | Admin JWT |
| EC-008 | Email queue with multiple status filters simultaneously | GET | `/api/email-queue?status=pending&status=sent` | 200, last status param used | Admin JWT |

---

## Summary
- **Email Queue (EQ)**: 44 test cases
- **Export (EX)**: 38 test cases
- **Audit Log (AL)**: 10 test cases
- **Response Format (RFC)**: 8 test cases
- **Edge Cases (EC)**: 8 test cases
- **Total**: 108 test cases
