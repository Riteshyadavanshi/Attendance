from typing import Annotated

import uuid

from fastapi import APIRouter, Depends

from app.core.deps import CurrentUser, require_roles
from app.schemas import APIResponse

router = APIRouter()


@router.post("/generate")
async def generate_report(
    user: Annotated[CurrentUser, Depends(require_roles("hr_manager", "head_hr", "super_admin"))],
    type: str = "attendance",
    format: str = "xlsx",
):
    report_id = str(uuid.uuid4())
    return APIResponse(
        data={"report_id": report_id, "status": "pending", "type": type, "format": format}
    )


@router.get("/{report_id}")
async def get_report(
    report_id: str,
    user: Annotated[CurrentUser, Depends(require_roles("hr_manager", "head_hr", "super_admin"))],
):
    return APIResponse(
        data={"report_id": report_id, "status": "ready", "download_url": None}
    )
