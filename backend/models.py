from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Boolean, Float, Date, Time, Table
from sqlalchemy.orm import relationship
from database import Base
import enum

class UserRole(enum.Enum):
    student = "student"
    professor = "professor"

class StudentStatus(enum.Enum):
    active = "active"
    inactive = "inactive"

class DayOfWeek(enum.Enum):
    Monday = "Monday"
    Tuesday = "Tuesday"
    Wednesday = "Wednesday"
    Thursday = "Thursday"
    Friday = "Friday"

professor_course_table = Table(
    "professor_course",
    Base.metadata,
    Column("u_id", Integer, ForeignKey("prof.u_id", ondelete="CASCADE"), nullable=False, primary_key=True),
    Column("c_id", Integer, ForeignKey("course.c_id", ondelete="CASCADE"), nullable=False, primary_key=True),
)

class Course(Base):
    __tablename__ = "course"
    c_id = Column(Integer, primary_key=True, index=True)
    c_name = Column(String, nullable=False)
    c_abbr = Column(String, nullable=False)
    c_difficulty_weight = Column(Float, nullable=False)
    professors = relationship("Prof", secondary=professor_course_table, back_populates="courses")
    
class User(Base):
    __tablename__ = "user"
    u_id = Column(Integer, primary_key=True, index=True)
    fname = Column(String, nullable=False)
    lname = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    username = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    u_role = Column(Enum(UserRole), nullable=False)
    createdAt = Column(DateTime, nullable=False)
    updatedAt = Column(DateTime, nullable=False)

class Prof(Base):
    __tablename__ = "prof"
    u_id = Column(Integer, ForeignKey("user.u_id", ondelete="CASCADE"), primary_key=True)
    courses = relationship("Course", secondary=professor_course_table, back_populates="professors")

class Student(Base):
    __tablename__ = "student"
    u_id = Column(Integer, ForeignKey("user.u_id", ondelete="CASCADE"), primary_key=True)
    s_status = Column(Enum(StudentStatus), nullable=False)
    group_id = Column(Integer, ForeignKey("student_group.group_id"), nullable=True)

class StudentGroup(Base):
    __tablename__ = "student_group"
    group_id = Column(Integer, primary_key=True, index=True)
    group_name = Column(String, nullable=False)
    deg_id = Column(Integer, ForeignKey("degree.d_id"))
    year_level = Column(Integer, nullable=False)
    semester_number = Column(Integer, nullable=False)
    capacity = Column(Integer, nullable=False)
    createdAt = Column(DateTime, nullable=False)
    updatedAt = Column(DateTime, nullable=False)

class Complaints(Base):
    __tablename__ = "complaints"
    comp_id = Column(Integer, primary_key=True, index=True)
    u_id = Column(Integer, ForeignKey("user.u_id", ondelete="CASCADE"))
    comp_text = Column(String, nullable=False)
    createdAt = Column(DateTime, nullable=False)


class Semester(Base):
    __tablename__ = "semester"
    sem_id = Column(Integer, primary_key=True, index=True)
    sem_name = Column(String, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    is_special_semester = Column(Boolean, nullable=False)
    week_count = Column(Integer, default=15)

class CourseOffering(Base):
    __tablename__ = "course_offering"
    offering_id = Column(Integer, primary_key=True, index=True)
    c_id = Column(Integer, ForeignKey("course.c_id"))
    sem_id = Column(Integer, ForeignKey("semester.sem_id"))
    max_students = Column(Integer, nullable=False)
    group_id = Column(Integer, ForeignKey("student_group.group_id"))
    hrs_per_week = Column(Integer, default=4)

class Rooms(Base):
    __tablename__ = "rooms"
    room_id = Column(String, primary_key=True)
    capacity = Column(Integer, nullable=False)

class TimeSlots(Base):
    __tablename__ = "time_slots"
    slot_id = Column(Integer, primary_key=True, index=True)
    day_of_week = Column(Enum(DayOfWeek), nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)

class OfferingSchedule(Base):
    __tablename__ = "offering_schedule"
    schedule_id = Column(Integer, primary_key=True, index=True)
    offering_id = Column(Integer, ForeignKey("course_offering.offering_id"))
    room_id = Column(String, ForeignKey("rooms.room_id"))
    slot_id = Column(Integer, ForeignKey("time_slots.slot_id"))
    s_status = Column(String)  # Assuming string, not specified
    createdAt = Column(DateTime, nullable=False)
    updatedAt = Column(DateTime, nullable=False)

class OfferingProfessors(Base):
    __tablename__ = "offering_professors"
    offering_prof_id = Column(Integer, primary_key=True, index=True)
    offering_id = Column(Integer, ForeignKey("course_offering.offering_id"))
    u_id = Column(Integer, ForeignKey("user.u_id", ondelete="CASCADE"))

class ProfessorAvailability(Base):
    __tablename__ = "professor_availability"
    id = Column(Integer, primary_key=True, index=True)
    u_id = Column(Integer, ForeignKey("user.u_id", ondelete="CASCADE"))
    day_of_week = Column(Enum(DayOfWeek), nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    is_available = Column(Boolean, nullable=False)

class ProfessorUnavailability(Base):
    __tablename__ = "professor_unavailability"
    id = Column(Integer, primary_key=True, index=True)
    u_id = Column(Integer, ForeignKey("user.u_id", ondelete="CASCADE"))
    date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    reason = Column(String)
    createdAt = Column(DateTime, nullable=False)

class Enrollment(Base):
    __tablename__ = "enrollment"
    id = Column(Integer, primary_key=True, index=True)
    offering_id = Column(Integer, ForeignKey("course_offering.offering_id"))
    u_id = Column(Integer, ForeignKey("user.u_id", ondelete="CASCADE"))
    enrolledAt = Column(DateTime, nullable=False)

class Faculty(Base):
    __tablename__ = "faculty"
    f_id = Column(Integer, primary_key=True, index=True)
    f_name = Column(String, nullable=False)
    f_abbr = Column(String, nullable=False)
    createdAt = Column(DateTime, nullable=False)

class Degree(Base):
    __tablename__ = "degree"
    d_id = Column(Integer, primary_key=True, index=True)
    d_name = Column(String, nullable=False)
    f_id = Column(Integer, ForeignKey("faculty.f_id"))
    degree_abbr = Column(String, nullable=False)
    createdAt = Column(DateTime, nullable=False)

class StudentDegree(Base):
    __tablename__ = "student_degree"
    student_degree_id = Column(Integer, primary_key=True, index=True)
    u_id = Column(Integer, ForeignKey("user.u_id", ondelete="CASCADE"))
    deg_id = Column(Integer, ForeignKey("degree.d_id"))
    yr_lvl = Column(Integer, nullable=False)
    createdAt = Column(DateTime, nullable=False)
    updatedAt = Column(DateTime, nullable=False)

class CourseCurriculum(Base):
    __tablename__ = "course_curriculum"
    course_year_id = Column(Integer, primary_key=True, index=True)
    c_id = Column(Integer, ForeignKey("course.c_id"))
    degree_id = Column(Integer, ForeignKey("degree.d_id"))
    year_level = Column(Integer, nullable=False)
    is_active = Column(Boolean, nullable=False)
    semester_number = Column(Integer, nullable=False)
    createdAt = Column(DateTime, nullable=False)