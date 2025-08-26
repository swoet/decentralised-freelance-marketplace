from __future__ import annotations
from typing import List, Optional, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, Query
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
def list_threads(q: Optional[str] = Query(default=None), db: Session = Depends(get_db)):
    query = db.query(CommunityThread)
    if q:
        like = f"%{q}%"
        query = query.filter(CommunityThread.title.ilike(like))
    rows = query.order_by(CommunityThread.created_at.desc()).limit(100).all()
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


# Events
class EventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    starts_at: Optional[str] = None
    ends_at: Optional[str] = None
    link: Optional[str] = None


@router.post("/events")
def create_event(payload: EventCreate, db: Session = Depends(get_db), user=Depends(get_current_active_user)):
    ev = Event(title=payload.title, description=payload.description, link=payload.link)
    db.add(ev)
    db.commit()
    db.refresh(ev)
    return {"id": str(ev.id), "title": ev.title, "starts_at": ev.starts_at.isoformat() if ev.starts_at else None}


@router.get("/events")
def list_events(db: Session = Depends(get_db)):
    rows = db.query(Event).order_by(Event.starts_at.desc()).limit(100).all()
    return {"items": [{"id": str(e.id), "title": e.title, "starts_at": e.starts_at.isoformat() if e.starts_at else None, "link": e.link} for e in rows]}
