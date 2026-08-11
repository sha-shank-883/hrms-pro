# Attendance Module — Deep API Test Cases (110 tests)

## 1.1 Clock In/Out — 15 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| AT1 | Clock in with valid data | POST | `/api/attendance/clock-in` | `{ latitude, longitude }` or empty | 201 | Clock-in recorded |
| AT2 | Clock in twice same day (duplicate) | POST | `/api/attendance/clock-in` | Already clocked in today | 409 | Already clocked in |
| AT3 | Clock out after clock in | POST | `/api/attendance/clock-out` | Valid auth | 200 | Clock-out recorded |
| AT4 | Clock out without clock in | POST | `/api/attendance/clock-out` | Not clocked in | 400 | Not clocked in |
| AT5 | Clock in without auth | POST | `/api/attendance/clock-in` | No token | 401 | Unauthorized |
| AT6 | Clock out without auth | POST | `/api/attendance/clock-out` | No token | 401 | Unauthorized |
| AT7 | Clock in with GPS location | POST | `/api/attendance/clock-in` | `{ latitude: 28.6139, longitude: 77.2090 }` | 201 | Location stored |
| AT8 | Clock in with invalid GPS | POST | `/api/attendance/clock-in` | `{ latitude: "abc", longitude: "xyz" }` | 400 | Invalid coords |
| AT9 | Clock in with out-of-range GPS | POST | `/api/attendance/clock-in` | `{ latitude: 200, longitude: 400 }` | 400 | Out of range |
| AT10 | Clock in from different IP/location | POST | `/api/attendance/clock-in` | Different geo | 201 | Still works |
| AT11 | Clock in at midnight boundary | POST | `/api/attendance/clock-in` | 23:59 → 00:01 | 201 | Next day |
| AT12 | Clock in on weekend/holiday | POST | `/api/attendance/clock-in` | Saturday/Sunday | 201 | Allowed (overtime) |
| AT13 | Clock out late (next day) | POST | `/api/attendance/clock-out` | Clock out after midnight | 200 | Handles overnight |
| AT14 | Clock in with device info | POST | `/api/attendance/clock-in` | `{ device: "mobile", device_id: "ABC123" }` | 201 | Device logged |
| AT15 | Clock in with employee note | POST | `/api/attendance/clock-in` | `{ note: "Working from home" }` | 201 | Note stored |

## 1.2 Today's Attendance — 5 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| AT16 | Get today status (not clocked in) | GET | `/api/attendance/today` | Valid auth | 200 | `clocked_in: false` |
| AT17 | Get today status (after clock in) | GET | `/api/attendance/today` | After clock-in | 200 | `clocked_in: true`, `clock_in_time` |
| AT18 | Get today status (after clock out) | GET | `/api/attendance/today` | After clock-out | 200 | `clocked_in: false`, `hours_worked` |
| AT19 | Get today without auth | GET | `/api/attendance/today` | No token | 401 | Unauthorized |
| AT20 | Get today with duration | GET | `/api/attendance/today` | Clocked in 4 hours ago | 200 | `duration: "4h 0m"` |

