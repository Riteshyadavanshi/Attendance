from datetime import datetime, time, timezone, timedelta
from math import atan2, cos, radians, sin, sqrt
from uuid import UUID

import httpx
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import get_settings
from app.core.encryption import decrypt_bytes
from app.core.exceptions import (
    AlreadyCheckedInError,
    FaceNotMatchedError,
    ForbiddenError,
    GeofenceError,
    LivenessFailedError,
    NotFoundError,
)
from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
)
from app.models import (
    AttendanceRecord,
    AttendanceRule,
    Department,
    Employee,
    FaceProfile,
    OfficeLocation,
    Organization,
    Role,
    User,
    UserRole,
)
from app.services.face_matching import ANGLE_KEYS, is_legacy_embedding, verify_against_stored
from app.services.timezone_utils import (
    classify_check_in_status,
    format_late_after,
    get_org_timezone,
    is_valid_work_session_check_in,
    minutes_late,
    org_today,
    validate_check_in_window,
)

settings = get_settings()


class AuthService:
    async def login(
        self, db: AsyncSession, email: str, password: str, mfa_code: str | None = None
    ) -> dict:
        result = await db.execute(
            select(User)
            .options(selectinload(User.roles), selectinload(User.employee))
            .where(User.email == email, User.is_active.is_(True))
        )
        user = result.scalar_one_or_none()
        if not user or not verify_password(password, user.password_hash):
            raise ForbiddenError("Invalid email or password")

        roles = [r.name for r in user.roles]
        employee_id = str(user.employee.id) if user.employee else None

        user.last_login_at = datetime.now(timezone.utc)
        access = create_access_token(
            str(user.id), str(user.organization_id), roles, employee_id
        )
        refresh = create_refresh_token(str(user.id))
        return {
            "access_token": access,
            "refresh_token": refresh,
            "expires_in": settings.access_token_expire_minutes * 60,
            "user": {
                "id": user.id,
                "email": user.email,
                "roles": roles,
                "organization_id": user.organization_id,
                "employee_id": user.employee.id if user.employee else None,
                "full_name": user.employee.full_name if user.employee else None,
            },
        }


class GeofenceService:
    @staticmethod
    def haversine_distance_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        r = 6371000
        phi1, phi2 = radians(lat1), radians(lat2)
        dphi = radians(lat2 - lat1)
        dlambda = radians(lon2 - lon1)
        a = sin(dphi / 2) ** 2 + cos(phi1) * cos(phi2) * sin(dlambda / 2) ** 2
        return r * 2 * atan2(sqrt(a), sqrt(1 - a))

    async def nearest_distance_m(
        self, db: AsyncSession, org_id: UUID, latitude: float, longitude: float
    ) -> float | None:
        result = await db.execute(
            select(OfficeLocation).where(
                OfficeLocation.organization_id == org_id,
                OfficeLocation.is_active.is_(True),
            )
        )
        locations = result.scalars().all()
        if not locations:
            return None
        return min(
            self.haversine_distance_m(latitude, longitude, float(loc.latitude), float(loc.longitude))
            for loc in locations
        )

    async def validate(
        self, db: AsyncSession, org_id: UUID, latitude: float, longitude: float
    ) -> OfficeLocation:
        result = await db.execute(
            select(OfficeLocation).where(
                OfficeLocation.organization_id == org_id,
                OfficeLocation.is_active.is_(True),
            )
        )
        locations = result.scalars().all()
        if not locations:
            raise GeofenceError("No office location configured")

        nearest = None
        min_dist = float("inf")
        for loc in locations:
            dist = self.haversine_distance_m(
                latitude, longitude, float(loc.latitude), float(loc.longitude)
            )
            if dist < min_dist:
                min_dist = dist
                nearest = loc

        assert nearest is not None
        if min_dist > nearest.radius_meters:
            raise GeofenceError(
                f"You are {int(min_dist)}m away. Must be within {nearest.radius_meters}m."
            )
        return nearest


