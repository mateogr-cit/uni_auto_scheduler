from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Semester as DBSemester
from schemas import SemesterCreate, Semester
from typing import List
from utils import validate_pagination

router = APIRouter()

@router.post("/semesters/", response_model=Semester)
def create_semester(item: SemesterCreate, db: Session = Depends(get_db)):
    db_item = DBSemester(**item.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.post("/semesters/bulk", response_model=List[Semester])
def create_semesters_bulk(items: List[SemesterCreate], db: Session = Depends(get_db)):
    try:
        result = []
        for item in items:
            db_item = DBSemester(**item.dict())
            db.add(db_item)
            result.append(db_item)
        db.commit()
        for item in result:
            db.refresh(item)
        return result
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Bulk create failed: {str(e)}")

@router.get("/semesters/", response_model=List[Semester])
def read_semesters(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    skip, limit = validate_pagination(skip, limit)
    return db.query(DBSemester).offset(skip).limit(limit).all()

@router.get("/semesters/{sem_id}", response_model=Semester)
def read_semester(sem_id: int, db: Session = Depends(get_db)):
    db_item = db.query(DBSemester).filter(DBSemester.sem_id == sem_id).first()
    if db_item is None:
        raise HTTPException(status_code=404, detail="Semester not found")
    return db_item

@router.put("/semesters/{sem_id}", response_model=Semester)
def update_semester(sem_id: int, item: SemesterCreate, db: Session = Depends(get_db)):
    db_item = db.query(DBSemester).filter(DBSemester.sem_id == sem_id).first()
    if db_item is None:
        raise HTTPException(status_code=404, detail="Semester not found")
    for key, value in item.dict().items():
        setattr(db_item, key, value)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.delete("/semesters/{sem_id}")
def delete_semester(sem_id: int, db: Session = Depends(get_db)):
    db_item = db.query(DBSemester).filter(DBSemester.sem_id == sem_id).first()
    if db_item is None:
        raise HTTPException(status_code=404, detail="Semester not found")
    db.delete(db_item)
    db.commit()
    return {"message": "Semester deleted"}
