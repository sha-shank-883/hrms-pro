# Mobile & Web Settings Integration Test Guide

This guide validates the end-to-end mobile app feature control system powered by web admin settings.

## System Architecture Overview

```
Web Admin Settings Page (React)
    ↓ (saves mobile_feature_* + mobile_app_enabled)
Backend Settings API (/settings)
    ↓ (stores in database with category='mobile')
Mobile App Auth Context
    ↓ (loads settings on login, passes to navigation/screens)
Mobile Feature Gating
    ↓ (shows/hides tabs, screens, and features based on flags)
Mobile User Experience
```

## Prerequisites

- Backend running on `http://localhost:5001`
- Frontend running on `http://localhost:5173` (or your frontend port)
- Mobile app running on Expo or physical device with backend API configured
- Admin account credentials to access web Settings page
- Test user account for mobile login

---

## Test Scenarios

### Scenario 1: Backend Defaults Verification

**Goal**: Confirm that mobile settings are initialized with correct defaults.

**Steps:**

1. Open a database client (e.g., pgAdmin, DBeaver) and connect to your HRMS database.
2. Query the `settings` table for mobile-related settings:
   ```sql
   SELECT setting_key, setting_value, category FROM settings 
   WHERE category = 'mobile' ORDER BY setting_key;
   ```
3. **Expected Results:**
   - `mobile_app_enabled` = `'true'`
   - `mobile_feature_dashboard` = `'true'`
   - `mobile_feature_attendance` = `'true'`
   - `mobile_feature_leaves` = `'true'`
   - `mobile_feature_tasks` = `'true'`
   - `mobile_feature_chat` = `'true'`
   - `mobile_feature_employees` = `'true'`
   - `mobile_feature_departments` = `'true'`
   - `mobile_feature_payroll` = `'true'`
   - `mobile_feature_documents` = `'true'`
   - `mobile_feature_recruitment` = `'true'`
   - `mobile_feature_performance` = `'true'`
   - `mobile_feature_reports` = `'true'`
   - `mobile_feature_assets` = `'true'`
   - `mobile_feature_holidays` = `'true'`
   - `mobile_feature_shifts` = `'true'`
   - `mobile_feature_audit_logs` = `'false'`
   - `mobile_feature_tenants` = `'false'`
   - `mobile_feature_cms` = `'false'`
   - `mobile_feature_leads` = `'false'`
   - `mobile_feature_biometric_login` = `'true'`
   - `mobile_feature_2fa_required` = `'false'`
   - `mobile_feature_secure_storage` = `'true'`
   - `mobile_feature_push_notifications` = `'true'`

---

### Scenario 2: Web Admin Disables a Mobile Feature

**Goal**: Verify that admins can control mobile features from the web Settings page and changes take effect immediately.

**Steps:**

1. Log in to the web portal with admin credentials.
2. Navigate to **Settings → Mobile App** tab.
3. Under "Feature Modules," set **Tasks** to **Disabled**.
4. Click **Save Changes**.
5. Verify success message appears: "Settings saved successfully!"
6. Check the database:
   ```sql
   SELECT setting_value FROM settings WHERE setting_key = 'mobile_feature_tasks';
   ```
   **Expected:** `'false'`

**Result:** ✅ Web settings are saved to the database with the correct category.

---

### Scenario 3: Mobile App Loads Settings on Login

**Goal**: Verify that the mobile app fetches and caches mobile settings after authentication.

**Steps:**

1. Start the mobile app (Expo or device).
2. Log in with a test user account.
3. Open the browser console (React Native Debugger or logcat) and check for:
   ```
   ✅ AuthContext: Mobile settings loaded successfully
   ```
4. The app should NOT crash or hang during login.

**Expected Behavior:**
- Login completes normally.
- Mobile settings are loaded in the background.
- No console errors related to settings API.

**Result:** ✅ Mobile app successfully loads settings from `/api/settings?category=mobile`.

---

### Scenario 4: Mobile App Hides Disabled Features from Navigation

**Goal**: Verify that disabled mobile features are hidden from the mobile UI.

**Prerequisites:** From Scenario 2, `mobile_feature_tasks` is set to `'false'`.

**Steps:**

1. In the mobile app, go to the **Main Tab Navigation** (bottom of screen).
2. Observe the available tabs: **Dashboard**, ~~Tasks~~ (hidden), **Chat**, **Profile**.
3. Expected: **Tasks** tab should NOT appear in the tab bar.
4. Navigate to **Dashboard** and open the **Operations** menu.
5. Expected: Under **Productivity**, the **Tasks** item should NOT be visible or should be grayed out.

**Result:** ✅ Mobile UI respects feature flags and hides Tasks.

---

### Scenario 5: Mobile App Blocks Access to Disabled Screens

**Goal**: Verify that even if a user tries to navigate directly to a disabled feature, the app shows an access-denied screen.

**Steps:**

1. In the mobile app, attempt to navigate to a feature that is disabled (e.g., Tasks).
2. Expected: The app displays **"Access Denied"** screen with message:
   ```
   You do not have permission to open this module from the mobile app.
   ```
3. Click **Go Back** and verify you return to the previous screen.

**Result:** ✅ Mobile app enforces feature access control at the screen level.

---

### Scenario 6: Mobile App Disables Entire Mobile Access

**Goal**: Verify that admins can disable the entire mobile app from the web Settings.

**Steps:**

