# Tasks Module — Deep API Test Cases (105 tests)

## 1.1 Create Task — 15 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| T1 | Create task with required fields | POST | `/api/tasks` | `{ title, assigned_to, due_date }` | 201 | Task created |
| T2 | Create task with empty title | POST | `/api/tasks` | `{ title: "", assigned_to: 1 }` | 400 | Title required |
| T3 | Create task with missing assigned_to | POST | `/api/tasks` | `{ title: "Task" }` | 400 | Assignee required |
| T4 | Create task with missing due_date | POST | `/api/tasks` | `{ title: "Task", assigned_to: 1 }` | 201 | Optional |
| T5 | Create task with full details | POST | `/api/tasks` | `{ title, description, assigned_to, due_date, priority, category }` | 201 | All stored |
| T6 | Create task as employee | POST | `/api/tasks` | Employee token | 201 | Can create |
| T7 | Create task without auth | POST | `/api/tasks` | No token | 401 | Unauthorized |
| T8 | Create task with SQL injection in title | POST | `/api/tasks` | `{ title: "'; DROP TABLE tasks; --", assigned_to: 1 }` | 201 | Sanitized |
| T9 | Create task with XSS in title | POST | `/api/tasks` | `{ title: "<script>alert(1)</script>", assigned_to: 1 }` | 201 | HTML-encoded |
| T10 | Create task with future due_date | POST | `/api/tasks` | `due_date: "2099-12-31"` | 201 | Future OK |
| T11 | Create task with past due_date | POST | `/api/tasks` | `due_date: "2020-01-01"` | 201 | Past allowed |
| T12 | Create task with priority levels | POST | `/api/tasks` | `priority: "high"` | 201 | Priority set |
| T13 | Create task with invalid priority | POST | `/api/tasks` | `priority: "urgent"` | 400 | Invalid enum |
| T14 | Create task with assigned_to = self | POST | `/api/tasks` | `assigned_to: current_user_id` | 201 | Self-assign |
| T15 | Create task with non-existent assignee | POST | `/api/tasks` | `assigned_to: 99999` | 400 | FK violation |

## 1.2 List Tasks — 15 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| T16 | List own tasks | GET | `/api/tasks` | Employee token | 200 | Own tasks |
| T17 | List all tasks (admin) | GET | `/api/tasks?all=true` | Admin token | 200 | All tasks |
| T18 | List with status filter | GET | `/api/tasks?status=pending` | Valid auth | 200 | Pending only |
| T19 | List with priority filter | GET | `/api/tasks?priority=high` | Valid auth | 200 | High priority |
| T20 | List with assigned_to filter | GET | `/api/tasks?assigned_to=1` | Valid auth | 200 | By assignee |
| T21 | List with created_by filter | GET | `/api/tasks?created_by=1` | Valid auth | 200 | By creator |
| T22 | List with date range | GET | `/api/tasks?from=2025-01-01&to=2025-01-31` | Valid auth | 200 | Date filtered |
| T23 | List with search in title | GET | `/api/tasks?search=Report` | Valid auth | 200 | Title search |
| T24 | List with pagination | GET | `/api/tasks?page=1&limit=10` | Valid auth | 200 | Paginated |
| T25 | List sorted by due_date | GET | `/api/tasks?sort=due_date&order=asc` | Valid auth | 200 | Sorted |
| T26 | List sorted by priority | GET | `/api/tasks?sort=priority&order=desc` | Valid auth | 200 | Priority sorted |
| T27 | List empty result | GET | `/api/tasks?status=completed&assigned_to=999` | Valid auth | 200 | Empty array |
| T28 | List without auth | GET | `/api/tasks` | No token | 401 | Unauthorized |
| T29 | List team tasks (manager) | GET | `/api/tasks?team=true` | Manager | 200 | Team visible |
| T30 | List cross-tenant | GET | `/api/tasks` | Wrong tenant header | 403 | Blocked |

## 1.3 Get Single Task — 5 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| T31 | Get task by ID | GET | `/api/tasks/:id` | Valid auth | 200 | Task object |
| T32 | Get non-existent task | GET | `/api/tasks/:id` | `id: 99999` | 404 | Not found |
| T33 | Get without auth | GET | `/api/tasks/:id` | No token | 401 | Unauthorized |
| T34 | Get task owned by other (employee) | GET | `/api/tasks/:id` | Not assigned/created | 403 | Forbidden |
| T35 | Get task with invalid ID | GET | `/api/tasks/:id` | `id: "abc"` | 400 | Invalid |

