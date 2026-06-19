from datetime import date, datetime, time, timedelta, timezone
from typing import Union
from zoneinfo import ZoneInfo

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ForbiddenError
from app.models import Organization

TzInfo = Union[ZoneInfo, timezone]
IST = timezone(timedelta(hours=5, minutes=30))


def resolve_tz(tz_name: str | None) -> TzInfo:
    name = tz_name or "Asia/Kolkata"
    try:
        return ZoneInfo(name)
    except Exception:
        if "Kolkata" in name or "Calcutta" in name:
            return IST
        return timezone.utc


async def get_org_timezone(db: AsyncSession, org_id) -> TzInfo:
    org = await db.get(Organization, org_id)
    return resolve_tz(org.timezone if org else None)


def org_today(org_tz: TzInfo) -> date:
    return datetime.now(org_tz).date()


def classify_check_in_status(
    check_in_utc: datetime,
    work_start: time,
    late_threshold_minutes: int,
    org_tz: TzInfo,
) -> str:
    local = check_in_utc.astimezone(org_tz)
    start = datetime.combine(local.date(), work_start, tzinfo=org_tz)
    late_cutoff = start + timedelta(minutes=late_threshold_minutes)
    if local > late_cutoff:
        return "late"
    return "present"


def format_late_after(work_start: time, late_threshold_minutes: int) -> str:
    start = datetime.combine(date.today(), work_start)
    late_after = start + timedelta(minutes=late_threshold_minutes)
    return late_after.strftime("%H:%M")


def check_in_window_bounds(
    on_date: date,
    work_start: time,
    work_end: time,
    org_tz: TzInfo,
    early_buffer_minutes: int = 60,
) -> tuple[datetime, datetime, datetime]:
    """Returns (earliest_allowed, work_start_dt, work_end_dt) in org timezone."""
    work_start_dt = datetime.combine(on_date, work_start, tzinfo=org_tz)
    work_end_dt = datetime.combine(on_date, work_end, tzinfo=org_tz)
    earliest = work_start_dt - timedelta(minutes=early_buffer_minutes)
    return earliest, work_start_dt, work_end_dt


def validate_check_in_window(
    check_in_utc: datetime,
    work_start: time,
    work_end: time,
    org_tz: TzInfo,
    early_buffer_minutes: int = 60,
) -> None:
    local = check_in_utc.astimezone(org_tz)
    earliest, _, work_end_dt = check_in_window_bounds(
        local.date(), work_start, work_end, org_tz, early_buffer_minutes
    )
    if local < earliest:
        raise ForbiddenError(
            f"Check-in opens at {earliest.strftime('%H:%M')} "
            f"({early_buffer_minutes} min before work start). "
            f"Work hours: {work_start.strftime('%H:%M')}–{work_end.strftime('%H:%M')}."
        )
    if local > work_end_dt:
        raise ForbiddenError(
            f"Check-in is closed for today. Work hours end at {work_end.strftime('%H:%M')}."
        )


def is_valid_work_session_check_in(
    check_in_utc: datetime,
    work_start: time,
    work_end: time,
    org_tz: TzInfo,
    early_buffer_minutes: int = 60,
) -> bool:
    local = check_in_utc.astimezone(org_tz)
    earliest, _, work_end_dt = check_in_window_bounds(
        local.date(), work_start, work_end, org_tz, early_buffer_minutes
    )
    return earliest <= local <= work_end_dt


def minutes_late(
    check_in_utc: datetime,
    work_start: time,
    late_threshold_minutes: int,
    org_tz: TzInfo,
) -> int:
    local = check_in_utc.astimezone(org_tz)
    start = datetime.combine(local.date(), work_start, tzinfo=org_tz)
    late_cutoff = start + timedelta(minutes=late_threshold_minutes)
    if local <= late_cutoff:
        return 0
    return int((local - late_cutoff).total_seconds() / 60)
