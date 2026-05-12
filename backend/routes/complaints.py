from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Complaints as DBComplaints, User as DBUser
from schemas import Complaint, ComplaintCreate
from typing import List
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/complaints/", response_model=Complaint)
def create_complaint(complaint: ComplaintCreate, db: Session = Depends(get_db)):
    """
    Create a new complaint.
    Note: In a real application, u_id should come from authentication context.
    For now, we'll use a default u_id of 1 (this should be updated with proper auth).
    """
    # TODO: Get u_id from authentication context
    u_id = 1  # Default user ID - should be replaced with authenticated user

    # Verify user exists
    user = db.query(DBUser).filter(DBUser.u_id == u_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db_complaint = DBComplaints(
        u_id=u_id,
        comp_text=complaint.comp_text,
        createdAt=datetime.utcnow()
    )
    db.add(db_complaint)
    db.commit()
    db.refresh(db_complaint)
    logger.info(f"Complaint created: {db_complaint.comp_id} by user {u_id}")
    return db_complaint


@router.post("/complaints/{user_id}", response_model=Complaint)
def create_complaint_for_user(user_id: int, complaint: ComplaintCreate, db: Session = Depends(get_db)):
    """
    Create a complaint for a specific user.
    """
    # Verify user exists
    user = db.query(DBUser).filter(DBUser.u_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db_complaint = DBComplaints(
        u_id=user_id,
        comp_text=complaint.comp_text,
        createdAt=datetime.utcnow()
    )
    db.add(db_complaint)
    db.commit()
    db.refresh(db_complaint)
    logger.info(f"Complaint created: {db_complaint.comp_id} by user {user_id}")
    return db_complaint


@router.get("/complaints/", response_model=List[Complaint])
def read_complaints(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Get all complaints (admin view).
    """
    complaints = db.query(DBComplaints).order_by(DBComplaints.createdAt.desc()).offset(skip).limit(limit).all()
    return complaints


@router.get("/complaints/{user_id}", response_model=List[Complaint])
def read_user_complaints(user_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Get all complaints for a specific user.
    """
    # Verify user exists
    user = db.query(DBUser).filter(DBUser.u_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    complaints = db.query(DBComplaints).filter(
        DBComplaints.u_id == user_id
    ).order_by(DBComplaints.createdAt.desc()).offset(skip).limit(limit).all()
    return complaints


@router.get("/complaints/{complaint_id}", response_model=Complaint)
def read_complaint(complaint_id: int, db: Session = Depends(get_db)):
    """
    Get a specific complaint by ID.
    """
    complaint = db.query(DBComplaints).filter(DBComplaints.comp_id == complaint_id).first()
    if complaint is None:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return complaint


@router.delete("/complaints/{complaint_id}")
def delete_complaint(complaint_id: int, db: Session = Depends(get_db)):
    """
    Delete a complaint (admin action).
    """
    logger.info(f"Attempting to delete complaint: {complaint_id}")
    complaint = db.query(DBComplaints).filter(DBComplaints.comp_id == complaint_id).first()
    if complaint is None:
        logger.warning(f"Complaint not found for deletion: {complaint_id}")
        raise HTTPException(status_code=404, detail="Complaint not found")

    db.delete(complaint)
    db.commit()
    logger.info(f"Complaint deleted successfully: {complaint_id}")
    return {"message": "Complaint deleted"}
