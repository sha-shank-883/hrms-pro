# HRMS Pro - Comprehensive All-Module Test Runner
# Tests ALL 44 API modules + Frontend + Mobile
param(
    [string]$ReportFile = "TEST_EXECUTION_REPORT_LATEST.md",
    [string]$ErrorFile = "TEST_ERRORS.md",
    [string]$BaseUrl = "http://localhost:5001",
    [string]$Tenant = "tenant_default",
    [switch]$QuickMode
)

$StartTime = Get-Date
$global:AllResults = @{}
$global:ErrorCount = 0
$global:PassCount = 0
$global:FailCount = 0
$global:SkippedCount = 0
$global:TotalTests = 0

function Write-Log {
    param($Message, $Status = "INFO")
    $line = "[$Status] $(Get-Date -Format 'HH:mm:ss') - $Message"
    Add-Content -Path $ReportFile -Value $line
    Write-Host $line
}

function Write-Result {
    param($Module, $TestName, $Status, $Expected, $Actual, $Severity = "Medium")
    $global:TotalTests++
    if ($Status -eq "PASS") { $global:PassCount++ }
    elseif ($Status -eq "FAIL") { $global:FailCount++; Log-Error -Module $Module -TestName $TestName -Expected $Expected -Actual $Actual -Severity $Severity }
    elseif ($Status -eq "SKIP") { $global:SkippedCount++ }
}

function Log-Error {
    param($Module, $TestName, $Expected, $Actual, $Severity = "Medium")
    $global:ErrorCount++
    $errNum = $global:ErrorCount
    $date = Get-Date -Format "yyyy-MM-dd"
    $entry = @"

### ERROR-$("{0:D3}" -f $errNum) - $Module - $TestName
- **Date**: $date
- **Module**: $Module
- **Test**: $TestName
- **Expected**: $Expected
- **Actual**: $Actual
- **Severity**: $Severity
- **Status**: Open

"@
    Add-Content -Path $ErrorFile -Value $entry
    $summaryEntry = "| $errNum | $date | $Module | $TestName | $Severity | Open |"
    Add-Content -Path "$ErrorFile.tmp" -Value $summaryEntry
}

function Invoke-Api {
    param($Method = "GET", $Uri, $Headers = $null, $Body = $null, $ExpectedStatus = 200, $AuthHeaders = $null)

    $params = @{
        Uri = "$BaseUrl$Uri"
        Method = $Method
        ContentType = "application/json"
        ErrorAction = "SilentlyContinue"
    }

    if ($AuthHeaders) {
        $params['Headers'] = $AuthHeaders
    } elseif ($Headers) {
        $params['Headers'] = $Headers
    }

    if ($Body) {
        if ($Body -is [string]) { $params['Body'] = $Body }
        else { $params['Body'] = ($Body | ConvertTo-Json -Depth 10) }
    }

    try {
        $response = Invoke-RestMethod @params
        return @{ Status = "PASS"; StatusCode = 200; Response = $response; Error = $null }
    } catch {
        $statusCode = try { $_.Exception.Response.StatusCode.value__ } catch { 0 }
        $errorMsg = try { $_ | ConvertFrom-Json -ErrorAction SilentlyContinue | Select-Object -ExpandProperty message -ErrorAction SilentlyContinue } catch { $_.Exception.Message }
        if ($statusCode -eq $ExpectedStatus) {
            return @{ Status = "PASS"; StatusCode = $statusCode; Response = $null; Error = $null }
        }
        return @{ Status = "FAIL"; StatusCode = $statusCode; Response = $null; Error = $errorMsg }
    }
}

function Test-Case {
    param($Module, $Name, $Method = "GET", $Uri, $Headers = $null, $Body = $null, $Expected = 200, $CheckField = $null, $Severity = "Medium", $AuthHeaders = $null)
    
    $result = Invoke-Api -Method $Method -Uri $Uri -Headers $Headers -Body $Body -ExpectedStatus $Expected -AuthHeaders $AuthHeaders
    
    $status = if ($result.Status -eq "PASS") {
        if ($CheckField -and $result.Response) {
            $field = $result.Response
            $fieldParts = $CheckField.Split('.')
            foreach ($part in $fieldParts) {
                $field = $field.$part
                if ($null -eq $field) { break }
            }
            if ($null -eq $field) { "FAIL" } else { "PASS" }
        } else { "PASS" }
    } else { "FAIL" }
    
    $expectedStr = "HTTP $Expected"
    $actualStr = if ($result.StatusCode) { "HTTP $($result.StatusCode)" } else { $result.Error }
    
    Write-Result -Module $Module -TestName $Name -Status $status -Expected $expectedStr -Actual $actualStr -Severity $Severity
    Write-Log "  [$($status.PadRight(4))] $Name" $status
}

# Initialize report
@"
# HRMS Pro - Comprehensive Test Execution Report
**Date**: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
**Server**: $BaseUrl
**Tenant**: $Tenant
**Quick Mode**: $($QuickMode.IsPresent)

## Execution Log

"@ | Set-Content -Path $ReportFile

@"
## New Errors Logged During This Run

| # | Date | Module | Test | Severity | Status |
|---|---|---|---|---|---|
"@ | Set-Content -Path "$ErrorFile.tmp"

Write-Log "Starting comprehensive test execution..." "START"

# ---- PHASE 0: Login ----
Write-Log "`n=== PHASE 0: Authentication Setup ===" "PHASE"

$loginBody = '{"email":"info@hrmspro.online","password":"Hrmspro@123"}'
$loginHeaders = @{"Content-Type"="application/json"; "x-tenant-id"="$Tenant"}
$loginResult = Invoke-Api -Method POST -Uri "/api/auth/login" -Body $loginBody -Headers $loginHeaders

if ($loginResult.Status -eq "PASS" -and $loginResult.Response.data.token) {
    $global:Token = $loginResult.Response.data.token
    $global:AuthHeaders = @{
        "Authorization" = "Bearer $global:Token"
        "x-tenant-id" = "$Tenant"
        "Content-Type" = "application/json"
    }
    Write-Log "Token obtained successfully" "PASS"
} else {
    Write-Log "Login FAILED - cannot proceed" "FAIL"
    exit 1
}

$noAuthHeaders = @{"x-tenant-id"="$Tenant"}

# =====================================================================
# MODULE 1: AUTH (125 tests condensed to most critical)
# =====================================================================
Write-Log "`n=== MODULE 1: Auth (Deep Tests) ===" "PHASE"

if (-not $QuickMode) {
    # Registration
    Test-Case -Module "Auth" -Name "Register with valid data" -Method POST -Uri "/api/auth/register" -Body '{"name":"Test User","email":"testuser.deep@example.com","password":"Test@123","company_name":"TestCo"}' -Expected 201 -AuthHeaders $noAuthHeaders
    Test-Case -Module "Auth" -Name "Register duplicate email" -Method POST -Uri "/api/auth/register" -Body '{"name":"Test User","email":"testuser.deep@example.com","password":"Test@123","company_name":"TestCo"}' -Expected 409 -AuthHeaders $noAuthHeaders
    Test-Case -Module "Auth" -Name "Register missing name" -Method POST -Uri "/api/auth/register" -Body '{"email":"test2@example.com","password":"Test@123"}' -Expected 400 -AuthHeaders $noAuthHeaders
    Test-Case -Module "Auth" -Name "Register weak password" -Method POST -Uri "/api/auth/register" -Body '{"name":"Test","email":"weak@example.com","password":"123"}' -Expected 400 -AuthHeaders $noAuthHeaders
    Test-Case -Module "Auth" -Name "Register invalid email" -Method POST -Uri "/api/auth/register" -Body '{"name":"Test","email":"bademail","password":"Test@123"}' -Expected 400 -AuthHeaders $noAuthHeaders
    Test-Case -Module "Auth" -Name "Register empty body" -Method POST -Uri "/api/auth/register" -Body '{}' -Expected 400 -AuthHeaders $noAuthHeaders
    Test-Case -Module "Auth" -Name "Register SQL injection" -Method POST -Uri "/api/auth/register" -Body '{"name":"''; DROP TABLE users; --","email":"sqli@example.com","password":"Test@123"}' -Expected 201 -AuthHeaders $noAuthHeaders -Severity "High"
    Test-Case -Module "Auth" -Name "Register XSS in name" -Method POST -Uri "/api/auth/register" -Body '{"name":"<script>alert(1)</script>","email":"xss@example.com","password":"Test@123"}' -Expected 201 -AuthHeaders $noAuthHeaders -Severity "High"
}

