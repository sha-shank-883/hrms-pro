# Tenants, Leads & Biometrics — Deep API Test Cases (105 tests)

## 1.1 Tenants CRUD (Super Admin) — 20 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| T1 | List tenants | GET | `/api/tenants` | Super admin token | 200 | Array |
| T2 | List without auth | GET | `/api/tenants` | No token | 401 | Unauthorized |
| T3 | List as regular admin | GET | `/api/tenants` | Admin token | 403 | Forbidden |
| T4 | List includes tenant stats | GET | `/api/tenants` | Super admin | 200 | `employee_count`, `status` |
| T5 | List with status filter | GET | `/api/tenants?status=active` | Super admin | 200 | Active only |
| T6 | List with search | GET | `/api/tenants?search=acme` | Super admin | 200 | Searched |
| T7 | Create tenant | POST | `/api/tenants` | `{ company_name, email, domain, database_name }` | 201 | Tenant created |
| T8 | Create with missing company_name | POST | `/api/tenants` | Missing name | 400 | Required |
| T9 | Create with duplicate email | POST | `/api/tenants` | Same email as T7 | 409 | Duplicate |
| T10 | Create without auth | POST | `/api/tenants` | No token | 401 | Unauthorized |
| T11 | Create as regular admin | POST | `/api/tenants` | Admin token | 403 | Forbidden |
| T12 | Create with SQL injection | POST | `/api/tenants` | `{ company_name: "'; DROP TABLE tenants; --" }` | 201 | Sanitized |
| T13 | Get single tenant | GET | `/api/tenants/:id` | Super admin | 200 | Tenant object |
| T14 | Get non-existent | GET | `/api/tenants/:id` | `id: 99999` | 404 | Not found |
| T15 | Update tenant | PUT | `/api/tenants/:id` | `{ company_name: "Updated" }` | 200 | Updated |
| T16 | Update tenant status (activate) | PUT | `/api/tenants/:id` | `{ status: "active" }` | 200 | Activated |
| T17 | Update tenant status (deactivate) | PUT | `/api/tenants/:id` | `{ status: "inactive" }` | 200 | Deactivated |
| T18 | Delete tenant | DELETE | `/api/tenants/:id` | Super admin | 200 | Deleted |
| T19 | Delete non-existent | DELETE | `/api/tenants/:id` | `id: 99999` | 404 | Not found |
| T20 | Delete tenant with data | DELETE | `/api/tenants/:id` | Has employees | 409 | FK or confirm |

## 1.2 Tenant Password Reset — 5 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| T21 | Reset tenant admin password | POST | `/api/tenants/:id/reset-password` | Super admin | 200 | Reset token sent |
| T22 | Reset without auth | POST | `/api/tenants/:id/reset-password` | No token | 401 | Unauthorized |
| T23 | Reset as regular admin | POST | `/api/tenants/:id/reset-password` | Admin | 403 | Forbidden |
| T24 | Reset non-existent tenant | POST | `/api/tenants/:id/reset-password` | `id: 99999` | 404 | Not found |
| T25 | Reset creates new temporary password | POST | `/api/tenants/:id/reset-password` | Valid | 200 | Password changed |

## 1.3 Leads / Demo Requests — 15 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| T26 | Submit demo request (public) | POST | `/api/leads` | `{ name, email, company, phone, message }` | 201 | Lead created |
| T27 | Submit with missing email | POST | `/api/leads` | No email | 400 | Required |
| T28 | Submit with invalid email | POST | `/api/leads` | `email: "invalid"` | 400 | Invalid |
| T29 | Submit with missing name | POST | `/api/leads` | No name | 400 | Required |
| T30 | Submit duplicate email | POST | `/api/leads` | Same email as T26 | 409 | Duplicate |
| T31 | Submit with SQL injection | POST | `/api/leads` | `{ name: "'; DROP TABLE leads; --" }` | 201 | Sanitized |
| T32 | Submit with XSS | POST | `/api/leads` | `{ message: "<script>alert(1)</script>" }` | 201 | HTML-encoded |
| T33 | List leads (super admin) | GET | `/api/leads` | Super admin | 200 | Array |
| T34 | List leads without auth | GET | `/api/leads` | No token | 401 | Unauthorized |
| T35 | List leads as regular admin | GET | `/api/leads` | Admin | 403 | Forbidden |
| T36 | List with status filter | GET | `/api/leads?status=new` | Super admin | 200 | New leads |
| T37 | Update lead status | PUT | `/api/leads/:id` | `{ status: "contacted" }` | 200 | Updated |
| T38 | Delete lead | DELETE | `/api/leads/:id` | Super admin | 200 | Deleted |
| T39 | Provision tenant from lead | POST | `/api/leads/:id/provision` | Super admin | 201 | Tenant created |
| T40 | Provision already provisioned | POST | `/api/leads/:id/provision` | Already done | 409 | Already |

