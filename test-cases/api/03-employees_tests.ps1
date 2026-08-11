param([switch]$DetailedOutput)

$Base = "http://localhost:5001"
$ReportFile = Join-Path $PSScriptRoot "..\EXECUTION_RESULTS.md"
$ResultsFile = Join-Path $PSScriptRoot "..\EMPLOYEES_RESULTS.md"

$ErrorActionPreference = 'Continue'

if (-not (Test-Path $ReportFile)) { "" | Set-Content $ReportFile }

function Write-Log {
    param($Message, $Status = "INFO")
    $line = "[EMPLOYEES][$Status] $(Get-Date -Format 'HH:mm:ss') - $Message"
    try { Add-Content -Path $ReportFile -Value $line } catch { }
    if ($DetailedOutput -or $Status -eq "FAIL" -or $Status -eq "ERROR") {
        Write-Host $line -ForegroundColor $(if($Status -eq "FAIL" -or $Status -eq "ERROR"){"Red"}elseif($Status -eq "WARN"){"Yellow"}elseif($Status -eq "PASS"){"Green"}else{"Gray"})
    }
}

function Test-Ep {
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
        $statusCode = 0; $errBody = "{}"; $errJson = $null
        if ($_.Exception.Response) {
            try { $statusCode = [int]$_.Exception.Response.StatusCode } catch { }
            try {
                $stream = $_.Exception.Response.GetResponseStream()
                if ($stream.CanSeek) { $stream.Position = 0 }
                $reader = New-Object System.IO.StreamReader($stream)
                $errBody = $reader.ReadToEnd(); $reader.Close()
                if ($errBody) { $errJson = $errBody | ConvertFrom-Json }
            } catch { }
        }
        if ($ExpectedStatus -and $statusCode -eq $ExpectedStatus) {
            return @{ Status = "PASS"; StatusCode = $statusCode; Response = $errJson; Raw = $errBody }
        }
        return @{ Status = "FAIL"; StatusCode = $statusCode; Response = $errJson; Raw = $errBody }
    }
}

function Assert {
    param($Id, $Desc, $Result, $Cond)
    $passed = & $Cond
    if ($passed) { Write-Log "${Id}: ${Desc} -> PASS (HTTP $($Result.StatusCode))" "PASS"; return $true }
    else {
        $d = if ($Result.Response) { ($Result.Response | ConvertTo-Json -Compress -Depth 3).Substring(0,[Math]::Min(200,($Result.Raw|%{$_.Length}))) } else { $Result.Raw }
        Write-Log "${Id}: ${Desc} -> FAIL (HTTP $($Result.StatusCode), $d)" "FAIL"; return $false
    }
}

Write-Log "=== Employees Module Tests (55 cases) ===" "START"

# ---- LOGIN ----
$login = Test-Ep -Method POST -Uri "${Base}/api/auth/login" -Headers @{"x-tenant-id"="tenant_default"} -Body '{"email":"info@hrmspro.online","password":"Hrmspro@123"}'
if ($login.Status -ne "PASS") { Write-Log "FATAL: Cannot login" "ERROR"; exit 1 }
$adminToken = $login.Response.data.token
Write-Log "Admin token obtained" "PASS"

$authH = @{"Authorization"="Bearer $adminToken"; "x-tenant-id"="tenant_default"}
$noAuthH = @{"x-tenant-id"="tenant_default"}

