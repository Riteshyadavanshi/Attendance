# Development Setup

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 20 LTS |
| npm or yarn | Latest |
| Python | 3.11+ |
| PostgreSQL | 16 |
| Redis | 7 |
| Docker & Docker Compose | Latest |
| Android Studio | Latest (for Android) |
| Xcode | 15+ (for iOS, macOS only) |
| Java JDK | 17 |

## 1. Clone & Structure

```bash
git clone <repo-url> hr-attandence
cd hr-attandence
```

## 2. Infrastructure (Docker)

```bash
cd infrastructure/docker
docker compose up -d postgres redis
```

Default services:
- PostgreSQL: `localhost:5432`, db `hr_attendance`, user `hr_user`
- Redis: `localhost:6379`

## 3. Backend Setup

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Edit .env with DATABASE_URL, REDIS_URL, JWT_SECRET

alembic upgrade head
python ../scripts/seed_dev_data.py
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

## 4. AI Service Setup

```bash
cd ai
python -m venv .venv
source .venv/bin/activate  # or Windows equivalent
pip install -r requirements.txt
# Download face model weights to ai/face_service/models/
uvicorn face_service.main:app --reload --port 8001
```

## 5. Mobile Setup

```bash
cd mobile
npm install
cp .env.example .env
# Set API_BASE_URL=http://10.0.2.2:8000 (Android emulator)
# Set API_BASE_URL=http://localhost:8000 (iOS simulator)

# Android
npx react-native run-android

# iOS (macOS)
cd ios && pod install && cd ..
npx react-native run-ios
```

## 6. Web App Setup

```bash
cd web
npm install
cp .env.example .env.local
# Set NEXT_PUBLIC_API_BASE_URL=https://attendance-backend-0zqg.onrender.com
# Or http://localhost:8000 for local backend

npm run dev
```

Open http://localhost:3000 and log in with a seed user (e.g. `employee@demo.com` / `Demo@123`).

**Production (Vercel):** connect the GitHub repo with root directory `web`, set `NEXT_PUBLIC_API_BASE_URL` to the Render backend URL.

## 7. Verify Stack

| Check | Command / Action |
|-------|------------------|
| Backend health | `curl http://localhost:8000/health` |
| DB connected | Login via API docs |
| Redis connected | Check-in should not error on session |
| Mobile login | Use seed user `employee@demo.com` / `Demo@123` |
| Web login | Same credentials at http://localhost:3000 |

## Seed Users (Dev)

| Email | Role | Password |
|-------|------|----------|
| superadmin@demo.com | Super Admin | Demo@123 |
| hr@demo.com | HR Manager | Demo@123 |
| headhr@demo.com | Head HR | Demo@123 |
| employee@demo.com | Employee | Demo@123 |

## Common Issues

### Android cannot reach localhost API
Use `10.0.2.2` instead of `localhost` in mobile `.env`.

### Camera permission denied
Ensure `AndroidManifest.xml` and `Info.plist` include camera and location permissions.

### Face model missing
Download weights per [modules/FACE_RECOGNITION.md](modules/FACE_RECOGNITION.md).

## Dev Tools

```bash
# Backend lint
cd backend && ruff check . && black --check .

# Backend tests
pytest

# Mobile lint
cd mobile && npm run lint

# Mobile tests
npm test

# Web lint
cd web && npm run lint

# Web production build
cd web && npm run build
```
