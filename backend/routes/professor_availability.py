from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import ProfessorAvailability as DBProfessorAvailability, User as DBUser
from schemas import ProfessorAvailabilityCreate, ProfessorAvailabilityUpdate, ProfessorAvailability
from typing import List

router = APIRouter()

@router.post("/professor-availability/", response_model=ProfessorAvailability)
def create_professor_availability(item: ProfessorAvailabilityCreate, db: Session = Depends(get_db)):
    professor_user = db.query(DBUser).filter(DBUser.u_id == item.u_id, DBUser.u_role == "professor").first()
    if professor_user is None:
        raise HTTPException(status_code=404, detail="Professor not found")
    db_item = DBProfessorAvailability(**item.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.get("/professor-availability/", response_model=List[ProfessorAvailability])
def read_professor_availability(u_id: int = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    query = db.query(DBProfessorAvailability)
    if u_id is not None:
        query = query.filter(DBProfessorAvailability.u_id == u_id)
    items = query.offset(skip).limit(limit).all()
    return items

@router.get("/professor-availability/{availability_id}", response_model=ProfessorAvailability)
def read_professor_availability_item(availability_id: int, db: Session = Depends(get_db)):
    item = db.query(DBProfessorAvailability).filter(DBProfessorAvailability.id == availability_id).first()
    if item is None:
        raise HTTPException(status_code=404, detail="Availability record not found")
    return item

@router.put("/professor-availability/{availability_id}", response_model=ProfessorAvailability)
def update_professor_availability(availability_id: int, update: ProfessorAvailabilityUpdate, db: Session = Depends(get_db)):
    item = db.query(DBProfessorAvailability).filter(DBProfessorAvailability.id == availability_id).first()
    if item is None:
        raise HTTPException(status_code=404, detail="Availability record not found")
    for key, value in update.dict(exclude_unset=True).items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item

@router.delete("/professor-availability/{availability_id}")
def delete_professor_availability(availability_id: int, db: Session = Depends(get_db)):
    item = db.query(DBProfessorAvailability).filter(DBProfessorAvailability.id == availability_id).first()
    if item is None:
        raise HTTPException(status_code=404, detail="Availability record not found")
    db.delete(item)
    db.commit()
    return {"message": "Availability record deleted"}

@router.post("/professor-availability/batch/")
def batch_update_professor_availability(u_id: int, availabilities: List[ProfessorAvailabilityCreate], db: Session = Depends(get_db)):
    # Verify user exists and is a professor
    professor_user = db.query(DBUser).filter(DBUser.u_id == u_id, DBUser.u_role == "professor").first()
    if professor_user is None:
        raise HTTPException(status_code=404, detail="Professor not found")

    # Delete existing entries for this user
    db.query(DBProfessorAvailability).filter(DBProfessorAvailability.u_id == u_id).delete()
    
    # Add new entries
    for item in availabilities:
        db_item = DBProfessorAvailability(**item.dict())
        db.add(db_item)
    
    db.commit()
    return {"message": "Batch availability update successful"}