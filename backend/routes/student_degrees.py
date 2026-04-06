from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from database import get_db
from models import StudentDegree as DBStudentDegree
from schemas import StudentDegreeCreate, StudentDegree
from typing import List

router = APIRouter()

@router.post("/student-degrees/", response_model=StudentDegree)
def create_student_degree(item: StudentDegreeCreate, db: Session = Depends(get_db)):
    db_item = DBStudentDegree(**item.dict(), createdAt=datetime.utcnow(), updatedAt=datetime.utcnow())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.get("/student-degrees/", response_model=List[StudentDegree])
def read_student_degrees(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(DBStudentDegree).offset(skip).limit(limit).all()

@router.get("/student-degrees/{student_degree_id}", response_model=StudentDegree)
def read_student_degree(student_degree_id: int, db: Session = Depends(get_db)):
    db_item = db.query(DBStudentDegree).filter(DBStudentDegree.student_degree_id == student_degree_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Student degree not found")
    return db_item

@router.put("/student-degrees/{student_degree_id}", response_model=StudentDegree)
def update_student_degree(student_degree_id: int, item: StudentDegreeCreate, db: Session = Depends(get_db)):
    db_item = db.query(DBStudentDegree).filter(DBStudentDegree.student_degree_id == student_degree_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Student degree not found")
    for key, value in item.dict().items():
        setattr(db_item, key, value)
    db_item.updatedAt = datetime.utcnow()
    db.commit()
    db.refresh(db_item)
    return db_item

@router.delete("/student-degrees/{student_degree_id}")
def delete_student_degree(student_degree_id: int, db: Session = Depends(get_db)):
    db_item = db.query(DBStudentDegree).filter(DBStudentDegree.student_degree_id == student_degree_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Student degree not found")
    db.delete(db_item)
    db.commit()
    return {"message": "Student degree deleted"}
