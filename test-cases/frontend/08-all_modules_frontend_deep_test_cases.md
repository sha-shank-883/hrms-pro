# All Modules — Frontend Deep Test Cases (250 tests)

## 1.1 Auth Pages (Login, Register, Forgot/Reset, 2FA) — 30 tests

| # | Scenario | Page | Action | Expected |
|---|---|---|---|---|
| F1 | Login page renders | Login | Load page | Email + password fields, submit button, register link |
| F2 | Login with valid credentials | Login | Fill + submit | Redirect to dashboard |
| F3 | Login with wrong password | Login | Fill wrong | Error message "Invalid credentials" |
| F4 | Login with empty fields | Login | Click submit without input | Validation errors on fields |
| F5 | Login with invalid email format | Login | Type "notanemail" | Inline validation error |
| F6 | Login toggle password visibility | Login | Click eye icon | Password text visible |
| F7 | Register page renders | Register | Load page | Name, email, password, company fields |
| F8 | Register with valid data | Register | Fill + submit | Success message, redirect to login |
| F9 | Register with duplicate email | Register | Existing email | Error message "Email already registered" |
| F10 | Register with weak password | Register | Password "123" | Password strength indicator shows weak |
| F11 | Register password mismatch confirm | Register | Different passwords | Validation error |
| F12 | Forgot password page | Forgot | Load page | Email field, submit button, back to login |
| F13 | Forgot password valid email | Forgot | Submit | Success toast "Check your email" |
| F14 | Forgot password non-existent email | Forgot | Submit random | Same success message (no info leak) |
| F15 | Reset password page | Reset | Load with valid token | New password + confirm fields |
| F16 | Reset with expired/invalid token | Reset | Invalid token | Error "Link expired" |
| F17 | Reset password weak | Reset | Weak password | Validation error |
| F18 | 2FA setup page | Profile/Security | Enable 2FA | QR code displayed |
| F19 | 2FA verify with valid code | Login | Enter valid 6-digit | Logged in |
| F20 | 2FA verify with invalid code | Login | Wrong 6-digit | Error "Invalid code" |
| F21 | 2FA resend code | Login | Click resend | Timer resets |
| F22 | Login page responsive | Login | Resize to mobile | Stacked layout, hamburger if nav |
| F23 | Login page accessibility | Login | Tab through | All fields focusable, labels present |
| F24 | Register terms checkbox | Register | Must check terms | Submit disabled until checked |
| F25 | Social login buttons (if any) | Login | Click Google/LinkedIn | Redirect to OAuth |
| F26 | Session expired modal | Any | API returns 401 | Redirect to login with message |
| F27 | Logout | Dashboard | Click logout | Redirect to login, clear storage |
| F28 | Remember me checkbox | Login | Check + login | Token persists after browser close |
| F29 | Login loading state | Login | Submit | Button shows spinner, fields disabled |
| F30 | Login rate limit message | Login | 5 failed attempts | "Too many attempts. Try later." |

## 1.2 Dashboard — 15 tests

| # | Scenario | Page | Action | Expected |
|---|---|---|---|---|
| F31 | Dashboard loads widgets | Dashboard | Load | ClockIn, Attendance, Leave, Task, Payroll widgets |
| F32 | Dashboard widget data | Dashboard | Load | Shows real counts from API |
| F33 | Employee count widget | Dashboard | Hover/click | Shows department breakdown |
| F34 | Attendance today widget | Dashboard | View | Shows clock-in status, hours |
| F35 | Leave pending widget | Dashboard | Click pending | Navigate to leaves page with filter |
| F36 | Quick action buttons | Dashboard | Click button | Navigates to correct page |
| F37 | Task widget shows assigned tasks | Dashboard | Load | Tasks assigned to current user |
| F38 | Dashboard loading skeleton | Dashboard | Load | Skeleton while fetching |
| F39 | Dashboard error state | Dashboard | Network error | Error banner "Failed to load" |
| F40 | Dashboard empty state | Dashboard | No data | "No data available" messages |
| F41 | Org chart access from dashboard | Dashboard | Click org chart | Navigates to org chart page |
| F42 | Recent activity timeline | Dashboard | Scroll | Shows recent actions |
| F43 | Dashboard role-based (Admin vs Employee) | Dashboard | Login as employee | Different widgets |
| F44 | Dashboard responsive layout | Dashboard | Resize | Widgets rearrange |
| F45 | Dashboard refresh button | Dashboard | Click refresh | Data reloads |

## 1.3 Employees Page — 15 tests

