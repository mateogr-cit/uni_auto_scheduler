from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Rooms as DBRooms
from schemas import RoomsCreate, Rooms
from typing import List

router = APIRouter()

@router.post("/rooms/", response_model=Rooms)
def create_room(room: RoomsCreate, db: Session = Depends(get_db)):
    db_room = DBRooms(**room.dict())
    db.add(db_room)
    db.commit()
    db.refresh(db_room)
    return db_room

@router.get("/rooms/", response_model=List[Rooms])
def read_rooms(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    rooms = db.query(DBRooms).offset(skip).limit(limit).all()
    return rooms

@router.get("/rooms/{room_id}", response_model=Rooms)
def read_room(room_id: str, db: Session = Depends(get_db)):
    db_room = db.query(DBRooms).filter(DBRooms.room_id == room_id).first()
    if db_room is None:
        raise HTTPException(status_code=404, detail="Room not found")
    return db_room

@router.put("/rooms/{room_id}", response_model=Rooms)
def update_room(room_id: str, room: RoomsCreate, db: Session = Depends(get_db)):
    db_room = db.query(DBRooms).filter(DBRooms.room_id == room_id).first()
    if db_room is None:
        raise HTTPException(status_code=404, detail="Room not found")
    db_room.capacity = room.capacity
    db.commit()
    db.refresh(db_room)
    return db_room

@router.delete("/rooms/{room_id}")
def delete_room(room_id: str, db: Session = Depends(get_db)):
    db_room = db.query(DBRooms).filter(DBRooms.room_id == room_id).first()
    if db_room is None:
        raise HTTPException(status_code=404, detail="Room not found")
    db.delete(db_room)
    db.commit()
    return {"message": "Room deleted"}