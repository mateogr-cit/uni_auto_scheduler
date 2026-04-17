"""
Database initialization script.
Seed the database with required session types.
Run this script after creating the database tables.
"""

from sqlalchemy.orm import Session
from database import SessionLocal
from models import SessionTypeModel, SessionType

def init_session_types(db: Session):
    """Initialize session types if they don't exist."""
    
    # Check if session types already exist
    existing_types = db.query(SessionTypeModel).count()
    if existing_types > 0:
        print(f"Session types already initialized ({existing_types} types found)")
        return
    
    # Create Lecture session type
    lecture_type = SessionTypeModel(
        type_name=SessionType.Lecture,
        duration_hours=2
    )
    db.add(lecture_type)
    
    # Create Seminar session type
    seminar_type = SessionTypeModel(
        type_name=SessionType.Seminar,
        duration_hours=2
    )
    db.add(seminar_type)
    
    db.commit()
    print("Session types initialized successfully")
    print("  - Lecture (2 hours)")
    print("  - Seminar (2 hours)")

if __name__ == "__main__":
    db = SessionLocal()
    try:
        init_session_types(db)
    finally:
        db.close()
