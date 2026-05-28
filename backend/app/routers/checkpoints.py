from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas, crud
from app.auth import get_current_active_user, requires_roles
from app.audit import AuditLogger, VersionConflictError

router = APIRouter(prefix="/checkpoints", tags=["截点提醒"])


@router.get("/", response_model=List[schemas.CheckpointReminder])
def read_checkpoints(
    skip: int = 0,
    limit: int = 100,
    status: Optional[models.TaskStatus] = None,
    assigned_to: Optional[int] = None,
    overdue_only: bool = False,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(requires_roles(
        models.UserRole.ADMIN,
        models.UserRole.AGENT_MANAGER,
        models.UserRole.SITE_COORDINATOR,
        models.UserRole.DOCUMENT_SPECIALIST,
        models.UserRole.FINANCE
    ))
):
    checkpoints = crud.get_checkpoints(
        db, skip=skip, limit=limit, status=status,
        assigned_to=assigned_to, overdue_only=overdue_only
    )
    return checkpoints


@router.get("/{checkpoint_id}", response_model=schemas.CheckpointReminderDetail)
def read_checkpoint(
    checkpoint_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(requires_roles(
        models.UserRole.ADMIN,
        models.UserRole.AGENT_MANAGER,
        models.UserRole.SITE_COORDINATOR,
        models.UserRole.DOCUMENT_SPECIALIST,
        models.UserRole.FINANCE
    ))
):
    db_checkpoint = crud.get_checkpoint(db, checkpoint_id=checkpoint_id)
    if db_checkpoint is None:
        raise HTTPException(status_code=404, detail="Checkpoint not found")
    return db_checkpoint


@router.post("/", response_model=schemas.CheckpointReminder, status_code=status.HTTP_201_CREATED)
def create_checkpoint(
    checkpoint: schemas.CheckpointReminderCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(requires_roles(
        models.UserRole.ADMIN,
        models.UserRole.AGENT_MANAGER,
        models.UserRole.SITE_COORDINATOR,
        models.UserRole.DOCUMENT_SPECIALIST,
        models.UserRole.FINANCE
    ))
):
    db_checkpoint = crud.create_checkpoint(db, checkpoint=checkpoint)
    AuditLogger.log_create(db, current_user, "checkpoint", db_checkpoint, request)
    db.commit()
    return db_checkpoint


@router.put("/{checkpoint_id}", response_model=schemas.CheckpointReminder)
def update_checkpoint(
    checkpoint_id: int,
    checkpoint: schemas.CheckpointReminderUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(requires_roles(
        models.UserRole.ADMIN,
        models.UserRole.AGENT_MANAGER,
        models.UserRole.SITE_COORDINATOR,
        models.UserRole.DOCUMENT_SPECIALIST,
        models.UserRole.FINANCE
    ))
):
    db_checkpoint_old = crud.get_checkpoint(db, checkpoint_id=checkpoint_id)
    if db_checkpoint_old is None:
        raise HTTPException(status_code=404, detail="Checkpoint not found")
    old_snapshot = AuditLogger.snapshot(db_checkpoint_old)
    try:
        db_checkpoint = crud.update_checkpoint(db, checkpoint_id=checkpoint_id, checkpoint=checkpoint)
        AuditLogger.log_update(db, current_user, "checkpoint", old_snapshot, db_checkpoint, request)
        db.commit()
        return db_checkpoint
    except VersionConflictError as e:
        raise HTTPException(status_code=409, detail=str(e))
