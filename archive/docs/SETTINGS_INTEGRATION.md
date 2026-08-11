# HRMS Pro - Dynamic Settings Integration

## Overview
The HRMS Pro application now features a **fully dynamic settings system** that affects all modules in real-time. When you change a setting (like currency or working hours), it automatically reflects throughout the entire application.

## How Settings Work

### 1. Settings Storage
- All settings are stored in the PostgreSQL `settings` table
- Each setting has: `setting_key`, `setting_value`, `category`, and `description`
- 41+ predefined settings across 10 categories

### 2. Global Settings Provider
The application uses React Context to provide settings globally:

```javascript
import { useSettings } from './hooks/useSettings';

const MyComponent = () => {
  const { getSetting, getSettingNumber, getSettingBoolean } = useSettings();
  
  // Get currency symbol
  const currencySymbol = getSetting('currency_symbol', '$');
  
  // Get working hours as number
  const workingHours = getSettingNumber('working_hours', 8);
  
  // Get boolean settings
  const taxEnabled = getSettingBoolean('tax_enabled', false);
};
```

## Settings Integration by Module

### 💰 Payroll Module
**Settings Used:**
- `currency` - Currency code (USD, EUR, etc.)
- `currency_symbol` - Currency symbol ($, €, £, etc.)
- `tax_enabled` - Enable/disable automatic tax calculation
- `default_tax_rate` - Default tax percentage
- `social_security_rate` - Social security tax rate
- `medicare_rate` - Medicare tax rate
- `bonus_enabled` - Enable bonus payments
- `allowances_enabled` - Enable allowances
- `deductions_enabled` - Enable deductions

**Dynamic Behavior:**
- Currency changes update all salary displays immediately
- Tax calculations use the configured tax rate
- Auto-calculate taxes when `tax_enabled` is true

**Example:**
```javascript
// Payroll automatically shows currency from settings
<h3>{getSetting('currency_symbol', '$')}{totalPaid.toLocaleString()}</h3>
```

### ⏰ Attendance Module
**Settings Used:**
- `working_hours` - Standard hours per day
- `working_days` - Days per week (5, 6, 7)
- `overtime_enabled` - Enable overtime tracking
- `overtime_rate` - Overtime pay multiplier (e.g., 1.5x)
- `late_arrival_threshold` - Minutes before marked late
- `grace_period` - Grace period in minutes
- `auto_clock_out` - Auto clock-out at end of day

**Dynamic Behavior:**
- Overtime automatically calculated based on `working_hours` setting
- Late arrivals flagged based on `late_arrival_threshold`
- Overtime pay calculated using `overtime_rate`

**Backend Example:**
```javascript
const standardWorkHours = parseFloat(await getSetting('working_hours', '8'));
if (workHours > standardWorkHours && overtimeEnabled === 'true') {
  overtimeHours = workHours - standardWorkHours;
}
```

### 🏖️ Leave Management
**Settings Used:**
- `annual_leave_days` - Annual leave entitlement
- `sick_leave_days` - Sick leave days
- `casual_leave_days` - Casual leave days
- `carry_forward_enabled` - Allow carry forward
- `max_carry_forward_days` - Max days to carry forward
- `leave_approval_required` - Require manager approval
- `advance_notice_days` - Minimum advance notice
- `negative_balance_allowed` - Allow negative balance

**Dynamic Behavior:**
- Leave requests validated against `advance_notice_days`
- Carry forward rules applied based on settings
- Approval workflow toggled by `leave_approval_required`

**Backend Validation:**
```javascript
const advanceNoticeDays = parseInt(await getSetting('advance_notice_days', '3'));
if (daysUntilLeave < advanceNoticeDays) {
  return res.status(400).json({
    message: `Leave must be requested ${advanceNoticeDays} days in advance`
  });
}
```

### 🔐 Security Settings
**Settings Used:**
- `password_min_length` - Minimum password length
- `password_require_uppercase` - Require uppercase
- `password_require_number` - Require numbers
- `password_require_special` - Require special chars
- `session_timeout` - Session timeout in minutes
- `max_login_attempts` - Max failed login attempts
- `two_factor_auth` - Enable 2FA

**Dynamic Behavior:**
- Password validation uses configured rules
- Session timeout enforced from settings
- Login lockout after max attempts

### 📄 Documents Module
**Settings Used:**
- `max_file_size` - Maximum file size in MB
- `allowed_file_types` - Allowed file extensions
- `document_retention_days` - Retention period
- `auto_archive` - Auto-archive old documents

**Dynamic Behavior:**
- File upload size validated against `max_file_size`
- Only allowed file types accepted
- Documents auto-archived after retention period

### 🏢 General Settings
**Settings Used:**
- `company_name` - Company name
- `company_email` - Company email
- `timezone` - Default timezone
- `date_format` - Date format (MM/DD/YYYY, DD/MM/YYYY, etc.)

