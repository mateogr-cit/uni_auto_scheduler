# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture

This is a university course auto-scheduling system with two independent services:

- **`backend/`** — FastAPI + SQLAlchemy (Python), connects to a local PostgreSQL database (`uni_auto_scheduler`)
- **`frontend/`** — Next.js 16 + React 19 + Tailwind CSS + shadcn/ui, talks to the backend at `http://localhost:8000`

The frontend calls the backend REST API directly (no Next.js API routes). All backend routes are registered in `backend/main.py` and implemented as separate files under `backend/routes/`.

### Critical: DB wipes on every backend start

`backend/main.py` calls `Base.metadata.drop_all()` then `create_all()` on startup — **every restart wipes all data**. After restarting, re-seed using the PowerShell scripts in `batch_requests/` (run `run_all.ps1` or individual scripts like `add_rooms.ps1`).

### Data model hierarchy

```
Faculty → Degree → StudentGroup (e.g. SE1, SE2) → Student
                 ↓
         CourseCurriculum (which courses belong to which degree/year/semester)
                 ↓
         Course ←→ Prof (many-to-many via professor_course table)
                 ↓
         CourseSchedule (one per course+group pair)
                 ↓
         CourseSession (Lecture + Seminar, one each per CourseSchedule)
```

`TimeSlots` and `Rooms` are referenced by `CourseSession`. `ProfessorAvailability` is stored but **not enforced** by the auto-scheduler (it checks slot/room/group conflicts only, not professor working hours).

### Auto-scheduling algorithm (`backend/routes/auto_schedule.py`)

The scheduler operates on `(year_level, semester_number)` pairs — not semesters by ID. For each `CourseCurriculum` entry that `is_active=True`, it:
1. Finds all matching `StudentGroup` rows (same degree/year/semester)
2. Picks a professor (load-balanced in `full` mode, first-available in `baseline` mode)
3. Assigns one Lecture slot and one Seminar slot using in-memory conflict sets
4. Creates `CourseSchedule` + two `CourseSession` records

The `day_session_score` heuristic prefers filling days to 4 hours before opening new days (score: 1 existing session → 0, 0 sessions → 1, 2 sessions → 2, 3+ → skip).

### Frontend component structure

The main UI is a tabbed dashboard (`components/ScheduleDashboard.tsx`) composed of panels:
- `OverviewPanel` — stats
- `CourseSchedulesPanel` — view/edit schedules
- `AutoSchedulePanel` — generate/validate/clear
- `CurriculumPanel`, `FacultyPanel`, `SetupPanel` — data management

`MainLayout.tsx` wraps everything with the `Sidebar.tsx`. Dark mode is managed via `contexts/ThemeContext.tsx`.

## Commands

### Backend

```bash
cd backend
source venv/bin/activate          # activate virtualenv
uvicorn main:app --reload          # start dev server (port 8000)
python init_db.py                  # seed session types (Lecture, Seminar) — needed after DB wipe
```

Set `DATABASE_URL` env var to override the default: `postgresql://postgres:admin@localhost/uni_auto_scheduler`

### Frontend

```bash
cd frontend
npm install                        # install dependencies
npm run dev                        # start dev server (port 3000)
npm run build                      # production build
npm run lint                       # eslint check
```

### Seeding data (after backend restart)

```bash
cd batch_requests
pwsh run_all.ps1                   # runs all add_*.ps1 scripts in order
```

Or run individual scripts: `pwsh add_rooms.ps1`, `pwsh add_professors.ps1`, etc.

### Auto-schedule API (via curl)

```bash
# Generate
curl -X POST "http://localhost:8000/auto-schedule/generate?year=3&semester_number=2"

# Validate
curl "http://localhost:8000/auto-schedule/validate?year=3&semester_number=2"

# Clear
curl -X DELETE "http://localhost:8000/auto-schedule/clear?year=3&semester_number=2"
```

### Benchmarking

```bash
python benchmark_api.py            # runs benchmark suite against the live backend
```

## Key files

| File | Purpose |
|---|---|
| `backend/main.py` | App entry point; registers all routers; drops+recreates DB on start |
| `backend/models.py` | All SQLAlchemy models |
| `backend/routes/auto_schedule.py` | Core scheduling algorithm |
| `backend/routes/benchmark.py` | Benchmark endpoint |
| `backend/database.py` | DB connection; `DATABASE_URL` config |
| `frontend/components/ScheduleDashboard.tsx` | Root dashboard component |
| `frontend/components/schedule-types.ts` | Shared TypeScript types for schedule data |
| `PROJECT_FLOW.MD` | Canonical data model reference with field-level annotations |
