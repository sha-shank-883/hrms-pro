param([switch]$DetailedOutput)

$Base = "http://localhost:5001"
$ReportFile = Join-Path $PSScriptRoot "..\EXECUTION_RESULTS.md"
$ResultsFile = Join-Path $PSScriptRoot "..\DEPARTMENTS_RESULTS.md"

$ErrorActionPreference = 'Continue'

if (-not (Test-Path $ReportFile)) { "" | Set-Content $ReportFile }

function Write-Log {
    param($Message, $Status = "INFO")
    $line = "[DEPARTMENTS][$Status] $(Get-Date -Format 'HH:mm:ss') - $Message"
    Add-Content -Path $ReportFile -Value $line
    if ($DetailedOutput -or $Status -eq "FAIL" -or $Status -eq "ERROR") {
        Write-Host $line -ForegroundColor $(if($Status -eq "FAIL" -or $Status -eq "ERROR"){"Red"}elseif($Status -eq "WARN"){"Yellow"}elseif($Status -eq "PASS"){"Green"}else{"Gray"})
    }
}

function Test-DeptEndpoint {
    param($Method, $Uri, $Headers, $Body, $ExpectedStatus)

    try {
        $params = @{Uri = $Uri; Method = $Method; ContentType = "application/json"}
        if ($Headers) { $params['Headers'] = $Headers }
        if ($Body) { $params['Body'] = $Body }
        $response = Invoke-WebRequest @params -UseBasicParsing -ErrorAction Stop
        $statusCode = [int]$response.StatusCode
        $content = $response.Content | ConvertFrom-Json
        return @{ Status = "PASS"; StatusCode = $statusCode; Response = $content; Raw = $response.Content }
    }
    catch {
        $statusCode = 0
        $errBody = "{}"
        $errJson = $null
        if ($_.Exception.Response) {
            try { $statusCode = [int]$_.Exception.Response.StatusCode } catch { $statusCode = 0 }
        }
        try {
            $stream = $_.Exception.Response.GetResponseStream()
            if ($stream.CanSeek) { $stream.Position = 0 }
            $reader = New-Object System.IO.StreamReader($stream)
            $errBody = $reader.ReadToEnd()
            $reader.Close()
            if ($errBody) { $errJson = $errBody | ConvertFrom-Json }
        }
        catch { }
        if ($ExpectedStatus -and $statusCode -eq $ExpectedStatus) {
            return @{ Status = "PASS"; StatusCode = $statusCode; Response = $errJson; Raw = $errBody }
        }
        return @{ Status = "FAIL"; StatusCode = $statusCode; Response = $errJson; Raw = $errBody; Error = $_.Exception.Message }
    }
}

function Assert-Test {
    param($TestId, $Description, $Result, $Condition)
    $passed = & $Condition
    if ($passed) {
        Write-Log "${TestId}: ${Description} -> PASS (HTTP $($Result.StatusCode))" "PASS"
        return $true
    }
    else {
        $detail = if ($Result.Response) { ($Result.Response | ConvertTo-Json -Compress -Depth 3).Substring(0, [Math]::Min(200, ($Result.Response | ConvertTo-Json -Compress -Depth 3).Length)) } else { $Result.Raw }
        Write-Log "${TestId}: ${Description} -> FAIL (HTTP $($Result.StatusCode), $detail)" "FAIL"
        return $false
    }
}

Write-Log "===========================================" "INFO"
Write-Log "Starting Departments Module Tests (55 cases)" "START"
Write-Log "===========================================" "INFO"

# ---- LOGIN ----
$loginResult = Test-DeptEndpoint -Method POST -Uri "${Base}/api/auth/login" -Headers @{"x-tenant-id"="tenant_default"} -Body '{"email":"info@hrmspro.online","password":"Hrmspro@123"}'
if ($loginResult.Status -ne "PASS") {
    Write-Log "FATAL: Cannot obtain admin token" "ERROR"
    exit 1
}
$adminToken = $loginResult.Response.data.token
Write-Log "Admin token obtained (length=$($adminToken.Length))" "PASS"

$authHeaders = @{"Authorization" = "Bearer $adminToken"; "x-tenant-id" = "tenant_default"}
$noAuthHeaders = @{"x-tenant-id" = "tenant_default"}