**Dynamic Behavior:**
- All dates formatted according to `date_format`
- Timestamps adjusted to `timezone`
- Company branding uses `company_name`

## Utility Functions

### Frontend Helpers (`utils/settingsHelper.js`)

```javascript
import { formatCurrency, calculateTax, formatDate } from '../utils/settingsHelper';

// Format currency with settings
const formatted = formatCurrency(5000, 'USD', '$'); // $5,000

// Calculate tax
const tax = calculateTax(10000, 20); // 2000

// Format date
const formatted = formatDate(new Date(), 'DD/MM/YYYY'); // 30/10/2025
```

### Backend Helpers

```javascript
// Get setting value
const getSetting = async (key, defaultValue = null) => {
  const result = await query('SELECT setting_value FROM settings WHERE setting_key = $1', [key]);
  return result.rows.length > 0 ? result.rows[0].setting_value : defaultValue;
};

// Usage
const taxRate = await getSetting('default_tax_rate', '20');
```

## Testing Settings Integration

### Test 1: Currency Change
1. Go to **Settings** → **Payroll** tab
2. Change `Currency Symbol` from `$` to `€`
3. Change `Currency` from `USD` to `EUR`
4. Click **Save All Settings**
5. Go to **Payroll** module
6. **Result:** All amounts now show `€` instead of `$`

### Test 2: Working Hours Change
1. Go to **Settings** → **Attendance** tab
2. Change `Working Hours per Day` from `8` to `9`
3. Click **Save All Settings**
4. Add attendance record with 10 hours worked
5. **Result:** Overtime calculated as 1 hour (10 - 9)

### Test 3: Tax Rate Change
1. Go to **Settings** → **Payroll** tab
2. Enable `Tax Calculation`
3. Change `Default Tax Rate` from `20` to `25`
4. Click **Save All Settings**
5. Create new payroll record
6. **Result:** Tax automatically calculated at 25%

### Test 4: Leave Advance Notice
1. Go to **Settings** → **Leave** tab
2. Change `Minimum Advance Notice` from `3` to `7` days
3. Click **Save All Settings**
4. Try to request leave for tomorrow
5. **Result:** Request rejected with message "Leave must be requested 7 days in advance"

## Settings Categories

### 1. General (9 settings)
- Company information
- Timezone and date format
- System preferences

### 2. Attendance (9 settings)
- Working hours and days
- Overtime configuration
- Late arrival rules

### 3. Leave (8 settings)
- Leave entitlements
- Approval workflows
- Carry forward rules

### 4. Payroll (11 settings)
- Currency and taxation
- Pay frequency
- Bonus and allowances

### 5. Recruitment (6 settings)
- Job posting rules
- Interview process
- Background checks

### 6. Performance (5 settings)
- Review cycles
- 360 feedback
- Goal setting

### 7. Security (8 settings)
- Password policies
- Session management
- Two-factor auth

### 8. Notifications (7 settings)
- Email/SMS/Push notifications
- Event triggers

### 9. Documents (4 settings)
- File size limits
- Retention policies
- Auto-archiving

### 10. System (6 settings)
- Maintenance mode
- Backups
- API rate limits

## Important Notes

1. **Real-time Updates:** Settings changes are applied immediately across all logged-in users
2. **Validation:** All settings are validated before saving
3. **Default Values:** Every setting has a sensible default value
4. **Type Safety:** Settings can be retrieved as string, number, or boolean
5. **Backward Compatibility:** If a setting is missing, default values are used

## API Endpoints

```bash
# Get all settings
GET /api/settings

# Get specific setting
GET /api/settings/:key

# Update setting
PUT /api/settings/:key

# Bulk update
PUT /api/settings
```

## Troubleshooting

### Settings not updating?
1. Check if you clicked "Save All Settings"
2. Verify browser cache is cleared
3. Refresh the page
4. Check browser console for errors

### Currency not showing correctly?
1. Verify `currency_symbol` setting is correct
2. Check `currency` setting matches currency code
3. Ensure Settings Provider is wrapping the app

### Calculations incorrect?
1. Check relevant settings are numeric values
2. Verify formulas in `settingsHelper.js`
3. Test with default values first

## Best Practices

1. **Always use settings helpers:** Don't hardcode values
2. **Provide defaults:** Always specify default values
3. **Document new settings:** Add to schema.sql with description
4. **Test thoroughly:** Test each setting change
5. **Use proper types:** Number settings as numbers, booleans as booleans

## Future Enhancements

- [ ] Settings history/audit log
- [ ] Settings import/export
- [ ] Role-based settings access
- [ ] Settings templates
- [ ] Multi-tenant settings
- [ ] Settings validation rules
- [ ] Settings dependencies
- [ ] Settings change notifications
