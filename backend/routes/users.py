from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User as DBUser
from schemas import UserCreate, UserUpdate, User
from typing import List
from datetime import datetime
from utils import validate_pagination
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/users/", response_model=User)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    logger.info(f"Creating user: {user.username}")
    now = datetime.utcnow()
    db_user = DBUser(
        **user.dict(),
        createdAt=now,
        updatedAt=now,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    logger.info(f"User created successfully: {db_user.u_id}")
    return db_user

@router.post("/users/bulk", response_model=List[User])
def create_users_bulk(users: List[UserCreate], db: Session = Depends(get_db)):
    logger.info(f"Creating {len(users)} users in bulk")
    try:
        now = datetime.utcnow()
        result = []
        for user in users:
            db_user = DBUser(
                **user.dict(),
                createdAt=now,
                updatedAt=now,
            )
            db.add(db_user)
            result.append(db_user)
        db.commit()
        for item in result:
            db.refresh(item)
        logger.info(f"Bulk user creation completed: {len(result)} users created")
        return result
    except Exception as e:
        logger.error(f"Bulk user creation failed: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Bulk create failed: {str(e)}")

@router.get("/users/", response_model=List[User])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    skip, limit = validate_pagination(skip, limit)
    users = db.query(DBUser).offset(skip).limit(limit).all()
    return users

@router.get("/users/{user_id}", response_model=User)
def read_user(user_id: int, db: Session = Depends(get_db)):
    db_user = db.query(DBUser).filter(DBUser.u_id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@router.put("/users/{user_id}", response_model=User)
def update_user(user_id: int, user: UserUpdate, db: Session = Depends(get_db)):
    db_user = db.query(DBUser).filter(DBUser.u_id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    update_data = user.dict(exclude_unset=True)
    for key, value in update_data.items():
        if value is not None:
            setattr(db_user, key, value)
    # Explicitly handle u_role to ensure it's always updated when provided
    if user.u_role is not None:
        db_user.u_role = user.u_role
    db.commit()
    db.refresh(db_user)
    return db_user

@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    logger.info(f"Attempting to delete user: {user_id}")
    db_user = db.query(DBUser).filter(DBUser.u_id == user_id).first()
    if db_user is None:
        logger.warning(f"User not found for deletion: {user_id}")
        raise HTTPException(status_code=404, detail="User not found")

    try:
        # Delete related records first to ensure clean deletion
        from models import (
            Student, Prof, ProfessorAvailability,
            ProfessorUnavailability, Complaints
        )

        # Delete student record if exists
        student = db.query(Student).filter(Student.u_id == user_id).first()
        if student:
            logger.info(f"Deleting student record for user: {user_id}")
            db.delete(student)

        # Delete professor record if exists
        prof = db.query(Prof).filter(Prof.u_id == user_id).first()
        if prof:
            logger.info(f"Deleting professor record for user: {user_id}")
            db.delete(prof)

        # Delete professor availability
        prof_avail = db.query(ProfessorAvailability).filter(ProfessorAvailability.u_id == user_id).all()
        if prof_avail:
            logger.info(f"Deleting {len(prof_avail)} professor availability records for user: {user_id}")
            for avail in prof_avail:
                db.delete(avail)

        # Delete professor unavailability
        prof_unavail = db.query(ProfessorUnavailability).filter(ProfessorUnavailability.u_id == user_id).all()
        if prof_unavail:
            logger.info(f"Deleting {len(prof_unavail)} professor unavailability records for user: {user_id}")
            for unavail in prof_unavail:
                db.delete(unavail)

        # Delete complaints
        complaints = db.query(Complaints).filter(Complaints.u_id == user_id).all()
        if complaints:
            logger.info(f"Deleting {len(complaints)} complaint records for user: {user_id}")
            for complaint in complaints:
                db.delete(complaint)

        # Finally delete the user
        db.delete(db_user)
        db.commit()
        logger.info(f"User deleted successfully: {user_id}")
        return {"message": "User deleted"}
    except Exception as e:
        logger.error(f"Error deleting user {user_id}: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete user: {str(e)}")
