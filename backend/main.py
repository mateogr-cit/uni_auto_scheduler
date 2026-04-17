from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import (
    users_router,
    courses_router,
    professors_router,
    students_router,
    professor_availability_router,
    rooms_router,
    student_groups_router,
    semesters_router,
    faculty_router,
    degrees_router,
    student_degrees_router,
    course_curriculum_router,
    course_offerings_router,
    enrollments_router,
    session_types_router,
)
from routes.auto_schedule import router as auto_schedule_router
from routes.migrations import router as migrations_router
from database import engine
from models import Base

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    # allow_origins=["http://localhost:3000"],  # No trailing slash
    allow_origins=["*"],  # No trailing slash
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users_router)
app.include_router(courses_router)
app.include_router(professors_router)
app.include_router(students_router)
app.include_router(professor_availability_router)
app.include_router(rooms_router)
app.include_router(student_groups_router)
app.include_router(semesters_router)
app.include_router(faculty_router)
app.include_router(degrees_router)
app.include_router(student_degrees_router)
app.include_router(course_curriculum_router)
app.include_router(course_offerings_router)
app.include_router(enrollments_router)
app.include_router(session_types_router)
app.include_router(auto_schedule_router)
app.include_router(migrations_router)

@app.get("/")
def read_root():
    return {"message": "Welcome to Uni Auto Scheduler API"}