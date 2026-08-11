# Payroll V2 — Frontend Admin Pages

## Payroll Runs (`/payroll/runs`)
| # | Test Case | Expected Result |
|---|---|---|
| RUN-F01 | Page renders with payroll runs list | Runs table visible |
| RUN-F02 | Create new run modal opens | Modal with month/year fields shown |
| RUN-F03 | Create run with valid data | Run created, listed in table |
| RUN-F04 | Create run without month/year | Validation error shown |
| RUN-F05 | Create run duplicate period | Error message shown, not created |
| RUN-F06 | Finalize draft run | Status changes to finalized |
| RUN-F07 | Finalize already finalized run | Error message shown |
| RUN-F08 | Pay finalized run | Status changes to paid |
| RUN-F09 | Pay draft run directly | Error: must finalize first |
| RUN-F10 | Archive paid/finalized run | Status changes to archived |
| RUN-F11 | Archive draft run directly | Error: cannot archive draft |
| RUN-F12 | Delete draft run | Run removed from list |
| RUN-F13 | Delete finalized/paid run | Error shown, not deleted |
| RUN-F14 | Expand run row to see payslips | Payslip list shown in expanded row |
| RUN-F15 | Download payslip PDF from expanded row | PDF downloaded/opened |
| RUN-F16 | Filter runs by status | Table filtered by status |
| RUN-F17 | Filter runs by year | Table filtered by year |
| RUN-F18 | Clear filters | All runs shown again |
| RUN-F19 | Export runs as CSV | CSV file download initiated |
| RUN-F20 | Pagination across runs | Page buttons work |
| RUN-F21 | Empty state when no runs | "No payroll runs found" message |
| RUN-F22 | Status badge colors (draft/finalized/paid/archived) | Correct colors per status |
| RUN-F23 | Action buttons hidden for archived runs | No finalize/pay/delete buttons |
| RUN-F24 | Action loading state during API call | Spinner shown during action |
| RUN-F25 | Error message on failed API call | Red error banner displayed |
| RUN-F26 | Success message on successful action | Green success banner displayed |
| RUN-F27 | Sub-navigation highlights "Runs" when active | "Runs" link highlighted in sidebar |

## Payslip Designer (`/payroll/payslip-designer`)
| # | Test Case | Expected Result |
|---|---|---|
| DES-F28 | Page renders with templates list | Template cards visible |
| DES-F29 | Create new template opens editor modal | Modal with name + layout config shown |
| DES-F30 | Create template with name only | Template created and listed |
| DES-F31 | Create template without name | Validation error shown |
| DES-F32 | Edit existing template | Modal pre-filled with template data |
| DES-F33 | Update template name | Name updated on save |
| DES-F34 | Set template as default | Template shows "Default" badge |
| DES-F35 | Change default to another template | Old default loses badge, new gains it |
| DES-F36 | Delete template with confirmation | Template removed after confirm |
| DES-F37 | Cancel delete template | Template remains listed |
| DES-F38 | Toggle field visibility (eye icon) | Field toggles strikethrough/bold |
| DES-F39 | Reorder fields with up/down arrows | Field position changes |
| DES-F40 | Section visual grouping (Details/Earnings/Deductions/Summary) | Sections color-coded correctly |
| DES-F41 | Empty state when no templates | "No payslip templates" message shown |
| DES-F42 | Error message on failed save | Error banner displayed |
| DES-F43 | Default template has highlighted border | Border/ring in primary color |
| DES-F44 | Hidden fields count displayed in section header | "(N) hidden" shown |
| DES-F45 | Close editor modal without saving | Modal closes, no changes applied |

## Batch Actions (`/payroll/batch`)
| # | Test Case | Expected Result |
|---|---|---|
| BAT-F46 | Bulk Generate tab renders | Month/year form visible |
| BAT-F47 | Generate payslips for valid month/year | Generation runs, summary shown |
| BAT-F48 | Generate without month/year | Error shown |
| BAT-F49 | Bulk generation summary stats (total/generated/skipped/errors) | 4 stat cards shown |
| BAT-F50 | Email Queue tab renders | Queue stats and table visible |
| BAT-F51 | Queue stats cards (total/pending/sent/failed/cancelled) | 5 stat cards with counts |
| BAT-F52 | Filter queue by status buttons | Table filtered by selected status |
| BAT-F53 | Retry failed email item | Item status reset to pending |
| BAT-F54 | Cancel pending/failed email item | Item status changed to cancelled |
| BAT-F55 | Refresh queue button | Queue data reloaded |
| BAT-F56 | Export tab renders | 3 export option cards visible |
| BAT-F57 | Export payslips CSV download | CSV file downloaded |
| BAT-F58 | Export runs CSV download | CSV file downloaded |
| BAT-F59 | Pagination in email queue | Queue page buttons work |
| BAT-F60 | Tab switching preserves state | Active tab highlighted correctly |
| BAT-F61 | Error banner on failed export | Error message displayed |
| BAT-F62 | Empty queue state | "No email queue items" message |
| BAT-F63 | Action loading spinner during retry/cancel | Spinner shown on action button |

