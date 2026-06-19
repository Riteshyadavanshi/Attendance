# Software Requirements Specification (V1.0)

## 1. Project Overview

Develop a mobile-first AI-powered Attendance Management System for organizations (100–100,000+ employees) supporting facial recognition, geofencing, training, feedback, and workforce analytics.

## 2. Technology Stack

| Component | Choice |
|-----------|--------|
| Mobile (all roles) | React Native — Android & iOS |
| Backend | Python FastAPI |
| Database | PostgreSQL |
| Cache | Redis |
| Face AI | TensorFlow / FaceNet + OpenCV |
| Cloud | AWS or Azure |

**Note:** Admin dashboards and management screens are inside the React Native app (no separate web admin).

## 3. User Roles

### Employee
- Login, face verification, check-in/out
- View attendance history, training sessions, working hours
- Submit training feedback, apply leave

### HR Manager
- View/monitor attendance and employee locations
- Manage training programs, review feedback
- Approve attendance corrections, generate reports

### Head HR
- Organization dashboard, training analytics
- Department performance, AI insights, workforce reports

### Super Admin
- Manage organizations, departments, employees
- Configure geofencing and attendance rules
- Access all reports

## 4. Face Recognition Module

### Enrollment
Capture: name, employee ID, department, designation, mobile, email.

Face angles: front, left, right, up, down. Store encrypted facial embeddings.

### Check-In Flow
1. Open app → Check-In
2. Capture selfie
3. Liveness detection
4. Compare face embedding
5. Verify GPS within geofence
6. Mark attendance

### Anti-Spoofing
Block: printed photos, screen photos, video replays, deepfakes.

Validate: eye movement, blink detection, head movement, facial depth.

## 5. Geofencing

- Admin sets office latitude/longitude
- Attendance radius: **300 meters (0.3 km)**
- Required: face verified + GPS enabled + within radius
- Otherwise: attendance **rejected**

## 6. Check-In / Check-Out

Capture per event: face, GPS, timestamp, device information.

### Attendance Status (auto-classified)
Present, Late, Half Day, Absent, Holiday, Leave

### Working Hours
`Working Hours = Check-Out Time − Check-In Time`

## 7. Overtime

- Admin configures standard working hours (e.g. 8 hours)
- `Overtime = Worked Hours − Standard Hours`
- Track: daily, weekly, monthly, department-wise OT

## 8. Training Module

Separate from office attendance.

HR creates training, assigns participants, sets schedule, uploads materials.

Attendance methods: face recognition, QR code scan, geo validation.

Metrics: attendance %, completion %, session duration, participation rate.

## 9. Feedback System

Post-training form:
- Trainer rating (1–5)
- Training content rating (1–5)
- Practical value (1–5)
- Suggestions (text)

Head HR dashboard: live feedback, satisfaction scores, negative feedback alerts.

## 10. AI HR Intelligence

### Attendance Insights
Frequent late arrivals, trends, high absenteeism, employee risk scores.

### Workforce Analytics
Top performers (attendance + training + feedback).

### Risk Prediction
Absenteeism, attrition risk, low engagement.

### Recommendations
Employees needing training, high-risk absentee employees, low-attendance departments, workforce optimization.

## 11. Dashboards (In-App)

### HR Manager
Total employees, present/absent today, late arrivals, remote employees, active check-ins, real-time attendance map, OT dashboard, training dashboard.

### Head HR
Attendance %, productivity score, engagement, training effectiveness, department performance, AI recommendations.

## 12. Reports

| Type | Granularity | Export |
|------|-------------|--------|
| Attendance | Daily / weekly / monthly | Excel, PDF, CSV |
| Overtime | Employee / department | Excel, PDF, CSV |
| Training | Attendance, feedback, completion | Excel, PDF, CSV |

## 13. Notifications

**Employees:** check-in reminder, check-out reminder, training reminder.

**HR:** attendance alerts, missing attendance, feedback alerts.

## 14. Security & Compliance

- JWT authentication, MFA, RBAC
- Encrypted facial data, secure cloud storage
- Audit logs
- GDPR-ready, Indian DPDP Act compliance

## 15. Future Enhancements (Post-V1)

- AI productivity score
- HR chatbot (leave balance, attendance, training status)
- Predictive workforce analytics (attrition, hiring, skill gaps)

## 16. Deliverables

1. Single React Native app (employee + all admin roles)
2. AI face recognition + liveness engine
3. Geofencing module (300m)
4. Training management system
5. Feedback management module
6. Overtime management system
7. Reporting engine
8. AI analytics & recommendation engine
9. FastAPI backend + PostgreSQL + Redis
