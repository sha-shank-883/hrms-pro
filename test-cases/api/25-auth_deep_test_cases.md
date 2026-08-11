# Auth Module — Deep API Test Cases (125 tests)

## 1.1 Registration — 20 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| A1 | Register with valid data | POST | `/api/auth/register` | `{ name, email, password, company_name }` | 201 | `message`, user object, no password in response |
| A2 | Register with duplicate email | POST | `/api/auth/register` | Same email as A1 | 409 | `message` includes "already exists" |
| A3 | Register with weak password | POST | `/api/auth/register` | `password: "123"` | 400 | Validation error |
| A4 | Register with missing name | POST | `/api/auth/register` | No `name` field | 400 | Validation error |
| A5 | Register with missing email | POST | `/api/auth/register` | No `email` field | 400 | Validation error |
| A6 | Register with missing password | POST | `/api/auth/register` | No `password` field | 400 | Validation error |
| A7 | Register with invalid email format | POST | `/api/auth/register` | `email: "notanemail"` | 400 | Validation error |
| A8 | Register with empty body | POST | `/api/auth/register` | `{}` | 400 | Validation errors |
| A9 | Register with SQL injection in name | POST | `/api/auth/register` | `name: "'; DROP TABLE users; --"` | 201 | Sanitized, registers safely |
| A10 | Register with XSS in name | POST | `/api/auth/register` | `name: "<script>alert(1)</script>"` | 201 | Stored safely, HTML-encoded |
| A11 | Register with very long name (255+) | POST | `/api/auth/register` | `name: "A".repeat(300)` | 400 | Length validation |
| A12 | Register with very long password (128+) | POST | `/api/auth/register` | `password: "A".repeat(200)` | 400 | Length validation |
| A13 | Register with company_name only | POST | `/api/auth/register` | Only `email, password, company_name` | 400 | Missing name |
| A14 | Register with all optional fields | POST | `/api/auth/register` | `{ name, email, password, company_name, phone, designation }` | 201 | All fields stored |
| A15 | Register then login immediately | POST → POST | `/api/auth/register` → `/api/auth/login` | Correct credentials | 201 → 200 | Login succeeds after register |
| A16 | Register same email different case | POST | `/api/auth/register` | `email: "Test@Example.com"` (A1 was "test@example.com") | 409 | Case-insensitive duplicate |
| A17 | Register without tenant header | POST | `/api/auth/register` | No `x-tenant-id` | 401 | Tenant required |
| A18 | Register with invalid tenant header | POST | `/api/auth/register` | `x-tenant-id: nonexistent` | 401 | Invalid tenant |
| A19 | Register with special chars in password | POST | `/api/auth/register` | `password: "P@ssw0rd!@#$%^&*()"` | 201 | Special chars accepted |
| A20 | Register with Unicode in name | POST | `/api/auth/register` | `name: "José García ñoño"` | 201 | Unicode stored correctly |

## 1.2 Login — 15 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| B1 | Login with valid credentials | POST | `/api/auth/login` | `{ email, password }` | 200 | Returns `token`, user object |
| B2 | Login with wrong password | POST | `/api/auth/login` | Correct email, wrong password | 401 | `message` includes "Invalid" |
| B3 | Login with non-existent email | POST | `/api/auth/login` | `email: "noone@example.com"` | 401 | `message` includes "Invalid" |
| B4 | Login with missing email | POST | `/api/auth/login` | `{ password: "xxx" }` | 400 | Validation error |
| B5 | Login with missing password | POST | `/api/auth/login` | `{ email: "test@example.com" }` | 400 | Validation error |
| B6 | Login with empty body | POST | `/api/auth/login` | `{}` | 400 | Validation errors |
| B7 | Login with SQL injection in email | POST | `/api/auth/login` | `email: "' OR '1'='1"` | 401 | Not injected |
| B8 | Login with disabled account | POST | `/api/auth/login` | Deactivated user credentials | 403 | Account disabled |
| B9 | Login without tenant header | POST | `/api/auth/login` | Valid credentials, no header | 401 | Tenant required |
| B10 | Login with inactive tenant | POST | `/api/auth/login` | Valid credentials, inactive tenant | 403 | Tenant inactive |
| B11 | Login trim whitespace in email | POST | `/api/auth/login` | `email: "  test@example.com  "` | 200 | Trims and succeeds |
| B12 | Login returns JWT with correct expiry | POST | `/api/auth/login` | Valid credentials | 200 | Decode token, check `exp` > now |
| B13 | Login rate limit (10 rapid requests) | POST | `/api/auth/login` | Wrong password x10 | 429 | After 5 attempts, rate limited |
| B14 | Login with uppercase email | POST | `/api/auth/login` | `email: "TEST@EXAMPLE.COM"` | 200 | Case-insensitive match |
| B15 | Login response does not expose password | POST | `/api/auth/login` | Valid credentials | 200 | No `password` field in response |

