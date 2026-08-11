# Payroll V2 Mobile — Test Cases

## Overview
Mobile test cases for Payslip V2 features: listing payslips with status tabs, viewing detailed payslips, PDF download and sharing, payslip archive, batch download all.

**Total Cases: 34**

---

### Navigation & Screen Load
| # | Test Case | Expected Result |
|---|---|---|
| 1 | Open Payroll tab from bottom navigation | PayrollScreen loads with payslip list |
| 2 | Pull-to-refresh on payslip list | List refreshes with latest data |
| 3 | Tab bar shows active filter | Correct tab highlighted |
| 4 | Switching tabs resets pagination offset | New tab loads page 1 of its status |

### Payslip List (FlatList)
| # | Test Case | Expected Result |
|---|---|---|
| 5 | List renders all payslips received from API | FlatList scrolls through all items |
| 6 | Each item shows period, net pay, status badge | Correct data displayed |
| 7 | Empty state shows appropriate message | "No payslips found" placeholder shown |
| 8 | Pagination loads more items on scroll | `loadMore` triggers API call |
| 9 | Loading spinner shown during fetch | ActivityIndicator visible |
| 10 | Error state shows retry option | "Retry" button appears on fetch failure |

### Status Tabs
| # | Test Case | Expected Result |
|---|---|---|
| 11 | "All" tab shows all payslips | No status filter applied |
| 12 | "Pending" tab shows only pending payslips | Filter by `payment_status = 'pending'` |
| 13 | "Paid" tab shows only paid payslips | Filter by `payment_status = 'paid'` |
| 14 | "Archived" tab shows only archived payslips | Filter by `is_archived = true` |
| 15 | Tab badge counts match API totals | Badge numbers accurate |

### Payslip Detail Modal
| # | Test Case | Expected Result |
|---|---|---|
| 16 | Tap payslip item opens modal | Detail modal slides up |
| 17 | Modal header shows period and status | Period text and StatusBadge visible |
| 18 | Earnings section lists all components | Component names and amounts correct |
| 19 | Deductions section lists all deductions | Deduction names and amounts correct |
| 20 | Net pay total matches sum of earnings minus deductions | Math is correct |
| 21 | Close modal with "X" button | Modal dismisses |
| 22 | Close modal by pressing outside | Modal dismisses |

### PDF Download & Share
| # | Test Case | Expected Result |
|---|---|---|
| 23 | "Download PDF" button downloads file | PDF saved to device cache |
| 24 | Download shows progress indicator | Loading spinner during download |
| 25 | Successful download triggers share sheet | Share dialog opens with PDF |
| 26 | Download failure shows error toast | "Download failed" message |
| 27 | Share button on a single payslip | Shares that specific payslip PDF |

### Batch Download All
| # | Test Case | Expected Result |
|---|---|---|
| 28 | "Download All" button visible | Appears in header or tab bar |
| 29 | Batch download processes queue | Downloads multiple PDFs sequentially |
| 30 | Batch progress indicator shows count | "Downloading 3/5" visible |
| 31 | All downloaded files shared as batch | Multiple files shared or zipped |

### Archive / Unarchive
| # | Test Case | Expected Result |
|---|---|---|
| 32 | "Archive" action on a payslip | Payslip archived, moved to Archived tab |
| 33 | Archived payslip shows archive icon | Visual indicator for archived items |
| 34 | Unarchive restores to main list | Status updated, visible in All tab |
