"""Add consent_pins table for SMS verification

Revision ID: h7g8i9j0k1l2
Revises: a6f7b8c9d0e1
Create Date: 2026-02-23

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "h7g8i9j0k1l2"
down_revision: Union[str, None] = "a6f7b8c9d0e1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "consent_pins",
        sa.Column("pin_id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "consultation_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("consultations.consultation_id"),
            nullable=False,
        ),
        sa.Column("pin_code", sa.String(6), nullable=False),
        sa.Column("phone_number", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("verified", sa.Boolean(), default=False, nullable=False),
        sa.Column("verified_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index(
        "idx_consent_pins_consultation",
        "consent_pins",
        ["consultation_id"],
    )


def downgrade() -> None:
    op.drop_index("idx_consent_pins_consultation")
    op.drop_table("consent_pins")
