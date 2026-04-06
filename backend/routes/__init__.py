from .users import router as users_router
from .courses import router as courses_router
from .professors import router as professors_router
from .students import router as students_router
from .professor_availability import router as professor_availability_router
from .rooms import router as rooms_router
from .student_groups import router as student_groups_router
from .semesters import router as semesters_router
from .faculty import router as faculty_router
from .degrees import router as degrees_router
from .student_degrees import router as student_degrees_router
from .course_curriculum import router as course_curriculum_router
from .enrollments import router as enrollments_router

__all__ = [
    "users_router",
    "courses_router",
    "professors_router",
    "students_router",
    "professor_availability_router",
    "rooms_router",
    "student_groups_router",
    "semesters_router",
    "faculty_router",
    "degrees_router",
    "student_degrees_router",
    "course_curriculum_router",
    "enrollments_router",
]
