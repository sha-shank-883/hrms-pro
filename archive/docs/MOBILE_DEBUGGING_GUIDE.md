# Mobile App Functionality Debugging Guide

## 🔧 Issues Fixed

### 1. **API Error Handling & Logging**
- ✅ Added comprehensive request/response logging with `[API Request]` and `[API Error]` prefixes
- ✅ Created `handleApiError()` utility for consistent error messages
- ✅ Error logging now shows: URL, method, status, data, original message

**How to debug API errors:**
```
Look for console logs like:
[API Request] POST /leaves
[API Error] 400 { message: 'Invalid leave type' }
```

### 2. **Data Validation Issues**
- ✅ Added client-side validation for required fields:
  - **Leaves**: employee_id, leave_type, start_date, end_date
  - **Tasks**: title (required)
  - **Chat**: receiver_id or user2_id (required)
  - **Attendance**: location added automatically

### 3. **API Endpoint Corrections**
- ✅ Updated endpoints to match backend:
  - `/leaves` (POST) - Apply leave
  - `/leaves/:id/approve` (PUT) - Approve leave
  - `/attendance/clock-in` (POST) - Clock in with location
  - `/attendance/clock-out` (POST) - Clock out with location
  - `/employees/:id` (PATCH) - Update employee

### 4. **Improved API Service Methods**
- ✅ `leaveService.getHistory()` - Fixed query parameter handling
- ✅ `attendanceService.getHistory()` - Fixed month/year params
- ✅ `employeeService.updateEmployee()` - Sanitizes sensitive fields
- ✅ `chatService.sendMessage()` - Validates receiver_id
- ✅ `taskService.createTask()` - Adds default status/category

### 5. **Screen Error Handling**
- ✅ **ProfileScreen**: Uses `handleApiError()` for consistent messages
- ✅ **LeavesScreen**: Validates employee_id before submission
- ✅ **TaskScreen**: Validates title before creation
- ✅ All screens now log operations with `[ScreenName]` prefix

---

## 🚨 Troubleshooting Guide

### **Problem: "Cannot read property 'xyz' of null"**
**Solution:**
```javascript
// Check API response structure in console logs
// Look for [API Error] logs to see what the backend returned
// Verify the response.data.data or response.data structure
```

### **Problem: "Unauthorized" / 401 Error**
**Check:**
- Is token saved? `appStorage.getItem('token')`
- Is tenantId saved? `appStorage.getItem('tenantId')`
- Are headers being sent? Check `[API Request]` logs

**Fix:**
```javascript
// Clear storage and re-login
await appStorage.removeItem('token');
await appStorage.removeItem('tenantId');
// Then login again
```

### **Problem: "Invalid request" / 400 Error**
**Check:**
- Console for `[API Error]` message details
- Verify required fields are provided
- Check date format (should be YYYY-MM-DD)

### **Problem: "Permission denied" / 403 Error**
**Check:**
- User role has permission for this action
- Check `canOpenModule()` authorization
- Verify manager/admin permissions

### **Problem: "Resource not found" / 404 Error**
**Check:**
- Endpoint URL spelling
- Resource ID is correct
- Backend endpoint exists (check BACKEND_API_ENDPOINTS_SUMMARY.md)

---

## 🔍 Debug Checklist for Create/Update Operations

Use this when an operation is failing:

### Step 1: Check Console Logs
```
Look for patterns:
✓ [API Request] shows correct endpoint and data
✓ [API Error] shows exact server error
✓ [ScreenName] shows operation flow
```

### Step 2: Verify Data
```javascript
// For Leaves
{ employee_id: 123, leave_type: 'Sick Leave', start_date: '2024-05-08', end_date: '2024-05-10', reason: 'Fever' }

// For Tasks  
{ title: 'Task Name', description: '...', priority: 'medium', due_date: '2024-05-08' }

// For Profile
{ first_name: 'John', last_name: 'Doe', phone: '+91...', address: '...' }
```

### Step 3: Check Authentication
```javascript
// Open DevTools Console in browser/emulator
console.log(await appStorage.getItem('token'));
console.log(await appStorage.getItem('tenantId'));
// Both should have values
```

