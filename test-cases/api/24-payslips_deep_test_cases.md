# Deep Payslips API Test Cases — 100+ Tests

## Generate Payslip (POST /api/payslips/generate)

| # | Test Case | Body | Expected | Auth |
|---|---|---|---|---|
| PS-D001 | Generate with employee_id, month, year | `{employee_id, month, year}` | 201, payslip created with earnings + deductions | Admin |
| PS-D002 | Generate with run_id (attach to existing run) | `{run_id, employee_id, month, year}` | 201, payslip.run_id = provided | Admin |
| PS-D003 | Generate without run_id (auto-creates draft run) | `{employee_id, month, year}` | 201, auto-run created, run_id in response | Admin |
| PS-D004 | Generate second payslip in same month (auto-uses existing draft run) | `{employee_id, month, year}` x2 | Both same run_id | Admin |
| PS-D005 | Generate with missing employee_id | `{month, year}` | 400, ValidationError | Admin |
| PS-D006 | Generate with missing month | `{employee_id, year}` | 400, ValidationError | Admin |
| PS-D007 | Generate with missing year | `{employee_id, month}` | 400, ValidationError | Admin |
| PS-D008 | Generate with empty body | `{}` | 400, ValidationError | Admin |
| PS-D009 | Generate duplicate (same employee+period+run) | `{run_id, employee_id, month, year}` x2 | 409, ConflictError | Admin |
| PS-D010 | Generate duplicate in different run (cross-run) | `{employee_id, month, year}` then `{employee_id, month, year}` | 2nd creates new run (no conflict, different run) | Admin |
| PS-D011 | Generate for employee with zero salary | `{employee_id: zero_salary_emp, month, year}` | 201, payslip with 0 values | Admin |
| PS-D012 | Generate for non-existent employee | `{employee_id: 999999, month, year}` | 500 or 404 (employee not found) | Admin |
| PS-D013 | Generate with month=0 (invalid) | `{employee_id, month:0, year}` | 500 or 201 (month out of range) | Admin |
| PS-D014 | Generate with month=13 (invalid) | `{employee_id, month:13, year}` | 500 or 201 | Admin |
| PS-D015 | Generate with year=1900 (historic) | `{employee_id, month, year:1900}` | 201, payslip generated | Admin |
| PS-D016 | Generate with year=2100 (future) | `{employee_id, month, year:2100}` | 201, payslip generated | Admin |
| PS-D017 | Generate as manager | Valid body | 201 | Manager |
| PS-D018 | Generate as employee | Valid body | 403 Forbidden | Employee |
| PS-D019 | Generate without auth | Valid body | 401 Unauthorized | None |
| PS-D020 | Generate triggers audit log | Valid body | 201, audit_log has GENERATE_PAYSLIP | Admin |
| PS-D021 | Generate response includes payslip_id, run_id, pdf_path | Valid body | 201, data has all fields | Admin |
| PS-D022 | Generate creates payslip_earnings rows | Valid body | 201, earnings table has rows | Admin |
| PS-D023 | Generate creates payslip_deductions rows | Valid body | 201, deductions table has rows | Admin |
| PS-D024 | Generate updates payroll_runs totals | Valid body | 201, run totals incremented | Admin |
| PS-D025 | Generate: payslip has basic_salary from employee | Valid body | 201, basic_salary matches employee.salary | Admin |
| PS-D026 | Generate: payslip has gross_pay calculated | Valid body | 201, gross_pay >= basic_salary | Admin |
| PS-D027 | Generate: payslip has net_pay = gross - deductions | Valid body | 201, net_pay = gross_pay - total_deductions | Admin |
| PS-D028 | Generate creates PDF file on disk | Valid body | 201, pdf_path exists as file | Admin |
| PS-D029 | Generate PDF is valid (starts with %PDF) | Valid body | 201, file starts with `%PDF` | Admin |
| PS-D030 | Generate with SQL injection in employee_id | `{employee_id: "1 OR 1=1"}` | 500 or 400 (not int) | Admin |

## Bulk Generate Payslips (POST /api/payslips/generate-bulk)

