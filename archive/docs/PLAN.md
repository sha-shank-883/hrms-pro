# Implementation Plan

## ✅ Completed

### Infrastructure & Stability
- PHP-1.1 Goal table upgrade script (0.5h)
- PHP-1.2 CMS update crash fix (0.5h)

### Code Quality & Improvements
- PHP-2.1 Employee PUT dynamic update (2h)
- PHP-2.2 Email error handling (1h) — Already graceful (3 retries then drop)
- PHP-2.3 Validation middleware for CMS + Assets (1h)

### Performance
- PHP-3.1 Frontend chunk splitting (1h)
- PHP-3.2 API rate limiting (0.5h) — Already enabled (1000/15min)

### Feature Parity
- PHP-4.1 Holiday CRUD endpoints (2h)
- PHP-4.2 Web dark mode toggle (2h)

### Payroll Module Overhaul — Phase 1 (Foundation)
| Item | Est. Effort | Status |
|---|---|---|
| PHP-5.1 Fix SQL injection in reportController.js | 0.5h | ✅ Done |
| PHP-5.2 Fix leave deduction + social security/medicare in payroll controller | 0.5h | ✅ Done |
| PHP-5.3 Add missing GET /payroll/:id/payslip route | 0.5h | ✅ Done |
| PHP-5.4 Fix MyPayslips endpoint + mobile service layer | 0.5h | ✅ Done |
| PHP-5.5 New DB schema: payroll_runs, payslips, payslip_earnings, payslip_deductions, payslip_templates, email_queue | 1h | ✅ Done |

### Payroll Module Overhaul — Phase 2 (Backend Core)
| Item | Est. Effort | Status |
|---|---|---|
| PHP-6.1 payslipEngine.js — component calculations, tax, pro-rating, attendance integration | 2h | ✅ Done |
| PHP-6.2 pdfService.js — server-side PDF generation (jspdf) | 1h | ✅ Done |
| PHP-6.3 payslipTemplateController — CRUD for JSON-based templates | 1h | ✅ Done |
| PHP-6.4 payrollRunController — run lifecycle (draft→finalize→pay→archive) | 2h | ✅ Done |
| PHP-6.5 payslipController — generate from runs, list, detail, PDF, email, verify | 2h | ✅ Done |
| PHP-6.6 Route files + server.js integration | 0.5h | ✅ Done |
| PHP-6.7 Test cases (63 for new endpoints) | 1h | ✅ Done |

### Payroll Module Overhaul — Phase 3 (Backend Advanced)
| Item | Est. Effort | Status |
|---|---|---|
| PHP-7.1 emailQueueService — DB-backed background worker, retry, SMTP | 1.5h | ✅ Done |
| PHP-7.2 exportService — CSV export with BOM for payslips, runs, earnings | 1h | ✅ Done |
| PHP-7.3 emailQueueController — list, retry, cancel, stats | 1h | ✅ Done |
| PHP-7.4 exportController + exportRoutes — 3 download endpoints | 0.5h | ✅ Done |
| PHP-7.5 Routes + server.js integration + worker startup | 0.5h | ✅ Done |
| PHP-7.6 Test cases (108 for V3 endpoints: email queue, export, audit, edge) | 1h | ✅ Done |

### Payroll Module Overhaul — Phase 4 (Frontend Admin)
| Item | Est. Effort | Status |
|---|---|---|
| PHP-8.1 Extend payroll service with V2 API methods | 0.5h | ✅ Done |
| PHP-8.2 PayrollRuns.jsx — List, create, finalize, pay, archive with expandable rows | 2h | ✅ Done |
| PHP-8.3 PayslipDesigner.jsx — Template CRUD with field visibility toggle & reorder | 2h | ✅ Done |
| PHP-8.4 BatchActions.jsx — Bulk generate, email queue monitor, CSV export | 2h | ✅ Done |
| PHP-8.5 App.jsx routes + sidebar sub-navigation | 0.5h | ✅ Done |
| PHP-8.6 Test cases (77 frontend: runs, designer, batch, nav, security) | 1h | ✅ Done |

### Payroll Module Overhaul — Phase 5 (Frontend Employee)
| Item | Est. Effort | Status |
|---|---|---|
| PHP-9.1 Upgrade MyPayslips.jsx — tabs (current/archived), stats cards, download all, archive/unarchive, reissue request, date filter | 2h | ✅ Done |
| PHP-9.2 PayslipDetailModal.jsx — reusable modal with V2 earnings/deductions, verification, PDF download, email, print | 2h | ✅ Done |
| PHP-9.3 Test cases (34 additional: mypayslips upgrades + detail modal) | 0.5h | ✅ Done |

---

## 🔲 Planned Phases

### Phase 6: Mobile — PayrollScreen upgrade
| Item | Est. Effort | Status |
|---|---|---|
| PHP-10.1 Extend API service with V2 payslip methods | 0.5h | ✅ Done |
| PHP-10.2 Rewrite PayrollScreen.tsx — FlatList, tabs (All/Pending/Paid/Archived), detail modal, PDF download via expo-file-system + expo-sharing, batch download all, archive/unarchive, search | 3h | ✅ Done |
| PHP-10.3 Test cases (34 mobile: list, tabs, modal, PDF, download, archive) | 0.5h | ✅ Done |

---

## 🔲 Planned Phases

*None*
