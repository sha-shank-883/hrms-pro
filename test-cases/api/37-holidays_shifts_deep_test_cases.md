# Holidays & Shifts Module — Deep API Test Cases (105 tests)

## 1.1 Holidays CRUD — 20 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| H1 | Create holiday | POST | `/api/holidays` | `{ name, date, type, optional }` | 201 | Holiday created |
| H2 | Create with missing name | POST | `/api/holidays` | No name | 400 | Required |
| H3 | Create with missing date | POST | `/api/holidays` | No date | 400 | Required |
| H4 | Create with duplicate date+name | POST | `/api/holidays` | Same as H1 | 409 | Duplicate |
| H5 | Create with past date | POST | `/api/holidays` | Date in past | 201 | Allowed |
| H6 | Create with future date | POST | `/api/holidays` | Future date | 201 | Allowed |
| H7 | Create without auth | POST | `/api/holidays` | No token | 401 | Unauthorized |
| H8 | Create as employee | POST | `/api/holidays` | Employee | 403 | Forbidden |
| H9 | Create with SQL injection | POST | `/api/holidays` | `{ name: "'; DROP TABLE holidays; --" }` | 201 | Sanitized |
| H10 | Create with XSS in name | POST | `/api/holidays` | `{ name: "<script>alert(1)</script>" }` | 201 | HTML-encoded |
| H11 | Create optional holiday | POST | `/api/holidays` | `{ type: "optional", optional: true }` | 201 | Optional flag |
| H12 | Create restricted holiday | POST | `/api/holidays` | `{ type: "restricted" }` | 201 | Restricted flag |
| H13 | List holidays | GET | `/api/holidays` | Valid auth | 200 | Array |
| H14 | List with year filter | GET | `/api/holidays?year=2025` | Valid auth | 200 | By year |
| H15 | List with month filter | GET | `/api/holidays?month=12` | Valid auth | 200 | By month |
| H16 | List with type filter | GET | `/api/holidays?type=optional` | Valid auth | 200 | Optional only |
| H17 | List with date range | GET | `/api/holidays?from=2025-01-01&to=2025-03-31` | Valid auth | 200 | Range |
| H18 | List without auth | GET | `/api/holidays` | No token | 401 | Unauthorized |
| H19 | List sorted by date | GET | `/api/holidays?sort=date&order=asc` | Valid auth | 200 | Chronological |
| H20 | List as employee | GET | `/api/holidays` | Employee token | 200 | Read only |

## 1.2 Holiday Specific — 12 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| H21 | Get single holiday | GET | `/api/holidays/:id` | Valid auth | 200 | Holiday object |
| H22 | Get non-existent | GET | `/api/holidays/:id` | `id: 99999` | 404 | Not found |
| H23 | Update holiday | PUT | `/api/holidays/:id` | `{ name: "Updated" }` | 200 | Updated |
| H24 | Update to duplicate | PUT | `/api/holidays/:id` | Existing name+date | 409 | Duplicate |
| H25 | Delete holiday | DELETE | `/api/holidays/:id` | Admin | 200 | Deleted |
| H26 | Delete non-existent | DELETE | `/api/holidays/:id` | `id: 99999` | 404 | Not found |
| H27 | My restricted holidays | GET | `/api/holidays/my-restricted` | Valid auth | 200 | Employee restricted |
| H28 | Opt-in restricted holiday | POST | `/api/holidays/:id/opt-in` | Valid auth | 200 | Opted in |
| H29 | Opt-out restricted holiday | POST | `/api/holidays/:id/opt-out` | Valid auth | 200 | Opted out |
| H30 | Opt-in to non-restricted | POST | `/api/holidays/:id/opt-in` | Not restricted type | 400 | Not applicable |
| H31 | Opt-in duplicate | POST | `/api/holidays/:id/opt-in` | Already opted in | 409 | Already opted |
| H32 | Opt-in without auth | POST | `/api/holidays/:id/opt-in` | No token | 401 | Unauthorized |

