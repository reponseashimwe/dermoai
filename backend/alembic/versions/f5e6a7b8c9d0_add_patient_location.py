"""Add patient location (district, province)

Revision ID: f5e6a7b8c9d0
Revises: e4f5a6b7c8d9
Create Date: 2026-02-23

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f5e6a7b8c9d0"
down_revision: Union[str, None] = "e4f5a6b7c8d9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("patients", sa.Column("district", sa.String(), nullable=True))
    op.add_column("patients", sa.Column("province", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("patients", "province")
    op.drop_column("patients", "district")
