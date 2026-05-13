from .users import router as users_router
from .courses import router as courses_router
from .professors import router as professors_router
from .students import router as students_router
from .professor_availability import router as professor_availability_router
from .rooms import router as rooms_router
from .student_groups import router as student_groups_router
from .faculty import router as faculty_router
from .degrees import router as degrees_router
from .student_degrees import router as student_degrees_router
from .course_curriculum import router as course_curriculum_router
from .session_types import router as session_types_router
from .time_slots import router as time_slots_router
from .migrations import router as migrations_router
from .complaints import router as complaints_router
from .course_schedules import router as course_schedules_router
from .auto_schedule import router as auto_schedule_router

__all__ = [
    "users_router",
    "courses_router",
    "professors_router",
    "students_router",
    "professor_availability_router",
    "rooms_router",
    "student_groups_router",
    "faculty_router",
    "degrees_router",
    "student_degrees_router",
    "course_curriculum_router",
    "course_schedules_router",
    "session_types_router",
    "time_slots_router",
    "migrations_router",
    "complaints_router",
    "auto_schedule_router",
]
