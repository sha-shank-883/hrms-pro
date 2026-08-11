# Mobile App - Test Cases

## App Initialization
| # | Test Case | Expected Result |
|---|---|---|
| MOB-001 | App starts -> SplashScreen | Splash visible for 1-2s |
| MOB-002 | Splash -> Onboarding (first time) | Onboarding screens swipeable |
| MOB-003 | Onboarding complete -> Welcome Screen | Welcome visible |
| MOB-004 | "Get Started" on Welcome -> Login | Navigates to login |
| MOB-005 | Maintenance mode enabled | Maintenance screen shows |
| MOB-006 | Mobile access disabled | Access Revoked screen shows |
| MOB-007 | App cold start time < 3s | Performance OK |
| MOB-008 | App restores session from stored token | Auto-login works |

## Auth Screens
| # | Test Case | Expected Result |
|---|---|---|
| MOB-009 | LoginScreen - email + password fields | Fields visible |
| MOB-010 | Valid credentials login | Navigates to Dashboard tab |
| MOB-011 | Invalid credentials | Error message |
| MOB-012 | 2FA required | Navigates to TwoFactorScreen |
| MOB-013 | Valid TOTP on TwoFactorScreen | Login complete |
| MOB-014 | Invalid TOTP | Error message |
| MOB-015 | RegisterScreen - create account | Registration works |
| MOB-016 | ForgotPasswordScreen - submit email | Email sent message |
| MOB-017 | ResetPasswordScreen - new password | Password reset |
| MOB-018 | Biometric login (fingerprint/face) | Auth via device biometric |
| MOB-019 | Empty fields validation | Error shown |
| MOB-020 | Password visibility toggle | Password shown/hidden |

## Bottom Tab Navigation
| # | Test Case | Expected Result |
|---|---|---|
| MOB-021 | Dashboard tab (Home icon) | Shows DashboardScreen |
| MOB-022 | Tasks tab (CheckSquare icon) | Shows TaskScreen (if enabled) |
| MOB-023 | Chat tab (MessageCircle icon) | Shows ChatScreen (if enabled) |
| MOB-024 | Profile tab (User icon) | Shows ProfileScreen |
| MOB-025 | Tab bar renders with proper styling | Icons + labels visible |
| MOB-026 | Tasks tab hidden when disabled | Tab not visible |
| MOB-027 | Chat tab hidden when disabled | Tab not visible |
| MOB-028 | Tab switching preserves state | State maintained |

## Dashboard Screen
| # | Test Case | Expected Result |
|---|---|---|
| MOB-029 | Dashboard stats load | Stats cards visible |
| MOB-030 | Quick actions available | Action buttons work |
| MOB-031 | Pull-to-refresh works | Data refreshes |

## Attendance Screen
| # | Test Case | Expected Result |
|---|---|---|
| MOB-032 | Attendance records list | Records visible |
| MOB-033 | Clock In with GPS location | Clock-in with GPS |
| MOB-034 | Clock Out button | Clock-out recorded |
| MOB-035 | Attendance history/filter | Filtered by date |

## Leaves Screen
| # | Test Case | Expected Result |
|---|---|---|
| MOB-036 | Leave list renders | Leaves visible |
| MOB-037 | Apply leave form | Leave request created |
| MOB-038 | Leave balance display | Balance visible |
| MOB-039 | Approve/reject leave (manager) | Status updated |

## Tasks Screen
| # | Test Case | Expected Result |
|---|---|---|
| MOB-040 | Task list renders | Tasks visible |
| MOB-041 | Create task | Task created |
| MOB-042 | Update task status | Status changed |
| MOB-043 | Task detail view | Details visible |

## Chat Screen
| # | Test Case | Expected Result |
|---|---|---|
| MOB-044 | Conversation list | Conversations visible |
| MOB-045 | Select conversation -> messages | Messages load |
| MOB-046 | Send text message | Sent and displayed |
| MOB-047 | Receive message (real-time) | Appears without refresh |
| MOB-048 | Attachment/image upload | File attached |
| MOB-049 | Reply to message (swipe-to-reply) | Reply preview shown |
| MOB-050 | Message reactions (emoji) | Reaction added |
| MOB-051 | Star message | Starred indicator |
| MOB-052 | Edit message | Updated with "edited" |
| MOB-053 | Delete message | Redacted |
| MOB-054 | Typing indicator | "typing..." appears |
| MOB-055 | Online status dot | Green dot on online users |

---

**Total: 55 test cases**
