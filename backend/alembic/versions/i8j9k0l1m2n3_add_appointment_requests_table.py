"""Add appointment_requests table

Revision ID: i8j9k0l1m2n3
Revises: h7g8i9j0k1l2
Create Date: 2026-02-23

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "i8j9k0l1m2n3"
down_revision: Union[str, None] = "h7g8i9j0k1l2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "appointment_requests",
        sa.Column("request_id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "consultation_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("consultations.consultation_id"),
            nullable=True,
        ),
        sa.Column(
            "requested_by_user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.user_id"),
            nullable=False,
        ),
        sa.Column(
            "specialist_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("practitioners.practitioner_id"),
            nullable=True,
        ),
        sa.Column("proposed_datetime", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", sa.String(), nullable=False, default="PENDING"),
        sa.Column("specialist_proposed_datetime", sa.DateTime(timezone=True), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("rejection_reason", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index(
        "idx_appointment_requests_requester",
        "appointment_requests",
        ["requested_by_user_id"],
    )
    op.create_index(
        "idx_appointment_requests_specialist",
        "appointment_requests",
        ["specialist_id"],
    )
    op.create_index(
        "idx_appointment_requests_status",
        "appointment_requests",
        ["status"],
    )


def downgrade() -> None:
    op.drop_index("idx_appointment_requests_status")
    op.drop_index("idx_appointment_requests_specialist")
    op.drop_index("idx_appointment_requests_requester")
    op.drop_table("appointment_requests")
