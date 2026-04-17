# Auto-Scheduling Architecture & Data Flow

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTO-SCHEDULING ENGINE                       │
└─────────────────────────────────────────────────────────────────┘

Input: Semester ID
       ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: Fetch Curriculum for Semester                           │
│  Query: course_curriculum WHERE is_active=true                 │
│         AND semester_number = semester_id                       │
└─────────────────────────────────────────────────────────────────┘
       ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: For Each Course in Curriculum                           │
│  - Find matching student_groups (degree_id, year_level)         │
│  - Create course_offering per group                             │
└─────────────────────────────────────────────────────────────────┘
       ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: Assign Professors to Offerings                          │
│  - Query professors from prof table                             │
│  - Create offering_professors entries                           │
└─────────────────────────────────────────────────────────────────┘
       ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: Schedule Lecture Sessions (2 hours)                     │
│  For Days: Monday, Wednesday, Friday                            │
│  - Check professor_availability                                 │
│  - Find available time_slots                                    │
│  - Allocate room with sufficient capacity                       │
│  - Create offering_schedule with session_type_id=1              │
└─────────────────────────────────────────────────────────────────┘
       ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: Schedule Seminar Sessions (2 hours)                     │
│  For Days: Tuesday, Thursday                                    │
│  - Check professor_availability                                 │
│  - Find available time_slots                                    │
│  - Allocate room with sufficient capacity                       │
│  - Create offering_schedule with session_type_id=2              │
└─────────────────────────────────────────────────────────────────┘
       ↓
Output: Schedule Details + Status
```

## Database Relationships

```
          ┌─────────────┐
          │   semester  │
          │ (sem_id)    │
          └──────┬──────┘
                 │
                 │ sem_id (FK)
                 ↓
    ┌────────────────────────┐
    │ course_curriculum      │
    │ (semester_number)      │
    └────────┬───────┬───────┘
             │       │
        c_id │       │ degree_id
             │       │
      ┌──────▼──┐    │     ┌─────────────┐
      │ course  │    │     │    degree   │
      │(c_id)  │    │     │  (d_id)     │
      └────┬────┘    │     └─────────────┘
           │ c_id    │
        (FK)│        │ deg_id (FK)
           │ ┌───────▼──────────────┐
           │ │ student_group        │
           │ │ (group_id)           │
           │ └───────┬──────────────┘
           │         │ group_id (FK)
           │ ┌───────▼──────────────┐
           │ │ course_offering      │
     ┌─────┼─│ (offering_id)        │
     │ ┌───┼─│      c_id (FK)       │
     │ │   │ │    group_id (FK)     │
     │ │   │ └───────┬──────────────┘
     │ │   │         │ offering_id (FK)
     │ │   │    ┌────▼────────────────┐
     │ │   │    │ offering_schedule   │
     │ │   │    │ (schedule_id)       │
     │ │   │    │   offering_id (FK)  │
     │ │   │    │   room_id (FK)      │
     │ │   │    │   slot_id (FK)      │
     │ │   │    │ session_type_id(FK) │◄─────────┐
     │ │   │    └────────────────────┘          │
     │ │   │                                    │
     │ │   └────────────────────────────────────┤
     │ │                                        │
     │ │      ┌──────────────────┐          ┌────┴──────────┐
     │ │      │  time_slots      │          │ session_type  │
     │ │      │  (slot_id)       │          │(session_type_id)
     │ │      └──────────────────┘          │  type_name    │
     │ │                                    │  duration_hrs │
     │ │      ┌──────────────────┐          └───────────────┘
     │ │      │    rooms         │
     │ │      │  (room_id)       │
     │ │      │  (capacity)      │
     │ │      └──────────────────┘
     │ │
     │ └─── offering_professors ────────────┐
     │      (offering_prof_id)              │
     │      offering_id (FK)                │
     │      u_id (FK)                       │
     │                                      │
     └──────────────────────────┬───────────┘
                                │
                         ┌──────▼────────┐
                         │     prof      │
                         │   (u_id)      │
                         │     u_id(FK)──┼────────┐
                         └────────────────┘        │
                                                   │
                                      ┌────────────▼───────────┐
                                      │        user           │
                                      │     (u_id)            │
                                      │  fname, lname, email  │
                                      │  username, password   │
                                      │  u_role: professor    │
                                      └───────────────────────┘

                         ┌──────────────────────────┐
                         │ professor_availability   │
                         │ (id)                     │
                         │ u_id (FK) → prof.u_id   │
                         │ day_of_week              │
                         │ start_time, end_time     │
                         │ is_available             │
                         └──────────────────────────┘

                         ┌──────────────────────────┐
                         │ professor_unavailability │
                         │ (id)                     │
                         │ u_id (FK) → prof.u_id   │
                         │ date (specific date)     │
                         │ start_time, end_time     │
                         │ reason                   │
                         └──────────────────────────┘