| # | Test Case | Body | Expected | Auth |
|---|---|---|---|---|
| PS-D031 | Bulk generate for all employees | `{month, year}` | 200, results array with success per employee | Admin |
| PS-D032 | Bulk generate with run_id | `{run_id, month, year}` | 200, all in same run | Admin |
| PS-D033 | Bulk generate without run_id (auto-creates) | `{month, year}` | 200, auto-creates draft run | Admin |
| PS-D034 | Bulk generate with missing month | `{year}` | 400, ValidationError | Admin |
| PS-D035 | Bulk generate with missing year | `{month}` | 400, ValidationError | Admin |
| PS-D036 | Bulk generate when no employees exist | `{month, year}` | 404, no employees found | Admin |
| PS-D037 | Bulk generate second time (skips existing) | `{month, year}` x2 | 200, second has 'skipped' results | Admin |
| PS-D038 | Bulk generate as manager | Valid body | 200 | Manager |
| PS-D039 | Bulk generate as employee | Valid body | 403 Forbidden | Employee |
| PS-D040 | Bulk generate without auth | Valid body | 401 | None |
| PS-D041 | Bulk generate triggers audit log | Valid body | 200, audit_log has GENERATE_BULK_PAYSLIPS | Admin |
| PS-D042 | Bulk generate response has success/skipped/errors counts | Valid body | 200, data has counts | Admin |
| PS-D043 | Bulk generate creates PDFs for all employees | Valid body | 200, all pdf_paths exist | Admin |
| PS-D044 | Bulk generate: run totals match SUM | Valid body | 200, run totals = sum of all payslips | Admin |
| PS-D045 | Bulk generate: partial failure (one employee errors) | Valid body | 200, errors array has entry, others success | Admin |

## List Payslips (GET /api/payslips)

| # | Test Case | Params | Expected | Auth |
|---|---|---|---|---|
| PS-D046 | List all payslips (admin) | None | 200, paginated list | Admin |
| PS-D047 | List payslips filtered by run_id | `?run_id=1` | 200, only run 1 | Admin |
| PS-D048 | List payslips filtered by employee_id | `?employee_id=1` | 200, only employee 1 | Admin |
| PS-D049 | List payslips filtered by payment_status=paid | `?payment_status=paid` | 200, only paid | Admin |
| PS-D050 | List payslips with all filters combined | `?run_id=1&employee_id=1&payment_status=paid` | 200, all filters applied | Admin |
| PS-D051 | List payslips as employee (own only) | None | 200, only own payslips | Employee |
| PS-D052 | List payslips as employee with run_id filter | `?run_id=1` | 200, only own in that run | Employee |
| PS-D053 | List payslips pagination page=1 limit=3 | `?page=1&limit=3` | 200, 3 items, pagination | Admin |
| PS-D054 | List payslips page beyond data | `?page=999` | 200, empty array | Admin |
| PS-D055 | List payslips empty state | None (no payslips) | 200, totalItems=0 | Admin |
| PS-D056 | List payslips as manager | None | 200, full list | Manager |
| PS-D057 | List payslips without auth | None | 401 | None |
| PS-D058 | List payslips has employee_name, department_name | None | 200, items have name + dept | Admin |
| PS-D059 | List payslips sorted DESC by generated_at | None | 200, newest first | Admin |
| PS-D060 | List payslips with invalid payment_status | `?payment_status=INVALID` | 200, empty array | Admin |

## Get Payslip Detail (GET /api/payslips/:id)

