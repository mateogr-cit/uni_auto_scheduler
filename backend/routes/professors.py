from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from database import get_db
from models import Prof as DBProf, User as DBUser
from schemas import ProfCreate, Prof
from typing import List

router = APIRouter()

@router.post("/professors/", response_model=Prof)
def create_professor(prof: ProfCreate, db: Session = Depends(get_db)):
    if prof.u_id:
        db_user = db.query(DBUser).filter(DBUser.u_id == prof.u_id).first()
        if not db_user:
            raise HTTPException(status_code=404, detail="User not found")
        if db_user.u_role != "professor":
            raise HTTPException(status_code=400, detail="User role must be professor")
        existing = db.query(DBProf).filter(DBProf.u_id == prof.u_id).first()
        if existing:
            raise HTTPException(status_code=409, detail="Professor already exists")
        db_prof = DBProf(u_id=prof.u_id)
        db.add(db_prof)
        db.commit()
        db.refresh(db_prof)
        return db_prof

    # create user + professor mapping
    if not prof.fname or not prof.lname or not prof.email or not prof.username or not prof.password:
        raise HTTPException(status_code=400, detail="Missing user fields for new professor")

    new_user = DBUser(
        fname=prof.fname,
        lname=prof.lname,
        email=prof.email,
        username=prof.username,
        password=prof.password,
        u_role="professor",
        createdAt=datetime.utcnow(),
        updatedAt=datetime.utcnow(),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    db_prof = DBProf(u_id=new_user.u_id)
    db.add(db_prof)
    db.commit()
    db.refresh(db_prof)

    return db_prof

@router.get("/professors/", response_model=List[Prof])
def read_professors(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    professors = db.query(DBProf).offset(skip).limit(limit).all()
    return professors

@router.get("/professors/{prof_id}", response_model=Prof)
def read_professor(prof_id: int, db: Session = Depends(get_db)):
    db_prof = db.query(DBProf).filter(DBProf.u_id == prof_id).first()
    if db_prof is None:
        raise HTTPException(status_code=404, detail="Professor not found")
    return db_prof

@router.delete("/professors/{prof_id}")
def delete_professor(prof_id: int, db: Session = Depends(get_db)):
    db_prof = db.query(DBProf).filter(DBProf.u_id == prof_id).first()
    if db_prof is None:
        raise HTTPException(status_code=404, detail="Professor not found")
    db.delete(db_prof)
    db.commit()
    return {"message": "Professor deleted"}