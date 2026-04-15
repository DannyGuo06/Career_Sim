import os
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:password@localhost:5432/lifesim")

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.execute(text(
            "ALTER TABLE timeline_years ADD COLUMN IF NOT EXISTS decision VARCHAR"
        ))
        await conn.execute(text(
            "ALTER TABLE timeline_years ADD COLUMN IF NOT EXISTS is_locked BOOLEAN NOT NULL DEFAULT FALSE"
        ))
        await conn.execute(text(
            "ALTER TABLE timelines ADD COLUMN IF NOT EXISTS is_complete BOOLEAN NOT NULL DEFAULT FALSE"
        ))
        await conn.execute(text(
            "ALTER TABLE timeline_years ADD COLUMN IF NOT EXISTS pending_modifiers TEXT"
        ))
        await conn.execute(text(
            "ALTER TABLE timeline_years ADD COLUMN IF NOT EXISTS title_idx INTEGER NOT NULL DEFAULT 0"
        ))


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
