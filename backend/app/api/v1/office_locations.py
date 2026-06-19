from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select

from uuid import UUID

from app.core.deps import CurrentUser, CurrentUserDep, DbSession, require_roles
from app.core.exceptions import NotFoundError
from app.core.roles import HR_ROLES
from app.models import OfficeLocation
from app.schemas import APIResponse, OfficeLocationCreate, OfficeLocationOut, OfficeLocationUpdate

router = APIRouter()


@router.get("")
async def list_office_locations(db: DbSession, user: CurrentUserDep):
    user.require_role(*HR_ROLES)
    result = await db.execute(
        select(OfficeLocation).where(
            OfficeLocation.organization_id == user.organization_id,
            OfficeLocation.is_active.is_(True),
        )
    )
    locations = result.scalars().all()
    return APIResponse(data=[_loc_data(loc) for loc in locations])


@router.post("")
async def create_office_location(
    body: OfficeLocationCreate,
    db: DbSession,
    user: Annotated[CurrentUser, Depends(require_roles(*HR_ROLES))],
):
    loc = OfficeLocation(
        organization_id=user.organization_id,
        name=body.name,
        latitude=body.latitude,
        longitude=body.longitude,
        radius_meters=body.radius_meters,
    )
    db.add(loc)
    await db.flush()
    return APIResponse(data=_loc_data(loc))


def _loc_data(loc: OfficeLocation) -> dict:
    return {
        **OfficeLocationOut.model_validate(loc).model_dump(),
        "latitude": float(loc.latitude),
        "longitude": float(loc.longitude),
    }


@router.patch("/{location_id}")
async def update_office_location(
    location_id: UUID,
    body: OfficeLocationUpdate,
    db: DbSession,
    user: Annotated[CurrentUser, Depends(require_roles(*HR_ROLES))],
):
    loc = await db.get(OfficeLocation, location_id)
    if not loc or loc.organization_id != user.organization_id:
        raise NotFoundError("Office location")
    if body.name is not None:
        loc.name = body.name
    if body.latitude is not None:
        loc.latitude = body.latitude
    if body.longitude is not None:
        loc.longitude = body.longitude
    if body.radius_meters is not None:
        loc.radius_meters = body.radius_meters
    if body.is_active is not None:
        loc.is_active = body.is_active
    await db.flush()
    return APIResponse(data=_loc_data(loc))
