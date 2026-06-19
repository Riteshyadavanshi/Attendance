# Backend Specification

FastAPI monolith with modular service layer. Async SQLAlchemy + Alembic migrations.

## Project Layout

```
backend/app/
├── main.py                 # FastAPI app, middleware, router mount
├── core/
│   ├── config.py           # Pydantic Settings from env
│   ├── security.py         # JWT, password hashing
│   ├── deps.py             # Dependency injection
│   ├── rbac.py             # Role decorators
│   └── exceptions.py       # Custom HTTP exceptions
├── models/                 # SQLAlchemy ORM models
├── schemas/                # Pydantic request/response
├── api/v1/                 # Route handlers (thin)
├── services/               # Business logic (fat)
├── workers/                # Background tasks
└── websockets/             # WebSocket handlers
```

## Layer Responsibilities

| Layer | Responsibility |
|-------|----------------|
| `api/v1/` | HTTP parsing, auth deps, call service, return schema |
| `services/` | Business rules, DB transactions, external calls |
| `models/` | Table definitions, relationships |
| `schemas/` | Input validation, output serialization |
| `workers/` | Async jobs: reports, analytics, notifications |

## Core Services

### `AuthService`
- Login, token issue/refresh/revoke
- MFA setup and verification
- Password reset flow

### `AttendanceService`
- Check-in/out orchestration
- Calls FaceService for verification
- Geofence validation
- Status classification
- Working hours computation

### `FaceService` (client to AI microservice)
- HTTP client to `ai/face_service`
- Encrypt/decrypt embeddings before DB storage

### `GeofenceService`
- Haversine distance calculation
- Nearest office location lookup

### `TrainingService`
- Training CRUD, session management
- QR token generation (JWT, 15-min expiry)
- Training attendance via face/QR/geo

### `OvertimeService`
- Daily OT computation (triggered by worker)
- Aggregation queries for dashboards

### `AnalyticsService`
- Risk score computation
- Trend aggregation
- Recommendation generation

### `ReportService`
- Queue report job
- Generate Excel/PDF/CSV
- Upload to S3, return signed URL

### `NotificationService`
- FCM/APNs dispatch
- Scheduled reminders via worker cron

## Middleware Stack

```python
app.add_middleware(CORSMiddleware, ...)
app.add_middleware(TenantMiddleware)      # Extract org_id from JWT
app.add_middleware(AuditMiddleware)         # Log admin mutations
app.add_middleware(RateLimitMiddleware)     # Redis-backed
```

## Background Workers

| Job | Schedule | Description |
|-----|----------|-------------|
| `compute_daily_overtime` | Daily 23:00 org TZ | OT for all employees |
| `compute_risk_scores` | Daily 02:00 | AI risk scores |
| `send_checkin_reminders` | Weekdays 08:45 | Push to non-checked-in |
| `send_checkout_reminders` | Weekdays 18:00 | Push to checked-in w/o checkout |
| `generate_report` | On demand | Async report generation |
| `expire_qr_tokens` | Every 5 min | Invalidate expired QR |

## Status Classification Logic

```python
def classify_attendance(check_in: datetime, rules: AttendanceRules, leave, holiday) -> str:
    if holiday: return "holiday"
    if leave: return "leave"
    if not check_in: return "absent"
    late_cutoff = rules.work_start_time + timedelta(minutes=rules.late_threshold_minutes)
    if check_in.time() > late_cutoff: return "late"
    return "present"
```

Half-day: set when `working_minutes < rules.half_day_threshold_hours * 60` at end of day.

## WebSocket Handler

```python
@router.websocket("/ws/attendance/live")
async def live_attendance(websocket, user=Depends(ws_auth)):
  await pubsub.subscribe(f"org:{user.org_id}:attendance")
  # Forward Redis pub/sub events to connected HR clients
```

## Database Sessions

- Async SQLAlchemy session per request
- Transaction boundary in service layer
- `organization_id` filter applied in repository base class

## Error Handling

Custom exceptions mapped to HTTP status:

| Exception | HTTP | Code |
|-----------|------|------|
| `FaceNotMatchedError` | 403 | `FACE_NOT_MATCHED` |
| `LivenessFailedError` | 403 | `LIVENESS_FAILED` |
| `GeofenceError` | 403 | `GEOFENCE_OUT_OF_RANGE` |
| `AlreadyCheckedInError` | 409 | `ALREADY_CHECKED_IN` |
| `ForbiddenError` | 403 | `FORBIDDEN` |
| `NotFoundError` | 404 | `NOT_FOUND` |

## API Versioning

- Current: `/api/v1`
- Breaking changes → `/api/v2` with deprecation header

## Health Endpoints

| Endpoint | Checks |
|----------|--------|
| `GET /health` | API alive |
| `GET /health/db` | PostgreSQL connection |
| `GET /health/redis` | Redis connection |
| `GET /health/face` | AI service reachable |
