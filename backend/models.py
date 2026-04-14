import uuid
from datetime import datetime
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
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

    years = relationship("TimelineYear", back_populates="timeline", order_by="TimelineYear.year", cascade="all, delete-orphan")


class TimelineYear(Base):
    __tablename__ = "timeline_years"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timeline_id = Column(UUID(as_uuid=True), ForeignKey("timelines.id", ondelete="CASCADE"), nullable=False)
    year = Column(Integer, nullable=False)
    income = Column(Integer, nullable=False)
    stress = Column(Integer, nullable=False)
    happiness = Column(Integer, nullable=False)
    career_title = Column(String, nullable=False)
    life_event = Column(Text, nullable=False)

    timeline = relationship("Timeline", back_populates="years")
