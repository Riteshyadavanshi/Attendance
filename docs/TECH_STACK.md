# Technology Stack

## Client — React Native

| Category | Library | Purpose |
|----------|---------|---------|
| Framework | React Native 0.76+ | Cross-platform mobile |
| Language | TypeScript | Type safety |
| Navigation | React Navigation 7 | Role-based stacks/tabs |
| State | Zustand + React Query | Local + server state |
| Forms | React Hook Form + Zod | Validation |
| Camera | react-native-vision-camera | Face capture |
| Maps | react-native-maps | Live attendance map |
| Location | @react-native-community/geolocation | GPS for geofencing |
| Charts | react-native-gifted-charts | Admin dashboards |
| QR | react-native-camera-kit | Training QR scan |
| Push | @react-native-firebase/messaging | FCM notifications |
| Storage | react-native-mmkv | Secure local cache |
| Biometrics | react-native-biometrics | Device unlock (optional) |
| File share | react-native-share | Report download/share |

## Backend — FastAPI

| Category | Library | Purpose |
|----------|---------|---------|
| Framework | FastAPI | Async REST API |
| ORM | SQLAlchemy 2.0 + Alembic | Database access & migrations |
| Validation | Pydantic v2 | Request/response schemas |
| Auth | python-jose, passlib | JWT, password hashing |
| MFA | pyotp | TOTP-based MFA |
| Tasks | ARQ or Celery | Background jobs |
| WebSocket | FastAPI WebSocket | Real-time dashboards |
| Reports | openpyxl, reportlab, pandas | Excel/PDF generation |
| Geo | geopy | Distance calculation |

## Database & Cache

| Component | Technology |
|-----------|------------|
| Primary DB | PostgreSQL 16 |
| Cache | Redis 7 |
| Migrations | Alembic |

## AI / ML

| Component | Technology |
|-----------|------------|
| Face embeddings | FaceNet (TensorFlow) or InsightFace |
| Liveness | OpenCV + custom blink/head-pose model |
| Anomaly detection | scikit-learn / simple statistical models (V1) |
| Inference hosting | Dedicated Python worker service |

## Infrastructure

| Component | Options |
|-----------|---------|
| Container | Docker |
| Orchestration | AWS ECS / Azure Container Apps / Kubernetes |
| Object storage | AWS S3 / Azure Blob |
| Secrets | AWS Secrets Manager / Azure Key Vault |
| CI/CD | GitHub Actions |
| Monitoring | Sentry, CloudWatch / Azure Monitor |

## Why Single React Native App

- One codebase for employee and admin flows
- Role-gated navigation reduces deployment complexity
- Native camera/GPS access required for attendance anyway
- HR admins can manage workforce from mobile/tablet in the field

## Version Pinning Policy

- Pin major versions in `package.json` and `requirements.txt`
- Security patches applied monthly
- React Native upgrades planned per release cycle