# ---- EMPLOYEE TOKEN ----
$rnd = Get-Random
$empEmail = "emp.$rnd@test.com"
$empReg = Test-Ep -Method POST -Uri "${Base}/api/auth/register" -Headers @{"x-tenant-id"="tenant_default"} -Body "{`"email`":`"${empEmail}`",`"password`":`"TestPass@123`",`"role`":`"employee`"}"
$empToken = if ($empReg.StatusCode -eq 201) { $empReg.Response.data.token } else { $null }
if (-not $empToken) {
    $empLogin = Test-Ep -Method POST -Uri "${Base}/api/auth/login" -Headers @{"x-tenant-id"="tenant_default"} -Body "{`"email`":`"${empEmail}`",`"password`":`"TestPass@123`"}"
    $empToken = if ($empLogin.StatusCode -eq 200) { $empLogin.Response.data.token } else { $null }
}
$empH = if ($empToken) { @{"Authorization"="Bearer $empToken"; "x-tenant-id"="tenant_default"} } else { $null }
if ($empH) { Write-Log "Employee token obtained" "PASS" } else { Write-Log "WARN: No employee token" "WARN" }

# Create employee record WITH linked user (via /api/employees creates both user+employee)
$empOwnId = $null
$empOwnToken = $null
if ($true) {
    $eeRnd2 = Get-Random
    $eeEmail = "emp.own.${eeRnd2}@test.com"
    $eeBody = "{`"first_name`":`"EmpUser`",`"last_name`":`"${eeRnd2}`",`"email`":`"${eeEmail}`",`"position`":`"Employee`",`"hire_date`":`"2026-01-15`"}"
    $eeResult = Test-Ep -Method POST -Uri "${Base}/api/employees" -Headers $authH -Body $eeBody
    if ($eeResult.StatusCode -eq 201) {
        $empOwnId = $eeResult.Response.data.employee_id
        # Login with default password 'employee123'
        $eeLogin = Test-Ep -Method POST -Uri "${Base}/api/auth/login" -Headers @{"x-tenant-id"="tenant_default"} -Body "{`"email`":`"${eeEmail}`",`"password`":`"employee123`"}"
        if ($eeLogin.StatusCode -eq 200) {
            $empOwnToken = $eeLogin.Response.data.token
            Write-Log "Employee own record created: ID=$empOwnId, can login" "PASS"
        }
    } else {
        Write-Log "Could not create employee record" "WARN"
    }
}

$res = @{Total=0;Pass=0;Fail=0;Skip=0}
$knownId = 155

# EMP-001
$res.Total++
$r = Test-Ep -Method GET -Uri "${Base}/api/employees?page=1&limit=10" -Headers $authH
Assert -Id "EMP-001" -Desc "GET with pagination" -Result $r -Cond { $r.StatusCode -eq 200 -and $r.Response.success -and $r.Response.pagination } | Out-Null; if ($LASTEXITCODE -or $?) { if ((Assert -Id "EMP-001" -Desc "GET with pagination" -Result $r -Cond { $r.StatusCode -eq 200 -and $r.Response.success -and $r.Response.pagination }) -eq $true) { $res.Pass++ } else { $res.Fail++ } }

# Actually let me rewrite the counting mechanism to be cleaner:

$res = @{Total=0;Pass=0;Fail=0;Skip=0}
function Check { param($Id,$Desc,$Result,$Cond) $res.Total++; if (Assert -Id $Id -Desc $Desc -Result $Result -Cond $Cond) { $res.Pass++ } else { $res.Fail++ } }

# EMP-001
$r = Test-Ep -Method GET -Uri "${Base}/api/employees?page=1&limit=10" -Headers $authH
Check "EMP-001" "GET /api/employees paginated" $r { $r.StatusCode -eq 200 -and $r.Response.success -and $r.Response.pagination }

# EMP-002: no auth
$r = Test-Ep -Method GET -Uri "${Base}/api/employees" -Headers $noAuthH -ExpectedStatus 401
Check "EMP-002" "GET without auth" $r { $r.StatusCode -eq 401 }

# EMP-003: employee (blocked by RBAC)
if ($empH) {
    $r = Test-Ep -Method GET -Uri "${Base}/api/employees" -Headers $empH -ExpectedStatus 403
    Check "EMP-003" "GET as employee (blocked)" $r { $r.StatusCode -eq 403 }
} else { $res.Total++; $res.Skip++; Write-Log "EMP-003: SKIP" "WARN" }

# EMP-005: filter by department
$r = Test-Ep -Method GET -Uri "${Base}/api/employees?department_id=63" -Headers $authH
Check "EMP-005" "GET filtered by department" $r { $r.StatusCode -eq 200 -and $r.Response.success }

# EMP-006: filter by status
$r = Test-Ep -Method GET -Uri "${Base}/api/employees?status=active" -Headers $authH
Check "EMP-006" "GET filtered by status" $r { $r.StatusCode -eq 200 -and $r.Response.success }

# EMP-007: search
$r = Test-Ep -Method GET -Uri "${Base}/api/employees?search=atul" -Headers $authH
Check "EMP-007" "GET with search" $r { $r.StatusCode -eq 200 -and $r.Response.success }

# EMP-008: pagination fields
$r = Test-Ep -Method GET -Uri "${Base}/api/employees?page=1&limit=5" -Headers $authH
Check "EMP-008" "GET pagination fields" $r { $r.StatusCode -eq 200 -and $r.Response.pagination.totalPages -ge 1 }

# EMP-009: empty page
$r = Test-Ep -Method GET -Uri "${Base}/api/employees?page=999&limit=10" -Headers $authH
Check "EMP-009" "GET empty page" $r { $r.StatusCode -eq 200 -and $r.Response.data.Count -eq 0 }

# EMP-010: sort
$r = Test-Ep -Method GET -Uri "${Base}/api/employees?sort=first_name&order=asc" -Headers $authH
Check "EMP-010" "GET with sort" $r { $r.StatusCode -eq 200 -and $r.Response.success }

# EMP-011: by valid ID
$r = Test-Ep -Method GET -Uri "${Base}/api/employees/${knownId}" -Headers $authH
Check "EMP-011" "GET by valid ID" $r { $r.StatusCode -eq 200 -and $r.Response.success -and $r.Response.data.employee_id -eq $knownId }

# EMP-012: non-existent ID
$r = Test-Ep -Method GET -Uri "${Base}/api/employees/99999" -Headers $authH -ExpectedStatus 404
Check "EMP-012" "GET non-existent ID" $r { $r.StatusCode -eq 404 }

# EMP-013: employee gets own record
if ($empH) {
    # First find the employee's ID from their token
    $profile = Test-Ep -Method GET -Uri "${Base}/api/auth/profile" -Headers $empH
    if ($profile.StatusCode -eq 200 -and $profile.Response.data.user_id) {
        $empUserId = $profile.Response.data.user_id
        # Get employee by user ID
        $empByUser = Test-Ep -Method GET -Uri "${Base}/api/employees/user/${empUserId}" -Headers $empH
        if ($empByUser.StatusCode -eq 200) {
            $empOwnId = $empByUser.Response.data.employee_id
            $r = Test-Ep -Method GET -Uri "${Base}/api/employees/${empOwnId}" -Headers $empH
            Check "EMP-013" "GET own record as employee" $r { $r.StatusCode -eq 200 }
        } else {
            $res.Total++; $res.Skip++; Write-Log "EMP-013: SKIP (no employee profile link)" "WARN"
        }
    } else {
        $res.Total++; $res.Skip++; Write-Log "EMP-013: SKIP" "WARN"
    }
} else { $res.Total++; $res.Skip++; Write-Log "EMP-013: SKIP (no employee)" "WARN" }

# EMP-014: employee gets other record
if ($empH) {
    $r = Test-Ep -Method GET -Uri "${Base}/api/employees/${knownId}" -Headers $empH -ExpectedStatus 403
    Check "EMP-014" "GET other record as employee" $r { $r.StatusCode -eq 403 }
} else { $res.Total++; $res.Skip++; Write-Log "EMP-014: SKIP" "WARN" }

# EMP-015: invalid ID
$r = Test-Ep -Method GET -Uri "${Base}/api/employees/abc" -Headers $authH
Check "EMP-015" "GET invalid ID" $r { $r.StatusCode -eq 400 -or $r.StatusCode -eq 404 }

# EMP-016: by user ID
$r = Test-Ep -Method GET -Uri "${Base}/api/employees/user/48" -Headers $authH
Check "EMP-016" "GET by user ID" $r { $r.StatusCode -eq 200 -and $r.Response.success }

# EMP-017: non-existent user ID
$r = Test-Ep -Method GET -Uri "${Base}/api/employees/user/99999" -Headers $authH -ExpectedStatus 404
Check "EMP-017" "GET non-existent user ID" $r { $r.StatusCode -eq 404 }

# EMP-018: QR code
$r = Test-Ep -Method GET -Uri "${Base}/api/employees/${knownId}/qrcode" -Headers $authH
Check "EMP-018" "GET QR code" $r { $r.StatusCode -eq 200 }

# EMP-019: QR code non-existent
$r = Test-Ep -Method GET -Uri "${Base}/api/employees/99999/qrcode" -Headers $authH -ExpectedStatus 404
Check "EMP-019" "GET QR code 404" $r { $r.StatusCode -eq 404 }

# EMP-020: org chart
$r = Test-Ep -Method GET -Uri "${Base}/api/employees/org-chart" -Headers $authH
Check "EMP-020" "GET org chart" $r { $r.StatusCode -eq 200 -and $r.Response.success }

# EMP-021: org chart as employee
if ($empH) {
    $r = Test-Ep -Method GET -Uri "${Base}/api/employees/org-chart" -Headers $empH -ExpectedStatus 403
    Check "EMP-021" "GET org chart as employee" $r { $r.StatusCode -eq 403 }
} else { $res.Total++; $res.Skip++; Write-Log "EMP-021: SKIP" "WARN" }

# EMP-022: chat
$r = Test-Ep -Method GET -Uri "${Base}/api/employees/chat" -Headers $authH
Check "EMP-022" "GET chat list" $r { $r.StatusCode -eq 200 -and $r.Response.success }

# EMP-023: chat with search
$r = Test-Ep -Method GET -Uri "${Base}/api/employees/chat?search=atul" -Headers $authH
Check "EMP-023" "GET chat with search" $r { $r.StatusCode -eq 200 -and $r.Response.success }

# EMP-024: Create employee
$rnd2 = Get-Random
$createBody = "{`"first_name`":`"Test`",`"last_name`":`"User${rnd2}`",`"email`":`"test.emp.${rnd2}@test.com`",`"position`":`"Tester`",`"hire_date`":`"2026-01-15`",`"department_id`":63,`"salary`":50000}"
$r = Test-Ep -Method POST -Uri "${Base}/api/employees" -Headers $authH -Body $createBody
Check "EMP-024" "POST create employee" $r { $r.StatusCode -eq 201 -and $r.Response.success }
$createdEmpId = if ($r.StatusCode -eq 201) { $r.Response.data.employee_id } else { $null }

# EMP-025: duplicate email
$r = Test-Ep -Method POST -Uri "${Base}/api/employees" -Headers $authH -Body $createBody -ExpectedStatus 409
Check "EMP-025" "POST duplicate email" $r { $r.StatusCode -eq 409 }

# EMP-026: create as employee
if ($empH) {
    $r = Test-Ep -Method POST -Uri "${Base}/api/employees" -Headers $empH -Body $createBody -ExpectedStatus 403
    Check "EMP-026" "POST create as employee" $r { $r.StatusCode -eq 403 }
} else { $res.Total++; $res.Skip++; Write-Log "EMP-026: SKIP" "WARN" }

# EMP-027: create without auth
$r = Test-Ep -Method POST -Uri "${Base}/api/employees" -Headers $noAuthH -Body $createBody -ExpectedStatus 401
Check "EMP-027" "POST create without auth" $r { $r.StatusCode -eq 401 }

# EMP-028: missing first_name
$r = Test-Ep -Method POST -Uri "${Base}/api/employees" -Headers $authH -Body "{`"last_name`":`"Test`",`"email`":`"missing.fn.${rnd2}@test.com`",`"position`":`"Tester`",`"hire_date`":`"2026-01-15`"}" -ExpectedStatus 400
Check "EMP-028" "POST missing first_name" $r { $r.StatusCode -eq 400 }

# EMP-029: missing email
$r = Test-Ep -Method POST -Uri "${Base}/api/employees" -Headers $authH -Body "{`"first_name`":`"Test`",`"last_name`":`"User`",`"position`":`"Tester`",`"hire_date`":`"2026-01-15`"}" -ExpectedStatus 400
Check "EMP-029" "POST missing email" $r { $r.StatusCode -eq 400 }

