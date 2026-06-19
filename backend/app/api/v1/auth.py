from fastapi import APIRouter

from app.core.deps import DbSession
from app.schemas import APIResponse, LoginRequest
from app.services import AuthService

router = APIRouter()
auth_service = AuthService()


@router.post("/login")
async def login(body: LoginRequest, db: DbSession):
    result = await auth_service.login(db, body.email, body.password, body.mfa_code)
    return APIResponse(data=result)
