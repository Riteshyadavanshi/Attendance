# Data Flows

## 1. Employee Check-In Flow

```mermaid
sequenceDiagram
    participant E as Employee_App
    participant API as FastAPI
    participant AI as Face_Service
    participant DB as PostgreSQL
    participant R as Redis

    E->>E: Open camera, capture selfie
    E->>E: Get GPS coordinates
    E->>API: POST /attendance/check-in
    API->>AI: Verify face + liveness
    AI-->>API: match_score, liveness_score
    API->>DB: Load face_profile for employee
    API->>API: Compare embeddings
    API->>DB: Load office_locations
    API->>API: Haversine distance check
    alt All checks pass
        API->>DB: Insert/update attendance_record
        API->>R: Publish attendance event
        API-->>E: 200 success + status
    else Face or geo fails
        API-->>E: 403 error code
    end
```

## 2. Face Enrollment Flow

```mermaid
sequenceDiagram
    participant E as Employee_App
    participant API as FastAPI
    participant AI as Face_Service
    participant S3 as Object_Storage
    participant DB as PostgreSQL

    E->>E: Capture 5 face angles
    E->>API: POST /face/enroll (multipart)
    API->>AI: Extract embeddings per angle
    AI-->>API: 5 embedding vectors
    API->>API: Encrypt embeddings AES-256
    API->>DB: Upsert face_profiles
    API->>DB: Set employee.face_enrolled = true
    API-->>E: Enrollment complete
```

## 3. HR Live Attendance Map

```mermaid
sequenceDiagram
    participant HR as HR_App
    participant WS as WebSocket
    participant R as Redis
    participant API as FastAPI

    HR->>WS: Connect /ws/attendance/live
    WS->>R: Subscribe org attendance channel
    Note over API,R: On check-in event
    API->>R: Publish check_in event
    R->>WS: Event payload
    WS->>HR: Push employee location + status
    HR->>HR: Update map markers
```

## 4. Training QR Attendance

```mermaid
sequenceDiagram
    participant HR as HR_App
    participant E as Employee_App
    participant API as FastAPI
    participant DB as PostgreSQL

    HR->>API: GET /trainings/sessions/{id}/qr
    API->>DB: Generate time-limited qr_token
    API-->>HR: Display QR code
    E->>E: Scan QR code
    E->>API: POST /attend { method: qr, qr_token }
    API->>API: Validate token not expired
    API->>DB: Insert training_attendance
    API-->>E: Attendance marked
```

## 5. Overtime Computation (Nightly Job)

```mermaid
flowchart TD
    A[Cron_trigger_23:00] --> B[Load_attendance_records_for_day]
    B --> C{Has_check_in_and_out?}
    C -->|No| D[Skip_or_mark_incomplete]
    C -->|Yes| E[Calculate_worked_minutes]
    E --> F[Load_attendance_rules.standard_hours]
    F --> G{worked > standard?}
    G -->|Yes| H[overtime = worked - standard]
    G -->|No| I[overtime = 0]
    H --> J[Upsert_overtime_records]
    I --> J
```

## 6. Report Generation

```mermaid
sequenceDiagram
    participant U as HR_App
    participant API as FastAPI
    participant W as Worker
    participant DB as PostgreSQL
    participant S3 as Object_Storage

    U->>API: POST /reports/generate
    API->>W: Queue report job
    API-->>U: report_id + status pending
    W->>DB: Query report data
    W->>W: Generate xlsx/pdf/csv
    W->>S3: Upload file
    W->>DB: Update status = ready
    U->>API: GET /reports/{id}
    API-->>U: status ready + download URL
    U->>U: Share via OS share sheet
```

## 7. AI Risk Score Computation

```mermaid
flowchart TD
    A[Nightly_job] --> B[For_each_active_employee]
    B --> C[Last_30_days_attendance]
    C --> D[Compute_absenteeism_rate]
    C --> E[Compute_late_frequency]
    B --> F[Training_participation_rate]
    B --> G[Avg_feedback_scores]
    D --> H[Weighted_risk_formula]
    E --> H
    F --> H
    G --> H
    H --> I[Upsert_employee_risk_scores]
    I --> J[Generate_ai_recommendations_if_threshold_exceeded]
```

## 8. Push Notification Flow

```mermaid
sequenceDiagram
    participant Cron as Scheduler
    participant API as FastAPI
    participant DB as PostgreSQL
    participant FCM as FCM_APNs
    participant E as Employee_App

    Cron->>API: Trigger check-in reminder
    API->>DB: Employees not checked in today
    API->>DB: Load notification_tokens
    API->>FCM: Send push batch
    FCM->>E: Notification delivered
```

## 9. Attendance Correction Approval

```mermaid
sequenceDiagram
    participant E as Employee_App
    participant HR as HR_App
    participant API as FastAPI
    participant DB as PostgreSQL

    E->>API: POST /attendance/corrections
    API->>DB: Insert correction status=pending
    HR->>API: GET /attendance/corrections
    HR->>API: PATCH /corrections/{id} approve
    API->>DB: Update attendance_record times
    API->>DB: Set correction status=approved
    API->>E: Push notification
```

## 10. Multi-Tenant Request Isolation

Every authenticated request:

1. Extract `org_id` from JWT
2. Apply `WHERE organization_id = :org_id` on all queries
3. Super Admin may override via `X-Org-Id` header
4. Reject cross-tenant resource access with 404