## 1.3 Shifts CRUD — 20 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| H33 | Create shift | POST | `/api/shifts` | `{ name, start_time, end_time, grace_period, working_hours }` | 201 | Shift created |
| H34 | Create with missing name | POST | `/api/shifts` | No name | 400 | Required |
| H35 | Create with missing start_time | POST | `/api/shifts` | No start_time | 400 | Required |
| H36 | Create with invalid time format | POST | `/api/shifts` | `{ start_time: "25:00" }` | 400 | Invalid time |
| H37 | Create with end before start | POST | `/api/shifts` | `{ start_time: "14:00", end_time: "06:00" }` | 201 | Night shift |
| H38 | Create duplicate name | POST | `/api/shifts` | Same name as H33 | 409 | Duplicate |
| H39 | Create without auth | POST | `/api/shifts` | No token | 401 | Unauthorized |
| H40 | Create as employee | POST | `/api/shifts` | Employee | 403 | Forbidden |
| H41 | Create with SQL injection | POST | `/api/shifts` | `{ name: "'; DROP TABLE shifts; --" }` | 201 | Sanitized |
| H42 | Create with negative grace_period | POST | `/api/shifts` | `{ grace_period: -10 }` | 400 | Invalid |
| H43 | Create with 0 working_hours | POST | `/api/shifts` | `{ working_hours: 0 }` | 400 | Must be >0 |
| H44 | Create with description | POST | `/api/shifts` | `{ description: "Morning shift" }` | 201 | Description stored |
| H45 | List shifts | GET | `/api/shifts` | Valid auth | 200 | Array |
| H46 | List without auth | GET | `/api/shifts` | No token | 401 | Unauthorized |
| H47 | List as employee | GET | `/api/shifts` | Employee | 200 | Read |
| H48 | List with pagination | GET | `/api/shifts?page=1&limit=10` | Valid auth | 200 | Paginated |
| H49 | Get single shift | GET | `/api/shifts/:id` | Valid auth | 200 | Shift object |
| H50 | Get non-existent | GET | `/api/shifts/:id` | `id: 99999` | 404 | Not found |
| H51 | Update shift | PUT | `/api/shifts/:id` | `{ name: "Updated Shift" }` | 200 | Updated |
| H52 | Delete shift | DELETE | `/api/shifts/:id` | Admin | 200 | Deleted |

## 1.4 Shift Assignments — 15 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| H53 | Assign shift to employee | POST | `/api/shifts/assign` | `{ employee_id, shift_id, effective_from }` | 201 | Assigned |
| H54 | Assign shift missing employee | POST | `/api/shifts/assign` | No employee_id | 400 | Required |
| H55 | Assign shift non-existent employee | POST | `/api/shifts/assign` | `employee_id: 99999` | 404 | Not found |
| H56 | Assign shift non-existent shift | POST | `/api/shifts/assign` | `shift_id: 99999` | 404 | Not found |
| H57 | Assign without auth | POST | `/api/shifts/assign` | No token | 401 | Unauthorized |
| H58 | Assign as employee | POST | `/api/shifts/assign` | Employee | 403 | Forbidden |
| H59 | Assign with effective_from in past | POST | `/api/shifts/assign` | Past date | 201 | Historical |
| H60 | List shift assignments | GET | `/api/shifts/assignments` | Valid auth | 200 | Array |
| H61 | List by employee | GET | `/api/shifts/assignments?employee_id=1` | Valid auth | 200 | By employee |
| H62 | List by shift | GET | `/api/shifts/assignments?shift_id=1` | Valid auth | 200 | By shift |
| H63 | List active assignments | GET | `/api/shifts/assignments?status=active` | Valid auth | 200 | Active only |
| H64 | Get current shift for employee | GET | `/api/shifts/assignments/current` | Valid auth | 200 | Current assignment |
| H65 | End shift assignment | PUT | `/api/shifts/assignments/:id/end` | `{ effective_to: "2025-06-30" }` | 200 | Ended |
| H66 | Delete assignment | DELETE | `/api/shifts/assignments/:id` | Admin | 200 | Deleted |
| H67 | Delete non-existent | DELETE | `/api/shifts/assignments/:id` | `id: 99999` | 404 | Not found |

