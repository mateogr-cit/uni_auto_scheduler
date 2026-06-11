"""
Scheduling benchmark endpoint.

Runs the scheduling algorithm (all 4 modes) against real DB data
but NEVER commits — the transaction is always rolled back so existing
schedules are untouched.

Modes
-----
baseline            First-available professor, first-valid slot, no auth / flush overhead.
full                Load-balanced professor, score-based slots, no auth / flush overhead.
baseline_realistic  Same as baseline + one JWT decode per request + db.flush() per write.
full_realistic      Same as full     + one JWT decode per request + db.flush() per write.

Timing buckets
--------------
total_ms         End-to-end wall time inside _run_single.
algorithm_ms     Time inside find_slot_and_room calls only.
auth_ms          Single JWT decode at request entry (realistic modes only).
db_read_ms       All SELECT queries (top-level loads + per-curriculum loop queries).
db_write_ms      db.flush() calls on the simulated inserts (realistic modes only).
db_rollback_ms   The final db.rollback() that discards the simulated writes.

Scopes
------
single       /compare      — one (year, semester) pair, all 4 modes
full_school  /compare-school — all (year, semester) pairs in active curriculum, all 4 modes

Results persistence
-------------------
Both endpoints append to:
  results/benchmark_runs.json   — full history as a JSON array
  results/benchmark_runs.csv    — tabular history with a scope column
"""

import csv
import json
import math
import time
import logging
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session

from core.security import create_access_token, decode_token
from database import get_db
from models import (
    Base,
    CourseCurriculum,
    CourseSchedule,
    CourseSession,
    Course,
    StudentGroup,
    TimeSlots,
    Rooms,
    Prof,
    SessionTypeModel,
    SessionType,
    ProfessorAvailability,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/schedule-benchmark", tags=["benchmark"])

VALID_MODES = {"baseline", "full", "baseline_realistic", "full_realistic"}
ALL_MODES = ["baseline", "full", "baseline_realistic", "full_realistic"]

# Results files sit two levels up from this file (project root / results/)
RESULTS_DIR = Path(__file__).parent.parent.parent / "results"
JSON_FILE = RESULTS_DIR / "benchmark_runs.json"
CSV_FILE = RESULTS_DIR / "benchmark_runs.csv"

CSV_FIELDS = [
    "timestamp", "scope", "mode", "run_index", "year", "semester_number",
    "schedules_simulated", "skipped_count", "total_records",
    "total_ms", "algorithm_ms", "auth_ms",
    "db_read_ms", "db_write_ms", "db_rollback_ms",
]


@contextmanager
def _measure(timing: dict, key: str):
    """Accumulate elapsed wall-time (ms) of the wrapped block into timing[key]."""
    t0 = time.perf_counter()
    try:
        yield
    finally:
        timing[key] += (time.perf_counter() - t0) * 1000


def _count_all_records(db: Session) -> tuple[int, dict[str, int]]:
    """
    Return (total, per_table) row counts across every table registered with
    Base.metadata. The total is the sum of every per_table value. This is
    pure dataset metadata, intentionally measured outside the timed path so
    it does not pollute total_ms / db_read_ms.
    """
    per_table: dict[str, int] = {}
    for table in Base.metadata.sorted_tables:
        count = db.execute(select(func.count()).select_from(table)).scalar() or 0
        per_table[table.name] = int(count)
    return sum(per_table.values()), per_table


def _archive_legacy_results() -> None:
    """
    If the existing CSV header doesn't match the current CSV_FIELDS, rename both
    the CSV and JSON to a timestamped `.legacy.*` so old data isn't corrupted
    by appending rows with a different column set.
    """
    if not CSV_FILE.exists():
        return
    with CSV_FILE.open("r", newline="") as f:
        try:
            existing_header = next(csv.reader(f))
        except StopIteration:
            existing_header = []
    if not existing_header or existing_header == CSV_FIELDS:
        return

    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S")
    csv_archive  = CSV_FILE.with_name(f"benchmark_runs.legacy.{stamp}.csv")
    json_archive = JSON_FILE.with_name(f"benchmark_runs.legacy.{stamp}.json")
    CSV_FILE.rename(csv_archive)
    if JSON_FILE.exists():
        JSON_FILE.rename(json_archive)
    logger.warning(
        "Benchmark schema changed; archived old results to %s / %s",
        csv_archive.name, json_archive.name,
    )


def _save_results(results: list[dict]) -> None:
    """Append benchmark result dicts to JSON and CSV. Each dict must have a 'scope' key."""
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)

    _archive_legacy_results()

    # JSON: load existing array, extend, rewrite.
    existing = []
    if JSON_FILE.exists():
        try:
            existing = json.loads(JSON_FILE.read_text())
        except json.JSONDecodeError:
            existing = []
    JSON_FILE.write_text(json.dumps(existing + results, indent=2))

    # CSV: append rows (write header if file is new).
    write_header = not CSV_FILE.exists()
    with CSV_FILE.open("a", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_FIELDS)
        if write_header:
            writer.writeheader()
        for r in results:
            writer.writerow({
                "timestamp":           r["timestamp"],
                "scope":               r.get("scope", "single"),
                "mode":                r["mode"],
                "run_index":           r.get("run_index", 0),
                "year":                r["year"],
                "semester_number":     r["semester_number"],
                "schedules_simulated": r["schedules_simulated"],
                "skipped_count":       r["skipped_count"],
                "total_records":       r.get("total_records", 0),
                "total_ms":            r["timing"]["total_ms"],
                "algorithm_ms":        r["timing"]["algorithm_ms"],
                "auth_ms":             r["timing"]["auth_ms"],
                "db_read_ms":          r["timing"]["db_read_ms"],
                "db_write_ms":         r["timing"]["db_write_ms"],
                "db_rollback_ms":      r["timing"]["db_rollback_ms"],
            })


