# Role-Based Access Control (RBAC)

## Roles

| Role | Code | Scope |
|------|------|-------|
| Employee | `employee` | Self data only |
| HR Manager | `hr_manager` | Organization operational data |
| Head HR | `head_hr` | Organization analytics + all HR Manager permissions |
| Super Admin | `super_admin` | Platform-wide + all Head HR permissions |

Users may hold multiple roles. Permissions are the **union** of all assigned roles.

## Permission Matrix

| Resource / Action | Employee | HR Manager | Head HR | Super Admin |
|-------------------|:--------:|:----------:|:-------:|:-----------:|
| **Auth** |
| Login / logout | ✓ | ✓ | ✓ | ✓ |
| MFA setup | — | ✓ | ✓ | ✓ |
| **Own Profile** |
| View own profile | ✓ | ✓ | ✓ | ✓ |
| Edit own profile | ✓ | ✓ | ✓ | ✓ |
| **Face Enrollment** |
| Enroll own face | ✓ | ✓ | ✓ | ✓ |
| Enroll others' face | — | ✓ | ✓ | ✓ |
| **Attendance** |
| Check-in / check-out | ✓ | ✓ | ✓ | ✓ |
| View own history | ✓ | ✓ | ✓ | ✓ |
| View all attendance | — | ✓ | ✓ | ✓ |
| Live attendance map | — | ✓ | ✓ | ✓ |
| Request correction | ✓ | — | — | — |
| Approve correction | — | ✓ | ✓ | ✓ |
| **Leave** |
| Apply leave | ✓ | ✓ | ✓ | ✓ |
| View own leave | ✓ | ✓ | ✓ | ✓ |
| View all leave | — | ✓ | ✓ | ✓ |
| Approve/reject leave | — | ✓ | ✓ | ✓ |
| **Overtime** |
| View own OT | ✓ | ✓ | ✓ | ✓ |
| OT dashboard | — | ✓ | ✓ | ✓ |
| **Training** |
| View assigned trainings | ✓ | ✓ | ✓ | ✓ |
| Create/edit training | — | ✓ | ✓ | ✓ |
| Assign participants | — | ✓ | ✓ | ✓ |
| Mark training attendance | ✓ | ✓ | ✓ | ✓ |
| Training dashboard | — | ✓ | ✓ | ✓ |
| **Feedback** |
| Submit feedback | ✓ | ✓ | ✓ | ✓ |
| View session feedback | — | ✓ | ✓ | ✓ |
| Feedback analytics | — | — | ✓ | ✓ |
| **Analytics** |
| HR attendance dashboard | — | ✓ | ✓ | ✓ |
| Executive KPIs | — | — | ✓ | ✓ |
| AI insights | — | — | ✓ | ✓ |
| AI recommendations | — | — | ✓ | ✓ |
| Risk scores | — | — | ✓ | ✓ |
| **Reports** |
| Generate reports | — | ✓ | ✓ | ✓ |
| Download reports | — | ✓ | ✓ | ✓ |
| **Organization Admin** |
| Manage organizations | — | — | — | ✓ |
| Manage departments | — | — | — | ✓ |
| Manage employees | — | — | — | ✓ |
| Configure geofencing | — | — | — | ✓ |
| Configure attendance rules | — | — | — | ✓ |
| Manage holidays | — | — | — | ✓ |
| View audit logs | — | — | ✓ | ✓ |

## JWT Claims

```json
{
  "sub": "user_uuid",
  "org_id": "organization_uuid",
  "employee_id": "employee_uuid",
  "roles": ["hr_manager"],
  "exp": 1718700000
}
```

## Backend Enforcement

```python
# Dependency pattern
@router.get("/attendance/dashboard")
async def dashboard(
    user: User = Depends(require_roles(["hr_manager", "head_hr", "super_admin"]))
):
    ...
```

Rules:
1. Every query filters by `organization_id` from JWT
2. Employee role: additional filter `employee_id = current_user.employee_id`
3. Super Admin: may pass `X-Org-Id` to operate on any org
4. Deny by default — explicit role check on every protected endpoint

## Mobile Navigation Guards

| Navigator | Visible When |
|-----------|--------------|
| `EmployeeNavigator` | Always (base tabs) |
| `HRNavigator` | `hr_manager` OR `head_hr` OR `super_admin` |
| `HeadHRNavigator` | `head_hr` OR `super_admin` |
| `SuperAdminNavigator` | `super_admin` |

Route guard example:
```typescript
if (!user.roles.includes('hr_manager') && !user.roles.includes('head_hr')) {
  navigation.navigate('Unauthorized');
}
```

## MFA Policy

| Role | MFA Required (Production) |
|------|---------------------------|
| Employee | Optional |
| HR Manager | Required |
| Head HR | Required |
| Super Admin | Required |
