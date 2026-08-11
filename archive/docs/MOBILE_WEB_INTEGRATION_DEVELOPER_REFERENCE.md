# Mobile-Web Integration - Developer Reference

Quick technical reference for the mobile app & web admin settings integration.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Web Portal (React)                       │
│  Settings Page (/pages/Settings.jsx)                       │
│  ├─ Mobile App Tab (UI)                                    │
│  ├─ Form Data: mobile_app_enabled, mobile_feature_*        │
│  └─ Save → settingsService.bulkUpdate() → Backend          │
└─────────────────────────────────────────────────────────────┘
                            ↓ POST /api/settings
┌─────────────────────────────────────────────────────────────┐
│                 Backend (Node.js/Express)                   │
│  Settings Routes (/routes/settingsRoutes.js)              │
│  Settings Controller (/controllers/settingsController.js)   │
│  Database: settings table (category='mobile')              │
└─────────────────────────────────────────────────────────────┘
                            ↓ GET /api/settings?category=mobile
┌─────────────────────────────────────────────────────────────┐
│               Mobile App (React Native/Expo)               │
│  Auth Context (loadSettings on login)                      │
│  ├─ settingsService.getAllSettings(category='mobile')     │
│  ├─ Stores in context state                               │
│  └─ Exposes via useAuth()                                 │
│                                                             │
│  Authorization Module (/utils/authz.js)                    │
│  ├─ MOBILE_FEATURE_KEY mapping                            │
│  └─ canOpenModule(user, tenantId, moduleKey, settings)    │
│                                                             │
│  Navigator (/navigation/AppNavigator.js)                   │
│  ├─ MainTabs: Conditional tab rendering                   │
│  ├─ GuardedScreen: Module access gating                   │
│  └─ MobileDisabledMessage: Full app disable               │
│                                                             │
│  Settings Screen (/screens/SettingsScreen.js)             │
│  ├─ Displays mobile_feature_* status                      │
│  └─ Refresh button calls refreshSettings()                │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### 1. Admin Saves Mobile Settings (Web)

```javascript
// frontend/src/pages/Settings.jsx
const handleSave = async () => {
  const settingsArray = Object.keys(formData).map(key => ({
    key,
    value: formData[key],
    category: 'mobile'  // Mobile keys mapped to 'mobile' category
  }));
  
  await settingsService.bulkUpdate(settingsArray);
};
```

**POST /api/settings**
```json
[
  { "key": "mobile_app_enabled", "value": "true", "category": "mobile" },
  { "key": "mobile_feature_tasks", "value": "false", "category": "mobile" },
  { "key": "mobile_feature_chat", "value": "true", "category": "mobile" }
]
```

**Backend Response:**
```json
{
  "success": true,
  "message": "Settings updated successfully",
  "data": [
    { "setting_id": 1, "setting_key": "mobile_app_enabled", "setting_value": "true", "category": "mobile" },
    { "setting_id": 2, "setting_key": "mobile_feature_tasks", "setting_value": "false", "category": "mobile" },
    { "setting_id": 3, "setting_key": "mobile_feature_chat", "setting_value": "true", "category": "mobile" }
  ]
}
```

---

### 2. Mobile App Loads Settings on Login

```javascript
// mobile/src/context/AuthContext.js
const loadSettings = async () => {
  try {
    const response = await settingsService.getAllSettings({ category: 'mobile' });
    const rows = response.data?.data || [];
    const mapped = {};
    rows.forEach((item) => {
      mapped[item.setting_key] = item.setting_value;
    });
    setSettings(mapped);
  } catch (error) {
    console.log('Error loading mobile settings', error);
    setSettings({});
  }
};

// Called during login flow
const login = async (tenant, email, password) => {
  // ... authentication code ...
  setUser(payload.user);
  await loadSettings();  // ← Load mobile settings
};
```

**GET /api/settings?category=mobile**

**Backend Response:**
```json
{
  "success": true,
  "data": [
    { "setting_key": "mobile_app_enabled", "setting_value": "true", ... },
    { "setting_key": "mobile_feature_tasks", "setting_value": "false", ... },
    { "setting_key": "mobile_feature_chat", "setting_value": "true", ... },
    ...
  ],
  "count": 24
}
```

**Mobile State After Load:**
```javascript
settings = {
  "mobile_app_enabled": "true",
  "mobile_feature_tasks": "false",
  "mobile_feature_chat": "true",
  ...
}
```

---

### 3. Mobile App Enforces Feature Access

