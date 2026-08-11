# Documents Module - Test Cases (`/api/documents`)

| # | Test Case | Method | Endpoint | Expected Result | Auth |
|---|---|---|---|---|---|
| DOC-001 | Get documents (admin) | GET | `/api/documents` | 200 OK, document array | Admin JWT |
| DOC-002 | Get documents (employee) | GET | `/api/documents` | 200, own docs | Employee JWT |
| DOC-003 | Get docs without auth | GET | `/api/documents` | 401 Unauthorized | None |
| DOC-004 | Get docs by category filter | GET | `/api/documents?category=contract` | 200, filtered | JWT |
| DOC-005 | Get docs by employee filter | GET | `/api/documents?employee_id=1` | 200, filtered | Admin JWT |
| DOC-006 | Get docs by department filter | GET | `/api/documents?department_id=1` | 200, filtered | Admin JWT |
| DOC-007 | Get docs with search | GET | `/api/documents?search=resume` | 200, matching | JWT |
| DOC-008 | Get docs with pagination | GET | `/api/documents?page=1&limit=10` | 200 with pagination | JWT |
| DOC-009 | Get document by ID | GET | `/api/documents/:id` | 200 OK | JWT |
| DOC-010 | Get non-existent document | GET | `/api/documents/:id` | 404 Not Found | JWT |
| DOC-011 | Get confidential doc (not assigned) | GET | `/api/documents/:id` | 403 Forbidden | Employee JWT |
| DOC-012 | Get confidential doc (assigned) | GET | `/api/documents/:id` | 200 OK | Employee JWT |
| DOC-013 | Upload document (admin) | POST | `/api/documents` | 201 Created | Admin JWT |
| DOC-014 | Upload doc as employee | POST | `/api/documents` | 403 Forbidden | Employee JWT |
| DOC-015 | Upload without auth | POST | `/api/documents` | 401 Unauthorized | None |
| DOC-016 | Upload doc with category | POST | `/api/documents` | 201, category saved | Admin JWT |
| DOC-017 | Upload doc marked confidential | POST | `/api/documents` | 201, confidential=true | Admin JWT |
| DOC-018 | Upload doc with employee assignment | POST | `/api/documents` | 201, assigned to employee | Admin JWT |
| DOC-019 | Upload without file | POST | `/api/documents` | 400 No file | Admin JWT |
| DOC-020 | Upload invalid file type | POST | `/api/documents` | 400 Invalid file type | Admin JWT |
| DOC-021 | Upload very large file (>10MB) | POST | `/api/documents` | 413 Too large | Admin JWT |
| DOC-022 | Upload with XSS in filename/notes | POST | `/api/documents` | 201, sanitized | Admin JWT |
| DOC-023 | Update document metadata | PUT | `/api/documents/:id` | 200 OK | Admin JWT |
| DOC-024 | Update non-existent document | PUT | `/api/documents/:id` | 404 Not Found | Admin JWT |
| DOC-025 | Update document category | PUT | `/api/documents/:id` | 200, category changed | Admin JWT |
| DOC-026 | Update document to confidential | PUT | `/api/documents/:id` | 200, confidential changed | Admin JWT |
| DOC-027 | Delete document | DELETE | `/api/documents/:id` | 200 OK | Admin JWT |
| DOC-028 | Delete doc as employee | DELETE | `/api/documents/:id` | 403 Forbidden | Employee JWT |
| DOC-029 | Delete non-existent document | DELETE | `/api/documents/:id` | 404 Not Found | Admin JWT |
| DOC-030 | Delete then verify | DELETE + GET | workflow | 404 Not Found | Admin JWT |
| DOC-031 | Upload then GET confirms creation | POST + GET | workflow | Doc in list | Admin JWT |
| DOC-032 | Docs by expiry date filter | GET | `/api/documents?expiry_before=2026-12-31` | 200, filtered | JWT |
| DOC-033 | Document statistics | GET | `/api/documents?stats=true` | Stats in response | JWT |
| DOC-034 | Tenant isolation | GET | `/api/documents` | Only own tenant | Cross-tenant |
| DOC-035 | Upload with description field | POST | `/api/documents` | 201, description saved | Admin JWT |
| DOC-036 | Get documents by type | GET | `/api/documents?type=pdf` | 200, filtered | JWT |
| DOC-037 | Document response includes file_url | GET | `/api/documents` | file_url downloadable | JWT |
| DOC-038 | Document response includes upload date | GET | `/api/documents` | created_at field present | JWT |
| DOC-039 | Upload doc as manager | POST | `/api/documents` | 201 Created | Manager JWT |
| DOC-040 | Update document as manager | PUT | `/api/documents/:id` | 200 OK | Manager JWT |
| DOC-041 | Delete document as manager | DELETE | `/api/documents/:id` | 403 Forbidden | Manager JWT |
| DOC-042 | Multiple file upload | POST | `/api/documents` (multiple) | 201, all saved | Admin JWT |
| DOC-043 | Document count filterable by category | GET | `/api/documents?category=contract` | Count in pagination | JWT |
| DOC-044 | Search by exact filename | GET | `/api/documents?search=agreement.pdf` | 200, matches | JWT |
| DOC-045 | Expired documents highlighted | GET | `/api/documents?expired=true` | 200, expired docs | JWT |
| DOC-046 | Response format: success + data | GET | `/api/documents` | `{ success, data }` | JWT |
| DOC-047 | SQL injection in search | GET | `/api/documents?search=test' OR 1=1` | No SQL execution | JWT |
| DOC-048 | XSS in document name on upload | POST | `/api/documents` | Stored as literal | Admin JWT |
| DOC-049 | Upload file then download via file_url | POST + GET | workflow | File accessible | Admin JWT |
| DOC-050 | Document assigned to department | POST | `/api/documents` | 201, department_id saved | Admin JWT |
| DOC-051 | Employee sees only their confidential docs | GET | `/api/documents` (employee) | Filtered by user_id | Employee JWT |
| DOC-052 | Admin sees all confidential docs | GET | `/api/documents` (admin) | All docs visible | Admin JWT |
| DOC-053 | Update document with replacement file | PUT | `/api/documents/:id` + file | 200, file updated | Admin JWT |
| DOC-054 | Document list sorted by upload date desc | GET | `/api/documents?sort=created_at&order=desc` | 200, sorted | JWT |
| DOC-055 | Document category enum validation | POST | `/api/documents` | Invalid category = 400 | Admin JWT |

---

**Total: 55 test cases**
