from datetime import date, datetime, time, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select

from app.core.config import get_settings
from app.core.deps import CurrentUser, DbSession, require_roles
from app.core.roles import HR_ROLES
from app.models import AttendanceRule, Organization
from app.schemas import APIResponse, AttendanceRuleOut, AttendanceRuleUpdate
from app.services.timezone_utils import format_late_after, resolve_tz

router = APIRouter()
settings = get_settings()


def _serialize(rule: AttendanceRule, org_timezone: str) -> dict:
    org_tz = resolve_tz(org_timezone)
    work_start_dt = datetime.combine(date.today(), rule.work_start_time, tzinfo=org_tz)
    check_in_opens = (
        work_start_dt - timedelta(minutes=settings.check_in_early_buffer_minutes)
    ).strftime("%H:%M")

    out = AttendanceRuleOut(
        work_start_time=rule.work_start_time.strftime("%H:%M"),
        work_end_time=rule.work_end_time.strftime("%H:%M"),
        late_threshold_minutes=rule.late_threshold_minutes,
        half_day_threshold_hours=float(rule.half_day_threshold_hours),
        standard_hours=float(rule.standard_hours),
        working_days=rule.working_days,
        timezone=org_timezone,
        late_after_time=format_late_after(rule.work_start_time, rule.late_threshold_minutes),
        check_in_opens_at=check_in_opens,
        check_in_early_buffer_minutes=settings.check_in_early_buffer_minutes,
    )
    return out.model_dump()


def _default_rule(org_id) -> AttendanceRule:
    return AttendanceRule(
        organization_id=org_id,
        work_start_time=time(9, 0),
        work_end_time=time(18, 0),
        late_threshold_minutes=15,
        half_day_threshold_hours=4.0,
        standard_hours=8.0,
        working_days=[1, 2, 3, 4, 5],
    )


@router.get("")
async def get_rules(
    db: DbSession,
    user: Annotated[CurrentUser, Depends(require_roles(*HR_ROLES))],
):
    org = await db.get(Organization, user.organization_id)
    org_tz = org.timezone if org else "Asia/Kolkata"

    result = await db.execute(
        select(AttendanceRule).where(AttendanceRule.organization_id == user.organization_id)
    )
    rule = result.scalar_one_or_none()
    if not rule:
        return APIResponse(data=_serialize(_default_rule(user.organization_id), org_tz))
    return APIResponse(data=_serialize(rule, org_tz))


@router.put("")
async def update_rules(
    body: AttendanceRuleUpdate,
    db: DbSession,
    user: Annotated[CurrentUser, Depends(require_roles(*HR_ROLES))],
):
    org = await db.get(Organization, user.organization_id)
    org_tz = org.timezone if org else "Asia/Kolkata"

    result = await db.execute(
        select(AttendanceRule).where(AttendanceRule.organization_id == user.organization_id)
    )
    rule = result.scalar_one_or_none()
    if not rule:
        rule = _default_rule(user.organization_id)
        db.add(rule)

    h, m = map(int, body.work_start_time.split(":"))
    rule.work_start_time = time(h, m)
    h, m = map(int, body.work_end_time.split(":"))
    rule.work_end_time = time(h, m)
    rule.late_threshold_minutes = max(0, body.late_threshold_minutes)
    rule.half_day_threshold_hours = body.half_day_threshold_hours
    rule.standard_hours = body.standard_hours
    rule.working_days = body.working_days
    await db.flush()
    return APIResponse(data=_serialize(rule, org_tz), message="Work hours updated")
