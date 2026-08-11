# Mobile App Settings - Administrator Guide

This guide shows how to manage mobile app features and security settings from the web portal admin panel.

## Overview

The Mobile App Settings allow tenant administrators to control which features are available to users on the HRMS mobile app. Changes take effect immediately without requiring app updates or user restarts.

---

## Accessing Mobile App Settings

1. Log in to the HRMS web portal with **Admin** role.
2. Navigate to **Settings** (usually in the main menu or user dropdown).
3. In the left sidebar, click **Mobile App** tab.
4. The page displays all mobile-related controls.

---

## Main Mobile App Toggle

### Enable Mobile App

**Default:** Enabled (`true`)

**Purpose:** Master switch to enable/disable the entire mobile app for your tenant.

**When Disabled:**
- Users attempting to access the mobile app will see: "Mobile Access Disabled"
- Message: "Your administrator has disabled mobile access for this tenant. Please use the web portal to continue."
- No mobile features are available regardless of individual feature settings.

**When Enabled:**
- Users can log in and use the mobile app.
- Individual features can be controlled via feature toggles below.

**Use Case:** Temporarily disable mobile access during system maintenance or security incidents.

---

## Security Settings

### Require Mobile 2FA

**Default:** Disabled (`false`)

**Purpose:** Force two-factor authentication for mobile app logins.

**When Enabled:**
- Mobile users must complete 2FA verification after entering credentials.
- Adds extra security layer for sensitive data access.

**When Disabled:**
- Mobile users can log in with email + password only (if system-wide 2FA is also disabled).

**Use Case:** High-security environments or organizations handling sensitive financial/HR data.

---

### Biometric Login

**Default:** Enabled (`true`)

**Purpose:** Allow mobile users to unlock the app using fingerprint or face recognition.

**When Enabled:**
- Users can set up biometric unlock during app setup.
- Faster, more secure alternative to password entry on each app restart.

**When Disabled:**
- Biometric unlock is not available.
- Users must use password/2FA for every login.

**Use Case:** BYOD (Bring Your Own Device) environments where device control is not guaranteed.

---

### Secure Storage

**Default:** Enabled (`true`)

**Purpose:** Require encrypted secure storage of mobile credentials.

**When Enabled:**
- Mobile app uses encrypted secure storage (OS keychain/Keystore).
- Credentials are never stored in plain text.

**When Disabled:**
- Credentials may be stored with basic protection.
- Not recommended for security reasons.

**Use Case:** Keep enabled for compliance (GDPR, HIPAA, etc.).

---

### Push Notifications

**Default:** Enabled (`true`)

**Purpose:** Enable push notifications on the mobile app.

**When Enabled:**
- Users receive real-time notifications for leave approvals, task assignments, payroll, etc.

**When Disabled:**
- Push notifications are disabled.
- Users must manually check the app for updates.

**Use Case:** Battery-conscious deployments or high-traffic scenarios.

---

## Feature Module Controls

Each feature below has a toggle: **Enabled** or **Disabled**.

### Core HR Features

#### Mobile App Enabled (Master Toggle)
See "Main Mobile App Toggle" section above.

#### Dashboard
Access to home screen and daily pulse metrics.
- **Enabled:** Users see dashboard, quick stats, and operations menu.
- **Disabled:** Dashboard is hidden; app shows access denied if navigated directly.

#### Attendance
Clock in, clock out, and attendance history.
- **Enabled:** Attendance tab/module visible; users can check in/out.
- **Disabled:** Users cannot access attendance features.

#### Leaves
Apply for leave, view leave balance, manage leave requests.
- **Enabled:** Leaves module visible and accessible.
- **Disabled:** Users cannot apply for or view leaves.

#### Holidays
View company holidays and optionally opt in/out.
- **Enabled:** Holidays calendar accessible.
- **Disabled:** Holiday calendar hidden.

#### Shifts
View assigned shifts and shift schedules.
- **Enabled:** Shifts module visible.
- **Disabled:** Users cannot view shifts.

### Communication & Productivity

#### Tasks
Create, view, and update task assignments.
- **Enabled:** Tasks tab visible in main navigation.
- **Disabled:** Tasks tab hidden; users cannot access task management.

#### Chat
Direct messaging with colleagues.
- **Enabled:** Chat tab visible in main navigation.
- **Disabled:** Chat tab hidden; users cannot send/receive messages.

#### Documents
View personal and shared documents.
- **Enabled:** Documents accessible.
- **Disabled:** Users cannot access document library.

### People & Organization

#### Employees
View company employee directory.
- **Enabled:** Employee directory accessible.
- **Disabled:** Users cannot browse employee list.

#### Departments
View department structure and information.
- **Enabled:** Department browsing available.
- **Disabled:** Users cannot view departments.

### Finance & Operations

#### Payroll
View payslips and salary information.
- **Enabled:** Payroll/Payslips visible.
- **Disabled:** Users cannot view payroll details.

