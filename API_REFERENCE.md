# Auto-Scheduling API Quick Reference Card

## Initialization

```bash
# Initialize session types (run once after database creation)
cd backend
python init_db.py

# Output should show:
# Session types initialized successfully
#   - Lecture (2 hours)
#   - Seminar (2 hours)
```

---

## Session Types Management

### Get All Session Types
```bash
curl http://localhost:8000/session-types/
```
Response:
```json
[
  {"session_type_id": 1, "type_name": "Lecture", "duration_hours": 2},
  {"session_type_id": 2, "type_name": "Seminar", "duration_hours": 2}
]
```

### Create Session Type
```bash
curl -X POST http://localhost:8000/session-types/ \
  -H "Content-Type: application/json" \
  -d '{
    "type_name": "Lab",
    "duration_hours": 3
  }'
```

### Get Specific Session Type
```bash
curl http://localhost:8000/session-types/1
```

### Update Session Type
```bash
curl -X PUT http://localhost:8000/session-types/1 \
  -H "Content-Type: application/json" \
  -d '{
    "type_name": "Lecture",
    "duration_hours": 2
  }'
```

### Delete Session Type
```bash
curl -X DELETE http://localhost:8000/session-types/1
```

---

## Auto-Schedule Generation

### Generate Schedule for Semester

**Endpoint**: `POST /auto-schedule/generate`

**Query Parameter**:
- `semester_id` (required): The ID of the semester to schedule

```bash
curl -X POST "http://localhost:8000/auto-schedule/generate?semester_id=1"
```

**Response** (Success):
```json
{
  "status": "success",
  "semester_id": 1,
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
      "slot_id": 1
    },
    {
      "offering_id": 12,
      "course": "Data Structures",
      "group": "SE1",
      "type": "Seminar",
      "room": "A3",
      "day": "Tuesday",
      "slot_id": 7
    },
    ...
  ],
  "message": "Successfully generated schedule with 12 offerings"
}
```

**Response** (Error):
```json
{"detail": "Semester not found"}
// or
{"detail": "No active courses found for this semester"}
// or
{"detail": "Session types not properly configured"}
```

---

## Validate Schedule

### Validate Schedule for Conflicts

**Endpoint**: `GET /auto-schedule/validate/{semester_id}`

```bash
curl "http://localhost:8000/auto-schedule/validate/1"
```

**Response**:
```json
{
  "semester_id": 1,
  "semester_name": "Fall 2026",
  "total_offerings": 12,
  "issues": [],
  "warnings": [],
  "is_valid": true
}
```

**With Issues**:
```json
{
  "semester_id": 1,
  "semester_name": "Fall 2026",
  "total_offerings": 12,
  "issues": [
    "Room conflict in A2 at slot 1",
    "Room conflict in A3 at slot 7"
  ],
  "warnings": [
    "Offering 15 missing lecture or seminar",
    "Offering 16 missing lecture or seminar"
  ],
  "is_valid": false
}
```

---

## Clear Schedule

### Clear All Schedules for Semester

**Endpoint**: `DELETE /auto-schedule/clear/{semester_id}`

```bash
curl -X DELETE "http://localhost:8000/auto-schedule/clear/1"
```

**Response**:
```json
{
  "status": "success",
  "message": "Cleared 48 schedule entries for semester Fall 2026"
}
```

---

## Typical Workflow

### 1. Check Existing Session Types
```bash
curl http://localhost:8000/session-types/
```

### 2. Generate Schedule
```bash
curl -X POST "http://localhost:8000/auto-schedule/generate?semester_id=1"
```

### 3. Validate Results
```bash
curl "http://localhost:8000/auto-schedule/validate/1"
```

### 4. If Valid, Done! If Not, Clear and Regenerate
```bash
# Clear
curl -X DELETE "http://localhost:8000/auto-schedule/clear/1"

# Fix data (adjust professor availability, add rooms, etc.)

# Regenerate
curl -X POST "http://localhost:8000/auto-schedule/generate?semester_id=1"
```

---

## Python Examples

### Initialize
```python
import subprocess
subprocess.run(["python", "init_db.py"], cwd="backend")
```

### Generate Schedule
```python
import requests

url = "http://localhost:8000/auto-schedule/generate"
params = {"semester_id": 1}

response = requests.post(url, params=params)
result = response.json()

print(f"Status: {result['status']}")
print(f"Offerings Created: {result['offerings_created']}")
for schedule in result['schedule_details']:
    print(f"  {schedule['course']} ({schedule['group']}) - "
          f"{schedule['type']} - {schedule['day']} - Room {schedule['room']}")
```

### Validate Schedule
```python
import requests

url = "http://localhost:8000/auto-schedule/validate/1"
response = requests.get(url)
validation = response.json()

if validation['is_valid']:
    print("✓ Schedule is valid!")
else:
    print("✗ Schedule has conflicts:")
    for issue in validation['issues']:
        print(f"  - {issue}")
```

