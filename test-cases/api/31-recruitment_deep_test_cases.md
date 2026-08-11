# Recruitment Module — Deep API Test Cases (110 tests)

## 1.1 Jobs CRUD — 20 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| R1 | Create job posting | POST | `/api/recruitment/jobs` | `{ title, department, location, type, description, requirements }` | 201 | Job created |
| R2 | Create job with missing title | POST | `/api/recruitment/jobs` | No title | 400 | Required |
| R3 | Create job with duplicate title | POST | `/api/recruitment/jobs` | Same title as R1 | 409 | Duplicate |
| R4 | Create job without auth | POST | `/api/recruitment/jobs` | No token | 401 | Unauthorized |
| R5 | Create job as employee | POST | `/api/recruitment/jobs` | Employee token | 403 | Forbidden |
| R6 | Create job with SQL injection | POST | `/api/recruitment/jobs` | `{ title: "'; DROP TABLE jobs; --" }` | 201 | Sanitized |
| R7 | Create job with XSS | POST | `/api/recruitment/jobs` | `{ description: "<script>alert(1)</script>" }` | 201 | HTML-encoded |
| R8 | Create job with salary range | POST | `/api/recruitment/jobs` | `{ salary_min: 50000, salary_max: 80000 }` | 201 | Salary stored |
| R9 | Create job with invalid salary (min > max) | POST | `/api/recruitment/jobs` | `{ salary_min: 100000, salary_max: 50000 }` | 400 | Invalid range |
| R10 | Create remote job | POST | `/api/recruitment/jobs` | `{ location: "Remote" }` | 201 | Remote flag |
| R11 | List jobs | GET | `/api/recruitment/jobs` | Valid auth | 200 | Array |
| R12 | List jobs with filters | GET | `/api/recruitment/jobs?department=Engineering&type=full-time` | Valid auth | 200 | Filtered |
| R13 | List jobs with status filter (active/closed) | GET | `/api/recruitment/jobs?status=active` | Valid auth | 200 | Active only |
| R14 | List public jobs (no auth) | GET | `/api/recruitment/jobs/public` | No token | 200 | Public listing |
| R15 | Get single job | GET | `/api/recruitment/jobs/:id` | Valid auth | 200 | Job object |
| R16 | Update job | PUT | `/api/recruitment/jobs/:id` | `{ title: "Updated Title" }` | 200 | Updated |
| R17 | Update job to closed | PUT | `/api/recruitment/jobs/:id` | `{ status: "closed" }` | 200 | Closed |
| R18 | Delete job | DELETE | `/api/recruitment/jobs/:id` | Admin token | 200 | Deleted |
| R19 | Delete job with applications | DELETE | `/api/recruitment/jobs/:id` | Has applications | 409 | FK constraint |
| R20 | Job status toggle (active→closed→active) | PUT x2 | Toggle | Both transitions | 200 | Works |

## 1.2 Applications CRUD — 25 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| R21 | Apply to job (public) | POST | `/api/recruitment/applications` | `{ job_id, name, email, phone, resume_url, cover_letter }` | 201 | Application created |
| R22 | Apply with missing job_id | POST | `/api/recruitment/applications` | No job_id | 400 | Required |
| R23 | Apply with missing email | POST | `/api/recruitment/applications` | No email | 400 | Required |
| R24 | Apply with invalid email | POST | `/api/recruitment/applications` | `email: "notanemail"` | 400 | Invalid |
| R25 | Apply to non-existent job | POST | `/api/recruitment/applications` | `job_id: 99999` | 404 | Job not found |
| R26 | Apply to closed job | POST | `/api/recruitment/applications` | Job is closed | 400 | Cannot apply |
| R27 | Apply duplicate (same email + job) | POST | `/api/recruitment/applications` | Same email + job as R21 | 409 | Already applied |
| R28 | Apply with SQL injection in cover_letter | POST | `/api/recruitment/applications` | `{ cover_letter: "'; DROP TABLE applications; --" }` | 201 | Sanitized |
| R29 | Apply with XSS in cover_letter | POST | `/api/recruitment/applications` | `{ cover_letter: "<script>alert('xss')</script>" }` | 201 | HTML-encoded |
| R30 | Apply with file upload (resume) | POST | `/api/recruitment/applications` | Multipart with resume file | 201 | File stored |
| R31 | Apply with very large resume | POST | `/api/recruitment/applications` | File >10MB | 400 | Too large |
| R32 | Apply with wrong file type | POST | `/api/recruitment/applications` | `.exe` file as resume | 400 | Invalid type |
| R33 | List applications | GET | `/api/recruitment/applications` | Admin/manager | 200 | Array |
| R34 | List with job filter | GET | `/api/recruitment/applications?job_id=1` | Valid auth | 200 | By job |
| R35 | List with status filter | GET | `/api/recruitment/applications?status=reviewed` | Valid auth | 200 | By status |
| R36 | List with date range | GET | `/api/recruitment/applications?from=2025-01-01&to=2025-01-31` | Valid auth | 200 | Date filter |
| R37 | List with search | GET | `/api/recruitment/applications?search=John` | Valid auth | 200 | Search name/email |
| R38 | List pagination | GET | `/api/recruitment/applications?page=1&limit=20` | Valid auth | 200 | Paginated |
| R39 | Get single application | GET | `/api/recruitment/applications/:id` | Admin | 200 | Full details |
| R40 | Get application without auth | GET | `/api/recruitment/applications/:id` | No token | 401 | Unauthorized |
| R41 | Update application status | PUT | `/api/recruitment/applications/:id` | `{ status: "shortlisted" }` | 200 | Status updated |
| R42 | Update to invalid status | PUT | `/api/recruitment/applications/:id` | `{ status: "nonexistent" }` | 400 | Invalid |
| R43 | Delete application | DELETE | `/api/recruitment/applications/:id` | Admin | 200 | Deleted |
| R44 | Delete as employee | DELETE | `/api/recruitment/applications/:id` | Employee | 403 | Forbidden |
| R45 | Application status lifecycle | PUT x4 | applied→reviewed→shortlisted→hired→rejected | All transitions | 200 | Full flow |

