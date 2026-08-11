# Auth Module - Test Cases (`/api/auth`)

## Module Overview
Authentication & Authorization endpoints: login, register, profile, passwords, 2FA, permissions

## Prerequisites
- Server running on `http://localhost:5001`
- Default tenant header: `x-tenant-id: tenant_default`
- Admin credentials: `info@hrmspro.online` / `Hrmspro@123`

---

### AUTH-001 to AUTH-010: Registration
| # | Test Case | Method | Endpoint | Expected Result | Auth |
|---|---|---|---|---|---|
| AUTH-001 | Register with valid email + password | POST | `/api/auth/register` | 201 Created, returns token + user | None |
| AUTH-002 | Register with existing email | POST | `/api/auth/register` | 409 Conflict | None |
| AUTH-003 | Register with invalid email format | POST | `/api/auth/register` | 400 Validation error | None |
| AUTH-004 | Register with weak password (< 6 chars) | POST | `/api/auth/register` | 400 Validation error | None |
| AUTH-005 | Register with empty email | POST | `/api/auth/register` | 400 Validation error | None |
| AUTH-006 | Register with empty password | POST | `/api/auth/register` | 400 Validation error | None |
| AUTH-007 | Register with SQL injection in email | POST | `/api/auth/register` | 400 or stored safely | None |
| AUTH-008 | Register with XSS in email | POST | `/api/auth/register` | 400 or stored safely | None |
| AUTH-009 | Register without tenant header | POST | `/api/auth/register` | 400 Missing tenant | None |
| AUTH-010 | Register with role=admin (self-promotion) | POST | `/api/auth/register` | 201, defaults to employee role | None |

### AUTH-011 to AUTH-020: Login
| # | Test Case | Method | Endpoint | Expected Result | Auth |
|---|---|---|---|---|---|
| AUTH-011 | Login with valid admin credentials | POST | `/api/auth/login` | 200 OK, returns JWT token | None |
| AUTH-012 | Login with invalid email | POST | `/api/auth/login` | 401 Unauthorized (same message as wrong password) | None |
| AUTH-013 | Login with wrong password | POST | `/api/auth/login` | 401 Unauthorized | None |
| AUTH-014 | Login with empty email field | POST | `/api/auth/login` | 400 Validation error | None |
| AUTH-015 | Login with empty password field | POST | `/api/auth/login` | 400 Validation error | None |
| AUTH-016 | Login without tenant header | POST | `/api/auth/login` | 400 Missing tenant | None |
| AUTH-017 | Login with non-existent tenant | POST | `/api/auth/login` | 400/401 Tenant not found | None |
| AUTH-018 | Login response contains token, user with role | POST | `/api/auth/login` | 200 with `{ success, data: { token, user } }` | None |
| AUTH-019 | Login with SQL injection in email field | POST | `/api/auth/login` | 401 (no SQL execution) | None |
| AUTH-020 | Login rate limit (rapid attempts) | POST | `/api/auth/login` | 429 after threshold | None |

### AUTH-021 to AUTH-030: Profile
| # | Test Case | Method | Endpoint | Expected Result | Auth |
|---|---|---|---|---|---|
| AUTH-021 | Get profile with valid token | GET | `/api/auth/profile` | 200 OK, user data returned | JWT |
| AUTH-022 | Get profile without token | GET | `/api/auth/profile` | 401 Unauthorized | None |
| AUTH-023 | Get profile with expired token | GET | `/api/auth/profile` | 401 Token expired | Expired JWT |
| AUTH-024 | Get profile with malformed token | GET | `/api/auth/profile` | 401 Invalid token | Malformed JWT |
| AUTH-025 | Get profile with wrong tenant | GET | `/api/auth/profile` | 400/401 Wrong tenant | JWT |
| AUTH-026 | Profile response includes id, email, role, name | GET | `/api/auth/profile` | 200 with all fields | JWT |
| AUTH-027 | Profile response includes permissions array | GET | `/api/auth/profile` | 200 with permissions | JWT |
| AUTH-028 | Profile response does NOT expose password hash | GET | `/api/auth/profile` | No password field in response | JWT |
| AUTH-029 | Get profile after token refresh | GET | `/api/auth/profile` | 200 OK | New JWT |
| AUTH-030 | Get profile with employee role token | GET | `/api/auth/profile` | 200 OK, employee data | Employee JWT |

### AUTH-031 to AUTH-040: Change Password
| # | Test Case | Method | Endpoint | Expected Result | Auth |
|---|---|---|---|---|---|
| AUTH-031 | Change own password with valid data | PUT | `/api/auth/change-password` | 200 OK, password changed | JWT |
| AUTH-032 | Change own password with wrong current password | PUT | `/api/auth/change-password` | 401 Unauthorized | JWT |
| AUTH-033 | Change own password without auth token | PUT | `/api/auth/change-password` | 401 Unauthorized | None |
| AUTH-034 | Change own password with weak new password | PUT | `/api/auth/change-password` | 400 Validation error | JWT |
| AUTH-035 | Change own password with empty new password | PUT | `/api/auth/change-password` | 400 Validation error | JWT |
| AUTH-036 | Login with old password after change | POST | `/api/auth/login` | 401 (password was changed) | None |
| AUTH-037 | Login with new password after change | POST | `/api/auth/login` | 200 OK (new password works) | None |
| AUTH-038 | Admin change another user's password | PUT | `/api/auth/change-password/:userId` | 200 OK | Admin JWT |
| AUTH-039 | Employee change another user's password | PUT | `/api/auth/change-password/:userId` | 403 Forbidden | Employee JWT |
| AUTH-040 | Admin change password for non-existent user | PUT | `/api/auth/change-password/:userId` | 404 Not Found | Admin JWT |