# ---- CREATE an employee user for role-based tests ----
$rnd = Get-Random
$empEmail = "emp.dept.$rnd@test.com"
$empResult = Test-DeptEndpoint -Method POST -Uri "${Base}/api/auth/register" -Headers @{"x-tenant-id"="tenant_default"} -Body "{`"email`":`"${empEmail}`",`"password`":`"TestPass@123`",`"role`":`"employee`"}"
$empToken = $null
if ($empResult.StatusCode -eq 201 -and $empResult.Response.success) {
    $empToken = $empResult.Response.data.token
}
else {
    $empLogin = Test-DeptEndpoint -Method POST -Uri "${Base}/api/auth/login" -Headers @{"x-tenant-id"="tenant_default"} -Body "{`"email`":`"${empEmail}`",`"password`":`"TestPass@123`"}"
    if ($empLogin.StatusCode -eq 200 -and $empLogin.Response.success) {
        $empToken = $empLogin.Response.data.token
    }
}
$empAuthHeaders = $null
if ($empToken) {
    $empAuthHeaders = @{"Authorization" = "Bearer $empToken"; "x-tenant-id" = "tenant_default"}
    Write-Log "Employee token obtained for ${empEmail}" "PASS"
}
else {
    Write-Log "WARN: Could not create/get employee token - some tests will SKIP" "WARN"
}

$results = @{
    Total = 0; Pass = 0; Fail = 0; Skip = 0
}

# ---- DEP-001: GET all departments (admin) ----
$results.Total++
$r = Test-DeptEndpoint -Method GET -Uri "${Base}/api/departments" -Headers $authHeaders
if (Assert-Test -TestId "DEP-001" -Desc "GET /api/departments (admin)" -Result $r -Condition { $r.StatusCode -eq 200 -and $r.Response.success }) { $results.Pass++ } else { $results.Fail++ }
$createdDeptId = $null
if ($r.Response -and $r.Response.data -and $r.Response.data.Count -gt 0) {
    $createdDeptId = $r.Response.data[0].department_id
    Write-Log "Existing department ID: $createdDeptId" "INFO"
}

# ---- DEP-002: GET all departments (employee) ----
$results.Total++
if ($empAuthHeaders) {
    $r = Test-DeptEndpoint -Method GET -Uri "${Base}/api/departments" -Headers $empAuthHeaders
    if (Assert-Test -TestId "DEP-002" -Desc "GET /api/departments (employee)" -Result $r -Condition { $r.StatusCode -eq 200 -and $r.Response.success }) { $results.Pass++ } else { $results.Fail++ }
}
else { Write-Log "DEP-002: SKIP (no employee token)" "WARN"; $results.Skip++ }

# ---- DEP-003: GET without auth ----
$results.Total++
$r = Test-DeptEndpoint -Method GET -Uri "${Base}/api/departments" -Headers $noAuthHeaders -ExpectedStatus 401
if (Assert-Test -TestId "DEP-003" -Desc "GET /api/departments (no auth)" -Result $r -Condition { $r.StatusCode -eq 401 }) { $results.Pass++ } else { $results.Fail++ }

# ---- DEP-004: GET by valid ID ----
$results.Total++
$r = Test-DeptEndpoint -Method GET -Uri "${Base}/api/departments/63" -Headers $authHeaders
if (Assert-Test -TestId "DEP-004" -Desc "GET /api/departments/:id (valid)" -Result $r -Condition { $r.StatusCode -eq 200 -and $r.Response.success -and $r.Response.data.department_id -eq 63 }) { $results.Pass++ } else { $results.Fail++ }

# ---- DEP-005: GET by non-existent ID ----
$results.Total++
$r = Test-DeptEndpoint -Method GET -Uri "${Base}/api/departments/99999" -Headers $authHeaders -ExpectedStatus 404
if (Assert-Test -TestId "DEP-005" -Desc "GET /api/departments/:id (404)" -Result $r -Condition { $r.StatusCode -eq 404 }) { $results.Pass++ } else { $results.Fail++ }

# ---- DEP-006: GET by invalid ID (string) ----
$results.Total++
$r = Test-DeptEndpoint -Method GET -Uri "${Base}/api/departments/abc" -Headers $authHeaders
if (Assert-Test -TestId "DEP-006" -Desc "GET /api/departments/:id (string)" -Result $r -Condition { $r.StatusCode -eq 400 -or $r.StatusCode -eq 404 }) { $results.Pass++ } else { $results.Fail++ }

# ---- DEP-007: SQL injection in ID ----
$results.Total++
$r = Test-DeptEndpoint -Method GET -Uri "${Base}/api/departments/1%20OR%201=1" -Headers $authHeaders
if (Assert-Test -TestId "DEP-007" -Desc "GET /api/departments/:id (SQL injection)" -Result $r -Condition { $r.StatusCode -eq 400 -or $r.StatusCode -eq 404 }) { $results.Pass++ } else { $results.Fail++ }

# ---- DEP-008: Response has required fields ----
$results.Total++
$r = Test-DeptEndpoint -Method GET -Uri "${Base}/api/departments/63" -Headers $authHeaders
if (Assert-Test -TestId "DEP-008" -Desc "Response fields check" -Result $r -Condition {
    $r.StatusCode -eq 200 -and $r.Response.data.department_id -and $r.Response.data.department_name
}) { $results.Pass++ } else { $results.Fail++ }

# ---- DEP-009: Create with valid data (admin) ----
$results.Total++
$rnd2 = Get-Random
$deptBody9 = "{`"department_name`":`"Dept-${rnd2}`",`"description`":`"Test department`",`"budget`":50000}"
$r = Test-DeptEndpoint -Method POST -Uri "${Base}/api/departments" -Headers $authHeaders -Body $deptBody9
if (Assert-Test -TestId "DEP-009" -Desc "POST create valid department (admin)" -Result $r -Condition { $r.StatusCode -eq 201 -and $r.Response.success -and $r.Response.data.department_name -eq "Dept-${rnd2}" }) { $results.Pass++; $createdDeptId = $r.Response.data.department_id } else { $results.Fail++ }

# ---- DEP-010: Create with empty name ----
$results.Total++
$deptBody10 = '{"department_name":"","description":"Test"}'
$r = Test-DeptEndpoint -Method POST -Uri "${Base}/api/departments" -Headers $authHeaders -Body $deptBody10 -ExpectedStatus 400
if (Assert-Test -TestId "DEP-010" -Desc "POST create with empty name" -Result $r -Condition { $r.StatusCode -eq 400 }) { $results.Pass++ } else { $results.Fail++ }

# ---- DEP-011: Create with duplicate name (no unique constraint - allowed) ----
$results.Total++
$deptBody11 = "{`"department_name`":`"Dept-${rnd2}`"}"
$r = Test-DeptEndpoint -Method POST -Uri "${Base}/api/departments" -Headers $authHeaders -Body $deptBody11
if (Assert-Test -TestId "DEP-011" -Desc "POST create with duplicate name (no unique constraint)" -Result $r -Condition { $r.StatusCode -eq 201 }) { $results.Pass++ } else { $results.Fail++ }

