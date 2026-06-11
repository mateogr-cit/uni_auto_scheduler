# Kronos — Command Reference

## 1. Backend

```bash
cd backend
source venv/bin/activate        # activate Python virtualenv (Mac/Linux)
uvicorn main:app --reload       # start dev server on http://localhost:8000
```

> Every restart wipes and recreates the database. Re-seed after every restart.

---

## 2. Frontend

```bash
cd frontend
npm install                     # first time only
npm run dev                     # start dev server on http://localhost:3000
npm run build                   # production build
npm run lint                    # ESLint check
```

---

## 3. Seeding (run after every backend restart)

```bash
# Step 1 — seed session types (Lecture + Seminar)
cd backend
source venv/bin/activate
python init_db.py

# Step 2 — seed all data + create admin user
cd ../batch_requests
pwsh run_all.ps1
```

`run_all.ps1` runs all scripts in dependency order and creates the admin account at the end.

### Login credentials after seeding

| Role      | Username           | Password       |
|-----------|--------------------|----------------|
| Admin     | `admin`            | `admin123`     |
| Professor | `johnson.robert`   | `johnson.123`  |
| Student   | `se11.student`     | `se11.123`     |

Password formula for seeded accounts: `{lastname_lowercase}.123`

### Create admin user only (without re-seeding everything)

```bash
cd backend
source venv/bin/activate
python create_admin.py
```

Override defaults with env vars: `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_EMAIL`

---

## 4. Auto-Scheduler API

```bash
# Generate schedule
curl -X POST "http://localhost:8000/auto-schedule/generate?year=3&semester_number=2"

# With options
curl -X POST "http://localhost:8000/auto-schedule/generate?year=3&semester_number=2&mode=full&max_courses_per_group=10"

# Validate
curl "http://localhost:8000/auto-schedule/validate?year=3&semester_number=2"

# Clear
curl -X DELETE "http://localhost:8000/auto-schedule/clear?year=3&semester_number=2"
```

**Modes:** `baseline` (first-available professor) | `full` (load-balanced, default)

---

## 5. Scheduling Benchmark API

Runs the algorithm against real DB data but **never writes** — always rolls back.

> Database must be seeded (step 3) before benchmarks will return results.
> Use `year=1&semester_number=1` — all student groups are seeded at year 1.

### Run a single mode

```bash
curl -X POST "http://localhost:8000/schedule-benchmark/run?year=1&semester_number=1&mode=baseline"
curl -X POST "http://localhost:8000/schedule-benchmark/run?year=1&semester_number=1&mode=full"
curl -X POST "http://localhost:8000/schedule-benchmark/run?year=1&semester_number=1&mode=baseline_realistic"
curl -X POST "http://localhost:8000/schedule-benchmark/run?year=1&semester_number=1&mode=full_realistic"
```

### Single semester — all 4 modes at once (scope = single)

```bash
curl -X POST "http://localhost:8000/schedule-benchmark/compare?year=1&semester_number=1"
```

### Full school — all year/semester combos, all 4 modes (scope = full_school)

Iterates every active (year, semester) pair found in the curriculum — currently year 1-3 × sem 1-2 = 6 combinations. Each pair is scheduled independently with fresh conflict state, then timings are summed.

```bash
curl -X POST "http://localhost:8000/schedule-benchmark/compare-school"
```

Results are appended to:
- `results/benchmark_runs.json` — full history as a JSON array
- `results/benchmark_runs.csv`  — tabular history with a `scope` column (`single` / `full_school`)

### Generate graphs from saved results

```bash
# From the project root (requires matplotlib + numpy)
python generate_benchmark_graphs.py
```

Figures saved to `results/benchmark_figures/`:

| File | Description |
|------|-------------|
| `fig1_total_time.png` | Total runtime bar chart across all 4 modes (single semester) |
| `fig2_timing_breakdown.png` | Stacked bar: algorithm / auth / DB per mode |
| `fig3_overhead_delta.png` | Extra cost added by realistic overhead vs native |
| `fig4_schedules.png` | Schedules simulated vs skipped per mode |
| `fig5_history.png` | Total runtime over time (requires multiple runs) |
| `fig6_overhead_pie.png` | Time distribution inside each realistic mode |
| `fig7_school_vs_single.png` | Full-school vs single-semester: side-by-side for all 4 modes |

### Modes explained

| Mode | Professor selection | Auth overhead | DB overhead |
|------|---------------------|---------------|-------------|
| `baseline` | First available | None | None |
| `full` | Load-balanced | None | None |
| `baseline_realistic` | First available | JWT decode per assignment | `db.flush()` per write |
| `full_realistic` | Load-balanced | JWT decode per assignment | `db.flush()` per write |

### Scopes explained

| Scope | Endpoint | What it schedules |
|-------|----------|-------------------|
| `single` | `/compare` | One (year, semester) pair |
| `full_school` | `/compare-school` | All 6 (year, semester) pairs in the curriculum |

---

## 6. Authentication API

```bash
# Login (returns JWT token)
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin123"

# Get current user from token
curl "http://localhost:8000/auth/me" \
  -H "Authorization: Bearer <token>"
```

---

## 7. Interactive API Docs

```
http://localhost:8000/docs       # Swagger UI
http://localhost:8000/redoc      # ReDoc
```

---

## 8. Environment Variables

| Variable          | Default                                      | Purpose                  |
|-------------------|----------------------------------------------|--------------------------|
| `DATABASE_URL`    | `postgresql://postgres:admin@localhost/uni_auto_scheduler` | DB connection string |
| `JWT_SECRET_KEY`  | `kronos-secret-key-change-in-production-...` | JWT signing secret       |
| `ADMIN_USERNAME`  | `admin`                                      | Admin account username   |
| `ADMIN_PASSWORD`  | `admin123`                                   | Admin account password   |
| `ADMIN_EMAIL`     | `admin@kronos.local`                         | Admin account email      |

Set in `backend/.env` or export before starting the server.