## 1.4 Update Task — 12 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| T36 | Update title | PUT | `/api/tasks/:id` | `{ title: "Updated" }` | 200 | Title changed |
| T37 | Update status | PUT | `/api/tasks/:id` | `{ status: "in_progress" }` | 200 | Status changed |
| T38 | Update assignee | PUT | `/api/tasks/:id` | `{ assigned_to: 2 }` | 200 | Reassigned |
| T39 | Update status to completed | PUT | `/api/tasks/:id` | `{ status: "completed" }` | 200 | Completed |
| T40 | Update non-existent | PUT | `/api/tasks/:id` | `id: 99999` | 404 | Not found |
| T41 | Update without auth | PUT | `/api/tasks/:id` | No token | 401 | Unauthorized |
| T42 | Update as non-owner/assignee | PUT | `/api/tasks/:id` | Different employee | 403 | Forbidden |
| T43 | Update with empty body | PUT | `/api/tasks/:id` | `{}` | 200 | No changes |
| T44 | Update to invalid status | PUT | `/api/tasks/:id` | `{ status: "nonexistent" }` | 400 | Invalid enum |
| T45 | Update with SQL injection | PUT | `/api/tasks/:id` | `{ title: "'; DELETE FROM tasks; --" }` | 200 | Sanitized |
| T46 | Update due_date | PUT | `/api/tasks/:id` | `{ due_date: "2025-12-31" }` | 200 | Date updated |
| T47 | Update priority | PUT | `/api/tasks/:id` | `{ priority: "low" }` | 200 | Priority updated |

## 1.5 Delete Task — 8 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| T48 | Delete own task | DELETE | `/api/tasks/:id` | Creator token | 200 | Deleted |
| T49 | Delete as admin | DELETE | `/api/tasks/:id` | Admin token | 200 | Deleted |
| T50 | Delete non-existent | DELETE | `/api/tasks/:id` | `id: 99999` | 404 | Not found |
| T51 | Delete without auth | DELETE | `/api/tasks/:id` | No token | 401 | Unauthorized |
| T52 | Delete as non-creator | DELETE | `/api/tasks/:id` | Different employee | 403 | Forbidden |
| T53 | Delete with invalid ID | DELETE | `/api/tasks/:id` | `id: "abc"` | 400 | Invalid |
| T54 | Delete then recreate | DELETE → POST | Same data | After delete | 201 | Can recreate |
| T55 | Delete cross-tenant | DELETE | `/api/tasks/:id` | Wrong tenant | 404 | Blocked |

## 1.6 Task Updates (Comments) — 12 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| T56 | Add comment to task | POST | `/api/tasks/:id/updates` | `{ comment: "Working on it" }` | 201 | Comment added |
| T57 | Add empty comment | POST | `/api/tasks/:id/updates` | `{ comment: "" }` | 400 | Cannot be empty |
| T58 | Add comment without auth | POST | `/api/tasks/:id/updates` | No token | 401 | Unauthorized |
| T59 | Add comment to non-existent task | POST | `/api/tasks/:id/updates` | `id: 99999` | 404 | Not found |
| T60 | Add comment with SQL injection | POST | `/api/tasks/:id/updates` | `{ comment: "'; DROP TABLE tasks; --" }` | 201 | Sanitized |
| T61 | Add comment with XSS | POST | `/api/tasks/:id/updates` | `{ comment: "<img src=x onerror=alert(1)>" }` | 201 | HTML-encoded |
| T62 | Get task updates | GET | `/api/tasks/:id/updates` | Valid auth | 200 | Array of comments |
| T63 | Get updates sorted by date | GET | `/api/tasks/:id/updates` | Valid auth | 200 | Chronological |
| T64 | Get updates without auth | GET | `/api/tasks/:id/updates` | No token | 401 | Unauthorized |
| T65 | Update comment | PUT | `/api/tasks/:id/updates/:updateId` | `{ comment: "Edited" }` | 200 | Edited |
| T66 | Delete comment | DELETE | `/api/tasks/:id/updates/:updateId` | Owner/admin | 200 | Deleted |
| T67 | Delete comment not owned | DELETE | `/api/tasks/:id/updates/:updateId` | Different user | 403 | Forbidden |

