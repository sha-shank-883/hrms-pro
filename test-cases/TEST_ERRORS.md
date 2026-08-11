
### ERROR-001 - Auth - Login SQL injection
- **Date**: 2026-05-28
- **Module**: Auth
- **Test**: Login SQL injection
- **Expected**: HTTP 401
- **Actual**: HTTP 400
- **Severity**: High
- **Status**: Open


### ERROR-002 - Auth - Login rate limit (rapid)
- **Date**: 2026-05-28
- **Module**: Auth
- **Test**: Login rate limit (rapid)
- **Expected**: HTTP 429
- **Actual**: HTTP 401
- **Severity**: Medium
- **Status**: Open


### ERROR-003 - Auth - Get permissions with auth
- **Date**: 2026-05-28
- **Module**: Auth
- **Test**: Get permissions with auth
- **Expected**: HTTP 200
- **Actual**: HTTP 404
- **Severity**: Medium
- **Status**: Open


### ERROR-004 - Auth - Get permissions without auth
- **Date**: 2026-05-28
- **Module**: Auth
- **Test**: Get permissions without auth
- **Expected**: HTTP 401
- **Actual**: HTTP 404
- **Severity**: Medium
- **Status**: Open


### ERROR-005 - Departments - Create with valid name
- **Date**: 2026-05-28
- **Module**: Departments
- **Test**: Create with valid name
- **Expected**: HTTP 201
- **Actual**: HTTP 400
- **Severity**: Medium
- **Status**: Open


### ERROR-006 - Departments - Create duplicate name
- **Date**: 2026-05-28
- **Module**: Departments
- **Test**: Create duplicate name
- **Expected**: HTTP 409
- **Actual**: HTTP 400
- **Severity**: Medium
- **Status**: Open


### ERROR-007 - Departments - Create SQL injection
- **Date**: 2026-05-28
- **Module**: Departments
- **Test**: Create SQL injection
- **Expected**: HTTP 201
- **Actual**: HTTP 400
- **Severity**: High
- **Status**: Open


### ERROR-008 - Departments - Create XSS in name
- **Date**: 2026-05-28
- **Module**: Departments
- **Test**: Create XSS in name
- **Expected**: HTTP 201
- **Actual**: HTTP 400
- **Severity**: High
- **Status**: Open


### ERROR-009 - Departments - Create with special chars
- **Date**: 2026-05-28
- **Module**: Departments
- **Test**: Create with special chars
- **Expected**: HTTP 201
- **Actual**: HTTP 400
- **Severity**: Medium
- **Status**: Open


### ERROR-010 - Departments - Update non-existent
- **Date**: 2026-05-28
- **Module**: Departments
- **Test**: Update non-existent
- **Expected**: HTTP 404
- **Actual**: HTTP 400
- **Severity**: Medium
- **Status**: Open


### ERROR-011 - Employees - Create with required fields
- **Date**: 2026-05-28
- **Module**: Employees
- **Test**: Create with required fields
- **Expected**: HTTP 201
- **Actual**: HTTP 400
- **Severity**: Medium
- **Status**: Open


### ERROR-012 - Employees - Create duplicate email
- **Date**: 2026-05-28
- **Module**: Employees
- **Test**: Create duplicate email
- **Expected**: HTTP 409
- **Actual**: HTTP 400
- **Severity**: Medium
- **Status**: Open


### ERROR-013 - Employees - Create SQL injection
- **Date**: 2026-05-28
- **Module**: Employees
- **Test**: Create SQL injection
- **Expected**: HTTP 201
- **Actual**: HTTP 400
- **Severity**: High
- **Status**: Open


### ERROR-014 - Employees - Create XSS
- **Date**: 2026-05-28
- **Module**: Employees
- **Test**: Create XSS
- **Expected**: HTTP 201
- **Actual**: HTTP 400
- **Severity**: High
- **Status**: Open


### ERROR-015 - Employees - Create all optional fields
- **Date**: 2026-05-28
- **Module**: Employees
- **Test**: Create all optional fields
- **Expected**: HTTP 201
- **Actual**: HTTP 400
- **Severity**: Medium
- **Status**: Open


### ERROR-016 - Employees - Create duplicate employee_code
- **Date**: 2026-05-28
- **Module**: Employees
- **Test**: Create duplicate employee_code
- **Expected**: HTTP 409
- **Actual**: HTTP 400
- **Severity**: Medium
- **Status**: Open


### ERROR-017 - Attendance - Get stats
- **Date**: 2026-05-28
- **Module**: Attendance
- **Test**: Get stats
- **Expected**: HTTP 200
- **Actual**: HTTP 404
- **Severity**: Medium
- **Status**: Open


### ERROR-018 - Attendance - Get stats without auth
- **Date**: 2026-05-28
- **Module**: Attendance
- **Test**: Get stats without auth
- **Expected**: HTTP 401
- **Actual**: HTTP 404
- **Severity**: Medium
- **Status**: Open


