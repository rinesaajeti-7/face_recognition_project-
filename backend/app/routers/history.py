from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List
from app.db.database import get_db
from app.models.search import Search
from app.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/history", tags=["History"])


@router.get("/")
def get_search_history(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Merr historikun e kërkimeve"""
    try:
        searches = db.query(Search).filter(
            Search.user_id == current_user.id
        ).order_by(
            desc(Search.created_at)
        ).offset(skip).limit(limit).all()
        
        return searches
    except Exception as e:
        print(f"Error in get_search_history: {e}")
        return []


@router.get("/{search_id}")
def get_search_detail(
    search_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Merr detajet e një kërkimi specifik"""
    try:
        search = db.query(Search).filter(
            Search.id == search_id,
            Search.user_id == current_user.id
        ).first()
        
        if not search:
            raise HTTPException(status_code=404, detail="Search not found")
        
        return search
    except Exception as e:
        print(f"Error in get_search_detail: {e}")
        raise HTTPException(status_code=500, detail=str(e))