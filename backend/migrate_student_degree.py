"""
Migration script to update student_degree table from u_id to group_id.
This migrates student degree assignment from individual students to student groups.
Run this script once after updating the StudentDegree model.
"""

from sqlalchemy import text
from database import engine, SessionLocal

def migrate_student_degree():
    """Migrate student_degree table from u_id to group_id."""
    
    with engine.connect() as connection:
        try:
            # Start transaction
            transaction = connection.begin()
            
            print("Starting migration: student_degree table...")
            
            # Step 1: Drop the old foreign key constraint on u_id
            print("  1. Dropping old foreign key constraint on u_id...")
            try:
                connection.execute(text(
                    "ALTER TABLE student_degree DROP CONSTRAINT student_degree_u_id_fkey"
                ))
                print("     ✓ Old FK constraint dropped")
            except Exception as e:
                print(f"     ⚠ Could not drop FK (may not exist): {e}")
            
            # Step 2: Drop the u_id column
            print("  2. Dropping u_id column...")
            try:
                connection.execute(text(
                    "ALTER TABLE student_degree DROP COLUMN u_id"
                ))
                print("     ✓ u_id column dropped")
            except Exception as e:
                print(f"     ⚠ Could not drop u_id column: {e}")
            
            # Step 3: Add group_id column with foreign key constraint
            print("  3. Adding group_id column with FK to student_group...")
            try:
                connection.execute(text(
                    "ALTER TABLE student_degree ADD COLUMN group_id INTEGER NOT NULL DEFAULT 1"
                ))
                print("     ✓ group_id column added")
            except Exception as e:
                print(f"     ⚠ Could not add group_id column: {e}")
            
            # Step 4: Add the foreign key constraint
            print("  4. Adding foreign key constraint to student_group...")
            try:
                connection.execute(text(
                    "ALTER TABLE student_degree ADD CONSTRAINT student_degree_group_id_fkey FOREIGN KEY (group_id) REFERENCES student_group(group_id) ON DELETE CASCADE"
                ))
                print("     ✓ Foreign key constraint added")
            except Exception as e:
                print(f"     ⚠ Could not add FK constraint: {e}")
            
            # Step 5: Remove the default value after migration
            print("  5. Removing default value from group_id...")
            try:
                connection.execute(text(
                    "ALTER TABLE student_degree ALTER COLUMN group_id DROP DEFAULT"
                ))
                print("     ✓ Default value removed")
            except Exception as e:
                print(f"     ⚠ Could not remove default: {e}")
            
            transaction.commit()
            print("\n✓ Migration completed successfully!")
            
        except Exception as e:
            transaction.rollback()
            print(f"\n✗ Migration failed: {e}")
            raise

if __name__ == "__main__":
    print("=" * 60)
    print("Student Degree Table Migration: u_id → group_id")
    print("=" * 60)
    migrate_student_degree()
    print("=" * 60)
