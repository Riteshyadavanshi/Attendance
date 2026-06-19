from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.deps import CurrentUser, DbSession, require_roles
from app.schemas import APIResponse

router = APIRouter()


@router.get("/executive")
async def executive_kpis(
    db: DbSession,
    user: Annotated[CurrentUser, Depends(require_roles("head_hr", "super_admin"))],
):
    return APIResponse(
        data={
            "attendance_rate": 94.5,
            "productivity_score": 87.2,
            "engagement_score": 78.0,
            "training_effectiveness": 4.3,
        }
    )


@router.get("/recommendations")
async def recommendations(
    user: Annotated[CurrentUser, Depends(require_roles("head_hr", "super_admin"))],
):
    return APIResponse(
        data={
            "recommendations": [
                {
                    "type": "absenteeism_risk",
                    "message": "Review employees with high absenteeism in Engineering.",
                    "priority": "high",
                }
            ]
        }
    )