### AUTH-041 to AUTH-050: Admin Permissions
| # | Test Case | Method | Endpoint | Expected Result | Auth |
|---|---|---|---|---|---|
| AUTH-041 | Admin update user permissions | PUT | `/api/auth/permissions/:userId` | 200 OK, permissions updated | Admin JWT |
| AUTH-042 | Employee update permissions (unauthorized) | PUT | `/api/auth/permissions/:userId` | 403 Forbidden | Employee JWT |
| AUTH-043 | Update permissions with empty array | PUT | `/api/auth/permissions/:userId` | 200 OK, permissions cleared | Admin JWT |
| AUTH-044 | Update permissions with non-existent permission | PUT | `/api/auth/permissions/:userId` | 200 or 400 | Admin JWT |
| AUTH-045 | Update permissions for non-existent user | PUT | `/api/auth/permissions/:userId` | 404 Not Found | Admin JWT |

### AUTH-051 to AUTH-060: Forgot/Reset Password
| # | Test Case | Method | Endpoint | Expected Result | Auth |
|---|---|---|---|---|---|
| AUTH-051 | Forgot password with valid email | POST | `/api/auth/forgot-password` | 200 OK, email sent | None |
| AUTH-052 | Forgot password with non-existent email | POST | `/api/auth/forgot-password` | 200 OK (no info leak) | None |
| AUTH-053 | Forgot password with empty email | POST | `/api/auth/forgot-password` | 400 Validation error | None |
| AUTH-054 | Reset password with valid token | POST | `/api/auth/reset-password/:token` | 200 OK, password reset | Token |
| AUTH-055 | Reset password with invalid token | POST | `/api/auth/reset-password/:token` | 400/401 Invalid/expired token | None |
| AUTH-056 | Reset password with expired token | POST | `/api/auth/reset-password/:token` | 400/401 Token expired | None |
| AUTH-057 | Reset password with weak new password | POST | `/api/auth/reset-password/:token` | 400 Validation error | Token |
| AUTH-058 | Login with new password after reset | POST | `/api/auth/login` | 200 OK | None |
| AUTH-059 | Login with old password after reset | POST | `/api/auth/login` | 401 Unauthorized | None |
| AUTH-060 | Reset password - SQL injection attempt | POST | `/api/auth/reset-password/:token` | 400/401 (no SQL execution) | None |

### AUTH-061 to AUTH-070: 2FA Setup
| # | Test Case | Method | Endpoint | Expected Result | Auth |
|---|---|---|---|---|---|
| AUTH-061 | Setup 2FA with valid token | POST | `/api/auth/2fa/setup` | 200 OK, QR code + secret | JWT |
| AUTH-062 | Setup 2FA without auth | POST | `/api/auth/2fa/setup` | 401 Unauthorized | None |
| AUTH-063 | Setup 2FA when already enabled | POST | `/api/auth/2fa/setup` | 400 Already enabled | JWT |
| AUTH-064 | Verify 2FA setup with valid token | POST | `/api/auth/2fa/verify-setup` | 200 OK, 2FA enabled | JWT |
| AUTH-065 | Verify 2FA setup with invalid token | POST | `/api/auth/2fa/verify-setup` | 400 Invalid token | JWT |
| AUTH-066 | Verify 2FA setup without completing setup | POST | `/api/auth/2fa/verify-setup` | 400 No pending setup | JWT |
| AUTH-067 | Verify 2FA login with valid TOTP | POST | `/api/auth/2fa/verify-login` | 200 OK, login complete | Partial |
| AUTH-068 | Verify 2FA login with invalid TOTP | POST | `/api/auth/2fa/verify-login` | 400 Invalid verification code | None |
| AUTH-069 | Disable 2FA with valid token | POST | `/api/auth/2fa/disable` | 200 OK, 2FA disabled | JWT |
| AUTH-070 | Disable 2FA without auth | POST | `/api/auth/2fa/disable` | 401 Unauthorized | None |

### AUTH-071 to AUTH-075: Edge Cases
| # | Test Case | Method | Endpoint | Expected Result | Auth |
|---|---|---|---|---|---|
| AUTH-071 | Login response does not leak password hash | POST | `/api/auth/login` | No password field in response | None |
| AUTH-072 | JWT token contains valid expiry | - | Verify token | Token expires after configured time | - |
| AUTH-073 | Request with empty Authorization header | GET | `/api/auth/profile` | 401 Unauthorized | Empty Bearer |
| AUTH-074 | Request with `Bearer ` (no token) | GET | `/api/auth/profile` | 401 Unauthorized | Empty token |
| AUTH-075 | Login with very long password (1000 chars) | POST | `/api/auth/login` | 400 or 401, no crash | None |

---

**Total: 75 test cases**
