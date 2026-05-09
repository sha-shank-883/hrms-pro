# TESTING

**Date:** 2026-05-09

## Frameworks
- No formal testing framework configured in `package.json` (scripts state `"test": "echo \"Error: no test specified\" && exit 1"`).

## Patterns
- Relies on manual execution of scripts like `generate_demo_data.js` to seed the local database.
- `testEmail.js` / `testEmailTemplates.js` used for dry-run testing before deploying notification features.

## Coverage
- Test coverage appears minimal or undocumented for automated runs.