| # | Scenario | Page | Action | Expected |
|---|---|---|---|---|
| F46 | Employees list loads | Employees | Load | Table with employee data |
| F47 | Search employees | Employees | Type name | Table filters in real-time |
| F48 | Department filter | Employees | Select department | Only that dept shown |
| F49 | Status filter | Employees | Active/Inactive | Filtered results |
| F50 | Pagination | Employees | Click page 2 | Next page loaded |
| F51 | Add employee modal | Employees | Click + button | Modal opens with form fields |
| F52 | Add employee valid | Employees | Fill + save | New employee appears in table |
| F53 | Add employee validation | Employees | Submit empty | Red borders on required fields |
| F54 | Edit employee | Employees | Click edit on row | Modal pre-filled |
| F55 | Delete employee | Employees | Click delete | Confirm dialog, then removed |
| F56 | Export employees | Employees | Click export | CSV/Excel downloaded |
| F57 | Column sorting | Employees | Click column header | Table sorted |
| F58 | View employee profile | Employees | Click name | Profile page loads |
| F59 | Employees loading state | Employees | Load | Skeleton/spinner shown |
| F60 | Employees empty state | Employees | No employees | "No employees found" message |

## 1.4 Profile Page — 8 tests

| # | Scenario | Page | Action | Expected |
|---|---|---|---|---|
| F61 | Profile loads own data | Profile | Load | Name, email, department, photo |
| F62 | Edit profile fields | Profile | Click edit | Fields become editable |
| F63 | Upload profile photo | Profile | Choose file | Photo uploads and displays |
| F64 | Change password tab | Profile | Click security tab | Change password form |
| F65 | 2FA toggle in profile | Profile | Click enable 2FA | Setup flow |
| F66 | Profile tabs (About, Documents, etc.) | Profile | Click tab | Content switches |
| F67 | Profile not found | Profile | Invalid ID | "Employee not found" |
| F68 | Profile loading | Profile | Load | Skeleton |

## 1.5 Attendance Page — 12 tests

| # | Scenario | Page | Action | Expected |
|---|---|---|---|---|
| F69 | Clock in button | Attendance | Click clock in | Success toast, button changes to clock out |
| F70 | Clock out button | Attendance | Click clock out | Toast, button changes |
| F71 | Today's status card | Attendance | Load | Shows clock-in time, duration |
| F72 | Attendance history table | Attendance | Load | List of daily records |
| F73 | Date range filter | Attendance | Select dates | Filtered records |
| F74 | Monthly calendar view | Attendance | Switch to calendar | Calendar with attendance markers |
| F75 | Regularization request | Attendance | Click regularize | Modal with date, reason |
| F76 | Approve regularization (manager) | Attendance | Click approve | Status changes to approved |
| F77 | Manual entry (admin) | Attendance | Click add manual | Form: employee, date, time |
| F78 | Attendance stats | Attendance | Load | Pie/bar chart with stats |
| F79 | Biometric device status | Attendance | Load | Device connection status |
| F80 | Attendance export | Attendance | Click export | CSV downloaded |

## 1.6 Leaves Page — 12 tests

| # | Scenario | Page | Action | Expected |
|---|---|---|---|---|
| F81 | Apply leave button | Leaves | Click apply | Modal with leave type, dates, reason |
| F82 | Apply leave valid | Leaves | Fill + submit | Leave created, balance updated |
| F83 | Apply leave validation | Leaves | Empty submission | Errors on required fields |
| F84 | Leave balance display | Leaves | Load | Cards showing each type + remaining |
| F85 | Leave history table | Leaves | Load | List with status badges |
| F86 | Approve leave (manager) | Leaves | Click approve | Status changes to approved |
| F87 | Reject leave with reason | Leaves | Click reject | Modal for reason, then rejected |
| F88 | Leave calendar | Leaves | Toggle calendar | Month view with approved leaves |
| F89 | Leave type management (admin) | Leaves | Settings | Create/edit leave types |
| F90 | Filter leaves by status | Leaves | Select status | Filtered list |
| F91 | Comp-off balance | Leaves | Load | Comp-off balance shown |
| F92 | Leave statistics | Leaves | Load | Charts showing leave trends |

## 1.7 Tasks Page — 8 tests

| # | Scenario | Page | Action | Expected |
|---|---|---|---|---|
| F93 | Create task | Tasks | Click add | Modal, fill, submit → task appears |
| F94 | Update task status | Tasks | Click checkbox | Status changes |
| F95 | Task filters | Tasks | Status/priority | Filtered list |
| F96 | Task detail view | Tasks | Click task | Expanded view with comments |
| F97 | Add comment to task | Tasks | Type + submit | Comment appears |
| F98 | Task drag-and-drop | Tasks | Drag to different column | Status updated |
| F99 | Task statistics | Tasks | Load stats | Charts showing task distribution |
| F100 | Assign task to user | Tasks | Change assignee | Task reassigned |

