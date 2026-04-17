from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import SessionTypeModel, SessionType
from schemas import SessionTypeModel as SessionTypeModelSchema, SessionTypeModelCreate
from typing import List

router = APIRouter()

@router.get("/session-types/", response_model=List[SessionTypeModelSchema])
def read_session_types(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all session types."""
    return db.query(SessionTypeModel).offset(skip).limit(limit).all()

@router.post("/session-types/", response_model=SessionTypeModelSchema)
def create_session_type(session_type: SessionTypeModelCreate, db: Session = Depends(get_db)):
    """Create a new session type."""
    db_session_type = SessionTypeModel(
        type_name=session_type.type_name,
        duration_hours=session_type.duration_hours or 2
    )
    db.add(db_session_type)
    db.commit()
    db.refresh(db_session_type)
    return db_session_type

@router.get("/session-types/{session_type_id}", response_model=SessionTypeModelSchema)
def read_session_type(session_type_id: int, db: Session = Depends(get_db)):
    """Get a specific session type."""
    db_session_type = db.query(SessionTypeModel).filter(
        SessionTypeModel.session_type_id == session_type_id
    ).first()
    if not db_session_type:
        raise HTTPException(status_code=404, detail="Session type not found")
    return db_session_type

@router.put("/session-types/{session_type_id}", response_model=SessionTypeModelSchema)
def update_session_type(session_type_id: int, session_type: SessionTypeModelCreate, db: Session = Depends(get_db)):
    """Update a session type."""
    db_session_type = db.query(SessionTypeModel).filter(
        SessionTypeModel.session_type_id == session_type_id
    ).first()
    if not db_session_type:
        raise HTTPException(status_code=404, detail="Session type not found")
    
    db_session_type.type_name = session_type.type_name
    db_session_type.duration_hours = session_type.duration_hours or 2
    db.commit()
    db.refresh(db_session_type)
    return db_session_type

@router.delete("/session-types/{session_type_id}")
def delete_session_type(session_type_id: int, db: Session = Depends(get_db)):
    """Delete a session type."""
    db_session_type = db.query(SessionTypeModel).filter(
        SessionTypeModel.session_type_id == session_type_id
    ).first()
    if not db_session_type:
        raise HTTPException(status_code=404, detail="Session type not found")
    
    db.delete(db_session_type)
    db.commit()
    return {"message": "Session type deleted successfully"}
