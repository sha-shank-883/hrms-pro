# Deep Email Queue & Worker API Test Cases — 100+ Tests

## Email Queue — List (GET)

| # | Test Case | Method | Endpoint | Expected | Auth |
|---|---|---|---|---|---|
| EQ-D001 | List queue with all items | GET | `/api/email-queue` | 200, array with employee_name, employee_id | Admin |
| EQ-D002 | List queue filtered by status=pending | GET | `/api/email-queue?status=pending` | 200, only pending | Admin |
| EQ-D003 | List queue filtered by status=failed | GET | `/api/email-queue?status=failed` | 200, only failed | Admin |
| EQ-D004 | List queue filtered by status=sent | GET | `/api/email-queue?status=sent` | 200, only sent | Admin |
| EQ-D005 | List queue filtered by status=cancelled | GET | `/api/email-queue?status=cancelled` | 200, only cancelled | Admin |
| EQ-D006 | List queue filtered by empty status | GET | `/api/email-queue?status=` | 200, all items | Admin |
| EQ-D007 | List queue with invalid status | GET | `/api/email-queue?status=INVALID` | 200, empty array | Admin |
| EQ-D008 | List queue with SQL injection in status | GET | `/api/email-queue?status=' OR 1=1--` | 200, safe no injection | Admin |
| EQ-D009 | List queue pagination page=1 limit=5 | GET | `/api/email-queue?page=1&limit=5` | 200, pagination metadata | Admin |
| EQ-D010 | List queue page beyond data | GET | `/api/email-queue?page=999` | 200, empty array | Admin |
| EQ-D011 | List queue limit=0 (clamped) | GET | `/api/email-queue?limit=0` | 200, limit coerced to 1 | Admin |
| EQ-D012 | List queue limit negative | GET | `/api/email-queue?limit=-5` | 200, limit coerced to 1 | Admin |
| EQ-D013 | List queue limit=1000 (capped) | GET | `/api/email-queue?limit=1000` | 200, limit=100 | Admin |
| EQ-D014 | List queue page=abc (fallback) | GET | `/api/email-queue?page=abc` | 200, page=1 | Admin |
| EQ-D015 | List queue limit=abc (fallback) | GET | `/api/email-queue?limit=abc` | 200, limit=20 | Admin |
| EQ-D016 | List queue as manager | GET | `/api/email-queue` | 403 Forbidden | Manager |
| EQ-D017 | List queue as employee | GET | `/api/email-queue` | 403 Forbidden | Employee |
| EQ-D018 | List queue without auth | GET | `/api/email-queue` | 401 Unauthorized | None |
| EQ-D019 | List queue empty state | GET | `/api/email-queue` | 200, totalItems=0 | Admin |
| EQ-D020 | List queue items have all required fields | GET | `/api/email-queue` | 200, queue_id, payslip_id, status, attempts, created_at, employee_name present | Admin |

## Email Queue — Stats (GET /stats)

| # | Test Case | Method | Endpoint | Expected | Auth |
|---|---|---|---|---|---|
| EQ-D021 | Get stats when queue has mixed statuses | GET | `/api/email-queue/stats` | 200, correct counts per status | Admin |
| EQ-D022 | Get stats when queue is empty | GET | `/api/email-queue/stats` | 200, all counts = 0 | Admin |
| EQ-D023 | Get stats as manager | GET | `/api/email-queue/stats` | 403 Forbidden | Manager |
| EQ-D024 | Get stats as employee | GET | `/api/email-queue/stats` | 403 Forbidden | Employee |
| EQ-D025 | Get stats without auth | GET | `/api/email-queue/stats` | 401 Unauthorized | None |
| EQ-D026 | Stats response has pending/sent/failed/cancelled/total keys | GET | `/api/email-queue/stats` | 200, all 5 numeric fields | Admin |
| EQ-D027 | Stats totals match manual count | GET | `/api/email-queue/stats` | 200, total = pending+sent+failed+cancelled | Admin |
| EQ-D028 | Stats after queue operations update correctly | POST then GET | Create item, retry, cancel, check stats | Stats increment/decrement correctly | Admin |

