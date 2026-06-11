"""
AI-powered schedule analysis using NVIDIA Llama 4 Maverick.
Fetches a group's full schedule, sends it to the model, and returns
a structured analysis with ranked suggestions.
"""

import os
import json
import requests
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from models import (
    CourseSchedule,
    CourseSession,
    Course,
    StudentGroup,
    Student,
    User,
    TimeSlots,
    SessionTypeModel,
    ProfessorUnavailability,
    DayOfWeek,
    Complaints,
)
from datetime import datetime, date as date_cls, time as time_cls, timedelta

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


# --------------------------------------------------------------------------- #
# Make-up session suggestions
# --------------------------------------------------------------------------- #

_MAKEUP_SYSTEM_PROMPT = (
    "You are a university make-up session planner. The user will give you: "
    "(1) a student group's weekly schedule, (2) approved professor unavailability "
    "requests that collide with that schedule, and (3) a list of candidate free time "
    "slots for the group. For EACH affected session, pick the single best make-up "
    "slot from the candidates. Prefer: same weekday as original, similar time of day, "
    "no back-to-back overload, and keep the day's total under 4 hours of class where "
    "possible. "
    "Respond ONLY with a valid JSON object — no markdown, no code fences — in this exact shape: "
    '{"analysis": "Short paragraph on overall impact and reasoning.", '
    '"makeups": [{"course": "...", "session_type": "Lecture|Seminar", '
    '"missed_date": "YYYY-MM-DD", "missed_slot": "Day HH:MM-HH:MM", '
    '"suggested_slot": "Day HH:MM-HH:MM", "suggested_slot_id": <int>, '
    '"reason": "...", "priority": "high|medium|low"}]}'
)


def _times_overlap(a_start: time_cls, a_end: time_cls, b_start: time_cls, b_end: time_cls) -> bool:
    return a_start < b_end and b_start < a_end


def _format_makeup_prompt(group_name: str, schedule_lines: list, conflicts: list, free_slots: list) -> str:
    lines = [f"Student Group: {group_name}", "", "Weekly Schedule:"]
    lines.extend(schedule_lines)
    lines.append("")
    lines.append("Approved Unavailability Conflicts (each one needs a make-up):")
    if not conflicts:
        lines.append("  (none)")
    for c in conflicts:
        lines.append(
            f"  - {c['course']} {c['session_type']} on {c['missed_date']} "
            f"({c['missed_slot']}), professor {c['professor']} unavailable. "
            f"Reason: {c['reason'] or 'n/a'}"
        )
    lines.append("")
    lines.append("Candidate Free Slots for this group (slot_id | Day HH:MM-HH:MM):")
    for s in free_slots:
        lines.append(f"  {s['slot_id']} | {s['day']} {s['time']}")
    return "\n".join(lines)


@router.get("/ai/makeup-conflicts/overview")
def get_makeup_conflicts_overview(db: Session = Depends(get_db)):
    """
    Scan every student group and return only those whose schedule collides with at
    least one APPROVED professor unavailability. No LLM call — purely structural.
    Used by the UI to render a per-group list, each with its own 'analyse' button.
    """
    groups = db.query(StudentGroup).all()
    if not groups:
        return {"groups": []}

    approved = db.query(ProfessorUnavailability).filter(
        ProfessorUnavailability.approved.is_(True)
    ).all()
    if not approved:
        return {"groups": []}

    # Index unavailabilities by professor for O(1) lookup per session
    ua_by_prof: dict = {}
    for ua in approved:
        ua_by_prof.setdefault(ua.u_id, []).append(ua)

    overview = []
    for group in groups:
        schedules = db.query(CourseSchedule).filter(
            CourseSchedule.group_id == group.group_id
        ).all()
        if not schedules:
            continue

        conflict_items = []
        for sch in schedules:
            sessions = db.query(CourseSession).filter(
                CourseSession.schedule_id == sch.schedule_id
            ).all()
            for sess in sessions:
                slot = db.query(TimeSlots).filter(TimeSlots.slot_id == sess.slot_id).first()
                if not slot:
                    continue
                for ua in ua_by_prof.get(sch.u_id, []):
                    try:
                        ua_day = DayOfWeek(ua.date.strftime("%A"))
                    except ValueError:
                        continue
                    if ua_day != slot.day_of_week:
                        continue
                    if _times_overlap(slot.start_time, slot.end_time, ua.start_time, ua.end_time):
                        course = db.query(Course).filter(Course.c_id == sch.c_id).first()
                        stype = db.query(SessionTypeModel).filter(
                            SessionTypeModel.session_type_id == sess.session_type_id
                        ).first()
                        conflict_items.append({
                            "course_abbr": course.c_abbr if course else "?",
                            "session_type": stype.type_name.value if stype else "Unknown",
                            "missed_date": ua.date.isoformat(),
                            "missed_slot": (
                                f"{slot.day_of_week.value} "
                                f"{slot.start_time.strftime('%H:%M')}-{slot.end_time.strftime('%H:%M')}"
                            ),
                        })

        if conflict_items:
            overview.append({
                "group_id": group.group_id,
                "group_name": group.group_name,
                "conflict_count": len(conflict_items),
                "conflicts": conflict_items,
            })

    return {"groups": overview}