#### Assets
View assigned company assets (laptops, phones, etc.).
- **Enabled:** Asset inventory visible.
- **Disabled:** Users cannot view assigned assets.

### Talent Management

#### Recruitment
View job postings and apply for internal positions.
- **Enabled:** Recruitment module visible.
- **Disabled:** Recruitment features hidden.

#### Performance
View performance goals, reviews, and feedback.
- **Enabled:** Performance management visible.
- **Disabled:** Users cannot access performance tools.

#### Reports
Access dashboard reports and analytics.
- **Enabled:** Reports module visible.
- **Disabled:** Users cannot view reports.

### Administration (Restricted to Super-Admins)

#### Audit Logs
View system audit logs and activity history.
- **Enabled:** Audit Logs accessible (for admin users).
- **Disabled:** Audit Logs hidden (even for admins).

#### CMS Management
Manage public website content.
- **Enabled:** CMS module visible (for super-admins).
- **Disabled:** CMS module hidden.

#### Tenant Management
Manage multi-tenant settings and configurations.
- **Enabled:** Tenant Management visible (for super-admins only).
- **Disabled:** Tenant Management hidden.

#### Demo Leads/Leads
Manage demonstration and lead records.
- **Enabled:** Leads module visible.
- **Disabled:** Leads module hidden.

---

## Common Scenarios

### Scenario 1: New Tenant Rollout

1. Keep all defaults enabled.
2. Enable `Require Mobile 2FA` if security policy requires it.
3. Deploy mobile app to users.
4. Collect feedback on feature usage.

---

### Scenario 2: Disable High-Resource Features

**Situation:** Mobile app is slow on weak network connections.

**Actions:**
1. Disable **Reports** (heavy data transfer).
2. Disable **Documents** (large file downloads).
3. Keep core features: Dashboard, Attendance, Leaves, Tasks, Chat.

---

### Scenario 3: Limit Executive Users

**Situation:** Only C-level executives should see Payroll via mobile.

**Actions:**
1. Disable **Payroll** at tenant level.
2. Manually enable **Payroll** for specific users (future per-user override feature).

---

### Scenario 4: High-Security Environment

**Situation:** Financial services company handling sensitive data.

**Actions:**
1. Enable **Require Mobile 2FA**.
2. Enable **Secure Storage**.
3. Disable **Chat** (prevent unencrypted communication).
4. Disable **Documents** (prevent file downloads).
5. Disable **Audit Logs** (only accessible on desktop).

---

## Saving & Verification

### Saving Changes

1. Adjust toggles as needed.
2. Click **Save Changes** button (top right).
3. You'll see a confirmation message:
   ```
   ✅ Settings saved successfully!
   ```

### Verifying Changes

**On Mobile App:**
1. Mobile users should see changes within seconds (if app is open).
2. Or use the **Refresh** button in mobile Settings → Mobile Feature Status.

**In Database (For Verification):**
```sql
SELECT setting_key, setting_value 
FROM settings 
WHERE category = 'mobile' 
ORDER BY setting_key;
```

---

## Rollback

If you accidentally disable a critical feature:

1. Go back to **Settings → Mobile App**.
2. Re-enable the feature.
3. Click **Save Changes**.
4. Mobile users will see the change immediately.

---

## Best Practices

✅ **DO:**
- Review feature usage before disabling features.
- Communicate changes to mobile users via email/announcement.
- Start with all features enabled; disable only as needed.
- Enable 2FA for sensitive industries (finance, healthcare).
- Regularly audit which features are actually being used.

❌ **DON'T:**
- Disable `Dashboard` unless you want to block mobile access entirely (use `Mobile App Enabled` instead).
- Change settings without user communication.
- Disable security settings (`Biometric Login`, `Secure Storage`) unless required by policy.

---

## Troubleshooting

### Changes Not Appearing on Mobile

**Problem:** Mobile app still shows disabled features.

**Solution:**
1. Mobile app may have cached settings.
2. Ask user to click **Settings → Refresh** in the mobile app.
3. Or user should log out and log back in.
4. Full app restart as last resort.

---

### Feature Becomes Unavailable During Business Hours

**Problem:** Users report sudden loss of access to a feature.

**Solution:**
1. Check **Settings → Mobile App** for recent changes.
2. Verify if changes were accidental.
3. Re-enable if needed; changes take effect immediately.
4. Communicate with users about the change.

---

## Support & Questions

For issues or questions about mobile app settings:

1. Check the **Mobile & Web Integration Test Guide** (MOBILE_WEB_INTEGRATION_TEST_GUIDE.md).
2. Review database settings: `SELECT * FROM settings WHERE category = 'mobile';`
3. Check mobile app console logs for API errors.
4. Contact system administrator or support team.

---

## Related Documentation

- [Mobile & Web Integration Test Guide](./MOBILE_WEB_INTEGRATION_TEST_GUIDE.md)
- [HRMS Architecture Documentation](./architecture_documentation.md)
- [Settings System Overview](./SETTINGS_INTEGRATION.md)