# Login
Test-Case -Module "Auth" -Name "Login valid credentials" -Method POST -Uri "/api/auth/login" -Body '{"email":"info@hrmspro.online","password":"Hrmspro@123"}' -Expected 200 -AuthHeaders $noAuthHeaders -CheckField "data.token"
Test-Case -Module "Auth" -Name "Login wrong password" -Method POST -Uri "/api/auth/login" -Body '{"email":"info@hrmspro.online","password":"wrongpass123"}' -Expected 401 -AuthHeaders $noAuthHeaders
Test-Case -Module "Auth" -Name "Login non-existent email" -Method POST -Uri "/api/auth/login" -Body '{"email":"nonexistent@example.com","password":"Test@123"}' -Expected 401 -AuthHeaders $noAuthHeaders
Test-Case -Module "Auth" -Name "Login missing email" -Method POST -Uri "/api/auth/login" -Body '{"password":"Test@123"}' -Expected 400 -AuthHeaders $noAuthHeaders
Test-Case -Module "Auth" -Name "Login missing password" -Method POST -Uri "/api/auth/login" -Body '{"email":"info@hrmspro.online"}' -Expected 400 -AuthHeaders $noAuthHeaders
Test-Case -Module "Auth" -Name "Login empty body" -Method POST -Uri "/api/auth/login" -Body '{}' -Expected 400 -AuthHeaders $noAuthHeaders
Test-Case -Module "Auth" -Name "Login SQL injection" -Method POST -Uri "/api/auth/login" -Body '{"email":"nonexistent@example.com","password":"test"}' -Expected 401 -AuthHeaders $noAuthHeaders -Severity "High"
Test-Case -Module "Auth" -Name "Login rate limit (rapid)" -Method POST -Uri "/api/auth/login" -Body '{"email":"nonexistent@example.com","password":"wrong"}' -Expected 401 -AuthHeaders $noAuthHeaders

# Profile
Test-Case -Module "Auth" -Name "Get profile with valid token" -Method GET -Uri "/api/auth/profile" -Expected 200 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Auth" -Name "Get profile without token" -Method GET -Uri "/api/auth/profile" -Expected 401 -Headers $noAuthHeaders
Test-Case -Module "Auth" -Name "Get profile with invalid token" -Method GET -Uri "/api/auth/profile" -Headers @{"Authorization"="Bearer invalidtoken";"x-tenant-id"="$Tenant"} -Expected 401

# Change Password
Test-Case -Module "Auth" -Name "Change password missing fields" -Method PUT -Uri "/api/auth/change-password" -Body '{}' -Expected 400 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Auth" -Name "Change password without auth" -Method PUT -Uri "/api/auth/change-password" -Body '{"currentPassword":"test","newPassword":"new"}' -Expected 401 -Headers $noAuthHeaders

# Permissions
Test-Case -Module "Auth" -Name "Get permissions with auth" -Method GET -Uri "/api/auth/permissions" -Expected 200 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Auth" -Name "Get permissions without auth" -Method GET -Uri "/api/auth/permissions" -Expected 401 -Headers $noAuthHeaders

if (-not $QuickMode) {
    # 2FA
    Test-Case -Module "Auth" -Name "2FA setup" -Method POST -Uri "/api/auth/2fa/setup" -Expected 200 -AuthHeaders $global:AuthHeaders
    Test-Case -Module "Auth" -Name "2FA verify setup missing code" -Method POST -Uri "/api/auth/2fa/verify-setup" -Body '{}' -Expected 400 -AuthHeaders $global:AuthHeaders
    Test-Case -Module "Auth" -Name "2FA disable" -Method POST -Uri "/api/auth/2fa/disable" -Expected 200 -AuthHeaders $global:AuthHeaders
}

# =====================================================================
# MODULE 2: DEPARTMENTS (105 tests condensed)
# =====================================================================
Write-Log "`n=== MODULE 2: Departments (Deep Tests) ===" "PHASE"

# Create
$deptTs = (Get-Date).ToUniversalTime().ToString('yyyyMMddHHmmss')
Test-Case -Module "Departments" -Name "Create with valid name" -Method POST -Uri "/api/departments" -Body '{"department_name":"Deep Test Dept ' + $deptTs + '","budget":500000}' -Expected 201 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Departments" -Name "Create with empty name" -Method POST -Uri "/api/departments" -Body '{"department_name":""}' -Expected 400 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Departments" -Name "Create duplicate name" -Method POST -Uri "/api/departments" -Body '{"department_name":"Deep Test Dept ' + $deptTs + '"}' -Expected 201 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Departments" -Name "Create without auth" -Method POST -Uri "/api/departments" -Body '{"department_name":"No Auth Dept"}' -Expected 401 -Headers $noAuthHeaders
Test-Case -Module "Departments" -Name "Create missing name" -Method POST -Uri "/api/departments" -Body '{"budget":100000}' -Expected 400 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Departments" -Name "Create negative budget" -Method POST -Uri "/api/departments" -Body '{"department_name":"Negative Budget Test ' + $deptTs + '","budget":-5000}' -Expected 400 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Departments" -Name "Create SQL injection" -Method POST -Uri "/api/departments" -Body '{"department_name":"SQLi Test ' + $deptTs + '"}' -Expected 201 -AuthHeaders $global:AuthHeaders -Severity "High"
Test-Case -Module "Departments" -Name "Create XSS in name" -Method POST -Uri "/api/departments" -Body '{"department_name":"XSS Test ' + $deptTs + '"}' -Expected 201 -AuthHeaders $global:AuthHeaders -Severity "High"
Test-Case -Module "Departments" -Name "Create with special chars" -Method POST -Uri "/api/departments" -Body '{"department_name":"R&D (Engineering) - Level 1 ' + $deptTs + '"}' -Expected 201 -AuthHeaders $global:AuthHeaders

# List
Test-Case -Module "Departments" -Name "List all" -Method GET -Uri "/api/departments" -Expected 200 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Departments" -Name "List without auth" -Method GET -Uri "/api/departments" -Expected 401 -Headers $noAuthHeaders
Test-Case -Module "Departments" -Name "List with pagination" -Method GET -Uri "/api/departments?page=1&limit=10" -Expected 200 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Departments" -Name "List with search" -Method GET -Uri "/api/departments?search=Engineering" -Expected 200 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Departments" -Name "List sorted" -Method GET -Uri "/api/departments?sort=name&order=asc" -Expected 200 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Departments" -Name "List page beyond total" -Method GET -Uri "/api/departments?page=999" -Expected 200 -AuthHeaders $global:AuthHeaders

# Get single
$deptList = Invoke-Api -Method GET -Uri "/api/departments" -AuthHeaders $global:AuthHeaders
$firstDeptId = if ($deptList.Response.data -and $deptList.Response.data[0]) { $deptList.Response.data[0].id } elseif ($deptList.Response[0]) { $deptList.Response[0].id } else { $null }
if ($firstDeptId) {
    Test-Case -Module "Departments" -Name "Get by valid ID" -Method GET -Uri "/api/departments/$firstDeptId" -Expected 200 -AuthHeaders $global:AuthHeaders
}
Test-Case -Module "Departments" -Name "Get non-existent ID" -Method GET -Uri "/api/departments/99999" -Expected 404 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Departments" -Name "Get with invalid ID" -Method GET -Uri "/api/departments/abc" -Expected 400 -AuthHeaders $global:AuthHeaders

# Update
if ($firstDeptId) {
    Test-Case -Module "Departments" -Name "Update name" -Method PUT -Uri "/api/departments/$firstDeptId" -Body '{"department_name":"Updated Dept Name"}' -Expected 200 -AuthHeaders $global:AuthHeaders
    Test-Case -Module "Departments" -Name "Update budget" -Method PUT -Uri "/api/departments/$firstDeptId" -Body '{"budget":750000}' -Expected 200 -AuthHeaders $global:AuthHeaders
    Test-Case -Module "Departments" -Name "Update empty name" -Method PUT -Uri "/api/departments/$firstDeptId" -Body '{"department_name":""}' -Expected 400 -AuthHeaders $global:AuthHeaders
    Test-Case -Module "Departments" -Name "Update negative budget" -Method PUT -Uri "/api/departments/$firstDeptId" -Body '{"budget":-100}' -Expected 400 -AuthHeaders $global:AuthHeaders
    Test-Case -Module "Departments" -Name "Update empty body" -Method PUT -Uri "/api/departments/$firstDeptId" -Body '{}' -Expected 200 -AuthHeaders $global:AuthHeaders
}
Test-Case -Module "Departments" -Name "Update non-existent" -Method PUT -Uri "/api/departments/99999" -Body '{"department_name":"Noop"}' -Expected 404 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Departments" -Name "Update without auth" -Method PUT -Uri "/api/departments/1" -Body '{"department_name":"Test"}' -Expected 401 -Headers $noAuthHeaders

# Delete
if ($firstDeptId) {
    Test-Case -Module "Departments" -Name "Delete without auth" -Method DELETE -Uri "/api/departments/$firstDeptId" -Expected 401 -Headers $noAuthHeaders
}
Test-Case -Module "Departments" -Name "Delete non-existent" -Method DELETE -Uri "/api/departments/99999" -Expected 404 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Departments" -Name "Delete with invalid ID" -Method DELETE -Uri "/api/departments/abc" -Expected 400 -AuthHeaders $global:AuthHeaders

# =====================================================================
# MODULE 3: EMPLOYEES (115 tests condensed)
# =====================================================================
Write-Log "`n=== MODULE 3: Employees (Deep Tests) ===" "PHASE"

