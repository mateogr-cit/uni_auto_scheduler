"""
Auto-scheduling service for generating course schedules.
Automatically creates course offerings and session schedules based on curriculum.
Each course gets 2 hours lecture + 2 hours seminar as mandatory.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_
from database import get_db
from models import (
    CourseCurriculum,
    CourseOffering,
    Course,
    StudentGroup,
    Semester,
    TimeSlots,
    Rooms,
    OfferingSchedule,
    OfferingProfessors,
    Prof,
    ProfessorAvailability,
    ProfessorUnavailability,
    SessionTypeModel,
    SessionType,
    DayOfWeek,
)
from schemas import OfferingSchedule as OfferingScheduleSchema
from datetime import datetime, timedelta
from typing import List, Optional
import random

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
            # Check for conflicts with other offerings
            conflict = db.query(OfferingSchedule).filter(
                and_(
                    OfferingSchedule.slot_id == slot.slot_id,
                    OfferingSchedule.s_status != "cancelled",
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
        conflict = db.query(OfferingSchedule).filter(
            and_(
                OfferingSchedule.room_id == room.room_id,
                OfferingSchedule.s_status != "cancelled",
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
def generate_schedule(semester_id: int, db: Session = Depends(get_db)):
    """
    Automatically generate a schedule for a given semester.
    Process:
    1. Get all active courses in curriculum for this semester
    2. Create course offerings for each group
    3. Assign professors automatically
    4. Create lecture (2hr) and seminar (2hr) sessions
    5. Allocate rooms based on group capacity
    """

    # Verify semester exists
    semester = db.query(Semester).filter(Semester.sem_id == semester_id).first()
    if not semester:
        raise HTTPException(status_code=404, detail="Semester not found")

    # Get all active course curriculum entries for this semester
    curriculum_entries = db.query(CourseCurriculum).filter(
        and_(
            CourseCurriculum.is_active == True,
            CourseCurriculum.semester_number == semester.sem_id,
        )
    ).all()

    if not curriculum_entries:
        raise HTTPException(
            status_code=404, detail="No active courses found for this semester"
        )

    # Get session types
    lecture_type = db.query(SessionTypeModel).filter(
        SessionTypeModel.type_name == SessionType.Lecture
    ).first()
    seminar_type = db.query(SessionTypeModel).filter(
        SessionTypeModel.type_name == SessionType.Seminar
    ).first()

    if not lecture_type or not seminar_type:
        raise HTTPException(
            status_code=500, detail="Session types not properly configured"
        )

    schedule_details = []
    created_offerings = []

    try:
        for curriculum in curriculum_entries:
            course = db.query(Course).filter(Course.c_id == curriculum.c_id).first()
            if not course:
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
                # Create course offering for this group
                existing_offering = db.query(CourseOffering).filter(
                    and_(
                        CourseOffering.c_id == course.c_id,
                        CourseOffering.sem_id == semester_id,
                        CourseOffering.group_id == group.group_id,
                    )
                ).first()

                if existing_offering:
                    offering = existing_offering
                else:
                    offering = CourseOffering(
                        c_id=course.c_id,
                        sem_id=semester_id,
                        max_students=group.capacity,
                        group_id=group.group_id,
                        hrs_per_week=4,  # 2 lecture + 2 seminar
                    )
                    db.add(offering)
                    db.flush()
                    created_offerings.append(offering)

                # Assign professors to offering
                professors = db.query(Prof).all()
                if professors:
                    assigned_prof = professors[0]  # Simple assignment; can be improved
                    
                    # Check if professor already assigned
                    existing_assignment = db.query(OfferingProfessors).filter(
                        and_(
                            OfferingProfessors.offering_id == offering.offering_id,
                            OfferingProfessors.u_id == assigned_prof.u_id,
                        )
                    ).first()

                    if not existing_assignment:
                        offering_prof = OfferingProfessors(
                            offering_id=offering.offering_id,
                            u_id=assigned_prof.u_id,
                        )
                        db.add(offering_prof)
                        db.flush()

                    # Create lecture sessions (2 hours)
                    for day in [DayOfWeek.Monday, DayOfWeek.Wednesday, DayOfWeek.Friday]:
                        available_slots = get_available_slots(
                            db, assigned_prof.u_id, day, 2
                        )

                        if available_slots:
                            slot_id = available_slots[0]
                            room_id = get_suitable_room(db, group.capacity)

                            if room_id:
                                lecture_schedule = OfferingSchedule(
                                    offering_id=offering.offering_id,
                                    room_id=room_id,
                                    slot_id=slot_id,
                                    session_type_id=lecture_type.session_type_id,
                                    s_status="scheduled",
                                    createdAt=datetime.now(),
                                    updatedAt=datetime.now(),
                                )
                                db.add(lecture_schedule)
                                db.flush()
                                schedule_details.append(
                                    {
                                        "offering_id": offering.offering_id,
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
                            db, assigned_prof.u_id, day, 2
                        )

                        if available_slots:
                            slot_id = available_slots[0]
                            room_id = get_suitable_room(db, group.capacity)

                            if room_id:
                                seminar_schedule = OfferingSchedule(
                                    offering_id=offering.offering_id,
                                    room_id=room_id,
                                    slot_id=slot_id,
                                    session_type_id=seminar_type.session_type_id,
                                    s_status="scheduled",
                                    createdAt=datetime.now(),
                                    updatedAt=datetime.now(),
                                )
                                db.add(seminar_schedule)
                                db.flush()
                                schedule_details.append(
                                    {
                                        "offering_id": offering.offering_id,
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

        return {
            "status": "success",
            "semester_id": semester_id,
            "semester_name": semester.sem_name,
            "offerings_created": len(created_offerings),
            "schedule_details": schedule_details,
            "message": f"Successfully generated schedule with {len(created_offerings)} offerings",
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error generating schedule: {str(e)}")


@router.get("/auto-schedule/validate/{semester_id}")
def validate_schedule(semester_id: int, db: Session = Depends(get_db)):
    """
    Validate the current schedule for a semester.
    Checks for conflicts and ensures all requirements are met.
    """
    semester = db.query(Semester).filter(Semester.sem_id == semester_id).first()
    if not semester:
        raise HTTPException(status_code=404, detail="Semester not found")

    issues = []
    warnings = []

    offerings = db.query(CourseOffering).filter(
        CourseOffering.sem_id == semester_id
    ).all()

    for offering in offerings:
        schedules = db.query(OfferingSchedule).filter(
            OfferingSchedule.offering_id == offering.offering_id
        ).all()

        # Check if each offering has both lecture and seminar
        session_types = [s.session_type_id for s in schedules]
        if len(set(session_types)) < 2:
            warnings.append(
                f"Offering {offering.offering_id} missing lecture or seminar"
            )

        # Check for room conflicts
        for schedule in schedules:
            conflicts = db.query(OfferingSchedule).filter(
                and_(
                    OfferingSchedule.room_id == schedule.room_id,
                    OfferingSchedule.slot_id == schedule.slot_id,
                    OfferingSchedule.offering_id != offering.offering_id,
                    OfferingSchedule.s_status != "cancelled",
                )
            ).all()

            if conflicts:
                issues.append(
                    f"Room conflict in {schedule.room_id} at slot {schedule.slot_id}"
                )

    return {
        "semester_id": semester_id,
        "semester_name": semester.sem_name,
        "total_offerings": len(offerings),
        "issues": issues,
        "warnings": warnings,
        "is_valid": len(issues) == 0,
    }


@router.delete("/auto-schedule/clear/{semester_id}")
def clear_schedule(semester_id: int, db: Session = Depends(get_db)):
    """Clear all scheduled sessions for a given semester."""
    semester = db.query(Semester).filter(Semester.sem_id == semester_id).first()
    if not semester:
        raise HTTPException(status_code=404, detail="Semester not found")

    # Delete all offering schedules for this semester
    schedules = db.query(OfferingSchedule).join(CourseOffering).filter(
        CourseOffering.sem_id == semester_id
    ).delete()

    db.commit()

    return {
        "status": "success",
        "message": f"Cleared {schedules} schedule entries for semester {semester.sem_name}",
    }