## 1.3 Profile — 10 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| C1 | Get own profile | GET | `/api/auth/profile` | Valid token | 200 | Returns user object |
| C2 | Get profile without token | GET | `/api/auth/profile` | No Authorization header | 401 | Unauthorized |
| C3 | Get profile with expired token | GET | `/api/auth/profile` | Expired JWT | 401 | Token expired |
| C4 | Get profile with malformed token | GET | `/api/auth/profile` | `Bearer invalidtoken` | 401 | Invalid token |
| C5 | Get profile wrong tenant | GET | `/api/auth/profile` | Token from tenant A, header tenant B | 403 | Cross-tenant blocked |
| C6 | Update own profile | PUT | `/api/auth/profile` | `{ name: "New Name" }` | 200 | Name updated |
| C7 | Update profile with empty name | PUT | `/api/auth/profile` | `{ name: "" }` | 400 | Validation error |
| C8 | Update profile with XSS in name | PUT | `/api/auth/profile` | `{ name: "<img onerror=alert(1) src=x>" }` | 200 | Stored HTML-encoded |
| C9 | Update profile with non-existent field | PUT | `/api/auth/profile` | `{ nonexistent: true }` | 200 | Ignores unknown field |
| C10 | Update profile email (should be read-only) | PUT | `/api/auth/profile` | `{ email: "new@example.com" }` | 200 | Email NOT changed |

## 1.4 Change Password — 10 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| D1 | Change password with correct current | PUT | `/api/auth/change-password` | `{ currentPassword, newPassword }` | 200 | Password changed |
| D2 | Change password with wrong current | PUT | `/api/auth/change-password` | `{ currentPassword: "wrong", newPassword: "New@123" }` | 400 | Current password incorrect |
| D3 | Change password with weak new | PUT | `/api/auth/change-password` | `{ currentPassword: "correct", newPassword: "123" }` | 400 | Weak password |
| D4 | Change password without auth | PUT | `/api/auth/change-password` | No token | 401 | Unauthorized |
| D5 | Change password with missing fields | PUT | `/api/auth/change-password` | `{}` | 400 | Missing fields |
| D6 | Change password to same as current | PUT | `/api/auth/change-password` | Same as current password | 400 | Must be different |
| D7 | Change password then login with old | PUT → POST | Change → login | Old password | 401 | Old password invalidated |
| D8 | Change password then login with new | PUT → POST | Change → login | New password | 200 | New password works |
| D9 | Change password with SQL injection in current | PUT | `/api/auth/change-password` | `currentPassword: "' OR '1'='1"` | 400 | Not injected |
| D10 | Change password with very long new password | PUT | `/api/auth/change-password` | `newPassword: "A".repeat(200)` | 400 | Length validation |