### ERROR-019 - Leaves - Apply leave valid
- **Date**: 2026-05-28
- **Module**: Leaves
- **Test**: Apply leave valid
- **Expected**: HTTP 201
- **Actual**: HTTP 400
- **Severity**: Medium
- **Status**: Open


### ERROR-020 - Leaves - Apply leave SQL injection
- **Date**: 2026-05-28
- **Module**: Leaves
- **Test**: Apply leave SQL injection
- **Expected**: HTTP 201
- **Actual**: HTTP 400
- **Severity**: High
- **Status**: Open


### ERROR-021 - Recruitment - Create job duplicate title
- **Date**: 2026-05-28
- **Module**: Recruitment
- **Test**: Create job duplicate title
- **Expected**: HTTP 409
- **Actual**: HTTP 400
- **Severity**: Medium
- **Status**: Open


### ERROR-022 - Recruitment - Create job SQL injection
- **Date**: 2026-05-28
- **Module**: Recruitment
- **Test**: Create job SQL injection
- **Expected**: HTTP 201
- **Actual**: HTTP 400
- **Severity**: High
- **Status**: Open


### ERROR-023 - Recruitment - List jobs public
- **Date**: 2026-05-28
- **Module**: Recruitment
- **Test**: List jobs public
- **Expected**: HTTP 200
- **Actual**: HTTP 401
- **Severity**: Medium
- **Status**: Open


### ERROR-024 - Recruitment - Apply to job
- **Date**: 2026-05-28
- **Module**: Recruitment
- **Test**: Apply to job
- **Expected**: HTTP 201
- **Actual**: HTTP 400
- **Severity**: Medium
- **Status**: Open


### ERROR-025 - Chat - Send DM
- **Date**: 2026-05-28
- **Module**: Chat
- **Test**: Send DM
- **Expected**: HTTP 201
- **Actual**: HTTP 404
- **Severity**: Medium
- **Status**: Open


### ERROR-026 - Chat - Send DM empty message
- **Date**: 2026-05-28
- **Module**: Chat
- **Test**: Send DM empty message
- **Expected**: HTTP 400
- **Actual**: HTTP 404
- **Severity**: Medium
- **Status**: Open


### ERROR-027 - Chat - Send DM without auth
- **Date**: 2026-05-28
- **Module**: Chat
- **Test**: Send DM without auth
- **Expected**: HTTP 401
- **Actual**: HTTP 404
- **Severity**: Medium
- **Status**: Open


### ERROR-028 - Chat - Send DM SQL injection
- **Date**: 2026-05-28
- **Module**: Chat
- **Test**: Send DM SQL injection
- **Expected**: HTTP 201
- **Actual**: HTTP 404
- **Severity**: High
- **Status**: Open


### ERROR-029 - Chat - Send DM XSS
- **Date**: 2026-05-28
- **Module**: Chat
- **Test**: Send DM XSS
- **Expected**: HTTP 201
- **Actual**: HTTP 404
- **Severity**: High
- **Status**: Open


### ERROR-030 - Chat - Get messages
- **Date**: 2026-05-28
- **Module**: Chat
- **Test**: Get messages
- **Expected**: HTTP 200
- **Actual**: HTTP 404
- **Severity**: Medium
- **Status**: Open


### ERROR-031 - Performance - Create goal
- **Date**: 2026-05-28
- **Module**: Performance
- **Test**: Create goal
- **Expected**: HTTP 201
- **Actual**: HTTP 400
- **Severity**: Medium
- **Status**: Open


### ERROR-032 - Performance - Create goal missing title
- **Date**: 2026-05-28
- **Module**: Performance
- **Test**: Create goal missing title
- **Expected**: HTTP 400
- **Actual**: HTTP 500
- **Severity**: Medium
- **Status**: Open


### ERROR-033 - Performance - Create review
- **Date**: 2026-05-28
- **Module**: Performance
- **Test**: Create review
- **Expected**: HTTP 201
- **Actual**: HTTP 400
- **Severity**: Medium
- **Status**: Open


### ERROR-034 - Performance - Create cycle
- **Date**: 2026-05-28
- **Module**: Performance
- **Test**: Create cycle
- **Expected**: HTTP 201
- **Actual**: HTTP 500
- **Severity**: Medium
- **Status**: Open


### ERROR-035 - Performance - Create cycle missing name
- **Date**: 2026-05-28
- **Module**: Performance
- **Test**: Create cycle missing name
- **Expected**: HTTP 400
- **Actual**: HTTP 500
- **Severity**: Medium
- **Status**: Open


### ERROR-036 - Assets - Create asset missing name
- **Date**: 2026-05-28
- **Module**: Assets
- **Test**: Create asset missing name
- **Expected**: HTTP 400
- **Actual**: HTTP 500
- **Severity**: Medium
- **Status**: Open


