from uuid import UUID
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from database import init_db, get_db
from models import Timeline, TimelineYear
from schemas import SimulateRequest, BranchRequest, TimelineOut, CompareOut
import simulation as sim


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="AI Life Simulator", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


async def _fetch_timeline(timeline_id: UUID, db: AsyncSession) -> Timeline:
    result = await db.execute(
        select(Timeline)
        .where(Timeline.id == timeline_id)
        .options(selectinload(Timeline.years))
    )
    tl = result.scalar_one_or_none()
    if not tl:
        raise HTTPException(status_code=404, detail="Timeline not found")
    return tl


async def _create_timeline(
    career: str,
    ambition: int,
    risk_tolerance: int,
    location: str,
    parent_id,
    db: AsyncSession,
) -> Timeline:
    years_data = await sim.simulate(career, ambition, risk_tolerance, location)

    timeline = Timeline(
        career=career,
        ambition=ambition,
        risk_tolerance=risk_tolerance,
        location=location,
        parent_id=parent_id,
    )
    db.add(timeline)
    await db.flush()  # get timeline.id

    for y in years_data:
        db.add(TimelineYear(timeline_id=timeline.id, **y))

    await db.commit()
    await db.refresh(timeline)

    # Reload with years
    return await _fetch_timeline(timeline.id, db)


@app.post("/simulate", response_model=TimelineOut)
async def simulate_endpoint(req: SimulateRequest, db: AsyncSession = Depends(get_db)):
    return await _create_timeline(
        career=req.career,
        ambition=req.ambition,
        risk_tolerance=req.risk_tolerance,
        location=req.location,
        parent_id=None,
        db=db,
    )


@app.post("/branch", response_model=TimelineOut)
async def branch_endpoint(req: BranchRequest, db: AsyncSession = Depends(get_db)):
    parent = await _fetch_timeline(req.timeline_id, db)
    return await _create_timeline(
        career=req.new_career,
        ambition=parent.ambition,
        risk_tolerance=parent.risk_tolerance,
        location=parent.location,
        parent_id=parent.id,
        db=db,
    )


@app.get("/timeline/{timeline_id}", response_model=TimelineOut)
async def get_timeline(timeline_id: UUID, db: AsyncSession = Depends(get_db)):
    return await _fetch_timeline(timeline_id, db)


@app.get("/compare/{id1}/{id2}", response_model=CompareOut)
async def compare(id1: UUID, id2: UUID, db: AsyncSession = Depends(get_db)):
    tl1, tl2 = await _fetch_timeline(id1, db), await _fetch_timeline(id2, db)
    return CompareOut(timeline1=tl1, timeline2=tl2)
