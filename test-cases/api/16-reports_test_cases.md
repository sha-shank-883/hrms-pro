# Reports Module - Test Cases (`/api/reports`)

| # | Test Case | Method | Endpoint | Expected Result | Auth |
|---|---|---|---|---|---|
| RPT-001 | Get dashboard stats | GET | `/api/reports/dashboard` | 200 OK, stats object | JWT |
| RPT-002 | Get dashboard without auth | GET | `/api/reports/dashboard` | 401 Unauthorized | None |
| RPT-003 | Dashboard stats include employee count | GET | `/api/reports/dashboard` | total_employees field | JWT |
| RPT-004 | Dashboard stats include attendance today | GET | `/api/reports/dashboard` | present_today field | JWT |
| RPT-005 | Dashboard stats include pending leaves | GET | `/api/reports/dashboard` | pending_leaves field | JWT |
| RPT-006 | Dashboard stats include department count | GET | `/api/reports/dashboard` | total_departments field | JWT |
| RPT-007 | Get attendance report (admin) | GET | `/api/reports/attendance` | 200 OK | Admin JWT |
| RPT-008 | Get attendance report (employee) | GET | `/api/reports/attendance` | 403 Forbidden | Employee JWT |
| RPT-009 | Attendance report with date range | GET | `/api/reports/attendance?start=2026-01-01&end=2026-03-31` | 200, filtered | Admin JWT |
| RPT-010 | Attendance report with department filter | GET | `/api/reports/attendance?department_id=1` | 200, filtered | Admin JWT |
| RPT-011 | Get leave report | GET | `/api/reports/leave` | 200 OK | Admin JWT |
| RPT-012 | Leave report with date range | GET | `/api/reports/leave?start=2026-01-01&end=2026-03-31` | 200, filtered | Admin JWT |
| RPT-013 | Leave report by department | GET | `/api/reports/leave?department_id=1` | 200, filtered | Admin JWT |
| RPT-014 | Get payroll report | GET | `/api/reports/payroll` | 200 OK | Admin JWT |
| RPT-015 | Payroll report with month/year | GET | `/api/reports/payroll?month=3&year=2026` | 200, filtered | Admin JWT |
| RPT-016 | Get employee report | GET | `/api/reports/employee` | 200 OK | Admin JWT |
| RPT-017 | Employee report with filters | GET | `/api/reports/employee?department_id=1` | 200, filtered | Admin JWT |
| RPT-018 | Get recruitment report | GET | `/api/reports/recruitment` | 200 OK | Admin JWT |
| RPT-019 | Get demographics report | GET | `/api/reports/employee-demographics` | 200 OK | Admin JWT |
| RPT-020 | Demographics by department | GET | `/api/reports/employee-demographics?department_id=1` | 200, filtered | Admin JWT |
| RPT-021 | Get attendance trends | GET | `/api/reports/attendance-trends` | 200 OK | Admin JWT |
| RPT-022 | Attendance trends with period | GET | `/api/reports/attendance-trends?period=monthly` | 200 | Admin JWT |
| RPT-023 | Get payroll trends | GET | `/api/reports/payroll-trends` | 200 OK | Admin JWT |
| RPT-024 | Payroll trends with period | GET | `/api/reports/payroll-trends?period=quarterly` | 200 | Admin JWT |
| RPT-025 | Get performance analytics | GET | `/api/reports/performance-analytics` | 200 OK | Admin JWT |
| RPT-026 | Get turnover prediction | GET | `/api/reports/turnover-prediction` | 200 OK | Admin JWT |
| RPT-027 | Get churn risk analysis | GET | `/api/reports/churn-risk` | 200 OK | Admin JWT |
| RPT-028 | Churn risk as employee | GET | `/api/reports/churn-risk` | 403 Forbidden | Employee JWT |
| RPT-029 | Churn risk as manager | GET | `/api/reports/churn-risk` | 403 Forbidden | Manager JWT |
| RPT-030 | Report response is consistent format | GET | `/api/reports/attendance` | `{ success, data }` | Admin JWT |
| RPT-031 | Report with invalid date range | GET | `/api/reports/attendance?start=invalid` | 400 | Admin JWT |
| RPT-032 | Report with end before start | GET | `/api/reports/attendance?start=2026-03-31&end=2026-01-01` | 400 or swapped | Admin JWT |
| RPT-033 | Payroll trends with month filter | GET | `/api/reports/payroll-trends?start_month=1&end_month=6&year=2026` | 200 | Admin JWT |
| RPT-034 | Reports with non-existent department | GET | `/api/reports/attendance?department_id=99999` | 200, empty data | Admin JWT |
| RPT-035 | All reports without auth | GET | `/api/reports/*` | 401 Unauthorized | None |
| RPT-036 | Dashboard stats as employee | GET | `/api/reports/dashboard` | 200, employee-specific stats | Employee JWT |
| RPT-037 | Recruitment report with date range | GET | `/api/reports/recruitment?start=2026-01-01&end=2026-03-31` | 200 | Admin JWT |
| RPT-038 | Demographics report format | GET | `/api/reports/employee-demographics` | Age, gender, dept breakdown | Admin JWT |
| RPT-039 | Performance analytics empty data | GET | `/api/reports/performance-analytics` | 200, default values | Admin JWT |
| RPT-040 | Turnover prediction format | GET | `/api/reports/turnover-prediction` | Prediction score array | Admin JWT |
| RPT-041 | Churn risk format | GET | `/api/reports/churn-risk` | Risk list with scores | Admin JWT |
| RPT-042 | Payroll report totals | GET | `/api/reports/payroll` | total_paid, total_pending fields | Admin JWT |
| RPT-043 | Leave report totals | GET | `/api/reports/leave` | approved, pending, rejected counts | Admin JWT |
| RPT-044 | Attendance report totals | GET | `/api/reports/attendance` | present, absent, late counts | Admin JWT |
| RPT-045 | SQL injection in report filters | GET | `/api/reports/attendance?department_id=1 OR 1=1` | Parameterized, safe | Admin JWT |
| RPT-046 | Tenant isolation on reports | GET | `/api/reports/dashboard` | Own tenant data only | Cross-tenant |
| RPT-047 | Report export (PDF/CSV) | GET | `/api/reports/attendance?export=csv` | 200, file download | Admin JWT |
| RPT-048 | Report with pagination | GET | `/api/reports/attendance?page=1&limit=10` | 200 with pagination | Admin JWT |
| RPT-049 | Payroll trends: month-over-month comparison | GET | `/api/reports/payroll-trends` | MoM change fields | Admin JWT |
| RPT-050 | Attendance trends: daily/weekly/monthly | GET | `/api/reports/attendance-trends?period=daily` | 200, correct granularity | Admin JWT |
| RPT-051 | Report responses cached or fast | GET | `/api/reports/dashboard` | Response < 2s | JWT |
| RPT-052 | Report errors return proper format | GET | `/api/reports/attendance?start=bad` | `{ success: false, message }` | Admin JWT |
| RPT-053 | All report endpoints accessible | GET | All 13 report endpoints | 200 for each | Admin JWT |
| RPT-054 | Rate limiting on reports | GET | `/api/reports/dashboard` (rapid) | 429 after threshold | JWT |
| RPT-055 | Dashboard stats include quick action counts | GET | `/api/reports/dashboard` | pending_actions or similar | JWT |

---

**Total: 55 test cases**
