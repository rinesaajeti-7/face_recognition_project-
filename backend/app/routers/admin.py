from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.user import User
from app.schemas.user import UserOut
from app.dependencies import get_current_admin

router = APIRouter(
    prefix="/api/admin",
    tags=["Admin"]
)

@router.get("/users", response_model=list[UserOut])
def list_users(
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    return db.query(User).all()


@router.put("/users/{user_id}/role")
def set_user_role(
    user_id: int,
    role: str,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if role not in ["admin", "operator", "detective"]:
        raise HTTPException(status_code=400, detail="Invalid role")

    user.role = role
    db.commit()

    return {"message": "Role updated"}