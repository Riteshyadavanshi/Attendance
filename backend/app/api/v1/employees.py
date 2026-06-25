from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import selectinload

from app.core.deps import CurrentUser, CurrentUserDep, DbSession, require_roles
from app.core.roles import HR_ROLES
from app.models import Employee, User
from app.schemas import APIResponse, EmployeeCreate, EmployeeOut
from app.services import OrganizationService

router = APIRouter()
org_service = OrganizationService()


def _employee_out(employee: Employee) -> dict:
    out = EmployeeOut.model_validate(employee).model_dump()
    out["email"] = employee.user.email if employee.user else None
    return out


@router.get("")
async def list_employees(
    db: DbSession,
    user: CurrentUserDep,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: str | None = Query(None, max_length=120),
):
    user.require_role(*HR_ROLES)
    offset = (page - 1) * limit
    base = select(Employee).where(
        Employee.organization_id == user.organization_id,
        Employee.is_active.is_(True),
    )

    term = (search or "").strip()
    if term:
        pattern = f"%{term}%"
        base = base.outerjoin(User, Employee.user).where(
            or_(
                Employee.full_name.ilike(pattern),
                Employee.employee_code.ilike(pattern),
                Employee.designation.ilike(pattern),
                User.email.ilike(pattern),
            )
        )

    total_result = await db.execute(select(func.count()).select_from(base.subquery()))
    total = total_result.scalar_one()

    result = await db.execute(
        base.options(selectinload(Employee.user))
        .order_by(Employee.full_name)
        .offset(offset)
        .limit(limit)
    )
    employees = result.scalars().all()
    items = [_employee_out(e) for e in employees]

    return APIResponse(
        data={
            "items": items,
            "page": page,
            "limit": limit,
            "total": total,
            "has_more": offset + len(items) < total,
        }
    )


@router.post("")
async def create_employee(
    body: EmployeeCreate,
    db: DbSession,
    user: Annotated[CurrentUser, Depends(require_roles(*HR_ROLES))],
):
    data = body.model_dump()
    roles = list(data.get("roles", ["employee"]))
    if "hr" in roles and not user.has_role("hr", "super_admin", "head_hr"):
        roles = ["employee"]
    data["roles"] = roles

    employee = await org_service.create_employee(
        db,
        user.organization_id,
        data,
    )
    result = await db.execute(
        select(Employee)
        .options(selectinload(Employee.user))
        .where(Employee.id == employee.id)
    )
    emp = result.scalar_one()
    return APIResponse(data=_employee_out(emp))
