from __future__ import annotations
from typing import List, Dict, Any, Set
import re
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.db import SessionLocal
from app.models.project import Project, ProjectStatus
from app.models.portfolio import Portfolio


STOPWORDS: Set[str] = {
    "the","a","an","and","or","but","if","while","with","to","for","of","in","on","at","by","from","as","is","are","was","were","be","been","it","that","this","these","those","you","your","we","our","they","their"
}


def _normalize(text: str | None) -> str:
    return (text or "").lower()


def _tokenize(text: str) -> List[str]:
    # Keep alphanumerics, split on non-word characters
    tokens = re.split(r"\W+", text)
    return [t for t in tokens if t and t not in STOPWORDS]


def _project_text(p: Project) -> str:
    pieces: List[str] = [p.title or "", p.description or ""]
    try:
        meta = p.project_metadata or {}
        if isinstance(meta, dict):
            tags = meta.get("tags")
            if isinstance(tags, list):
                pieces.extend([str(t) for t in tags])
    except Exception:
        pass
    return " ".join(pieces)


def _jaccard(a: Set[str], b: Set[str]) -> float:
    if not a or not b:
        return 0.0
    inter = a & b
    union = a | b
    if not union:
        return 0.0
    return float(len(inter)) / float(len(union))


def match_projects_for_user(user_id) -> List[Dict[str, Any]]:
    # Create a scoped session for this operation
    db: Session = SessionLocal()
    try:
        # Build user profile tokens from portfolio (and possibly more sources later)
        portfolio = db.query(Portfolio).filter(Portfolio.user_id == user_id).first()
        user_text = _normalize(portfolio.description if portfolio else "")
        user_tokens = set(_tokenize(user_text))

        # If user has no portfolio text, fallback to generic tokens to avoid empty matches
        if not user_tokens:
            user_tokens = {"web", "app", "api", "frontend", "backend", "blockchain", "solidity", "react", "nextjs", "python", "fastapi"}

        # Fetch open projects, newest first
        projects = (
            db.query(Project)
            .filter(Project.status == ProjectStatus.OPEN)
            .order_by(desc(Project.created_at))
            .limit(200)
            .all()
        )

        ranked: List[Dict[str, Any]] = []
        for p in projects:
            p_text = _normalize(_project_text(p))
            p_tokens = set(_tokenize(p_text))
            score = _jaccard(user_tokens, p_tokens)
            if score <= 0.0:
                continue
            reasons: List[str] = []
            overlap = list((user_tokens & p_tokens))[:5]
            if overlap:
                reasons.append(f"Shared keywords: {', '.join(overlap)}")
            ranked.append({
                "project_id": str(p.id),
                "title": p.title,
                "score": round(score, 4),
                "reasons": reasons,
            })

        # Sort by score desc then recent projects first
        ranked.sort(key=lambda x: x["score"], reverse=True)
        return ranked[:50]
    finally:
        db.close()
