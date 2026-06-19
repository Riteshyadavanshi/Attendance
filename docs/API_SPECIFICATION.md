# API Specification

Base URL: `/api/v1`

Authentication: `Authorization: Bearer <access_token>`

Multi-tenant header (Super Admin only): `X-Org-Id: <organization_uuid>`

## Response Format

```json
{
  "success": true,
  "data": {},
  "message": "Optional message"
}
```

Error format:

```json
{
  "success": false,
  "error": {
    "code": "GEOFENCE_OUT_OF_RANGE",
    "message": "You are outside the allowed check-in area"
  }
}
```

---

## Auth

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/auth/login` | Public | Email + password login |
| POST | `/auth/refresh` | Authenticated | Refresh access token |
| POST | `/auth/logout` | Authenticated | Invalidate refresh token |
| POST | `/auth/mfa/setup` | Admin roles | Enable TOTP MFA |
| POST | `/auth/mfa/verify` | Authenticated | Verify MFA code |
| POST | `/auth/forgot-password` | Public | Request reset |
| POST | `/auth/reset-password` | Public | Reset with token |

### POST `/auth/login`

**Request:**
```json
{
  "email": "employee@demo.com",
  "password": "Demo@123",
  "mfa_code": "123456"
}
```

**Response:**
```json
{
  "access_token": "...",
  "refresh_token": "...",
  "expires_in": 1800,
  "user": {
    "id": "uuid",
    "email": "employee@demo.com",
    "roles": ["employee"],
    "organization_id": "uuid",
    "employee_id": "uuid"
  }
}
```

---

## Organizations (Super Admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/organizations` | List all organizations |
| POST | `/organizations` | Create organization |
| GET | `/organizations/{id}` | Get organization |
| PATCH | `/organizations/{id}` | Update organization |
| DELETE | `/organizations/{id}` | Deactivate organization |

---

## Departments

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/departments` | HR+ | List departments |
| POST | `/departments` | Super Admin | Create department |
| PATCH | `/departments/{id}` | Super Admin | Update |
| DELETE | `/departments/{id}` | Super Admin | Deactivate |

---

## Employees

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/employees` | HR+ | List employees (paginated) |
| POST | `/employees` | Super Admin | Create employee + user |
| GET | `/employees/{id}` | HR+ / Self | Get employee detail |
| PATCH | `/employees/{id}` | Super Admin | Update profile |
| DELETE | `/employees/{id}` | Super Admin | Deactivate |

---

## Face Enrollment

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/face/enroll` | Employee / HR | Upload 5-angle face images |
| GET | `/face/status` | Employee | Check enrollment status |
| POST | `/face/verify` | Employee | Verify face (pre-check-in) |

### POST `/face/enroll`

Multipart form: `front`, `left`, `right`, `up`, `down` image files.

---

## Office Locations & Geofencing

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/office-locations` | HR+ | List office locations |
| POST | `/office-locations` | Super Admin | Create location |
| PATCH | `/office-locations/{id}` | Super Admin | Update lat/lng/radius |
| DELETE | `/office-locations/{id}` | Super Admin | Deactivate |

---

## Attendance Rules

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/attendance-rules` | HR+ | Get org rules |
| PUT | `/attendance-rules` | Super Admin | Update rules |

---

## Attendance

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/attendance/check-in` | Employee | Check in with face + GPS |
| POST | `/attendance/check-out` | Employee | Check out with face + GPS |
| GET | `/attendance/today` | Employee | Today's status |
| GET | `/attendance/history` | Employee / HR | Paginated history |
| GET | `/attendance/dashboard` | HR+ | Dashboard aggregates |
| GET | `/attendance/live` | HR+ | WebSocket — live check-ins |

### POST `/attendance/check-in`

**Request:**
```json
{
  "face_image": "base64...",
  "latitude": 28.6139,
  "longitude": 77.2090,
  "device_info": {
    "platform": "android",
    "model": "Pixel 8",
    "os_version": "14"
  }
}
```

