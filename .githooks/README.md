# Pre-push Hook Setup

## Install
Run this once to enable the pre-push hook:

**PowerShell:**
```powershell
git config core.hooksPath .githooks
```

**Or run the setup script:**
```powershell
.\setup-hooks.ps1
```

## What it checks on every `git push`

| Check | Blocks? |
|---|---|
| `.env` files staged | ❌ Blocks |
| API keys / secrets in staged files | ❌ Blocks |
| Hardcoded `localhost` URLs in source (wrong port 5000) | ⚠️ Warns |
| Hardcoded local IP addresses (192.168.x.x / 10.0.x.x) | ⚠️ Warns |
| Frontend build passes | ❌ Blocks |

## Bypass (emergency only)
```bash
git push --no-verify origin main
```
