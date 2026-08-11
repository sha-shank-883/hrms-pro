# Deep Mobile Payroll Test Cases — 100+ Tests

## Mobile Payroll Runs

### Payroll List Screen
| # | Test Case | Expected Result |
|---|---|---|
| MPR-D001 | PayrollRunsScreen renders with FlatList | Runs listed with pull-to-refresh |
| MPR-D002 | Run items show period, status badge, totals | Each item displays correctly |
| MPR-D003 | Status badge colors match (draft/finalized/paid/archived) | Color codes correct |
| MPR-D004 | Pull-to-refresh reloads runs | Refresh indicator shown |
| MPR-D005 | Empty state when no runs | "No payroll runs" message |
| MPR-D006 | Error state with retry button | Error message + retry |
| MPR-D007 | Loading skeleton on initial load | Skeleton placeholders |
| MPR-D008 | Pagination/infinite scroll (load more) | Scroll loads next page |
| MPR-D009 | FAB button "Create Run" visible | Floating action button renders |

### Create Run Modal
| # | Test Case | Expected Result |
|---|---|---|
| MPR-D010 | Tap FAB opens modal | Modal with form fields |
| MPR-D011 | Month picker (1-12) | Selectable list |
| MPR-D012 | Year input | Numeric input |
| MPR-D013 | Notes field | Text input |
| MPR-D014 | Cancel button closes modal | No API call |
| MPR-D015 | Create with valid data | Run created, modal closes |
| MPR-D016 | Create with empty month | Validation error |
| MPR-D017 | Create with empty year | Validation error |
| MPR-D018 | Creating state shows spinner | Button disabled |

### Run Detail Screen
| # | Test Case | Expected Result |
|---|---|---|
| MPR-D019 | Tap run item opens detail screen | Navigates to detail |
| MPR-D020 | Summary section renders (total, paid, pending) | Summary visible |
| MPR-D021 | Payslip list for this run | Employee payslips listed |
| MPR-D022 | Each payslip shows employee name, amounts | Correct data |
| MPR-D023 | Payment status indicator per payslip | Status badge |
| MPR-D024 | PDF download button per payslip | Downloads PDF |
| MPR-D025 | Action buttons for run (finalize/pay/archive) | Context-appropriate |
| MPR-D026 | Finalize button visible on draft | Only on draft |
| MPR-D027 | Pay button visible on finalized | Only on finalized |
| MPR-D028 | Archive button visible on final/paid | Appropriate visibility |
| MPR-D029 | Action loading state | Per-action loading |
| MPR-D030 | Success toast after action | Toast message |
| MPR-D031 | Error alert on failure | Alert dialog |

### Run Actions
| # | Test Case | Expected Result |
|---|---|---|
| MPR-D032 | Finalize draft run | Status updates |
| MPR-D033 | Pay finalized run | Status updates |
| MPR-D034 | Archive finalized run | Status updates |
| MPR-D035 | Delete draft run (if available) | Removed from list |
| MPR-D036 | Pay without finalizing first | Error message |

## Mobile Payslip Templates

### Templates List Screen
| # | Test Case | Expected Result |
|---|---|---|
| MPT-D037 | Templates listed with card layout | Template cards |
| MPT-D038 | Default template badge | "Default" indicator |
| MPT-D039 | Template name displayed | Name text |
| MPT-D040 | Number of sections shown | Fields count |
| MPT-D041 | Color swatches shown | Mini preview |
| MPT-D042 | Empty state | "No templates" message |
| MPT-D043 | Loading state | Skeleton |
| MPT-D044 | Error state | Error + retry |
| MPT-D045 | Create button (FAB or header) | Opens editor |

### Template Editor
| # | Test Case | Expected Result |
|---|---|---|
| MPT-D046 | Name input field | Editable |
| MPT-D047 | Description textarea | Editable |
| MPT-D048 | Color picker section | Interactive |
| MPT-D049 | Toggle switches (logo, QR, signature) | Toggles work |
| MPT-D050 | Section list with reorder | Reorderable |
| MPT-D051 | Field visibility per field | Toggle on/off |
| MPT-D052 | Preview button | Opens preview PDF |
| MPT-D053 | Cancel returns without saving | No changes |
| MPT-D054 | Save creates/updates template | API call made |
| MPT-D055 | Save without name | Validation error |
| MPT-D056 | Set as default option | Default toggled |

### Template Actions
| # | Test Case | Expected Result |
|---|---|---|
| MPT-D057 | Long-press template for actions | Context menu |
| MPT-D058 | Edit option opens editor | Modal/screen opens |
| MPT-D059 | Delete with confirmation | Template removed |
| MPT-D060 | Set default | Default changes |
| MPT-D061 | Preview generates PDF | PDF viewer opens |

## Mobile Email Queue