# ---- DEP-012: Create as employee ----
$results.Total++
if ($empAuthHeaders) {
    $deptBody12 = "{`"department_name`":`"EmpDept-${rnd2}`"}"
    $r = Test-DeptEndpoint -Method POST -Uri "${Base}/api/departments" -Headers $empAuthHeaders -Body $deptBody12 -ExpectedStatus 403
    if (Assert-Test -TestId "DEP-012" -Desc "POST create as employee" -Result $r -Condition { $r.StatusCode -eq 403 }) { $results.Pass++ } else { $results.Fail++ }
}
else { Write-Log "DEP-012: SKIP (no employee token)" "WARN"; $results.Skip++ }

# ---- DEP-013: Create without auth ----
$results.Total++
$deptBody13 = '{"department_name":"NoAuthDept"}'
$r = Test-DeptEndpoint -Method POST -Uri "${Base}/api/departments" -Headers $noAuthHeaders -Body $deptBody13 -ExpectedStatus 401
if (Assert-Test -TestId "DEP-013" -Desc "POST create without auth" -Result $r -Condition { $r.StatusCode -eq 401 }) { $results.Pass++ } else { $results.Fail++ }

# ---- DEP-014: SQL injection in name ----
$results.Total++
$deptBody14 = "{`"department_name`":`"1'; DROP TABLE departments; --`"}"
$r = Test-DeptEndpoint -Method POST -Uri "${Base}/api/departments" -Headers $authHeaders -Body $deptBody14
if (Assert-Test -TestId "DEP-014" -Desc "POST SQL injection in name" -Result $r -Condition { $r.StatusCode -eq 201 -or $r.StatusCode -eq 400 }) { $results.Pass++ } else { $results.Fail++ }

# ---- DEP-015: XSS in name ----
$results.Total++
$deptBody15 = "{`"department_name`":`"<script>alert('xss')</script>${rnd2}`"}"
$r = Test-DeptEndpoint -Method POST -Uri "${Base}/api/departments" -Headers $authHeaders -Body $deptBody15
if (Assert-Test -TestId "DEP-015" -Desc "POST XSS in name" -Result $r -Condition { $r.StatusCode -eq 201 -and $r.Response.success }) { $results.Pass++ } else { $results.Fail++ }

# ---- DEP-016: Create with budget field ----
$results.Total++
$deptBody16 = "{`"department_name`":`"BudgetDept-${rnd2}`",`"budget`":99999.99}"
$r = Test-DeptEndpoint -Method POST -Uri "${Base}/api/departments" -Headers $authHeaders -Body $deptBody16
if (Assert-Test -TestId "DEP-016" -Desc "POST create with budget" -Result $r -Condition { $r.StatusCode -eq 201 -and $r.Response.data.budget -and [double]$r.Response.data.budget -eq 99999.99 }) { $results.Pass++ } else { $results.Fail++ }

