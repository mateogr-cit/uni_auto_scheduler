"""
Migration endpoint routes.
These endpoints are used to manage database migrations during development.
"""

from fastapi import APIRouter, HTTPException
from sqlalchemy import text
from database import engine

router = APIRouter(prefix="/migrations", tags=["migrations"])

@router.post("/migrate-student-degree")
def migrate_student_degree():
    """
    Migrate student_degree table from u_id to group_id.
    This converts student degree assignment from individual students to groups.
    """
    try:
        with engine.connect() as connection:
            transaction = connection.begin()
            
            steps = []
            
            try:
                # Step 1: Drop old FK constraint
                connection.execute(text(
                    "ALTER TABLE student_degree DROP CONSTRAINT IF EXISTS student_degree_u_id_fkey"
                ))
                steps.append("✓ Dropped old u_id foreign key constraint")
            except Exception as e:
                steps.append(f"⚠ Could not drop old FK: {str(e)}")
            
            try:
                # Step 2: Drop u_id column
                connection.execute(text(
                    "ALTER TABLE student_degree DROP COLUMN IF EXISTS u_id"
                ))
                steps.append("✓ Dropped u_id column")
            except Exception as e:
                steps.append(f"⚠ Could not drop u_id column: {str(e)}")
            
            try:
                # Step 3: Add group_id column
                connection.execute(text(
                    "ALTER TABLE student_degree ADD COLUMN group_id INTEGER"
                ))
                steps.append("✓ Added group_id column")
            except Exception as e:
                if "already exists" in str(e):
                    steps.append("ℹ group_id column already exists")
                else:
                    steps.append(f"⚠ Could not add group_id column: {str(e)}")
            
            try:
                # Step 4: Add FK constraint
                connection.execute(text(
                    "ALTER TABLE student_degree ADD CONSTRAINT student_degree_group_id_fkey FOREIGN KEY (group_id) REFERENCES student_group(group_id) ON DELETE CASCADE"
                ))
                steps.append("✓ Added group_id foreign key constraint")
            except Exception as e:
                if "already exists" in str(e):
                    steps.append("ℹ Foreign key constraint already exists")
                else:
                    steps.append(f"⚠ Could not add FK: {str(e)}")
            
            transaction.commit()
            
            return {
                "status": "success",
                "message": "Migration completed",
                "steps": steps
            }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Migration failed: {str(e)}"
        )

@router.get("/status")
def migration_status():
    """Check the current schema of the student_degree table."""
    try:
        with engine.connect() as connection:
            result = connection.execute(text(
                """
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_name = 'student_degree'
                ORDER BY ordinal_position
                """
            ))
            columns = [
                {
                    "name": row[0],
                    "type": row[1],
                    "nullable": row[2]
                }
                for row in result
            ]
            return {
                "table": "student_degree",
                "columns": columns
            }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Could not check status: {str(e)}"
        )
