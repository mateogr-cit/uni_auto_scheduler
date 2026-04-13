from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import CourseOffering as DBCourseOffering
from schemas import CourseOffering
from typing import List

router = APIRouter()

@router.get("/course-offerings/", response_model=List[CourseOffering])
def read_course_offerings(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(DBCourseOffering).offset(skip).limit(limit).all()
