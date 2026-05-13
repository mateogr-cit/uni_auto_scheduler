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
)
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/auto-schedule/generate")
def generate_schedule(year: int, semester_number: int, max_courses_per_group: int = 5, db: Session = Depends(get_db)):
    """
    Generate a conflict-free schedule for a given year and semester.

    For each course-group pair from the curriculum:
      - Assign 1 lecture session (2 hrs) and 1 seminar session (2 hrs) per week
      - No professor, room, or group may appear in two sessions at the same slot
    """
    curriculum_entries = db.query(CourseCurriculum).filter(
        and_(
            CourseCurriculum.is_active == True,
            CourseCurriculum.year_level == year,
            CourseCurriculum.semester_number == semester_number,
        )
    ).all()

    if not curriculum_entries:
        raise HTTPException(
            status_code=404,
            detail="No active courses found for this year and semester",
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

    # In-memory conflict sets: (id, slot_id)
    prof_slot_used: set = set()
    room_slot_used: set = set()
    group_slot_used: set = set()

    # Track how many sessions each group has per day: (group_id, day_value) -> count
    group_day_count: dict = {}

    # Pre-load existing session conflicts so we skip already-scheduled slots
    for session in db.query(CourseSession).all():
        sched = db.query(CourseSchedule).filter(
            CourseSchedule.schedule_id == session.schedule_id
        ).first()
        if sched:
            prof_slot_used.add((sched.u_id, session.slot_id))
            room_slot_used.add((session.room_id, session.slot_id))
            group_slot_used.add((sched.group_id, session.slot_id))
            slot_obj = next((s for s in all_slots if s.slot_id == session.slot_id), None)
            if slot_obj:
                key = (sched.group_id, slot_obj.day_of_week.value)
                group_day_count[key] = group_day_count.get(key, 0) + 1

    # Track professor session load for fair distribution
    prof_load: dict = {}

    # Track how many courses have been scheduled per group
    group_course_count: dict = {}

    schedule_details = []
    created_count = 0

    # Build a slot lookup by slot_id for quick access
    slot_by_id = {s.slot_id: s for s in all_slots}

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
        exclude_slot_id: int | None = None,
    ):
        """Return (slot, room) with no conflicts, preferring days that give ~4-hour student days."""
        candidates = []
        for slot in all_slots:
            if slot.slot_id == exclude_slot_id:
                continue
            if (prof_id, slot.slot_id) in prof_slot_used:
                continue
            if (group_id, slot.slot_id) in group_slot_used:
                continue
            score = day_session_score(group_id, slot.day_of_week.value)
            if score == 99:
                continue  # Skip days that would give more than 6 hours
            for room in all_rooms:
                if room.capacity < group_capacity:
                    continue
                if (room.room_id, slot.slot_id) not in room_slot_used:
                    candidates.append((score, slot, room))
                    break  # One room per slot is enough

        if not candidates:
            # Fallback: allow any day including already-full ones
            for slot in all_slots:
                if slot.slot_id == exclude_slot_id:
                    continue
                if (prof_id, slot.slot_id) in prof_slot_used:
                    continue
                if (group_id, slot.slot_id) in group_slot_used:
                    continue
                for room in all_rooms:
                    if room.capacity < group_capacity:
                        continue
                    if (room.room_id, slot.slot_id) not in room_slot_used:
                        return slot, room

        if not candidates:
            return None, None

        candidates.sort(key=lambda x: x[0])
        _, best_slot, best_room = candidates[0]
        return best_slot, best_room

    try:
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
                .all()
            )
            if not professors:
                logger.warning(f"No professor for course {course.c_abbr}, skipping")
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
                    group_course_count[group.group_id] = group_course_count.get(group.group_id, 0) + 1
                    continue

                # Enforce max courses per group
                if group_course_count.get(group.group_id, 0) >= max_courses_per_group:
                    logger.info(f"Group {group.group_name} already has {max_courses_per_group} courses, skipping {course.c_abbr}")
                    continue

                # Pick professor with lowest current load
                prof = min(professors, key=lambda p: prof_load.get(p.u_id, 0))

                lec_slot, lec_room = find_slot_and_room(
                    prof.u_id, group.group_id, group.capacity
                )
                if not lec_slot:
                    logger.warning(f"No lecture slot for {course.c_abbr} / {group.group_name}")
                    continue

                sem_slot, sem_room = find_slot_and_room(
                    prof.u_id, group.group_id, group.capacity,
                    exclude_slot_id=lec_slot.slot_id,
                )
                if not sem_slot:
                    logger.warning(f"No seminar slot for {course.c_abbr} / {group.group_name}")
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
                room_slot_used.add((lec_room.room_id, lec_slot.slot_id))
                room_slot_used.add((sem_room.room_id, sem_slot.slot_id))
                prof_load[prof.u_id] = prof_load.get(prof.u_id, 0) + 2

                # Update per-day session counts and course count for the group
                lec_day_key = (group.group_id, lec_slot.day_of_week.value)
                sem_day_key = (group.group_id, sem_slot.day_of_week.value)
                group_day_count[lec_day_key] = group_day_count.get(lec_day_key, 0) + 1
                group_day_count[sem_day_key] = group_day_count.get(sem_day_key, 0) + 1
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
        logger.info(f"Generated {created_count} offerings")

        return {
            "status": "success",
            "year": year,
            "semester_number": semester_number,
            "semester_name": f"Year {year}, Semester {semester_number}",
            "schedules_created": created_count,
            "offerings_created": created_count,
            "schedule_details": schedule_details,
            "message": f"Successfully generated {created_count} course offerings",
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
            if conflicts:
                issues.append(
                    f"Room conflict: {session.room_id} at slot {session.slot_id}"
                )

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