1. Log in to the web portal with admin credentials.
2. Navigate to **Settings → Mobile App** tab.
3. Set **Enable Mobile App** to **Disabled**.
4. Click **Save Changes**.
5. Check the database:
   ```sql
   SELECT setting_value FROM settings WHERE setting_key = 'mobile_app_enabled';
   ```
   **Expected:** `'false'`
6. In the mobile app, log out and log back in (or restart the app).
7. Expected: Mobile app displays a **"Mobile Access Disabled"** message:
   ```
   Mobile Access Disabled
   Your administrator has disabled mobile access for this tenant. 
   Please use the web portal to continue.
   ```

**Result:** ✅ Admin can completely disable mobile app access.

---

### Scenario 7: Mobile Settings Refresh (On-Demand)

**Goal**: Verify that users can refresh mobile settings without restarting the app.

**Steps:**

1. In the mobile app, navigate to **Profile → Settings** (or the Settings screen).
2. Scroll to **Mobile Feature Status** section.
3. Click the **Refresh** button (blue refresh icon).
4. Expected: A toast/alert appears saying **"Mobile settings refreshed"** (if successful) or **"Failed to refresh settings"** (if error).
5. The feature status list should update with the latest values from the backend.

**Result:** ✅ On-demand refresh works without full app restart.

---

### Scenario 8: End-to-End Feature Toggle

**Goal**: Complete cycle of disabling a feature on the web and verifying it's immediately unavailable on mobile.

**Steps:**

1. **Web Admin Action:**
   - Log in to web portal.
   - Settings → Mobile App → Set **Chat** to **Disabled**.
   - Save Changes.

2. **Mobile User Action:**
   - In mobile app, go to Settings.
   - Click **Refresh** button.
   - Verify: Chat shows **"Disabled"** in the Mobile Feature Status list.
   - Go back to Dashboard → Main tabs.
   - Expected: **Chat** tab is no longer visible.

3. **Revert Feature:**
   - Web Admin: Settings → Mobile App → Set **Chat** to **Enabled**.
   - Save Changes.
   - Mobile User: Settings → Click **Refresh**.
   - Verify: Chat shows **"Enabled"**.
   - Go back to Main tabs.
   - Expected: **Chat** tab is now visible again.

**Result:** ✅ Real-time feature control works end-to-end.

---

### Scenario 9: Different Users See Consistent Settings

**Goal**: Verify that all mobile users see the same mobile feature configuration.

**Steps:**

1. Log in to mobile app as User A.
2. Navigate to **Settings → Mobile Feature Status**.
3. Note the current state of features (e.g., Tasks: Enabled, Chat: Enabled).
4. Log out from mobile app.
5. Log in as User B.
6. Navigate to **Settings → Mobile Feature Status**.
7. Expected: Same feature states as User A.

**Result:** ✅ Mobile settings are tenant-wide, not user-specific.

---

### Scenario 10: Security Settings Enforcement (2FA & Biometric)

**Goal**: Verify that mobile-specific security flags are honored.

**Steps:**

1. **Web Admin Action:**
   - Settings → Mobile App → Set **Require Mobile 2FA** to **Enabled**.
   - Save Changes.

2. **Mobile User Action:**
   - Log out and attempt to log in again.
   - Expected: 2FA prompt appears (if backend 2FA is also enabled).

3. **Biometric Login:**
   - Verify **Biometric Login** is **Enabled** in Mobile Feature Status.
   - On devices with biometric support: Verify fingerprint/face recognition works.

**Result:** ✅ Mobile security settings are enforced.

---

## Troubleshooting

### Mobile Settings Show as Null/Loading

**Issue:** Mobile Feature Status displays "Loading mobile settings…"

**Solution:**
1. Verify backend is running and `/api/settings?category=mobile` returns data.
2. Check mobile app console for errors in `settingsService` API call.
3. Ensure auth token is valid and includes proper tenant headers.

---

### Features Still Showing After Setting to Disabled

**Issue:** Features appear enabled even after web admin disables them.

**Solution:**
1. Mobile app may have cached settings. Click **Refresh** button in Settings.
2. Or restart the mobile app completely.
3. Verify database update was successful (see Scenario 2).
4. Check mobile auth context is loading settings correctly.

---

### Mobile App Won't Load After Disabling mobile_app_enabled

**Issue:** Mobile app shows "Mobile Access Disabled" message.

**Solution:**
1. This is expected behavior. Verify in database that `mobile_app_enabled` is `'true'`.
2. Admin should re-enable it from web portal: Settings → Mobile App → **Enable Mobile App** set to **Enabled** → Save.
3. Mobile user logs back in; should work normally.

---

### Database Queries Aren't Showing Updates

**Issue:** Database still shows old values after saving from web.

**Solution:**
1. Ensure you're querying the correct tenant schema if using multi-tenancy.
2. Check for database transaction rollback (look at backend logs).
3. Verify no write permissions issues on the settings table.

---

## Success Criteria

✅ All 10 scenarios pass  
✅ Mobile settings load and refresh without errors  
✅ Feature toggles on web immediately affect mobile visibility  
✅ Users cannot access disabled features  
✅ Admin can disable entire mobile app if needed  
✅ Settings are consistent across all mobile users (per tenant)  

---

## Next Steps

- **Deployment:** Test in production environment with real users.
- **Monitoring:** Log all mobile settings changes for audit trails.
- **Documentation:** Share mobile settings guide with tenant admins.
- **Training:** Conduct admin training on mobile feature control best practices.
