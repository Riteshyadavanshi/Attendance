"""Ensure hr role exists and hr@demo.com can log in (for existing dev databases)."""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import get_settings
from app.core.security import hash_password
from app.models import Department, Employee, Organization, Role, User, UserRole

settings = get_settings()
engine = create_async_engine(settings.database_url)
Session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def main():
    async with Session() as db:
        org_result = await db.execute(select(Organization).where(Organization.slug == "demo-org"))
        org = org_result.scalar_one_or_none()
        if not org:
            print("No demo-org found. Run seed_dev_data.py first.")
            return

        role_result = await db.execute(select(Role).where(Role.name == "hr"))
        hr_role = role_result.scalar_one_or_none()
        if not hr_role:
            hr_role = Role(name="hr", description="HR Admin")
            db.add(hr_role)
            await db.flush()
            print("Created hr role.")

        user_result = await db.execute(select(User).where(User.email == "hr@demo.com"))
        user = user_result.scalar_one_or_none()
        if not user:
            dept_result = await db.execute(
                select(Department).where(Department.organization_id == org.id).limit(1)
            )
            dept = dept_result.scalar_one_or_none()
            user = User(
                organization_id=org.id,
                email="hr@demo.com",
                password_hash=hash_password("Demo@123"),
            )
            db.add(user)
            await db.flush()
            db.add(UserRole(user_id=user.id, role_id=hr_role.id, organization_id=org.id))
            db.add(
                Employee(
                    organization_id=org.id,
                    user_id=user.id,
                    department_id=dept.id if dept else None,
                    employee_code="HR001",
                    full_name="HR Admin",
                    designation="HR",
                )
            )
            print("Created hr@demo.com user.")
        else:
            link = await db.execute(
                select(UserRole).where(UserRole.user_id == user.id, UserRole.role_id == hr_role.id)
            )
            if not link.scalar_one_or_none():
                db.add(UserRole(user_id=user.id, role_id=hr_role.id, organization_id=org.id))
                print("Linked hr@demo.com to hr role.")

        await db.commit()
        print("Done. Login: hr@demo.com / Demo@123")


if __name__ == "__main__":
    asyncio.run(main())
