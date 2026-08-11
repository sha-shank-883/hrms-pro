# Payroll Module — Complete Rebuild Plan

## 🎯 Vision

As the organization owner, you design your payslip exactly how you want (logo position, colors, fields, layout), and everyone in the system gets payslips rendered from your design. All employees show up, currencies adapt, bulk email/download works, and QR codes verify authenticity.

---

## ⚠️ Current State (Broken)

| Feature | Status |
|---|---|
| Payslip Designer UI | ✅ Exists but **does nothing** — PDF ignores it |
| PDF Generation | ❌ Hardcoded layout, no company logo/name, $ symbol fixed |
| Employee Listing | ✅ Fixed (was filtering by `status='active'` only) |
| Company Details in PDF | ❌ Missing entirely |
| QR Code | ❌ Placeholder — never generates |
| Bulk Email | ❌ Only single email per payslip |
| Bulk ZIP Download | ❌ Not implemented |
| Excel Export | ❌ Only CSV with no formatting |
| Multi-Currency | ❌ Fixed to $ |
| Payslip Approval | ❌ No workflow |
| Summary Fields | ❌ `total_gross/net` on runs stay at 0 |
| Tenant Isolation | ❌ Not scoped by tenant |

---

## Phase 1: Foundation — Connect Templates to PDF (2 days)

Make the existing `payslip_templates` actually control PDF output.

**Backend:**
1. Rewrite `pdfService.js` — accept a `template` parameter, render layout from `layout_json`:
   - Company logo (URL → image on PDF)
   - Company name, address, phone, email (from settings)
   - Currency symbol (from settings → `currency_symbol`)
   - Section ordering (employee details, earnings, deductions, summary — reorderable)
   - Field visibility (excluded fields hidden)
   - Color scheme (primary, accent, background from template)
2. Fix `payroll_runs` summary fields — populate `total_gross`, `total_deductions`, `total_net` after bulk generate
3. Add tenant-scoped queries to all payroll controllers

**Frontend:**
4. Enhance `PayslipDesigner.jsx` — add: color picker (primary/accent), logo upload, currency selection, section reordering
5. Add live PDF preview in designer (call backend with `?preview=true`)

**Files affected:**
- `backend/src/services/pdfService.js` — **rewrite**
- `backend/src/controllers/payslipController.js` — pass template to PDF
- `backend/src/controllers/payrollRunController.js` — populate summary fields
- `frontend/src/pages/PayslipDesigner.jsx` — **enhance**
- `backend/src/config/schema.sql` — add template columns (colors, logo config)

---

## Phase 2: Visual Drag-and-Drop Designer (4 days)

Build a proper WYSIWYG canvas where you design the payslip visually.

**New/Modified Files:**
- `frontend/src/pages/PayslipDesigner.jsx` — **rewrite with canvas**
- `frontend/src/components/payroll/DesignerCanvas.jsx` — **new** — drag-drop canvas
- `frontend/src/components/payroll/DesignerToolbar.jsx` — **new** — component palette
- `frontend/src/components/payroll/DesignerPropertyPanel.jsx` — **new** — field properties
- `backend/src/routes/payslipTemplateRoutes.js` — add preview endpoint

**How it works:**
- Left panel: Available components (Company Logo, Employee Photo, Text Block, Field Value, Table, Divider, QR Code, Signature Line)
- Center: Canvas showing the payslip as it will look (WYSIWYG)
- Right panel: Properties for selected component (font, size, color, position, alignment)
- Components are drag-and-drop onto canvas, repositionable
- Save produces a `layout_json` that the PDF generator renders exactly

**Layout JSON structure:**
```json
{
  "page": { "size": "A4", "orientation": "portrait", "margin": 20 },
  "colors": { "primary": "#4f46e5", "accent": "#10b981", "background": "#ffffff", "text": "#111827" },
  "show_logo": true,
  "logo_position": "top-left",
  "show_company_name": true,
  "show_qr_code": true,
  "show_signature": false,
  "currency_symbol": "auto",
  "sections": [
    { "key": "header", "label": "Header", "visible": true, "order": 1, "fields": [...] },
    { "key": "employee_details", "label": "Employee Details", "visible": true, "order": 2, "fields": [...] },
    { "key": "earnings", ... },
    { "key": "deductions", ... },
    { "key": "summary", ... },
    { "key": "footer", ... }
  ]
}
```

---

## Phase 3: Advanced Features (3 days)

### 3.1 QR Code on Every Payslip
- Generate QR code containing: `{payslip_id, employee_id, period, net_pay_hash}`
- Add to PDF and detail modal
- Verification endpoint accepts QR scan → returns authenticity

### 3.2 Multi-Currency
- Read `currency_symbol` and `currency` from settings
- Apply to PDF, exports, detail modal
- Support INR (₹), USD ($), EUR (€), GBP (£), etc.

### 3.3 Bulk Email
- New endpoint: `POST /payroll-runs/:id/email-all`
- Queue all payslips in run for email delivery
- Progress tracking in email queue UI
- Per-employee email or batch send

### 3.4 Bulk ZIP Download
- New endpoint: `GET /payroll-runs/:id/download-all`
- Server generates ZIP of all PDFs
- Returns as downloadable ZIP file
- Frontend button on PayrollRuns page

### 3.5 Excel Export with Formatting
- Replace CSV with proper `.xlsx` using `excel4node`
- Styled headers, currency formatting, auto-column-width
- Per-run and per-period exports

---

## Phase 4: Approval Workflow (2 days)

Add a review step between generation and visibility.

**Status flow:**
```
draft → finalized → approved → paid → archived
                         ↑ (NEW)
                   manager reviews
                   each payslip line
```

- New status: `approved`
- Manager dashboard: pending approval queue
- Employee can only see payslips after `approved` or `paid`
- `payRun` requires `approved` first

---

## Phase 5: Bug Fixes & Polish (1 day)

| Bug | Fix |
|---|---|
| `is_archived` not in `payroll` table | Add column or use `payment_status` |
| Inconsistent ID fields (`id` vs `payslip_id` vs `payroll_id`) | Normalize to `payslip_id` |
| Duplicate calculation engines | Deprecate `payrollController.generateAutomaticPayroll` |
| `getSetting` helper duplicated | Extract to shared module |
| All earnings/deduction amounts hardcoded | Read from settings table |
| Bonus always 0 | Wire up to actual bonus data |
| HRA fixed at 40% | Make configurable per employee type |
| Department dropdown dead | Wire to backend or remove |

---

## Timeline

| Phase | Days | What You Get |
|---|---|---|
| Phase 1 | 2 | Templates actually control PDF, company details on payslip, working currency config |
| Phase 2 | 4 | Full WYSIWYG drag-and-drop editor — you design the slip visually |
| Phase 3 | 3 | QR codes, multi-currency, bulk email, ZIP download, Excel exports |
| Phase 4 | 2 | Manager approval workflow before employee sees payslip |
| Phase 5 | 1 | All outstanding bugs fixed |
| **Total** | **12 days** | |

---

## Immediate Fix (Already Done)

Removed the `WHERE status = 'active'` filter from `payslipController.js`, `payrollController.js`, and `payslipEngine.js`. All employees now show when generating payslips. Restart the backend to apply.
