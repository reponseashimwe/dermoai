"""Practitioner availability (is_online, last_active)

Revision ID: a1b2c3d4e5f6
Revises: 22cafefb37b9
Create Date: 2026-02-06 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "22cafefb37b9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "practitioners",
        sa.Column("is_online", sa.Boolean(), nullable=False, server_default="false"),
    )
    op.add_column(
        "practitioners",
        sa.Column("last_active", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("practitioners", "last_active")
    op.drop_column("practitioners", "is_online")
