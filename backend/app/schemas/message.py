from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime

class MessageBase(BaseModel):
    sender_id: UUID
    receiver_id: UUID
    project_id: UUID
    content: str

class MessageCreate(MessageBase):
    pass

class MessageUpdate(BaseModel):
    content: Optional[str] = None

class Message(MessageBase):
    id: UUID
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class MessageResponse(Message):
    pass 