class FaceServiceClient:
    async def _load_stored_embeddings(self, db: AsyncSession, employee_id: UUID) -> dict[str, bytes]:
        result = await db.execute(
            select(FaceProfile).where(FaceProfile.employee_id == employee_id)
        )
        profile = result.scalar_one_or_none()
        if not profile:
            return {}

        stored: dict[str, bytes] = {}
        for angle in ANGLE_KEYS:
            encrypted = getattr(profile, f"embedding_{angle}", None)
            if encrypted:
                stored[angle] = decrypt_bytes(encrypted)
        return stored

    async def verify(self, db: AsyncSession, employee_id: UUID, face_image: str) -> dict:
        import base64

        stored = await self._load_stored_embeddings(db, employee_id)
        if not stored:
            raise FaceNotMatchedError()

        if any(is_legacy_embedding(emb) for emb in stored.values()):
            raise ForbiddenError(
                "Face profile is outdated. Open Face Enrollment and capture all angles again."
            )

        payload: dict = {"employee_id": str(employee_id), "image": face_image}
        if stored:
            payload["stored_embeddings"] = {
                angle: base64.b64encode(value).decode() for angle, value in stored.items()
            }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(f"{settings.face_service_url}/verify", json=payload)
                if resp.status_code == 200:
                    result = resp.json()
                    if result.get("face_matched"):
                        return result
        except httpx.HTTPError:
            pass

        # Local fallback when AI service is down or returns no match with stale cache
        result = verify_against_stored(face_image, stored)
        if result.get("face_matched"):
            return result

        raise FaceNotMatchedError()


