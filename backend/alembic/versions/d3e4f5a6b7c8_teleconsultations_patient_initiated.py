"""Teleconsultations: add requested_by_user_id, practitioner_id nullable

Revision ID: d3e4f5a6b7c8
Revises: c2d3e4f5a6b7
Create Date: 2026-02-15

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


revision: str = "d3e4f5a6b7c8"
down_revision: Union[str, None] = "c2d3e4f5a6b7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add requested_by_user_id (nullable first for backfill)
    op.add_column(
        "teleconsultations",
        sa.Column("requested_by_user_id", UUID(as_uuid=True), nullable=True),
    )
    # Backfill: existing rows had practitioner_id (required before), use that practitioner's user_id
    op.execute("""
        UPDATE teleconsultations t
        SET requested_by_user_id = p.user_id
        FROM practitioners p
        WHERE t.practitioner_id = p.practitioner_id
    """)
    op.alter_column(
        "teleconsultations",
        "requested_by_user_id",
        existing_type=UUID(as_uuid=True),
        nullable=False,
    )
    op.create_foreign_key(
        "fk_teleconsultations_requested_by_user",
        "teleconsultations",
        "users",
        ["requested_by_user_id"],
        ["user_id"],
    )
    op.alter_column(
        "teleconsultations",
        "practitioner_id",
        existing_type=UUID(as_uuid=True),
        nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        "teleconsultations",
        "practitioner_id",
        existing_type=UUID(as_uuid=True),
        nullable=False,
    )
    op.drop_constraint(
        "fk_teleconsultations_requested_by_user",
        "teleconsultations",
        type_="foreignkey",
    )
    op.drop_column("teleconsultations", "requested_by_user_id")
