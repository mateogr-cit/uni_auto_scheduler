from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import TimeSlots as DBTimeSlots
from schemas import TimeSlotsCreate, TimeSlots
from typing import List
from utils import validate_pagination

router = APIRouter()

@router.post("/time-slots/", response_model=TimeSlots)
def create_time_slot(item: TimeSlotsCreate, db: Session = Depends(get_db)):
    db_item = DBTimeSlots(**item.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.post("/time-slots/bulk", response_model=List[TimeSlots])
def create_time_slots_bulk(items: List[TimeSlotsCreate], db: Session = Depends(get_db)):
    try:
        result = []
        for item in items:
            db_item = DBTimeSlots(**item.dict())
            db.add(db_item)
            result.append(db_item)
        db.commit()
        for item in result:
            db.refresh(item)
        return result
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Bulk create failed: {str(e)}")

@router.get("/time-slots/", response_model=List[TimeSlots])
def read_time_slots(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    skip, limit = validate_pagination(skip, limit)
    return db.query(DBTimeSlots).offset(skip).limit(limit).all()

@router.get("/time-slots/{slot_id}", response_model=TimeSlots)
def read_time_slot(slot_id: int, db: Session = Depends(get_db)):
    db_item = db.query(DBTimeSlots).filter(DBTimeSlots.slot_id == slot_id).first()
    if db_item is None:
        raise HTTPException(status_code=404, detail="Time slot not found")
    return db_item

@router.put("/time-slots/{slot_id}", response_model=TimeSlots)
def update_time_slot(slot_id: int, item: TimeSlotsCreate, db: Session = Depends(get_db)):
    db_item = db.query(DBTimeSlots).filter(DBTimeSlots.slot_id == slot_id).first()
    if db_item is None:
        raise HTTPException(status_code=404, detail="Time slot not found")
    for key, value in item.dict().items():
        setattr(db_item, key, value)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.delete("/time-slots/{slot_id}")
def delete_time_slot(slot_id: int, db: Session = Depends(get_db)):
    db_item = db.query(DBTimeSlots).filter(DBTimeSlots.slot_id == slot_id).first()
    if db_item is None:
        raise HTTPException(status_code=404, detail="Time slot not found")
    db.delete(db_item)
    db.commit()
    return {"message": "Time slot deleted"}
