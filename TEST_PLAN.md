# HRMS Pro - Comprehensive Testing Plan

## Overview
This document outlines a systematic plan to test every icon, button, navigation link, module, and feature across the **Web Frontend**, **Backend API**, and **Mobile App** of the HRMS Pro system. After testing each phase, errors will be logged to `TEST_ERRORS.md` for later resolution.

---

## PHASE 1: BACKEND API (Server & Database) - Server Health, Auth, & Core API

### 1.1 Server Health & Basic Connectivity
| # | Test Case | Expected Result |
|---|---|---|
| 1.1.1 | Start backend server (`npm run dev` in `backend/`) | Server starts on port 5001 |
| 1.1.2 | Hit `GET /health` | Returns `{ success: true, message: "Server is running" }` |
| 1.1.3 | Hit `GET /api/tenant-info` without auth header | Returns error or tenant context |
| 1.1.4 | Check CORS headers on API response | Allowed origins present |
| 1.1.5 | Upload a test file to `/uploads` | Static file serving works |

### 1.2 Authentication & Authorization
| # | Test Case | Expected Result |
|---|---|---|
| 1.2.1 | `POST /api/auth/login` with valid credentials | Returns JWT token + user data |
| 1.2.2 | `POST /api/auth/login` with invalid credentials | Returns 401 error |
| 1.2.3 | `POST /api/auth/register` with new email | Creates user, returns token |
| 1.2.4 | `GET /api/auth/profile` with valid token | Returns user profile |
| 1.2.5 | `GET /api/auth/profile` without token | Returns 401 |
| 1.2.6 | `PUT /api/auth/change-password` with wrong current password | Returns error |
| 1.2.7 | `PUT /api/auth/change-password` with valid data | Password updated |
| 1.2.8 | `PUT /api/auth/change-password/:userId` (admin) | Admin can change any user's password |
| 1.2.9 | `PUT /api/auth/permissions/:userId` | Admin updates user permissions |
| 1.2.10 | `POST /api/auth/2fa/setup` | Returns QR code + secret |
| 1.2.11 | `POST /api/auth/2fa/verify-setup` with valid token | 2FA enabled |
| 1.2.12 | `POST /api/auth/2fa/verify-login` with valid token | Login with 2FA works |
| 1.2.13 | `POST /api/auth/2fa/disable` | 2FA disabled |

### 1.15 Marketing Leads & Demo Requests
| # | Test Case | Expected Result |
|---|---|---|
| 1.15.1 | `POST /api/leads/demo` with valid credentials | Creates demo request in `shared.demo_requests`, returns 201 [PASSED] |
| 1.15.2 | `POST /api/leads/demo` with missing required fields | Returns 400 validation error [PASSED] |
| 1.15.3 | `POST /api/leads/demo` with existing duplicate email | Returns 409 conflict error [PASSED] |
| 1.15.4 | Auto-migration initializes `shared.demo_requests` & columns | Idempotent startup migration ensures table existence [PASSED] |
| 1.15.5 | `GET /api/leads` as Super Admin | Returns all inbound demo requests and tenant plan status [PASSED] |
| 1.15.6 | `POST /api/leads/lead-magnet` | Saves lead download and emails checklist [PASSED] |
| 1.15.7 | `POST /api/leads/contact` | Saves contact inquiry and notifies admin [PASSED] |

### 1.3 Multi-Tenancy
| # | Test Case | Expected Result |
|---|---|---|
| 1.3.1 | Create tenant via API | Tenant schema created |
| 1.3.2 | Request with tenant header routes to correct schema | Data isolated per tenant |
| 1.3.3 | Tenant info endpoint returns correct tenant context | Tenant ID + name match |
| 1.3.4 | Tenant A cannot access Tenant B data | Cross-tenant isolation |
| 1.3.5 | `POST /api/tenants/:tenantId/impersonate` as Super Admin | Returns JWT token for target tenant admin [PASSED] |
| 1.3.6 | `POST /api/tenants/:tenantId/impersonate` as non-Super Admin | Returns HTTP 403 Forbidden [PASSED] |
| 1.3.7 | `POST /api/auth/login` as Global Super Admin without tenant ID | Returns JWT with `isSuperAdmin: true` and `role: "super_admin"` [PASSED] |
| 1.3.8 | `GET /api/tenants` as Global Super Admin without `x-tenant-id` | Returns list of all tenants (HTTP 200) [PASSED] |
| 1.3.9 | `GET /api/tenants` as regular tenant employee / admin | Returns HTTP 403 Forbidden [PASSED] |
| 1.3.10 | Global Super Admin authentication remains intact even if business tenants are dropped | Super Admin login succeeds independently [PASSED] |
| 1.3.11 | `DELETE /api/tenants/:tenantId` with 2FA token verifies against `shared.super_admins` | Tenant deleted cleanly without impacting super admin [PASSED] |
| 1.3.12 | Frontend Super Admin route allows access with `isSuperAdmin: true` | Super Admin dashboard accessible without `tenant_default` check [PASSED] |
| 1.3.13 | `GET /api/tenants/plans/configs` returns all configured SaaS plan tiers with system modules | Returns 4 default tiers (Free, Hatch, Scale, Enterprise) + module metadata [PASSED] |
| 1.3.14 | `PUT /api/tenants/plans/configs/:planId` dynamically updates plan modules, prices, and limits | Database updated and immediately reflected in all tenants inheriting that plan [PASSED] |
| 1.3.15 | `GET /api/tenants/:tenantId/modules` resolves active modules hierarchy (custom vs plan default) | Returns resolved modules list and `is_custom` boolean [PASSED] |
| 1.3.16 | `PUT /api/tenants/:tenantId/modules` manually grants custom module overrides to specific tenant | Overrides default plan without modifying other tenants [PASSED] |
| 1.3.17 | `PUT /api/tenants/:tenantId/modules` with `resetToDefault: true` removes custom overrides | Tenant smoothly reverts to inheriting its subscription plan default modules [PASSED] |
| 1.3.18 | `checkModuleAccess` middleware rejects unauthorized module APIs with HTTP 403 `MODULE_LOCKED` | Module locked with upgrade CTA payload; allowed modules continue uninterrupted [PASSED] |
| 1.3.19 | Non-lockout guarantee: `core_hr` always remains active in all configurations | Admin and employees can never be locked out of essential account operations [PASSED] |
| 1.3.20 | `GET /api/tenants/billing/overview` returns platform revenue, paid subscriptions, and transaction logs | Returns summary (Total INR/USD, MRR, Paid counts) + recent payment logs [PASSED] |
| 1.3.21 | `GET /api/tenants/:tenantId/billing-profile` returns customer contact, address, tax ID, and invoice history | Returns complete billing profile & company payment history [PASSED] |
| 1.3.22 | `PUT /api/tenants/:tenantId/billing-profile` updates customer contact person, email, phone, and billing terms | Database updated with contact and tax credentials [PASSED] |
| 1.3.23 | `POST /api/tenants/billing/record-manual` records offline payment and auto-extends subscription | Transaction saved with invoice number, subscription expiry extended [PASSED] |
| 1.3.24 | `GET /api/notifications/badge-counts` computes live pending counts for leaves, attendance, tasks, chat | Returns structured count object with role-based aggregation [PASSED] |
| 1.3.25 | `GET /api/notifications` returns in-app notification feed with pagination and unread filters | Returns user notification list with unread counter [PASSED] |
| 1.3.26 | `PUT /api/notifications/:id/read` marks individual notification as read | Notification updated with read timestamp [PASSED] |
| 1.3.27 | `PUT /api/notifications/mark-all-read` marks all unread notifications for active user as read | All user notifications marked read simultaneously [PASSED] |
| 1.3.28 | `GET /api/notifications/settings` returns tenant channel toggles & granular event rules matrix | Returns Web Push, Audio, Email, and event-level rules [PASSED] |
| 1.3.29 | `PUT /api/notifications/settings` updates tenant-level notification channels and triggers | Settings saved and applied across tenant organization [PASSED] |
| 1.3.30 | Real-time Socket.IO notification sync updates header bell badge and sidebar count dynamically | UI reflects instant counts without page reload [PASSED] |



### 1.4 Module CRUD APIs (Test each endpoint for every module)

**Departments** (`/api/departments`)
| # | Test Case | Expected Result |
|---|---|---|
| 1.4.1 | `GET /api/departments` | Returns department list |
| 1.4.2 | `GET /api/departments/:id` | Returns single department |
| 1.4.3 | `POST /api/departments` with valid data | Department created |
| 1.4.4 | `PUT /api/departments/:id` with updated data | Department updated |
| 1.4.5 | `DELETE /api/departments/:id` | Department deleted / soft-deleted |

**Employees** (`/api/employees`)
| # | Test Case | Expected Result |
|---|---|---|
| 1.4.6 | `GET /api/employees` with pagination params | Paginated employee list |
| 1.4.7 | `GET /api/employees/:id` | Employee details |
| 1.4.8 | `GET /api/employees/user/:userId` | Employee by user ID |
| 1.4.9 | `POST /api/employees` | Employee created |
| 1.4.10 | `PUT /api/employees/:id` | Employee updated |
| 1.4.11 | `PATCH /api/employees/:id` | Partial update |
| 1.4.12 | `DELETE /api/employees/:id` | Employee deleted/archived |
| 1.4.13 | `GET /api/employees/:id/qrcode` | QR code generated |
| 1.4.14 | `GET /api/employees/org-chart` | Org chart hierarchy |
| 1.4.15 | `GET /api/employees/chat` (with params) | Employees for chat |
| 1.4.16 | `GET /api/employees/export` | CSV/Excel export works |

**Attendance** (`/api/attendance`)
| # | Test Case | Expected Result |
|---|---|---|
| 1.4.17 | `GET /api/attendance` | Attendance records |
| 1.4.18 | `POST /api/attendance/clock-in` | Clock-in recorded |
| 1.4.19 | `POST /api/attendance/clock-out` | Clock-out recorded |
| 1.4.20 | `PUT /api/attendance/:id` | Record updated |
| 1.4.21 | `POST /api/attendance` | Manual attendance entry |
| 1.4.22 | `DELETE /api/attendance/:id` | Record deleted |
| 1.4.23 | `POST /api/attendance/regularize` | Regularization request created |
| 1.4.24 | `GET /api/attendance/regularize` | List regularization requests |
| 1.4.25 | `PUT /api/attendance/regularize/:id` | Approve/reject regularization |

**Leaves** (`/api/leaves`)
| # | Test Case | Expected Result |
|---|---|---|
| 1.4.26 | `GET /api/leaves` | Leave records list |
| 1.4.27 | `GET /api/leaves/statistics` | Leave stats |
| 1.4.28 | `POST /api/leaves` | Leave request created |
| 1.4.29 | `PUT /api/leaves/:id/status` | Approve/reject leave |
| 1.4.30 | `GET /api/leaves/balance/:employeeId` | Leave balance for employee |
| 1.4.31 | `GET /api/leaves/balance` | All leave balances |
| 1.4.32 | `POST /api/leaves/comp-off` | Comp-off request created |
| 1.4.33 | `GET /api/leaves/comp-off` | Comp-off requests list |

**Tasks** (`/api/tasks`)
| # | Test Case | Expected Result |
|---|---|---|
| 1.4.34 | `GET /api/tasks` | Task list with filters |
| 1.4.35 | `GET /api/tasks/statistics` | Task stats |
| 1.4.36 | `POST /api/tasks` | Task created |
| 1.4.37 | `PUT /api/tasks/:id` | Task updated |
| 1.4.38 | `DELETE /api/tasks/:id` | Task deleted |
| 1.4.39 | `GET /api/tasks/:id/updates` | Task updates log |
| 1.4.40 | `POST /api/tasks/:id/updates` | Add task update |

**Payroll** (`/api/payroll`)
| # | Test Case | Expected Result |
|---|---|---|
| 1.4.41 | `GET /api/payroll` | Payroll records |
| 1.4.42 | `GET /api/payroll/statistics` | Payroll stats |
| 1.4.43 | `POST /api/payroll/generate` | Payroll generated |
| 1.4.44 | `PUT /api/payroll/:id/process` | Payment processed |
| 1.4.45 | `GET /api/payroll/:id/payslip` | Payslip generated |
| 1.4.46 | `GET /api/payroll/my-payslips` | Employee's payslips |
| 1.4.47 | `POST /api/payroll/tax-declarations` | Tax declaration submitted |
| 1.4.48 | `GET /api/payroll/tax-declarations` | List tax declarations |
| 1.4.49 | `PUT /api/payroll/tax-declarations/:id` | Approve/reject tax declaration |

**Recruitment** (`/api/recruitment`)
| # | Test Case | Expected Result |
|---|---|---|
| 1.4.50 | `GET /api/recruitment/jobs` | Job postings list |
| 1.4.51 | `POST /api/recruitment/jobs` | Job posting created |
| 1.4.52 | `PUT /api/recruitment/jobs/:id` | Job posting updated |
| 1.4.53 | `DELETE /api/recruitment/jobs/:id` | Job posting deleted |
| 1.4.54 | `GET /api/recruitment/applications` | Applications list |
| 1.4.55 | `POST /api/recruitment/applications` | Application submitted |
| 1.4.56 | `PUT /api/recruitment/applications/:id` | Application status updated |
| 1.4.57 | `DELETE /api/recruitment/applications/:id` | Application deleted |
| 1.4.58 | `POST /api/recruitment/resume/parse` | Resume parsed |

**Documents** (`/api/documents`)
| # | Test Case | Expected Result |
|---|---|---|
| 1.4.59 | `GET /api/documents` | Document list |
| 1.4.60 | `POST /api/documents/upload` | File uploaded |
| 1.4.61 | `DELETE /api/documents/:id` | Document deleted |

**Chat** (`/api/chat`)
| # | Test Case | Expected Result |
|---|---|---|
| 1.4.62 | `GET /api/chat/conversations` | Conversation list |
| 1.4.63 | `GET /api/chat/messages?user2_id=X` | Message history |
| 1.4.64 | `POST /api/chat/messages` | Send message |
| 1.4.65 | `PUT /api/chat/messages/read` | Mark as read |
| 1.4.66 | `DELETE /api/chat/messages/:id` | Delete message |
| 1.4.67 | `DELETE /api/chat/conversations/:userId` | Delete conversation |

