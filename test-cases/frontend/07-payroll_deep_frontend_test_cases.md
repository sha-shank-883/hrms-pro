# Deep Payroll Frontend Test Cases — 100+ Tests

## Payroll Runs Page (`/payroll/runs`) — Every Element Tested

### Page Rendering & Layout
| # | Test Case | Expected Result |
|---|---|---|
| RUN-FD01 | Page title "Payroll Runs" visible | H1 heading renders |
| RUN-FD02 | Subtitle "Manage payroll run lifecycle" visible | Description text below heading |
| RUN-FD03 | "New Run" button with FaPlus icon visible | Button renders in header |
| RUN-FD04 | Status filter dropdown with 5 options | All/ Draft/ Finalized/ Paid/ Archived |
| RUN-FD05 | Year filter input with current year prefilled | Input shows current year |
| RUN-FD06 | "Apply Filters" button visible | Applies status + year filters |
| RUN-FD07 | "Clear Filters" button visible | Resets all filters |
| RUN-FD08 | Export CSV button with FaFileExport icon | Triggers CSV download |
| RUN-FD09 | Runs table renders with all columns | Period, Status, Employees, Gross, Deductions, Net, Actions |
| RUN-FD10 | Pagination controls at bottom | Page numbers + prev/next |
| RUN-FD11 | Loading skeleton/spinner during fetch | Loading state visible |
| RUN-FD12 | Empty state with "No payroll runs found" message | Empty state renders when no data |
| RUN-FD13 | Error state with error banner | Red banner shows on API failure |

### Create Run Modal
| # | Test Case | Expected Result |
|---|---|---|
| RUN-FD14 | Click "New Run" opens modal | Modal overlay with form |
| RUN-FD15 | Modal has month dropdown (1-12) | Month select with 12 options |
| RUN-FD16 | Modal has year input | Year input field |
| RUN-FD17 | Modal has notes textarea | Notes field for additional info |
| RUN-FD18 | Modal has "Cancel" button | Closes modal without creating |
| RUN-FD19 | Modal has "Create" button | Submits form |
| RUN-FD20 | "Create" with empty month | Validation error: month required |
| RUN-FD21 | "Create" with empty year | Validation error: year required |
| RUN-FD22 | "Create" with valid data | Run created, modal closes, list refreshes |
| RUN-FD23 | Success banner appears after creation | Green success message |
| RUN-FD24 | Click "Cancel" closes modal | Modal disappears, no API call |
| RUN-FD25 | Notes field saves correctly | Created run shows notes in expanded view |
| RUN-FD26 | Creating state shows spinner on button | Button disabled, spinner shown |

### Run Actions — Finalize
| # | Test Case | Expected Result |
|---|---|---|
| RUN-FD27 | Finalize button visible on draft runs | Button with FaCheckCircle icon |
| RUN-FD28 | Click Finalize on draft run | Status changes to finalized |
| RUN-FD29 | Success message "Run finalized successfully" | Green banner |
| RUN-FD30 | Finalize button hidden on non-draft runs | Not visible for finalized/paid/archived |
| RUN-FD31 | Finalize button shows spinner during API call | Loading state |
| RUN-FD32 | Finalize error displayed in banner | Red banner on failure |

### Run Actions — Pay
| # | Test Case | Expected Result |
|---|---|---|
| RUN-FD33 | Pay button visible on finalized runs | Button with FaMoneyBillWave icon |
| RUN-FD34 | Click Pay on finalized run | Status changes to paid |
| RUN-FD35 | Success message "Run Pay successfully" | Green banner |
| PR-FD36 | Pay button hidden on draft/paid/archived | Only on finalized |
| RUN-FD37 | Pay button shows spinner during API call | Loading state |
| RUN-FD38 | Pay error shown in banner | Red banner on failure |

### Run Actions — Archive
| # | Test Case | Expected Result |
|---|---|---|
| RUN-FD39 | Archive button visible on finalized/paid runs | Button with FaArchive icon |
| RUN-FD40 | Click Archive on finalized run | Status changes to archived |
| RUN-FD41 | Click Archive on paid run | Status changes to archived |
| RUN-FD42 | Archive button hidden on draft runs | Not visible |
| RUN-FD43 | Archive button hidden on already-archived runs | Not visible |
| RUN-FD44 | Archive shows spinner during API call | Loading state |

### Run Actions — Delete
| # | Test Case | Expected Result |
|---|---|---|
| RUN-FD45 | Delete button visible on draft runs | Button with FaTrash icon |
| RUN-FD46 | Click Delete on draft run | Run removed from list |
| RUN-FD47 | Success message "Run deleted successfully" | Green banner |
| RUN-FD48 | Delete button hidden on non-draft runs | Not visible |
| RUN-FD49 | Delete shows spinner during API call | Loading state |
| RUN-FD50 | Delete error shown in banner | Red banner on failure |

