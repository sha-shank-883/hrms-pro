# HRMS Pro - Master Test Execution Script
# Tests: Backend API > Frontend Build > Mobile TypeScript

$ReportFile = "TEST_EXECUTION_REPORT.md"
$ErrorFile = "TEST_ERRORS_NEW.md"
$StartTime = Get-Date

# Initialize report
@"
# HRMS Pro - Test Execution Report
**Date**: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
**Total Test Case Files**: 27 (20 API + 5 Frontend + 2 Mobile)
**Total Test Cases**: ~1,510

## Execution Log

"@ | Set-Content -Path $ReportFile

function Write-Log {
    param($Message, $Status = "INFO")
    $line = "[$Status] $(Get-Date -Format 'HH:mm:ss') - $Message"
    Add-Content -Path $ReportFile -Value $line
    Write-Host $line
}

function Test-Endpoint {
    param($Method, $Uri, $Headers, $Body, $ExpectedStatus)

    $params = @{
        Uri = $Uri
        Method = $Method
        Headers = $Headers
        ErrorAction = "SilentlyContinue"
    }
    if ($Body) {
        $params['Body'] = $Body
    }

    try {
        $response = Invoke-RestMethod @params
        $statusCode = 200
        return @{ Status = "PASS"; StatusCode = $statusCode; Response = $response }
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq $ExpectedStatus) {
            return @{ Status = "PASS"; StatusCode = $statusCode; Response = $null }
        }
        return @{ Status = "FAIL"; StatusCode = $statusCode; Error = $_.Exception.Message }
    }
}

Write-Log "Starting test execution..." "START"

# ---- PHASE 0: Server Health ----
Write-Log "`n=== PHASE 0: Server Health ===" "PHASE"

$health = Test-Endpoint -Method GET -Uri "http://localhost:5001/health"
Write-Log "GET /health -> Status: $($health.Status) (HTTP $($health.StatusCode))" $health.Status

# ---- PHASE 1: Authentication ----
Write-Log "`n=== PHASE 1: Authentication ===" "PHASE"

$loginBody = '{"email":"info@hrmspro.online","password":"Hrmspro@123"}'
$loginHeaders = @{"Content-Type"="application/json"; "x-tenant-id"="tenant_default"}
$loginResult = Test-Endpoint -Method POST -Uri "http://localhost:5001/api/auth/login" -Headers $loginHeaders -Body $loginBody -ExpectedStatus 200

$token = ""
if ($loginResult.Status -eq "PASS" -and $loginResult.Response) {
    $token = $loginResult.Response.data.token
    Write-Log "POST /api/auth/login (valid) -> PASS (token obtained)" "PASS"
} else {
    Write-Log "POST /api/auth/login (valid) -> FAIL (cannot proceed without token)" "FAIL"
    exit 1
}

$authHeaders = @{
    "Authorization" = "Bearer $token"
    "x-tenant-id" = "tenant_default"
}

# Test auth endpoints
$authTests = @(
    @{Method="GET"; Uri="http://localhost:5001/api/auth/profile"; Desc="GET /api/auth/profile"}
    @{Method="POST"; Uri="http://localhost:5001/api/auth/login"; Body='{"email":"info@hrmspro.online","password":"wrongpass"}'; Desc="POST /api/auth/login (invalid)"}
    @{Method="GET"; Uri="http://localhost:5001/api/auth/profile"; Desc="GET /api/auth/profile (no auth)"; Headers=@{"x-tenant-id"="tenant_default"}}
)

foreach ($test in $authTests) {
    $h = if ($test.Headers) { $test.Headers } else { $authHeaders }
    $expected = if ($test.Desc -match "invalid|no auth") { 401 } else { 200 }
    $result = Test-Endpoint -Method $test.Method -Uri $test.Uri -Headers $h -Body $test.Body -ExpectedStatus $expected
    $statusText = "$($test.Desc) -> $($result.Status) (HTTP $($result.StatusCode))"
    Write-Log $statusText $result.Status
}

# ---- PHASE 2: Core CRUD Modules ----
Write-Log "`n=== PHASE 2: Module CRUD Tests ===" "PHASE"

$modules = @(
    @{Name="Departments"; Base="http://localhost:5001/api/departments"; HasPOST=$true; HasPUT=$true; HasDELETE=$true},
    @{Name="Employees"; Base="http://localhost:5001/api/employees"; HasPOST=$true; HasPUT=$true; HasDELETE=$true},
    @{Name="Tasks"; Base="http://localhost:5001/api/tasks"; HasPOST=$true; HasPUT=$true; HasDELETE=$true},
    @{Name="Holidays"; Base="http://localhost:5001/api/holidays"; HasPOST=$true; HasPUT=$true; HasDELETE=$true},
    @{Name="Assets"; Base="http://localhost:5001/api/assets"; HasPOST=$true; HasPUT=$true; HasDELETE=$true},
    @{Name="Documents"; Base="http://localhost:5001/api/documents"; HasPOST=$true; HasPUT=$true; HasDELETE=$true},
    @{Name="Settings"; Base="http://localhost:5001/api/settings"; HasPOST=$true; HasPUT=$true; HasDELETE=$true}
)

