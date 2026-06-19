from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select

from app.core.deps import CurrentUser, CurrentUserDep, DbSession, require_roles
from app.models import LeaveRequest
from app.schemas import APIResponse, LeaveCreate

router = APIRouter()


@router.post("")
async def apply_leave(body: LeaveCreate, db: DbSession, user: CurrentUserDep):
    if not user.employee_id:
        from app.core.exceptions import ForbiddenError
        raise ForbiddenError("Employee profile required")
    leave = LeaveRequest(
        organization_id=user.organization_id,
        employee_id=user.employee_id,
        leave_type=body.leave_type,
        start_date=date.fromisoformat(body.start_date),
        end_date=date.fromisoformat(body.end_date),
        reason=body.reason,
    )
    db.add(leave)
    await db.flush()
    return APIResponse(data={"id": str(leave.id), "status": leave.status})


@router.get("")
async def list_leave(db: DbSession, user: CurrentUserDep):
    query = select(LeaveRequest).where(LeaveRequest.organization_id == user.organization_id)
    if not user.has_role("hr_manager", "head_hr", "super_admin") and user.employee_id:
        query = query.where(LeaveRequest.employee_id == user.employee_id)
    result = await db.execute(query.order_by(LeaveRequest.created_at.desc()))
    rows = result.scalars().all()
    return APIResponse(
        data=[
            {
                "id": str(r.id),
                "leave_type": r.leave_type,
                "start_date": str(r.start_date),
                "end_date": str(r.end_date),
                "status": r.status,
                "reason": r.reason,
            }
            for r in rows
        ]
    )


@router.patch("/{leave_id}")
async def update_leave(
    leave_id: str,
    db: DbSession,
    user: Annotated[CurrentUser, Depends(require_roles("hr_manager", "head_hr", "super_admin"))],
    status: str = "approved",
):
    from uuid import UUID

    leave = await db.get(LeaveRequest, UUID(leave_id))
    if not leave:
        from app.core.exceptions import NotFoundError
        raise NotFoundError("Leave request")
    leave.status = status
    leave.approved_by = user.id
    await db.flush()
    return APIResponse(data={"id": str(leave.id), "status": leave.status})