## 1.7 Task Statistics — 10 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| T68 | Get task statistics | GET | `/api/tasks/statistics` | Valid auth | 200 | Stats object |
| T69 | Stats include total/pending/in_progress/completed | GET | `/api/tasks/statistics` | Valid auth | 200 | Status counts |
| T70 | Stats include overdue count | GET | `/api/tasks/statistics` | Valid auth | 200 | Overdue tasks |
| T71 | Stats include priority breakdown | GET | `/api/tasks/statistics` | Valid auth | 200 | By priority |
| T72 | Stats for specific assignee | GET | `/api/tasks/statistics?assigned_to=1` | Valid auth | 200 | Person stats |
| T73 | Stats for team (manager) | GET | `/api/tasks/statistics?team=true` | Manager | 200 | Team stats |
| T74 | Stats without auth | GET | `/api/tasks/statistics` | No token | 401 | Unauthorized |
| T75 | Stats cross-tenant | GET | `/api/tasks/statistics` | Wrong tenant | 403 | Blocked |
| T76 | Stats as employee (own) | GET | `/api/tasks/statistics` | Employee | 200 | Own only |
| T77 | Stats include completion_rate | GET | `/api/tasks/statistics` | Valid auth | 200 | % complete |

## 1.8 Authorization — 15 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| T78 | Employee can create task | POST | `/api/tasks` | Employee token | 201 | Allowed |
| T79 | Employee can view own assigned tasks | GET | `/api/tasks` | Employee token | 200 | Own tasks |
| T80 | Employee can update own task status | PUT | `/api/tasks/:id` | Assigned employee | 200 | Status only |
| T81 | Employee cannot update others' tasks | PUT | `/api/tasks/:id` | Not assigned | 403 | Forbidden |
| T82 | Employee cannot delete others' tasks | DELETE | `/api/tasks/:id` | Not creator | 403 | Forbidden |
| T83 | Manager can view team tasks | GET | `/api/tasks?team=true` | Manager | 200 | Team view |
| T84 | Manager can create tasks for team | POST | `/api/tasks` | Manager, assign to team | 201 | Allowed |
| T85 | Manager can update any team task | PUT | `/api/tasks/:id` | Manager | 200 | Allowed |
| T86 | Admin can CRUD any task | ALL | All endpoints | Admin | 200 | Full access |
| T87 | Super Admin bypasses | ALL | All endpoints | Super admin | 200 | Unrestricted |
| T88 | Cross-tenant task access | GET | `/api/tasks` | Tenant A → Tenant B data | 403 | Blocked |
| T89 | Mass assignment protection | PUT | `/api/tasks/:id` | `{ id: 999, created_by: 1 }` | 200 | Protected |
| T90 | Employee cannot view task they're not involved in | GET | `/api/tasks/:id` | Not assigned/created | 403 | Forbidden |
| T91 | Task creator can delete | DELETE | `/api/tasks/:id` | Creator | 200 | Allowed |
| T92 | Task assignee can update status | PUT | `/api/tasks/:id` | `{ status: "completed" }` by assignee | 200 | Allowed |

## 1.9 Edge Cases — 13 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| T93 | Create 100 tasks then list | POST x100 → GET | Bulk create | Unique titles | 201, 200 | All listed |
| T94 | Task with very long title (500 chars) | POST | `/api/tasks` | `title: "A".repeat(500)` | 400 | Length limit |
| T95 | Task with very long description | POST | `/api/tasks` | `description: "A".repeat(5000)` | 201 | Long desc OK |
| T96 | Overdue task detection | GET | `/api/tasks?status=overdue` | Past due, not completed | 200 | Overdue list |
| T97 | Unicode task title | POST | `/api/tasks` | `title: "完成報告 (Complete Report)"` | 201 | Unicode OK |
| T98 | Emoji in title | POST | `/api/tasks` | `title: "🚀 Launch website"` | 201 | Emoji OK |
| T99 | Task status lifecycle: pending→in_progress→completed | PUT x2 | Status transitions | All valid | 200 each | Full lifecycle |
| T100 | Invalid status transition (completed→pending) | PUT | `/api/tasks/:id` | `{ status: "completed" }` → `{ status: "pending" }` | 400 | Can't un-complete |
| T101 | Assign task to deleted employee | PUT | `/api/tasks/:id` | `assigned_to: 99999` | 400 | FK error |
| T102 | Task with no assigned_to (unassigned) | POST | `/api/tasks` | No assigned_to | 201 | Optional |
| T103 | Bulk task creation | POST | `/api/tasks/bulk` | Array of tasks | 201 | Bulk created |
| T104 | Bulk with some invalid | POST | `/api/tasks/bulk` | Mixed valid/invalid | 207 | Partial success |
| T105 | Recurring task creation | POST | `/api/tasks` | `{ recurring: "weekly" }` | 201 | Recurring flag |

Total: 15 + 15 + 5 + 12 + 8 + 12 + 10 + 15 + 13 = **105 tests**
