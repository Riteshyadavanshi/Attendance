# HR Attendance — AI-Powered Smart Attendance & Workforce Management

Enterprise-grade, multi-tenant HRTech SaaS for facial-recognition attendance, geofencing, training management, and AI-driven workforce analytics.

## Stack

| Layer | Technology |
|-------|------------|
| Client (all roles) | React Native (Android + iOS) |
| Backend API | Python FastAPI |
| Database | PostgreSQL |
| Cache | Redis |
| Face AI | TensorFlow / FaceNet + OpenCV (liveness) |
| Cloud | AWS or Azure |

## Key Features

- Face recognition attendance with liveness detection
- GPS geofencing (300m radius)
- Check-in / check-out with automatic status classification
- Overtime calculation and dashboards
- Training attendance (face, QR, geo)
- Post-training feedback collection
- AI workforce insights and risk scoring
- Role-based admin dashboards inside the mobile app
- Reports export (Excel, PDF, CSV)

## User Roles

| Role | Access |
|------|--------|
| Employee | Check-in/out, history, training, feedback, leave |
| HR Manager | Attendance monitoring, training mgmt, corrections, reports |
| Head HR | Executive KPIs, AI insights, department analytics |
| Super Admin | Org setup, geofence config, attendance rules, platform admin |

## Repository Structure

```
hr-attandence/
├── mobile/          # React Native app (employee + admin)
├── backend/         # FastAPI services
├── ai/              # Face recognition & analytics models
├── docs/            # Build documentation (start here)
└── infrastructure/  # Docker, CI/CD, cloud configs
```

## Documentation

All build documentation lives in [`docs/`](docs/INDEX.md). Start with:

1. [Software Requirements (SRS)](docs/SRS.md)
2. [Architecture](docs/ARCHITECTURE.md)
3. [Development Setup](docs/DEVELOPMENT_SETUP.md)
4. [Implementation Roadmap](docs/ROADMAP.md)

## Quick Start (after scaffold)

```bash
# 1. Backend
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS/Linux
pip install -r requirements.txt
copy .env.example .env          # or cp on Unix

# 2. Database (SQLite dev default — no Docker required)
cd ..
python scripts/seed_dev_data.py

# 3. Run API
cd backend
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

**Demo logins:** `employee@demo.com`, `hr@demo.com`, `headhr@demo.com`, `superadmin@demo.com` — password `Demo@123`

```bash
# 4. Mobile (requires Android Studio / Xcode)
cd mobile
npm install
# Generate native projects if missing:
# npx @react-native-community/cli@latest init HrAttendance --directory . --skip-install
npm run android   # or npm run ios
```

Set `API_BASE_URL` in mobile env:
- Android emulator: `http://10.0.2.2:8000`
- iOS simulator: `http://localhost:8000`

```bash
# Optional: PostgreSQL + Redis via Docker (when Docker is running)
cd infrastructure/docker
docker compose up -d postgres redis
# Then set DATABASE_URL in backend/.env to PostgreSQL connection string
```

## License

Proprietary — All rights reserved.
