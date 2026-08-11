# Recruitment Module - Test Cases (`/api/recruitment`)

## Endpoints
- `GET /api/recruitment/jobs` - List job postings
- `GET /api/recruitment/jobs/:id` - Get by ID
- `POST /api/recruitment/jobs` - Create (admin/manager)
- `PUT /api/recruitment/jobs/:id` - Update (admin/manager)
- `DELETE /api/recruitment/jobs/:id` - Delete (admin)
- `GET /api/recruitment/applications` - List applications
- `POST /api/recruitment/applications` - Submit application (public)
- `PUT /api/recruitment/applications/:id` - Update status
- `DELETE /api/recruitment/applications/:id` - Delete (admin)
- `POST /api/recruitment/resume/parse` - Parse resume

---

| # | Test Case | Method | Endpoint | Expected Result | Auth |
|---|---|---|---|---|---|
| REC-001 | Get all job postings | GET | `/api/recruitment/jobs` | 200 OK, jobs array | JWT |
| REC-002 | Get jobs without auth | GET | `/api/recruitment/jobs` | 401 Unauthorized | None |
| REC-003 | Get jobs with status filter | GET | `/api/recruitment/jobs?status=open` | 200, filtered | JWT |
| REC-004 | Get jobs with search | GET | `/api/recruitment/jobs?search=engineer` | 200, matching | JWT |
| REC-005 | Get job posting by ID | GET | `/api/recruitment/jobs/:id` | 200 OK | JWT |
| REC-006 | Get job by non-existent ID | GET | `/api/recruitment/jobs/:id` | 404 Not Found | JWT |
| REC-007 | Create job posting with valid data | POST | `/api/recruitment/jobs` | 201 Created | Admin JWT |
| REC-008 | Create job posting as employee | POST | `/api/recruitment/jobs` | 403 Forbidden | Employee JWT |
| REC-009 | Create job posting without auth | POST | `/api/recruitment/jobs` | 401 Unauthorized | None |
| REC-010 | Create job with missing title | POST | `/api/recruitment/jobs` | 400 Validation error | Admin JWT |
| REC-011 | Create job with missing description | POST | `/api/recruitment/jobs` | 400 Validation error | Admin JWT |
| REC-012 | Create job with all optional fields | POST | `/api/recruitment/jobs` | 201 Created | Admin JWT |
| REC-013 | Create job with XSS in title | POST | `/api/recruitment/jobs` | 201, stored as literal | Admin JWT |
| REC-014 | Create job with SQL injection | POST | `/api/recruitment/jobs` | 201/400, parameterized | Admin JWT |
| REC-015 | Update job posting | PUT | `/api/recruitment/jobs/:id` | 200 OK | Admin JWT |
| REC-016 | Update job as employee | PUT | `/api/recruitment/jobs/:id` | 403 Forbidden | Employee JWT |
| REC-017 | Update non-existent job | PUT | `/api/recruitment/jobs/:id` | 404 Not Found | Admin JWT |
| REC-018 | Update job from open to closed | PUT | `/api/recruitment/jobs/:id` | 200, status=closed | Admin JWT |
| REC-019 | Delete job posting | DELETE | `/api/recruitment/jobs/:id` | 200 OK | Admin JWT |
| REC-020 | Delete job as manager | DELETE | `/api/recruitment/jobs/:id` | 403 Forbidden | Manager JWT |
| REC-021 | Delete job that has applications | DELETE | `/api/recruitment/jobs/:id` | 409 Conflict or cascaded | Admin JWT |
| REC-022 | Delete non-existent job | DELETE | `/api/recruitment/jobs/:id` | 404 Not Found | Admin JWT |
| REC-023 | Get applications (admin) | GET | `/api/recruitment/applications` | 200 OK | Admin JWT |
| REC-024 | Get applications as employee | GET | `/api/recruitment/applications` | 403 Forbidden | Employee JWT |
| REC-025 | Get applications filtered by job | GET | `/api/recruitment/applications?job_id=1` | 200, filtered | Admin JWT |
| REC-026 | Get applications filtered by status | GET | `/api/recruitment/applications?status=shortlisted` | 200, filtered | Admin JWT |
| REC-027 | Submit application (public - no auth) | POST | `/api/recruitment/applications` | 201 Created | None |
| REC-028 | Submit application with valid data | POST | `/api/recruitment/applications` | 201 Created | None |
| REC-029 | Submit application with missing job_id | POST | `/api/recruitment/applications` | 400 Validation error | None |
| REC-030 | Submit application with missing name | POST | `/api/recruitment/applications` | 400 Validation error | None |
| REC-031 | Submit application with missing email | POST | `/api/recruitment/applications` | 400 Validation error | None |
| REC-032 | Submit application with invalid email | POST | `/api/recruitment/applications` | 400 Validation error | None |
| REC-033 | Submit application to non-existent job | POST | `/api/recruitment/applications` | 404 Not Found | None |
| REC-034 | Submit duplicate application (same email + job) | POST | `/api/recruitment/applications` | 409 Conflict | None |
| REC-035 | Submit application with resume URL | POST | `/api/recruitment/applications` | 201, resume saved | None |
| REC-036 | Submit application with XSS in name | POST | `/api/recruitment/applications` | 201, stored as literal | None |
| REC-037 | Update application status (shortlist) | PUT | `/api/recruitment/applications/:id` | 200 OK | Admin JWT |
| REC-038 | Update application status as employee | PUT | `/api/recruitment/applications/:id` | 403 Forbidden | Employee JWT |
| REC-039 | Update application to invalid status | PUT | `/api/recruitment/applications/:id` | 400 Validation error | Admin JWT |
| REC-040 | Update non-existent application | PUT | `/api/recruitment/applications/:id` | 404 Not Found | Admin JWT |
| REC-041 | Delete application | DELETE | `/api/recruitment/applications/:id` | 200 OK | Admin JWT |
| REC-042 | Delete application as manager | DELETE | `/api/recruitment/applications/:id` | 403 Forbidden | Manager JWT |
| REC-043 | Parse resume file | POST | `/api/recruitment/resume/parse` | 200 OK, parsed data | JWT |
| REC-044 | Parse resume without file | POST | `/api/recruitment/resume/parse` | 400 No file | JWT |
| REC-045 | Parse invalid file type | POST | `/api/recruitment/resume/parse` | 400 Invalid format | JWT |
| REC-046 | Job response includes application_count | GET | `/api/recruitment/jobs` | application_count field present | JWT |
| REC-047 | Tenant isolation: jobs isolated | GET | `/api/recruitment/jobs` | Only own tenant | Cross-tenant |
| REC-048 | Create job as manager | POST | `/api/recruitment/jobs` | 201 Created | Manager JWT |
| REC-049 | Application status flow: submitted -> reviewed -> shortlisted -> interviewed -> hired/rejected | PUT | `/api/recruitment/applications/:id` | All valid transitions work | Admin JWT |
| REC-050 | Get applications with pagination | GET | `/api/recruitment/applications?page=1&limit=10` | 200 with pagination | Admin JWT |
| REC-051 | Submit application with phone field | POST | `/api/recruitment/applications` | 201, phone saved | None |
| REC-052 | Submit application with cover letter | POST | `/api/recruitment/applications` | 201, cover_letter saved | None |
| REC-053 | Get jobs with pagination | GET | `/api/recruitment/jobs?page=1&limit=10` | 200 with pagination | JWT |
| REC-054 | Response format: success + data | GET | `/api/recruitment/jobs` | `{ success, data }` | JWT |
| REC-055 | Create job with salary range | POST | `/api/recruitment/jobs` | 201, salary fields saved | Admin JWT |

---

**Total: 55 test cases**
