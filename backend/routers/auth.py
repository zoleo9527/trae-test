from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, AuditLog
from schemas import LoginRequest, LoginResponse, UserResponse
from datetime import datetime

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == request.username).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    log = AuditLog(
        user_id=user.id,
        action="登录",
        target_type="user",
        target_id=user.id,
        detail=f"用户 {user.display_name} 登录系统",
        created_at=datetime.utcnow()
    )
    db.add(log)
    db.commit()
    return LoginResponse(user=UserResponse.model_validate(user))