def _run_single(
    mode: str,
    year: int,
    semester_number: int,
    max_courses_per_group: int,
    db: Session,
) -> dict:
    """
    Run one benchmark pass and return a result dict.
    The DB transaction is always rolled back — nothing is persisted.
    """
    is_realistic = mode.endswith("_realistic")
    effective_mode = "baseline" if "baseline" in mode else "full"

    timing = {
        "total_ms": 0.0,
        "algorithm_ms": 0.0,
        "auth_ms": 0.0,
        "db_read_ms": 0.0,
        "db_write_ms": 0.0,
        "db_rollback_ms": 0.0,
    }
    request_start = time.perf_counter()

    # The real auto-schedule endpoint decodes the JWT once per HTTP request via
    # the auth dependency, not once per assignment. Model that here so auth_ms
    # reflects production behaviour rather than per-loop overhead.
    bench_token = (
        create_access_token({"sub": "benchmark", "u_id": 0, "u_role": "admin"})
        if is_realistic else None
    )
    if is_realistic:
        with _measure(timing, "auth_ms"):
            decode_token(bench_token)

    # ── data load ────────────────────────────────────────────────────────────
    with _measure(timing, "db_read_ms"):
        raw_entries = db.query(CourseCurriculum).filter(
            and_(
                CourseCurriculum.is_active == True,
                CourseCurriculum.year_level == year,
                CourseCurriculum.semester_number == semester_number,
            )
        ).all()

    seen: set = set()
    curriculum_entries = []
    for e in raw_entries:
        key = (e.c_id, e.degree_id)
        if key not in seen:
            seen.add(key)
            curriculum_entries.append(e)

    if not curriculum_entries:
        raise HTTPException(
            status_code=404,
            detail="No active courses found for this year and semester",
        )

    with _measure(timing, "db_read_ms"):
        course_map = {c.c_id: c for c in db.query(Course).filter(
            Course.c_id.in_({e.c_id for e in curriculum_entries})
        ).all()}

    curriculum_entries.sort(
        key=lambda e: course_map[e.c_id].c_difficulty_weight if e.c_id in course_map else 0.0,
        reverse=True,
    )

    with _measure(timing, "db_read_ms"):
        lecture_type = db.query(SessionTypeModel).filter(
            SessionTypeModel.type_name == SessionType.Lecture
        ).first()
        seminar_type = db.query(SessionTypeModel).filter(
            SessionTypeModel.type_name == SessionType.Seminar
        ).first()

    if not lecture_type or not seminar_type:
        raise HTTPException(status_code=500, detail="Session types not configured")

    with _measure(timing, "db_read_ms"):
        all_slots = db.query(TimeSlots).all()
        all_rooms = db.query(Rooms).order_by(Rooms.capacity).all()

    if not all_slots:
        raise HTTPException(status_code=400, detail="No time slots configured")
    if not all_rooms:
        raise HTTPException(status_code=400, detail="No rooms configured")

    room_capacity_map = {r.room_id: r.capacity for r in all_rooms}

    with _measure(timing, "db_read_ms"):
        avail_records = db.query(ProfessorAvailability).all()

    avail_by_prof: dict = {}
    for rec in avail_records:
        avail_by_prof.setdefault(rec.u_id, []).append(rec)

    prof_availability_blocked: set = set()
    for prof_id, records in avail_by_prof.items():
        windows = [(r.day_of_week, r.start_time, r.end_time) for r in records if r.is_available]
        for slot in all_slots:
            covered = any(
                w[0] == slot.day_of_week and w[1] <= slot.start_time and w[2] >= slot.end_time
                for w in windows
            )
            if not covered:
                prof_availability_blocked.add((prof_id, slot.slot_id))

    # ── in-memory conflict state ──────────────────────────────────────────────
    prof_slot_used: set = set()
    room_slot_used: set = set()
    group_slot_used: set = set()
    group_day_count: dict = {}
    group_day_weight: dict = {}
    room_slot_course: dict = {}
    room_slot_occupancy: dict = {}
    prof_load: dict = {}
    group_course_count: dict = {}

    # ── helpers ───────────────────────────────────────────────────────────────
    def day_session_score(group_id: int, day_value: str) -> int:
        count = group_day_count.get((group_id, day_value), 0)
        if count == 1:   return 0
        if count == 0:   return 1
        if count == 2:   return 2
        return 99

    def _room_ok(room, slot, group_capacity: int, course_id: int) -> bool:
        if room.capacity < group_capacity:
            return False
        key = (room.room_id, slot.slot_id)
        if key not in room_slot_used:
            return True
        return (
            room_slot_course.get(key) == course_id
            and room_slot_occupancy.get(key, 0) + group_capacity <= room.capacity
        )

    def find_slot_and_room(prof_id, group_id, group_capacity, course_id,
                           exclude_slot_id=None, exclude_day=None, difficulty_weight=1.0):
        if effective_mode == "baseline":
            preferred, fallback = [], []
            for slot in all_slots:
                if slot.slot_id == exclude_slot_id:
                    continue
                if (prof_id, slot.slot_id) in prof_slot_used:
                    continue
                if (prof_id, slot.slot_id) in prof_availability_blocked:
                    continue
                if (group_id, slot.slot_id) in group_slot_used:
                    continue
                for room in all_rooms:
                    if not _room_ok(room, slot, group_capacity, course_id):
                        continue
                    target = fallback if (exclude_day and slot.day_of_week.value == exclude_day) else preferred
                    target.append((slot, room))
                    break
            for slot, room in (preferred or fallback):
                return slot, room
            return None, None

        same_day_penalty = 5.0 + difficulty_weight * 3.0
        candidates = []
        for slot in all_slots:
            if slot.slot_id == exclude_slot_id:
                continue
            if (prof_id, slot.slot_id) in prof_slot_used:
                continue
            if (prof_id, slot.slot_id) in prof_availability_blocked:
                continue
            if (group_id, slot.slot_id) in group_slot_used:
                continue
            score = day_session_score(group_id, slot.day_of_week.value)
            if score == 99:
                continue
            if exclude_day and slot.day_of_week.value == exclude_day:
                score += same_day_penalty
            weight_penalty = group_day_weight.get((group_id, slot.day_of_week.value), 0.0) / 10.0
            for room in all_rooms:
                if not _room_ok(room, slot, group_capacity, course_id):
                    continue
                combine_bonus = -2.0 if (room.room_id, slot.slot_id) in room_slot_used else 0.0
                candidates.append((score + weight_penalty + combine_bonus, slot, room))
                break

        if not candidates:
            preferred_fb, same_day_fb = [], []
            for slot in all_slots:
                if slot.slot_id == exclude_slot_id:
                    continue
                if (prof_id, slot.slot_id) in prof_slot_used:
                    continue
                if (prof_id, slot.slot_id) in prof_availability_blocked:
                    continue
                if (group_id, slot.slot_id) in group_slot_used:
                    continue
                for room in all_rooms:
                    if not _room_ok(room, slot, group_capacity, course_id):
                        continue
                    target = same_day_fb if (exclude_day and slot.day_of_week.value == exclude_day) else preferred_fb
                    target.append((slot, room))
                    break
            for slot, room in (preferred_fb or same_day_fb):
                return slot, room

        if not candidates:
            return None, None

        candidates.sort(key=lambda x: x[0])
        return candidates[0][1], candidates[0][2]

    # ── main scheduling loop ──────────────────────────────────────────────────
    created_count = 0
    skipped_count = 0

    try:
        for curriculum in curriculum_entries:
            course = course_map.get(curriculum.c_id)
            if not course:
                continue

            with _measure(timing, "db_read_ms"):
                student_groups = db.query(StudentGroup).filter(
                    and_(
                        StudentGroup.deg_id == curriculum.degree_id,
                        StudentGroup.year_level == curriculum.year_level,
                        StudentGroup.semester_number == curriculum.semester_number,
                    )
                ).all()

            with _measure(timing, "db_read_ms"):
                professors = (
                    db.query(Prof)
                    .filter(Prof.courses.any(Course.c_id == course.c_id))
                    .order_by(Prof.u_id)
                    .all()
                )
            if not professors:
                skipped_count += len(student_groups)
                continue

            for group in student_groups:
                if group_course_count.get(group.group_id, 0) >= max_courses_per_group:
                    skipped_count += 1
                    continue

                prof = (
                    professors[0]
                    if effective_mode == "baseline"
                    else min(professors, key=lambda p: prof_load.get(p.u_id, 0))
                )

                t0 = time.perf_counter()
                lec_slot, lec_room = find_slot_and_room(
                    prof.u_id, group.group_id, group.capacity, course.c_id
                )
                timing["algorithm_ms"] += (time.perf_counter() - t0) * 1000

                if not lec_slot:
                    skipped_count += 1
                    continue

                lec_day_key = (group.group_id, lec_slot.day_of_week.value)
                group_day_count[lec_day_key] = group_day_count.get(lec_day_key, 0) + 1
                group_day_weight[lec_day_key] = group_day_weight.get(lec_day_key, 0.0) + course.c_difficulty_weight

                t0 = time.perf_counter()
                sem_slot, sem_room = find_slot_and_room(
                    prof.u_id, group.group_id, group.capacity, course.c_id,
                    exclude_slot_id=lec_slot.slot_id,
                    exclude_day=lec_slot.day_of_week.value,
                    difficulty_weight=course.c_difficulty_weight,
                )
                timing["algorithm_ms"] += (time.perf_counter() - t0) * 1000

                if not sem_slot:
                    group_day_count[lec_day_key] -= 1
                    group_day_weight[lec_day_key] -= course.c_difficulty_weight
                    skipped_count += 1
                    continue

                if is_realistic:
                    now = datetime.now()
                    offering = CourseSchedule(
                        c_id=course.c_id,
                        group_id=group.group_id,
                        room_id=lec_room.room_id,
                        slot_id=lec_slot.slot_id,
                        session_type_id=lecture_type.session_type_id,
                        u_id=prof.u_id,
                        s_status="benchmark",
                        createdAt=now,
                        updatedAt=now,
                    )
                    db.add(offering)
                    with _measure(timing, "db_write_ms"):
                        db.flush()

                    db.add(CourseSession(
                        schedule_id=offering.schedule_id,
                        room_id=lec_room.room_id,
                        slot_id=lec_slot.slot_id,
                        session_type_id=lecture_type.session_type_id,
                        s_status="benchmark",
                        createdAt=now,
                        updatedAt=now,
                    ))
                    db.add(CourseSession(
                        schedule_id=offering.schedule_id,
                        room_id=sem_room.room_id,
                        slot_id=sem_slot.slot_id,
                        session_type_id=seminar_type.session_type_id,
                        s_status="benchmark",
                        createdAt=now,
                        updatedAt=now,
                    ))
                    with _measure(timing, "db_write_ms"):
                        db.flush()

                for slot_id in (lec_slot.slot_id, sem_slot.slot_id):
                    prof_slot_used.add((prof.u_id, slot_id))
                    group_slot_used.add((group.group_id, slot_id))
                for _room, _slot in ((lec_room, lec_slot), (sem_room, sem_slot)):
                    _key = (_room.room_id, _slot.slot_id)
                    if _key not in room_slot_used:
                        room_slot_used.add(_key)
                        room_slot_course[_key] = course.c_id
                        room_slot_occupancy[_key] = group.capacity
                    else:
                        room_slot_occupancy[_key] = room_slot_occupancy.get(_key, 0) + group.capacity

                prof_load[prof.u_id] = prof_load.get(prof.u_id, 0) + 2
                sem_day_key = (group.group_id, sem_slot.day_of_week.value)
                group_day_count[sem_day_key] = group_day_count.get(sem_day_key, 0) + 1
                group_day_weight[sem_day_key] = group_day_weight.get(sem_day_key, 0.0) + course.c_difficulty_weight
                group_course_count[group.group_id] = group_course_count.get(group.group_id, 0) + 1
                created_count += 1

    finally:
        with _measure(timing, "db_rollback_ms"):
            db.rollback()

    timing["total_ms"] = (time.perf_counter() - request_start) * 1000

    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "mode": mode,
        "year": year,
        "semester_number": semester_number,
        "schedules_simulated": created_count,
        "skipped_count": skipped_count,
        "timing": {k: round(v, 3) for k, v in timing.items()},
        "note": "Read-only benchmark — no data was written to the database",
    }


