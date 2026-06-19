# Overtime Module

## Overview

Overtime is automatically computed when worked hours exceed configured standard hours. No manual OT entry in V1.

## Formula

```
overtime_minutes = max(0, worked_minutes - standard_minutes)
```

Where:
- `worked_minutes` = from `attendance_records` (check-out − check-in)
- `standard_minutes` = `attendance_rules.standard_hours × 60`

### Example

| Field | Value |
|-------|-------|
| Check-in | 09:05 AM |
| Check-out | 06:15 PM |
| Worked | 550 minutes (9h 10m) |
| Standard | 480 minutes (8h) |
| Overtime | 70 minutes (1h 10m) |

## Configuration

Set per organization in `attendance_rules`:

| Field | Default | Description |
|-------|---------|-------------|
| `standard_hours` | 8.0 | Daily standard working hours |

Future V2: department-level or employee-level OT rules.

## Computation

### Trigger
- Nightly job `compute_daily_overtime` at 23:00 org timezone
- Re-run on attendance correction approval

### Logic

```python
for record in completed_attendance_today:
    worked = record.working_minutes
    standard = rules.standard_hours * 60
    ot = max(0, worked - standard)
    upsert overtime_records(employee_id, date, worked, standard, ot)
```

### Edge Cases

| Case | Behavior |
|------|----------|
| No checkout | Skip OT computation; flag incomplete |
| Half-day | OT only if worked > standard (unlikely) |
| Holiday / leave | No OT computation |
| Approved correction | Recompute OT |

## Storage

`overtime_records` table — one row per employee per day.

## Dashboards

### HR Manager — `OTDashboardScreen`

| Widget | Data |
|--------|------|
| Today total OT | Sum of today's `overtime_minutes` |
| This week | Weekly aggregation |
| This month | Monthly aggregation |
| By department | Bar chart grouped by department |
| Top OT employees | Ranked list |

### API

| Endpoint | Returns |
|----------|---------|
| `GET /overtime/me` | Employee's OT summary |
| `GET /overtime/dashboard?period=week` | Org OT aggregates |
| `GET /overtime/report?start=&end=` | Filtered data for export |

## Reports

Included in report types:
- Employee-wise OT (daily/weekly/monthly)
- Department-wise OT
- Export: Excel, PDF, CSV

## Mobile Display Format

```typescript
function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}
```

## Notifications (Optional)

- Alert HR when employee OT exceeds threshold (e.g. 2h/day) — configurable in V2
