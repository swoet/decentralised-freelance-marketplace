from __future__ import annotations
from typing import List, Optional, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.api.deps import get_db, get_current_active_user
from app.models.skills import (
    Skill,
    UserSkill,
    SkillVerification,
    VerificationMethod,
    VerificationStatus,
    UserSkillStatus,
)

router = APIRouter(prefix="/skills", tags=["skills"]) 


class SkillStartReq(BaseModel):
    # Either provide existing skill_id or a new skill_name
    skill_id: Optional[str] = None
    skill_name: Optional[str] = None
    method: VerificationMethod = Field(default=VerificationMethod.EVIDENCE)
    evidence_url: Optional[str] = None
    level: Optional[int] = Field(default=None, ge=1, le=5)
    years: Optional[float] = Field(default=None, ge=0)


@router.post("/verification/start")
def start_verification(payload: SkillStartReq, db: Session = Depends(get_db), user=Depends(get_current_active_user)):
    # Resolve or create skill
    skill: Optional[Skill] = None
    if payload.skill_id:
        skill = db.query(Skill).filter(Skill.id == payload.skill_id).first()
        if not skill:
            raise HTTPException(status_code=404, detail="Skill not found")
    elif payload.skill_name:
        skill = db.query(Skill).filter(Skill.name.ilike(payload.skill_name)).first()
        if not skill:
            skill = Skill(name=payload.skill_name, is_active=True)
            db.add(skill)
            db.commit()
            db.refresh(skill)
    else:
        raise HTTPException(status_code=400, detail="Provide skill_id or skill_name")

    # Upsert user skill row
    us = db.query(UserSkill).filter(UserSkill.user_id == user.id, UserSkill.skill_id == skill.id).first()
    if not us:
        us = UserSkill(user_id=user.id, skill_id=skill.id, verified_status=UserSkillStatus.PENDING)
    if payload.level is not None:
        us.level = payload.level
    if payload.years is not None:
        us.years = payload.years
    if payload.method == VerificationMethod.EVIDENCE and payload.evidence_url:
        us.evidence_url = payload.evidence_url
    db.add(us)
    db.commit()
    db.refresh(us)

    # Create verification record in pending/submitted state
    status = VerificationStatus.SUBMITTED if (payload.method == VerificationMethod.EVIDENCE and payload.evidence_url) else VerificationStatus.PENDING
    ver = SkillVerification(
        user_id=user.id,
        skill_id=skill.id,
        method=payload.method,
        status=status,
        metadata={"evidence_url": payload.evidence_url} if payload.evidence_url else None,
    )
    db.add(ver)
    db.commit()
    db.refresh(ver)

    return {
        "ok": True,
        "verification": {
            "id": str(ver.id),
            "skill_id": str(skill.id),
            "method": ver.method.value if hasattr(ver.method, 'value') else str(ver.method),
            "status": ver.status.value if hasattr(ver.status, 'value') else str(ver.status),
        },
    }


class SkillSubmitReq(BaseModel):
    verification_id: Optional[str] = None
    # Or target by skill
    skill_id: Optional[str] = None
    method: Optional[VerificationMethod] = None
    # Evidence
    evidence_url: Optional[str] = None
    # Quiz
    score: Optional[int] = Field(default=None, ge=0, le=100)
    # Auto verify flag (for evidence method)
    auto_verify: bool = False