## 1.3 Resume Parsing — 8 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| R46 | Parse resume file | POST | `/api/recruitment/parse-resume` | Upload resume file | 200 | Extracted data |
| R47 | Parse without file | POST | `/api/recruitment/parse-resume` | No file | 400 | File required |
| R48 | Parse invalid file type | POST | `/api/recruitment/parse-resume` | `.txt` file | 400 | Unsupported |
| R49 | Parse returns structured data | POST | `/api/recruitment/parse-resume` | Valid resume | 200 | `name`, `email`, `skills`, `experience` |
| R50 | Parse without auth | POST | `/api/recruitment/parse-resume` | No token | 401 | Unauthorized |
| R51 | Parse as employee | POST | `/api/recruitment/parse-resume` | Employee | 403 | Forbidden |
| R52 | Parse then auto-fill application | POST → POST | Parse → Apply | Parsed data used | 200 | Auto-filled |
| R53 | Parse + extract education | POST | `/api/recruitment/parse-resume` | Resume with education | 200 | Education parsed |

## 1.4 Authorization — 15 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| R54 | Admin full CRUD jobs | ALL | Jobs endpoints | Admin | 200 | Full access |
| R55 | Admin full CRUD applications | ALL | Applications | Admin | 200 | Full access |
| R56 | Manager can create/list/update jobs | POST/GET/PUT | Jobs | Manager | 200 | Limited |
| R57 | Manager cannot delete jobs | DELETE | Jobs | Manager | 403 | Forbidden |
| R58 | Employee cannot create jobs | POST | Jobs | Employee | 403 | Forbidden |
| R59 | Employee cannot view applications | GET | Applications | Employee | 403 | Forbidden |
| R60 | Public can view active jobs only | GET | `/api/recruitment/jobs/public` | No auth | 200 | Active only |
| R61 | Public cannot view closed jobs | GET | `/api/recruitment/jobs/public` | Closed job | 200 | Not listed |
| R62 | Public cannot view applications | GET | Applications endpoint | No auth | 401 | Unauthorized |
| R63 | Applicant can view own application | GET | `/api/recruitment/applications/:id` | With applicant token | 200 | Own only |
| R64 | Applicant cannot view others | GET | `/api/recruitment/applications/:id` | Different applicant | 403 | Forbidden |
| R65 | Cross-tenant isolation | GET | `/api/recruitment/jobs` | Wrong tenant | 403 | Blocked |
| R66 | Mass assignment protection | PUT | Job update | `{ id: 999, created_at: "now" }` | 200 | Protected |
| R67 | SQL injection in list params | GET | `/api/recruitment/jobs?search=' UNION SELECT * FROM users--` | Valid | 200 | Sanitized |
| R68 | Rate limiting | GET | `/api/recruitment/jobs` x 1000 | Valid token | 429 | Rate limited |

