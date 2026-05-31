from typing import Optional
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.inspection import Inspection, InspectionItem
from app.schemas.inspection import InspectionCreate, InspectionUpdate, InspectionItemScore
from app.services.audit import log_audit
from app.services.state_machine import validate_inspection_transition, check_optimistic_lock, increment_version


def get_inspections(
    db: Session,
    project_id: Optional[int] = None,
    status: Optional[str] = None,
    inspector_id: Optional[str] = None,
) -> list[Inspection]:
    q = db.query(Inspection)
    if project_id is not None:
        q = q.filter(Inspection.project_id == project_id)
    if status is not None:
        q = q.filter(Inspection.status == status)
    if inspector_id is not None:
        q = q.filter(Inspection.inspector_id == inspector_id)
    return q.order_by(Inspection.created_at.desc()).all()


def get_inspection(db: Session, inspection_id: int) -> Optional[Inspection]:
    return db.query(Inspection).filter(Inspection.id == inspection_id).first()


def create_inspection(db: Session, data: InspectionCreate, operator_id: str, operator_name: str, operator_role: str) -> Inspection:
    items_data = data.items
    create_data = data.model_dump(exclude={"items"})
    inspection = Inspection(**create_data)
    db.add(inspection)
    db.flush()
    for item_data in items_data:
        item = InspectionItem(
            inspection_id=inspection.id,
            result="pending",
            **item_data.model_dump(),
        )
        db.add(item)
    log_audit(
        db, "inspection", inspection.id, "create",
        operator_id, operator_name, operator_role,
        new_values=create_data,
        detail=f"包含 {len(items_data)} 个检查项",
    )
    return inspection


def update_inspection_status(db: Session, inspection_id: int, data: InspectionUpdate, operator_id: str, operator_name: str, operator_role: str, expected_version: Optional[int] = None) -> Optional[Inspection]:
    inspection = get_inspection(db, inspection_id)
    if not inspection:
        return None
    check_optimistic_lock(inspection, expected_version)
    if data.status is not None:
        validate_inspection_transition(inspection.status, data.status)
    old_status = inspection.status
    update_data = data.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(inspection, k, v)
    log_audit(
        db, "inspection", inspection.id, "status_change",
        operator_id, operator_name, operator_role,
        old_values={"status": old_status},
        new_values=update_data,
    )
    increment_version(inspection)
    db.commit()
    db.refresh(inspection)
    return inspection


def score_inspection_item(db: Session, item_id: int, data: InspectionItemScore, operator_id: str, operator_name: str, operator_role: str) -> Optional[InspectionItem]:
    item = db.query(InspectionItem).filter(InspectionItem.id == item_id).first()
    if not item:
        return None
    old_values = {"result": item.result, "score": item.score}
    item.result = data.result
    item.score = data.score
    item.remark = data.remark
    item.photo_url = data.photo_url
    log_audit(
        db, "inspection_item", item.id, "score",
        operator_id, operator_name, operator_role,
        old_values=old_values,
        new_values={"result": data.result, "score": data.score},
    )
    db.commit()
    db.refresh(item)
    return item
