"""Add consultation disposition and outcome tracking

Revision ID: a6f7b8c9d0e1
Revises: f5e6a7b8c9d0
Create Date: 2026-02-23

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a6f7b8c9d0e1"
down_revision: Union[str, None] = "f5e6a7b8c9d0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("consultations", sa.Column("disposition", sa.String(), nullable=True))
    op.add_column("consultations", sa.Column("referral_note", sa.Text(), nullable=True))
    op.add_column("consultations", sa.Column("got_treatment", sa.Boolean(), nullable=True))
    op.add_column("consultations", sa.Column("outcome_verified", sa.Boolean(), nullable=True))


def downgrade() -> None:
    op.drop_column("consultations", "outcome_verified")
    op.drop_column("consultations", "got_treatment")
    op.drop_column("consultations", "referral_note")
    op.drop_column("consultations", "disposition")
