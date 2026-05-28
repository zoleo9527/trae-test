from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas, crud
from app.auth import get_current_active_user, requires_roles

router = APIRouter(prefix="/audit", tags=["审计日志"])


@router.get("/", response_model=List[schemas.AuditLog])
def read_audit_logs(
    skip: int = 0,
    limit: int = 100,
    resource_type: Optional[str] = None,
    resource_id: Optional[int] = None,
    user_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(requires_roles(models.UserRole.ADMIN, models.UserRole.AGENT_MANAGER))
):
    logs = crud.get_audit_logs(
        db, skip=skip, limit=limit,
        resource_type=resource_type,
        resource_id=resource_id,
        user_id=user_id
    )
    return logs
