"""
Migration script to add semester_id column to course table
Run this with: py migrate_add_semester_id.py
"""

from sqlalchemy import create_engine, text
from database import DATABASE_URL

def migrate():
    engine = create_engine(DATABASE_URL)

    with engine.connect() as conn:
        # Check if column already exists (PostgreSQL syntax)
        result = conn.execute(text("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'course'
            AND column_name = 'semester_id'
        """))

        if result.fetchone():
            print("Column semester_id already exists in course table")
            return

        # Add the semester_id column
        conn.execute(text("""
            ALTER TABLE course
            ADD COLUMN semester_id INTEGER REFERENCES semester(sem_id) ON DELETE SET NULL
        """))

        conn.commit()
        print("Successfully added semester_id column to course table")

if __name__ == "__main__":
    migrate()
