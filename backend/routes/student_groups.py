from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, time
from database import get_db
from models import StudentGroup as DBStudentGroup, StudentGroupAvailability as DBStudentGroupAvailability, DayOfWeek
from schemas import StudentGroupCreate, StudentGroup
from typing import List
from utils import validate_pagination

router = APIRouter()

def create_default_availability(group_id: int, db: Session):
    """Create default availability for a student group: Monday-Friday, 09:00-15:00"""
    days = [DayOfWeek.Monday, DayOfWeek.Tuesday, DayOfWeek.Wednesday, DayOfWeek.Thursday, DayOfWeek.Friday]
    default_start = time(9, 0)  # 09:00
    default_end = time(15, 0)   # 15:00

    for day in days:
        db_item = DBStudentGroupAvailability(
            group_id=group_id,
            day_of_week=day,
            start_time=default_start,
            end_time=default_end,
            is_available=True
        )
        db.add(db_item)

@router.post("/student-groups/", response_model=StudentGroup)
def create_student_group(item: StudentGroupCreate, db: Session = Depends(get_db)):
    db_item = DBStudentGroup(**item.dict(), createdAt=datetime.utcnow(), updatedAt=datetime.utcnow())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)

    # Create default availability (09:00-15:00, Monday-Friday)
    create_default_availability(db_item.group_id, db)
    db.commit()

    return db_item

@router.get("/student-groups/", response_model=List[StudentGroup])
def read_student_groups(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    skip, limit = validate_pagination(skip, limit)
    return db.query(DBStudentGroup).offset(skip).limit(limit).all()

@router.get("/student-groups/{group_id}", response_model=StudentGroup)
def read_student_group(group_id: int, db: Session = Depends(get_db)):
    db_item = db.query(DBStudentGroup).filter(DBStudentGroup.group_id == group_id).first()
    if db_item is None:
        raise HTTPException(status_code=404, detail="Student group not found")
    return db_item

@router.put("/student-groups/{group_id}", response_model=StudentGroup)
def update_student_group(group_id: int, item: StudentGroupCreate, db: Session = Depends(get_db)):
    db_item = db.query(DBStudentGroup).filter(DBStudentGroup.group_id == group_id).first()
    if db_item is None:
        raise HTTPException(status_code=404, detail="Student group not found")
    for key, value in item.dict().items():
        setattr(db_item, key, value)
    db_item.updatedAt = datetime.utcnow()
    db.commit()
    db.refresh(db_item)
    return db_item

@router.delete("/student-groups/{group_id}")
def delete_student_group(group_id: int, db: Session = Depends(get_db)):
    db_item = db.query(DBStudentGroup).filter(DBStudentGroup.group_id == group_id).first()
    if db_item is None:
        raise HTTPException(status_code=404, detail="Student group not found")
    db.delete(db_item)
    db.commit()
    return {"message": "Student group deleted"}
