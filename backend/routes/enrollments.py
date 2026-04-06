from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from database import get_db
from models import Enrollment as DBEnrollment, Student as DBStudent, CourseOffering as DBCourseOffering
from schemas import EnrollmentCreate, Enrollment
from typing import List

router = APIRouter()

@router.post("/enrollments/", response_model=Enrollment)
def create_enrollment(item: EnrollmentCreate, db: Session = Depends(get_db)):
    db_item = DBEnrollment(**item.dict(), enrolledAt=datetime.utcnow())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.get("/enrollments/", response_model=List[Enrollment])
def read_enrollments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(DBEnrollment).offset(skip).limit(limit).all()

@router.get("/enrollments/{enrollment_id}", response_model=Enrollment)
def read_enrollment(enrollment_id: int, db: Session = Depends(get_db)):
    db_item = db.query(DBEnrollment).filter(DBEnrollment.id == enrollment_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    return db_item

@router.put("/enrollments/{enrollment_id}", response_model=Enrollment)
def update_enrollment(enrollment_id: int, item: EnrollmentCreate, db: Session = Depends(get_db)):
    db_item = db.query(DBEnrollment).filter(DBEnrollment.id == enrollment_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    db_item.offering_id = item.offering_id
    db_item.u_id = item.u_id
    db.commit()
    db.refresh(db_item)
    return db_item

@router.delete("/enrollments/{enrollment_id}")
def delete_enrollment(enrollment_id: int, db: Session = Depends(get_db)):
    db_item = db.query(DBEnrollment).filter(DBEnrollment.id == enrollment_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    db.delete(db_item)
    db.commit()
    return {"message": "Enrollment deleted"}

@router.post("/enrollments/auto/")
def auto_enroll(db: Session = Depends(get_db)):
    students = db.query(DBStudent).all()
    offerings = db.query(DBCourseOffering).all()

    if not students or not offerings:
        raise HTTPException(status_code=400, detail="No students or offerings available for auto enrollment")

    created = 0
    for student in students:
        for offering in offerings:
            exists = db.query(DBEnrollment).filter(
                DBEnrollment.u_id == student.u_id,
                DBEnrollment.offering_id == offering.offering_id,
            ).first()
            if not exists:
                db_item = DBEnrollment(
                    offering_id=offering.offering_id,
                    u_id=student.u_id,
                    enrolledAt=datetime.utcnow(),
                )
                db.add(db_item)
                created += 1
    db.commit()
    return {"message": f"Auto-enrolled {created} students to offerings"}
