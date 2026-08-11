# Settings Module — Deep API Test Cases (105 tests)

## 1.1 Create Setting — 12 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| S1 | Create setting | POST | `/api/settings` | `{ key, value, description }` | 201 | Setting created |
| S2 | Create with empty key | POST | `/api/settings` | `{ key: "" }` | 400 | Required |
| S3 | Create with duplicate key | POST | `/api/settings` | Same key as S1 | 409 | Duplicate |
| S4 | Create without auth | POST | `/api/settings` | No token | 401 | Unauthorized |
| S5 | Create as employee | POST | `/api/settings` | Employee token | 403 | Forbidden |
| S6 | Create with SQL injection in value | POST | `/api/settings` | `{ key: "test", value: "'; DROP TABLE settings; --" }` | 201 | Sanitized |
| S7 | Create with XSS in value | POST | `/api/settings` | `{ value: "<script>alert(1)</script>" }` | 201 | HTML-encoded |
| S8 | Create with JSON value | POST | `/api/settings` | `{ value: { nested: "object" }, type: "json" }` | 201 | JSON stored |
| S9 | Create with boolean value | POST | `/api/settings` | `{ value: true, type: "boolean" }` | 201 | Boolean stored |
| S10 | Create with number value | POST | `/api/settings` | `{ value: 42, type: "number" }` | 201 | Number stored |
| S11 | Create system setting (requires super-admin) | POST | `/api/settings` | `{ scope: "system" }` | 403 | Only super-admin |
| S12 | Create setting with very long key | POST | `/api/settings` | 300 char key | 400 | Too long |

## 1.2 List Settings — 10 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| S13 | List all settings | GET | `/api/settings` | Valid auth | 200 | Array |
| S14 | List with key filter | GET | `/api/settings?key=site_name` | Valid auth | 200 | By key |
| S15 | List with search | GET | `/api/settings?search=email` | Valid auth | 200 | Searched |
| S16 | List with pagination | GET | `/api/settings?page=1&limit=20` | Valid auth | 200 | Paginated |
| S17 | List with scope filter | GET | `/api/settings?scope=tenant` | Valid auth | 200 | By scope |
| S18 | List empty result | GET | `/api/settings?search=__nonexistent__` | Valid auth | 200 | Empty |
| S19 | List without auth | GET | `/api/settings` | No token | 401 | Unauthorized |
| S20 | List as employee | GET | `/api/settings` | Employee token | 200 | But limited? |
| S21 | List cross-tenant | GET | `/api/settings` | Wrong tenant | 403 | Blocked |
| S22 | List with group/category filter | GET | `/api/settings?category=email` | Valid auth | 200 | Grouped |

## 1.3 Get Setting by Key — 8 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| S23 | Get by key | GET | `/api/settings/:key` | Valid auth | 200 | Setting object |
| S24 | Get non-existent key | GET | `/api/settings/:key` | `key: "nonexistent"` | 404 | Not found |
| S25 | Get without auth | GET | `/api/settings/:key` | No token | 401 | Unauthorized |
| S26 | Get with special chars in key | GET | `/api/settings/:key` | `key: "site.name"` | 200 | Dot notation |
| S27 | Get with SQL injection in key | GET | `/api/settings/:key` | `key: "'; DROP TABLE settings; --"` | 400 | Sanitized |
| S28 | Get returns typed value | GET | `/api/settings/:key` | Boolean setting | 200 | `value` as boolean |
| S29 | Get returns JSON parsed | GET | `/api/settings/:key` | JSON setting | 200 | `value` as object |
| S30 | Get cross-tenant isolation | GET | `/api/settings/:key` | Wrong tenant | 403 | Blocked |

