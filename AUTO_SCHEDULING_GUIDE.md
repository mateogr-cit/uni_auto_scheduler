# Auto-Scheduling System Documentation

## Overview

The auto-scheduling system automatically generates course schedules for a given semester based on course curriculum, professor availability, and room constraints. Each course is scheduled with mandatory 2-hour lecture + 2-hour seminar sessions.

## Database Schema Updates

### New Tables

#### 1. **session_type** Table
Defines the types of course sessions available in the system.

```
session_type:
    session_type_id pk (Integer)
    type_name enum("Lecture", "Seminar")
    duration_hours int default=2
```

**Purpose**: Differentiates between course components (lectures vs seminars)

**Example**:
```
session_type_id: 1, type_name: "Lecture", duration_hours: 2
session_type_id: 2, type_name: "Seminar", duration_hours: 2
```

### Modified Tables

#### 1. **offering_schedule** Table - Updated
Added `session_type_id` foreign key to link sessions to their type.

```
offering_schedule:
    schedule_id pk
    offering_id fk -> course_offering
    room_id fk -> rooms
    slot_id fk -> time_slots
    session_type_id fk -> session_type       [NEW]
    s_status varchar
    createdAt timestamp
    updatedAt timestamp
```

**Change**: Added `session_type_id` column to distinguish between lecture and seminar sessions for the same offering.

## API Endpoints

### 1. Auto-Scheduling Endpoints

#### Generate Schedule
```
POST /auto-schedule/generate

Query Parameters:
  - semester_id (int, required): The semester to generate schedule for

Response:
{
    "status": "success",
    "semester_id": 4,
    "semester_name": "Fall 2026",
    "offerings_created": 12,
    "schedule_details": [
        {
            "offering_id": 12,
            "course": "Data Structures",
            "group": "SE1",
            "type": "Lecture",
            "room": "A2",
            "day": "Monday",
            "slot_id": 10
        },
        ...
    ],
    "message": "Successfully generated schedule with 12 offerings"
}
```

#### Validate Schedule
```
GET /auto-schedule/validate/{semester_id}

Response:
{
    "semester_id": 4,
    "semester_name": "Fall 2026",
    "total_offerings": 12,
    "issues": [],
    "warnings": ["Offering 15 missing lecture or seminar"],
    "is_valid": true
}
```

#### Clear Schedule
```
DELETE /auto-schedule/clear/{semester_id}

Response:
{
    "status": "success",
    "message": "Cleared 48 schedule entries for semester Fall 2026"
}
```

### 2. Session Type Management Endpoints

#### Get All Session Types
```
GET /session-types/

Response:
[
    {
        "session_type_id": 1,
        "type_name": "Lecture",
        "duration_hours": 2
    },
    {
        "session_type_id": 2,
        "type_name": "Seminar",
        "duration_hours": 2
    }
]
```

#### Create Session Type
```
POST /session-types/

Request Body:
{
    "type_name": "Lecture",
    "duration_hours": 2
}

Response:
{
    "session_type_id": 1,
    "type_name": "Lecture",
    "duration_hours": 2
}
```

#### Get Specific Session Type
```
GET /session-types/{session_type_id}
```

#### Update Session Type
```
PUT /session-types/{session_type_id}
```

#### Delete Session Type
```
DELETE /session-types/{session_type_id}
```

## How Auto-Scheduling Works

### Algorithm Steps

1. **Fetch Curriculum Entries**
   - Retrieve all active `course_curriculum` entries for the target semester
   - Filter by `is_active = true` and `semester_number = semester_id`

2. **Create Course Offerings**
   - For each curriculum entry, find all matching `student_group`s (by degree, year level, semester)
   - Create a `course_offering` for each group (if not already existing)
   - Set `hrs_per_week = 4` (2 lecture + 2 seminar)

3. **Assign Professors**
   - Assign available professors to each offering
   - Link via `offering_professors` table
   - Current implementation: Simple first-available assignment (can be improved)

4. **Create Lecture Sessions (2 hours)**
   - Schedule lectures on Monday, Wednesday, Friday
   - Check professor availability for each day
   - Find available time slots
   - Allocate room with sufficient capacity
   - Create `offering_schedule` entry with `session_type_id = 1` (Lecture)

5. **Create Seminar Sessions (2 hours)**
   - Schedule seminars on Tuesday, Thursday
   - Repeat availability checks
   - Allocate different room if possible
   - Create `offering_schedule` entry with `session_type_id = 2` (Seminar)

### Constraint Handling

- **Professor Availability**: Checks `professor_availability` table
- **Professor Unavailability**: Respects one-time exceptions in `professor_unavailability`
- **Room Conflicts**: Ensures no double-booking of rooms
- **Room Capacity**: Selects rooms with capacity >= group size

## Setup Instructions

### 1. Initialize Session Types

After running migrations to create tables, initialize session types:

```bash
cd backend
python init_db.py
```

This creates:
- Session Type 1: Lecture (2 hours)
- Session Type 2: Seminar (2 hours)

### 2. Prepare Data

Before generating a schedule, ensure:

