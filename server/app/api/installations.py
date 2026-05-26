from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import get_db
from app.models import Installation, OrderTimeline
from app.schemas import InstallationCreate, InstallationUpdate, InstallationResponse

router = APIRouter()


def _add_timeline(db: Session, order_id: int, event_type: str, event_description: str, operator_name: str = "系统"):
    timeline = OrderTimeline(
        order_id=order_id,
        event_type=event_type,
        event_description=event_description,
        operator_name=operator_name,
    )
    db.add(timeline)


@router.get("/{order_id}/installations", response_model=list[InstallationResponse])
def list_installations(order_id: int, db: Session = Depends(get_db)):
    installations = db.query(Installation).filter(Installation.order_id == order_id).all()
    return [InstallationResponse.model_validate(i) for i in installations]


@router.post("/{order_id}/installations", response_model=InstallationResponse)
def create_installation(order_id: int, inst_data: InstallationCreate, db: Session = Depends(get_db)):
    installation = Installation(
        order_id=order_id,
        item_id=inst_data.item_id,
        scheduled_date=inst_data.scheduled_date,
        installer=inst_data.installer,
        contact_name=inst_data.contact_name,
        contact_phone=inst_data.contact_phone,
        remarks=inst_data.remarks,
        status="scheduled",
    )
    db.add(installation)
    db.flush()
    date_str = inst_data.scheduled_date.strftime("%Y-%m-%d %H:%M")
    _add_timeline(db, order_id, "installation_scheduled", f"安装预约：{date_str}，安装师{inst_data.installer}，联系人{inst_data.contact_name}")
    db.commit()
    db.refresh(installation)
    return InstallationResponse.model_validate(installation)


@router.put("/{order_id}/installations/{inst_id}", response_model=InstallationResponse)
def update_installation(order_id: int, inst_id: int, update_data: InstallationUpdate, db: Session = Depends(get_db)):
    installation = db.query(Installation).filter(Installation.id == inst_id, Installation.order_id == order_id).first()
    if not installation:
        raise HTTPException(status_code=404, detail="安装预约不存在")

    old_status = installation.status
    old_date = installation.scheduled_date

    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(installation, field, value)

    if update_data.scheduled_date and update_data.scheduled_date != old_date:
        installation.reschedule_count = (installation.reschedule_count or 0) + 1
        installation.status = "rescheduled"
        _add_timeline(db, order_id, "installation_rescheduled", f"安装改期至：{update_data.scheduled_date.strftime('%Y-%m-%d %H:%M')}（第{installation.reschedule_count}次）")

    if update_data.status:
        if update_data.status == "completed" and old_status != "completed":
            installation.actual_end_date = datetime.now()
            _add_timeline(db, order_id, "installation_completed", f"安装完成：{installation.installer}")
        elif update_data.status == "problem":
            _add_timeline(db, order_id, "installation_problem", f"安装问题：{update_data.problem_description or installation.problem_description or '未填写'}")
        elif update_data.status == "cancelled":
            _add_timeline(db, order_id, "installation_cancelled", f"安装已取消")

    db.commit()
    db.refresh(installation)
    return InstallationResponse.model_validate(installation)


@router.delete("/{order_id}/installations/{inst_id}")
def delete_installation(order_id: int, inst_id: int, db: Session = Depends(get_db)):
    installation = db.query(Installation).filter(Installation.id == inst_id, Installation.order_id == order_id).first()
    if not installation:
        raise HTTPException(status_code=404, detail="安装预约不存在")
    db.delete(installation)
    db.commit()
    return {"message": "安装预约已删除"}