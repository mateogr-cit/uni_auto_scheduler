"""
Auto-scheduling service for generating course schedules.
Each course gets exactly 1 lecture session (2 hrs) + 1 seminar session (2 hrs) per week.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_
from database import get_db
from models import (
    CourseCurriculum,
    CourseSchedule,
    CourseSession,
    Course,
    StudentGroup,
    TimeSlots,
    Rooms,
    Prof,
    User,
    SessionTypeModel,
    SessionType,
    ProfessorAvailability,
)
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


def _diagnose_no_slot(
    prof_id: int,
    prof_name: str,
    group_id: int,
    group_name: str,
    group_capacity: int,
    exclude_slot_id: int | None,
    all_slots: list,
    all_rooms: list,
    prof_slot_used: set,
    group_slot_used: set,
    room_slot_used: set,
    prof_availability_blocked: set | None = None,
) -> tuple[str, list[str]]:
    """
    Analyse why find_slot_and_room returned nothing and produce a human-readable
    explanation together with a list of resource categories that are the bottleneck.
    Returns (reason_string, [missing_resource, ...]).
    """
    candidate_slots = [s for s in all_slots if s.slot_id != exclude_slot_id]
    total = len(candidate_slots)

    blocked = prof_availability_blocked or set()
    prof_free = [
        s for s in candidate_slots
        if (prof_id, s.slot_id) not in prof_slot_used
        and (prof_id, s.slot_id) not in blocked
    ]
    group_free = [s for s in candidate_slots if (group_id, s.slot_id) not in group_slot_used]
    capable_rooms = [r for r in all_rooms if r.capacity >= group_capacity]

    issues: list[str] = []
    missing: list[str] = []

    if not prof_free:
        issues.append(
            f"professor '{prof_name}' is fully booked (all {total} slot(s) already assigned)"
        )
        missing.append("professor_availability")
    else:
        prof_free_days = {s.day_of_week.value for s in prof_free}
        issues.append(
            f"professor '{prof_name}' has {len(prof_free)}/{total} free slot(s)"
            f" on: {', '.join(sorted(prof_free_days))}"
        )

    if not group_free:
        issues.append(
            f"group '{group_name}' is fully booked (all {total} slot(s) already taken)"
        )
        missing.append("time_slots")

    if not capable_rooms:
        largest_cap = max((r.capacity for r in all_rooms), default=0)
        issues.append(
            f"no room fits {group_capacity} students"
            f" (largest room has capacity {largest_cap})"
        )
        missing.append("rooms")
    else:
        shared_free = {s.slot_id for s in prof_free} & {s.slot_id for s in group_free}
        if not shared_free:
            if prof_free and group_free:
                issues.append(
                    f"professor and group '{group_name}' have no overlapping free slots"
                )
                missing.append("professor_availability")
        else:
            open_combos = [
                (sid, r.room_id)
                for sid in shared_free
                for r in capable_rooms
                if (r.room_id, sid) not in room_slot_used
            ]
            if not open_combos:
                issues.append(
                    f"all {len(capable_rooms)} suitable room(s) are booked"
                    f" in every shared free slot ({len(shared_free)} slot(s))"
                )
                missing.append("rooms")

    reason = "; ".join(issues) if issues else "unknown conflict"
    return reason, list(dict.fromkeys(missing))  # deduplicated, order-preserved


@router.post("/auto-schedule/generate")
def generate_schedule(year: int, semester_number: int, max_courses_per_group: int = 10, mode: str = "full", db: Session = Depends(get_db)):
    """
    Generate a conflict-free schedule for a given year and semester.

    For each course-group pair from the curriculum:
      - Assign 1 lecture session (2 hrs) and 1 seminar session (2 hrs) per week
      - No professor, room, or group may appear in two sessions at the same slot
    """
    raw_entries = db.query(CourseCurriculum).filter(
        and_(
            CourseCurriculum.is_active == True,
            CourseCurriculum.year_level == year,
            CourseCurriculum.semester_number == semester_number,
        )
    ).all()

    # Deduplicate by (course, degree) — duplicate rows from seeding scripts would
    # otherwise double-count against the per-group cap and produce duplicate skip entries.
    seen_curriculum: set = set()
    curriculum_entries = []
    for entry in raw_entries:
        key = (entry.c_id, entry.degree_id)
        if key not in seen_curriculum:
            seen_curriculum.add(key)
            curriculum_entries.append(entry)

    if not curriculum_entries:
        raise HTTPException(
            status_code=404,
            detail="No active courses found for this year and semester",
        )

    # Schedule heavier courses first so they get priority slot placement
    _course_map = {c.c_id: c for c in db.query(Course).filter(
        Course.c_id.in_({e.c_id for e in curriculum_entries})
    ).all()}
    curriculum_entries.sort(
        key=lambda e: _course_map[e.c_id].c_difficulty_weight if e.c_id in _course_map else 0.0,
        reverse=True,
    )

    lecture_type = db.query(SessionTypeModel).filter(
        SessionTypeModel.type_name == SessionType.Lecture
    ).first()
    seminar_type = db.query(SessionTypeModel).filter(
        SessionTypeModel.type_name == SessionType.Seminar
    ).first()

    if not lecture_type or not seminar_type:
        raise HTTPException(status_code=500, detail="Session types not configured")

    all_slots = db.query(TimeSlots).all()
    if not all_slots:
        raise HTTPException(status_code=400, detail="No time slots configured")

    all_rooms = db.query(Rooms).order_by(Rooms.capacity).all()
    if not all_rooms:
        raise HTTPException(status_code=400, detail="No rooms configured")
    room_capacity_map = {r.room_id: r.capacity for r in all_rooms}

    # Build per-professor blocked slots from ProfessorAvailability.
    # A slot is blocked for a professor when no is_available=True record for that
    # day fully covers the slot's time range.  Professors with no records are
    # treated as always available (open-world assumption).
    avail_records = db.query(ProfessorAvailability).all()
    avail_by_prof: dict = {}
    for rec in avail_records:
        avail_by_prof.setdefault(rec.u_id, []).append(rec)

    prof_availability_blocked: set = set()  # (prof_id, slot_id)
    for prof_id, records in avail_by_prof.items():
        available_windows = [
            (r.day_of_week, r.start_time, r.end_time)
            for r in records if r.is_available
        ]
        for slot in all_slots:
            covered = any(
                w_day == slot.day_of_week
                and w_start <= slot.start_time
                and w_end >= slot.end_time
                for w_day, w_start, w_end in available_windows
            )
            if not covered:
                prof_availability_blocked.add((prof_id, slot.slot_id))

    # In-memory conflict sets: (id, slot_id)
    prof_slot_used: set = set()
    room_slot_used: set = set()
    group_slot_used: set = set()

    # Track how many sessions each group has per day: (group_id, day_value) -> count
    group_day_count: dict = {}
    # Track cumulative difficulty weight per group per day to spread heavy courses
    group_day_weight: dict = {}

    # Track room ownership and occupancy to support combined lectures
    room_slot_course: dict = {}    # (room_id, slot_id) -> course_id
    room_slot_occupancy: dict = {} # (room_id, slot_id) -> total students assigned

    # Pre-load existing session conflicts so we skip already-scheduled slots
    for session in db.query(CourseSession).all():
        sched = db.query(CourseSchedule).filter(
            CourseSchedule.schedule_id == session.schedule_id
        ).first()
        if sched:
            prof_slot_used.add((sched.u_id, session.slot_id))
            room_slot_used.add((session.room_id, session.slot_id))
            group_slot_used.add((sched.group_id, session.slot_id))
            room_slot_course.setdefault((session.room_id, session.slot_id), sched.c_id)
            # Mark pre-existing sessions as fully occupied to prevent merging with them
            room_slot_occupancy[(session.room_id, session.slot_id)] = room_capacity_map.get(session.room_id, 0)
            slot_obj = next((s for s in all_slots if s.slot_id == session.slot_id), None)
            if slot_obj:
                key = (sched.group_id, slot_obj.day_of_week.value)
                group_day_count[key] = group_day_count.get(key, 0) + 1
                course_obj = db.query(Course).filter(Course.c_id == sched.c_id).first()
                if course_obj:
                    group_day_weight[key] = group_day_weight.get(key, 0.0) + course_obj.c_difficulty_weight

    # Track professor session load for fair distribution
    prof_load: dict = {}

    # Pre-load per-group course counts from already-complete schedules so that
    # re-running generate doesn't start the count fresh and allows duplicate
    # curriculum entries to be deduplicated without double-counting.
    group_course_count: dict = {}
    for sched in db.query(CourseSchedule).all():
        sessions = db.query(CourseSession).filter(
            CourseSession.schedule_id == sched.schedule_id
        ).all()
        if any(s.session_type_id == lecture_type.session_type_id for s in sessions) and \
           any(s.session_type_id == seminar_type.session_type_id for s in sessions):
            group_course_count[sched.group_id] = group_course_count.get(sched.group_id, 0) + 1

    schedule_details = []
    skipped_details = []
    created_count = 0

    def day_session_score(group_id: int, day_value: str) -> int:
        """
        Score a day for a group — lower is better.
          1 existing session → score 0 (fills to a 4-hour day, most preferred)
          0 existing sessions → score 1 (opens a new day)
          2 existing sessions → score 2 (would create a 6-hour day, least preferred)
          3+ sessions → score 99 (hard avoid — would exceed 6 hours)
        """
        count = group_day_count.get((group_id, day_value), 0)
        if count == 1:
            return 0
        if count == 0:
            return 1
        if count == 2:
            return 2
        return 99

    def find_slot_and_room(
        prof_id: int,
        group_id: int,
        group_capacity: int,
        course_id: int,
        exclude_slot_id: int | None = None,
        exclude_day: str | None = None,
        difficulty_weight: float = 1.0,
    ):
        """Return (slot, room) with no conflicts.
        In 'full' mode prefers days that give ~4-hour student days; 'baseline' takes first valid slot.
        exclude_day biases the seminar away from the lecture's day; heavier courses enforce this harder.
        Same-course groups may share a room (combined lecture) when combined capacity fits.
        """
        def _prof_available(pid: int, slot) -> bool:
            return (pid, slot.slot_id) not in prof_availability_blocked

        def _room_ok(room, slot) -> bool:
            if room.capacity < group_capacity:
                return False
            key = (room.room_id, slot.slot_id)
            if key not in room_slot_used:
                return True
            # Allow combining: same course, room still has space for this group
            return (
                room_slot_course.get(key) == course_id
                and room_slot_occupancy.get(key, 0) + group_capacity <= room.capacity
            )

        if mode == "baseline":
            # Baseline: still prefer a different day than exclude_day, but accept it as fallback
            preferred, fallback = [], []
            for slot in all_slots:
                if slot.slot_id == exclude_slot_id:
                    continue
                if (prof_id, slot.slot_id) in prof_slot_used:
                    continue
                if not _prof_available(prof_id, slot):
                    continue
                if (group_id, slot.slot_id) in group_slot_used:
                    continue
                for room in all_rooms:
                    if not _room_ok(room, slot):
                        continue
                    if exclude_day and slot.day_of_week.value == exclude_day:
                        fallback.append((slot, room))
                    else:
                        preferred.append((slot, room))
                    break
            for slot, room in (preferred or fallback):
                return slot, room
            return None, None

        # Same-day penalty: base 5 plus weight-scaled bonus so heavier courses
        # push harder for a different day than their paired session.
        same_day_penalty = 5.0 + difficulty_weight * 3.0

        candidates = []
        for slot in all_slots:
            if slot.slot_id == exclude_slot_id:
                continue
            if (prof_id, slot.slot_id) in prof_slot_used:
                continue
            if not _prof_available(prof_id, slot):
                continue
            if (group_id, slot.slot_id) in group_slot_used:
                continue
            score = day_session_score(group_id, slot.day_of_week.value)
            if score == 99:
                continue  # Skip days that would give more than 6 hours
            if exclude_day and slot.day_of_week.value == exclude_day:
                score += same_day_penalty
            weight_penalty = group_day_weight.get((group_id, slot.day_of_week.value), 0.0) / 10.0
            for room in all_rooms:
                if not _room_ok(room, slot):
                    continue
                # Prefer combining with an existing same-course session over opening a new room
                combine_bonus = -2.0 if (room.room_id, slot.slot_id) in room_slot_used else 0.0
                candidates.append((score + weight_penalty + combine_bonus, slot, room))
                break  # One room per slot is enough

        if not candidates:
            # Fallback: allow any day including already-full ones, still prefer different day
            preferred_fb, same_day_fb = [], []
            for slot in all_slots:
                if slot.slot_id == exclude_slot_id:
                    continue
                if (prof_id, slot.slot_id) in prof_slot_used:
                    continue
                if not _prof_available(prof_id, slot):
                    continue
                if (group_id, slot.slot_id) in group_slot_used:
                    continue
                for room in all_rooms:
                    if not _room_ok(room, slot):
                        continue
                    if exclude_day and slot.day_of_week.value == exclude_day:
                        same_day_fb.append((slot, room))
                    else:
                        preferred_fb.append((slot, room))
                    break
            for slot, room in (preferred_fb or same_day_fb):
                return slot, room

        if not candidates:
            return None, None

        candidates.sort(key=lambda x: x[0])
        _, best_slot, best_room = candidates[0]
        return best_slot, best_room

    try:
        # Remove any CourseSchedule records for this semester that have no sessions —
        # these are orphaned records left behind by previous incomplete generation runs.
        semester_course_ids = {e.c_id for e in curriculum_entries}
        for sched in db.query(CourseSchedule).filter(
            CourseSchedule.c_id.in_(semester_course_ids)
        ).all():
            has_sessions = db.query(CourseSession).filter(
                CourseSession.schedule_id == sched.schedule_id
            ).first() is not None
            if not has_sessions:
                db.delete(sched)
        db.flush()

        for curriculum in curriculum_entries:
            course = db.query(Course).filter(Course.c_id == curriculum.c_id).first()
            if not course:
                continue

            student_groups = db.query(StudentGroup).filter(
                and_(
                    StudentGroup.deg_id == curriculum.degree_id,
                    StudentGroup.year_level == curriculum.year_level,
                    StudentGroup.semester_number == curriculum.semester_number,
                )
            ).all()

            # All professors assigned to this course
            professors = (
                db.query(Prof)
                .filter(Prof.courses.any(Course.c_id == course.c_id))
                .order_by(Prof.u_id)
                .all()
            )
            if not professors:
                logger.warning(f"No professor for course {course.c_abbr}, skipping")
                for group in student_groups:
                    skipped_details.append({
                        "course": course.c_name,
                        "course_abbr": course.c_abbr,
                        "group": group.group_name,
                        "year_level": curriculum.year_level,
                        "semester_number": curriculum.semester_number,
                        "session_type": "Lecture + Seminar",
                        "reason": "No professor is assigned to this course",
                        "missing": ["professor"],
                    })
                continue

            for group in student_groups:
                existing = db.query(CourseSchedule).filter(
                    and_(
                        CourseSchedule.c_id == course.c_id,
                        CourseSchedule.group_id == group.group_id,
                    )
                ).first()

                existing_sessions = (
                    db.query(CourseSession)
                    .filter(CourseSession.schedule_id == existing.schedule_id)
                    .all()
                    if existing else []
                )

                # Skip only if both lecture and seminar sessions already exist
                has_lecture = any(s.session_type_id == lecture_type.session_type_id for s in existing_sessions)
                has_seminar = any(s.session_type_id == seminar_type.session_type_id for s in existing_sessions)
                if has_lecture and has_seminar:
                    # Already counted during pre-load; don't increment again
                    continue

                # Enforce max courses per group
                if group_course_count.get(group.group_id, 0) >= max_courses_per_group:
                    logger.info(f"Group {group.group_name} already has {max_courses_per_group} courses, skipping {course.c_abbr}")
                    skipped_details.append({
                        "course": course.c_name,
                        "course_abbr": course.c_abbr,
                        "group": group.group_name,
                        "year_level": curriculum.year_level,
                        "semester_number": curriculum.semester_number,
                        "session_type": "Lecture + Seminar",
                        "reason": f"Group '{group.group_name}' already reached the maximum of {max_courses_per_group} course(s) per group",
                        "missing": [],
                    })
                    continue

                # Pick professor: load-balanced in 'full', first available in 'baseline'
                if mode == "baseline":
                    prof = professors[0]
                else:
                    prof = min(professors, key=lambda p: prof_load.get(p.u_id, 0))

                prof_name = f"{prof.fname} {prof.lname}"

                lec_slot, lec_room = find_slot_and_room(
                    prof.u_id, group.group_id, group.capacity, course.c_id
                )
                if not lec_slot:
                    reason, missing = _diagnose_no_slot(
                        prof.u_id, prof_name,
                        group.group_id, group.group_name, group.capacity,
                        None, all_slots, all_rooms,
                        prof_slot_used, group_slot_used, room_slot_used,
                        prof_availability_blocked,
                    )
                    logger.warning(f"No lecture slot for {course.c_abbr}/{group.group_name}: {reason}")
                    skipped_details.append({
                        "course": course.c_name,
                        "course_abbr": course.c_abbr,
                        "group": group.group_name,
                        "year_level": curriculum.year_level,
                        "semester_number": curriculum.semester_number,
                        "session_type": "Lecture",
                        "professor": prof_name,
                        "reason": reason,
                        "missing": missing,
                    })
                    continue

                # Commit the lecture's day count before scoring the seminar so the
                # seminar sees an accurate picture and prefers a different day.
                lec_day_key = (group.group_id, lec_slot.day_of_week.value)
                group_day_count[lec_day_key] = group_day_count.get(lec_day_key, 0) + 1
                group_day_weight[lec_day_key] = group_day_weight.get(lec_day_key, 0.0) + course.c_difficulty_weight

                sem_slot, sem_room = find_slot_and_room(
                    prof.u_id, group.group_id, group.capacity, course.c_id,
                    exclude_slot_id=lec_slot.slot_id,
                    exclude_day=lec_slot.day_of_week.value,
                    difficulty_weight=course.c_difficulty_weight,
                )
                if not sem_slot:
                    group_day_count[lec_day_key] -= 1  # roll back the early increment
                    group_day_weight[lec_day_key] = group_day_weight.get(lec_day_key, 0.0) - course.c_difficulty_weight
                    reason, missing = _diagnose_no_slot(
                        prof.u_id, prof_name,
                        group.group_id, group.group_name, group.capacity,
                        lec_slot.slot_id, all_slots, all_rooms,
                        prof_slot_used, group_slot_used, room_slot_used,
                        prof_availability_blocked,
                    )
                    logger.warning(f"No seminar slot for {course.c_abbr}/{group.group_name}: {reason}")
                    skipped_details.append({
                        "course": course.c_name,
                        "course_abbr": course.c_abbr,
                        "group": group.group_name,
                        "year_level": curriculum.year_level,
                        "semester_number": curriculum.semester_number,
                        "session_type": "Seminar",
                        "professor": prof_name,
                        "lecture_assigned": {
                            "day": lec_slot.day_of_week.value,
                            "slot_id": lec_slot.slot_id,
                            "room": lec_room.room_id,
                        },
                        "reason": reason,
                        "missing": missing,
                    })
                    continue

                # Reuse existing offering record or create a new one
                if existing:
                    offering = existing
                    offering.u_id = prof.u_id
                    offering.room_id = lec_room.room_id
                    offering.slot_id = lec_slot.slot_id
                    offering.updatedAt = datetime.now()
                    # Remove any partial sessions so we start clean
                    for s in existing_sessions:
                        db.delete(s)
                    db.flush()
                else:
                    offering = CourseSchedule(
                        c_id=course.c_id,
                        group_id=group.group_id,
                        room_id=lec_room.room_id,
                        slot_id=lec_slot.slot_id,
                        session_type_id=lecture_type.session_type_id,
                        u_id=prof.u_id,
                        s_status="scheduled",
                        createdAt=datetime.now(),
                        updatedAt=datetime.now(),
                    )
                    db.add(offering)
                    db.flush()

                db.add(CourseSession(
                    schedule_id=offering.schedule_id,
                    room_id=lec_room.room_id,
                    slot_id=lec_slot.slot_id,
                    session_type_id=lecture_type.session_type_id,
                    s_status="scheduled",
                    createdAt=datetime.now(),
                    updatedAt=datetime.now(),
                ))
                db.add(CourseSession(
                    schedule_id=offering.schedule_id,
                    room_id=sem_room.room_id,
                    slot_id=sem_slot.slot_id,
                    session_type_id=seminar_type.session_type_id,
                    s_status="scheduled",
                    createdAt=datetime.now(),
                    updatedAt=datetime.now(),
                ))
                db.flush()

                # Mark slots used
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

                # lec_day_key was already incremented before seminar scoring; only update seminar's day.
                sem_day_key = (group.group_id, sem_slot.day_of_week.value)
                group_day_count[sem_day_key] = group_day_count.get(sem_day_key, 0) + 1
                group_day_weight[sem_day_key] = group_day_weight.get(sem_day_key, 0.0) + course.c_difficulty_weight
                group_course_count[group.group_id] = group_course_count.get(group.group_id, 0) + 1

                created_count += 1
                schedule_details += [
                    {
                        "offering_id": offering.schedule_id,
                        "schedule_id": offering.schedule_id,
                        "course": course.c_name,
                        "group": group.group_name,
                        "type": "Lecture",
                        "day": lec_slot.day_of_week.value,
                        "room": lec_room.room_id,
                        "slot_id": lec_slot.slot_id,
                    },
                    {
                        "offering_id": offering.schedule_id,
                        "schedule_id": offering.schedule_id,
                        "course": course.c_name,
                        "group": group.group_name,
                        "type": "Seminar",
                        "day": sem_slot.day_of_week.value,
                        "room": sem_room.room_id,
                        "slot_id": sem_slot.slot_id,
                    },
                ]

        db.commit()
        logger.info(f"Generated {created_count} offerings, skipped {len(skipped_details)}")

        return {
            "status": "success",
            "year": year,
            "semester_number": semester_number,
            "semester_name": f"Year {year}, Semester {semester_number}",
            "schedules_created": created_count,
            "offerings_created": created_count,
            "skipped_count": len(skipped_details),
            "schedule_details": schedule_details,
            "skipped": skipped_details,
            "message": (
                f"Successfully generated {created_count} course offering(s)"
                + (f"; {len(skipped_details)} could not be scheduled" if skipped_details else "")
            ),
        }

    except Exception as e:
        logger.error(f"Schedule generation error: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error generating schedule: {str(e)}")


def _get_schedule_ids_for_semester(db: Session, year: int, semester_number: int) -> list[int]:
    """
    Return all CourseSchedule IDs whose course appears in the curriculum
    for the given year_level + semester_number.
    """
    curriculum = db.query(CourseCurriculum).filter(
        and_(
            CourseCurriculum.year_level == year,
            CourseCurriculum.semester_number == semester_number,
        )
    ).all()
    course_ids = {c.c_id for c in curriculum}
    schedules = db.query(CourseSchedule).filter(
        CourseSchedule.c_id.in_(course_ids)
    ).all()
    return [s.schedule_id for s in schedules], [s for s in schedules]


@router.get("/auto-schedule/validate")
def validate_schedule(year: int, semester_number: int, db: Session = Depends(get_db)):
    issues = []
    warnings = []

    _, schedules = _get_schedule_ids_for_semester(db, year, semester_number)

    for schedule in schedules:
        sessions = db.query(CourseSession).filter(
            CourseSession.schedule_id == schedule.schedule_id
        ).all()

        if not sessions:
            warnings.append(f"Schedule {schedule.schedule_id} has no sessions at all")
            continue

        session_type_ids = [s.session_type_id for s in sessions]
        if len(set(session_type_ids)) < 2:
            warnings.append(
                f"Schedule {schedule.schedule_id} is missing a lecture or seminar session"
            )

        for session in sessions:
            conflicts = db.query(CourseSession).filter(
                and_(
                    CourseSession.room_id == session.room_id,
                    CourseSession.slot_id == session.slot_id,
                    CourseSession.schedule_id != schedule.schedule_id,
                    CourseSession.s_status != "cancelled",
                )
            ).all()
            for conflict in conflicts:
                conflict_sched = db.query(CourseSchedule).filter(
                    CourseSchedule.schedule_id == conflict.schedule_id
                ).first()
                # Same course sharing a room = intentional combined session, not a conflict
                if conflict_sched and conflict_sched.c_id != schedule.c_id:
                    issues.append(
                        f"Room conflict: room {session.room_id} at slot {session.slot_id}"
                    )
                    break

    return {
        "year": year,
        "semester_number": semester_number,
        "total_offerings": len(schedules),
        "total_schedules": len(schedules),
        "issues": issues,
        "warnings": warnings,
        "is_valid": len(issues) == 0,
    }


@router.delete("/auto-schedule/clear")
def clear_schedule(year: int, semester_number: int, db: Session = Depends(get_db)):
    """Clear all CourseSchedule + CourseSession records for the given curriculum year/semester."""
    _, schedules = _get_schedule_ids_for_semester(db, year, semester_number)

    deleted_sessions = 0
    for schedule in schedules:
        for session in db.query(CourseSession).filter(
            CourseSession.schedule_id == schedule.schedule_id
        ).all():
            db.delete(session)
            deleted_sessions += 1
        db.delete(schedule)

    db.commit()
    return {
        "status": "success",
        "message": f"Cleared {len(schedules)} offerings and {deleted_sessions} sessions for year {year}, semester {semester_number}",
    }
