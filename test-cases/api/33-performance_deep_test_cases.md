# Performance Module — Deep API Test Cases (110 tests)

## 1.1 Goals CRUD — 20 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| P1 | Create goal | POST | `/api/performance/goals` | `{ title, description, due_date, employee_id }` | 201 | Goal created |
| P2 | Create goal with missing title | POST | `/api/performance/goals` | No title | 400 | Required |
| P3 | Create goal with missing employee_id | POST | `/api/performance/goals` | No assignee | 400 | Required |
| P4 | Create goal with past due_date | POST | `/api/performance/goals` | Past date | 201 | Allowed |
| P5 | Create goal without auth | POST | `/api/performance/goals` | No token | 401 | Unauthorized |
| P6 | Create goal as employee (self) | POST | `/api/performance/goals` | Employee, own ID | 201 | Self-assign |
| P7 | Create goal as employee (other) | POST | `/api/performance/goals` | Employee, other user | 403 | Forbidden |
| P8 | Create goal with SQL injection | POST | `/api/performance/goals` | `{ title: "'; DROP TABLE goals; --" }` | 201 | Sanitized |
| P9 | Create goal with XSS | POST | `/api/performance/goals` | `{ title: "<script>alert(1)</script>" }` | 201 | HTML-encoded |
| P10 | Create goal with weight/priority | POST | `/api/performance/goals` | `{ weight: 50, priority: "high" }` | 201 | Weight stored |
| P11 | Create goal with invalid weight (negative) | POST | `/api/performance/goals` | `{ weight: -10 }` | 400 | Invalid |
| P12 | Create goal with weight > 100 | POST | `/api/performance/goals` | `{ weight: 150 }` | 400 | Invalid |
| P13 | List goals | GET | `/api/performance/goals` | Valid auth | 200 | Array |
| P14 | List goals by employee | GET | `/api/performance/goals?employee_id=1` | Valid auth | 200 | Filtered |
| P15 | List goals by status | GET | `/api/performance/goals?status=in_progress` | Valid auth | 200 | Filtered |
| P16 | List goals with pagination | GET | `/api/performance/goals?page=1&limit=20` | Valid auth | 200 | Paginated |
| P17 | Update goal | PUT | `/api/performance/goals/:id` | `{ title: "Updated" }` | 200 | Updated |
| P18 | Update goal progress | PUT | `/api/performance/goals/:id` | `{ progress: 75 }` | 200 | Progress % |
| P19 | Update goal when completed | PUT | `/api/performance/goals/:id` | `{ status: "completed" }` | 200 | Completed |
| P20 | Delete goal | DELETE | `/api/performance/goals/:id` | Admin/manager | 200 | Deleted |

## 1.2 Key Results — 12 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| P21 | Create key result | POST | `/api/performance/goals/:id/key-results` | `{ title, target_value, unit }` | 201 | KR created |
| P22 | Create KR without title | POST | `/api/performance/goals/:id/key-results` | No title | 400 | Required |
| P23 | Create KR with current value | POST | `/api/performance/goals/:id/key-results` | `{ current_value: 0, target_value: 100 }` | 201 | Values set |
| P24 | List key results | GET | `/api/performance/goals/:id/key-results` | Valid auth | 200 | Array |
| P25 | Update KR progress | PUT | `/api/performance/goals/:id/key-results/:krId` | `{ current_value: 50 }` | 200 | Progress tracked |
| P26 | Update KR with value exceeding target | PUT | `/api/performance/goals/:id/key-results/:krId` | `{ current_value: 200 }` where target=100 | 200 | Overachieved |
| P27 | Delete KR | DELETE | `/api/performance/goals/:id/key-results/:krId` | Owner | 200 | Deleted |
| P28 | Create KR without auth | POST | `/api/performance/goals/:id/key-results` | No token | 401 | Unauthorized |
| P29 | KR with SQL injection | POST | `/api/performance/goals/:id/key-results` | `{ title: "'; DROP TABLE key_results; --" }` | 201 | Sanitized |
| P30 | KR auto-calculates progress % | GET | `/api/performance/goals/:id` | After KR updates | 200 | `progress` updated |
| P31 | KR with boolean (checkbox) type | POST | `/api/performance/goals/:id/key-results` | `{ type: "boolean" }` | 201 | Checkbox type |
| P32 | KR target 0 (completion based) | POST | `/api/performance/goals/:id/key-results` | `{ type: "milestone" }` | 201 | Milestone type |

