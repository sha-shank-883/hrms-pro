# Assets Module — Deep API Test Cases (105 tests)

## 1.1 Create Asset — 15 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| AS1 | Create asset with required fields | POST | `/api/assets` | `{ name, type, purchase_date, cost }` | 201 | Asset created |
| AS2 | Create with missing name | POST | `/api/assets` | No name | 400 | Required |
| AS3 | Create with missing type | POST | `/api/assets` | No type | 400 | Required |
| AS4 | Create with duplicate serial number | POST | `/api/assets` | Same serial_no as AS1 | 409 | Duplicate |
| AS5 | Create with negative cost | POST | `/api/assets` | `{ cost: -100 }` | 400 | Invalid |
| AS6 | Create without auth | POST | `/api/assets` | No token | 401 | Unauthorized |
| AS7 | Create as employee | POST | `/api/assets` | Employee token | 403 | Forbidden |
| AS8 | Create with SQL injection in name | POST | `/api/assets` | `{ name: "'; DROP TABLE assets; --" }` | 201 | Sanitized |
| AS9 | Create with XSS in name | POST | `/api/assets` | `{ name: "<script>alert(1)</script>" }` | 201 | HTML-encoded |
| AS10 | Create with all optional fields | POST | `/api/assets` | `{ name, type, brand, model, serial_no, purchase_date, cost, warranty_expiry, status, location, notes }` | 201 | All stored |
| AS11 | Create with future purchase_date | POST | `/api/assets` | Future date | 201 | Allowed |
| AS12 | Create with invalid type enum | POST | `/api/assets` | `{ type: "invalid_type" }` | 400 | Invalid enum |
| AS13 | Create asset with image | POST | `/api/assets` | Multipart with image | 201 | Image stored |
| AS14 | Create with status assigned (must have assignee) | POST | `/api/assets` | `{ status: "assigned" }` no assignee | 400 | Assignee required |
| AS15 | Create bulk assets | POST | `/api/assets/bulk` | Array of assets | 201 | All created |

## 1.2 List Assets — 12 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| AS16 | List all assets | GET | `/api/assets` | Valid auth | 200 | Array |
| AS17 | List with type filter | GET | `/api/assets?type=laptop` | Valid auth | 200 | Filtered |
| AS18 | List with status filter | GET | `/api/assets?status=assigned` | Valid auth | 200 | Assigned only |
| AS19 | List with assigned_to filter | GET | `/api/assets?assigned_to=1` | Valid auth | 200 | By assignee |
| AS20 | List with search (name/serial) | GET | `/api/assets?search=Dell` | Valid auth | 200 | Searched |
| AS21 | List with date range | GET | `/api/assets?from=2025-01-01&to=2025-01-31` | Valid auth | 200 | Date filtered |
| AS22 | List pagination | GET | `/api/assets?page=1&limit=10` | Valid auth | 200 | Paginated |
| AS23 | List sorted by purchase_date | GET | `/api/assets?sort=purchase_date&order=desc` | Valid auth | 200 | Sorted |
| AS24 | List without auth | GET | `/api/assets` | No token | 401 | Unauthorized |
| AS25 | List as employee | GET | `/api/assets` | Employee token | 200 | All assets? |
| AS26 | List cross-tenant | GET | `/api/assets` | Wrong tenant | 403 | Blocked |
| AS27 | List with department filter | GET | `/api/assets?department_id=1` | Valid auth | 200 | By dept |

## 1.3 Get Single Asset — 5 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| AS28 | Get by ID | GET | `/api/assets/:id` | Valid auth | 200 | Asset object |
| AS29 | Get non-existent | GET | `/api/assets/:id` | `id: 99999` | 404 | Not found |
| AS30 | Get without auth | GET | `/api/assets/:id` | No token | 401 | Unauthorized |
| AS31 | Get invalid ID format | GET | `/api/assets/:id` | `id: "abc"` | 400 | Invalid |
| AS32 | Get cross-tenant asset | GET | `/api/assets/:id` | Wrong tenant | 404 | Blocked |

