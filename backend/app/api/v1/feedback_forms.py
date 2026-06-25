from typing import Annotated
from uuid import UUID

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import delete, func, select
from sqlalchemy.orm import selectinload

from app.core.deps import CurrentUser, CurrentUserDep, DbSession, require_roles
from app.core.exceptions import ForbiddenError, NotFoundError
from app.core.roles import HR_ROLES
from app.models import Employee, FeedbackForm, FeedbackFormEmployeeState, FeedbackFormSubmission
from app.schemas import (
    APIResponse,
    FeedbackFormCreate,
    FeedbackFormOut,
    FeedbackFormSubmit,
    FeedbackFormUpdate,
)

router = APIRouter()


def _form_out(form: FeedbackForm, response_count: int = 0) -> dict:
    return {
        "id": str(form.id),
        "title": form.title,
        "description": form.description,
        "questions": form.questions,
        "is_active": form.is_active,
        "response_count": response_count,
        "created_at": form.created_at.isoformat() if form.created_at else None,
    }


def _compute_dashboard(form: FeedbackForm, submissions: list[FeedbackFormSubmission]) -> dict:
    questions_stats = []
    for q in form.questions or []:
        qid = q.get("id")
        qtype = q.get("type")
        label = q.get("label", qid)
        stat: dict = {"id": qid, "label": label, "type": qtype}

        values = [s.answers.get(qid) for s in submissions if s.answers.get(qid) is not None]

        if qtype == "rating":
            nums = [int(v) for v in values if isinstance(v, (int, float))]
            stat["response_count"] = len(nums)
            stat["average"] = round(sum(nums) / len(nums), 2) if nums else None
            stat["distribution"] = {str(i): nums.count(i) for i in range(1, 6)}
        elif qtype == "choice":
            options = q.get("options") or []
            counts = {opt: sum(1 for v in values if v == opt) for opt in options}
            stat["response_count"] = len(values)
            stat["option_counts"] = counts
        else:
            stat["response_count"] = len(values)
            stat["recent_texts"] = [str(v) for v in values[-5:]]

        questions_stats.append(stat)

    return {
        "form_id": str(form.id),
        "title": form.title,
        "total_responses": len(submissions),
        "questions": questions_stats,
    }


@router.post("")
async def create_form(
    body: FeedbackFormCreate,
    db: DbSession,
    user: Annotated[CurrentUser, Depends(require_roles(*HR_ROLES))],
):
    questions = [q.model_dump() for q in body.questions]
    form = FeedbackForm(
        organization_id=user.organization_id,
        title=body.title.strip(),
        description=body.description,
        questions=questions,
        created_by_id=user.id,
    )
    db.add(form)
    await db.flush()
    return APIResponse(data=_form_out(form, 0))


async def _response_count(db: DbSession, form_id: UUID) -> int:
    result = await db.execute(
        select(func.count()).where(FeedbackFormSubmission.form_id == form_id)
    )
    return result.scalar_one()


@router.patch("/{form_id}")
async def update_form(
    form_id: UUID,
    body: FeedbackFormUpdate,
    db: DbSession,
    user: Annotated[CurrentUser, Depends(require_roles(*HR_ROLES))],
):
    form = await _get_org_form(db, form_id, user.organization_id)
    count = await _response_count(db, form.id)

    # Title / description / questions can only change while there are no responses.
    structural_change = (
        body.title is not None or body.description is not None or body.questions is not None
    )
    if structural_change and count > 0:
        raise ForbiddenError(
            "This form already has responses and can no longer be edited. You can only open or close it."
        )

    if body.title is not None:
        form.title = body.title.strip()
    if body.description is not None:
        form.description = body.description
    if body.questions is not None:
        form.questions = [q.model_dump() for q in body.questions]
    if body.is_active is not None:
        form.is_active = body.is_active

    await db.flush()
    return APIResponse(data=_form_out(form, count))


@router.delete("/{form_id}")
async def delete_form(
    form_id: UUID,
    db: DbSession,
    user: Annotated[CurrentUser, Depends(require_roles(*HR_ROLES))],
):
    form = await _get_org_form(db, form_id, user.organization_id)
    await db.execute(
        delete(FeedbackFormSubmission).where(FeedbackFormSubmission.form_id == form.id)
    )
    await db.execute(
        delete(FeedbackFormEmployeeState).where(FeedbackFormEmployeeState.form_id == form.id)
    )
    await db.delete(form)
    await db.flush()
    return APIResponse(message="Feedback form deleted")


