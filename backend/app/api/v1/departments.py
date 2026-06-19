from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.deps import CurrentUser, CurrentUserDep, DbSession, require_roles
from app.schemas import APIResponse, DepartmentCreate, DepartmentOut
from app.services import OrganizationService

router = APIRouter()
org_service = OrganizationService()


@router.get("")
async def list_departments(db: DbSession, user: CurrentUserDep):
    from sqlalchemy import select

    from app.models import Department

    user.require_role("hr_manager", "head_hr", "super_admin")
    result = await db.execute(
        select(Department).where(Department.organization_id == user.organization_id)
    )
    depts = result.scalars().all()
    return APIResponse(data=[DepartmentOut.model_validate(d).model_dump() for d in depts])


@router.post("")
async def create_department(
    body: DepartmentCreate,
    db: DbSession,
    user: Annotated[CurrentUser, Depends(require_roles("super_admin"))],
):
    dept = await org_service.create_department(
        db, user.organization_id, body.name, body.code
    )
    return APIResponse(data=DepartmentOut.model_validate(dept).model_dump())
