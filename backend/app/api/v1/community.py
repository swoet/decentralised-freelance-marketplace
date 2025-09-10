from __future__ import annotations
from typing import List, Optional, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user
from app.models.community import CommunityThread, CommunityPost, Event

router = APIRouter(prefix="/community", tags=["community"]) 

# Thread operations
class ThreadCreate(BaseModel):
    title: str
    tags: Optional[List[str]] = None


@router.post("/threads")
def create_thread(payload: ThreadCreate, db: Session = Depends(get_db), user=Depends(get_current_active_user)):
    th = CommunityThread(title=payload.title, author_id=user.id, tags=payload.tags or [])
    db.add(th)
    db.commit()
    db.refresh(th)
    return {"id": str(th.id), "title": th.title, "tags": th.tags}


@router.get("/threads")
def list_threads(
    response: Response,
    q: Optional[str] = Query(default=None),
    preview: bool = Query(False, description="Preview mode for anonymous users - returns featured threads"),
    db: Session = Depends(get_db)
):
    # Add caching headers
    cache_time = 120 if preview else 240  # 2-4 min cache
    response.headers["Cache-Control"] = f"public, max-age={cache_time}, stale-while-revalidate=30"
    response.headers["Vary"] = "Authorization"
    
    query = db.query(CommunityThread)
    if q:
        like = f"%{q}%"
        query = query.filter(CommunityThread.title.ilike(like))
    
    # Limit results for preview mode
    limit = 8 if preview else 100
    rows = query.order_by(CommunityThread.created_at.desc()).limit(limit).all()
    return {"items": [{"id": str(t.id), "title": t.title, "tags": t.tags} for t in rows]}


@router.get("/threads/{thread_id}")
def get_thread(thread_id: str, db: Session = Depends(get_db)):
    th = db.query(CommunityThread).filter(CommunityThread.id == thread_id).first()
    if not th:
        raise HTTPException(status_code=404, detail="Thread not found")
    return {"id": str(th.id), "title": th.title, "tags": th.tags}


class PostCreate(BaseModel):
    body: str


@router.post("/threads/{thread_id}/posts")
def create_post(thread_id: str, payload: PostCreate, db: Session = Depends(get_db), user=Depends(get_current_active_user)):
    th = db.query(CommunityThread).filter(CommunityThread.id == thread_id).first()
    if not th:
        raise HTTPException(status_code=404, detail="Thread not found")
    post = CommunityPost(thread_id=thread_id, author_id=user.id, body=payload.body)
    db.add(post)
    db.commit()
    db.refresh(post)
    return {"id": str(post.id), "body": post.body}


@router.get("/threads/{thread_id}/posts")
def list_posts(thread_id: str, db: Session = Depends(get_db)):
    rows = (
        db.query(CommunityPost)
        .filter(CommunityPost.thread_id == thread_id)
        .order_by(CommunityPost.created_at.asc())
        .limit(500)
        .all()
    )
    return {"items": [{"id": str(p.id), "body": p.body, "author_id": str(p.author_id)} for p in rows]}


# Events endpoints - include events router under community
from app.api.v1.events import router as events_router
router.include_router(events_router, prefix="/events", tags=["community-events"])
