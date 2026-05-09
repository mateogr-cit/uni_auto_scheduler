"""
Migration script to add is_active column to course table
"""
from sqlalchemy import text
from database import SessionLocal, engine

def migrate():
    # Create the migration
    with engine.connect() as connection:
        # Check if column already exists
        result = connection.execute(text("""
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'course' AND column_name = 'is_active'
            )
        """))
        
        column_exists = result.scalar()
        
        if not column_exists:
            # Add the column with default value
            connection.execute(text("""
                ALTER TABLE course ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE
            """))
            connection.commit()
            print("✓ Added is_active column to course table")
        else:
            print("✓ is_active column already exists")

if __name__ == "__main__":
    migrate()
