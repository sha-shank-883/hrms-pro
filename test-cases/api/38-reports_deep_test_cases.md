# Reports Module — Deep API Test Cases (105 tests)

## 1.1 Dashboard Reports — 10 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| R1 | Get dashboard data | GET | `/api/reports/dashboard` | Admin/manager | 200 | Dashboard object |
| R2 | Dashboard without auth | GET | `/api/reports/dashboard` | No token | 401 | Unauthorized |
| R3 | Dashboard as employee | GET | `/api/reports/dashboard` | Employee token | 200 | Employee view |
| R4 | Dashboard includes employee count | GET | `/api/reports/dashboard` | Admin | 200 | `total_employees` |
| R5 | Dashboard includes attendance stats | GET | `/api/reports/dashboard` | Admin | 200 | `attendance_today` |
| R6 | Dashboard includes leave stats | GET | `/api/reports/dashboard` | Admin | 200 | `leaves_pending` |
| R7 | Dashboard includes payroll summary | GET | `/api/reports/dashboard` | Admin | 200 | `payroll_month` |
| R8 | Dashboard includes department breakdown | GET | `/api/reports/dashboard` | Admin | 200 | `departments` |
| R9 | Dashboard cross-tenant | GET | `/api/reports/dashboard` | Wrong tenant | 403 | Blocked |
| R10 | Dashboard as manager (team view) | GET | `/api/reports/dashboard` | Manager | 200 | Team-specific |

## 1.2 Attendance Reports — 15 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| R11 | Get attendance report | GET | `/api/reports/attendance` | Admin/manager | 200 | Report data |
| R12 | Attendance report with date range | GET | `/api/reports/attendance?from=2025-01-01&to=2025-01-31` | Valid auth | 200 | Filtered |
| R13 | Attendance report with department filter | GET | `/api/reports/attendance?department_id=1` | Valid auth | 200 | By dept |
| R14 | Attendance report with employee filter | GET | `/api/reports/attendance?employee_id=1` | Valid auth | 200 | By employee |
| R15 | Attendance report includes present/absent/late | GET | `/api/reports/attendance` | Valid auth | 200 | Status breakdown |
| R16 | Attendance report includes percentages | GET | `/api/reports/attendance` | Valid auth | 200 | `attendance_pct` |
| R17 | Attendance report without auth | GET | `/api/reports/attendance` | No token | 401 | Unauthorized |
| R18 | Attendance report as employee | GET | `/api/reports/attendance` | Employee | 200 | Self only |
| R19 | Attendance trends report | GET | `/api/reports/attendance-trends` | Admin | 200 | Trend data |
| R20 | Attendance trends by month | GET | `/api/reports/attendance-trends?months=12` | Admin | 200 | 12-month trend |
| R21 | Attendance trends without auth | GET | `/api/reports/attendance-trends` | No token | 401 | Unauthorized |
| R22 | Attendance export CSV | GET | `/api/reports/attendance/export?format=csv` | Admin | 200 | CSV file |
| R23 | Attendance export PDF | GET | `/api/reports/attendance/export?format=pdf` | Admin | 200 | PDF file |
| R24 | Attendance export wrong format | GET | `/api/reports/attendance/export?format=xml` | Admin | 400 | Invalid format |
| R25 | Attendance summary by employee | GET | `/api/reports/attendance/summary` | Admin | 200 | Per-employee |

## 1.3 Leave Reports — 10 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| R26 | Get leave report | GET | `/api/reports/leaves` | Admin | 200 | Report |
| R27 | Leave report date range | GET | `/api/reports/leaves?from=2025-01-01&to=2025-03-31` | Valid auth | 200 | Filtered |
| R28 | Leave report by department | GET | `/api/reports/leaves?department_id=1` | Valid auth | 200 | Dept filter |
| R29 | Leave report by type | GET | `/api/reports/leaves?leave_type_id=1` | Valid auth | 200 | Type filter |
| R30 | Leave report includes pending/approved/rejected | GET | `/api/reports/leaves` | Valid auth | 200 | Status breakdown |
| R31 | Leave report includes balance info | GET | `/api/reports/leaves` | Valid auth | 200 | Balance data |
| R32 | Leave report without auth | GET | `/api/reports/leaves` | No token | 401 | Unauthorized |
| R33 | Leave report as employee | GET | `/api/reports/leaves` | Employee | 200 | Self only |
| R34 | Leave utilization report | GET | `/api/reports/leaves/utilization` | Admin | 200 | % utilization |
| R35 | Leave forecast | GET | `/api/reports/leaves/forecast` | Admin | 200 | Predicted |