## 1.3 Reviews CRUD — 20 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| P33 | Create review | POST | `/api/performance/reviews` | `{ employee_id, reviewer_id, cycle_id, due_date }` | 201 | Review created |
| P34 | Create review missing employee | POST | `/api/performance/reviews` | No employee_id | 400 | Required |
| P35 | Create review missing reviewer | POST | `/api/performance/reviews` | No reviewer_id | 400 | Required |
| P36 | Create review as employee | POST | `/api/performance/reviews` | Employee token | 403 | Forbidden |
| P37 | Create review without auth | POST | `/api/performance/reviews` | No token | 401 | Unauthorized |
| P38 | List reviews | GET | `/api/performance/reviews` | Valid auth | 200 | Array |
| P39 | List reviews by employee | GET | `/api/performance/reviews?employee_id=1` | Valid auth | 200 | By employee |
| P40 | List reviews by reviewer | GET | `/api/performance/reviews?reviewer_id=1` | Valid auth | 200 | By reviewer |
| P41 | List reviews by status | GET | `/api/performance/reviews?status=pending` | Valid auth | 200 | Pending only |
| P42 | List reviews pagination | GET | `/api/performance/reviews?page=1&limit=10` | Valid auth | 200 | Paginated |
| P43 | Get single review | GET | `/api/performance/reviews/:id` | Valid auth | 200 | Full review |
| P44 | Update review (add rating) | PUT | `/api/performance/reviews/:id` | `{ rating: 4.5, comments: "Good work" }` | 200 | Rating saved |
| P45 | Update review with invalid rating (>5) | PUT | `/api/performance/reviews/:id` | `{ rating: 6 }` | 400 | Out of range |
| P46 | Update review with negative rating | PUT | `/api/performance/reviews/:id` | `{ rating: -1 }` | 400 | Invalid |
| P47 | Update review status | PUT | `/api/performance/reviews/:id` | `{ status: "completed" }` | 200 | Completed |
| P48 | Update review not assigned as reviewer | PUT | `/api/performance/reviews/:id` | Different user | 403 | Forbidden |
| P49 | Submit review (self-review) | PUT | `/api/performance/reviews/:id` | Employee self-review | 200 | Submitted |
| P50 | Delete review | DELETE | `/api/performance/reviews/:id` | Admin | 200 | Deleted |
| P51 | Delete review as non-admin | DELETE | `/api/performance/reviews/:id` | Reviewer | 403 | Forbidden |
| P52 | Review with SQL injection in comments | PUT | `/api/performance/reviews/:id` | `{ comments: "'; DROP TABLE reviews; --" }` | 200 | Sanitized |

## 1.4 Cycles CRUD — 15 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| P53 | Create cycle | POST | `/api/performance/cycles` | `{ name, start_date, end_date, type }` | 201 | Cycle created |
| P54 | Create cycle without name | POST | `/api/performance/cycles` | No name | 400 | Required |
| P55 | Create cycle with end before start | POST | `/api/performance/cycles` | `start_date after end_date` | 400 | Invalid range |
| P56 | Create cycle without auth | POST | `/api/performance/cycles` | No token | 401 | Unauthorized |
| P57 | Create cycle as employee | POST | `/api/performance/cycles` | Employee | 403 | Forbidden |
| P58 | List cycles | GET | `/api/performance/cycles` | Valid auth | 200 | Array |
| P59 | List active cycles | GET | `/api/performance/cycles?status=active` | Valid auth | 200 | Active only |
| P60 | Get single cycle | GET | `/api/performance/cycles/:id` | Valid auth | 200 | Cycle details |
| P61 | Update cycle | PUT | `/api/performance/cycles/:id` | `{ name: "Q2 Review" }` | 200 | Updated |
| P62 | Activate cycle | PUT | `/api/performance/cycles/:id` | `{ status: "active" }` | 200 | Activated |
| P63 | Close cycle | PUT | `/api/performance/cycles/:id` | `{ status: "closed" }` | 200 | Closed |
| P64 | Close cycle with pending reviews | PUT | `/api/performance/cycles/:id` | Has pending reviews | 400 | Cannot close |
| P65 | Delete cycle | DELETE | `/api/performance/cycles/:id` | Admin | 200 | Deleted |
| P66 | Delete cycle with reviews | DELETE | `/api/performance/cycles/:id` | Has associated reviews | 409 | FK constraint |
| P67 | Cycle with overlapping dates | POST | `/api/performance/cycles` | Overlaps active cycle | 400 | Overlap |

