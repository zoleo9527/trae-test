from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/api/projects", tags=["projects"])


@router.get("", response_model=List[schemas.Project])
def get_projects(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    query = db.query(models.Project)
    if status:
        query = query.filter(models.Project.status == status)
    return query.order_by(models.Project.created_at.desc()).all()


@router.get("/{project_id}", response_model=schemas.Project)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")
    return project


@router.post("", response_model=schemas.Project)
def create_project(
    project: schemas.ProjectCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    db_project = models.Project(**project.model_dump())
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project


@router.put("/{project_id}", response_model=schemas.Project)
def update_project(
    project_id: int,
    project_update: schemas.ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    db_project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="项目不存在")
    for key, value in project_update.model_dump(exclude_unset=True).items():
        setattr(db_project, key, value)
    db.commit()
    db.refresh(db_project)
    return db_project


@router.get("/{project_id}/progress")
def get_project_progress(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")

    diaries = db.query(models.ConstructionDiary).filter(
        models.ConstructionDiary.project_id == project_id
    ).all()

    total_completed = sum(d.completed_area for d in diaries)
    progress_percent = (total_completed / project.total_area * 100) if project.total_area > 0 else 0

    inspections = db.query(models.QualityInspection).filter(
        models.QualityInspection.project_id == project_id
    ).all()

    passed = sum(1 for i in inspections if i.inspection_result == "passed")
    pass_rate = (passed / len(inspections) * 100) if inspections else 100

    return {
        "total_area": project.total_area,
        "completed_area": total_completed,
        "progress_percent": round(progress_percent, 2),
        "inspection_count": len(inspections),
        "passed_count": passed,
        "pass_rate": round(pass_rate, 2),
        "rework_count": sum(1 for i in inspections if i.rework_required),
        "diary_count": len(diaries)
    }
