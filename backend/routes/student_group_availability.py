from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import time
from database import get_db
from models import StudentGroupAvailability as DBStudentGroupAvailability, StudentGroup as DBStudentGroup, DayOfWeek
from schemas import StudentGroupAvailabilityCreate, StudentGroupAvailabilityUpdate, StudentGroupAvailability
from typing import List

router = APIRouter()

@router.post("/student-group-availability/", response_model=StudentGroupAvailability)
def create_student_group_availability(item: StudentGroupAvailabilityCreate, db: Session = Depends(get_db)):
    # Verify student group exists
    student_group = db.query(DBStudentGroup).filter(DBStudentGroup.group_id == item.group_id).first()
    if student_group is None:
        raise HTTPException(status_code=404, detail="Student group not found")

    db_item = DBStudentGroupAvailability(**item.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.post("/student-group-availability/bulk", response_model=List[StudentGroupAvailability])
def create_student_group_availability_bulk(items: List[StudentGroupAvailabilityCreate], db: Session = Depends(get_db)):
    try:
        result = []
        for item in items:
            # Verify student group exists
            student_group = db.query(DBStudentGroup).filter(DBStudentGroup.group_id == item.group_id).first()
            if student_group is None:
                raise HTTPException(status_code=404, detail=f"Student group not found: {item.group_id}")

            db_item = DBStudentGroupAvailability(**item.dict())
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

@router.get("/student-group-availability/", response_model=List[StudentGroupAvailability])
def read_student_group_availability(group_id: int = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    query = db.query(DBStudentGroupAvailability)
    if group_id is not None:
        query = query.filter(DBStudentGroupAvailability.group_id == group_id)
    items = query.offset(skip).limit(limit).all()
    return items

@router.get("/student-group-availability/{availability_id}", response_model=StudentGroupAvailability)
def read_student_group_availability_item(availability_id: int, db: Session = Depends(get_db)):
    item = db.query(DBStudentGroupAvailability).filter(DBStudentGroupAvailability.id == availability_id).first()
    if item is None:
        raise HTTPException(status_code=404, detail="Availability record not found")
    return item

@router.put("/student-group-availability/{availability_id}", response_model=StudentGroupAvailability)
def update_student_group_availability(availability_id: int, update: StudentGroupAvailabilityUpdate, db: Session = Depends(get_db)):
    item = db.query(DBStudentGroupAvailability).filter(DBStudentGroupAvailability.id == availability_id).first()
    if item is None:
        raise HTTPException(status_code=404, detail="Availability record not found")
    for key, value in update.dict(exclude_unset=True).items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item

@router.delete("/student-group-availability/{availability_id}")
def delete_student_group_availability(availability_id: int, db: Session = Depends(get_db)):
    item = db.query(DBStudentGroupAvailability).filter(DBStudentGroupAvailability.id == availability_id).first()
    if item is None:
        raise HTTPException(status_code=404, detail="Availability record not found")
    db.delete(item)
    db.commit()
    return {"message": "Availability record deleted"}

@router.post("/student-group-availability/batch/")
def batch_update_student_group_availability(group_id: int, availabilities: List[StudentGroupAvailabilityCreate], db: Session = Depends(get_db)):
    # Verify student group exists
    student_group = db.query(DBStudentGroup).filter(DBStudentGroup.group_id == group_id).first()
    if student_group is None:
        raise HTTPException(status_code=404, detail="Student group not found")

    # Delete existing entries for this group
    db.query(DBStudentGroupAvailability).filter(DBStudentGroupAvailability.group_id == group_id).delete()
    
    # Add new entries
    for item in availabilities:
        db_item = DBStudentGroupAvailability(**item.dict())
        db.add(db_item)
    
    db.commit()
    return {"message": "Batch availability update successful"}

@router.post("/student-group-availability/set-default/{group_id}")
def set_default_availability(group_id: int, db: Session = Depends(get_db)):
    """
    Set default availability for a student group: Monday-Friday, 09:00-15:00
    """
    # Verify student group exists
    student_group = db.query(DBStudentGroup).filter(DBStudentGroup.group_id == group_id).first()
    if student_group is None:
        raise HTTPException(status_code=404, detail="Student group not found")

    # Delete existing entries for this group
    db.query(DBStudentGroupAvailability).filter(DBStudentGroupAvailability.group_id == group_id).delete()
    
    # Create default availability for Monday to Friday, 09:00-15:00
    days = [DayOfWeek.Monday, DayOfWeek.Tuesday, DayOfWeek.Wednesday, DayOfWeek.Thursday, DayOfWeek.Friday]
    default_start = time(9, 0)  # 09:00
    default_end = time(15, 0)   # 15:00
    
    for day in days:
        db_item = DBStudentGroupAvailability(
            group_id=group_id,
            day_of_week=day,
            start_time=default_start,
            end_time=default_end,
            is_available=True
        )
        db.add(db_item)
    
    db.commit()
    return {"message": f"Default availability set for group {group_id}: Monday-Friday 09:00-15:00"}
