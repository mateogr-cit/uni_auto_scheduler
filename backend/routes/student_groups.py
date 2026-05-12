from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, time
from database import get_db
from models import StudentGroup as DBStudentGroup, StudentGroupAvailability as DBStudentGroupAvailability, DayOfWeek
from schemas import StudentGroupCreate, StudentGroup
from typing import List
from utils import validate_pagination
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

def create_default_availability(group_id: int, db: Session):
    """Create default availability for a student group: Monday-Friday, 09:00-15:00"""
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

@router.post("/student-groups/", response_model=StudentGroup)
def create_student_group(item: StudentGroupCreate, db: Session = Depends(get_db)):
    db_item = DBStudentGroup(**item.dict(), createdAt=datetime.utcnow(), updatedAt=datetime.utcnow())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)

    # Create default availability (09:00-15:00, Monday-Friday)
    create_default_availability(db_item.group_id, db)
    db.commit()

    return db_item

@router.post("/student-groups/bulk", response_model=List[StudentGroup])
def create_student_groups_bulk(items: List[StudentGroupCreate], db: Session = Depends(get_db)):
    try:
        result = []
        for item in items:
            db_item = DBStudentGroup(**item.dict(), createdAt=datetime.utcnow(), updatedAt=datetime.utcnow())
            db.add(db_item)
            db.flush()  # Flush to get the group_id
            
            # Create default availability for this group
            create_default_availability(db_item.group_id, db)
            
            result.append(db_item)
        
        db.commit()
        # Refresh all to ensure we have the latest data
        for item in result:
            db.refresh(item)
        return result
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Bulk create failed: {str(e)}")

@router.get("/student-groups/", response_model=List[StudentGroup])
def read_student_groups(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    skip, limit = validate_pagination(skip, limit)
    return db.query(DBStudentGroup).offset(skip).limit(limit).all()

@router.get("/student-groups/{group_id}", response_model=StudentGroup)
def read_student_group(group_id: int, db: Session = Depends(get_db)):
    db_item = db.query(DBStudentGroup).filter(DBStudentGroup.group_id == group_id).first()
    if db_item is None:
        raise HTTPException(status_code=404, detail="Student group not found")
    return db_item

@router.put("/student-groups/{group_id}", response_model=StudentGroup)
def update_student_group(group_id: int, item: StudentGroupCreate, db: Session = Depends(get_db)):
    db_item = db.query(DBStudentGroup).filter(DBStudentGroup.group_id == group_id).first()
    if db_item is None:
        raise HTTPException(status_code=404, detail="Student group not found")
    for key, value in item.dict().items():
        setattr(db_item, key, value)
    db_item.updatedAt = datetime.utcnow()
    db.commit()
    db.refresh(db_item)
    return db_item

@router.delete("/student-groups/{group_id}")
def delete_student_group(group_id: int, db: Session = Depends(get_db)):
    logger.info(f"Attempting to delete student group: {group_id}")
    db_item = db.query(DBStudentGroup).filter(DBStudentGroup.group_id == group_id).first()
    if db_item is None:
        logger.warning(f"Student group not found for deletion: {group_id}")
        raise HTTPException(status_code=404, detail="Student group not found")

    try:
        # Delete related records first
        from models import (
            StudentGroupAvailability, Student, StudentDegree,
            CourseOffering, Enrollment
        )

        # Delete student group availability
        availabilities = db.query(StudentGroupAvailability).filter(
            StudentGroupAvailability.group_id == group_id
        ).all()
        if availabilities:
            logger.info(f"Deleting {len(availabilities)} availability records for group: {group_id}")
            for avail in availabilities:
                db.delete(avail)

        # Delete students in this group
        students = db.query(Student).filter(Student.group_id == group_id).all()
        if students:
            logger.info(f"Deleting {len(students)} student records for group: {group_id}")
            for student in students:
                # Delete enrollments for this student
                enrollments = db.query(Enrollment).filter(Enrollment.u_id == student.u_id).all()
                if enrollments:
                    logger.info(f"Deleting {len(enrollments)} enrollment records for student: {student.u_id}")
                    for enrollment in enrollments:
                        db.delete(enrollment)
                db.delete(student)

        # Delete student degrees for this group
        student_degrees = db.query(StudentDegree).filter(StudentDegree.group_id == group_id).all()
        if student_degrees:
            logger.info(f"Deleting {len(student_degrees)} student degree records for group: {group_id}")
            for student_degree in student_degrees:
                db.delete(student_degree)

        # Delete course offerings for this group
        offerings = db.query(CourseOffering).filter(CourseOffering.group_id == group_id).all()
        if offerings:
            logger.info(f"Deleting {len(offerings)} course offerings for group: {group_id}")
            for offering in offerings:
                # Delete schedules for this offering
                from models import OfferingSchedule, OfferingProfessors
                schedules = db.query(OfferingSchedule).filter(
                    OfferingSchedule.offering_id == offering.offering_id
                ).all()
                if schedules:
                    logger.info(f"Deleting {len(schedules)} schedule records for offering: {offering.offering_id}")
                    for schedule in schedules:
                        db.delete(schedule)

                # Delete offering professors for this offering
                offering_profs = db.query(OfferingProfessors).filter(
                    OfferingProfessors.offering_id == offering.offering_id
                ).all()
                if offering_profs:
                    logger.info(f"Deleting {len(offering_profs)} offering professor records for offering: {offering.offering_id}")
                    for offering_prof in offering_profs:
                        db.delete(offering_prof)

                # Delete enrollments for this offering
                offering_enrollments = db.query(Enrollment).filter(
                    Enrollment.offering_id == offering.offering_id
                ).all()
                if offering_enrollments:
                    logger.info(f"Deleting {len(offering_enrollments)} enrollment records for offering: {offering.offering_id}")
                    for enrollment in offering_enrollments:
                        db.delete(enrollment)

                db.delete(offering)

        # Delete the student group record
        db.delete(db_item)
        db.commit()
        logger.info(f"Student group deleted successfully: {group_id}")
        return {"message": "Student group deleted"}
    except Exception as e:
        logger.error(f"Error deleting student group {group_id}: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete student group: {str(e)}")
