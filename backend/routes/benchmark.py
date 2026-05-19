"""
Benchmark-only endpoints — NOT for production use.
Provides a fast full-reset to clear all variable data between benchmark runs,
leaving static infrastructure (rooms, time slots, session types, faculty, degrees) intact.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db

router = APIRouter(prefix="/benchmark", tags=["benchmark"])


@router.post("/reset")
def benchmark_reset(db: Session = Depends(get_db)):
    """
    Delete all variable data (schedules, courses, professors, groups) in dependency order.
    Keeps rooms, time_slots, session_types, faculty, and degrees.
    """
    db.execute(text("DELETE FROM course_session"))
    db.execute(text("DELETE FROM course_schedule"))
    db.execute(text("DELETE FROM course_curriculum"))
    db.execute(text("DELETE FROM professor_course"))
    db.execute(text("DELETE FROM course"))
    db.execute(text("DELETE FROM student_group_availability"))
    db.execute(text("DELETE FROM student_group"))
    db.execute(text("DELETE FROM prof"))
    db.execute(text('DELETE FROM "user" WHERE u_role = \'professor\''))
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
