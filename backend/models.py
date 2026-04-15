import uuid
from datetime import datetime
from sqlalchemy import Boolean, Column, Integer, String, ForeignKey, DateTime, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from database import Base


class Timeline(Base):
    __tablename__ = "timelines"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ambition = Column(Integer, nullable=False)
    risk_tolerance = Column(Integer, nullable=False)
    career = Column(String, nullable=False)
    location = Column(String, nullable=False)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("timelines.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_complete = Column(Boolean, nullable=False, default=False)

    years = relationship("TimelineYear", back_populates="timeline", order_by="TimelineYear.year", cascade="all, delete-orphan")


class TimelineYear(Base):
    __tablename__ = "timeline_years"
    __table_args__ = (UniqueConstraint("timeline_id", "year", name="uq_timeline_year"),)

    id = Column(Integer, primary_key=True, autoincrement=True)
    timeline_id = Column(UUID(as_uuid=True), ForeignKey("timelines.id", ondelete="CASCADE"), nullable=False)
    year = Column(Integer, nullable=False)
    income = Column(Integer, nullable=False)
    stress = Column(Integer, nullable=False)
    happiness = Column(Integer, nullable=False)
    career_title = Column(String, nullable=False)
    life_event = Column(Text, nullable=False)
    decision = Column(String, nullable=True)
    is_locked = Column(Boolean, nullable=False, default=False)
    pending_modifiers = Column(Text, nullable=True)  # JSON: list[dict] of modifier state
    title_idx = Column(Integer, nullable=False, default=0)
    gross_income = Column(Integer, nullable=False, default=0)
    tax_paid = Column(Integer, nullable=False, default=0)
    net_income = Column(Integer, nullable=False, default=0)
    wallet = Column(Integer, nullable=False, default=0)

    timeline = relationship("Timeline", back_populates="years")
