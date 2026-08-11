# Documents Module — Deep API Test Cases (105 tests)

## 1.1 Create/Upload Document — 18 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| D1 | Upload document | POST | `/api/documents` | `{ name, type, file, employee_id }` (multipart) | 201 | Document created |
| D2 | Upload without file | POST | `/api/documents` | No file | 400 | File required |
| D3 | Upload with empty name | POST | `/api/documents` | `{ name: "" }` | 400 | Name required |
| D4 | Upload without auth | POST | `/api/documents` | No token | 401 | Unauthorized |
| D5 | Upload with very large file (>10MB) | POST | `/api/documents` | File >10MB | 400 | Too large |
| D6 | Upload with invalid file type | POST | `/api/documents` | `.exe` file | 400 | Invalid type |
| D7 | Upload with SQL injection in name | POST | `/api/documents` | `{ name: "'; DROP TABLE documents; --" }` | 201 | Sanitized |
| D8 | Upload with XSS in name | POST | `/api/documents` | `{ name: "<script>alert(1)</script>" }` | 201 | HTML-encoded |
| D9 | Upload PDF file | POST | `/api/documents` | PDF | 201 | PDF accepted |
| D10 | Upload image file | POST | `/api/documents` | JPEG/PNG | 201 | Image accepted |
| D11 | Upload Word/Excel | POST | `/api/documents` | .docx, .xlsx | 201 | Office docs accepted |
| D12 | Upload as employee (own) | POST | `/api/documents` | Employee token, self | 201 | Allowed |
| D13 | Upload for other employee (as employee) | POST | `/api/documents` | Employee, other's ID | 403 | Forbidden |
| D14 | Upload with category | POST | `/api/documents` | `{ category: "contract" }` | 201 | Category stored |
| D15 | Upload with tags | POST | `/api/documents` | `{ tags: ["important", "signed"] }` | 201 | Tags stored |
| D16 | Upload with description | POST | `/api/documents` | `{ description: "Signed contract" }` | 201 | Description stored |
| D17 | Upload duplicate filename | POST | `/api/documents` | Same filename as D1 | 201 | Versioned or unique |
| D18 | Upload with path traversal in filename | POST | `/api/documents` | `file: "../../etc/passwd"` | 400 | Path traversal blocked |

## 1.2 List Documents — 12 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| D19 | List all documents | GET | `/api/documents` | Valid auth | 200 | Array |
| D20 | List with employee filter | GET | `/api/documents?employee_id=1` | Valid auth | 200 | By employee |
| D21 | List with type filter | GET | `/api/documents?type=pdf` | Valid auth | 200 | By type |
| D22 | List with category filter | GET | `/api/documents?category=contract` | Valid auth | 200 | By category |
| D23 | List with search (name) | GET | `/api/documents?search=contract` | Valid auth | 200 | Searched |
| D24 | List with date range | GET | `/api/documents?from=2025-01-01&to=2025-01-31` | Valid auth | 200 | Date filtered |
| D25 | List pagination | GET | `/api/documents?page=1&limit=20` | Valid auth | 200 | Paginated |
| D26 | List sorted by upload_date | GET | `/api/documents?sort=created_at&order=desc` | Valid auth | 200 | Sorted |
| D27 | List without auth | GET | `/api/documents` | No token | 401 | Unauthorized |
| D28 | List as employee (own only) | GET | `/api/documents` | Employee token | 200 | Own documents |
| D29 | List cross-tenant | GET | `/api/documents` | Wrong tenant | 403 | Blocked |
| D30 | List with tags filter | GET | `/api/documents?tags=important` | Valid auth | 200 | Filtered by tag |

## 1.3 Get Single Document — 5 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| D31 | Get by ID | GET | `/api/documents/:id` | Valid auth | 200 | Document metadata |
| D32 | Get non-existent | GET | `/api/documents/:id` | `id: 99999` | 404 | Not found |
| D33 | Get without auth | GET | `/api/documents/:id` | No token | 401 | Unauthorized |
| D34 | Get cross-tenant | GET | `/api/documents/:id` | Wrong tenant | 404 | Blocked |
| D35 | Get invalid ID | GET | `/api/documents/:id` | `id: "abc"` | 400 | Invalid |