### ERROR-037 - Assets - Create asset missing type
- **Date**: 2026-05-28
- **Module**: Assets
- **Test**: Create asset missing type
- **Expected**: HTTP 400
- **Actual**: HTTP 500
- **Severity**: Medium
- **Status**: Open


### ERROR-038 - Settings - Create setting
- **Date**: 2026-05-28
- **Module**: Settings
- **Test**: Create setting
- **Expected**: HTTP 201
- **Actual**: HTTP 400
- **Severity**: Medium
- **Status**: Open


### ERROR-039 - Settings - Create duplicate key
- **Date**: 2026-05-28
- **Module**: Settings
- **Test**: Create duplicate key
- **Expected**: HTTP 409
- **Actual**: HTTP 400
- **Severity**: Medium
- **Status**: Open


### ERROR-040 - Settings - Create SQL injection
- **Date**: 2026-05-28
- **Module**: Settings
- **Test**: Create SQL injection
- **Expected**: HTTP 201
- **Actual**: HTTP 400
- **Severity**: High
- **Status**: Open


### ERROR-041 - Settings - Get by key
- **Date**: 2026-05-28
- **Module**: Settings
- **Test**: Get by key
- **Expected**: HTTP 200
- **Actual**: HTTP 404
- **Severity**: Medium
- **Status**: Open


### ERROR-042 - Settings - Update setting
- **Date**: 2026-05-28
- **Module**: Settings
- **Test**: Update setting
- **Expected**: HTTP 200
- **Actual**: HTTP 404
- **Severity**: Medium
- **Status**: Open


### ERROR-043 - Holidays - Create holiday
- **Date**: 2026-05-28
- **Module**: Holidays
- **Test**: Create holiday
- **Expected**: HTTP 201
- **Actual**: HTTP 500
- **Severity**: Medium
- **Status**: Open


### ERROR-044 - Shifts - Create shift
- **Date**: 2026-05-28
- **Module**: Shifts
- **Test**: Create shift
- **Expected**: HTTP 201
- **Actual**: HTTP 500
- **Severity**: Medium
- **Status**: Open


### ERROR-045 - Shifts - Create shift missing name
- **Date**: 2026-05-28
- **Module**: Shifts
- **Test**: Create shift missing name
- **Expected**: HTTP 400
- **Actual**: HTTP 500
- **Severity**: Medium
- **Status**: Open


### ERROR-046 - Shifts - Create shift missing start_time
- **Date**: 2026-05-28
- **Module**: Shifts
- **Test**: Create shift missing start_time
- **Expected**: HTTP 400
- **Actual**: HTTP 500
- **Severity**: Medium
- **Status**: Open


### ERROR-047 - Shifts - Create shift duplicate name
- **Date**: 2026-05-28
- **Module**: Shifts
- **Test**: Create shift duplicate name
- **Expected**: HTTP 409
- **Actual**: HTTP 500
- **Severity**: Medium
- **Status**: Open


### ERROR-048 - Shifts - Create shift negative grace
- **Date**: 2026-05-28
- **Module**: Shifts
- **Test**: Create shift negative grace
- **Expected**: HTTP 400
- **Actual**: HTTP 500
- **Severity**: Medium
- **Status**: Open


### ERROR-049 - Shifts - Assign shift missing employee
- **Date**: 2026-05-28
- **Module**: Shifts
- **Test**: Assign shift missing employee
- **Expected**: HTTP 400
- **Actual**: HTTP 500
- **Severity**: Medium
- **Status**: Open


### ERROR-050 - Reports - Leave report
- **Date**: 2026-05-28
- **Module**: Reports
- **Test**: Leave report
- **Expected**: HTTP 200
- **Actual**: HTTP 404
- **Severity**: Medium
- **Status**: Open


### ERROR-051 - Reports - Employee report
- **Date**: 2026-05-28
- **Module**: Reports
- **Test**: Employee report
- **Expected**: HTTP 200
- **Actual**: HTTP 404
- **Severity**: Medium
- **Status**: Open


### ERROR-052 - CMS_Blog - Create blog post
- **Date**: 2026-05-28
- **Module**: CMS_Blog
- **Test**: Create blog post
- **Expected**: HTTP 201
- **Actual**: HTTP 400
- **Severity**: Medium
- **Status**: Open


### ERROR-053 - CMS_Blog - Create CMS page
- **Date**: 2026-05-28
- **Module**: CMS_Blog
- **Test**: Create CMS page
- **Expected**: HTTP 201
- **Actual**: HTTP 404
- **Severity**: Medium
- **Status**: Open


### ERROR-054 - CMS_Blog - Create CMS missing slug
- **Date**: 2026-05-28
- **Module**: CMS_Blog
- **Test**: Create CMS missing slug
- **Expected**: HTTP 400
- **Actual**: HTTP 404
- **Severity**: Medium
- **Status**: Open


