# HR Attendance Web App

Next.js web client for employees and HR. Uses the same Render backend as the mobile app.

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Demo login: `employee@demo.com` / `Demo@123` (HR: `hr@demo.com`).

## Environment

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_BASE_URL` | Backend API base URL (no trailing slash) |

Production: `https://attendance-backend-0zqg.onrender.com`

## Deploy to Vercel

### Option A — GitHub (recommended)

1. Push this repo to GitHub (`Riteshyadavanshi/Attendance`).
2. [vercel.com/new](https://vercel.com/new) → Import the repo.
3. Set **Root Directory** to `web`.
4. Add environment variable:
   - `NEXT_PUBLIC_API_BASE_URL` = `https://attendance-backend-0zqg.onrender.com`
5. Deploy.

### Option B — Vercel CLI

```bash
cd web
vercel login
vercel link
vercel env add NEXT_PUBLIC_API_BASE_URL   # paste production backend URL
vercel --prod
```

Backend CORS is already `*` — no backend changes required.

## Features

- **Employee:** home, check-in/out (webcam + GPS), face enrollment, attendance history, profile, feedback forms
- **HR:** dashboard, employees, register, work hours, geofence, late today/leaderboard, feedback admin
- **Auth:** JWT in Zustand + cookie; middleware guards protected routes
