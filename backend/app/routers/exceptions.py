from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
from app.database import get_db
from app.auth import get_current_user, require_roles
from app.models import User, ExceptionRecord
from app.schemas import ExceptionIn, ExceptionOut, ExceptionStatusUpdate

router = APIRouter(prefix="/api/exceptions", tags=["exceptions"])


def _enrich(e: ExceptionRecord) -> dict:
    return {
        "id": e.id, "type": e.type, "related_type": e.related_type,
        "related_id": e.related_id, "title": e.title, "description": e.description,
        "evidence": e.evidence, "amount": e.amount, "status": e.status,
        "handler": e.handler, "created_at": e.created_at, "updated_at": e.updated_at,
        "remark": e.remark,
    }


@router.get("", response_model=list[ExceptionOut])
def list_exceptions(
    type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    related_type: Optional[str] = Query(None),
    related_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(ExceptionRecord)
    if type:
        q = q.filter(ExceptionRecord.type == type)
    if status:
        q = q.filter(ExceptionRecord.status == status)
    if related_type:
        q = q.filter(ExceptionRecord.related_type == related_type)
    if related_id:
        q = q.filter(ExceptionRecord.related_id == related_id)
    items = q.order_by(ExceptionRecord.created_at.desc()).all()
    return [_enrich(e) for e in items]


@router.post("", response_model=ExceptionOut)
def create_exception(req: ExceptionIn, db: Session = Depends(get_db),
                     current: User = Depends(require_roles("stall_manager", "finance"))):
    e = ExceptionRecord(
        type=req.type, related_type=req.related_type, related_id=req.related_id,
        title=req.title, description=req.description, evidence=req.evidence,
        amount=req.amount, status="待处理",
        handler=req.handler or current.name,
        remark=req.remark,
        created_at=datetime.now(), updated_at=datetime.now(),
    )
    db.add(e)
    db.commit()
    db.refresh(e)
    return _enrich(e)


@router.patch("/{exception_id}/status", response_model=ExceptionOut)
def update_status(exception_id: int, req: ExceptionStatusUpdate,
                  db: Session = Depends(get_db),
                  _: User = Depends(require_roles("stall_manager", "finance"))):
    e = db.query(ExceptionRecord).get(exception_id)
    if not e:
        raise HTTPException(404, "异常单不存在")
    e.status = req.status
    e.remark = (e.remark or "") + (f"\n[{datetime.now():%m-%d %H:%M}] {req.remark}" if req.remark else "")
    e.updated_at = datetime.now()
    db.commit()
    return _enrich(e)


@router.delete("/{exception_id}")
def delete_exception(exception_id: int, db: Session = Depends(get_db),
                     _: User = Depends(require_roles("stall_manager", "finance"))):
    e = db.query(ExceptionRecord).get(exception_id)
    if not e:
        raise HTTPException(404, "异常单不存在")
    db.delete(e)
    db.commit()
    return {"ok": True}