### ERROR-055 - CMS_Blog - Create CMS duplicate slug
- **Date**: 2026-05-28
- **Module**: CMS_Blog
- **Test**: Create CMS duplicate slug
- **Expected**: HTTP 409
- **Actual**: HTTP 404
- **Severity**: Medium
- **Status**: Open


### ERROR-056 - CMS_Blog - Create CMS without auth
- **Date**: 2026-05-28
- **Module**: CMS_Blog
- **Test**: Create CMS without auth
- **Expected**: HTTP 401
- **Actual**: HTTP 404
- **Severity**: Medium
- **Status**: Open


### ERROR-057 - CMS_Blog - Get published page (public)
- **Date**: 2026-05-28
- **Module**: CMS_Blog
- **Test**: Get published page (public)
- **Expected**: HTTP 200
- **Actual**: HTTP 404
- **Severity**: Medium
- **Status**: Open


### ERROR-058 - Support - Create FAQ
- **Date**: 2026-05-28
- **Module**: Support
- **Test**: Create FAQ
- **Expected**: HTTP 201
- **Actual**: HTTP 400
- **Severity**: Medium
- **Status**: Open


### ERROR-059 - Support - List FAQs (public)
- **Date**: 2026-05-28
- **Module**: Support
- **Test**: List FAQs (public)
- **Expected**: HTTP 200
- **Actual**: HTTP 401
- **Severity**: Medium
- **Status**: Open


### ERROR-060 - Support - AI ask
- **Date**: 2026-05-28
- **Module**: Support
- **Test**: AI ask
- **Expected**: HTTP 200
- **Actual**: HTTP 400
- **Severity**: Medium
- **Status**: Open


### ERROR-061 - Support - Start support chat
- **Date**: 2026-05-28
- **Module**: Support
- **Test**: Start support chat
- **Expected**: HTTP 201
- **Actual**: HTTP 404
- **Severity**: Medium
- **Status**: Open


### ERROR-062 - Support - Start chat without message
- **Date**: 2026-05-28
- **Module**: Support
- **Test**: Start chat without message
- **Expected**: HTTP 400
- **Actual**: HTTP 404
- **Severity**: Medium
- **Status**: Open


### ERROR-063 - Support - Get chat history
- **Date**: 2026-05-28
- **Module**: Support
- **Test**: Get chat history
- **Expected**: HTTP 200
- **Actual**: HTTP 404
- **Severity**: Medium
- **Status**: Open


### ERROR-064 - Tenants_Leads - Submit demo request
- **Date**: 2026-05-28
- **Module**: Tenants_Leads
- **Test**: Submit demo request
- **Expected**: HTTP 201
- **Actual**: HTTP 404
- **Severity**: Medium
- **Status**: Open


### ERROR-065 - Tenants_Leads - Submit lead missing email
- **Date**: 2026-05-28
- **Module**: Tenants_Leads
- **Test**: Submit lead missing email
- **Expected**: HTTP 400
- **Actual**: HTTP 404
- **Severity**: Medium
- **Status**: Open


### ERROR-066 - Tenants_Leads - Submit lead missing name
- **Date**: 2026-05-28
- **Module**: Tenants_Leads
- **Test**: Submit lead missing name
- **Expected**: HTTP 400
- **Actual**: HTTP 404
- **Severity**: Medium
- **Status**: Open


### ERROR-067 - Tenants_Leads - Submit lead invalid email
- **Date**: 2026-05-28
- **Module**: Tenants_Leads
- **Test**: Submit lead invalid email
- **Expected**: HTTP 400
- **Actual**: HTTP 404
- **Severity**: Medium
- **Status**: Open


### ERROR-068 - Tenants_Leads - Create device missing IP
- **Date**: 2026-05-28
- **Module**: Tenants_Leads
- **Test**: Create device missing IP
- **Expected**: HTTP 400
- **Actual**: HTTP 404
- **Severity**: Medium
- **Status**: Open


### ERROR-069 - Tenants_Leads - Create device without auth
- **Date**: 2026-05-28
- **Module**: Tenants_Leads
- **Test**: Create device without auth
- **Expected**: HTTP 401
- **Actual**: HTTP 404
- **Severity**: Medium
- **Status**: Open


### ERROR-070 - Tenants_Leads - List devices
- **Date**: 2026-05-28
- **Module**: Tenants_Leads
- **Test**: List devices
- **Expected**: HTTP 200
- **Actual**: HTTP 404
- **Severity**: Medium
- **Status**: Open


### ERROR-071 - Remaining - Create email template
- **Date**: 2026-05-28
- **Module**: Remaining
- **Test**: Create email template
- **Expected**: HTTP 201
- **Actual**: HTTP 400
- **Severity**: Medium
- **Status**: Open


