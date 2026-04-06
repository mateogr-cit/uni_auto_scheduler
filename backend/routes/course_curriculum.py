from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from database import get_db
from models import CourseCurriculum as DBCourseCurriculum
from schemas import CourseCurriculumCreate, CourseCurriculum
from typing import List

router = APIRouter()

@router.post("/course-curriculum/", response_model=CourseCurriculum)
def create_course_curriculum(item: CourseCurriculumCreate, db: Session = Depends(get_db)):
    db_item = DBCourseCurriculum(**item.dict(), createdAt=datetime.utcnow())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.get("/course-curriculum/", response_model=List[CourseCurriculum])
def read_course_curriculum(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(DBCourseCurriculum).offset(skip).limit(limit).all()

@router.get("/course-curriculum/{course_year_id}", response_model=CourseCurriculum)
def read_course_curriculum_item(course_year_id: int, db: Session = Depends(get_db)):
    db_item = db.query(DBCourseCurriculum).filter(DBCourseCurriculum.course_year_id == course_year_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Course curriculum item not found")
    return db_item

@router.put("/course-curriculum/{course_year_id}", response_model=CourseCurriculum)
def update_course_curriculum(course_year_id: int, item: CourseCurriculumCreate, db: Session = Depends(get_db)):
    db_item = db.query(DBCourseCurriculum).filter(DBCourseCurriculum.course_year_id == course_year_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Course curriculum item not found")
    for key, value in item.dict().items():
        setattr(db_item, key, value)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.delete("/course-curriculum/{course_year_id}")
def delete_course_curriculum(course_year_id: int, db: Session = Depends(get_db)):
    db_item = db.query(DBCourseCurriculum).filter(DBCourseCurriculum.course_year_id == course_year_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Course curriculum item not found")
    db.delete(db_item)
    db.commit()
    return {"message": "Course curriculum item deleted"}