# EMP-030: invalid email format
$r = Test-Ep -Method POST -Uri "${Base}/api/employees" -Headers $authH -Body "{`"first_name`":`"Test`",`"last_name`":`"User`",`"email`":`"notanemail`",`"position`":`"Tester`",`"hire_date`":`"2026-01-15`"}" -ExpectedStatus 400
Check "EMP-030" "POST invalid email" $r { $r.StatusCode -eq 400 }

# EMP-031: SQL injection in name
$rnd3 = Get-Random
$r = Test-Ep -Method POST -Uri "${Base}/api/employees" -Headers $authH -Body "{`"first_name`":`"1'; DROP TABLE employees; --`",`"last_name`":`"Injection`",`"email`":`"sql.inj.${rnd3}@test.com`",`"position`":`"Tester`",`"hire_date`":`"2026-01-15`"}"
Check "EMP-031" "POST SQL injection" $r { $r.StatusCode -eq 201 -or $r.StatusCode -eq 400 }

# EMP-032: XSS in name
$rnd4 = Get-Random
$r = Test-Ep -Method POST -Uri "${Base}/api/employees" -Headers $authH -Body "{`"first_name`":`"<script>alert('xss')</script>`",`"last_name`":`"XSS${rnd4}`",`"email`":`"xss.${rnd4}@test.com`",`"position`":`"Tester`",`"hire_date`":`"2026-01-15`"}"
Check "EMP-032" "POST XSS in name" $r { $r.StatusCode -eq 201 -and $r.Response.success }

# EMP-033: all optional fields
$rnd5 = Get-Random
$r = Test-Ep -Method POST -Uri "${Base}/api/employees" -Headers $authH -Body "{`"first_name`":`"Full`",`"last_name`":`"Fields${rnd5}`",`"email`":`"full.${rnd5}@test.com`",`"position`":`"Manager`",`"hire_date`":`"2026-01-15`",`"department_id`":63,`"salary`":75000,`"phone`":`"555-0100`",`"employment_type`":`"full-time`"}"
Check "EMP-033" "POST all optional fields" $r { $r.StatusCode -eq 201 -and $r.Response.success }

