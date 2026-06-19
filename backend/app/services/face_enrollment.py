import base64
from uuid import UUID

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.face_matching import ANGLE_KEYS, embed_image
from app.core.config import get_settings
from app.core.encryption import encrypt_bytes
from app.core.exceptions import ForbiddenError, NotFoundError
from app.models import Employee, FaceProfile

settings = get_settings()
ANGLE_FIELDS = ("front", "left", "right", "up", "down")


class FaceEnrollmentService:
    async def _call_ai_enroll(self, employee_id: UUID, images: dict[str, str]) -> dict[str, bytes]:
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(
                    f"{settings.face_service_url}/enroll",
                    json={"employee_id": str(employee_id), "images": images},
                )
                resp.raise_for_status()
                payload = resp.json()
                embeddings_b64 = payload.get("embeddings", {})
                return {
                    angle: base64.b64decode(value)
                    for angle, value in embeddings_b64.items()
                    if angle in ANGLE_FIELDS
                }
        except httpx.HTTPError:
            if settings.app_env != "development":
                raise
            return {
                angle: embed_image(images[angle])
                for angle in ANGLE_FIELDS
                if angle in images
            }

    async def enroll(
        self, db: AsyncSession, employee_id: UUID, org_id: UUID, images: dict[str, str]
    ) -> FaceProfile:
        missing = [a for a in ANGLE_FIELDS if a not in images or not images[a]]
        if missing:
            raise ForbiddenError(f"Missing face angles: {', '.join(missing)}")

        employee = await db.get(Employee, employee_id)
        if not employee or employee.organization_id != org_id:
            raise NotFoundError("Employee")

        embeddings = await self._call_ai_enroll(employee_id, images)

        result = await db.execute(
            select(FaceProfile).where(FaceProfile.employee_id == employee_id)
        )
        profile = result.scalar_one_or_none()
        if not profile:
            profile = FaceProfile(employee_id=employee_id, organization_id=org_id)
            db.add(profile)
        else:
            profile.version += 1

        profile.embedding_front = encrypt_bytes(embeddings.get("front", b""))
        profile.embedding_left = encrypt_bytes(embeddings.get("left", b""))
        profile.embedding_right = encrypt_bytes(embeddings.get("right", b""))
        profile.embedding_up = encrypt_bytes(embeddings.get("up", b""))
        profile.embedding_down = encrypt_bytes(embeddings.get("down", b""))

        employee.face_enrolled = True
        await db.flush()
        return profile

    async def get_status(self, db: AsyncSession, employee_id: UUID) -> dict:
        employee = await db.get(Employee, employee_id)
        if not employee:
            raise NotFoundError("Employee")
        result = await db.execute(
            select(FaceProfile).where(FaceProfile.employee_id == employee_id)
        )
        profile = result.scalar_one_or_none()
        return {
            "face_enrolled": employee.face_enrolled,
            "version": profile.version if profile else 0,
            "enrolled_at": profile.enrolled_at.isoformat() if profile else None,
        }
