from typing import Annotated

from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import select

from app.core.deps import CurrentUser, CurrentUserDep, DbSession, require_roles
from app.core.exceptions import ForbiddenError
from app.core.roles import HR_ROLES
from app.models import AttendanceRecord
from app.schemas import APIResponse, CheckInRequest, CheckOutRequest
from app.services import AttendanceService

router = APIRouter()
attendance_service = AttendanceService()


def _serialize_record(record: AttendanceRecord) -> dict:
    return {
        "id": str(record.id),
        "date": str(record.date),
        "check_in_at": record.check_in_at.isoformat() if record.check_in_at else None,
        "check_out_at": record.check_out_at.isoformat() if record.check_out_at else None,
        "status": record.status,
        "working_minutes": record.working_minutes,
        "face_verified": record.face_verified,
        "geo_verified": record.geo_verified,
    }


@router.post("/check-in")
async def check_in(body: CheckInRequest, db: DbSession, user: CurrentUserDep):
    if not user.employee_id:
        raise ForbiddenError("Employee profile required")
    record = await attendance_service.check_in(
        db,
        user.employee_id,
        user.organization_id,
        body.face_image,
        body.latitude,
        body.longitude,
        body.device_info,
        body.accuracy,
    )
    return APIResponse(
        data={
            "attendance_id": str(record.id),
            "status": record.status,
            "check_in_at": record.check_in_at.isoformat() if record.check_in_at else None,
        },
        message="Check-in successful",
    )


@router.post("/check-out")
async def check_out(body: CheckOutRequest, db: DbSession, user: CurrentUserDep):
    if not user.employee_id:
        raise ForbiddenError("Employee profile required")
    record = await attendance_service.check_out(
        db,
        user.employee_id,
        user.organization_id,
        body.face_image,
        body.latitude,
        body.longitude,
        body.device_info,
    )
    return APIResponse(
        data={
            "attendance_id": str(record.id),
            "status": record.status,
            "working_minutes": record.working_minutes,
            "check_out_at": record.check_out_at.isoformat() if record.check_out_at else None,
        },
        message="Check-out successful",
    )


@router.get("/today")
async def today_attendance(db: DbSession, user: CurrentUserDep):
    if not user.employee_id:
        raise ForbiddenError("Employee profile required")
    from app.services.timezone_utils import get_org_timezone, org_today

    org_tz = await get_org_timezone(db, user.organization_id)
    today = org_today(org_tz)
    result = await db.execute(
        select(AttendanceRecord).where(
            AttendanceRecord.employee_id == user.employee_id,
            AttendanceRecord.date == today,
        )
    )
    record = result.scalar_one_or_none()
    if not record:
        return APIResponse(data={"status": "not_checked_in", "date": str(today)})
    return APIResponse(data=_serialize_record(record))


@router.get("/history")
async def attendance_history(db: DbSession, user: CurrentUserDep, page: int = 1, limit: int = 20):
    employee_id = user.employee_id
    if user.has_role(*HR_ROLES):
        pass  # HR can filter — simplified for V1
    elif employee_id:
        pass
    else:
        raise ForbiddenError()

    query = select(AttendanceRecord).where(
        AttendanceRecord.organization_id == user.organization_id
    )
    if not user.has_role(*HR_ROLES) and employee_id:
        query = query.where(AttendanceRecord.employee_id == employee_id)

    query = query.order_by(AttendanceRecord.date.desc()).offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    records = result.scalars().all()
    return APIResponse(data=[_serialize_record(r) for r in records])


@router.get("/dashboard")
async def attendance_dashboard(
    db: DbSession,
    user: Annotated[CurrentUser, Depends(require_roles(*HR_ROLES))],
):
    data = await attendance_service.get_dashboard(db, user.organization_id)
    return APIResponse(data=data)


@router.get("/late-today")
async def late_today(
    db: DbSession,
    user: Annotated[CurrentUser, Depends(require_roles(*HR_ROLES))],
):
    """Employees marked late for the current org day."""
    data = await attendance_service.get_late_today(db, user.organization_id)
    return APIResponse(data=data)


@router.get("/late-leaderboard")
async def late_leaderboard(
    db: DbSession,
    user: Annotated[CurrentUser, Depends(require_roles(*HR_ROLES))],
):
    data = await attendance_service.get_late_leaderboard(db, user.organization_id)
    return APIResponse(data=data)
