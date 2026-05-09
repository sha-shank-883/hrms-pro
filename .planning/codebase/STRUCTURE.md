# STRUCTURE

**Date:** 2026-05-09

## Directory Layout
- `/backend/`
  - `src/routes/` - Express route definitions
  - `src/controllers/` - Request handlers and logic
  - `src/scripts/` - Database setup and migrations
- `/frontend/`
  - `src/pages/` - Route-level components
  - `src/components/` - Reusable UI elements (grouped by module like `attendance/`, `dashboard/`)
  - `src/services/` - API interaction wrappers
- `/mobile/`
  - React Native (Expo) application structure

## Key Locations
- `backend/src/server.js`: Backend entry point
- `frontend/src/services/api.js`: Global axios config
- `backend/src/scripts/setupMultiTenancy.js`: Tenant creation logic
