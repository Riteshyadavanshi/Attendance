from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.deps import CurrentUser, DbSession, require_roles
from app.schemas import APIResponse, OrganizationCreate, OrganizationOut
from app.services import OrganizationService

router = APIRouter()
org_service = OrganizationService()


@router.get("")
async def list_organizations(
    db: DbSession,
    user: Annotated[CurrentUser, Depends(require_roles("super_admin"))],
):
    from sqlalchemy import select

    from app.models import Organization

    result = await db.execute(select(Organization).where(Organization.is_active.is_(True)))
    orgs = result.scalars().all()
    return APIResponse(data=[OrganizationOut.model_validate(o).model_dump() for o in orgs])


@router.post("")
async def create_organization(
    body: OrganizationCreate,
    db: DbSession,
    user: Annotated[CurrentUser, Depends(require_roles("super_admin"))],
):
    org = await org_service.create_org(db, body.name, body.slug, body.timezone)
    return APIResponse(data=OrganizationOut.model_validate(org).model_dump())