### Expand Run Row — Payslip Detail
| # | Test Case | Expected Result |
|---|---|---|
| RUN-FD51 | Click run row to expand | Expanded section slides open |
| RUN-FD52 | Expanded section shows payslip table | Table with employee, salary, gross, net, status, PDF |
| RUN-FD53 | Payslip table has employee name column | Name displayed |
| RUN-FD54 | Payslip table has basic salary column | Salary formatted with commas |
| RUN-FD55 | Payslip table has gross pay column | Gross shown |
| RUN-FD56 | Payslip table has net pay column | Net shown (bold) |
| RUN-FD57 | Payslip table has payment status column | StatusBadge component renders |
| RUN-FD58 | Payslip table has PDF download button | Download button per row |
| RUN-FD59 | Click Download PDF | PDF downloaded/opened |
| RUN-FD60 | Click run row again to collapse | Expanded section closes |
| RUN-FD61 | Run detail load failure shows error | Red banner on API error |
| RUN-FD62 | Summary section shows total/paid/pending counts | Summary at top of expanded section |

### Filtering
| # | Test Case | Expected Result |
|---|---|---|
| RUN-FD63 | Select status="draft" + Apply | Only draft runs shown |
| RUN-FD64 | Select status="finalized" + Apply | Only finalized runs shown |
| RUN-FD65 | Select status="paid" + Apply | Only paid runs shown |
| RUN-FD66 | Select status="archived" + Apply | Only archived runs shown |
| RUN-FD67 | Change year to 2025 + Apply | Only 2025 runs shown |
| RUN-FD68 | Combined: status="paid" + year="2026" | Paid runs in 2026 |
| RUN-FD69 | Click "Clear Filters" | All filters reset, all runs shown |
| RUN-FD70 | Status badge colors match status | Gray=draft, Blue=finalized, Green=paid, Purple=archived |

### Pagination
| # | Test Case | Expected Result |
|---|---|---|
| RUN-FD71 | Page 1 loads first 10 runs | 10 items shown |
| RUN-FD72 | Click "Next" page button | Page 2 loads |
| RUN-FD73 | Click "Previous" page button | Page 1 loads |
| RUN-FD74 | Click specific page number | That page loads |
| RUN-FD75 | Pagination shows "Page X of Y" | Info text visible |
| RUN-FD76 | Disabled state on first/last page | Prev disabled on page 1, Next disabled on last |

### Export CSV
| # | Test Case | Expected Result |
|---|---|---|
| RUN-FD77 | Click Export button | CSV file download initiated |
| RUN-FD78 | Export filename format | payroll_runs_YYYY-MM-DD.csv |
| RUN-FD79 | Export with active filters applied | CSV reflects current filter state |
| RUN-FD80 | Export error shows banner | Red error message |

### Actions Loading & Disabled States
| # | Test Case | Expected Result |
|---|---|---|
| RUN-FD81 | One action loading doesn't block others | Multiple actions can be in progress |
| RUN-FD82 | Action button disabled during API call | Cannot click again |
| RUN-FD83 | Spinner shown during action | FaSpinner icon replacing button text |

## Payslip Designer Page (`/payroll/payslip-designer`)

### Page Rendering
| # | Test Case | Expected Result |
|---|---|---|
| DES-FD84 | Page title "Payslip Designer" visible | Heading renders |
| DES-FD85 | Subtitle "Design and manage payslip templates" visible | Description text |
| DES-FD86 | "Create Template" button visible | Button with FaPlus icon |
| DES-FD87 | Template cards rendered in grid | Card layout with name, sections, actions |
| DES-FD88 | Default template badge shows "Default" | Star icon + "Default" label |
| DES-FD89 | Template shows field count per section | Section: N fields displayed |
| DES-FD90 | Color swatches visible on card | Mini color circles |
| DES-FD91 | Loading skeleton during fetch | Loading state |
| DES-FD92 | Empty state when no templates | "No payslip templates" message |
| DES-FD93 | Error state on API failure | Error banner |

### Template Card Actions
| # | Test Case | Expected Result |
|---|---|---|
| DES-FD94 | Edit button (FaEdit) opens editor | Modal opens with template data |
| DES-FD95 | Preview button calls preview API | PDF preview opens in new tab |
| DES-FD96 | Preview error handled gracefully | Error message shown (not silent) |
| DES-FD97 | "Set Default" button visible on non-default templates | FaRegStar icon |
| DES-FD98 | Click "Set Default" updates immediately | Badge moves to new template |
| DES-FD99 | Default badge hidden on new default | Previously default loses badge |
| DES-FD100 | Delete button visible (FaTrash) | Red delete button |
| DES-FD101 | Click Delete shows confirmation | Confirm dialog/modal |
| DES-FD102 | Confirm delete removes template | Card removed from grid |
| DES-FD103 | Cancel delete keeps template | Card remains |
| DES-FD104 | Delete success message | Green banner |
| DES-FD105 | Delete error message | Red banner |
| DES-FD106 | "Set Default" error message | Red banner on API failure |

