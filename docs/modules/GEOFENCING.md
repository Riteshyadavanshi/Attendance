# Geofencing Module

## Overview

Attendance is permitted only when the employee's GPS coordinates are within the configured office radius (default **300 meters**).

## Configuration

Super Admin configures via `office_locations` table:

| Field | Description | Default |
|-------|-------------|---------|
| `latitude` | Office center latitude | Required |
| `longitude` | Office center longitude | Required |
| `radius_meters` | Allowed radius | 300 |
| `name` | Location label | e.g. "HQ Office" |

Organizations may have multiple office locations. Check-in matches against the **nearest** active location.

## Distance Calculation

Haversine formula:

```python
from math import radians, sin, cos, sqrt, atan2

def haversine_distance_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371000  # Earth radius in meters
    phi1, phi2 = radians(lat1), radians(lat2)
    dphi = radians(lat2 - lat1)
    dlambda = radians(lon2 - lon1)
    a = sin(dphi / 2) ** 2 + cos(phi1) * cos(phi2) * sin(dlambda / 2) ** 2
    return R * 2 * atan2(sqrt(a), sqrt(1 - a))
```

## Validation Rules

Check-in passes geofence if:

```
min(haversine(employee_lat, employee_lng, office.lat, office.lng))
  for office in active_office_locations
) <= office.radius_meters
```

**All must pass for attendance:**
1. Face verified
2. GPS enabled and accuracy ≤ 50 meters
3. Within geofence radius

Otherwise: attendance **rejected** (HTTP 403).

## GPS Accuracy Requirements

| Parameter | Requirement |
|-----------|-------------|
| Max accuracy | 50 meters (`accuracy` from device) |
| Min accuracy confidence | Horizontal accuracy value must be present |
| Stale location | Reject if location timestamp > 30 seconds old |

## Mobile Implementation

```typescript
// useLocation hook
const position = await getCurrentPosition({
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 0,
});

if (position.coords.accuracy > 50) {
  throw new Error('GPS accuracy too low');
}
```

## Admin UI (Super Admin)

`GeofenceConfigScreen`:
- Map view with draggable pin for office center
- Radius slider (100m – 1000m, default 300m)
- Circle overlay showing geofence boundary
- List of configured locations

## API

See [API_SPECIFICATION.md](../API_SPECIFICATION.md) — `/office-locations` endpoints.

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| GPS disabled | Reject with `GPS_DISABLED` |
| Poor accuracy (>50m) | Reject with `GPS_LOW_ACCURACY` |
| No office configured | Reject with `NO_OFFICE_CONFIGURED` |
| Multiple offices within range | Use nearest; store `office_location_id` on record |
| Employee between two offices | Nearest office wins |

## Training Geofencing

Training sessions may optionally set `location_lat/lng` on `training_sessions`. When geo method is used:

- Same Haversine logic
- Default radius: 300m (or session-specific override in V2)

## Testing

Seed test office:
- Lat: `28.6139`, Lng: `77.2090` (example: New Delhi)
- Test coordinates inside (50m away) and outside (500m away)