```javascript
// mobile/src/utils/authz.js
const MOBILE_FEATURE_KEY = {
  dashboard: 'mobile_feature_dashboard',
  tasks: 'mobile_feature_tasks',
  chat: 'mobile_feature_chat',
  // ... etc
};

export const canOpenModule = (user, tenantId, moduleKey, mobileSettings) => {
  // Check if feature is enabled
  if (!isMobileFeatureEnabled(moduleKey, mobileSettings)) {
    return false;  // ← Feature disabled, deny access
  }
  
  // Check role/permissions
  const access = MODULE_ACCESS[moduleKey] || {};
  if (access.superAdmin) return isSuperAdminTenant(user, tenantId);
  return hasAccess(user, access.roles || [], access.permissions || []);
};

const isMobileFeatureEnabled = (moduleKey, mobileSettings) => {
  if (!mobileSettings) return true;
  const settingKey = MOBILE_FEATURE_KEY[moduleKey];
  if (!settingKey) return true;
  const value = mobileSettings[settingKey];
  return value !== 'false' && value !== false;
};
```

---

### 4. Navigation Applies Feature Gating

```javascript
// mobile/src/navigation/AppNavigator.js

function MainTabs() {
  const { settings } = useAuth();
  const tasksEnabled = settings?.mobile_feature_tasks !== 'false';
  const chatEnabled = settings?.mobile_feature_chat !== 'false';

  return (
    <Tab.Navigator>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      
      {tasksEnabled && (  // ← Conditionally render Tasks tab
        <Tab.Screen name="Tasks" component={TaskScreen} />
      )}
      
      {chatEnabled && (   // ← Conditionally render Chat tab
        <Tab.Screen name="Chat" component={ChatScreen} />
      )}
      
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function GuardedScreen({ component: Component, moduleKey, ...props }) {
  const { user, tenantId, settings } = useAuth();
  if (moduleKey && !canOpenModule(user, tenantId, moduleKey, settings)) {
    return <AccessDeniedScreen {...props} />;  // ← Show access denied
  }
  return <Component {...props} />;
}
```

---

### 5. Settings Screen Shows Feature Status

```javascript
// mobile/src/screens/SettingsScreen.js
export default function SettingsScreen() {
  const { settings: mobileSettings, refreshSettings } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefreshSettings = async () => {
    setRefreshing(true);
    const success = await refreshSettings();
    setRefreshing(false);
    if (success) Alert.alert('Success', 'Mobile settings refreshed');
  };

  return (
    // ... UI code ...
    <View>
      {mobileSettings ? (
        <View>
          {[
            { label: 'Dashboard', key: 'mobile_feature_dashboard' },
            { label: 'Tasks', key: 'mobile_feature_tasks' },
            // ... all features ...
          ].map((item) => (
            <View key={item.key}>
              <Text>{item.label}</Text>
              <Text>{mobileSettings[item.key] === 'true' ? 'Enabled' : 'Disabled'}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text>Loading mobile settings…</Text>
      )}
    </View>
  );
}
```

---

## File Structure & Key Files

```
backend/
├── src/
│   ├── config/
│   │   ├── schema.sql              ← Default mobile settings
│   │   └── tenant_schema.sql       ← Tenant-specific defaults
│   ├── controllers/
│   │   └── settingsController.js   ← GET/PUT /api/settings
│   └── routes/
│       └── settingsRoutes.js       ← Settings API routes

frontend/
├── src/
│   ├── pages/
│   │   └── Settings.jsx            ← Admin UI for mobile settings
│   └── services/
│       └── index.js                ← settingsService API client

mobile/
├── src/
│   ├── api/
│   │   └── index.js                ← settingsService API calls
│   ├── context/
│   │   └── AuthContext.js          ← loadSettings, refreshSettings
│   ├── utils/
│   │   └── authz.js                ← canOpenModule with feature gating
│   ├── navigation/
│   │   └── AppNavigator.js         ← Tab & screen gating
│   └── screens/
│       └── SettingsScreen.js       ← Display & refresh mobile settings
```

---

## Mobile Setting Keys