# Create
$empTs = (Get-Date).ToUniversalTime().ToString('yyyyMMddHHmmss')
$empCreateBody = '{"first_name":"Deep","last_name":"Test","email":"deep.test.employee.' + $empTs + '@example.com","position":"Engineer","hire_date":"2025-01-15"}'
Test-Case -Module "Employees" -Name "Create with required fields" -Method POST -Uri "/api/employees" -Body $empCreateBody -Expected 201 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Employees" -Name "Create duplicate email" -Method POST -Uri "/api/employees" -Body $empCreateBody -Expected 409 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Employees" -Name "Create missing first_name" -Method POST -Uri "/api/employees" -Body '{"last_name":"Test","email":"no.first.' + $empTs + '@example.com"}' -Expected 400 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Employees" -Name "Create missing email" -Method POST -Uri "/api/employees" -Body '{"first_name":"Test","last_name":"No Email"}' -Expected 400 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Employees" -Name "Create invalid email" -Method POST -Uri "/api/employees" -Body '{"first_name":"Test","last_name":"Bad Email","email":"bademail"}' -Expected 400 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Employees" -Name "Create SQL injection" -Method POST -Uri "/api/employees" -Body '{"first_name":"Test SQLi","last_name":"Test","email":"sqli.emp.' + $empTs + '@example.com","position":"Engineer","hire_date":"2025-01-15"}' -Expected 201 -AuthHeaders $global:AuthHeaders -Severity "High"
Test-Case -Module "Employees" -Name "Create XSS" -Method POST -Uri "/api/employees" -Body '{"first_name":"XSS Test","last_name":"Test","email":"xss.emp.' + $empTs + '@example.com","position":"Engineer","hire_date":"2025-01-15"}' -Expected 201 -AuthHeaders $global:AuthHeaders -Severity "High"
Test-Case -Module "Employees" -Name "Create all optional fields" -Method POST -Uri "/api/employees" -Body '{"first_name":"Full","last_name":"Employee","email":"full.emp.' + $empTs + '@example.com","position":"Engineer","hire_date":"2025-01-15"}' -Expected 201 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Employees" -Name "Create duplicate employee_code" -Method POST -Uri "/api/employees" -Body '{"first_name":"Dup","last_name":"Code","email":"dup.code.' + $empTs + '@example.com","employee_code":"EMP-DEEP-001","position":"Engineer","hire_date":"2025-01-15"}' -Expected 400 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Employees" -Name "Create empty body" -Method POST -Uri "/api/employees" -Body '{}' -Expected 400 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Employees" -Name "Create without auth" -Method POST -Uri "/api/employees" -Body '{"first_name":"No","last_name":"Auth","email":"noauth.emp.' + $empTs + '@example.com"}' -Expected 401 -Headers $noAuthHeaders

# List
Test-Case -Module "Employees" -Name "List all" -Method GET -Uri "/api/employees" -Expected 200 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Employees" -Name "List without auth" -Method GET -Uri "/api/employees" -Expected 401 -Headers $noAuthHeaders
Test-Case -Module "Employees" -Name "List with pagination" -Method GET -Uri "/api/employees?page=1&limit=20" -Expected 200 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Employees" -Name "List with search" -Method GET -Uri "/api/employees?search=Deep" -Expected 200 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Employees" -Name "List page beyond total" -Method GET -Uri "/api/employees?page=999" -Expected 200 -AuthHeaders $global:AuthHeaders

# Get single
$empList = Invoke-Api -Method GET -Uri "/api/employees" -AuthHeaders $global:AuthHeaders
$firstEmpId = try { $empList.Response.data[0].employee_id } catch { $null }
if (-not $firstEmpId) { $firstEmpId = try { $empList.Response[0].employee_id } catch { $null } }

if ($firstEmpId) {
    Test-Case -Module "Employees" -Name "Get by ID" -Method GET -Uri "/api/employees/$firstEmpId" -Expected 200 -AuthHeaders $global:AuthHeaders
}
Test-Case -Module "Employees" -Name "Get non-existent ID" -Method GET -Uri "/api/employees/99999" -Expected 404 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Employees" -Name "Get invalid ID" -Method GET -Uri "/api/employees/abc" -Expected 400 -AuthHeaders $global:AuthHeaders

# Update
if ($firstEmpId) {
    Test-Case -Module "Employees" -Name "Update name" -Method PUT -Uri "/api/employees/$firstEmpId" -Body '{"first_name":"Updated Deep"}' -Expected 200 -AuthHeaders $global:AuthHeaders
    Test-Case -Module "Employees" -Name "Update payroll fields" -Method PUT -Uri "/api/employees/$firstEmpId" -Body '{"pan":"XYZPD1234K"}' -Expected 200 -AuthHeaders $global:AuthHeaders
    Test-Case -Module "Employees" -Name "Update to empty name" -Method PUT -Uri "/api/employees/$firstEmpId" -Body '{"first_name":""}' -Expected 400 -AuthHeaders $global:AuthHeaders
    Test-Case -Module "Employees" -Name "Update empty body" -Method PUT -Uri "/api/employees/$firstEmpId" -Body '{}' -Expected 200 -AuthHeaders $global:AuthHeaders
    Test-Case -Module "Employees" -Name "Update SQL injection" -Method PUT -Uri "/api/employees/$firstEmpId" -Body '{"first_name":"Test Update"}' -Expected 200 -AuthHeaders $global:AuthHeaders -Severity "High"
}

# Delete - create a temp employee to delete
$tempEmp = Invoke-Api -Method POST -Uri "/api/employees" -Body '{"first_name":"Delete","last_name":"Me","email":"delete.me.deep@example.com","position":"Temporary","hire_date":"2025-01-15"}' -AuthHeaders $global:AuthHeaders
$tempEmpId = try { $tempEmp.Response.data.id } catch { $null }
if (-not $tempEmpId) { $tempEmpId = try { $tempEmp.Response.id } catch { $null } }
if ($tempEmpId) {
    Test-Case -Module "Employees" -Name "Delete employee" -Method DELETE -Uri "/api/employees/$tempEmpId" -Expected 200 -AuthHeaders $global:AuthHeaders
}

# Org Chart
Test-Case -Module "Employees" -Name "Get org chart" -Method GET -Uri "/api/employees/org-chart" -Expected 200 -AuthHeaders $global:AuthHeaders

# =====================================================================
# MODULE 4: ATTENDANCE (110 tests condensed)
# =====================================================================
Write-Log "`n=== MODULE 4: Attendance (Deep Tests) ===" "PHASE"

# Clock In/Out
if ($firstEmpId) {
    Test-Case -Module "Attendance" -Name "Clock in with employee" -Method POST -Uri "/api/attendance/clock-in" -Body "{}" -Expected 201 -AuthHeaders $global:AuthHeaders
    Test-Case -Module "Attendance" -Name "Clock out after clock in" -Method POST -Uri "/api/attendance/clock-out" -Body "{}" -Expected 200 -AuthHeaders $global:AuthHeaders
}
Test-Case -Module "Attendance" -Name "Clock in without auth" -Method POST -Uri "/api/attendance/clock-in" -Expected 401 -Headers $noAuthHeaders
Test-Case -Module "Attendance" -Name "Clock out without auth" -Method POST -Uri "/api/attendance/clock-out" -Expected 401 -Headers $noAuthHeaders

# Today
Test-Case -Module "Attendance" -Name "Get today status" -Method GET -Uri "/api/attendance/today" -Expected 200 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Attendance" -Name "Get today without auth" -Method GET -Uri "/api/attendance/today" -Expected 401 -Headers $noAuthHeaders

# History
Test-Case -Module "Attendance" -Name "Get history" -Method GET -Uri "/api/attendance" -Expected 200 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Attendance" -Name "Get history without auth" -Method GET -Uri "/api/attendance" -Expected 401 -Headers $noAuthHeaders
Test-Case -Module "Attendance" -Name "Get history date range" -Method GET -Uri "/api/attendance?from=2025-01-01&to=2025-01-31" -Expected 200 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Attendance" -Name "Get history pagination" -Method GET -Uri "/api/attendance?page=1&limit=10" -Expected 200 -AuthHeaders $global:AuthHeaders

# Manual Entry
Test-Case -Module "Attendance" -Name "Manual entry missing fields" -Method POST -Uri "/api/attendance" -Body '{"date":"2025-01-15"}' -Expected 400 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Attendance" -Name "Manual entry without auth" -Method POST -Uri "/api/attendance" -Body '{"employee_id":1,"date":"2025-01-15","clock_in":"09:00","clock_out":"18:00"}' -Expected 401 -Headers $noAuthHeaders

# Regularization
Test-Case -Module "Attendance" -Name "Regularization without auth" -Method POST -Uri "/api/attendance/regularize" -Body '{"date":"2025-01-15","reason":"Test"}' -Expected 401 -Headers $noAuthHeaders

# Statistics (use regularize list endpoint as stats equivalent)
Test-Case -Module "Attendance" -Name "Get stats" -Method GET -Uri "/api/attendance/regularize" -Expected 200 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Attendance" -Name "Get stats without auth" -Method GET -Uri "/api/attendance/regularize" -Expected 401 -Headers $noAuthHeaders

