from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import (
    Student,
    Course,
    CourseSession,
    CourseSchedule,
    User,
)

router = APIRouter()


@router.get("/dashboard/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    """
    Get dashboard statistics including:
    - Total Students
    - Active Courses
    - Scheduled Classes
    - Completion Rate (enrolled students / total capacity)
    """
    # Total Students
    total_students = db.query(Student).count()

    # Active Courses
    active_courses = db.query(Course).filter(Course.is_active == True).count()

    # Scheduled Classes (non-cancelled sessions)
    scheduled_classes = db.query(CourseSession).filter(
        CourseSession.s_status != "cancelled"
    ).count()

    # Completion Rate calculation
    # Get total capacity from all student groups
    from models import StudentGroup
    total_capacity = db.query(func.sum(StudentGroup.capacity)).scalar() or 0

    # Get total students enrolled in groups
    total_enrolled = db.query(Student).filter(Student.group_id.isnot(None)).count()

    # Calculate completion rate
    completion_rate = 0
    if total_capacity > 0:
        completion_rate = round((total_enrolled / total_capacity) * 100)

    return {
        "total_students": total_students,
        "active_courses": active_courses,
        "scheduled_classes": scheduled_classes,
        "completion_rate": completion_rate,
    }
