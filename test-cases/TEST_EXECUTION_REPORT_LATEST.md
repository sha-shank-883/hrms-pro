# HRMS Pro - Comprehensive Test Execution Report
**Date**: 2026-05-28 16:00:29
**Server**: http://localhost:5001
**Tenant**: tenant_default
**Quick Mode**: True

## Execution Log

[START] 16:00:29 - Starting comprehensive test execution...
[PHASE] 16:00:30 - 
=== PHASE 0: Authentication Setup ===
[PASS] 16:00:35 - Token obtained successfully
[PHASE] 16:00:36 - 
=== MODULE 1: Auth (Deep Tests) ===
[PASS] 16:00:36 -   [PASS] Login valid credentials
[PASS] 16:00:37 -   [PASS] Login wrong password
[PASS] 16:00:37 -   [PASS] Login non-existent email
[PASS] 16:00:38 -   [PASS] Login missing email
[PASS] 16:00:38 -   [PASS] Login missing password
[PASS] 16:00:38 -   [PASS] Login empty body
[PASS] 16:00:38 -   [PASS] Login SQL injection
[PASS] 16:00:38 -   [PASS] Login rate limit (rapid)
[PASS] 16:00:38 -   [PASS] Get profile with valid token
[PASS] 16:00:38 -   [PASS] Get profile without token
[PASS] 16:00:38 -   [PASS] Get profile with invalid token
[PASS] 16:00:39 -   [PASS] Change password missing fields
[PASS] 16:00:39 -   [PASS] Change password without auth
[PASS] 16:00:39 -   [PASS] Get permissions with auth
[PASS] 16:00:39 -   [PASS] Get permissions without auth
[PHASE] 16:00:39 - 
=== MODULE 2: Departments (Deep Tests) ===
[PASS] 16:00:39 -   [PASS] Create with valid name
[PASS] 16:00:39 -   [PASS] Create with empty name
[PASS] 16:00:39 -   [PASS] Create duplicate name
[PASS] 16:00:40 -   [PASS] Create without auth
[PASS] 16:00:40 -   [PASS] Create missing name
[PASS] 16:00:40 -   [PASS] Create negative budget
[PASS] 16:00:40 -   [PASS] Create SQL injection
[PASS] 16:00:40 -   [PASS] Create XSS in name
[PASS] 16:00:40 -   [PASS] Create with special chars
[PASS] 16:00:41 -   [PASS] List all
[PASS] 16:00:41 -   [PASS] List without auth
[PASS] 16:00:41 -   [PASS] List with pagination
[PASS] 16:00:41 -   [PASS] List with search
[PASS] 16:00:41 -   [PASS] List sorted
[PASS] 16:00:42 -   [PASS] List page beyond total
[PASS] 16:00:42 -   [PASS] Get non-existent ID
[PASS] 16:00:42 -   [PASS] Get with invalid ID
[PASS] 16:00:42 -   [PASS] Update non-existent
[PASS] 16:00:42 -   [PASS] Update without auth
[PASS] 16:00:42 -   [PASS] Delete non-existent
[PASS] 16:00:42 -   [PASS] Delete with invalid ID
[PHASE] 16:00:42 - 
=== MODULE 3: Employees (Deep Tests) ===
[PASS] 16:00:43 -   [PASS] Create with required fields
[PASS] 16:00:43 -   [PASS] Create duplicate email
[PASS] 16:00:44 -   [PASS] Create missing first_name
[PASS] 16:00:44 -   [PASS] Create missing email
[PASS] 16:00:44 -   [PASS] Create invalid email
[PASS] 16:00:44 -   [PASS] Create SQL injection
[PASS] 16:00:45 -   [PASS] Create XSS
[PASS] 16:00:46 -   [PASS] Create all optional fields
[PASS] 16:00:48 -   [PASS] Create duplicate employee_code
[PASS] 16:00:48 -   [PASS] Create empty body
[PASS] 16:00:49 -   [PASS] Create without auth
[PASS] 16:00:50 -   [PASS] List all
[PASS] 16:00:50 -   [PASS] List without auth
[PASS] 16:00:51 -   [PASS] List with pagination
[PASS] 16:00:52 -   [PASS] List with search
[PASS] 16:00:52 -   [PASS] List page beyond total
[PASS] 16:00:53 -   [PASS] Get non-existent ID
[PASS] 16:00:53 -   [PASS] Get invalid ID
[PASS] 16:00:55 -   [PASS] Get org chart
[PHASE] 16:00:55 - 
=== MODULE 4: Attendance (Deep Tests) ===
[PASS] 16:00:55 -   [PASS] Clock in without auth
[PASS] 16:00:56 -   [PASS] Clock out without auth
[PASS] 16:00:56 -   [PASS] Get today status
[PASS] 16:00:56 -   [PASS] Get today without auth
[PASS] 16:00:57 -   [PASS] Get history
[PASS] 16:00:57 -   [PASS] Get history without auth
[PASS] 16:00:57 -   [PASS] Get history date range
[PASS] 16:00:57 -   [PASS] Get history pagination
[PASS] 16:00:57 -   [PASS] Manual entry missing fields
[PASS] 16:00:57 -   [PASS] Manual entry without auth
[PASS] 16:00:57 -   [PASS] Regularization without auth
[PASS] 16:00:57 -   [PASS] Get stats
[PASS] 16:00:57 -   [PASS] Get stats without auth
[PHASE] 16:00:58 - 
=== MODULE 5: Leaves (Deep Tests) ===
[FAIL] 16:00:58 -   [FAIL] Apply leave valid
[PASS] 16:00:58 -   [PASS] Apply leave missing type
[PASS] 16:00:58 -   [PASS] Apply leave missing dates
[PASS] 16:00:58 -   [PASS] Apply leave without auth
[FAIL] 16:00:58 -   [FAIL] Apply leave SQL injection
[PASS] 16:00:58 -   [PASS] List leaves
[PASS] 16:00:58 -   [PASS] List leaves without auth
[PASS] 16:00:59 -   [PASS] List with status filter
[PASS] 16:00:59 -   [PASS] List pagination
[PASS] 16:01:00 -   [PASS] Get leave balance
[PASS] 16:01:00 -   [PASS] Get balance without auth
[PASS] 16:01:00 -   [PASS] Get leave stats
[PASS] 16:01:00 -   [PASS] Get stats without auth
[PHASE] 16:01:00 - 
=== MODULE 6: Tasks (Deep Tests) ===
[PASS] 16:01:00 -   [PASS] Create task valid
[PASS] 16:01:01 -   [PASS] Create task empty title
[PASS] 16:01:01 -   [PASS] Create task missing assigned_to
[PASS] 16:01:01 -   [PASS] Create task without auth
[PASS] 16:01:01 -   [PASS] Create task SQL injection
[PASS] 16:01:01 -   [PASS] Create task XSS
[PASS] 16:01:01 -   [PASS] List tasks
[PASS] 16:01:01 -   [PASS] List tasks without auth
[PASS] 16:01:01 -   [PASS] List with status filter
[PASS] 16:01:02 -   [PASS] List with priority filter
[PASS] 16:01:02 -   [PASS] List pagination
[PASS] 16:01:02 -   [PASS] Get task stats
[PASS] 16:01:02 -   [PASS] Get stats without auth
[PHASE] 16:01:02 - 
=== MODULE 7: Recruitment (Deep Tests) ===
[PASS] 16:01:03 -   [PASS] Create job valid
[PASS] 16:01:03 -   [PASS] Create job missing title
[PASS] 16:01:03 -   [PASS] Create job duplicate title
[PASS] 16:01:03 -   [PASS] Create job without auth
[PASS] 16:01:03 -   [PASS] Create job SQL injection
[PASS] 16:01:04 -   [PASS] List jobs
[PASS] 16:01:04 -   [PASS] List jobs public
[PASS] 16:01:04 -   [PASS] List applications
[PHASE] 16:01:04 - 
=== MODULE 8: Chat (Deep Tests) ===
[PASS] 16:01:04 -   [PASS] Send DM
[PASS] 16:01:04 -   [PASS] Send DM empty message
[PASS] 16:01:05 -   [PASS] Send DM without auth
[PASS] 16:01:05 -   [PASS] Send DM SQL injection
[PASS] 16:01:05 -   [PASS] Send DM XSS
[PASS] 16:01:05 -   [PASS] List conversations
[PASS] 16:01:05 -   [PASS] List conversations without auth
[PASS] 16:01:05 -   [PASS] Get messages
[PASS] 16:01:05 -   [PASS] Create channel
[PASS] 16:01:05 -   [PASS] Create channel empty name
[PASS] 16:01:05 -   [PASS] List channels
[PASS] 16:01:05 -   [PASS] Get unread count
[PHASE] 16:01:05 - 
=== MODULE 9: Performance (Deep Tests) ===
[FAIL] 16:01:05 -   [FAIL] Create goal
[PASS] 16:01:05 -   [PASS] Create goal missing title
[FAIL] 16:01:06 -   [FAIL] Create goal without auth
[PASS] 16:01:06 -   [PASS] List goals
[FAIL] 16:01:06 -   [FAIL] Create review
[PASS] 16:01:06 -   [PASS] Create review missing employee
[PASS] 16:01:06 -   [PASS] List reviews
[PASS] 16:01:06 -   [PASS] Create cycle
[PASS] 16:01:06 -   [PASS] Create cycle missing name
[PASS] 16:01:06 -   [PASS] List cycles
[PHASE] 16:01:06 - 
=== MODULE 10: Assets (Deep Tests) ===
[PASS] 16:01:06 -   [PASS] Create asset
[PASS] 16:01:06 -   [PASS] Create asset missing name
[PASS] 16:01:06 -   [PASS] Create asset missing type
[PASS] 16:01:06 -   [PASS] Create asset negative cost
[PASS] 16:01:06 -   [PASS] Create asset without auth
[PASS] 16:01:07 -   [PASS] Create asset SQL injection
[PASS] 16:01:07 -   [PASS] Create asset XSS
[PASS] 16:01:07 -   [PASS] List assets
[PASS] 16:01:07 -   [PASS] List with filters
[PASS] 16:01:07 -   [PASS] List pagination
[PHASE] 16:01:07 - 
=== MODULE 11: Documents (Deep Tests) ===
[PASS] 16:01:07 -   [PASS] List documents
[PASS] 16:01:07 -   [PASS] List documents without auth
[PASS] 16:01:07 -   [PASS] List with pagination
[PASS] 16:01:07 -   [PASS] Update non-existent document
[PASS] 16:01:07 -   [PASS] Delete non-existent document
[PASS] 16:01:07 -   [PASS] Get non-existent document
[FAIL] 16:01:08 -   [FAIL] Create setting
[PASS] 16:01:08 -   [PASS] Create with empty key
[PASS] 16:01:08 -   [PASS] Create without auth
[FAIL] 16:01:08 -   [FAIL] Create SQL injection
[PASS] 16:01:08 -   [PASS] List settings
[PASS] 16:01:08 -   [PASS] List settings without auth
[PASS] 16:01:08 -   [PASS] Get by key
[PASS] 16:01:09 -   [PASS] Get non-existent key
[PASS] 16:01:09 -   [PASS] Update setting
[PASS] 16:01:09 -   [PASS] Update non-existent
[PHASE] 16:01:09 - 
=== MODULE 13: Holidays (Deep Tests) ===
[PASS] 16:01:09 -   [PASS] Create holiday
[PASS] 16:01:09 -   [PASS] Create holiday missing name
[PASS] 16:01:09 -   [PASS] Create holiday missing date
[PASS] 16:01:09 -   [PASS] Create holiday duplicate
[PASS] 16:01:09 -   [PASS] Create holiday without auth
[PASS] 16:01:09 -   [PASS] Create holiday SQL injection
[PASS] 16:01:10 -   [PASS] List holidays
[PASS] 16:01:10 -   [PASS] List holidays without auth
[PASS] 16:01:10 -   [PASS] List by year
[PASS] 16:01:10 -   [PASS] List by month
[PHASE] 16:01:10 - 
=== MODULE 14: Shifts (Deep Tests) ===
[PASS] 16:01:10 -   [PASS] Create shift
[PASS] 16:01:10 -   [PASS] Create shift missing name
[PASS] 16:01:10 -   [PASS] Create shift missing start_time
[PASS] 16:01:10 -   [PASS] Create shift duplicate name
[PASS] 16:01:10 -   [PASS] Create shift without auth
[PASS] 16:01:10 -   [PASS] Create shift negative grace
[PASS] 16:01:10 -   [PASS] List shifts
[PASS] 16:01:10 -   [PASS] List shifts without auth
[PASS] 16:01:10 -   [PASS] Assign shift missing employee
[PASS] 16:01:10 -   [PASS] Assign shift without auth
[PASS] 16:01:10 -   [PASS] List assignments
[PASS] 16:01:11 -   [PASS] Dashboard report
[PASS] 16:01:11 -   [PASS] Dashboard without auth
[PASS] 16:01:11 -   [PASS] Attendance report
[PASS] 16:01:11 -   [PASS] Leave report
[PASS] 16:01:11 -   [PASS] Payroll report
[PASS] 16:01:11 -   [PASS] Employee report
[PASS] 16:01:11 -   [PASS] Recruitment report
[PASS] 16:01:11 -   [PASS] Demographics report
[PASS] 16:01:12 -   [PASS] Churn risk report
[PASS] 16:01:12 -   [PASS] Performance analytics
[PASS] 16:01:12 -   [PASS] Payroll trends
[PASS] 16:01:12 -   [PASS] Attendance trends
[PHASE] 16:01:12 - 
=== MODULE 16: CMS & Blog (Deep Tests) ===
[PASS] 16:01:12 -   [PASS] Create blog post
[PASS] 16:01:12 -   [PASS] Create blog missing title
[PASS] 16:01:12 -   [PASS] Create blog without auth
[PASS] 16:01:13 -   [PASS] List blog posts
[PASS] 16:01:13 -   [PASS] List published posts (public)
[PASS] 16:01:14 -   [PASS] Create CMS page
[PASS] 16:01:14 -   [PASS] Create CMS missing slug
[PASS] 16:01:14 -   [PASS] Create CMS duplicate slug
[PASS] 16:01:14 -   [PASS] Create CMS without auth
[PASS] 16:01:14 -   [PASS] Get published page (public)
[PASS] 16:01:14 -   [PASS] Get non-existent page
[PHASE] 16:01:14 - 
=== MODULE 17: Support (Deep Tests) ===
[FAIL] 16:01:14 -   [FAIL] Create FAQ
[PASS] 16:01:14 -   [PASS] Create FAQ missing question
[FAIL] 16:01:14 -   [FAIL] Create FAQ without auth
[PASS] 16:01:14 -   [PASS] List FAQs (public)
[PASS] 16:01:14 -   [PASS] List FAQs with search
[PASS] 16:01:15 -   [PASS] Create ticket
[PASS] 16:01:15 -   [PASS] Create ticket missing subject
[PASS] 16:01:15 -   [PASS] Create ticket missing description
[PASS] 16:01:15 -   [PASS] Create ticket without auth
[PASS] 16:01:15 -   [PASS] Create ticket SQL injection
[PASS] 16:01:15 -   [PASS] Create ticket XSS
[PASS] 16:01:15 -   [PASS] List tickets
[PASS] 16:01:15 -   [PASS] List tickets with filter
[PASS] 16:01:15 -   [PASS] List tickets without auth
[PASS] 16:01:17 -   [PASS] AI ask
[PASS] 16:01:18 -   [PASS] AI ask without question
[PASS] 16:01:18 -   [PASS] AI ask without auth
[PASS] 16:01:18 -   [PASS] Start support chat
[PASS] 16:01:18 -   [PASS] Start chat without message
[FAIL] 16:01:18 -   [FAIL] Get chat history
[PHASE] 16:01:18 - 
=== MODULE 18: Tenants & Leads (Deep Tests) ===
[FAIL] 16:01:18 -   [FAIL] Submit demo request
[PASS] 16:01:18 -   [PASS] Submit lead missing email
[PASS] 16:01:18 -   [PASS] Submit lead missing name
[PASS] 16:01:18 -   [PASS] Submit lead invalid email
[PASS] 16:01:18 -   [PASS] Create device missing IP
[PASS] 16:01:18 -   [PASS] Create device without auth
[PASS] 16:01:19 -   [PASS] List devices
[PHASE] 16:01:19 - 
=== MODULE 19: Remaining Modules (Deep Tests) ===
[PASS] 16:01:19 -   [PASS] Create email template
[PASS] 16:01:19 -   [PASS] Create template missing subject
[FAIL] 16:01:19 -   [FAIL] Create template missing body
[PASS] 16:01:19 -   [PASS] Create template without auth
[PASS] 16:01:19 -   [PASS] Create template SQL injection
[PASS] 16:01:19 -   [PASS] List email templates
[PASS] 16:01:19 -   [PASS] List templates without auth
[PASS] 16:01:19 -   [PASS] Search with query
[PASS] 16:01:19 -   [PASS] Search without query
[PASS] 16:01:20 -   [PASS] Search without auth
[PASS] 16:01:20 -   [PASS] Search SQL injection
[PASS] 16:01:20 -   [PASS] List audit logs
[PASS] 16:01:20 -   [PASS] List audit logs without auth
[PASS] 16:01:20 -   [PASS] Audit logs with filter
[PASS] 16:01:20 -   [PASS] Audit logs pagination
[PASS] 16:01:20 -   [PASS] Get public mobile config
[PASS] 16:01:20 -   [PASS] Get all config without auth
[PASS] 16:01:20 -   [PASS] Get website settings (public)
[PASS] 16:01:21 -   [PASS] Health check
[PASS] 16:01:21 -   [PASS] Health check no auth header
[PHASE] 16:01:21 - 
=== MODULE 20: Payroll V2/V3 (Key Tests) ===
[PASS] 16:01:21 -   [PASS] Create payroll run
[PASS] 16:01:21 -   [PASS] Create run missing month
[PASS] 16:01:21 -   [PASS] List payroll runs
[PASS] 16:01:21 -   [PASS] List runs without auth
[PASS] 16:01:21 -   [PASS] Create payslip template
[PASS] 16:01:21 -   [PASS] List templates
[PASS] 16:01:21 -   [PASS] List templates without auth
[PASS] 16:01:21 -   [PASS] List email queue without auth
[PASS] 16:01:21 -   [PASS] Get email queue stats
[PASS] 16:01:22 -   [PASS] Export runs
[PASS] 16:01:22 -   [PASS] Export without auth
[DONE] 16:01:22 - 
=== TEST EXECUTION COMPLETE ===
[INFO] 16:01:22 - Total Tests: 258
[FAIL] 16:01:22 - Failed: 13
[INFO] 16:01:22 - Errors Logged: 13
[INFO] 16:01:22 - Duration: 00:00:52

---

## Execution Summary

| Metric | Value |
|---|---|
| Start Time | 2026-05-28 16:00:29 |
| End Time | 2026-05-28 16:01:22 |
| Total Duration | 00:00:52 |
| Total Tests | 258 |
| Passed | 245 |
| Failed | 13 |
| Skipped | 0 |
| Errors Logged | 13 |
| Pass Rate | 95% |

## Modules Tested
1. Auth
2. Departments
3. Employees
4. Attendance
5. Leaves
6. Tasks
7. Recruitment
8. Chat
9. Performance
10. Assets
11. Documents
12. Settings
13. Holidays
14. Shifts
15. Reports
16. CMS & Blog
17. Support
18. Tenants & Leads
19. Remaining (Email Templates, Search, Upload, Audit, Health)
20. Payroll V2/V3

*Report generated by Comprehensive All-Module Test Runner*
