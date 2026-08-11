# All Modules — Mobile Deep Test Cases (150 tests)

## 1.1 Auth Flow (Splash, Onboarding, Marketing, Login, Register, 2FA, Reset) — 20 tests

| # | Screen | Scenario | Action | Expected |
|---|---|---|---|---|
| M1 | SplashScreen | App launch | Open app | Splash shows, auto-navigates |
| M2 | OnboardingScreen | First launch | Swipe through | 3-4 onboarding slides, Get Started button |
| M3 | WelcomeScreen | After onboarding | View | Marketing welcome, Login/Signup buttons |
| M4 | MarketingScreen | Info pages | Scroll | Features, pricing, about |
| M5 | PricingScreen | View pricing | Load | Pricing cards displayed |
| M6 | LoginScreen | Valid login | Fill + submit | Navigate to dashboard |
| M7 | LoginScreen | Wrong password | Fill wrong | Error alert "Invalid credentials" |
| M8 | LoginScreen | Empty fields | Submit empty | Inline validation |
| M9 | RegisterScreen | Valid register | Fill + submit | Navigate to login with toast |
| M10 | RegisterScreen | Weak password | Type "123" | Password strength indicator |
| M11 | ForgotPasswordScreen | Valid email | Submit | Success alert |
| M12 | ResetPasswordScreen | Valid token | New password + confirm | Success, navigate to login |
| M13 | OTPVerificationScreen | Valid OTP | Type 6 digits | Verified |
| M14 | TwoFactorScreen | Valid 2FA code | Enter code | Logged in |
| M15 | TwoFactorScreen | Invalid code | Enter wrong | Error "Invalid code" |
| M16 | OnboardingScreen | Skip button | Tap skip | Navigate to welcome |
| M17 | LoginScreen | Biometric login | Fingerprint/FaceID | Authenticated |
| M18 | Auth loading state | Login | Tap submit | Activity indicator shown |
| M19 | Session timeout | Dashboard | Background long | Redirect to login |
| M20 | Logout | Profile | Tap logout | Confirm → navigate to login |

## 1.2 Dashboard & Main Tabs — 15 tests

| # | Screen | Scenario | Action | Expected |
|---|---|---|---|---|
| M21 | DashboardScreen | Load | Tab 1 | Widgets load from API |
| M22 | DashboardScreen | Pull to refresh | Swipe down | Widgets refresh |
| M23 | DashboardScreen | Clock in widget | Tap clock in | Clock in recorded, button changes |
| M24 | DashboardScreen | Quick actions | Tap action | Navigate to screen |
| M25 | TaskScreen | List tasks | Tab 2 (conditional) | Task list |
| M26 | ChatScreen | Recent conversations | Tab 3 (conditional) | DMs + channels |
| M27 | ProfileScreen | View profile | Tab 4 | User info, photo |
| M28 | Bottom navigation | Tab switch | Tap each tab | Screen changes |
| M29 | Dashboard empty state | Fresh user | Load | No data placeholders |
| M30 | Dashboard error state | Network error | Load | Error message + retry |
| M31 | Dashboard loading skeleton | Loading | Load | Skeleton components |
| M32 | Quick action: Attendance | Dashboard | Tap attendance | Opens AttendanceScreen |
| M33 | Quick action: Leave | Dashboard | Tap leave | Opens LeavesScreen |
| M34 | Quick action: Apply Leave | Dashboard | Tap apply | Opens leave form |
| M35 | Dashboard notification badge | Dashboard | Have unread | Badge on bell icon |

## 1.3 Attendance Screen — 10 tests

| # | Screen | Scenario | Action | Expected |
|---|---|---|---|---|
| M36 | AttendanceScreen | Clock in | Tap button | Recorded, button → clock out |
| M37 | AttendanceScreen | Clock out | Tap button | Recorded, shows hours |
| M38 | AttendanceScreen | History | Scroll | Daily records |
| M39 | AttendanceScreen | Date filter | Pick dates | Filtered records |
| M40 | AttendanceScreen | Regularize | Tap regularize | Form with reason |
| M41 | AttendanceScreen | GPS location | Clock in | Location attached |
| M42 | AttendanceScreen | Offline clock in | No network | Queued, syncs later |
| M43 | AttendanceScreen | Stats | View | Monthly stats chart |
| M44 | AttendanceScreen | Manual entry (admin) | Add | Form → created |
| M45 | AttendanceScreen | Calendar view | Switch view | Calendar markers |

## 1.4 Leaves Screen — 10 tests