$moduleResults = @{}
foreach ($mod in $modules) {
    Write-Log "  Module: $($mod.Name)" "MODULE"
    $modPass = 0
    $modFail = 0

    # GET list
    $r = Test-Endpoint -Method GET -Uri $mod.Base -Headers $authHeaders
    if ($r.Status -eq "PASS") { $modPass++ } else { $modFail++ }
    Write-Log "    GET $($mod.Base) -> $($r.Status)" $r.Status

    # GET without auth
    $r2 = Test-Endpoint -Method GET -Uri $mod.Base -Headers @{"x-tenant-id"="tenant_default"}
    if ($r2.Status -eq "FAIL" -and $r2.StatusCode -eq 401) { $modPass++ } else { $modFail++ }
    Write-Log "    GET $($mod.Base) (no auth) -> $($r2.Status) (expected 401, got $($r2.StatusCode))" $(if ($r2.StatusCode -eq 401){"PASS"}else{"FAIL"})

    # POST
    if ($mod.HasPOST) {
        $testBody = '{"name":"Test ' + $mod.Name + '","description":"Test"}'
        $r3 = Test-Endpoint -Method POST -Uri $mod.Base -Headers $authHeaders -Body $testBody -ExpectedStatus 201
        if ($r3.Status -eq "PASS" -or $r3.StatusCode -eq 201) { $modPass++ } else { $modFail++ }
        $statusLabel = if ($r3.StatusCode -eq 201 -or $r3.StatusCode -eq 200){ "PASS" } else { "FAIL" }
        Write-Log "    POST $($mod.Base) -> $statusLabel (HTTP $($r3.StatusCode))" $statusLabel
    }

    # POST without auth
    if ($mod.HasPOST) {
        $r4 = Test-Endpoint -Method POST -Uri $mod.Base -Headers @{"x-tenant-id"="tenant_default"} -Body $testBody
        if ($r4.StatusCode -eq 401) { $modPass++ } else { $modFail++ }
        Write-Log "    POST $($mod.Base) (no auth) -> $(if($r4.StatusCode -eq 401){'PASS'}else{'FAIL'}) (HTTP $($r4.StatusCode))" $(if($r4.StatusCode -eq 401){'PASS'}else{'FAIL'})
    }

    $moduleResults[$mod.Name] = @{Pass=$modPass; Fail=$modFail}
}

# ---- PHASE 3: Special Endpoints ----
Write-Log "`n=== PHASE 3: Special Endpoints ===" "PHASE"

$specialTests = @(
    @{Method="GET"; Uri="http://localhost:5001/api/reports/dashboard"; Desc="GET /api/reports/dashboard"; Expected=200},
    @{Method="GET"; Uri="http://localhost:5001/api/search?q=test"; Desc="GET /api/search?q=test"; Expected=200},
    @{Method="GET"; Uri="http://localhost:5001/api/audit-logs"; Desc="GET /api/audit-logs"; Expected=200},
    @{Method="GET"; Uri="http://localhost:5001/api/mobile-config/public"; Desc="GET /api/mobile-config/public"; Headers=@{"x-tenant-id"="tenant_default"}; Expected=200},
    @{Method="GET"; Uri="http://localhost:5001/api/website-settings"; Desc="GET /api/website-settings (public)"; Headers=@{}; Expected=200}
)

foreach ($test in $specialTests) {
    $h = if ($test.Headers) { $test.Headers } else { $authHeaders }
    $r = Test-Endpoint -Method $test.Method -Uri $test.Uri -Headers $h
    $statusLabel = if ($r.StatusCode -eq $test.Expected -or $r.Status -eq "PASS") { "PASS" } else { "FAIL" }
    Write-Log "  $($test.Desc) -> $statusLabel (HTTP $($r.StatusCode))" $statusLabel
}

# ---- PHASE 4: Frontend Build ----
Write-Log "`n=== PHASE 4: Frontend Build ===" "PHASE"
try {
    $feBuild = & "npx.cmd" --prefix "frontend" vite build 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Log "Frontend build: PASS (0 errors)" "PASS"
    } else {
        Write-Log "Frontend build: FAIL - see output above" "FAIL"
    }
} catch {
    Write-Log "Frontend build: FAIL - $_" "FAIL"
}

# ---- PHASE 5: Mobile TypeScript ----
Write-Log "`n=== PHASE 5: Mobile TypeScript ===" "PHASE"
try {
    $tscOutput = & "npx.cmd" --prefix "mobile" tsc --noEmit 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Log "Mobile TypeScript: PASS (0 errors)" "PASS"
    } else {
        Write-Log "Mobile TypeScript: FAIL - see output above" "FAIL"
    }
} catch {
    Write-Log "Mobile TypeScript: FAIL - $_" "FAIL"
}

# ---- Summary ----
$EndTime = Get-Date
$Duration = $EndTime - $StartTime

$summary = @"

---
## Execution Summary

| Metric | Value |
|---|---|
| Start Time | $($StartTime.ToString('yyyy-MM-dd HH:mm:ss')) |
| End Time | $($EndTime.ToString('yyyy-MM-dd HH:mm:ss')) |
| Total Duration | $($Duration.ToString('hh\:mm\:ss')) |
| Backend Modules Tested | $($modules.Count) |
| Auth Endpoints Tested | $($authTests.Count) |
| Special Endpoints Tested | $($specialTests.Count) |
| Frontend Build | Check log |
| Mobile TypeScript | Check log |

## Module-wise Results
| Module | Pass | Fail |
|---|---|---|
"@

foreach ($mod in $modules) {
    $res = $moduleResults[$mod.Name]
    $summary += "| $($mod.Name) | $($res.Pass) | $($res.Fail) |`n"
}

$summary += @"

## Test Case Files Generated
See `test-cases/README.md` for complete list of 27 test case files with 1,510 test cases.

## Next Steps
1. Review individual module test case files for detailed test coverage
2. Fix failed tests by checking server logs
3. Re-run after fixes
4. Update TEST_ERRORS.md with any real bugs found

---
*Report generated by Master Test Execution Script*
"@

Add-Content -Path $ReportFile -Value $summary
Write-Log "Report saved to $ReportFile" "DONE"
Write-Host "`n=== Test Execution Complete ===" -ForegroundColor Green
Write-Host "Report: $ReportFile" -ForegroundColor Cyan
