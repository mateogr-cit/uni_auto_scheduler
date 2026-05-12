from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from datetime import datetime
from database import get_db
from models import Prof as DBProf, User as DBUser, Course as DBCourse, professor_course_table, UserRole
from schemas import ProfCreate, ProfUpdate, Prof
from typing import Optional, List
from utils import validate_pagination

router = APIRouter()


def _assign_professor_courses(db: Session, u_id: int, course_ids: Optional[List[int]] = None):
    # Always clear existing courses first (even if course_ids is None or empty)
    db.execute(professor_course_table.delete().where(professor_course_table.c.u_id == u_id))
    
    # Only add new courses if course_ids is provided and not empty
    if course_ids:
        for c_id in course_ids:
            db_course = db.query(DBCourse).filter(DBCourse.c_id == c_id).first()
            if db_course is None:
                raise HTTPException(status_code=404, detail=f"Course not found: {c_id}")
            db.execute(professor_course_table.insert().values(u_id=u_id, c_id=c_id))
    
    # Flush changes to ensure they're applied before commit
    db.flush()


@router.post("/professors/", response_model=Prof)
def create_professor(prof: ProfCreate, db: Session = Depends(get_db)):
    if prof.u_id is not None:
        db_user = db.query(DBUser).filter(DBUser.u_id == prof.u_id).first()
        if not db_user:
            raise HTTPException(status_code=404, detail="User not found")
        if db_user.u_role != UserRole.professor:
            raise HTTPException(status_code=400, detail="User role must be professor")
        existing = db.query(DBProf).filter(DBProf.u_id == prof.u_id).first()
        if existing:
            raise HTTPException(status_code=409, detail="Professor already exists")

        db_prof = DBProf(u_id=prof.u_id)
        db.add(db_prof)
        db.flush()  # Flush to ensure professor exists before adding courses
        _assign_professor_courses(db, prof.u_id, prof.course_ids)
        db.commit()
        db.refresh(db_prof)
        return db.query(DBProf).options(joinedload(DBProf.user), joinedload(DBProf.courses)).filter(DBProf.u_id == db_prof.u_id).first()

    if not prof.fname or not prof.lname or not prof.email or not prof.username or not prof.password:
        raise HTTPException(status_code=400, detail="Missing user fields for new professor")

    new_user = DBUser(
        fname=prof.fname,
        lname=prof.lname,
        email=prof.email,
        username=prof.username,
        password=prof.password,
        u_role=UserRole.professor,
        createdAt=datetime.utcnow(),
        updatedAt=datetime.utcnow(),
    )
    db.add(new_user)
    db.flush()  # Flush to get the u_id before creating professor

    db_prof = DBProf(u_id=new_user.u_id)
    db.add(db_prof)
    db.flush()  # Flush to ensure professor exists before adding courses
    _assign_professor_courses(db, new_user.u_id, prof.course_ids)
    db.commit()
    db.refresh(db_prof)
    return db.query(DBProf).options(joinedload(DBProf.user), joinedload(DBProf.courses)).filter(DBProf.u_id == new_user.u_id).first()