## 1.5 Performance Analytics — 10 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| P68 | Get performance analytics | GET | `/api/performance/analytics` | Admin/manager | 200 | Analytics |
| P69 | Get individual performance | GET | `/api/performance/analytics?employee_id=1` | Valid auth | 200 | Employee perf |
| P70 | Get team performance | GET | `/api/performance/analytics?department_id=1` | Manager | 200 | Team perf |
| P71 | Get performance trends | GET | `/api/performance/analytics/trends` | Admin | 200 | Trend data |
| P72 | Analytics without auth | GET | `/api/performance/analytics` | No token | 401 | Unauthorized |
| P73 | Analytics cross-tenant | GET | `/api/performance/analytics` | Wrong header | 403 | Blocked |
| P74 | Analytics as employee (self only) | GET | `/api/performance/analytics` | Employee | 200 | Self only |
| P75 | Analytics include avg rating | GET | `/api/performance/analytics` | Admin | 200 | `avg_rating` |
| P76 | Analytics include goal completion rate | GET | `/api/performance/analytics` | Admin | 200 | `completion_rate` |
| P77 | Analytics by cycle | GET | `/api/performance/analytics?cycle_id=1` | Admin | 200 | Per cycle |

## 1.6 Authorization — 18 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| P78 | Admin full CRUD goals | ALL | Goals | Admin | 200 | Full |
| P79 | Admin full CRUD reviews | ALL | Reviews | Admin | 200 | Full |
| P80 | Admin full CRUD cycles | ALL | Cycles | Admin | 200 | Full |
| P81 | Manager can create reviews for team | POST | Reviews | Manager, team member | 201 | Allowed |
| P82 | Manager can view team goals | GET | Goals?employee_id= | Manager | 200 | Team goals |
| P83 | Manager cannot view other dept | GET | Goals?employee_id= | Manager, other dept | 403 | Blocked |
| P84 | Manager cannot delete cycles | DELETE | Cycles | Manager | 403 | Forbidden |
| P85 | Employee can create own goals | POST | Goals (self) | Employee | 201 | Allowed |
| P86 | Employee can view own goals | GET | Goals | Employee | 200 | Own |
| P87 | Employee can view own reviews | GET | Reviews?employee_id= | Employee own | 200 | Own |
| P88 | Employee cannot create reviews | POST | Reviews | Employee | 403 | Forbidden |
| P89 | Employee cannot create cycles | POST | Cycles | Employee | 403 | Forbidden |
| P90 | Employee cannot delete goals (others) | DELETE | Goals/:id | Not owner | 403 | Forbidden |
| P91 | Cross-tenant isolation | ALL | All | Wrong tenant | 403 | Blocked |
| P92 | Super Admin bypasses | ALL | All | Super admin | 200 | Unrestricted |
| P93 | Mass assignment | PUT | Goals/:id | `{ id: 999 }` | 200 | Protected |
| P94 | SQL injection in list | GET | Goals?search=' UNION... | Any token | 200 | Sanitized |
| P95 | Rate limiting | GET | Goals x 1000 | Valid token | 429 | Rate limited |

## 1.7 Edge Cases — 15 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| P96 | Goal with 100% progress auto-completes | PUT | Goals/:id | `{ progress: 100 }` | 200 | Status→completed |
| P97 | All KRs completed completes goal | PUT | KRs x3 | Mark all 100% | 200 | Goal auto-completes |
| P98 | Review with 0.5 decimal rating | PUT | Reviews/:id | `{ rating: 3.5 }` | 200 | Decimals accepted |
| P99 | Review with no rating (narrative only) | PUT | Reviews/:id | `{ comments: "Narrative review" }` | 200 | Rating optional |
| P100 | Cycle with same name as previous | POST | Cycles | Duplicate name | 409 | Or unique per org |
| P101 | Goal with very long title | POST | Goals | 500 chars | 400 | Length limit |
| P102 | Goal with Unicode title | POST | Goals | Unicode | 201 | Accepted |
| P103 | Review with multiple assignees | POST | Reviews | Multiple reviewers | 201 | Or 400 |
| P104 | 360-degree review (peer, manager, self) | POST | Reviews x3 | Different reviewer types | 201 | All created |
| P105 | Goal progress rollback | PUT | Goals/:id | 50→25→80 | 200 | Non-monotonic OK |
| P106 | Goal weight distribution > 100% total | POST | Multiple goals | Weights total > 100 | 400 | Or warning |
| P107 | Review with file attachments | POST | Reviews | With file | 201 | Attached |
| P108 | Archived employee still has goals | GET | Goals?employee_id= | Archived employee | 200 | Historical |
| P109 | Performance feedback loop | POST Review → GET Analytics | Review completed | Analytics updated | 200 | Reflects new data |
| P110 | Delete employee with active goals | DELETE Employee | Has goals | 409 | FK blocked |

Total: 20 + 12 + 20 + 15 + 10 + 18 + 15 = **110 tests**