| # | Screen | Scenario | Action | Expected |
|---|---|---|---|---|
| M46 | LeavesScreen | Apply leave | Tap + | Form: type, dates, reason |
| M47 | LeavesScreen | Submit valid | Fill → submit | Created, balance updated |
| M48 | LeavesScreen | Balance cards | Load | Leave type cards with counts |
| M49 | LeavesScreen | History list | Load | Past leaves with status |
| M50 | LeavesScreen | Approve (manager) | Swipe to approve | Status → approved |
| M51 | LeavesScreen | Reject (manager) | Tap reject | Reason modal → rejected |
| M52 | LeavesScreen | Filter | Status tabs | Filtered list |
| M53 | LeavesScreen | Calendar | Tap calendar | Month view |
| M54 | LeavesScreen | Comp-off | View balance | Comp-off balance |
| M55 | LeavesScreen | Statistics | Tap stats | Charts |

## 1.5 Employees Screen — 8 tests

| # | Screen | Scenario | Action | Expected |
|---|---|---|---|---|
| M56 | EmployeesScreen | List | Load | Employee list |
| M57 | EmployeesScreen | Search | Type name | Filtered list |
| M58 | EmployeesScreen | Department filter | Select dept | Filtered |
| M59 | EmployeesScreen | View profile | Tap employee | Profile detail |
| M60 | EmployeesScreen | Call employee | Tap phone | Phone dialer opens |
| M61 | EmployeesScreen | Email employee | Tap email | Email client opens |
| M62 | EmployeesScreen | Pagination | Scroll to bottom | Load more |
| M63 | EmployeesScreen | Permission gate | Employee role | Hidden if no access |

## 1.6 Payroll Screen — 12 tests

| # | Screen | Scenario | Action | Expected |
|---|---|---|---|---|
| M64 | PayrollScreen | Payroll runs | Load | List of runs |
| M65 | PayrollScreen | Create run | Tap + | Form → created |
| M66 | PayrollScreen | Run detail | Tap run | Expanded with payslips |
| M67 | PayrollScreen | My payslips | Load tab | Employee payslip list |
| M68 | PayrollScreen | View payslip PDF | Tap payslip | PDF viewer opens |
| M69 | PayrollScreen | Verify payslip | Tap verify | Verification badge |
| M70 | PayrollScreen | Payslip designer | Designer tab | Template list |
| M71 | PayrollScreen | Preview template | Tap preview | PDF preview |
| M72 | PayrollScreen | Email queue | Queue tab | Queue list |
| M73 | PayrollScreen | Retry email | Tap retry | Status → pending |
| M74 | PayrollScreen | Batch generate | Select + generate | Progress indicator |
| M75 | PayrollScreen | Export | Tap export | Download format |

## 1.7 Performance Screen — 6 tests

| # | Screen | Scenario | Action | Expected |
|---|---|---|---|---|
| M76 | PerformanceScreen | Goals list | Load | Goal cards with progress bars |
| M77 | PerformanceScreen | Create goal | Tap + | Form → created |
| M78 | PerformanceScreen | Update progress | Drag slider | Progress updated |
| M79 | PerformanceScreen | Reviews | Reviews tab | Review list |
| M80 | PerformanceScreen | Submit review | Tap review | Rating + comment |
| M81 | PerformanceScreen | Cycles | Cycles tab | Cycle list |

## 1.8 Chat Screen — 8 tests

| # | Screen | Scenario | Action | Expected |
|---|---|---|---|---|
| M82 | ChatScreen | Conversations | Load | DM list |
| M83 | ChatScreen | Open DM | Tap user | Messages load |
| M84 | ChatScreen | Send message | Type + send | Message appears |
| M85 | ChatScreen | File attachment | Tap attach | File picker → sent |
| M86 | ChatScreen | Image in chat | Tap image | Full screen viewer |
| M87 | ChatScreen | Channels | Channels tab | Channel list |
| M88 | ChatScreen | Create channel | Tap + | Form → created |
| M89 | ChatScreen | Reactions | Long press message | Emoji picker |

## 1.9 Recruitment Screen — 6 tests

| # | Screen | Scenario | Action | Expected |
|---|---|---|---|---|
| M90 | RecruitmentScreen | Jobs list | Load | Job postings |
| M91 | RecruitmentScreen | Job detail | Tap job | Full description |
| M92 | RecruitmentScreen | Applications | Applications tab | Applicant list |
| M93 | RecruitmentScreen | Update status | Tap dropdown | Status changed |
| M94 | RecruitmentScreen | Schedule interview | Tap schedule | Form → created |
| M95 | RecruitmentScreen | View applicant | Tap name | Full detail + resume |

## 1.10 Assets Screen — 5 tests

| # | Screen | Scenario | Action | Expected |
|---|---|---|---|---|
| M96 | AssetsScreen | List | Load | Asset list |
| M97 | AssetsScreen | Add asset | Tap + | Form → created |
| M98 | AssetsScreen | Assign | Tap assign | Employee picker → assigned |
| M99 | AssetsScreen | Filter | Type/status | Filtered |
| M100 | AssetsScreen | Detail | Tap asset | Full info |

