# Payroll V2 — Advanced Payslip System (`/api/payroll-runs`, `/api/payslip-templates`, `/api/payslips`)

## Endpoints

### Payroll Runs (`/api/payroll-runs`)
| # | Test Case | Method | Endpoint | Expected | Auth |
|---|---|---|---|---|---|
| PR-001 | List payroll runs (admin) | GET | `/api/payroll-runs` | 200, runs array | Admin JWT |
| PR-002 | List runs with status filter | GET | `/api/payroll-runs?status=draft` | 200, filtered | Admin JWT |
| PR-003 | List runs with year filter | GET | `/api/payroll-runs?year=2026` | 200, filtered | JWT |
| PR-004 | List runs with pagination | GET | `/api/payroll-runs?page=1&limit=5` | 200, pagination | JWT |
| PR-005 | List runs as employee | GET | `/api/payroll-runs` | 403 Forbidden | Employee JWT |
| PR-006 | Get run by ID | GET | `/api/payroll-runs/:id` | 200, run + payslips | Admin JWT |
| PR-007 | Get run by non-existent ID | GET | `/api/payroll-runs/:id` | 404 Not Found | Admin JWT |
| PR-008 | Get run as employee (if has payslip in run) | GET | `/api/payroll-runs/:id` | 200 (if linked) | Employee JWT |
| PR-009 | Get run without auth | GET | `/api/payroll-runs/:id` | 401 Unauthorized | None |
| PR-010 | Create payroll run | POST | `/api/payroll-runs` | 201, status=draft | Admin JWT |
| PR-011 | Create run as manager | POST | `/api/payroll-runs` | 403 Forbidden | Manager JWT |
| PR-012 | Create run with missing month | POST | `/api/payroll-runs` | 400 Validation error | Admin JWT |
| PR-013 | Create duplicate run (same period) | POST | `/api/payroll-runs` | 409 Conflict | Admin JWT |
| PR-014 | Finalize payroll run | PUT | `/api/payroll-runs/:id/finalize` | 200, status=finalized | Admin JWT |
| PR-015 | Finalize already finalized run | PUT | `/api/payroll-runs/:id/finalize` | 400 Validation error | Admin JWT |
| PR-016 | Finalize non-existent run | PUT | `/api/payroll-runs/:id/finalize` | 404 Not Found | Admin JWT |
| PR-017 | Process payment for run | PUT | `/api/payroll-runs/:id/pay` | 200, status=paid, payslips updated | Admin JWT |
| PR-018 | Process payment without finalizing first | PUT | `/api/payroll-runs/:id/pay` | 400 Cannot pay draft | Admin JWT |
| PR-019 | Archive finalized/paid run | PUT | `/api/payroll-runs/:id/archive` | 200, status=archived | Admin JWT |
| PR-020 | Archive draft run | PUT | `/api/payroll-runs/:id/archive` | 400 Cannot archive draft | Admin JWT |
| PR-021 | Delete draft run | DELETE | `/api/payroll-runs/:id` | 200, deleted | Admin JWT |
| PR-022 | Delete finalized run | DELETE | `/api/payroll-runs/:id` | 400 Cannot delete | Admin JWT |
| PR-023 | Delete non-existent run | DELETE | `/api/payroll-runs/:id` | 404 Not Found | Admin JWT |

### Payslip Templates (`/api/payslip-templates`)
| # | Test Case | Method | Endpoint | Expected | Auth |
|---|---|---|---|---|---|
| PT-001 | List templates | GET | `/api/payslip-templates` | 200, templates array | Admin JWT |
| PT-002 | List templates as employee | GET | `/api/payslip-templates` | 403 Forbidden | Employee JWT |
| PT-003 | Get template by ID | GET | `/api/payslip-templates/:id` | 200, template detail | JWT |
| PT-004 | Get non-existent template | GET | `/api/payslip-templates/:id` | 404 Not Found | JWT |
| PT-005 | Create template | POST | `/api/payslip-templates` | 201, template created | Admin JWT |
| PT-006 | Create template as manager | POST | `/api/payslip-templates` | 403 Forbidden | Manager JWT |
| PT-007 | Create template without name | POST | `/api/payslip-templates` | 400 Validation error | Admin JWT |
| PT-008 | Update template | PUT | `/api/payslip-templates/:id` | 200, template updated | Admin JWT |
| PT-009 | Update non-existent template | PUT | `/api/payslip-templates/:id` | 404 Not Found | Admin JWT |
| PT-010 | Set template as default | PUT | `/api/payslip-templates/:id/set-default` | 200, default updated | Admin JWT |
| PT-011 | Delete template | DELETE | `/api/payslip-templates/:id` | 200, deleted | Admin JWT |
| PT-012 | Delete non-existent template | DELETE | `/api/payslip-templates/:id` | 404 Not Found | Admin JWT |