| # | Test Case | Expected Result |
|---|---|---|
| MEQ-D062 | Email queue list renders | Queue items listed |
| MEQ-D063 | Status filter tabs (Pending/Sent/Failed/Cancelled) | Filterable |
| MEQ-D064 | Each item shows employee, status, attempts | Fields visible |
| MEQ-D065 | Retry button on failed items | Re-queues |
| MEQ-D066 | Cancel button on pending items | Cancels |
| MEQ-D067 | Queue stats summary | Counts displayed |
| MEQ-D068 | Empty state | "No items" message |
| MEQ-D069 | Loading state | Skeleton |
| MEQ-D070 | Error state | Error + retry |
| MEQ-D071 | Pull-to-refresh | Reloads |
| MEQ-D072 | Action confirmation dialog | Confirm retry/cancel |

## Mobile Payslips

| # | Test Case | Expected Result |
|---|---|---|
| MPS-D073 | My Payslips list renders | Employee's payslips |
| MPS-D074 | Each payslip shows period, gross, net, status | Fields visible |
| MPS-D075 | Tap payslip opens detail modal | Full detail view |
| MPS-D076 | Detail shows earnings breakdown | Earnings list |
| MPS-D077 | Detail shows deductions breakdown | Deductions list |
| MPS-D078 | PDF download/view button | Opens PDF |
| MPS-D079 | Share payslip option | Share sheet opens |
| MPS-D080 | Verify payslip button | Verification result |
| MPS-D081 | Verified status indicator | Checkmark if verified |
| MPS-D082 | Empty state | "No payslips" message |
| MPS-D083 | Loading state | Skeleton |
| MPS-D084 | Pull-to-refresh | Reloads |
| MPS-D085 | Payslip period filter (month/year) | Filterable |
| MPS-D086 | PDF download with native viewer | File saved/downloaded |
| MPS-D087 | Email payslip option | Opens email composer |
| MPS-D088 | Offline: cached payslip list | Shows cached data |

## Mobile Payroll Navigation
| # | Test Case | Expected Result |
|---|---|---|
| MPN-D089 | Payroll screen accessible from navigation | Menu/item exists |
| MPN-D090 | Payroll tab/section visible per role | Admin/manager can see |
| MPN-D091 | Employee cannot access payroll | Access denied or hidden |
| MPN-D092 | Sub-navigation for Runs/Designer/Queue | Sub-tabs or sections |
| MPN-D093 | Active section highlighted | Visual indicator |

## Mobile Offline & Error States
| # | Test Case | Expected Result |
|---|---|---|
| MOF-D094 | No internet while loading runs | Offline message shown |
| MOF-D095 | No internet while creating run | Error message, queued for retry |
| MOF-D096 | API timeout on payroll load | Timeout error handled |
| MOF-D097 | Server 500 while generating | Graceful error |
| MOF-D098 | Token expired during payroll action | Redirect to login |
| MOF-D099 | Network restored after offline | Data refreshes |
| MOF-D100 | Slow network shows loading consistently | Loading persists until done |

## Mobile Security & Permissions
| # | Test Case | Expected Result |
|---|---|---|
| MSP-D101 | Employee tries to access payroll runs | AccessDeniedScreen or redirect |
| MSP-D102 | Manager can access runs but not settings | Proper gating |
| MSP-D103 | Employee accesses own payslips only | Own data only |
| MSP-D104 | Run actions require admin role | Non-admin cannot finalize/pay/archive |
| MSP-D105 | Template management requires admin | Non-admin cannot create/edit/delete |

## Mobile UX & Performance
| # | Test Case | Expected Result |
|---|---|---|
| MUX-D106 | Pull-to-refresh on all list screens | Universal |
| MUX-D107 | Back navigation from detail screen | Returns to list |
| MUX-D108 | Swipe to go back (iOS) | Gesture works |
| MUX-D109 | Keyboard dismiss on form tap outside | UX smooth |
| MUX-D110 | List renders smoothly (no jank) | 60fps scrolling |
| MUX-D111 | Large data sets (100+ runs) | Performance acceptable |
| MUX-D112 | Dark mode support for all screens | Colors adapt |
| MUX-D113 | RTL layout support (if applicable) | Mirrored correctly |
| MUX-D114 | Screen reader accessibility (labels) | All elements labeled |
| MUX-D115 | PDF viewer loads within 3 seconds | Acceptable load time |

## Summary
- **Mobile Payroll Runs**: 36 tests (MPR-D001 to MPR-D036)
- **Mobile Payslip Templates**: 25 tests (MPT-D037 to MPT-D061)
- **Mobile Email Queue**: 11 tests (MEQ-D062 to MEQ-D072)
- **Mobile Payslips**: 16 tests (MPS-D073 to MPS-D088)
- **Mobile Navigation**: 5 tests (MPN-D089 to MPN-D093)
- **Mobile Offline/Error**: 7 tests (MOF-D094 to MOF-D100)
- **Mobile Security**: 5 tests (MSP-D101 to MSP-D105)
- **Mobile UX/Performance**: 10 tests (MUX-D106 to MUX-D115)
- **Total**: **115 test cases**
