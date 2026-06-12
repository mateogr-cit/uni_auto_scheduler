#!/usr/bin/env python3
"""
API-based benchmark for uni_auto_scheduler — large-scale variant.

N = number of independent student groups. Total student headcount scales with N
(each group has GROUP_CAP_MIN–GROUP_CAP_MAX actual Student records).
Infrastructure is sized to cover ~100–2 000 students.

Real system constraints applied:
  - 5 slots/day × 5 days = 25 slots total (each slot is a 2-hour block)
  - 30 rooms  (8 small cap-20, 8 medium cap-35, 8 large cap-50, 6 xlarge cap-70)
  - 10 courses per group
  - Theoretical room capacity: 30 rooms × 25 slots = 750 room-slot pairs
  - Each group needs 10 courses × 2 sessions = 20 room-slot pairs
  - Saturation at N ≈ 37 groups (room-limited)

Approximate DB record counts at each N (seeded + generated):
  N= 3 →  ~700 records   (~120 students)
  N= 7 → ~1 600 records  (~280 students)
  N=15 → ~3 400 records  (~600 students)
  N=28 → ~6 200 records  (~1 120 students)
  N=40 → ~8 700 records  (~1 600 students)
  N=50 → ~10 600 records (~2 000 students)

Metrics per run:
  feasible   — fraction of expected course-group pairs successfully scheduled
  skips      — raw count of assignments the scheduler had to skip (from API)
  S1         — avg distinct active days per group (higher = more spread)
  S2         — fraction of (group, day) pairs with exactly 2 sessions (4-hour days)
  S3         — professor load deviation (max-min); always 0 in single-prof design
  S4         — fraction of course-group pairs where lecture and seminar are on
               different days; directly measures the same-day penalty in full mode

Usage:
    cd backend && source venv/bin/activate && uvicorn main:app  # terminal 1
    python benchmark_api.py --output results/large_run          # terminal 2

Output:
    results/<dir>/results.csv   — per-instance raw data (pandas/matplotlib ready)
    results/<dir>/summary.txt   — human-readable paper tables
"""

import argparse
import csv
import math
import random
import statistics
import sys
import time
from collections import defaultdict
from pathlib import Path

try:
    import requests
except ImportError:
    sys.exit("requests not installed — run: pip install requests")

# ── Config ────────────────────────────────────────────────────────────────────

BASE_URL      = "http://localhost:8000"
SEED          = 20260515
INSTANCES     = 20
# N = number of independent student groups; total students ≈ N × avg(GROUP_CAP)
INSTANCE_SIZES = [3, 7, 15, 28, 40, 50]

COURSES_PER_GROUP = 10
YEAR, SEMESTER    = 1, 1

# 5 two-hour slots per day (08:00–18:00)
DAYS       = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
SLOT_START = [8, 10, 12, 14, 16]

# 30 rooms across four capacity tiers — groups with large capacity can only use
# the bigger tiers, creating meaningful room-pressure variation per instance.
ROOMS = (
    [("RS{:02d}".format(i), 20) for i in range(1, 9)] +   # 8 small  (cap 20)
    [("RM{:02d}".format(i), 35) for i in range(1, 9)] +   # 8 medium (cap 35)
    [("RL{:02d}".format(i), 50) for i in range(1, 9)] +   # 8 large  (cap 50)
    [("RX{:02d}".format(i), 70) for i in range(1, 7)]     # 6 xlarge (cap 70)
)
GROUP_CAP_MIN, GROUP_CAP_MAX = 20, 60

# ── HTTP helpers ──────────────────────────────────────────────────────────────

def post(url: str, payload) -> dict:
    r = requests.post(url, json=payload, timeout=60)
    if not r.ok:
        raise RuntimeError(f"POST {url} → {r.status_code}: {r.text[:300]}")
    return r.json()


def timed_post(url: str, params: dict) -> tuple[dict, float]:
    start = time.perf_counter()
    r = requests.post(url, params=params, timeout=120)
    elapsed = (time.perf_counter() - start) * 1000
    if not r.ok:
        raise RuntimeError(f"POST {url} → {r.status_code}: {r.text[:300]}")
    return r.json(), elapsed

# ── One-time infrastructure ───────────────────────────────────────────────────

_fac_id: int = 0