## Email Queue — Retry (POST /:id/retry)

| # | Test Case | Method | Endpoint | Expected | Auth |
|---|---|---|---|---|---|
| EQ-D029 | Retry a failed queue item | POST | `/api/email-queue/:id/retry` | 200, status=pending, attempts=0, last_error=null | Admin |
| EQ-D030 | Retry a pending queue item (idempotent) | POST | `/api/email-queue/:id/retry` | 200, stays pending, attempts reset | Admin |
| EQ-D031 | Retry a cancelled queue item (re-queue) | POST | `/api/email-queue/:id/retry` | 200, re-queued to pending | Admin |
| EQ-D032 | Retry a sent queue item (reset) | POST | `/api/email-queue/:id/retry` | 200, reset to pending | Admin |
| EQ-D033 | Retry non-existent item | POST | `/api/email-queue/999999/retry` | 404, NotFoundError | Admin |
| EQ-D034 | Retry with non-numeric ID | POST | `/api/email-queue/abc/retry` | 500 (PG error) | Admin |
| EQ-D035 | Retry as manager | POST | `/api/email-queue/:id/retry` | 403 Forbidden | Manager |
| EQ-D036 | Retry as employee | POST | `/api/email-queue/:id/retry` | 403 Forbidden | Employee |
| EQ-D037 | Retry without auth | POST | `/api/email-queue/:id/retry` | 401 Unauthorized | None |
| EQ-D038 | Retry triggers audit log | POST | `/api/email-queue/:id/retry` | 200, audit_log has RETRY_EMAIL | Admin |
| EQ-D039 | Retry returns updated item | POST | `/api/email-queue/:id/retry` | 200, data.status='pending' | Admin |
| EQ-D040 | Retry triggers processQueue() | POST | `/api/email-queue/:id/retry` | 200, worker starts processing | Admin |
| EQ-D041 | Retry multiple times (abuse) | POST × 100 | Same item | Each succeeds, no side effects | Admin |

## Email Queue — Cancel (DELETE /:id)

| # | Test Case | Method | Endpoint | Expected | Auth |
|---|---|---|---|---|---|
| EQ-D042 | Cancel a pending queue item | DELETE | `/api/email-queue/:id` | 200, status=cancelled | Admin |
| EQ-D043 | Cancel a failed queue item | DELETE | `/api/email-queue/:id` | 200, status=cancelled | Admin |
| EQ-D044 | Cancel already-cancelled item (idempotent) | DELETE | `/api/email-queue/:id` | 200, stays cancelled | Admin |
| EQ-D045 | Cancel already-sent item | DELETE | `/api/email-queue/:id` | 200, status=cancelled | Admin |
| EQ-D046 | Cancel non-existent item | DELETE | `/api/email-queue/999999` | 404, NotFoundError | Admin |
| EQ-D047 | Cancel with non-numeric ID | DELETE | `/api/email-queue/abc` | 500 (PG error) | Admin |
| EQ-D048 | Cancel as manager | DELETE | `/api/email-queue/:id` | 403 Forbidden | Manager |
| EQ-D049 | Cancel as employee | DELETE | `/api/email-queue/:id` | 403 Forbidden | Employee |
| EQ-D050 | Cancel without auth | DELETE | `/api/email-queue/:id` | 401 Unauthorized | None |
| EQ-D051 | Cancel triggers audit log | DELETE | `/api/email-queue/:id` | 200, audit_log has CANCEL_EMAIL | Admin |
| EQ-D052 | Cancel returns updated item | DELETE | `/api/email-queue/:id` | 200, data.status='cancelled' | Admin |

## Email Queue Worker (Background Service)