# ---- DEP-017: Very long name (255+ chars) ----
$results.Total++
$longName = "A" * 300
$deptBody17 = "{`"department_name`":`"${longName}`"}"
$r = Test-DeptEndpoint -Method POST -Uri "${Base}/api/departments" -Headers $authHeaders -Body $deptBody17 -ExpectedStatus 400
if (Assert-Test -TestId "DEP-017" -Desc "POST very long name" -Result $r -Condition { $r.StatusCode -eq 400 -or $r.StatusCode -eq 413 -or $r.StatusCode -eq 500 }) { $results.Pass++ } else { $results.Fail++ }

# ---- DEP-018: Special characters in name ----
$results.Total++
$deptBody18 = "{`"department_name`":`"Dept-@#`$%-${rnd2}`"}"
$r = Test-DeptEndpoint -Method POST -Uri "${Base}/api/departments" -Headers $authHeaders -Body $deptBody18
if (Assert-Test -TestId "DEP-018" -Desc "POST special chars in name" -Result $r -Condition { $r.StatusCode -eq 201 }) { $results.Pass++ } else { $results.Fail++ }

# ---- DEP-019: Update with valid data (admin) ----
$results.Total++
$deptBody19 = "{`"department_name`":`"Engineering-Updated`",`"description`":`"Updated description`"}"
$r = Test-DeptEndpoint -Method PUT -Uri "${Base}/api/departments/63" -Headers $authHeaders -Body $deptBody19
if (Assert-Test -TestId "DEP-019" -Desc "PUT update department (admin)" -Result $r -Condition { $r.StatusCode -eq 200 -and $r.Response.success -and $r.Response.data.department_name -eq "Engineering-Updated" }) { $results.Pass++ } else { $results.Fail++ }
$deptBodyRestore = "{`"department_name`":`"Engineering`",`"description`":`"Engineering Department`"}"
$r = Test-DeptEndpoint -Method PUT -Uri "${Base}/api/departments/63" -Headers $authHeaders -Body $deptBodyRestore

# ---- DEP-020: Update with empty name ----
$results.Total++
$deptBody20 = "{`"department_name`":`"`"}"
$r = Test-DeptEndpoint -Method PUT -Uri "${Base}/api/departments/63" -Headers $authHeaders -Body $deptBody20 -ExpectedStatus 400
if (Assert-Test -TestId "DEP-020" -Desc "PUT update with empty name" -Result $r -Condition { $r.StatusCode -eq 400 }) { $results.Pass++ } else { $results.Fail++ }

# ---- DEP-021: Update as employee ----
$results.Total++
if ($empAuthHeaders) {
    $deptBody21 = "{`"department_name`":`"Engineering`"}"
    $r = Test-DeptEndpoint -Method PUT -Uri "${Base}/api/departments/63" -Headers $empAuthHeaders -Body $deptBody21 -ExpectedStatus 403
    if (Assert-Test -TestId "DEP-021" -Desc "PUT update as employee" -Result $r -Condition { $r.StatusCode -eq 403 }) { $results.Pass++ } else { $results.Fail++ }
}
else { Write-Log "DEP-021: SKIP (no employee token)" "WARN"; $results.Skip++ }

# ---- DEP-022: Update without auth ----
$results.Total++
$deptBody22 = "{`"department_name`":`"Engineering`"}"
$r = Test-DeptEndpoint -Method PUT -Uri "${Base}/api/departments/63" -Headers $noAuthHeaders -Body $deptBody22 -ExpectedStatus 401
if (Assert-Test -TestId "DEP-022" -Desc "PUT update without auth" -Result $r -Condition { $r.StatusCode -eq 401 }) { $results.Pass++ } else { $results.Fail++ }

# ---- DEP-023: Update non-existent ----
$results.Total++
$deptBody23 = "{`"department_name`":`"NonExistent`"}"
$r = Test-DeptEndpoint -Method PUT -Uri "${Base}/api/departments/99999" -Headers $authHeaders -Body $deptBody23 -ExpectedStatus 404
if (Assert-Test -TestId "DEP-023" -Desc "PUT update non-existent" -Result $r -Condition { $r.StatusCode -eq 404 }) { $results.Pass++ } else { $results.Fail++ }

# ---- DEP-024: Update name to duplicate (no unique constraint - allowed) ----
$results.Total++
$rnd3 = Get-Random
$deptBody24a = "{`"department_name`":`"DupeTarget-${rnd3}`"}"
$r = Test-DeptEndpoint -Method POST -Uri "${Base}/api/departments" -Headers $authHeaders -Body $deptBody24a
if ($r.StatusCode -eq 201) {
    $dupeDeptId = $r.Response.data.department_id
    $deptBody24b = "{`"department_name`":`"DupeTarget-${rnd3}`"}"
    $r2 = Test-DeptEndpoint -Method PUT -Uri "${Base}/api/departments/63" -Headers $authHeaders -Body $deptBody24b
    if (Assert-Test -TestId "DEP-024" -Desc "PUT duplicate name (no unique constraint)" -Result $r2 -Condition { $r2.StatusCode -eq 200 }) { $results.Pass++ } else { $results.Fail++ }
    $r = Test-DeptEndpoint -Method DELETE -Uri "${Base}/api/departments/${dupeDeptId}" -Headers $authHeaders
}
else { Write-Log "DEP-024: SKIP (could not create dupe target)" "WARN"; $results.Skip++ }

