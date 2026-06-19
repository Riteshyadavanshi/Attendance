# Contributing Guide

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready releases |
| `develop` | Integration branch |
| `feature/<name>` | New features |
| `fix/<name>` | Bug fixes |
| `release/<version>` | Release preparation |

## Commit Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(attendance): add geofence validation on check-in
fix(face): improve liveness blink detection threshold
docs(api): document training attendance endpoints
chore(ci): add backend test workflow
```

Prefixes: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`.

## Pull Request Checklist

- [ ] Code follows project structure in [MONOREPO_STRUCTURE.md](docs/MONOREPO_STRUCTURE.md)
- [ ] API changes documented in [API_SPECIFICATION.md](docs/API_SPECIFICATION.md)
- [ ] Database changes reflected in [DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) + migration
- [ ] RBAC permissions updated in [RBAC.md](docs/RBAC.md) if access changes
- [ ] Tests added per [TESTING.md](docs/TESTING.md)
- [ ] No secrets committed; env vars documented in [ENVIRONMENT.md](docs/ENVIRONMENT.md)
- [ ] Security-sensitive changes reviewed against [SECURITY.md](docs/SECURITY.md)

## Code Style

### Python (Backend)

- Formatter: `black`
- Linter: `ruff`
- Type hints required on public functions
- Max line length: 100

### TypeScript (Mobile)

- ESLint + Prettier
- Strict TypeScript (`strict: true`)
- Functional components with hooks
- No `any` without justification comment

## Local Development

See [DEVELOPMENT_SETUP.md](docs/DEVELOPMENT_SETUP.md).

## Module Ownership

| Area | Doc Reference |
|------|---------------|
| Mobile screens | [MOBILE_APP.md](docs/MOBILE_APP.md) |
| API endpoints | [API_SPECIFICATION.md](docs/API_SPECIFICATION.md) |
| Face AI | [modules/FACE_RECOGNITION.md](docs/modules/FACE_RECOGNITION.md) |
| Attendance logic | [modules/ATTENDANCE.md](docs/modules/ATTENDANCE.md) |