### ERROR-072 - Remaining - Create template SQL injection
- **Date**: 2026-05-28
- **Module**: Remaining
- **Test**: Create template SQL injection
- **Expected**: HTTP 201
- **Actual**: HTTP 400
- **Severity**: High
- **Status**: Open


### ERROR-073 - Remaining - Get public mobile config
- **Date**: 2026-05-28
- **Module**: Remaining
- **Test**: Get public mobile config
- **Expected**: HTTP 200
- **Actual**: HTTP 404
- **Severity**: Medium
- **Status**: Open


### ERROR-001 - Auth - Login SQL injection
- **Date**: 2026-05-28
- **Module**: Auth
- **Test**: Login SQL injection
- **Expected**: HTTP 401
- **Actual**: HTTP 400
- **Severity**: High
- **Status**: Open


### ERROR-002 - Auth - Login rate limit (rapid)
- **Date**: 2026-05-28
- **Module**: Auth
- **Test**: Login rate limit (rapid)
- **Expected**: HTTP 429
- **Actual**: HTTP 401
- **Severity**: Medium
- **Status**: Open


### ERROR-003 - Auth - Get permissions with auth
- **Date**: 2026-05-28
- **Module**: Auth
- **Test**: Get permissions with auth
- **Expected**: HTTP 200
- **Actual**: HTTP 404
- **Severity**: Medium
- **Status**: Open


### ERROR-004 - Auth - Get permissions without auth
- **Date**: 2026-05-28
- **Module**: Auth
- **Test**: Get permissions without auth
- **Expected**: HTTP 401
- **Actual**: HTTP 404
- **Severity**: Medium
- **Status**: Open


### ERROR-005 - Departments - Create with valid name
- **Date**: 2026-05-28
- **Module**: Departments
- **Test**: Create with valid name
- **Expected**: HTTP 201
- **Actual**: HTTP 400
- **Severity**: Medium
- **Status**: Open


### ERROR-006 - Departments - Create duplicate name
- **Date**: 2026-05-28
- **Module**: Departments
- **Test**: Create duplicate name
- **Expected**: HTTP 409
- **Actual**: HTTP 400
- **Severity**: Medium
- **Status**: Open


### ERROR-007 - Departments - Create SQL injection
- **Date**: 2026-05-28
- **Module**: Departments
- **Test**: Create SQL injection
- **Expected**: HTTP 201
- **Actual**: HTTP 400
- **Severity**: High
- **Status**: Open


### ERROR-008 - Departments - Create XSS in name
- **Date**: 2026-05-28
- **Module**: Departments
- **Test**: Create XSS in name
- **Expected**: HTTP 201
- **Actual**: HTTP 400
- **Severity**: High
- **Status**: Open


### ERROR-009 - Departments - Create with special chars
- **Date**: 2026-05-28
- **Module**: Departments
- **Test**: Create with special chars
- **Expected**: HTTP 201
- **Actual**: HTTP 400
- **Severity**: Medium
- **Status**: Open


### ERROR-010 - Departments - Update non-existent
- **Date**: 2026-05-28
- **Module**: Departments
- **Test**: Update non-existent
- **Expected**: HTTP 404
- **Actual**: HTTP 400
- **Severity**: Medium
- **Status**: Open


### ERROR-011 - Employees - Create with required fields
- **Date**: 2026-05-28
- **Module**: Employees
- **Test**: Create with required fields
- **Expected**: HTTP 201
- **Actual**: HTTP 400
- **Severity**: Medium
- **Status**: Open


### ERROR-012 - Employees - Create duplicate email
- **Date**: 2026-05-28
- **Module**: Employees
- **Test**: Create duplicate email
- **Expected**: HTTP 409
- **Actual**: HTTP 400
- **Severity**: Medium
- **Status**: Open


### ERROR-013 - Employees - Create SQL injection
- **Date**: 2026-05-28
- **Module**: Employees
- **Test**: Create SQL injection
- **Expected**: HTTP 201
- **Actual**: HTTP 400
- **Severity**: High
- **Status**: Open


### ERROR-014 - Employees - Create XSS
- **Date**: 2026-05-28
- **Module**: Employees
- **Test**: Create XSS
- **Expected**: HTTP 201
- **Actual**: HTTP 400
- **Severity**: High
- **Status**: Open


### ERROR-015 - Employees - Create all optional fields
- **Date**: 2026-05-28
- **Module**: Employees
- **Test**: Create all optional fields
- **Expected**: HTTP 201
- **Actual**: HTTP 400
- **Severity**: Medium
- **Status**: Open


### ERROR-016 - Employees - Create duplicate employee_code
- **Date**: 2026-05-28
- **Module**: Employees
- **Test**: Create duplicate employee_code
- **Expected**: HTTP 409
- **Actual**: HTTP 400
- **Severity**: Medium
- **Status**: Open