## 1.8 Recruitment Page — 10 tests

| # | Scenario | Page | Action | Expected |
|---|---|---|---|---|
| F101 | Jobs list | Recruitment | Load tab | Job postings table |
| F102 | Create job | Recruitment | Click add job | Form, submit → job created |
| F103 | Applications list | Recruitment | Applications tab | Applications table |
| F104 | Update application status | Recruitment | Change status dropdown | Status badge updates |
| F105 | View application detail | Recruitment | Click applicant | Full details, resume |
| F106 | Schedule interview | Recruitment | Click schedule | Form with interviewer, date, time |
| F107 | Job public page | Careers (public) | Load | Active jobs listed |
| F108 | Apply to job (public) | Job detail | Fill + submit | Application submitted |
| F109 | Resume upload | Application form | Upload file | File accepted, parsed |
| F110 | Recruitment analytics | Recruitment | Stats tab | Charts with hiring metrics |

## 1.9 Chat Page — 10 tests

| # | Scenario | Page | Action | Expected |
|---|---|---|---|---|
| F111 | Conversations list | Chat | Load | List of conversations |
| F112 | Open conversation | Chat | Click user | Messages load |
| F113 | Send message | Chat | Type + enter | Message appears |
| F114 | Emoji picker | Chat | Click emoji icon | Emoji selector opens |
| F115 | File attachment | Chat | Click attach | File picker, uploads |
| F116 | Search messages | Chat | Type in search | Filtered messages |
| F117 | Channel list | Chat | Channels tab | Channel list |
| F118 | Create channel | Chat | Click + channel | Modal, create → appears |
| F119 | Reactions | Chat | Click react on message | Emoji selector, reaction added |
| F120 | Unread badge | Chat | Have unread | Badge count on conversation |

## 1.10 Payroll Pages — 20 tests

| # | Scenario | Page | Action | Expected |
|---|---|---|---|---|
| F121 | Payroll runs list | PayrollRuns | Load | Table of runs |
| F122 | Create payroll run | PayrollRuns | Click create | Form: month, year, notes → submit |
| F123 | Finalize run | PayrollRuns | Click finalize | Status → finalized, totals shown |
| F124 | Pay run | PayrollRuns | Click pay | Status → paid |
| F125 | Archive run | PayrollRuns | Click archive | Status → archived |
| F126 | Expand run details | PayrollRuns | Click expand | Employee-level payslips shown |
| F127 | Export run | PayrollRuns | Click export | CSV downloaded |
| F128 | Payslip designer | PayslipDesigner | Load | Template list with preview |
| F129 | Create template | PayslipDesigner | Click new | Editor modal |
| F130 | Preview template | PayslipDesigner | Click preview | PDF preview generated |
| F131 | Set default template | PayslipDesigner | Click set default | Badge shows "Default" |
| F132 | Batch actions tab | BatchActions | Load | Generate/Email/Export tabs |
| F133 | Bulk generate payslips | BatchActions | Select + generate | Success toast |
| F134 | Email queue tab | BatchActions | Email queue tab | Queue list |
| F135 | Retry email | BatchActions | Click retry | Status → pending |
| F136 | Cancel email | BatchActions | Click cancel | Status → cancelled |
| F137 | Export payslips | BatchActions | Export tab | Download format options |
| F138 | My payslips (employee) | MyPayslips | Load | List of own payslips |
| F139 | View payslip PDF | MyPayslips | Click view | PDF in new tab |
| F140 | Verify payslip | MyPayslips | Click verify | Verification status shown |

## 1.11 Performance Page — 8 tests

| # | Scenario | Page | Action | Expected |
|---|---|---|---|---|
| F141 | Goals list | Performance | Goals tab | Goal cards with progress |
| F142 | Create goal | Performance | Click add | Form → goal created |
| F143 | Update goal progress | Performance | Drag slider | Progress updated |
| F144 | Key results | Performance | Click goal | Expand KR list |
| F145 | Reviews list | Performance | Reviews tab | Review list |
| F146 | Submit review | Performance | Click review | Rating + comments form |
| F147 | Cycles management | Performance | Cycles tab | Cycle list (admin) |
| F148 | Performance charts | Performance | Analytics tab | Charts with metrics |

## 1.12 Assets Page — 6 tests