def setup_infrastructure():
    global _fac_id
    print("Setting up static infrastructure …", end=" ", flush=True)

    fac = post(f"{BASE_URL}/faculty/", {"f_name": "Engineering", "f_abbr": "ENG"})
    _fac_id = fac["f_id"]

    post(f"{BASE_URL}/rooms/bulk",
         [{"room_id": rid, "capacity": cap} for rid, cap in ROOMS])

    post(f"{BASE_URL}/time-slots/bulk", [
        {"day_of_week": day,
         "start_time": f"{h:02d}:00:00",
         "end_time":   f"{h+2:02d}:00:00"}
        for day in DAYS for h in SLOT_START
    ])

    post(f"{BASE_URL}/session-types/", {"type_name": "Lecture",  "duration_hours": 2})
    post(f"{BASE_URL}/session-types/", {"type_name": "Seminar", "duration_hours": 2})

    n_slots = len(DAYS) * len(SLOT_START)
    print(f"done  ({len(ROOMS)} rooms, {n_slots} slots)")

# ── Per-run seeding ───────────────────────────────────────────────────────────

def seed_instance(n_groups: int, rng: random.Random):
    """
    Create n_groups independent cohorts, each with:
      - its own degree
      - COURSES_PER_GROUP courses (bulk, each with a unique professor)
      - 1 student group whose capacity = the number of Student records created
    Professors are created in one bulk call per group (no bcrypt overhead).
    Students are created via /benchmark/seed-students (also no bcrypt).
    Groups are fully independent: they share rooms/slots but not courses/professors/students.
    """
    for g in range(n_groups):
        ts = int(time.time() * 1000) % 1_000_000
        tag = f"g{g:03d}_{ts}"

        deg = post(f"{BASE_URL}/degrees/",
                   {"d_name": f"Degree-{tag}", "degree_abbr": f"D{g:03d}",
                    "f_id": _fac_id})
        deg_id = deg["d_id"]

        courses = post(f"{BASE_URL}/courses/bulk", [
            {"c_name": f"Course-{tag}-{ci}", "c_abbr": f"C{g:03d}{ci}",
             "c_difficulty_weight": round(rng.uniform(1.0, 3.0), 2),
             "c_year": YEAR, "c_semester": SEMESTER,
             "is_active": True,
             "degree_id": deg_id, "degree_ids": [deg_id]}
            for ci in range(COURSES_PER_GROUP)
        ])

        # All professors for this group in a single bulk call
        post(f"{BASE_URL}/professors/bulk", [
            {"fname": f"Prof{g:03d}{ci}", "lname": "Doe",
             "email": f"p{g:03d}{ci}_{ts}@bench.local",
             "username": f"p{g:03d}{ci}_{ts}",
             "password": "pw123",
             "course_ids": [courses[ci]["c_id"]]}
            for ci in range(COURSES_PER_GROUP)
        ])

        cap = rng.randint(GROUP_CAP_MIN, GROUP_CAP_MAX)
        grp = post(f"{BASE_URL}/student-groups/", {
            "group_name": f"Grp-{tag}",
            "deg_id": deg_id,
            "year_level": YEAR,
            "semester_number": SEMESTER,
            "capacity": cap,
        })
        group_id = grp["group_id"]

        # Create actual Student records (user + student) via the benchmark endpoint
        # which skips bcrypt to keep seeding fast.
        post(f"{BASE_URL}/benchmark/seed-students", [
            {"fname": f"Stu{g:03d}{si}", "lname": "Bench",
             "email": f"s{g:03d}{si}_{ts}@bench.local",
             "username": f"s{g:03d}{si}_{ts}",
             "group_id": group_id}
            for si in range(cap)
        ])

# ── Metrics ───────────────────────────────────────────────────────────────────

def compute_metrics(details: list) -> dict:
    if not details:
        return {"s1": 0.0, "s2": 0.0, "s3": 0, "s4": 0.0}

    group_days:              dict[str, set]            = defaultdict(set)
    group_day_count:         dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))
    course_sessions:         dict[str, int]            = defaultdict(int)
    course_group_session_days: dict                    = defaultdict(dict)

    for e in details:
        group_days[e["group"]].add(e["day"])
        group_day_count[e["group"]][e["day"]] += 1
        course_sessions[e["course"]] += 1
        course_group_session_days[(e["course"], e["group"])][e["type"]] = e["day"]

    n_groups = len(group_days)

    # S1: average number of distinct active days per group
    s1 = sum(len(d) for d in group_days.values()) / n_groups

    # S2: fraction of (group, day) pairs that have exactly 2 sessions
    #     (preferred "4-hour day" by the scheduler's day_session_score)
    all_gd = [cnt for days in group_day_count.values() for cnt in days.values()]
    s2 = sum(1 for c in all_gd if c == 2) / max(len(all_gd), 1)

    # S3: professor load deviation (max - min sessions across courses).
    # Always 0 in the single-professor-per-course benchmark design; retained
    # for CSV backward compatibility.
    loads = list(course_sessions.values())
    s3 = max(loads) - min(loads) if len(loads) > 1 else 0

    # S4: fraction of course-group pairs where lecture and seminar fall on
    # different days. Full mode applies a same-day penalty scaled by course
    # difficulty weight; S4 measures whether that penalty has the intended effect.
    split_pairs = [
        v.get("Lecture") != v.get("Seminar")
        for v in course_group_session_days.values()
        if "Lecture" in v and "Seminar" in v
    ]
    s4 = sum(split_pairs) / max(len(split_pairs), 1)

    return {"s1": round(s1, 3), "s2": round(s2, 3), "s3": s3, "s4": round(s4, 3)}