## 1.11 Documents Screen — 5 tests

| # | Screen | Scenario | Action | Expected |
|---|---|---|---|---|
| M101 | DocumentsScreen | List | Load | Files list |
| M102 | DocumentsScreen | Upload | Tap upload | File picker → uploaded |
| M103 | DocumentsScreen | Download | Tap download | File saved to device |
| M104 | DocumentsScreen | Delete | Swipe to delete | Confirm → deleted |
| M105 | DocumentsScreen | Share | Tap share | Native share sheet |

## 1.12 Reports Screen — 5 tests

| # | Screen | Scenario | Action | Expected |
|---|---|---|---|---|
| M106 | ReportsScreen | Report types | Load | Report cards |
| M107 | ReportsScreen | Attendance report | Tap | Chart + data |
| M108 | ReportsScreen | Leave report | Tap | Data display |
| M109 | ReportsScreen | Payroll report | Tap | Totals display |
| M110 | ReportsScreen | Export | Tap share | Export options |

## 1.13 Settings Screen — 5 tests

| # | Screen | Scenario | Action | Expected |
|---|---|---|---|---|
| M111 | SettingsScreen | Profile settings | Load | Edit name, email, phone |
| M112 | SettingsScreen | Change password | Tap | Form → changed |
| M113 | SettingsScreen | Theme toggle | Tap dark mode | UI theme switches |
| M114 | SettingsScreen | Notification prefs | Toggle | Settings saved |
| M115 | SettingsScreen | App version | Scroll to bottom | Version info |

## 1.14 Navigation & Routing — 10 tests

| # | Screen | Scenario | Action | Expected |
|---|---|---|---|---|
| M116 | All | Deep link (notification) | Tap notification | Navigate to specific screen |
| M117 | All | Back navigation | Tap back | Previous screen |
| M118 | All | Tab navigation | Tap tab | Correct tab selected |
| M119 | All | Stack push/pop | Navigate in | Screen pushes |
| M120 | All | Unauthorized route | Try restricted | AccessDeniedScreen |
| M121 | All | Auth redirect | Not logged in | LoginScreen |
| M122 | All | Bottom tab visibility | Auth screens | Hidden on auth flow |
| M123 | All | Header title | Navigate | Correct title |
| M124 | All | Side drawer (if used) | Swipe from left | Drawer opens |
| M125 | All | Screen transition animation | Navigate | Smooth animation |

## 1.15 Permissions & Security — 10 tests

| # | Screen | Scenario | Action | Expected |
|---|---|---|---|---|
| M126 | All | moduleKey guard | Employee tries admin | AccessDeniedScreen |
| M127 | All | hasAccess check | Button rendering | Hidden when no access |
| M128 | All | Biometric auth toggle | Enable in settings | Fingerprint/FaceID works |
| M129 | All | Token storage | After login | SecureStore has token |
| M130 | All | Token expiry | Expired API call | Redirect to login |
| M131 | All | Cross-tenant data | Wrong tenant header | Data isolation |
| M132 | All | Logout clears data | Logout | All cached data cleared |
| M133 | All | Screenshot blocking | Payroll/sensitive | Blocked or warned |
| M134 | All | Clipboard security | Copy sensitive | Warning |
| M135 | All | API error 403 | Forbidden action | "Access Denied" alert |

## 1.16 Offline & Performance — 10 tests

| # | Screen | Scenario | Action | Expected |
|---|---|---|---|---|
| M136 | All | Airplane mode | Go offline | Offline indicator shown |
| M137 | All | Offline data cached | Previously loaded | Data from cache |
| M138 | All | Queue write operations | Clock in offline | Queued for sync |
| M139 | All | Reconnect sync | Come online | Queued operations sync |
| M140 | All | Pull to refresh | Swipe down | Data refreshes |
| M141 | All | Loading spinner | API call | Activity indicator |
| M142 | All | Error retry | Network error | Retry button → reloads |
| M143 | All | FlatList performance | 100+ items | Smooth scroll |
| M144 | All | Image loading | Avatar/image | Progressive or skeleton |
| M145 | All | Memory on large lists | 1000 items | No crash |

## 1.17 UI/UX — 10 tests

| # | Screen | Scenario | Action | Expected |
|---|---|---|---|---|
| M146 | All | Dark mode | Toggle on | All screens dark |
| M147 | All | Light mode | Toggle off | Default light |
| M148 | All | Accessibility labels | Inspect | All tappable have labels |
| M149 | All | Font scaling | System large text | Text scales properly |
| M150 | All | Safe area | Notch device | Content within safe area |

Total: 20 + 15 + 10 + 10 + 8 + 12 + 6 + 8 + 6 + 5 + 5 + 5 + 5 + 10 + 10 + 10 + 10 = **150 tests**