| # | Test Case | Steps | Expected |
|---|---|---|---|
| EQ-D053 | Worker starts on server boot | Check process | setInterval + immediate call to processQueue() |
| EQ-D054 | Worker polls every 30 seconds | Wait 31s | Worker runs at ~30s intervals |
| EQ-D055 | Worker processes pending items | Create pending, wait | Items transition to sent/failed |
| EQ-D056 | Worker processes multiple pending items | Create 5 pending | All processed (batch of 10) |
| EQ-D057 | Worker skips items with max_attempts reached | Create failed (3 attempts) | Not picked up by worker |
| EQ-D058 | Worker increments attempts on failure | Create item with bad email | attempts incremented, status=failed |
| EQ-D059 | Worker marks item as sent on success | Create valid item | status=sent, sent_at set |
| EQ-D060 | Worker does not process cancelled items | Cancel item | Worker skips it |
| EQ-D061 | Worker does not process sent items | Already sent | Skipped |
| EQ-D062 | Worker respects max_attempts=3 | Create, fail 3 times | After 3rd, not retried |
| EQ-D063 | Worker sets last_error on failure | Bad SMTP | last_error stores error message |
| EQ-D064 | Worker concurrently: isProcessing flag prevents overlap | Two back-to-back triggers | Second is blocked |
| EQ-D065 | Worker processes items in FIFO order | Create 3, check order | Ordered by created_at ASC |
| EQ-D066 | Worker processes tenant-isolated items | Tenant A creates, worker checks public | Only public schema items processed |
| EQ-D067 | Worker error doesn't crash server | Worker throws | Caught, logged, server stays up |
| EQ-D068 | Stop worker on server shutdown | Graceful shutdown | clearInterval called |

## Email Queue — Full Lifecycle & State Transitions

| # | Test Case | Steps | Expected |
|---|---|---|---|
| EQ-D069 | Queue item lifecycle: create → pending → sent | POST email → worker processes | status transitions: pending → sent |
| EQ-D070 | Queue item lifecycle: create → pending → failed → retry → pending → sent | Add item, let fail, retry | Final status = sent |
| EQ-D071 | Queue item lifecycle: create → pending → cancel → terminal | Add item, cancel | status = cancelled (terminal) |
| EQ-D072 | Queue item lifecycle: create → pending → sent → retry | Add, send, then retry | Reset to pending again |
| EQ-D073 | Multiple items: mix of pending/sent/failed/cancelled | Create 4 with different states | All exist, stats correct |
| EQ-D074 | Retry after final failed attempt | Create, fail 3 times, retry | Resets to pending, attempts=0 |

## Integration with Payslips

| # | Test Case | Steps | Expected |
|---|---|---|---|
| EQ-D075 | Email payslip creates email_queue entry | POST `/api/payslips/:id/email` | 200, email_queue created with payslip_id | Admin |
| EQ-D076 | Email queue entry links to correct payslip | POST email | queue.payslip_id matches | Admin |
| EQ-D077 | Email queue entry has recipient_name from employee | POST email | queue.recipient_name = employee name | Admin |
| EQ-D078 | Email queue entry has subject | POST email | queue.subject not null | Admin |
| EQ-D079 | Email queue with explicit recipient_email | POST email with body | uses provided email | Admin |
| EQ-D080 | Email queue with missing recipient_email (falls back) | POST email without body | uses employee's email from DB | Admin |
| EQ-D081 | Email queue for non-existent payslip | POST `/api/payslips/999999/email` | 404, NotFoundError | Admin |
| EQ-D082 | Email queue as manager | POST `/api/payslips/:id/email` | 200 | Manager |
| EQ-D083 | Email queue as employee (own payslip) | POST `/api/payslips/:id/email` | 403 Forbidden | Employee |
| EQ-D084 | Email with invalid recipient_email | POST with bad email | 400, validation error | Admin |
| EQ-D085 | Email worker generates HTML email body | Worker runs | HTML has employee name, company branding | System |
| EQ-D086 | Email worker attaches PDF | Worker runs | PDF attachment included if pdf_path exists | System |
| EQ-D087 | Email worker handles missing PDF gracefully | pdf_path is null | Email sent without attachment | System |