### ERROR-017 - Attendance - Get stats
- **Date**: 2026-05-28
- **Module**: Attendance
- **Test**: Get stats
- **Expected**: HTTP 200
- **Actual**: HTTP 404
- **Severity**: Medium
- **Status**: Open


### ERROR-018 - Attendance - Get stats without auth
- **Date**: 2026-05-28
- **Module**: Attendance
- **Test**: Get stats without auth
- **Expected**: HTTP 401
- **Actual**: HTTP 404
- **Severity**: Medium
- **Status**: Open


### ERROR-019 - Leaves - Apply leave valid
- **Date**: 2026-05-28
- **Module**: Leaves
- **Test**: Apply leave valid
- **Expected**: HTTP 201
- **Actual**: HTTP 400
- **Severity**: Medium
- **Status**: Open


### ERROR-020 - Leaves - Apply leave SQL injection
- **Date**: 2026-05-28
- **Module**: Leaves
- **Test**: Apply leave SQL injection
- **Expected**: HTTP 201
- **Actual**: HTTP 400
- **Severity**: High
- **Status**: Open


### ERROR-021 - Recruitment - Create job duplicate title
- **Date**: 2026-05-28
- **Module**: Recruitment
- **Test**: Create job duplicate title
- **Expected**: HTTP 409
- **Actual**: HTTP 400
- **Severity**: Medium
- **Status**: Open


### ERROR-022 - Recruitment - Create job SQL injection
- **Date**: 2026-05-28
- **Module**: Recruitment
- **Test**: Create job SQL injection
- **Expected**: HTTP 201
- **Actual**: HTTP 400
- **Severity**: High
- **Status**: Open


### ERROR-023 - Recruitment - List jobs public
- **Date**: 2026-05-28
- **Module**: Recruitment
- **Test**: List jobs public
- **Expected**: HTTP 200
- **Actual**: HTTP 401
- **Severity**: Medium
- **Status**: Open


### ERROR-024 - Recruitment - Apply to job
- **Date**: 2026-05-28
- **Module**: Recruitment
- **Test**: Apply to job
- **Expected**: HTTP 201
- **Actual**: HTTP 400
- **Severity**: Medium
- **Status**: Open


### ERROR-025 - Chat - Send DM
- **Date**: 2026-05-28
- **Module**: Chat
- **Test**: Send DM
- **Expected**: HTTP 201
- **Actual**: HTTP 404
- **Severity**: Medium
- **Status**: Open


### ERROR-026 - Chat - Send DM empty message
- **Date**: 2026-05-28
- **Module**: Chat
- **Test**: Send DM empty message
- **Expected**: HTTP 400
- **Actual**: HTTP 404
- **Severity**: Medium
- **Status**: Open


### ERROR-027 - Chat - Send DM without auth
- **Date**: 2026-05-28
- **Module**: Chat
- **Test**: Send DM without auth
- **Expected**: HTTP 401
- **Actual**: HTTP 404
- **Severity**: Medium
- **Status**: Open


### ERROR-028 - Chat - Send DM SQL injection
- **Date**: 2026-05-28
- **Module**: Chat
- **Test**: Send DM SQL injection
- **Expected**: HTTP 201
- **Actual**: HTTP 404
- **Severity**: High
- **Status**: Open


### ERROR-029 - Chat - Send DM XSS
- **Date**: 2026-05-28
- **Module**: Chat
- **Test**: Send DM XSS
- **Expected**: HTTP 201
- **Actual**: HTTP 404
- **Severity**: High
- **Status**: Open


### ERROR-030 - Chat - Get messages
- **Date**: 2026-05-28
- **Module**: Chat
- **Test**: Get messages
- **Expected**: HTTP 200
- **Actual**: HTTP 404
- **Severity**: Medium
- **Status**: Open


### ERROR-031 - Performance - Create goal
- **Date**: 2026-05-28
- **Module**: Performance
- **Test**: Create goal
- **Expected**: HTTP 201
- **Actual**: HTTP 400
- **Severity**: Medium
- **Status**: Open


### ERROR-032 - Performance - Create review
- **Date**: 2026-05-28
- **Module**: Performance
- **Test**: Create review
- **Expected**: HTTP 201
- **Actual**: HTTP 400
- **Severity**: Medium
- **Status**: Open


### ERROR-033 - Reports - Leave report
- **Date**: 2026-05-28
- **Module**: Reports
- **Test**: Leave report
- **Expected**: HTTP 200
- **Actual**: HTTP 404
- **Severity**: Medium
- **Status**: Open


### ERROR-034 - Reports - Employee report
- **Date**: 2026-05-28
- **Module**: Reports
- **Test**: Employee report
- **Expected**: HTTP 200
- **Actual**: HTTP 404
- **Severity**: Medium
- **Status**: Open


### ERROR-035 - CMS_Blog - Create blog post
- **Date**: 2026-05-28
- **Module**: CMS_Blog
- **Test**: Create blog post
- **Expected**: HTTP 201
- **Actual**: HTTP 400
- **Severity**: Medium
- **Status**: Open