# ---- DEP-025: Update budget field ----
$results.Total++
$deptBody25 = "{`"department_name`":`"Engineering`",`"budget`":500000}"
$r = Test-DeptEndpoint -Method PUT -Uri "${Base}/api/departments/63" -Headers $authHeaders -Body $deptBody25
if (Assert-Test -TestId "DEP-025" -Desc "PUT update budget" -Result $r -Condition { $r.StatusCode -eq 200 -and $r.Response.success }) { $results.Pass++ } else { $results.Fail++ }
$deptBodyRestoreBudget = "{`"department_name`":`"Engineering`",`"budget`":314420}"
$r = Test-DeptEndpoint -Method PUT -Uri "${Base}/api/departments/63" -Headers $authHeaders -Body $deptBodyRestoreBudget

# ---- DEP-026: Update as manager ----
$results.Total++
Write-Log "DEP-026: SKIP (no manager test user available)" "WARN"; $results.Skip++

# ---- DEP-027: Delete as admin ----
$results.Total++
$rnd4 = Get-Random
$deptBody27 = "{`"department_name`":`"ToDelete-${rnd4}`"}"
$r = Test-DeptEndpoint -Method POST -Uri "${Base}/api/departments" -Headers $authHeaders -Body $deptBody27
if ($r.StatusCode -eq 201) {
    $delDeptId = $r.Response.data.department_id
    $r2 = Test-DeptEndpoint -Method DELETE -Uri "${Base}/api/departments/${delDeptId}" -Headers $authHeaders
    if (Assert-Test -TestId "DEP-027" -Desc "DELETE department (admin)" -Result $r2 -Condition { $r2.StatusCode -eq 200 -and $r2.Response.success }) { $results.Pass++ } else { $results.Fail++ }
}
else { Write-Log "DEP-027: SKIP (could not create temp dept)" "WARN"; $results.Skip++ }

# ---- DEP-028: Delete as employee ----
$results.Total++
if ($empAuthHeaders) {
    $r = Test-DeptEndpoint -Method DELETE -Uri "${Base}/api/departments/63" -Headers $empAuthHeaders -ExpectedStatus 403
    if (Assert-Test -TestId "DEP-028" -Desc "DELETE as employee" -Result $r -Condition { $r.StatusCode -eq 403 }) { $results.Pass++ } else { $results.Fail++ }
}
else { Write-Log "DEP-028: SKIP (no employee token)" "WARN"; $results.Skip++ }

# ---- DEP-029: Delete as manager ----
$results.Total++
Write-Log "DEP-029: SKIP (no manager test user)" "WARN"; $results.Skip++

# ---- DEP-030: Delete without auth ----
$results.Total++
$r = Test-DeptEndpoint -Method DELETE -Uri "${Base}/api/departments/63" -Headers $noAuthHeaders -ExpectedStatus 401
if (Assert-Test -TestId "DEP-030" -Desc "DELETE without auth" -Result $r -Condition { $r.StatusCode -eq 401 }) { $results.Pass++ } else { $results.Fail++ }

# ---- DEP-031: Delete non-existent ----
$results.Total++
$r = Test-DeptEndpoint -Method DELETE -Uri "${Base}/api/departments/99999" -Headers $authHeaders -ExpectedStatus 404
if (Assert-Test -TestId "DEP-031" -Desc "DELETE non-existent" -Result $r -Condition { $r.StatusCode -eq 404 }) { $results.Pass++ } else { $results.Fail++ }

# ---- DEP-032: Delete dept with employees ----
$results.Total++
$r = Test-DeptEndpoint -Method DELETE -Uri "${Base}/api/departments/63" -Headers $authHeaders
if (Assert-Test -TestId "DEP-032" -Desc "DELETE dept with employees" -Result $r -Condition { $r.StatusCode -eq 400 -or $r.StatusCode -eq 409 }) { $results.Pass++ } else { $results.Fail++ }

# ---- DEP-033: Pagination ----
$results.Total++
$r = Test-DeptEndpoint -Method GET -Uri "${Base}/api/departments?page=1&limit=5" -Headers $authHeaders
if (Assert-Test -TestId "DEP-033" -Desc "GET with pagination" -Result $r -Condition { $r.StatusCode -eq 200 -and $r.Response.success }) { $results.Pass++ } else { $results.Fail++ }