## 1.4 Payroll Reports — 10 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| R36 | Get payroll report | GET | `/api/reports/payroll` | Admin | 200 | Payroll data |
| R37 | Payroll report by month | GET | `/api/reports/payroll?month=1&year=2025` | Valid auth | 200 | Monthly |
| R38 | Payroll report by department | GET | `/api/reports/payroll?department_id=1` | Valid auth | 200 | Dept filter |
| R39 | Payroll report includes totals | GET | `/api/reports/payroll` | Valid auth | 200 | Sum of salaries |
| R40 | Payroll report includes department breakdown | GET | `/api/reports/payroll` | Valid auth | 200 | Per dept totals |
| R41 | Payroll report without auth | GET | `/api/reports/payroll` | No token | 401 | Unauthorized |
| R42 | Payroll report as manager | GET | `/api/reports/payroll` | Manager | 200 | Team filter |
| R43 | Payroll trends report | GET | `/api/reports/payroll-trends` | Admin | 200 | Monthly trends |
| R44 | Payroll trends by year | GET | `/api/reports/payroll-trends?year=2025` | Admin | 200 | Year trend |
| R45 | Payroll trends without auth | GET | `/api/reports/payroll-trends` | No token | 401 | Unauthorized |

## 1.5 Employee Reports — 8 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| R46 | Get employee report | GET | `/api/reports/employees` | Admin | 200 | Employee data |
| R47 | Employee report by department | GET | `/api/reports/employees?department_id=1` | Admin | 200 | Dept filter |
| R48 | Employee report includes headcount | GET | `/api/reports/employees` | Admin | 200 | Total count |
| R49 | Employee report includes gender ratio | GET | `/api/reports/employees` | Admin | 200 | Gender breakdown |
| R50 | Employee report includes tenure | GET | `/api/reports/employees` | Admin | 200 | Tenure data |
| R51 | Employee demographics report | GET | `/api/reports/demographics` | Admin | 200 | Demographics |
| R52 | Employee report without auth | GET | `/api/reports/employees` | No token | 401 | Unauthorized |
| R53 | Employee report as manager | GET | `/api/reports/employees` | Manager | 200 | Team only |

## 1.6 Recruitment Reports — 5 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| R54 | Get recruitment report | GET | `/api/reports/recruitment` | Admin | 200 | Recruitment data |
| R55 | Recruitment report includes open positions | GET | `/api/reports/recruitment` | Admin | 200 | Jobs count |
| R56 | Recruitment report includes applications | GET | `/api/reports/recruitment` | Admin | 200 | App count |
| R57 | Recruitment report includes time-to-hire | GET | `/api/reports/recruitment` | Admin | 200 | Avg days |
| R58 | Recruitment report without auth | GET | `/api/reports/recruitment` | No token | 401 | Unauthorized |

## 1.7 Advanced Analytics — 15 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| R59 | Churn risk prediction | GET | `/api/reports/churn-risk` | Admin | 200 | Churn data |
| R60 | Churn risk includes risk scores | GET | `/api/reports/churn-risk` | Admin | 200 | `risk_score` per employee |
| R61 | Churn risk by department | GET | `/api/reports/churn-risk?department_id=1` | Admin | 200 | Dept churn |
| R62 | Churn risk without auth | GET | `/api/reports/churn-risk` | No token | 401 | Unauthorized |
| R63 | Churn risk as employee | GET | `/api/reports/churn-risk` | Employee | 403 | Forbidden |
| R64 | Turnover prediction | GET | `/api/reports/turnover-prediction` | Admin | 200 | Prediction |
| R65 | Performance analytics | GET | `/api/reports/performance-analytics` | Admin | 200 | Performance |
| R66 | Performance analytics by department | GET | `/api/reports/performance-analytics?department_id=1` | Admin | 200 | Dept perf |
| R67 | Performance analytics without auth | GET | `/api/reports/performance-analytics` | No token | 401 | Unauthorized |
| R68 | Cross-tenant analytics | GET | `/api/reports/churn-risk` | Wrong tenant | 403 | Blocked |
| R69 | Analytics date range | GET | `/api/reports/performance-analytics?from=2025-01-01&to=2025-03-31` | Admin | 200 | Range |
| R70 | Employees demographics report | GET | `/api/reports/demographics` | Admin | 200 | Age, gender, dept |
| R71 | Demographics without auth | GET | `/api/reports/demographics` | No token | 401 | Unauthorized |
| R72 | Reporting rate limiting | GET | `/api/reports/*` x 100 | Admin | 429 | Rate limited |
| R73 | Advanced analytics export | GET | `/api/reports/churn-risk/export?format=csv` | Admin | 200 | CSV export |