class AttendanceService:
    def __init__(self):
        self.geofence = GeofenceService()
        self.face_client = FaceServiceClient()

    async def _get_rules(self, db: AsyncSession, org_id: UUID) -> AttendanceRule:
        result = await db.execute(
            select(AttendanceRule).where(AttendanceRule.organization_id == org_id)
        )
        rules = result.scalar_one_or_none()
        if not rules:
            raise NotFoundError("Attendance rules")
        return rules

    def _classify_status(self, check_in: datetime, rules: AttendanceRule, org_tz) -> str:
        return classify_check_in_status(
            check_in,
            rules.work_start_time,
            rules.late_threshold_minutes,
            org_tz,
        )

    async def _enforce_gps_accuracy(
        self,
        db: AsyncSession,
        org_id: UUID,
        latitude: float,
        longitude: float,
        accuracy: float | None,
    ) -> None:
        if not accuracy:
            return
        limit = settings.max_gps_accuracy_m
        if settings.app_env == "development":
            limit *= 2

        # Indoors / desktop browsers often report ±100m+ even at the correct spot.
        # If the reading is already at the office, relax the accuracy requirement.
        dist = await self.geofence.nearest_distance_m(db, org_id, latitude, longitude)
        if dist is not None and dist <= 50:
            limit = max(limit, 200)

        if accuracy > limit:
            raise GeofenceError(
                f"GPS accuracy too low (±{int(accuracy)}m). Move near a window, wait a few seconds, "
                "then tap Refresh GPS. On your phone enable Precise Location / High accuracy mode."
            )

    async def check_in(
        self,
        db: AsyncSession,
        employee_id: UUID,
        org_id: UUID,
        face_image: str,
        latitude: float,
        longitude: float,
        device_info: dict | None,
        accuracy: float | None = None,
    ) -> AttendanceRecord:
        await self._enforce_gps_accuracy(db, org_id, latitude, longitude, accuracy)

        emp = await db.get(Employee, employee_id)
        if not emp or not emp.face_enrolled:
            raise ForbiddenError("Face not enrolled. Complete enrollment first.")

        org_tz = await get_org_timezone(db, org_id)
        today = org_today(org_tz)
        existing = await db.execute(
            select(AttendanceRecord).where(
                AttendanceRecord.employee_id == employee_id,
                AttendanceRecord.date == today,
            )
        )
        record = existing.scalar_one_or_none()
        if record and record.check_in_at:
            raise AlreadyCheckedInError()

        face_result = await self.face_client.verify(db, employee_id, face_image)
        if not face_result.get("face_matched"):
            raise FaceNotMatchedError()
        if face_result.get("liveness_score", 0) < settings.liveness_threshold:
            raise LivenessFailedError()

        office = await self.geofence.validate(db, org_id, latitude, longitude)
        rules = await self._get_rules(db, org_id)
        now = datetime.now(timezone.utc)
        validate_check_in_window(
            now,
            rules.work_start_time,
            rules.work_end_time,
            org_tz,
            settings.check_in_early_buffer_minutes,
        )
        status = self._classify_status(now, rules, org_tz)

        if record:
            record.check_in_at = now
            record.check_in_lat = latitude
            record.check_in_lng = longitude
            record.office_location_id = office.id
            record.status = status
            record.face_verified = True
            record.geo_verified = True
            record.device_info = device_info
        else:
            record = AttendanceRecord(
                organization_id=org_id,
                employee_id=employee_id,
                date=today,
                check_in_at=now,
                check_in_lat=latitude,
                check_in_lng=longitude,
                office_location_id=office.id,
                status=status,
                face_verified=True,
                geo_verified=True,
                device_info=device_info,
            )
            db.add(record)

        await db.flush()
        return record

    async def check_out(
        self,
        db: AsyncSession,
        employee_id: UUID,
        org_id: UUID,
        face_image: str,
        latitude: float,
        longitude: float,
        device_info: dict | None,
    ) -> AttendanceRecord:
        org_tz = await get_org_timezone(db, org_id)
        today = org_today(org_tz)
        result = await db.execute(
            select(AttendanceRecord).where(
                AttendanceRecord.employee_id == employee_id,
                AttendanceRecord.date == today,
            )
        )
        record = result.scalar_one_or_none()
        if not record or not record.check_in_at:
            raise NotFoundError("Today's check-in")
        if record.check_out_at:
            raise ForbiddenError("Already checked out today")

        face_result = await self.face_client.verify(db, employee_id, face_image)
        if not face_result.get("face_matched"):
            raise FaceNotMatchedError()

        await self.geofence.validate(db, org_id, latitude, longitude)
        now = datetime.now(timezone.utc)
        record.check_out_at = now
        record.check_out_lat = latitude
        record.check_out_lng = longitude
        record.working_minutes = int((now - record.check_in_at).total_seconds() / 60)

        rules = await self._get_rules(db, org_id)
        half_day_mins = int(float(rules.half_day_threshold_hours) * 60)
        valid_session = is_valid_work_session_check_in(
            record.check_in_at,
            rules.work_start_time,
            rules.work_end_time,
            org_tz,
            settings.check_in_early_buffer_minutes,
        )
        if valid_session and record.working_minutes < half_day_mins:
            record.status = "half_day"

        await db.flush()
        return record

    async def get_dashboard(self, db: AsyncSession, org_id: UUID) -> dict:
        org_tz = await get_org_timezone(db, org_id)
        today = org_today(org_tz)
        total = await db.scalar(
            select(func.count(Employee.id)).where(
                Employee.organization_id == org_id, Employee.is_active.is_(True)
            )
        )
        records = await db.execute(
            select(AttendanceRecord).where(
                AttendanceRecord.organization_id == org_id,
                AttendanceRecord.date == today,
            )
        )
        rows = records.scalars().all()
        present = sum(1 for r in rows if r.status in ("present", "late"))
        late = sum(1 for r in rows if r.status == "late")
        active = sum(1 for r in rows if r.check_in_at and not r.check_out_at)
        late_board = await self.get_late_today(db, org_id)
        return {
            "date": str(today),
            "total_employees": total or 0,
            "present": present,
            "absent": (total or 0) - present,
            "late": late,
            "active_check_ins": active,
            "late_today": late_board.get("items", []),
        }

    async def get_late_today(self, db: AsyncSession, org_id: UUID) -> dict:
        org_tz = await get_org_timezone(db, org_id)
        today = org_today(org_tz)
        rules = await self._get_rules(db, org_id)
        late_after = format_late_after(rules.work_start_time, rules.late_threshold_minutes)

        result = await db.execute(
            select(AttendanceRecord, Employee)
            .join(Employee, AttendanceRecord.employee_id == Employee.id)
            .where(
                AttendanceRecord.organization_id == org_id,
                AttendanceRecord.date == today,
                AttendanceRecord.status == "late",
                AttendanceRecord.check_in_at.isnot(None),
                Employee.is_active.is_(True),
            )
        )
        rows = result.all()
        scored = []
        for record, employee in rows:
            late_mins = minutes_late(
                record.check_in_at,
                rules.work_start_time,
                rules.late_threshold_minutes,
                org_tz,
            )
            scored.append(
                {
                    "employee_id": str(employee.id),
                    "employee_name": employee.full_name,
                    "employee_code": employee.employee_code,
                    "designation": employee.designation,
                    "check_in_at": record.check_in_at.isoformat() if record.check_in_at else None,
                    "minutes_late": late_mins,
                }
            )

        scored.sort(key=lambda x: (-x["minutes_late"], x["check_in_at"] or ""))
        items = []
        for idx, row in enumerate(scored, start=1):
            items.append({**row, "rank": idx})

        return {
            "date": str(today),
            "late_after_time": late_after,
            "total_late": len(items),
            "items": items,
        }

    async def get_late_leaderboard(self, db: AsyncSession, org_id: UUID) -> dict:
        """All-time company late ranking by total late days."""
        org_tz = await get_org_timezone(db, org_id)
        rules = await self._get_rules(db, org_id)

        result = await db.execute(
            select(AttendanceRecord, Employee)
            .join(Employee, AttendanceRecord.employee_id == Employee.id)
            .where(
                AttendanceRecord.organization_id == org_id,
                AttendanceRecord.status == "late",
                AttendanceRecord.check_in_at.isnot(None),
                Employee.is_active.is_(True),
            )
        )

        by_employee: dict = {}
        for record, employee in result.all():
            eid = employee.id
            if eid not in by_employee:
                by_employee[eid] = {
                    "employee_id": str(employee.id),
                    "employee_name": employee.full_name,
                    "employee_code": employee.employee_code,
                    "designation": employee.designation,
                    "late_days": 0,
                    "total_minutes_late": 0,
                    "last_late_at": None,
                }
            row = by_employee[eid]
            row["late_days"] += 1
            row["total_minutes_late"] += minutes_late(
                record.check_in_at,
                rules.work_start_time,
                rules.late_threshold_minutes,
                org_tz,
            )
            check_in_iso = record.check_in_at.isoformat() if record.check_in_at else None
            if check_in_iso and (row["last_late_at"] is None or check_in_iso > row["last_late_at"]):
                row["last_late_at"] = check_in_iso

        scored = sorted(
            by_employee.values(),
            key=lambda x: (-x["late_days"], -x["total_minutes_late"], x["employee_name"]),
        )
        items = [{**row, "rank": idx} for idx, row in enumerate(scored, start=1)]

        return {
            "scope": "all_time",
            "total_late_days": sum(r["late_days"] for r in scored),
            "total_employees": len(items),
            "items": items,
        }