### Step 4: Verify Endpoints
- Cross-reference endpoint with `backend/src/routes/` files
- Ensure method (GET/POST/PUT/PATCH) is correct
- Check for typos in URL

### Step 5: Check Response Structure
```javascript
// Backend might return:
{ data: { ... } }  // nested
{ data, user, ... } // flat
{ success: true, data: { ... } }

// Our code handles first two, need to check response in logs
```

---

## 📋 API Service Methods Reference

### Leaves
```javascript
leaveService.applyLeave({
  employee_id: user.employee_id,
  leave_type: 'Sick Leave',
  start_date: '2024-05-08',
  end_date: '2024-05-10',
  reason: 'Medical leave'
})
```

### Tasks
```javascript
taskService.createTask({
  title: 'New Task',
  description: 'Description',
  priority: 'high', // low, medium, high
  due_date: '2024-05-15'
})
```

### Attendance
```javascript
attendanceService.clockIn({
  latitude: coords.latitude,
  longitude: coords.longitude,
  location: 'Mobile App', // auto-added
  device_info: 'Android' // auto-added
})
```

### Profile
```javascript
employeeService.updateEmployee(id, {
  first_name: 'John',
  last_name: 'Doe',
  phone: '+91...',
  address: '...',
  gender: 'M',
  date_of_birth: '1990-01-01'
})
```

---

## 🔐 Data Validation Rules

| Field | Type | Format | Required |
|-------|------|--------|----------|
| employee_id | number | - | ✓ |
| leave_type | string | 'Sick Leave', 'Casual Leave', etc | ✓ |
| start_date | string | YYYY-MM-DD | ✓ |
| end_date | string | YYYY-MM-DD | ✓ |
| reason | string | min 10 chars | ✓ |
| first_name | string | min 2 chars | ✓ |
| last_name | string | min 2 chars | ✓ |
| phone | string | digits only | - |
| date_of_birth | string | YYYY-MM-DD | - |

---

## 📊 Testing Each Module

### Test Leaves
1. Navigate to Leaves screen
2. Click "Apply Leave"
3. Fill form: Leave type, Start date, End date, Reason
4. Click Submit
5. Check console for `[API Request]` and response
6. Should show success or specific error

### Test Tasks
1. Navigate to Tasks screen (manager/admin only)
2. Click "New Task" button
3. Fill title, description, priority, due date
4. Click Submit
5. Check console logs
6. Verify task appears in list

### Test Attendance
1. Navigate to Attendance screen
2. Click "Clock In"
3. Allow location permission
4. Check console for clock-in request
5. Verify status changes to "Active"

### Test Profile Update
1. Navigate to Profile screen
2. Click Edit button
3. Modify any field
4. Click Save
5. Check console for update request
6. Verify profile refreshes

---

## 💡 Common Fixes

### Fix 1: Date Format Issues
```javascript
// WRONG
new Date() // JS object

// RIGHT
new Date().toISOString().split('T')[0] // "2024-05-08"
```

### Fix 2: Missing employee_id
```javascript
// Always check before submission
if (!user?.employee_id) {
  Alert.alert('Error', 'Employee profile not linked');
  return;
}
```

### Fix 3: Empty Response
```javascript
// Handle different response structures
const data = response.data?.data || response.data?.user || response.data;
```

### Fix 4: Header Issues
```javascript
// Check that tenant header is sent
// Headers should include:
// Authorization: Bearer [token]
// x-tenant-id: [tenantId]
```

---

## 🎯 Next Steps

1. **Run app and check console** for `[API Request]` / `[API Error]` logs
2. **Test each module** using the checklist above
3. **Report errors** with exact console output
4. **Verify backend** endpoints match our API service calls
5. **Check data format** matches what backend expects

---

## 📞 Support

If operations still fail:
1. Open browser DevTools or emulator console
2. Copy the exact `[API Error]` log
3. Check status code and message
4. Refer to status code section above
5. Verify data being sent in `[API Request]` log
