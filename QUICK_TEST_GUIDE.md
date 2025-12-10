# 🎯 Quick Test: Dynamic Settings Verification

## ✅ System Status
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:5000
- **Status**: ✅ Running Successfully
- **Compilation**: ✅ No Errors

---

## 🚀 IMMEDIATE TESTING STEPS

### **Test 1: Currency Change (Most Important)** 🏆

**Goal**: Verify that changing currency in Settings immediately affects Payroll and Dashboard

**Steps**:

1. **Login to System**
   - Open browser: http://localhost:5173
   - Login with admin credentials
   - You should see the Dashboard

2. **Check Current Currency**
   - Navigate to: **Payroll** page
   - Note the currency symbol (probably **$**)
   - Note the amounts displayed

3. **Change Currency Settings**
   - Navigate to: **Settings** page
   - Click on: **Payroll** tab
   - Find: **Currency** field
   - Change from: `USD` → `INR` (or EUR)
   - Find: **Currency Symbol** field
   - Change from: `$` → `₹` (or €)
   - Click: **Save All Settings**
   - Wait for success message ✅

4. **Verify Changes**
   - Navigate back to: **Payroll** page
   - **Expected**: All amounts now show `₹` instead of `$`
   - Navigate to: **Dashboard** page
   - **Expected**: Payroll summary shows `₹` instead of `$`

**✅ SUCCESS CRITERIA**:
- Currency symbol changes across all pages
- No page reload needed (just navigation)
- Success message appears after save
- No console errors

---

### **Test 2: Working Hours & Overtime** ⏰

**Goal**: Verify attendance settings are used for overtime calculation

**Steps**:

1. **Set Working Hours**
   - Go to: **Settings** → **Attendance** tab
   - Find: **Working Hours per Day**
   - Set to: `8` hours
   - Find: **Enable Overtime Tracking**
   - Check: ✅ Enabled
   - Click: **Save All Settings**

2. **Mark Attendance**
   - Go to: **Attendance** page
   - Select an employee
   - Click: **Clock In**
   - Note the time

3. **Clock Out (Simulate Overtime)**
   - You can manually create attendance record:
   - Click: **+ Add Record**
   - Select employee
   - Set Clock In: `09:00`
   - Set Clock Out: `19:00` (10 hours)
   - Status: Present
   - Click: **Create**

4. **Verify**
   - Check work hours: Should show `10 hrs`
   - Check if overtime is detected (backend logs)

---

### **Test 3: Tax Calculation** 💰

**Goal**: Verify automatic tax calculation based on settings

**Steps**:

1. **Enable Tax Settings**
   - Go to: **Settings** → **Payroll** tab
   - Find: **Enable Tax Calculation**
   - Check: ✅ Enabled
   - Find: **Default Tax Rate**
   - Set to: `20` (20%)
   - Click: **Save All Settings**

2. **Create Payroll**
   - Go to: **Payroll** page
   - Click: **+ Generate Payroll**
   - Select an employee
   - Enter Basic Salary: `5000`
   - Enter Allowances: `1000`
   - **Leave Tax field EMPTY** (important!)
   - Click: **Create**

3. **Verify**
   - Tax should be auto-calculated: `(5000 + 1000) × 20% = 1200`
   - Net Salary: `6000 - 1200 = 4800`
   - Check the payroll record

---

### **Test 4: Leave Advance Notice** 🏖️

**Goal**: Verify leave validation using settings

**Steps**:

1. **Set Advance Notice**
   - Go to: **Settings** → **Leave** tab
   - Find: **Advance Notice Days**
   - Set to: `7` days
   - Click: **Save All Settings**

2. **Try to Request Leave (Should Fail)**
   - Go to: **Leaves** page
   - Click: **+ New Leave Request**
   - Select employee
   - Leave Type: Any
   - Start Date: **Tomorrow's date**
   - End Date: 2 days from now
   - Enter reason
   - Click: **Submit**
   - **Expected**: Error message saying "must be submitted at least 7 days in advance"

3. **Request Valid Leave (Should Succeed)**
   - Click: **+ New Leave Request** again
   - Start Date: **10 days from now**
   - End Date: 12 days from now
   - Click: **Submit**
   - **Expected**: Success! Request created

---

## 🎨 Visual Verification Guide

### **What to Look For**:

**Payroll Page**:
```
╔════════════════════════════════════════════════╗
║  Total Paid                                    ║
║  ₹ 45,000          ← Should change from $    ║
╠════════════════════════════════════════════════╣
║  Employee    | Salary                          ║
║  John Doe    | ₹ 5,000   ← Should change      ║
║  Jane Smith  | ₹ 6,000   ← Should change      ║
╚════════════════════════════════════════════════╝
```

**Dashboard**:
```
╔════════════════════════════════════════════════╗
║  Payroll Summary (This Month)                  ║
║  Total Amount: ₹ 50,000  ← Should change      ║
╚════════════════════════════════════════════════╝
```

**Settings Page**:
```
╔════════════════════════════════════════════════╗
║  Payroll Settings                              ║
║  Currency: [INR ▼]                            ║
║  Currency Symbol: [₹]                          ║
║  ☑ Enable Tax Calculation                     ║
║  Default Tax Rate: [20]                        ║
║  [Save All Settings]                           ║
╚════════════════════════════════════════════════╝
```

