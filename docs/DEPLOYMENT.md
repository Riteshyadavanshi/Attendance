# Deployment Guide

## Environments

| Environment | Purpose | URL Pattern |
|-------------|---------|-------------|
| development | Local dev | localhost |
| staging | QA / UAT | staging-api.example.com |
| production | Live | api.example.com |

## Architecture (Production)

```
                    ┌─────────────┐
                    │ CloudFront  │ (optional CDN for reports)
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │     ALB     │
                    └──────┬──────┘
              ┌────────────┼────────────┐
              │            │            │
        ┌─────▼────┐ ┌─────▼────┐ ┌────▼─────┐
        │ API Pod  │ │ API Pod  │ │ API Pod  │  (auto-scaling)
        └─────┬────┘ └─────┬────┘ └────┬─────┘
              │            │            │
        ┌─────▼────────────▼────────────▼─────┐
        │  RDS PostgreSQL    ElastiCache Redis  │
        └───────────────────────────────────────┘
              │
        ┌─────▼────┐     ┌──────────┐
        │ S3 Bucket│     │Face Worker│
        └──────────┘     └──────────┘
```

## Docker Images

| Image | Dockerfile |
|-------|------------|
| Backend API | `infrastructure/docker/Dockerfile.backend` |
| AI Face Service | `infrastructure/docker/Dockerfile.ai` |

### docker-compose (Staging)

```yaml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: hr_attendance
      POSTGRES_USER: hr_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine

  backend:
    build:
      context: ../../backend
      dockerfile: ../infrastructure/docker/Dockerfile.backend
    environment:
      DATABASE_URL: postgresql+asyncpg://hr_user:${DB_PASSWORD}@postgres:5432/hr_attendance
      REDIS_URL: redis://redis:6379/0
    ports:
      - "8000:8000"
    depends_on:
      - postgres
      - redis

  ai:
    build:
      context: ../../ai
      dockerfile: ../infrastructure/docker/Dockerfile.ai
    ports:
      - "8001:8001"
```

## Database Migrations

```bash
# Staging / Production deploy
alembic upgrade head
```

- Always backup before migration in production
- Test migrations on staging first
- No destructive migrations without rollback plan

## AWS Deployment (Recommended)

| Service | AWS Product |
|---------|-------------|
| API | ECS Fargate or EKS |
| Database | RDS PostgreSQL 16 |
| Cache | ElastiCache Redis |
| Storage | S3 |
| Secrets | Secrets Manager |
| Push | SNS → FCM/APNs |
| DNS | Route 53 |
| TLS | ACM certificate |
| Monitoring | CloudWatch + Sentry |

### Region
- India orgs: `ap-south-1` (Mumbai) for DPDP data localization
- Global: choose nearest region

## Mobile App Deployment

### Android
1. Generate release keystore
2. Configure `android/app/build.gradle` signing
3. Build: `cd android && ./gradlew bundleRelease`
4. Upload AAB to Google Play Console
5. Configure FCM in Firebase Console

### iOS
1. Configure signing in Xcode
2. Archive and upload to App Store Connect
3. Configure APNs key in Apple Developer portal
4. Submit for review

### App Config per Environment

| Flavor | `API_BASE_URL` |
|--------|----------------|
| staging | `https://staging-api.example.com` |
| production | `https://api.example.com` |

## CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
on:
  push:
    tags: ['v*']

jobs:
  deploy-backend:
    steps:
      - run: docker build -t hr-backend:${{ github.ref_name }}
      - run: docker push ...
      - run: aws ecs update-service --force-new-deployment

  deploy-ai:
    steps:
      - run: docker build -t hr-ai:${{ github.ref_name }}
      - run: aws ecs update-service --force-new-deployment
```

## Health Checks

| Endpoint | ALB Check |
|----------|-----------|
| `GET /health` | 200, interval 30s |

## Scaling

| Metric | Scale Trigger |
|--------|---------------|
| API CPU > 70% | Add replica |
| API memory > 80% | Add replica |
| Check-in queue depth | Add face worker |

Auto-scaling: min 2, max 10 API replicas.

## Backup & Recovery

| Component | Backup | Retention |
|-----------|--------|-----------|
| PostgreSQL | RDS automated daily | 30 days |
| Redis | Snapshot daily | 7 days |
| S3 reports | Versioning enabled | 90 days |

RTO: 4 hours. RPO: 24 hours.

## Rollback

```bash
# ECS rollback to previous task definition
aws ecs update-service --cluster hr-cluster --service api \
  --task-definition hr-backend:PREVIOUS_REVISION
```

## Production Checklist

- [ ] Environment variables in Secrets Manager
- [ ] TLS certificate active
- [ ] Database migrated
- [ ] Redis accessible from API only
- [ ] S3 bucket private with IAM policy
- [ ] FCM/APNs configured
- [ ] Sentry DSN set
- [ ] Rate limiting enabled
- [ ] MFA enforced for admins
- [ ] Backup verified
- [ ] Load test passed
- [ ] App store builds uploaded

## Monitoring Alerts

| Alert | Threshold |
|-------|-----------|
| API error rate | > 1% for 5 min |
| Check-in failure rate | > 10% for 10 min |
| DB connections | > 80% pool |
| Face service latency | p99 > 5s |
| Disk usage | > 85% |
