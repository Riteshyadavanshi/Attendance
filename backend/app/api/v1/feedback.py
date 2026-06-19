from fastapi import APIRouter
from sqlalchemy import func, select

from app.core.deps import CurrentUserDep, DbSession
from app.models import FeedbackResponse
from app.schemas import APIResponse, FeedbackCreate

router = APIRouter()


@router.post("")
async def submit_feedback(body: FeedbackCreate, db: DbSession, user: CurrentUserDep):
    from app.core.exceptions import ForbiddenError

    if not user.employee_id:
        raise ForbiddenError("Employee profile required")
    feedback = FeedbackResponse(
        session_id=body.session_id,
        employee_id=user.employee_id,
        trainer_rating=body.trainer_rating,
        content_rating=body.content_rating,
        practical_rating=body.practical_rating,
        suggestions=body.suggestions,
    )
    db.add(feedback)
    await db.flush()
    return APIResponse(message="Feedback submitted")


@router.get("/dashboard")
async def feedback_dashboard(db: DbSession, user: CurrentUserDep):
    user.require_role("head_hr", "super_admin")
    result = await db.execute(
        select(
            func.avg(FeedbackResponse.trainer_rating),
            func.avg(FeedbackResponse.content_rating),
            func.avg(FeedbackResponse.practical_rating),
            func.count(FeedbackResponse.id),
        )
    )
    row = result.one()
    return APIResponse(
        data={
            "avg_trainer": float(row[0] or 0),
            "avg_content": float(row[1] or 0),
            "avg_practical": float(row[2] or 0),
            "response_count": row[3],
        }
    )
