from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from app.api import deps
from app.schemas.message import Message, MessageCreate, MessageUpdate, MessageResponse
from app.services.message import message as message_service, send_message, get_messages, get_project_messages, mark_message_read
from typing import List

router = APIRouter(prefix="/messages", tags=["messages"])


@router.get("/", response_model=List[MessageResponse])
def list_messages(
    project_id: UUID,
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_user),
):
    # Get messages for a specific project
    return get_project_messages(db, str(project_id))


@router.post("/", response_model=MessageResponse)
def send_message_view(message_in: MessageCreate, db: Session = Depends(deps.get_db), user=Depends(deps.get_current_user)):
    return send_message(db, message_in, user)


@router.get("/{message_id}", response_model=Message)
def get_message(
    message_id: UUID,
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_user),
):
    message = message_service.get(db, id=message_id)
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    return message


@router.put("/{message_id}", response_model=Message)
def update_message(
    message_id: UUID,
    message_in: MessageUpdate,
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_user),
):
    message = message_service.get(db, id=message_id)
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    return message_service.update(db, db_obj=message, obj_in=message_in)


@router.delete("/{message_id}")
def delete_message(
    message_id: UUID,
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_user),
):
    message = message_service.get(db, id=message_id)
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    message_service.remove(db, id=message_id)
    return {"ok": True}


@router.post("/{message_id}/read", response_model=MessageResponse)
def mark_message_read_view(message_id: str, db: Session = Depends(deps.get_db), user=Depends(deps.get_current_user)):
    return mark_message_read(db, message_id, user) 