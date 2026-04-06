from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import users_router, courses_router, professors_router, students_router, professor_availability_router, rooms_router
from database import engine
from models import Base

Base.metadata.create_all(bind=engine)


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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

@app.get("/")
def read_root():
    return {"message": "Welcome to Uni Auto Scheduler API"}