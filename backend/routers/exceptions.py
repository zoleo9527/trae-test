from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from models import ExceptionRecord, User, AuditLog
from schemas import ExceptionRecordUpdate, ExceptionRecordResponse

router = APIRouter(prefix="/api/exceptions", tags=["exceptions"])


def write_audit_log(db: Session, user_id: int, action: str, target_type: str, target_id: int, detail: str):
    log = AuditLog(
        user_id=user_id,
        action=action,
        target_type=target_type,
        target_id=target_id,
        detail=detail,
        created_at=datetime.utcnow()
    )
    db.add(log)


@router.get("", response_model=list[ExceptionRecordResponse])
def list_exceptions(
    status: str = Query(None),
    severity: str = Query(None),
    source_type: str = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(ExceptionRecord)
    if status:
        query = query.filter(ExceptionRecord.status == status)
    if severity:
        query = query.filter(ExceptionRecord.severity == severity)
    if source_type:
        query = query.filter(ExceptionRecord.source_type == source_type)
    return query.all()


@router.get("/{exception_id}", response_model=ExceptionRecordResponse)
def get_exception(exception_id: int, db: Session = Depends(get_db)):
    record = db.query(ExceptionRecord).filter(ExceptionRecord.id == exception_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="异常记录不存在")
    return record


@router.put("/{exception_id}", response_model=ExceptionRecordResponse)
def update_exception(exception_id: int, data: ExceptionRecordUpdate, db: Session = Depends(get_db)):
    record = db.query(ExceptionRecord).filter(ExceptionRecord.id == exception_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="异常记录不存在")
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(record, key, value)
    db.commit()
    db.refresh(record)
    return record


@router.put("/{exception_id}/handle", response_model=ExceptionRecordResponse)
def handle_exception(exception_id: int, user_id: int = Query(...), resolution: str = Query(None), db: Session = Depends(get_db)):
    record = db.query(ExceptionRecord).filter(ExceptionRecord.id == exception_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="异常记录不存在")
    if record.status != "待处理":
        raise HTTPException(status_code=400, detail="当前状态不允许处理")
    record.status = "处理中"
    record.handler_id = user_id
    record.handled_at = datetime.utcnow()
    if resolution:
        record.resolution = resolution
    write_audit_log(
        db, user_id, "处理异常", "exception_record", record.id,
        f"开始处理异常：{record.exception_type} - {record.description[:50]}"
    )
    db.commit()
    db.refresh(record)
    return record


@router.put("/{exception_id}/close", response_model=ExceptionRecordResponse)
def close_exception(exception_id: int, user_id: int = Query(...), resolution: str = Query(None), db: Session = Depends(get_db)):
    record = db.query(ExceptionRecord).filter(ExceptionRecord.id == exception_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="异常记录不存在")
    if record.status != "处理中":
        raise HTTPException(status_code=400, detail="当前状态不允许关闭")
    record.status = "已关闭"
    record.closed_at = datetime.utcnow()
    if resolution:
        record.resolution = resolution
    write_audit_log(
        db, user_id, "关闭异常", "exception_record", record.id,
        f"关闭异常：{record.exception_type}，处理结果：{record.resolution or '无'}"
    )
    db.commit()
    db.refresh(record)
    return record