**Success Response:**
```json
{
  "attendance_id": "uuid",
  "status": "present",
  "check_in_at": "2026-06-18T09:05:00+05:30",
  "face_match_score": 0.92,
  "distance_meters": 45
}
```

**Error Codes:**
| Code | HTTP | Description |
|------|------|-------------|
| `FACE_NOT_MATCHED` | 403 | Face verification failed |
| `LIVENESS_FAILED` | 403 | Anti-spoofing check failed |
| `GEOFENCE_OUT_OF_RANGE` | 403 | Outside 300m radius |
| `ALREADY_CHECKED_IN` | 409 | Duplicate check-in |
| `FACE_NOT_ENROLLED` | 400 | Employee has no face profile |

---

## Attendance Corrections

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/attendance/corrections` | Employee | Request correction |
| GET | `/attendance/corrections` | HR+ | List pending |
| PATCH | `/attendance/corrections/{id}` | HR Manager | Approve/reject |

---

## Leave

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/leave` | Employee | Apply leave |
| GET | `/leave` | Employee / HR | List requests |
| PATCH | `/leave/{id}` | HR Manager | Approve/reject |

---

## Overtime

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/overtime/me` | Employee | My OT summary |
| GET | `/overtime/dashboard` | HR+ | Department/employee OT |
| GET | `/overtime/report` | HR+ | Filtered OT data |

---

## Training

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/trainings` | All | List trainings |
| POST | `/trainings` | HR Manager | Create training |
| GET | `/trainings/{id}` | All | Training detail |
| PATCH | `/trainings/{id}` | HR Manager | Update |
| POST | `/trainings/{id}/sessions` | HR Manager | Create session |
| POST | `/trainings/sessions/{id}/participants` | HR Manager | Assign participants |
| POST | `/trainings/sessions/{id}/attend` | Employee | Mark attendance |
| GET | `/trainings/sessions/{id}/qr` | HR Manager | Get QR token |

### POST `/trainings/sessions/{id}/attend`

```json
{
  "method": "face",
  "face_image": "base64...",
  "latitude": 28.6139,
  "longitude": 77.2090,
  "qr_token": "optional-for-qr-method"
}
```

---

## Feedback

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/feedback` | Employee | Submit feedback |
| GET | `/feedback/session/{session_id}` | HR+ | Session feedback list |
| GET | `/feedback/dashboard` | Head HR | Aggregated scores |

---

## Analytics (Head HR)

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/analytics/executive` | Head HR | Executive KPIs |
| GET | `/analytics/insights` | Head HR | AI insights |
| GET | `/analytics/recommendations` | Head HR | AI recommendations |
| GET | `/analytics/risk-scores` | Head HR | Employee risk scores |
| GET | `/analytics/top-performers` | Head HR | Ranked performers |

---

## Reports

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/reports/generate` | HR+ | Request async report |
| GET | `/reports/{id}` | HR+ | Report status |
| GET | `/reports/{id}/download` | HR+ | Signed download URL |

### POST `/reports/generate`

```json
{
  "type": "attendance",
  "format": "xlsx",
  "start_date": "2026-06-01",
  "end_date": "2026-06-30",
  "department_id": "optional-uuid"
}
```

---

## Notifications

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/notifications/register` | Authenticated | Register push token |
| DELETE | `/notifications/register` | Authenticated | Unregister token |
| GET | `/notifications` | Authenticated | Notification history |

---

## WebSocket Endpoints

| Endpoint | Role | Events |
|----------|------|--------|
| `/ws/attendance/live` | HR+ | `check_in`, `check_out`, `status_update` |
| `/ws/feedback/live` | Head HR | `feedback_submitted` |

---

## Pagination

Query params: `page=1&limit=20`

Response includes:
```json
{
  "items": [],
  "total": 150,
  "page": 1,
  "limit": 20,
  "pages": 8
}
```

## Rate Limits

| Endpoint Group | Limit |
|----------------|-------|
| Auth | 10 req/min per IP |
| Check-in/out | 5 req/min per user |
| General API | 100 req/min per user |
