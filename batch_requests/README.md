# Batch API Requests

This directory contains PowerShell scripts for batch-adding data to the university auto-scheduler API.

## Prerequisites

- The backend API must be running on `http://localhost:8000`
- Run scripts in order (or use `run_all.ps1` to run all in parallel)

## Scripts

### 1. `add_faculties.ps1`
Creates faculties (e.g., Engineering, Business, Science).

### 2. `add_degrees.ps1`
Creates degree programs (e.g., Software Engineering, Business Analytics).

### 3. `add_rooms.ps1`
Creates rooms with capacities.

### 4. `add_student_groups.ps1`
Creates student groups (e.g., SE-1-1, BA-2-1) with year levels and capacities.

### 5. `add_students.ps1`
Creates student accounts and links them to groups and degrees.

### 6. `add_courses.ps1`
Creates courses and links them to degrees. Includes both shared courses (assigned to multiple degrees) and degree-specific courses.

### 7. `add_professors.ps1`
Creates professor accounts and links them to courses.

### 8. `add_semesters.ps1`
Creates academic semesters (Fall/Spring) with start/end dates.

### 9. `add_session_types.ps1`
Creates session types (Lecture, Seminar) required for auto-scheduling. Each course offering needs both lecture and seminar sessions.

### 10. `add_time_slots.ps1`
Creates time slots for each day of the week (Monday-Friday, 8:00-18:00 in 2-hour blocks). Required for auto-scheduling to allocate class times.

### 11. `add_professor_availability.ps1`
Sets availability for all professors (Monday-Friday, 8:00-18:00). Required for auto-scheduling to know when professors can teach.

### 12. `add_course_curriculum.ps1`
Creates course curriculum entries linking courses to degrees with year and semester information. Required for auto-scheduling to know which courses belong to which curriculum.

### 13. `add_course_offerings.ps1`
Creates course offerings by linking courses to semesters and student groups. Automatically matches courses to the appropriate semester type (Fall/Spring) and year level.

### 14. `add_enrollments.ps1`
Enrolls students in course offerings. Uses the auto-enrollment endpoint to enroll all students in all available offerings. Includes commented-out example for manual enrollment logic.

## Usage

### Run all scripts in parallel:
```powershell
.\batch_requests\run_all.ps1
```

### Run individual scripts:
```powershell
.\batch_requests\add_faculties.ps1
.\batch_requests\add_degrees.ps1
# ... etc
```

## Dependencies

Scripts must be run in this order:
1. `add_faculties.ps1` (creates faculties)
2. `add_degrees.ps1` (depends on faculties)
3. `add_rooms.ps1` (independent)
4. `add_student_groups.ps1` (depends on degrees)
5. `add_students.ps1` (depends on groups and degrees)
6. `add_courses.ps1` (depends on degrees)
7. `add_professors.ps1` (depends on courses)
8. `add_semesters.ps1` (independent)
9. `add_session_types.ps1` (independent, but required for auto-scheduling)
10. `add_time_slots.ps1` (independent, but required for auto-scheduling)
11. `add_professor_availability.ps1` (depends on professors)
12. `add_course_curriculum.ps1` (depends on courses and degrees)
13. `add_course_offerings.ps1` (depends on courses, semesters, and groups)
14. `add_enrollments.ps1` (depends on students and course offerings)

## API Endpoints Used

- `POST /faculties/` - Create faculty
- `POST /degrees/` - Create degree
- `POST /rooms/` - Create room
- `POST /student-groups/` - Create student group
- `POST /users/` - Create user
- `POST /students/` - Create student
- `POST /courses/` - Create course
- `POST /professors/` - Create professor
- `POST /semesters/` - Create semester
- `POST /session-types/` - Create session type
- `POST /time-slots/` - Create time slot
- `POST /professor-availability/` - Create professor availability
- `POST /course-curriculum/` - Create course curriculum entry
- `POST /course-offerings/` - Create course offering
- `POST /enrollments/` - Create enrollment
- `POST /enrollments/auto/` - Auto-enroll all students to all offerings

## Customization

To customize the data added by these scripts, edit the respective `.ps1` file and modify the data arrays at the top of each script.

## Example: Adding a single item via API

```powershell
# Add a single course
Invoke-RestMethod -Method Post -Uri "http://localhost:8000/courses/" `
  -ContentType "application/json" `
  -Body '{"c_name": "Course Name", "c_abbr": "ABBR", "c_difficulty_weight": 3, "c_year": 1, "c_semester": 1, "degree_ids": [1]}'

# Add a single semester
Invoke-RestMethod -Method Post -Uri "http://localhost:8000/semesters/" `
  -ContentType "application/json" `
  -Body '{"sem_name": "Fall 2024", "start_date": "2024-09-01", "end_date": "2025-01-15", "is_special_semester": false, "week_count": 15}'

# Add a single session type
Invoke-RestMethod -Method Post -Uri "http://localhost:8000/session-types/" `
  -ContentType "application/json" `
  -Body '{"type_name": "Lecture", "duration_hours": 2}'

# Add a single time slot
Invoke-RestMethod -Method Post -Uri "http://localhost:8000/time-slots/" `
  -ContentType "application/json" `
  -Body '{"day_of_week": "Monday", "start_time": "08:00", "end_time": "10:00"}'

# Add a single professor availability
Invoke-RestMethod -Method Post -Uri "http://localhost:8000/professor-availability/" `
  -ContentType "application/json" `
  -Body '{"u_id": 1, "day_of_week": "Monday", "start_time": "08:00", "end_time": "18:00", "is_available": true}'

# Add a single course curriculum entry
Invoke-RestMethod -Method Post -Uri "http://localhost:8000/course-curriculum/" `
  -ContentType "application/json" `
  -Body '{"c_id": 1, "degree_id": 1, "year_level": 1, "is_active": true, "semester_number": 1}'

# Add a single course offering
Invoke-RestMethod -Method Post -Uri "http://localhost:8000/course-offerings/" `
  -ContentType "application/json" `
  -Body '{"c_id": 1, "sem_id": 1, "max_students": 30, "group_id": 1, "hrs_per_week": 4}'

# Add a single enrollment
Invoke-RestMethod -Method Post -Uri "http://localhost:8000/enrollments/" `
  -ContentType "application/json" `
  -Body '{"offering_id": 1, "u_id": 1}'

# Auto-enroll all students to all offerings
Invoke-RestMethod -Method Post -Uri "http://localhost:8000/enrollments/auto/"
```