## 1.4 Backup & Restore — 8 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| T41 | Backup tenant data | POST | `/api/tenants/:id/backup` | Super admin | 200 | Backup created |
| T42 | Backup without auth | POST | `/api/tenants/:id/backup` | No token | 401 | Unauthorized |
| T43 | Backup as admin | POST | `/api/tenants/:id/backup` | Admin | 403 | Forbidden |
| T44 | List backups | GET | `/api/tenants/:id/backups` | Super admin | 200 | Array |
| T45 | Restore from backup | POST | `/api/tenants/:id/restore` | `{ backup_id }` | 200 | Restored |
| T46 | Restore non-existent backup | POST | `/api/tenants/:id/restore` | `backup_id: 99999` | 404 | Not found |
| T47 | Restore without auth | POST | `/api/tenants/:id/restore` | No token | 401 | Unauthorized |
| T48 | Restore on active tenant (downtime) | POST | `/api/tenants/:id/restore` | Active tenant | 400 | Must be maintenance |

## 1.5 Biometric Devices — 15 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| T49 | Register biometric device | POST | `/api/tenants/biometric-devices` | `{ name, ip_address, port, model, location }` | 201 | Device registered |
| T50 | Register with missing IP | POST | `/api/tenants/biometric-devices` | No ip_address | 400 | Required |
| T51 | Register duplicate IP | POST | `/api/tenants/biometric-devices` | Same IP | 409 | Duplicate |
| T52 | Register without auth | POST | `/api/tenants/biometric-devices` | No token | 401 | Unauthorized |
| T53 | Register as employee | POST | `/api/tenants/biometric-devices` | Employee | 403 | Forbidden |
| T54 | List devices | GET | `/api/tenants/biometric-devices` | Super admin | 200 | Array |
| T55 | List all devices (super admin) | GET | `/api/tenants/biometric-devices/all` | Super admin | 200 | All tenants |
| T56 | List all without auth | GET | `/api/tenants/biometric-devices/all` | No token | 401 | Unauthorized |
| T57 | Get device | GET | `/api/tenants/biometric-devices/:id` | Super admin | 200 | Device object |
| T58 | Update device | PUT | `/api/tenants/biometric-devices/:id` | `{ name: "Updated" }` | 200 | Updated |
| T59 | Delete device | DELETE | `/api/tenants/biometric-devices/:id` | Super admin | 200 | Deleted |
| T60 | Test device connection | POST | `/api/tenants/biometric-devices/:id/test` | Super admin | 200 | Connection result |
| T61 | Test unreachable device | POST | `/api/tenants/biometric-devices/:id/test` | Offline | 200 | `connected: false` |
| T62 | Sync attendance from device | POST | `/api/tenants/biometric-devices/:id/sync` | Super admin | 200 | Synced records |
| T63 | Sync without auth | POST | `/api/tenants/biometric-devices/:id/sync` | No token | 401 | Unauthorized |

## 1.6 Biometric Webhooks — 10 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| T64 | ZKTeco webhook punch in | POST | `/api/webhooks/biometrics/zkteco` | `{ employee_id, timestamp, device_id, status }` | 200 | Recorded |
| T65 | ZKTeco with missing employee_id | POST | `/api/webhooks/biometrics/zkteco` | No employee_id | 400 | Required |
| T66 | ZKTeco with invalid signature | POST | `/api/webhooks/biometrics/zkteco` | Wrong auth key | 401 | Unauthorized |
| T67 | ZKTeco duplicate punch | POST | `/api/webhooks/biometrics/zkteco` | Same timestamp x2 | 200 | Deduplicated |
| T68 | Universal webhook | POST | `/api/webhooks/biometrics/universal` | `{ uid, timestamp, device_sn }` | 200 | Recorded |
| T69 | Universal missing uid | POST | `/api/webhooks/biometrics/universal` | No uid | 400 | Required |
| T70 | Universal invalid JSON | POST | `/api/webhooks/biometrics/universal` | `not-json` | 400 | Parse error |
| T71 | Webhook creates attendance record | GET | `/api/attendance/today` | After punch | 200 | Clock-in exists |
| T72 | Webhook cross-tenant isolation | POST | `/api/webhooks/biometrics/zkteco` | Tenant A device, B header | 403 | Blocked |
| T73 | Webhook device not found | POST | `/api/webhooks/biometrics/zkteco` | Unknown device_id | 400 | Unknown device |

