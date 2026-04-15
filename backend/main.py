from uuid import UUID
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from database import init_db, get_db
from models import Timeline, TimelineYear
from schemas import SimulateRequest, BranchRequest, AdvanceRequest, TimelineOut, YearOut, CompareOut
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


def _timeline_to_out(tl: Timeline) -> TimelineOut:
    years_sorted = sorted(tl.years, key=lambda y: y.year)
    max_year = max((y.year for y in years_sorted), default=0)

    year_outs = []
    for y in years_sorted:
        available = []
        if y.year == max_year and not tl.is_complete and max_year < 10:
            available = ["promotion", "stay", "switch_company"]
        year_outs.append(YearOut(
            year=y.year,
            income=y.income,
            stress=y.stress,
            happiness=y.happiness,
            career_title=y.career_title,
            life_event=y.life_event,
            decision=y.decision,
            is_locked=(y.year != max_year),
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
        is_complete=tl.is_complete,
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


@app.post("/simulate", response_model=TimelineOut)
async def simulate_endpoint(req: SimulateRequest, db: AsyncSession = Depends(get_db)):
    year_data = await sim.simulate(
        career=req.career,
        ambition=req.ambition,
        risk_tolerance=req.risk_tolerance,
        location=req.location,
    )

    timeline = Timeline(
        career=req.career,
        ambition=req.ambition,
        risk_tolerance=req.risk_tolerance,
        location=req.location,
        parent_id=None,
        is_complete=False,
    )
    db.add(timeline)
    await db.flush()

    db.add(TimelineYear(timeline_id=timeline.id, **year_data))
    await db.commit()

    tl = await _fetch_timeline(timeline.id, db)
    return _timeline_to_out(tl)


@app.post("/branch", response_model=TimelineOut)
async def branch_endpoint(req: BranchRequest, db: AsyncSession = Depends(get_db)):
    parent = await _fetch_timeline(req.timeline_id, db)

    years_data = await sim.simulate_all(
        career=req.new_career,
        ambition=parent.ambition,
        risk_tolerance=parent.risk_tolerance,
        location=parent.location,
    )

    timeline = Timeline(
        career=req.new_career,
        ambition=parent.ambition,
        risk_tolerance=parent.risk_tolerance,
        location=parent.location,
        parent_id=parent.id,
        is_complete=True,
    )
    db.add(timeline)
    await db.flush()

    for y in years_data:
        db.add(TimelineYear(timeline_id=timeline.id, **y))

    await db.commit()

    tl = await _fetch_timeline(timeline.id, db)
    return _timeline_to_out(tl)


@app.post("/advance", response_model=TimelineOut)
async def advance_endpoint(req: AdvanceRequest, db: AsyncSession = Depends(get_db)):
    tl = await _fetch_timeline(req.timeline_id, db)

    if tl.is_complete:
        raise HTTPException(status_code=400, detail="Timeline is already complete")

    years_sorted = sorted(tl.years, key=lambda y: y.year)
    if not years_sorted:
        raise HTTPException(status_code=400, detail="No years found on this timeline")

    latest = years_sorted[-1]
    if latest.year >= 10:
        raise HTTPException(status_code=400, detail="Timeline is already at year 10")

    # Stamp the decision onto the current latest year before generating the next
    latest.decision = req.decision
    db.add(latest)
    await db.flush()

    prev_years_for_context = [
        {
            "year": y.year,
            "career_title": y.career_title,
            "income": y.income,
            "stress": y.stress,
            "happiness": y.happiness,
            "life_event": y.life_event,
        }
        for y in years_sorted
    ]

    next_year_num = latest.year + 1
    year_data = await sim.advance_year(
        next_year_num=next_year_num,
        decision=req.decision,
        career=tl.career,
        ambition=tl.ambition,
        risk_tolerance=tl.risk_tolerance,
        location=tl.location,
        prev_income=latest.income,
        prev_stress=latest.stress,
        prev_title_idx=latest.title_idx,
        prev_modifiers_json=latest.pending_modifiers,
        prev_years_for_context=prev_years_for_context,
    )

    db.add(TimelineYear(timeline_id=tl.id, **year_data))

    if next_year_num == 10:
        tl.is_complete = True
        db.add(tl)

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
