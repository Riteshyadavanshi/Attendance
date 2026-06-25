"""add gender, date_of_birth, location to employees

Revision ID: 0001_employee_profile_fields
Revises:
Create Date: 2026-06-25

Idempotent: uses ADD COLUMN IF NOT EXISTS so it can be applied safely to an
existing database whose schema was bootstrapped outside of Alembic.
"""

from alembic import op

revision = "0001_employee_profile_fields"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE employees ADD COLUMN IF NOT EXISTS gender VARCHAR(20)")
    op.execute("ALTER TABLE employees ADD COLUMN IF NOT EXISTS date_of_birth DATE")
    op.execute("ALTER TABLE employees ADD COLUMN IF NOT EXISTS location VARCHAR(255)")


def downgrade() -> None:
    op.execute("ALTER TABLE employees DROP COLUMN IF EXISTS location")
    op.execute("ALTER TABLE employees DROP COLUMN IF EXISTS date_of_birth")
    op.execute("ALTER TABLE employees DROP COLUMN IF EXISTS gender")
