# Attendance Module

## Overview

Core check-in/check-out with automatic status classification and working hours calculation.

## Check-In

### Prerequisites
- User authenticated as employee
- Face enrolled (`employee.face_enrolled = true`)
- Not already checked in today
- Face verification passes
- Geofence validation passes

### Data Captured

| Field | Source |
|-------|--------|
| `check_in_at` | Server timestamp (UTC, display in org TZ) |
| `check_in_lat/lng` | Device GPS |
| `office_location_id` | Nearest matched office |
| `face_verified` | true |
| `geo_verified` | true |
| `device_info` | Platform, model, OS version |
| `status` | Classified immediately (present or late) |

## Check-Out

### Prerequisites
- Checked in today
- Not already checked out
- Face verification passes (geo optional on checkout — configurable, default: required)

### Data Captured

| Field | Source |
|-------|--------|
| `check_out_at` | Server timestamp |
| `check_out_lat/lng` | Device GPS |
| `working_minutes` | `(check_out_at - check_in_at).total_seconds() / 60` |

After checkout, re-evaluate status for half-day if applicable.

## Status Classification

| Status | Condition |
|--------|-----------|
| `present` | Checked in on time, worked ≥ half-day threshold |
| `late` | Check-in after `work_start + late_threshold_minutes` |
| `half_day` | `working_minutes < half_day_threshold_hours × 60` |
| `absent` | No check-in by end of day (set by nightly job) |
| `holiday` | Date in `holidays` table |
| `leave` | Approved leave covering date |

### Classification Timing

| Status | When Set |
|--------|----------|
| present / late | At check-in |
| half_day | At check-out or end-of-day job |
| absent | End-of-day job (23:30 org TZ) |
| holiday / leave | Pre-computed at start of day |

## Working Hours

```
working_minutes = check_out_at - check_in_at (in minutes)
working_hours_display = "9h 10m" format
```

If no checkout by end of day: working_minutes = null, flag for HR review.

## Attendance Rules (Configurable)

Stored in `attendance_rules` per organization:

| Rule | Example |
|------|---------|
| `work_start_time` | 09:00 |
| `work_end_time` | 18:00 |
| `late_threshold_minutes` | 15 (late after 09:15) |
| `half_day_threshold_hours` | 4.0 |
| `standard_hours` | 8.0 |
| `working_days` | [1,2,3,4,5] Mon–Fri |

## Corrections

Employees request corrections; HR Manager approves.

| Field | Description |
|-------|-------------|
| `reason` | Employee explanation |
| `proposed_check_in/out` | Requested times |
| `status` | pending → approved / rejected |
| `reviewed_by` | HR user |

On approval: update `attendance_records`, recompute `working_minutes` and `status`, log in `audit_logs`.

## HR Dashboard Aggregates

`GET /attendance/dashboard` returns:

```json
{
  "date": "2026-06-18",
  "total_employees": 250,
  "present": 220,
  "absent": 15,
  "late": 10,
  "on_leave": 5,
  "active_check_ins": 180,
  "not_checked_out": 45
}
```

## Nightly Jobs

| Job | Action |
|-----|--------|
| `mark_absent` | Employees with no record on working day → create absent record |
| `flag_incomplete` | Checked in but no checkout → notify employee + HR |
| `reclassify_half_day` | Final status pass |

## Mobile Screens

| Screen | Role |
|--------|------|
| `HomeScreen` | Quick status + check-in/out CTA |
| `CheckInScreen` | Camera + GPS flow |
| `AttendanceHistoryScreen` | Calendar view + list |
| `HRDashboardScreen` | Aggregates |
| `AttendanceDetailScreen` | Per-employee detail (HR) |
| `CorrectionRequestsScreen` | HR approval queue |