## 1.3 History — 15 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| AT21 | Get attendance history | GET | `/api/attendance` | Valid auth | 200 | Array of records |
| AT22 | Get history with date range | GET | `/api/attendance?from=2025-01-01&to=2025-01-31` | Valid auth | 200 | Filtered by range |
| AT23 | Get history with month filter | GET | `/api/attendance?month=1&year=2025` | Valid auth | 200 | Filtered by month |
| AT24 | Get history with employee_id filter | GET | `/api/attendance?employee_id=1` | Admin/manager | 200 | That employee only |
| AT25 | Get history with status filter | GET | `/api/attendance?status=present` | Valid auth | 200 | Filtered |
| AT26 | Get history pagination | GET | `/api/attendance?page=1&limit=10` | Valid auth | 200 | Paginated |
| AT27 | Get history sorted by date | GET | `/api/attendance?sort=date&order=desc` | Valid auth | 200 | Sorted |
| AT28 | Get empty history | GET | `/api/attendance?from=2020-01-01&to=2020-01-02` | New employee | 200 | Empty array |
| AT29 | Get history without auth | GET | `/api/attendance` | No token | 401 | Unauthorized |
| AT30 | Get history cross-tenant | GET | `/api/attendance?employee_id=1` | Tenant A, employee is Tenant B | 404 | Blocked |
| AT31 | Get history with late arrivals | GET | `/api/attendance?status=late` | Valid auth | 200 | Late records |
| AT32 | Get history with half-day | GET | `/api/attendance?status=half_day` | Valid auth | 200 | Half-day records |
| AT33 | Get history summary/stats | GET | `/api/attendance/summary` | Valid auth | 200 | `present`, `absent`, `late` counts |
| AT34 | Get history summary by month | GET | `/api/attendance/summary?month=1&year=2025` | Valid auth | 200 | Monthly stats |
| AT35 | Get attendance for payroll | GET | `/api/attendance/for-payroll?month=1&year=2025&employee_id=1` | Admin | 200 | Payroll-ready |

## 1.4 Manual Entry — 10 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| AT36 | Manual add attendance | POST | `/api/attendance` | `{ employee_id, date, clock_in, clock_out }` | 201 | Record created |
| AT37 | Manual add with missing fields | POST | `/api/attendance` | `{ date: "2025-01-01" }` | 400 | Missing required |
| AT38 | Manual add with future date | POST | `/api/attendance` | `date: "2099-01-01"` | 400 | Future not allowed |
| AT39 | Manual add with clock_out before clock_in | POST | `/api/attendance` | `clock_in: "17:00", clock_out: "09:00"` | 400 | Invalid range |
| AT40 | Manual add as employee | POST | `/api/attendance` | Employee token | 403 | Forbidden |
| AT41 | Manual add without auth | POST | `/api/attendance` | No token | 401 | Unauthorized |
| AT42 | Manual add duplicate date | POST | `/api/attendance` | Same employee+date | 409 | Duplicate |
| AT43 | Manual add with SQL injection | POST | `/api/attendance` | `{ notes: "'; DROP TABLE attendance; --" }` | 201 | Sanitized |
| AT44 | Manual add with overtime | POST | `/api/attendance` | Clock_in 08:00, clock_out 20:00 | 201 | Overtime calc |
| AT45 | Manual add for multiple employees | POST | `/api/attendance/bulk` | Array of records | 201 | Bulk created |

## 1.5 Regularization — 12 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| AT46 | Request regularization | POST | `/api/attendance/regularize` | `{ date, reason, clock_in, clock_out }` | 201 | Request created |
| AT47 | Request regularization without reason | POST | `/api/attendance/regularize` | `{ date }` | 400 | Reason required |
| AT48 | Request regularization for past date | POST | `/api/attendance/regularize` | 30+ days ago | 400 | Too old |
| AT49 | Request regularization for future | POST | `/api/attendance/regularize` | Future date | 400 | Cannot regularize |
| AT50 | Approve regularization as manager | PUT | `/api/attendance/regularize/:id/approve` | Manager token | 200 | Approved |
| AT51 | Approve as unauthorized (employee) | PUT | `/api/attendance/regularize/:id/approve` | Employee token | 403 | Forbidden |
| AT52 | Reject regularization | PUT | `/api/attendance/regularize/:id/reject` | Manager token | 200 | Rejected |
| AT53 | Reject with reason | PUT | `/api/attendance/regularize/:id/reject` | `{ reason: "Insufficient proof" }` | 200 | Reason stored |
| AT54 | Get regularization requests | GET | `/api/attendance/regularize` | Manager token | 200 | Pending requests |
| AT55 | Get regularized history | GET | `/api/attendance/regularize/history` | Valid auth | 200 | Past requests |
| AT56 | Regularization without auth | POST | `/api/attendance/regularize` | No token | 401 | Unauthorized |
| AT57 | Approve non-existent regularization | PUT | `/api/attendance/regularize/:id/approve` | `id: 99999` | 404 | Not found |

