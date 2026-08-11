# Frontend Dashboard - Test Cases (`/dashboard`)

| # | Test Case | Expected Result |
|---|---|---|
| DSH-001 | Page renders without errors | Console has no errors |
| DSH-002 | Loading skeleton shows on initial load | Skeleton/Spinner visible |
| DSH-003 | Stats Cards: Total Employees, Departments, Present Today, Pending Leaves | Cards load with numeric data |
| DSH-004 | Clicking stat card navigates to correct module | Navigation works |
| DSH-005 | Quick Actions section renders | Action buttons visible |
| DSH-006 | Click Quick Action -> navigates correctly | Each action navigates |
| DSH-007 | Clock In/Out widget (if enabled) | Clock in/out works |
| DSH-008 | Attendance Calendar widget renders | Calendar with dates |
| DSH-089 | Leave Balance widget renders | Leave balance shown |
| DSH-010 | Task Widget renders | Pending tasks shown |
| DSH-011 | Activity/Timeline Widget renders | Recent activity shown |
| DSH-012 | Draggable Widget - drag to reorder | Widget positions change |
| DSH-013 | Reset Layout button resets widget positions | Widgets return to default |
| DSH-014 | Refresh Data button reloads all data | All widgets refresh |
| DSH-015 | Widget Settings menu (width, height, chart type) | Settings dropdown opens and applies |
| DSH-016 | Widget Resize Handle - drag to resize | Widget width changes |
| DSH-017 | ChartToggle - switch between chart types (bar/line/pie) | Chart type changes |
| DSH-018 | AttendanceWidget - attendance summary | Summary loads with data |
| DSH-019 | PayrollWidget - payroll stats | Stats load |
| DSH-020 | LeaveWidget - leave summary | Summary loads |
| DSH-021 | DepartmentWidget - department distribution chart | Chart renders |
| DSH-022 | TeamWidget - team info | Team data loads |
| DSH-023 | RequestNotificationsWidget - pending requests | Notifications shown |
| DSH-024 | Retry button on widget error state | Widget reloads on click |
| DSH-025 | Dashboard loads within 3 seconds | Performance OK |
| DSH-026 | Admin sees admin dashboard variant | Different from employee |
| DSH-027 | Employee sees employee dashboard variant | Different from admin |
| DSH-028 | Manager sees manager dashboard variant | Different from admin/employee |
| DSH-029 | Dashboard responsive on mobile | Layout adapts |
| DSH-030 | Dark mode support (if implemented) | Colors adapt |
| DSH-031 | Error state when API fails | Error message with retry |
| DSH-032 | Empty state when no data | Empty states shown |
| DSH-033 | Widget custom title editing | Title updates (if allowed) |
| DSH-034 | Refresh interval / auto-refresh (if configured) | Data updates periodically |
| DSH-035 | Dashboard calendar shows current month | Correct month displayed |
| DSH-036 | Clock In/Out widget shows current status | Shows clocked in/out state |
| DSH-037 | Quick Actions: Clock In button works | Clock in API called |
| DSH-038 | Quick Actions: Apply Leave button | Navigates to /leaves |
| DSH-039 | Quick Actions: Add Employee button | Navigates to /employees |
| DSH-040 | Quick Actions: View Reports button | Navigates to /reports |
| DSH-041 | Widget drag state persists after refresh | Layout saved to localStorage/API |
| DSH-042 | Widget settings persist after page reload | Settings saved |
| DSH-043 | Chart toggle persists per widget | Chart type preference saved |
| DSH-044 | Widget error boundary catches errors | Widget shows error, others unaffected |
| DSH-045 | Dashboard header shows greeting | "Good morning/afternoon, Name" |
| DSH-046 | Role-based widgets hide for unauthorized roles | Only permitted widgets shown |
| DSH-047 | Recent activity shows last 5 actions | 5 activity items |
| DSH-048 | Activity widget auto-updates via socket | New activity appears |
| DSH-049 | All chart libraries load without errors | Charts render correctly |
| DSH-050 | Dashboard prints properly | Print layout OK |
| DSH-051 | Tab title updates to "Dashboard - HRMS" | Document title set |
| DSH-052 | Keyboard navigation works | Tab through widgets |
| DSH-053 | Widget removal (close button) | Widget hidden, can be re-added |
| DSH-054 | Add widget from available widgets list | Widget added to layout |
| DSH-055 | Full-screen mode for charts (if implemented) | Chart opens in full screen |

---

**Total: 55 test cases**
