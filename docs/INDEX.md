# Documentation Index

Build documentation for the HR Attendance platform. Read in this order when starting development.

## 1. Requirements & Planning

| Document | Description |
|----------|-------------|
| [SRS.md](SRS.md) | Software Requirements Specification (V1.0) |
| [ROADMAP.md](ROADMAP.md) | Implementation phases A–F |

## 2. Architecture & Structure

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | System architecture, services, data flow |
| [TECH_STACK.md](TECH_STACK.md) | Technology choices and libraries |
| [MONOREPO_STRUCTURE.md](MONOREPO_STRUCTURE.md) | Folder layout and naming conventions |
| [DATA_FLOWS.md](DATA_FLOWS.md) | Key user and system flows |

## 3. Setup & Configuration

| Document | Description |
|----------|-------------|
| [DEVELOPMENT_SETUP.md](DEVELOPMENT_SETUP.md) | Local dev environment |
| [ENVIRONMENT.md](ENVIRONMENT.md) | Environment variables reference |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Production deployment guide |

## 4. Data & API

| Document | Description |
|----------|-------------|
| [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) | PostgreSQL schema, tables, indexes |
| [API_SPECIFICATION.md](API_SPECIFICATION.md) | REST API endpoints |
| [RBAC.md](RBAC.md) | Roles, permissions matrix |

## 5. Application Layers

| Document | Description |
|----------|-------------|
| [MOBILE_APP.md](MOBILE_APP.md) | React Native app structure, screens, navigation |
| [BACKEND.md](BACKEND.md) | FastAPI services, middleware, jobs |

## 6. Feature Modules

| Document | Description |
|----------|-------------|
| [modules/FACE_RECOGNITION.md](modules/FACE_RECOGNITION.md) | Face enrollment, verification, liveness |
| [modules/GEOFENCING.md](modules/GEOFENCING.md) | Office locations, 300m radius validation |
| [modules/ATTENDANCE.md](modules/ATTENDANCE.md) | Check-in/out, status classification |
| [modules/OVERTIME.md](modules/OVERTIME.md) | Overtime calculation and dashboards |
| [modules/LEAVE.md](modules/LEAVE.md) | Leave requests and approval |
| [modules/TRAINING.md](modules/TRAINING.md) | Training sessions, QR/face/geo attendance |
| [modules/FEEDBACK.md](modules/FEEDBACK.md) | Post-training feedback forms |
| [modules/AI_ANALYTICS.md](modules/AI_ANALYTICS.md) | Insights, risk scores, recommendations |
| [modules/NOTIFICATIONS.md](modules/NOTIFICATIONS.md) | Push notification system |
| [modules/REPORTS.md](modules/REPORTS.md) | Report generation and export |

## 7. Quality & Security

| Document | Description |
|----------|-------------|
| [SECURITY.md](SECURITY.md) | Auth, encryption, GDPR/DPDP compliance |
| [TESTING.md](TESTING.md) | Testing strategy and coverage targets |
