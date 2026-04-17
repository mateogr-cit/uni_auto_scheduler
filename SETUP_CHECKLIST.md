# Auto-Scheduling System - Quick Start Checklist

## Step 1: Database Setup ✅
- [x] SessionType model added to database schema
- [x] Offering_schedule table updated with session_type_id column

**Action Required**: 
```bash
cd backend
# Drop existing database or run migrations to add new columns
alembic upgrade head  # if using alembic
# OR recreate from scratch
python init_db.py     # Initializes session types after table creation
```

## Step 2: Initialize Session Types ✅
**Action Required**:
```bash
cd backend
python init_db.py
```
This creates:
- Lecture session type (2 hours)
- Seminar session type (2 hours)

## Step 3: Create Master Data (via API)

### 3.1 Create Semesters
```bash
POST http://localhost:8000/semesters/
{
  "sem_name": "Fall 2026",
  "start_date": "2026-09-15",
  "end_date": "2027-01-15",
  "is_special_semester": false,
  "week_count": 15
}
```

### 3.2 Create Time Slots (Recommended)
Create at least 6 slots per day (Monday-Friday = 30+ slots total):
```bash
POST http://localhost:8000/time-slots/

Morning Slots:
- 08:00-09:30
- 09:30-11:00
- 11:00-12:30

Afternoon Slots:
- 13:00-14:30
- 14:30-16:00
- 16:00-17:30
```

### 3.3 Create Rooms
```bash
POST http://localhost:8000/rooms/

Room A2: capacity 50
Room A3: capacity 60
Room B1: capacity 30
Room LAB1: capacity 40
```

### 3.4 Create Faculty
```bash
POST http://localhost:8000/faculty/
{
  "f_name": "Engineering Faculty",
  "f_abbr": "ENG"
}
```

### 3.5 Create Degrees
```bash
POST http://localhost:8000/degrees/
{
  "d_name": "Software Engineering",
  "f_id": 1,
  "degree_abbr": "SE"
}
```

### 3.6 Create Student Groups
```bash
POST http://localhost:8000/student-groups/
{
  "group_name": "SE1",
  "deg_id": 1,
  "year_level": 3,
  "semester_number": 2,
  "capacity": 40
}
```

### 3.7 Create Professors
```bash
POST http://localhost:8000/users/
{
  "fname": "John",
  "lname": "Doe",
  "email": "john.doe@uni.edu",
  "username": "jdoe",
  "password": "password123",
  "u_role": "professor"
}

POST http://localhost:8000/professors/
{
  "u_id": [professor_user_id]
}
```

### 3.8 Set Professor Availability
```bash
POST http://localhost:8000/professor-availability/

For Each Day (Mon-Fri):
{
  "u_id": 8,
  "day_of_week": "Monday",
  "start_time": "08:00",
  "end_time": "14:00",
  "is_available": true
}
```

### 3.9 Create Courses
```bash
POST http://localhost:8000/courses/
{
  "c_name": "Data Structures",
  "c_abbr": "CS301",
  "c_difficulty_weight": 3
}
```

### 3.10 Create Course Curriculum
```bash
POST http://localhost:8000/course-curriculum/
{
  "c_id": 1,
  "degree_id": 1,
  "year_level": 3,
  "semester_number": 2,
  "is_active": true
}
```

## Step 4: Generate Schedule

```bash
POST http://localhost:8000/auto-schedule/generate?semester_id=1
```

Expected Response:
```json
{
  "status": "success",
  "semester_id": 1,
  "semester_name": "Fall 2026",
  "offerings_created": 2,
  "schedule_details": [
    {
      "offering_id": 1,
      "course": "Data Structures",
      "group": "SE1",
      "type": "Lecture",
      "room": "A2",
      "day": "Monday",
      "slot_id": 1
    },
    {
      "offering_id": 1,
      "course": "Data Structures",
      "group": "SE1",
      "type": "Seminar",
      "room": "A3",
      "day": "Tuesday",
      "slot_id": 7
    }
  ],
  "message": "Successfully generated schedule with 2 offerings"
}
```

## Step 5: Validate Schedule

```bash
GET http://localhost:8000/auto-schedule/validate/1
```

Expected Response (if valid):
```json
{
  "semester_id": 1,
  "semester_name": "Fall 2026",
  "total_offerings": 2,
  "issues": [],
  "warnings": [],
  "is_valid": true
}
```

## Step 6: View Results in Database

Check `offering_schedule` table:
- Should have multiple entries per offering
- Each course offering should have 2 entries (Lecture + Seminar)
- session_type_id: 1 for lectures, 2 for seminars

## Step 7: Regenerate if Needed

If you need to regenerate:
```bash
# Clear existing schedule
DELETE http://localhost:8000/auto-schedule/clear/1

# Regenerate
POST http://localhost:8000/auto-schedule/generate?semester_id=1
```

## Testing in Python

```python
import requests

BASE_URL = "http://localhost:8000"

# Check session types exist
response = requests.get(f"{BASE_URL}/session-types/")
print(response.json())

# Generate schedule
response = requests.post(f"{BASE_URL}/auto-schedule/generate?semester_id=1")
print(response.json())

# Validate
response = requests.get(f"{BASE_URL}/auto-schedule/validate/1")
result = response.json()
print(f"Valid: {result['is_valid']}")
if result['issues']:
    print(f"Issues: {result['issues']}")
```

## Common Issues & Fixes

### "Session types not properly configured"
→ Run `python init_db.py`

### "No active courses found for this semester"
→ Check course_curriculum entries have `is_active=true`

### "Offering missing lecture or seminar"
→ Professor availability too limited; expand availability or add more professors

### "No suitable room found"
→ Create more rooms or increase room capacities

### Database table doesn't have session_type_id column
→ Recreate tables: `Base.metadata.create_all(bind=engine)`

## Files Modified/Created

### New Files:
- `backend/routes/auto_schedule.py` - Main scheduling service
- `backend/routes/session_types.py` - Session type CRUD
- `backend/init_db.py` - Database initialization
- `AUTO_SCHEDULING_GUIDE.md` - Comprehensive documentation
- This checklist

### Modified Files:
- `backend/models.py` - Added SessionType model
- `backend/schemas.py` - Added SessionType schema
- `backend/main.py` - Registered new routers
- `backend/routes/__init__.py` - Exported new routers
- `PROJECT_FLOW.MD` - Updated schema definitions

## Next Steps

1. Test with minimal data (1 course, 1 professor, 1 group)
2. Gradually scale to full curriculum
3. Review generated schedules in database
4. Integrate with frontend to display schedules
5. Implement schedule visualization
6. Add manual adjustment capabilities

## Support

For detailed information, see:
- `AUTO_SCHEDULING_GUIDE.md` - Full API documentation and algorithm details
- `PROJECT_FLOW.MD` - Database schema overview