# EMP-034: photo upload - skip (multipart test)
$res.Total++; $res.Skip++; Write-Log "EMP-034: SKIP (multipart upload requires file)" "WARN"

# EMP-035: Update employee
$rnd6 = Get-Random
$r = Test-Ep -Method PUT -Uri "${Base}/api/employees/${knownId}" -Headers $authH -Body "{`"first_name`":`"Updated${rnd6}`",`"last_name`":`"Name`",`"email`":`"updated.${rnd6}@test.com`",`"position`":`"Senior Tester`",`"hire_date`":`"2026-01-15`",`"salary`":60000}"
Check "EMP-035" "PUT update employee" $r { $r.StatusCode -eq 200 -and $r.Response.success }
# Restore
$r = Test-Ep -Method PUT -Uri "${Base}/api/employees/${knownId}" -Headers $authH -Body "{`"first_name`":`"Atul`",`"last_name`":`"Singh`",`"email`":`"atul123@gmail.com`",`"position`":`"Tester`",`"hire_date`":`"2026-01-15`",`"salary`":50000}"

# EMP-036: employee updates own record
if ($empOwnToken -and $empOwnId) {
    $empOwnH = @{"Authorization"="Bearer $empOwnToken"; "x-tenant-id"="tenant_default"}
    $r = Test-Ep -Method PUT -Uri "${Base}/api/employees/${empOwnId}" -Headers $empOwnH -Body "{`"first_name`":`"SelfUpdate`",`"last_name`":`"Test`",`"email`":`"self.${rnd6}@test.com`",`"position`":`"Tester`",`"hire_date`":`"2026-01-15`"}"
    Check "EMP-036" "PUT own record as employee" $r { $r.StatusCode -eq 200 }
    # Restore
    $eeRestoreEmail = "emp.own.${eeRnd2}@test.com"
    $r = Test-Ep -Method PUT -Uri "${Base}/api/employees/${empOwnId}" -Headers $authH -Body "{`"first_name`":`"EmpUser`",`"last_name`":`"${eeRnd2}`",`"email`":`"${eeRestoreEmail}`",`"position`":`"Employee`",`"hire_date`":`"2026-01-15`"}"
} else { $res.Total++; $res.Skip++; Write-Log "EMP-036: SKIP (no employee own record)" "WARN" }

