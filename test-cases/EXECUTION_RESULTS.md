# HRMS Pro - Full Test Execution Results

**Started**: 2026-05-27
**Status**: IN PROGRESS

## Module Execution Log

## Auth Module (Partial) - 2026-05-27 18:57:47
| Test | Result | HTTP |
|---|---|---|| AUTH-001 | FAIL | 400 |
| AUTH-002 | PASS | 409 |
| AUTH-003 | PASS | 400 |
| AUTH-004 | PASS | 400 |
| AUTH-005 | PASS | 400 |
| AUTH-006 | PASS | 400 |
| AUTH-007 | PASS | 400-safe |
| AUTH-008 | PASS | 400-safe |
| AUTH-009 | PASS | 400 |
| AUTH-010 | FAIL | 400 |
| AUTH-011 | PASS | 200-token |
| AUTH-012 | PASS | 401 |
| AUTH-013 | PASS | 401 |
| AUTH-014 | PASS | 400 |
| AUTH-015 | PASS | 400 |
| AUTH-016 | PASS | 400 |
| AUTH-017 | FAIL | 404 |
| AUTH-018 | PASS | correct-format |
| AUTH-019 | FAIL | 400 |
| AUTH-020 | SKIP | rate-limit-needs-rapid-fire-tool |
| AUTH-071 | PASS | no-password |
| AUTH-075 | PASS | 401-no-crash |

Pass: 17 | Fail: 4 | Skip: 1
---


## Auth Module (AUTH-021 to AUTH-040) - 2026-05-27 18:59:44
| Test | Result | Details |
|---|---|---|
| AUTH-021 | PASS | 200 |
| AUTH-022 | PASS | 401 |
| AUTH-023 | PASS | 401 |
| AUTH-024 | PASS | 401 |
| AUTH-025 | FAIL | 404 |
| AUTH-026 | FAIL | missing-fields |
| AUTH-027 | PASS | permissions-array |
| AUTH-028 | PASS | no-password |
| AUTH-030 | PASS | 200 |
| AUTH-031 | PASS | 200 |
| AUTH-037 | PASS | 200-new-password-works |
| AUTH-032 | PASS | 401 |
| AUTH-033 | PASS | 401 |
| AUTH-034 | PASS | 400 |
| AUTH-035 | PASS | 400 |
| AUTH-036 | PASS | 401 |
| AUTH-038 | PASS | 200 |
| AUTH-039 | PASS | 403 |
| AUTH-040 | PASS | 404 |

Pass: 17 | Fail: 2
---


## Auth Module (AUTH-041 to AUTH-074) - 2026-05-27 19:00:45
| Test | Result | Details |
|---|---|---|
| AUTH-041 | PASS | 200 |
| AUTH-042 | PASS | 403 |
| AUTH-043 | PASS | 200-cleared |
| AUTH-044 | PASS | 200-stored |
| AUTH-045 | PASS | 404 |
| AUTH-051 | WARN | 500-email-may-not-be-configured |
| AUTH-052 | PASS | 200-no-info-leak |
| AUTH-053 | FAIL | no-400 |
| AUTH-061 | PASS | 200-secret |
| AUTH-062 | FAIL | 400 |
| AUTH-069 | PASS | 200-disabled |
| AUTH-070 | FAIL | 400 |
| AUTH-073 | PASS | 401 |
| AUTH-074 | PASS | 401 |

Pass: 11 | Fail: 3
---