# ── Single run ────────────────────────────────────────────────────────────────

def run_instance(n: int, rng: random.Random) -> dict:
    post(f"{BASE_URL}/benchmark/reset", {})

    t0 = time.perf_counter()
    seed_instance(n, rng)
    seed_ms = round((time.perf_counter() - t0) * 1000, 1)

    expected = n * COURSES_PER_GROUP   # n groups × 5 courses each

    # Baseline
    rb, rt_b = timed_post(f"{BASE_URL}/auto-schedule/generate",
                           {"year": YEAR, "semester_number": SEMESTER,
                            "mode": "baseline", "max_courses_per_group": COURSES_PER_GROUP})
    mb = compute_metrics(rb.get("schedule_details", []))
    feas_b = min(1.0, rb.get("schedules_created", 0) / expected) if expected else 0

    post(f"{BASE_URL}/benchmark/reset-schedules", {})

    # Full
    rf, rt_f = timed_post(f"{BASE_URL}/auto-schedule/generate",
                           {"year": YEAR, "semester_number": SEMESTER,
                            "mode": "full", "max_courses_per_group": COURSES_PER_GROUP})
    mf = compute_metrics(rf.get("schedule_details", []))
    feas_f = min(1.0, rf.get("schedules_created", 0) / expected) if expected else 0

    return {
        "n_groups":           n,
        "seed_ms":            seed_ms,
        "rt_baseline_ms":     round(rt_b, 2),
        "feasible_baseline":  round(feas_b, 4),
        "skips_baseline":     rb.get("skipped_count", 0),
        "s1_baseline":        mb["s1"],
        "s2_baseline":        mb["s2"],
        "s3_baseline":        mb["s3"],
        "s4_baseline":        mb["s4"],
        "rt_full_ms":         round(rt_f, 2),
        "feasible_full":      round(feas_f, 4),
        "skips_full":         rf.get("skipped_count", 0),
        "s1_full":            mf["s1"],
        "s2_full":            mf["s2"],
        "s3_full":            mf["s3"],
        "s4_full":            mf["s4"],
    }

# ── Output ────────────────────────────────────────────────────────────────────

def ci95(vals: list[float]) -> float:
    if len(vals) < 2:
        return 0.0
    return 1.96 * statistics.stdev(vals) / math.sqrt(len(vals))