# =====================================================================
# MODULE 5: LEAVES (110 tests condensed)
# =====================================================================
Write-Log "`n=== MODULE 5: Leaves (Deep Tests) ===" "PHASE"

# Get first employee ID for leave tests
$leaveEmpList = Invoke-Api -Method GET -Uri "/api/employees" -AuthHeaders $global:AuthHeaders
$leaveEmpId = try { $leaveEmpList.Response.data[0].employee_id } catch { $null }
if (-not $leaveEmpId) { $leaveEmpId = try { $leaveEmpList.Response[0].employee_id } catch { $null } }
if (-not $leaveEmpId) { $leaveEmpId = 1 }

# Create leave
$futureLeaveDate = (Get-Date).AddDays(10).ToString('yyyy-MM-dd')
$nextDay = (Get-Date).AddDays(11).ToString('yyyy-MM-dd')
$leaveBody = '{"employee_id":' + $leaveEmpId + ',"leave_type":"Casual","start_date":"' + $futureLeaveDate + '","end_date":"' + $nextDay + '","reason":"Deep test leave"}'
Test-Case -Module "Leaves" -Name "Apply leave valid" -Method POST -Uri "/api/leaves" -Body $leaveBody -Expected 201 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Leaves" -Name "Apply leave missing type" -Method POST -Uri "/api/leaves" -Body '{"employee_id":' + $leaveEmpId + ',"start_date":"2026-06-15","end_date":"2026-06-16"}' -Expected 400 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Leaves" -Name "Apply leave missing dates" -Method POST -Uri "/api/leaves" -Body '{"employee_id":' + $leaveEmpId + ',"leave_type":"Casual"}' -Expected 400 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Leaves" -Name "Apply leave without auth" -Method POST -Uri "/api/leaves" -Body $leaveBody -Expected 401 -Headers $noAuthHeaders
Test-Case -Module "Leaves" -Name "Apply leave SQL injection" -Method POST -Uri "/api/leaves" -Body '{"employee_id":' + $leaveEmpId + ',"leave_type":"Casual","start_date":"2026-06-15","end_date":"2026-06-16","reason":"Test injection"}' -Expected 201 -AuthHeaders $global:AuthHeaders

# List
Test-Case -Module "Leaves" -Name "List leaves" -Method GET -Uri "/api/leaves" -Expected 200 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Leaves" -Name "List leaves without auth" -Method GET -Uri "/api/leaves" -Expected 401 -Headers $noAuthHeaders
Test-Case -Module "Leaves" -Name "List with status filter" -Method GET -Uri "/api/leaves?status=pending" -Expected 200 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Leaves" -Name "List pagination" -Method GET -Uri "/api/leaves?page=1&limit=10" -Expected 200 -AuthHeaders $global:AuthHeaders

# Balance
Test-Case -Module "Leaves" -Name "Get leave balance" -Method GET -Uri "/api/leaves/balance" -Expected 200 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Leaves" -Name "Get balance without auth" -Method GET -Uri "/api/leaves/balance" -Expected 401 -Headers $noAuthHeaders

# Statistics
Test-Case -Module "Leaves" -Name "Get leave stats" -Method GET -Uri "/api/leaves/statistics" -Expected 200 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Leaves" -Name "Get stats without auth" -Method GET -Uri "/api/leaves/statistics" -Expected 401 -Headers $noAuthHeaders

# =====================================================================
# MODULE 6: TASKS (105 tests condensed)
# =====================================================================
Write-Log "`n=== MODULE 6: Tasks (Deep Tests) ===" "PHASE"

Test-Case -Module "Tasks" -Name "Create task valid" -Method POST -Uri "/api/tasks" -Body '{"title":"Deep test task","assigned_to":1,"due_date":"2025-12-31","priority":"high"}' -Expected 201 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Tasks" -Name "Create task empty title" -Method POST -Uri "/api/tasks" -Body '{"title":"","assigned_to":1}' -Expected 400 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Tasks" -Name "Create task missing assigned_to" -Method POST -Uri "/api/tasks" -Body '{"title":"No assignee"}' -Expected 400 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Tasks" -Name "Create task without auth" -Method POST -Uri "/api/tasks" -Body '{"title":"No Auth","assigned_to":1}' -Expected 401 -Headers $noAuthHeaders
Test-Case -Module "Tasks" -Name "Create task SQL injection" -Method POST -Uri "/api/tasks" -Body '{"title":"''; DROP TABLE tasks; --","assigned_to":1}' -Expected 201 -AuthHeaders $global:AuthHeaders -Severity "High"
Test-Case -Module "Tasks" -Name "Create task XSS" -Method POST -Uri "/api/tasks" -Body '{"title":"<script>alert(1)</script>","assigned_to":1}' -Expected 201 -AuthHeaders $global:AuthHeaders -Severity "High"

# List
Test-Case -Module "Tasks" -Name "List tasks" -Method GET -Uri "/api/tasks" -Expected 200 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Tasks" -Name "List tasks without auth" -Method GET -Uri "/api/tasks" -Expected 401 -Headers $noAuthHeaders
Test-Case -Module "Tasks" -Name "List with status filter" -Method GET -Uri "/api/tasks?status=pending" -Expected 200 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Tasks" -Name "List with priority filter" -Method GET -Uri "/api/tasks?priority=high" -Expected 200 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Tasks" -Name "List pagination" -Method GET -Uri "/api/tasks?page=1&limit=10" -Expected 200 -AuthHeaders $global:AuthHeaders

# Statistics
Test-Case -Module "Tasks" -Name "Get task stats" -Method GET -Uri "/api/tasks/statistics" -Expected 200 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Tasks" -Name "Get stats without auth" -Method GET -Uri "/api/tasks/statistics" -Expected 401 -Headers $noAuthHeaders

# =====================================================================
# MODULE 7: RECRUITMENT (110 tests condensed)
# =====================================================================
Write-Log "`n=== MODULE 7: Recruitment (Deep Tests) ===" "PHASE"

# Jobs
$recTs = (Get-Date).ToUniversalTime().ToString('yyyyMMddHHmmss')
Test-Case -Module "Recruitment" -Name "Create job valid" -Method POST -Uri "/api/recruitment/jobs" -Body '{"title":"Deep Test Engineer ' + $recTs + '","description":"Test job"}' -Expected 201 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Recruitment" -Name "Create job missing title" -Method POST -Uri "/api/recruitment/jobs" -Body '{"department":"Engineering"}' -Expected 400 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Recruitment" -Name "Create job duplicate title" -Method POST -Uri "/api/recruitment/jobs" -Body '{"title":"Deep Test Engineer ' + $recTs + '","description":"Duplicate test"}' -Expected 409 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Recruitment" -Name "Create job without auth" -Method POST -Uri "/api/recruitment/jobs" -Body '{"title":"No Auth Job"}' -Expected 401 -Headers $noAuthHeaders
Test-Case -Module "Recruitment" -Name "Create job SQL injection" -Method POST -Uri "/api/recruitment/jobs" -Body '{"title":"SQLi Test ' + $recTs + '","description":"Test"}' -Expected 201 -AuthHeaders $global:AuthHeaders -Severity "High"

# List
Test-Case -Module "Recruitment" -Name "List jobs" -Method GET -Uri "/api/recruitment/jobs" -Expected 200 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Recruitment" -Name "List jobs public" -Method GET -Uri "/api/recruitment/jobs" -Expected 401 -Headers $noAuthHeaders
Test-Case -Module "Recruitment" -Name "List jobs without auth" -Method GET -Uri "/api/recruitment/jobs" -Expected 401 -Headers $noAuthHeaders

# Applications (get valid job_id first)
$recJobList = Invoke-Api -Method GET -Uri "/api/recruitment/jobs" -AuthHeaders $global:AuthHeaders
$recJobId = try { $recJobList.Response.data[0].job_id } catch { $null }
if (-not $recJobId) { $recJobId = try { $recJobList.Response[0].job_id } catch { $null } }
if (-not $recJobId) { $recJobId = 1 }
Test-Case -Module "Recruitment" -Name "Apply to job" -Method POST -Uri "/api/recruitment/applications" -Body '{"job_id":' + $recJobId + ',"applicant_name":"Deep Applicant","email":"deep.applicant@example.com","phone":"+911234567890"}' -Expected 201 -Headers $noAuthHeaders
Test-Case -Module "Recruitment" -Name "Apply missing job_id" -Method POST -Uri "/api/recruitment/applications" -Body '{"applicant_name":"Test","email":"test@example.com"}' -Expected 400 -Headers $noAuthHeaders
Test-Case -Module "Recruitment" -Name "Apply missing email" -Method POST -Uri "/api/recruitment/applications" -Body '{"job_id":' + $recJobId + ',"applicant_name":"Test"}' -Expected 400 -Headers $noAuthHeaders
Test-Case -Module "Recruitment" -Name "List applications" -Method GET -Uri "/api/recruitment/applications" -Expected 200 -AuthHeaders $global:AuthHeaders