## 1.7 Super Admin Dashboard — 8 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| T74 | Get super admin dashboard | GET | `/api/tenants/dashboard` | Super admin | 200 | Dashboard |
| T75 | Dashboard includes total tenants | GET | `/api/tenants/dashboard` | Super admin | 200 | `total_tenants` |
| T76 | Dashboard includes active/inactive counts | GET | `/api/tenants/dashboard` | Super admin | 200 | Status counts |
| T77 | Dashboard includes total employees | GET | `/api/tenants/dashboard` | Super admin | 200 | `total_employees` |
| T78 | Dashboard includes recent signups | GET | `/api/tenants/dashboard` | Super admin | 200 | Recent tenants |
| T79 | Dashboard includes revenue stats | GET | `/api/tenants/dashboard` | Super admin | 200 | `monthly_revenue` |
| T80 | Dashboard without auth | GET | `/api/tenants/dashboard` | No token | 401 | Unauthorized |
| T81 | Dashboard as admin | GET | `/api/tenants/dashboard` | Admin | 403 | Forbidden |

## 1.8 Authorization — 12 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| T82 | Super admin can manage all tenants | ALL | Tenants | Super admin | 200 | Full |
| T83 | Regular admin cannot view tenants | GET | Tenants | Admin | 403 | Forbidden |
| T84 | Regular admin cannot manage tenants | POST/PUT/DELETE | Tenants | Admin | 403 | Forbidden |
| T85 | Super admin can view leads | GET | Leads | Super admin | 200 | Full |
| T86 | Regular admin cannot view leads | GET | Leads | Admin | 403 | Forbidden |
| T87 | Super admin can manage biometric devices | ALL | Devices | Super admin | 200 | Full |
| T88 | Admin can manage own tenant devices | POST | Devices (own) | Admin | 201 | Allowed |
| T89 | Admin cannot manage other tenant devices | POST | Devices (other) | Admin, wrong tenant | 403 | Blocked |
| T90 | Employee cannot access devices | GET | Devices | Employee | 403 | Forbidden |
| T91 | Cross-tenant webhooks blocked | POST | Webhooks | Wrong tenant | 403 | Blocked |
| T92 | Mass assignment protection | PUT | Tenant | `{ id: 999 }` | 200 | Protected |
| T93 | SQL injection in list params | GET | Tenants?search='UNION... | Super admin | 200 | Sanitized |

## 1.9 Edge Cases — 12 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| T94 | Create tenant with database schema auto-provision | POST | Tenants | New tenant | 201 | Schema created |
| T95 | Tenant with same domain different TLD | POST | Tenants | `domain: "acme2.com"` vs `acme.com` | 201 | Different |
| T96 | Tenant domain validation | POST | Tenants | `domain: "not a domain"` | 400 | Invalid |
| T97 | Deactivate tenant blocks all API | GET | Employees endpoint | Deactivated tenant header | 403 | Blocked |
| T98 | Reactivate tenant restores access | GET | Employees endpoint | Reactivated header | 200 | Working |
| T99 | Lead with large message body | POST | Leads | 10K chars message | 400 | Too long |
| T100 | Lead phone validation | POST | Leads | `phone: "abc"` | 400 | Invalid |
| T101 | Biometric device duplicate name | POST | Devices | Same name | 409 | Duplicate |
| T102 | Biometric device invalid IP | POST | Devices | `ip: "999.999.999.999"` | 400 | Invalid |
| T103 | Provision tenant from lead with all data | POST | Provision | Complete | 201 | Full provision |
| T104 | Provision tenant duplicate domain | POST | Provision | Existing domain | 409 | Duplicate |
| T105 | Backup large tenant | POST | Backup | Tenant with 1000+ employees | 200 | Handles scale |

Total: 20 + 5 + 15 + 8 + 15 + 10 + 8 + 12 + 12 = **105 tests**