## 1.5 Forgot / Reset Password — 12 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| E1 | Forgot password valid email | POST | `/api/auth/forgot-password` | `{ email: "test@example.com" }` | 200 | `message` sent |
| E2 | Forgot password non-existent email | POST | `/api/auth/forgot-password` | `{ email: "noone@example.com" }` | 200 | Same message (don't reveal existence) |
| E3 | Forgot password with missing email | POST | `/api/auth/forgot-password` | `{}` | 400 | Validation error |
| E4 | Forgot password with invalid email format | POST | `/api/auth/forgot-password` | `{ email: "invalid" }` | 400 | Validation error |
| E5 | Forgot password with SQL injection | POST | `/api/auth/forgot-password` | `{ email: "' OR 1=1 --" }` | 400 | Not injected |
| E6 | Reset password with valid token | POST | `/api/auth/reset-password/:token` | `{ password: "NewP@ss123" }` | 200 | Password reset |
| E7 | Reset password with expired token | POST | `/api/auth/reset-password/:token` | Expired/old token | 400 | Token expired/invalid |
| E8 | Reset password with invalid token | POST | `/api/auth/reset-password/:token` | `token: "garbage"` | 400 | Invalid token |
| E9 | Reset password with missing token param | POST | `/api/auth/reset-password/` | No token in URL | 404 | Not found |
| E10 | Reset password with weak password | POST | `/api/auth/reset-password/:token` | `{ password: "123" }` | 400 | Weak password |
| E11 | Reset password then login with new | POST → POST | Reset → login | New credentials | 200 | Login succeeds |
| E12 | Forgot password rate limit (3 rapid requests) | POST | `/api/auth/forgot-password` | Same email x3 | 429 | Rate limited |

## 1.6 Permissions — 8 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| F1 | Get own permissions | GET | `/api/auth/permissions` | Valid auth token | 200 | Returns permissions array |
| F2 | Get permissions without auth | GET | `/api/auth/permissions` | No token | 401 | Unauthorized |
| F3 | Get permissions as employee | GET | `/api/auth/permissions` | Employee token | 200 | Limited permissions |
| F4 | Get permissions as admin | GET | `/api/auth/permissions` | Admin token | 200 | Full permissions |
| F5 | Get permissions includes module names | GET | `/api/auth/permissions` | Any valid token | 200 | Contains `module`, `permissions` |
| F6 | Permissions response format | GET | `/api/auth/permissions` | Valid token | 200 | Array of `{ module, permissions[] }` |
| F7 | Permissions for deactivated user | GET | `/api/auth/permissions` | Deactivated user token | 403 | Account disabled |
| F8 | Permissions cross-tenant | GET | `/api/auth/permissions` | Token tenant A, header tenant B | 403 | Blocked |

## 1.7 Two-Factor Authentication (2FA) — 15 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| G1 | Setup 2FA | POST | `/api/auth/2fa/setup` | Valid auth | 200 | Returns `secret`, `qrCode` |
| G2 | Setup 2FA without auth | POST | `/api/auth/2fa/setup` | No token | 401 | Unauthorized |
| G3 | Setup 2FA already enabled | POST | `/api/auth/2fa/setup` | 2FA already ON | 400 | Already enabled |
| G4 | Verify 2FA setup with valid code | POST | `/api/auth/2fa/verify-setup` | `{ token: 123456 }` | 200 | 2FA enabled |
| G5 | Verify 2FA setup with invalid code | POST | `/api/auth/2fa/verify-setup` | `{ token: 000000 }` | 400 | Invalid code |
| G6 | Verify 2FA setup with missing code | POST | `/api/auth/2fa/verify-setup` | `{}` | 400 | Missing code |
| G7 | Login with 2FA (step 1 returns requires_2fa) | POST | `/api/auth/login` | 2FA-enabled user | 200 | `requires_2fa: true`, no token |
| G8 | Verify 2FA login with valid code | POST | `/api/auth/2fa/verify-login` | `{ email, password, token }` | 200 | Returns JWT token |
| G9 | Verify 2FA login with invalid code | POST | `/api/auth/2fa/verify-login` | `{ token: 000000 }` | 401 | Access denied |
| G10 | Verify 2FA login with expired code | POST | `/api/auth/2fa/verify-login` | Old/expired code | 401 | Code expired |
| G11 | Verify 2FA login missing email/password | POST | `/api/auth/2fa/verify-login` | `{ token: 123456 }` | 400 | Missing fields |
| G12 | Disable 2FA | POST | `/api/auth/2fa/disable` | Valid auth, 2FA enabled | 200 | 2FA disabled |
| G13 | Disable 2FA when not enabled | POST | `/api/auth/2fa/disable` | 2FA not enabled | 400 | Not enabled |
| G14 | Disable 2FA without auth | POST | `/api/auth/2fa/disable` | No token | 401 | Unauthorized |
| G15 | Full 2FA lifecycle: setup→verify→login→disable | POST x4 | Full flow | All correct | 200 all | Complete cycle works |

## 1.8 Super Admin — 5 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| H1 | Super Admin login | POST | `/api/auth/login` | Super admin credentials | 200 | `role: "super-admin"` |
| H2 | Super Admin change tenant | POST | `/api/auth/switch-tenant` | `target_tenant_id` | 200 | Context switched |
| H3 | Super Admin permissions | GET | `/api/auth/permissions` | Super admin token | 200 | All permissions |
| H4 | Super Admin login without tenant header | POST | `/api/auth/login` | Super admin, no x-tenant-id | 200 | Bypasses tenant check |
| H5 | Regular user cannot switch tenant | POST | `/api/auth/switch-tenant` | Regular admin token | 403 | Forbidden |

## 1.9 Auth Headers / Token — 15 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| I1 | No Authorization header | GET | `/api/auth/profile` | No header | 401 | `message` includes "token" |
| I2 | Empty Authorization header | GET | `/api/auth/profile` | `Authorization: ` | 401 | Unauthorized |
| I3 | Bearer without token | GET | `/api/auth/profile` | `Authorization: Bearer ` | 401 | Unauthorized |
| I4 | Malformed Bearer token | GET | `/api/auth/profile` | `Authorization: Bearer abc.def` (no 3 parts) | 401 | Invalid token |
| I5 | Token with wrong algorithm | GET | `/api/auth/profile` | JWT signed with `none` algorithm | 401 | Rejected |
| I6 | Token from future (nbf) | GET | `/api/auth/profile` | JWT with `nbf` in future | 401 | Not yet valid |
| I7 | Token with wrong issuer | GET | `/api/auth/profile` | Valid signature, wrong `iss` | 401 | Invalid issuer |
| I8 | Token with wrong audience | GET | `/api/auth/profile` | Valid signature, wrong `aud` | 401 | Invalid audience |
| I9 | Token with user deleted after issue | GET | `/api/auth/profile` | Valid token, user deleted in DB | 401 | User not found |
| I10 | Token with user deactivated | GET | `/api/auth/profile` | Valid token, user status=inactive | 403 | Account disabled |
| I11 | No x-tenant-id header | GET | `/api/auth/profile` | Valid token, no tenant header | 400 | Tenant required |
| I12 | x-tenant-id with invalid value | GET | `/api/auth/profile` | `x-tenant-id: ../etc/passwd` | 400 | Path traversal blocked |
| I13 | x-tenant-id with SQL in value | GET | `/api/auth/profile` | `x-tenant-id: '; DROP TABLE --` | 400 | Sanitized |
| I14 | Multiple x-tenant-id headers | GET | `/api/auth/profile` | Two `x-tenant-id` headers | 400 | Ambiguous |
| I15 | Token with very long Authorization header | GET | `/api/auth/profile` | `Bearer ` + 10000 chars | 401 | Handles gracefully |

## 1.10 Authorization / Role Enforcement — 15 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| J1 | Admin accesses admin-only endpoint | GET | `/api/audit-logs` | Admin token | 200 | Success |
| J2 | Employee accesses admin-only endpoint | GET | `/api/audit-logs` | Employee token | 403 | Forbidden |
| J3 | Manager accesses manager-endpoint | GET | `/api/reports` | Manager token | 200 | Success |
| J4 | Employee accesses manager-endpoint | GET | `/api/reports` | Employee token | 403 | Forbidden |
| J5 | Super Admin bypasses role check | GET | `/api/audit-logs` | Super admin token | 200 | Allowed |
| J6 | Token tampered (modified payload) | GET | `/api/auth/profile` | JWT with modified `role: "super-admin"` | 401 | Signature invalid |
| J7 | role parameter injection | GET | `/api/audit-logs` | Token with extra `role` claim | 401 | Not honored |
| J8 | Cross-tenant admin access | GET | `/api/employees` | Tenant A admin, header tenant B | 403 | Data isolation |
| J9 | Cross-tenant manager access | GET | `/api/employees` | Tenant A manager, header tenant B | 403 | Data isolation |
| J10 | Cross-tenant employee access | GET | `/api/employees` | Tenant A employee, header tenant B | 403 | Data isolation |
| J11 | Public endpoint does not require auth | GET | `/health` | No token | 200 | Public |
| J12 | Public endpoint with auth still works | GET | `/health` | Valid token | 200 | Still works |
| J13 | Multiple role permission (admin can create/delete) | POST | `/api/departments` | Admin token | 201 | Admin can create |
| J14 | Employee cannot create department | POST | `/api/departments` | Employee token | 403 | Forbidden |
| J15 | JWT token expiry (wait or create expired) | GET | `/api/auth/profile` | Expired token | 401 | Token expired message |

Total: 20 + 15 + 10 + 10 + 12 + 8 + 15 + 5 + 15 + 15 = **125 tests**