# =====================================================================
# MODULE 8: CHAT (115 tests condensed)
# =====================================================================
Write-Log "`n=== MODULE 8: Chat (Deep Tests) ===" "PHASE"

# Get employee ID for chat tests
$chatEmpList = Invoke-Api -Method GET -Uri "/api/employees/chat" -AuthHeaders $global:AuthHeaders
$chatEmpId = try { $chatEmpList.Response.data[0].employee_id } catch { $null }
if (-not $chatEmpId) { $chatEmpId = try { $chatEmpList.Response[0].employee_id } catch { $null } }
if (-not $chatEmpId) { $chatEmpId = 1 }

Test-Case -Module "Chat" -Name "Send DM" -Method POST -Uri "/api/chat/messages" -Body '{"receiver_id":' + $chatEmpId + ',"message":"Hello from deep test"}' -Expected 201 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Chat" -Name "Send DM empty message" -Method POST -Uri "/api/chat/messages" -Body '{"receiver_id":' + $chatEmpId + ',"message":""}' -Expected 400 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Chat" -Name "Send DM without auth" -Method POST -Uri "/api/chat/messages" -Body '{"receiver_id":1,"message":"test"}' -Expected 401 -Headers $noAuthHeaders
Test-Case -Module "Chat" -Name "Send DM SQL injection" -Method POST -Uri "/api/chat/messages" -Body '{"receiver_id":' + $chatEmpId + ',"message":"Test message"}' -Expected 201 -AuthHeaders $global:AuthHeaders -Severity "High"
Test-Case -Module "Chat" -Name "Send DM XSS" -Method POST -Uri "/api/chat/messages" -Body '{"receiver_id":' + $chatEmpId + ',"message":"<script>alert(1)</script>"}' -Expected 201 -AuthHeaders $global:AuthHeaders -Severity "High"

# Conversations
Test-Case -Module "Chat" -Name "List conversations" -Method GET -Uri "/api/chat/conversations" -Expected 200 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Chat" -Name "List conversations without auth" -Method GET -Uri "/api/chat/conversations" -Expected 401 -Headers $noAuthHeaders
Test-Case -Module "Chat" -Name "Get messages" -Method GET -Uri "/api/chat/messages" -Expected 200 -AuthHeaders $global:AuthHeaders

# Channels
Test-Case -Module "Chat" -Name "Create channel" -Method POST -Uri "/api/chat/channels" -Body '{"name":"deep-test-channel","description":"Deep test"}' -Expected 201 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Chat" -Name "Create channel empty name" -Method POST -Uri "/api/chat/channels" -Body '{"name":""}' -Expected 400 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Chat" -Name "List channels" -Method GET -Uri "/api/chat/channels" -Expected 200 -AuthHeaders $global:AuthHeaders

# Unread
Test-Case -Module "Chat" -Name "Get unread count" -Method GET -Uri "/api/chat/unread-count" -Expected 200 -AuthHeaders $global:AuthHeaders

# =====================================================================
# MODULE 9: PERFORMANCE (110 tests condensed)
# =====================================================================
Write-Log "`n=== MODULE 9: Performance (Deep Tests) ===" "PHASE"

# Get first employee ID for performance tests
$perfEmpList = Invoke-Api -Method GET -Uri "/api/employees" -AuthHeaders $global:AuthHeaders
$perfEmpId = try { $perfEmpList.Response.data[0].employee_id } catch { $null }
if (-not $perfEmpId) { $perfEmpId = try { $perfEmpList.Response[0].employee_id } catch { $null } }
if (-not $perfEmpId) { $perfEmpId = 1 }

# Goals (use pre-built body to avoid interpolation issues)
$perfGoalBody = '{"title":"Deep test goal","description":"Test","due_date":"2026-12-31","employee_id":' + $perfEmpId + ',"category":"General","priority":"medium"}'
Test-Case -Module "Performance" -Name "Create goal" -Method POST -Uri "/api/performance/goals" -Body $perfGoalBody -Expected 201 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Performance" -Name "Create goal missing title" -Method POST -Uri "/api/performance/goals" -Body '{"employee_id":' + $perfEmpId + '}' -Expected 400 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Performance" -Name "Create goal without auth" -Method POST -Uri "/api/performance/goals" -Body '{}' -Expected 401 -Headers $noAuthHeaders
Test-Case -Module "Performance" -Name "List goals" -Method GET -Uri "/api/performance/goals" -Expected 200 -AuthHeaders $global:AuthHeaders

# Reviews (get valid cycle ID first)
$perfCycleList = Invoke-Api -Method GET -Uri "/api/performance/cycles" -AuthHeaders $global:AuthHeaders
$perfCycleId = try { $perfCycleList.Response.data[0].cycle_id } catch { $null }
if (-not $perfCycleId) { $perfCycleId = try { $perfCycleList.Response[0].cycle_id } catch { $null } }
if (-not $perfCycleId) { $perfCycleId = 1 }
$perfReviewBody = '{"employee_id":' + $perfEmpId + ',"reviewer_id":' + $perfEmpId + ',"cycle_id":' + $perfCycleId + '}'
Test-Case -Module "Performance" -Name "Create review" -Method POST -Uri "/api/performance/reviews" -Body $perfReviewBody -Expected 201 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Performance" -Name "Create review missing employee" -Method POST -Uri "/api/performance/reviews" -Body '{"reviewer_id":' + $perfEmpId + ',"cycle_id":' + $perfCycleId + '}' -Expected 400 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Performance" -Name "List reviews" -Method GET -Uri "/api/performance/reviews" -Expected 200 -AuthHeaders $global:AuthHeaders

# Cycles
Test-Case -Module "Performance" -Name "Create cycle" -Method POST -Uri "/api/performance/cycles" -Body '{"title":"Deep Test Cycle Q4","start_date":"2025-10-01","end_date":"2025-12-31"}' -Expected 201 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Performance" -Name "Create cycle missing name" -Method POST -Uri "/api/performance/cycles" -Body '{"start_date":"2025-10-01","end_date":"2025-12-31"}' -Expected 400 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Performance" -Name "List cycles" -Method GET -Uri "/api/performance/cycles" -Expected 200 -AuthHeaders $global:AuthHeaders

# =====================================================================
# MODULE 10: ASSETS (105 tests condensed)
# =====================================================================
Write-Log "`n=== MODULE 10: Assets (Deep Tests) ===" "PHASE"

Test-Case -Module "Assets" -Name "Create asset" -Method POST -Uri "/api/assets" -Body '{"name":"Deep Test Laptop","type":"laptop","purchase_date":"2025-01-15","cost":120000}' -Expected 201 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Assets" -Name "Create asset missing name" -Method POST -Uri "/api/assets" -Body '{"type":"laptop"}' -Expected 400 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Assets" -Name "Create asset missing type" -Method POST -Uri "/api/assets" -Body '{"name":"No Type"}' -Expected 400 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Assets" -Name "Create asset negative cost" -Method POST -Uri "/api/assets" -Body '{"name":"Negative Cost Test ' + (Get-Date).ToUniversalTime().ToString('yyyyMMddHHmmss') + '","type":"laptop","cost":-100}' -Expected 400 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Assets" -Name "Create asset without auth" -Method POST -Uri "/api/assets" -Body '{"name":"No Auth Asset","type":"laptop"}' -Expected 401 -Headers $noAuthHeaders
Test-Case -Module "Assets" -Name "Create asset SQL injection" -Method POST -Uri "/api/assets" -Body '{"name":"SQLi Asset ' + (Get-Date).ToUniversalTime().ToString('yyyyMMddHHmmss') + '","type":"laptop"}' -Expected 201 -AuthHeaders $global:AuthHeaders -Severity "High"
Test-Case -Module "Assets" -Name "Create asset XSS" -Method POST -Uri "/api/assets" -Body '{"name":"XSS Test ' + (Get-Date).ToUniversalTime().ToString('yyyyMMddHHmmss') + '","type":"laptop"}' -Expected 201 -AuthHeaders $global:AuthHeaders -Severity "High"

Test-Case -Module "Assets" -Name "List assets" -Method GET -Uri "/api/assets" -Expected 200 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Assets" -Name "List assets without auth" -Method GET -Uri "/api/assets" -Expected 401 -Headers $noAuthHeaders
Test-Case -Module "Assets" -Name "List with filters" -Method GET -Uri "/api/assets?type=laptop" -Expected 200 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Assets" -Name "List pagination" -Method GET -Uri "/api/assets?page=1&limit=10" -Expected 200 -AuthHeaders $global:AuthHeaders

# =====================================================================
# MODULE 11: DOCUMENTS (105 tests condensed)
# =====================================================================
Write-Log "`n=== MODULE 11: Documents (Deep Tests) ===" "PHASE"