class OrganizationService:
    async def create_org(
        self, db: AsyncSession, name: str, slug: str, timezone: str
    ) -> Organization:
        org = Organization(name=name, slug=slug, timezone=timezone)
        db.add(org)
        await db.flush()

        rules = AttendanceRule(
            organization_id=org.id,
            work_start_time=time(9, 0),
            work_end_time=time(18, 0),
        )
        db.add(rules)
        await db.flush()
        return org

    async def create_department(
        self, db: AsyncSession, org_id: UUID, name: str, code: str | None
    ) -> Department:
        dept = Department(organization_id=org_id, name=name, code=code)
        db.add(dept)
        await db.flush()
        return dept

    async def create_employee(
        self, db: AsyncSession, org_id: UUID, data: dict
    ) -> Employee:
        user = User(
            organization_id=org_id,
            email=data["email"],
            password_hash=hash_password(data["password"]),
        )
        db.add(user)
        await db.flush()

        for role_name in data.get("roles", ["employee"]):
            role_result = await db.execute(select(Role).where(Role.name == role_name))
            role = role_result.scalar_one()
            db.add(UserRole(user_id=user.id, role_id=role.id, organization_id=org_id))

        employee = Employee(
            organization_id=org_id,
            user_id=user.id,
            department_id=data.get("department_id"),
            employee_code=data["employee_code"],
            full_name=data["full_name"],
            designation=data.get("designation"),
            mobile=data.get("mobile"),
            gender=data.get("gender"),
            date_of_birth=data.get("date_of_birth"),
            location=data.get("location"),
        )
        db.add(employee)
        await db.flush()
        return employee
