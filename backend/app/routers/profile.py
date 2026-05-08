from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.user import User
from app.schemas.user import UserOut
from app.dependencies import get_current_user
from passlib.context import CryptContext

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@router.get("/", response_model=UserOut)
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/change-password")
def change_password(old_password: str, new_password: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not pwd_context.verify(old_password, current_user.hashed_password):
        raise HTTPException(400, "Incorrect old password")
    current_user.hashed_password = pwd_context.hash(new_password)
    db.commit()
    return {"message": "Password updated"}