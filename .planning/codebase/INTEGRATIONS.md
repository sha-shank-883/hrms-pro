# INTEGRATIONS

**Date:** 2026-05-09

## External APIs & Services
- **Real-time Communication:** Socket.IO for WebSockets (used in Chat module)
- **Email/Notifications:** Nodemailer (dynamic templates with Handlebars/HTML)
- **Authentication:** JWT, bcryptjs, Speakeasy (for 2FA/TOTP)
- **Document/Storage:** Multer (local file ingestion or cloud bucket integration)
- **Biometrics:** Mentioned in `upgrade_biometrics.js` for attendance
- **PDF Generation:** pdf-parse for reading/processing PDFs, possibly generating them in reportRoutes
- **QR Codes:** `qrcode` library for generating QR codes

## Webhooks
- Unknown externally exposed webhooks, but potential internal webhook structure for reports and tasks.
