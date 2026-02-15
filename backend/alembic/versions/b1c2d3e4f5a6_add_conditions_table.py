"""Add conditions table

Revision ID: b1c2d3e4f5a6
Revises: a1b2c3d4e5f6
Create Date: 2026-02-14 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


revision: str = "b1c2d3e4f5a6"
down_revision: Union[str, None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create conditions table
    op.create_table(
        "conditions",
        sa.Column("condition_id", UUID(as_uuid=True), primary_key=True),
        sa.Column("condition_name", sa.String(), nullable=False, unique=True),
        sa.Column("category", sa.String(), nullable=True),
        sa.Column("is_predefined", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    
    # Add columns to clinical_reviews table
    op.add_column(
        "clinical_reviews",
        sa.Column("condition_id", UUID(as_uuid=True), nullable=True),
    )
    op.add_column(
        "clinical_reviews",
        sa.Column("is_custom_label", sa.Boolean(), nullable=False, server_default="false"),
    )
    
    # Add foreign key
    op.create_foreign_key(
        "fk_clinical_reviews_condition",
        "clinical_reviews",
        "conditions",
        ["condition_id"],
        ["condition_id"],
    )


def downgrade() -> None:
    op.drop_constraint("fk_clinical_reviews_condition", "clinical_reviews", type_="foreignkey")
    op.drop_column("clinical_reviews", "is_custom_label")
    op.drop_column("clinical_reviews", "condition_id")
    op.drop_table("conditions")
