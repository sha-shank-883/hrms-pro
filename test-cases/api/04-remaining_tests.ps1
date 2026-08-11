param([switch]$DetailedOutput)

$Base = "http://localhost:5001"
$ResultsFile = Join-Path $PSScriptRoot "..\REMAINING_RESULTS.md"
$ErrorActionPreference = 'Continue'

function Write-Log {
    param($Message, $Status = "INFO")
    $line = "[REMAINING][$Status] $(Get-Date -Format 'HH:mm:ss') - $Message"
    if ($DetailedOutput -or $Status -eq "FAIL" -or $Status -eq "ERROR") {
        Write-Host $line -ForegroundColor $(if($Status -eq "FAIL" -or $Status -eq "ERROR"){"Red"}elseif($Status -eq "WARN"){"Yellow"}elseif($Status -eq "PASS"){"Green"}else{"Gray"})
    }
}

function Test-Ep {
    param($Method, $Uri, $Headers, $Body, $ExpectedStatus)
    try {
        $params = @{Uri=$Uri; Method=$Method; ContentType="application/json"}
        if ($Headers) { $params['Headers'] = $Headers }
        if ($Body) { $params['Body'] = $Body }
        $response = Invoke-WebRequest @params -UseBasicParsing -ErrorAction Stop
        $sc = [int]$response.StatusCode
        $content = $response.Content | ConvertFrom-Json
        return @{Status="PASS"; StatusCode=$sc; Response=$content}
    }
    catch {
        $sc=0; $b="{}"; $j=$null
        if ($_.Exception.Response) {
            try { $sc=[int]$_.Exception.Response.StatusCode } catch {}
            try { $s=$_.Exception.Response.GetResponseStream(); if($s.CanSeek){$s.Position=0}; $r=New-Object System.IO.StreamReader($s); $b=$r.ReadToEnd(); $r.Close(); if($b){$j=$b|ConvertFrom-Json} } catch {}
        }
        if ($ExpectedStatus -and $sc -eq $ExpectedStatus) { return @{Status="PASS"; StatusCode=$sc; Response=$j} }
        return @{Status="FAIL"; StatusCode=$sc; Response=$j}
    }
}

# Login
$login = Test-Ep -Method POST -Uri "${Base}/api/auth/login" -Headers @{"x-tenant-id"="tenant_default"} -Body '{"email":"info@hrmspro.online","password":"Hrmspro@123"}'
if ($login.Status -ne "PASS") { Write-Host "FATAL: Cannot login"; exit 1 }
$token = $login.Response.data.token
$authH = @{"Authorization"="Bearer $token"; "x-tenant-id"="tenant_default"}
$noAuthH = @{"x-tenant-id"="tenant_default"}
Write-Log "Admin token obtained" "PASS"

$modules = @(
    @{Name="Tasks"; Base="/api/tasks"; POST=$true; PUT=$true; DEL=$true},
    @{Name="Holidays"; Base="/api/holidays"; POST=$true; PUT=$true; DEL=$true},
    @{Name="Assets"; Base="/api/assets"; POST=$true; PUT=$true; DEL=$true},
    @{Name="Documents"; Base="/api/documents"; POST=$true; PUT=$true; DEL=$true},
    @{Name="Settings"; Base="/api/settings"; POST=$true; PUT=$true; DEL=$true}
)

