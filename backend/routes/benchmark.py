"""
Benchmark-only endpoints — NOT for production use.
Provides a fast full-reset to clear all variable data between benchmark runs,
leaving static infrastructure (rooms, time slots, session types, faculty, degrees) intact.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime
from database import get_db
from models import User as DBUser, Student as DBStudent, UserRole

router = APIRouter(prefix="/benchmark", tags=["benchmark"])


@router.post("/reset")
def benchmark_reset(db: Session = Depends(get_db)):
    """
    Delete all variable data (schedules, courses, professors, groups, students)
    in dependency order. Keeps rooms, time_slots, session_types, faculty, and degrees.
    """
    db.execute(text("DELETE FROM course_session"))
    db.execute(text("DELETE FROM course_schedule"))
    db.execute(text("DELETE FROM course_curriculum"))
    db.execute(text("DELETE FROM professor_course"))
    db.execute(text("DELETE FROM course"))
    db.execute(text("DELETE FROM student_group_availability"))
    db.execute(text("DELETE FROM student"))
    db.execute(text("DELETE FROM student_group"))
    db.execute(text("DELETE FROM prof"))
    db.execute(text("DELETE FROM \"user\" WHERE u_role IN ('professor', 'student')"))
    db.execute(text("DELETE FROM degree"))
    db.commit()
    return {"status": "ok", "message": "Variable data cleared"}


@router.post("/reset-schedules")
def benchmark_reset_schedules(db: Session = Depends(get_db)):
    """Clear only schedule data — courses/professors/groups remain. Used between mode runs."""
    db.execute(text("DELETE FROM course_session"))
    db.execute(text("DELETE FROM course_schedule"))
    db.commit()
    return {"status": "ok", "message": "Schedules cleared"}


@router.post("/seed-students")
def benchmark_seed_students(items: list, db: Session = Depends(get_db)):
    """
    Bulk-create user+student pairs for benchmarking without bcrypt overhead.
    Benchmark accounts are never used for authentication.

    Payload: list of {fname, lname, email, username, group_id}
    Returns: {created: N}
    """
    now = datetime.utcnow()
    DUMMY_PW = "benchmark_no_auth"
    for item in items:
        user = DBUser(
            fname=item["fname"],
            lname=item["lname"],
            email=item["email"],
            username=item["username"],
            password=DUMMY_PW,
            u_role=UserRole.student,
            createdAt=now,
            updatedAt=now,
        )
        db.add(user)
        db.flush()
        db.add(DBStudent(u_id=user.u_id, s_status="active", group_id=item["group_id"]))
    db.commit()
    return {"created": len(items)}
