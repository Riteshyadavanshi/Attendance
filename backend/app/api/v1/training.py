from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select

from app.core.deps import CurrentUser, CurrentUserDep, DbSession, require_roles
from app.models import Training, TrainingSession
from app.schemas import APIResponse, TrainingCreate

router = APIRouter()


@router.get("")
async def list_trainings(db: DbSession, user: CurrentUserDep):
    result = await db.execute(
        select(Training).where(Training.organization_id == user.organization_id)
    )
    trainings = result.scalars().all()
    return APIResponse(
        data=[
            {
                "id": str(t.id),
                "title": t.title,
                "description": t.description,
                "trainer_name": t.trainer_name,
            }
            for t in trainings
        ]
    )


@router.post("")
async def create_training(
    body: TrainingCreate,
    db: DbSession,
    user: Annotated[CurrentUser, Depends(require_roles("hr_manager", "head_hr", "super_admin"))],
):
    training = Training(
        organization_id=user.organization_id,
        title=body.title,
        description=body.description,
        trainer_name=body.trainer_name,
        materials_url=body.materials_url,
        created_by=user.id,
    )
    db.add(training)
    await db.flush()
    return APIResponse(data={"id": str(training.id), "title": training.title})


@router.get("/{training_id}/sessions")
async def list_sessions(training_id: str, db: DbSession, user: CurrentUserDep):
    from uuid import UUID

    result = await db.execute(
        select(TrainingSession).where(TrainingSession.training_id == UUID(training_id))
    )
    sessions = result.scalars().all()
    return APIResponse(
        data=[
            {
                "id": str(s.id),
                "scheduled_at": s.scheduled_at.isoformat(),
                "status": s.status,
            }
            for s in sessions
        ]
    )
