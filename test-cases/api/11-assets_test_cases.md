# Assets Module - Test Cases (`/api/assets`)

## Endpoints
- `GET /api/assets` - List assets
- `POST /api/assets` - Create (admin/manager)
- `PUT /api/assets/:id` - Update (admin/manager)
- `DELETE /api/assets/:id` - Delete (admin/manager)
- `POST /api/assets/assign` - Assign to employee (admin/manager)

---

| # | Test Case | Method | Endpoint | Expected Result | Auth |
|---|---|---|---|---|---|
| AST-001 | Get assets (admin) | GET | `/api/assets` | 200 OK, asset array | Admin JWT |
| AST-002 | Get assets (employee) | GET | `/api/assets` | 200 OK | Employee JWT |
| AST-003 | Get assets without auth | GET | `/api/assets` | 401 Unauthorized | None |
| AST-004 | Get assets with status filter | GET | `/api/assets?status=available` | 200, filtered | JWT |
| AST-005 | Get assets with type filter | GET | `/api/assets?type=hardware` | 200, filtered | JWT |
| AST-006 | Get assets with search | GET | `/api/assets?search=laptop` | 200, matching | JWT |
| AST-007 | Get assets with pagination | GET | `/api/assets?page=1&limit=10` | 200 with pagination | JWT |
| AST-008 | Get assets with employee assignment filter | GET | `/api/assets?assigned_to=1` | 200, filtered | JWT |
| AST-009 | Create asset with valid data | POST | `/api/assets` | 201 Created | Admin JWT |
| AST-010 | Create asset as employee | POST | `/api/assets` | 403 Forbidden | Employee JWT |
| AST-011 | Create asset without auth | POST | `/api/assets` | 401 Unauthorized | None |
| AST-012 | Create asset with all fields | POST | `/api/assets` | 201, all fields saved | Admin JWT |
| AST-013 | Create asset with name | POST | `/api/assets` | 201 | Admin JWT |
| AST-014 | Create asset with serial number | POST | `/api/assets` | 201, serial saved | Admin JWT |
| AST-015 | Create asset with purchase date | POST | `/api/assets` | 201, purchase_date saved | Admin JWT |
| AST-016 | Create asset with cost | POST | `/api/assets` | 201, cost saved | Admin JWT |
| AST-017 | Create asset with vendor | POST | `/api/assets` | 201, vendor saved | Admin JWT |
| AST-018 | Create asset with XSS in name | POST | `/api/assets` | 201, stored as literal | Admin JWT |
| AST-019 | Create asset with SQL injection | POST | `/api/assets` | 201, parameterized | Admin JWT |
| AST-020 | Create duplicate asset (same serial number) | POST | `/api/assets` | 409 Conflict | Admin JWT |
| AST-021 | Update asset | PUT | `/api/assets/:id` | 200 OK | Admin JWT |
| AST-022 | Update asset as employee | PUT | `/api/assets/:id` | 403 Forbidden | Employee JWT |
| AST-023 | Update non-existent asset | PUT | `/api/assets/:id` | 404 Not Found | Admin JWT |
| AST-024 | Update asset status | PUT | `/api/assets/:id` | 200, status changed | Admin JWT |
| AST-025 | Update asset from Assigned to Available | PUT | `/api/assets/:id` | 200, freed for reassignment | Admin JWT |
| AST-026 | Delete asset | DELETE | `/api/assets/:id` | 200 OK | Admin JWT |
| AST-027 | Delete asset as employee | DELETE | `/api/assets/:id` | 403 Forbidden | Employee JWT |
| AST-028 | Delete non-existent asset | DELETE | `/api/assets/:id` | 404 Not Found | Admin JWT |
| AST-029 | Delete asset currently assigned | DELETE | `/api/assets/:id` | 409 Conflict or de-assigns first | Admin JWT |
| AST-030 | Assign asset to employee | POST | `/api/assets/assign` | 200 OK | Admin JWT |
| AST-031 | Assign asset without auth | POST | `/api/assets/assign` | 401 Unauthorized | None |
| AST-032 | Assign asset to non-existent employee | POST | `/api/assets/assign` | 404 Not Found | Admin JWT |
| AST-033 | Assign non-existent asset | POST | `/api/assets/assign` | 404 Not Found | Admin JWT |
| AST-034 | Assign asset already assigned | POST | `/api/assets/assign` | 409 Already assigned | Admin JWT |
| AST-035 | Assign asset with notes | POST | `/api/assets/assign` | 200, notes saved | Admin JWT |
| AST-036 | Get asset assignments | GET | `/api/assets?assigned_to=1` | 200, employee's assets | JWT |
| AST-037 | Update then GET verifies change | PUT + GET | workflow | Updated values reflected | Admin JWT |
| AST-038 | Delete then GET returns 404 | DELETE + GET | workflow | 404 Not Found | Admin JWT |
| AST-039 | Create asset then assign then verify | POST + POST + GET | workflow | Asset shows assigned | Admin JWT |
| AST-040 | Assign then unassign (update status) | POST + PUT | workflow | Asset back to Available | Admin JWT |
| AST-041 | Asset types: Hardware, Software, License, Other | POST | `/api/assets` | 201 for each type | Admin JWT |
| AST-042 | Asset statuses: Available, Assigned, Maintenance, Retired | POST + PUT | workflow | All statuses work | Admin JWT |
| AST-043 | Tenant isolation: assets isolated | GET | `/api/assets` | Only own tenant | Cross-tenant |
| AST-044 | Asset response includes assignment history | GET | `/api/assets/:id` | assignment_history field | JWT |
| AST-045 | Assign as manager | POST | `/api/assets/assign` | 200 OK | Manager JWT |
| AST-046 | Create asset as manager | POST | `/api/assets` | 201 Created | Manager JWT |
| AST-047 | Delete asset as manager | DELETE | `/api/assets/:id` | 200 OK | Manager JWT |
| AST-048 | Asset list includes employee details if assigned | GET | `/api/assets` | assigned_to details present | JWT |
| AST-049 | Search by serial number | GET | `/api/assets?search=SN-001` | 200, exact/smart match | JWT |
| AST-050 | Get assets sorted by purchase date | GET | `/api/assets?sort=purchase_date&order=desc` | 200, sorted | JWT |
| AST-051 | Asset warranty expiry tracking | POST | `/api/assets` | 201, warranty_date saved | Admin JWT |
| AST-052 | Assign asset with expected return date | POST | `/api/assets/assign` | 200, expected_return saved | Admin JWT |
| AST-053 | Bulk asset creation (multiple) | POST | `/api/assets` x3 | 201 x3 | Admin JWT |
| AST-054 | Response format: success + data | GET | `/api/assets` | `{ success, data }` | JWT |
| AST-055 | Create asset with no optional fields | POST | `/api/assets` | 201, defaults used | Admin JWT |

---

**Total: 55 test cases**