### ERROR-036 - CMS_Blog - Create CMS page
- **Date**: 2026-05-28
- **Module**: CMS_Blog
- **Test**: Create CMS page
- **Expected**: HTTP 201
- **Actual**: HTTP 404
- **Severity**: Medium
- **Status**: Open


### ERROR-037 - CMS_Blog - Create CMS missing slug
- **Date**: 2026-05-28
- **Module**: CMS_Blog
- **Test**: Create CMS missing slug
- **Expected**: HTTP 400
- **Actual**: HTTP 404
- **Severity**: Medium
- **Status**: Open


### ERROR-038 - CMS_Blog - Create CMS duplicate slug
- **Date**: 2026-05-28
- **Module**: CMS_Blog
- **Test**: Create CMS duplicate slug
- **Expected**: HTTP 409
- **Actual**: HTTP 404
- **Severity**: Medium
- **Status**: Open


### ERROR-039 - CMS_Blog - Create CMS without auth
- **Date**: 2026-05-28
- **Module**: CMS_Blog
- **Test**: Create CMS without auth
- **Expected**: HTTP 401
- **Actual**: HTTP 404
- **Severity**: Medium
- **Status**: Open


### ERROR-040 - CMS_Blog - Get published page (public)
- **Date**: 2026-05-28
- **Module**: CMS_Blog
- **Test**: Get published page (public)
- **Expected**: HTTP 200
- **Actual**: HTTP 404
- **Severity**: Medium
- **Status**: Open


### ERROR-041 - Support - Create FAQ
- **Date**: 2026-05-28
- **Module**: Support
- **Test**: Create FAQ
- **Expected**: HTTP 201
- **Actual**: HTTP 400
- **Severity**: Medium
- **Status**: Open


### ERROR-042 - Support - List FAQs (public)
- **Date**: 2026-05-28
- **Module**: Support
- **Test**: List FAQs (public)
- **Expected**: HTTP 200
- **Actual**: HTTP 401
- **Severity**: Medium
- **Status**: Open


### ERROR-043 - Support - AI ask
- **Date**: 2026-05-28
- **Module**: Support
- **Test**: AI ask
- **Expected**: HTTP 200
- **Actual**: HTTP 400
- **Severity**: Medium
- **Status**: Open


### ERROR-044 - Support - Start support chat
- **Date**: 2026-05-28
- **Module**: Support
- **Test**: Start support chat
- **Expected**: HTTP 201
- **Actual**: HTTP 404
- **Severity**: Medium
- **Status**: Open


### ERROR-045 - Support - Start chat without message
- **Date**: 2026-05-28
- **Module**: Support
- **Test**: Start chat without message
- **Expected**: HTTP 400
- **Actual**: HTTP 404
- **Severity**: Medium
- **Status**: Open


### ERROR-046 - Support - Get chat history
- **Date**: 2026-05-28
- **Module**: Support
- **Test**: Get chat history
- **Expected**: HTTP 200
- **Actual**: HTTP 404
- **Severity**: Medium
- **Status**: Open


### ERROR-047 - Tenants_Leads - Submit demo request
- **Date**: 2026-05-28
- **Module**: Tenants_Leads
- **Test**: Submit demo request
- **Expected**: HTTP 201
- **Actual**: HTTP 404
- **Severity**: Medium
- **Status**: Open


### ERROR-048 - Tenants_Leads - Submit lead missing email
- **Date**: 2026-05-28
- **Module**: Tenants_Leads
- **Test**: Submit lead missing email
- **Expected**: HTTP 400
- **Actual**: HTTP 404
- **Severity**: Medium
- **Status**: Open


### ERROR-049 - Tenants_Leads - Submit lead missing name
- **Date**: 2026-05-28
- **Module**: Tenants_Leads
- **Test**: Submit lead missing name
- **Expected**: HTTP 400
- **Actual**: HTTP 404
- **Severity**: Medium
- **Status**: Open


### ERROR-050 - Tenants_Leads - Submit lead invalid email
- **Date**: 2026-05-28
- **Module**: Tenants_Leads
- **Test**: Submit lead invalid email
- **Expected**: HTTP 400
- **Actual**: HTTP 404
- **Severity**: Medium
- **Status**: Open


### ERROR-051 - Tenants_Leads - Create device missing IP
- **Date**: 2026-05-28
- **Module**: Tenants_Leads
- **Test**: Create device missing IP
- **Expected**: HTTP 400
- **Actual**: HTTP 404
- **Severity**: Medium
- **Status**: Open


### ERROR-052 - Tenants_Leads - Create device without auth
- **Date**: 2026-05-28
- **Module**: Tenants_Leads
- **Test**: Create device without auth
- **Expected**: HTTP 401
- **Actual**: HTTP 404
- **Severity**: Medium
- **Status**: Open


