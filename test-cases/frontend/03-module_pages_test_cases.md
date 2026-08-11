# Frontend Module Pages - Test Cases

## Employees Page (`/employees`)
| # | Test Case | Expected Result |
|---|---|---|
| EMP-F01 | Employee table renders with all columns | Columns: Name, Email, Department, Status, Actions |
| EMP-F02 | Add Employee button opens modal | Create form visible |
| EMP-F03 | Create employee with all fields | Employee created |
| EMP-F04 | Edit employee via row action | Edit pre-filled form opens |
| EMP-F05 | Delete employee with confirmation | Employee deleted/archived |
| EMP-F06 | Search/filter employees | Results filtered |
| EMP-F07 | Pagination with page numbers | Navigate between pages |
| EMP-F08 | Export employees to CSV/Excel | File downloads |
| EMP-F09 | Click employee row -> detail page | Navigates to /employees/:id |
| EMP-F10 | Profile photo upload in modal | Photo uploads |
| EMP-F11 | Biometric Device ID field in form | Field present |
| EMP-F12 | Employment Type filter | Filtered by type |
| EMP-F13 | Status filter (active/inactive) | Filtered by status |
| EMP-F14 | Clear filters button | All filters reset |
| EMP-F15 | View Profile button (eye icon) | Navigates to detail |

## Departments Page (`/departments`)
| # | Test Case | Expected Result |
|---|---|---|
| DEP-F16 | Department list renders as cards/table | Visible |
| DEP-F17 | Add department modal | Department created |
| DEP-F18 | Edit department | Department updated |
| DEP-F19 | Delete with confirmation | Department deleted |
| DEP-F20 | Department budget/manager fields | Extra fields present |
| DEP-F21 | Department detail drill-down | Shows employees in dept |
| DEP-F22 | Search/filter departments | Filtered |

## Attendance Page (`/attendance`)
| # | Test Case | Expected Result |
|---|---|---|
| ATT-F23 | Attendance table renders | Records visible |
| ATT-F24 | Clock In button | Clock in recorded |
| ATT-F25 | Clock Out button (when clocked in) | Clock out recorded |
| ATT-F26 | Manual attendance entry (admin) | Record created |
| ATT-F27 | Edit attendance record | Updated |
| ATT-F28 | Delete attendance record | Deleted |
| ATT-F29 | Regularization request modal | Request submitted |
| ATT-F30 | Approve/reject regularization | Status updated |
| ATT-F31 | Shifts tab | Shift management visible |
| ATT-F32 | Date range filter | Filtered |
| ATT-F33 | Statistics cards (Total, Present, Late, Absent) | Cards load |
| ATT-F34 | Employee filter dropdown | Filtered by employee |
| ATT-F35 | Apply/Reset filter buttons | Filters work |

## Leaves Page (`/leaves`)
| # | Test Case | Expected Result |
|---|---|---|
| LEV-F36 | Leave table renders | Records visible |
| LEV-F37 | Apply Leave modal | Leave request created |
| LEV-F38 | Leave balance display | Balance shown |
| LEV-F39 | Approve/reject leave | Status updated |
| LEV-F40 | Comp-Off request modal | Comp-off created |
| LEV-F41 | Leave type filter | Filtered |
| LEV-F42 | Date range filter | Filtered |
| LEV-F43 | Leave statistics/charts | Stats visible |
| LEV-F44 | Policies tab with balances | Leave policies render |
| LEV-F45 | Holidays tab with Opt-In | Opt-in works |
| LEV-F46 | Comp-Offs tab | Requests listed |
| LEV-F47 | Statistics cards (Pending, Approved, Rejected) | Cards load |
| LEV-F48 | Clear filters button | Filters reset |

## Tasks Page (`/tasks`)
| # | Test Case | Expected Result |
|---|---|---|
| TSK-F49 | Task board/list renders | Tasks visible |
| TSK-F50 | Create task with assignee/due date | Task created |
| TSK-F51 | Edit task | Task updated |
| TSK-F52 | Delete task | Task deleted |
| TSK-F53 | Change task status | Status updated |
| TSK-F54 | Task assignment to employees | Assignee linked |
| TSK-F55 | Task priority/sort | Sorting works |

---

**Total: 55 test cases**