## 1.4 Download File — 10 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| D36 | Download document file | GET | `/api/documents/:id/download` | Valid auth | 200 | Binary file |
| D37 | Download returns correct Content-Type | GET | `/api/documents/:id/download` | Valid auth | 200 | MIME type |
| D38 | Download returns Content-Disposition | GET | `/api/documents/:id/download` | Valid auth | 200 | `attachment; filename="..."` |
| D39 | Download non-existent | GET | `/api/documents/:id/download` | `id: 99999` | 404 | Not found |
| D40 | Download without auth | GET | `/api/documents/:id/download` | No token | 401 | Unauthorized |
| D41 | Download as employee (not owner) | GET | `/api/documents/:id/download` | Employee, not owner | 403 | Forbidden |
| D42 | Download as admin (any) | GET | `/api/documents/:id/download` | Admin, any doc | 200 | Allowed |
| D43 | Download cross-tenant | GET | `/api/documents/:id/download` | Wrong tenant | 404 | Blocked |
| D44 | Download path traversal prevention | GET | `/api/documents/:id/download` | ID mapped to path | 200 | File served safely |
| D45 | Download file with special chars in name | GET | `/api/documents/:id/download` | Unicode filename | 200 | Handled |

## 1.5 Update Document — 10 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| D46 | Update document metadata | PUT | `/api/documents/:id` | `{ name: "Renamed" }` | 200 | Name updated |
| D47 | Update category | PUT | `/api/documents/:id` | `{ category: "updated" }` | 200 | Category updated |
| D48 | Update tags | PUT | `/api/documents/:id` | `{ tags: ["new", "tags"] }` | 200 | Tags updated |
| D49 | Update description | PUT | `/api/documents/:id` | `{ description: "Updated" }` | 200 | Description updated |
| D50 | Update to empty name | PUT | `/api/documents/:id` | `{ name: "" }` | 400 | Required |
| D51 | Update non-existent | PUT | `/api/documents/:id` | `id: 99999` | 404 | Not found |
| D52 | Update without auth | PUT | `/api/documents/:id` | No token | 401 | Unauthorized |
| D53 | Update as non-owner | PUT | `/api/documents/:id` | Employee, not owner | 403 | Forbidden |
| D54 | Replace document file | PUT | `/api/documents/:id/replace` | New file upload | 200 | File replaced |
| D55 | Replace with invalid file | PUT | `/api/documents/:id/replace` | `.exe` file | 400 | Invalid type |

## 1.6 Delete Document — 6 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| D56 | Delete document | DELETE | `/api/documents/:id` | Admin/owner | 200 | Deleted |
| D57 | Delete non-existent | DELETE | `/api/documents/:id` | `id: 99999` | 404 | Not found |
| D58 | Delete without auth | DELETE | `/api/documents/:id` | No token | 401 | Unauthorized |
| D59 | Delete as non-owner | DELETE | `/api/documents/:id` | Different employee | 403 | Forbidden |
| D60 | Delete cross-tenant | DELETE | `/api/documents/:id` | Wrong tenant | 404 | Blocked |
| D61 | Delete then recreate | DELETE → POST | Same data | After delete | 201 | Recreated |

## 1.7 Authorization — 15 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| D62 | Admin full CRUD all documents | ALL | All | Admin | 200 | Full |
| D63 | Admin can view any employee's docs | GET | Docs?employee_id= | Admin | 200 | Any |
| D64 | Manager can view team docs | GET | Docs?employee_id= | Manager, team | 200 | Team |
| D65 | Manager cannot view other dept docs | GET | Docs?employee_id= | Manager, other dept | 403 | Blocked |
| D66 | Employee can upload own | POST | Docs | Employee self | 201 | Allowed |
| D67 | Employee can view own | GET | Docs | Employee | 200 | Own |
| D68 | Employee can download own | GET | Download | Employee own | 200 | Allowed |
| D69 | Employee cannot view others | GET | Docs?employee_id= | Employee, other | 403 | Forbidden |
| D70 | Employee cannot download others | GET | Download/:id | Employee, not owner | 403 | Forbidden |
| D71 | Employee cannot delete others | DELETE | Docs/:id | Employee, not owner | 403 | Forbidden |
| D72 | Cross-tenant isolation | ALL | Any | Wrong tenant | 403 | Blocked |
| D73 | Super Admin bypasses | ALL | All | Super admin | 200 | Unrestricted |
| D74 | Mass assignment | PUT | Docs/:id | `{ id: 999 }` | 200 | Protected |
| D75 | SQL injection in search | GET | `Docs?search=' UNION...` | Valid token | 200 | Sanitized |
| D76 | Rate limiting | GET | Docs x 1000 | Valid token | 429 | Rate limited |