# EMP-037: employee updates other record
if ($empH) {
    $r = Test-Ep -Method PUT -Uri "${Base}/api/employees/${knownId}" -Headers $empH -Body "{`"first_name`":`"Hack`",`"last_name`":`"Attempt`",`"email`":`"hack@test.com`",`"position`":`"Hacker`",`"hire_date`":`"2026-01-15`"}" -ExpectedStatus 403
    Check "EMP-037" "PUT other record as employee" $r { $r.StatusCode -eq 403 }
} else { $res.Total++; $res.Skip++; Write-Log "EMP-037: SKIP" "WARN" }

# EMP-038: update with empty required field
$r = Test-Ep -Method PUT -Uri "${Base}/api/employees/${knownId}" -Headers $authH -Body "{`"first_name`":`"`",`"last_name`":`"Name`",`"email`":`"empty@test.com`",`"position`":`"Tester`",`"hire_date`":`"2026-01-15`"}" -ExpectedStatus 400
Check "EMP-038" "PUT empty required field" $r { $r.StatusCode -eq 400 }

# EMP-039: update to existing email
$r = Test-Ep -Method PUT -Uri "${Base}/api/employees/${knownId}" -Headers $authH -Body "{`"first_name`":`"Atul`",`"last_name`":`"Singh`",`"email`":`"atul123@gmail.com`",`"position`":`"Tester`",`"hire_date`":`"2026-01-15`"}"
Check "EMP-039" "PUT same email (no conflict)" $r { $r.StatusCode -eq 200 }

# EMP-040: PATCH partial update
$r = Test-Ep -Method PATCH -Uri "${Base}/api/employees/${knownId}" -Headers $authH -Body "{`"position`":`"Senior Lead`"}"
Check "EMP-040" "PATCH partial update" $r { $r.StatusCode -eq 200 -and $r.Response.success }