## 1.6 Statistics — 8 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| AT58 | Get attendance stats | GET | `/api/attendance/statistics` | Valid auth | 200 | Stats object |
| AT59 | Get monthly stats | GET | `/api/attendance/statistics?month=1&year=2025` | Valid auth | 200 | Monthly breakdown |
| AT60 | Get stats for specific employee | GET | `/api/attendance/statistics?employee_id=1` | Manager | 200 | Employee stats |
| AT61 | Get stats without auth | GET | `/api/attendance/statistics` | No token | 401 | Unauthorized |
| AT62 | Stats include present/absent/late/halfday | GET | `/api/attendance/statistics` | Valid auth | 200 | All categories |
| AT63 | Stats include working_hours | GET | `/api/attendance/statistics` | Valid auth | 200 | Total hours |
| AT64 | Stats include overtime | GET | `/api/attendance/statistics` | Valid auth | 200 | Overtime hours |
| AT65 | Stats cross-tenant isolation | GET | `/api/attendance/statistics?employee_id=1` | Tenant A, emp in Tenant B | 404 | Blocked |

## 1.7 Authorization — 10 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| AT66 | Employee can clock in/out (own) | POST | `/api/attendance/clock-in` | Employee token | 201 | Allowed |
| AT67 | Employee can view own history | GET | `/api/attendance` | Employee token | 200 | Own records |
| AT68 | Employee can view own stats | GET | `/api/attendance/statistics` | Employee token | 200 | Own stats |
| AT69 | Employee cannot view others' history | GET | `/api/attendance?employee_id=2` | Employee token | 403 | Forbidden |
| AT70 | Manager can view team history | GET | `/api/attendance?employee_id=2` | Manager token | 200 | Team visible |
| AT71 | Manager can regularize team | POST | `/api/attendance/regularize` | Manager token | 201 | For team |
| AT72 | Admin can view all | GET | `/api/attendance` | Admin token | 200 | All employees |
| AT73 | Admin can manual add for any employee | POST | `/api/attendance` | Admin token | 201 | Any employee |
| AT74 | Cross-tenant manager cannot see other tenant | GET | `/api/attendance?employee_id=2` | Tenant A manager, emp Tenant B | 403 | Blocked |
| AT75 | Employee regularization for self | POST | `/api/attendance/regularize` | Employee (own) | 201 | Self allowed |