## 1.4 Update Setting — 12 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| S31 | Update value | PUT | `/api/settings/:key` | `{ value: "new-value" }` | 200 | Updated |
| S32 | Update type | PUT | `/api/settings/:key` | `{ value: 42, type: "number" }` | 200 | Type changed |
| S33 | Update non-existent | PUT | `/api/settings/:key` | `key: "nonexistent"` | 404 | Not found |
| S34 | Update without auth | PUT | `/api/settings/:key` | No token | 401 | Unauthorized |
| S35 | Update as employee | PUT | `/api/settings/:key` | Employee | 403 | Forbidden |
| S36 | Update with SQL injection | PUT | `/api/settings/:key` | `{ value: "'; UPDATE settings SET value='hacked' --" }` | 200 | Sanitized |
| S37 | Update with XSS | PUT | `/api/settings/:key` | `{ value: "<script>alert(1)</script>" }` | 200 | HTML-encoded |
| S38 | Bulk update settings | PUT | `/api/settings/bulk` | `{ settings: { key1: "val1", key2: "val2" } }` | 200 | Bulk updated |
| S39 | Bulk update with invalid keys | PUT | `/api/settings/bulk` | Mix of valid/invalid | 207 | Partial |
| S40 | Update system scope (non super-admin) | PUT | `/api/settings/:key` | System scope key | 403 | Forbidden |
| S41 | Update with empty value | PUT | `/api/settings/:key` | `{ value: "" }` | 200 | Empty allowed |
| S42 | Update with null value | PUT | `/api/settings/:key` | `{ value: null }` | 200 | Null allowed |

## 1.5 Delete Setting — 6 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| S43 | Delete setting | DELETE | `/api/settings/:key` | Admin | 200 | Deleted |
| S44 | Delete non-existent | DELETE | `/api/settings/:key` | `key: "nonexistent"` | 404 | Not found |
| S45 | Delete without auth | DELETE | `/api/settings/:key` | No token | 401 | Unauthorized |
| S46 | Delete as employee | DELETE | `/api/settings/:key` | Employee | 403 | Forbidden |
| S47 | Delete system setting (non super-admin) | DELETE | `/api/settings/:key` | System scope | 403 | Forbidden |
| S48 | Delete then recreate | DELETE → POST | Same key | After delete | 201 | Recreated |

## 1.6 Authorization — 15 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| S49 | Admin can CRUD tenant-level settings | ALL | Settings | Admin | 200 | Full |
| S50 | Admin cannot CRUD system-level settings | ALL | System scope | Admin | 403 | Super admin only |
| S51 | Manager can view settings | GET | Settings | Manager | 200 | Read |
| S52 | Manager cannot create settings | POST | Settings | Manager | 403 | Forbidden |
| S53 | Manager cannot update critical settings | PUT | Settings/:key | Manager | 403 | Restricted |
| S54 | Manager cannot delete settings | DELETE | Settings/:key | Manager | 403 | Forbidden |
| S55 | Employee can view public settings | GET | Settings | Employee | 200 | Read |
| S56 | Employee cannot create/update/delete | POST/PUT/DELETE | Settings | Employee | 403 | Forbidden |
| S57 | Super admin full access (system+tenant) | ALL | All | Super admin | 200 | Unrestricted |
| S58 | Cross-tenant isolation | ALL | Any | Wrong tenant | 403 | Blocked |
| S59 | Mass assignment | PUT | Settings/:key | `{ key: "different-key" }` | 200 | Can't change key |
| S60 | SQL injection in key filter | GET | `/api/settings?key=' UNION...` | Valid token | 200 | Sanitized |
| S61 | Rate limiting | GET | Settings x 1000 | Valid token | 429 | Limited |
| S62 | Setting key with special chars | POST | `/api/settings` | `{ key: "app.email.from@address" }` | 201 | Special chars |
| S63 | Setting key starting with reserved prefix | POST | `/api/settings` | `{ key: "system.something" }` | 403 | Protected |

## 1.7 Email Template Settings — 10 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| S64 | List email templates | GET | `/api/email-templates` | Valid auth | 200 | Array |
| S65 | Create email template | POST | `/api/email-templates` | `{ name, subject, body, variables }` | 201 | Template created |
| S66 | Create with missing subject | POST | `/api/email-templates` | No subject | 400 | Required |
| S67 | Create with SQL injection in body | POST | `/api/email-templates` | `{ body: "'; DROP TABLE templates; --" }` | 201 | Sanitized |
| S68 | Create with XSS in body | POST | `/api/email-templates` | `{ body: "<script>alert(1)</script>" }` | 201 | HTML-encoded |
| S69 | Update template | PUT | `/api/email-templates/:id` | `{ subject: "New Subject" }` | 200 | Updated |
| S70 | Delete template | DELETE | `/api/email-templates/:id` | Admin | 200 | Deleted |
| S71 | Send templated email | POST | `/api/email-templates/:id/send` | `{ to, variables: { name: "John" } }` | 200 | Email sent |
| S72 | Send with missing variables | POST | `/api/email-templates/:id/send` | No variables | 400 | Required |
| S73 | Send with invalid email | POST | `/api/email-templates/:id/send` | `{ to: "invalid" }` | 400 | Invalid email |