## 1.5 Authorization — 15 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| H68 | Admin full CRUD holidays | ALL | Holidays | Admin | 200 | Full |
| H69 | Admin full CRUD shifts | ALL | Shifts | Admin | 200 | Full |
| H70 | Admin full CRUD assignments | ALL | Assignments | Admin | 200 | Full |
| H71 | Manager can view holidays | GET | Holidays | Manager | 200 | Read |
| H72 | Manager can view shifts | GET | Shifts | Manager | 200 | Read |
| H73 | Manager can assign shifts to team | POST | Assign | Manager, team | 201 | Allowed |
| H74 | Manager cannot assign to other team | POST | Assign | Manager, other dept | 403 | Blocked |
| H75 | Manager cannot create holidays | POST | Holidays | Manager | 403 | Forbidden |
| H76 | Manager cannot create shifts | POST | Shifts | Manager | 403 | Forbidden |
| H77 | Employee can view holidays | GET | Holidays | Employee | 200 | Read |
| H78 | Employee can view shifts | GET | Shifts | Employee | 200 | Read |
| H79 | Employee can opt-in to restricted holidays | POST | Opt-in | Employee | 200 | Self only |
| H80 | Employee cannot create holidays | POST | Holidays | Employee | 403 | Forbidden |
| H81 | Employee cannot create shifts | POST | Shifts | Employee | 403 | Forbidden |
| H82 | Cross-tenant isolation | ALL | All | Wrong tenant | 403 | Blocked |

## 1.6 Edge Cases — 23 tests

| # | Scenario | Method | Endpoint | Payload / Headers | Expected Status | Checks |
|---|---|---|---|---|---|---|
| H83 | Holiday on Feb 29 (leap year) | POST | Holidays | `{ date: "2024-02-29" }` | 201 | Leap year OK |
| H84 | Holiday on Feb 29 (non-leap) | POST | Holidays | `{ date: "2025-02-29" }` | 400 | Invalid date |
| H85 | Holiday name with Unicode | POST | Holidays | `{ name: "दिवाली (Diwali)" }` | 201 | Unicode OK |
| H86 | Shift with overnight schedule | POST | Shifts | 22:00→06:00 | 201 | Overnight |
| H87 | Shift with 24-hour schedule | POST | Shifts | 00:00→23:59 | 201 | Full day |
| H88 | Holiday on weekend | POST | Holidays | Saturday date | 201 | Still created |
| H89 | Bulk holiday creation | POST | `/api/holidays/bulk` | Array of holidays | 201 | All created |
| H90 | Bulk with duplicate dates | POST | `/api/holidays/bulk` | Some duplicates | 207 | Partial success |
| H91 | 100 holidays then list | POST x100 → GET | Bulk year range | Unique | 201, 200 | All listed |
| H92 | Shift name very long | POST | Shifts | 200 chars | 400 | Too long |
| H93 | Employee assigned overlapping shifts | POST | Assignments | Overlap period | 409 | Cannot overlap |
| H94 | Employee with no shift assignment | GET | Current shift | No assignment | 200 | Default shift |
| H95 | Shift assignment history | GET | `/api/shifts/assignments/history?employee_id=1` | Valid auth | 200 | History |
| H96 | Holiday opt-in count | GET | `/api/holidays/:id/opt-in-count` | Valid auth | 200 | Count |
| H97 | Holiday with no opt-in | GET | `/api/holidays/:id/opt-in-count` | No opt-ins | 200 | 0 count |
| H98 | Delete holiday with opt-ins | DELETE | Holidays/:id | Has opt-ins | 409 | FK or cascade |
| H99 | Shift with timezone info | POST | Shifts | `{ timezone: "America/New_York" }` | 201 | Timezone stored |
| H100 | Shift assignment recurring | POST | Assignments | `{ recurring: "weekly" }` | 201 | Recurring flag |
| H101 | Holiday year-end rollover | GET | `/api/holidays?year=2025` | Dec 31 | 200 | Year boundary OK |
| H102 | Multiple restricted holidays on same date | POST x2 | Restricted | Same date, diff names | 201 both | Allowed |
| H103 | Opt-in after holiday passed | POST | Opt-in | Past holiday | 400 | Too late |
| H104 | Shift grace period > working hours | POST | Shifts | `{ grace_period: 60, working_hours: 8 }` | 400 | Grace too large |
| H105 | Holiday with attachments | POST | Holidays | With file | 201 | File stored |

Total: 20 + 12 + 20 + 15 + 15 + 23 = **105 tests**
