$c = Get-Content "frontend\src\pages\WebsiteSettings.jsx"
$total = $c.Count
Write-Output "Total lines: $total"
$inReturn = $false
$braceDepth = 0
$parenDepth = 0
$lineNum = 0
$issueFound = $null
foreach ($line in $c) {
    $lineNum++
    $trimmed = $line.Trim()
    if ($trimmed -match '^return\s*\(') {
        $inReturn = $true
        $returnStart = $lineNum
        Write-Output "Line ${lineNum}: RETURN START (depth: brace=$braceDepth paren=$parenDepth)"
    }
    if ($inReturn) {
        foreach ($ch in $line.ToCharArray()) {
            if ($ch -eq '{') { $braceDepth++ }
            if ($ch -eq '}') { $braceDepth-- }
            if ($ch -eq '(') { $parenDepth++ }
            if ($ch -eq ')') { $parenDepth-- }
        }
        if ($trimmed -eq ');') {
            Write-Output "Line ${lineNum}: RETURN END. Braces: $braceDepth, Parens: $parenDepth"
            if ($braceDepth -ne 0 -or $parenDepth -ne 0) {
                $issueFound = "Return section (lines ${returnStart}-${lineNum}) - braces: ${braceDepth}, parens: ${parenDepth}"
            }
            $inReturn = $false
        }
    }
    if ($lineNum -ge 528 -and $lineNum -le 534) {
        Write-Output "Line ${lineNum} (around error): braceDepth=${braceDepth}, parenDepth=${parenDepth} [${trimmed}]"
    }
}
if ($issueFound) {
    Write-Output "ISSUE: $issueFound"
} else {
    Write-Output "Balanced."
}