| Key | Default | Type | Purpose |
|-----|---------|------|---------|
| `mobile_app_enabled` | `true` | boolean | Master enable/disable |
| `mobile_feature_dashboard` | `true` | boolean | Dashboard access |
| `mobile_feature_attendance` | `true` | boolean | Attendance access |
| `mobile_feature_leaves` | `true` | boolean | Leave management |
| `mobile_feature_tasks` | `true` | boolean | Tasks access |
| `mobile_feature_chat` | `true` | boolean | Chat access |
| `mobile_feature_employees` | `true` | boolean | Employee directory |
| `mobile_feature_departments` | `true` | boolean | Department browsing |
| `mobile_feature_payroll` | `true` | boolean | Payroll access |
| `mobile_feature_documents` | `true` | boolean | Documents access |
| `mobile_feature_recruitment` | `true` | boolean | Recruitment access |
| `mobile_feature_performance` | `true` | boolean | Performance access |
| `mobile_feature_reports` | `true` | boolean | Reports access |
| `mobile_feature_assets` | `true` | boolean | Asset management |
| `mobile_feature_holidays` | `true` | boolean | Holiday calendar |
| `mobile_feature_shifts` | `true` | boolean | Shift management |
| `mobile_feature_audit_logs` | `false` | boolean | Audit logs access |
| `mobile_feature_tenants` | `false` | boolean | Tenant management |
| `mobile_feature_cms` | `false` | boolean | CMS management |
| `mobile_feature_leads` | `false` | boolean | Lead management |
| `mobile_feature_biometric_login` | `true` | boolean | Biometric unlock |
| `mobile_feature_2fa_required` | `false` | boolean | Require 2FA |
| `mobile_feature_secure_storage` | `true` | boolean | Secure credential storage |
| `mobile_feature_push_notifications` | `true` | boolean | Push notifications |

---

## API Endpoints

### Get Mobile Settings

```
GET /api/settings?category=mobile
Authorization: Bearer <token>
x-tenant-id: <tenantId>

Response:
{
  "success": true,
  "data": [
    { "setting_key": "mobile_app_enabled", "setting_value": "true", "category": "mobile", ... },
    { "setting_key": "mobile_feature_tasks", "setting_value": "false", "category": "mobile", ... },
    ...
  ],
  "count": 24
}
```

### Update Mobile Settings (Bulk)

```
PUT /api/settings
Authorization: Bearer <token>
x-tenant-id: <tenantId>
Content-Type: application/json

Body:
[
  { "key": "mobile_feature_tasks", "value": "false", "category": "mobile" },
  { "key": "mobile_feature_chat", "value": "true", "category": "mobile" }
]

Response:
{
  "success": true,
  "message": "Settings updated successfully",
  "data": [...],
  "count": 2
}
```

---

## Feature Addition Checklist

To add a new mobile feature:

1. **Database Schema:**
   - Add to `backend/src/config/schema.sql` default INSERT
   - Add to `backend/src/config/tenant_schema.sql` default INSERT
   - Set appropriate default value (`true` or `false`)

2. **Frontend UI:**
   - Add form field to `frontend/src/pages/Settings.jsx` Mobile App section
   - Add key to category mapping in `handleSave()`
   - Add label/description

3. **Mobile App:**
   - Add key to `MOBILE_FEATURE_KEY` mapping in `mobile/src/utils/authz.js`
   - Add to Settings screen feature list in `mobile/src/screens/SettingsScreen.js`
   - Update navigation/screen gating in `mobile/src/navigation/AppNavigator.js`

4. **Documentation:**
   - Add to this Developer Reference
   - Add to Mobile App Admin Guide
   - Update Test Guide scenarios

---

## Debugging Tips

### Check if settings are loaded
```javascript
// In mobile app console
const { settings } = useAuth();
console.log('Mobile Settings:', settings);
```

### Verify database values
```sql
SELECT setting_key, setting_value FROM settings WHERE category = 'mobile';
```

### Test authorization directly
```javascript
import { canOpenModule } from '../utils/authz';
const allowed = canOpenModule(user, tenantId, 'tasks', mobileSettings);
console.log('Can open tasks?', allowed);
```

### Monitor settings refresh
```javascript
// In SettingsScreen
console.log('Before refresh:', mobileSettings);
await refreshSettings();
console.log('After refresh:', mobileSettings);
```

---

## Related Files

- [Mobile & Web Integration Test Guide](./MOBILE_WEB_INTEGRATION_TEST_GUIDE.md)
- [Mobile App Admin Guide](./MOBILE_APP_ADMIN_GUIDE.md)
- Backend: `backend/src/config/schema.sql`
- Backend: `backend/src/controllers/settingsController.js`
- Frontend: `frontend/src/pages/Settings.jsx`
- Mobile: `mobile/src/context/AuthContext.js`
- Mobile: `mobile/src/utils/authz.js`