## 1.8 Document Sharing — 8 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| D77 | Share document with employee | POST | `/api/documents/:id/share` | `{ employee_id: 2, permission: "read" }` | 200 | Shared |
| D78 | Share with write permission | POST | `/api/documents/:id/share` | `{ permission: "write" }` | 200 | Write access |
| D79 | Share with non-existent employee | POST | `/api/documents/:id/share` | `employee_id: 99999` | 404 | Not found |
| D80 | Revoke share | DELETE | `/api/documents/:id/share/:shareId` | Owner | 200 | Revoked |
| D81 | Get shared users list | GET | `/api/documents/:id/shares` | Owner | 200 | Array |
| D82 | Access shared doc (read) | GET | `/api/documents/:id/download` | Shared user | 200 | Access granted |
| D83 | Access shared doc (write) | PUT | `/api/documents/:id` | Shared with write | 200 | Can edit |
| D84 | Share without auth | POST | `/api/documents/:id/share` | No token | 401 | Unauthorized |

## 1.9 Document Categories/Types — 8 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| D85 | List document categories | GET | `/api/documents/categories` | Valid auth | 200 | Array |
| D86 | Create category | POST | `/api/documents/categories` | `{ name, allowed_types }` | 201 | Created |
| D87 | Create duplicate category | POST | `/api/documents/categories` | Same name | 409 | Duplicate |
| D88 | Delete category | DELETE | `/api/documents/categories/:id` | Admin | 200 | Deleted |
| D89 | Delete category in use | DELETE | `/api/documents/categories/:id` | Has docs | 409 | FK |
| D90 | Get document by type stats | GET | `/api/documents/statistics` | Valid auth | 200 | By type |
| D91 | Category with allowed file types validation | POST | Docs | Wrong type for category | 400 | Type mismatch |
| D92 | Category without auth | POST | Categories | No token | 401 | Unauthorized |

## 1.10 Edge Cases — 17 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| D93 | Upload file with no extension | POST | `/api/documents` | File without ext | 400 | Invalid |
| D94 | Upload file with double extension (.pdf.exe) | POST | `/api/documents` | Double ext | 400 | Suspicious |
| D95 | Upload with name collision (same employee, same name) | POST x2 | Same metadata | Same name | 201 both | Versioned |
| D96 | Upload 0-byte file | POST | `/api/documents` | Empty file | 400 | Cannot be empty |
| D97 | Upload max allowed size (exactly limit) | POST | `/api/documents` | File at limit | 201 | Accepted |
| D98 | Upload with long filename (255+ chars) | POST | `/api/documents` | Long name | 400 | Too long |
| D99 | Delete document with active shares | DELETE | Docs/:id | Has shares | 200 | Cascaded |
| D100 | Download deleted document | GET | Download/:id | Already deleted | 404 | Not found |
| D101 | Unicode filename upload | POST | `/api/documents` | Chinese/Japanese name | 201 | Preserved |
| D102 | Document version history | GET | `/api/documents/:id/versions` | Has replacements | 200 | Version list |
| D103 | Restore previous version | PUT | `/api/documents/:id/versions/:versionId/restore` | Owner | 200 | Restored |
| D104 | 100 documents for same employee | POST x100 | Bulk | Same employee | 201 each | All stored |
| D105 | Document statistics | GET | `/api/documents/statistics` | Valid auth | 200 | Total, by type, by category |

Total: 18 + 12 + 5 + 10 + 10 + 6 + 15 + 8 + 8 + 17 = **105 tests**