### ERROR-053 - Tenants_Leads - List devices
- **Date**: 2026-05-28
- **Module**: Tenants_Leads
- **Test**: List devices
- **Expected**: HTTP 200
- **Actual**: HTTP 404
- **Severity**: Medium
- **Status**: Open


### ERROR-054 - Remaining - Create email template
- **Date**: 2026-05-28
- **Module**: Remaining
- **Test**: Create email template
- **Expected**: HTTP 201
- **Actual**: HTTP 400
- **Severity**: Medium
- **Status**: Open


### ERROR-055 - Remaining - Create template SQL injection
- **Date**: 2026-05-28
- **Module**: Remaining
- **Test**: Create template SQL injection
- **Expected**: HTTP 201
- **Actual**: HTTP 400
- **Severity**: High
- **Status**: Open


### ERROR-056 - Remaining - Get public mobile config
- **Date**: 2026-05-28
- **Module**: Remaining
- **Test**: Get public mobile config
- **Expected**: HTTP 200
- **Actual**: HTTP 404
- **Severity**: Medium
- **Status**: Open


### ERROR-057 - Payroll - Create payroll run
- **Date**: 2026-05-28
- **Module**: Payroll
- **Test**: Create payroll run
- **Expected**: HTTP 201
- **Actual**: HTTP 409
- **Severity**: Medium
- **Status**: Open


### ERROR-001 - Leaves - Apply leave valid
- **Date**: 2026-05-28
- **Module**: Leaves
- **Test**: Apply leave valid
- **Expected**: HTTP 201
- **Actual**: HTTP 400
- **Severity**: Medium
- **Status**: Open


### ERROR-002 - Leaves - Apply leave SQL injection
- **Date**: 2026-05-28
- **Module**: Leaves
- **Test**: Apply leave SQL injection
- **Expected**: HTTP 201
- **Actual**: HTTP 400
- **Severity**: High
- **Status**: Open


### ERROR-003 - Recruitment - Apply to job
- **Date**: 2026-05-28
- **Module**: Recruitment
- **Test**: Apply to job
- **Expected**: HTTP 201
- **Actual**: HTTP 400
- **Severity**: Medium
- **Status**: Open


### ERROR-004 - Performance - Create goal
- **Date**: 2026-05-28
- **Module**: Performance
- **Test**: Create goal
- **Expected**: HTTP 201
- **Actual**: HTTP 400
- **Severity**: +
- **Status**: Open


### ERROR-005 - Performance - Create goal without auth
- **Date**: 2026-05-28
- **Module**: Performance
- **Test**: Create goal without auth
- **Expected**: HTTP 401
- **Actual**: Invalid JSON primitive: Cannot.
- **Severity**: 197
- **Status**: Open


### ERROR-006 - Performance - Create review
- **Date**: 2026-05-28
- **Module**: Performance
- **Test**: Create review
- **Expected**: HTTP 201
- **Actual**: HTTP 400
- **Severity**: +
- **Status**: Open


### ERROR-007 - Settings - Create setting
- **Date**: 2026-05-28
- **Module**: Settings
- **Test**: Create setting
- **Expected**: HTTP 201
- **Actual**: HTTP 409
- **Severity**: Medium
- **Status**: Open


### ERROR-008 - Settings - Create SQL injection
- **Date**: 2026-05-28
- **Module**: Settings
- **Test**: Create SQL injection
- **Expected**: HTTP 201
- **Actual**: HTTP 409
- **Severity**: High
- **Status**: Open


### ERROR-009 - Support - Create FAQ
- **Date**: 2026-05-28
- **Module**: Support
- **Test**: Create FAQ
- **Expected**: HTTP 201
- **Actual**: HTTP 400
- **Severity**: +
- **Status**: Open


### ERROR-010 - Support - Create FAQ without auth
- **Date**: 2026-05-28
- **Module**: Support
- **Test**: Create FAQ without auth
- **Expected**: HTTP 401
- **Actual**: Invalid JSON primitive: Cannot.
- **Severity**: 1
- **Status**: Open


### ERROR-011 - Support - Get chat history
- **Date**: 2026-05-28
- **Module**: Support
- **Test**: Get chat history
- **Expected**: HTTP 200
- **Actual**: HTTP 404
- **Severity**: Medium
- **Status**: Open


### ERROR-012 - Tenants_Leads - Submit demo request
- **Date**: 2026-05-28
- **Module**: Tenants_Leads
- **Test**: Submit demo request
- **Expected**: HTTP 201
- **Actual**: HTTP 400
- **Severity**: Medium
- **Status**: Open


### ERROR-013 - Remaining - Create template missing body
- **Date**: 2026-05-28
- **Module**: Remaining
- **Test**: Create template missing body
- **Expected**: HTTP 201
- **Actual**: HTTP 400
- **Severity**: Medium
- **Status**: Open