def _mean_std(values: list[float]) -> tuple[float, float]:
    """Return (mean, sample std dev with ddof=1). Std is 0 if fewer than 2 samples."""
    if not values:
        return 0.0, 0.0
    mean = sum(values) / len(values)
    if len(values) < 2:
        return round(mean, 3), 0.0
    var = sum((v - mean) ** 2 for v in values) / (len(values) - 1)
    return round(mean, 3), round(math.sqrt(var), 3)


def _summarize_runs(runs: list[dict]) -> dict:
    """Build a mean+std summary across N raw runs for the same (scope, mode)."""
    keys = ["total_ms", "algorithm_ms", "auth_ms",
            "db_read_ms", "db_write_ms", "db_rollback_ms"]
    summary = {"n_runs": len(runs)}
    for k in keys:
        mean, std = _mean_std([r["timing"][k] for r in runs])
        summary[f"{k}_mean"] = mean
        summary[f"{k}_std"]  = std
    sim_mean, sim_std = _mean_std([float(r["schedules_simulated"]) for r in runs])
    skip_mean, skip_std = _mean_std([float(r["skipped_count"]) for r in runs])
    summary["schedules_simulated_mean"] = sim_mean
    summary["schedules_simulated_std"]  = sim_std
    summary["skipped_count_mean"]       = skip_mean
    summary["skipped_count_std"]        = skip_std
    return summary


