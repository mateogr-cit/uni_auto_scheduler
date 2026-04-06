from .users import router as users_router
from .courses import router as courses_router
from .professors import router as professors_router
from .students import router as students_router
from .professor_availability import router as professor_availability_router
from .rooms import router as rooms_router

__all__ = [
    "users_router",
    "courses_router",
    "professors_router",
    "students_router",
    "professor_availability_router",
    "rooms_router",
]