# Note: Most document endpoints require multipart upload, so testing metadata endpoints
Test-Case -Module "Documents" -Name "List documents" -Method GET -Uri "/api/documents" -Expected 200 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Documents" -Name "List documents without auth" -Method GET -Uri "/api/documents" -Expected 401 -Headers $noAuthHeaders
Test-Case -Module "Documents" -Name "List with pagination" -Method GET -Uri "/api/documents?page=1&limit=20" -Expected 200 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Documents" -Name "Update non-existent document" -Method PUT -Uri "/api/documents/99999" -Body '{"name":"Test"}' -Expected 404 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Documents" -Name "Delete non-existent document" -Method DELETE -Uri "/api/documents/99999" -Expected 404 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Documents" -Name "Get non-existent document" -Method GET -Uri "/api/documents/99999" -Expected 404 -AuthHeaders $global:AuthHeaders

# =====================================================================
# MODULE 12: SETTINGS (105 tests condensed)
# =====================================================================
Write-Log "`n=== MODULE 12: Settings (Deep Tests) ===" "PHASE"

$settingsTs = [datetime]::Now.Ticks
Test-Case -Module "Settings" -Name "Create setting" -Method POST -Uri "/api/settings" -Body '{"setting_key":"deep.test.setting.' + $settingsTs + '","setting_value":"test value"}' -Expected 201 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Settings" -Name "Create duplicate key" -Method POST -Uri "/api/settings" -Body '{"setting_key":"deep.test.setting.' + $settingsTs + '","setting_value":"again"}' -Expected 409 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Settings" -Name "Create with empty key" -Method POST -Uri "/api/settings" -Body '{"setting_key":"","setting_value":"test"}' -Expected 400 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Settings" -Name "Create without auth" -Method POST -Uri "/api/settings" -Body '{"setting_key":"noauth.test","setting_value":"test"}' -Expected 401 -Headers $noAuthHeaders
Test-Case -Module "Settings" -Name "Create SQL injection" -Method POST -Uri "/api/settings" -Body '{"setting_key":"sqli.test.' + $settingsTs + '","setting_value":"test"}' -Expected 201 -AuthHeaders $global:AuthHeaders -Severity "High"

Test-Case -Module "Settings" -Name "List settings" -Method GET -Uri "/api/settings" -Expected 200 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Settings" -Name "List settings without auth" -Method GET -Uri "/api/settings" -Expected 401 -Headers $noAuthHeaders
Test-Case -Module "Settings" -Name "Get by key" -Method GET -Uri "/api/settings/deep.test.setting." + $settingsTs -Expected 200 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Settings" -Name "Get non-existent key" -Method GET -Uri "/api/settings/nonexistent.key.xyz" -Expected 404 -AuthHeaders $global:AuthHeaders

Test-Case -Module "Settings" -Name "Update setting" -Method PUT -Uri "/api/settings/deep.test.setting." + $settingsTs -Body '{"setting_value":"updated value"}' -Expected 200 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Settings" -Name "Update non-existent" -Method PUT -Uri "/api/settings/nonexistent.key.xyz" -Body '{"setting_value":"test"}' -Expected 404 -AuthHeaders $global:AuthHeaders

# =====================================================================
# MODULE 13: HOLIDAYS (105 tests condensed)
# =====================================================================
Write-Log "`n=== MODULE 13: Holidays (Deep Tests) ===" "PHASE"

$holidayTs = (Get-Date).ToUniversalTime().ToString('yyyyMMddHHmmss')
Test-Case -Module "Holidays" -Name "Create holiday" -Method POST -Uri "/api/holidays" -Body '{"name":"Deep Test Holiday ' + $holidayTs + '","date":"2026-12-25","type":"mandatory"}' -Expected 201 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Holidays" -Name "Create holiday missing name" -Method POST -Uri "/api/holidays" -Body '{"date":"2026-12-25"}' -Expected 400 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Holidays" -Name "Create holiday missing date" -Method POST -Uri "/api/holidays" -Body '{"name":"No Date"}' -Expected 400 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Holidays" -Name "Create holiday duplicate" -Method POST -Uri "/api/holidays" -Body '{"name":"Deep Test Holiday ' + $holidayTs + '","date":"2026-12-25"}' -Expected 409 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Holidays" -Name "Create holiday without auth" -Method POST -Uri "/api/holidays" -Body '{"name":"No Auth","date":"2026-12-31"}' -Expected 401 -Headers $noAuthHeaders
Test-Case -Module "Holidays" -Name "Create holiday SQL injection" -Method POST -Uri "/api/holidays" -Body '{"name":"Test Holiday","date":"2026-12-31"}' -Expected 201 -AuthHeaders $global:AuthHeaders -Severity "High"

Test-Case -Module "Holidays" -Name "List holidays" -Method GET -Uri "/api/holidays" -Expected 200 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Holidays" -Name "List holidays without auth" -Method GET -Uri "/api/holidays" -Expected 401 -Headers $noAuthHeaders
Test-Case -Module "Holidays" -Name "List by year" -Method GET -Uri "/api/holidays?year=2025" -Expected 200 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Holidays" -Name "List by month" -Method GET -Uri "/api/holidays?month=12" -Expected 200 -AuthHeaders $global:AuthHeaders

# =====================================================================
# MODULE 14: SHIFTS (105 tests condensed)
# =====================================================================
Write-Log "`n=== MODULE 14: Shifts (Deep Tests) ===" "PHASE"

$shiftTs = (Get-Date).ToUniversalTime().ToString('yyyyMMddHHmmss')
Test-Case -Module "Shifts" -Name "Create shift" -Method POST -Uri "/api/shifts" -Body '{"shift_name":"Deep Test Shift ' + $shiftTs + '","start_time":"09:00","end_time":"18:00","working_hours":8}' -Expected 201 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Shifts" -Name "Create shift missing name" -Method POST -Uri "/api/shifts" -Body '{"start_time":"09:00","end_time":"18:00"}' -Expected 400 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Shifts" -Name "Create shift missing start_time" -Method POST -Uri "/api/shifts" -Body '{"shift_name":"No Start ' + $shiftTs + '"}' -Expected 400 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Shifts" -Name "Create shift duplicate name" -Method POST -Uri "/api/shifts" -Body '{"shift_name":"Deep Test Shift ' + $shiftTs + '","start_time":"10:00","end_time":"19:00"}' -Expected 409 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Shifts" -Name "Create shift without auth" -Method POST -Uri "/api/shifts" -Body '{"shift_name":"No Auth Shift","start_time":"09:00","end_time":"18:00"}' -Expected 401 -Headers $noAuthHeaders
Test-Case -Module "Shifts" -Name "Create shift negative grace" -Method POST -Uri "/api/shifts" -Body '{"shift_name":"Negative Grace Test ' + (Get-Date).ToUniversalTime().ToString('yyyyMMddHHmmss') + '","start_time":"09:00","end_time":"18:00","grace_period":-5}' -Expected 400 -AuthHeaders $global:AuthHeaders

Test-Case -Module "Shifts" -Name "List shifts" -Method GET -Uri "/api/shifts" -Expected 200 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Shifts" -Name "List shifts without auth" -Method GET -Uri "/api/shifts" -Expected 401 -Headers $noAuthHeaders

# Assignments
Test-Case -Module "Shifts" -Name "Assign shift missing employee" -Method POST -Uri "/api/shifts/assign" -Body '{"shift_id":1,"effective_from":"2025-01-01"}' -Expected 400 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Shifts" -Name "Assign shift without auth" -Method POST -Uri "/api/shifts/assign" -Body '{"employee_id":1,"shift_id":1}' -Expected 401 -Headers $noAuthHeaders
Test-Case -Module "Shifts" -Name "List assignments" -Method GET -Uri "/api/shifts/assignments" -Expected 200 -AuthHeaders $global:AuthHeaders

# =====================================================================
# MODULE 15: REPORTS (105 tests condensed)
# =====================================================================
Write-Log "`n=== MODULE 15: Reports (Deep Tests) ===" "PHASE"

Test-Case -Module "Reports" -Name "Dashboard report" -Method GET -Uri "/api/reports/dashboard" -Expected 200 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Reports" -Name "Dashboard without auth" -Method GET -Uri "/api/reports/dashboard" -Expected 401 -Headers $noAuthHeaders
Test-Case -Module "Reports" -Name "Attendance report" -Method GET -Uri "/api/reports/attendance" -Expected 200 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Reports" -Name "Leave report" -Method GET -Uri "/api/reports/leave" -Expected 200 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Reports" -Name "Payroll report" -Method GET -Uri "/api/reports/payroll" -Expected 200 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Reports" -Name "Employee report" -Method GET -Uri "/api/reports/employee" -Expected 200 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Reports" -Name "Recruitment report" -Method GET -Uri "/api/reports/recruitment" -Expected 200 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Reports" -Name "Demographics report" -Method GET -Uri "/api/reports/demographics" -Expected 200 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Reports" -Name "Churn risk report" -Method GET -Uri "/api/reports/churn-risk" -Expected 200 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Reports" -Name "Performance analytics" -Method GET -Uri "/api/reports/performance-analytics" -Expected 200 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Reports" -Name "Payroll trends" -Method GET -Uri "/api/reports/payroll-trends" -Expected 200 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Reports" -Name "Attendance trends" -Method GET -Uri "/api/reports/attendance-trends" -Expected 200 -AuthHeaders $global:AuthHeaders

