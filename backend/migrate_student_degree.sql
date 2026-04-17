-- SQL Migration: Update student_degree table from u_id to group_id
-- Description: Migrate student degree assignment from individual students to student groups
-- Status: Ready to execute

-- Step 1: Drop the old foreign key constraint on u_id (if it exists)
ALTER TABLE student_degree 
DROP CONSTRAINT IF EXISTS student_degree_u_id_fkey;

-- Step 2: Drop the u_id column
ALTER TABLE student_degree 
DROP COLUMN IF EXISTS u_id;

-- Step 3: Add group_id column with foreign key to student_group
ALTER TABLE student_degree 
ADD COLUMN group_id INTEGER NOT NULL DEFAULT 1;

-- Step 4: Add the new foreign key constraint
ALTER TABLE student_degree 
ADD CONSTRAINT student_degree_group_id_fkey 
FOREIGN KEY (group_id) REFERENCES student_group(group_id) ON DELETE CASCADE;

-- Step 5: Remove the default value after migration (optional, for cleanliness)
ALTER TABLE student_degree 
ALTER COLUMN group_id DROP DEFAULT;

-- Verification query to check the updated table structure
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'student_degree';
