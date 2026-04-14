# AI Life Simulator

Simulate a 10-year future based on your traits and career choice. Branch alternate timelines and compare them side-by-side.

## Stack

- **Frontend**: Next.js 14 + Tailwind CSS
- **Backend**: FastAPI (Python)
- **Database**: PostgreSQL
- **AI**: OpenAI API (gpt-4o-mini)

## Local Setup

### 1. Start PostgreSQL

```bash
docker run --name lifesim-pg \
  -e POSTGRES_DB=lifesim \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  -d postgres:16
```

### 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env and set your OPENAI_API_KEY
uvicorn main:app --reload
```

Backend runs at http://localhost:8000. API docs at http://localhost:8000/docs.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at http://localhost:3000.

## Usage

1. Open http://localhost:3000
2. Set ambition, risk tolerance, career, and location
3. Click **Simulate** — your 10-year future generates
4. Click **Branch Timeline** to create an alternate path with a different career
5. Click **Compare** to see both timelines side-by-side

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/simulate` | Create a new timeline |
| POST | `/branch` | Branch an existing timeline |
| GET | `/timeline/{id}` | Fetch a timeline + years |
| GET | `/compare/{id1}/{id2}` | Fetch two timelines for comparison |