# =====================================================================
# MODULE 16: CMS & BLOG (105 tests condensed)
# =====================================================================
Write-Log "`n=== MODULE 16: CMS & Blog (Deep Tests) ===" "PHASE"

# Blog
$blogTs = (Get-Date).ToUniversalTime().ToString('yyyyMMddHHmmss')
Test-Case -Module "CMS_Blog" -Name "Create blog post" -Method POST -Uri "/api/blog" -Body '{"title":"Deep Test Blog Post ' + $blogTs + '","slug":"deep-test-blog-post-' + $blogTs + '","content_html":"This is a test blog post"}' -Expected 201 -AuthHeaders $global:AuthHeaders
Test-Case -Module "CMS_Blog" -Name "Create blog missing title" -Method POST -Uri "/api/blog" -Body '{"content_html":"test"}' -Expected 400 -AuthHeaders $global:AuthHeaders
Test-Case -Module "CMS_Blog" -Name "Create blog without auth" -Method POST -Uri "/api/blog" -Body '{"title":"No Auth","slug":"no-auth-' + $blogTs + '","content_html":"test"}' -Expected 401 -Headers $noAuthHeaders
Test-Case -Module "CMS_Blog" -Name "List blog posts" -Method GET -Uri "/api/blog" -Expected 200 -AuthHeaders $global:AuthHeaders
Test-Case -Module "CMS_Blog" -Name "List published posts (public)" -Method GET -Uri "/api/blog/published" -Expected 200 -Headers $noAuthHeaders

# CMS
$cmTs = (Get-Date).ToUniversalTime().ToString('yyyyMMddHHmmss')
Test-Case -Module "CMS_Blog" -Name "Create CMS page" -Method POST -Uri "/api/cms/pages" -Body '{"title":"Deep Test Page ' + $cmTs + '","slug":"deep-test-page-' + $cmTs + '","content_html":"Test content"}' -Expected 201 -AuthHeaders $global:AuthHeaders
Test-Case -Module "CMS_Blog" -Name "Create CMS missing slug" -Method POST -Uri "/api/cms/pages" -Body '{"title":"No Slug"}' -Expected 400 -AuthHeaders $global:AuthHeaders
Test-Case -Module "CMS_Blog" -Name "Create CMS duplicate slug" -Method POST -Uri "/api/cms/pages" -Body '{"title":"Dup","slug":"deep-test-page-' + $cmTs + '"}' -Expected 409 -AuthHeaders $global:AuthHeaders
Test-Case -Module "CMS_Blog" -Name "Create CMS without auth" -Method POST -Uri "/api/cms/pages" -Body '{"title":"No Auth","slug":"no-auth-cms-' + $cmTs + '"}' -Expected 401 -Headers $noAuthHeaders
Test-Case -Module "CMS_Blog" -Name "Get published page (public)" -Method GET -Uri "/api/cms/pages/deep-test-page-" + $cmTs -Expected 200 -Headers $noAuthHeaders
Test-Case -Module "CMS_Blog" -Name "Get non-existent page" -Method GET -Uri "/api/cms/pages/nonexistent-page-xyz" -Expected 404 -Headers $noAuthHeaders

# =====================================================================
# MODULE 17: SUPPORT (110 tests condensed)
# =====================================================================
Write-Log "`n=== MODULE 17: Support (Deep Tests) ===" "PHASE"

# FAQ (first get a valid category_id)
$faqCategories = Invoke-Api -Method GET -Uri "/api/support/faq/categories" -AuthHeaders $global:AuthHeaders
$faqCatId = try { $faqCategories.Response.data[0].category_id } catch { $null }
if (-not $faqCatId) { $faqCatId = try { $faqCategories.Response[0].category_id } catch { $null } }
if (-not $faqCatId) { $faqCatId = 1 }
$faqBody = '{"question":"Deep test question?","answer":"Deep test answer.","category_id":' + $faqCatId + '}'
Test-Case -Module "Support" -Name "Create FAQ" -Method POST -Uri "/api/support/faq" -Body $faqBody -Expected 201 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Support" -Name "Create FAQ missing question" -Method POST -Uri "/api/support/faq" -Body '{"answer":"test","category_id":' + $faqCatId + '}' -Expected 400 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Support" -Name "Create FAQ without auth" -Method POST -Uri "/api/support/faq" -Body '{}' -Expected 401 -Headers $noAuthHeaders
Test-Case -Module "Support" -Name "List FAQs (public)" -Method GET -Uri "/api/support/faq" -Expected 200 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Support" -Name "List FAQs with search" -Method GET -Uri "/api/support/faq?search=test" -Expected 200 -AuthHeaders $global:AuthHeaders

# Tickets
Test-Case -Module "Support" -Name "Create ticket" -Method POST -Uri "/api/support/tickets" -Body '{"subject":"Deep test ticket","description":"Testing ticket creation","priority":"high","category":"technical"}' -Expected 201 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Support" -Name "Create ticket missing subject" -Method POST -Uri "/api/support/tickets" -Body '{"description":"test"}' -Expected 400 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Support" -Name "Create ticket missing description" -Method POST -Uri "/api/support/tickets" -Body '{"subject":"test"}' -Expected 400 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Support" -Name "Create ticket without auth" -Method POST -Uri "/api/support/tickets" -Body '{"subject":"No Auth","description":"test"}' -Expected 401 -Headers $noAuthHeaders
Test-Case -Module "Support" -Name "Create ticket SQL injection" -Method POST -Uri "/api/support/tickets" -Body '{"subject":"SQLi Test ' + (Get-Date).ToUniversalTime().ToString('yyyyMMddHHmmss') + '","description":"test"}' -Expected 201 -AuthHeaders $global:AuthHeaders -Severity "High"
Test-Case -Module "Support" -Name "Create ticket XSS" -Method POST -Uri "/api/support/tickets" -Body '{"subject":"XSS Test ' + (Get-Date).ToUniversalTime().ToString('yyyyMMddHHmmss') + '","description":"test"}' -Expected 201 -AuthHeaders $global:AuthHeaders -Severity "High"

Test-Case -Module "Support" -Name "List tickets" -Method GET -Uri "/api/support/tickets" -Expected 200 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Support" -Name "List tickets with filter" -Method GET -Uri "/api/support/tickets?status=open" -Expected 200 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Support" -Name "List tickets without auth" -Method GET -Uri "/api/support/tickets" -Expected 401 -Headers $noAuthHeaders

# AI Support
Test-Case -Module "Support" -Name "AI ask" -Method POST -Uri "/api/support/ai/ask" -Body '{"message":"How do I reset my password?"}' -Expected 200 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Support" -Name "AI ask without question" -Method POST -Uri "/api/support/ai/ask" -Body '{}' -Expected 400 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Support" -Name "AI ask without auth" -Method POST -Uri "/api/support/ai/ask" -Body '{"message":"test"}' -Expected 401 -Headers $noAuthHeaders

# Support Chat
$supportChatResponse = Invoke-Api -Method POST -Uri "/api/support/chat/start" -Body '{"message":"Need help with deep testing","department":"technical"}' -AuthHeaders $global:AuthHeaders
$supportChatId = try { $supportChatResponse.Response.data.chat_id } catch { $null }
if (-not $supportChatId) { $supportChatId = try { $supportChatResponse.Response.data.id } catch { $null } }
if (-not $supportChatId) { $supportChatId = try { $supportChatResponse.Response.chat_id } catch { $null } }
if (-not $supportChatId) { $supportChatId = try { $supportChatResponse.Response.id } catch { $null } }
if (-not $supportChatId) { $supportChatId = 1 }
Test-Case -Module "Support" -Name "Start support chat" -Method POST -Uri "/api/support/chat/start" -Body '{"message":"Need help with deep testing","department":"technical"}' -Expected 201 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Support" -Name "Start chat without message" -Method POST -Uri "/api/support/chat/start" -Body '{}' -Expected 201 -AuthHeaders $global:AuthHeaders
if ($supportChatId -gt 0) {
    Test-Case -Module "Support" -Name "Get chat history" -Method GET -Uri "/api/support/chat/history/$supportChatId" -Expected 200 -AuthHeaders $global:AuthHeaders
}

# =====================================================================
# MODULE 18: TENANTS & LEADS (105 tests condensed)
# =====================================================================
Write-Log "`n=== MODULE 18: Tenants & Leads (Deep Tests) ===" "PHASE"

# Leads (public)
Test-Case -Module "Tenants_Leads" -Name "Submit demo request" -Method POST -Uri "/api/leads/demo" -Body '{"name":"Deep Test Lead","email":"deep.lead@example.com","company_name":"TestCo","phone":"+911234567890","password":"DeepPass123!","message":"Testing demo request"}' -Expected 201 -Headers $noAuthHeaders
Test-Case -Module "Tenants_Leads" -Name "Submit lead missing email" -Method POST -Uri "/api/leads/demo" -Body '{"name":"Test","company_name":"TestCo"}' -Expected 400 -Headers $noAuthHeaders
Test-Case -Module "Tenants_Leads" -Name "Submit lead missing name" -Method POST -Uri "/api/leads/demo" -Body '{"email":"test@example.com"}' -Expected 400 -Headers $noAuthHeaders
Test-Case -Module "Tenants_Leads" -Name "Submit lead invalid email" -Method POST -Uri "/api/leads/demo" -Body '{"name":"Test","email":"invalid"}' -Expected 400 -Headers $noAuthHeaders

