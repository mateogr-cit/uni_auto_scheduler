from sqlalchemy import text
from database import engine

def migrate_course_degree():
    """Add degree_id column to course table."""
    with engine.connect() as connection:
        try:
            # Start transaction
            transaction = connection.begin()
            
            print("Starting migration: adding degree_id to course table...")
            
            # Add degree_id column
            print("  1. Adding degree_id column...")
            try:
                connection.execute(text(
                    "ALTER TABLE course ADD COLUMN degree_id INTEGER"
                ))
                print("     [OK] degree_id column added")
            except Exception as e:
                print(f"     [WARN] Could not add degree_id column: {e}")
            
            # Add foreign key constraint
            print("  2. Adding foreign key constraint to degree...")
            try:
                connection.execute(text(
                    "ALTER TABLE course ADD CONSTRAINT course_degree_id_fkey FOREIGN KEY (degree_id) REFERENCES degree(d_id) ON DELETE CASCADE"
                ))
                print("     [OK] Foreign key constraint added")
            except Exception as e:
                print(f"     [WARN] Could not add FK constraint: {e}")
            
            transaction.commit()
            print("\n[OK] Migration completed successfully!")
            
        except Exception as e:
            transaction.rollback()
            print(f"\n[FAIL] Migration failed: {e}")
            raise

if __name__ == "__main__":
    migrate_course_degree()