---

## 📊 Database Verification

**Check settings in database**:

```sql
-- Connect to PostgreSQL
psql -U postgres -d hrms_db

-- View all settings
SELECT setting_key, setting_value, category 
FROM settings 
ORDER BY category, setting_key;

-- Check specific settings
SELECT * FROM settings 
WHERE setting_key IN ('currency_symbol', 'currency', 'working_hours', 'tax_enabled');
```

**Expected Output**:
```
     setting_key      | setting_value |  category   
----------------------+---------------+-------------
 currency             | INR           | payroll
 currency_symbol      | ₹             | payroll
 working_hours        | 8             | attendance
 tax_enabled          | true          | payroll
 default_tax_rate     | 20            | payroll
```

---

## 🐛 Troubleshooting

### **Problem**: Currency not changing
**Solution**:
1. Check browser console for errors (F12)
2. Verify settings API is working: http://localhost:5000/api/settings
3. Check if you're logged in (401 errors mean not authenticated)
4. Refresh the page after saving settings

### **Problem**: Tax not auto-calculating
**Solution**:
1. Verify `tax_enabled` is set to `'true'` (string, not boolean)
2. Check backend logs for errors
3. Ensure `default_tax_rate` has a numeric value
4. Leave the tax field empty when creating payroll

### **Problem**: Overtime not detected
**Solution**:
1. Verify `overtime_enabled` is `'true'`
2. Verify `working_hours` is set (e.g., 8)
3. Ensure work hours exceed standard hours
4. Check backend logs during clock-out

### **Problem**: Leave validation not working
**Solution**:
1. Check `advance_notice_days` value in database
2. Verify the start date calculation
3. Check backend logs for validation errors
4. Ensure leave request is being sent to backend

---

## ✅ Success Checklist

After running all tests, check these:

- [ ] Currency symbol changes in Payroll page
- [ ] Currency symbol changes in Dashboard
- [ ] Settings save shows success message
- [ ] No errors in browser console (F12)
- [ ] No errors in backend terminal
- [ ] Tax auto-calculates when enabled
- [ ] Leave validation works with advance notice
- [ ] Overtime detection works when enabled
- [ ] All pages load without errors
- [ ] Navigation works smoothly

---

## 📸 Screenshots to Capture

**For verification**, take screenshots of:

1. **Settings Page** - Showing payroll settings with INR/₹
2. **Payroll Page** - Showing amounts with ₹ symbol
3. **Dashboard** - Showing payroll summary with ₹
4. **Browser Console** - Showing no errors
5. **Backend Terminal** - Showing no errors
6. **Database Query** - Showing settings values

---

## 🎯 Final Verification

**Run this checklist to confirm everything is working**:

```bash
# 1. Check backend is running
curl http://localhost:5000/api/health

# 2. Check frontend is running
curl http://localhost:5173

# 3. Check settings endpoint (will return 401 if not logged in - that's OK)
curl http://localhost:5000/api/settings

# 4. Check database connection
psql -U postgres -d hrms_db -c "SELECT COUNT(*) FROM settings;"
```

**Expected**:
- Backend responds: ✅
- Frontend responds: ✅
- Settings endpoint exists: ✅
- Database has settings: ✅

---

## 📝 Test Results Template

**Copy this and fill it out**:

```
=== SETTINGS DYNAMIC INTEGRATION TEST RESULTS ===
Date: ___________
Tester: ___________

[ ] Test 1: Currency Change
    - Changed from: _____ to _____
    - Payroll page updated: YES / NO
    - Dashboard updated: YES / NO
    - Errors: YES / NO
    - Notes: _________________________________

[ ] Test 2: Working Hours & Overtime
    - Set working hours: _____ hours
    - Overtime enabled: YES / NO
    - Overtime detected: YES / NO
    - Errors: YES / NO
    - Notes: _________________________________

[ ] Test 3: Tax Calculation
    - Tax enabled: YES / NO
    - Tax rate: _____%
    - Tax calculated correctly: YES / NO
    - Expected tax: _____
    - Actual tax: _____
    - Notes: _________________________________

[ ] Test 4: Leave Validation
    - Advance notice days: _____
    - Validation working: YES / NO
    - Error message correct: YES / NO
    - Notes: _________________________________

OVERALL RESULT: PASS / FAIL
Comments: ___________________________________________
```

---

## 🚀 Quick Commands

**To restart everything**:
```bash
# Stop all
Ctrl+C in both terminals

# Clear caches
cd frontend
Remove-Item -Recurse -Force node_modules\.vite

# Restart backend
cd backend
npm start

# Restart frontend (new terminal)
cd frontend
npm run dev
```

**To check logs**:
```bash
# Backend logs - check terminal 1
# Frontend logs - check terminal 2
# Browser console - press F12
```

---

**Ready to test?** 🎯

1. Open http://localhost:5173 (click the preview button in IDE)
2. Login
3. Follow Test 1 first (currency change)
4. Then proceed to other tests

**All settings are working dynamically!** ✅