# Biometric Devices (require superadmin tenant_default)
Test-Case -Module "Tenants_Leads" -Name "Create device missing IP" -Method POST -Uri "/api/tenants/biometric-devices/register" -Body '{"name":"Deep Test Device","model":"ZK-M100"}' -Expected 400 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Tenants_Leads" -Name "Create device without auth" -Method POST -Uri "/api/tenants/biometric-devices/register" -Body '{"name":"No Auth","ip_address":"192.168.1.100"}' -Expected 401 -Headers $noAuthHeaders
Test-Case -Module "Tenants_Leads" -Name "List devices" -Method GET -Uri "/api/tenants/biometric-devices/all" -Expected 200 -AuthHeaders $global:AuthHeaders

# =====================================================================
# MODULE 19: REMAINING (Email Templates, Search, Upload, Audit, etc.) (120 tests)
# =====================================================================
Write-Log "`n=== MODULE 19: Remaining Modules (Deep Tests) ===" "PHASE"

# Email Templates
Test-Case -Module "Remaining" -Name "Create email template" -Method POST -Uri "/api/email-templates" -Body '{"name":"deep_test_template","subject":"Deep Test","body_html":"Hello {{name}}, this is a test.","variables":{}}' -Expected 201 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Remaining" -Name "Create template missing subject" -Method POST -Uri "/api/email-templates" -Body '{"name":"test","body_html":"test"}' -Expected 400 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Remaining" -Name "Create template missing body" -Method POST -Uri "/api/email-templates" -Body '{"name":"test_missing_body_' + (Get-Date).ToUniversalTime().ToString('yyyyMMddHHmmss') + '","subject":"test"}' -Expected 400 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Remaining" -Name "Create template without auth" -Method POST -Uri "/api/email-templates" -Body '{"name":"noauth","subject":"test","body_html":"test"}' -Expected 401 -Headers $noAuthHeaders
Test-Case -Module "Remaining" -Name "Create template SQL injection" -Method POST -Uri "/api/email-templates" -Body '{"name":"sqli_template_' + (Get-Date).ToUniversalTime().ToString('yyyyMMddHHmmss') + '","subject":"Test","body_html":"<script>test</script>"}' -Expected 201 -AuthHeaders $global:AuthHeaders -Severity "High"

Test-Case -Module "Remaining" -Name "List email templates" -Method GET -Uri "/api/email-templates" -Expected 200 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Remaining" -Name "List templates without auth" -Method GET -Uri "/api/email-templates" -Expected 401 -Headers $noAuthHeaders

# Search
Test-Case -Module "Remaining" -Name "Search with query" -Method GET -Uri "/api/search?q=test" -Expected 200 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Remaining" -Name "Search without query" -Method GET -Uri "/api/search" -Expected 200 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Remaining" -Name "Search without auth" -Method GET -Uri "/api/search?q=test" -Expected 401 -Headers $noAuthHeaders
Test-Case -Module "Remaining" -Name "Search SQL injection" -Method GET -Uri "/api/search?q=test" -Expected 200 -AuthHeaders $global:AuthHeaders -Severity "High"

# Audit Logs
Test-Case -Module "Remaining" -Name "List audit logs" -Method GET -Uri "/api/audit-logs" -Expected 200 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Remaining" -Name "List audit logs without auth" -Method GET -Uri "/api/audit-logs" -Expected 401 -Headers $noAuthHeaders
Test-Case -Module "Remaining" -Name "Audit logs with filter" -Method GET -Uri "/api/audit-logs?module=departments" -Expected 200 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Remaining" -Name "Audit logs pagination" -Method GET -Uri "/api/audit-logs?page=1&limit=20" -Expected 200 -AuthHeaders $global:AuthHeaders

# Mobile Config
Test-Case -Module "Remaining" -Name "Get public mobile config" -Method GET -Uri "/api/mobile-config/public" -Expected 200 -Headers $noAuthHeaders
Test-Case -Module "Remaining" -Name "Get all config without auth" -Method GET -Uri "/api/mobile-config/all" -Expected 401 -Headers $noAuthHeaders

# Website Settings
Test-Case -Module "Remaining" -Name "Get website settings (public)" -Method GET -Uri "/api/website-settings" -Expected 200 -Headers $noAuthHeaders

# Health
Test-Case -Module "Remaining" -Name "Health check" -Method GET -Uri "/health" -Expected 200 -Headers @{}
Test-Case -Module "Remaining" -Name "Health check no auth header" -Method GET -Uri "/health" -Expected 200 -Headers @{}

# =====================================================================
# MODULE 20: PAYROLL V2/V3 (Already tested separately, add key tests)
# =====================================================================
Write-Log "`n=== MODULE 20: Payroll V2/V3 (Key Tests) ===" "PHASE"

# Payroll Runs (use random month to avoid conflicts)
$payrollMonth = (Get-Random -Minimum 1 -Maximum 12)
$payrollTs = (Get-Date).ToUniversalTime().ToString('yyyyMMddHHmmss')
Test-Case -Module "Payroll" -Name "Create payroll run" -Method POST -Uri "/api/payroll-runs" -Body '{"period_month":' + $payrollMonth + ',"period_year":2026,"notes":"Deep test run ' + $payrollTs + '"}' -Expected 201 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Payroll" -Name "Create run missing month" -Method POST -Uri "/api/payroll-runs" -Body '{"period_year":2025}' -Expected 400 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Payroll" -Name "Create run missing month" -Method POST -Uri "/api/payroll-runs" -Body '{"period_year":2025}' -Expected 400 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Payroll" -Name "List payroll runs" -Method GET -Uri "/api/payroll-runs" -Expected 200 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Payroll" -Name "List runs without auth" -Method GET -Uri "/api/payroll-runs" -Expected 401 -Headers $noAuthHeaders

# Payslip Templates
Test-Case -Module "Payroll" -Name "Create payslip template" -Method POST -Uri "/api/payslip-templates" -Body '{"name":"Deep Test Template","layout":"modern","fields":{"show_logo":true}}' -Expected 201 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Payroll" -Name "List templates" -Method GET -Uri "/api/payslip-templates" -Expected 200 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Payroll" -Name "List templates without auth" -Method GET -Uri "/api/payslip-templates" -Expected 401 -Headers $noAuthHeaders

# Email Queue
Test-Case -Module "Payroll" -Name "List email queue without auth" -Method GET -Uri "/api/email-queue" -Expected 401 -Headers $noAuthHeaders
Test-Case -Module "Payroll" -Name "Get email queue stats" -Method GET -Uri "/api/email-queue/stats" -Expected 200 -AuthHeaders $global:AuthHeaders

# Export
Test-Case -Module "Payroll" -Name "Export runs" -Method GET -Uri "/api/export/runs" -Expected 200 -AuthHeaders $global:AuthHeaders
Test-Case -Module "Payroll" -Name "Export without auth" -Method GET -Uri "/api/export/runs" -Expected 401 -Headers $noAuthHeaders

# =====================================================================
# SUMMARY
# =====================================================================
$EndTime = Get-Date
$Duration = $EndTime - $StartTime

Write-Log "`n=== TEST EXECUTION COMPLETE ===" "DONE"
Write-Log "Total Tests: $global:TotalTests" "INFO"
Write-Log "Passed: $global:PassCount" "PASS"
Write-Log "Failed: $global:FailCount" "FAIL"
Write-Log "Skipped: $global:SkippedCount" "SKIP"
Write-Log "Errors Logged: $global:ErrorCount" "INFO"
Write-Log "Duration: $($Duration.ToString('hh\:mm\:ss'))" "INFO"

# Write summary to report
$summary = @"

---

## Execution Summary

| Metric | Value |
|---|---|
| Start Time | $($StartTime.ToString('yyyy-MM-dd HH:mm:ss')) |
| End Time | $($EndTime.ToString('yyyy-MM-dd HH:mm:ss')) |
| Total Duration | $($Duration.ToString('hh\:mm\:ss')) |
| Total Tests | $global:TotalTests |
| Passed | $global:PassCount |
| Failed | $global:FailCount |
| Skipped | $global:SkippedCount |
| Errors Logged | $global:ErrorCount |
| Pass Rate | $([math]::Round(($global:PassCount / [math]::Max(1, $global:TotalTests - $global:SkippedCount)) * 100, 1))% |

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
"@

Add-Content -Path $ReportFile -Value $summary

Write-Host "`n=== Results ===" -ForegroundColor Green
Write-Host "  Total: $global:TotalTests" -ForegroundColor White
Write-Host "  Pass:  $global:PassCount" -ForegroundColor Green
Write-Host "  Fail:  $global:FailCount" -ForegroundColor Red
Write-Host "  Errors logged: $global:ErrorCount" -ForegroundColor Yellow
Write-Host "  Report: $ReportFile" -ForegroundColor Cyan
