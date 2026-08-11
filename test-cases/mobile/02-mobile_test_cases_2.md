# Mobile App - Test Cases Part 2

## Chat Screen (continued)
| # | Test Case | Expected Result |
|---|---|---|
| MOB-056 | Read receipts (double check mark) | Blue ticks show |
| MOB-057 | Voice recording via mic | Sent as audio attachment |
| MOB-058 | Emoji picker in ChatInput | Opens and inserts |
| MOB-059 | Chat tab hidden when disabled | Not in bottom nav |
| MOB-060 | Empty state - no conversations | "No chats yet" placeholder |
| MOB-061 | Unread badge on conversation items | Badge shows count |
| MOB-062 | Network error / offline banner | "No connection" indicator |
| MOB-063 | Reconnect after network restore | Messages sync |

## Profile Screen
| # | Test Case | Expected Result |
|---|---|---|
| MOB-064 | User profile info displayed | Name, email, role |
| MOB-065 | Edit profile | Profile updated |
| MOB-066 | Change password | Password changed |
| MOB-067 | Logout button | Logs out, returns to Login |

## Additional Stack Screens
| # | Test Case | Screen | Expected Result |
|---|---|---|---|
| MOB-068 | Employee list + search | EmployeesScreen | CRUD works |
| MOB-069 | Department list | DepartmentsScreen | CRUD works |
| MOB-070 | Payroll records + payslips | PayrollScreen | Data visible |
| MOB-071 | Asset list + assignment | AssetsScreen | CRUD works |
| MOB-072 | Document list + upload | DocumentsScreen | Upload works |
| MOB-073 | Jobs + Applications | RecruitmentScreen | CRUD works |
| MOB-074 | Goals + Reviews | PerformanceScreen | Data visible |
| MOB-075 | Reports generation | ReportsScreen | Reports load |
| MOB-076 | Settings display | SettingsScreen | Read-only/editable |
| MOB-077 | Audit log list | AuditLogsScreen | Logs visible |
| MOB-078 | Holiday calendar | HolidaysScreen | Holidays visible |
| MOB-079 | Shift profiles | ShiftsScreen | Shift data visible |
| MOB-080 | Demo request leads | LeadsScreen | Leads visible |
| MOB-081 | CMS page content | CMSPageScreen | Content renders |
| MOB-082 | Tenant list (super admin) | TenantsScreen | Tenants visible |
| MOB-083 | AccessDenied screen | Restricted module | Denied message |

## Guarded Screens (Authorization)
| # | Test Case | Expected Result |
|---|---|---|
| MOB-084 | Employee accesses Employees screen | AccessDenied |
| MOB-085 | Manager accesses AuditLogs | AccessDenied |
| MOB-086 | Non-super-admin accesses Tenants | AccessDenied |
| MOB-087 | Disabled feature via mobile config | Feature hidden/denied |
| MOB-088 | canOpenModule checks all feature keys | Each module gated |

## Offline / Error Handling
| # | Test Case | Expected Result |
|---|---|---|
| MOB-089 | No internet connection | Error / offline state |
| MOB-090 | API timeout | Proper error UI |
| MOB-091 | Token expired | Redirect to login |
| MOB-092 | Server 500 error | Graceful error |

## Mobile-Specific Features
| # | Test Case | Expected Result |
|---|---|---|
| MOB-093 | Location-based attendance (GPS) | Location captured |
| MOB-094 | Secure token storage (expo-secure-store) | Token persisted |
| MOB-095 | Push notifications | Notifications received |
| MOB-096 | Dark/Light theme toggle | Theme switches |
| MOB-097 | DesignSystem components render | GlassPanel, PrimaryButton |
| MOB-098 | Pull-to-refresh on data screens | All lists refresh |
| MOB-099 | Loading states on all screens | Spinner/skeleton shown |
| MOB-100 | Empty states on all screens | Placeholder shown |
| MOB-101 | Error states on all screens | Error with retry |
| MOB-102 | Keyboard avoidance on forms | Keyboard pushes content |
| MOB-103 | Safe area handling (notch/devices) | Content not clipped |
| MOB-104 | Back navigation works | Correct screen |
| MOB-105 | Deep linking (if configured) | External links open app |
| MOB-106 | App version displayed | Version in settings |
| MOB-107 | Device orientation lock | Stays in portrait |
| MOB-108 | Memory management on lists | No crashes on long lists |
| MOB-109 | Network retry mechanism | Auto-retry on reconnect |
| MOB-110 | Analytics/event tracking (if configured) | Events logged |

---

**Total: 55 test cases (106-110 = 55 total in this file)**
