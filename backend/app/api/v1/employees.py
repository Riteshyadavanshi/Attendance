from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import selectinload

from app.core.deps import CurrentUser, CurrentUserDep, DbSession, require_roles
from app.core.exceptions import ForbiddenError, NotFoundError
from app.core.roles import HR_ROLES
from app.models import Department, Employee, User
from app.schemas import (
    APIResponse,
    EmployeeCreate,
    EmployeeOut,
    EmployeeProfileOut,
    EmployeeProfileUpdate,
)
from app.services import OrganizationService

router = APIRouter()
org_service = OrganizationService()


def _employee_out(employee: Employee) -> dict:
    out = EmployeeOut.model_validate(employee).model_dump()
    out["email"] = employee.user.email if employee.user else None
    return out


def _compute_age(dob: date | None) -> int | None:
    if not dob:
        return None
    today = date.today()
    years = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
    return years if years >= 0 else None


def _profile_out(employee: Employee) -> dict:
    out = EmployeeProfileOut(
        id=employee.id,
        employee_code=employee.employee_code,
        full_name=employee.full_name,
        designation=employee.designation,
        department_id=employee.department_id,
        department_name=employee.department.name if employee.department else None,
        gender=employee.gender,
        date_of_birth=employee.date_of_birth,
        age=_compute_age(employee.date_of_birth),
        location=employee.location,
        email=employee.user.email if employee.user else None,
        face_enrolled=employee.face_enrolled,
    )
    return out.model_dump(mode="json")


async def _current_employee(db: DbSession, user: CurrentUser) -> Employee:
    if not user.employee_id:
        raise ForbiddenError("Employee profile required")
    result = await db.execute(
        select(Employee)
        .options(selectinload(Employee.user), selectinload(Employee.department))
        .where(Employee.id == user.employee_id)
    )
    employee = result.scalar_one_or_none()
    if not employee:
        raise NotFoundError("Employee")
    return employee


@router.get("/me")
async def get_my_profile(db: DbSession, user: CurrentUserDep):
    employee = await _current_employee(db, user)
    return APIResponse(data=_profile_out(employee))


@router.patch("/me")
async def update_my_profile(body: EmployeeProfileUpdate, db: DbSession, user: CurrentUserDep):
    employee = await _current_employee(db, user)
    if body.gender is not None:
        employee.gender = body.gender.strip() or None
    if body.date_of_birth is not None:
        employee.date_of_birth = body.date_of_birth
    if body.location is not None:
        employee.location = body.location.strip() or None
    await db.flush()
    return APIResponse(data=_profile_out(employee), message="Profile updated")


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