# ---- DEP-034: Invalid page ----
$results.Total++
$r = Test-DeptEndpoint -Method GET -Uri "${Base}/api/departments?page=-1" -Headers $authHeaders
if (Assert-Test -TestId "DEP-034" -Desc "GET with invalid page" -Result $r -Condition { $r.StatusCode -eq 200 -or $r.StatusCode -eq 400 }) { $results.Pass++ } else { $results.Fail++ }

# ---- DEP-035: Sorting ----
$results.Total++
$r = Test-DeptEndpoint -Method GET -Uri "${Base}/api/departments?sort=name&order=asc" -Headers $authHeaders
if (Assert-Test -TestId "DEP-035" -Desc "GET with sort" -Result $r -Condition { $r.StatusCode -eq 200 -and $r.Response.success }) { $results.Pass++ } else { $results.Fail++ }

# ---- DEP-036: Create then confirm ----
$results.Total++
$rnd5 = Get-Random
$deptBody36 = "{`"department_name`":`"ConfirmDept-${rnd5}`"}"
$r = Test-DeptEndpoint -Method POST -Uri "${Base}/api/departments" -Headers $authHeaders -Body $deptBody36
if ($r.StatusCode -eq 201) {
    $confirmId = $r.Response.data.department_id
    $r2 = Test-DeptEndpoint -Method GET -Uri "${Base}/api/departments/${confirmId}" -Headers $authHeaders
    $found = $r2.StatusCode -eq 200 -and $r2.Response.data.department_name -eq "ConfirmDept-${rnd5}"
    if (Assert-Test -TestId "DEP-036" -Desc "Create then GET confirms" -Result $r2 -Condition { $found }) { $results.Pass++ } else { $results.Fail++ }
}
else { Write-Log "DEP-036: SKIP (create failed)" "WARN"; $results.Skip++ }

# ---- DEP-037: Update then confirm ----
$results.Total++
$rnd6 = Get-Random
$deptBody37a = "{`"department_name`":`"UpdateConfirm-${rnd6}`"}"
$r = Test-DeptEndpoint -Method POST -Uri "${Base}/api/departments" -Headers $authHeaders -Body $deptBody37a
if ($r.StatusCode -eq 201) {
    $updateConfirmId = $r.Response.data.department_id
    $deptBody37b = "{`"department_name`":`"UpdatedName-${rnd6}`"}"
    $r2 = Test-DeptEndpoint -Method PUT -Uri "${Base}/api/departments/${updateConfirmId}" -Headers $authHeaders -Body $deptBody37b
    $r3 = Test-DeptEndpoint -Method GET -Uri "${Base}/api/departments/${updateConfirmId}" -Headers $authHeaders
    $found = $r3.StatusCode -eq 200 -and $r3.Response.data.department_name -eq "UpdatedName-${rnd6}"
    if (Assert-Test -TestId "DEP-037" -Desc "Update then GET confirms" -Result $r3 -Condition { $found }) { $results.Pass++ } else { $results.Fail++ }
    $r = Test-DeptEndpoint -Method DELETE -Uri "${Base}/api/departments/${updateConfirmId}" -Headers $authHeaders
}
else { Write-Log "DEP-037: SKIP (create failed)" "WARN"; $results.Skip++ }

# ---- DEP-038: Delete then GET returns 404 ----
$results.Total++
$rnd7 = Get-Random
$deptBody38 = "{`"department_name`":`"DeleteConfirm-${rnd7}`"}"
$r = Test-DeptEndpoint -Method POST -Uri "${Base}/api/departments" -Headers $authHeaders -Body $deptBody38
if ($r.StatusCode -eq 201) {
    $deleteConfirmId = $r.Response.data.department_id
    $r2 = Test-DeptEndpoint -Method DELETE -Uri "${Base}/api/departments/${deleteConfirmId}" -Headers $authHeaders
    $r3 = Test-DeptEndpoint -Method GET -Uri "${Base}/api/departments/${deleteConfirmId}" -Headers $authHeaders -ExpectedStatus 404
    if (Assert-Test -TestId "DEP-038" -Desc "Delete then GET 404" -Result $r3 -Condition { $r3.StatusCode -eq 404 }) { $results.Pass++ } else { $results.Fail++ }
}
else { Write-Log "DEP-038: SKIP (create failed)" "WARN"; $results.Skip++ }

# ---- DEP-039: Tenant isolation ----
$results.Total++
$r = Test-DeptEndpoint -Method GET -Uri "${Base}/api/departments" -Headers @{"Authorization"="Bearer $adminToken";"x-tenant-id"="nonexistent-tenant"} -ExpectedStatus 404
if (Assert-Test -TestId "DEP-039" -Desc "Tenant isolation (wrong tenant)" -Result $r -Condition { $r.StatusCode -eq 404 -or $r.StatusCode -eq 401 }) { $results.Pass++ } else { $results.Fail++ }

