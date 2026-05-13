from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from database import get_db
from models import Course as DBCourse, CourseCurriculum
from schemas import CourseCreate, CourseUpdate, Course
from typing import List
from utils import validate_pagination
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

def create_curriculum_entries(db: Session, course_id: int, degree_ids: List[int], year_level: int, semester_number: int, is_active: bool):
    """Create CourseCurriculum entries for multiple degrees"""
    for degree_id in degree_ids:
        curriculum = CourseCurriculum(
            c_id=course_id,
            degree_id=degree_id,
            year_level=year_level,
            semester_number=semester_number,
            is_active=is_active,
            createdAt=datetime.utcnow()
        )
        db.add(curriculum)

@router.post("/courses/", response_model=Course)
def create_course(course: CourseCreate, db: Session = Depends(get_db)):
    logger.info(f"Creating course: {course.c_abbr}")
    # Filter out degree_ids from dict to avoid validation errors
    course_data = course.dict(exclude={"degree_ids"})
    db_course = DBCourse(**course_data)
    db.add(db_course)
    db.commit()
    db.flush()  # Get the c_id

    # Create CourseCurriculum entries
    degree_ids = course.degree_ids or (([course.degree_id] if course.degree_id else []))

    if degree_ids:
        create_curriculum_entries(
            db,
            db_course.c_id,
            degree_ids,
            course.c_year,
            course.c_semester,
            course.is_active
        )
        db.commit()

    db.refresh(db_course)
    logger.info(f"Course created successfully: {db_course.c_id}")
    return db_course

@router.post("/courses/bulk", response_model=List[Course])
def create_courses_bulk(courses: List[CourseCreate], db: Session = Depends(get_db)):
    try:
        result = []
        for course in courses:
            course_data = course.dict(exclude={"degree_ids"})
            db_course = DBCourse(**course_data)
            db.add(db_course)
            db.flush()  # Flush to get the c_id

            # Create CourseCurriculum entries for multiple degrees
            degree_ids = course.degree_ids or (([course.degree_id] if course.degree_id else []))
            if degree_ids:
                create_curriculum_entries(
                    db,
                    db_course.c_id,
                    degree_ids,
                    course.c_year,
                    course.c_semester,
                    course.is_active
                )

            result.append(db_course)

        db.commit()
        # Refresh all to ensure we have the latest data
        for item in result:
            db.refresh(item)
        return result
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Bulk create failed: {str(e)}")

@router.get("/courses/", response_model=List[Course])
def read_courses(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    skip, limit = validate_pagination(skip, limit)
    courses = db.query(DBCourse).options(
        joinedload(DBCourse.degree),
        joinedload(DBCourse.course_curricula).joinedload(CourseCurriculum.degree)
    ).offset(skip).limit(limit).all()
    
    # Manually set degrees from course_curricula
    for course in courses:
        if course.course_curricula:
            course.degrees = [cc.degree for cc in course.course_curricula if cc.degree]
    
    return courses

@router.get("/courses/{course_id}", response_model=Course)
def read_course(course_id: int, db: Session = Depends(get_db)):
    db_course = db.query(DBCourse).options(
        joinedload(DBCourse.degree),
        joinedload(DBCourse.course_curricula).joinedload(CourseCurriculum.degree)
    ).filter(DBCourse.c_id == course_id).first()
    
    if db_course is None:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Set degrees from course_curricula
    if db_course.course_curricula:
        db_course.degrees = [cc.degree for cc in db_course.course_curricula if cc.degree]
    
    return db_course

@router.put("/courses/{course_id}", response_model=Course)
def update_course(course_id: int, course: CourseUpdate, db: Session = Depends(get_db)):
    db_course = db.query(DBCourse).options(
        joinedload(DBCourse.degree),
        joinedload(DBCourse.course_curricula).joinedload(CourseCurriculum.degree)
    ).filter(DBCourse.c_id == course_id).first()

    if db_course is None:
        raise HTTPException(status_code=404, detail="Course not found")

    # Handle degree_ids separately
    update_data = course.dict(exclude_none=True, exclude={"degree_ids"})

    # Handle multiple degrees if provided
    if course.degree_ids is not None:
        # Delete existing curriculum entries
        db.query(CourseCurriculum).filter(CourseCurriculum.c_id == course_id).delete()

        # Create new curriculum entries
        if course.degree_ids:
            semester_number = update_data.get('c_semester', db_course.c_semester)
            year_level = update_data.get('c_year', db_course.c_year)
            is_active = update_data.get('is_active', db_course.is_active)

            if semester_number and year_level:
                create_curriculum_entries(
                    db,
                    course_id,
                    course.degree_ids,
                    year_level,
                    semester_number,
                    is_active
                )

    for key, value in update_data.items():
        setattr(db_course, key, value)

    db.commit()
    db.refresh(db_course)

    # Reload relationships
    db_course = db.query(DBCourse).options(
        joinedload(DBCourse.degree),
        joinedload(DBCourse.course_curricula).joinedload(CourseCurriculum.degree)
    ).filter(DBCourse.c_id == course_id).first()

    # Set degrees from course_curricula
    if db_course.course_curricula:
        db_course.degrees = [cc.degree for cc in db_course.course_curricula if cc.degree]

    return db_course

@router.patch("/courses/{course_id}/toggle-active", response_model=Course)
def toggle_course_active(course_id: int, db: Session = Depends(get_db)):
    db_course = db.query(DBCourse).options(
        joinedload(DBCourse.degree),
        joinedload(DBCourse.course_curricula).joinedload(CourseCurriculum.degree)
    ).filter(DBCourse.c_id == course_id).first()
    
    if db_course is None:
        raise HTTPException(status_code=404, detail="Course not found")
    
    db_course.is_active = not db_course.is_active
    db.commit()
    db.refresh(db_course)
    
    # Set degrees from course_curricula
    if db_course.course_curricula:
        db_course.degrees = [cc.degree for cc in db_course.course_curricula if cc.degree]
    
    return db_course

@router.delete("/courses/{course_id}")
def delete_course(course_id: int, db: Session = Depends(get_db)):
    logger.info(f"Attempting to delete course: {course_id}")
    db_course = db.query(DBCourse).filter(DBCourse.c_id == course_id).first()
    if db_course is None:
        logger.warning(f"Course not found for deletion: {course_id}")
        raise HTTPException(status_code=404, detail="Course not found")

    try:
        # Delete related records first
        from models import (
            CourseCurriculum, CourseSchedule, CourseSession
        )

        # Delete course curriculum entries
        curricula = db.query(CourseCurriculum).filter(CourseCurriculum.c_id == course_id).all()
        if curricula:
            logger.info(f"Deleting {len(curricula)} curriculum records for course: {course_id}")
            for curriculum in curricula:
                db.delete(curriculum)

        # Delete course schedules and their related records
        schedules = db.query(CourseSchedule).filter(CourseSchedule.c_id == course_id).all()
        if schedules:
            logger.info(f"Deleting {len(schedules)} course schedules for course: {course_id}")
            for schedule in schedules:
                # Delete sessions for this schedule
                sessions = db.query(CourseSession).filter(
                    CourseSession.schedule_id == schedule.schedule_id
                ).all()
                if sessions:
                    logger.info(f"Deleting {len(sessions)} session records for schedule: {schedule.schedule_id}")
                    for session in sessions:
                        db.delete(session)
                db.delete(schedule)

        # Delete the course record
        db.delete(db_course)
        db.commit()
        logger.info(f"Course deleted successfully: {course_id}")
        return {"message": "Course deleted"}
    except Exception as e:
        logger.error(f"Error deleting course {course_id}: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete course: {str(e)}")