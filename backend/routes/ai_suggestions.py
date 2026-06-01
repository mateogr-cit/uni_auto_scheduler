"""
AI-powered schedule analysis using NVIDIA Llama 4 Maverick.
Fetches a group's full schedule, sends it to the model, and returns
a structured analysis with ranked suggestions.
"""

import os
import json
import requests
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import (
    CourseSchedule,
    CourseSession,
    Course,
    StudentGroup,
    User,
    TimeSlots,
    SessionTypeModel,
)
from datetime import datetime

router = APIRouter()

_NVIDIA_URL = "https://integrate.api.nvidia.com/v1/chat/completions"
_MODEL = "meta/llama-4-maverick-17b-128e-instruct"

_SYSTEM_PROMPT = (
    "You are a university schedule optimization assistant. "
    "Analyze the provided weekly schedule and identify issues such as: "
    "high-difficulty courses clustered on the same day, lecture and seminar for the "
    "same course scheduled on the same day, back-to-back heavy sessions, or uneven "
    "workload distribution across the week. "
    "Respond ONLY with a valid JSON object — no markdown, no code fences — in this exact shape: "
    '{"analysis": "A short paragraph summarizing the main issues.", '
    '"suggestions": [{"title": "...", "description": "...", "priority": "high|medium|low"}]}'
)


def _format_schedule_for_prompt(group_name: str, schedules: list) -> str:
    lines = [f"Student Group: {group_name}", "Weekly Schedule:"]
    for s in schedules:
        lines.append(
            f"\nCourse: {s['course']} ({s['course_abbr']}) "
            f"— difficulty weight: {s['difficulty_weight']}"
        )
        lines.append(f"  Professor: {s['professor']}")
        for session in s["sessions"]:
            lines.append(
                f"  {session['type']}: {session['day']} {session['time']}, Room {session['room']}"
            )
    return "\n".join(lines)


def _strip_code_fences(text: str) -> str:
    """Models sometimes wrap JSON in ```json ... ``` — strip those before parsing."""
    text = text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[-1]
    if text.endswith("```"):
        text = text.rsplit("```", 1)[0]
    return text.strip()


@router.get("/ai/suggestions/group/{group_id}")
def get_ai_suggestions(group_id: int, db: Session = Depends(get_db)):
    """Analyse a student group's schedule with Llama 4 Maverick and return suggestions."""
    api_key = os.getenv("NVIDIA_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="NVIDIA_API_KEY environment variable not set")

    group = db.query(StudentGroup).filter(StudentGroup.group_id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Student group not found")

    raw_schedules = db.query(CourseSchedule).filter(CourseSchedule.group_id == group_id).all()
    if not raw_schedules:
        raise HTTPException(status_code=404, detail="No schedule found for this group")

    formatted = []
    for schedule in raw_schedules:
        course = db.query(Course).filter(Course.c_id == schedule.c_id).first()
        prof = db.query(User).filter(User.u_id == schedule.u_id).first()
        sessions = db.query(CourseSession).filter(
            CourseSession.schedule_id == schedule.schedule_id
        ).all()

        session_list = []
        for session in sessions:
            slot = db.query(TimeSlots).filter(TimeSlots.slot_id == session.slot_id).first()
            stype = db.query(SessionTypeModel).filter(
                SessionTypeModel.session_type_id == session.session_type_id
            ).first()
            session_list.append({
                "type": stype.type_name.value if stype else "Unknown",
                "day": slot.day_of_week.value if slot else "N/A",
                "time": (
                    f"{slot.start_time.strftime('%H:%M')}-{slot.end_time.strftime('%H:%M')}"
                    if slot else "N/A"
                ),
                "room": session.room_id,
            })

        formatted.append({
            "course": course.c_name if course else "Unknown",
            "course_abbr": course.c_abbr if course else "N/A",
            "difficulty_weight": course.c_difficulty_weight if course else 0.0,
            "professor": f"{prof.fname} {prof.lname}" if prof else "N/A",
            "sessions": session_list,
        })

    schedule_text = _format_schedule_for_prompt(group.group_name, formatted)

    payload = {
        "model": _MODEL,
        "messages": [
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": schedule_text},
        ],
        "max_tokens": 1024,
        "temperature": 0.40,
        "top_p": 1.00,
        "frequency_penalty": 0.00,
        "presence_penalty": 0.00,
        "stream": False,
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }

    try:
        resp = requests.post(_NVIDIA_URL, headers=headers, json=payload, timeout=30)
        resp.raise_for_status()
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="AI service timed out")
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=502, detail=f"AI service error: {str(e)}")

    raw_content = resp.json()["choices"][0]["message"]["content"]

    try:
        parsed = json.loads(_strip_code_fences(raw_content))
        analysis = parsed.get("analysis", "")
        suggestions = parsed.get("suggestions", [])
    except (json.JSONDecodeError, KeyError):
        # Graceful degradation: surface raw text rather than crashing
        analysis = raw_content
        suggestions = []

    return {
        "group_id": group_id,
        "group_name": group.group_name,
        "analysis": analysis,
        "suggestions": suggestions,
        "generated_at": datetime.now().isoformat(),
    }
