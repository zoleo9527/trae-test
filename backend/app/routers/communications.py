from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas, crud
from app.auth import get_current_active_user, requires_roles
from app.audit import AuditLogger

router = APIRouter(prefix="/communications", tags=["沟通记录"])


@router.get("/", response_model=List[schemas.Communication])
def read_communications(
    skip: int = 0,
    limit: int = 100,
    berth_plan_id: Optional[int] = None,
    crew_change_id: Optional[int] = None,
    payment_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(requires_roles(
        models.UserRole.ADMIN,
        models.UserRole.AGENT_MANAGER,
        models.UserRole.SITE_COORDINATOR,
        models.UserRole.DOCUMENT_SPECIALIST,
        models.UserRole.FINANCE
    ))
):
    comms = crud.get_communications(
        db, skip=skip, limit=limit,
        berth_plan_id=berth_plan_id,
        crew_change_id=crew_change_id,
        payment_id=payment_id
    )
    return comms


@router.post("/", response_model=schemas.Communication, status_code=status.HTTP_201_CREATED)
def create_communication(
    comm: schemas.CommunicationCreate,
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
    db_comm = crud.create_communication(db, comm=comm)
    AuditLogger.log_create(db, current_user, "communication", db_comm, request)
    db.commit()
    return db_comm
