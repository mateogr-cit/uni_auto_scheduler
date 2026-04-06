from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from database import get_db
from models import Faculty as DBFaculty
from schemas import FacultyCreate, Faculty
from typing import List

router = APIRouter()

@router.post("/faculty/", response_model=Faculty)
def create_faculty(item: FacultyCreate, db: Session = Depends(get_db)):
    db_item = DBFaculty(**item.dict(), createdAt=datetime.utcnow())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.get("/faculty/", response_model=List[Faculty])
def read_faculty(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(DBFaculty).offset(skip).limit(limit).all()

@router.get("/faculty/{f_id}", response_model=Faculty)
def read_faculty_item(f_id: int, db: Session = Depends(get_db)):
    db_item = db.query(DBFaculty).filter(DBFaculty.f_id == f_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Faculty not found")
    return db_item

@router.put("/faculty/{f_id}", response_model=Faculty)
def update_faculty(f_id: int, item: FacultyCreate, db: Session = Depends(get_db)):
    db_item = db.query(DBFaculty).filter(DBFaculty.f_id == f_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Faculty not found")
    for key, value in item.dict().items():
        setattr(db_item, key, value)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.delete("/faculty/{f_id}")
def delete_faculty(f_id: int, db: Session = Depends(get_db)):
    db_item = db.query(DBFaculty).filter(DBFaculty.f_id == f_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Faculty not found")
    db.delete(db_item)
    db.commit()
    return {"message": "Faculty deleted"}
