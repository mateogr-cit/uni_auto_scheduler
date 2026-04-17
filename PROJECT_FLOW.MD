<!-- Purpose: Base authentication table for all system users (students & professors).  
Used for: Login, identity management, and linking to role-specific tables. -->

user:
    u_id pk,
    fname,
    lname,
    email unique,
    username unique,
    password,
    u_role enum("student", "professor"),
    createdAt,
    updatedAt,

user{
    u_id: 15
    fname: "Ardit"
    lname: "Hoxha"
    email: "ardit.hoxha@uni.edu"
    username: "ahoxha"
    password: "hashed_pw"
    u_role: "student"
    createdAt: 2026-01-10
    updatedAt: 2026-01-10
}


<!-- Purpose: Identifies which users are professors.
Used for: Linking professors to offerings and availability. -->
prof:
    u_id pk fk,

prof{
    u_id: 8
}

<!-- Purpose: Identifies which users are students and assigns them to a group.
Used for: Enrollment, timetable generation. -->
student:
    u_id pk fk,
    s_status enum("active", "inactive"),
    group_id fk

student{
    u_id: 15
    s_status: "active"
    group_id: 3
}

<!-- Purpose: Represents academic split groups (SE1, SE2…).
Used for: Scheduling per group and curriculum mapping. -->
student_group
    group_id pk
    group_name      -- SE1, SE2, SE3
    deg_id fk
    year_level
    semester_number
    capacity
    createdAt
    updatedAt

student_group{
    group_id: 3
    group_name: "SE1"
    degree_id: 2
    year_level: 3
    semester_number: 2
    capacity: 40
    createdAt: 2026-01-01
    updatedAt: 2026-01-01
}

<!-- Purpose: Stores student or professor complaints.
Used for: Administrative tracking. -->
complaints:
    comp_id pk,
    u_id fk,
    comp_text,
    createdAt

complaints{
    comp_id: 21
    u_id: 15
    comp_text: "Schedule conflict between two courses."
    createdAt: 2026-10-03
}

<!-- Purpose: Static course definition (e.g., Data Structures).
Used for: Curriculum and offerings. -->
course:
    c_id pk,
    c_name,
    c_abbr,
    c_difficulty_weight

course{
    c_id: 5
    c_name: "Data Structures"
    c_abbr: "CS301"
    c_difficulty_weight: 3
}

<!-- Purpose: Represents an academic semester.
Used for: Grouping offerings. -->

semester: 
    sem_id pk,
    sem_name (for example "Fall 2026"),
    start_date,
    end_date,
    is_special_semester,--diff for Y3S2,
    week_count default = 15,  

semester{
    sem_id: 4
    sem_name: "Fall 2026"
    start_date: 2026-09-15
    end_date: 2027-01-15
    is_special_semester: true
    week_count: 15
}
<!-- Purpose: A specific course instance for a group in a semester.
Used for: Scheduling and enrollment. -->
course_offering:
    offering_id pk,
    c_id fk,
    sem_id fk,
    max_students,
    group_id,
    hrs_per_week default=4

course_offering{
    offering_id: 12
    c_id: 5
    sem_id: 4
    max_students: 40
    group_id: 3
    hrs_per_week: 5
}

<!-- Purpose: Physical classrooms.
Used for: Room conflict detection. -->

rooms:
    room_id pk,
    capacity

rooms{
    room_id: "A2"
    capacity: 50
}

<!-- Purpose: Defines reusable weekly time blocks.
Used for: Scheduling sessions. -->

time_slots
    slot_id pk,
    day_of_week enum("Monday","Tuesday","Wednesday","Thursday","Friday"),
    start_time,
    end_time

time_slots{
    slot_id: 10
    day_of_week: "Monday"
    start_time: 10:00
    end_time: 11:30
}

<!-- Purpose: Defines session types for courses (e.g., Lecture, Seminar).
Used for: Differentiating between course components. -->

session_type:
    session_type_id pk,
    type_name enum("Lecture", "Seminar"),
    duration_hours int default=2

session_type{
    session_type_id: 1
    type_name: "Lecture"
    duration_hours: 2
}

<!-- Purpose: Assigns offering sessions to a room + time slot.
Used for: Generating timetables. Each course has mandatory 2hr lecture + 2hr seminar. -->

offering_schedule:
    schedule_id pk,
    offering_id fk,
    room_id fk,
    slot_id fk,
    session_type_id fk,   -- Links to session type (Lecture or Seminar)
    s_status,
    createdAt,
    updatedAt

offering_schedule{
    schedule_id: 31
    offering_id: 12
    room_id: 2
    slot_id: 10
    session_type_id: 1    -- Lecture session
    s_status: "scheduled"
    createdAt: 2026-09-01
    updatedAt: 2026-09-01
}

offering_schedule{
    schedule_id: 32
    offering_id: 12
    room_id: 3
    slot_id: 11
    session_type_id: 2    -- Seminar session (same offering)
    s_status: "scheduled"
    createdAt: 2026-09-01
    updatedAt: 2026-09-01
}

<!-- Purpose: Connects professors to course offerings.
Used for: Professor timetable & conflict checks. -->

offering_professors:
    offering_prof_id pk,
    offering_id fk,
    u_id fk

offering_professors{
    offering_prof_id: 6
    offering_id: 12
    u_id: 8
}

