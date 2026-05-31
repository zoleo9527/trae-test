from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .. import models, auth
from ..database import get_db

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("")
def get_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    users = db.query(models.User).all()
    return [{"id": u.id, "username": u.username, "name": u.name, "role": u.role} for u in users]


@router.get("/{user_id}")
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        return {"error": "用户不存在"}
    return {"id": user.id, "username": user.username, "name": user.name, "role": user.role}