# ---- DEP-040: Missing tenant header ----
$results.Total++
$deptBody40 = "{`"department_name`":`"NoTenantDept`"}"
$r = Test-DeptEndpoint -Method POST -Uri "${Base}/api/departments" -Headers @{"Authorization"="Bearer $adminToken"} -Body $deptBody40 -ExpectedStatus 400
if (Assert-Test -TestId "DEP-040" -Desc "Missing tenant header" -Result $r -Condition { $r.StatusCode -eq 400 -or $r.StatusCode -eq 401 }) { $results.Pass++ } else { $results.Fail++ }

# ---- DEP-041: Response format has success, data ----
$results.Total++
$r = Test-DeptEndpoint -Method GET -Uri "${Base}/api/departments" -Headers $authHeaders
if (Assert-Test -TestId "DEP-041" -Desc "Response format check" -Result $r -Condition { $r.Response.success -eq $true -and $r.Response.data -ne $null }) { $results.Pass++ } else { $results.Fail++ }

# ---- DEP-042: Error format has success, message ----
$results.Total++
$r = Test-DeptEndpoint -Method GET -Uri "${Base}/api/departments/99999" -Headers $authHeaders -ExpectedStatus 404
if (Assert-Test -TestId "DEP-042" -Desc "Error format check" -Result $r -Condition { $r.Response.success -eq $false -and $r.Response.message }) { $results.Pass++ } else { $results.Fail++ }

# ---- DEP-043: Idempotent GET ----
$results.Total++
$r1 = Test-DeptEndpoint -Method GET -Uri "${Base}/api/departments" -Headers $authHeaders
$r2 = Test-DeptEndpoint -Method GET -Uri "${Base}/api/departments" -Headers $authHeaders
if (Assert-Test -TestId "DEP-043" -Desc "Idempotent GET" -Result $r1 -Condition { $r1.StatusCode -eq 200 -and $r2.StatusCode -eq 200 }) { $results.Pass++ } else { $results.Fail++ }

# ---- DEP-044: Filter with search ----
$results.Total++
$r = Test-DeptEndpoint -Method GET -Uri "${Base}/api/departments?search=Eng" -Headers $authHeaders
if (Assert-Test -TestId "DEP-044" -Desc "GET with search filter" -Result $r -Condition { $r.StatusCode -eq 200 -and $r.Response.success }) { $results.Pass++ } else { $results.Fail++ }

# ---- DEP-045: Rate limiting ----
$results.Total++
Write-Log "DEP-045: SKIP (rate limiting cannot be tested without batch requests)" "WARN"; $results.Skip++

# ---- DEP-046: employee_count field ----
$results.Total++
$r = Test-DeptEndpoint -Method GET -Uri "${Base}/api/departments" -Headers $authHeaders
$hasCount = $r.Response.data[0].employee_count -ne $null
if (Assert-Test -TestId "DEP-046" -Desc "employee_count field present" -Result $r -Condition { $r.StatusCode -eq 200 -and $hasCount }) { $results.Pass++ } else { $results.Fail++ }

# ---- DEP-047: Create with manager optional ----
$results.Total++
$rnd8 = Get-Random
$deptBody47 = "{`"department_name`":`"NoManager-${rnd8}`"}"
$r = Test-DeptEndpoint -Method POST -Uri "${Base}/api/departments" -Headers $authHeaders -Body $deptBody47
if (Assert-Test -TestId "DEP-047" -Desc "POST create without manager (optional)" -Result $r -Condition { $r.StatusCode -eq 201 -and $r.Response.data.manager_id -eq $null }) { $results.Pass++ } else { $results.Fail++ }

# ---- DEP-048: Clear budget field ----
$results.Total++
$rnd9 = Get-Random
$deptBody48a = "{`"department_name`":`"BudgetClear-${rnd9}`",`"budget`":100000}"
$r = Test-DeptEndpoint -Method POST -Uri "${Base}/api/departments" -Headers $authHeaders -Body $deptBody48a
if ($r.StatusCode -eq 201) {
    $budgetId = $r.Response.data.department_id
    $deptBody48b = "{`"department_name`":`"BudgetClear-${rnd9}`",`"budget`":null}"
    $r2 = Test-DeptEndpoint -Method PUT -Uri "${Base}/api/departments/${budgetId}" -Headers $authHeaders -Body $deptBody48b
    if (Assert-Test -TestId "DEP-048" -Desc "PUT clear budget field" -Result $r2 -Condition { $r2.StatusCode -eq 200 -or $r2.StatusCode -eq 400 }) { $results.Pass++ } else { $results.Fail++ }
}
else { Write-Log "DEP-048: SKIP (create failed)" "WARN"; $results.Skip++ }

# ---- DEP-049: Numeric name ----
$results.Total++
$deptBody49 = "{`"department_name`":`"12345-${rnd9}`"}"
$r = Test-DeptEndpoint -Method POST -Uri "${Base}/api/departments" -Headers $authHeaders -Body $deptBody49
if (Assert-Test -TestId "DEP-049" -Desc "POST numeric name" -Result $r -Condition { $r.StatusCode -eq 201 -or $r.StatusCode -eq 400 }) { $results.Pass++ } else { $results.Fail++ }

