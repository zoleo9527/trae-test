from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException, Header
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectOut
from app.schemas.operator import OperatorContext
from app.dependencies import get_operator_context
from app.services.idempotency import check_idempotency, create_idempotency_record, DuplicateSubmissionError, MissingIdempotencyKeyError
from app.services import project as svc

router = APIRouter(prefix="/projects", tags=["项目"])


@router.get("", response_model=list[ProjectOut])
def list_projects(is_active: Optional[bool] = None, db: Session = Depends(get_db)):
    return svc.get_projects(db, is_active)


@router.get("/{project_id}", response_model=ProjectOut)
def get_project(project_id: int, db: Session = Depends(get_db)):
    p = svc.get_project(db, project_id)
    if not p:
        raise HTTPException(404, "项目不存在")
    return p


@router.post("", response_model=ProjectOut, status_code=201)
def create_project(
    data: ProjectCreate,
    db: Session = Depends(get_db),
    operator: OperatorContext = Depends(get_operator_context),
    x_idempotency_key: Optional[str] = Header(None, alias="X-Idempotency-Key"),
):
    if not x_idempotency_key:
        raise MissingIdempotencyKeyError("project")
    try:
        check_idempotency(db, x_idempotency_key, "project", operator.operator_id)
        p = svc.create_project(db, data, operator.operator_id, operator.operator_name, operator.operator_role)
        create_idempotency_record(db, x_idempotency_key, "project", p.id, operator.operator_id)
        db.commit()
        db.refresh(p)
        return p
    except DuplicateSubmissionError as e:
        db.rollback()
        raise HTTPException(409, str(e))
    except MissingIdempotencyKeyError as e:
        db.rollback()
        raise HTTPException(400, str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(400, str(e))


@router.put("/{project_id}", response_model=ProjectOut)
def update_project(
    project_id: int,
    data: ProjectUpdate,
    db: Session = Depends(get_db),
    operator: OperatorContext = Depends(get_operator_context),
):
    p = svc.update_project(db, project_id, data, operator.operator_id, operator.operator_name, operator.operator_role)
    if not p:
        raise HTTPException(404, "项目不存在")
    return p
