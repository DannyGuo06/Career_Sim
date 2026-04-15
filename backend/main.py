from uuid import UUID
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from database import init_db, get_db
from models import Timeline, TimelineYear
from schemas import SimulateRequest, BranchRequest, DecisionRequest, TimelineOut, YearOut, CompareOut
import simulation as sim

DECISION_YEARS = {3, 6, 9}


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


def _timeline_to_out(tl: Timeline) -> TimelineOut:
    years_sorted = sorted(tl.years, key=lambda y: y.year)
    locked_set = {y.year for y in years_sorted if y.is_locked}

    prereq_met = {3: True, 6: 3 in locked_set, 9: 6 in locked_set}

    year_outs = []
    for y in years_sorted:
        available = []
        if y.year in DECISION_YEARS and not y.is_locked and prereq_met[y.year]:
            available = ["promotion", "stay", "switch_company"]
        year_outs.append(YearOut(
            year=y.year,
            income=y.income,
            stress=y.stress,
            happiness=y.happiness,
            career_title=y.career_title,
            life_event=y.life_event,
            decision=y.decision,
            is_locked=y.is_locked,
            available_decisions=available,
        ))

    return TimelineOut(
        id=tl.id,
        ambition=tl.ambition,
        risk_tolerance=tl.risk_tolerance,
        career=tl.career,
        location=tl.location,
        parent_id=tl.parent_id,
        created_at=tl.created_at,
        years=year_outs,
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
) -> TimelineOut:
    years_data = await sim.simulate(career, ambition, risk_tolerance, location)

    timeline = Timeline(
        career=career,
        ambition=ambition,
        risk_tolerance=risk_tolerance,
        location=location,
        parent_id=parent_id,
    )
    db.add(timeline)
    await db.flush()

    for y in years_data:
        db.add(TimelineYear(timeline_id=timeline.id, **y))

    await db.commit()
    await db.refresh(timeline)

    tl = await _fetch_timeline(timeline.id, db)
    return _timeline_to_out(tl)


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


@app.post("/decision", response_model=TimelineOut)
async def decision_endpoint(req: DecisionRequest, db: AsyncSession = Depends(get_db)):
    tl = await _fetch_timeline(req.timeline_id, db)
    year_map = {y.year: y for y in tl.years}

    if req.year not in DECISION_YEARS:
        raise HTTPException(status_code=400, detail=f"Year {req.year} is not a decision point")
    if year_map[req.year].is_locked:
        raise HTTPException(status_code=400, detail=f"Year {req.year} has already been decided")
    if req.year == 6 and not year_map[3].is_locked:
        raise HTTPException(status_code=400, detail="Must decide year 3 before year 6")
    if req.year == 9 and not year_map[6].is_locked:
        raise HTTPException(status_code=400, detail="Must decide year 6 before year 9")

    prev = year_map[req.year - 1]
    new_years = await sim.recompute_from_decision(
        decision_year=req.year,
        decision=req.decision,
        career=tl.career,
        ambition=tl.ambition,
        risk_tolerance=tl.risk_tolerance,
        location=tl.location,
        prev_income=float(prev.income),
        prev_stress=prev.stress,
        prev_title=prev.career_title,
    )

    for y in tl.years:
        if y.year >= req.year:
            await db.delete(y)
    await db.flush()

    for y in new_years:
        db.add(TimelineYear(timeline_id=tl.id, **y))

    await db.commit()

    tl = await _fetch_timeline(req.timeline_id, db)
    return _timeline_to_out(tl)


@app.get("/timeline/{timeline_id}", response_model=TimelineOut)
async def get_timeline(timeline_id: UUID, db: AsyncSession = Depends(get_db)):
    tl = await _fetch_timeline(timeline_id, db)
    return _timeline_to_out(tl)


@app.get("/compare/{id1}/{id2}", response_model=CompareOut)
async def compare(id1: UUID, id2: UUID, db: AsyncSession = Depends(get_db)):
    tl1 = await _fetch_timeline(id1, db)
    tl2 = await _fetch_timeline(id2, db)
    return CompareOut(timeline1=_timeline_to_out(tl1), timeline2=_timeline_to_out(tl2))