| # | Scenario | Page | Action | Expected |
|---|---|---|---|---|
| F149 | Assets list | Assets | Load | Table with assets |
| F150 | Add asset | Assets | Click add | Form → asset created |
| F151 | Assign asset | Assets | Click assign | Employee selector → assigned |
| F152 | Unassign asset | Assets | Click unassign | Asset freed |
| F153 | Asset filters | Assets | Type/status | Filtered list |
| F154 | Asset detail view | Assets | Click asset | Full details, history |

## 1.13 Documents Page — 6 tests

| # | Scenario | Page | Action | Expected |
|---|---|---|---|---|
| F155 | Documents list | Documents | Load | Files list |
| F156 | Upload document | Documents | Click upload | File picker → uploaded |
| F157 | Download document | Documents | Click download | File downloaded |
| F158 | Delete document | Documents | Click delete | Confirm → removed |
| F159 | Filter documents | Documents | Type/category | Filtered |
| F160 | Share document | Documents | Click share | User selector → shared |

## 1.14 Settings Page — 8 tests

| # | Scenario | Page | Action | Expected |
|---|---|---|---|---|
| F161 | Settings categories | Settings | Load | Tab list (General, Email, etc.) |
| F162 | Update general setting | Settings | Change value + save | Toast "Saved" |
| F163 | Email templates | Settings | Email tab | Template list |
| F164 | Edit email template | Settings | Click edit | Editor with subject/body |
| F165 | Test send email | Settings | Click send test | Toast "Email sent" |
| F166 | Website settings | Settings | Branding tab | Color picker, logo upload |
| F167 | Mobile config | Settings (super) | Mobile tab | Config fields |
| F168 | Audit log viewer | Settings | Audit tab | Log table with filters |

## 1.15 Reports Page — 8 tests

| # | Scenario | Page | Action | Expected |
|---|---|---|---|---|
| F169 | Report selection | Reports | Load | Report type cards |
| F170 | Attendance report | Reports | Click attendance | Chart + table |
| F171 | Leave report | Reports | Click leave | Chart + breakdown |
| F172 | Payroll report | Reports | Click payroll | Salary totals chart |
| F173 | Export report | Reports | Click export | CSV/PDF download |
| F174 | Date range selector | Reports | Pick dates | Data refreshes |
| F175 | Churn risk report | Reports | Click churn | Risk list with scores |
| F176 | Performance analytics | Reports | Click performance | Analytics dashboard |

## 1.16 Support Pages — 8 tests

| # | Scenario | Page | Action | Expected |
|---|---|---|---|---|
| F177 | Support chat widget | Any page | Click chat icon | Chat opens |
| F178 | Send support message | Chat widget | Type + send | Message sent |
| F179 | FAQ page | Support | FAQ tab | Searchable FAQ list |
| F180 | Create ticket | Support | Tickets tab → create | Form → ticket created |
| F181 | Ticket detail | Support | Click ticket | Comments, status |
| F182 | Add comment to ticket | Support | Type + submit | Comment added |
| F183 | Ticket filters | Support | Status/priority | Filtered |
| F184 | AI support ask | Support | Type question | AI response |

## 1.17 CMS / Blog / Marketing Pages — 10 tests

| # | Scenario | Page | Action | Expected |
|---|---|---|---|---|
| F185 | Home page (marketing) | / | Load | Hero, features, CTA |
| F186 | Pricing page | /pricing | Load | Pricing cards |
| F187 | Blog list | /blog | Load | Post cards |
| F188 | Blog post | /blog/:id | Load | Full article |
| F189 | Dynamic CMS page | /:slug | Load | Rendered from CMS |
| F190 | Contact form | /contact | Fill + submit | Submitted |
| F191 | Demo request | /demo | Fill + submit | Submitted |
| F192 | Blog admin (super) | Super-admin/blog | Create/edit posts | CRUD works |
| F193 | CMS admin (super) | Super-admin/cms | Create/edit pages | CRUD works |
| F194 | Website builder | Super-admin/website | Drag sections | Page updated |

## 1.18 Super Admin Pages — 8 tests

| # | Scenario | Page | Action | Expected |
|---|---|---|---|---|
| F195 | Tenant list | Super-admin | Load | Tenant table |
| F196 | Create tenant | Super-admin | Click add | Form → tenant created |
| F197 | Manage tenant | Super-admin | Click manage | Tenant detail, actions |
| F198 | Demo requests | Super-admin | Demo tab | Lead/demo list |
| F199 | Provision tenant | Super-admin | Click provision | Tenant provisioned |
| F200 | Biometric devices (super) | Super-admin/biometrics | Load | All devices |
| F201 | Mobile config (super) | Super-admin/mobile-config | Edit | Config saved |
| F202 | Resources manager | Super-admin/resources | CRUD | Resources managed |

