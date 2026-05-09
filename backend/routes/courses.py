from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from database import get_db
from models import Course as DBCourse, CourseCurriculum
from schemas import CourseCreate, CourseUpdate, Course
from typing import List
from utils import validate_pagination

router = APIRouter()

@router.post("/courses/", response_model=Course)
def create_course(course: CourseCreate, db: Session = Depends(get_db)):
    db_course = DBCourse(**course.dict())
    db.add(db_course)
    db.commit()
    db.refresh(db_course)

    # Automatically create CourseCurriculum entry if degree_id and semester_id are provided
    if course.degree_id and course.semester_id:
        curriculum = CourseCurriculum(
            c_id=db_course.c_id,
            degree_id=course.degree_id,
            year_level=course.c_year,
            semester_number=course.semester_id,
            is_active=course.is_active
        )
        db.add(curriculum)
        db.commit()

    return db_course

@router.get("/courses/", response_model=List[Course])
def read_courses(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    skip, limit = validate_pagination(skip, limit)
    courses = db.query(DBCourse).options(joinedload(DBCourse.degree)).offset(skip).limit(limit).all()
    return courses

@router.get("/courses/{course_id}", response_model=Course)
def read_course(course_id: int, db: Session = Depends(get_db)):
    db_course = db.query(DBCourse).options(joinedload(DBCourse.degree)).filter(DBCourse.c_id == course_id).first()
    if db_course is None:
        raise HTTPException(status_code=404, detail="Course not found")
    return db_course

@router.put("/courses/{course_id}", response_model=Course)
def update_course(course_id: int, course: CourseUpdate, db: Session = Depends(get_db)):
    db_course = db.query(DBCourse).options(joinedload(DBCourse.degree)).filter(DBCourse.c_id == course_id).first()
    if db_course is None:
        raise HTTPException(status_code=404, detail="Course not found")
    update_data = course.dict(exclude_none=True)
    for key, value in update_data.items():
        setattr(db_course, key, value)
    db.commit()
    db.refresh(db_course)
    return db_course

@router.patch("/courses/{course_id}/toggle-active", response_model=Course)
def toggle_course_active(course_id: int, db: Session = Depends(get_db)):
    db_course = db.query(DBCourse).options(joinedload(DBCourse.degree)).filter(DBCourse.c_id == course_id).first()
    if db_course is None:
        raise HTTPException(status_code=404, detail="Course not found")
    db_course.is_active = not db_course.is_active
    db.commit()
    db.refresh(db_course)
    return db_course

@router.delete("/courses/{course_id}")
def delete_course(course_id: int, db: Session = Depends(get_db)):
    db_course = db.query(DBCourse).filter(DBCourse.c_id == course_id).first()
    if db_course is None:
        raise HTTPException(status_code=404, detail="Course not found")
    db.delete(db_course)
    db.commit()
    return {"message": "Course deleted"}