## 1.5 Interview Scheduling — 10 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| R69 | Schedule interview | POST | `/api/recruitment/interviews` | `{ application_id, interviewer_id, date_time, type }` | 201 | Scheduled |
| R70 | Schedule without application_id | POST | `/api/recruitment/interviews` | Missing app | 400 | Required |
| R71 | Schedule without interviewer | POST | `/api/recruitment/interviews` | Missing interviewer | 400 | Required |
| R72 | Schedule in past | POST | `/api/recruitment/interviews` | Past date_time | 400 | Cannot be past |
| R73 | List interviews | GET | `/api/recruitment/interviews` | Admin/manager | 200 | All scheduled |
| R74 | Update interview status | PUT | `/api/recruitment/interviews/:id` | `{ status: "completed" }` | 200 | Status updated |
| R75 | Cancel interview | PUT | `/api/recruitment/interviews/:id` | `{ status: "cancelled" }` | 200 | Cancelled |
| R76 | Add feedback to interview | PUT | `/api/recruitment/interviews/:id/feedback` | `{ rating, notes }` | 200 | Feedback stored |
| R77 | Get interview without auth | GET | `/api/recruitment/interviews` | No token | 401 | Unauthorized |
| R78 | Interview feedback without rating | PUT | Feedback endpoint | `{ notes: "Good" }` | 400 | Rating required |

## 1.6 Offers — 8 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| R79 | Create offer | POST | `/api/recruitment/offers` | `{ application_id, salary, joining_date, terms }` | 201 | Offer created |
| R80 | Accept offer | PUT | `/api/recruitment/offers/:id` | `{ status: "accepted" }` | 200 | Accepted |
| R81 | Reject offer | PUT | `/api/recruitment/offers/:id` | `{ status: "rejected", reason }` | 200 | Rejected |
| R82 | Offer without salary | POST | `/api/recruitment/offers` | No salary | 400 | Required |
| R83 | Offer with negative salary | POST | `/api/recruitment/offers` | `salary: -1000` | 400 | Invalid |
| R84 | List offers | GET | `/api/recruitment/offers` | Admin | 200 | All offers |
| R85 | Update offer | PUT | `/api/recruitment/offers/:id` | `{ salary: 75000 }` | 200 | Updated |
| R86 | Delete offer | DELETE | `/api/recruitment/offers/:id` | Admin | 200 | Deleted |

## 1.7 Statistics — 8 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| R87 | Get recruitment stats | GET | `/api/recruitment/statistics` | Admin | 200 | Stats object |
| R88 | Stats include open positions count | GET | `/api/recruitment/statistics` | Admin | 200 | Open jobs |
| R89 | Stats include total applications | GET | `/api/recruitment/statistics` | Admin | 200 | App count |
| R90 | Stats include conversion rate | GET | `/api/recruitment/statistics` | Admin | 200 | hired/applied % |
| R91 | Stats include avg time-to-hire | GET | `/api/recruitment/statistics` | Admin | 200 | Days avg |
| R92 | Stats by department | GET | `/api/recruitment/statistics?department=Engineering` | Admin | 200 | Dept stats |
| R93 | Stats by month | GET | `/api/recruitment/statistics?month=3&year=2025` | Admin | 200 | Monthly |
| R94 | Stats without auth | GET | `/api/recruitment/statistics` | No token | 401 | Unauthorized |

## 1.8 Edge Cases — 16 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| R95 | Job with very long description (10K chars) | POST | Jobs | Long description | 201 | Accepted |
| R96 | Job with HTML in description | POST | Jobs | `{ description: "<b>bold</b><p>para</p>" }` | 201 | Stripped/escaped |
| R97 | 100 applications to same job | POST | Applications x100 | Same job_id | 201 each | All stored |
| R98 | Apply with no resume | POST | Applications | No resume_file | 400 | File required |
| R99 | Apply with phone only | POST | Applications | No email, only phone | 400 | Email required |
| R100 | Special chars in applicant name | POST | Applications | `name: "José García"` | 201 | Unicode OK |
| R101 | Unicode in resume parsing | POST | Parse-resume | Unicode resume | 200 | Parsed correctly |
| R102 | Application status: rejected → shortlisted | PUT | Application | Can't go back | 400 | Invalid transition |
| R103 | Job with no department | POST | Jobs | No department | 201 | Optional |
| R104 | Bulk job creation | POST | `/api/recruitment/jobs/bulk` | Array of jobs | 201 | Bulk |
| R105 | Bulk with invalid entries | POST | `/api/recruitment/jobs/bulk` | Mixed valid/invalid | 207 | Partial |
| R106 | Offer with joining date in past | POST | Offers | Past joining_date | 400 | Must be future |
| R107 | Application with phone number validation | POST | Applications | `phone: "abc"` | 400 | Invalid phone |
| R108 | Interview type enum validation | POST | Interviews | `type: "invalid"` | 400 | Invalid type |
| R109 | Resume file security (no path traversal) | POST | Parse-resume | `../../etc/passwd` | 400 | Blocked |
| R110 | Offer lifecycle (created→accepted→employee_created) | Full flow | All | Complete | 200 | End-to-end |

Total: 20 + 25 + 8 + 15 + 10 + 8 + 8 + 16 = **110 tests**