[DEPARTMENTS][INFO] 19:18:59 - ===========================================
[DEPARTMENTS][START] 19:18:59 - Starting Departments Module Tests (55 cases)
[DEPARTMENTS][INFO] 19:18:59 - ===========================================
[DEPARTMENTS][PASS] 19:19:04 - Admin token obtained (length=204)
[DEPARTMENTS][PASS] 19:19:05 - Employee token obtained for emp.dept.1623658419@test.com
[DEPARTMENTS][PASS] 19:19:05 - DEP-001: GET /api/departments (admin) -> PASS (HTTP 200)
[DEPARTMENTS][INFO] 19:19:06 - Existing department ID: 75
[DEPARTMENTS][PASS] 19:19:06 - DEP-002: GET /api/departments (employee) -> PASS (HTTP 200)
[DEPARTMENTS][FAIL] 19:19:07 - DEP-003: GET /api/departments (no auth) -> FAIL (HTTP , )
[DEPARTMENTS][PASS] 19:19:07 - DEP-004: GET /api/departments/:id (valid) -> PASS (HTTP 200)
[DEPARTMENTS][FAIL] 19:19:07 - DEP-005: GET /api/departments/:id (404) -> FAIL (HTTP , )
[DEPARTMENTS][FAIL] 19:19:08 - DEP-006: GET /api/departments/:id (string) -> FAIL (HTTP , )
[DEPARTMENTS][FAIL] 19:19:08 - DEP-007: GET /api/departments/:id (SQL injection) -> FAIL (HTTP , )
[DEPARTMENTS][PASS] 19:19:09 - DEP-008: Response fields check -> PASS (HTTP 200)
[DEPARTMENTS][PASS] 19:19:09 - DEP-009: POST create valid department (admin) -> PASS (HTTP 201)
[DEPARTMENTS][FAIL] 19:19:09 - DEP-010: POST create with empty name -> FAIL (HTTP , )
[DEPARTMENTS][FAIL] 19:19:09 - DEP-011: POST create with duplicate name -> FAIL (HTTP 201, {"success":true,"message":"Department created successfully","data":{"department_id":77,"department_name":"Dept-2078868490","description":null,"manager_id":null,"budget":null,"location":null,"created_a)
[DEPARTMENTS][FAIL] 19:19:10 - DEP-012: POST create as employee -> FAIL (HTTP , )
[DEPARTMENTS][FAIL] 19:19:10 - DEP-013: POST create without auth -> FAIL (HTTP , )
[DEPARTMENTS][PASS] 19:19:10 - DEP-014: POST SQL injection in name -> PASS (HTTP 201)
[DEPARTMENTS][PASS] 19:19:10 - DEP-015: POST XSS in name -> PASS (HTTP 201)
[DEPARTMENTS][PASS] 19:19:11 - DEP-016: POST create with budget -> PASS (HTTP 201)
[DEPARTMENTS][FAIL] 19:19:11 - DEP-017: POST very long name -> FAIL (HTTP , )
[DEPARTMENTS][PASS] 19:19:12 - DEP-018: POST special chars in name -> PASS (HTTP 201)
[DEPARTMENTS][PASS] 19:19:12 - DEP-019: PUT update department (admin) -> PASS (HTTP 200)
[DEPARTMENTS][FAIL] 19:19:12 - DEP-020: PUT update with empty name -> FAIL (HTTP , )
[DEPARTMENTS][FAIL] 19:19:12 - DEP-021: PUT update as employee -> FAIL (HTTP , )
[DEPARTMENTS][FAIL] 19:19:12 - DEP-022: PUT update without auth -> FAIL (HTTP , )
[DEPARTMENTS][FAIL] 19:19:13 - DEP-023: PUT update non-existent -> FAIL (HTTP , )
[DEPARTMENTS][FAIL] 19:19:13 - DEP-024: PUT duplicate name -> FAIL (HTTP 200, {"success":true,"message":"Department updated successfully","data":{"department_id":63,"department_name":"DupeTarget-1398975347","description":null,"manager_id":null,"budget":null,"location":null,"cre)
[DEPARTMENTS][FAIL] 19:19:13 - DEP-025: PUT update budget -> FAIL (HTTP , )
[DEPARTMENTS][WARN] 19:19:14 - DEP-026: SKIP (no manager test user available)
[DEPARTMENTS][PASS] 19:19:14 - DEP-027: DELETE department (admin) -> PASS (HTTP 200)
[DEPARTMENTS][FAIL] 19:19:14 - DEP-028: DELETE as employee -> FAIL (HTTP , )
[DEPARTMENTS][WARN] 19:19:14 - DEP-029: SKIP (no manager test user)
[DEPARTMENTS][FAIL] 19:19:14 - DEP-030: DELETE without auth -> FAIL (HTTP , )
[DEPARTMENTS][FAIL] 19:19:15 - DEP-031: DELETE non-existent -> FAIL (HTTP , )
[DEPARTMENTS][FAIL] 19:19:15 - DEP-032: DELETE dept with employees -> FAIL (HTTP , )
[DEPARTMENTS][PASS] 19:19:15 - DEP-033: GET with pagination -> PASS (HTTP 200)
[DEPARTMENTS][PASS] 19:19:15 - DEP-034: GET with invalid page -> PASS (HTTP 200)
[DEPARTMENTS][PASS] 19:19:16 - DEP-035: GET with sort -> PASS (HTTP 200)
[DEPARTMENTS][PASS] 19:19:16 - DEP-036: Create then GET confirms -> PASS (HTTP 200)
[DEPARTMENTS][PASS] 19:19:17 - DEP-037: Update then GET confirms -> PASS (HTTP 200)
[DEPARTMENTS][FAIL] 19:19:17 - DEP-038: Delete then GET 404 -> FAIL (HTTP , )
[DEPARTMENTS][FAIL] 19:19:17 - DEP-039: Tenant isolation (wrong tenant) -> FAIL (HTTP , )
[DEPARTMENTS][FAIL] 19:19:17 - DEP-040: Missing tenant header -> FAIL (HTTP , )
[DEPARTMENTS][PASS] 19:19:18 - DEP-041: Response format check -> PASS (HTTP 200)
[DEPARTMENTS][FAIL] 19:19:18 - DEP-042: Error format check -> FAIL (HTTP , )
[DEPARTMENTS][PASS] 19:19:19 - DEP-043: Idempotent GET -> PASS (HTTP 200)
[DEPARTMENTS][PASS] 19:19:19 - DEP-044: GET with search filter -> PASS (HTTP 200)
[DEPARTMENTS][WARN] 19:19:19 - DEP-045: SKIP (rate limiting cannot be tested without batch requests)
[DEPARTMENTS][PASS] 19:19:20 - DEP-046: employee_count field present -> PASS (HTTP 200)
[DEPARTMENTS][PASS] 19:19:20 - DEP-047: POST create without manager (optional) -> PASS (HTTP 201)
[DEPARTMENTS][FAIL] 19:19:20 - DEP-048: PUT clear budget field -> FAIL (HTTP , )
[DEPARTMENTS][PASS] 19:19:20 - DEP-049: POST numeric name -> PASS (HTTP 201)
[DEPARTMENTS][FAIL] 19:19:21 - DEP-050: Multiple deletes (idempotent) -> FAIL (HTTP , )
[DEPARTMENTS][FAIL] 19:19:21 - DEP-051: PUT partial update (description only) -> FAIL (HTTP , )
[DEPARTMENTS][PASS] 19:19:21 - DEP-052: POST create with description -> PASS (HTTP 201)
[DEPARTMENTS][FAIL] 19:19:22 - DEP-053: GET invalid ID format -> FAIL (HTTP , )
[DEPARTMENTS][PASS] 19:19:22 - DEP-054: POST large payload (10KB) -> PASS (HTTP 201)
[DEPARTMENTS][WARN] 19:19:22 - DEP-055: SKIP (no granular permission test user)

---

## Departments Module Results (Executed: 2026-05-27 19:19:22)

| Metric | Count |
|--------|------:|
| Total  | 55 |
| Pass   | 24 |
| Fail   | 27 |
| Skip   | 4 |
| Pass Rate | 43.6% |

[DEPARTMENTS][DONE] 19:19:22 - Departments: 24/55 PASS, 27 FAIL, 4 SKIP
[DEPARTMENTS][INFO] 19:19:54 - ===========================================
[DEPARTMENTS][START] 19:19:54 - Starting Departments Module Tests (55 cases)
[DEPARTMENTS][INFO] 19:19:54 - ===========================================
[DEPARTMENTS][PASS] 19:19:55 - Admin token obtained (length=204)
[DEPARTMENTS][PASS] 19:19:57 - Employee token obtained for emp.dept.432694631@test.com
[DEPARTMENTS][PASS] 19:19:57 - DEP-001: GET /api/departments (admin) -> PASS (HTTP 200)
[DEPARTMENTS][INFO] 19:19:57 - Existing department ID: 92
[DEPARTMENTS][PASS] 19:19:58 - DEP-002: GET /api/departments (employee) -> PASS (HTTP 200)
[DEPARTMENTS][PASS] 19:19:58 - DEP-004: GET /api/departments/:id (valid) -> PASS (HTTP 200)
[DEPARTMENTS][PASS] 19:19:58 - DEP-005: GET /api/departments/:id (404) -> PASS (HTTP 404)
[DEPARTMENTS][FAIL] 19:19:58 - DEP-006: GET /api/departments/:id (string) -> FAIL (HTTP 500, )
[DEPARTMENTS][FAIL] 19:19:59 - DEP-007: GET /api/departments/:id (SQL injection) -> FAIL (HTTP 500, )
[DEPARTMENTS][PASS] 19:19:59 - DEP-008: Response fields check -> PASS (HTTP 200)
[DEPARTMENTS][PASS] 19:19:59 - DEP-009: POST create valid department (admin) -> PASS (HTTP 201)
[DEPARTMENTS][PASS] 19:19:59 - DEP-010: POST create with empty name -> PASS (HTTP 400)
[DEPARTMENTS][FAIL] 19:19:59 - DEP-011: POST create with duplicate name -> FAIL (HTTP 201, {"success":true,"message":"Department created successfully","data":{"department_id":94,"department_name":"Dept-2001294850","description":null,"manager_id":null,"budget":null,"location":null,"created_a)
[DEPARTMENTS][PASS] 19:19:59 - DEP-012: POST create as employee -> PASS (HTTP 403)
[DEPARTMENTS][PASS] 19:19:59 - DEP-013: POST create without auth -> PASS (HTTP 401)
[DEPARTMENTS][PASS] 19:20:00 - DEP-014: POST SQL injection in name -> PASS (HTTP 201)
[DEPARTMENTS][PASS] 19:20:00 - DEP-015: POST XSS in name -> PASS (HTTP 201)
[DEPARTMENTS][PASS] 19:20:00 - DEP-016: POST create with budget -> PASS (HTTP 201)
[DEPARTMENTS][FAIL] 19:20:00 - DEP-017: POST very long name -> FAIL (HTTP 500, )
[DEPARTMENTS][PASS] 19:20:01 - DEP-018: POST special chars in name -> PASS (HTTP 201)
[DEPARTMENTS][PASS] 19:20:01 - DEP-019: PUT update department (admin) -> PASS (HTTP 200)
[DEPARTMENTS][PASS] 19:20:01 - DEP-020: PUT update with empty name -> PASS (HTTP 400)
[DEPARTMENTS][PASS] 19:20:01 - DEP-021: PUT update as employee -> PASS (HTTP 403)
[DEPARTMENTS][PASS] 19:20:01 - DEP-022: PUT update without auth -> PASS (HTTP 401)
[DEPARTMENTS][PASS] 19:20:01 - DEP-023: PUT update non-existent -> PASS (HTTP 404)
[DEPARTMENTS][FAIL] 19:20:01 - DEP-024: PUT duplicate name -> FAIL (HTTP 200, {"success":true,"message":"Department updated successfully","data":{"department_id":63,"department_name":"DupeTarget-263415854","description":null,"manager_id":null,"budget":null,"location":null,"crea)
[DEPARTMENTS][FAIL] 19:20:02 - DEP-025: PUT update budget -> FAIL (HTTP 400, )
[DEPARTMENTS][WARN] 19:20:02 - DEP-026: SKIP (no manager test user available)
[DEPARTMENTS][PASS] 19:20:02 - DEP-027: DELETE department (admin) -> PASS (HTTP 200)
[DEPARTMENTS][PASS] 19:20:02 - DEP-028: DELETE as employee -> PASS (HTTP 403)
[DEPARTMENTS][WARN] 19:20:02 - DEP-029: SKIP (no manager test user)
[DEPARTMENTS][PASS] 19:20:02 - DEP-030: DELETE without auth -> PASS (HTTP 401)
[DEPARTMENTS][PASS] 19:20:03 - DEP-031: DELETE non-existent -> PASS (HTTP 404)
[DEPARTMENTS][PASS] 19:20:03 - DEP-032: DELETE dept with employees -> PASS (HTTP 400)
[DEPARTMENTS][PASS] 19:20:03 - DEP-033: GET with pagination -> PASS (HTTP 200)
[DEPARTMENTS][PASS] 19:20:04 - DEP-034: GET with invalid page -> PASS (HTTP 200)
[DEPARTMENTS][PASS] 19:20:04 - DEP-035: GET with sort -> PASS (HTTP 200)
[DEPARTMENTS][PASS] 19:20:04 - DEP-036: Create then GET confirms -> PASS (HTTP 200)
[DEPARTMENTS][PASS] 19:20:05 - DEP-037: Update then GET confirms -> PASS (HTTP 200)
[DEPARTMENTS][PASS] 19:20:06 - DEP-038: Delete then GET 404 -> PASS (HTTP 404)
[DEPARTMENTS][PASS] 19:20:06 - DEP-039: Tenant isolation (wrong tenant) -> PASS (HTTP 404)
[DEPARTMENTS][PASS] 19:20:06 - DEP-040: Missing tenant header -> PASS (HTTP 400)
[DEPARTMENTS][PASS] 19:20:06 - DEP-041: Response format check -> PASS (HTTP 200)
[DEPARTMENTS][FAIL] 19:20:06 - DEP-042: Error format check -> FAIL (HTTP 404, )
[DEPARTMENTS][PASS] 19:20:07 - DEP-043: Idempotent GET -> PASS (HTTP 200)
[DEPARTMENTS][PASS] 19:20:08 - DEP-044: GET with search filter -> PASS (HTTP 200)
[DEPARTMENTS][WARN] 19:20:08 - DEP-045: SKIP (rate limiting cannot be tested without batch requests)
[DEPARTMENTS][PASS] 19:20:08 - DEP-046: employee_count field present -> PASS (HTTP 200)
[DEPARTMENTS][PASS] 19:20:08 - DEP-047: POST create without manager (optional) -> PASS (HTTP 201)
[DEPARTMENTS][FAIL] 19:20:09 - DEP-048: PUT clear budget field -> FAIL (HTTP 400, )
[DEPARTMENTS][PASS] 19:20:09 - DEP-049: POST numeric name -> PASS (HTTP 201)
[DEPARTMENTS][PASS] 19:20:09 - DEP-050: Multiple deletes (idempotent) -> PASS (HTTP 404)
[DEPARTMENTS][FAIL] 19:20:09 - DEP-051: PUT partial update (description only) -> FAIL (HTTP 400, )
[DEPARTMENTS][PASS] 19:20:10 - DEP-052: POST create with description -> PASS (HTTP 201)
[DEPARTMENTS][FAIL] 19:20:10 - DEP-053: GET invalid ID format -> FAIL (HTTP 500, )
[DEPARTMENTS][PASS] 19:20:10 - DEP-054: POST large payload (10KB) -> PASS (HTTP 201)
[DEPARTMENTS][WARN] 19:20:10 - DEP-055: SKIP (no granular permission test user)

---

## Departments Module Results (Executed: 2026-05-27 19:20:10)

| Metric | Count |
|--------|------:|
| Total  | 55 |
| Pass   | 41 |
| Fail   | 10 |
| Skip   | 4 |
| Pass Rate | 74.5% |

[DEPARTMENTS][DONE] 19:20:10 - Departments: 41/55 PASS, 10 FAIL, 4 SKIP
[DEPARTMENTS][INFO] 19:27:23 - ===========================================
[DEPARTMENTS][START] 19:27:23 - Starting Departments Module Tests (55 cases)
[DEPARTMENTS][INFO] 19:27:23 - ===========================================
[DEPARTMENTS][PASS] 19:27:25 - Admin token obtained (length=204)
[DEPARTMENTS][PASS] 19:27:27 - Employee token obtained for emp.dept.1769772207@test.com
[DEPARTMENTS][PASS] 19:27:28 - DEP-001: GET /api/departments (admin) -> PASS (HTTP 200)
[DEPARTMENTS][INFO] 19:27:28 - Existing department ID: 109
[DEPARTMENTS][PASS] 19:27:28 - DEP-002: GET /api/departments (employee) -> PASS (HTTP 200)
[DEPARTMENTS][PASS] 19:27:29 - DEP-003: GET /api/departments (no auth) -> PASS (HTTP 401)
[DEPARTMENTS][PASS] 19:27:29 - DEP-004: GET /api/departments/:id (valid) -> PASS (HTTP 200)
[DEPARTMENTS][PASS] 19:27:29 - DEP-005: GET /api/departments/:id (404) -> PASS (HTTP 404)
[DEPARTMENTS][PASS] 19:27:29 - DEP-006: GET /api/departments/:id (string) -> PASS (HTTP 400)
[DEPARTMENTS][PASS] 19:27:30 - DEP-007: GET /api/departments/:id (SQL injection) -> PASS (HTTP 400)
[DEPARTMENTS][PASS] 19:27:30 - DEP-008: Response fields check -> PASS (HTTP 200)
[DEPARTMENTS][PASS] 19:27:30 - DEP-009: POST create valid department (admin) -> PASS (HTTP 201)
[DEPARTMENTS][PASS] 19:27:30 - DEP-010: POST create with empty name -> PASS (HTTP 400)
[DEPARTMENTS][PASS] 19:27:30 - DEP-011: POST create with duplicate name (no unique constraint) -> PASS (HTTP 201)
[DEPARTMENTS][PASS] 19:27:31 - DEP-012: POST create as employee -> PASS (HTTP 403)
[DEPARTMENTS][PASS] 19:27:31 - DEP-013: POST create without auth -> PASS (HTTP 401)
[DEPARTMENTS][PASS] 19:27:31 - DEP-014: POST SQL injection in name -> PASS (HTTP 201)
[DEPARTMENTS][PASS] 19:27:31 - DEP-015: POST XSS in name -> PASS (HTTP 201)
[DEPARTMENTS][PASS] 19:27:31 - DEP-016: POST create with budget -> PASS (HTTP 201)
[DEPARTMENTS][PASS] 19:27:31 - DEP-017: POST very long name -> PASS (HTTP 400)
[DEPARTMENTS][PASS] 19:27:33 - DEP-018: POST special chars in name -> PASS (HTTP 201)
[DEPARTMENTS][PASS] 19:27:33 - DEP-019: PUT update department (admin) -> PASS (HTTP 200)
[DEPARTMENTS][PASS] 19:27:33 - DEP-020: PUT update with empty name -> PASS (HTTP 400)
[DEPARTMENTS][PASS] 19:27:33 - DEP-021: PUT update as employee -> PASS (HTTP 403)
[DEPARTMENTS][PASS] 19:27:33 - DEP-022: PUT update without auth -> PASS (HTTP 401)
[DEPARTMENTS][PASS] 19:27:33 - DEP-023: PUT update non-existent -> PASS (HTTP 404)
[DEPARTMENTS][PASS] 19:27:34 - DEP-024: PUT duplicate name (no unique constraint) -> PASS (HTTP 200)
[DEPARTMENTS][PASS] 19:27:34 - DEP-025: PUT update budget -> PASS (HTTP 200)
[DEPARTMENTS][WARN] 19:27:37 - DEP-026: SKIP (no manager test user available)
[DEPARTMENTS][PASS] 19:27:37 - DEP-027: DELETE department (admin) -> PASS (HTTP 200)
[DEPARTMENTS][WARN] 19:27:38 - DEP-029: SKIP (no manager test user)
[DEPARTMENTS][PASS] 19:27:38 - DEP-030: DELETE without auth -> PASS (HTTP 401)
[DEPARTMENTS][PASS] 19:27:38 - DEP-031: DELETE non-existent -> PASS (HTTP 404)
[DEPARTMENTS][PASS] 19:27:38 - DEP-032: DELETE dept with employees -> PASS (HTTP 400)
[DEPARTMENTS][PASS] 19:27:39 - DEP-033: GET with pagination -> PASS (HTTP 200)
[DEPARTMENTS][PASS] 19:27:40 - DEP-034: GET with invalid page -> PASS (HTTP 200)
[DEPARTMENTS][PASS] 19:27:40 - DEP-035: GET with sort -> PASS (HTTP 200)
[DEPARTMENTS][PASS] 19:27:40 - DEP-036: Create then GET confirms -> PASS (HTTP 200)
[DEPARTMENTS][PASS] 19:27:41 - DEP-037: Update then GET confirms -> PASS (HTTP 200)
[DEPARTMENTS][PASS] 19:27:41 - DEP-038: Delete then GET 404 -> PASS (HTTP 404)
[DEPARTMENTS][PASS] 19:27:41 - DEP-039: Tenant isolation (wrong tenant) -> PASS (HTTP 404)
[DEPARTMENTS][PASS] 19:27:41 - DEP-040: Missing tenant header -> PASS (HTTP 400)
[DEPARTMENTS][PASS] 19:27:42 - DEP-041: Response format check -> PASS (HTTP 200)
[DEPARTMENTS][FAIL] 19:27:42 - DEP-042: Error format check -> FAIL (HTTP 404, )
[DEPARTMENTS][PASS] 19:27:43 - DEP-043: Idempotent GET -> PASS (HTTP 200)
[DEPARTMENTS][PASS] 19:27:43 - DEP-044: GET with search filter -> PASS (HTTP 200)
[DEPARTMENTS][WARN] 19:27:43 - DEP-045: SKIP (rate limiting cannot be tested without batch requests)
[DEPARTMENTS][PASS] 19:27:43 - DEP-046: employee_count field present -> PASS (HTTP 200)
[DEPARTMENTS][PASS] 19:27:44 - DEP-047: POST create without manager (optional) -> PASS (HTTP 201)
[DEPARTMENTS][FAIL] 19:27:44 - DEP-048: PUT clear budget field -> FAIL (HTTP 400, )
[DEPARTMENTS][PASS] 19:27:44 - DEP-049: POST numeric name -> PASS (HTTP 201)
[DEPARTMENTS][PASS] 19:27:45 - DEP-050: Multiple deletes (idempotent) -> PASS (HTTP 404)
[DEPARTMENTS][PASS] 19:27:45 - DEP-051: PUT partial update (description only) -> PASS (HTTP 200)
[DEPARTMENTS][PASS] 19:27:45 - DEP-052: POST create with description -> PASS (HTTP 201)
[DEPARTMENTS][PASS] 19:27:45 - DEP-053: GET invalid ID format -> PASS (HTTP 400)
[DEPARTMENTS][PASS] 19:27:46 - DEP-054: POST large payload (10KB) -> PASS (HTTP 201)
[DEPARTMENTS][WARN] 19:27:46 - DEP-055: SKIP (no granular permission test user)

---

## Departments Module Results (Executed: 2026-05-27 19:27:46)

| Metric | Count |
|--------|------:|
| Total  | 55 |
| Pass   | 49 |
| Fail   | 2 |
| Skip   | 4 |
| Pass Rate | 89.1% |

[DEPARTMENTS][DONE] 19:27:46 - Departments: 49/55 PASS, 2 FAIL, 4 SKIP
[DEPARTMENTS][INFO] 19:29:33 - ===========================================
[DEPARTMENTS][START] 19:29:33 - Starting Departments Module Tests (55 cases)
[DEPARTMENTS][INFO] 19:29:33 - ===========================================
[DEPARTMENTS][PASS] 19:29:34 - Admin token obtained (length=204)
[DEPARTMENTS][PASS] 19:29:36 - Employee token obtained for emp.dept.642782092@test.com
[DEPARTMENTS][PASS] 19:29:36 - DEP-001: GET /api/departments (admin) -> PASS (HTTP 200)
[DEPARTMENTS][INFO] 19:29:36 - Existing department ID: 126
[DEPARTMENTS][PASS] 19:29:37 - DEP-002: GET /api/departments (employee) -> PASS (HTTP 200)
[DEPARTMENTS][PASS] 19:29:37 - DEP-003: GET /api/departments (no auth) -> PASS (HTTP 401)
[DEPARTMENTS][PASS] 19:29:38 - DEP-004: GET /api/departments/:id (valid) -> PASS (HTTP 200)
[DEPARTMENTS][PASS] 19:29:38 - DEP-005: GET /api/departments/:id (404) -> PASS (HTTP 404)
[DEPARTMENTS][PASS] 19:29:38 - DEP-006: GET /api/departments/:id (string) -> PASS (HTTP 400)
[DEPARTMENTS][PASS] 19:29:38 - DEP-007: GET /api/departments/:id (SQL injection) -> PASS (HTTP 400)
[DEPARTMENTS][PASS] 19:29:38 - DEP-008: Response fields check -> PASS (HTTP 200)
[DEPARTMENTS][PASS] 19:29:39 - DEP-009: POST create valid department (admin) -> PASS (HTTP 201)
[DEPARTMENTS][PASS] 19:29:39 - DEP-010: POST create with empty name -> PASS (HTTP 400)
[DEPARTMENTS][PASS] 19:29:39 - DEP-011: POST create with duplicate name (no unique constraint) -> PASS (HTTP 201)
[DEPARTMENTS][PASS] 19:29:39 - DEP-012: POST create as employee -> PASS (HTTP 403)
[DEPARTMENTS][PASS] 19:29:39 - DEP-013: POST create without auth -> PASS (HTTP 401)
[DEPARTMENTS][PASS] 19:29:40 - DEP-014: POST SQL injection in name -> PASS (HTTP 201)
[DEPARTMENTS][PASS] 19:29:40 - DEP-015: POST XSS in name -> PASS (HTTP 201)
[DEPARTMENTS][PASS] 19:29:40 - DEP-016: POST create with budget -> PASS (HTTP 201)
[DEPARTMENTS][PASS] 19:29:40 - DEP-017: POST very long name -> PASS (HTTP 400)
[DEPARTMENTS][PASS] 19:29:40 - DEP-018: POST special chars in name -> PASS (HTTP 201)
[DEPARTMENTS][PASS] 19:29:40 - DEP-019: PUT update department (admin) -> PASS (HTTP 200)
[DEPARTMENTS][PASS] 19:29:41 - DEP-020: PUT update with empty name -> PASS (HTTP 400)
[DEPARTMENTS][PASS] 19:29:41 - DEP-021: PUT update as employee -> PASS (HTTP 403)
[DEPARTMENTS][PASS] 19:29:41 - DEP-022: PUT update without auth -> PASS (HTTP 401)
[DEPARTMENTS][PASS] 19:29:41 - DEP-023: PUT update non-existent -> PASS (HTTP 404)
[DEPARTMENTS][PASS] 19:29:41 - DEP-024: PUT duplicate name (no unique constraint) -> PASS (HTTP 200)
[DEPARTMENTS][PASS] 19:29:42 - DEP-025: PUT update budget -> PASS (HTTP 200)
[DEPARTMENTS][WARN] 19:29:42 - DEP-026: SKIP (no manager test user available)
[DEPARTMENTS][PASS] 19:29:42 - DEP-027: DELETE department (admin) -> PASS (HTTP 200)
[DEPARTMENTS][PASS] 19:29:42 - DEP-028: DELETE as employee -> PASS (HTTP 403)
[DEPARTMENTS][WARN] 19:29:42 - DEP-029: SKIP (no manager test user)
[DEPARTMENTS][PASS] 19:29:42 - DEP-030: DELETE without auth -> PASS (HTTP 401)
[DEPARTMENTS][PASS] 19:29:42 - DEP-031: DELETE non-existent -> PASS (HTTP 404)
[DEPARTMENTS][PASS] 19:29:43 - DEP-032: DELETE dept with employees -> PASS (HTTP 400)
[DEPARTMENTS][PASS] 19:29:43 - DEP-033: GET with pagination -> PASS (HTTP 200)
[DEPARTMENTS][PASS] 19:29:44 - DEP-034: GET with invalid page -> PASS (HTTP 200)
[DEPARTMENTS][PASS] 19:29:44 - DEP-035: GET with sort -> PASS (HTTP 200)
[DEPARTMENTS][PASS] 19:29:45 - DEP-036: Create then GET confirms -> PASS (HTTP 200)
[DEPARTMENTS][PASS] 19:29:45 - DEP-037: Update then GET confirms -> PASS (HTTP 200)
[DEPARTMENTS][PASS] 19:29:48 - DEP-038: Delete then GET 404 -> PASS (HTTP 404)
[DEPARTMENTS][PASS] 19:29:48 - DEP-039: Tenant isolation (wrong tenant) -> PASS (HTTP 404)
[DEPARTMENTS][PASS] 19:29:48 - DEP-040: Missing tenant header -> PASS (HTTP 400)
[DEPARTMENTS][PASS] 19:29:49 - DEP-041: Response format check -> PASS (HTTP 200)
[DEPARTMENTS][FAIL] 19:29:49 - DEP-042: Error format check -> FAIL (HTTP 404, )
[DEPARTMENTS][PASS] 19:29:51 - DEP-043: Idempotent GET -> PASS (HTTP 200)
[DEPARTMENTS][PASS] 19:29:51 - DEP-044: GET with search filter -> PASS (HTTP 200)
[DEPARTMENTS][WARN] 19:29:51 - DEP-045: SKIP (rate limiting cannot be tested without batch requests)
[DEPARTMENTS][PASS] 19:29:52 - DEP-046: employee_count field present -> PASS (HTTP 200)
[DEPARTMENTS][PASS] 19:29:52 - DEP-047: POST create without manager (optional) -> PASS (HTTP 201)
[DEPARTMENTS][PASS] 19:29:52 - DEP-048: PUT clear budget field -> PASS (HTTP 400)
[DEPARTMENTS][PASS] 19:29:52 - DEP-049: POST numeric name -> PASS (HTTP 201)
[DEPARTMENTS][PASS] 19:29:53 - DEP-050: Multiple deletes (idempotent) -> PASS (HTTP 404)
[DEPARTMENTS][PASS] 19:29:54 - DEP-051: PUT partial update (description only) -> PASS (HTTP 200)
[DEPARTMENTS][PASS] 19:29:54 - DEP-052: POST create with description -> PASS (HTTP 201)
[DEPARTMENTS][PASS] 19:29:54 - DEP-053: GET invalid ID format -> PASS (HTTP 400)
[DEPARTMENTS][PASS] 19:29:55 - DEP-054: POST large payload (10KB) -> PASS (HTTP 201)
[DEPARTMENTS][WARN] 19:29:55 - DEP-055: SKIP (no granular permission test user)

---

## Departments Module Results (Executed: 2026-05-27 19:29:55)

| Metric | Count |
|--------|------:|
| Total  | 55 |
| Pass   | 50 |
| Fail   | 1 |
| Skip   | 4 |
| Pass Rate | 90.9% |

[DEPARTMENTS][DONE] 19:29:55 - Departments: 50/55 PASS, 1 FAIL, 4 SKIP
[DEPARTMENTS][INFO] 19:31:55 - ===========================================
[DEPARTMENTS][START] 19:31:55 - Starting Departments Module Tests (55 cases)
[DEPARTMENTS][INFO] 19:31:55 - ===========================================
[DEPARTMENTS][PASS] 19:31:59 - Admin token obtained (length=204)
[DEPARTMENTS][PASS] 19:32:00 - Employee token obtained for emp.dept.2005221810@test.com
[DEPARTMENTS][PASS] 19:32:01 - DEP-001: GET /api/departments (admin) -> PASS (HTTP 200)
[DEPARTMENTS][INFO] 19:32:01 - Existing department ID: 143
[DEPARTMENTS][PASS] 19:32:01 - DEP-002: GET /api/departments (employee) -> PASS (HTTP 200)
[DEPARTMENTS][PASS] 19:32:02 - DEP-003: GET /api/departments (no auth) -> PASS (HTTP 401)
[DEPARTMENTS][PASS] 19:32:02 - DEP-004: GET /api/departments/:id (valid) -> PASS (HTTP 200)
[DEPARTMENTS][PASS] 19:32:02 - DEP-005: GET /api/departments/:id (404) -> PASS (HTTP 404)
[DEPARTMENTS][PASS] 19:32:02 - DEP-006: GET /api/departments/:id (string) -> PASS (HTTP 400)
[DEPARTMENTS][PASS] 19:32:02 - DEP-007: GET /api/departments/:id (SQL injection) -> PASS (HTTP 400)
[DEPARTMENTS][PASS] 19:32:02 - DEP-008: Response fields check -> PASS (HTTP 200)
[DEPARTMENTS][PASS] 19:32:02 - DEP-009: POST create valid department (admin) -> PASS (HTTP 201)
[DEPARTMENTS][PASS] 19:32:03 - DEP-010: POST create with empty name -> PASS (HTTP 400)
[DEPARTMENTS][PASS] 19:32:03 - DEP-011: POST create with duplicate name (no unique constraint) -> PASS (HTTP 201)
[DEPARTMENTS][PASS] 19:32:03 - DEP-012: POST create as employee -> PASS (HTTP 403)
[DEPARTMENTS][PASS] 19:32:03 - DEP-013: POST create without auth -> PASS (HTTP 401)
[DEPARTMENTS][PASS] 19:32:05 - DEP-014: POST SQL injection in name -> PASS (HTTP 201)
[DEPARTMENTS][PASS] 19:32:06 - DEP-015: POST XSS in name -> PASS (HTTP 201)
[DEPARTMENTS][PASS] 19:32:06 - DEP-016: POST create with budget -> PASS (HTTP 201)
[DEPARTMENTS][PASS] 19:32:07 - DEP-018: POST special chars in name -> PASS (HTTP 201)
[DEPARTMENTS][PASS] 19:32:07 - DEP-019: PUT update department (admin) -> PASS (HTTP 200)
[DEPARTMENTS][PASS] 19:32:07 - DEP-020: PUT update with empty name -> PASS (HTTP 400)
[DEPARTMENTS][PASS] 19:32:07 - DEP-021: PUT update as employee -> PASS (HTTP 403)
[DEPARTMENTS][PASS] 19:32:08 - DEP-022: PUT update without auth -> PASS (HTTP 401)
[DEPARTMENTS][PASS] 19:32:08 - DEP-023: PUT update non-existent -> PASS (HTTP 404)
[DEPARTMENTS][PASS] 19:32:08 - DEP-024: PUT duplicate name (no unique constraint) -> PASS (HTTP 200)
[DEPARTMENTS][PASS] 19:32:09 - DEP-025: PUT update budget -> PASS (HTTP 200)
[DEPARTMENTS][WARN] 19:32:09 - DEP-026: SKIP (no manager test user available)
[DEPARTMENTS][PASS] 19:32:10 - DEP-027: DELETE department (admin) -> PASS (HTTP 200)
[DEPARTMENTS][WARN] 19:32:10 - DEP-029: SKIP (no manager test user)
[DEPARTMENTS][PASS] 19:32:10 - DEP-030: DELETE without auth -> PASS (HTTP 401)
[DEPARTMENTS][PASS] 19:32:10 - DEP-031: DELETE non-existent -> PASS (HTTP 404)
[DEPARTMENTS][PASS] 19:32:12 - DEP-033: GET with pagination -> PASS (HTTP 200)
[DEPARTMENTS][PASS] 19:32:13 - DEP-034: GET with invalid page -> PASS (HTTP 200)
[DEPARTMENTS][PASS] 19:32:15 - DEP-035: GET with sort -> PASS (HTTP 200)
[DEPARTMENTS][PASS] 19:32:15 - DEP-036: Create then GET confirms -> PASS (HTTP 200)
[DEPARTMENTS][PASS] 19:32:16 - DEP-037: Update then GET confirms -> PASS (HTTP 200)
[DEPARTMENTS][PASS] 19:32:18 - DEP-038: Delete then GET 404 -> PASS (HTTP 404)
[DEPARTMENTS][PASS] 19:32:18 - DEP-039: Tenant isolation (wrong tenant) -> PASS (HTTP 404)
[DEPARTMENTS][PASS] 19:32:18 - DEP-040: Missing tenant header -> PASS (HTTP 400)
[DEPARTMENTS][PASS] 19:32:18 - DEP-041: Response format check -> PASS (HTTP 200)
[DEPARTMENTS][PASS] 19:32:19 - DEP-042: Error format check -> PASS (HTTP 404)
[DEPARTMENTS][PASS] 19:32:20 - DEP-043: Idempotent GET -> PASS (HTTP 200)
[DEPARTMENTS][PASS] 19:32:21 - DEP-044: GET with search filter -> PASS (HTTP 200)
[DEPARTMENTS][WARN] 19:32:21 - DEP-045: SKIP (rate limiting cannot be tested without batch requests)
[DEPARTMENTS][PASS] 19:32:21 - DEP-046: employee_count field present -> PASS (HTTP 200)
[DEPARTMENTS][PASS] 19:32:21 - DEP-047: POST create without manager (optional) -> PASS (HTTP 201)
[DEPARTMENTS][PASS] 19:32:22 - DEP-048: PUT clear budget field -> PASS (HTTP 400)
[DEPARTMENTS][PASS] 19:32:22 - DEP-049: POST numeric name -> PASS (HTTP 201)
[DEPARTMENTS][PASS] 19:32:22 - DEP-050: Multiple deletes (idempotent) -> PASS (HTTP 404)
[DEPARTMENTS][PASS] 19:32:22 - DEP-051: PUT partial update (description only) -> PASS (HTTP 200)
[DEPARTMENTS][PASS] 19:32:24 - DEP-052: POST create with description -> PASS (HTTP 201)
[DEPARTMENTS][PASS] 19:32:24 - DEP-053: GET invalid ID format -> PASS (HTTP 400)
[DEPARTMENTS][PASS] 19:32:24 - DEP-054: POST large payload (10KB) -> PASS (HTTP 201)
[DEPARTMENTS][WARN] 19:32:24 - DEP-055: SKIP (no granular permission test user)

---

## Departments Module Results (Executed: 2026-05-27 19:32:24)

| Metric | Count |
|--------|------:|
| Total  | 55 |
| Pass   | 51 |
| Fail   | 0 |
| Skip   | 4 |
| Pass Rate | 92.7% |

[DEPARTMENTS][DONE] 19:32:25 - Departments: 51/55 PASS, 0 FAIL, 4 SKIP
[EMPLOYEES][START] 19:34:54 - === Employees Module Tests (55 cases) ===
[EMPLOYEES][PASS] 19:34:58 - Admin token obtained
[EMPLOYEES][PASS] 19:34:59 - Employee token obtained
[EMPLOYEES][PASS] 19:34:59 - EMP-001: GET with pagination -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:34:59 - EMP-001: GET with pagination -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:34:59 - EMP-001: GET /api/employees paginated -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:35:00 - EMP-002: GET without auth -> PASS (HTTP 401)
[EMPLOYEES][PASS] 19:35:00 - EMP-003: GET as employee -> PASS (HTTP 403)
[EMPLOYEES][PASS] 19:35:00 - EMP-005: GET filtered by department -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:35:00 - EMP-006: GET filtered by status -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:35:01 - EMP-007: GET with search -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:35:01 - EMP-008: GET pagination fields -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:35:01 - EMP-009: GET empty page -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:35:01 - EMP-010: GET with sort -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:35:01 - EMP-011: GET by valid ID -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:35:01 - EMP-012: GET non-existent ID -> PASS (HTTP 404)
[EMPLOYEES][WARN] 19:35:02 - EMP-013: SKIP
[EMPLOYEES][PASS] 19:35:02 - EMP-014: GET other record as employee -> PASS (HTTP 403)
[EMPLOYEES][FAIL] 19:35:02 - EMP-015: GET invalid ID -> FAIL (HTTP 500, {"success":false,"message":"invalid input syntax for type integer: \"abc\"","stack":"error: invalid input syntax for type integer: \"abc\"\n    at C:\\Users\\User\\Desktop\\shashank\\hrms-2025\\backen)
[EMPLOYEES][FAIL] 19:35:03 - EMP-016: GET by user ID -> FAIL (HTTP 500, {"success":false,"message":"invalid input syntax for type integer: \"user\"","stack":"error: invalid input syntax for type integer: \"user\"\n    at C:\\Users\\User\\Desktop\\shashank\\hrms-2025\\back)
[EMPLOYEES][PASS] 19:35:03 - EMP-017: GET non-existent user ID -> PASS (HTTP 404)
[EMPLOYEES][PASS] 19:35:03 - EMP-018: GET QR code -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:35:03 - EMP-019: GET QR code 404 -> PASS (HTTP 404)
[EMPLOYEES][PASS] 19:35:04 - EMP-020: GET org chart -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:35:04 - EMP-021: GET org chart as employee -> PASS (HTTP 403)
[EMPLOYEES][PASS] 19:35:04 - EMP-022: GET chat list -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:35:04 - EMP-023: GET chat with search -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:35:05 - EMP-024: POST create employee -> PASS (HTTP 201)
[EMPLOYEES][PASS] 19:35:05 - EMP-025: POST duplicate email -> PASS (HTTP 409)
[EMPLOYEES][PASS] 19:35:05 - EMP-026: POST create as employee -> PASS (HTTP 403)
[EMPLOYEES][PASS] 19:35:05 - EMP-027: POST create without auth -> PASS (HTTP 401)
[EMPLOYEES][PASS] 19:35:05 - EMP-028: POST missing first_name -> PASS (HTTP 400)
[EMPLOYEES][PASS] 19:35:05 - EMP-029: POST missing email -> PASS (HTTP 400)
[EMPLOYEES][PASS] 19:35:06 - EMP-030: POST invalid email -> PASS (HTTP 400)
[EMPLOYEES][PASS] 19:35:06 - EMP-031: POST SQL injection -> PASS (HTTP 201)
[EMPLOYEES][PASS] 19:35:07 - EMP-032: POST XSS in name -> PASS (HTTP 201)
[EMPLOYEES][PASS] 19:35:07 - EMP-033: POST all optional fields -> PASS (HTTP 201)
[EMPLOYEES][WARN] 19:35:07 - EMP-034: SKIP (multipart upload requires file)
[EMPLOYEES][PASS] 19:35:08 - EMP-035: PUT update employee -> PASS (HTTP 200)
[EMPLOYEES][FAIL] 19:35:08 - EMP-036: PUT own record as employee -> FAIL (HTTP 403, {"success":false,"message":"You can only update your own profile"})
[EMPLOYEES][PASS] 19:35:08 - EMP-037: PUT other record as employee -> PASS (HTTP 403)
[EMPLOYEES][PASS] 19:35:08 - EMP-038: PUT empty required field -> PASS (HTTP 400)
[EMPLOYEES][PASS] 19:35:09 - EMP-039: PUT same email (no conflict) -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:35:09 - EMP-040: PATCH partial update -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:35:09 - EMP-041: PATCH single field -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:35:10 - EMP-042: DELETE employee -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:35:10 - EMP-043: DELETE as employee -> PASS (HTTP 403)
[EMPLOYEES][WARN] 19:35:11 - EMP-044: SKIP (covered by 043)
[EMPLOYEES][PASS] 19:35:11 - EMP-045: DELETE non-existent -> PASS (HTTP 404)
[EMPLOYEES][PASS] 19:35:12 - EMP-046: POST delete by email -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:35:12 - EMP-047: POST delete non-existent email -> PASS (HTTP 404)
[EMPLOYEES][PASS] 19:35:12 - EMP-048: POST delete by email missing field -> PASS (HTTP 400)
[EMPLOYEES][PASS] 19:35:12 - EMP-049: Response has required fields -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:35:13 - EMP-050: POST future hire_date -> PASS (HTTP 201)
[EMPLOYEES][FAIL] 19:35:13 - EMP-051: POST very long name -> FAIL (HTTP 500, {"success":false,"message":"value too long for type character varying(100)","stack":"error: value too long for type character varying(100)\n    at C:\\Users\\User\\Desktop\\shashank\\hrms-2025\\backen)
[EMPLOYEES][PASS] 19:35:14 - EMP-053: Count matches total -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:35:14 - EMP-054: PUT update status -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:35:15 - EMP-055: Create then verify via user/:userId -> PASS (HTTP 200)

---

## Employees Module Results (Executed: 2026-05-27 19:35:15)

| Metric | Count |
|--------|------:|
| Total  | 54 |
| Pass   | 47 |
| Fail   | 4 |
| Skip   | 3 |
| Pass Rate | 87% |

[EMPLOYEES][DONE] 19:35:15 - Employees: 47/54 PASS, 4 FAIL, 3 SKIP
[EMPLOYEES][START] 19:43:39 - === Employees Module Tests (55 cases) ===
[EMPLOYEES][PASS] 19:43:41 - Admin token obtained
[EMPLOYEES][PASS] 19:43:42 - Employee token obtained
[EMPLOYEES][PASS] 19:43:43 - Employee own record created: ID=163, can login
[EMPLOYEES][PASS] 19:43:43 - EMP-001: GET with pagination -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:43:43 - EMP-001: GET with pagination -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:43:43 - EMP-001: GET /api/employees paginated -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:43:43 - EMP-002: GET without auth -> PASS (HTTP 401)
[EMPLOYEES][PASS] 19:43:43 - EMP-003: GET as employee -> PASS (HTTP 403)
[EMPLOYEES][PASS] 19:43:44 - EMP-005: GET filtered by department -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:43:44 - EMP-006: GET filtered by status -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:43:44 - EMP-007: GET with search -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:43:44 - EMP-008: GET pagination fields -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:43:44 - EMP-009: GET empty page -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:43:45 - EMP-010: GET with sort -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:43:45 - EMP-011: GET by valid ID -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:43:45 - EMP-012: GET non-existent ID -> PASS (HTTP 404)
[EMPLOYEES][WARN] 19:43:45 - EMP-013: SKIP
[EMPLOYEES][PASS] 19:43:45 - EMP-014: GET other record as employee -> PASS (HTTP 403)
[EMPLOYEES][PASS] 19:43:45 - EMP-015: GET invalid ID -> PASS (HTTP 400)
[EMPLOYEES][FAIL] 19:43:48 - EMP-016: GET by user ID -> FAIL (HTTP 400, {"success":false,"message":"Invalid employee ID"})
[EMPLOYEES][PASS] 19:43:48 - EMP-017: GET non-existent user ID -> PASS (HTTP 404)
[EMPLOYEES][PASS] 19:43:48 - EMP-018: GET QR code -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:43:48 - EMP-019: GET QR code 404 -> PASS (HTTP 404)
[EMPLOYEES][PASS] 19:43:49 - EMP-020: GET org chart -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:43:49 - EMP-021: GET org chart as employee -> PASS (HTTP 403)
[EMPLOYEES][PASS] 19:43:49 - EMP-022: GET chat list -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:43:49 - EMP-023: GET chat with search -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:43:51 - EMP-024: POST create employee -> PASS (HTTP 201)
[EMPLOYEES][PASS] 19:43:51 - EMP-025: POST duplicate email -> PASS (HTTP 409)
[EMPLOYEES][PASS] 19:43:51 - EMP-026: POST create as employee -> PASS (HTTP 403)
[EMPLOYEES][PASS] 19:43:51 - EMP-027: POST create without auth -> PASS (HTTP 401)
[EMPLOYEES][PASS] 19:43:51 - EMP-028: POST missing first_name -> PASS (HTTP 400)
[EMPLOYEES][PASS] 19:43:52 - EMP-029: POST missing email -> PASS (HTTP 400)
[EMPLOYEES][PASS] 19:43:52 - EMP-030: POST invalid email -> PASS (HTTP 400)
[EMPLOYEES][PASS] 19:43:52 - EMP-031: POST SQL injection -> PASS (HTTP 201)
[EMPLOYEES][PASS] 19:43:54 - EMP-032: POST XSS in name -> PASS (HTTP 201)
[EMPLOYEES][PASS] 19:43:55 - EMP-033: POST all optional fields -> PASS (HTTP 201)
[EMPLOYEES][WARN] 19:43:55 - EMP-034: SKIP (multipart upload requires file)
[EMPLOYEES][PASS] 19:43:55 - EMP-035: PUT update employee -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:43:55 - EMP-036: PUT own record as employee -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:43:56 - EMP-037: PUT other record as employee -> PASS (HTTP 403)
[EMPLOYEES][PASS] 19:43:56 - EMP-038: PUT empty required field -> PASS (HTTP 400)
[EMPLOYEES][PASS] 19:43:56 - EMP-039: PUT same email (no conflict) -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:43:56 - EMP-040: PATCH partial update -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:43:57 - EMP-041: PATCH single field -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:43:57 - EMP-042: DELETE employee -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:43:57 - EMP-043: DELETE as employee -> PASS (HTTP 403)
[EMPLOYEES][WARN] 19:43:57 - EMP-044: SKIP (covered by 043)
[EMPLOYEES][PASS] 19:43:57 - EMP-045: DELETE non-existent -> PASS (HTTP 404)
[EMPLOYEES][PASS] 19:43:58 - EMP-046: POST delete by email -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:43:58 - EMP-047: POST delete non-existent email -> PASS (HTTP 404)
[EMPLOYEES][PASS] 19:43:58 - EMP-048: POST delete by email missing field -> PASS (HTTP 400)
[EMPLOYEES][PASS] 19:43:58 - EMP-049: Response has required fields -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:43:59 - EMP-050: POST future hire_date -> PASS (HTTP 201)
[EMPLOYEES][PASS] 19:43:59 - EMP-051: POST very long name -> PASS (HTTP 400)
[EMPLOYEES][PASS] 19:44:00 - EMP-052: Tenant isolation -> PASS (HTTP 404)
[EMPLOYEES][PASS] 19:44:00 - EMP-053: Count matches total -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:44:00 - EMP-054: PUT update status -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:44:02 - EMP-055: Create then verify via user/:userId -> PASS (HTTP 200)

---

## Employees Module Results (Executed: 2026-05-27 19:44:02)

| Metric | Count |
|--------|------:|
| Total  | 54 |
| Pass   | 50 |
| Fail   | 1 |
| Skip   | 3 |
| Pass Rate | 92.6% |

[EMPLOYEES][DONE] 19:44:02 - Employees: 50/54 PASS, 1 FAIL, 3 SKIP
[EMPLOYEES][START] 19:45:58 - === Employees Module Tests (55 cases) ===
[EMPLOYEES][PASS] 19:45:59 - Admin token obtained
[EMPLOYEES][PASS] 19:46:00 - Employee token obtained
[EMPLOYEES][PASS] 19:46:03 - Employee own record created: ID=171, can login
[EMPLOYEES][PASS] 19:46:04 - EMP-001: GET with pagination -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:46:04 - EMP-001: GET with pagination -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:46:05 - EMP-001: GET /api/employees paginated -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:46:05 - EMP-002: GET without auth -> PASS (HTTP 401)
[EMPLOYEES][PASS] 19:46:05 - EMP-003: GET as employee -> PASS (HTTP 403)
[EMPLOYEES][PASS] 19:46:05 - EMP-005: GET filtered by department -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:46:05 - EMP-006: GET filtered by status -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:46:05 - EMP-007: GET with search -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:46:05 - EMP-008: GET pagination fields -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:46:06 - EMP-009: GET empty page -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:46:06 - EMP-010: GET with sort -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:46:06 - EMP-011: GET by valid ID -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:46:06 - EMP-012: GET non-existent ID -> PASS (HTTP 404)
[EMPLOYEES][WARN] 19:46:06 - EMP-013: SKIP
[EMPLOYEES][PASS] 19:46:06 - EMP-014: GET other record as employee -> PASS (HTTP 403)
[EMPLOYEES][PASS] 19:46:06 - EMP-015: GET invalid ID -> PASS (HTTP 400)
[EMPLOYEES][FAIL] 19:46:07 - EMP-016: GET by user ID -> FAIL (HTTP 404, {"success":false,"message":"Employee not found"})
[EMPLOYEES][PASS] 19:46:07 - EMP-017: GET non-existent user ID -> PASS (HTTP 404)
[EMPLOYEES][PASS] 19:46:07 - EMP-018: GET QR code -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:46:07 - EMP-019: GET QR code 404 -> PASS (HTTP 404)
[EMPLOYEES][PASS] 19:46:07 - EMP-020: GET org chart -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:46:07 - EMP-021: GET org chart as employee -> PASS (HTTP 403)
[EMPLOYEES][PASS] 19:46:08 - EMP-022: GET chat list -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:46:08 - EMP-023: GET chat with search -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:46:09 - EMP-024: POST create employee -> PASS (HTTP 201)
[EMPLOYEES][PASS] 19:46:09 - EMP-025: POST duplicate email -> PASS (HTTP 409)
[EMPLOYEES][PASS] 19:46:09 - EMP-026: POST create as employee -> PASS (HTTP 403)
[EMPLOYEES][PASS] 19:46:09 - EMP-027: POST create without auth -> PASS (HTTP 401)
[EMPLOYEES][PASS] 19:46:10 - EMP-028: POST missing first_name -> PASS (HTTP 400)
[EMPLOYEES][PASS] 19:46:10 - EMP-029: POST missing email -> PASS (HTTP 400)
[EMPLOYEES][PASS] 19:46:10 - EMP-030: POST invalid email -> PASS (HTTP 400)
[EMPLOYEES][PASS] 19:46:17 - EMP-031: POST SQL injection -> PASS (HTTP 201)
[EMPLOYEES][PASS] 19:46:22 - EMP-032: POST XSS in name -> PASS (HTTP 201)
[EMPLOYEES][PASS] 19:46:23 - EMP-033: POST all optional fields -> PASS (HTTP 201)
[EMPLOYEES][WARN] 19:46:23 - EMP-034: SKIP (multipart upload requires file)
[EMPLOYEES][PASS] 19:46:24 - EMP-035: PUT update employee -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:46:25 - EMP-036: PUT own record as employee -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:46:25 - EMP-037: PUT other record as employee -> PASS (HTTP 403)
[EMPLOYEES][PASS] 19:46:26 - EMP-039: PUT same email (no conflict) -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:46:26 - EMP-040: PATCH partial update -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:46:28 - EMP-041: PATCH single field -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:46:29 - EMP-042: DELETE employee -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:46:30 - EMP-043: DELETE as employee -> PASS (HTTP 403)
[EMPLOYEES][WARN] 19:46:30 - EMP-044: SKIP (covered by 043)
[EMPLOYEES][PASS] 19:46:30 - EMP-045: DELETE non-existent -> PASS (HTTP 404)
[EMPLOYEES][PASS] 19:46:31 - EMP-046: POST delete by email -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:46:31 - EMP-047: POST delete non-existent email -> PASS (HTTP 404)
[EMPLOYEES][PASS] 19:46:31 - EMP-048: POST delete by email missing field -> PASS (HTTP 400)
[EMPLOYEES][PASS] 19:46:33 - EMP-049: Response has required fields -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:46:37 - EMP-050: POST future hire_date -> PASS (HTTP 201)
[EMPLOYEES][PASS] 19:46:37 - EMP-051: POST very long name -> PASS (HTTP 400)
[EMPLOYEES][PASS] 19:46:38 - EMP-053: Count matches total -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:46:38 - EMP-054: PUT update status -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:46:40 - EMP-055: Create then verify via user/:userId -> PASS (HTTP 200)

---

## Employees Module Results (Executed: 2026-05-27 19:46:40)

| Metric | Count |
|--------|------:|
| Total  | 54 |
| Pass   | 50 |
| Fail   | 1 |
| Skip   | 3 |
| Pass Rate | 92.6% |

[EMPLOYEES][DONE] 19:46:40 - Employees: 50/54 PASS, 1 FAIL, 3 SKIP
[EMPLOYEES][START] 19:52:39 - === Employees Module Tests (55 cases) ===
[EMPLOYEES][PASS] 19:52:45 - Admin token obtained
[EMPLOYEES][PASS] 19:52:46 - Employee token obtained
[EMPLOYEES][PASS] 19:53:05 - Employee own record created: ID=179, can login
[EMPLOYEES][PASS] 19:53:12 - EMP-001: GET with pagination -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:53:12 - EMP-001: GET with pagination -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:53:16 - EMP-001: GET /api/employees paginated -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:53:19 - EMP-002: GET without auth -> PASS (HTTP 401)
[EMPLOYEES][PASS] 19:53:27 - EMP-005: GET filtered by department -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:53:28 - EMP-006: GET filtered by status -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:53:29 - EMP-007: GET with search -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:53:32 - EMP-008: GET pagination fields -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:53:46 - EMP-009: GET empty page -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:53:52 - EMP-010: GET with sort -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:53:53 - EMP-011: GET by valid ID -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:53:58 - EMP-012: GET non-existent ID -> PASS (HTTP 404)
[EMPLOYEES][WARN] 19:54:41 - EMP-013: SKIP
[EMPLOYEES][PASS] 19:54:41 - EMP-014: GET other record as employee -> PASS (HTTP 403)
[EMPLOYEES][PASS] 19:54:41 - EMP-015: GET invalid ID -> PASS (HTTP 400)
[EMPLOYEES][PASS] 19:54:42 - EMP-016: GET by user ID -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:54:42 - EMP-017: GET non-existent user ID -> PASS (HTTP 404)
[EMPLOYEES][PASS] 19:54:43 - EMP-018: GET QR code -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:54:43 - EMP-019: GET QR code 404 -> PASS (HTTP 404)
[EMPLOYEES][PASS] 19:54:44 - EMP-020: GET org chart -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:54:44 - EMP-021: GET org chart as employee -> PASS (HTTP 403)
[EMPLOYEES][PASS] 19:54:51 - EMP-022: GET chat list -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:54:51 - EMP-023: GET chat with search -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:54:57 - EMP-024: POST create employee -> PASS (HTTP 201)
[EMPLOYEES][PASS] 19:54:57 - EMP-025: POST duplicate email -> PASS (HTTP 409)
[EMPLOYEES][PASS] 19:54:57 - EMP-026: POST create as employee -> PASS (HTTP 403)
[EMPLOYEES][PASS] 19:54:57 - EMP-027: POST create without auth -> PASS (HTTP 401)
[EMPLOYEES][PASS] 19:54:57 - EMP-028: POST missing first_name -> PASS (HTTP 400)
[EMPLOYEES][PASS] 19:54:58 - EMP-029: POST missing email -> PASS (HTTP 400)
[EMPLOYEES][PASS] 19:54:58 - EMP-030: POST invalid email -> PASS (HTTP 400)
[EMPLOYEES][PASS] 19:54:59 - EMP-031: POST SQL injection -> PASS (HTTP 201)
[EMPLOYEES][PASS] 19:54:59 - EMP-032: POST XSS in name -> PASS (HTTP 201)
[EMPLOYEES][PASS] 19:55:08 - EMP-033: POST all optional fields -> PASS (HTTP 201)
[EMPLOYEES][WARN] 19:55:08 - EMP-034: SKIP (multipart upload requires file)
[EMPLOYEES][PASS] 19:55:08 - EMP-035: PUT update employee -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:55:09 - EMP-036: PUT own record as employee -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:55:09 - EMP-037: PUT other record as employee -> PASS (HTTP 403)
[EMPLOYEES][PASS] 19:55:09 - EMP-038: PUT empty required field -> PASS (HTTP 400)
[EMPLOYEES][PASS] 19:55:09 - EMP-039: PUT same email (no conflict) -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:55:10 - EMP-040: PATCH partial update -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:55:11 - EMP-041: PATCH single field -> PASS (HTTP 200)
[EMPLOYEES][START] 19:57:06 - === Employees Module Tests (55 cases) ===
[EMPLOYEES][PASS] 19:57:10 - Admin token obtained
[EMPLOYEES][PASS] 19:57:11 - Employee token obtained
[EMPLOYEES][PASS] 19:57:13 - Employee own record created: ID=184, can login
[EMPLOYEES][PASS] 19:57:14 - EMP-001: GET with pagination -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:57:14 - EMP-001: GET with pagination -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:57:14 - EMP-001: GET /api/employees paginated -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:57:14 - EMP-002: GET without auth -> PASS (HTTP 401)
[EMPLOYEES][PASS] 19:57:14 - EMP-003: GET as employee (blocked) -> PASS (HTTP 403)
[EMPLOYEES][PASS] 19:57:21 - EMP-005: GET filtered by department -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:57:21 - EMP-006: GET filtered by status -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:57:21 - EMP-007: GET with search -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:57:22 - EMP-008: GET pagination fields -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:57:22 - EMP-009: GET empty page -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:57:22 - EMP-010: GET with sort -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:57:24 - EMP-011: GET by valid ID -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:57:24 - EMP-012: GET non-existent ID -> PASS (HTTP 404)
[EMPLOYEES][WARN] 19:57:24 - EMP-013: SKIP
[EMPLOYEES][PASS] 19:57:24 - EMP-014: GET other record as employee -> PASS (HTTP 403)
[EMPLOYEES][PASS] 19:57:24 - EMP-015: GET invalid ID -> PASS (HTTP 400)
[EMPLOYEES][PASS] 19:57:28 - EMP-016: GET by user ID -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:57:29 - EMP-017: GET non-existent user ID -> PASS (HTTP 404)
[EMPLOYEES][PASS] 19:57:29 - EMP-018: GET QR code -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:57:29 - EMP-019: GET QR code 404 -> PASS (HTTP 404)
[EMPLOYEES][PASS] 19:57:30 - EMP-020: GET org chart -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:57:30 - EMP-021: GET org chart as employee -> PASS (HTTP 403)
[EMPLOYEES][PASS] 19:57:31 - EMP-022: GET chat list -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:57:31 - EMP-023: GET chat with search -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:57:32 - EMP-024: POST create employee -> PASS (HTTP 201)
[EMPLOYEES][PASS] 19:57:32 - EMP-025: POST duplicate email -> PASS (HTTP 409)
[EMPLOYEES][PASS] 19:57:32 - EMP-026: POST create as employee -> PASS (HTTP 403)
[EMPLOYEES][PASS] 19:57:32 - EMP-027: POST create without auth -> PASS (HTTP 401)
[EMPLOYEES][PASS] 19:57:32 - EMP-028: POST missing first_name -> PASS (HTTP 400)
[EMPLOYEES][PASS] 19:57:36 - EMP-030: POST invalid email -> PASS (HTTP 400)
[EMPLOYEES][PASS] 19:57:37 - EMP-031: POST SQL injection -> PASS (HTTP 201)
[EMPLOYEES][PASS] 19:57:39 - EMP-032: POST XSS in name -> PASS (HTTP 201)
[EMPLOYEES][PASS] 19:57:40 - EMP-033: POST all optional fields -> PASS (HTTP 201)
[EMPLOYEES][WARN] 19:57:40 - EMP-034: SKIP (multipart upload requires file)
[EMPLOYEES][PASS] 19:57:40 - EMP-035: PUT update employee -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:57:41 - EMP-036: PUT own record as employee -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:57:41 - EMP-037: PUT other record as employee -> PASS (HTTP 403)
[EMPLOYEES][PASS] 19:57:41 - EMP-038: PUT empty required field -> PASS (HTTP 400)
[EMPLOYEES][PASS] 19:57:43 - EMP-039: PUT same email (no conflict) -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:57:44 - EMP-040: PATCH partial update -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:57:44 - EMP-041: PATCH single field -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:57:44 - EMP-042: DELETE employee -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:57:44 - EMP-043: DELETE as employee -> PASS (HTTP 403)
[EMPLOYEES][WARN] 19:57:44 - EMP-044: SKIP (covered by 043)
[EMPLOYEES][PASS] 19:57:45 - EMP-045: DELETE non-existent -> PASS (HTTP 404)
[EMPLOYEES][PASS] 19:57:47 - EMP-046: POST delete by email -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:57:47 - EMP-047: POST delete non-existent email -> PASS (HTTP 404)
[EMPLOYEES][PASS] 19:57:47 - EMP-048: POST delete by email missing field -> PASS (HTTP 400)
[EMPLOYEES][PASS] 19:57:47 - EMP-049: Response has required fields -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:57:48 - EMP-050: POST future hire_date -> PASS (HTTP 201)
[EMPLOYEES][PASS] 19:57:48 - EMP-051: POST very long name -> PASS (HTTP 400)
[EMPLOYEES][PASS] 19:57:48 - EMP-052: Tenant isolation -> PASS (HTTP 404)
[EMPLOYEES][PASS] 19:57:50 - EMP-053: Count matches total -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:57:51 - EMP-054: PUT update status -> PASS (HTTP 200)
[EMPLOYEES][PASS] 19:57:52 - EMP-055: Create then verify via user/:userId -> PASS (HTTP 200)

---

## Employees Module Results (Executed: 2026-05-27 19:57:52)

| Metric | Count |
|--------|------:|
| Total  | 54 |
| Pass   | 51 |
| Fail   | 0 |
| Skip   | 3 |
| Pass Rate | 94.4% |

[EMPLOYEES][DONE] 19:57:52 - Employees: 51/54 PASS, 0 FAIL, 3 SKIP
