# CONVENTIONS

**Date:** 2026-05-09

## Code Style
- **Backend:** CommonJS modules (`require`), MVC split strictly separating routing from logic.
- **Frontend:** ES Modules (`import`), React Hooks, JSX, Tailwind CSS for styling.
- **Mobile:** TypeScript/TSX, React Navigation, Expo libraries.

## Naming
- Controllers: camelCase with `Controller` suffix (e.g., `assetController.js`).
- Routes: camelCase with `Routes` suffix (e.g., `assetRoutes.js`).
- React Components: PascalCase for files and components.

## Patterns
- API routing passes `req, res` straight to controllers.
- Real-time features use `SocketContext` wrapper around `socket.io-client`.
- Security gating via `ProtectedRoute.jsx` and `SuperAdminRoute.jsx`.
