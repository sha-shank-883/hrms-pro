# ARCHITECTURE

**Date:** 2026-05-09

## System Pattern
- **Pattern:** Model-View-Controller (MVC) on Backend, Component-based SPA on Frontend
- **Data Flow:** Frontend/Mobile -> Backend API -> Controllers -> PostgreSQL DB

## Layers
- **Backend:**
  - **Routes (`backend/src/routes/`):** URL endpoints mapping to controllers. No business logic.
  - **Controllers (`backend/src/controllers/`):** Core business logic, executes SQL transactions.
  - **Scripts (`backend/src/scripts/`):** CLI and setup scripts (migrations, multitenancy, seeding).
- **Frontend:**
  - **Services (`frontend/src/services/`):** Axios wrappers for HTTP API communication.
  - **Contexts:** React Context (AuthContext, SocketContext) for global state.
  - **Pages (`frontend/src/pages/`):** React components for discrete routes.
  - **Components (`frontend/src/components/`):** Reusable UI parts.
- **Mobile:**
  - Built with Expo and React Native, mirrors frontend logic but adapted for mobile UI.

## Multi-Tenancy
- **Architecture:** Schema-based isolation (tenant schemas in PostgreSQL). Managed via `tenantRoutes.js` and `createTenant.js`.
