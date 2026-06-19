# Mobile App Specification

Single React Native app serving all roles with role-gated navigation.

## App Architecture

```
App.tsx
├── Providers (Auth, Query, Theme)
└── RootNavigator
    ├── AuthStack (unauthenticated)
    └── MainApp (authenticated)
        ├── EmployeeTabs
        ├── HRStack (if hr_manager+)
        ├── HeadHRStack (if head_hr+)
        └── SuperAdminStack (if super_admin)
```

## Navigation Structure

### Employee Tabs (All Users)

| Tab | Screen | Description |
|-----|--------|-------------|
| Home | `HomeScreen` | Today's status, quick check-in/out |
| Attendance | `AttendanceHistoryScreen` | Calendar + history list |
| Training | `TrainingListScreen` | Assigned trainings |
| Leave | `LeaveScreen` | Apply/view leave |
| Profile | `ProfileScreen` | Settings, face enrollment |

### HR Manager Screens (Additional)

| Screen | Description |
|--------|-------------|
| `HRDashboardScreen` | Widgets: present, absent, late, active |
| `LiveMapScreen` | Real-time employee locations |
| `EmployeeListScreen` | Searchable employee list |
| `AttendanceDetailScreen` | Employee attendance detail |
| `CorrectionRequestsScreen` | Approve/reject corrections |
| `TrainingManageScreen` | Create/edit trainings |
| `TrainingSessionScreen` | Session detail + QR display |
| `FeedbackReviewScreen` | Session feedback list |
| `OTDashboardScreen` | Overtime charts |
| `ReportsScreen` | Generate/download reports |

### Head HR Screens (Additional)

| Screen | Description |
|--------|-------------|
| `ExecutiveDashboardScreen` | KPI cards |
| `DepartmentPerformanceScreen` | Dept comparison charts |
| `AIInsightsScreen` | Trends, risk alerts |
| `RecommendationsScreen` | AI suggestions list |
| `TopPerformersScreen` | Ranked employee list |
| `FeedbackAnalyticsScreen` | Live feedback scores |

### Super Admin Screens (Additional)

| Screen | Description |
|--------|-------------|
| `OrgListScreen` | Manage organizations |
| `DepartmentManageScreen` | CRUD departments |
| `EmployeeManageScreen` | CRUD employees |
| `GeofenceConfigScreen` | Office locations map |
| `AttendanceRulesScreen` | Work hours, late rules |
| `HolidayManageScreen` | Org holidays |
| `AuditLogScreen` | Admin action log |

## Key Flows

### Check-In Flow

```
HomeScreen → CheckInScreen
  → CameraCapture (vision-camera)
  → LivenessPrompt (blink / head turn)
  → LocationCapture (GPS)
  → API POST /attendance/check-in
  → Success / Error modal
```

### Face Enrollment Flow

```
ProfileScreen → FaceEnrollScreen
  → Step 1: Front → Step 2: Left → ... → Step 5: Down
  → API POST /face/enroll
  → EnrollmentCompleteScreen
```

### Training QR Check-In

```
TrainingDetailScreen → QRScanScreen
  → API POST /trainings/sessions/{id}/attend { method: "qr" }
```

## Folder Structure

```
mobile/src/
├── navigation/
├── screens/
│   ├── auth/
│   ├── employee/
│   ├── hr/
│   ├── head-hr/
│   └── super-admin/
├── components/
│   ├── attendance/
│   ├── face/
│   ├── charts/
│   ├── maps/
│   └── ui/
├── services/
│   ├── api.ts
│   ├── auth.ts
│   └── websocket.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useAttendance.ts
│   └── useLocation.ts
├── store/
│   └── authStore.ts
└── types/
    └── api.ts          # Generated from OpenAPI
```

## State Management

| State Type | Tool |
|------------|------|
| Auth session | Zustand (`authStore`) |
| Server data | React Query (cache, refetch) |
| Form state | React Hook Form |
| Ephemeral UI | React useState |

## Permissions (Native)

### Android (`AndroidManifest.xml`)
- `CAMERA`
- `ACCESS_FINE_LOCATION`
- `ACCESS_COARSE_LOCATION`
- `INTERNET`
- `POST_NOTIFICATIONS`

### iOS (`Info.plist`)
- `NSCameraUsageDescription`
- `NSLocationWhenInUseUsageDescription`
- `NSLocationAlwaysUsageDescription` (if background needed)

## Responsive Layout

| Breakpoint | Layout |
|------------|--------|
| Phone (< 768px) | Single column, bottom tabs |
| Tablet (≥ 768px) | Two-column dashboard grids, side navigation for admin |

## Error Handling

| Error Code | User Message |
|------------|--------------|
| `FACE_NOT_MATCHED` | "Face verification failed. Please try again." |
| `LIVENESS_FAILED` | "Liveness check failed. Look at the camera naturally." |
| `GEOFENCE_OUT_OF_RANGE` | "You are outside the office area (300m)." |
| `ALREADY_CHECKED_IN` | "You have already checked in today." |

## Offline Behavior (V1)

- Check-in requires network (face verification is server-side)
- Cache attendance history for read-only offline viewing
- Queue leave requests if offline (sync on reconnect) — optional Phase C

## Build Flavors

| Flavor | API URL | Purpose |
|--------|---------|---------|
| development | localhost / staging | Dev |
| staging | staging API | QA |
| production | production API | App stores |
