from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_
from database import get_db
from models import CourseSchedule as DBCourseSchedule, Course, StudentGroup, User, CourseSession, TimeSlots, SessionTypeModel
from schemas import CourseSchedule, CourseScheduleCreate
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from utils import validate_pagination


class CourseSessionUpdate(BaseModel):
    slot_id: int
    room_id: str

router = APIRouter()


def _format_sessions(sessions: list, db: Session) -> list:
    """Shared helper: convert CourseSession rows into the standard display dict."""
    result = []
    for session in sessions:
        slot = db.query(TimeSlots).filter(TimeSlots.slot_id == session.slot_id).first()
        stype = db.query(SessionTypeModel).filter(
            SessionTypeModel.session_type_id == session.session_type_id
        ).first()
        result.append({
            "session_id": session.session_id,
            "slot_id": session.slot_id,
            "type": stype.type_name.value if stype else "Unknown",
            "day": slot.day_of_week.value if slot else "N/A",
            "time": f"{slot.start_time.strftime('%H:%M')}-{slot.end_time.strftime('%H:%M')}" if slot else "N/A",
            "room": session.room_id,
            "status": session.s_status,
        })
    return result


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

        formatted_schedules.append({
            "schedule_id": schedule.schedule_id,
            "course": course.c_name if course else "Unknown Course",
            "course_abbr": course.c_abbr if course else "N/A",
            "professor": f"{prof.fname} {prof.lname}" if prof else "N/A",
            "status": schedule.s_status,
            "sessions": _format_sessions(sessions, db),
        })

    return {
        "group_id": group_id,
        "schedules": formatted_schedules
    }

@router.put("/course-sessions/{session_id}")
def update_course_session(session_id: int, payload: CourseSessionUpdate, db: Session = Depends(get_db)):
    """Move a session to a different time slot and/or room, with conflict checking."""
    session = db.query(CourseSession).filter(CourseSession.session_id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    schedule = db.query(DBCourseSchedule).filter(
        DBCourseSchedule.schedule_id == session.schedule_id
    ).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Parent schedule not found")

    slot = db.query(TimeSlots).filter(TimeSlots.slot_id == payload.slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Time slot not found")

    room = db.query(Rooms).filter(Rooms.room_id == payload.room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    conflicts = []

    room_conflict = db.query(CourseSession).filter(
        CourseSession.room_id == payload.room_id,
        CourseSession.slot_id == payload.slot_id,
        CourseSession.session_id != session_id,
        CourseSession.s_status != "cancelled",
    ).first()
    if room_conflict:
        conflicts.append(f"Room {payload.room_id} is already booked at that time")

    prof_conflict = db.query(CourseSession).join(
        DBCourseSchedule, CourseSession.schedule_id == DBCourseSchedule.schedule_id
    ).filter(
        DBCourseSchedule.u_id == schedule.u_id,
        CourseSession.slot_id == payload.slot_id,
        CourseSession.session_id != session_id,
        CourseSession.s_status != "cancelled",
    ).first()
    if prof_conflict:
        conflicts.append("Professor is already teaching at that time")

    group_conflict = db.query(CourseSession).join(
        DBCourseSchedule, CourseSession.schedule_id == DBCourseSchedule.schedule_id
    ).filter(
        DBCourseSchedule.group_id == schedule.group_id,
        CourseSession.slot_id == payload.slot_id,
        CourseSession.session_id != session_id,
        CourseSession.s_status != "cancelled",
    ).first()
    if group_conflict:
        conflicts.append("This group already has a session at that time")

    if conflicts:
        raise HTTPException(status_code=409, detail="; ".join(conflicts))

    session.slot_id = payload.slot_id
    session.room_id = payload.room_id
    session.updatedAt = datetime.now()
    db.commit()
    db.refresh(session)

    stype = db.query(SessionTypeModel).filter(
        SessionTypeModel.session_type_id == session.session_type_id
    ).first()

    return {
        "session_id": session.session_id,
        "slot_id": session.slot_id,
        "type": stype.type_name.value if stype else "Unknown",
        "day": slot.day_of_week.value,
        "time": f"{slot.start_time.strftime('%H:%M')}-{slot.end_time.strftime('%H:%M')}",
        "room": session.room_id,
        "status": session.s_status,
    }


@router.get("/course-schedules/professor/{u_id}")
def get_schedules_by_professor(u_id: int, db: Session = Depends(get_db)):
    """Get all course schedules for a specific professor, with sessions nested."""
    schedules = db.query(DBCourseSchedule).filter(
        DBCourseSchedule.u_id == u_id
    ).all()

    formatted_schedules = []
    for schedule in schedules:
        course = db.query(Course).filter(Course.c_id == schedule.c_id).first()
        group = db.query(StudentGroup).filter(StudentGroup.group_id == schedule.group_id).first()

        sessions = db.query(CourseSession).filter(
            CourseSession.schedule_id == schedule.schedule_id
        ).all()

        formatted_schedules.append({
            "schedule_id": schedule.schedule_id,
            "course": course.c_name if course else "Unknown Course",
            "course_abbr": course.c_abbr if course else "N/A",
            "group": group.group_name if group else "Unknown Group",
            "status": schedule.s_status,
            "sessions": _format_sessions(sessions, db),
        })

    return {
        "professor_id": u_id,
        "schedules": formatted_schedules
    }

