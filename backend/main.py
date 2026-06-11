from dotenv import load_dotenv
load_dotenv()

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
    faculty_router,
    degrees_router,
    student_degrees_router,
    course_curriculum_router,
    session_types_router,
    complaints_router,
    time_slots_router,
)
from routes.student_group_availability import router as student_group_availability_router
from routes.course_schedules import router as course_schedules_router
from routes.auto_schedule import router as auto_schedule_router
from routes.migrations import router as migrations_router
from routes.dashboard import router as dashboard_router
from routes.benchmark import router as benchmark_router
from routes.ai_suggestions import router as ai_suggestions_router
from routes.auth import router as auth_router
from routes.schedule_benchmark import router as schedule_benchmark_router
from routes.resolutions import router as resolutions_router
from database import engine
from models import Base
from logging_config import setup_logging
from sqlalchemy import text

# Setup logging
logger = setup_logging()
logger.info("Starting Uni Auto Scheduler API")

# Drop old tables that no longer exist in models
# This is needed because drop_all() fails due to foreign key constraints
with engine.connect() as conn:
    conn.execute(text("DROP TABLE IF EXISTS offering_schedule CASCADE"))
    conn.execute(text("DROP TABLE IF EXISTS offering_professors CASCADE"))
    conn.execute(text("DROP TABLE IF EXISTS enrollment CASCADE"))
    conn.execute(text("DROP TABLE IF EXISTS course_offering CASCADE"))
    conn.execute(text("DROP TABLE IF EXISTS semester CASCADE"))
    conn.commit()

Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)
logger.info("Database tables created")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
app.include_router(student_group_availability_router)
app.include_router(faculty_router)
app.include_router(degrees_router)
app.include_router(student_degrees_router)
app.include_router(course_curriculum_router)
app.include_router(course_schedules_router)
app.include_router(session_types_router)
app.include_router(time_slots_router)
app.include_router(auto_schedule_router)
app.include_router(migrations_router)
app.include_router(dashboard_router)
app.include_router(complaints_router)
app.include_router(benchmark_router)
app.include_router(ai_suggestions_router)
app.include_router(auth_router)
app.include_router(schedule_benchmark_router)
app.include_router(resolutions_router)

@app.get("/")
def read_root():
    return {"message": "Welcome to Uni Auto Scheduler API"}