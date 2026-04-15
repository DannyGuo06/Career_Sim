import os
import json
import random
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

CAREER_CONFIG = {
    "ib": {
        "base_income": 120_000,
        "base_growth": 0.15,
        "base_stress": 8,
        "base_happiness": 5,
        "titles": ["Analyst", "Associate", "Vice President", "Director"],
    },
    "swe": {
        "base_income": 100_000,
        "base_growth": 0.12,
        "base_stress": 5,
        "base_happiness": 7,
        "titles": ["Junior Engineer", "Software Engineer", "Senior Engineer", "Staff Engineer"],
    },
    "startup": {
        "base_income": 50_000,
        "base_growth": 0.10,
        "base_stress": 7,
        "base_happiness": 6,
        "titles": ["Founder", "Co-founder", "CTO / CEO", "Exited Founder"],
    },
}

# Decision effects applied at the decision year and carried forward via pending_modifiers.
# Each modifier entry: {"stress_delta": int, "happiness_delta": int, "ttl": int}
# "happiness_followup" adds a +1 happiness modifier starting the year AFTER the decision year.
DECISION_EFFECTS = {
    "promotion": {
        "income_mult": 1.20,
        "modifiers": [{"stress_delta": 2, "happiness_delta": -1, "ttl": 2}],
    },
    "stay": {
        "income_mult": 1.05,
        "modifiers": [{"stress_delta": 0, "happiness_delta": 1, "ttl": 1}],
    },
    "switch_company": {
        "income_mult": 1.15,
        "modifiers": [
            {"stress_delta": 3, "happiness_delta": 0, "ttl": 1},
            {"stress_delta": 0, "happiness_delta": 1, "ttl": 1, "delay": 1},
        ],
    },
}


def _title_idx_from_title(career: str, title: str) -> int:
    titles = CAREER_CONFIG[career]["titles"]
    try:
        return titles.index(title)
    except ValueError:
        return 0


def compute_years(
    career: str,
    ambition: int,
    risk_tolerance: int,
    start_year: int = 1,
    prev_income: float | None = None,
    prev_stress: int | None = None,
    applied_decision: str | None = None,
    current_title_idx: int = 0,
) -> list[dict]:
    cfg = CAREER_CONFIG[career]
    ambition_bonus = max(0, ambition - 5) * 0.01
    growth_rate = cfg["base_growth"] + ambition_bonus

    # Initialise state from previous year or career defaults
    if prev_income is None:
        income = float(cfg["base_income"])
    else:
        income = prev_income

    if prev_stress is None:
        stress = cfg["base_stress"]
    else:
        stress = prev_stress

    # Apply the decision to advance (or hold) the career title.
    titles = cfg["titles"]
    if applied_decision == "promotion":
        current_title_idx = min(current_title_idx + 1, len(titles) - 1)
    # "stay" and "switch_company" keep the same title index.

    # Build pending modifiers from the applied decision (if any).
    # "delay" means the modifier kicks in after N years (used for switch_company follow-up).
    pending_modifiers: list[dict] = []
    if applied_decision and applied_decision in DECISION_EFFECTS:
        effects = DECISION_EFFECTS[applied_decision]
        income = income * effects["income_mult"]
        for m in effects["modifiers"]:
            pending_modifiers.append({
                "stress_delta": m["stress_delta"],
                "happiness_delta": m["happiness_delta"],
                "ttl": m["ttl"],
                "delay": m.get("delay", 0),
            })

    years = []
    for y in range(start_year, 11):
        # Income growth for this year (skip the multiplier already applied on decision year)
        if y == start_year and applied_decision:
            # Income was already multiplied above; just apply the regular growth on top
            if career == "startup":
                max_swing = risk_tolerance * 0.05
                swing = random.uniform(-max_swing, max_swing * 1.5)
                income *= 1 + growth_rate + swing
            else:
                income *= 1 + growth_rate
        else:
            if career == "startup":
                max_swing = risk_tolerance * 0.05
                swing = random.uniform(-max_swing, max_swing * 1.5)
                income *= 1 + growth_rate + swing
            else:
                income *= 1 + growth_rate

        income = max(20_000, income)

        # Accumulate active modifier deltas (skip delayed ones)
        mod_stress = 0
        mod_happiness = 0
        next_modifiers = []
        for m in pending_modifiers:
            if m["delay"] > 0:
                next_modifiers.append({**m, "delay": m["delay"] - 1})
                continue
            mod_stress += m["stress_delta"]
            mod_happiness += m["happiness_delta"]
            if m["ttl"] > 1:
                next_modifiers.append({**m, "ttl": m["ttl"] - 1})
        pending_modifiers = next_modifiers

        # Stress drift ±1 per year, then apply modifier, clamped 1–10
        stress_drift = random.choice([-1, 0, 0, 1])
        stress = max(1, min(10, stress + stress_drift + mod_stress))

        # Happiness inversely tied to stress, with modifier and randomness
        happiness = max(1, min(10, 11 - stress + random.randint(-1, 1) + mod_happiness))

        years.append({
            "year": y,
            "income": int(income),
            "stress": stress,
            "happiness": happiness,
            "career_title": titles[current_title_idx],
        })

    return years


async def generate_narratives(
    years: list[dict], career: str, location: str
) -> list[str]:
    career_label = {"ib": "investment banking", "swe": "software engineering", "startup": "startup founder"}[career]
    n = len(years)

    years_summary = "\n".join(
        f"Year {y['year']}: {y['career_title']} in {career_label}, income ${y['income']:,}, stress {y['stress']}/10, happiness {y['happiness']}/10"
        for y in years
    )

    prompt = f"""You are a creative life simulator. Given a career trajectory for someone in {location}, generate a short, vivid 1-sentence life event for each year that reflects their career stage, income, and wellbeing. Make events realistic and varied — include professional milestones, personal moments, and setbacks.

Trajectory:
{years_summary}

Return ONLY a valid JSON array of exactly {n} strings, one per year, in order. No other text."""

    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.8,
        max_tokens=800,
        response_format={"type": "json_object"},
    )

    raw = response.choices[0].message.content
    parsed = json.loads(raw)
    if isinstance(parsed, list):
        events = parsed
    else:
        events = next(v for v in parsed.values() if isinstance(v, list))

    while len(events) < n:
        events.append("Another year passes quietly.")
    return events[:n]


async def simulate(career: str, ambition: int, risk_tolerance: int, location: str) -> list[dict]:
    years = compute_years(career, ambition, risk_tolerance)
    narratives = await generate_narratives(years, career, location)
    for i, year in enumerate(years):
        year["life_event"] = narratives[i]
        year["decision"] = None
        year["is_locked"] = False
    return years


async def recompute_from_decision(
    decision_year: int,
    decision: str,
    career: str,
    ambition: int,
    risk_tolerance: int,
    location: str,
    prev_income: float,
    prev_stress: int,
    prev_title: str,
) -> list[dict]:
    current_title_idx = _title_idx_from_title(career, prev_title)
    years = compute_years(
        career, ambition, risk_tolerance,
        start_year=decision_year,
        prev_income=prev_income,
        prev_stress=prev_stress,
        applied_decision=decision,
        current_title_idx=current_title_idx,
    )
    narratives = await generate_narratives(years, career, location)
    for i, year in enumerate(years):
        year["life_event"] = narratives[i]
        year["decision"] = decision if year["year"] == decision_year else None
        year["is_locked"] = year["year"] == decision_year
    return years