## 1.4 Update Asset — 10 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| AS33 | Update name | PUT | `/api/assets/:id` | `{ name: "Updated" }` | 200 | Updated |
| AS34 | Update status to assigned | PUT | `/api/assets/:id` | `{ status: "assigned", assigned_to: 1 }` | 200 | Assigned |
| AS35 | Update status to maintenance | PUT | `/api/assets/:id` | `{ status: "maintenance" }` | 200 | In maintenance |
| AS36 | Update status to disposed | PUT | `/api/assets/:id` | `{ status: "disposed" }` | 200 | Disposed |
| AS37 | Update non-existent | PUT | `/api/assets/:id` | `id: 99999` | 404 | Not found |
| AS38 | Update with duplicate serial | PUT | `/api/assets/:id` | Serial of another asset | 409 | Duplicate |
| AS39 | Update cost to negative | PUT | `/api/assets/:id` | `{ cost: -100 }` | 400 | Invalid |
| AS40 | Update without auth | PUT | `/api/assets/:id` | No token | 401 | Unauthorized |
| AS41 | Update as employee | PUT | `/api/assets/:id` | Employee | 403 | Forbidden |
| AS42 | Update with SQL injection | PUT | `/api/assets/:id` | `{ name: "'; UPDATE assets SET cost=0; --" }` | 200 | Sanitized |

## 1.5 Delete Asset — 8 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| AS43 | Delete asset | DELETE | `/api/assets/:id` | Admin | 200 | Deleted |
| AS44 | Delete non-existent | DELETE | `/api/assets/:id` | `id: 99999` | 404 | Not found |
| AS45 | Delete without auth | DELETE | `/api/assets/:id` | No token | 401 | Unauthorized |
| AS46 | Delete as employee | DELETE | `/api/assets/:id` | Employee | 403 | Forbidden |
| AS47 | Delete assigned asset | DELETE | `/api/assets/:id` | Currently assigned | 409 | Must unassign first |
| AS48 | Delete cross-tenant | DELETE | `/api/assets/:id` | Wrong tenant | 404 | Blocked |
| AS49 | Delete with invalid ID | DELETE | `/api/assets/:id` | `id: "abc"` | 400 | Invalid |
| AS50 | Delete then recreate | DELETE → POST | Same data | After delete | 201 | Recreated |

## 1.6 Asset Assignment — 12 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| AS51 | Assign asset to employee | PUT | `/api/assets/:id/assign` | `{ employee_id: 1 }` | 200 | Assigned |
| AS52 | Assign already assigned asset | PUT | `/api/assets/:id/assign` | Already assigned | 409 | Already assigned |
| AS53 | Assign to non-existent employee | PUT | `/api/assets/:id/assign` | `employee_id: 99999` | 404 | Employee not found |
| AS54 | Assign without auth | PUT | `/api/assets/:id/assign` | No token | 401 | Unauthorized |
| AS55 | Assign as employee | PUT | `/api/assets/:id/assign` | Employee | 403 | Forbidden |
| AS56 | Unassign asset | PUT | `/api/assets/:id/unassign` | Valid auth | 200 | Unassigned |
| AS57 | Unassign already unassigned | PUT | `/api/assets/:id/unassign` | Already free | 400 | Not assigned |
| AS58 | Get assignment history | GET | `/api/assets/:id/history` | Valid auth | 200 | History array |
| AS59 | Assign with notes | PUT | `/api/assets/:id/assign` | `{ notes: "Delivered to desk" }` | 200 | Notes stored |
| AS60 | Assign then list employee assets | GET | `/api/assets?assigned_to=1` | After assign | 200 | Asset shown |
| AS61 | Assign multiple assets to employee | PUT x3 | Assign 3 assets | Same employee | 200 each | All assigned |
| AS62 | Assignment history shows dates | GET | `/api/assets/:id/history` | After assign/unassign | 200 | Timestamps |

## 1.7 Asset Categories — 8 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| AS63 | Create asset category | POST | `/api/assets/categories` | `{ name, description }` | 201 | Category created |
| AS64 | Create duplicate category | POST | `/api/assets/categories` | Same name | 409 | Duplicate |
| AS65 | List categories | GET | `/api/assets/categories` | Valid auth | 200 | Array |
| AS66 | Update category | PUT | `/api/assets/categories/:id` | `{ name: "Renamed" }` | 200 | Updated |
| AS67 | Delete category | DELETE | `/api/assets/categories/:id` | Admin | 200 | Deleted |
| AS68 | Delete category with assets | DELETE | `/api/assets/categories/:id` | Has assets | 409 | FK constraint |
| AS69 | Asset type validation | POST | `/api/assets` | Type must be in categories | 400 | Invalid type |
| AS70 | Category without auth | POST | `/api/assets/categories` | No token | 401 | Unauthorized |

