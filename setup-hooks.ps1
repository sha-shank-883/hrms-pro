# setup-hooks.ps1
# Configures Git to use .githooks/ as the hooks directory

Write-Host "🔧 Setting up HRMS Pro git hooks..." -ForegroundColor Cyan

# Set hooks path
git config core.hooksPath .githooks

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Git hooks configured from .githooks/" -ForegroundColor Green
    Write-Host "   Pre-push checks will run on every 'git push'" -ForegroundColor Green
    Write-Host "   To bypass: git push --no-verify" -ForegroundColor Yellow
} else {
    Write-Host "❌ Failed to configure hooks path" -ForegroundColor Red
    exit 1
}

# Verify hook exists
if (Test-Path ".githooks/pre-push") {
    Write-Host "✅ pre-push hook found" -ForegroundColor Green
} else {
    Write-Host "⚠️  pre-push hook not found at .githooks/pre-push" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Done!" -ForegroundColor Cyan