**Performance** (`/api/performance`)
| # | Test Case | Expected Result |
|---|---|---|
| 1.4.68 | `GET /api/performance/goals` | Goals list |
| 1.4.69 | `POST /api/performance/goals` | Goal created |
| 1.4.70 | `PUT /api/performance/goals/:id` | Goal updated |
| 1.4.71 | `DELETE /api/performance/goals/:id` | Goal deleted |
| 1.4.72 | `GET /api/performance/reviews` | Reviews list |
| 1.4.73 | `POST /api/performance/reviews` | Review created |
| 1.4.74 | `PUT /api/performance/reviews/:id` | Review updated |
| 1.4.75 | `GET /api/performance/cycles` | Cycles list |
| 1.4.76 | `POST /api/performance/cycles` | Cycle created |

**Assets** (`/api/assets`)
| # | Test Case | Expected Result |
|---|---|---|
| 1.4.77 | `GET /api/assets` | Assets list |
| 1.4.78 | `POST /api/assets` | Asset created |
| 1.4.79 | `PUT /api/assets/:id` | Asset updated |
| 1.4.80 | `DELETE /api/assets/:id` | Asset deleted |
| 1.4.81 | `GET /api/assets/assignments` | Asset assignments |

**Settings** (`/api/settings`)
| # | Test Case | Expected Result |
|---|---|---|
| 1.4.82 | `GET /api/settings` (unauthenticated) | Returns public settings |
| 1.4.83 | `GET /api/settings` (authenticated) | Full settings |
| 1.4.84 | `PUT /api/settings` | Settings updated |
| 1.4.85 | `POST /api/settings/logo` | Logo uploaded |

**Holidays** (`/api/holidays`)
| # | Test Case | Expected Result |
|---|---|---|
| 1.4.86 | `GET /api/holidays?year=YYYY` | Holiday list |
| 1.4.87 | `GET /api/holidays/my-restricted` | Employee's restricted holidays |
| 1.4.88 | `POST /api/holidays/opt-in` | Opt-in to restricted holiday |

**Shifts** (`/api/shifts`)
| # | Test Case | Expected Result |
|---|---|---|
| 1.4.89 | `GET /api/shifts` | Shift profiles |
| 1.4.90 | `POST /api/shifts` | Shift profile created |
| 1.4.91 | `PUT /api/shifts/:id` | Shift profile updated |
| 1.4.92 | `DELETE /api/shifts/:id` | Shift profile deleted |
| 1.4.93 | `POST /api/shifts/assign` | Shift assigned to employee |

**Reports** (`/api/reports`)
| # | Test Case | Expected Result |
|---|---|---|
| 1.4.94 | `GET /api/reports/dashboard` | Dashboard stats |
| 1.4.95 | `GET /api/reports/attendance?params` | Attendance report |
| 1.4.96 | `GET /api/reports/leave?params` | Leave report |
| 1.4.97 | `GET /api/reports/payroll?params` | Payroll report |
| 1.4.98 | `GET /api/reports/employee` | Employee report |
| 1.4.99 | `GET /api/reports/recruitment?params` | Recruitment report |
| 1.4.100 | `GET /api/reports/churn-risk` | Churn risk analysis |
| 1.4.101 | `GET /api/reports/turnover-prediction` | Turnover prediction |
| 1.4.102 | `GET /api/reports/performance-analytics` | Performance analytics |
| 1.4.103 | `GET /api/reports/payroll-trends` | Payroll trends |
| 1.4.104 | `GET /api/reports/attendance-trends` | Attendance trends |
| 1.4.105 | `GET /api/reports/employee-demographics` | Demographics |

**Email Templates** (`/api/email-templates`)
| # | Test Case | Expected Result |
|---|---|---|
| 1.4.106 | `GET /api/email-templates` | Template list |
| 1.4.107 | `POST /api/email-templates` | Template created |
| 1.4.108 | `PUT /api/email-templates/:id` | Template updated |
| 1.4.109 | `DELETE /api/email-templates/:id` | Template deleted |

**Search** (`/api/search`)
| # | Test Case | Expected Result |
|---|---|---|
| 1.4.110 | `GET /api/search?q=term` | Global search results |

**Audit Logs** (`/api/audit-logs`)
| # | Test Case | Expected Result |
|---|---|---|
| 1.4.111 | `GET /api/audit-logs` | Audit log list |
| 1.4.112 | `GET /api/audit-logs/:id` | Single audit log |

**Leads / Demo Requests** (`/api/leads`)
| # | Test Case | Expected Result |
|---|---|---|
| 1.4.113 | `GET /api/leads` | Lead list |
| 1.4.114 | `POST /api/leads` | Lead created |
| 1.4.115 | `PUT /api/leads/:id` | Lead status updated |
| 1.4.116 | `DELETE /api/leads/:id` | Lead deleted |
| 1.4.117 | `POST /api/leads/lead-magnet` with valid data | 200, email sent confirmation |
| 1.4.118 | `POST /api/leads/lead-magnet` without name | 400 validation error |
| 1.4.119 | `POST /api/leads/lead-magnet` without email | 400 validation error |
| 1.4.120 | SQL injection in lead-magnet name field | 400 or stored safely |
| 1.4.121 | XSS in lead-magnet name field | Stored as literal text |
| 1.4.122 | `POST /api/leads/contact` with valid data | 200, contact inquiry saved & email sent |
| 1.4.123 | `POST /api/leads/contact` with missing required fields | 400 validation error |
| 1.4.124 | SQL injection in contact name field | 400 or stored safely |
| 1.4.125 | XSS in contact message field | Stored as literal text |


**CMS** (`/api/cms`)
| # | Test Case | Expected Result |
|---|---|---|
| 1.4.117 | `GET /api/cms/pages` | CMS pages list |
| 1.4.118 | `GET /api/cms/pages/:slug` | Single page by slug |
| 1.4.119 | `POST /api/cms/pages` | CMS page created |
| 1.4.120 | `PUT /api/cms/pages/:id` | CMS page updated |
| 1.4.121 | `DELETE /api/cms/pages/:id` | CMS page deleted |
| 1.4.122 | `POST /api/cms/pages` with layout_template | Page created with layout template |
| 1.4.123 | `PUT /api/cms/pages/:id` with layout_template | Layout template updated |
| 1.4.124 | `PUT /api/cms/pages/:id` with custom_css | Custom CSS saved |
| 1.4.125 | `PUT /api/cms/pages/:id` with custom_js | Custom JS saved |
| 1.4.126 | `PUT /api/cms/pages/:id` with invalid layout_template | Returns validation error (400) |
| 1.4.127 | `GET /api/cms/pages` returns layout_template field | Layout field in response |
| 1.4.128 | `GET /api/cms/pages/:slug` returns custom_css + custom_js | Custom code fields in response |
| 1.4.129 | `POST /api/cms/pages` with duplicate slug | Returns conflict error |

**Mobile Config** (`/api/mobile-config`)
| # | Test Case | Expected Result |
|---|---|---|
| 1.4.122 | `GET /api/mobile-config/all` | Mobile config list |
| 1.4.123 | `PUT /api/mobile-config/:key` | Mobile config updated |

**Website Settings** (`/api/website-settings`)
| # | Test Case | Expected Result |
|---|---|---|
| 1.4.124 | `GET /api/website-settings` (no auth) | Returns settings object |
| 1.4.125 | `PUT /api/website-settings` with valid data | Settings updated |
| 1.4.130 | `PUT /api/website-settings` without auth | Returns 401 |
| 1.4.131 | `PUT /api/website-settings` with invalid hex color | Returns 400 validation error |
| 1.4.132 | `PUT /api/website-settings` with contact fields | company_name, tagline, contact_email saved |
| 1.4.133 | `PUT /api/website-settings` with custom_css | Custom CSS saved and returned |
| 1.4.134 | `PUT /api/website-settings` with custom_js | Custom JS saved and returned |
| 1.4.135 | `PUT /api/website-settings` with header_links (JSON) | Header links updated |
| 1.4.136 | `PUT /api/website-settings` with footer_columns (JSON) | Footer columns updated |
| 1.4.137 | `PUT /api/website-settings` with logo file | Logo uploaded and URL returned |
| 1.4.138 | Verify GET returns same data after PUT | Data persistence confirmed |
| 1.4.139 | Inject XSS in company_name field | Stored as literal text (no script execution) |

**Tenants** (`/api/tenants`)
| # | Test Case | Expected Result |
|---|---|---|
| 1.4.126 | `GET /api/tenants` | All tenants list |
| 1.4.127 | `POST /api/tenants` | Tenant created |
| 1.4.128 | `PUT /api/tenants/:id` | Tenant updated |
| 1.4.129 | `POST /api/tenants/:id/reset-password` | Admin password reset |
| 1.4.130 | `DELETE /api/tenants/:id` (with 2FA) | Tenant deleted |
| 1.4.131 | `GET /api/tenants/biometric-devices/all` | Biometric devices |
| 1.4.132 | `POST /api/tenants/biometric-devices/register` | Device registered |
| 1.4.133 | `DELETE /api/tenants/biometric-devices/:serial` | Device deleted |

### 1.5 Socket.IO Real-time Features
| # | Test Case | Expected Result | Status |
|---|---|---|---|
| 1.5.1 | Socket connection with tenant ID | Connects successfully | ✅ PASS |
| 1.5.2 | `join` event with userId + token | User authenticated on socket | ⏸ SKIP (*) |
| 1.5.3 | `join` event with invalid token | Error emitted | ✅ PASS |
| 1.5.4 | `send_message` event | Message saved + delivered | ✅ PASS |
| 1.5.5 | `mark_read` event | Messages marked read, sender notified | ✅ PASS |
| 1.5.6 | `typing` / `stop_typing` events | Indicators broadcasted | ✅ PASS |
| 1.5.7 | `message_reaction` event | Reaction saved + broadcasted | ✅ PASS |
| 1.5.8 | `star_message` event | Message starred | ✅ PASS |
| 1.5.9 | `edit_message` event | Message edited | ✅ PASS |
| 1.5.10 | `delete_message` event | Message hidden (redacted) | ✅ PASS |
| 1.5.11 | `initiate_call` / `accept_call` / `reject_call` | Call signaling works | ✅ PASS |
| 1.5.12 | `ice_candidate` event | ICE candidates exchanged | ✅ PASS |
| 1.5.13 | `end_call` event | Call ended broadcasted | ✅ PASS |
| 1.5.14 | `join_channel` / `leave_channel` | Channel rooms work | ✅ PASS |
| 1.5.15 | `send_channel_message` | Channel message broadcasted | ✅ PASS |
| 1.5.16 | `disconnect` event | User removed from connectedUsers | ✅ PASS |
| 1.5.17 | Multiple tabs: same user connects twice | Both sockets tracked | ✅ PASS |
| 1.5.18 | `update_online_users` broadcast | Online user list updated | ✅ PASS |

> ⏸ 1.5.2 is implicitly tested by every event test that requires authentication (all from 1.5.4 onward).
> Test script: `backend/src/scripts/dev/testSocketIO.js` — run with `node src/scripts/dev/testSocketIO.js`

### 1.6 Error Handling & Edge Cases
| # | Test Case | Expected Result |
|---|---|---|
| 1.6.1 | Invalid JSON body in request | 400 Bad Request |
| 1.6.2 | Expired JWT token | 401 Unauthorized |
| 1.6.3 | Malformed JWT token | 401 Unauthorized |
| 1.6.4 | Missing required fields | Validation error |
| 1.6.5 | Rate limit exceeded | 429 Too Many Requests |
| 1.6.6 | SQL injection attempt | Rejected, no DB corruption |
| 1.6.7 | XSS in input fields | Sanitized/stripped |
| 1.6.8 | Very large payload | 413 or rejected |
| 1.6.9 | Non-existent route | 404 with proper message |
| 1.6.10 | Server restart while requests in-flight | Graceful handling |

