from app.models.log import Log
from sqlalchemy.orm import Session

def create_log(db: Session, user_id: int, action: str, details: str = None):
    log_entry = Log(user_id=user_id, action=action, details=details)
    db.add(log_entry)
    db.commit()