## 1.8 Edge Cases — 15 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| AT76 | Clock in at 00:00:01 | POST | `/api/attendance/clock-in` | Midnight + 1s | 201 | New day |
| AT77 | Clock out at 23:59:59 | POST | `/api/attendance/clock-out` | Just before midnight | 200 | End of day |
| AT78 | Clock in 5 times over 5 days | POST x5 | 5 different days | Sequential | 201 each | All recorded |
| AT79 | Missing clock out (auto-approve) | GET | `/api/attendance/today` | Clocked in, no clock out prev day | 200 | Handles |
| AT80 | Half-day (clock out early) | POST | Clock-in → Clock-out 4h later | Half day | 200 | Half-day flag |
| AT81 | Full day (8+ hours) | POST | Clock-in → Clock-out 9h later | Full day | 200 | Present |
| AT82 | Overtime (>12 hours) | POST | Clock-in → Clock-out 14h later | Overtime | 200 | Overtime computed |
| AT83 | Negative duration (shouldn't happen) | GET | `/api/attendance/history` | Clock-out before clock-in (data fix) | 200 | Handled |
| AT84 | Attendance on public holiday | GET | `/api/attendance` | Holiday date | 200 | Holiday marked |
| AT85 | Attendance on leave day | GET | `/api/attendance` | Approved leave date | 200 | Leave marked |
| AT86 | Multiple clock-ins rejected | POST | `/api/attendance/clock-in` | 2 rapid attempts | 409 | Only first accepted |
| AT87 | Clock in after midnight (overnight shift) | POST | `/api/attendance/clock-in` | 01:00 AM | 201 | Next day entry |
| AT88 | Bulk attendance import CSV | POST | `/api/attendance/import` | CSV with 100 rows | 201 | Bulk imported |
| AT89 | Bulk import with errors | POST | `/api/attendance/import` | CSV with some invalid rows | 207 | Partial success |
| AT90 | Delete attendance record | DELETE | `/api/attendance/:id` | Admin token | 200 | Deleted |

## 1.9 Biometric Integration — 10 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| AT91 | ZKTeco webhook punch | POST | `/api/webhooks/biometrics/zkteco` | `{ employee_id, timestamp, device_id }` | 200 | Processed |
| AT92 | ZKTeco webhook with invalid data | POST | `/api/webhooks/biometrics/zkteco` | Missing employee_id | 400 | Rejected |
| AT93 | ZKTeco webhook without signature | POST | `/api/webhooks/biometrics/zkteco` | No auth key | 401 | Unauthorized |
| AT94 | ZKTeco webhook duplicate punch | POST | `/api/webhooks/biometrics/zkteco` | Same timestamp | 200 | Deduplicated |
| AT95 | Universal JSON webhook | POST | `/api/webhooks/biometrics/universal` | `{ uid, timestamp, device_sn }` | 200 | Processed |
| AT96 | Universal webhook missing uid | POST | `/api/webhooks/biometrics/universal` | No uid | 400 | Rejected |
| AT97 | Universal webhook wrong format | POST | `/api/webhooks/biometrics/universal` | Invalid JSON | 400 | Parse error |
| AT98 | Biometric punch creates attendance record | GET | `/api/attendance/today` | After biometric punch | 200 | Record exists |
| AT99 | Biometric overlaps with manual entry | POST | Biometric punch + manual | Same time | 409 | Duplicate |
| AT100 | Biometric cross-tenant isolation | POST | `/api/webhooks/biometrics/zkteco` | Tenant A device, Tenant B request | 403 | Blocked |

## 1.10 Comp-Off — 10 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| AT101 | Request comp-off | POST | `/api/attendance/comp-off` | `{ date, reason }` | 201 | Comp-off requested |
| AT102 | Request comp-off for non-overtime day | POST | `/api/attendance/comp-off` | 8h day | 400 | No overtime |
| AT103 | Approve comp-off | PUT | `/api/attendance/comp-off/:id/approve` | Manager token | 200 | Approved |
| AT104 | Reject comp-off | PUT | `/api/attendance/comp-off/:id/reject` | Manager token | 200 | Rejected |
| AT105 | Get comp-off balance | GET | `/api/attendance/comp-off/balance` | Valid auth | 200 | Balance count |
| AT106 | Use comp-off for leave | POST | `/api/leaves/apply` | Type: comp-off | 201 | Balance decremented |
| AT107 | Comp-off expires after 90 days | GET | `/api/attendance/comp-off/balance` | Old comp-offs | 200 | Expired excluded |
| AT108 | Comp-off without auth | POST | `/api/attendance/comp-off` | No token | 401 | Unauthorized |
| AT109 | Comp-off cross-tenant | GET | `/api/attendance/comp-off/balance` | Wrong tenant | 403 | Blocked |
| AT110 | Bulk comp-off approval | PUT | `/api/attendance/comp-off/bulk-approve` | Array of IDs | 200 | All approved |

Total: 15 + 5 + 15 + 10 + 12 + 8 + 10 + 15 + 10 + 10 = **110 tests**
