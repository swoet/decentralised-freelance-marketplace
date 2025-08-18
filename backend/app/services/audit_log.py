import logging
from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog

def log_action(db: Session, user_id, action, entity, details=None):
    try:
        log = AuditLog(user_id=user_id, action=action, entity=entity, details=details)
        db.add(log)
        db.commit()
    except Exception as e:
        db.rollback()
        logging.error(f"Failed to log audit action: {e}") 