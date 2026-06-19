from fastapi import APIRouter

from app.api.v1 import (
    analytics,
    attendance,
    attendance_rules,
    auth,
    departments,
    employees,
    face,
    feedback,
    feedback_forms,
    leave,
    notifications,
    office_locations,
    organizations,
    reports,
    training,
)

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(organizations.router, prefix="/organizations", tags=["organizations"])
api_router.include_router(departments.router, prefix="/departments", tags=["departments"])
api_router.include_router(employees.router, prefix="/employees", tags=["employees"])
api_router.include_router(face.router, prefix="/face", tags=["face"])
api_router.include_router(attendance_rules.router, prefix="/attendance-rules", tags=["attendance-rules"])
api_router.include_router(office_locations.router, prefix="/office-locations", tags=["geofencing"])
api_router.include_router(attendance.router, prefix="/attendance", tags=["attendance"])
api_router.include_router(leave.router, prefix="/leave", tags=["leave"])
api_router.include_router(training.router, prefix="/trainings", tags=["training"])
api_router.include_router(feedback.router, prefix="/feedback", tags=["feedback"])
api_router.include_router(feedback_forms.router, prefix="/feedback-forms", tags=["feedback-forms"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