@router.post("/verification/submit")
def submit_verification(payload: SkillSubmitReq, db: Session = Depends(get_db), user=Depends(get_current_active_user)):
    # Locate verification
    q = db.query(SkillVerification).filter(SkillVerification.user_id == user.id)
    if payload.verification_id:
        q = q.filter(SkillVerification.id == payload.verification_id)
    else:
        if not payload.skill_id:
            raise HTTPException(status_code=400, detail="Provide verification_id or skill_id")
        q = q.filter(SkillVerification.skill_id == payload.skill_id)
        if payload.method:
            q = q.filter(SkillVerification.method == payload.method)
    ver = q.order_by(SkillVerification.created_at.desc()).first()
    if not ver:
        raise HTTPException(status_code=404, detail="Verification not found")

    # Fetch user skill
    us = db.query(UserSkill).filter(UserSkill.user_id == user.id, UserSkill.skill_id == ver.skill_id).first()
    if not us:
        raise HTTPException(status_code=400, detail="UserSkill not initialized")

    # Process methods
    if ver.method == VerificationMethod.QUIZ:
        if payload.score is None:
            raise HTTPException(status_code=400, detail="score required for quiz method")
        ver.score = int(payload.score)
        if ver.score >= 70:
            ver.status = VerificationStatus.VERIFIED
            us.verified_status = UserSkillStatus.VERIFIED
        else:
            ver.status = VerificationStatus.REJECTED
            us.verified_status = UserSkillStatus.REJECTED

    elif ver.method == VerificationMethod.EVIDENCE:
        if payload.evidence_url:
            # Update metadata
            meta = ver.metadata or {}
            meta.update({"evidence_url": payload.evidence_url})
            ver.metadata = meta
            us.evidence_url = payload.evidence_url
        # Auto verify path if requested
        if payload.auto_verify and payload.evidence_url and payload.evidence_url.startswith("https://"):
            ver.status = VerificationStatus.VERIFIED
            us.verified_status = UserSkillStatus.VERIFIED
        else:
            ver.status = VerificationStatus.SUBMITTED
            us.verified_status = UserSkillStatus.PENDING

    elif ver.method == VerificationMethod.OAUTH:
        # This path is handled via integrations OAuth flows; reject direct submit
        raise HTTPException(status_code=400, detail="Use provider OAuth to verify skills")

    db.add(ver)
    db.add(us)
    db.commit()
    db.refresh(ver)
    db.refresh(us)

    return {
        "ok": True,
        "verification": {
            "id": str(ver.id),
            "status": ver.status.value if hasattr(ver.status, 'value') else str(ver.status),
            "score": ver.score,
        },
        "user_skill": {
            "skill_id": str(us.skill_id),
            "status": us.verified_status.value if hasattr(us.verified_status, 'value') else str(us.verified_status),
            "level": us.level,
            "years": us.years,
        },
    }


@router.get("/verification/status")
def verification_status(db: Session = Depends(get_db), user=Depends(get_current_active_user)):
    rows = (
        db.query(SkillVerification, Skill.name)
        .join(Skill, Skill.id == SkillVerification.skill_id)
        .filter(SkillVerification.user_id == user.id)
        .order_by(SkillVerification.created_at.desc())
        .all()
    )
    items: List[Dict[str, Any]] = []
    for ver, name in rows:
        items.append({
            "id": str(ver.id),
            "skill_id": str(ver.skill_id),
            "skill_name": name,
            "method": ver.method.value if hasattr(ver.method, 'value') else str(ver.method),
            "status": ver.status.value if hasattr(ver.status, 'value') else str(ver.status),
            "score": ver.score,
            "metadata": ver.metadata,
            "created_at": ver.created_at.isoformat() if ver.created_at else None,
        })
    return {"items": items}


@router.get("")
def list_skills(q: Optional[str] = Query(default=None), limit: int = 50, db: Session = Depends(get_db)):
    query = db.query(Skill).filter(Skill.is_active == True)  # noqa: E712
    if q:
        like = f"%{q.lower()}%"
        query = query.filter(or_(Skill.name.ilike(like), Skill.category.ilike(like)))
    skills = query.order_by(Skill.name.asc()).limit(min(limit, 200)).all()
    return {"items": [{"id": str(s.id), "name": s.name, "category": s.category} for s in skills]}


@router.get("/me")
def my_skills(db: Session = Depends(get_db), user=Depends(get_current_active_user)):
    rows = (
        db.query(UserSkill, Skill.name)
        .join(Skill, Skill.id == UserSkill.skill_id)
        .filter(UserSkill.user_id == user.id)
        .all()
    )
    return {"items": [
        {
            "skill_id": str(us.skill_id),
            "skill_name": name,
            "status": us.verified_status.value if hasattr(us.verified_status, 'value') else str(us.verified_status),
            "level": us.level,
            "years": us.years,
            "evidence_url": us.evidence_url,
        }
        for us, name in rows
    ]}