```

## Data Flow Example

### Scenario: Generate Schedule for Fall 2026 (semester_id = 4)

#### Input Data Available:
```
Semester:
  sem_id: 4
  sem_name: "Fall 2026"

Course Curriculum Active:
  - Data Structures (c_id: 5, degree: 2, year: 3, is_active: true)
  - Algorithms (c_id: 6, degree: 2, year: 3, is_active: true)

Student Groups:
  - SE1 (group_id: 3, deg_id: 2, year_level: 3)
  - SE2 (group_id: 4, deg_id: 2, year_level: 3)

Professors:
  - Dr. Smith (u_id: 8)
  - Dr. Jones (u_id: 9)

Professor Availability:
  - Smith: Mon-Fri 08:00-14:00
  - Jones: Mon-Fri 09:00-15:00

Time Slots (Examples):
  slot_id: 1, Monday, 08:00-09:30
  slot_id: 2, Monday, 09:30-11:00
  slot_id: 7, Tuesday, 08:00-09:30
  slot_id: 8, Tuesday, 09:30-11:00
  ...

Rooms:
  A2 (capacity: 50)
  A3 (capacity: 60)
  B1 (capacity: 30)

Session Types:
  session_type_id: 1, type: "Lecture" (2 hrs)
  session_type_id: 2, type: "Seminar" (2 hrs)
```

#### Processing:

**Step 1: Fetch Curriculum**
```
SELECT course_curriculum
WHERE is_active = true AND semester_number = 4

Result:
  - Data Structures (c_id: 5)
  - Algorithms (c_id: 6)
```

**Step 2: Create Course Offerings**
For Data Structures:
```
Create course_offering:
  offering_id: 12
  c_id: 5 (Data Structures)
  sem_id: 4 (Fall 2026)
  group_id: 3 (SE1)
  max_students: 40
  hrs_per_week: 4

Create course_offering:
  offering_id: 13
  c_id: 5 (Data Structures)
  sem_id: 4 (Fall 2026)
  group_id: 4 (SE2)
  max_students: 40
  hrs_per_week: 4

(Repeat for Algorithms)
Total: 4 offerings (2 courses × 2 groups)
```

**Step 3: Assign Professors**
```
Create offering_professors:
  offering_id: 12 → u_id: 8 (Dr. Smith)
  offering_id: 13 → u_id: 9 (Dr. Jones)
  offering_id: 14 → u_id: 8 (Dr. Smith)
  offering_id: 15 → u_id: 9 (Dr. Jones)
```

**Step 4: Schedule Lectures (2 hours)**

For Offering 12 (Data Structures, SE1):
```
Try Monday:
  - Professor (Smith) available 08:00-14:00? YES
  - Find slot: slot_id 1 (08:00-09:30) ✓
  - Room available: A2 (capacity 50 ≥ 40) ✓
  
