from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Student as DBStudent, User as DBUser
from schemas import StudentCreate, Student
from typing import List

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

@router.get("/students/", response_model=List[Student])
def read_students(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
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
    db_student = db.query(DBStudent).filter(DBStudent.u_id == student_id).first()
    if db_student is None:
        raise HTTPException(status_code=404, detail="Student not found")
    db.delete(db_student)
    db.commit()
    return {"message": "Student deleted"}