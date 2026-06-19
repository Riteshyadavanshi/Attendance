from fastapi import APIRouter

from app.core.deps import CurrentUserDep, DbSession
from app.models import NotificationToken
from app.schemas import APIResponse
from pydantic import BaseModel

router = APIRouter()


class RegisterTokenRequest(BaseModel):
    token: str
    platform: str


@router.post("/register")
async def register_token(body: RegisterTokenRequest, db: DbSession, user: CurrentUserDep):
    entry = NotificationToken(user_id=user.id, token=body.token, platform=body.platform)
    db.add(entry)
    await db.flush()
    return APIResponse(message="Token registered")
