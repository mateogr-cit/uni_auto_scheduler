from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import ProfessorAvailability as DBProfessorAvailability, ProfessorUnavailability as DBProfessorUnavailability, User as DBUser
from schemas import ProfessorAvailabilityCreate, ProfessorAvailabilityUpdate, ProfessorAvailability, ProfessorUnavailabilityCreate, ProfessorUnavailability
from typing import List, Optional
from utils import validate_pagination
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

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

@router.post("/professor-availability/bulk", response_model=List[ProfessorAvailability])
def create_professor_availability_bulk(items: List[ProfessorAvailabilityCreate], db: Session = Depends(get_db)):
    try:
        result = []
        for item in items:
            professor_user = db.query(DBUser).filter(DBUser.u_id == item.u_id, DBUser.u_role == "professor").first()
            if professor_user is None:
                raise HTTPException(status_code=404, detail=f"Professor not found: {item.u_id}")
            db_item = DBProfessorAvailability(**item.dict())
            db.add(db_item)
            result.append(db_item)
        db.commit()
        for item in result:
            db.refresh(item)
        return result
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Bulk create failed: {str(e)}")

@router.get("/professor-availability/", response_model=List[ProfessorAvailability])
def read_professor_availability(u_id: Optional[int] = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    skip, limit = validate_pagination(skip, limit)
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


# Professor Unavailability Routes

@router.post("/professor-unavailability/", response_model=ProfessorUnavailability)
def create_professor_unavailability(unavailability: ProfessorUnavailabilityCreate, db: Session = Depends(get_db)):
    """
    Create a new professor unavailability request.
    Note: In a real application, u_id should come from authentication context.
    For now, we'll use a default u_id of 1 (this should be updated with proper auth).
    """
    # TODO: Get u_id from authentication context
    u_id = 1  # Default user ID - should be replaced with authenticated user

    # Verify user exists and is a professor
    professor_user = db.query(DBUser).filter(DBUser.u_id == u_id, DBUser.u_role == "professor").first()
    if not professor_user:
        raise HTTPException(status_code=404, detail="Professor not found")

    db_unavailability = DBProfessorUnavailability(
        u_id=u_id,
        date=unavailability.date,
        start_time=unavailability.start_time,
        end_time=unavailability.end_time,
        reason=unavailability.reason,
        createdAt=datetime.utcnow()
    )
    db.add(db_unavailability)
    db.commit()
    db.refresh(db_unavailability)
    logger.info(f"Professor unavailability created: {db_unavailability.id} for professor {u_id}")
    return db_unavailability


@router.post("/professor-unavailability/{user_id}", response_model=ProfessorUnavailability)
def create_professor_unavailability_for_user(user_id: int, unavailability: ProfessorUnavailabilityCreate, db: Session = Depends(get_db)):
    """
    Create an unavailability request for a specific professor.
    """
    # Verify user exists and is a professor
    professor_user = db.query(DBUser).filter(DBUser.u_id == user_id, DBUser.u_role == "professor").first()
    if not professor_user:
        raise HTTPException(status_code=404, detail="Professor not found")

    db_unavailability = DBProfessorUnavailability(
        u_id=user_id,
        date=unavailability.date,
        start_time=unavailability.start_time,
        end_time=unavailability.end_time,
        reason=unavailability.reason,
        createdAt=datetime.utcnow()
    )
    db.add(db_unavailability)
    db.commit()
    db.refresh(db_unavailability)
    logger.info(f"Professor unavailability created: {db_unavailability.id} for professor {user_id}")
    return db_unavailability


@router.get("/professor-unavailability/", response_model=List[ProfessorUnavailability])
def read_professor_unavailability(u_id: Optional[int] = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Get all professor unavailability requests (admin view).
    Can filter by specific professor using u_id parameter.
    """
    skip, limit = validate_pagination(skip, limit)
    query = db.query(DBProfessorUnavailability)
    if u_id is not None:
        query = query.filter(DBProfessorUnavailability.u_id == u_id)
    items = query.order_by(DBProfessorUnavailability.createdAt.desc()).offset(skip).limit(limit).all()
    return items


@router.get("/professor-unavailability/{unavailability_id}", response_model=ProfessorUnavailability)
def read_professor_unavailability_item(unavailability_id: int, db: Session = Depends(get_db)):
    """
    Get a specific unavailability request by ID.
    """
    item = db.query(DBProfessorUnavailability).filter(DBProfessorUnavailability.id == unavailability_id).first()
    if item is None:
        raise HTTPException(status_code=404, detail="Unavailability request not found")
    return item


@router.delete("/professor-unavailability/{unavailability_id}")
def delete_professor_unavailability(unavailability_id: int, db: Session = Depends(get_db)):
    """
    Delete an unavailability request (admin action).
    """
    logger.info(f"Attempting to delete professor unavailability: {unavailability_id}")
    item = db.query(DBProfessorUnavailability).filter(DBProfessorUnavailability.id == unavailability_id).first()
    if item is None:
        logger.warning(f"Professor unavailability not found for deletion: {unavailability_id}")
        raise HTTPException(status_code=404, detail="Unavailability request not found")

    db.delete(item)
    db.commit()
    logger.info(f"Professor unavailability deleted successfully: {unavailability_id}")
    return {"message": "Unavailability request deleted"}