@router.get("/ai/makeup-suggestions/group/{group_id}")
def get_makeup_suggestions(group_id: int, db: Session = Depends(get_db)):
    """
    Analyse approved professor unavailability requests that collide with a group's
    schedule and ask Llama 4 Maverick to recommend make-up slots.
    """
    api_key = os.getenv("NVIDIA_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="NVIDIA_API_KEY environment variable not set")

    group = db.query(StudentGroup).filter(StudentGroup.group_id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Student group not found")

    schedules = db.query(CourseSchedule).filter(CourseSchedule.group_id == group_id).all()
    if not schedules:
        raise HTTPException(status_code=404, detail="No schedule found for this group")

    # Build the schedule view and a map of (u_id, day_of_week) -> [session info]
    schedule_lines = []
    used_slot_ids = set()
    sessions_by_prof_day: dict = {}

    for sch in schedules:
        course = db.query(Course).filter(Course.c_id == sch.c_id).first()
        prof = db.query(User).filter(User.u_id == sch.u_id).first()
        sessions = db.query(CourseSession).filter(
            CourseSession.schedule_id == sch.schedule_id
        ).all()

        c_name = course.c_name if course else "Unknown"
        c_abbr = course.c_abbr if course else "?"
        prof_name = f"{prof.fname} {prof.lname}" if prof else "N/A"

        for sess in sessions:
            slot = db.query(TimeSlots).filter(TimeSlots.slot_id == sess.slot_id).first()
            stype = db.query(SessionTypeModel).filter(
                SessionTypeModel.session_type_id == sess.session_type_id
            ).first()
            if not slot or not stype:
                continue
            used_slot_ids.add(slot.slot_id)
            day_val = slot.day_of_week
            entry = {
                "course": c_name,
                "course_abbr": c_abbr,
                "session_type": stype.type_name.value,
                "u_id": sch.u_id,
                "professor": prof_name,
                "day": day_val.value,
                "start": slot.start_time,
                "end": slot.end_time,
            }
            sessions_by_prof_day.setdefault((sch.u_id, day_val), []).append(entry)
            schedule_lines.append(
                f"  {c_abbr} {stype.type_name.value}: {day_val.value} "
                f"{slot.start_time.strftime('%H:%M')}-{slot.end_time.strftime('%H:%M')} "
                f"(Prof: {prof_name})"
            )

    # Find conflicts: any ProfessorUnavailability whose prof teaches this group, where
    # the absence date's weekday matches a scheduled session for that prof+group, and
    # the time window overlaps.
    unavailabilities = (
        db.query(ProfessorUnavailability)
        .filter(
            ProfessorUnavailability.u_id.in_([s.u_id for s in schedules]),
            ProfessorUnavailability.approved.is_(True),
        )
        .all()
    )

    conflicts = []
    for ua in unavailabilities:
        try:
            day_enum = DayOfWeek(ua.date.strftime("%A"))
        except ValueError:
            continue  # weekend or unknown weekday
        for entry in sessions_by_prof_day.get((ua.u_id, day_enum), []):
            if _times_overlap(entry["start"], entry["end"], ua.start_time, ua.end_time):
                conflicts.append({
                    "course": entry["course"],
                    "course_abbr": entry["course_abbr"],
                    "session_type": entry["session_type"],
                    "professor": entry["professor"],
                    "missed_date": ua.date.isoformat(),
                    "missed_slot": (
                        f"{entry['day']} "
                        f"{entry['start'].strftime('%H:%M')}-{entry['end'].strftime('%H:%M')}"
                    ),
                    "reason": ua.reason,
                })

    if not conflicts:
        return {
            "group_id": group_id,
            "group_name": group.group_name,
            "analysis": "No approved unavailability requests collide with this group's schedule.",
            "makeups": [],
            "generated_at": datetime.now().isoformat(),
        }

    # Candidate free slots for the group
    all_slots = db.query(TimeSlots).all()
    free_slots = [
        {
            "slot_id": s.slot_id,
            "day": s.day_of_week.value,
            "time": f"{s.start_time.strftime('%H:%M')}-{s.end_time.strftime('%H:%M')}",
        }
        for s in all_slots
        if s.slot_id not in used_slot_ids
    ]

    prompt = _format_makeup_prompt(group.group_name, schedule_lines, conflicts, free_slots)

    payload = {
        "model": _MODEL,
        "messages": [
            {"role": "system", "content": _MAKEUP_SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        "max_tokens": 1024,
        "temperature": 0.30,
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
        makeups = parsed.get("makeups", [])
    except (json.JSONDecodeError, KeyError):
        analysis = raw_content
        makeups = []

    return {
        "group_id": group_id,
        "group_name": group.group_name,
        "analysis": analysis,
        "makeups": makeups,
        "conflicts_found": len(conflicts),
        "generated_at": datetime.now().isoformat(),
    }


# --------------------------------------------------------------------------- #
# Complaint-driven course-weight adjustments
# --------------------------------------------------------------------------- #

_CTX_PREFIX = "__ctx__"
_CTX_SUFFIX = "__end__"


def _parse_complaint(comp_text: str):
    """Mirror of complaints._parse_comp_text — returns (text, course_name, time_slot)."""
    if comp_text.startswith(_CTX_PREFIX):
        end = comp_text.find(_CTX_SUFFIX)
        if end != -1:
            meta_json = comp_text[len(_CTX_PREFIX):end]
            actual_text = comp_text[end + len(_CTX_SUFFIX):].lstrip("\n")
            try:
                meta = json.loads(meta_json)
                return actual_text, meta.get("course") or None, meta.get("slot") or None
            except Exception:
                pass
    return comp_text, None, None


def _match_course(courses: list, course_label: str):
    """Match a complaint's course_label (which can be 'Name (ABBR)' or just name/abbr) to a Course row."""
    if not course_label:
        return None
    label = course_label.strip().lower()
    for c in courses:
        if c.c_name and c.c_name.lower() == label:
            return c
        if c.c_abbr and c.c_abbr.lower() == label:
            return c
    # Fallback substring match on abbr in "Name (ABBR)" form
    for c in courses:
        if c.c_abbr and f"({c.c_abbr.lower()})" in label:
            return c
        if c.c_name and c.c_name.lower() in label:
            return c
    return None


def _aggregate_complaints_by_course(db: Session):
    """Return list of {course, complaints:[{text, student, slot, created_at}]} grouped by matched course."""
    courses = db.query(Course).all()
    complaints = db.query(Complaints).order_by(Complaints.createdAt.desc()).all()
    by_course: dict = {}
    unmatched: list = []
    for comp in complaints:
        text, course_label, slot = _parse_complaint(comp.comp_text)
        course = _match_course(courses, course_label) if course_label else None
        entry = {
            "comp_id": comp.comp_id,
            "text": text,
            "time_slot": slot,
            "course_label": course_label,
            "created_at": comp.createdAt.isoformat() if comp.createdAt else None,
        }
        if course is None:
            unmatched.append(entry)
            continue
        bucket = by_course.setdefault(course.c_id, {"course": course, "complaints": []})
        bucket["complaints"].append(entry)
    return by_course, unmatched


@router.get("/ai/weight-adjustments/overview")
def get_weight_adjustments_overview(db: Session = Depends(get_db)):
    """
    Aggregate complaints per course — no LLM call. The UI uses this to show what
    will be analyzed and how many complaints back each course.
    """
    by_course, unmatched = _aggregate_complaints_by_course(db)
    courses_out = []
    for c_id, bucket in by_course.items():
        course = bucket["course"]
        courses_out.append({
            "c_id": course.c_id,
            "c_name": course.c_name,
            "c_abbr": course.c_abbr,
            "current_weight": course.c_difficulty_weight,
            "complaint_count": len(bucket["complaints"]),
            "complaints": bucket["complaints"],
        })
    courses_out.sort(key=lambda x: x["complaint_count"], reverse=True)
    return {
        "courses": courses_out,
        "unmatched_count": len(unmatched),
        "total_complaints": sum(c["complaint_count"] for c in courses_out) + len(unmatched),
    }


_WEIGHT_SYSTEM_PROMPT = (
    "You are an academic workload analyst. You receive student complaints grouped per course, "
    "each course's current difficulty weight (a float, typically 1.0-5.0), and a brief tone "
    "summary. Recommend a NEW difficulty weight per course so the auto-scheduler can spread "
    "heavy courses across the week. Increase weight when complaints describe heavy workload, "
    "fast pacing, unclear material, or stress; decrease when complaints describe under-use, "
    "boredom, or trivial work; leave roughly unchanged for off-topic or administrative gripes. "
    "Keep weights in [0.5, 5.0]. Cap any single change at +/- 1.5. "
    "Respond ONLY with valid JSON, no markdown, in this exact shape: "
    '{"analysis": "Short paragraph on overall themes.", '
    '"recommendations": [{"c_id": <int>, "course_abbr": "...", '
    '"current_weight": <float>, "suggested_weight": <float>, "delta": <float>, '
    '"reason": "...", "priority": "high|medium|low"}]}'
)


def _format_weight_prompt(by_course: dict) -> str:
    lines = ["Courses with complaints:"]
    for c_id, bucket in by_course.items():
        course = bucket["course"]
        lines.append(
            f"\nCourse: {course.c_name} ({course.c_abbr}) [c_id={course.c_id}] "
            f"— current_weight={course.c_difficulty_weight}, "
            f"complaint_count={len(bucket['complaints'])}"
        )
        for comp in bucket["complaints"][:10]:  # cap per-course excerpts
            snippet = (comp["text"] or "").strip().replace("\n", " ")
            if len(snippet) > 240:
                snippet = snippet[:240] + "..."
            slot = f" [{comp['time_slot']}]" if comp["time_slot"] else ""
            lines.append(f"  - \"{snippet}\"{slot}")
    return "\n".join(lines)


@router.get("/ai/weight-adjustments/analyze")
def analyze_weight_adjustments(db: Session = Depends(get_db)):
    """
    Read all complaints, group them by course, ask Llama 4 Maverick to recommend
    a new c_difficulty_weight per course, and return the structured recommendations.
    """
    api_key = os.getenv("NVIDIA_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="NVIDIA_API_KEY environment variable not set")

    by_course, unmatched = _aggregate_complaints_by_course(db)
    if not by_course:
        return {
            "analysis": "No complaints could be linked to specific courses.",
            "recommendations": [],
            "unmatched_count": len(unmatched),
            "generated_at": datetime.now().isoformat(),
        }

    prompt = _format_weight_prompt(by_course)

    payload = {
        "model": _MODEL,
        "messages": [
            {"role": "system", "content": _WEIGHT_SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        "max_tokens": 1500,
        "temperature": 0.30,
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
        resp = requests.post(_NVIDIA_URL, headers=headers, json=payload, timeout=45)
        resp.raise_for_status()
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="AI service timed out")
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=502, detail=f"AI service error: {str(e)}")

    raw_content = resp.json()["choices"][0]["message"]["content"]

    try:
        parsed = json.loads(_strip_code_fences(raw_content))
        analysis = parsed.get("analysis", "")
        recommendations = parsed.get("recommendations", [])
    except (json.JSONDecodeError, KeyError):
        analysis = raw_content
        recommendations = []

    # Cross-check c_ids the model returned against the DB and re-attach current_weight
    # so the UI never displays a stale or hallucinated baseline.
    cleaned = []
    for rec in recommendations:
        try:
            c_id = int(rec.get("c_id"))
        except (TypeError, ValueError):
            continue
        bucket = by_course.get(c_id)
        if not bucket:
            continue
        course = bucket["course"]
        try:
            suggested = float(rec.get("suggested_weight"))
        except (TypeError, ValueError):
            continue
        suggested = max(0.5, min(5.0, suggested))  # clamp
        cleaned.append({
            "c_id": c_id,
            "c_name": course.c_name,
            "course_abbr": course.c_abbr,
            "current_weight": course.c_difficulty_weight,
            "suggested_weight": round(suggested, 2),
            "delta": round(suggested - course.c_difficulty_weight, 2),
            "reason": rec.get("reason", ""),
            "priority": rec.get("priority", "medium"),
            "complaint_count": len(bucket["complaints"]),
        })

    return {
        "analysis": analysis,
        "recommendations": cleaned,
        "unmatched_count": len(unmatched),
        "generated_at": datetime.now().isoformat(),
    }


class WeightAdjustmentApply(BaseModel):
    c_id: int
    new_weight: float


@router.post("/ai/weight-adjustments/apply")
def apply_weight_adjustment(payload: WeightAdjustmentApply, db: Session = Depends(get_db)):
    """Persist a single course's new difficulty weight. Clamped to [0.5, 5.0]."""
    course = db.query(Course).filter(Course.c_id == payload.c_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    new_weight = max(0.5, min(5.0, float(payload.new_weight)))
    old_weight = course.c_difficulty_weight
    course.c_difficulty_weight = new_weight
    db.commit()

    from routes.resolutions import log_resolution
    log_resolution(
        db,
        kind="weight_adjusted",
        ref_id=course.c_id,
        summary={
            "c_id": course.c_id,
            "c_name": course.c_name,
            "c_abbr": course.c_abbr,
            "old_weight": old_weight,
            "new_weight": new_weight,
        },
    )

    return {
        "c_id": course.c_id,
        "c_abbr": course.c_abbr,
        "old_weight": old_weight,
        "new_weight": new_weight,
    }


# --------------------------------------------------------------------------- #
# Accept a make-up suggestion → compose registrar-style announcement email
# --------------------------------------------------------------------------- #

_WEEKDAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


def _parse_slot_string(slot: str):
    """
    Parse strings like 'Friday 13:00-15:00' into (day_name, start_hhmm, end_hhmm).
    Returns (None, None, None) if the shape doesn't match.
    """
    if not slot:
        return None, None, None
    parts = slot.strip().split(None, 1)  # split on first whitespace
    if len(parts) != 2:
        return None, None, None
    day_part, time_part = parts[0], parts[1]
    times = time_part.split("-")
    if len(times) != 2:
        return day_part, None, None
    return day_part, times[0].strip(), times[1].strip()


def _next_date_for_weekday(after: date_cls, weekday_name: str):
    """Return the first date >= `after` whose weekday is `weekday_name`. None on bad input."""
    if weekday_name not in _WEEKDAY_ORDER:
        return None
    target_idx = _WEEKDAY_ORDER.index(weekday_name)
    # Python's weekday() — Mon=0..Sun=6 — already matches our list ordering.
    diff = (target_idx - after.weekday()) % 7
    # If the suggested weekday equals the missed date's weekday, push it a full week out
    # so the announcement clearly references a *future* date, not the same day as the absence.
    if diff == 0:
        diff = 7
    return after + timedelta(days=diff)


class MakeupAcceptPayload(BaseModel):
    group_id: int
    course: str
    session_type: str
    missed_date: str           # YYYY-MM-DD
    missed_slot: str           # "Day HH:MM-HH:MM"
    suggested_slot: str        # "Day HH:MM-HH:MM"
    suggested_slot_id: int | None = None
    reason: str | None = None


@router.post("/ai/makeup-suggestions/accept")
def accept_makeup_suggestion(payload: MakeupAcceptPayload, db: Session = Depends(get_db)):
    """
    Compose a registrar-style cancellation+make-up email for a single accepted
    suggestion. Returns subject, body, and the resolved student-recipient list.
    Also writes a `makeup_accepted` row to the resolution log.
    """
    group = db.query(StudentGroup).filter(StudentGroup.group_id == payload.group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Student group not found")

    # Match the course by exact name or abbreviation (LLM returns c_name in `course`).
    course = (
        db.query(Course)
        .filter((Course.c_name == payload.course) | (Course.c_abbr == payload.course))
        .first()
    )
    if not course:
        raise HTTPException(status_code=404, detail=f"Course not found: {payload.course}")

    # Resolve the professor through CourseSchedule(group_id, c_id).
    schedule = (
        db.query(CourseSchedule)
        .filter(CourseSchedule.group_id == group.group_id, CourseSchedule.c_id == course.c_id)
        .first()
    )
    prof_name = "the instructor"
    original_room: str | None = None
    if schedule:
        prof = db.query(User).filter(User.u_id == schedule.u_id).first()
        if prof:
            prof_name = f"Prof. {prof.fname} {prof.lname}"
        # Pick the room of the missed session-type within this schedule.
        sessions = db.query(CourseSession).filter(
            CourseSession.schedule_id == schedule.schedule_id
        ).all()
        for sess in sessions:
            stype = db.query(SessionTypeModel).filter(
                SessionTypeModel.session_type_id == sess.session_type_id
            ).first()
            if stype and stype.type_name.value == payload.session_type:
                original_room = sess.room_id
                break

    # Compute the actual make-up date from the suggested weekday, anchored to the missed date.
    try:
        missed_date_obj = datetime.strptime(payload.missed_date, "%Y-%m-%d").date()
    except ValueError:
        missed_date_obj = datetime.utcnow().date()

    sugg_day, sugg_start, sugg_end = _parse_slot_string(payload.suggested_slot)
    makeup_date_obj = _next_date_for_weekday(missed_date_obj, sugg_day) if sugg_day else None
    makeup_date_str = (
        makeup_date_obj.strftime("%B %d, %Y") if makeup_date_obj else payload.suggested_slot
    )

    # Resolve the room. If the suggested_slot_id has an existing CourseSession booking we
    # could mine that, but for now reuse the original room (most common arrangement).
    location = original_room or "TBA"

    # Compose recipient emails — students belonging to this group.
    student_rows = (
        db.query(User)
        .join(Student, Student.u_id == User.u_id)
        .filter(Student.group_id == group.group_id)
        .all()
    )
    recipients = [u.email for u in student_rows if u.email]

    session_letter = (payload.session_type or "")[:1].upper()  # "L" or "S"
    label = f"({session_letter}) {course.c_name}" if session_letter else course.c_name

    subject = f"Make-up Session Rescheduled — {course.c_abbr} ({payload.session_type})"

    time_range = (
        f"{sugg_start} – {sugg_end}"
        if sugg_start and sugg_end
        else payload.suggested_slot
    )

    body = (
        "Dear Students,\n\n"
        f"We would like to inform you that the make-up session for the course "
        f"{label} with {prof_name}, which was scheduled for "
        f"{missed_date_obj.strftime('%B %d, %Y')} ({payload.missed_slot}), has been canceled.\n\n"
        "A new make-up session has been scheduled as follows:\n\n"
        f"Date: {makeup_date_str}\n"
        f"Time: {time_range}\n"
        f"Location: {location}\n\n"
        "We kindly encourage you to attend, as this session is important for the "
        "continuity of the course.\n\n"
        "Best regards,\n"
        "Registrar Office"
    )

    from routes.resolutions import log_resolution
    log_resolution(
        db,
        kind="makeup_accepted",
        ref_id=group.group_id,
        summary={
            "group_id": group.group_id,
            "group_name": group.group_name,
            "course": course.c_name,
            "course_abbr": course.c_abbr,
            "session_type": payload.session_type,
            "missed_date": payload.missed_date,
            "missed_slot": payload.missed_slot,
            "suggested_slot": payload.suggested_slot,
            "makeup_date": makeup_date_obj.isoformat() if makeup_date_obj else None,
            "professor_name": prof_name,
            "location": location,
            "recipient_count": len(recipients),
        },
    )

    return {
        "subject": subject,
        "body": body,
        "recipients": recipients,
        "recipient_count": len(recipients),
        "group_name": group.group_name,
        "professor_name": prof_name,
        "makeup_date": makeup_date_obj.isoformat() if makeup_date_obj else None,
        "location": location,
    }
