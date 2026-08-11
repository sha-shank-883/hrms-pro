# HRMS Backend API Endpoints Summary

**Generated:** May 8, 2026  
**Base URL:** `/api`  
**Authentication:** JWT Token (Bearer token in Authorization header)  
**Database:** PostgreSQL  

---

## Table of Contents

1. [Authentication](#authentication)
2. [Leaves Management](#leaves-management)
3. [Tasks Management](#tasks-management)
4. [Employees Management](#employees-management)
5. [Attendance Management](#attendance-management)
6. [Payroll Management](#payroll-management)
7. [Recruitment Management](#recruitment-management)
8. [Performance Management](#performance-management)
9. [Settings](#settings)
10. [Known Issues & Missing Endpoints](#known-issues--missing-endpoints)

---

## Authentication

### Authentication Middleware Requirements
- **Middleware:** `authenticateToken` - Verifies JWT token in `Authorization: Bearer {token}` header
- **Token Format:** JWT signed with `JWT_SECRET` environment variable
- **Token Expiry:** Configurable via `JWT_EXPIRE` (default: 24h)
- **Role-Based Access:** `authorizeRole()` and `authorizeRoleOrPermission()` middleware
- **Valid Roles:** `admin`, `manager`, `employee`

### Auth Endpoints

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|-----------------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | Login and get JWT token | No |
| GET | `/auth/profile` | Get current user profile | **Yes** |
| PUT | `/auth/change-password` | Change own password | **Yes** |
| PUT | `/auth/change-password/:userId` | Admin change user password | **Yes** + Admin |
| PUT | `/auth/permissions/:userId` | Update user permissions | **Yes** + Admin |
| POST | `/auth/forgot-password` | Request password reset | No |
| POST | `/auth/reset-password/:token` | Reset password with token | No |
| POST | `/auth/2fa/setup` | Setup 2-factor authentication | **Yes** |
| POST | `/auth/2fa/verify-setup` | Verify 2FA setup | **Yes** |
| POST | `/auth/2fa/verify-login` | Verify 2FA during login | No |
| POST | `/auth/2fa/disable` | Disable 2FA | **Yes** |

### Register Request
```json
{
  "email": "user@example.com",
  "password": "password123",
  "role": "employee"  // optional: admin, manager, employee
}
```

### Login Request
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Login Response
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "userId": 1,
    "email": "user@example.com",
    "role": "employee"
  }
}
```

---

## Leaves Management

### Base Route: `/leaves`

### Endpoints

| Method | Endpoint | Purpose | Auth Required | Roles |
|--------|----------|---------|-----------------|-------|
| GET | `/leaves` | Get all leave requests | **Yes** | admin, manager, employee |
| GET | `/leaves/:id` | Get leave request by ID | **Yes** | admin, manager, employee |
| GET | `/leaves/statistics` | Get leave statistics | **Yes** | admin, manager, employee |
| GET | `/leaves/balance/:employee_id` | Get leave balance | **Yes** | admin, manager, employee |
| GET | `/leaves/balance` | Get all leave balances | **Yes** | admin, manager |
| POST | `/leaves` | Create leave request | **Yes** + Validation | admin, manager, employee |
| PUT | `/leaves/:id` | Update leave request | **Yes** + Validation | admin, manager, employee |
| PUT | `/leaves/:id/approve` | Approve leave request | **Yes** | admin, manager |
| PUT | `/leaves/:id/reject` | Reject leave request | **Yes** | admin, manager |
| DELETE | `/leaves/:id` | Delete leave request | **Yes** | admin, manager, employee |
| POST | `/leaves/comp-off` | Request comp-off | **Yes** | Any authenticated |
| PUT | `/leaves/comp-off/:id` | Update comp-off status | **Yes** | admin, manager |
| GET | `/leaves/comp-off` | Get comp-off requests | **Yes** | Any authenticated |

### Create/Update Leave Request

#### Request Body
```json
{
  "employee_id": 1,                    // Required for creation
  "leave_type": "annual",              // Required: annual, sick, casual, comp-off, etc.
  "start_date": "2026-05-15",         // Required: ISO 8601 format
  "end_date": "2026-05-17",           // Required: ISO 8601 format
  "reason": "Family emergency"         // Required
}
```

#### Validation Rules
- `employee_id`: Must be a valid integer
- `leave_type`: Must not be empty
- `start_date`: Must be ISO 8601 date format
- `end_date`: Must be ISO 8601 date format
- `reason`: Must not be empty
- **Business Logic:** 
  - Advance notice required (configurable, default: 3 days)
  - Cannot update leave requests that are already approved/rejected
  - Employees can only request their own leave (system resolves employee_id from userId)

#### Response
```json
{
  "success": true,
  "message": "Leave request submitted successfully",
  "data": {
    "leave_id": 5,
    "employee_id": 1,
    "leave_type": "annual",
    "start_date": "2026-05-15",
    "end_date": "2026-05-17",
    "days_count": 3,
    "reason": "Family emergency",
    "status": "pending",
    "approved_by": null,
    "approved_at": null,
    "created_at": "2026-05-08T10:30:00Z",
    "updated_at": "2026-05-08T10:30:00Z"
  }
}
```

### Approve Leave Request

#### Request Body
```json
{}  // No body required, approver determined from token
```

#### Response
```json
{
  "success": true,
  "message": "Leave request approved successfully",
  "data": {
    "leave_id": 5,
    "status": "approved",
    "approved_by": 2,
    "approved_at": "2026-05-08T10:35:00Z",
    "updated_at": "2026-05-08T10:35:00Z"
    // ... other fields
  }
}
```

### Get All Leave Requests (Paginated)

#### Query Parameters
- `employee_id` (integer): Filter by employee
- `status` (string): Filter by status (pending, approved, rejected)
- `start_date` (date): Filter by start date
- `end_date` (date): Filter by end date
- `page` (integer): Page number, default 1
- `limit` (integer): Items per page, default 10, max 100

#### Response
```json
{
  "success": true,
  "data": [
    {
      "leave_id": 1,
      "employee_id": 1,
      "employee_name": "John Doe",
      "department_name": "Engineering",
      "leave_type": "annual",
      "start_date": "2026-05-15",
      "end_date": "2026-05-17",
      "days_count": 3,
      "reason": "Family emergency",
      "status": "pending",
      "approver_email": null,
      "created_at": "2026-05-08T10:30:00Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 42,
    "itemsPerPage": 10,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## Tasks Management

### Base Route: `/tasks`

### Endpoints

| Method | Endpoint | Purpose | Auth Required | Roles |
|--------|----------|---------|-----------------|-------|
| GET | `/tasks` | Get all tasks | **Yes** | Any authenticated |
| GET | `/tasks/:id` | Get task by ID | **Yes** | Any authenticated |
| GET | `/tasks/statistics` | Get task statistics | **Yes** | Any authenticated |
| POST | `/tasks` | Create task | **Yes** + Validation | admin, manager |
| PUT | `/tasks/:id` | Update task | **Yes** + Validation | admin, manager |
| PUT | `/tasks/:id/status` | Update task status only | **Yes** | Any authenticated |
| DELETE | `/tasks/:id` | Delete task | **Yes** | admin, manager |
| POST | `/tasks/:task_id/updates` | Add task update | **Yes** | Any authenticated |
| GET | `/tasks/:task_id/updates` | Get task updates | **Yes** | Any authenticated |
| PUT | `/tasks/updates/:update_id` | Update task update | **Yes** | Any authenticated |
| DELETE | `/tasks/updates/:update_id` | Delete task update | **Yes** | Any authenticated |

### Create Task

#### Request Body
```json
{
  "title": "Fix login bug",                     // Required: Task title
  "description": "Login form not responding",   // Optional
  "priority": "high",                           // Optional: low, medium, high, urgent
  "status": "todo",                             // Optional: todo, in_progress, completed, cancelled
  "due_date": "2026-05-20",                     // Optional: ISO 8601 date
  "department_id": 2,                           // Optional: Valid department ID
  "estimated_hours": 8,                         // Optional: Decimal number
  "assigned_employees": [1, 2, 3],             // Optional: Array of employee IDs
  "category": "general"                         // Optional: general, onboarding, offboarding
}
```

#### Validation Rules
- `title`: Must not be empty
- `priority`: Must be one of ['low', 'medium', 'high', 'urgent']
- `status`: Must be one of ['todo', 'in_progress', 'completed', 'cancelled']
- `due_date`: Must be ISO 8601 format if provided
- `department_id`: Must be valid integer if provided
- `estimated_hours`: Must be decimal if provided
- `category`: Must be one of ['general', 'onboarding', 'offboarding']
- **Auto-set fields:** `created_by` from current user token

#### Response
```json
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "task_id": 1,
    "title": "Fix login bug",
    "description": "Login form not responding",
    "priority": "high",
    "status": "todo",
    "due_date": "2026-05-20",
    "created_by": 2,
    "department_id": 2,
    "estimated_hours": "8.00",
    "actual_hours": null,
    "progress": 0,
    "category": "general",
    "created_at": "2026-05-08T10:30:00Z",
    "updated_at": "2026-05-08T10:30:00Z"
  }
}
```

### Update Task

#### Request Body
```json
{
  "title": "Fix login bug - URGENT",
  "description": "Updated description",
  "priority": "urgent",
  "status": "in_progress",
  "due_date": "2026-05-18",
  "department_id": 2,
  "estimated_hours": 10,
  "actual_hours": 3,
  "progress": 30,
  "assigned_employees": [1, 2],
  "category": "general"
}
```

#### Authorization
- **Admin/Manager:** Can update all fields and any task
- **Employee:** Can only update tasks they created; limited fields allowed
- If employee updates their own task created field restriction applies

#### Response
```json
{
  "success": true,
  "message": "Task updated successfully",
  "data": {
    "task_id": 1,
    "title": "Fix login bug - URGENT",
    "status": "in_progress",
    "priority": "urgent",
    "progress": 30,
    // ... other fields
  }
}
```

### Update Task Status

#### Request Body
```json
{
  "status": "in_progress"  // Required: todo, in_progress, completed, cancelled
}
```

#### Response
```json
{
  "success": true,
  "message": "Task status updated successfully",
  "data": {
    "task_id": 1,
    "status": "in_progress",
    "updated_at": "2026-05-08T10:40:00Z"
    // ... other fields
  }
}
```

### Get All Tasks (Paginated)

#### Query Parameters
- `status` (string): Filter by status
- `priority` (string): Filter by priority
- `department_id` (integer): Filter by department
- `assigned_to` (integer): Filter by assigned employee ID
- `category` (string): Filter by category
- `search` (string): Search in title and description
- `page` (integer): Page number, default 1
- `limit` (integer): Items per page, default 10, max 100

#### Response
```json
{
  "success": true,
  "data": [
    {
      "task_id": 1,
      "title": "Fix login bug",
      "department_name": "Engineering",
      "created_by_email": "manager@example.com",
      "assigned_employees": [
        {"employee_id": 1, "user_id": 1, "first_name": "John", "last_name": "Doe"}
      ],
      "status": "in_progress",
      "priority": "high",
      "progress": 30
      // ... other fields
    }
  ],
  "pagination": { /* ... */ }
}
```

---

## Employees Management

### Base Route: `/employees`

### Endpoints

| Method | Endpoint | Purpose | Auth Required | Roles |
|--------|----------|---------|-----------------|-------|
| GET | `/employees` | Get all employees | **Yes** | admin, manager |
| GET | `/employees/chat` | Get employees for chat | **Yes** | Any authenticated |
| GET | `/employees/org-chart` | Get organizational chart | **Yes** | admin, manager |
| GET | `/employees/:id` | Get employee by ID | **Yes** | admin, manager, employee* |
| GET | `/employees/user/:userId` | Get employee by user ID | **Yes** | admin, manager, employee* |
| GET | `/employees/:id/qrcode` | Get employee QR code | **Yes** | admin, manager, employee* |
| POST | `/employees` | Create new employee | **Yes** | admin only |
| PUT | `/employees/:id` | Update employee | **Yes** | admin, manager, employee* |
| PATCH | `/employees/:id` | Partial update employee | **Yes** | admin, manager, employee* |
| DELETE | `/employees/:id` | Delete employee | **Yes** | admin only |
| POST | `/employees/delete-by-email` | Delete employee by email | **Yes** | admin only |

\* Employees can only access/update their own records

### Create Employee

#### Request Body
```json
{
  "first_name": "John",                      // Required
  "last_name": "Doe",                        // Required
  "email": "john.doe@example.com",           // Required: Valid email
  "phone": "+1-555-0123",                    // Optional
  "date_of_birth": "1990-05-15",             // Optional: ISO 8601
  "gender": "male",                          // Optional
  "address": "123 Main St, City",            // Optional
  "department_id": 2,                        // Optional: Valid department ID
  "position": "Software Engineer",           // Required
  "hire_date": "2026-05-01",                 // Required: ISO 8601
  "salary": 75000.00,                        // Optional: Decimal
  "employment_type": "full-time",            // Optional: full-time, part-time, contract
  "status": "active",                        // Optional: active, inactive, on_leave
  "reporting_manager_id": 5,                 // Optional: Valid employee ID
  "password": "tempPassword123",             // Optional: Default "employee123" if not provided
  "social_links": {},                        // Optional: JSON object
  "education": [],                           // Optional: Array of education records
  "experience": [],                          // Optional: Array of experience records
  "about_me": "Bio text"                     // Optional
}
```

#### Validation Rules
- `first_name`: Must not be empty
- `last_name`: Must not be empty
- `email`: Must be valid email format
- `position`: Must not be empty
- `hire_date`: Must be ISO 8601 format
- `department_id`: Must be valid integer if provided
- `salary`: Must be decimal if provided
- **Transaction Handling:** Creates both user and employee records
- **Default Values:** 
  - password: "employee123" if not provided
  - employment_type: "full-time"
  - status: "active"
  - hire_date: Today's date if not provided

#### Response
```json
{
  "success": true,
  "message": "Employee created successfully",
  "data": {
    "employee_id": 1,
    "user_id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "position": "Software Engineer",
    "department_id": 2,
    "salary": "75000.00",
    "employment_type": "full-time",
    "status": "active",
    "hire_date": "2026-05-01",
    "created_at": "2026-05-08T10:30:00Z"
    // ... other fields
  }
}
```

### Update Employee (Full)

#### Request Body (Admin/Manager)
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1-555-0123",
  "date_of_birth": "1990-05-15",
  "gender": "male",
  "address": "123 Main St, City",
  "department_id": 2,
  "position": "Senior Software Engineer",
  "salary": 85000.00,
  "employment_type": "full-time",
  "status": "active",
  "profile_image": "base64_or_url",
  "reporting_manager_id": 5,
  "social_links": {},
  "education": [],
  "experience": [],
  "about_me": "Bio text"
}
```

#### Request Body (Employee - Own Profile)
```json
{
  "first_name": "John",
  "phone": "+1-555-0123",
  "date_of_birth": "1990-05-15",
  "gender": "male",
  "address": "123 Main St, City",
  "profile_image": "base64_or_url",
  "about_me": "Bio text",
  "social_links": {},
  "education": [],
  "experience": []
  // Cannot update: department_id, position, salary, employment_type, status, reporting_manager_id
}
```

#### Authorization
- **Admin/Manager:** Can update all fields for any employee
- **Employee:** Can only update their own profile with limited fields

#### Response
```json
{
  "success": true,
  "message": "Employee updated successfully",
  "data": {
    "employee_id": 1,
    "first_name": "John",
    "position": "Senior Software Engineer",
    "salary": "85000.00",
    "updated_at": "2026-05-08T10:45:00Z"
    // ... other fields
  }
}
```

### Patch Employee

#### Request Body
```json
{
  "position": "Lead Engineer",
  "salary": 95000.00
  // Send only fields to update
}
```

#### Response
Similar to PUT response

### Get All Employees (Paginated)

#### Query Parameters
- `department_id` (integer): Filter by department
- `status` (string): Filter by status
- `search` (string): Search by name or email
- `page` (integer): Page number, default 1
- `limit` (integer): Items per page, default 10, max 100

#### Response
```json
{
  "success": true,
  "data": [
    {
      "employee_id": 1,
      "first_name": "John",
      "last_name": "Doe",
      "email": "john.doe@example.com",
      "position": "Software Engineer",
      "department_name": "Engineering",
      "user_email": "john.doe@example.com",
      "role": "employee",
      "status": "active",
      "hire_date": "2026-05-01",
      "salary": "75000.00",
      "created_at": "2026-05-08T10:30:00Z"
    }
  ],
  "pagination": { /* ... */ }
}
```

---

## Attendance Management

### Base Route: `/attendance`

### Endpoints

| Method | Endpoint | Purpose | Auth Required | Roles |
|--------|----------|---------|-----------------|-------|
| GET | `/attendance` | Get all attendance records | **Yes** | Any authenticated |
| GET | `/attendance/today` | Get today's attendance | **Yes** | Any authenticated |
| GET | `/attendance/history` | Get attendance history | **Yes** | Any authenticated |
| POST | `/attendance/clock-in` | Clock in | **Yes** + Validation | Any authenticated |
| POST | `/attendance/clock-out` | Clock out | **Yes** + Validation | Any authenticated |
| POST | `/attendance` | Create attendance record | **Yes** + Validation | admin, manager |
| PUT | `/attendance/:id` | Update attendance record | **Yes** | admin, manager |
| DELETE | `/attendance/:id` | Delete attendance record | **Yes** | admin only |
| POST | `/attendance/regularize` | Request attendance regularization | **Yes** | Any authenticated |
| PUT | `/attendance/regularize/:id` | Update regularization status | **Yes** | admin, manager |
| GET | `/attendance/regularize` | Get regularization requests | **Yes** | Any authenticated |

### Clock In

#### Request Body
```json
{
  "employee_id": 1,      // Optional: System resolves from userId if not provided
  "latitude": 40.7128,   // Optional: For geofencing
  "longitude": -74.0060  // Optional: For geofencing
}
```

#### Validation Rules
- `employee_id`: Must be valid integer
- **Business Logic:**
  - Cannot clock in twice on same day
  - Geofence check (if configured with `office_latitude`, `office_longitude`, `geofence_radius`)
  - Strict geofence mode blocks out-of-location check-ins
  - Grace period check against assigned shift (configurable)
  - Late status assigned if clock-in after shift start + grace period
  - Location status: 'inside', 'outside', 'unknown'

#### Response
```json
{
  "success": true,
  "message": "Clocked in successfully",
  "data": {
    "attendance_id": 1,
    "employee_id": 1,
    "date": "2026-05-08",
    "clock_in": "09:15:30",
    "clock_out": null,
    "status": "present",          // or "late"
    "work_hours": null,
    "check_in_latitude": 40.7128,
    "check_in_longitude": -74.0060,
    "location_status": "inside",  // or "outside", "unknown"
    "created_at": "2026-05-08T09:15:30Z"
  }
}
```

#### Possible Errors
```json
{
  "success": false,
  "message": "Already clocked in today"
}
```

```json
{
  "success": false,
  "message": "Clock-in blocked: You are outside the designated office geofence.",
  "distance": 1250  // Distance in meters
}
```

### Clock Out

#### Request Body
```json
{
  "employee_id": 1,      // Optional: System resolves from userId if not provided
  "latitude": 40.7128,   // Optional: For geofencing
  "longitude": -74.0060  // Optional: For geofencing
}
```

#### Business Logic
- Must have clocked in today
- Cannot clock out twice
- Geofence check (similar to clock-in)
- Calculates work hours automatically
- Checks for overtime if enabled (configurable with `overtime_enabled` setting)
- Updates location status

#### Response
```json
{
  "success": true,
  "message": "Clocked out successfully",
  "data": {
    "attendance_id": 1,
    "employee_id": 1,
    "date": "2026-05-08",
    "clock_in": "09:15:30",
    "clock_out": "18:30:45",
    "status": "present",
    "work_hours": "9.25",      // Calculated: (clock_out - clock_in) in hours
    "location_status": "inside",
    "check_out_latitude": 40.7128,
    "check_out_longitude": -74.0060,
    "updated_at": "2026-05-08T18:30:45Z"
  }
}
```

### Create Manual Attendance Record

#### Request Body
```json
{
  "employee_id": 1,              // Required: Valid employee ID
  "date": "2026-05-08",          // Required: ISO 8601 date
  "status": "present"            // Required: present, absent, half-day, late
}
```

#### Validation Rules
- `employee_id`: Must be valid integer
- `date`: Must be ISO 8601 format
- `status`: Must be one of ['present', 'absent', 'half-day', 'late']
- **Roles:** Admin or Manager only

#### Response
```json
{
  "success": true,
  "message": "Attendance record created successfully",
  "data": {
    "attendance_id": 2,
    "employee_id": 1,
    "date": "2026-05-08",
    "status": "present",
    "created_at": "2026-05-08T10:30:00Z"
  }
}
```

### Get Attendance History

#### Query Parameters
- `month` (integer): Filter by month (1-12)
- `year` (integer): Filter by year

#### Response
```json
{
  "success": true,
  "data": [
    {
      "attendance_id": 1,
      "employee_id": 1,
      "date": "2026-05-08",
      "clock_in": "09:15:30",
      "clock_out": "18:30:45",
      "status": "present",
      "work_hours": "9.25",
      "location_status": "inside"
    }
  ]
}
```

### Configuration Settings (Used by Attendance Controller)

| Setting Key | Default | Type | Purpose |
|-------------|---------|------|---------|
| `office_latitude` | 0 | float | Office location latitude |
| `office_longitude` | 0 | float | Office location longitude |
| `geofence_radius` | 500 | float | Geofence radius in meters |
| `strict_geofence` | false | bool | Block check-in/out outside geofence |
| `grace_period` | 15 | int | Grace period in minutes after shift start |
| `working_hours` | 8 | float | Standard working hours per day |
| `overtime_enabled` | false | bool | Enable overtime calculation |

---

## Payroll Management

### Base Route: `/payroll`

### Endpoints

| Method | Endpoint | Purpose | Auth Required | Roles |
|--------|----------|---------|-----------------|-------|
| GET | `/payroll` | Get all payroll records | **Yes** | admin, manager, employee* |
| GET | `/payroll/:id` | Get payroll record by ID | **Yes** | admin, manager, employee* |
| GET | `/payroll/statistics` | Get payroll statistics | **Yes** | admin, manager, employee* |
| POST | `/payroll` | Create payroll record | **Yes** | admin, manager |
| PUT | `/payroll/:id` | Update payroll record | **Yes** | admin, manager |
| PUT | `/payroll/:id/process` | Process payment | **Yes** | admin, manager |
| DELETE | `/payroll/:id` | Delete payroll record | **Yes** | admin only |
| POST | `/payroll/generate` | Generate automatic payroll | **Yes** | admin, manager |
| POST | `/payroll/generate-bulk` | Generate bulk payroll | **Yes** | admin, manager |
| POST | `/payroll/tax-declarations` | Submit tax declaration | **Yes** | Any authenticated |
| GET | `/payroll/tax-declarations` | Get tax declarations | **Yes** | Any authenticated |
| PUT | `/payroll/tax-declarations/:id` | Update tax declaration status | **Yes** | admin, manager |

\* Employees can only access their own payroll data (filtered in controller)

### Create Payroll

#### Request Body
```json
{
  "employee_id": 1,              // Required: Valid employee ID
  "month": 5,                    // Required: 1-12
  "year": 2026,                  // Required: Valid year
  "basic_salary": 75000.00,      // Required: Decimal
  "allowances": 5000.00,         // Optional: Decimal
  "deductions": 2000.00,         // Optional: Decimal
  "payment_status": "pending"    // Optional: pending, paid, cancelled
}
```

#### Validation Rules
- `employee_id`: Must be valid integer
- `month`: Must be between 1 and 12
- `year`: Must be valid integer
- `basic_salary`: Must be decimal
- `allowances`: Must be decimal if provided
- `deductions`: Must be decimal if provided

#### Response
```json
{
  "success": true,
  "message": "Payroll record created successfully",
  "data": {
    "payroll_id": 1,
    "employee_id": 1,
    "employee_name": "John Doe",
    "position": "Software Engineer",
    "department_name": "Engineering",
    "month": 5,
    "year": 2026,
    "basic_salary": "75000.00",
    "allowances": "5000.00",
    "deductions": "2000.00",
    "net_salary": "78000.00",
    "payment_status": "pending",
    "created_at": "2026-05-08T10:30:00Z"
  }
}
```

### Get Payroll Statistics

#### Query Parameters
- `employee_id` (integer): Filter by specific employee
- `month` (integer): Filter by month
- `year` (integer): Filter by year
- `payment_status` (string): Filter by payment status

#### Response
```json
{
  "success": true,
  "data": {
    "total_records": 150,
    "pending_records": 45,
    "paid_records": 100,
    "cancelled_records": 5,
    "total_pending_amount": "3375000.00",
    "total_paid_amount": "7500000.00",
    "total_cancelled_amount": "375000.00",
    "total_amount": "11250000.00"
  }
}
```

### Process Payment

#### Request Body
```json
{}  // No specific body required
```

#### Response
Updates payment_status to "paid"

---

## Recruitment Management

### Base Route: `/recruitment`

### Endpoints

| Method | Endpoint | Purpose | Auth Required | Roles |
|--------|----------|---------|-----------------|-------|
| GET | `/recruitment/jobs` | Get all job postings | **Yes** | Any authenticated |
| GET | `/recruitment/jobs/:id` | Get job posting by ID | **Yes** | Any authenticated |
| POST | `/recruitment/jobs` | Create job posting | **Yes** | admin, manager |
| PUT | `/recruitment/jobs/:id` | Update job posting | **Yes** | admin, manager |
| DELETE | `/recruitment/jobs/:id` | Delete job posting | **Yes** | admin only |
| GET | `/recruitment/applications` | Get all applications | **Yes** | admin, manager |
| POST | `/recruitment/applications` | Create job application | No | Public |
| PUT | `/recruitment/applications/:id` | Update application status | **Yes** | admin, manager |
| DELETE | `/recruitment/applications/:id` | Delete application | **Yes** | admin only |
| POST | `/recruitment/resume/parse` | Parse resume | **Yes** | Any authenticated |

### Create Job Posting

#### Request Body
```json
{
  "title": "Senior Software Engineer",           // Required
  "description": "We are looking for...",        // Required
  "department_id": 2,                            // Optional: Valid department ID
  "position_type": "full-time",                  // Optional
  "experience_required": "3-5 years",            // Optional
  "salary_range": "80000-100000",                // Optional
  "location": "New York, NY",                    // Optional
  "requirements": ["Node.js", "React", "AWS"],  // Optional: Array
  "responsibilities": ["Develop", "Review"],    // Optional: Array
  "deadline": "2026-06-08"                       // Optional: ISO 8601
}
```

#### Response
```json
{
  "success": true,
  "message": "Job posting created successfully",
  "data": {
    "job_id": 1,
    "title": "Senior Software Engineer",
    "description": "We are looking for...",
    "department_id": 2,
    "department_name": "Engineering",
    "status": "active",
    "posted_by": 2,
    "posted_by_email": "manager@example.com",
    "application_count": 0,
    "created_at": "2026-05-08T10:30:00Z"
  }
}
```

### Create Job Application (Public - No Auth Required)

#### Request Body
```json
{
  "job_id": 1,                              // Required: Valid job ID
  "applicant_name": "Jane Smith",           // Required
  "email": "jane.smith@example.com",        // Required: Valid email
  "phone": "+1-555-0123",                   // Optional
  "cover_letter": "I am interested...",     // Optional
  "resume_url": "https://...",              // Optional
  "cv_file": "<file>",                      // Optional: File upload
  "experience_years": 5                     // Optional: Integer
}
```

#### Validation Rules
- `job_id`: Must be valid integer
- `applicant_name`: Must not be empty
- `email`: Must be valid email

#### Response
```json
{
  "success": true,
  "message": "Application submitted successfully",
  "data": {
    "application_id": 1,
    "job_id": 1,
    "applicant_name": "Jane Smith",
    "email": "jane.smith@example.com",
    "status": "pending",
    "created_at": "2026-05-08T10:30:00Z"
  }
}
```

---

## Performance Management

### Base Route: `/performance`

### Endpoints

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|-----------------|
| GET | `/performance/goals` | Get all goals | **Yes** |
| POST | `/performance/goals` | Create goal | **Yes** |
| PUT | `/performance/goals/:id` | Update goal | **Yes** |
| DELETE | `/performance/goals/:id` | Delete goal | **Yes** |
| PUT | `/performance/key-results/:id` | Update key result | **Yes** |
| GET | `/performance/cycles` | Get all cycles | **Yes** |
| POST | `/performance/cycles` | Create cycle | **Yes** |
| GET | `/performance/reviews` | Get all reviews | **Yes** |
| GET | `/performance/reviews/:id` | Get review by ID | **Yes** |
| POST | `/performance/reviews` | Create review | **Yes** |
| PUT | `/performance/reviews/:id` | Update review | **Yes** |

---

## Settings

### Base Route: `/settings`

### Endpoints

| Method | Endpoint | Purpose | Auth Required | Roles |
|--------|----------|---------|-----------------|-------|
| GET | `/settings` | Get all settings | **Yes** | Any authenticated |
| GET | `/settings/:key` | Get setting by key | **Yes** | Any authenticated |
| POST | `/settings` | Create setting | **Yes** | admin only |
| PUT | `/settings/:key` | Update setting | **Yes** | admin only |
| PUT | `/settings` | Bulk update settings | **Yes** | admin only |
| DELETE | `/settings/:key` | Delete setting | **Yes** | admin only |

### Create/Update Setting

#### Request Body
```json
{
  "setting_key": "office_latitude",
  "setting_value": "40.7128"
}
```

#### Response
```json
{
  "success": true,
  "message": "Setting created/updated successfully",
  "data": {
    "setting_key": "office_latitude",
    "setting_value": "40.7128",
    "created_at": "2026-05-08T10:30:00Z"
  }
}
```

### Bulk Update Settings

#### Request Body
```json
[
  {"setting_key": "office_latitude", "setting_value": "40.7128"},
  {"setting_key": "office_longitude", "setting_value": "-74.0060"},
  {"setting_key": "geofence_radius", "setting_value": "500"}
]
```

---

## Known Issues & Missing Endpoints

### Issues Identified

1. **Attendance Regularization:** Routes defined but incomplete in provided code
   - POST `/attendance/regularize` - Request regularization
   - PUT `/attendance/regularize/:id` - Update regularization status
   - GET `/attendance/regularize` - Get regularization requests

2. **Leave Balance Logic:** Balance not automatically managed
   - No automatic deduction of leave balance on approval
   - Manual balance update mechanism needed
   - Consider implementing leave balance sync

3. **Task Assignment Constraints:** Limited validation
   - No check if assigned employee already has too many tasks
   - No task dependency validation
   - No resource allocation optimization

4. **Attendance Manual Override:** Admin can manually create records
   - No audit trail for manual entries
   - No approval workflow for manual attendance
   - Could lead to manipulation

5. **Payroll Processing:** Payment status manual update
   - No automatic integration with payment gateways
   - No notification system when payment is processed
   - No reversal/refund mechanism documented

6. **Error Handling:** Inconsistent error responses
   - Some endpoints return validation errors, others generic messages
   - No standardized error codes
   - Stack traces exposed in some error responses

### Recommended Endpoints to Add

1. **Leave Management:**
   ```
   POST /leaves/:id/cancel - Cancel approved leave
   GET /leaves/available-balance - Get current balance by type
   ```

2. **Task Management:**
   ```
   POST /tasks/bulk-create - Create multiple tasks
   GET /tasks/export - Export tasks to CSV/Excel
   POST /tasks/duplicate/:id - Duplicate a task
   ```

3. **Attendance:**
   ```
   GET /attendance/summary - Daily attendance summary
   POST /attendance/batch-import - Bulk import from biometric devices
   ```

4. **Employees:**
   ```
   POST /employees/bulk-import - Bulk employee import
   GET /employees/export - Export employee data
   ```

5. **Reports:**
   ```
   GET /reports/attendance - Attendance report
   GET /reports/leaves - Leave utilization report
   GET /reports/payroll - Payroll report
   GET /reports/performance - Performance metrics
   ```

6. **Audit:**
   ```
   GET /audit/logs - Get audit logs
   GET /audit/logs/:entity_id - Get logs for specific entity
   ```

### Security Considerations

1. **Input Validation:** Express-validator is used but consider additional sanitization
2. **SQL Injection:** Using parameterized queries (good practice followed)
3. **Rate Limiting:** No rate limiting middleware identified - add for public endpoints
4. **CORS:** Verify CORS configuration for multi-domain access
5. **Sensitive Data:** Consider field-level encryption for salary, personal info
6. **Audit Logging:** Implemented via `logAction` middleware - good practice
7. **Permission Scope:** Some endpoints use role OR permission pattern - verify permissions table structure

### Performance Observations

1. **Pagination:** Implemented correctly with limits (max 100 per page)
2. **N+1 Queries:** Some endpoints use aggregate functions and JOINs - verify indexes exist
3. **Caching:** No caching layer identified for settings/static data
4. **Real-time Updates:** Socket.io integration for dashboard updates (good for real-time sync)
5. **Database Connections:** Using connection pooling (good)

---

## Response Format Standards

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* response data */ }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

### Pagination Response
```json
{
  "success": true,
  "data": [ /* array of items */ ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 42,
    "itemsPerPage": 10,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 | Successful GET, PUT request |
| 201 | Successful POST (resource created) |
| 400 | Bad request (validation error) |
| 401 | Unauthorized (token missing/invalid) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not found |
| 500 | Server error |

---

## Environment Variables Required

```env
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=24h
DATABASE_URL=postgresql://user:password@localhost/hrms_db
NODE_ENV=development
```

---

**Last Updated:** May 8, 2026  
**Backend Framework:** Express.js  
**Database:** PostgreSQL  
**Authentication:** JWT with Role-Based Access Control (RBAC)
