from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from sqlalchemy import and_
from database import get_db
from models import CourseOffering as DBCourseOffering, Course, Semester, StudentGroup
from schemas import CourseOffering, CourseOfferingCreate
from typing import List
from utils import validate_pagination
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/course-offerings/", response_model=CourseOffering)
def create_course_offering(item: CourseOfferingCreate, db: Session = Depends(get_db)):
    db_item = DBCourseOffering(**item.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.post("/course-offerings/bulk", response_model=List[CourseOffering])
def create_course_offerings_bulk(items: List[CourseOfferingCreate], db: Session = Depends(get_db)):
    try:
        result = []
        for item in items:
            db_item = DBCourseOffering(**item.dict())
            db.add(db_item)
            result.append(db_item)
        db.commit()
        for item in result:
            db.refresh(item)
        return result
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Bulk create failed: {str(e)}")

@router.get("/course-offerings/", response_model=List[CourseOffering])
def read_course_offerings(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    skip, limit = validate_pagination(skip, limit)
    return db.query(DBCourseOffering).offset(skip).limit(limit).all()


@router.get("/course-offerings/semester/{semester_id}")
def get_offerings_by_semester(semester_id: int, db: Session = Depends(get_db)):
    """Get all course offerings for a specific semester."""
    semester = db.query(Semester).filter(Semester.sem_id == semester_id).first()
    if semester is None:
        raise HTTPException(status_code=404, detail="Semester not found")

    offerings = db.query(DBCourseOffering).filter(
        DBCourseOffering.sem_id == semester_id
    ).all()

    # Format offerings with course and group information
    formatted_offerings = []
    for offering in offerings:
        course = db.query(Course).filter(Course.c_id == offering.c_id).first()
        group = db.query(StudentGroup).filter(StudentGroup.group_id == offering.group_id).first()

        formatted_offerings.append({
            "offering_id": offering.offering_id,
            "course": course.c_name if course else "Unknown Course",
            "course_abbr": course.c_abbr if course else "N/A",
            "group": group.group_name if group else "Unknown Group",
            "year_level": course.c_year if course else 0
        })

    return {
        "semester": {
            "sem_id": semester.sem_id,
            "sem_name": semester.sem_name,
            "start_date": semester.start_date.isoformat(),
            "end_date": semester.end_date.isoformat(),
        },
        "offerings": formatted_offerings
    }


@router.get("/course-offerings/available-courses/{semester_id}")
def get_available_courses_for_semester(semester_id: int, db: Session = Depends(get_db)):
    """
    Get courses that can be offered in a semester.
    Determines semester type (1=Fall, 2=Spring) based on semester name or date.
    Returns courses matching that semester number.
    """
    semester = db.query(Semester).filter(Semester.sem_id == semester_id).first()
    if semester is None:
        raise HTTPException(status_code=404, detail="Semester not found")

    # Determine semester number from semester name (e.g., "Fall 2024" -> 1, "Spring 2025" -> 2)
    sem_name_lower = semester.sem_name.lower()
    if "fall" in sem_name_lower or "autumn" in sem_name_lower:
        semester_number = 1
    elif "spring" in sem_name_lower:
        semester_number = 2
    else:
        # Default to checking month - if start date is in Aug-Dec, it's Fall (1), else Spring (2)
        month = semester.start_date.month
        semester_number = 1 if month >= 8 else 2

    # Get all active courses for this semester number
    courses = db.query(Course).filter(
        and_(
            Course.c_semester == semester_number,
            Course.is_active == True
        )
    ).all()

    # Get existing offerings for this semester to mark which are already offered
    existing_offerings = db.query(DBCourseOffering).filter(
        DBCourseOffering.sem_id == semester_id
    ).all()
    existing_course_ids = {o.c_id for o in existing_offerings}

    return {
        "semester": {
            "sem_id": semester.sem_id,
            "sem_name": semester.sem_name,
            "semester_number": semester_number,
        },
        "courses": [
            {
                "c_id": c.c_id,
                "c_name": c.c_name,
                "c_abbr": c.c_abbr,
                "c_year": c.c_year,
                "c_semester": c.c_semester,
                "is_offered": c.c_id in existing_course_ids,
            }
            for c in courses
        ]
    }


@router.post("/course-offerings/generate/{semester_id}")
def generate_offerings_for_semester(semester_id: int, request: dict = Body(...), db: Session = Depends(get_db)):
    """
    Generate course offerings for selected courses in a semester.
    Automatically creates offerings for all year levels (1, 2, 3) for each course.
    """
    print(f"Received request: semester_id={semester_id}, body={request}")

    course_ids = request.get("course_ids", [])
    if not course_ids:
        raise HTTPException(status_code=400, detail="course_ids is required")

    semester = db.query(Semester).filter(Semester.sem_id == semester_id).first()
    if semester is None:
        raise HTTPException(status_code=404, detail="Semester not found")

    created_offerings = []
    skipped_offerings = []

    for course_id in course_ids:
        course = db.query(Course).filter(Course.c_id == course_id).first()
        if course is None:
            skipped_offerings.append(f"Course {course_id} not found")
            continue

        # Get student groups matching the course's year level
        student_groups = db.query(StudentGroup).filter(
            StudentGroup.year_level == course.c_year
        ).all()

        for group in student_groups:
            # Check if offering already exists
            existing = db.query(DBCourseOffering).filter(
                and_(
                    DBCourseOffering.c_id == course_id,
                    DBCourseOffering.sem_id == semester_id,
                    DBCourseOffering.group_id == group.group_id
                )
            ).first()

            if existing:
                skipped_offerings.append(f"{course.c_abbr} for {group.group_name} already exists")
                continue

            # Create new offering
            offering = DBCourseOffering(
                c_id=course_id,
                sem_id=semester_id,
                max_students=group.capacity,
                group_id=group.group_id,
                hrs_per_week=4
            )
            db.add(offering)
            db.flush()
            created_offerings.append({
                "offering_id": offering.offering_id,
                "course": course.c_name,
                "course_abbr": course.c_abbr,
                "group": group.group_name,
                "year_level": course.c_year
            })

    db.commit()

    return {
        "status": "success",
        "semester": semester.sem_name,
        "created_count": len(created_offerings),
        "created_offerings": created_offerings,
        "skipped_count": len(skipped_offerings),
        "skipped_offerings": skipped_offerings
    }


@router.delete("/course-offerings/{offering_id}")
def delete_offering(offering_id: int, db: Session = Depends(get_db)):
    """Delete a specific course offering."""
    logger.info(f"Attempting to delete course offering: {offering_id}")
    offering = db.query(DBCourseOffering).filter(
        DBCourseOffering.offering_id == offering_id
    ).first()

    if offering is None:
        logger.warning(f"Course offering not found for deletion: {offering_id}")
        raise HTTPException(status_code=404, detail="Offering not found")

    try:
        # Delete related records first
        from models import OfferingSchedule, OfferingProfessors, Enrollment

        # Delete schedules for this offering
        schedules = db.query(OfferingSchedule).filter(
            OfferingSchedule.offering_id == offering_id
        ).all()
        if schedules:
            logger.info(f"Deleting {len(schedules)} schedule records for offering: {offering_id}")
            for schedule in schedules:
                db.delete(schedule)

        # Delete offering professors for this offering
        offering_profs = db.query(OfferingProfessors).filter(
            OfferingProfessors.offering_id == offering_id
        ).all()
        if offering_profs:
            logger.info(f"Deleting {len(offering_profs)} offering professor records for offering: {offering_id}")
            for offering_prof in offering_profs:
                db.delete(offering_prof)

        # Delete enrollments for this offering
        enrollments = db.query(Enrollment).filter(
            Enrollment.offering_id == offering_id
        ).all()
        if enrollments:
            logger.info(f"Deleting {len(enrollments)} enrollment records for offering: {offering_id}")
            for enrollment in enrollments:
                db.delete(enrollment)

        # Delete the offering
        db.delete(offering)
        db.commit()
        logger.info(f"Course offering deleted successfully: {offering_id}")
        return {"status": "success", "message": f"Offering {offering_id} deleted"}
    except Exception as e:
        logger.error(f"Error deleting course offering {offering_id}: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete offering: {str(e)}")
