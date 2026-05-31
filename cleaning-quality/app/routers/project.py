from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectOut
from app.services import project as svc

router = APIRouter(prefix="/projects", tags=["项目"])


def _op(request_headers=None):
    return "op_default", "默认操作员", "admin"


@router.get("", response_model=list[ProjectOut])
def list_projects(is_active: Optional[bool] = None, db: Session = Depends(get_db)):
    return svc.get_projects(db, is_active)


@router.get("/{project_id}", response_model=ProjectOut)
def get_project(project_id: int, db: Session = Depends(get_db)):
    p = svc.get_project(db, project_id)
    if not p:
        from fastapi import HTTPException
        raise HTTPException(404, "项目不存在")
    return p


@router.post("", response_model=ProjectOut, status_code=201)
def create_project(data: ProjectCreate, db: Session = Depends(get_db)):
    op_id, op_name, op_role = _op()
    return svc.create_project(db, data, op_id, op_name, op_role)


@router.put("/{project_id}", response_model=ProjectOut)
def update_project(project_id: int, data: ProjectUpdate, db: Session = Depends(get_db)):
    op_id, op_name, op_role = _op()
    p = svc.update_project(db, project_id, data, op_id, op_name, op_role)
    if not p:
        from fastapi import HTTPException
        raise HTTPException(404, "项目不存在")
    return p
