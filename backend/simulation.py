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


def _career_title(career: str, year: int) -> str:
    titles = CAREER_CONFIG[career]["titles"]
    # Advance every ~3 years: years 1-3 → title 0, 4-6 → 1, 7-9 → 2, 10 → 3
    idx = min((year - 1) // 3, len(titles) - 1)
    return titles[idx]


def compute_years(career: str, ambition: int, risk_tolerance: int) -> list[dict]:
    cfg = CAREER_CONFIG[career]
    income = float(cfg["base_income"])
    stress = cfg["base_stress"]
    happiness = cfg["base_happiness"]
    # Ambition boosts growth by +1% per point above 5
    ambition_bonus = max(0, ambition - 5) * 0.01
    growth_rate = cfg["base_growth"] + ambition_bonus

    years = []
    for y in range(1, 11):
        # Income growth
        if career == "startup":
            # Startup variance: risk_tolerance controls swing size (0–50%)
            max_swing = risk_tolerance * 0.05
            swing = random.uniform(-max_swing, max_swing * 1.5)
            income *= 1 + growth_rate + swing
        else:
            income *= 1 + growth_rate

        income = max(20_000, income)

        # Stress drift ±1 per year, clamped 1–10
        stress_drift = random.choice([-1, 0, 0, 1])
        stress = max(1, min(10, stress + stress_drift))

        # Happiness inversely tied to stress, with some randomness
        happiness = max(1, min(10, 11 - stress + random.randint(-1, 1)))

        years.append({
            "year": y,
            "income": int(income),
            "stress": stress,
            "happiness": happiness,
            "career_title": _career_title(career, y),
        })

    return years


async def generate_narratives(
    years: list[dict], career: str, location: str
) -> list[str]:
    career_label = {"ib": "investment banking", "swe": "software engineering", "startup": "startup founder"}[career]

    years_summary = "\n".join(
        f"Year {y['year']}: {y['career_title']} in {career_label}, income ${y['income']:,}, stress {y['stress']}/10, happiness {y['happiness']}/10"
        for y in years
    )

    prompt = f"""You are a creative life simulator. Given a 10-year career trajectory for someone in {location}, generate a short, vivid 1-sentence life event for each year that reflects their career stage, income, and wellbeing. Make events realistic and varied — include professional milestones, personal moments, and setbacks.

Trajectory:
{years_summary}

Return ONLY a valid JSON array of exactly 10 strings, one per year, in order. No other text."""

    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.8,
        max_tokens=800,
        response_format={"type": "json_object"},
    )

    raw = response.choices[0].message.content
    # The model returns {"events": [...]} or similar — handle both shapes
    parsed = json.loads(raw)
    if isinstance(parsed, list):
        events = parsed
    else:
        # Find the first list value
        events = next(v for v in parsed.values() if isinstance(v, list))

    # Ensure we have exactly 10
    while len(events) < 10:
        events.append("Another year passes quietly.")
    return events[:10]


async def simulate(career: str, ambition: int, risk_tolerance: int, location: str) -> list[dict]:
    years = compute_years(career, ambition, risk_tolerance)
    narratives = await generate_narratives(years, career, location)
    for i, year in enumerate(years):
        year["life_event"] = narratives[i]
    return years