## 1.8 Authorization — 15 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| R74 | Admin can access all reports | GET | All report endpoints | Admin | 200 | Full |
| R75 | Manager can access team reports | GET | Attendance/leave/payroll | Manager | 200 | Team scope |
| R76 | Manager cannot access advanced analytics | GET | Churn-risk | Manager | 403 | Restricted |
| R77 | Manager cannot access all-employee reports | GET | Employee report | Manager | 403 | Team only |
| R78 | Employee can access own data only | GET | Reports | Employee | 200 | Self reports |
| R79 | Employee cannot access department reports | GET | Reports?department_id= | Employee | 403 | Blocked |
| R80 | Employee cannot access payroll reports | GET | `/api/reports/payroll` | Employee | 403 | Forbidden |
| R81 | Cross-tenant report access | GET | Report endpoints | Wrong tenant | 403 | Blocked |
| R82 | Super Admin full access all | GET | All reports | Super admin | 200 | Unrestricted |
| R83 | Mass assignment protection | GET | Reports | Extra query params | 200 | Ignored |
| R84 | SQL injection in report params | GET | `/api/reports/attendance?from=' UNION...` | Valid token | 200 | Sanitized |
| R85 | Date param injection | GET | `/api/reports/attendance?from=2025-01-01; DROP TABLE` | Valid token | 400 | Sanitized |
| R86 | Report with invalid date format | GET | `/api/reports/attendance?from=01/01/2025` | Valid token | 400 | Invalid date |
| R87 | Report with future date range | GET | `/api/reports/attendance?from=2099-01-01&to=2099-12-31` | Valid auth | 200 | Empty or 0 |
| R88 | Report with page out of range | GET | `/api/reports/attendance?page=10000` | Valid auth | 200 | Empty |

## 1.9 Edge Cases — 17 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| R89 | Empty data report | GET | `/api/reports/attendance?from=2020-01-01&to=2020-01-02` | Fresh tenant | 200 | Empty arrays |
| R90 | Report with 0 employees | GET | `/api/reports/employees` | No employees | 200 | Zero counts |
| R91 | Report with 1000+ employees | POST x1000 → GET | Large dataset | Populate then report | 200 | Handles scale |
| R92 | Attendance report with no records | GET | `/api/reports/attendance` | No attendance | 200 | Zero data |
| R93 | Payroll report with no runs | GET | `/api/reports/payroll` | No payroll | 200 | Zero data |
| R94 | Demographics with few employees | GET | `/api/reports/demographics` | 1-2 employees | 200 | Works |
| R95 | Report includes date headers | GET | `/api/reports/attendance` | Valid auth | 200 | Dates present |
| R96 | Report includes totals row | GET | `/api/reports/attendance` | Valid auth | 200 | Sum fields |
| R97 | CSV export special characters | GET | `/api/reports/attendance/export?format=csv` | Unicode names | 200 | Proper encoding |
| R98 | PDF export format | GET | `/api/reports/attendance/export?format=pdf` | Valid auth | 200 | Content-Type: pdf |
| R99 | Report cache behavior | GET | `/api/reports/dashboard` | Repeated calls | 200 | Cache header/hit |
| R100 | Report with sort parameter | GET | `/api/reports/attendance?sort=employee_name` | Valid auth | 200 | Sorted |
| R101 | Report with group by parameter | GET | `/api/reports/attendance?group_by=department` | Valid auth | 200 | Grouped |
| R102 | Report compare periods | GET | `/api/reports/attendance?compare_from=2024-01&compare_to=2025-01` | Admin | 200 | Comparison |
| R103 | Report cross-tenant isolation verification | GET x2 | Same endpoint | Tenant A then Tenant B | 200 each | Different data |
| R104 | Report with include/exclude fields | GET | `/api/reports/attendance?fields=present,absent,total` | Valid auth | 200 | Specific fields |
| R105 | Real-time report (today's live data) | GET | `/api/reports/dashboard?live=true` | Admin | 200 | Real-time flag |

Total: 10 + 15 + 10 + 10 + 8 + 5 + 15 + 15 + 17 = **105 tests**