### Clear and Regenerate
```python
import requests

# Clear
requests.delete("http://localhost:8000/auto-schedule/clear/1")

# Regenerate
response = requests.post("http://localhost:8000/auto-schedule/generate?semester_id=1")
print(response.json()['message'])
```

---

## Common Parameters

### Semester ID
- Type: `integer`
- Required: `yes`
- Example: `1`, `4`, `10`

### Session Type Name
- Type: `enum`
- Values: `"Lecture"`, `"Seminar"`
- Default duration: `2` hours

---

## Database Queries (Direct)

### View Session Types
```sql
SELECT * FROM session_type;
```

### View Offered Schedules for Semester
```sql
SELECT 
  os.schedule_id,
  co.offering_id,
  c.c_name,
  sg.group_name,
  st.type_name,
  r.room_id,
  ts.day_of_week,
  ts.start_time
FROM offering_schedule os
JOIN course_offering co ON os.offering_id = co.offering_id
JOIN course c ON co.c_id = c.c_id
JOIN student_group sg ON co.group_id = sg.group_id
JOIN session_type st ON os.session_type_id = st.session_type_id
JOIN rooms r ON os.room_id = r.room_id
JOIN time_slots ts ON os.slot_id = ts.slot_id
WHERE co.sem_id = 1
ORDER BY ts.day_of_week, ts.start_time;
```

### Check Schedule Conflicts
```sql
-- Find rooms with double bookings
SELECT 
  os1.room_id,
  os1.slot_id,
  COUNT(*) as booking_count
FROM offering_schedule os1
WHERE os1.s_status != 'cancelled'
GROUP BY os1.room_id, os1.slot_id
HAVING COUNT(*) > 1;
```

### View Professor Workload
```sql
SELECT 
  u.fname,
  u.lname,
  COUNT(DISTINCT co.offering_id) as courses_assigned,
  COUNT(os.schedule_id) as sessions
FROM user u
JOIN prof p ON u.u_id = p.u_id
LEFT JOIN offering_professors op ON p.u_id = op.u_id
LEFT JOIN course_offering co ON op.offering_id = co.offering_id
LEFT JOIN offering_schedule os ON co.offering_id = os.offering_id
GROUP BY u.u_id, u.fname, u.lname;
```

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 404 | Not Found (semester, session type) |
| 500 | Server Error (scheduling failed) |

---

## Error Handling

### If generation fails:
```bash
# Check session types exist
curl http://localhost:8000/session-types/

# Check semester exists
curl http://localhost:8000/semesters/

# Check for active courses
curl http://localhost:8000/course-curriculum/
```

### Common Errors:

**"Session types not properly configured"**
```bash
# Solution:
python init_db.py
```

**"No active courses found for this semester"**
```bash
# Solution: Ensure course_curriculum entries have is_active=true
# Check database:
SELECT * FROM course_curriculum WHERE is_active=true AND semester_number=1;
```

**"Semester not found"**
```bash
# Solution: Create semester first
curl -X POST http://localhost:8000/semesters/ ...
```

---

## Endpoints Summary Table

| Method | Endpoint | Purpose | Params |
|--------|----------|---------|--------|
| POST | `/auto-schedule/generate` | Generate schedule | semester_id |
| GET | `/auto-schedule/validate/{id}` | Validate schedule | - |
| DELETE | `/auto-schedule/clear/{id}` | Clear schedule | - |
| GET | `/session-types/` | List types | skip, limit |
| POST | `/session-types/` | Create type | body |
| GET | `/session-types/{id}` | Get type | - |
| PUT | `/session-types/{id}` | Update type | body |
| DELETE | `/session-types/{id}` | Delete type | - |

---

## Response Time Guidelines

| Operation | Typical Time |
|-----------|--------------|
| Generate (10 courses) | 1-2 seconds |
| Generate (50 courses) | 3-5 seconds |
| Generate (100+ courses) | 5-10 seconds |
| Validate | < 0.5 seconds |
| Clear | < 0.5 seconds |

---

## Debugging Tips

### 1. Enable Request Logging
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

### 2. Check Request Details
```python
import requests
response = requests.post(url, json=data)
print(response.status_code)
print(response.text)
print(response.headers)
```

### 3. Inspect Database State
```sql
-- Before generation
SELECT COUNT(*) FROM offering_schedule;

-- After generation
SELECT COUNT(*) FROM offering_schedule;
```

### 4. Validate Prerequisites
```sql
-- Check session types
SELECT * FROM session_type;

-- Check time slots
SELECT COUNT(*) FROM time_slots;

-- Check professors
SELECT COUNT(*) FROM prof;

-- Check active curriculum
SELECT COUNT(*) FROM course_curriculum WHERE is_active=true;
```

---

**Last Updated**: 2026-04-17  
**Version**: 1.0  
**Status**: Production Ready
