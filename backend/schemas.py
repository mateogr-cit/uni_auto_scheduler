from __future__ import annotations
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date, time
import enum

class UserRole(str, enum.Enum):
    student = "student"
    professor = "professor"

class StudentStatus(str, enum.Enum):
    active = "active"
    inactive = "inactive"

class DayOfWeek(str, enum.Enum):
    Monday = "Monday"
    Tuesday = "Tuesday"
    Wednesday = "Wednesday"
    Thursday = "Thursday"
    Friday = "Friday"

# User schemas
class UserBase(BaseModel):
    fname: str
    lname: str
    email: str
    username: str
    u_role: UserRole

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    fname: Optional[str] = None
    lname: Optional[str] = None
    email: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    u_role: Optional[UserRole] = None

class User(UserBase):
    u_id: int
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

# Prof schemas
class ProfBase(BaseModel):
    u_id: Optional[int] = None

class ProfCreate(ProfBase):
    fname: Optional[str] = None
    lname: Optional[str] = None
    email: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    course_ids: Optional[List[int]] = None

class ProfUpdate(BaseModel):
    course_ids: Optional[List[int]] = None

class Prof(ProfBase):
    courses: List["Course"] = []

    class Config:
        from_attributes = True


# ProfessorAvailability schemas
class ProfessorAvailabilityBase(BaseModel):
    u_id: int
    day_of_week: DayOfWeek
    start_time: time
    end_time: time
    is_available: bool

class ProfessorAvailabilityCreate(ProfessorAvailabilityBase):
    pass

class ProfessorAvailabilityUpdate(BaseModel):
    day_of_week: Optional[DayOfWeek] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    is_available: Optional[bool] = None

class ProfessorAvailability(ProfessorAvailabilityBase):
    id: int

    class Config:
        from_attributes = True


# Student schemas
class StudentBase(BaseModel):
    u_id: int
    s_status: StudentStatus
    group_id: Optional[int] = None

class StudentCreate(StudentBase):
    pass

class StudentUpdate(BaseModel):
    s_status: Optional[StudentStatus] = None
    group_id: Optional[int] = None

class Student(StudentBase):
    class Config:
        from_attributes = True

# StudentGroup schemas
class StudentGroupBase(BaseModel):
    group_name: str
    deg_id: int
    year_level: int
    semester_number: int
    capacity: int

class StudentGroupCreate(StudentGroupBase):
    pass

class StudentGroup(StudentGroupBase):
    group_id: int
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

# Complaints schemas
class ComplaintsBase(BaseModel):
    u_id: int
    comp_text: str

class ComplaintsCreate(ComplaintsBase):
    pass

class Complaints(ComplaintsBase):
    comp_id: int
    createdAt: datetime

    class Config:
        from_attributes = True

# Course schemas
class CourseBase(BaseModel):
    c_name: str
    c_abbr: str
    c_difficulty_weight: float

class CourseCreate(CourseBase):
    pass

class Course(CourseBase):
    c_id: int

    class Config:
        from_attributes = True

Prof.update_forward_refs()

# Semester schemas
class SemesterBase(BaseModel):
    sem_name: str
    start_date: date
    end_date: date
    is_special_semester: bool
    week_count: Optional[int] = 15

class SemesterCreate(SemesterBase):
    pass

class Semester(SemesterBase):
    sem_id: int

    class Config:
        from_attributes = True

# CourseOffering schemas
class CourseOfferingBase(BaseModel):
    c_id: int
    sem_id: int
    max_students: int
    group_id: int
    hrs_per_week: Optional[int] = 4

class CourseOfferingCreate(CourseOfferingBase):
    pass

class CourseOffering(CourseOfferingBase):
    offering_id: int

    class Config:
        from_attributes = True

# Rooms schemas
class RoomsBase(BaseModel):
    room_id: str
    capacity: int

class RoomsCreate(RoomsBase):
    pass

class Rooms(RoomsBase):
    class Config:
        from_attributes = True

# TimeSlots schemas
class TimeSlotsBase(BaseModel):
    day_of_week: DayOfWeek
    start_time: time
    end_time: time

class TimeSlotsCreate(TimeSlotsBase):
    pass

class TimeSlots(TimeSlotsBase):
    slot_id: int

    class Config:
        from_attributes = True

# OfferingSchedule schemas
class OfferingScheduleBase(BaseModel):
    offering_id: int
    room_id: str
    slot_id: int
    s_status: Optional[str] = None

class OfferingScheduleCreate(OfferingScheduleBase):
    pass

class OfferingSchedule(OfferingScheduleBase):
    schedule_id: int
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

# OfferingProfessors schemas
class OfferingProfessorsBase(BaseModel):
    offering_id: int
    u_id: int

class OfferingProfessorsCreate(OfferingProfessorsBase):
    pass

class OfferingProfessors(OfferingProfessorsBase):
    offering_prof_id: int

    class Config:
        from_attributes = True

# ProfessorAvailability schemas
class ProfessorAvailabilityBase(BaseModel):
    u_id: int
    day_of_week: DayOfWeek
    start_time: time
    end_time: time
    is_available: bool

class ProfessorAvailabilityCreate(ProfessorAvailabilityBase):
    pass

class ProfessorAvailability(ProfessorAvailabilityBase):
    id: int

    class Config:
        from_attributes = True

# ProfessorUnavailability schemas
class ProfessorUnavailabilityBase(BaseModel):
    u_id: int
    date: date
    start_time: time
    end_time: time
    reason: Optional[str] = None

class ProfessorUnavailabilityCreate(ProfessorUnavailabilityBase):
    pass

class ProfessorUnavailability(ProfessorUnavailabilityBase):
    id: int
    createdAt: datetime

    class Config:
        from_attributes = True

# Enrollment schemas
class EnrollmentBase(BaseModel):
    offering_id: int
    u_id: int

class EnrollmentCreate(EnrollmentBase):
    pass

class Enrollment(EnrollmentBase):
    id: int
    enrolledAt: datetime

    class Config:
        from_attributes = True

# Faculty schemas
class FacultyBase(BaseModel):
    f_name: str
    f_abbr: str

class FacultyCreate(FacultyBase):
    pass

class Faculty(FacultyBase):
    f_id: int
    createdAt: datetime

    class Config:
        from_attributes = True

# Degree schemas
class DegreeBase(BaseModel):
    d_name: str
    f_id: int
    degree_abbr: str

class DegreeCreate(DegreeBase):
    pass

class Degree(DegreeBase):
    d_id: int
    createdAt: datetime

    class Config:
        from_attributes = True

# StudentDegree schemas
class StudentDegreeBase(BaseModel):
    u_id: int
    deg_id: int
    yr_lvl: int

class StudentDegreeCreate(StudentDegreeBase):
    pass

class StudentDegree(StudentDegreeBase):
    student_degree_id: int
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

# CourseCurriculum schemas
class CourseCurriculumBase(BaseModel):
    c_id: int
    degree_id: int
    year_level: int
    is_active: bool
    semester_number: int

class CourseCurriculumCreate(CourseCurriculumBase):
    pass

class CourseCurriculum(CourseCurriculumBase):
    course_year_id: int
    createdAt: datetime

    class Config:
        from_attributes = True