| # | Test Case | Expected | Auth |
|---|---|---|---|
| PS-D061 | Get payslip by valid ID | 200, full payslip with earnings + deductions arrays | Admin |
| PS-D062 | Get payslip detail has employee info (name, email, position) | 200, employee fields present | Admin |
| PS-D063 | Get payslip detail has period info (month, year) | 200, period_month, period_year present | Admin |
| PS-D064 | Get payslip detail has run_status | 200, run_status from payroll_runs | Admin |
| PS-D065 | Get payslip detail: earnings sorted by sort_order | 200, earnings array ordered | Admin |
| PS-D066 | Get payslip detail: deductions sorted by sort_order | 200, deductions array ordered | Admin |
| PS-D067 | Get payslip detail as employee (own) | 200, full detail | Employee |
| PS-D068 | Get payslip detail as employee (another's) | 403 Forbidden | Employee |
| PS-D069 | Get payslip detail as manager | 200, any payslip | Manager |
| PS-D070 | Get non-existent payslip | 404, NotFoundError | Admin |
| PS-D071 | Get payslip without auth | 401 | None |
| PS-D072 | Get payslip: decimal values are numbers, not strings | 200, basic_salary, gross_pay are numeric | Admin |
| PS-D073 | Get payslip: payment_status maps to string | 200, status is string | Admin |
| PS-D074 | Get payslip: verified is boolean | 200, verified is boolean | Admin |

## Download Payslip PDF (GET /api/payslips/:id/pdf)

| # | Test Case | Expected | Auth |
|---|---|---|---|
| PS-D075 | Download PDF for payslip that has pdf_path | 200, file download with correct headers | Admin |
| PS-D076 | Download PDF: Content-Type is application/pdf | 200, proper Content-Type | Admin |
| PS-D077 | Download PDF: Content-Disposition is attachment | 200, attachment with filename | Admin |
| PS-D078 | Download PDF as employee (own) | 200, download | Employee |
| PS-D079 | Download PDF as employee (another's) | 403 Forbidden | Employee |
| PS-D080 | Download PDF for payslip without pdf_path | 404, file not found | Admin |
| PS-D081 | Download PDF for non-existent payslip | 404, NotFoundError | Admin |
| PS-D082 | Download PDF without auth | 401 | None |

## Verify Payslip (GET /api/payslips/:id/verify)

| # | Test Case | Expected | Auth |
|---|---|---|---|
| PS-D083 | Verify a paid payslip | 200, verified=true | Admin |
| PS-D084 | Verify a draft/pending payslip | 200, verified=false | Admin |
| PS-D085 | Verify a payslip in paid run | 200, verified=true (run status=paid) | Admin |
| PS-D086 | Verify a payslip in archived run | 200, verified=true (archived counts) | Admin |
| PS-D087 | Verify non-existent payslip | 404, NotFoundError | Admin |
| PS-D088 | Verify as employee (own) | 200, result | Employee |
| PS-D089 | Verify as employee (another's) | 403 Forbidden | Employee |
| PS-D090 | Verify without auth | 401 | None |
| PS-D091 | Verify response includes employee_name, period, net_pay | 200, all fields present | Admin |
| PS-D092 | Verify response: verified is boolean | 200, boolean | Admin |
| PS-D093 | Verify uses getMonthName for period display | 200, period has month name not number | Admin |

## Email Payslip (POST /api/payslips/:id/email)

| # | Test Case | Body | Expected | Auth |
|---|---|---|---|---|
| PS-D094 | Email payslip to recipient_email | `{recipient_email: "a@b.com"}` | 200, queued | Admin |
| PS-D095 | Email payslip without body (uses employee email) | `{}` | 200, queued with emp email | Admin |
| PS-D096 | Email payslip with invalid email | `{recipient_email: "not-email"}` | 400, validation error | Admin |
| PS-D097 | Email payslip as manager | Valid body | 200 | Manager |
| PS-D098 | Email payslip as employee | Valid body | 403 Forbidden | Employee |
| PS-D099 | Email payslip for non-existent payslip | Valid body | 404 | Admin |
| PS-D100 | Email payslip without auth | Valid body | 401 | None |
| PS-D101 | Email payslip triggers audit log | Valid body | 200, audit_log has EMAIL_PAYSLIP | Admin |
| PS-D102 | Email payslip creates email_queue entry | Valid body | 200, email_queue table has new row | Admin |

## Cross-Tenant Isolation

| # | Test Case | Expected |
|---|---|---|
| PS-D103 | Tenant A generates payslip, Tenant B cannot see it | Tenant B list is empty or different |
| PS-D104 | Tenant A downloads payslip, Tenant B gets 404 | Not found |
| PS-D105 | Tenant A verifies payslip, Tenant B gets 404 | Not found |

## Edge Cases

| # | Test Case | Expected |
|---|---|---|
| PS-D106 | Payslip with multiple earnings components (10+) | All saved correctly |
| PS-D107 | Payslip with multiple deduction components (10+) | All saved correctly |
| PS-D108 | Generate payslip concurrently for same employee (race) | One succeeds (201), one conflicts (409) |
| PS-D109 | Generate bulk with 50 employees | All processed, performance acceptable |
| PS-D110 | Download payslip PDF after file manually deleted | 404, filesystem check fails gracefully |
| PS-D111 | Payslip amount precision (decimal places) | Values stored with 2 decimal precision |

## Summary
- **Generate Payslip**: 30 tests
- **Bulk Generate**: 15 tests
- **List Payslips**: 15 tests
- **Get Payslip Detail**: 14 tests
- **Download PDF**: 8 tests
- **Verify Payslip**: 11 tests
- **Email Payslip**: 9 tests
- **Cross-Tenant**: 3 tests
- **Edge Cases**: 6 tests
- **Total**: **111 test cases**
