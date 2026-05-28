from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas, crud
from app.auth import get_current_active_user, requires_roles
from app.audit import AuditLogger, VersionConflictError

router = APIRouter(prefix="/berths", tags=["靠泊计划"])


@router.get("/", response_model=List[schemas.BerthPlan])
def read_berth_plans(
    skip: int = 0,
    limit: int = 100,
    status: Optional[models.TaskStatus] = None,
    port: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(requires_roles(
        models.UserRole.ADMIN,
        models.UserRole.AGENT_MANAGER,
        models.UserRole.SITE_COORDINATOR,
        models.UserRole.DOCUMENT_SPECIALIST,
        models.UserRole.FINANCE
    ))
):
    berths = crud.get_berth_plans(db, skip=skip, limit=limit, status=status, port=port)
    return berths


@router.get("/{berth_id}", response_model=schemas.BerthPlanDetail)
def read_berth_plan(
    berth_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(requires_roles(
        models.UserRole.ADMIN,
        models.UserRole.AGENT_MANAGER,
        models.UserRole.SITE_COORDINATOR,
        models.UserRole.DOCUMENT_SPECIALIST,
        models.UserRole.FINANCE
    ))
):
    db_berth = crud.get_berth_plan(db, berth_id=berth_id)
    if db_berth is None:
        raise HTTPException(status_code=404, detail="Berth plan not found")
    return db_berth


@router.post("/", response_model=schemas.BerthPlan, status_code=status.HTTP_201_CREATED)
def create_berth_plan(
    berth: schemas.BerthPlanCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(requires_roles(
        models.UserRole.ADMIN,
        models.UserRole.AGENT_MANAGER,
        models.UserRole.SITE_COORDINATOR
    ))
):
    db_berth = crud.create_berth_plan(db, berth=berth, user_id=current_user.id)
    AuditLogger.log_create(db, current_user, "berth_plan", db_berth, request)
    db.commit()
    return db_berth


@router.put("/{berth_id}", response_model=schemas.BerthPlan)
def update_berth_plan(
    berth_id: int,
    berth: schemas.BerthPlanUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(requires_roles(
        models.UserRole.ADMIN,
        models.UserRole.AGENT_MANAGER,
        models.UserRole.SITE_COORDINATOR
    ))
):
    db_berth_old = crud.get_berth_plan(db, berth_id=berth_id)
    if db_berth_old is None:
        raise HTTPException(status_code=404, detail="Berth plan not found")
    old_snapshot = AuditLogger.snapshot(db_berth_old)
    try:
        db_berth = crud.update_berth_plan(db, berth_id=berth_id, berth=berth)
        AuditLogger.log_update(db, current_user, "berth_plan", old_snapshot, db_berth, request)
        db.commit()
        return db_berth
    except VersionConflictError as e:
        raise HTTPException(status_code=409, detail=str(e))
