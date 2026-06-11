from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Complaints as DBComplaints, User as DBUser, Student as DBStudent, StudentGroup as DBStudentGroup
from schemas import Complaint, ComplaintCreate, ComplaintWithUser
from typing import List, Optional
from datetime import datetime
import logging
import json

logger = logging.getLogger(__name__)

router = APIRouter()

CTX_PREFIX = "__ctx__"
CTX_SUFFIX = "__end__"

def _encode_comp_text(text: str, course_name: Optional[str], time_slot: Optional[str]) -> str:
    if course_name or time_slot:
        meta = json.dumps({"course": course_name or "", "slot": time_slot or ""})
        return f"{CTX_PREFIX}{meta}{CTX_SUFFIX}\n{text}"
    return text

def _parse_comp_text(comp_text: str):
    if comp_text.startswith(CTX_PREFIX):
        end = comp_text.find(CTX_SUFFIX)
        if end != -1:
            meta_json = comp_text[len(CTX_PREFIX):end]
            actual_text = comp_text[end + len(CTX_SUFFIX):].lstrip("\n")
            try:
                meta = json.loads(meta_json)
                return actual_text, meta.get("course") or None, meta.get("slot") or None
            except Exception:
                pass
    return comp_text, None, None

def _enrich_complaint(db_complaint: DBComplaints, db: Session) -> ComplaintWithUser:
    actual_text, course_name, time_slot = _parse_comp_text(db_complaint.comp_text)

    user = db.query(DBUser).filter(DBUser.u_id == db_complaint.u_id).first()
    student_name = f"{user.fname} {user.lname}" if user else None

    student_group = None
    if user:
        student = db.query(DBStudent).filter(DBStudent.u_id == db_complaint.u_id).first()
        if student and student.group_id:
            group = db.query(DBStudentGroup).filter(DBStudentGroup.group_id == student.group_id).first()
            if group:
                student_group = group.group_name

    return ComplaintWithUser(
        comp_id=db_complaint.comp_id,
        u_id=db_complaint.u_id,
        comp_text=actual_text,
        createdAt=db_complaint.createdAt,
        student_name=student_name,
        student_group=student_group,
        course_name=course_name,
        time_slot=time_slot,
    )


@router.post("/complaints/{user_id}", response_model=Complaint)
def create_complaint_for_user(user_id: int, complaint: ComplaintCreate, db: Session = Depends(get_db)):
    user = db.query(DBUser).filter(DBUser.u_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db_complaint = DBComplaints(
        u_id=user_id,
        comp_text=_encode_comp_text(complaint.comp_text, complaint.course_name, complaint.time_slot),
        createdAt=datetime.utcnow()
    )
    db.add(db_complaint)
    db.commit()
    db.refresh(db_complaint)
    logger.info(f"Complaint created: {db_complaint.comp_id} by user {user_id}")
    return db_complaint


@router.get("/complaints/", response_model=List[ComplaintWithUser])
def read_complaints(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    complaints = db.query(DBComplaints).order_by(DBComplaints.createdAt.desc()).offset(skip).limit(limit).all()
    return [_enrich_complaint(c, db) for c in complaints]


@router.get("/complaints/{user_id}", response_model=List[ComplaintWithUser])
def read_user_complaints(user_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    user = db.query(DBUser).filter(DBUser.u_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    complaints = db.query(DBComplaints).filter(
        DBComplaints.u_id == user_id
    ).order_by(DBComplaints.createdAt.desc()).offset(skip).limit(limit).all()
    return [_enrich_complaint(c, db) for c in complaints]


@router.delete("/complaints/{complaint_id}")
def delete_complaint(complaint_id: int, db: Session = Depends(get_db)):
    """
    Delete a complaint (admin action). Writes an entry to the resolution log so
    the /resolved page can display it for 30 days.
    """
    from routes.resolutions import log_resolution

    logger.info(f"Attempting to delete complaint: {complaint_id}")
    complaint = db.query(DBComplaints).filter(DBComplaints.comp_id == complaint_id).first()
    if complaint is None:
        logger.warning(f"Complaint not found for deletion: {complaint_id}")
        raise HTTPException(status_code=404, detail="Complaint not found")

    # Capture a snapshot BEFORE delete so the audit log keeps the original context.
    actual_text, course_name, time_slot = _parse_comp_text(complaint.comp_text)
    user = db.query(DBUser).filter(DBUser.u_id == complaint.u_id).first()
    snapshot = {
        "comp_id": complaint.comp_id,
        "u_id": complaint.u_id,
        "student_name": f"{user.fname} {user.lname}" if user else None,
        "text": actual_text,
        "course_name": course_name,
        "time_slot": time_slot,
        "created_at": complaint.createdAt.isoformat() if complaint.createdAt else None,
    }

    db.delete(complaint)
    db.commit()
    log_resolution(db, kind="complaint_resolved", ref_id=complaint_id, summary=snapshot)
    logger.info(f"Complaint deleted successfully: {complaint_id}")
    return {"message": "Complaint deleted"}