### Create/Edit Template Modal
| # | Test Case | Expected Result |
|---|---|---|
| DES-FD107 | Modal opens with "Create Template" or "Edit Template" title | Correct title |
| DES-FD108 | Name input field | Text input for template name |
| DES-FD109 | Description textarea | Textarea for description |
| DES-FD110 | Color pickers for primary, accent, background, text colors | Color inputs with preview |
| DES-FD111 | Toggle switches for show_logo, show_qr, show_signature | Toggles work |
| DES-FD112 | Logo position dropdown (top-left, top-right, etc) | Select options |
| DES-FD113 | Currency symbol select (auto, $, €, £, ₹) | Select dropdown |
| DES-FD114 | Section list with reorder (up/down arrows) | Sections reorderable |
| DES-FD115 | Field visibility toggle per field (eye icon) | Toggle strikethrough |
| DES-FD116 | Field reorder within sections (up/down arrows) | Fields reorderable |
| DES-FD117 | Preview button in modal | Opens preview PDF |
| DES-FD118 | Cancel button closes modal without saving | No API call |
| DES-FD119 | Save/Create button submits form | API call made |
| DES-FD120 | Save without name | Validation error |
| DES-FD121 | Saving state shows spinner | Button disabled, spinner shown |
| DES-FD122 | Save success closes modal, refreshes list | Template added/updated |

## Batch Actions Page (`/payroll/batch-actions`)

### Page Tabs
| # | Test Case | Expected Result |
|---|---|---|
| BAT-FD123 | Three tabs: "Bulk Generate", "Email Queue", "Export" | Tab bar visible |
| BAT-FD124 | Default active tab is "Bulk Generate" | First tab highlighted |
| BAT-FD125 | Click tab switches content | Tab content changes |
| BAT-FD126 | Active tab has highlighted/selected style | Visual indicator on active tab |

### Bulk Generate Tab
| # | Test Case | Expected Result |
|---|---|---|
| BAT-FD127 | Month dropdown (1-12) | Select with 12 options |
| BAT-FD128 | Year input prefilled | Current year |
| BAT-FD129 | "Generate Payslips" button | Triggers bulk generation |
| BAT-FD130 | Loading state during generation | Spinner on button |
| BAT-FD131 | Success shows summary counts | Created X, Skipped Y, Errors Z |
| BAT-FD132 | Error state shows error banner | Red banner |
| BAT-FD133 | Results table after generation | Employee-wise status list |

### Email Queue Tab
| # | Test Case | Expected Result |
|---|---|---|
| BAT-FD134 | Queue table renders with all columns | Employee, Payslip, Status, Attempts, Error, Created, Actions |
| BAT-FD135 | Status filter dropdown (All/Pending/Sent/Failed/Cancelled) | Filter works |
| BAT-FD136 | Queue stats cards (Pending, Sent, Failed, Cancelled) | Stat cards with counts |
| BAT-FD137 | Pagination on queue list | Page controls |
| BAT-FD138 | Retry button on failed items | Button with FaRedo icon |
| BAT-FD139 | Cancel button on pending/failed items | Button with FaBan icon |
| BAT-FD140 | Click Retry resets to pending | Status changes |
| BAT-FD141 | Click Cancel changes to cancelled | Status changes |
| BAT-FD142 | Retry loading state (spinner) | Per-item loading |
| BAT-FD143 | Cancel loading state (spinner) | Per-item loading |
| BAT-FD144 | Empty queue state | "No email queue items" message |
| BAT-FD145 | Error on queue load | Error banner |
| BAT-FD146 | Queue auto-refreshes on tab switch | Reloads when tab activated |
| BAT-FD147 | Status badge colors (pending=blue, sent=green, failed=red, cancelled=gray) | Correct colors |

### Export Tab
| # | Test Case | Expected Result |
|---|---|---|
| BAT-FD148 | Export Payslips button | Downloads CSV |
| BAT-FD149 | Export Runs button | Downloads CSV |
| BAT-FD150 | Export Earnings button | Downloads CSV |
| BAT-FD151 | Export loading state | Button spinner |
| BAT-FD152 | Export error banner | Red error message |

## Navigation
| # | Test Case | Expected Result |
|---|---|---|
| NAV-FD153 | Payroll nav section visible in sidebar | "Payroll" label with FaMoneyBillWave |
| NAV-FD154 | "Runs" sub-nav item links to /payroll/runs | Navigates correctly |
| NAV-FD155 | "Payslip Designer" sub-nav item links to /payroll/payslip-designer | Navigates correctly |
| NAV-FD156 | "Batch Actions" sub-nav item links to /payroll/batch-actions | Navigates correctly |
| NAV-FD157 | Active sub-nav highlighted | Current page highlighted in sidebar |
| NAV-FD158 | Role gating: employee can't see payroll nav | Not visible for employee role |
| NAV-FD159 | Role gating: manager can see payroll nav | Visible for manager |

## Summary
- **Runs Page (Layout, Create, Actions, Expand, Filters, Pagination, Export)**: 83 tests (RUN-FD01 to RUN-FD83)
- **Payslip Designer (Rendering, Actions, Modal)**: 39 tests (DES-FD84 to DES-FD122)
- **Batch Actions (Tabs, Generate, Queue, Export)**: 30 tests (BAT-FD123 to BAT-FD152)
- **Navigation**: 7 tests (NAV-FD153 to NAV-FD159)
- **Total**: **159 test cases**