@router.post("/professors/bulk", response_model=List[Prof])
def create_professors_bulk(profs: List[ProfCreate], db: Session = Depends(get_db)):
    try:
        result_profs = []
        
        for prof in profs:
            if prof.u_id is not None:
                db_user = db.query(DBUser).filter(DBUser.u_id == prof.u_id).first()
                if not db_user:
                    raise HTTPException(status_code=404, detail="User not found")
                if db_user.u_role != UserRole.professor:
                    raise HTTPException(status_code=400, detail="User role must be professor")
                existing = db.query(DBProf).filter(DBProf.u_id == prof.u_id).first()
                if existing:
                    raise HTTPException(status_code=409, detail=f"Professor already exists for u_id: {prof.u_id}")

                db_prof = DBProf(u_id=prof.u_id)
                db.add(db_prof)
                db.flush()
                _assign_professor_courses(db, prof.u_id, prof.course_ids)
                result_profs.append(db_prof.u_id)
            else:
                if not prof.fname or not prof.lname or not prof.email or not prof.username or not prof.password:
                    raise HTTPException(status_code=400, detail="Missing user fields for new professor")

                new_user = DBUser(
                    fname=prof.fname,
                    lname=prof.lname,
                    email=prof.email,
                    username=prof.username,
                    password=prof.password,
                    u_role=UserRole.professor,
                    createdAt=datetime.utcnow(),
                    updatedAt=datetime.utcnow(),
                )
                db.add(new_user)
                db.flush()

                db_prof = DBProf(u_id=new_user.u_id)
                db.add(db_prof)
                db.flush()
                _assign_professor_courses(db, new_user.u_id, prof.course_ids)
                result_profs.append(db_prof.u_id)
        
        db.commit()
        
        # Fetch all created professors with their courses
        result = []
        for u_id in result_profs:
            prof_obj = db.query(DBProf).options(joinedload(DBProf.user), joinedload(DBProf.courses)).filter(DBProf.u_id == u_id).first()
            if prof_obj:
                result.append(prof_obj)
        
        return result
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Bulk create failed: {str(e)}")

@router.get("/professors/", response_model=List[Prof])
def read_professors(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    skip, limit = validate_pagination(skip, limit)
    professors = db.query(DBProf).options(joinedload(DBProf.user), joinedload(DBProf.courses)).offset(skip).limit(limit).all()
    return professors

@router.get("/professors/{prof_id}", response_model=Prof)
def read_professor(prof_id: int, db: Session = Depends(get_db)):
    db_prof = db.query(DBProf).options(joinedload(DBProf.user), joinedload(DBProf.courses)).filter(DBProf.u_id == prof_id).first()
    if db_prof is None:
        raise HTTPException(status_code=404, detail="Professor not found")
    return db_prof


@router.put("/professors/{prof_id}", response_model=Prof)
def update_professor(prof_id: int, prof: ProfUpdate, db: Session = Depends(get_db)):
    db_prof = db.query(DBProf).filter(DBProf.u_id == prof_id).first()
    if db_prof is None:
        db_user = db.query(DBUser).filter(DBUser.u_id == prof_id).first()
        if not db_user:
            raise HTTPException(status_code=404, detail="User not found")
        if db_user.u_role != UserRole.professor:
            raise HTTPException(status_code=400, detail="User role must be professor")
        db_prof = DBProf(u_id=prof_id)
        db.add(db_prof)
        db.flush()  # IMPORTANT: Flush before assigning courses

    _assign_professor_courses(db, prof_id, prof.course_ids)
    db.commit()
    db.refresh(db_prof)
    return db.query(DBProf).options(joinedload(DBProf.user), joinedload(DBProf.courses)).filter(DBProf.u_id == prof_id).first()


@router.patch("/professors/{prof_id}", response_model=Prof)
def patch_professor(prof_id: int, prof: ProfUpdate, db: Session = Depends(get_db)):
    """Partial update of professor (courses only)"""
    db_prof = db.query(DBProf).filter(DBProf.u_id == prof_id).first()
    if db_prof is None:
        raise HTTPException(status_code=404, detail="Professor not found")

    db_user = db.query(DBUser).filter(DBUser.u_id == prof_id).first()
    if not db_user or db_user.u_role != UserRole.professor:
        raise HTTPException(status_code=400, detail="User role must be professor")

    _assign_professor_courses(db, prof_id, prof.course_ids)
    db.commit()
    db.refresh(db_prof)
    return db.query(DBProf).options(joinedload(DBProf.user), joinedload(DBProf.courses)).filter(DBProf.u_id == prof_id).first()


@router.delete("/professors/{prof_id}")
def delete_professor(prof_id: int, db: Session = Depends(get_db)):
    db_prof = db.query(DBProf).filter(DBProf.u_id == prof_id).first()
    if db_prof is None:
        raise HTTPException(status_code=404, detail="Professor not found")
    db.delete(db_prof)
    db.commit()
    return {"message": "Professor deleted"}