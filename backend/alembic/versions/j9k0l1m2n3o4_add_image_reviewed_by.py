"""add reviewed_by to images

Revision ID: j9k0l1m2n3o4
Revises: i8j9k0l1m2n3
Create Date: 2026-03-12
"""
from typing import Union

import sqlalchemy as sa
from alembic import op

revision: str = "j9k0l1m2n3o4"
down_revision: Union[str, None] = "i8j9k0l1m2n3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "images",
        sa.Column(
            "reviewed_by",
            sa.dialects.postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.user_id"),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_column("images", "reviewed_by")