### Payslips (`/api/payslips`)
| # | Test Case | Method | Endpoint | Expected | Auth |
|---|---|---|---|---|---|
| PS-001 | Generate payslip for employee | POST | `/api/payslips/generate` | 201, payslip + PDF | Admin JWT |
| PS-002 | Generate payslip as employee | POST | `/api/payslips/generate` | 403 Forbidden | Employee JWT |
| PS-003 | Generate payslip without employee_id | POST | `/api/payslips/generate` | 400 Validation error | Admin JWT |
| PS-004 | Generate payslip for non-existent employee | POST | `/api/payslips/generate` | 404 Not Found | Admin JWT |
| PS-005 | Generate duplicate payslip | POST | `/api/payslips/generate` | 409 Conflict | Admin JWT |
| PS-006 | Generate bulk payslips | POST | `/api/payslips/generate-bulk` | 200, summary | Admin JWT |
| PS-007 | Bulk generate as employee | POST | `/api/payslips/generate-bulk` | 403 Forbidden | Employee JWT |
| PS-008 | Bulk generate missing month | POST | `/api/payslips/generate-bulk` | 400 Validation error | Admin JWT |
| PS-009 | List payslips | GET | `/api/payslips` | 200, payslips array | Admin JWT |
| PS-010 | List payslips (employee sees own) | GET | `/api/payslips` | 200, own only | Employee JWT |
| PS-011 | List payslips filtered by run_id | GET | `/api/payslips?run_id=1` | 200, filtered | JWT |
| PS-012 | List payslips with pagination | GET | `/api/payslips?page=1&limit=10` | 200, pagination | JWT |
| PS-013 | Get payslip detail | GET | `/api/payslips/:id` | 200, detail + earnings/deductions | JWT |
| PS-014 | Get non-existent payslip | GET | `/api/payslips/:id` | 404 Not Found | JWT |
| PS-015 | Download payslip PDF | GET | `/api/payslips/:id/pdf` | 200, PDF file download | JWT |
| PS-016 | Download PDF for non-existent payslip | GET | `/api/payslips/:id/pdf` | 404 Not Found | JWT |
| PS-017 | Queue payslip for email | POST | `/api/payslips/:id/email` | 200, queued | Admin JWT |
| PS-018 | Email for non-existent payslip | POST | `/api/payslips/:id/email` | 404 Not Found | Admin JWT |
| PS-019 | Verify payslip (authenticated) | GET | `/api/payslips/:id/verify` | 200, verified status | JWT |
| PS-020 | Verify non-existent payslip | GET | `/api/payslips/:id/verify` | 404 Not Found | JWT |
| PS-021 | Payslip detail includes earnings breakdown | GET | `/api/payslips/:id` | earnings array with components | JWT |
| PS-022 | Payslip detail includes deductions breakdown | GET | `/api/payslips/:id` | deductions array with components | JWT |
| PS-023 | Payslip PDF is valid and downloadable | GET | `/api/payslips/:id/pdf` | Content-Type: application/pdf | JWT |

### Security & Edge Cases
| # | Test Case | Method | Endpoint | Expected | Auth |
|---|---|---|---|---|---|
| SEC-001 | Payslip generation uses parameterized queries | POST | `/api/payslips/generate` | No SQL injection | Admin JWT |
| SEC-002 | Tenant isolation: payslips isolated by tenant | GET | `/api/payslips` | Only own tenant data | Cross-tenant |
| SEC-003 | Employee cannot view other's payslip | GET | `/api/payslips/:id` | 403/404 for other's data | Employee JWT |
| SEC-004 | Unauthenticated access blocked | GET | `/api/payslips` | 401 Unauthorized | None |
| SEC-005 | Response format: standard envelope | GET | `/api/payslips` | `{ success, data }` | JWT |

## Summary
- **Payroll Runs**: 23 test cases
- **Payslip Templates**: 12 test cases
- **Payslips**: 23 test cases
- **Security**: 5 test cases
- **Total**: 63 test cases
