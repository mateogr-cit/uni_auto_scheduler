from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_
from database import get_db
from models import CourseSchedule as DBCourseSchedule, Course, StudentGroup, User, Prof, CourseSession, Rooms, TimeSlots, SessionTypeModel
from schemas import CourseSchedule, CourseScheduleCreate
from typing import List
from datetime import datetime
from utils import validate_pagination

router = APIRouter()

@router.post("/course-schedules/", response_model=CourseSchedule)
def create_course_schedule(item: CourseScheduleCreate, db: Session = Depends(get_db)):
    db_item = DBCourseSchedule(**item.dict(), createdAt=datetime.utcnow(), updatedAt=datetime.utcnow())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.post("/course-schedules/bulk", response_model=List[CourseSchedule])
def create_course_schedules_bulk(items: List[CourseScheduleCreate], db: Session = Depends(get_db)):
    try:
        result = []
        for item in items:
            db_item = DBCourseSchedule(**item.dict(), createdAt=datetime.utcnow(), updatedAt=datetime.utcnow())
            db.add(db_item)
            result.append(db_item)
        db.commit()
        for item in result:
            db.refresh(item)
        return result
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Bulk create failed: {str(e)}")

@router.get("/course-schedules/", response_model=List[CourseSchedule])
def read_course_schedules(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    skip, limit = validate_pagination(skip, limit)
    return db.query(DBCourseSchedule).offset(skip).limit(limit).all()

@router.get("/course-schedules/{schedule_id}", response_model=CourseSchedule)
def read_course_schedule(schedule_id: int, db: Session = Depends(get_db)):
    db_item = db.query(DBCourseSchedule).filter(DBCourseSchedule.schedule_id == schedule_id).first()
    if db_item is None:
        raise HTTPException(status_code=404, detail="Course schedule not found")
    return db_item

@router.put("/course-schedules/{schedule_id}", response_model=CourseSchedule)
def update_course_schedule(schedule_id: int, item: CourseScheduleCreate, db: Session = Depends(get_db)):
    db_item = db.query(DBCourseSchedule).filter(DBCourseSchedule.schedule_id == schedule_id).first()
    if db_item is None:
        raise HTTPException(status_code=404, detail="Course schedule not found")
    for key, value in item.dict().items():
        setattr(db_item, key, value)
    db_item.updatedAt = datetime.utcnow()
    db.commit()
    db.refresh(db_item)
    return db_item

@router.delete("/course-schedules/{schedule_id}")
def delete_course_schedule(schedule_id: int, db: Session = Depends(get_db)):
    db_item = db.query(DBCourseSchedule).filter(DBCourseSchedule.schedule_id == schedule_id).first()
    if db_item is None:
        raise HTTPException(status_code=404, detail="Course schedule not found")
    db.delete(db_item)
    db.commit()
    return {"message": "Course schedule deleted"}

@router.get("/course-schedules/group/{group_id}")
def get_schedules_by_group(group_id: int, db: Session = Depends(get_db)):
    """Get all course schedules for a specific student group, with sessions nested."""
    schedules = db.query(DBCourseSchedule).filter(
        DBCourseSchedule.group_id == group_id
    ).all()

    formatted_schedules = []
    for schedule in schedules:
        course = db.query(Course).filter(Course.c_id == schedule.c_id).first()
        prof = db.query(User).filter(User.u_id == schedule.u_id).first()

        sessions = db.query(CourseSession).filter(
            CourseSession.schedule_id == schedule.schedule_id
        ).all()

        formatted_sessions = []
        for session in sessions:
            slot = db.query(TimeSlots).filter(TimeSlots.slot_id == session.slot_id).first()
            stype = db.query(SessionTypeModel).filter(
                SessionTypeModel.session_type_id == session.session_type_id
            ).first()
            formatted_sessions.append({
                "session_id": session.session_id,
                "type": stype.type_name.value if stype else "Unknown",
                "day": slot.day_of_week.value if slot else "N/A",
                "time": f"{slot.start_time.strftime('%H:%M')}-{slot.end_time.strftime('%H:%M')}" if slot else "N/A",
                "room": session.room_id,
                "status": session.s_status,
            })

        formatted_schedules.append({
            "schedule_id": schedule.schedule_id,
            "course": course.c_name if course else "Unknown Course",
            "course_abbr": course.c_abbr if course else "N/A",
            "professor": f"{prof.fname} {prof.lname}" if prof else "N/A",
            "status": schedule.s_status,
            "sessions": formatted_sessions,
        })

    return {
        "group_id": group_id,
        "schedules": formatted_schedules
    }

@router.get("/course-schedules/professor/{u_id}")
def get_schedules_by_professor(u_id: int, db: Session = Depends(get_db)):
    """Get all course schedules for a specific professor."""
    schedules = db.query(DBCourseSchedule).filter(
        DBCourseSchedule.u_id == u_id
    ).all()

    formatted_schedules = []
    for schedule in schedules:
        course = db.query(Course).filter(Course.c_id == schedule.c_id).first()
        group = db.query(StudentGroup).filter(StudentGroup.group_id == schedule.group_id).first()
        room = db.query(Rooms).filter(Rooms.room_id == schedule.room_id).first()
        slot = db.query(TimeSlots).filter(TimeSlots.slot_id == schedule.slot_id).first()

        formatted_schedules.append({
            "schedule_id": schedule.schedule_id,
            "course": course.c_name if course else "Unknown Course",
            "course_abbr": course.c_abbr if course else "N/A",
            "group": group.group_name if group else "Unknown Group",
            "room": schedule.room_id,
            "day": slot.day_of_week.value if slot else "N/A",
            "time": f"{slot.start_time.strftime('%H:%M')}-{slot.end_time.strftime('%H:%M')}" if slot else "N/A",
            "status": schedule.s_status
        })

    return {
        "professor_id": u_id,
        "schedules": formatted_schedules
    }

@router.post("/course-schedules/auto-generate")
def auto_generate_schedules(db: Session = Depends(get_db)):
    """
    Automatically generate course schedules based on course curriculum.
    Creates schedules for all active courses in the curriculum.
    """
    from models import CourseCurriculum, Rooms, TimeSlots, SessionTypeModel, SessionType

    # Get all active course curriculum entries
    curriculum_entries = db.query(CourseCurriculum).filter(
        CourseCurriculum.is_active == True
    ).all()

    if not curriculum_entries:
        raise HTTPException(status_code=404, detail="No active courses found in curriculum")

    created_schedules = []
    skipped_schedules = []

    for curriculum in curriculum_entries:
        course = db.query(Course).filter(Course.c_id == curriculum.c_id).first()
        if not course:
            skipped_schedules.append(f"Course {curriculum.c_id} not found")
            continue

        # Get student groups matching year level and degree
        student_groups = db.query(StudentGroup).filter(
            and_(
                StudentGroup.deg_id == curriculum.degree_id,
                StudentGroup.year_level == curriculum.year_level,
                StudentGroup.semester_number == curriculum.semester_number
            )
        ).all()

        for group in student_groups:
            # Check if schedule already exists
            existing = db.query(DBCourseSchedule).filter(
                and_(
                    DBCourseSchedule.c_id == course.c_id,
                    DBCourseSchedule.group_id == group.group_id
                )
            ).first()

            if existing:
                skipped_schedules.append(f"{course.c_abbr} for {group.group_name} already exists")
                continue

            # Get a professor for this course
            prof = db.query(Prof).join(User).filter(
                Prof.courses.any(Course.c_id == course.c_id)
            ).first()

            if not prof:
                skipped_schedules.append(f"No professor found for {course.c_abbr}")
                continue

            # Get a suitable room
            room = db.query(Rooms).filter(
                Rooms.capacity >= group.capacity
            ).first()

            if not room:
                skipped_schedules.append(f"No suitable room for {group.group_name}")
                continue

            # Get a time slot
            slot = db.query(TimeSlots).first()

            if not slot:
                skipped_schedules.append(f"No time slots available")
                continue

            # Get session type
            session_type = db.query(SessionTypeModel).filter(
                SessionTypeModel.type_name == SessionType.Lecture
            ).first()

            if not session_type:
                skipped_schedules.append(f"No session types configured")
                continue

            # Create schedule
            schedule = DBCourseSchedule(
                c_id=course.c_id,
                group_id=group.group_id,
                room_id=room.room_id,
                slot_id=slot.slot_id,
                session_type_id=session_type.session_type_id,
                u_id=prof.u_id,
                s_status="scheduled",
                createdAt=datetime.utcnow(),
                updatedAt=datetime.utcnow()
            )
            db.add(schedule)
            db.flush()
            created_schedules.append({
                "schedule_id": schedule.schedule_id,
                "course": course.c_name,
                "course_abbr": course.c_abbr,
                "group": group.group_name,
                "professor": f"{prof.user.fname} {prof.user.lname}",
                "room": room.room_id
            })

    db.commit()

    return {
        "status": "success",
        "created_count": len(created_schedules),
        "created_schedules": created_schedules,
        "skipped_count": len(skipped_schedules),
        "skipped_schedules": skipped_schedules
    }
