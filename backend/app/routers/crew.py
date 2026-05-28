from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas, crud
from app.auth import get_current_active_user, requires_roles
from app.audit import AuditLogger, VersionConflictError

router = APIRouter(prefix="/crew", tags=["船员换班"])


@router.get("/", response_model=List[schemas.CrewChange])
def read_crew_changes(
    skip: int = 0,
    limit: int = 100,
    status: Optional[models.TaskStatus] = None,
    berth_plan_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(requires_roles(
        models.UserRole.ADMIN,
        models.UserRole.AGENT_MANAGER,
        models.UserRole.SITE_COORDINATOR,
        models.UserRole.DOCUMENT_SPECIALIST
    ))
):
    crew_changes = crud.get_crew_changes(db, skip=skip, limit=limit, status=status, berth_plan_id=berth_plan_id)
    return crew_changes


@router.get("/{crew_id}", response_model=schemas.CrewChangeDetail)
def read_crew_change(
    crew_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(requires_roles(
        models.UserRole.ADMIN,
        models.UserRole.AGENT_MANAGER,
        models.UserRole.SITE_COORDINATOR,
        models.UserRole.DOCUMENT_SPECIALIST
    ))
):
    db_crew = crud.get_crew_change(db, crew_id=crew_id)
    if db_crew is None:
        raise HTTPException(status_code=404, detail="Crew change not found")
    return db_crew


@router.post("/", response_model=schemas.CrewChange, status_code=status.HTTP_201_CREATED)
def create_crew_change(
    crew: schemas.CrewChangeCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(requires_roles(
        models.UserRole.ADMIN,
        models.UserRole.AGENT_MANAGER,
        models.UserRole.SITE_COORDINATOR,
        models.UserRole.DOCUMENT_SPECIALIST
    ))
):
    db_crew = crud.create_crew_change(db, crew=crew, user_id=current_user.id)
    AuditLogger.log_create(db, current_user, "crew_change", db_crew, request)
    db.commit()
    return db_crew


@router.put("/{crew_id}", response_model=schemas.CrewChange)
def update_crew_change(
    crew_id: int,
    crew: schemas.CrewChangeUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(requires_roles(
        models.UserRole.ADMIN,
        models.UserRole.AGENT_MANAGER,
        models.UserRole.SITE_COORDINATOR,
        models.UserRole.DOCUMENT_SPECIALIST
    ))
):
    db_crew_old = crud.get_crew_change(db, crew_id=crew_id)
    if db_crew_old is None:
        raise HTTPException(status_code=404, detail="Crew change not found")
    old_snapshot = AuditLogger.snapshot(db_crew_old)
    try:
        db_crew = crud.update_crew_change(db, crew_id=crew_id, crew=crew)
        AuditLogger.log_update(db, current_user, "crew_change", old_snapshot, db_crew, request)
        db.commit()
        return db_crew
    except VersionConflictError as e:
        raise HTTPException(status_code=409, detail=str(e))
