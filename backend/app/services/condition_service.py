import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.condition import Condition
from app.schemas.condition import ConditionCreate


# 8 predefined conditions from ml_service.py
PREDEFINED_CONDITIONS = [
    {"name": "autoimmune", "category": "URGENT"},
    {"name": "benign_neoplastic", "category": "NON_URGENT"},
    {"name": "eczematous_dermatitis", "category": "NON_URGENT"},
    {"name": "genetic_neurocutaneous", "category": "NON_URGENT"},
    {"name": "malignant", "category": "URGENT"},
    {"name": "papulosquamous", "category": "NON_URGENT"},
    {"name": "parasitic", "category": "NON_URGENT"},
    {"name": "pigmentary", "category": "NON_URGENT"},
]


async def seed_predefined_conditions(db: AsyncSession) -> None:
    """Seed the 8 predefined ML conditions if they don't exist."""
    for cond_data in PREDEFINED_CONDITIONS:
        result = await db.execute(
            select(Condition).where(Condition.condition_name == cond_data["name"])
        )
        existing = result.scalar_one_or_none()
        if not existing:
            condition = Condition(
                condition_id=uuid.uuid4(),
                condition_name=cond_data["name"],
                category=cond_data["category"],
                is_predefined=True,
            )
            db.add(condition)
    await db.commit()


async def list_conditions(db: AsyncSession) -> list[Condition]:
    """List all conditions (predefined and custom)."""
    result = await db.execute(select(Condition).order_by(Condition.is_predefined.desc(), Condition.condition_name))
    return list(result.scalars().all())


async def create_condition(data: ConditionCreate, db: AsyncSession) -> Condition:
    """Create a custom condition."""
    condition = Condition(
        condition_id=uuid.uuid4(),
        condition_name=data.condition_name,
        category=data.category,
        is_predefined=False,
    )
    db.add(condition)
    await db.commit()
    await db.refresh(condition)
    return condition


async def get_condition_by_name(name: str, db: AsyncSession) -> Condition | None:
    """Get condition by name."""
    result = await db.execute(select(Condition).where(Condition.condition_name == name))
    return result.scalar_one_or_none()
