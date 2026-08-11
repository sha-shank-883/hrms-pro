# Tasks Module - Test Cases (`/api/tasks`)

## Endpoints
- `GET /api/tasks` - List tasks
- `GET /api/tasks/statistics` - Statistics
- `GET /api/tasks/:id` - Get by ID
- `POST /api/tasks` - Create (admin/manager)
- `PUT /api/tasks/:id` - Update (admin/manager)
- `PUT /api/tasks/:id/status` - Update status (any)
- `DELETE /api/tasks/:id` - Delete (admin/manager)
- `GET /api/tasks/:task_id/updates` - Get updates
- `POST /api/tasks/:task_id/updates` - Add update
- `PUT /api/tasks/updates/:update_id` - Edit update
- `DELETE /api/tasks/updates/:update_id` - Delete update

---

| # | Test Case | Method | Endpoint | Expected Result | Auth |
|---|---|---|---|---|---|
| TSK-001 | Get tasks with filters (admin) | GET | `/api/tasks` | 200 OK, task array | Admin JWT |
| TSK-002 | Get tasks as employee | GET | `/api/tasks` | 200 OK, assigned tasks | Employee JWT |
| TSK-003 | Get tasks without auth | GET | `/api/tasks` | 401 Unauthorized | None |
| TSK-004 | Get tasks filtered by status | GET | `/api/tasks?status=pending` | 200, filtered | JWT |
| TSK-005 | Get tasks filtered by assignee | GET | `/api/tasks?assigned_to=1` | 200, filtered by assignee | JWT |
| TSK-006 | Get tasks filtered by priority | GET | `/api/tasks?priority=high` | 200, filtered | JWT |
| TSK-007 | Get tasks filtered by department | GET | `/api/tasks?department_id=1` | 200, filtered | JWT |
| TSK-008 | Get tasks with search | GET | `/api/tasks?search=report` | 200, matching | JWT |
| TSK-009 | Get tasks with pagination | GET | `/api/tasks?page=1&limit=10` | 200 with pagination | JWT |
| TSK-010 | Get task statistics | GET | `/api/tasks/statistics` | 200 OK, stats object | JWT |
| TSK-011 | Get task statistics without auth | GET | `/api/tasks/statistics` | 401 Unauthorized | None |
| TSK-012 | Get task by ID | GET | `/api/tasks/:id` | 200 OK, task details | JWT |
| TSK-013 | Get task by non-existent ID | GET | `/api/tasks/:id` | 404 Not Found | JWT |
| TSK-014 | Get task by invalid ID | GET | `/api/tasks/abc` | 400 or 404 | JWT |
| TSK-015 | Get task as employee (assigned) | GET | `/api/tasks/:id` | 200 OK | Employee JWT |
| TSK-016 | Get task as employee (not assigned) | GET | `/api/tasks/:id` | 403 Forbidden | Employee JWT |
| TSK-017 | Create task with valid data | POST | `/api/tasks` | 201 Created | Admin JWT |
| TSK-018 | Create task as employee | POST | `/api/tasks` | 403 Forbidden | Employee JWT |
| TSK-019 | Create task without auth | POST | `/api/tasks` | 401 Unauthorized | None |
| TSK-020 | Create task with missing title | POST | `/api/tasks` | 400 Validation error | Admin JWT |
| TSK-021 | Create task with assignee | POST | `/api/tasks` | 201, assigned to employee | Admin JWT |
| TSK-022 | Create task with due date | POST | `/api/tasks` | 201, due_date saved | Admin JWT |
| TSK-023 | Create task with priority | POST | `/api/tasks` | 201, priority saved | Admin JWT |
| TSK-024 | Create task with category | POST | `/api/tasks` | 201, category saved | Admin JWT |
| TSK-025 | Create task with estimated hours | POST | `/api/tasks` | 201, estimated_hours saved | Admin JWT |
| TSK-026 | Create task with XSS in title | POST | `/api/tasks` | 201, stored as literal | Admin JWT |
| TSK-027 | Create task with SQL injection | POST | `/api/tasks` | 201/400, parameterized safely | Admin JWT |
| TSK-028 | Update task with valid data | PUT | `/api/tasks/:id` | 200 OK | Admin JWT |
| TSK-029 | Update task as employee | PUT | `/api/tasks/:id` | 403 Forbidden | Employee JWT |
| TSK-030 | Update non-existent task | PUT | `/api/tasks/:id` | 404 Not Found | Admin JWT |
| TSK-031 | Update task status (any user) | PUT | `/api/tasks/:id/status` | 200 OK | JWT |
| TSK-032 | Update task status to completed | PUT | `/api/tasks/:id/status` | 200, status=completed | JWT |
| TSK-033 | Update task status with invalid status | PUT | `/api/tasks/:id/status` | 400 Validation | JWT |
| TSK-034 | Update task status without auth | PUT | `/api/tasks/:id/status` | 401 Unauthorized | None |
| TSK-035 | Delete task as admin | DELETE | `/api/tasks/:id` | 200 OK | Admin JWT |
| TSK-036 | Delete task as employee | DELETE | `/api/tasks/:id` | 403 Forbidden | Employee JWT |
| TSK-037 | Delete non-existent task | DELETE | `/api/tasks/:id` | 404 Not Found | Admin JWT |
| TSK-038 | Add update/comment to task | POST | `/api/tasks/:task_id/updates` | 201 Created | JWT |
| TSK-039 | Add update without auth | POST | `/api/tasks/:task_id/updates` | 401 Unauthorized | None |
| TSK-040 | Add update to non-existent task | POST | `/api/tasks/:task_id/updates` | 404 Not Found | JWT |
| TSK-041 | Get task updates | GET | `/api/tasks/:task_id/updates` | 200 OK, updates array | JWT |
| TSK-042 | Get updates for non-existent task | GET | `/api/tasks/:task_id/updates` | 404 Not Found | JWT |
| TSK-043 | Edit task update | PUT | `/api/tasks/updates/:update_id` | 200 OK | JWT |
| TSK-044 | Edit another user's task update | PUT | `/api/tasks/updates/:update_id` | 403 Forbidden | Employee JWT |
| TSK-045 | Delete task update | DELETE | `/api/tasks/updates/:update_id` | 200 OK | JWT |
| TSK-046 | Delete non-existent task update | DELETE | `/api/tasks/updates/:update_id` | 404 Not Found | JWT |
| TSK-047 | Task statistics include by-status breakdown | GET | `/api/tasks/statistics` | pending, in_progress, completed counts | JWT |
| TSK-048 | Tenant isolation: tasks isolated | GET | `/api/tasks` | Only own tenant | Cross-tenant |
| TSK-049 | Create task then verify in list | POST + GET | workflow | Task appears in list | Admin JWT |
| TSK-050 | Update task status then GET verifies | PUT + GET | workflow | Status changed | JWT |
| TSK-051 | Delete task then GET returns 404 | DELETE + GET | workflow | 404 Not Found | Admin JWT |
| TSK-052 | Add update with file attachment | POST | `/api/tasks/:task_id/updates` | 201, attachment saved | JWT |
| TSK-053 | Response format: success + data | GET | `/api/tasks` | `{ success: true, data: [...] }` | JWT |
| TSK-054 | Pagination metadata in task list | GET | `/api/tasks?page=1&limit=5` | total, page, limit in response | JWT |
| TSK-055 | Create task as manager | POST | `/api/tasks` | 201 Created | Manager JWT |

---

**Total: 55 test cases**
