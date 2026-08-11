# HRMS Pro - Comprehensive Test Cases

## Overview
This directory contains detailed test case files organized by module, covering **Backend API**, **Frontend Web**, and **Mobile App**.

## File Structure

### Backend API (`test-cases/api/`)
| # | File | Module | Test Cases |
|---|---|---|---|
| 1 | `01-auth_test_cases.md` | Auth (login, register, 2FA, passwords, permissions) | 75 |
| 2 | `02-departments_test_cases.md` | Departments (CRUD, pagination, tenant isolation) | 55 |
| 3 | `03-employees_test_cases.md` | Employees (CRUD, filters, QR, org-chart) | 55 |
| 4 | `04-attendance_test_cases.md` | Attendance (clock in/out, regularize, filters) | 55 |
| 5 | `05-leaves_test_cases.md` | Leaves (CRUD, approve/reject, balance, comp-off) | 55 |
| 6 | `06-tasks_test_cases.md` | Tasks (CRUD, status, updates, pagination) | 55 |
| 7 | `07-payroll_test_cases.md` | Payroll v1 (CRUD, generate, process, tax, payslip) | 55 |
| 8 | `08-recruitment_test_cases.md` | Recruitment (jobs, applications, resume parse) | 55 |
| 9 | `09-chat_test_cases.md` | Chat (messages, reactions, channels, encryption) | 55 |
| 10 | `10-performance_test_cases.md` | Performance (goals, reviews, cycles, key-results) | 55 |
| 11 | `11-assets_test_cases.md` | Assets (CRUD, assign, status, types) | 55 |
| 12 | `12-documents_test_cases.md` | Documents (upload, CRUD, confidential, filters) | 55 |
| 13 | `13-settings_test_cases.md` | Settings (CRUD, bulk update, types) | 55 |
| 14 | `14-holidays_test_cases.md` | Holidays (CRUD, opt-in, restricted) | 55 |
| 15 | `15-shifts_test_cases.md` | Shifts (CRUD, assign, assignments) | 55 |
| 16 | `16-reports_test_cases.md` | Reports (13 report types, filters, trends) | 55 |
| 17 | `17-cms_blog_test_cases.md` | CMS pages + Blog posts | 55 |
| 18 | `18-tenants_leads_test_cases.md` | Tenants + Leads/Demo request | 55 |
| 19 | `19-support_test_cases.md` | Support (chat, FAQ, tickets, AI, canned) | 55 |
| 20 | `20-remaining_modules_test_cases.md` | Email Templates, Search, Upload, Mobile Config, Audit Logs | 55 |
| 21 | `14-payroll_v2_test_cases.md` | Payroll V2 (Runs, Templates, Payslips API) | 63 |
| 22 | `15-payroll_v3_test_cases.md` | Payroll V3 (Email Queue, Export, Audit Logs API) | 108 |
| 23 | `21-payroll_runs_deep_test_cases.md` | **Deep** Payroll Runs — State Machine, Lifecycle, Edge Cases | **122** |
| 24 | `22-payslip_templates_deep_test_cases.md` | **Deep** Payslip Templates — CRUD, Preview, Design, Integrations | **107** |
| 25 | `23-email_queue_deep_test_cases.md` | **Deep** Email Queue & Worker — Lifecycle, Export, State Transitions | **110** |
| 26 | `24-payslips_deep_test_cases.md` | **Deep** Payslips — Generate, Bulk, Download, Verify, Email, Tenant | **111** |
| 27 | `25-auth_deep_test_cases.md` | **Deep** Auth — Registration, Login, Profile, 2FA, Permissions, Token | **125** |
| 28 | `26-departments_deep_test_cases.md` | **Deep** Departments — CRUD, Budget, Security, Edge Cases | **105** |
| 29 | `27-employees_deep_test_cases.md` | **Deep** Employees — CRUD, Org Chart, QR, Chat Listing, Payroll Fields | **115** |
| 30 | `28-attendance_deep_test_cases.md` | **Deep** Attendance — Clock In/Out, Regularize, Biometric, Comp-Off | **110** |
| 31 | `29-leaves_deep_test_cases.md` | **Deep** Leaves — CRUD, Approve/Reject, Balance, Comp-Off, Calendar | **110** |
| 32 | `30-tasks_deep_test_cases.md` | **Deep** Tasks — CRUD, Status, Comments, Statistics, Priority | **105** |
| 33 | `31-recruitment_deep_test_cases.md` | **Deep** Recruitment — Jobs, Applications, Interviews, Offers, Resume | **110** |
| 34 | `32-chat_deep_test_cases.md` | **Deep** Chat — DMs, Channels, Reactions, Edit/Delete, Read Receipts | **115** |
| 35 | `33-performance_deep_test_cases.md` | **Deep** Performance — Goals, Key Results, Reviews, Cycles, Analytics | **110** |
| 36 | `34-assets_deep_test_cases.md` | **Deep** Assets — CRUD, Assign, Categories, Statistics, Depreciation | **105** |
| 37 | `35-documents_deep_test_cases.md` | **Deep** Documents — Upload, Download, Share, Versions, Categories | **105** |
| 38 | `36-settings_deep_test_cases.md` | **Deep** Settings — CRUD, Email Templates, Website, Mobile Config | **105** |
| 39 | `37-holidays_shifts_deep_test_cases.md` | **Deep** Holidays & Shifts — CRUD, Assignments, Opt-In, Edge Cases | **105** |
| 40 | `38-reports_deep_test_cases.md` | **Deep** Reports — Dashboard, Attendance, Leave, Payroll, Analytics | **105** |
| 41 | `39-cms_blog_deep_test_cases.md` | **Deep** CMS & Blog — Pages, Posts, Resources, Website Builder | **105** |
| 42 | `40-tenants_leads_biometrics_deep_test_cases.md` | **Deep** Tenants, Leads & Biometrics — CRUD, Provision, Webhooks | **105** |
| 43 | `41-support_deep_test_cases.md` | **Deep** Support — Chat, FAQ, Tickets, AI, Canned Replies, Dashboard | **110** |
| 44 | `42-remaining_modules_deep_test_cases.md` | **Deep** Remaining — Email Templates, Search, Upload, Audit, Onboarding | **120** |
| | **Total Backend API** | | **3720** |

