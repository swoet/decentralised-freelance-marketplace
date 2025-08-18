from sqlalchemy.orm import Session
from app.models.message import Message
from app.schemas.message import MessageCreate, MessageUpdate
from .base_service import CRUDBase

class MessageService(CRUDBase[Message, MessageCreate, MessageUpdate]):
    def send_message(self, db: Session, message_in: MessageCreate, user):
        db_obj = Message()
        setattr(db_obj, 'sender_id', message_in.sender_id)
        setattr(db_obj, 'receiver_id', message_in.receiver_id)
        setattr(db_obj, 'project_id', message_in.project_id)
        setattr(db_obj, 'content', message_in.content)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_messages(self, db: Session, user):
        return db.query(Message).filter(
            (Message.sender_id == user.id) | (Message.receiver_id == user.id)
        ).all()

    def mark_message_read(self, db: Session, message_id: str, user):
        message = db.query(Message).filter(Message.id == message_id).first()
        if message:
            # Add a read field if your model has one, or implement read logic
            db.commit()
            db.refresh(message)
        return message

message = MessageService(Message)

# Export functions for backward compatibility
send_message = message.send_message
get_messages = message.get_messages
mark_message_read = message.mark_message_read 