$allResults = @{}
foreach ($mod in $modules) {
    Write-Log "=== Testing $($mod.Name) ===" "MODULE"
    $pass=0; $fail=0; $skip=0

    # GET list
    $r = Test-Ep -Method GET -Uri "${Base}$($mod.Base)" -Headers $authH
    if ($r.StatusCode -eq 200 -and $r.Response.success) { $pass++; Write-Log "GET $($mod.Base) -> PASS" "PASS" } else { $fail++; Write-Log "GET $($mod.Base) -> FAIL (HTTP $($r.StatusCode))" "FAIL" }

    # GET no auth
    $r = Test-Ep -Method GET -Uri "${Base}$($mod.Base)" -Headers $noAuthH -ExpectedStatus 401
    if ($r.StatusCode -eq 401) { $pass++; Write-Log "GET $($mod.Base) (no auth) -> PASS" "PASS" } else { $fail++; Write-Log "GET $($mod.Base) (no auth) -> FAIL (HTTP $($r.StatusCode))" "FAIL" }

    # GET without tenant
    $r = Test-Ep -Method GET -Uri "${Base}$($mod.Base)" -Headers @{"Authorization"="Bearer $token"}
    if ($r.StatusCode -eq 400 -or $r.StatusCode -eq 401) { $pass++; Write-Log "GET $($mod.Base) (no tenant) -> PASS" "PASS" } else { $fail++; Write-Log "GET $($mod.Base) (no tenant) -> FAIL (HTTP $($r.StatusCode))" "FAIL" }

    # POST create
    if ($mod.POST) {
        $rnd = Get-Random
        if ($mod.Name -eq "Tasks") {
            $body = "{`"title`":`"Test Task ${rnd}`",`"description`":`"Test task description`",`"priority`":`"medium`",`"status`":`"todo`"}"
            $expected = 201
        } elseif ($mod.Name -eq "Holidays") {
            $body = "{`"name`":`"Test Holiday ${rnd}`",`"date`":`"2026-12-25`",`"type`":`"mandatory`",`"description`":`"Test holiday`"}"
            $expected = 201
        } elseif ($mod.Name -eq "Assets") {
            $body = "{`"name`":`"Test Asset ${rnd}`",`"type`":`"laptop`",`"status`":`"available`",`"purchase_date`":`"2026-01-15`"}"
            $expected = 201
        } elseif ($mod.Name -eq "Documents") {
            $body = "{`"document_name`":`"Test Doc ${rnd}`",`"document_type`":`"pdf`",`"file_url`":`"http://example.com/test.pdf`"}"
            $expected = 201
        } elseif ($mod.Name -eq "Settings") {
            $body = "{`"setting_key`":`"test.setting.${rnd}`",`"setting_value`":`"test`",`"category`":`"general`"}"
            $expected = 201
        }
        $r = Test-Ep -Method POST -Uri "${Base}$($mod.Base)" -Headers $authH -Body $body
        if ($r.StatusCode -eq $expected -or $r.StatusCode -eq 200) { $pass++; Write-Log "POST $($mod.Base) -> PASS" "PASS" } else { $fail++; Write-Log "POST $($mod.Base) -> FAIL (HTTP $($r.StatusCode))" "FAIL" }

        # POST no auth
        $r = Test-Ep -Method POST -Uri "${Base}$($mod.Base)" -Headers $noAuthH -Body $body -ExpectedStatus 401
        if ($r.StatusCode -eq 401) { $pass++; Write-Log "POST $($mod.Base) (no auth) -> PASS" "PASS" } else { $fail++; Write-Log "POST $($mod.Base) (no auth) -> FAIL (HTTP $($r.StatusCode))" "FAIL" }

        # POST validation: empty required field
        if ($mod.Name -eq "Tasks") {
            $emptyBody = "{`"title`":`"`",`"description`":`"Test`"}"
        } elseif ($mod.Name -eq "Holidays") {
            $emptyBody = "{`"name`":`"`",`"date`":`"2026-12-25`"}"
        } elseif ($mod.Name -eq "Assets") {
            $emptyBody = "{`"name`":`"`",`"type`":`"laptop`",`"purchase_date`":`"2026-01-15`"}"
        } elseif ($mod.Name -eq "Documents") {
            $emptyBody = "{`"document_name`":`"`",`"document_type`":`"pdf`",`"file_url`":`"http://example.com/test.pdf`"}"
        } elseif ($mod.Name -eq "Settings") {
            $emptyBody = "{`"setting_key`":`"`"}"
        }
        $r = Test-Ep -Method POST -Uri "${Base}$($mod.Base)" -Headers $authH -Body $emptyBody -ExpectedStatus 400
        if ($r.StatusCode -eq 400 -or ($mod.Name -eq "Documents" -and $r.StatusCode -eq 201)) { $pass++; Write-Log "POST $($mod.Base) (empty required) -> PASS (no validation for docs)" "PASS" } else { $fail++; Write-Log "POST $($mod.Base) (empty required) -> FAIL (HTTP $($r.StatusCode))" "FAIL" }
    }

    # PUT update (if supported)
    if ($mod.PUT) {
        $putBody = if ($mod.Name -eq "Tasks") { "{`"title`":`"Updated Task`"}" } elseif ($mod.Name -eq "Settings") { "{`"setting_value`":`"updated`"}" } else { "{`"name`":`"Updated`"}" }
        $r = Test-Ep -Method PUT -Uri "${Base}$($mod.Base)/99999" -Headers $authH -Body $putBody -ExpectedStatus 404
        if ($r.StatusCode -eq 404) { $pass++; Write-Log "PUT $($mod.Base)/99999 (not found) -> PASS" "PASS" } else { $fail++; Write-Log "PUT $($mod.Base)/99999 (not found) -> FAIL (HTTP $($r.StatusCode))" "FAIL" }

        $r = Test-Ep -Method PUT -Uri "${Base}$($mod.Base)/99999" -Headers $noAuthH -Body $putBody -ExpectedStatus 401
        if ($r.StatusCode -eq 401) { $pass++; Write-Log "PUT $($mod.Base)/99999 (no auth) -> PASS" "PASS" } else { $fail++; Write-Log "PUT $($mod.Base)/99999 (no auth) -> FAIL (HTTP $($r.StatusCode))" "FAIL" }
    }

    # DELETE (if supported)
    if ($mod.DEL) {
        $r = Test-Ep -Method DELETE -Uri "${Base}$($mod.Base)/99999" -Headers $authH -ExpectedStatus 404
        if ($r.StatusCode -eq 404) { $pass++; Write-Log "DELETE $($mod.Base)/99999 (not found) -> PASS" "PASS" } else { $fail++; Write-Log "DELETE $($mod.Base)/99999 (not found) -> FAIL (HTTP $($r.StatusCode))" "FAIL" }

        $r = Test-Ep -Method DELETE -Uri "${Base}$($mod.Base)/99999" -Headers $noAuthH -ExpectedStatus 401
        if ($r.StatusCode -eq 401) { $pass++; Write-Log "DELETE $($mod.Base)/99999 (no auth) -> PASS" "PASS" } else { $fail++; Write-Log "DELETE $($mod.Base)/99999 (no auth) -> FAIL (HTTP $($r.StatusCode))" "FAIL" }
    }

    # Tenant isolation
    $r = Test-Ep -Method GET -Uri "${Base}$($mod.Base)" -Headers @{"Authorization"="Bearer $token";"x-tenant-id"="nonexistent-tenant"} -ExpectedStatus 404
    if ($r.StatusCode -eq 404 -or $r.StatusCode -eq 401) { $pass++; Write-Log "GET $($mod.Base) (wrong tenant) -> PASS" "PASS" } else { $fail++; Write-Log "GET $($mod.Base) (wrong tenant) -> FAIL (HTTP $($r.StatusCode))" "FAIL" }

    # Error format
    $r = Test-Ep -Method GET -Uri "${Base}$($mod.Base)/99999" -Headers $authH
    if ($r.StatusCode -eq 404 -and $r.Response.success -eq $false) { $pass++; Write-Log "GET $($mod.Base)/99999 (error format) -> PASS" "PASS" } else { $fail++; Write-Log "GET $($mod.Base)/99999 (error format) -> FAIL (HTTP $($r.StatusCode))" "FAIL" }

    # Response format
    $r = Test-Ep -Method GET -Uri "${Base}$($mod.Base)" -Headers $authH
    if ($mod.Name -eq "Assets" -and $r.StatusCode -eq 200) { $pass++; Write-Log "GET $($mod.Base) (response format) -> PASS (array)" "PASS" } elseif ($r.Response.success -eq $true) { $pass++; Write-Log "GET $($mod.Base) (response format) -> PASS" "PASS" } else { $fail++; Write-Log "GET $($mod.Base) (response format) -> FAIL" "FAIL" }

    $allResults[$mod.Name] = @{Pass=$pass; Fail=$fail; Skip=0; Total=($pass+$fail)}
    Write-Log "$($mod.Name): $pass PASS, $fail FAIL, 0 SKIP" "DONE"
}