### Frontend (`test-cases/frontend/`)
| # | File | Module | Test Cases |
|---|---|---|---|
| 1 | `01-auth_pages_test_cases.md` | Login, Signup, Forgot/Reset Password, Protected Routes | 55 |
| 2 | `02-dashboard_test_cases.md` | Dashboard widgets, charts, layout | 55 |
| 3 | `03-module_pages_test_cases.md` | Employees, Departments, Attendance, Leaves, Tasks | 55 |
| 4 | `04-module_pages_2_test_cases.md` | Payroll, Recruitment, Documents, Chat, Performance | 55 |
| 5 | `05-module_pages_3_test_cases.md` | Assets, Reports, Settings, Profile, Super Admin | 55 |
| 6 | `06-payroll_v2_frontend_test_cases.md` | Payroll V2 Frontend (Runs, Designer, Batch, Nav, MyPayslips Upgrades) | 111 |
| 7 | `07-payroll_deep_frontend_test_cases.md` | **Deep** Frontend Payroll Pages — Every Button, Tab, Modal, State, Action | **159** |
| 8 | `08-all_modules_frontend_deep_test_cases.md` | **Deep** All Modules Frontend — Auth, Dashboard, Employees, Payroll, Chat, Support, CMS, Reports, Super Admin, UI/UX | **250** |
| | **Total Frontend** | | **795** |

### Mobile (`test-cases/mobile/`)
| # | File | Module | Test Cases |
|---|---|---|---|
| 1 | `01-mobile_test_cases.md` | Init, Auth, Tabs, Dashboard, Attendance, Leaves, Tasks, Chat | 55 |
| 2 | `02-mobile_test_cases_2.md` | Chat cont., Profile, Stack screens, Auth, Offline, Features | 55 |
| 3 | `03-payroll_v2_mobile_test_cases.md` | Mobile Payroll V2 (FlatList, tabs, detail modal, PDF download, archive) | 34 |
| 4 | `04-payroll_deep_mobile_test_cases.md` | **Deep** Mobile Payroll — Runs, Templates, Queue, Payslips, Navigation, Offline | **115** |
| 5 | `05-all_modules_mobile_deep_test_cases.md` | **Deep** All Modules Mobile — Auth, Dashboard, Attendance, Leaves, Payroll, Chat, Performance, Offline, Permissions | **150** |
| | **Total Mobile** | | **409** |

## Grand Total
| Category | Test Cases |
|---|---|
| Backend API | 3,720 |
| Frontend Web | 795 |
| Mobile App | 409 |
| **Grand Total** | **4,924** |

## Test Categories Covered Per Module
1. **CRUD**: Create, Read, Update, Delete operations
2. **Happy Path**: Standard successful flow
3. **Validation**: Empty fields, wrong types, missing required, invalid formats
4. **Authentication**: No token, invalid token, expired token
5. **Authorization**: Role-based access (admin, manager, employee, super-admin)
6. **Edge Cases**: Boundary values, duplicates, non-existent resources
7. **Security**: SQL injection, XSS, parameterized queries
8. **Data Isolation**: Multi-tenant data separation
9. **Pagination**: Page numbers, limits, sorting
10. **Idempotency**: Repeated operations don't corrupt state
11. **Error Handling**: Proper error codes and messages
12. **Performance**: Response time, rate limiting