@router.get("")
async def list_forms(
    db: DbSession,
    user: CurrentUserDep,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    if user.has_role(*HR_ROLES):
        offset = (page - 1) * limit
        base = select(FeedbackForm).where(FeedbackForm.organization_id == user.organization_id)
        total_result = await db.execute(select(func.count()).select_from(base.subquery()))
        total = total_result.scalar_one()

        result = await db.execute(
            base.order_by(FeedbackForm.created_at.desc()).offset(offset).limit(limit)
        )
        forms = result.scalars().all()
        items = []
        for form in forms:
            count_result = await db.execute(
                select(func.count()).where(FeedbackFormSubmission.form_id == form.id)
            )
            items.append(_form_out(form, count_result.scalar_one()))
        return APIResponse(
            data={"items": items, "page": page, "limit": limit, "total": total, "has_more": offset + len(items) < total}
        )

    if not user.employee_id:
        raise ForbiddenError("Employee profile required")

    submitted = await db.execute(
        select(FeedbackFormSubmission.form_id).where(
            FeedbackFormSubmission.employee_id == user.employee_id
        )
    )
    submitted_ids = {row[0] for row in submitted.all()}

    result = await db.execute(
        select(FeedbackForm).where(
            FeedbackForm.organization_id == user.organization_id,
            FeedbackForm.is_active.is_(True),
        ).order_by(FeedbackForm.created_at.desc())
    )
    forms = result.scalars().all()
    items = []
    for form in forms:
        out = _form_out(form)
        out["already_submitted"] = form.id in submitted_ids
        items.append(out)
    return APIResponse(data=items)


@router.get("/popup-pending")
async def popup_pending_forms(db: DbSession, user: CurrentUserDep):
    if user.has_role(*HR_ROLES):
        return APIResponse(data=[])
    if not user.employee_id:
        raise ForbiddenError("Employee profile required")

    items = await _pending_popup_forms(db, user.organization_id, user.employee_id)
    return APIResponse(data=items)


@router.post("/{form_id}/dismiss-popup")
async def dismiss_form_popup(form_id: UUID, db: DbSession, user: CurrentUserDep):
    if not user.employee_id:
        raise ForbiddenError("Employee profile required")

    form = await _get_org_form(db, form_id, user.organization_id)
    if not form.is_active:
        return APIResponse(message="Popup dismissed")

    result = await db.execute(
        select(FeedbackFormEmployeeState).where(
            FeedbackFormEmployeeState.form_id == form.id,
            FeedbackFormEmployeeState.employee_id == user.employee_id,
        )
    )
    state = result.scalar_one_or_none()
    if state:
        state.popup_dismissed = True
        state.dismissed_at = datetime.now(timezone.utc)
    else:
        db.add(
            FeedbackFormEmployeeState(
                form_id=form.id,
                employee_id=user.employee_id,
                popup_dismissed=True,
                dismissed_at=datetime.now(timezone.utc),
            )
        )
    await db.flush()
    return APIResponse(message="Popup dismissed")


@router.get("/{form_id}")
async def get_form(form_id: UUID, db: DbSession, user: CurrentUserDep):
    form = await _get_org_form(db, form_id, user.organization_id)
    count_result = await db.execute(
        select(func.count()).where(FeedbackFormSubmission.form_id == form.id)
    )
    out = _form_out(form, count_result.scalar_one())
    if not user.has_role(*HR_ROLES) and user.employee_id:
        existing = await db.execute(
            select(FeedbackFormSubmission).where(
                FeedbackFormSubmission.form_id == form.id,
                FeedbackFormSubmission.employee_id == user.employee_id,
            )
        )
        out["already_submitted"] = existing.scalar_one_or_none() is not None
    return APIResponse(data=out)


@router.get("/{form_id}/dashboard")
async def form_dashboard(
    form_id: UUID,
    db: DbSession,
    user: Annotated[CurrentUser, Depends(require_roles(*HR_ROLES))],
):
    form = await _get_org_form(db, form_id, user.organization_id)
    result = await db.execute(
        select(FeedbackFormSubmission)
        .options(selectinload(FeedbackFormSubmission.employee))
        .where(FeedbackFormSubmission.form_id == form.id)
    )
    submissions = result.scalars().all()
    return APIResponse(data=_compute_dashboard(form, submissions))


@router.get("/{form_id}/responses")
async def list_responses(
    form_id: UUID,
    db: DbSession,
    user: Annotated[CurrentUser, Depends(require_roles(*HR_ROLES))],
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    form = await _get_org_form(db, form_id, user.organization_id)
    offset = (page - 1) * limit
    base = select(FeedbackFormSubmission).where(FeedbackFormSubmission.form_id == form.id)
    total_result = await db.execute(select(func.count()).select_from(base.subquery()))
    total = total_result.scalar_one()

    result = await db.execute(
        base.options(selectinload(FeedbackFormSubmission.employee))
        .order_by(FeedbackFormSubmission.submitted_at.desc())
        .offset(offset)
        .limit(limit)
    )
    submissions = result.scalars().all()
    items = []
    for s in submissions:
        items.append({
            "id": str(s.id),
            "employee_name": s.employee.full_name if s.employee else None,
            "employee_code": s.employee.employee_code if s.employee else None,
            "answers": s.answers,
            "submitted_at": s.submitted_at.isoformat() if s.submitted_at else None,
        })
    return APIResponse(
        data={"items": items, "page": page, "limit": limit, "total": total, "has_more": offset + len(items) < total}
    )


@router.post("/{form_id}/submit")
async def submit_form(form_id: UUID, body: FeedbackFormSubmit, db: DbSession, user: CurrentUserDep):
    if not user.employee_id:
        raise ForbiddenError("Employee profile required")

    form = await _get_org_form(db, form_id, user.organization_id)
    if not form.is_active:
        raise ForbiddenError("This form is closed")

    existing = await db.execute(
        select(FeedbackFormSubmission).where(
            FeedbackFormSubmission.form_id == form.id,
            FeedbackFormSubmission.employee_id == user.employee_id,
        )
    )
    if existing.scalar_one_or_none():
        raise ForbiddenError("You already submitted this form")

    for q in form.questions or []:
        if q.get("required") and body.answers.get(q["id"]) in (None, ""):
            raise ForbiddenError(f"Answer required: {q.get('label', q['id'])}")

    submission = FeedbackFormSubmission(
        form_id=form.id,
        employee_id=user.employee_id,
        answers=body.answers,
    )
    db.add(submission)
    await _dismiss_popup_state(db, form.id, user.employee_id)
    await db.flush()
    return APIResponse(message="Feedback submitted")


async def _pending_popup_forms(db: DbSession, org_id: UUID, employee_id: UUID) -> list[dict]:
    submitted = await db.execute(
        select(FeedbackFormSubmission.form_id).where(
            FeedbackFormSubmission.employee_id == employee_id
        )
    )
    submitted_ids = {row[0] for row in submitted.all()}

    dismissed = await db.execute(
        select(FeedbackFormEmployeeState.form_id).where(
            FeedbackFormEmployeeState.employee_id == employee_id,
            FeedbackFormEmployeeState.popup_dismissed.is_(True),
        )
    )
    dismissed_ids = {row[0] for row in dismissed.all()}

    result = await db.execute(
        select(FeedbackForm)
        .where(
            FeedbackForm.organization_id == org_id,
            FeedbackForm.is_active.is_(True),
        )
        .order_by(FeedbackForm.created_at.desc())
    )
    pending = []
    for form in result.scalars().all():
        if form.id in submitted_ids or form.id in dismissed_ids:
            continue
        pending.append(_form_out(form))
    return pending


async def _dismiss_popup_state(db: DbSession, form_id: UUID, employee_id: UUID) -> None:
    result = await db.execute(
        select(FeedbackFormEmployeeState).where(
            FeedbackFormEmployeeState.form_id == form_id,
            FeedbackFormEmployeeState.employee_id == employee_id,
        )
    )
    state = result.scalar_one_or_none()
    if state:
        state.popup_dismissed = True
        state.dismissed_at = datetime.now(timezone.utc)
    else:
        db.add(
            FeedbackFormEmployeeState(
                form_id=form_id,
                employee_id=employee_id,
                popup_dismissed=True,
                dismissed_at=datetime.now(timezone.utc),
            )
        )


async def _get_org_form(db: DbSession, form_id: UUID, org_id: UUID) -> FeedbackForm:
    form = await db.get(FeedbackForm, form_id)
    if not form or form.organization_id != org_id:
        raise NotFoundError("Feedback form")
    return form