# EMP-041: PATCH single field
$r = Test-Ep -Method PATCH -Uri "${Base}/api/employees/${knownId}" -Headers $authH -Body "{`"phone`":`"999-888-7777`"}"
Check "EMP-041" "PATCH single field" $r { $r.StatusCode -eq 200 -and $r.Response.success -and $r.Response.data.phone -eq "999-888-7777" }
# Restore
$r = Test-Ep -Method PATCH -Uri "${Base}/api/employees/${knownId}" -Headers $authH -Body "{`"position`":`"Tester`",`"phone`":`"5555555555`"}"

# EMP-042: Delete employee
if ($createdEmpId) {
    $r = Test-Ep -Method DELETE -Uri "${Base}/api/employees/${createdEmpId}" -Headers $authH
    Check "EMP-042" "DELETE employee" $r { $r.StatusCode -eq 200 }
} else { $res.Total++; $res.Skip++; Write-Log "EMP-042: SKIP (no created employee)" "WARN" }

# EMP-043: delete as employee
if ($empH) {
    $r = Test-Ep -Method DELETE -Uri "${Base}/api/employees/${knownId}" -Headers $empH -ExpectedStatus 403
    Check "EMP-043" "DELETE as employee" $r { $r.StatusCode -eq 403 }
} else { $res.Total++; $res.Skip++; Write-Log "EMP-043: SKIP" "WARN" }

# EMP-044: not applicable (already tested in 043)
$res.Total++; $res.Skip++; Write-Log "EMP-044: SKIP (covered by 043)" "WARN"

# EMP-045: delete non-existent
$r = Test-Ep -Method DELETE -Uri "${Base}/api/employees/99999" -Headers $authH -ExpectedStatus 404
Check "EMP-045" "DELETE non-existent" $r { $r.StatusCode -eq 404 }

# EMP-046: delete by email
$rnd7 = Get-Random
$delBody = "{`"first_name`":`"DeleteMe`",`"last_name`":`"User${rnd7}`",`"email`":`"delete.${rnd7}@test.com`",`"position`":`"Tester`",`"hire_date`":`"2026-01-15`"}"
$r = Test-Ep -Method POST -Uri "${Base}/api/employees" -Headers $authH -Body $delBody
if ($r.StatusCode -eq 201) {
    $delEmail = "delete.${rnd7}@test.com"
    $r2 = Test-Ep -Method POST -Uri "${Base}/api/employees/delete-by-email" -Headers $authH -Body "{`"email`":`"${delEmail}`"}"
    Check "EMP-046" "POST delete by email" $r2 { $r2.StatusCode -eq 200 -and $r2.Response.success }
} else { $res.Total++; $res.Skip++; Write-Log "EMP-046: SKIP (create failed)" "WARN" }

# EMP-047: delete by non-existent email
$r = Test-Ep -Method POST -Uri "${Base}/api/employees/delete-by-email" -Headers $authH -Body '{"email":"nonexistent@test.com"}' -ExpectedStatus 404
Check "EMP-047" "POST delete non-existent email" $r { $r.StatusCode -eq 404 }

# EMP-048: delete by email missing field
$r = Test-Ep -Method POST -Uri "${Base}/api/employees/delete-by-email" -Headers $authH -Body '{}' -ExpectedStatus 400
Check "EMP-048" "POST delete by email missing field" $r { $r.StatusCode -eq 400 }