Create offering_schedule:
  schedule_id: 31
  offering_id: 12
  session_type_id: 1 (Lecture)
  room_id: "A2"
  slot_id: 1
  s_status: "scheduled"
  createdAt: 2026-09-01
```

**Step 5: Schedule Seminars (2 hours)**

For Offering 12 (Data Structures, SE1):
```
Try Tuesday:
  - Professor (Smith) available 08:00-14:00? YES
  - Find slot: slot_id 7 (08:00-09:30) ✓
  - Room available: A3 (capacity 50 ≥ 40) ✓
  
Create offering_schedule:
  schedule_id: 32
  offering_id: 12
  session_type_id: 2 (Seminar)
  room_id: "A3"
  slot_id: 7
  s_status: "scheduled"
  createdAt: 2026-09-01
```

#### Final Result:
```
For Fall 2026:
  - Created 4 course offerings
  - Created 8 schedule entries (4 offerings × 2 sessions each)
  - Response shows all sessions with room and time assignments
  
offering_schedule entries:
  31: Data Structures/SE1 - Lecture - A2 - Monday 08:00
  32: Data Structures/SE1 - Seminar - A3 - Tuesday 08:00
  33: Data Structures/SE2 - Lecture - B1 - Monday 09:30
  34: Data Structures/SE2 - Seminar - A2 - Tuesday 09:30
  35: Algorithms/SE1 - Lecture - A3 - Wednesday 08:00
  36: Algorithms/SE1 - Seminar - B1 - Thursday 08:00
  37: Algorithms/SE2 - Lecture - A2 - Wednesday 09:30
  38: Algorithms/SE2 - Seminar - A3 - Thursday 09:30
```

## API Call Sequence

```
1. POST /session-types/
   - Create Lecture (2 hrs)
   - Create Seminar (2 hrs)

2. POST /semester/
   - Create Fall 2026

3. POST /time-slots/
   - Create slots for Mon-Fri

4. POST /rooms/
   - Create classrooms

5. POST /faculty/, /degrees/, /student-groups/
   - Setup academic hierarchy

6. POST /user/ (professor)
   POST /professor/

7. POST /professor-availability/
   - Set availability MON-FRI

8. POST /course/
   POST /course-curriculum/
   - Setup curriculum with is_active=true

9. POST /auto-schedule/generate?semester_id=4
   ↓
   System generates all offerings and schedules

10. GET /auto-schedule/validate/4
    ↓
    Validates for conflicts
```

## Validation Checks

The validation endpoint checks:

```
For each offering_schedule:
  ✓ Room not double-booked at same slot
  ✓ Professor availability respected
  ✓ Each offering has lecture + seminar
  ✓ No schedule conflicts

Returns:
  - issues: Critical problems (conflicts)
  - warnings: Non-critical alerts
  - is_valid: Overall schedule validity
```

## Troubleshooting Graph

```
Problem: Schedule Generation Failed
  ├─ Session types not found?
  │  └─ Run: python init_db.py
  ├─ No curriculum entries?
  │  └─ Create course_curriculum with is_active=true
  ├─ Professor not assigned?
  │  └─ Add professors to system
  └─ No available slots?
     └─ Check professor availability covers needed times

Problem: Validation Warnings
  ├─ Missing lecture/seminar?
  │  └─ Expand professor availability windows
  ├─ Room conflicts?
  │  └─ Add more rooms
  └─ Too many offerings?
     └─ Add more professors or time slots
```

## Performance Considerations

For 100 offerings generated:
- Typical execution: 2-5 seconds
- Database transactions: ~500+ inserts
- No external API calls
- Linear complexity with offering count

## Future Optimizations

1. **Parallel Processing**: Generate for multiple semesters simultaneously
2. **Caching**: Cache professor availability for faster lookup
3. **Load Balancing**: Distribute offerings to minimize professor workload
4. **ML-Based Assignment**: Use historical data to optimize assignments
5. **Conflict Resolution**: Automatically suggest fixes for conflicts