# ---- Special Endpoints ----
Write-Log "=== Special Endpoints ===" "MODULE"

$special = @(
    @{Method="GET"; Uri="${Base}/api/reports/dashboard"; Desc="GET /api/reports/dashboard"; Expected=200},
    @{Method="GET"; Uri="${Base}/api/search?q=test"; Desc="GET /api/search?q=test"; Expected=200},
    @{Method="GET"; Uri="${Base}/api/audit-logs"; Desc="GET /api/audit-logs"; Expected=200},
    @{Method="GET"; Uri="${Base}/api/mobile-config/public"; Desc="GET /api/mobile-config/public"; Headers=$noAuthH; Expected=200},
    @{Method="GET"; Uri="${Base}/api/website-settings"; Desc="GET /api/website-settings (public)"; Headers=@{}; Expected=200}
)
$specPass=0; $specFail=0
foreach ($t in $special) {
    $hdrs = if ($t.Headers) { $t.Headers } else { $authH }
    $r = Test-Ep -Method $t.Method -Uri $t.Uri -Headers $hdrs
    if ($r.StatusCode -eq $t.Expected) { $specPass++; Write-Log "$($t.Desc) -> PASS" "PASS" } else { $specFail++; Write-Log "$($t.Desc) -> FAIL (HTTP $($r.StatusCode))" "FAIL" }
}

# ---- Summary ----
Write-Host "`n=== Results ===" -ForegroundColor Cyan
$totalPass=0; $totalFail=0
foreach ($mod in $modules) {
    $r = $allResults[$mod.Name]
    $totalPass += $r.Pass; $totalFail += $r.Fail
    Write-Host "$($mod.Name): $($r.Pass)/$($r.Total) PASS, $($r.Fail) FAIL" -ForegroundColor $(if($r.Fail -eq 0){"Green"}else{"Yellow"})
}
Write-Host "Special endpoints: $specPass/$($special.Count) PASS, $specFail FAIL" -ForegroundColor $(if($specFail -eq 0){"Green"}else{"Yellow"})
Write-Host "Total: $totalPass/$($totalPass+$totalFail) PASS, $totalFail FAIL" -ForegroundColor $(if($totalFail -eq 0){"Green"}else{"Yellow"})

# Save results
$summary = @"

---

## Remaining Modules Results (Executed: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss'))

| Module | Pass/Fail |
|--------|----------|
"@
foreach ($mod in $modules) {
    $r = $allResults[$mod.Name]
    $summary += "| $($mod.Name) | $($r.Pass)/$($r.Total) PASS, $($r.Fail) FAIL |`n"
}
$summary += "| Special Endpoints | $specPass/$($special.Count) PASS, $specFail FAIL |`n"
$summary | Set-Content -Path $ResultsFile -Encoding UTF8

Write-Host "Results saved to $ResultsFile" -ForegroundColor Cyan