## Export API — Integration

| # | Test Case | Method | Endpoint | Expected | Auth |
|---|---|---|---|---|---|
| EQ-D088 | Export payslips: CSV has all columns | GET | `/api/export/payslips` | 200, headers contain expected fields | Admin |
| EQ-D089 | Export payslips: filtered by run_id | GET | `/api/export/payslips?run_id=1` | 200, only run 1 data | Admin |
| EQ-D090 | Export payslips: filtered by month+year | GET | `/api/export/payslips?month=3&year=2026` | 200, filtered | Admin |
| EQ-D091 | Export payslips: combined filters | GET | `/api/export/payslips?run_id=1&month=3&year=2026&payment_status=paid` | 200, all filters applied | Admin |
| EQ-D092 | Export payslips: Content-Type is text/csv | GET | `/api/export/payslips` | 200, text/csv header | Admin |
| EQ-D093 | Export payslips: BOM prefix present | GET | `/api/export/payslips` | 200, first bytes = BOM | Admin |
| EQ-D094 | Export payslips: decimal values preserved | GET | `/api/export/payslips` | 200, numbers not truncated | Admin |
| EQ-D095 | Export runs: CSV with correct columns | GET | `/api/export/runs` | 200, proper CSV | Admin |
| EQ-D096 | Export runs: filtered by status | GET | `/api/export/runs?status=draft` | 200, filtered | Admin |
| EQ-D097 | Export runs: filtered by year | GET | `/api/export/runs?year=2026` | 200, filtered | Admin |
| EQ-D098 | Export earnings: with run_id | GET | `/api/export/earnings?run_id=1` | 200, CSV | Admin |
| EQ-D099 | Export earnings: missing run_id | GET | `/api/export/earnings` | 400, run_id required | Admin |
| EQ-D100 | Export earnings: empty run_id | GET | `/api/export/earnings?run_id=` | 400, run_id required | Admin |
| EQ-D101 | Export earnings: non-existent run_id | GET | `/api/export/earnings?run_id=999999` | 200, headers-only CSV | Admin |
| EQ-D102 | Export as employee (not authorized) | GET | `/api/export/payslips` | 403 Forbidden | Employee |
| EQ-D103 | Export without auth | GET | `/api/export/payslips` | 401 Unauthorized | None |

## Response Format & Standards Compliance

| # | Test Case | Endpoint | Expected |
|---|---|---|---|
| EQ-D104 | List queue response envelope | GET `/api/email-queue` | `{ success: true, data: [...], pagination: {...} }` |
| EQ-D105 | Stats response envelope | GET `/api/email-queue/stats` | `{ success: true, data: { pending, sent, failed, cancelled, total } }` |
| EQ-D106 | Retry response envelope | POST `/api/email-queue/:id/retry` | `{ success: true, message, data }` |
| EQ-D107 | Cancel response envelope | DELETE `/api/email-queue/:id` | `{ success: true, message, data }` |
| EQ-D108 | 401 error format | Any without auth | `{ success: false, message }` |
| EQ-D109 | 403 error format | As employee | `{ success: false, message }` |
| EQ-D110 | 404 error format | Non-existent ID | `{ success: false, message }` |

## Summary
- **List Queue**: 20 tests
- **Queue Stats**: 8 tests
- **Retry Queue Item**: 13 tests
- **Cancel Queue Item**: 11 tests
- **Queue Worker**: 16 tests
- **Lifecycle/State**: 6 tests
- **Integration with Payslips**: 13 tests
- **Export API**: 16 tests
- **Response Format**: 7 tests
- **Total**: **110 test cases**