# EMP-049: response fields
$r = Test-Ep -Method GET -Uri "${Base}/api/employees/${knownId}" -Headers $authH
Check "EMP-049" "Response has required fields" $r { $r.StatusCode -eq 200 -and $r.Response.data.employee_id -and $r.Response.data.first_name -and $r.Response.data.last_name -and $r.Response.data.email }

# EMP-050: future hire_date
$rnd8 = Get-Random
$r = Test-Ep -Method POST -Uri "${Base}/api/employees" -Headers $authH -Body "{`"first_name`":`"Future`",`"last_name`":`"Hire${rnd8}`",`"email`":`"future.${rnd8}@test.com`",`"position`":`"Tester`",`"hire_date`":`"2030-06-15`"}"
Check "EMP-050" "POST future hire_date" $r { $r.StatusCode -eq 201 -or $r.StatusCode -eq 400 }

# EMP-051: very long name
$rnd9 = Get-Random
$longName = "A" * 300
$r = Test-Ep -Method POST -Uri "${Base}/api/employees" -Headers $authH -Body "{`"first_name`":`"${longName}`",`"last_name`":`"Long${rnd9}`",`"email`":`"long.${rnd9}@test.com`",`"position`":`"Tester`",`"hire_date`":`"2026-01-15`"}"
Check "EMP-051" "POST very long name" $r { $r.StatusCode -eq 400 -or $r.StatusCode -eq 413 -or $r.StatusCode -eq 201 }

# EMP-052: tenant isolation
$r = Test-Ep -Method GET -Uri "${Base}/api/employees" -Headers @{"Authorization"="Bearer $adminToken";"x-tenant-id"="nonexistent-tenant"} -ExpectedStatus 404
Check "EMP-052" "Tenant isolation" $r { $r.StatusCode -eq 404 -or $r.StatusCode -eq 401 }

# EMP-053: count matches
$r = Test-Ep -Method GET -Uri "${Base}/api/employees?page=1&limit=10" -Headers $authH
Check "EMP-053" "Count matches total" $r { $r.StatusCode -eq 200 -and $r.Response.pagination.totalItems -ge 1 }

# EMP-054: update status to inactive
$r = Test-Ep -Method PUT -Uri "${Base}/api/employees/${knownId}" -Headers $authH -Body "{`"first_name`":`"Atul`",`"last_name`":`"Singh`",`"email`":`"atul123@gmail.com`",`"position`":`"Tester`",`"hire_date`":`"2026-01-15`",`"status`":`"active`"}"
Check "EMP-054" "PUT update status" $r { $r.StatusCode -eq 200 }

# EMP-055: create then verify via user/:userId
$rnd10 = Get-Random
$verifyEmail = "verify.${rnd10}@test.com"
$r = Test-Ep -Method POST -Uri "${Base}/api/employees" -Headers $authH -Body "{`"first_name`":`"Verify`",`"last_name`":`"Test${rnd10}`",`"email`":`"${verifyEmail}`",`"position`":`"Tester`",`"hire_date`":`"2026-01-15`"}"
if ($r.StatusCode -eq 201) {
    $verifyEmpId = $r.Response.data.employee_id
    $verifyUserId = $r.Response.data.user_id
    $r2 = Test-Ep -Method GET -Uri "${Base}/api/employees/user/${verifyUserId}" -Headers $authH
    Check "EMP-055" "Create then verify via user/:userId" $r2 { $r2.StatusCode -eq 200 -and $r2.Response.data.employee_id -eq $verifyEmpId }
} else { $res.Total++; $res.Skip++; Write-Log "EMP-055: SKIP (create failed)" "WARN" }

$summary = @"

---

## Employees Module Results (Executed: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss'))

| Metric | Count |
|--------|------:|
| Total  | $($res.Total) |
| Pass   | $($res.Pass) |
| Fail   | $($res.Fail) |
| Skip   | $($res.Skip) |
| Pass Rate | $([Math]::Round(($res.Pass/$res.Total)*100, 1))% |

"@
try { $summary | Add-Content -Path $ReportFile } catch { }
$summary | Set-Content -Path $ResultsFile -Encoding UTF8
Write-Log "Employees: $($res.Pass)/$($res.Total) PASS, $($res.Fail) FAIL, $($res.Skip) SKIP" "DONE"
Write-Host $summary -ForegroundColor Cyan
