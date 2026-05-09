# CONCERNS

**Date:** 2026-05-09

## Tech Debt & Fragile Areas
- **Testing:** Lack of automated test suites (unit/integration tests) across backend and frontend. This increases the risk of regression during major refactors.
- **Database Migrations:** Schema migrations are handled by ad-hoc scripts in `backend/src/scripts/` instead of a structured migration tool (like Knex or Sequelize CLI), which could lead to versioning issues.
- **Mobile Types:** The mobile app is TypeScript but the frontend and backend are plain JavaScript, meaning types cannot easily be shared or enforced end-to-end.

## Security
- `fix_2fa_schema.js` suggests past issues with 2FA schema integrity.
- File uploads are managed by Multer locally; ensure directory traversal protections are active.
