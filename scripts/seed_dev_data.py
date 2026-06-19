"""Initialize database tables and seed development data."""

import asyncio
import sys
from datetime import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import get_settings
from app.core.database import Base
from app.core.security import hash_password
from app.models import (
    AttendanceRule,
    Department,
    Employee,
    OfficeLocation,
    Organization,
    Role,
    User,
    UserRole,
)

settings = get_settings()
engine = create_async_engine(settings.database_url, echo=True)
Session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

ROLES = ["employee", "hr"]

USERS = [
    ("hr@demo.com", "hr", "HR001", "HR Admin"),
    ("employee@demo.com", "employee", "EMP001", "Demo Employee"),
]


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Tables created.")


async def ensure_roles(db: AsyncSession) -> dict[str, Role]:
    roles_map: dict[str, Role] = {}
    for role_name in ROLES:
        result = await db.execute(select(Role).where(Role.name == role_name))
        role = result.scalar_one_or_none()
        if not role:
            role = Role(name=role_name, description=role_name.replace("_", " ").title())
            db.add(role)
            await db.flush()
        roles_map[role_name] = role
    return roles_map


async def seed():
    async with Session() as db:
        existing = await db.execute(select(Organization).where(Organization.slug == "demo-org"))
        org = existing.scalar_one_or_none()
        if org:
            await ensure_roles(db)
            await db.commit()
            print("Organization exists — ensured employee/hr roles.")
            print("Login HR: hr@demo.com / Demo@123")
            print("Login Employee: employee@demo.com / Demo@123")
            return

        org = Organization(name="Demo Organization", slug="demo-org", timezone="Asia/Kolkata")
        db.add(org)
        await db.flush()

        roles_map = await ensure_roles(db)

        dept = Department(organization_id=org.id, name="Engineering", code="ENG")
        db.add(dept)
        await db.flush()

        db.add(
            AttendanceRule(
                organization_id=org.id,
                work_start_time=time(9, 0),
                work_end_time=time(18, 0),
                late_threshold_minutes=15,
                half_day_threshold_hours=4.0,
                standard_hours=8.0,
                working_days=[1, 2, 3, 4, 5],
            )
        )

        db.add(
            OfficeLocation(
                organization_id=org.id,
                name="HQ Office",
                latitude=28.6139,
                longitude=77.2090,
                radius_meters=300,
            )
        )

        for email, role_name, code, full_name in USERS:
            user = User(
                organization_id=org.id,
                email=email,
                password_hash=hash_password("Demo@123"),
            )
            db.add(user)
            await db.flush()

            db.add(
                UserRole(user_id=user.id, role_id=roles_map[role_name].id, organization_id=org.id)
            )

            emp = Employee(
                organization_id=org.id,
                user_id=user.id,
                department_id=dept.id,
                employee_code=code,
                full_name=full_name,
                designation=role_name.replace("_", " ").title(),
                face_enrolled=role_name == "employee",
            )
            db.add(emp)

        await db.commit()
        print("Seed data created.")
        print("Login HR: hr@demo.com / Demo@123")
        print("Login Employee: employee@demo.com / Demo@123")


async def main():
    await init_db()
    await seed()
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
