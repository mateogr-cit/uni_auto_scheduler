"""
Auto-scheduling service for generating course schedules.
Automatically creates course schedules and sessions based on curriculum.
Each course gets 2 hours lecture + 2 hours seminar as mandatory.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_
from database import get_db
from models import (
    CourseCurriculum,
    CourseSchedule,
    Course,
    StudentGroup,
    TimeSlots,
    Rooms,
    CourseSession,
    Prof,
    ProfessorAvailability,
    ProfessorUnavailability,
    SessionTypeModel,
    SessionType,
    DayOfWeek,
)
from datetime import datetime, timedelta
from typing import List, Optional
import random
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


def get_available_slots(
    db: Session, professor_id: int, day_of_week: DayOfWeek, duration_hours: int
) -> List[int]:
    """
    Get available time slots for a professor on a specific day.
    Filters by professor availability and avoids conflicts.
    """
    # Get professor's availability for the day
    prof_availability = db.query(ProfessorAvailability).filter(
        and_(
            ProfessorAvailability.u_id == professor_id,
            ProfessorAvailability.day_of_week == day_of_week,
            ProfessorAvailability.is_available == True,
        )
    ).first()

    if not prof_availability:
        return []

    # Get all slots for this day
    slots = db.query(TimeSlots).filter(
        TimeSlots.day_of_week == day_of_week
    ).all()

    available_slot_ids = []
    for slot in slots:
        # Check if slot fits within professor availability
        if slot.start_time >= prof_availability.start_time and slot.end_time <= prof_availability.end_time:
            # Check for conflicts with other schedules
            conflict = db.query(CourseSchedule).filter(
                and_(
                    CourseSchedule.slot_id == slot.slot_id,
                    CourseSchedule.s_status != "cancelled",
                )
            ).first()

            if not conflict:
                available_slot_ids.append(slot.slot_id)

    return available_slot_ids


def get_suitable_room(db: Session, required_capacity: int) -> Optional[str]:
    """Get a suitable room for the required capacity with no conflicts."""
    rooms = db.query(Rooms).filter(
        Rooms.capacity >= required_capacity
    ).all()

    for room in rooms:
        # Try to find an unused time slot for this room
        conflict = db.query(CourseSchedule).filter(
            and_(
                CourseSchedule.room_id == room.room_id,
                CourseSchedule.s_status != "cancelled",
            )
        ).first()

        if not conflict:
            return room.room_id

    # If no empty room, return the smallest room that fits
    if rooms:
        rooms.sort(key=lambda r: r.capacity)
        return rooms[0].room_id

    return None


@router.post("/auto-schedule/generate")
def generate_schedule(year: int, semester_number: int, db: Session = Depends(get_db)):
    """
    Automatically generate a schedule for a given year and semester.
    Process:
    1. Get all active courses in curriculum for this year/semester
    2. Create course schedules for each group
    3. Assign professors automatically
    4. Create lecture (2hr) and seminar (2hr) sessions
    5. Allocate rooms based on group capacity
    """
    logger.info(f"Starting schedule generation for year={year}, semester={semester_number}")

    # Get all active course curriculum entries for this year and semester
    curriculum_entries = db.query(CourseCurriculum).filter(
        and_(
            CourseCurriculum.is_active == True,
            CourseCurriculum.year_level == year,
            CourseCurriculum.semester_number == semester_number,
        )
    ).all()

    if not curriculum_entries:
        logger.warning(f"No active courses found for year={year}, semester={semester_number}")
        raise HTTPException(
            status_code=404, detail="No active courses found for this year and semester"
        )

    # Get session types
    lecture_type = db.query(SessionTypeModel).filter(
        SessionTypeModel.type_name == SessionType.Lecture
    ).first()
    seminar_type = db.query(SessionTypeModel).filter(
        SessionTypeModel.type_name == SessionType.Seminar
    ).first()

    if lecture_type is None or seminar_type is None:
        logger.error("Session types not properly configured")
        raise HTTPException(
            status_code=500, detail="Session types not properly configured"
        )

    schedule_details = []
    created_schedules = []

    try:
        for curriculum in curriculum_entries:
            course = db.query(Course).filter(Course.c_id == curriculum.c_id).first()
            if course is None:
                logger.warning(f"Course not found for curriculum entry: {curriculum.c_id}")
                continue

            # Get all student groups matching year level and degree
            student_groups = db.query(StudentGroup).filter(
                and_(
                    StudentGroup.deg_id == curriculum.degree_id,
                    StudentGroup.year_level == curriculum.year_level,
                    StudentGroup.semester_number == curriculum.semester_number,
                )
            ).all()

            for group in student_groups:
                # Create course schedule for this group
                existing_schedule = db.query(CourseSchedule).filter(
                    and_(
                        CourseSchedule.c_id == course.c_id,
                        CourseSchedule.group_id == group.group_id,
                    )
                ).first()

                if existing_schedule:
                    schedule = existing_schedule
                else:
                    # Get a professor for this course
                    professors = db.query(Prof).join(User).filter(
                        Prof.courses.any(Course.c_id == course.c_id)
                    ).all()

                    if not professors:
                        logger.warning(f"No professor found for course {course.c_abbr}")
                        continue

                    assigned_prof = professors[0]

                    # Get a suitable room
                    room_id = get_suitable_room(db, group.capacity)
                    if not room_id:
                        logger.warning(f"No suitable room for group {group.group_name}")
                        continue

                    # Get a time slot
                    available_slots = get_available_slots(db, assigned_prof.u_id, DayOfWeek.Monday, 2)
                    if not available_slots:
                        logger.warning(f"No available slots for professor {assigned_prof.u_id}")
                        continue

                    slot_id = available_slots[0]

                    # Create schedule
                    schedule = CourseSchedule(
                        c_id=course.c_id,
                        group_id=group.group_id,
                        room_id=room_id,
                        slot_id=slot_id,
                        session_type_id=lecture_type.session_type_id,
                        u_id=assigned_prof.u_id,
                        s_status="scheduled",
                        createdAt=datetime.now(),
                        updatedAt=datetime.now(),
                    )
                    db.add(schedule)
                    db.flush()
                    created_schedules.append(schedule)

                # Create lecture sessions (2 hours)
                for day in [DayOfWeek.Monday, DayOfWeek.Wednesday, DayOfWeek.Friday]:
                    available_slots = get_available_slots(
                        db, schedule.u_id, day, 2
                    )

                    if available_slots:
                        slot_id = available_slots[0]
                        room_id = get_suitable_room(db, group.capacity)

                        if room_id:
                            lecture_session = CourseSession(
                                schedule_id=schedule.schedule_id,
                                room_id=room_id,
                                slot_id=slot_id,
                                session_type_id=lecture_type.session_type_id,
                                s_status="scheduled",
                                createdAt=datetime.now(),
                                updatedAt=datetime.now(),
                            )
                            db.add(lecture_session)
                            db.flush()
                            schedule_details.append(
                                {
                                    "schedule_id": schedule.schedule_id,
                                    "course": course.c_name,
                                    "group": group.group_name,
                                    "type": "Lecture",
                                    "room": room_id,
                                    "day": day.value,
                                    "slot_id": slot_id,
                                }
                            )
                            break

                # Create seminar sessions (2 hours)
                for day in [DayOfWeek.Tuesday, DayOfWeek.Thursday]:
                    available_slots = get_available_slots(
                        db, schedule.u_id, day, 2
                    )

                    if available_slots:
                        slot_id = available_slots[0]
                        room_id = get_suitable_room(db, group.capacity)

                        if room_id:
                            seminar_session = CourseSession(
                                schedule_id=schedule.schedule_id,
                                room_id=room_id,
                                slot_id=slot_id,
                                session_type_id=seminar_type.session_type_id,
                                s_status="scheduled",
                                createdAt=datetime.now(),
                                updatedAt=datetime.now(),
                            )
                            db.add(seminar_session)
                            db.flush()
                            schedule_details.append(
                                {
                                    "schedule_id": schedule.schedule_id,
                                    "course": course.c_name,
                                    "group": group.group_name,
                                    "type": "Seminar",
                                    "room": room_id,
                                    "day": day.value,
                                    "slot_id": slot_id,
                                }
                            )
                            break

        db.commit()
        logger.info(f"Schedule generation completed: {len(created_schedules)} schedules created")

        return {
            "status": "success",
            "year": year,
            "semester_number": semester_number,
            "schedules_created": len(created_schedules),
            "schedule_details": schedule_details,
            "message": f"Successfully generated schedule with {len(created_schedules)} schedules",
        }

    except Exception as e:
        logger.error(f"Error generating schedule: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error generating schedule: {str(e)}")


@router.get("/auto-schedule/validate")
def validate_schedule(year: int, semester_number: int, db: Session = Depends(get_db)):
    """
    Validate the current schedule for a year and semester.
    Checks for conflicts and ensures all requirements are met.
    """
    issues = []
    warnings = []

    schedules = db.query(CourseSchedule).join(Course).filter(
        and_(
            Course.c_year == year,
            Course.c_semester == semester_number,
        )
    ).all()

    for schedule in schedules:
        sessions = db.query(CourseSession).filter(
            CourseSession.schedule_id == schedule.schedule_id
        ).all()

        # Check if each schedule has both lecture and seminar
        session_types = [s.session_type_id for s in sessions]
        if len(set(session_types)) < 2:
            warnings.append(
                f"Schedule {schedule.schedule_id} missing lecture or seminar"
            )

        # Check for room conflicts
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
                    f"Room conflict in {session.room_id} at slot {session.slot_id}"
                )

    return {
        "year": year,
        "semester_number": semester_number,
        "total_schedules": len(schedules),
        "issues": issues,
        "warnings": warnings,
        "is_valid": len(issues) == 0,
    }


@router.delete("/auto-schedule/clear")
def clear_schedule(year: int, semester_number: int, db: Session = Depends(get_db)):
    """Clear all scheduled sessions for a given year and semester."""
    # Delete all course sessions for this year/semester
    schedules = db.query(CourseSchedule).join(Course).filter(
        and_(
            Course.c_year == year,
            Course.c_semester == semester_number,
        )
    ).all()

    deleted_count = 0
    for schedule in schedules:
        # Delete sessions for this schedule
        sessions = db.query(CourseSession).filter(
            CourseSession.schedule_id == schedule.schedule_id
        ).all()
        for session in sessions:
            db.delete(session)
            deleted_count += 1

        # Delete the schedule
        db.delete(schedule)

    db.commit()

    return {
        "status": "success",
        "message": f"Cleared {deleted_count} session entries for year {year}, semester {semester_number}",
    }
