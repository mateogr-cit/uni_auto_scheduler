from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from database import get_db
from models import StudentGroup as DBStudentGroup
from schemas import StudentGroupCreate, StudentGroup
from typing import List

router = APIRouter()

@router.post("/student-groups/", response_model=StudentGroup)
def create_student_group(item: StudentGroupCreate, db: Session = Depends(get_db)):
    db_item = DBStudentGroup(**item.dict(), createdAt=datetime.utcnow(), updatedAt=datetime.utcnow())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.get("/student-groups/", response_model=List[StudentGroup])
def read_student_groups(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(DBStudentGroup).offset(skip).limit(limit).all()

@router.get("/student-groups/{group_id}", response_model=StudentGroup)
def read_student_group(group_id: int, db: Session = Depends(get_db)):
    db_item = db.query(DBStudentGroup).filter(DBStudentGroup.group_id == group_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Student group not found")
    return db_item

@router.put("/student-groups/{group_id}", response_model=StudentGroup)
def update_student_group(group_id: int, item: StudentGroupCreate, db: Session = Depends(get_db)):
    db_item = db.query(DBStudentGroup).filter(DBStudentGroup.group_id == group_id).first()
    if not db_item:
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
    if not db_item:
        raise HTTPException(status_code=404, detail="Student group not found")
    db.delete(db_item)
    db.commit()
    return {"message": "Student group deleted"}
