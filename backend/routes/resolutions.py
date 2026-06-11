"""
Audit log of resolved items (complaints, unavailability requests, weight adjustments).
Other route modules call `log_resolution(...)` after a successful mutation; this file
exposes the GET endpoint that the /resolved frontend page consumes.
"""

import json
import logging
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import ResolutionLog

logger = logging.getLogger(__name__)
router = APIRouter()


def log_resolution(db: Session, kind: str, ref_id: int | None, summary: dict) -> None:
    """Persist one resolution event. Never raises — audit failures must not break the caller."""
    try:
        entry = ResolutionLog(
            kind=kind,
            ref_id=ref_id,
            summary=json.dumps(summary, default=str),
            resolved_at=datetime.utcnow(),
        )
        db.add(entry)
        db.commit()
    except Exception as e:  # pragma: no cover — defensive only
        logger.warning(f"Failed to write resolution log ({kind}): {e}")
        db.rollback()


@router.get("/resolutions/recent")
def get_recent_resolutions(days: int = 30, db: Session = Depends(get_db)):
    """Return resolutions from the last `days` days, newest first."""
    days = max(1, min(days, 365))
    cutoff = datetime.utcnow() - timedelta(days=days)
    rows = (
        db.query(ResolutionLog)
        .filter(ResolutionLog.resolved_at >= cutoff)
        .order_by(ResolutionLog.resolved_at.desc())
        .all()
    )
    out = []
    for r in rows:
        try:
            summary = json.loads(r.summary)
        except json.JSONDecodeError:
            summary = {"raw": r.summary}
        out.append({
            "id": r.id,
            "kind": r.kind,
            "ref_id": r.ref_id,
            "summary": summary,
            "resolved_at": r.resolved_at.isoformat(),
        })
    return {"window_days": days, "count": len(out), "resolutions": out}
