# Frontend Module Pages - Part 3

## Assets Page (`/assets`)
| # | Test Case | Expected Result |
|---|---|---|
| AST-F01 | Asset list renders | Assets visible |
| AST-F02 | Add asset with vendor, purchase date, cost | Asset created |
| AST-F03 | Edit asset | Updated |
| AST-F04 | Delete asset | Deleted |
| AST-F05 | Assign asset to employee | Assignment recorded |
| AST-F06 | Asset status filter (Available/Assigned/Maintenance/Retired) | Filtered |
| AST-F07 | Asset type filter (Hardware/Software/License/Other) | Filtered |
| AST-F08 | Search input | Filtered by keyword |
| AST-F09 | Clear filters button | Filters reset |

## Reports Page (`/reports`)
| # | Test Case | Expected Result |
|---|---|---|
| RPT-F10 | Reports dashboard renders | Report cards visible |
| RPT-F11 | Attendance report | Report generated |
| RPT-F12 | Leave report | Generated |
| RPT-F13 | Payroll report | Generated |
| RPT-F14 | Employee report | Generated |
| RPT-F15 | Recruitment report | Generated |
| RPT-F16 | Export report to CSV/PDF | Export works |
| RPT-F17 | Performance analytics load | Charts visible |
| RPT-F18 | Payroll trends | Trend charts |
| RPT-F19 | Attendance trends | Trend charts |
| RPT-F20 | Employee demographics | Demographics charts |

## Settings Page (`/settings`)
| # | Test Case | Expected Result |
|---|---|---|
| SET-F21 | All tabs render: General, Attendance, Leave, Payroll, etc. | All tabs visible |
| SET-F22 | General tab - company name, timezone, date format | Updates saved |
| SET-F23 | Leave tab - leave types, balances, carry forward | Leave config saved |
| SET-F24 | Attendance tab - working hours, geo-fence, overtime | Config saved |
| SET-F25 | Payroll tab - currency, tax rates, pay frequency | Config saved |
| SET-F26 | Recruitment tab - hiring stages, email templates | Config saved |
| SET-F27 | Performance tab - review cycles, goal settings | Config saved |
| SET-F28 | Security tab - password rules, session timeout | Config saved |
| SET-F29 | Notifications tab - email alerts, push toggles | Config saved |
| SET-F30 | Documents tab - expiry reminders, required docs | Config saved |
| SET-F31 | Branding tab - primary color, logo preview | Updates reflect live |
| SET-F32 | Mobile App tab - feature toggles, maintenance | Config updated |
| SET-F33 | Design System tab - colors, fonts, border radius | Preview updates |
| SET-F34 | System tab - backup, data retention, API rate limit | Config saved |
| SET-F35 | Email tab - SMTP settings, test email button | Config saved, test sent |
| SET-F36 | Logo upload | Logo updated |
| SET-F37 | Tab switching works | Content changes |

## Profile Page (`/profile`)
| # | Test Case | Expected Result |
|---|---|---|
| PRF-F38 | Profile page with user info + all tabs | All tabs visible |
| PRF-F39 | Personal tab - edit name, phone, DOB, address | Fields updated |
| PRF-F40 | Employment tab - dept, position, manager, status | Info displayed |
| PRF-F41 | Leave tab - balance, history | Shown |
| PRF-F42 | Documents tab - employee docs | Documents visible |
| PRF-F43 | Payroll tab - payroll history | Payslips listed |
| PRF-F44 | Assets tab - assigned assets | Listed |
| PRF-F45 | Performance tab - goals, reviews | Displayed |
| PRF-F46 | Tasks tab - assigned tasks | Listed |
| PRF-F47 | Attendance tab - attendance logs | Shown |
| PRF-F48 | Audit Logs tab (admin) - activity logs | Displayed |
| PRF-F49 | Change password modal | Password updated |
| PRF-F50 | Upload profile picture | Image updated |
| PRF-F51 | 2FA setup option | 2FA setup works |
| PRF-F52 | Employee ID card view | ID card renders |

## Super Admin Pages
| # | Test Case | Expected Result |
|---|---|---|
| SUP-F53 | Tenant management list | All tenants visible |
| SUP-F54 | Create new tenant | Tenant created |
| SUP-F55 | Website Settings tabs work | All settings saved |

---

**Total: 55 test cases**
