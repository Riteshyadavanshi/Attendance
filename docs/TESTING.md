# Testing Strategy

## Coverage Targets

| Layer | Target Coverage |
|-------|-----------------|
| Backend services | ≥ 80% |
| API endpoints | ≥ 70% |
| Mobile utilities/hooks | ≥ 60% |
| AI face service | ≥ 70% |
| E2E critical flows | 100% of listed flows |

## Test Pyramid

```
        /  E2E  \          ← Few, critical paths
       / Integration \     ← API + DB + Redis
      /   Unit Tests   \   ← Services, utils, classifiers
```

## Backend Testing

### Framework
- pytest + pytest-asyncio
- httpx for API test client
- Factory Boy for test data
- Testcontainers for PostgreSQL + Redis (integration)

### Unit Tests

| Module | Key Tests |
|--------|-----------|
| `GeofenceService` | Inside/outside 300m, multiple offices |
| `AttendanceService` | Status classification, working hours |
| `OvertimeService` | OT calculation edge cases |
| `AuthService` | Login, token refresh, MFA |
| `RBAC` | Role enforcement per endpoint |

### Integration Tests

| Flow | Test |
|------|------|
| Check-in happy path | Face mock pass + geo inside → record created |
| Check-in face fail | Mock fail → 403 FACE_NOT_MATCHED |
| Check-in geo fail | Mock outside → 403 GEOFENCE_OUT_OF_RANGE |
| Leave approval | Status updates, attendance marked leave |
| Training QR | Valid token → attendance; expired → fail |
| Report generation | Job completes, file uploaded |

### Example

```python
async def test_checkin_inside_geofence(client, employee_token, mock_face_pass):
    response = await client.post(
        "/api/v1/attendance/check-in",
        headers={"Authorization": f"Bearer {employee_token}"},
        json={"face_image": "base64...", "latitude": 28.6140, "longitude": 77.2091},
    )
    assert response.status_code == 200
    assert response.json()["data"]["status"] in ("present", "late")
```

## AI Service Testing

| Test | Description |
|------|-------------|
| Enrollment | 5 valid images → 5 embeddings |
| No face | Image without face → error |
| Liveness pass | Valid blink sequence → pass |
| Liveness fail | Static image → fail |
| Match score | Same person > threshold, different < threshold |

Use fixed test images in `ai/tests/fixtures/`.

## Mobile Testing

### Framework
- Jest + React Native Testing Library
- Detox or Maestro for E2E

### Unit Tests

| Area | Tests |
|------|-------|
| `formatMinutes` | Display formatting |
| `useAuth` hook | Token storage, refresh |
| Navigation guards | Role-based route access |
| API client | Error handling, retry |

### E2E Critical Flows

| Flow | Tool |
|------|------|
| Login → Home | Maestro |
| Check-in (mocked API) | Maestro |
| Face enrollment wizard | Maestro |
| HR dashboard load | Maestro |
| Training QR scan | Maestro |

## Load Testing

Tool: k6 or Locust

| Scenario | Target |
|----------|--------|
| Concurrent check-ins | 1000 simultaneous |
| Dashboard API | 500 req/sec |
| Report generation | 50 concurrent jobs |
| WebSocket connections | 200 concurrent HR clients |

Run before production deployment (Phase F).

## CI Pipeline

```yaml
# On every PR
- backend: ruff, black, pytest
- mobile: eslint, tsc, jest
- ai: pytest

# On merge to develop
- integration tests with testcontainers
- build Docker images

# On release tag
- E2E suite
- load test (staging)
```

## Test Data

`scripts/seed_dev_data.py` creates:
- 1 organization
- 4 departments
- 50 employees
- 4 role users (see DEVELOPMENT_SETUP.md)
- 1 office location
- 30 days attendance history

## Mocking Strategy

| Dependency | Mock In Tests |
|------------|---------------|
| Face AI service | httpx mock returning fixed scores |
| FCM/APNs | Mock notification sender |
| S3 | moto or local filesystem |
| GPS (mobile) | Mock geolocation provider |

## Bug Severity

| Severity | SLA |
|----------|-----|
| P0 — Check-in broken | Fix within 4 hours |
| P1 — Admin dashboard down | Fix within 24 hours |
| P2 — Report export fail | Fix within 3 days |
| P3 — UI cosmetic | Next sprint |