1. **Create Semesters**
   ```
   POST /semesters/
   {
       "sem_name": "Fall 2026",
       "start_date": "2026-09-15",
       "end_date": "2027-01-15",
       "is_special_semester": false,
       "week_count": 15
   }
   ```

2. **Create Time Slots**
   ```
   POST /time-slots/
   {
       "day_of_week": "Monday",
       "start_time": "08:00",
       "end_time": "11:30"
   }
   ```
   
   Recommend creating slots for:
   - 08:00-09:30, 09:30-11:00, 11:00-12:30 (Morning)
   - 13:00-14:30, 14:30-16:00, 16:00-17:30 (Afternoon)
   - For each day: Monday-Friday

3. **Create Rooms**
   ```
   POST /rooms/
   {
       "room_id": "A2",
       "capacity": 50
   }
   ```
   
   Create rooms with varying capacities:
   - Large: 100+ capacity for lectures
   - Medium: 50-60 capacity for group seminars
   - Small: 30-40 capacity for specialized seminars

4. **Create Faculty, Degrees, and Student Groups**
   - Degrees must have corresponding Faculties
   - Student Groups must specify degree, year level, and semester

5. **Setup Course Curriculum**
   ```
   POST /course-curriculum/
   {
       "c_id": 5,
       "degree_id": 2,
       "year_level": 3,
       "semester_number": 2,
       "is_active": true
   }
   ```

6. **Create Professors and Set Availability**
   ```
   POST /professor-availability/
   {
       "u_id": 8,
       "day_of_week": "Monday",
       "start_time": "08:00",
       "end_time": "14:00",
       "is_available": true
   }
   ```

### 3. Generate Schedule

```bash
curl -X POST "http://localhost:8000/auto-schedule/generate?semester_id=4"
```

### 4. Validate Schedule

```bash
curl "http://localhost:8000/auto-schedule/validate/4"
```

### 5. Clear and Regenerate (if needed)

```bash
curl -X DELETE "http://localhost:8000/auto-schedule/clear/4"
```

## Example Workflow

```python
# 1. Initialize session types
python init_db.py

# 2. Create necessary data via API
# - Create semester
# - Create time slots  
# - Create rooms
# - Create faculty, degrees, student groups
# - Create professors with availability
# - Create courses and curriculum

# 3. Generate schedule
requests.post("http://localhost:8000/auto-schedule/generate?semester_id=4")

# 4. Validate
response = requests.get("http://localhost:8000/auto-schedule/validate/4")
if response.json()["is_valid"]:
    print("Schedule is valid!")
else:
    print("Issues found:", response.json()["issues"])

# 5. If needed, clear and regenerate
requests.delete("http://localhost:8000/auto-schedule/clear/4")
```

## Data Requirements

For successful auto-scheduling:

| Resource | Required | Notes |
|----------|----------|-------|
| Semester | Yes | Must exist and have sem_id |
| Course Curriculum | Yes | Must have is_active=true |
| Student Groups | Yes | Must match curriculum criteria |
| Professors | Yes | At least 1 per course |
| Professor Availability | Yes | Define working hours |
| Time Slots | Yes | At least 2 per day (12+ total) |
| Rooms | Yes | At least 3 with varying capacities |

## Constraints & Rules

1. **Each course has exactly**:
   - 1 Lecture session (2 hours)
   - 1 Seminar session (2 hours)
   - Total: 4 hours per week

2. **Lecture sessions scheduled**:
   - Monday, Wednesday, Friday (flexible, attempts each day)

3. **Seminar sessions scheduled**:
   - Tuesday, Thursday (flexible, attempts each day)

4. **Professor availability must**:
   - Cover all scheduled sessions
   - No conflicts with other offerings

5. **Room allocation**:
   - Capacity >= Group size minimum
   - No double-booking

## Future Enhancements

1. **Advanced Professor Assignment**
   - Load balancing (distribute evenly)
   - Professor preference matching
   - Subject matter expertise matching

2. **Intelligent Room Allocation**
   - Equipment requirements
   - Lab vs lecture room distinction
   - Minimize room changes for students

3. **Student Preferences**
   - Avoid morning/evening slots if possible
   - Minimize back-to-back sessions

4. **Conflict Resolution**
   - Automatic conflict detection
   - Suggestion of alternatives
   - Manual override capabilities

5. **Schedule Optimization**
   - Minimize travel time between venues
   - Compact schedules for each group
   - Load balancing across days

## Troubleshooting

### Issue: "No active courses found for this semester"
**Solution**: Verify `course_curriculum` entries have `is_active=true` and correct `semester_number`

### Issue: "Session types not properly configured"
**Solution**: Run `python init_db.py` to initialize session types

### Issue: "Schedule has conflicts"
**Solution**: Run `/auto-schedule/validate/{semester_id}` to identify specific issues

### Issue: "Offering missing lecture or seminar"
**Solution**: Check professor availability - if no slots available, schedule cannot be created

## Testing

```bash
# Test initialization
curl http://localhost:8000/session-types/

# Test generation
curl -X POST "http://localhost:8000/auto-schedule/generate?semester_id=1"

# Test validation
curl http://localhost:8000/auto-schedule/validate/1

# Test cleanup
curl -X DELETE "http://localhost:8000/auto-schedule/clear/1"
```