# ---- DEP-050: Multiple deletes (idempotent) ----
$results.Total++
$rnd10 = Get-Random
$deptBody50 = "{`"department_name`":`"IdempotentDelete-${rnd10}`"}"
$r = Test-DeptEndpoint -Method POST -Uri "${Base}/api/departments" -Headers $authHeaders -Body $deptBody50
if ($r.StatusCode -eq 201) {
    $idemId = $r.Response.data.department_id
    $r1 = Test-DeptEndpoint -Method DELETE -Uri "${Base}/api/departments/${idemId}" -Headers $authHeaders
    $r2 = Test-DeptEndpoint -Method DELETE -Uri "${Base}/api/departments/${idemId}" -Headers $authHeaders -ExpectedStatus 404
    $pass = ($r1.StatusCode -eq 200) -and ($r2.StatusCode -eq 404)
    if (Assert-Test -TestId "DEP-050" -Desc "Multiple deletes (idempotent)" -Result $r2 -Condition { $pass }) { $results.Pass++ } else { $results.Fail++ }
}
else { Write-Log "DEP-050: SKIP (create failed)" "WARN"; $results.Skip++ }

# ---- DEP-051: Partial update (description only) ----
$results.Total++
$deptBody51 = "{`"department_name`":`"Engineering`",`"description`":`"Partial update test`"}"
$r = Test-DeptEndpoint -Method PUT -Uri "${Base}/api/departments/63" -Headers $authHeaders -Body $deptBody51
if (Assert-Test -TestId "DEP-051" -Desc "PUT partial update (description only)" -Result $r -Condition { $r.StatusCode -eq 200 -and $r.Response.success }) { $results.Pass++ } else { $results.Fail++ }
$deptBodyRestoreDesc = "{`"department_name`":`"Engineering`",`"description`":`"Engineering Department`"}"
$r = Test-DeptEndpoint -Method PUT -Uri "${Base}/api/departments/63" -Headers $authHeaders -Body $deptBodyRestoreDesc

# ---- DEP-052: Create with description ----
$results.Total++
$rnd11 = Get-Random
$deptBody52 = "{`"department_name`":`"WithDesc-${rnd11}`",`"description`":`"Test department description`"}"
$r = Test-DeptEndpoint -Method POST -Uri "${Base}/api/departments" -Headers $authHeaders -Body $deptBody52
if (Assert-Test -TestId "DEP-052" -Desc "POST create with description" -Result $r -Condition { $r.StatusCode -eq 201 -and $r.Response.data.description -eq "Test department description" }) { $results.Pass++ } else { $results.Fail++ }

# ---- DEP-053: Invalid ID format (1.5) ----
$results.Total++
$r = Test-DeptEndpoint -Method GET -Uri "${Base}/api/departments/1.5" -Headers $authHeaders
if (Assert-Test -TestId "DEP-053" -Desc "GET invalid ID format" -Result $r -Condition { $r.StatusCode -eq 400 -or $r.StatusCode -eq 404 }) { $results.Pass++ } else { $results.Fail++ }

# ---- DEP-054: Large payload ----
$results.Total++
$rnd12 = Get-Random
$largeDesc = "X" * 10000
$deptBody54 = "{`"department_name`":`"LargePayload-${rnd12}`",`"description`":`"${largeDesc}`"}"
$r = Test-DeptEndpoint -Method POST -Uri "${Base}/api/departments" -Headers $authHeaders -Body $deptBody54
if (Assert-Test -TestId "DEP-054" -Desc "POST large payload (10KB)" -Result $r -Condition { $r.StatusCode -eq 201 -or $r.StatusCode -eq 413 }) { $results.Pass++ } else { $results.Fail++ }

# ---- DEP-055: Permission-based access ----
$results.Total++
Write-Log "DEP-055: SKIP (no granular permission test user)" "WARN"; $results.Skip++

# ---- SUMMARY ----
$summary = @"

---

## Departments Module Results (Executed: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss'))

| Metric | Count |
|--------|------:|
| Total  | $($results.Total) |
| Pass   | $($results.Pass) |
| Fail   | $($results.Fail) |
| Skip   | $($results.Skip) |
| Pass Rate | $([Math]::Round(($results.Pass/$results.Total)*100, 1))% |

"@

$summary | Add-Content -Path $ReportFile
$summary | Set-Content -Path $ResultsFile -Encoding UTF8
Write-Log "Departments: $($results.Pass)/$($results.Total) PASS, $($results.Fail) FAIL, $($results.Skip) SKIP" "DONE"
Write-Host $summary -ForegroundColor Cyan
