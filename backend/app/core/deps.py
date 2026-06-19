from typing import Annotated
from uuid import UUID

from fastapi import Depends, Header
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.exceptions import ForbiddenError
from app.core.roles import HR_ROLES
from app.core.security import decode_token
from app.models import Employee, User

DbSession = Annotated[AsyncSession, Depends(get_db)]


class CurrentUser:
    def __init__(
        self,
        id: UUID,
        organization_id: UUID,
        email: str,
        roles: list[str],
        employee_id: UUID | None,
    ):
        self.id = id
        self.organization_id = organization_id
        self.email = email
        self.roles = roles
        self.employee_id = employee_id

    def has_role(self, *roles: str) -> bool:
        return any(r in self.roles for r in roles)

    def require_role(self, *roles: str) -> None:
        if not self.has_role(*roles):
            raise ForbiddenError()


async def get_current_user(
    db: DbSession,
    authorization: Annotated[str | None, Header()] = None,
    x_org_id: Annotated[str | None, Header()] = None,
) -> CurrentUser:
    if not authorization or not authorization.startswith("Bearer "):
        raise ForbiddenError("Not authenticated")
    token = authorization.split(" ", 1)[1]
    try:
        payload = decode_token(token)
    except JWTError:
        raise ForbiddenError("Invalid token") from None
    if payload.get("type") != "access":
        raise ForbiddenError("Invalid token type")

    user_id = UUID(payload["sub"])
    org_id = (
        UUID(x_org_id)
        if x_org_id and any(r in payload.get("roles", []) for r in HR_ROLES)
        else UUID(payload["org_id"])
    )

    result = await db.execute(
        select(User)
        .options(selectinload(User.roles), selectinload(User.employee))
        .where(User.id == user_id, User.is_active.is_(True))
    )
    user = result.scalar_one_or_none()
    if not user:
        raise ForbiddenError("User not found")

    employee_id = user.employee.id if user.employee else None
    if payload.get("employee_id"):
        employee_id = UUID(payload["employee_id"])

    return CurrentUser(
        id=user.id,
        organization_id=org_id,
        email=user.email,
        roles=[r.name for r in user.roles],
        employee_id=employee_id,
    )


CurrentUserDep = Annotated[CurrentUser, Depends(get_current_user)]


def require_roles(*roles: str):
    async def checker(user: CurrentUserDep) -> CurrentUser:
        user.require_role(*roles)
        return user

    return checker
