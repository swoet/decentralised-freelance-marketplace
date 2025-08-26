from __future__ import annotations
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.db import SessionLocal
from app.models.review import Review
from app.models.skills import ReputationScore, ReputationEvent, UserSkillStatus, UserSkill


def _calc_score(db: Session, user_id) -> Dict[str, Any]:
    # Reviews: normalize to 0..1
    avg_rating = db.query(func.avg(Review.rating)).filter(Review.reviewer_id == user_id).scalar() or 0
    reviews_component = float(avg_rating) / 5.0

    # Verified skills boost
    verified_skills = db.query(func.count(UserSkill.id)).filter(
        UserSkill.user_id == user_id,
        UserSkill.verified_status == UserSkillStatus.VERIFIED,
    ).scalar() or 0
    skills_component = min(0.3, 0.03 * float(verified_skills))  # up to +0.3

    score = max(0.0, min(1.0, reviews_component * 0.7 + skills_component))
    return {
        "score": score,
        "breakdown": {
            "reviews_component": round(reviews_component, 4),
            "skills_component": round(skills_component, 4),
            "verified_skills": int(verified_skills),
        }
    }


def get_reputation(user_id) -> Dict[str, Any]:
    db: Session = SessionLocal()
    try:
        calc = _calc_score(db, user_id)
        rs = db.query(ReputationScore).filter(ReputationScore.user_id == user_id).first()
        if not rs:
            rs = ReputationScore(user_id=user_id, score=calc["score"], breakdown_json=calc["breakdown"]) 
            db.add(rs)
            db.commit()
        else:
            rs.score = calc["score"]
            rs.breakdown_json = calc["breakdown"]
            db.add(rs)
            db.commit()
        return {"score": round(rs.score, 4), "breakdown": rs.breakdown_json}
    finally:
        db.close()


def get_reputation_history(user_id) -> List[Dict[str, Any]]:
    db: Session = SessionLocal()
    try:
        events = db.query(ReputationEvent).filter(ReputationEvent.user_id == user_id).order_by(ReputationEvent.created_at.desc()).limit(100).all()
        return [
            {
                "type": e.type,
                "weight": e.weight,
                "payload": e.payload_json,
                "created_at": e.created_at.isoformat() if e.created_at else None,
            }
            for e in events
        ]
    finally:
        db.close()
