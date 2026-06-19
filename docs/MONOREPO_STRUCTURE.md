# Monorepo Structure

```
hr-attandence/
├── README.md
├── CONTRIBUTING.md
├── docs/                          # Build documentation
│
├── mobile/                        # React Native app
│   ├── src/
│   │   ├── app/                   # App entry, providers
│   │   ├── navigation/            # Role-based navigators
│   │   │   ├── RootNavigator.tsx
│   │   │   ├── EmployeeNavigator.tsx
│   │   │   ├── HRNavigator.tsx
│   │   │   ├── HeadHRNavigator.tsx
│   │   │   └── SuperAdminNavigator.tsx
│   │   ├── screens/
│   │   │   ├── auth/
│   │   │   ├── employee/
│   │   │   ├── hr/
│   │   │   ├── head-hr/
│   │   │   └── super-admin/
│   │   ├── components/            # Shared UI components
│   │   ├── hooks/
│   │   ├── services/              # API client
│   │   ├── store/                 # Zustand stores
│   │   ├── utils/
│   │   ├── constants/
│   │   └── types/
│   ├── android/
│   ├── ios/
│   ├── package.json
│   └── .env.example
│
├── backend/
│   ├── app/
│   │   ├── main.py                # FastAPI entry
│   │   ├── core/                  # Config, security, deps
│   │   ├── models/                # SQLAlchemy models
│   │   ├── schemas/               # Pydantic schemas
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── auth.py
│   │   │       ├── attendance.py
│   │   │       ├── employees.py
│   │   │       ├── organizations.py
│   │   │       ├── training.py
│   │   │       ├── feedback.py
│   │   │       ├── reports.py
│   │   │       ├── analytics.py
│   │   │       └── notifications.py
│   │   ├── services/              # Business logic
│   │   ├── workers/               # Background jobs
│   │   └── websockets/            # Real-time handlers
│   ├── alembic/                   # DB migrations
│   ├── tests/
│   ├── requirements.txt
│   └── .env.example
│
├── ai/
│   ├── face_service/              # Face enrollment & verification
│   │   ├── models/
│   │   ├── liveness/
│   │   └── inference.py
│   ├── analytics/                 # Risk scores, recommendations
│   └── requirements.txt
│
├── infrastructure/
│   ├── docker/
│   │   ├── Dockerfile.backend
│   │   ├── Dockerfile.ai
│   │   └── docker-compose.yml
│   ├── terraform/                 # Cloud IaC (optional)
│   └── github/
│       └── workflows/
│           ├── backend-ci.yml
│           └── mobile-ci.yml
│
└── scripts/
    ├── seed_dev_data.py
    └── generate_api_client.sh
```

## Naming Conventions

| Area | Convention | Example |
|------|------------|---------|
| API routes | kebab-case plural | `/api/v1/attendance-records` |
| DB tables | snake_case plural | `attendance_records` |
| Python modules | snake_case | `attendance_service.py` |
| React components | PascalCase | `CheckInScreen.tsx` |
| React hooks | camelCase with `use` | `useAttendance.ts` |
| Env vars | SCREAMING_SNAKE | `DATABASE_URL` |

## Module Boundaries

- **mobile/** talks only to **backend/** via REST/WebSocket
- **backend/** calls **ai/** via internal HTTP or message queue
- No direct mobile → ai communication
- Shared types: generate OpenAPI client for mobile from FastAPI schema
