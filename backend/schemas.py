from uuid import UUID
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class SimulateRequest(BaseModel):
    ambition: int = Field(..., ge=1, le=10)
    risk_tolerance: int = Field(..., ge=1, le=10)
    career: str = Field(..., pattern="^(ib|swe|startup)$")
    location: str = Field(..., min_length=1)


class BranchRequest(BaseModel):
    timeline_id: UUID
    new_career: str = Field(..., pattern="^(ib|swe|startup)$")


class YearOut(BaseModel):
    year: int
    income: int
    stress: int
    happiness: int
    career_title: str
    life_event: str

    model_config = {"from_attributes": True}


class TimelineOut(BaseModel):
    id: UUID
    ambition: int
    risk_tolerance: int
    career: str
    location: str
    parent_id: Optional[UUID]
    created_at: datetime
    years: list[YearOut]

    model_config = {"from_attributes": True}


class CompareOut(BaseModel):
    timeline1: TimelineOut
    timeline2: TimelineOut
