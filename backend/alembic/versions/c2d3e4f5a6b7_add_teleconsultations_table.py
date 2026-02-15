"""Add teleconsultations table

Revision ID: c2d3e4f5a6b7
Revises: b1c2d3e4f5a6
Create Date: 2026-02-14 18:01:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


revision: str = "c2d3e4f5a6b7"
down_revision: Union[str, None] = "b1c2d3e4f5a6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "teleconsultations",
        sa.Column("teleconsultation_id", UUID(as_uuid=True), primary_key=True),
        sa.Column("consultation_id", UUID(as_uuid=True), nullable=True),
        sa.Column("practitioner_id", UUID(as_uuid=True), nullable=False),
        sa.Column("specialist_id", UUID(as_uuid=True), nullable=True),
        sa.Column("livekit_room_name", sa.String(), nullable=False),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("duration_seconds", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    
    # Add foreign keys
    op.create_foreign_key(
        "fk_teleconsultations_consultation",
        "teleconsultations",
        "consultations",
        ["consultation_id"],
        ["consultation_id"],
    )
    op.create_foreign_key(
        "fk_teleconsultations_practitioner",
        "teleconsultations",
        "practitioners",
        ["practitioner_id"],
        ["practitioner_id"],
    )
    op.create_foreign_key(
        "fk_teleconsultations_specialist",
        "teleconsultations",
        "practitioners",
        ["specialist_id"],
        ["practitioner_id"],
    )


def downgrade() -> None:
    op.drop_constraint("fk_teleconsultations_specialist", "teleconsultations", type_="foreignkey")
    op.drop_constraint("fk_teleconsultations_practitioner", "teleconsultations", type_="foreignkey")
    op.drop_constraint("fk_teleconsultations_consultation", "teleconsultations", type_="foreignkey")
    op.drop_table("teleconsultations")