# ── endpoints ─────────────────────────────────────────────────────────────────

@router.post("/run")
def run_benchmark(
    year: int,
    semester_number: int,
    mode: str = "full",
    max_courses_per_group: int = 10,
    db: Session = Depends(get_db),
):
    if mode not in VALID_MODES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid mode '{mode}'. Choose from: {', '.join(sorted(VALID_MODES))}",
        )
    total_records, records_per_table = _count_all_records(db)
    result = _run_single(mode, year, semester_number, max_courses_per_group, db)
    result["total_records"] = total_records
    result["records_per_table"] = records_per_table
    return result


@router.post("/compare")
def compare_all_modes(
    year: int,
    semester_number: int,
    max_courses_per_group: int = 10,
    runs: int = 1,
    db: Session = Depends(get_db),
):
    """
    Run all 4 modes for one (year, semester) pair and return a side-by-side comparison.
    Each mode is executed `runs` times (default 1). Every individual run is
    appended to results/benchmark_runs.json and results/benchmark_runs.csv with
    its own run_index so post-hoc std-dev analysis can use the raw samples.
    """
    if runs < 1:
        raise HTTPException(status_code=400, detail="runs must be >= 1")

    total_records, records_per_table = _count_all_records(db)

    all_runs: list[dict] = []
    runs_by_mode: dict[str, list[dict]] = {m: [] for m in ALL_MODES}

    for mode in ALL_MODES:
        for i in range(runs):
            result = _run_single(mode, year, semester_number, max_courses_per_group, db)
            result["scope"] = "single"
            result["run_index"] = i
            result["total_records"] = total_records
            result["records_per_table"] = records_per_table
            runs_by_mode[mode].append(result)
            all_runs.append(result)

    _save_results(all_runs)

    summary = {m: _summarize_runs(runs_by_mode[m]) for m in ALL_MODES}

    return {
        "scope": "single",
        "year": year,
        "semester_number": semester_number,
        "runs": runs,
        "total_records": total_records,
        "records_per_table": records_per_table,
        "results": all_runs,
        "summary": summary,
        "saved_to": [str(JSON_FILE), str(CSV_FILE)],
        "note": "Read-only benchmark — no data was written to the database",
    }


