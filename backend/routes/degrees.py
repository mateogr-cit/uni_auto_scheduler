from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from database import get_db
from models import Degree as DBDegree
from schemas import DegreeCreate, Degree
from typing import List
from utils import validate_pagination

router = APIRouter()

@router.post("/degrees/", response_model=Degree)
def create_degree(item: DegreeCreate, db: Session = Depends(get_db)):
    db_item = DBDegree(**item.dict(), createdAt=datetime.utcnow())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.post("/degrees/bulk", response_model=List[Degree])
def create_degrees_bulk(items: List[DegreeCreate], db: Session = Depends(get_db)):
    try:
        result = []
        for item in items:
            db_item = DBDegree(**item.dict(), createdAt=datetime.utcnow())
            db.add(db_item)
            result.append(db_item)
        db.commit()
        for item in result:
            db.refresh(item)
        return result
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Bulk create failed: {str(e)}")

@router.get("/degrees/", response_model=List[Degree])
def read_degrees(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    skip, limit = validate_pagination(skip, limit)
    return db.query(DBDegree).offset(skip).limit(limit).all()

@router.get("/degrees/{d_id}", response_model=Degree)
def read_degree(d_id: int, db: Session = Depends(get_db)):
    db_item = db.query(DBDegree).filter(DBDegree.d_id == d_id).first()
    if db_item is None:
        raise HTTPException(status_code=404, detail="Degree not found")
    return db_item

@router.put("/degrees/{d_id}", response_model=Degree)
def update_degree(d_id: int, item: DegreeCreate, db: Session = Depends(get_db)):
    db_item = db.query(DBDegree).filter(DBDegree.d_id == d_id).first()
    if db_item is None:
        raise HTTPException(status_code=404, detail="Degree not found")
    for key, value in item.dict().items():
        setattr(db_item, key, value)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.delete("/degrees/{d_id}")
def delete_degree(d_id: int, db: Session = Depends(get_db)):
    db_item = db.query(DBDegree).filter(DBDegree.d_id == d_id).first()
    if db_item is None:
        raise HTTPException(status_code=404, detail="Degree not found")
    db.delete(db_item)
    db.commit()
    return {"message": "Degree deleted"}
