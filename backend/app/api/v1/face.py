from fastapi import APIRouter

from app.core.deps import CurrentUserDep, DbSession
from app.core.exceptions import ForbiddenError
from app.schemas import APIResponse, FaceEnrollRequest
from app.services.face_enrollment import FaceEnrollmentService

router = APIRouter()
face_service = FaceEnrollmentService()


@router.get("/status")
async def face_status(db: DbSession, user: CurrentUserDep):
    if not user.employee_id:
        raise ForbiddenError("Employee profile required")
    data = await face_service.get_status(db, user.employee_id)
    return APIResponse(data=data)


@router.post("/enroll")
async def face_enroll(body: FaceEnrollRequest, db: DbSession, user: CurrentUserDep):
    if not user.employee_id:
        raise ForbiddenError("Employee profile required")
    profile = await face_service.enroll(
        db,
        user.employee_id,
        user.organization_id,
        body.model_dump(),
    )
    return APIResponse(
        data={"face_enrolled": True, "version": profile.version},
        message="Face enrollment complete",
    )