@router.post("/compare-school")
def compare_school(
    max_courses_per_group: int = 10,
    runs: int = 1,
    db: Session = Depends(get_db),
):
    """
    Full-school benchmark: run all 4 modes across EVERY active (year, semester) pair
    found in the curriculum. Each pair is scheduled independently with a fresh
    in-memory conflict state, mirroring how the real scheduler works semester-by-semester.

    Aggregate timing (sum across all pairs) is saved with scope='full_school'.
    Use /compare?year=1&semester_number=1 for single-semester timing to compare against.
    """
    combos = (
        db.query(CourseCurriculum.year_level, CourseCurriculum.semester_number)
        .filter(CourseCurriculum.is_active == True)
        .distinct()
        .order_by(CourseCurriculum.year_level, CourseCurriculum.semester_number)
        .all()
    )

    if not combos:
        raise HTTPException(status_code=404, detail="No active curriculum found in database")

    if runs < 1:
        raise HTTPException(status_code=400, detail="runs must be >= 1")

    total_records, records_per_table = _count_all_records(db)
    save_records: list[dict] = []
    runs_by_mode: dict[str, list[dict]] = {m: [] for m in ALL_MODES}

    for mode in ALL_MODES:
        for i in range(runs):
            ts = datetime.now(timezone.utc).isoformat()
            agg_timing = {
                "total_ms": 0.0, "algorithm_ms": 0.0, "auth_ms": 0.0,
                "db_read_ms": 0.0, "db_write_ms": 0.0, "db_rollback_ms": 0.0,
            }
            agg_simulated = 0
            agg_skipped = 0
            for year, semester_number in combos:
                try:
                    r = _run_single(mode, year, semester_number, max_courses_per_group, db)
                except HTTPException as exc:
                    if exc.status_code == 404:
                        continue
                    raise
                agg_simulated += r["schedules_simulated"]
                agg_skipped   += r["skipped_count"]
                for k in agg_timing:
                    agg_timing[k] += r["timing"][k]

            record = {
                "timestamp":           ts,
                "scope":               "full_school",
                "mode":                mode,
                "run_index":           i,
                "year":                0,
                "semester_number":     0,
                "schedules_simulated": agg_simulated,
                "skipped_count":       agg_skipped,
                "total_records":       total_records,
                "records_per_table":   records_per_table,
                "timing":              {k: round(v, 3) for k, v in agg_timing.items()},
            }
            save_records.append(record)
            runs_by_mode[mode].append(record)

    _save_results(save_records)

    summary = {m: _summarize_runs(runs_by_mode[m]) for m in ALL_MODES}

    return {
        "scope": "full_school",
        "runs": runs,
        "combos_covered": [{"year": y, "semester_number": s} for y, s in combos],
        "total_combos": len(combos),
        "total_records": total_records,
        "records_per_table": records_per_table,
        "results": save_records,
        "summary": summary,
        "saved_to": [str(JSON_FILE), str(CSV_FILE)],
        "note": "Read-only benchmark — no data was written to the database",
    }
