# Environment Variables

## Backend (`backend/.env`)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `APP_ENV` | Yes | Environment name | `development` |
| `DATABASE_URL` | Yes | PostgreSQL connection string | `postgresql+asyncpg://hr_user:pass@localhost:5432/hr_attendance` |
| `REDIS_URL` | Yes | Redis connection string | `redis://localhost:6379/0` |
| `JWT_SECRET` | Yes | Signing key for access tokens | Random 64-char string |
| `JWT_ALGORITHM` | Yes | Token algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Yes | Access token TTL | `30` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Yes | Refresh token TTL | `7` |
| `FACE_SERVICE_URL` | Yes | AI face service base URL | `http://localhost:8001` |
| `FACE_MATCH_THRESHOLD` | Yes | Cosine similarity threshold | `0.6` |
| `LIVENESS_THRESHOLD` | Yes | Minimum liveness score | `0.85` |
| `GEOFENCE_DEFAULT_RADIUS_M` | Yes | Default geofence radius | `300` |
| `S3_BUCKET` | Prod | Face/report storage bucket | `hr-attendance-prod` |
| `S3_REGION` | Prod | AWS region | `ap-south-1` |
| `AWS_ACCESS_KEY_ID` | Prod | AWS credentials | — |
| `AWS_SECRET_ACCESS_KEY` | Prod | AWS credentials | — |
| `FCM_SERVER_KEY` | Prod | Firebase Cloud Messaging | — |
| `APNS_KEY_ID` | Prod | Apple Push Notification key | — |
| `APNS_TEAM_ID` | Prod | Apple Developer Team ID | — |
| `APNS_BUNDLE_ID` | Prod | iOS app bundle ID | `com.company.hrattendance` |
| `ENCRYPTION_KEY` | Yes | AES-256 key for face embeddings | 32-byte base64 |
| `CORS_ORIGINS` | Yes | Allowed origins (dev) | `*` |
| `MFA_ISSUER` | Yes | TOTP issuer name | `HR Attendance` |
| `SENTRY_DSN` | No | Error tracking | — |

## AI Service (`ai/.env`)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `FACE_MODEL_PATH` | Yes | Path to FaceNet weights | `./face_service/models/facenet.pb` |
| `LIVENESS_MODEL_PATH` | Yes | Liveness model path | `./face_service/liveness/model.onnx` |
| `MAX_IMAGE_SIZE_MB` | Yes | Upload limit | `5` |
| `GPU_ENABLED` | No | Use GPU inference | `false` |

## Mobile (`mobile/.env`)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `API_BASE_URL` | Yes | Backend API URL | `http://10.0.2.2:8000` |
| `WS_BASE_URL` | Yes | WebSocket URL | `ws://10.0.2.2:8000` |
| `GOOGLE_MAPS_API_KEY` | Yes | Maps API key (Android) | — |
| `ENV` | Yes | Environment | `development` |

## Security Notes

- Never commit `.env` files
- Use `.env.example` with placeholder values only
- Rotate `JWT_SECRET` and `ENCRYPTION_KEY` per environment
- Production secrets via AWS Secrets Manager or Azure Key Vault

## Example `.env.example` (Backend)

```env
APP_ENV=development
DATABASE_URL=postgresql+asyncpg://hr_user:hr_pass@localhost:5432/hr_attendance
REDIS_URL=redis://localhost:6379/0
JWT_SECRET=change-me-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
FACE_SERVICE_URL=http://localhost:8001
FACE_MATCH_THRESHOLD=0.6
LIVENESS_THRESHOLD=0.85
GEOFENCE_DEFAULT_RADIUS_M=300
ENCRYPTION_KEY=change-me-32-byte-base64-key
CORS_ORIGINS=*
MFA_ISSUER=HR Attendance
```