<!-- Purpose: Weekly recurring availability pattern.
Used for: Prevent scheduling outside available hours. -->
professor_availability:
    id pk,
    u_id fk,   -- professor id
    day_of_week enum("Monday"...),
    start_time,
    end_time,
    is_available boolean

professor_availability{
    id: 14
    u_id: 8
    day_of_week: "Monday"
    start_time: 08:00
    end_time: 14:00
    is_available: true
}
<!-- Purpose: One-time exceptions (specific date absence).
Used for: Cancelling/rescheduling specific sessions. -->

professor_unavailability :
    id pk,
    u_id fk,
    date,               -- specific date (2026-10-12)
    start_time,
    end_time,
    reason,
    createdAt

professor_unavailability{
    id: 9
    u_id: 8
    date: 2026-10-12
    start_time: 10:00
    end_time: 11:30
    reason: "Conference"
    createdAt: 2026-10-01
}

<!-- Purpose: Links students to offerings.
Used for: Capacity checks & student timetable. -->
enrollment
    id pk,
    offering_id fk,
    u_id fk  -- student id
    enrolledAt

enrollment{
    id: 55
    offering_id: 12
    u_id: 15
    enrolledAt: 2026-09-20
}

<!-- Purpose: Top-level academic division.
Used for: Organizing degrees. -->
faculty: 
    f_id
    f_name 
    f_abbr
    createdAt

faculty{
    f_id: 1
    f_name: "Engineering Faculty"
    f_abbr: "ENG"
    createdAt: 2025-01-01
}

<!-- Purpose: Academic programme inside faculty.
Used for: Group & curriculum structure. -->
degree:
    d_id,
    d_name,
    f_id,
    degree_abbr,
    createdAt

degree{
    d_id: 2
    d_name: "Software Engineering"
    f_id: 1
    degree_abbr: "SE"
    createdAt: 2025-01-01
}

<!-- Purpose: Tracks student’s degree and year level.
Used for: Academic progression tracking. -->
student_degree:
    student_degree_id,
    u_id,
    deg_id,
    yr_lvl,
    createdAt,
    updatedAt

student_degree{
    student_degree_id: 11
    u_id: 15
    deg_id: 2
    yr_lvl: 3
    createdAt: 2024-10-01
    updatedAt: 2026-09-01

}

<!-- Purpose: Defines which courses belong to which degree/year/semester.
Used for: Auto-generating offerings for each group. -->
course_curriculum:
    course_year_ id,
    c_id,
    degree_id,
    year_level,
    is_active,
    semester_number,
    createdAt

course_curriculum{
    id: 18
    c_id: 5
    degree_id: 2
    year_level: 3
    semester_number: 2
    is_active: true
    createdAt: 2025-01-01
}

---

## AUTO-SCHEDULING SYSTEM

### Overview
The system now includes an **automated schedule generation engine** that creates timetables based on course curriculum, professor availability, and room allocation. Each course has mandatory 2-hour lecture + 2-hour seminar sessions.

### Key Features
- ✅ **Automatic Course Offering Creation**: Creates offerings for all courses in curriculum for a semester
- ✅ **Session Type Management**: Distinguishes between Lecture and Seminar components
- ✅ **Professor Availability Checking**: Respects working hours and unavailability periods
- ✅ **Room Conflict Detection**: Prevents double-booking of rooms
- ✅ **Intelligent Room Allocation**: Matches room capacity to group size
- ✅ **Schedule Validation**: Identifies conflicts and missing components

### New Components Added

#### Models
- **SessionTypeModel**: Represents course session types (Lecture, Seminar)
- Updated **OfferingSchedule**: Now includes session_type_id to distinguish session types

#### Routes
- **session_types.py**: CRUD operations for session types
- **auto_schedule.py**: Core auto-scheduling algorithms and endpoints

#### Endpoints
- `POST /auto-schedule/generate?semester_id={id}`: Generate schedule
- `GET /auto-schedule/validate/{semester_id}`: Validate schedule
- `DELETE /auto-schedule/clear/{semester_id}`: Clear schedule
- `GET/POST/PUT/DELETE /session-types/`: Manage session types

### Usage Workflow

1. **Initialize Session Types**
   ```bash
   python init_db.py
   ```

2. **Prepare Data** (via API)
   - Create semester
   - Create time slots (at least 2 per day)
   - Create rooms with varying capacities
   - Create faculty, degrees, student groups
   - Create professors with availability
   - Create courses and curriculum entries (set `is_active=true`)

3. **Generate Schedule**
   ```bash
   curl -X POST "http://localhost:8000/auto-schedule/generate?semester_id=4"
   ```

4. **Validate Results**
   ```bash
   curl "http://localhost:8000/auto-schedule/validate/4"
   ```

5. **Adjust if Needed**
   - Clear and regenerate if conflicts detected
   - Update professor availability
   - Add more time slots or rooms

### Key Constraints
- Each course must have exactly 1 Lecture (2 hrs) + 1 Seminar (2 hrs)
- Lectures scheduled: Monday, Wednesday, Friday (or available slots)
- Seminars scheduled: Tuesday, Thursday (or available slots)
- Professor must be available during scheduled times
- Room capacity must ≥ group size

### For Detailed Documentation
See **AUTO_SCHEDULING_GUIDE.md** for:
- Complete API reference
- Setup instructions
- Algorithm details
- Troubleshooting guide
- Testing procedures
- Future enhancement roadmap