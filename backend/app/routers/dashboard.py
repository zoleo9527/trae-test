from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=schemas.DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    total_projects = db.query(models.Project).count()
    in_progress_projects = db.query(models.Project).filter(models.Project.status == "in_progress").count()
    pending_inspections = db.query(models.QualityInspection).filter(
        models.QualityInspection.status.in_(["pending", "rework_required"])
    ).count()
    exception_count = db.query(models.ConstructionDiary).filter(
        models.ConstructionDiary.is_exception == True,
        models.ConstructionDiary.exception_handled == False
    ).count()
    pending_settlements = db.query(models.TeamSettlement).filter(
        models.TeamSettlement.status.in_(["draft", "pending", "dispute"])
    ).count()
    diaries = db.query(models.ConstructionDiary).all()
    total_completed_area = sum(d.completed_area for d in diaries)

    return schemas.DashboardStats(
        total_projects=total_projects,
        in_progress_projects=in_progress_projects,
        pending_inspections=pending_inspections,
        exception_count=exception_count,
        pending_settlements=pending_settlements,
        total_completed_area=total_completed_area
    )


@router.get("/exceptions")
def get_exceptions(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    exceptions = []

    diary_exceptions = db.query(models.ConstructionDiary).filter(
        models.ConstructionDiary.is_exception == True
    ).all()
    for d in diary_exceptions:
        project = db.query(models.Project).filter(models.Project.id == d.project_id).first()
        exceptions.append({
            "id": f"diary_{d.id}",
            "type": d.exception_type or "施工异常",
            "source": "diary",
            "source_id": d.id,
            "title": f"{project.name if project else '未知项目'} - 施工异常",
            "description": d.exception_reason or d.problems or "",
            "status": "已处理" if d.exception_handled else "待处理",
            "created_at": d.created_at,
            "project_name": project.name if project else "未知项目"
        })

    rework_inspections = db.query(models.QualityInspection).filter(
        models.QualityInspection.rework_required == True
    ).all()
    for i in rework_inspections:
        project = db.query(models.Project).filter(models.Project.id == i.project_id).first()
        exceptions.append({
            "id": f"inspection_{i.id}",
            "type": "返工整改",
            "source": "inspection",
            "source_id": i.id,
            "title": f"{project.name if project else '未知项目'} - 质量问题需返工",
            "description": i.rework_reason or i.issues_found or "",
            "status": "已完成" if i.rectification_completed else "待整改",
            "created_at": i.created_at,
            "project_name": project.name if project else "未知项目"
        })

    disputed_settlements = db.query(models.TeamSettlement).filter(
        models.TeamSettlement.has_dispute == True
    ).all()
    for s in disputed_settlements:
        project = db.query(models.Project).filter(models.Project.id == s.project_id).first()
        team = db.query(models.Team).filter(models.Team.id == s.team_id).first()
        exceptions.append({
            "id": f"settlement_{s.id}",
            "type": "结算争议",
            "source": "settlement",
            "source_id": s.id,
            "title": f"{project.name if project else '未知项目'} - {team.name if team else '未知班组'}结算争议",
            "description": s.dispute_reason or "",
            "status": "已解决" if s.dispute_resolved else "待解决",
            "created_at": s.created_at,
            "project_name": project.name if project else "未知项目"
        })

    material_issues = db.query(models.MaterialDelivery).filter(
        models.MaterialDelivery.has_quality_issue == True
    ).all()
    for m in material_issues:
        project = db.query(models.Project).filter(models.Project.id == m.project_id).first()
        exceptions.append({
            "id": f"delivery_{m.id}",
            "type": "材料质量问题",
            "source": "delivery",
            "source_id": m.id,
            "title": f"{project.name if project else '未知项目'} - {m.material_name}质量问题",
            "description": m.quality_issue_note or "",
            "status": "已处理" if m.return_quantity > 0 else "待处理",
            "created_at": m.created_at,
            "project_name": project.name if project else "未知项目"
        })

    exceptions.sort(key=lambda x: x["created_at"], reverse=True)
    return exceptions


@router.get("/recent-activities")
def get_recent_activities(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    activities = []

    diaries = db.query(models.ConstructionDiary).order_by(
        models.ConstructionDiary.created_at.desc()
    ).limit(5).all()
    for d in diaries:
        project = db.query(models.Project).filter(models.Project.id == d.project_id).first()
        activities.append({
            "id": f"diary_{d.id}",
            "type": "施工日志",
            "title": f"提交施工日志 - {project.name if project else '未知项目'}",
            "time": d.created_at,
            "status": d.status
        })

    inspections = db.query(models.QualityInspection).order_by(
        models.QualityInspection.created_at.desc()
    ).limit(5).all()
    for i in inspections:
        project = db.query(models.Project).filter(models.Project.id == i.project_id).first()
        activities.append({
            "id": f"inspection_{i.id}",
            "type": "质量检查",
            "title": f"质量检查{'合格' if i.inspection_result == 'passed' else '不合格'} - {project.name if project else '未知项目'}",
            "time": i.created_at,
            "status": i.status
        })

    activities.sort(key=lambda x: x["time"], reverse=True)
    return activities[:10]