### 1.7 Chat REST API (`/api/chat`)
| # | Test Case | Expected Result |
|---|---|---|
| **Direct Messages** |
| 1.7.1 | `GET /api/chat/conversations` (authenticated) | Returns list of unique conversations with last message |
| 1.7.2 | `GET /api/chat/conversations` (unauthenticated) | 401 Unauthorized |
| 1.7.3 | `GET /api/chat/messages?user2_id=X` (valid user) | Returns paginated message history (decrypted) |
| 1.7.4 | `GET /api/chat/messages` (no user2_id) | Returns all messages for current user |
| 1.7.5 | `GET /api/chat/messages?user2_id=X&page=2&limit=5` | Pagination works |
| 1.7.6 | `GET /api/chat/messages?user2_id=99999` (non-existent user) | Returns empty array |
| 1.7.7 | `GET /api/chat/unread-count` | Returns total unread count |
| 1.7.8 | `POST /api/chat/messages` (valid body: receiver_id + message) | Message saved to DB (encrypted), returns message_id |
| 1.7.9 | `POST /api/chat/messages` (missing message field) | 400 validation error |
| 1.7.10 | `POST /api/chat/messages` (empty message) | 400 validation error |
| 1.7.11 | `POST /api/chat/messages` (string receiver_id) | 400 validation error (expects integer) |
| 1.7.12 | `POST /api/chat/messages` (with attachment fields) | Message saved with attachment metadata |
| 1.7.13 | `POST /api/chat/messages` (with reply_to_id) | Reply context saved |
| 1.7.14 | `PUT /api/chat/messages/read` (valid message_ids) | Messages marked is_read=true |
| 1.7.15 | `PUT /api/chat/messages/read` (empty array) | No-op, returns success |
| 1.7.16 | `PUT /api/chat/messages/:id` (edit own message) | Message content updated, is_edited=true |
| 1.7.17 | `PUT /api/chat/messages/:id` (edit another user's message) | 403 Forbidden |
| 1.7.18 | `DELETE /api/chat/messages/:id` (delete own message) | Soft-delete: is_deleted=true, message redacted |
| 1.7.19 | `DELETE /api/chat/messages/:id` (delete another user's message) | 403 Forbidden |
| 1.7.20 | `POST /api/chat/messages/reaction` (valid message_id + reaction) | Reaction upserted |
| 1.7.21 | `POST /api/chat/messages/reaction` (same message_id + different reaction) | Reaction updated |
| 1.7.22 | `POST /api/chat/messages/reaction` (same message_id + same reaction) | No change (idempotent) |
| 1.7.23 | `DELETE /api/chat/conversations/:userId` (valid user) | All messages between users deleted |
| **Channels** |
| 1.7.24 | `POST /api/chat/channels` (valid name + description) | Channel created, creator added as admin |
| 1.7.25 | `POST /api/chat/channels` (missing name) | 400 validation error |
| 1.7.26 | `GET /api/chat/channels` | Returns public channels + joined private channels |
| 1.7.27 | `POST /api/chat/channels/:id/join` (public channel) | Current user added as participant |
| 1.7.28 | `POST /api/chat/channels/:id/join` (private channel, not invited) | 403 Forbidden |
| 1.7.29 | `GET /api/chat/channels/:id/messages` (participant) | Returns paginated channel messages |
| 1.7.30 | `GET /api/chat/channels/:id/messages` (non-participant) | 403 Forbidden |
| **Employees for Chat** |
| 1.7.31 | `GET /api/employees/chat?search=john` | Returns matching employees for starting chat |
| 1.7.32 | `GET /api/employees/chat` (no search) | Returns all employees (limited) |
| **Upload** |
| 1.7.33 | `POST /api/upload/chat` (valid file) | File saved, returns URL + metadata |
| 1.7.34 | `POST /api/upload/chat` (no file) | 400 error |
| **Security** |
| 1.7.35 | Chat messages encrypted at rest (verify DB) | Message column contains encrypted value |
| 1.7.36 | Tenant isolation: Tenant A cannot see Tenant B's messages | Data isolated |
| 1.7.37 | SQL injection in message text | Parameterized query, injection fails |
| 1.7.38 | XSS in message text | Stored content sanitized or escaped |

### 1.8 Support Chat REST API (`/api/support`)
| # | Test Case | Expected Result |
|---|---|---|
| 1.8.1 | `POST /api/support/chat/start` (authenticated) | Creates or retrieves existing support chat thread |
| 1.8.2 | `POST /api/support/chat/start` (unauthenticated) | 401 Unauthorized |
| 1.8.3 | `GET /api/support/chat/my` | Returns list of user's support chats |
| 1.8.4 | `GET /api/support/chat/history/:chatId` (own chat) | Returns message history |
| 1.8.5 | `GET /api/support/chat/history/:chatId` (other user's chat) | 403 Forbidden |
| 1.8.6 | `PUT /api/support/chat/:chatId/close` (own chat) | Chat closed |
| 1.8.7 | `PUT /api/support/chat/:chatId/resolve` (admin) | Chat resolved |
| 1.8.8 | `PUT /api/support/chat/:chatId/resolve` (non-admin) | 403 Forbidden |
| 1.8.9 | `GET /api/support/admin/chats` (admin) | List of active support chats |
| 1.8.10 | `GET /api/support/admin/chats` (non-admin) | 403 Forbidden |
| 1.8.11 | `POST /api/support/ai/ask` (valid message) | AI responds with auto-reply |
| 1.8.12 | `POST /api/support/ai/ask` (empty message) | 400 error |

### 1.9 Support Chat Socket Events
| # | Test Case | Expected Result |
|---|---|---|
| 1.9.1 | `support:join` with userId + role | Connected to support system |
| 1.9.2 | `support:send_message` | Message saved + broadcasted |
| 1.9.3 | `support:typing` / `support:stop_typing` | Indicators broadcasted |
| 1.9.4 | `support:mark_read` | Messages marked read, sender notified |
| 1.9.5 | `support:agent_join` (agent joins chat) | Notification to user |
| 1.9.6 | `support:human_handoff` (AI escalates to agent) | New ticket created |
| 1.9.7 | `support:leave` | Removed from support system |

---

## PHASE 2: WEB FRONTEND - Authentication & Routing

### 2.1 Login Page (`/login`)
| # | Test Case | Expected Result |
|---|---|---|
| 2.1.1 | Page renders: logo, email field, password field, login button, "Forgot Password?" link, "Sign Up" link, "Get a Free Demo" button | All elements visible |
| 2.1.2 | Valid credentials login | Redirects to Dashboard |
| 2.1.3 | Invalid credentials | Error message shown |
| 2.1.4 | Empty fields validation | Field-level error messages |
| 2.1.5 | "Forgot Password?" link | Navigates to `/forgot-password` |
| 2.1.6 | "Sign Up" link | Navigates to `/signup` |
| 2.1.7 | Already authenticated user visits `/login` | Redirected to `/dashboard` |

### 2.2 Signup Page (`/signup`)
| # | Test Case | Expected Result |
|---|---|---|
| 2.2.1 | Form renders with all fields | All inputs visible |
| 2.2.2 | Successful registration | User created, redirected to Dashboard |
| 2.2.3 | Duplicate email | Error message |
| 2.2.4 | Password validation (min length, strength) | Validation errors |
| 2.2.5 | Already authenticated user visits `/signup` | Redirected to `/dashboard` |

### 2.3 Forgot Password (`/forgot-password`)
| # | Test Case | Expected Result |
|---|---|---|
| 2.3.1 | Page renders with email field + submit button | Visible |
| 2.3.2 | Submit valid email | Success message / email sent |
| 2.3.3 | Submit invalid email | Error message |
| 2.3.4 | "Back to Login" link | Navigates to `/login` |

### 2.4 Reset Password (`/reset-password/:token`)
| # | Test Case | Expected Result |
|---|---|---|
| 2.4.1 | Page renders with new password + confirm fields | Visible |
| 2.4.2 | Valid token + matching passwords | Password reset, redirect to login |
| 2.4.3 | Invalid/expired token | Error message |
| 2.4.4 | Non-matching passwords | Validation error |

### 2.5 Protected Route Behavior
| # | Test Case | Expected Result |
|---|---|---|
| 2.5.1 | Unauthenticated user navigates to `/dashboard` | Redirected to `/login` |
| 2.5.2 | Unauthenticated user navigates to `/settings` | Redirected to `/login` |
| 2.5.3 | Unauthenticated user navigates to any protected page | Redirected to `/login` |
| 2.5.4 | Employee tries to access `/payroll` (admin/manager only) | Access Denied page |
| 2.5.5 | Employee tries to access `/employees` (admin/manager only) | Access Denied page |
| 2.5.6 | Admin tries to access `/my-payslips` (employee only) | Access Denied page |
| 2.5.7 | Manager tries to access `/settings` (admin only) | Access Denied page |
| 2.5.8 | Employee tries to access `/audit-logs` (admin only) | Access Denied page |
| 2.5.9 | Non-default-tenant admin tries to access `/super-admin` | Access Denied page |
| 2.5.10 | Token expired mid-session | Auto-redirect to `/login` |

### 2.6 Public Marketing Routes
| # | Test Case | Expected Result |
|---|---|---|
| 2.6.1 | `/` - Home page renders | Hero, features, CTA visible |
| 2.6.2 | `/features` page renders | Features grid visible |
| 2.6.3 | `/pricing` page renders | Pricing cards visible |
| 2.6.4 | `/about` page renders | About content visible |
| 2.6.5 | `/contact` page renders | Contact form visible |
| 2.6.6 | `/blog` page renders | Blog posts list visible |
| 2.6.7 | `/blog/:id` page renders | Single blog post visible |
| 2.6.8 | `/demo` page renders | Demo request form visible |
| 2.6.9 | Navigation links in header work | All links navigate correctly |
| 2.6.10 | Footer links render from CMS | Dynamic footer works |
| 2.6.11 | CMS dynamic page `/:slug` renders | Dynamic page content shows |
| 2.6.12 | `/?id-card=:id` - Public ID Card page renders | Employee ID card viewable |
| 2.6.13 | `/resources` - Resource Library renders | Categories and resource cards visible |
| 2.6.14 | `/resources` - Filter by Category | Resource list updates correctly |
| 2.6.15 | Dark Mode Toggle - Marketing Pages | Styles switch to dark mode correctly |
| 2.6.16 | Sticky Header - Marketing Pages | Header stays glassmorphic on scroll |
| 2.6.17 | `POST /api/leads/contact` submission API | Submitting contact form writes to `shared.contact_inquiries` table, sends email to admin, and returns 200/201 success |
| 2.6.18 | Interactive Dashboard Widget Transitions | Clicking Core HR, Attendance, Payroll, Performance tabs correctly transitions the selected tab, changes stats, animates charts, and loads new activity logs |
| 2.6.19 | Lead Magnet download submission | Submitting name/email in Lead Magnet Modal writes to `shared.lead_magnet_downloads` and successfully completes download sequence |

---

## PHASE 3: WEB FRONTEND - Layout & Navigation (Icon Buttons & Links)

### 3.1 App Shell / Layout (`Layout.jsx`)
| # | Test Case | Expected Result |
|---|---|---|
| 3.1.1 | Sidebar renders with logo/company name | Logo + company name visible |
| 3.1.2 | Sidebar collapse/expand on mobile | Toggle works |
| 3.1.3 | Sidebar collapse/expand via hamburger button (FaBars) | Sidebar toggles |
| 3.1.4 | Mobile overlay on sidebar open | Semi-transparent overlay |
| 3.1.5 | Header bar renders with search, bell, help, profile | All icons visible |
| 3.1.6 | Sticky header on scroll | Header stays at top |

### 3.2 Sidebar Navigation Items - Admin (default tenant) View
| # | Nav Item | Icon | Label | Path | Expected Behavior |
|---|---|---|---|---|---|
| 3.2.1 | FaHome | Dashboard | `/dashboard` | Active state, navigates correctly |
| 3.2.2 | FaBolt | Live Activity | `/live-activity` | Visible for admin/manager |
| 3.2.3 | FaComments | Chat | `/chat` | Count badge shows unread |
| 3.2.4 | [Section] "Main Modules" | | | Section header visible |
| 3.2.5 | FaUsers | Employees | `/employees` | Visible for admin/manager |
| 3.2.6 | FaSitemap | Directory | `/org-chart` | Visible for admin/manager |
| 3.2.7 | FaBuilding | Departments | `/departments` | Visible for admin/manager |
| 3.2.8 | FaCalendarCheck | Attendance | `/attendance` | Count badge shows pending |
| 3.2.9 | FaPlane | Leaves | `/leaves` | Count badge shows pending |
| 3.2.10 | FaTasks | Tasks | `/tasks` | Count badge shows pending |
| 3.2.11 | FaChartLine | Performance | `/performance` | Navigates correctly |
| 3.2.12 | FaMoneyBillWave | Payroll | `/payroll` | Visible for admin/manager |
| 3.2.13 | FaUserPlus | Recruitment | `/recruitment` | Visible for admin/manager |
| 3.2.14 | FaFileAlt | Documents | `/documents` | Navigates correctly |
| 3.2.15 | FaBoxOpen | Assets | `/assets` | Navigates correctly |
| 3.2.16 | [Section] "Administration" | | | Section header visible |
| 3.2.17 | FaBolt | SaaS Admin | `/super-admin` | Visible only for tenant_default |
| 3.2.18 | FaPalette | Website Settings | `/super-admin/website-settings` | Visible only for tenant_default |
| 3.2.19 | FaFileAlt | Website CMS | `/super-admin/cms` | Visible only for tenant_default |
| 3.2.20 | FaBookOpen | Resources Manager | `/super-admin/resources` | Manage marketing resources |
| 3.2.21 | FaUsers | Demo Accounts | `/super-admin/demo-requests` | Visible only for tenant_default |
| 3.2.22 | FaBolt | Biometric Devices | `/super-admin/biometrics` | Visible only for tenant_default |
| 3.2.23 | FaFileAlt | Reports | `/reports` | Visible for admin/manager |
| 3.2.24 | FaFileAlt | Email Templates | `/email-templates` | Visible for admin (settings:update) |
| 3.2.25 | FaEnvelope | Send Email | `/send-email` | Visible for admin/manager |
| 3.2.26 | FaHistory | Audit Logs | `/audit-logs` | Visible only for admin |
| 3.2.27 | FaCog | Settings | `/settings` | Visible only for admin |
| 3.2.27 | [Section] "My Items" | | | Section for employee role |
| 3.2.28 | FaUsers | My Profile | `/profile` | Visible for employee |
| 3.2.29 | FaMoneyBillWave | My Payslips | `/my-payslips` | Visible for employee |

### 3.3 Header Elements
| # | Test Case | Expected Result |
|---|---|---|
| 3.3.1 | FaBars hamburger button (mobile) | Toggles sidebar |
| 3.3.2 | FaSearch search bar (desktop) | Opens search dropdown |
| 3.3.3 | FaSearch search button (mobile) | Opens search modal/input |
| 3.3.4 | FaBell notifications button | Opens notification panel |
| 3.3.5 | FaQuestionCircle help button | Opens help (or noop) |
| 3.3.6 | Profile avatar + dropdown trigger | Opens profile dropdown |
| 3.3.7 | Notification badge count | Shows unread count |
| 3.3.8 | "Mark all read" in notification panel | Marks all notifications read |

### 3.4 Profile Dropdown Menu
| # | Test Case | Expected Result |
|---|---|---|
| 3.4.1 | User name + email displayed | Profile info visible |
| 3.4.2 | FaUser -> "My Profile" | Navigates to `/profile` |
| 3.4.3 | FaFileInvoiceDollar -> "My Payslips" | Navigates to `/my-payslips` |
| 3.4.4 | FaSignOutAlt -> "Logout" | Logs out, redirects to `/login` |
| 3.4.5 | Profile image shows if user has one | Image renders |

### 3.5 Global Search
| # | Test Case | Expected Result |
|---|---|---|
| 3.5.1 | Type min 2 chars | Triggers API search |
| 3.5.2 | Search shows Modules section | Static module results |
| 3.5.3 | Search shows Employees section | Employee search results |
| 3.5.4 | Search shows Tasks section | Task search results |
| 3.5.5 | Search shows Departments section | Department search results |
| 3.5.6 | Search shows Documents section | Document search results |
| 3.5.7 | Search shows Assets section | Asset search results |
| 3.5.8 | Search shows Job Postings section | Job posting search results |
| 3.5.9 | Search shows Job Applications section | Application search results |
| 3.5.10 | No results state | "No results found" message |
| 3.5.11 | Click result | Navigates to result path |
| 3.5.12 | Click outside closes dropdown | Search dropdown closes |

### 3.6 Notification Panel Links
| # | Test Case | Expected Result |
|---|---|---|
| 3.6.1 | FaCalendarCheck "Leave Requests" | Links to `/leaves` |
| 3.6.2 | FaTasks "Pending Tasks" | Links to `/tasks` |
| 3.6.3 | FaComments "New Messages" | Links to `/chat` |
| 3.6.4 | Empty notification state | "No new notifications" |
| 3.6.5 | Click notification item | Navigates + panel closes |

---

## PHASE 4: WEB FRONTEND - Module Pages (Detailed Feature Testing)

### 4.1 Dashboard (`/dashboard`)
| # | Test Case | Expected Result |
|---|---|---|
| 4.1.1 | Role-based dashboard renders (Admin/Manager/Employee) | Correct dashboard variant |
| 4.1.2 | Stats Cards: Total Employees, Departments, Present Today, Pending Leaves | Cards load with data |
| 4.1.3 | Click Stat Card -> navigates to module | Navigation works |
| 4.1.4 | Quick Actions section renders | Action buttons visible |
| 4.1.5 | Click Quick Action -> navigates correctly | Each action navigates |
| 4.1.6 | Clock In/Out widget (if enabled) | Clock in/out works |
| 4.1.7 | Attendance Calendar widget | Calendar renders |
| 4.1.8 | Leave Balance widget | Leave balance shown |
| 4.1.9 | Task Widget | Pending tasks shown |
| 4.1.10 | Activity/Timeline Widget | Recent activity shows |
| 4.1.11 | Draggable Widget - drag to reorder | Widget reordering works |
| 4.1.12 | Dashboard skeleton loading | Loading state displays |
| 4.1.13 | **Reset Layout button** | Widget positions reset to default |
| 4.1.14 | **Refresh Data button** | All dashboard data reloads |
| 4.1.15 | **Widget Settings menu** (width, height, chart type per widget) | Settings dropdown opens and applies |
| 4.1.16 | **Widget Resize Handle** — drag to resize | Widget width changes |
| 4.1.17 | **ChartToggle** — switch between chart types (bar/line/pie) | Chart type changes |
| 4.1.18 | **AttendanceWidget** — attendance summary on dashboard | Summary loads |
| 4.1.19 | **PayrollWidget** — payroll stats on dashboard | Stats load |
| 4.1.20 | **LeaveWidget** — leave summary on dashboard | Summary loads |
| 4.1.21 | **DepartmentWidget** — department distribution chart | Chart renders |
| 4.1.22 | **TeamWidget** — team info on dashboard | Team data loads |
| 4.1.23 | **RequestNotificationsWidget** — pending requests summary | Notifications shown |
| 4.1.24 | **Retry button** on widget error state | Widget reloads on click |
| 4.1.25 | **Drag-to-reorder Quick Actions** | Quick action order persists |

### 4.2 Employees (`/employees`)
| # | Test Case | Expected Result |
|---|---|---|
| 4.2.1 | Employee table renders with columns | All columns present |
| 4.2.2 | Add Employee button/modal | Create employee form opens |
| 4.2.3 | Create employee with all fields including profile photo, biometric ID, social links (LinkedIn, Twitter, GitHub) | Employee created |
| 4.2.4 | Edit employee via row action | Edit modal/form opens |
| 4.2.5 | Delete employee with confirmation | Employee deleted/archived |
| 4.2.6 | Search/filter employees | Filtered results |
| 4.2.7 | Pagination works with numbered page buttons | Next/prev page + page numbers |
| 4.2.8 | Export employees | CSV/Excel download |
| 4.2.9 | Click employee row -> detail view | Navigates to `/employees/:id` |
| 4.2.10 | Employee detail page shows all tabs: Personal, Employment, Education, Experience, Documents, Payroll, Assets, Performance, Tasks, Attendance, Leave, Audit Logs | All tabs visible |
| 4.2.11 | **Profile photo upload** (camera icon on modal) | Photo uploads and displays |
| 4.2.12 | **Biometric Device ID field** in create/edit form | Field present and saves |
| 4.2.13 | **Education history tab** — add/remove/edit education entries | Entries saved |
| 4.2.14 | **Experience history tab** — add/remove/edit experience entries | Entries saved |
| 4.2.15 | **Social links tab** — LinkedIn, Twitter, GitHub URLs | Links saved |
| 4.2.16 | **Employment Type filter** (full-time/part-time/contract/intern) | Filtered by type |
| 4.2.17 | **Status filter** (active/inactive/terminated) | Filtered by status |
| 4.2.18 | **Clear filters button** | All filters reset |
| 4.2.19 | **View Profile button** (eye icon on each table row) | Navigates to employee detail |

### 4.3 Departments (`/departments`)
| # | Test Case | Expected Result |
|---|---|---|
| 4.3.1 | Department list renders | Cards or table visible |
| 4.3.2 | Add department | Department created |
| 4.3.3 | Edit department | Department updated |
| 4.3.4 | Delete department with confirmation | Department deleted |
| 4.3.5 | Department budget/manager fields | Extra fields present |
| 4.3.6 | Department detail drill-down | Shows employees in dept |

### 4.4 Attendance (`/attendance`)
| # | Test Case | Expected Result |
|---|---|---|
| 4.4.1 | Attendance table/list renders | Records visible |
| 4.4.2 | Clock In button (if applicable) | Clock in recorded |
| 4.4.3 | Clock Out button (if clocked in) | Clock out recorded |
| 4.4.4 | Geo-fencing on clock in/out (if configured) | Location validated |
| 4.4.5 | Manual attendance entry | Record created |
| 4.4.6 | Edit attendance record | Record updated |
| 4.4.7 | Delete attendance record | Record deleted |
| 4.4.8 | Regularization request modal (AttendanceRegularizationModal) | Request submitted |
| 4.4.9 | Approve/reject regularization | Status updated |
| 4.4.10 | Shifts tab (ShiftsTab) | Shift management visible |
| 4.4.11 | Date range filter | Records filtered by date |
| 4.4.12 | **Statistics cards** — Total Records, Present, Late, Absent | Cards load with data |
| 4.4.13 | **Employee filter dropdown** (admin/manager only) | Filtered by employee |
| 4.4.14 | **Apply filter button** | Filters applied |
| 4.4.15 | **Reset filter button** | All filters cleared |

### 4.5 Leaves (`/leaves`)
| # | Test Case | Expected Result |
|---|---|---|
| 4.5.1 | Leave table/list renders | Records visible |
| 4.5.2 | Apply Leave button/modal | Leave request created |
| 4.5.3 | Leave balance display | Balance shown |
| 4.5.4 | Approve/reject leave (manager/admin) | Status updated |
| 4.5.5 | Comp-Off request modal (CompOffRequestModal) | Comp-off created |
| 4.5.6 | Leave type filter (sick, casual, etc.) | Filtered by type |
| 4.5.7 | Date range filter | Filtered by date range |
| 4.5.8 | Leave statistics/charts | Stats visible |
| 4.5.9 | **Policies tab** — leave policy cards (SL, CL, EL, Comp-Off) | Policies render with balances |
| 4.5.10 | **Holidays tab** — holiday list with Opt-In button for restricted holidays | Opt-in works |
| 4.5.11 | **Comp-Offs tab** — comp-off requests table | Requests listed |
| 4.5.12 | **Statistics cards** — Pending, Approved, Rejected, Total | Cards load |
| 4.5.13 | **Leave Balance tab** — Individual vs All Employees toggle | Toggle switches view |
| 4.5.14 | **Clear filters button** | Filters reset |
| 4.5.15 | **Refresh button** (FaSync) | Data reloads |

### 4.6 Tasks (`/tasks`)
| # | Test Case | Expected Result |
|---|---|---|
| 4.6.1 | Task board/list renders | Tasks visible |
| 4.6.2 | Create task with assignee/due date | Task created |
| 4.6.3 | Edit task | Task updated |
| 4.6.4 | Delete task | Task deleted |
| 4.6.5 | Change task status (drag or click) | Status updated |
| 4.6.6 | Task assignment to employees | Assignee linked |
| 4.6.7 | Task priority/sort | Sorting works |
| 4.6.8 | Task statistics widget | Stats visible |
| 4.6.9 | Task updates/comments | Updates posted |

### 4.7 Performance (`/performance`)
| # | Test Case | Expected Result |
|---|---|---|
| 4.7.1 | Goals/OKRs display | Goals visible |
| 4.7.2 | Create goal | Goal created |
| 4.7.3 | Update goal progress | Progress tracked |
| 4.7.4 | Performance reviews list | Reviews visible |
| 4.7.5 | Create/submit review | Review created |
| 4.7.6 | Performance cycles (`/performance/cycles`) | Cycles management |
| 4.7.7 | Review detail (`/performance/review/:id`) | Review details visible |

### 4.8 Payroll (`/payroll`)
| # | Test Case | Expected Result |
|---|---|---|
| 4.8.1 | Payroll records list | Records visible |
| 4.8.2 | Generate payroll button — "Generate for All Employees" vs "Generate for Selected Employee(s)" | Payroll generation initiated |
| 4.8.3 | Process payment with payment method dropdown (bank_transfer, cash, check) | Payment processed |
| 4.8.4 | View payslip | Payslip modal/page opens |
| 4.8.5 | Tax declarations tab (TaxDeclarationModal) | Tax declaration form works |
| 4.8.6 | Approve/reject tax declaration | Status updated |
| 4.8.7 | Payroll statistics | Stats/charts visible |
| 4.8.8 | **Statistics cards** — Pending, Paid, Cancelled, Total Outflow | Cards load with data |
| 4.8.9 | **Month/Year filter** | Records filtered by period |
| 4.8.10 | **Net salary calculator preview** in generate modal | Calculator shows estimate |
| 4.8.11 | **Apply / Reset filter buttons** | Filters applied and cleared |
| 4.8.12 | **Auto Generate modal** — bulk payroll generation for all employees | Modal works and generates |

### 4.9 My Payslips (`/my-payslips`)
| # | Test Case | Expected Result |
|---|---|---|
| 4.9.1 | Employee's payslips list | Payslips visible |
| 4.9.2 | Download/View payslip | Payslip opens/downloads |
| 4.9.3 | Tax declaration submission | Tax declaration modal works |

### 4.10 Recruitment (`/recruitment`)
| # | Test Case | Expected Result |
|---|---|---|
| 4.10.1 | Job postings tab | Jobs list visible |
| 4.10.2 | Create job posting | Job created |
| 4.10.3 | Edit job posting | Job updated |
| 4.10.4 | Applications tab | Applications list visible |
| 4.10.5 | Update application status dropdown (shortlist/reject/interview/hire) | Status updated inline |
| 4.10.6 | Resume upload/parse | Resume parsed |
| 4.10.7 | Delete job/application | Deleted |
| 4.10.8 | **"View Applicants" link** in job table rows | Navigates to filtered applicants |
| 4.10.9 | **"Add Applicant" button** (+ icon on job rows) | Add applicant form opens |
| 4.10.10 | **Resume view link** (external link per applicant) | Resume opens |
| 4.10.11 | **Clear filters buttons** (jobs and applications tabs) | Filters reset |
| 4.10.12 | **Applicant filter by job role** | Filtered by role |

### 4.11 Documents (`/documents`)
| # | Test Case | Expected Result |
|---|---|---|
| 4.11.1 | Document list renders | Documents visible |
| 4.11.2 | Upload document with category, confidential checkbox, employee assignment | Document uploaded |
| 4.11.3 | Document category filter | Filtered by category |
| 4.11.4 | Delete document | Document deleted |
| 4.11.5 | Download/View document | File downloads/opens |
| 4.11.6 | Confidential documents marked | Confidential badge shows |
| 4.11.7 | **Statistics cards** — Total Docs, Contracts, Certificates, Expired | Cards load |
| 4.11.8 | **Search input** for documents | Filtered by keyword |
| 4.11.9 | **Department filter** | Filtered by department |
| 4.11.10 | **Employee filter** | Filtered by employee |
| 4.11.11 | **Document type filter** | Filtered by type |
| 4.11.12 | **Expiry date tracking** — documents near expiry highlighted | Warning shown |
| 4.11.13 | **Clear / Search filter buttons** | Filters reset |

### 4.12 My Documents (`/my-documents`)
| # | Test Case | Expected Result |
|---|---|---|
| 4.12.1 | Employee's own documents list | Documents visible |
| 4.12.2 | Upload personal document | Document uploaded |

### 4.13 Chat (`/chat`)
| # | Test Case | Expected Result |
|---|---|---|
| 4.13.1 | Conversation list renders | Conversations visible |
| 4.13.2 | Select conversation -> messages load | Messages visible |
| 4.13.3 | Send text message | Message sent and displayed |
| 4.13.4 | Send attachment/image via file upload button | File attached |
| 4.13.5 | Real-time message delivery | New message appears without refresh |
| 4.13.6 | Typing indicator | "typing..." shows |
| 4.13.7 | Message reactions (emoji) via emoji picker | Reaction added |
| 4.13.8 | Star message | Message starred |
| 4.13.9 | Edit message | Message edited |
| 4.13.10 | Delete message | Message hidden/redacted |
| 4.13.11 | Delete conversation | Conversation removed |
| 4.13.12 | Online status indicators | Green dot on online users |
| 4.13.13 | Search within chat | Messages searchable |
| 4.13.14 | **Emoji picker** in message input | Emoji picker opens and inserts emoji |
| 4.13.15 | **Voice/Video call buttons** — initiate, accept, reject, end call | WebRTC call signaling works |
| 4.13.16 | **Employee search** for starting new conversations | Search finds users and starts chat |
| 4.13.17 | Empty conversation list (no chats yet) | "No conversations" placeholder shown |
| 4.13.18 | Scroll to bottom on new message | Auto-scrolls to latest message |
| 4.13.19 | Unread message indicator / badge on conversation | Badge shows count |
| 4.13.20 | Mark as read when conversation is opened | Unread badge disappears |
| 4.13.21 | Reply to a specific message (reply_to) | Reply preview shown above input |
| 4.13.22 | **Share screen** button during call | Screen sharing starts |
| 4.13.23 | Mute/unmute microphone during call | Mic toggles |
| 4.13.24 | Speaker toggle during call | Speaker on/off |
| 4.13.25 | Switch between voice and video during call | Call type switches |
| 4.13.26 | Minimize chat window (if applicable) | Chat minimized without losing state |
| 4.13.27 | Conversation search/filter by name | Filters conversation list |
| 4.13.28 | Network disconnect banner during chat | "Reconnecting..." banner shown |
| 4.13.29 | Reconnect after network restore | Messages sync, no data loss |
| 4.13.30 | Chat loads within 1 second (performance) | Fast initial load |

### 4.13B Support Chat Widget (`/any page — floating widget`)
| # | Test Case | Expected Result |
|---|---|---|
| 4.13B.1 | Widget toggle button visible on all pages | Floating chat icon renders |
| 4.13B.2 | Click widget -> opens chat panel | Panel slides open |
| 4.13B.3 | FAQ suggestions displayed on open | FAQ cards visible |
| 4.13B.4 | Type a question -> AI auto-reply | AI responds with relevant answer |
| 4.13B.5 | Request human agent (handoff) | Ticket created, agent notified |
| 4.13B.6 | Agent joins conversation | "Agent X has joined" message |
| 4.13B.7 | Send attachment in support chat | File uploaded and attached |
| 4.13B.8 | Close support chat panel | Panel closes, widget remains |
| 4.13B.9 | Support chat history persists after refresh | Messages load on reopen |

### 4.14 Assets (`/assets`)
| # | Test Case | Expected Result |
|---|---|---|
| 4.14.1 | Asset list renders | Assets visible |
| 4.14.2 | Add asset with vendor, purchase date, cost fields | Asset created |
| 4.14.3 | Edit asset | Asset updated |
| 4.14.4 | Delete asset | Asset deleted |
| 4.14.5 | Assign asset to employee — department dropdown cascades to employee dropdown | Assignment recorded |
| 4.14.6 | Asset status filter (Available/Assigned/Maintenance/Retired) with colored badges | Filtered by status |
| 4.14.7 | **Asset type filter** (Hardware/Software/License/Other) | Filtered by type |
| 4.14.8 | **Search input** for assets | Filtered by keyword |
| 4.14.9 | **Clear filters button** | Filters reset |

### 4.15 Reports (`/reports`)
| # | Test Case | Expected Result |
|---|---|---|
| 4.15.1 | Reports dashboard renders | Report cards visible |
| 4.15.2 | Attendance report | Report generated with data |
| 4.15.3 | Leave report | Report generated |
| 4.15.4 | Payroll report | Report generated |
| 4.15.5 | Employee report | Report generated |
| 4.15.6 | Recruitment report | Report generated |
| 4.15.7 | Export report to CSV/PDF | Export works |

### 4.16 Analytics (`/analytics`)
| # | Test Case | Expected Result |
|---|---|---|
| 4.16.1 | Analytics page renders | Charts visible |
| 4.16.2 | Performance analytics | Charts with data |
| 4.16.3 | Payroll trends | Trend charts |
| 4.16.4 | Attendance trends | Trend charts |
| 4.16.5 | Employee demographics | Demographics charts |

### 4.17 Churn Risk Report (`/reports/churn-risk`)
| # | Test Case | Expected Result |
|---|---|---|
| 4.17.1 | Risk analysis table | Employees at risk listed |
| 4.17.2 | Turnover prediction | Prediction data visible |

### 4.18 Live Activity (`/live-activity`)
| # | Test Case | Expected Result |
|---|---|---|
| 4.18.1 | Real-time activity feed renders | Activity items visible |
| 4.18.2 | New activity appears in real-time | Auto-updates |

### 4.19 Org Chart / Directory (`/org-chart`)
| # | Test Case | Expected Result |
|---|---|---|
| 4.19.1 | Organization chart renders | Hierarchy visible |
| 4.19.2 | Click on node shows employee info | Employee details popup |
| 4.19.3 | Zoom/pan controls | Chart navigable |

### 4.20 Settings (`/settings`)
| # | Test Case | Expected Result |
|---|---|---|
| 4.20.1 | Settings page renders with all tabs: General, Attendance, Leave, Payroll, Recruitment, Performance, Security, Notifications, Documents, Branding, Mobile App, Design System, System, Email | All sections visible |
| 4.20.2 | **General tab** — company name, timezone, date format, logo | Updates saved |
| 4.20.3 | **Leave tab** — leave types, balances, carry forward, approval workflow | Leave config saved |
| 4.20.4 | **Attendance tab** — working hours, geo-fence radius, overtime rules | Attendance config saved |
| 4.20.5 | **Payroll tab** — currency, tax rates, pay frequency | Payroll config saved |
| 4.20.6 | **Recruitment tab** — default hiring stages, email templates | Recruitment config saved |
| 4.20.7 | **Performance tab** — review cycles, goal settings | Performance config saved |
| 4.20.8 | **Security tab** — password rules, session timeout, 2FA enforcement | Security config saved |
| 4.20.9 | **Notifications tab** — email alerts, push notification toggles | Notification config saved |
| 4.20.10 | **Documents tab** — expiry reminders, required docs per role | Document config saved |
| 4.20.11 | **Branding tab** — primary color, logo preview, login page message | Branding updates reflect live |
| 4.20.12 | **Mobile App tab** — feature toggles, maintenance mode | Mobile config updated |
| 4.20.13 | **Design System tab** — colors, fonts, border radius, spacing | Preview updates |
| 4.20.14 | **System tab** — backup, data retention, API rate limit | System config saved |
| 4.20.15 | **Email tab** — SMTP settings, test email button | Email config saved and test sent |
| 4.20.16 | Logo upload | Logo updated |

### 4.21 Profile (`/profile`)
| # | Test Case | Expected Result |
|---|---|---|
| 4.21.1 | Profile page renders with user info and all tabs: Personal, Employment, Leave, Documents, Payroll, Assets, Performance, Tasks, Attendance, Audit Logs | All tabs visible |
| 4.21.2 | **Personal tab** — edit name, phone, DOB, address, emergency contact | Fields updated |
| 4.21.3 | **Employment tab** — department, position, manager, status, join date | Info displayed |
| 4.21.4 | **Leave tab** — leave balance, leave history | Balances and history shown |
| 4.21.5 | **Documents tab** — employee's documents list | Documents visible |
| 4.21.6 | **Payroll tab** — payroll history | Payslips listed |
| 4.21.7 | **Assets tab** — assigned assets | Assets listed |
| 4.21.8 | **Performance tab** — goals and reviews | Goals/reviews displayed |
| 4.21.9 | **Tasks tab** — assigned tasks | Tasks listed |
| 4.21.10 | **Attendance tab** — attendance logs | Attendance records shown |
| 4.21.11 | **Audit Logs tab** (admin) — activity logs | Logs displayed |
| 4.21.12 | Change password modal | Password updated |
| 4.21.13 | Upload profile picture | Profile image updated |
| 4.21.14 | 2FA setup option | 2FA setup works |
| 4.21.15 | Employee ID card view | ID card renders |

### 4.22 Email Templates (`/email-templates`)
| # | Test Case | Expected Result |
|---|---|---|
| 4.22.1 | Template list renders | Templates visible |
| 4.22.2 | Create template | Template created |
| 4.22.3 | Edit template | Template updated |
| 4.22.4 | Delete template | Template deleted |
| 4.22.5 | Template preview with variables | Preview renders |

### 4.23 Send Email (`/send-email`)
| # | Test Case | Expected Result |
|---|---|---|
| 4.23.1 | Send email form renders | Form visible |
| 4.23.2 | Select recipients | Recipients selectable |
| 4.23.3 | Select email template | Template loaded |
| 4.23.4 | Send email | Email sent |

### 4.24 Audit Logs (`/audit-logs`)
| # | Test Case | Expected Result |
|---|---|---|
| 4.24.1 | Audit log table renders | Logs visible |
| 4.24.2 | Filter by action/date/user | Filtered results |
| 4.24.3 | Export audit logs | Export works |
| 4.24.4 | Audit log detail | Single log detail view |

### 4.25 Super Admin Pages (`/super-admin`)
| # | Test Case | Expected Result |
|---|---|---|
| 4.25.1 | Tenant management list | All tenants visible |
| 4.25.2 | Create new tenant | Tenant created |
| 4.25.3 | Edit tenant | Tenant updated |
| 4.25.4 | Reset tenant admin password | Password reset |
| 4.25.5 | Delete tenant with 2FA | Tenant deleted |

### 4.26 Website Settings (`/super-admin/website-settings`)
| # | Test Case | Expected Result |
|---|---|---|
| 4.26.1 | Branding tab — color picker + font select + logo upload | Settings saved |
| 4.26.2 | Header tab — add/edit/reorder/toggle/delete links | Links saved in JSONB |
| 4.26.3 | Header tab — link to CMS page via selector | URL set to /:slug |
| 4.26.4 | Page Builder tab — SectionBuilder with all types | Sections saved |
| 4.26.5 | Page Builder tab — CustomHTML code editor | HTML renders on live site |
| 4.26.6 | Footer tab — add/edit/toggle/delete columns + links | Footer saved |
| 4.26.7 | Custom Code tab — global CSS editor | CSS injected site-wide |
| 4.26.8 | Custom Code tab — global JS editor | JS executes on all public pages |
| 4.26.9 | Contact tab — company name, tagline, email, phone, address | Contact fields saved |
| 4.26.10 | Contact tab — social links add/edit/delete | Social icons update on live site |
| 4.26.11 | Header tab — duplicate label detection | Red border + warning banner shown on duplicate label |
| 4.26.12 | Header tab — duplicate URL detection | Red border + warning banner shown on duplicate URL |
| 4.26.13 | Footer tab — duplicate link label within column | Red border + warning shown on duplicate link label |
| 4.26.14 | Footer tab — duplicate link URL within column | Red border + warning shown on duplicate link URL |
| 4.26.15 | Header — only admin links shown on public site (no hardcoded defaults) | Public site header shows only admin-configured links |
| 4.26.16 | Footer — only admin columns shown on public site (no hardcoded defaults) | Public site footer shows only admin-configured columns |
| 4.26.17 | Click "Publish Site" | Changes immediately reflect on public site |
| 4.26.18 | Publish + refresh public site | Context refreshSettings() re-fetches data |

### 4.27 CMS Manager (`/super-admin/cms`)
| # | Test Case | Expected Result |
|---|---|---|
| 4.27.1 | CMS page list | Pages visible |
| 4.27.2 | Create page (slug, title, content) | Page created |
| 4.27.3 | Edit page | Page updated |
| 4.27.4 | Delete page | Page deleted |
| 4.27.5 | Select layout template (default, full-width, sidebar, centered, landing) | Layout applied on preview |
| 4.27.6 | Add custom CSS | CSS injected in page head |
| 4.27.7 | Add custom JS | JS executes on page load |
| 4.27.8 | CustomHTML section with code editor | HTML renders in page |
| 4.27.9 | Section duplication | Duplicated section appears below original |
| 4.27.10 | Section naming | Custom name displays in builder header |
| 4.27.11 | Section visibility toggle | Hidden sections don't render |

### 4.28 Demo Requests (`/super-admin/demo-requests`)
| # | Test Case | Expected Result |
|---|---|---|
| 4.28.1 | Demo request list | Requests visible |
| 4.28.2 | View request detail | Full details visible |
| 4.28.3 | Change request status | Status updated |
| 4.28.4 | Provision tenant from demo request | Tenant auto-created |

### 4.29 Biometric Devices (`/super-admin/biometrics`)
| # | Test Case | Expected Result |
|---|---|---|
| 4.29.1 | Biometric device list | Devices visible |
| 4.29.2 | Register device | Device registered |
| 4.29.3 | Delete device | Device removed |
| 4.29.4 | Device status indicator | Online/offline shown |

### 4.30 Mobile App Config (`/super-admin/mobile-config`)
| # | Test Case | Expected Result |
|---|---|---|
| 4.30.1 | Mobile config list | Config keys visible |
| 4.30.2 | Toggle features on/off | Config updated |
| 4.30.3 | Maintenance mode toggle | Maintenance mode set |

### 4.31 Onboarding / Offboarding (`/onboarding`, `/offboarding`)
| # | Test Case | Expected Result |
|---|---|---|
| 4.31.1 | Onboarding page renders | Onboarding steps visible |
| 4.31.2 | Step navigation | Steps change correctly |
| 4.31.3 | **Offboarding page** (`/offboarding`) renders | Offboarding steps and checklist visible |
| 4.31.4 | **Offboarding** — complete exit checklist (asset return, document handover, final settlement) | Checklist items marked complete |

### 4.32 Public ID Card (`/view/id-card/:id`)
| # | Test Case | Expected Result |
|---|---|---|
| 4.32.1 | ID card renders for valid employee | Employee ID card displayed |
| 4.32.2 | Invalid employee ID | Error/404 message |

---

## PHASE 5: MOBILE APP - Testing

### 5.1 App Initialization & Loading
| # | Test Case | Expected Result |
|---|---|---|
| 5.1.1 | App starts -> SplashScreen | Splash visible |
| 5.1.2 | Splash -> Onboarding (if first time) | Onboarding screens swipeable |
| 5.1.3 | Onboarding complete -> Welcome Screen | Welcome visible |
| 5.1.4 | "Get Started" on Welcome -> Login | Navigates to login |
| 5.1.5 | Maintenance mode enabled | Maintenance screen shows |
| 5.1.6 | Mobile access disabled | Access Revoked screen shows |

### 5.2 Mobile Auth Screens
| # | Test Case | Expected Result |
|---|---|---|
| 5.2.1 | LoginScreen - email + password fields | Fields visible |
| 5.2.2 | LoginScreen - valid credentials | Navigates to Dashboard tab |
| 5.2.3 | LoginScreen - invalid credentials | Error message |
| 5.2.4 | LoginScreen - 2FA required | Navigates to TwoFactorScreen |
| 5.2.5 | TwoFactorScreen - valid TOTP | Login complete |
| 5.2.6 | TwoFactorScreen - invalid TOTP | Error message |
| 5.2.7 | RegisterScreen - create account | Registration works |
| 5.2.8 | ForgotPasswordScreen - submit email | Email sent message |
| 5.2.9 | ResetPasswordScreen - new password | Password reset |
| 5.2.10 | OTPVerificationScreen (if used) | OTP verified |
| 5.2.11 | Biometric login (fingerprint/face) | Auth via device biometric |

### 5.3 Mobile Public Screens
| # | Test Case | Expected Result |
|---|---|---|
| 5.3.1 | MarketingScreen | Marketing content visible |
| 5.3.2 | PricingScreen | Pricing cards visible |
| 5.3.3 | AboutCompanyScreen | About content |
| 5.3.4 | ContactSupportScreen | Contact form works |
| 5.3.5 | DemoRequestScreen | Demo request submitted |

### 5.4 Mobile Bottom Tab Navigation
| # | Test Case | Expected Result |
|---|---|---|
| 5.4.1 | Dashboard tab (Home icon) | Shows DashboardScreen |
| 5.4.2 | Tasks tab (CheckSquare icon) | Shows TaskScreen (if enabled) |
| 5.4.3 | Chat tab (MessageCircle icon) | Shows ChatScreen (if enabled) |
| 5.4.4 | Profile tab (User icon) | Shows ProfileScreen |
| 5.4.5 | Tab bar renders with proper styling | Icons + labels visible |
| 5.4.6 | Tasks tab hidden when feature disabled | Tab not visible |
| 5.4.7 | Chat tab hidden when feature disabled | Tab not visible |

### 5.5 Mobile Screen - Dashboard
| # | Test Case | Expected Result |
|---|---|---|
| 5.5.1 | Dashboard stats load | Stats cards visible |
| 5.5.2 | Quick actions available | Action buttons work |
| 5.5.3 | Dashboard refreshes on pull-down | Pull-to-refresh works |

### 5.6 Mobile Screen - Attendance
| # | Test Case | Expected Result |
|---|---|---|
| 5.6.1 | Attendance records list | Records visible |
| 5.6.2 | Clock In button (with location) | Clock-in with GPS |
| 5.6.3 | Clock Out button | Clock-out recorded |
| 5.6.4 | Attendance history/filter | Filtered by date |

### 5.7 Mobile Screen - Leaves
| # | Test Case | Expected Result |
|---|---|---|
| 5.7.1 | Leave list renders | Leaves visible |
| 5.7.2 | Apply leave form | Leave request created |
| 5.7.3 | Leave balance display | Balance visible |
| 5.7.4 | Approve/reject leave (if manager) | Status updated |

### 5.8 Mobile Screen - Tasks
| # | Test Case | Expected Result |
|---|---|---|
| 5.8.1 | Task list renders | Tasks visible |
| 5.8.2 | Create task | Task created |
| 5.8.3 | Update task status | Status changed |
| 5.8.4 | Task detail view | Details visible |

### 5.9 Mobile Screen - Chat
| # | Test Case | Expected Result |
|---|---|---|
| 5.9.1 | Conversation list renders | Conversations visible |
| 5.9.2 | Select conversation -> messages load | Messages displayed |
| 5.9.3 | Send text message | Message sent and displayed |
| 5.9.4 | Receive message (real-time via socket) | Message appears without refresh |
| 5.9.5 | Attachment/image upload | File attached |
| 5.9.6 | Reply to a message (swipe-to-reply) | Reply preview shown |
| 5.9.7 | Message reactions (emoji) via reactions overlay | Reaction added |
| 5.9.8 | Star message | Message starred indicator shown |
| 5.9.9 | Edit message | Message updated with "edited" label |
| 5.9.10 | Delete message | Message hidden/redacted |
| 5.9.11 | Typing indicator shows "typing..." | Indicator appears |
| 5.9.12 | Online status dot on conversation list items | Green dot visible |
| 5.9.13 | Read receipts (double check mark) | Blue ticks show |
| 5.9.14 | Voice recording via mic button | Recording sent as audio attachment |
| 5.9.15 | Emoji picker in ChatInput | Emoji picker opens and inserts |
| 5.9.16 | Chat tab hidden when feature disabled via permissions | Tab not in bottom nav |
| 5.9.17 | Empty state when no conversations | "No chats yet" placeholder |
| 5.9.18 | Unread badge count on conversation items | Badge shows count |
| 5.9.19 | Network error / offline banner | "No connection" indicator |
| 5.9.20 | Reconnect after network restore | Messages sync without duplication |

### 5.10 Mobile Screen - Profile
| # | Test Case | Expected Result |
|---|---|---|
| 5.10.1 | User profile info displayed | Name, email, role |
| 5.10.2 | Edit profile | Profile updated |
| 5.10.3 | Change password | Password changed |
| 5.10.4 | Logout button | Logs out, returns to Login |

### 5.11 Mobile Additional Stack Screens
| # | Screen | Test Case | Expected Result |
|---|---|---|---|
| 5.11.1 | EmployeesScreen | Employee list renders, search works | CRUD works |
| 5.11.2 | DepartmentsScreen | Department list + management | CRUD works |
| 5.11.3 | PayrollScreen | Payroll records + payslips | Data visible |
| 5.11.4 | AssetsScreen | Asset list + assignment | CRUD works |
| 5.11.5 | DocumentsScreen | Document list + upload | Upload works |
| 5.11.6 | RecruitmentScreen | Jobs + Applications | CRUD works |
| 5.11.7 | PerformanceScreen | Goals + Reviews | Data visible |
| 5.11.8 | ReportsScreen | Report types + generation | Reports load |
| 5.11.9 | SettingsScreen | Settings display | Read-only or editable |
| 5.11.10 | AuditLogsScreen | Audit log list | Logs visible |
| 5.11.11 | HolidaysScreen | Holiday calendar | Holidays visible |
| 5.11.12 | ShiftsScreen | Shift profiles | Shift data visible |
| 5.11.13 | LeadsScreen | Demo request leads | Leads visible |
| 5.11.14 | CMSPageScreen | CMS page content | Content renders |
| 5.11.15 | TenantsScreen | Tenant list (super admin) | Tenants visible |
| 5.11.16 | AccessDeniedScreen | Restricted module access | Denied message shows |

### 5.12 Mobile Guarded Screens (Authorization)
| # | Test Case | Expected Result |
|---|---|---|
| 5.12.1 | Employee accesses guarded Employees screen | AccessDeniedScreen |
| 5.12.2 | Manager accesses guarded AuditLogs screen | AccessDeniedScreen |
| 5.12.3 | Non-super-admin accesses Tenants screen | AccessDeniedScreen |
| 5.12.4 | Disabled feature via mobile settings | Feature hidden or denied |
| 5.12.5 | `canOpenModule` checks all feature keys | Each module gated correctly |

### 5.13 Mobile Offline / Error Handling
| # | Test Case | Expected Result |
|---|---|---|
| 5.13.1 | No internet connection | Error message / offline state |
| 5.13.2 | API timeout | Proper error UI |
| 5.13.3 | Token expired | Redirect to login |
| 5.13.4 | Server returns 500 | Graceful error handling |

### 5.14 Mobile-Specific Features
| # | Test Case | Expected Result |
|---|---|---|
| 5.14.1 | Location-based attendance (expo-location) | GPS captured on clock in/out |
| 5.14.2 | Secure token storage (expo-secure-store) | Token persisted |
| 5.14.3 | Push notifications (if configured) | Notifications received |
| 5.14.4 | Dark/Light theme toggle | Theme switches |
| 5.14.5 | DesignSystem components render | GlassPanel, PrimaryButton, etc. |

---

## PHASE 6: CROSS-PLATFORM FEATURE PARITY

### 6.1 Web Features Not in Mobile
| # | Web Feature | Mobile Status | Action Needed |
|---|---|---|---|
| 6.1.1 | Live Activity feed | Not present in mobile | Check if needed |
| 6.1.2 | Analytics | Not present in mobile | Check if needed |
| 6.1.3 | Churn Risk Report | Not present in mobile | Check if needed |
| 6.1.4 | Email Templates management | Not present in mobile | Check if needed |
| 6.1.5 | Send Email | Not present in mobile | Check if needed |
| 6.1.6 | Onboarding/Offboarding | Not present in mobile | Check if needed |
| 6.1.7 | Super Admin biometric device management | Not present in mobile | Check if needed |
| 6.1.8 | Website Settings management | Not present in mobile | Check if needed |
| 6.1.9 | CMS Page management | CMSPageScreen (view only) | CRUD missing |
| 6.1.10 | Mobile App Config management | Not present in mobile | Check if needed |
| 6.1.11 | Drag-and-drop dashboard widgets | Not present in mobile | Expected |
| 6.1.12 | Org Chart / Directory (interactive tree) | Not present in mobile | Check if needed |
| 6.1.13 | My Documents (employee-only page) | Not present in mobile | Check if needed |
| 6.1.14 | Performance Cycles | Not present in mobile | Check if needed |
| 6.1.15 | Performance Review detail | Not present in mobile | Check if needed |
| 6.1.16 | Tax Declaration management | Not present in mobile | Check if needed |
| 6.1.17 | Comp-Off request | Not present in mobile | Check if needed |
| 6.1.18 | Attendance Regularization | Not present in mobile | Check if needed |
| 6.1.19 | Shift Profiles management | ShiftsScreen (view only?) | CRUD missing |
| 6.1.20 | Public ID Card view | Not present in mobile | Check if needed |
| 6.1.21 | Marketing Home page | Welcome/Marketing screen exists | Verify parity |

### 6.2 Mobile Features Not in Web
| # | Mobile Feature | Web Status | Action Needed |
|---|---|---|---|
| 6.2.1 | Splash screen | Not applicable | Web doesn't need |
| 6.2.2 | Onboarding screens | Marketing site exists | OK |
| 6.2.3 | Welcome screen | Not present in web | OK |
| 6.2.4 | TwoFactorScreen (modal) | Login handles 2FA natively | OK |
| 6.2.5 | OTPVerificationScreen | Not in web | Check if needed |
| 6.2.6 | Biometric login (expo-local-authentication) | Not in web | OK |
| 6.2.7 | Native push notifications | Web has browser notifications | May need parity |
| 6.2.8 | Dark/Light theme | Not in web | Check if needed |
| 6.2.9 | Offline support | Not in web | Check if needed |
| 6.2.10 | AccessDeniedScreen (guarded) | ProtectedRoute equivalent | OK |

### 6.3 Data & API Parity
| # | Test Case | Expected Result |
|---|---|---|
| 6.3.1 | All endpoints used by mobile exist in backend | No missing endpoints |
| 6.3.2 | All endpoints used by web exist in backend | No missing endpoints |
| 6.3.3 | Response format consistent across web/mobile | Same structure |
| 6.3.4 | Error format consistent across web/mobile | Same structure |
| 6.3.5 | Authentication flow identical | Same token validation |
| 6.3.6 | Permissions model identical | Same permission checks |

---

## PHASE 7: REGRESSION & EDGE CASES

### 7.1 Browser Compatibility (Web)
| # | Browser | Test |
|---|---|---|
| 7.1.1 | Chrome (latest) | All features work |
| 7.1.2 | Firefox (latest) | All features work |
| 7.1.3 | Edge (latest) | All features work |
| 7.1.4 | Safari (latest) | All features work |
| 7.1.5 | Mobile Chrome (Android) | Responsive + touch |
| 7.1.6 | Mobile Safari (iOS) | Responsive + touch |

### 7.2 Responsive Design (Web)
| # | Breakpoint | Test |
|---|---|---|
| 7.2.1 | Desktop (1920x1080) | Full layout |
| 7.2.2 | Laptop (1366x768) | Layout adapts |
| 7.2.3 | Tablet (768x1024) | Sidebar + content adjust |
| 7.2.4 | Mobile (375x667) | Sidebar overlays, content stacks |

### 7.3 Loading States
| # | Test Case | Expected Result |
|---|---|---|
| 7.3.1 | Page load shows skeleton/spinner | Loading indicator |
| 7.3.2 | API call in progress shows spinner | Loading state |
| 7.3.3 | Skeleton components render correctly | No layout shift |

### 7.4 Empty States
| # | Test Case | Expected Result |
|---|---|---|
| 7.4.1 | No employees in database | "No employees found" message |
| 7.4.2 | No attendance records | "No records found" message |
| 7.4.3 | No notifications | "No new notifications" message |
| 7.4.4 | No search results | "No results found" message |
| 7.4.5 | Empty table/list in every module | Proper empty state |

### 7.5 Error States
| # | Test Case | Expected Result |
|---|---|---|
| 7.5.1 | API returns 500 | User-friendly error toast/message |
| 7.5.2 | Network disconnected | Error message |
| 7.5.3 | Token expires mid-request | Auto-logout + redirect |
| 7.5.4 | Validation error on form | Field-level error message |
| 7.5.5 | File upload fails | Error message displayed |

### 7.6 Performance
| # | Test Case | Expected Result |
|---|---|---|
| 7.6.1 | Page load time < 3 seconds | Fast initial load |
| 7.6.2 | Dashboard loads within 2 seconds | Stats load quickly |
| 7.6.3 | Pagination loads without lag | Smooth navigation |
| 7.6.4 | Chat messages load within 1 second | Fast message loading |
| 7.6.5 | Search returns results within 2 seconds | Fast search |
| 7.6.6 | Large employee list (1000+) paginates | No browser freeze |

### 7.7 Security
| # | Test Case | Expected Result |
|---|---|---|
| 7.7.1 | JWT not accessible via XSS | Stored securely |
| 7.7.2 | API rate limiting active | 429 on excessive requests |
| 7.7.3 | SQL injection attempts blocked | Parameterized queries |
| 7.7.4 | Helmet security headers present | Headers in response |
| 7.7.5 | CORS restricts unauthorized origins | Proper origin check |
| 7.7.6 | 2FA enforcement check | 2FA required for sensitive ops |

---

## TEST ERROR LOGGING PROTOCOL

For **every test case** in every phase:

1. **Run** the test case
2. **Result**: ✅ PASS / ❌ FAIL / ⚠️ PARTIAL
3. If **FAIL or PARTIAL**, log the error immediately to `TEST_ERRORS.md`:

```markdown
### [PHASE X.Y.Z] Test Name
- **Module**: Module Name
- **Test Ref**: #X.Y.Z
- **Expected**: What should happen
- **Actual**: What actually happened
- **Error Details**: Stack trace / console error / screenshot reference
- **Severity**: Critical / High / Medium / Low
- **Root Cause**: (to be filled after analysis)
```

4. **Do NOT fix errors during testing** - only document them
5. After all phases complete, prioritize and fix errors

---

## TEST EXECUTION ORDER

```
PHASE 1: Backend API (foundation must work first)
    ↓
PHASE 2: Web Frontend - Auth & Routing (can't test modules without login)
    ↓
PHASE 3: Web Frontend - Layout & Navigation (can't navigate without layout)
    ↓
PHASE 4: Web Frontend - Module Pages (test all features)
    ↓
PHASE 5: Mobile App - All Screens
    ↓
PHASE 6: Cross-Platform Feature Parity (compare web vs mobile)
    ↓
PHASE 7: Regression & Edge Cases (fixes + re-test)
```

---

---

## PHASE 8: Code Quality & Architecture (asyncHandler & Error Handling)

### 8.1 asyncHandler + Custom Error Classes
| # | Test Case | Expected Result |
|---|---|---|
| 8.1.1 | `GET /api/employees` returns paginated list | 200 with `{ success, data, pagination }` |
| 8.1.2 | `GET /api/employees/99999` (non-existent) | 404 with `{ success: false, message: "Employee not found" }` |
| 8.1.3 | `GET /api/employees/:id` as employee role for another's record | 403 Forbidden |
| 8.1.4 | `POST /api/employees` with existing email | 409 Conflict |
| 8.1.5 | `POST /api/employees` with missing fields | 400 Validation via route middleware |
| 8.1.6 | `PUT /api/employees/:id` with no valid fields | 400 ValidationError |
| 8.1.7 | `DELETE /api/employees/99999` | 404 NotFoundError |
| 8.1.8 | `POST /api/employees/delete-by-email` without email field | 400 ValidationError |
| 8.1.9 | `POST /api/auth/login` with wrong password | 401 UnauthorizedError (no stack leak) |
| 8.1.10 | `POST /api/auth/login` with wrong email | 401 UnauthorizedError (same message) |
| 8.1.11 | `PUT /api/auth/change-password` with wrong current password | 401 UnauthorizedError |
| 8.1.12 | `POST /api/auth/register` with existing email | 409 ConflictError |
| 8.1.13 | `PUT /api/auth/permissions/:id` as non-admin | 403 ForbiddenError |
| 8.1.14 | `PUT /api/auth/password/:id` as non-admin | 403 ForbiddenError |
| 8.1.15 | `POST /api/auth/2fa/verify-login` with invalid OTP | 400 ValidationError |
| 8.1.16 | Hit unregistered route | 404 from notFound handler |
| 8.1.17 | Verify no hardcoded 2FA bypass `000000` in authController | String `000000` does not appear |

### 8.2 Pattern Consistency
| # | Test Case | Expected Result |
|---|---|---|
| 8.2.1 | All controllers use `asyncHandler` instead of inline try/catch | Grep for `try {` in controllers/ returns expected results only |
| 8.2.2 | All errors thrown use custom classes (`AppError`, `NotFoundError`, etc.) | No raw `throw new Error(...)` in controller business logic |
| 8.2.3 | `errorHandler` distinguishes operational vs programming errors | Operational errors don't log stack in production |
| 8.2.4 | All controllers still have `success: true/false` in response | Consistent response envelope |

---

## SUMMARY OF TEST ITEMS

| Category | Test Cases |
|---|---|
| Backend API Endpoints | ~180 |
| Web Auth & Routing | ~30 |
| Web Layout & Navigation Items | ~35 |
| Web Module Page Features | ~270 |
| Mobile Screens & Features | ~85 |
| Cross-Platform Parity | ~30 |
| Regression & Edge Cases | ~40 |
| Code Quality & Architecture | ~21 |
| **TEST_PLAN.md Total** | **~691** |
| **Deep Test Case Files Total** | **4,924** |

## EXPANDED TEST SUITE — Individual Module Test Case Files

Detailed test case files with 50+ cases per module have been created in `test-cases/`:

| # | File Location | Module | Test Cases |
|---|---|---|---|
| | **Backend API** (`test-cases/api/`) | | |
| 1 | `01-auth_test_cases.md` | Auth (login, register, 2FA, passwords, permissions) | 75 |
| 2 | `02-departments_test_cases.md` | Departments | 55 |
| 3 | `03-employees_test_cases.md` | Employees | 55 |
| 4 | `04-attendance_test_cases.md` | Attendance | 55 |
| 5 | `05-leaves_test_cases.md` | Leaves | 55 |
| 6 | `06-tasks_test_cases.md` | Tasks | 55 |
| 7 | `07-payroll_test_cases.md` | Payroll (v1) | 55 |
| 8 | `08-recruitment_test_cases.md` | Recruitment | 55 |
| 9 | `09-chat_test_cases.md` | Chat | 55 |
| 10 | `10-performance_test_cases.md` | Performance | 55 |
| 11 | `11-assets_test_cases.md` | Assets | 55 |
| 12 | `12-documents_test_cases.md` | Documents | 55 |
| 13 | `13-settings_test_cases.md` | Settings | 55 |
| 14 | `14-holidays_test_cases.md` | Holidays | 55 |
| 15 | `15-shifts_test_cases.md` | Shifts | 55 |
| 16 | `16-reports_test_cases.md` | Reports | 55 |
| 17 | `17-cms_blog_test_cases.md` | CMS + Blog | 55 |
| 18 | `18-tenants_leads_test_cases.md` | Tenants + Leads | 55 |
| 19 | `19-support_test_cases.md` | Support (Chat, FAQ, Tickets, AI) | 55 |
| 20 | `20-remaining_modules_test_cases.md` | Email Templates, Search, Upload, Mobile Config, Audit Logs | 55 |
| 21 | `14-payroll_v2_test_cases.md` | Payroll V2 — Runs, Templates, Payslips API | 63 |
| 22 | `15-payroll_v3_test_cases.md` | Payroll V3 — Email Queue, Export, Audit Logs | 108 |
| | **NEW Deep Payroll Test Files** | | |
| 23 | `21-payroll_runs_deep_test_cases.md` | **Deep** Payroll Runs — State Machine, Lifecycle, Edge Cases | **122** |
| 24 | `22-payslip_templates_deep_test_cases.md` | **Deep** Payslip Templates — CRUD, Preview, Design, Integrations | **107** |
| 25 | `23-email_queue_deep_test_cases.md` | **Deep** Email Queue & Worker — Lifecycle, Export, State Transitions | **110** |
| 26 | `24-payslips_deep_test_cases.md` | **Deep** Payslips — Generate, Bulk, Download, Verify, Email, Tenant | **111** |
| | **Subtotal Backend API** | | **1,675** |
| | **NEW Deep All-Module API Test Files (100+ each)** | | |
| 27 | `25-auth_deep_test_cases.md` | **Deep** Auth — Registration, Login, Profile, 2FA, Permissions, Token | 125 |
| 28 | `26-departments_deep_test_cases.md` | **Deep** Departments — CRUD, Budget, Security, Edge Cases | 105 |
| 29 | `27-employees_deep_test_cases.md` | **Deep** Employees — CRUD, Org Chart, QR, Chat Listing, Payroll Fields | 115 |
| 30 | `28-attendance_deep_test_cases.md` | **Deep** Attendance — Clock In/Out, Regularize, Biometric, Comp-Off | 110 |
| 31 | `29-leaves_deep_test_cases.md` | **Deep** Leaves — CRUD, Approve/Reject, Balance, Comp-Off, Calendar | 110 |
| 32 | `30-tasks_deep_test_cases.md` | **Deep** Tasks — CRUD, Status, Comments, Statistics, Priority | 105 |
| 33 | `31-recruitment_deep_test_cases.md` | **Deep** Recruitment — Jobs, Applications, Interviews, Offers, Resume | 110 |
| 34 | `32-chat_deep_test_cases.md` | **Deep** Chat — DMs, Channels, Reactions, Edit/Delete, Read Receipts | 115 |
| 35 | `33-performance_deep_test_cases.md` | **Deep** Performance — Goals, Key Results, Reviews, Cycles, Analytics | 110 |
| 36 | `34-assets_deep_test_cases.md` | **Deep** Assets — CRUD, Assign, Categories, Statistics, Depreciation | 105 |
| 37 | `35-documents_deep_test_cases.md` | **Deep** Documents — Upload, Download, Share, Versions, Categories | 105 |
| 38 | `36-settings_deep_test_cases.md` | **Deep** Settings — CRUD, Email Templates, Website, Mobile Config | 105 |
| 39 | `37-holidays_shifts_deep_test_cases.md` | **Deep** Holidays & Shifts — CRUD, Assignments, Opt-In, Edge Cases | 105 |
| 40 | `38-reports_deep_test_cases.md` | **Deep** Reports — Dashboard, Attendance, Leave, Payroll, Analytics | 105 |
| 41 | `39-cms_blog_deep_test_cases.md` | **Deep** CMS & Blog — Pages, Posts, Resources, Website Builder | 105 |
| 42 | `40-tenants_leads_biometrics_deep_test_cases.md` | **Deep** Tenants, Leads & Biometrics — CRUD, Provision, Webhooks | 105 |
| 43 | `41-support_deep_test_cases.md` | **Deep** Support — Chat, FAQ, Tickets, AI, Canned Replies, Dashboard | 110 |
| 44 | `42-remaining_modules_deep_test_cases.md` | **Deep** Remaining — Email Templates, Search, Upload, Audit, Onboarding | 120 |
| | **Subtotal Backend API** | | **3,720** |
| | **Frontend** (`test-cases/frontend/`) | |
| 21 | `01-auth_pages_test_cases.md` | Auth Pages (Login, Signup, Reset, Protected Routes) | 55 |
| 22 | `02-dashboard_test_cases.md` | Dashboard | 55 |
| 23 | `03-module_pages_test_cases.md` | Modules Part 1 (Employees, Departments, Attendance, Leaves, Tasks) | 55 |
| 24 | `04-module_pages_2_test_cases.md` | Modules Part 2 (Payroll, Recruitment, Documents, Chat, Performance) | 55 |
| 25 | `05-module_pages_3_test_cases.md` | Modules Part 3 (Assets, Reports, Settings, Profile, Super Admin) | 55 |
| 26 | `06-payroll_v2_frontend_test_cases.md` | Payroll V2 Frontend (Runs, Designer, Batch, Nav, MyPayslips Upgrades) | 111 |
| 27 | `07-payroll_deep_frontend_test_cases.md` | **Deep** Frontend Payroll Pages — Every Button, Tab, Modal, State, Action | 159 |
| 28 | `08-all_modules_frontend_deep_test_cases.md` | **Deep** All Modules Frontend — Auth, Dashboard, Employees, Payroll, Chat, Support, CMS, Super Admin, UI/UX | **250** |
| | **Subtotal Frontend** | | **795** |
| | **Mobile** (`test-cases/mobile/`) | |
| 26 | `01-mobile_test_cases.md` | Mobile App Part 1 (Init, Auth, Tabs, Screens) | 55 |
| 27 | `02-mobile_test_cases_2.md` | Mobile App Part 2 (Chat, Profile, Stack, Offline, Features) | 55 |
| 28 | `03-payroll_v2_mobile_test_cases.md` | Mobile Payroll V2 (FlatList, tabs, detail modal, PDF download, archive) | 34 |
| 29 | `04-payroll_deep_mobile_test_cases.md` | **Deep** Mobile Payroll — Runs, Templates, Queue, Payslips, Navigation, Offline | 115 |
| 30 | `05-all_modules_mobile_deep_test_cases.md` | **Deep** All Modules Mobile — Auth, Dashboard, Attendance, Leaves, Payroll, Chat, Performance, Offline, Permissions | **150** |
| | **Subtotal Mobile** | | **409** |
| | **Grand Total** | | **4,924** |

See `test-cases/README.md` for full details.

---

## NEW DEEP TEST COVERAGE (Added May 2026)

### Phase 1: Deep Payroll Test Files (100+ each) — 724 tests
| File | Module | Tests | Coverage Highlights |
|---|---|---|---|---|
| `api/21-payroll_runs_deep_test_cases.md` | Payroll Runs API | **122** | State machine (draft→finalized→paid→archived), boundary validations, race conditions, cross-tenant isolation, lifecycle transitions |
| `api/22-payslip_templates_deep_test_cases.md` | Payslip Templates API | **107** | Full CRUD, preview with every layout option, set-default state machine, integration with payslip generation, JSONB storage edge cases |
| `api/23-email_queue_deep_test_cases.md` | Email Queue & Worker API | **110** | Queue lifecycle (pending→sent→failed→cancelled→retry), worker polling, export CSV format, response format compliance |
| `api/24-payslips_deep_test_cases.md` | Payslips API | **111** | Single/bulk generate, auto-run creation, duplicate detection, PDF validation, verify state logic, email queuing, cross-tenant isolation |
| `frontend/07-payroll_deep_frontend_test_cases.md` | Payroll Frontend Pages | **159** | Every button, dropdown, tab, modal field, action loading/disabled state, filter combination, pagination edge case, error/success banner, empty state |
| `mobile/04-payroll_deep_mobile_test_cases.md` | Mobile Payroll | **115** | All mobile screens (runs, templates, queue, payslips), offline behavior, dark mode, accessibility, security gating, navigation |

### Phase 2: Deep All-Module Test Files (100+ each) — 2,445 tests
18 new backend API deep files (100-125 tests each), 1 new frontend deep file (250 tests), 1 new mobile deep file (150 tests).

| File | Module | Tests |
|---|---|---|
| `api/25-auth_deep_test_cases.md` | **Deep** Auth — Registration, Login, Profile, 2FA, Permissions, Token | 125 |
| `api/26-departments_deep_test_cases.md` | **Deep** Departments — CRUD, Budget, Security, Edge Cases | 105 |
| `api/27-employees_deep_test_cases.md` | **Deep** Employees — CRUD, Org Chart, QR, Chat Listing, Payroll Fields | 115 |
| `api/28-attendance_deep_test_cases.md` | **Deep** Attendance — Clock In/Out, Regularize, Biometric, Comp-Off | 110 |
| `api/29-leaves_deep_test_cases.md` | **Deep** Leaves — CRUD, Approve/Reject, Balance, Comp-Off, Calendar | 110 |
| `api/30-tasks_deep_test_cases.md` | **Deep** Tasks — CRUD, Status, Comments, Statistics, Priority | 105 |
| `api/31-recruitment_deep_test_cases.md` | **Deep** Recruitment — Jobs, Applications, Interviews, Offers, Resume | 110 |
| `api/32-chat_deep_test_cases.md` | **Deep** Chat — DMs, Channels, Reactions, Edit/Delete, Read Receipts | 115 |
| `api/33-performance_deep_test_cases.md` | **Deep** Performance — Goals, Key Results, Reviews, Cycles, Analytics | 110 |
| `api/34-assets_deep_test_cases.md` | **Deep** Assets — CRUD, Assign, Categories, Statistics, Depreciation | 105 |
| `api/35-documents_deep_test_cases.md` | **Deep** Documents — Upload, Download, Share, Versions, Categories | 105 |
| `api/36-settings_deep_test_cases.md` | **Deep** Settings — CRUD, Email Templates, Website, Mobile Config | 105 |
| `api/37-holidays_shifts_deep_test_cases.md` | **Deep** Holidays & Shifts — CRUD, Assignments, Opt-In, Edge Cases | 105 |
| `api/38-reports_deep_test_cases.md` | **Deep** Reports — Dashboard, Attendance, Leave, Payroll, Analytics | 105 |
| `api/39-cms_blog_deep_test_cases.md` | **Deep** CMS & Blog — Pages, Posts, Resources, Website Builder | 105 |
| `api/40-tenants_leads_biometrics_deep_test_cases.md` | **Deep** Tenants, Leads & Biometrics — CRUD, Provision, Webhooks | 105 |
| `api/41-support_deep_test_cases.md` | **Deep** Support — Chat, FAQ, Tickets, AI, Canned Replies, Dashboard | 110 |
| `api/42-remaining_modules_deep_test_cases.md` | **Deep** Remaining — Email Templates, Search, Upload, Audit, Onboarding | 120 |
| `frontend/08-all_modules_frontend_deep_test_cases.md` | **Deep** All Modules Frontend — Auth, Dashboard, Payroll, Chat, Support, CMS, Super Admin, UI/UX (250 tests) | 250 |
| `mobile/05-all_modules_mobile_deep_test_cases.md` | **Deep** All Modules Mobile — Auth, Dashboard, Attendance, Payroll, Chat, Offline, Permissions (150 tests) | 150 |

### Updated Total Test Coverage: **4,924 test cases** (up from 2,479)

#### Breakdown
| Category | Previous Total | Added | **New Total** |
|---|---|---|---|
| Backend API | 1,675 | 2,045 | **3,720** |
| Frontend Web | 545 | 250 | **795** |
| Mobile App | 259 | 150 | **409** |
| **Grand Total** | **2,479** | **2,445** | **4,924** |

---

## PHASE 7: MARKETING & LEAD GENERATION

### 7.1 Lead Magnet Download (`POST /api/leads/lead-magnet`)
| # | Test Case | Expected Result |
|---|---|---|
| 7.1.1 | `POST /api/leads/lead-magnet` with valid name + email | 200, confirmation message |
| 7.1.2 | `POST /api/leads/lead-magnet` without name | 400 validation error |
| 7.1.3 | `POST /api/leads/lead-magnet` without email | 400 validation error |
| 7.1.4 | `POST /api/leads/lead-magnet` with SQL injection in name | 200 or 400 (stored safely) |
| 7.1.5 | `POST /api/leads/lead-magnet` with XSS in name | Stored as literal text |
| 7.1.6 | `POST /api/leads/lead-magnet` with duplicate email | 200 (allowed — different download) |
| 7.1.7 | Verify data stored in `shared.lead_magnet_downloads` table | Row created with email, name, company, resource |

### 7.2 Lead Magnet Modal (Frontend)
| # | Test Case | Expected Result |
|---|---|---|
| 7.2.1 | Click "Download Free Guide" on Home page | LeadMagnetModal opens |
| 7.2.2 | Submit modal form with valid data | Shows success state "Check your inbox!" |
| 7.2.3 | Submit modal form without email | HTML5 required validation stops submission |
| 7.2.4 | Submit modal form without name | HTML5 required validation stops submission |
| 7.2.5 | Click close button on modal | Modal closes |
| 7.2.6 | Click outside modal | Modal closes |
| 7.2.7 | Exit-intent (mouse leaves top of window) | LeadMagnetModal opens (once per session) |

### 7.3 Marketing Trust Badges & Visual Elements
| # | Test Case | Expected Result |
|---|---|---|
| 7.3.1 | Trust & Security bar renders with 5 badges | SOC 2, GDPR, ISO 27001, Encryption, Uptime badges visible |
| 7.3.2 | Customer logos marquee animates continuously | Logos scroll left in infinite loop |
| 7.3.3 | Marquee pauses on hover | Animation stops when cursor is over logos |
| 7.3.4 | All badge icons render correctly | Shield, checkmark, lock, cloud icons visible |

### 7.4 Newsletter Subscription (PublicLayout)
| # | Test Case | Expected Result |
|---|---|---|
| 7.4.1 | Newsletter bar renders above footer | Email input + Subscribe button visible |
| 7.4.2 | Newsletter form submits | No error on submit (currently prevents default) |

### 7.5 Comparison Pages
| # | Test Case | Expected Result |
|---|---|---|
| 7.5.1 | `GET /vs-bamboohr` | Comparison page renders with hero, advantages, feature table, pricing, verdict |
| 7.5.2 | `GET /vs-gusto` | Comparison page renders with Gusto-specific data |
| 7.5.3 | `GET /vs-rippling` | Comparison page renders with Rippling-specific data |
| 7.5.4 | Feature comparison table renders correctly | Check/X icons show correct feature availability for both products |
| 7.5.5 | Pricing comparison cards display | HRMS Pro card highlighted with "Best Value" badge, competitor card greyed |
| 7.5.6 | Testimonial section renders | Star rating + quote + author visible |
| 7.5.7 | CTA buttons link correctly | "Try HRMS Pro Free" links to /demo, "Compare Pricing" to /pricing |
| 7.5.8 | SEO meta tags present | Each comparison page has unique title + meta description |
| 7.5.9 | Navigation dropdown shows Compare links | Resources menu shows vs BambooHR, vs Gusto, vs Rippling with descriptions |
| 7.5.10 | Footer shows comparison links | Footer Resources column includes all 3 comparison links |
| 7.5.11 | Features page shows comparison section | "How do we stack up?" section with 3 comparison buttons |
| 7.5.12 | All comparison page routes work on mobile | Responsive layout, no overflow |

## PHASE 8: DYNAMIC WEBSITE (Admin-Controlled Pages, Content & Design)

> **Note:** Phase 8 is executed incrementally alongside the PLAN.md sprints. Phase 8.1 covers the database layer (themes + labels schema & seeds). Subsequent subsections (backend API, super-admin UI, public rendering) are added as their sprints land.

### 8.1 Database Schema — Themes & Labels (Phase 1)
| # | Test Case | Expected Result |
|---|---|---|
| 8.1.1 | Run `create_dynamic_website_tables.js` migration | `shared.website_themes` and `shared.website_labels` tables created; `website_global_settings` gains `active_theme_id` + `theme_mode_auto` + `content_dictionary_enabled` columns |
| 8.1.2 | Re-run migration (idempotency) | No error; tables/columns not duplicated (`IF NOT EXISTS` honored) |
| 8.1.3 | Verify `shared.website_themes` columns | `id, name, slug, is_active, parameters JSONB, is_system, created_at, updated_at` present |
| 8.1.4 | Verify `shared.website_labels` columns | `id, namespace, label_key, label_value, description, created_at, updated_at` present |
| 8.1.5 | Verify unique constraints | `website_themes.slug` UNIQUE; `website_labels(namespace, label_key)` UNIQUE |
| 8.1.6 | Verify 6 preset themes seeded | Indigo Pro, Emerald Growth, Ocean Trust, Midnight Luxe, Minimal Stone, Sunset Energy present |
| 8.1.7 | Verify exactly ONE active theme | `is_active = true` on exactly one theme (singleton enforced) |
| 8.1.8 | Verify labels seeded for core namespaces | `nav`, `hero`, `features`, `pricing`, `footer`, `cta`, `common` etc. present with non-empty values |
| 8.1.9 | Verify each theme `parameters` JSONB has all design groups | Colors, typography, radii, shadows, spacing, mode, branding keys present |
| 8.1.10 | Verify `website_global_settings` row 1 linked to active theme | `active_theme_id` = the active theme's id; `theme_mode_auto` = true |

### 8.2 Themes & Content Labels Backend API (Phase 2)
| # | Test Case | Expected Result |
|---|---|---|
| 8.2.1 | `GET /api/website/themes/active` | Public endpoint returns active theme parameters JSONB |
| 8.2.2 | `GET /api/website/labels/public` | Public endpoint returns key-value map of content dictionary |
| 8.2.3 | `POST /api/website/themes/:id/activate` | Admin endpoint activates specified theme and deactivates others |
| 8.2.4 | `POST /api/website/labels/bulk` | Admin endpoint updates multiple dictionary labels in single transaction |
| 8.2.5 | Unauthenticated request to `/api/website/themes` | Returns 401 Unauthorized |
| 8.2.6 | Employee role request to `/api/website/labels/bulk` | Returns 403 Forbidden |

### 8.3 Website Builder UI & Section Manager (Phase 3)
| # | Test Case | Expected Result |
|---|---|---|
| 8.3.1 | Admin access `/website-builder` | Renders Website Builder page with 5 tabs (Pages, Sections, Themes, Labels, Global Settings) |
| 8.3.2 | Create new custom page | Page appears in list with slug and draft/published status |
| 8.3.3 | Add section to page sequence | Section component added to page sequence with JSON parameters |
| 8.3.4 | Reorder section sequence | Sections reordered up/down with live preview order |
| 8.3.5 | Activate design theme in UI | Swatch updates and theme applied live |
| 8.3.6 | Bulk edit content dictionary labels | Inline edits saved and reflected across website |

### 8.4 Public Website Dynamic Rendering (Phase 4)
| # | Test Case | Expected Result |
|---|---|---|
| 8.4.1 | Navigate to `/` | Public layout reads logo, company name, nav links, and labels dynamically |
| 8.4.2 | Navigate to `/:slug` | DynamicPage renders published custom sections via SectionRendererV2 |
| 8.4.3 | Theme CSS variables injection | CSS variables (`--colors-primary`, `--radii-radius-md`) injected into `:root` |
| 8.4.4 | Unpublished page request | Displays styled 404 page |

### 8.5 Sales, Marketing & Growth Intelligence (Phase 5)
| # | Test Case | Expected Result |
|---|---|---|
| 8.5.1 | `GET /api/tenants/growth-analytics` as Super Admin | Returns full growth metrics (MRR, ARR, Total Rev, Inbound Leads, Conversion %, Plan Distribution, Top Tenants) |
| 8.5.2 | `GET /api/tenants/growth-analytics` unauthenticated | Returns 401 Unauthorized |
| 8.5.3 | `GET /api/tenants/growth-analytics` as standard employee | Returns 403 Forbidden |
| 8.5.4 | Currency Toggle (INR vs USD) in Growth Dashboard | Toggles between INR (₹) and USD ($) accurately |
| 8.5.5 | Customer Acquisition Funnel visualization | Renders 4-stage funnel (Inbound Leads ➔ Pending ➔ Demos ➔ Paid Workspaces) |
| 8.5.6 | Top 10 Revenue Customer Accounts leaderboard | Renders highest lifetime spend companies with payment frequency |
| 8.5.7 | Print / PDF Export button in Growth Dashboard | Triggers window.print() clean printable stylesheet |

### 8.6 Platform System Broadcasts & Banners (Phase 6)
| # | Test Case | Expected Result |
|---|---|---|
| 8.6.1 | `POST /api/tenants/broadcasts` as Super Admin | Creates broadcast banner in `shared.platform_broadcasts` |
| 8.6.2 | `GET /api/tenants/active-broadcasts` as Tenant User | Resolves active unexpired broadcasts matching tenant's subscription tier |
| 8.6.3 | Dismiss broadcast in Layout.jsx | Dismisses banner locally in browser |
| 8.6.4 | `DELETE /api/tenants/broadcasts/:id` as Super Admin | Removes broadcast record and logs audit entry |

### 8.7 Global Security & Cross-Tenant Audit Logs (Phase 7)
| # | Test Case | Expected Result |
|---|---|---|
| 8.7.1 | Impersonate Tenant Admin | Writes `IMPERSONATE_TENANT` log into `shared.platform_audit_logs` |
| 8.7.2 | `GET /api/tenants/platform-audit-logs` as Super Admin | Returns paginated audit trail with category filtering and search |
| 8.7.3 | Inspect Audit Payload in UI Modal | Renders formatted JSONB details of the event |

### 8.8 Live System Health & Diagnostics (Phase 8)
| # | Test Case | Expected Result |
|---|---|---|
| 8.8.1 | `GET /api/tenants/system-health` as Super Admin | Returns live query latency, connection pool counts, and memory usage |
| 8.8.2 | Tenant Schema Storage Breakdown | Calculates table count and disk bytes per schema |
| 8.8.3 | Live 10s Telemetry Pulse | Automatically polls diagnostics endpoint in UI |

### 8.9 Automated Tenant Backups & Cloud Snapshots (Phase 9)
| # | Test Case | Expected Result |
|---|---|---|
| 8.9.1 | `POST /api/tenants/backups/trigger-all` as Super Admin | Generates point-in-time database snapshot for every active tenant |
| 8.9.2 | `GET /api/tenants/backups/archives` as Super Admin | Returns list of archived backups with size and record counts |
| 8.9.3 | `GET /api/tenants/backups/archives/:id/download` | Streams full JSON snapshot file download |

### Updated Total Test Coverage: **5,000 test cases** (up from 4,987)