## 1.19 Permissions & Access Control — 12 tests

| # | Scenario | Page | Action | Expected |
|---|---|---|---|---|
| F203 | Admin can access all pages | Admin | Navigate all | All accessible |
| F204 | Employee restricted from admin pages | Employee | Navigate admin | 403 or redirect |
| F205 | Permission check on button | Employee | See "Delete" | Button hidden/disabled |
| F206 | hasAccess utility | Any | Module check | Correct show/hide |
| F207 | Redirect to login when unauthenticated | Protected | Load without auth | Redirect to /login |
| F208 | Public pages accessible without auth | Marketing | Load | All public |
| F209 | Menu items reflect permissions | Sidebar | Load | Only permitted items shown |
| F210 | Route guard blocks unauthorized | URL | Type admin URL | Redirected |
| F211 | Super admin sees all menu items | Sidebar | Load | All items present |
| F212 | Employee menu limited | Sidebar | Load | Few items |
| F213 | Forbidden page rendering | Any | 403 response | "Access Denied" page |
| F214 | Not found page | Any | Bad URL | 404 page |

## 1.20 UI/UX — 20 tests

| # | Scenario | Page | Action | Expected |
|---|---|---|---|---|
| F215 | Responsive sidebar | Dashboard | Resize to mobile | Sidebar collapses to hamburger |
| F216 | Dark mode toggle | Any | Click theme toggle | Colors switch |
| F217 | Notification dropdown | Any | Click bell | Notifications list |
| F218 | User dropdown menu | Any | Click avatar | Profile, settings, logout |
| F219 | Breadcrumb navigation | Any | Load page | Breadcrumb shows path |
| F220 | Loading spinner | Any | API call | Spinner shown |
| F221 | Toast notifications | Any | Action success | Toast appears, auto-dismisses |
| F222 | Confirm dialog | Any | Click dangerous action | "Are you sure?" dialog |
| F223 | Form validation errors | Any form | Submit invalid | Red borders, messages |
| F224 | Empty state placeholder | Any list | No data | "No items" with icon |
| F225 | Error state with retry | Any | Network error | "Failed to load" + retry button |
| F226 | Pagination component | Any list | Many items | Page numbers, prev/next |
| F227 | Search input with debounce | Any list | Fast typing | Debounced search |
| F228 | Sort indicators on columns | Any table | Click header | Arrow icon shows direction |
| F229 | Multi-select checkboxes | Any list (batch) | Click checkbox | Items selected, batch actions appear |
| F230 | Modal close on ESC | Any modal | Press ESC | Modal closes |
| F231 | Modal close on backdrop click | Any modal | Click outside | Modal closes |
| F232 | Keyboard navigation | Any form | Tab between fields | Correct order |
| F233 | Focus management | Any modal | Open | Focus inside modal |
| F234 | Screen reader labels | Any | Inspect | aria-labels present |

## 1.21 Edge Cases — 12 tests

| # | Scenario | Page | Action | Expected |
|---|---|---|---|---|
| F235 | Network timeout | Any | Slow API | Timeout message + retry |
| F236 | Server error (500) | Any | API error | Error boundary or toast |
| F237 | Concurrent session (same user x2) | Any | Login second | First session invalidated? |
| F238 | Token expiry during session | Any | Wait for expiry | Redirect to login |
| F239 | LocalStorage clear | Any | Clear + action | Redirect to login |
| F240 | Reload page mid-operation | Any | F5 | State preserved or fresh load |
| F241 | Very long text in table | Employee | Long name | Truncated with tooltip |
| F242 | Special characters in fields | Any form | Type HTML/JS | Escaped display |
| F243 | Rapid button clicks | Payroll | Double-click finalize | Only one request |
| F244 | Tab away mid-form | Any form | Switch tabs | State preserved (draft) |
| F245 | Browser back button | Any | Navigate back | Correct state |
| F246 | PDF preview in new tab | Payslip | Click view | PDF rendered |

## 1.22 Mobile-Specific UI — 10 tests

| # | Scenario | Page | Action | Expected |
|---|---|---|---|---|
| F247 | Touch-friendly buttons | Any | Mobile view | Min 44px touch targets |
| F248 | Swipeable lists | Any | Mobile swipe | Action reveals |
| F249 | Pull-to-refresh | Any list | Pull down | Data refreshes |
| F250 | Bottom navigation | Mobile | Tap tabs | Screen changes |

Total: 30 + 15 + 15 + 8 + 12 + 12 + 8 + 10 + 10 + 20 + 8 + 6 + 6 + 8 + 8 + 8 + 10 + 8 + 12 + 20 + 12 + 10 = **250 tests**
