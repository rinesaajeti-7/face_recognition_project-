from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.search import Search
from app.dependencies import get_current_user

router = APIRouter()

@router.get("/")
def get_search_history(skip: int = 0, limit: int = 50, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    searches = db.query(Search).filter(Search.user_id == current_user.id).order_by(Search.created_at.desc()).offset(skip).limit(limit).all()
    return searches