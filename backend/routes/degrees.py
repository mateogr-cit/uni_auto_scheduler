from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from database import get_db
from models import Degree as DBDegree
from schemas import DegreeCreate, Degree
from typing import List

router = APIRouter()

@router.post("/degrees/", response_model=Degree)
def create_degree(item: DegreeCreate, db: Session = Depends(get_db)):
    db_item = DBDegree(**item.dict(), createdAt=datetime.utcnow())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.get("/degrees/", response_model=List[Degree])
def read_degrees(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(DBDegree).offset(skip).limit(limit).all()

@router.get("/degrees/{d_id}", response_model=Degree)
def read_degree(d_id: int, db: Session = Depends(get_db)):
    db_item = db.query(DBDegree).filter(DBDegree.d_id == d_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Degree not found")
    return db_item

@router.put("/degrees/{d_id}", response_model=Degree)
def update_degree(d_id: int, item: DegreeCreate, db: Session = Depends(get_db)):
    db_item = db.query(DBDegree).filter(DBDegree.d_id == d_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Degree not found")
    for key, value in item.dict().items():
        setattr(db_item, key, value)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.delete("/degrees/{d_id}")
def delete_degree(d_id: int, db: Session = Depends(get_db)):
    db_item = db.query(DBDegree).filter(DBDegree.d_id == d_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Degree not found")
    db.delete(db_item)
    db.commit()
    return {"message": "Degree deleted"}
