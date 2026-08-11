# Frontend Auth Pages - Test Cases

## Login Page
| # | Test Case | Expected Result |
|---|---|---|
| LOG-001 | Page renders with logo, email field, password field, login button | All elements visible |
| LOG-002 | "Forgot Password?" link visible and clickable | Navigates to /forgot-password |
| LOG-003 | "Sign Up" link visible and clickable | Navigates to /signup |
| LOG-004 | "Get a Free Demo" button visible | Navigates to /demo |
| LOG-005 | Valid credentials login | Redirects to Dashboard |
| LOG-006 | Invalid credentials | Error message shown, no redirect |
| LOG-007 | Empty email field shows validation | Field-level error |
| LOG-008 | Empty password field shows validation | Field-level error |
| LOG-009 | Both fields empty shows validation | Both error messages |
| LOG-010 | Invalid email format | Validation error |
| LOG-011 | Already authenticated user visits /login | Redirected to /dashboard |
| LOG-012 | Password field type=password (masked) | Dots/asterisks shown |
| LOG-013 | Loading state during login | Submit button disabled/spinner |
| LOG-014 | Network error during login | Error message displayed |
| LOG-015 | 2FA user: login redirects to 2FA screen | 2FA input shown |
| LOG-016 | Remember me toggle (if present) | Token persists |
| LOG-017 | Login page responsive (mobile) | Layout adapts |
| LOG-018 | Enter key submits form | Form submits on Enter |
| LOG-019 | Tab between fields works | Focus moves correctly |
| LOG-020 | Rate limit message shown | "Too many attempts" |

## Signup Page
| # | Test Case | Expected Result |
|---|---|---|
| REG-021 | Page renders with all required fields | All inputs visible |
| REG-022 | Successful registration | Redirects to Dashboard |
| REG-023 | Duplicate email | Error message shown |
| REG-024 | Weak password (< 6 chars) | Validation error |
| REG-025 | Password confirmation mismatch | Validation error |
| REG-026 | Missing required fields | Field-level errors |
| REG-027 | Already authenticated user visits /signup | Redirected to /dashboard |
| REG-028 | Loading state during registration | Button disabled/spinner |
| REG-029 | Network error during registration | Error message |
| REG-030 | Password strength indicator (if present) | Shows strength level |

## Forgot Password
| # | Test Case | Expected Result |
|---|---|---|
| FPR-031 | Page renders with email field + submit button | Visible |
| FPR-032 | Submit valid email | Success message / email sent |
| FPR-033 | Submit non-existent email | Same message (no info leak) |
| FPR-034 | Empty email field | Validation error |
| FPR-035 | "Back to Login" link | Navigates to /login |
| FPR-036 | Loading state during submit | Button disabled |
| FPR-037 | Invalid email format | Validation error |

## Reset Password
| # | Test Case | Expected Result |
|---|---|---|
| RST-038 | Page renders with new password + confirm fields | Visible |
| RST-039 | Valid token + matching passwords | Password reset, redirect to login |
| RST-040 | Invalid/expired token | Error message |
| RST-041 | Non-matching passwords | Validation error |
| RST-042 | Weak password | Validation error |
| RST-043 | Loading state during reset | Button disabled |

## Protected Route Behavior
| # | Test Case | Expected Result |
|---|---|---|
| PRT-044 | Unauthenticated visits /dashboard | Redirected to /login |
| PRT-045 | Unauthenticated visits /settings | Redirected to /login |
| PRT-046 | Unauthenticated visits any protected page | Redirected to /login |
| PRT-047 | Employee accesses /payroll (admin/manager) | Access Denied page |
| PRT-048 | Employee accesses /employees (admin/manager) | Access Denied page |
| PRT-049 | Admin accesses /my-payslips (employee) | Access Denied page |
| PRT-050 | Manager accesses /settings (admin only) | Access Denied page |
| PRT-051 | Employee accesses /audit-logs (admin only) | Access Denied page |
| PRT-052 | Non-default-tenant admin accesses /super-admin | Access Denied page |
| PRT-053 | Token expired mid-session | Auto-redirect to /login |
| PRT-054 | Logout clears token and redirects | Redirected to /login |
| PRT-055 | Protected route with hasAccess(roles, permissions) check | UI gated correctly |

---

**Total: 55 test cases**