def print_summary(rows: list[dict], out: Path):
    sizes = sorted(set(r["n_groups"] for r in rows))
    lines = []

    def ln(s=""): lines.append(s); print(s)

    total_slots = len(DAYS) * len(SLOT_START)
    room_slot_cap = len(ROOMS) * total_slots

    ln("=" * 64)
    ln("Summary — uni_auto_scheduler benchmark")
    ln("=" * 64)
    ln()
    avg_cap = (GROUP_CAP_MIN + GROUP_CAP_MAX) / 2
    ln("Table 1 — Parameters")
    ln("-" * 42)
    ln(f"  Rooms                : {len(ROOMS)}  "
       f"(8×cap-20, 8×cap-35, 8×cap-50, 6×cap-70)")
    ln(f"  Slots/day            : {len(SLOT_START)}  "
       f"(08-10, 10-12, 12-14, 14-16, 16-18 — 2 hrs each)")
    ln(f"  Total slots          : {total_slots}  ({len(DAYS)} days × {len(SLOT_START)})")
    ln(f"  Room-slot capacity   : {room_slot_cap}")
    ln(f"  Courses per group    : {COURSES_PER_GROUP}  (sessions needed per group: {COURSES_PER_GROUP*2})")
    ln(f"  Group capacity range : {GROUP_CAP_MIN}–{GROUP_CAP_MAX}  students (random per instance)")
    ln(f"  Approx student range : {int(min(sizes)*GROUP_CAP_MIN)}–{int(max(sizes)*GROUP_CAP_MAX)}")
    ln(f"  N (groups) tested    : {sizes}")
    ln(f"  Approx students/N    : {[int(n*avg_cap) for n in sizes]}")
    ln(f"  Instances per N      : {INSTANCES}")
    ln(f"  Random seed          : {SEED}")
    ln()

    ref_n = 20 if 20 in sizes else sizes[len(sizes)//2]
    sub = [r for r in rows if r["n_groups"] == ref_n]

    def m(k): return statistics.mean(r[k] for r in sub)

    ln(f"Table 2 — Baseline vs Full at N={ref_n} groups  "
       f"(mean over {len(sub)} instances)")
    ln("-" * 42)
    ln(f"  Feasibility (sched/expected)  : {m('feasible_baseline')*100:5.1f}% | {m('feasible_full')*100:5.1f}%")
    ln(f"  Skipped assignments           : {m('skips_baseline'):5.1f}  | {m('skips_full'):5.1f}")
    ln(f"  Avg active days / group  (S1) : {m('s1_baseline'):5.2f}  | {m('s1_full'):5.2f}")
    ln(f"  Group-days with 2 sess   (S2) : {m('s2_baseline')*100:5.1f}% | {m('s2_full')*100:5.1f}%")
    ln(f"  Prof load deviation      (S3) : {m('s3_baseline'):5.2f}  | {m('s3_full'):5.2f}")
    ln(f"  Lec/sem on diff days     (S4) : {m('s4_baseline')*100:5.1f}% | {m('s4_full')*100:5.1f}%")
    ln(f"  Mean runtime (ms)             : {m('rt_baseline_ms'):6.1f}  | {m('rt_full_ms'):6.1f}")
    ln()

    ln("Feasibility rate per N (baseline | full)")
    ln("-" * 42)
    for n in sizes:
        rs = [r for r in rows if r["n_groups"] == n]
        fb = statistics.mean(r["feasible_baseline"] for r in rs) * 100
        ff = statistics.mean(r["feasible_full"]     for r in rs) * 100
        ln(f"  N={n:3d} groups: {fb:5.1f}% | {ff:5.1f}%")
    ln()

    ln("S4 rate per N — lecture+seminar on different days (baseline | full)")
    ln("-" * 42)
    for n in sizes:
        rs  = [r for r in rows if r["n_groups"] == n]
        s4b = statistics.mean(r["s4_baseline"] for r in rs) * 100
        s4f = statistics.mean(r["s4_full"]     for r in rs) * 100
        ln(f"  N={n:3d} groups: {s4b:5.1f}% | {s4f:5.1f}%")
    ln()

    ln("Mean scheduling runtime — full mode (ms)")
    ln("-" * 42)
    for n in sizes:
        rs  = [r for r in rows if r["n_groups"] == n]
        rts = [r["rt_full_ms"] for r in rs]
        ln(f"  N={n:3d}: {statistics.mean(rts):6.1f} ms  (±{ci95(rts):.1f} ms, 95% CI)")
    ln()

    (out / "summary.txt").write_text("\n".join(lines))
    print(f"Summary → {out / 'summary.txt'}")


def save_csv(rows: list[dict], out: Path):
    if not rows:
        return
    p = out / "results.csv"
    with open(p, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["instance"] + list(rows[0].keys()))
        w.writeheader()
        for i, r in enumerate(rows, 1):
            w.writerow({"instance": i, **r})
    print(f"CSV     → {p}")

# ── Entry point ───────────────────────────────────────────────────────────────

def main():
    global BASE_URL
    p = argparse.ArgumentParser()
    p.add_argument("--url",       default=BASE_URL)
    p.add_argument("--output",    default="results")
    p.add_argument("--sizes",     nargs="+", type=int, default=INSTANCE_SIZES,
                   help="N values (number of groups) to test")
    p.add_argument("--instances", type=int, default=INSTANCES)
    args = p.parse_args()
    BASE_URL = args.url.rstrip("/")

    out = Path(args.output)
    out.mkdir(parents=True, exist_ok=True)

    try:
        requests.get(f"{BASE_URL}/", timeout=5).raise_for_status()
    except Exception as e:
        sys.exit(f"Backend unreachable at {BASE_URL}: {e}\n"
                 "Run: cd backend && source venv/bin/activate && uvicorn main:app")

    setup_infrastructure()

    rng  = random.Random(SEED)
    rows: list[dict] = []
    total = len(args.sizes) * args.instances

    for n in args.sizes:
        print(f"\nN = {n} groups  ({args.instances} instances)")
        for i in range(args.instances):
            idx = len(rows) + 1
            print(f"  [{idx:3d}/{total}] i={i+1:2d} … ", end="", flush=True)
            r = run_instance(n, rng)
            rows.append(r)
            print(f"rt_full={r['rt_full_ms']:.0f}ms  "
                  f"feas={r['feasible_full']*100:.0f}%  "
                  f"skips={r['skips_full']}  "
                  f"S1={r['s1_full']:.2f}  S2={r['s2_full']*100:.0f}%  S4={r['s4_full']*100:.0f}%")
        save_csv(rows, out)

    print("\n" + "=" * 64)
    print_summary(rows, out)
    save_csv(rows, out)


if __name__ == "__main__":
    main()
