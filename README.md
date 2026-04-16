# AI Life Simulator

**Version:** 1.0  
**Tech Stack:** FastAPI (Python) backend, PostgreSQL database, Next.js frontend with Tailwind CSS.

## Project Description

This is an **AI-driven life simulation game**. Players choose their initial career (Investment Banking, Software Engineer, or Startup founder), ambition, risk tolerance, and location. The game then simulates a 10-year career path, year by year. Each year, the player can make decisions (e.g. pursue a promotion, stay, or switch companies), and the system updates stats like income, stress, and happiness. The simulation uses OpenAI's GPT model to generate narrative events, adding creativity and variability.

## Getting Started

### Prerequisites

- **Python 3.10+**  
- **Node.js 16+** (for the frontend)  
- **PostgreSQL** database (or modify `DATABASE_URL` for another SQL DB)
- **OpenAI API Key** (set in `.env` as `OPENAI_API_KEY`)

backend setup
1. Clone the repository and navigate into it.
2. Create a `.env` file with:  
```
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/lifesim 

OPENAI_API_KEY=your_openai_key.  ( im learning how to make it so that this would not be exposed )
```
3. Set up a Python virtual environment and install dependencies:
```bash
pip install fastapi sqlalchemy asyncpg uvicorn python-dotenv openai
```

4. Start the FastAPI server:
```
uvicorn main:app --reload
```
On first run, the database tables will be created automatically (init_db()).

Frontend setup
(Assuming a Next.js frontend)

1. Navigate to the frontend/ directory.
Install dependencies:
```
npm install
```
3. Run the development server:
```
npm run dev
```
Open http://localhost:3000 to view the app.



## Using it!! 

### Start a New Simulation
Enter your character’s attributes (ambition, risk tolerance, career, location).  

### Advance Years
Each year, choose an action:
- Promotion
- Stay
- Switch  
Stats and narrative update accordingly.

### Branch a Timeline
At any point, you can branch and explore an alternate future with a different career.  

### Compare Timelines
Display two timelines side by side (original vs branch):  
GET /compare/{id1}/{id2}

---

## API Endpoints
POST /simulate → Start a new timeline
POST /branch → Create a branch from an existing timeline
POST /advance → Advance one year with a decision
GET /timeline/{id} → Get timeline data by ID
GET /compare/{id1}/{id2} → Compare two timelines

Refer to `main.py` for request/response formats.

---

## Code Structure

### `main.py`
- Defines FastAPI app and endpoints
- Uses Pydantic models (`schemas.py`) for validation

### `database.py`
- Async SQLAlchemy engine + session setup
- `init_db()` creates tables on startup

### `models.py`
SQLAlchemy ORM models:
- `Timeline` → Simulation metadata (career, ambition, branching)
- `TimelineYear` → Year-by-year stats (income, stress, happiness, life_event)

### `schemas.py`
- Pydantic models for API input/output  
  (e.g., `SimulateRequest`, `TimelineOut`)

### `simulation.py`
- Core simulation logic:
  - `simulate`
  - `advance_year`
  - `simulate_all`
- Integrates with OpenAI to generate narrative text

---

## Known Issues

### Branching Promotions
- Branched timelines do not show promotions  
- Career title remains at level 0  
- Cause: limitation in `simulate_all`

### Happiness Bonus Bug
- +1 happiness (e.g., switching jobs) may not apply  
- Likely issue in `compute_single_year`

---

## Design Notes

### Asynchronous Backend
- Fully async (FastAPI + DB + OpenAI)
- Handles multiple simulations efficiently

### AI
- Uses OpenAI GPT model
- Generates funny/relatable narrative "life events" each year

### Timeline Comparison
- `/compare` endpoint supports side-by-side UI display

---

## Future Improvements

- Step-by-step branching (instead of full 10-year generation)
- Better frontend error handling
- Unit + integration tests for simulation logic
- UI upgrades:
  - Charts
  - Animations
  - Better visual storytelling
 
## Author 
Danny Guo 

dannyguo@g.ucla.edu | 801-819-8186

UCLA — Mathematics/Economics (Specialization in Computing) + Data Science Engineering 
