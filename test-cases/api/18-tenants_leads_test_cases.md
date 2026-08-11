# Tenants & Leads Modules - Test Cases

## Tenants (`/api/tenants`)

| # | Test Case | Method | Endpoint | Expected Result | Auth |
|---|---|---|---|---|---|
| TNT-001 | Get all tenants (super admin) | GET | `/api/tenants` | 200 OK, tenant array | SuperAdmin JWT |
| TNT-002 | Get tenants as non-super-admin | GET | `/api/tenants` | 403 Forbidden | Admin (non-default) |
| TNT-003 | Get tenants without auth | GET | `/api/tenants` | 401 Unauthorized | None |
| TNT-004 | Create tenant (super admin) | POST | `/api/tenants` | 201 Created | SuperAdmin JWT |
| TNT-005 | Create tenant without super admin | POST | `/api/tenants` | 403 Forbidden | Admin JWT |
| TNT-006 | Create tenant with missing fields | POST | `/api/tenants` | 400 Validation error | SuperAdmin JWT |
| TNT-007 | Create duplicate tenant (same name/id) | POST | `/api/tenants` | 409 Conflict | SuperAdmin JWT |
| TNT-008 | Update tenant | PUT | `/api/tenants/:tenantId` | 200 OK | SuperAdmin JWT |
| TNT-009 | Update non-existent tenant | PUT | `/api/tenants/:tenantId` | 404 Not Found | SuperAdmin JWT |
| TNT-010 | Delete tenant | DELETE | `/api/tenants/:tenantId` | 200 OK (with 2FA) | SuperAdmin JWT |
| TNT-011 | Delete tenant without 2FA | DELETE | `/api/tenants/:tenantId` | 400 2FA required | SuperAdmin JWT |
| TNT-012 | Delete non-existent tenant | DELETE | `/api/tenants/:tenantId` | 404 Not Found | SuperAdmin JWT |
| TNT-013 | Reset tenant admin password | POST | `/api/tenants/:tenantId/reset-password` | 200 OK | SuperAdmin JWT |
| TNT-014 | Get biometric devices (super admin) | GET | `/api/tenants/biometric-devices/all` | 200 OK | SuperAdmin JWT |
| TNT-015 | Register biometric device | POST | `/api/tenants/biometric-devices/register` | 201 Created | SuperAdmin JWT |
| TNT-016 | Register duplicate device serial | POST | `/api/tenants/biometric-devices/register` | 409 Conflict | SuperAdmin JWT |
| TNT-017 | Delete biometric device | DELETE | `/api/tenants/biometric-devices/:serialNumber` | 200 OK | SuperAdmin JWT |
| TNT-018 | Delete non-existent device | DELETE | `/api/tenants/biometric-devices/:serialNumber` | 404 Not Found | SuperAdmin JWT |
| TNT-019 | Create tenant then verify in list | POST + GET | workflow | New tenant visible | SuperAdmin JWT |
| TNT-020 | Update tenant then GET confirms | PUT + GET | workflow | Changes reflected | SuperAdmin JWT |
| TNT-021 | Delete tenant then GET returns 404 | DELETE + GET | workflow | 404 Not Found | SuperAdmin JWT |
| TNT-022 | Tenant creation creates schema | POST + DB | workflow | New schema in DB | SuperAdmin JWT |
| TNT-023 | Tenant deletion removes schema | DELETE + DB | workflow | Schema removed | SuperAdmin JWT |
| TNT-024 | Tenant response includes all fields | GET | `/api/tenants` | id, name, status, created_at | SuperAdmin JWT |
| TNT-025 | Biometric device response | GET | `/api/tenants/biometric-devices/all` | serial, name, status, last_seen | SuperAdmin JWT |

## Leads / Demo Requests (`/api/leads`)

| # | Test Case | Method | Endpoint | Expected Result | Auth |
|---|---|---|---|---|---|
| LDS-026 | Submit demo request (public) | POST | `/api/leads/demo` | 201 Created | None |
| LDS-027 | Submit demo with missing name | POST | `/api/leads/demo` | 400 Validation error | None |
| LDS-028 | Submit demo with missing email | POST | `/api/leads/demo` | 400 Validation error | None |
| LDS-029 | Submit demo with invalid email | POST | `/api/leads/demo` | 400 Validation error | None |
| LDS-030 | Submit demo with company details | POST | `/api/leads/demo` | 201, company saved | None |
| LDS-031 | Submit duplicate demo (same email) | POST | `/api/leads/demo` | 409 Conflict | None |
| LDS-032 | Submit demo with phone | POST | `/api/leads/demo` | 201, phone saved | None |
| LDS-033 | Get all leads (admin) | GET | `/api/leads` | 200 OK, lead array | SuperAdmin JWT |
| LDS-034 | Get leads without auth | GET | `/api/leads` | 401 Unauthorized | None |
| LDS-035 | Get leads as regular admin | GET | `/api/leads` | 403 Forbidden | Admin JWT |
| LDS-036 | Get leads with status filter | GET | `/api/leads?status=new` | 200, filtered | SuperAdmin JWT |
| LDS-037 | Provision demo account from lead | POST | `/api/leads/provision/:id` | 200 OK | SuperAdmin JWT |
| LDS-038 | Provision already-provisioned lead | POST | `/api/leads/provision/:id` | 409 Already provisioned | SuperAdmin JWT |
| LDS-039 | Provision non-existent lead | POST | `/api/leads/provision/:id` | 404 Not Found | SuperAdmin JWT |
| LDS-040 | Get lead backup | GET | `/api/leads/:id/backup` | 200 OK, backup file | SuperAdmin JWT |
| LDS-041 | Delete demo account | DELETE | `/api/leads/:id` | 200 OK | SuperAdmin JWT |
| LDS-042 | Delete non-existent lead | DELETE | `/api/leads/:id` | 404 Not Found | SuperAdmin JWT |
| LDS-043 | Restore demo account from backup | POST | `/api/leads/restore` | 200 OK | SuperAdmin JWT |
| LDS-044 | Restore with invalid backup data | POST | `/api/leads/restore` | 400 Invalid backup | SuperAdmin JWT |
| LDS-045 | Provision then verify tenant exists | POST + GET | workflow | Tenant created | SuperAdmin JWT |
| LDS-046 | Submit demo with XSS in name | POST | `/api/leads/demo` | 201, stored as literal | None |
| LDS-047 | Submit demo with SQL injection | POST | `/api/leads/demo` | 201, parameterized | None |
| LDS-048 | Lead list pagination | GET | `/api/leads?page=1&limit=10` | 200 with pagination | SuperAdmin JWT |
| LDS-049 | Lead response with created_at | GET | `/api/leads` | Timestamp fields present | SuperAdmin JWT |
| LDS-050 | Submit demo with notes/message | POST | `/api/leads/demo` | 201, notes saved | None |
| LDS-051 | Submit demo with company_size | POST | `/api/leads/demo` | 201, size saved | None |
| LDS-052 | Submit demo without tenant header | POST | `/api/leads/demo` | 201 (public endpoint) | None |
| LDS-053 | Provision lead creates tenant with lead data | POST | `/api/leads/provision/:id` | Tenant has lead's name/email | SuperAdmin JWT |
| LDS-054 | Lead status lifecycle: new -> contacted -> qualified -> provisioned -> closed | PUT | lead status updates | All transitions work | SuperAdmin JWT |
| LDS-055 | Response format: success + data | GET | `/api/leads` | `{ success, data }` | SuperAdmin JWT |

---

**Total: 55 test cases**