## Navigation & Routing
| # | Test Case | Expected Result |
|---|---|---|
| NAV-F64 | Sidebar Payroll expands on /payroll/runs | Sub-nav items visible |
| NAV-F65 | Sidebar Payroll expands on /payroll/payslip-designer | Sub-nav items visible |
| NAV-F66 | Sidebar Payroll expands on /payroll/batch | Sub-nav items visible |
| NAV-F67 | Direct URL navigation to /payroll/runs | Page loads correctly |
| NAV-F68 | Direct URL navigation to /payroll/payslip-designer | Page loads correctly |
| NAV-F69 | Direct URL navigation to /payroll/batch | Page loads correctly |
| NAV-F70 | Employee cannot access /payroll/runs | Access denied shown |
| NAV-F71 | Employee cannot access /payroll/payslip-designer | Access denied shown |
| NAV-F72 | Employee cannot access /payroll/batch | Access denied shown |
| NAV-F73 | 404 for unknown /payroll/* route | 404 page shown |

## Security & Compliance
| # | Test Case | Expected Result |
|---|---|---|
| SEC-F74 | Admin can access all new pages | Pages load successfully |
| SEC-F75 | Manager can access runs + batch (not designer) | Runs/Batch load, Designer shows access denied |
| SEC-F76 | No auth: redirect to /login | Redirected |
| SEC-F77 | API error handled gracefully | Error state shown, not crash |

---

## My Payslips — Employee Upgrades (`/my-payslips`)

| # | Test Case | Expected Result |
|---|---|---|
| PAY-F78 | Page loads with payslip cards | Cards rendered in grid |
| PAY-F79 | Statistics cards (total/paid/pending/archived/total net) | 5 stat cards with correct counts |
| PAY-F80 | Current tab shows non-archived payslips | All current payslips displayed |
| PAY-F81 | Archived tab shows archived payslips | Archived payslips displayed with count |
| PAY-F82 | Filter by month dropdown | List filtered by selected month |
| PAY-F83 | Filter by year input | List filtered by year |
| PAY-F84 | Clear filters button | All payslips shown again |
| PAY-F85 | Download All button downloads all visible | Multiple PDF downloads triggered |
| PAY-F86 | Download All empty state (button disabled) | Button disabled when no payslips |
| PAY-F87 | View payslip opens PayslipDetailModal | Modal renders with full detail |
| PAY-F88 | Archive payslip from dropdown menu | Payslip moved to archived tab |
| PAY-F89 | Unarchive payslip from dropdown menu | Payslip moved to current tab |
| PAY-F90 | Request Reissue for archived payslip | Email queued, success message shown |
| PAY-F91 | Archive badge visible on archived cards | "Archived" badge in corner |
| PAY-F92 | Loading spinner on initial load | Spinner displayed during fetch |
| PAY-F93 | Error state on API failure | Red error banner shown |
| PAY-F94 | Success message on archive/unarchive/reissue | Green success banner shown |
| PAY-F95 | Tab count badges update correctly | Current/Archived counts match lists |

## PayslipDetailModal (`/my-payslips` — modal component)

| # | Test Case | Expected Result |
|---|---|---|
| MOD-F96 | Modal opens with employee info section | Employee name, dept, period, status shown |
| MOD-F97 | Earnings section with component breakdown | Earnings listed with amounts |
| MOD-F98 | Deductions section with component breakdown | Deductions listed with amounts |
| MOD-F99 | Net pay section with large amount display | Net pay highlighted in indigo |
| MOD-F100 | Verification section renders | Verify button and QR placeholder visible |
| MOD-F101 | Click Verify button | Payslip verified, green checkmark + hash shown |
| MOD-F102 | Download PDF button | PDF blob downloaded and opened |
| MOD-F103 | Email button queues email | Success message "queued for email delivery" |
| MOD-F104 | Print button opens print window | Print dialog opens with formatted payslip |
| MOD-F105 | Close button via X | Modal dismissed |
| MOD-F106 | Click outside modal closes | Modal dismissed |
| MOD-F107 | Error state for failed verification | Error banner shown |
| MOD-F108 | Error state for failed PDF download | Error banner shown |
| MOD-F109 | Modal scrolls when content overflows | Scrollbar appears, content reachable |
| MOD-F110 | Earnings/deductions from V2 API (component_name + amount) | Component-level breakdown displayed |
| MOD-F111 | Fallback to V1 payslip fields when V2 unavailable | Basic/Allowances/Bonus shown |

---

**Total: 111 test cases**
