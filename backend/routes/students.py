from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Student as DBStudent, User as DBUser
from schemas import StudentCreate, Student
from typing import List
from utils import validate_pagination
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/students/", response_model=Student)
def create_student(student: StudentCreate, db: Session = Depends(get_db)):
    student_data = {k: v for k, v in student.dict().items() if v is not None}
    db_student = DBStudent(**student_data)
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    # Fetch user info to return complete data
    user = db.query(DBUser).filter(DBUser.u_id == db_student.u_id).first()
    return {
        "u_id": db_student.u_id,
        "s_status": db_student.s_status,
        "group_id": db_student.group_id,
        "fname": user.fname,
        "lname": user.lname
    }

@router.post("/students/bulk", response_model=List[Student])
def create_students_bulk(students: List[StudentCreate], db: Session = Depends(get_db)):
    try:
        result = []
        for student in students:
            student_data = {k: v for k, v in student.dict().items() if v is not None}
            db_student = DBStudent(**student_data)
            db.add(db_student)
            db.flush()  # Flush to get the u_id
            # Fetch user info to return complete data
            user = db.query(DBUser).filter(DBUser.u_id == db_student.u_id).first()
            result.append({
                "u_id": db_student.u_id,
                "s_status": db_student.s_status,
                "group_id": db_student.group_id,
                "fname": user.fname,
                "lname": user.lname
            })
        db.commit()
        return result
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Bulk create failed: {str(e)}")

@router.get("/students/", response_model=List[Student])
def read_students(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    skip, limit = validate_pagination(skip, limit)
    students = db.query(DBStudent, DBUser).join(DBUser, DBStudent.u_id == DBUser.u_id).offset(skip).limit(limit).all()
    result = []
    for student, user in students:
        result.append({
            "u_id": student.u_id,
            "s_status": student.s_status,
            "group_id": student.group_id,
            "fname": user.fname,
            "lname": user.lname
        })
    return result

@router.get("/students/{student_id}", response_model=Student)
def read_student(student_id: int, db: Session = Depends(get_db)):
    db_student = db.query(DBStudent).filter(DBStudent.u_id == student_id).first()
    if db_student is None:
        raise HTTPException(status_code=404, detail="Student not found")
    user = db.query(DBUser).filter(DBUser.u_id == db_student.u_id).first()
    return {
        "u_id": db_student.u_id,
        "s_status": db_student.s_status,
        "group_id": db_student.group_id,
        "fname": user.fname,
        "lname": user.lname
    }

@router.put("/students/{student_id}", response_model=Student)
def update_student(student_id: int, student: StudentCreate, db: Session = Depends(get_db)):
    db_student = db.query(DBStudent).filter(DBStudent.u_id == student_id).first()
    if db_student is None:
        raise HTTPException(status_code=404, detail="Student not found")
    student_data = {k: v for k, v in student.dict().items() if v is not None}
    for key, value in student_data.items():
        setattr(db_student, key, value)
    db.commit()
    db.refresh(db_student)
    user = db.query(DBUser).filter(DBUser.u_id == db_student.u_id).first()
    return {
        "u_id": db_student.u_id,
        "s_status": db_student.s_status,
        "group_id": db_student.group_id,
        "fname": user.fname,
        "lname": user.lname
    }

@router.delete("/students/{student_id}")
def delete_student(student_id: int, db: Session = Depends(get_db)):
    logger.info(f"Attempting to delete student: {student_id}")
    db_student = db.query(DBStudent).filter(DBStudent.u_id == student_id).first()
    if db_student is None:
        logger.warning(f"Student not found for deletion: {student_id}")
        raise HTTPException(status_code=404, detail="Student not found")

    try:
        # Delete related records first
        from models import Enrollment, StudentDegree

        # Delete enrollments
        enrollments = db.query(Enrollment).filter(Enrollment.u_id == student_id).all()
        if enrollments:
            logger.info(f"Deleting {len(enrollments)} enrollment records for student: {student_id}")
            for enrollment in enrollments:
                db.delete(enrollment)

        # Delete student degrees
        student_degrees = db.query(StudentDegree).filter(StudentDegree.group_id == db_student.group_id).all()
        if student_degrees:
            logger.info(f"Deleting {len(student_degrees)} student degree records for student: {student_id}")
            for student_degree in student_degrees:
                db.delete(student_degree)

        # Delete the student record
        db.delete(db_student)
        db.commit()
        logger.info(f"Student deleted successfully: {student_id}")
        return {"message": "Student deleted"}
    except Exception as e:
        logger.error(f"Error deleting student {student_id}: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete student: {str(e)}")