from typing import Optional
from sqlalchemy.orm import Session
from app.models.project import Project
from app.schemas.project import ProjectCreate, ProjectUpdate
from app.services.audit import log_audit


def get_projects(db: Session, is_active: Optional[bool] = None) -> list[Project]:
    q = db.query(Project)
    if is_active is not None:
        q = q.filter(Project.is_active == is_active)
    return q.order_by(Project.created_at.desc()).all()


def get_project(db: Session, project_id: int) -> Optional[Project]:
    return db.query(Project).filter(Project.id == project_id).first()


def create_project(db: Session, data: ProjectCreate, operator_id: str, operator_name: str, operator_role: str) -> Project:
    project = Project(**data.model_dump())
    db.add(project)
    db.flush()
    log_audit(
        db, "project", project.id, "create",
        operator_id, operator_name, operator_role,
        new_values=data.model_dump(),
    )
    db.commit()
    db.refresh(project)
    return project


def update_project(db: Session, project_id: int, data: ProjectUpdate, operator_id: str, operator_name: str, operator_role: str) -> Optional[Project]:
    project = get_project(db, project_id)
    if not project:
        return None
    old_values = {
        k: getattr(project, k) for k in data.model_dump(exclude_unset=True)
    }
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(project, k, v)
    log_audit(
        db, "project", project.id, "update",
        operator_id, operator_name, operator_role,
        old_values=old_values,
        new_values=data.model_dump(exclude_unset=True),
    )
    db.commit()
    db.refresh(project)
    return project