## 1.8 Website Settings — 8 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| S74 | Get public website settings | GET | `/api/website-settings` | No auth | 200 | Public |
| S75 | Get includes branding | GET | `/api/website-settings` | Public | 200 | `primary_color`, `logo_url`, `favicon` |
| S76 | Update website settings | PUT | `/api/website-settings` | `{ primary_color: "#ff0000", company_name: "MyCo" }` | 200 | Updated |
| S77 | Update without auth | PUT | `/api/website-settings` | No token | 401 | Unauthorized |
| S78 | Update as admin | PUT | `/api/website-settings` | Admin | 200 | Allowed |
| S79 | Update as employee | PUT | `/api/website-settings` | Employee | 403 | Forbidden |
| S80 | Update with invalid color | PUT | `/api/website-settings` | `{ primary_color: "not-a-color" }` | 400 | Invalid |
| S81 | Update with logo upload | PUT | `/api/website-settings` | Multipart with logo | 200 | Logo updated |

## 1.9 Mobile Config — 8 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| S82 | Get public mobile config | GET | `/api/mobile-config` | No auth | 200 | Public config |
| S83 | Get all mobile config (admin) | GET | `/api/mobile-config/all` | Admin token | 200 | Full config |
| S84 | Get without auth | GET | `/api/mobile-config/all` | No token | 401 | Unauthorized |
| S85 | Update mobile config | PUT | `/api/mobile-config/:key` | `{ value: "new" }` | 200 | Updated |
| S86 | Update as non super-admin | PUT | `/api/mobile-config/:key` | Regular admin | 403 | Forbidden |
| S87 | Config includes maintenance mode | GET | `/api/mobile-config` | Public | 200 | `maintenance_mode` |
| S88 | Config includes feature toggles | GET | `/api/mobile-config` | Public | 200 | `features` object |
| S89 | Config includes app_version | GET | `/api/mobile-config` | Public | 200 | `min_version` |

## 1.10 Edge Cases — 16 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| S90 | Setting with key length exactly 1 | POST | `/api/settings` | `{ key: "a", value: "test" }` | 201 | Min length |
| S91 | Setting with key length at max | POST | `/api/settings` | Max allowed chars | 201 | Max length |
| S92 | Setting with value as nested JSON | POST | `/api/settings` | `{ value: { a: { b: { c: 1 } } } }` | 201 | Deep nesting |
| S93 | Setting with empty object value | POST | `/api/settings` | `{ value: {} }` | 201 | Empty object |
| S94 | Setting with empty array value | POST | `/api/settings` | `{ value: [] }` | 201 | Empty array |
| S95 | 100 settings bulk create | POST | `/api/settings/bulk` | 100 settings | 201 | All created |
| S96 | Update setting then verify with GET | PUT → GET | Same key | Changed | 200 | Reflects new value |
| S97 | Delete critical setting (affects system) | DELETE | Email config key | While active | 400 | Can't delete active |
| S98 | Setting key case sensitivity | POST | `/api/settings` | `{ key: "Site_Name" }` then `key: "site_name"` | 409 | Case-insensitive? |
| S99 | Setting with binary value | POST | `/api/settings` | Binary string | 400 | Not allowed |
| S100 | Email template with no body | POST | Email templates | No body | 400 | Required |
| S101 | Email template variable substitution | POST | Send email | `{ variables: { name: "John" } }` | 200 | `{{name}}` replaced |
| S102 | Email template missing variable | POST | Send email | Missing required var | 200 | Partial or error |
| S103 | Website settings xss prevention | GET | Public settings | Contains HTML | 200 | Stripped |
| S104 | Mobile config version check | GET | `/api/mobile-config` | Old app version header | 200 | Update available |
| S105 | Settings audit log | GET | `/api/audit-logs?module=settings` | Admin | 200 | Changes logged |

Total: 12 + 10 + 8 + 12 + 6 + 15 + 10 + 8 + 8 + 16 = **105 tests**