## 1.8 Statistics — 8 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| AS71 | Get asset statistics | GET | `/api/assets/statistics` | Valid auth | 200 | Stats |
| AS72 | Stats include total/average cost | GET | `/api/assets/statistics` | Valid auth | 200 | Cost stats |
| AS73 | Stats include by status | GET | `/api/assets/statistics` | Valid auth | 200 | Status breakdown |
| AS74 | Stats include by type | GET | `/api/assets/statistics` | Valid auth | 200 | Type breakdown |
| AS75 | Stats by department | GET | `/api/assets/statistics?department_id=1` | Valid auth | 200 | Dept stats |
| AS76 | Stats without auth | GET | `/api/assets/statistics` | No token | 401 | Unauthorized |
| AS77 | Stats cross-tenant | GET | `/api/assets/statistics` | Wrong tenant | 403 | Blocked |
| AS78 | Stats include warranty expiry counts | GET | `/api/assets/statistics` | Valid auth | 200 | Warranty info |

## 1.9 Authorization — 10 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| AS79 | Admin full CRUD | ALL | All | Admin | 200 | Full |
| AS80 | Manager can create/read/update (not delete) | POST/GET/PUT/DELETE | All | Manager | 200/403 | Limited |
| AS81 | Employee read-only | GET | Assets | Employee | 200 | Read |
| AS82 | Employee cannot create | POST | Assets | Employee | 403 | Forbidden |
| AS83 | Employee cannot assign | PUT | Assign | Employee | 403 | Forbidden |
| AS84 | Employee cannot delete | DELETE | Assets/:id | Employee | 403 | Forbidden |
| AS85 | Employee can view own assigned | GET | Assets?assigned_to= | Employee own | 200 | Own assets |
| AS86 | Cross-tenant isolation | ALL | Any | Wrong tenant | 403 | Blocked |
| AS87 | Super Admin bypasses | ALL | All | Super admin | 200 | Unrestricted |
| AS88 | Mass assignment protection | PUT | Assets/:id | `{ id: 999 }` | 200 | Protected |

## 1.10 Edge Cases — 17 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| AS89 | Asset with no serial number | POST | `/api/assets` | No serial_no | 201 | Optional |
| AS90 | Asset with cost = 0 | POST | `/api/assets` | `{ cost: 0 }` | 201 | Free asset |
| AS91 | Asset with very long name | POST | `/api/assets` | 300 chars | 400 | Length limit |
| AS92 | Asset warranty in past | POST | `/api/assets` | Expired warranty | 201 | Stored |
| AS93 | Asset with image upload (invalid type) | POST | `/api/assets` | `.gif` file | 400 | Invalid type |
| AS94 | Asset with image > 5MB | POST | `/api/assets` | Large image | 400 | Too large |
| AS95 | 100 assets then list | POST x100 → GET | Bulk | Unique | 201, 200 | All listed |
| AS96 | Assign then unassign same day | Assign → Unassign | Same asset | History shows both | 200 | Logged |
| AS97 | Asset status lifecycle | PUT x4 | new→assigned→maintenance→disposed | All | 200 | Full flow |
| AS98 | Invalid status transition (disposed→assigned) | PUT | Assets/:id | disposed→assigned | 400 | Can't undo |
| AS99 | Unicode asset name | POST | `/api/assets` | Chinese/Japanese | 201 | Accepted |
| AS100 | Asset with barcode/QR | POST | `/api/assets` | With barcode_id | 201 | Barcode stored |
| AS101 | Asset check-in/check-out audit | GET | `/api/assets/:id/history` | Full assignment history | 200 | Complete log |
| AS102 | Bulk asset import via CSV | POST | `/api/assets/import` | CSV file | 201 | Bulk imported |
| AS103 | Bulk import with errors | POST | `/api/assets/import` | Some invalid rows | 207 | Partial success |
| AS104 | Asset depreciation tracking | GET | `/api/assets/:id` | Has depreciation | 200 | `current_value` |
| AS105 | Asset location tracking | POST | `/api/assets` | `{ location: "Floor 2, Desk 5" }` | 201 | Location stored |

Total: 15 + 12 + 5 + 10 + 8 + 12 + 8 + 8 + 10 + 17 = **105 tests**
