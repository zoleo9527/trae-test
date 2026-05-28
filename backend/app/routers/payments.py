from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas, crud
from app.auth import get_current_active_user, requires_roles
from app.audit import AuditLogger, VersionConflictError

router = APIRouter(prefix="/payments", tags=["垫付款项"])


@router.get("/", response_model=List[schemas.AdvancePayment])
def read_payments(
    skip: int = 0,
    limit: int = 100,
    payment_status: Optional[models.PaymentStatus] = None,
    reimbursement_status: Optional[models.PaymentStatus] = None,
    vendor_name: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(requires_roles(
        models.UserRole.ADMIN,
        models.UserRole.AGENT_MANAGER,
        models.UserRole.FINANCE
    ))
):
    payments = crud.get_payments(
        db, skip=skip, limit=limit,
        payment_status=payment_status,
        reimbursement_status=reimbursement_status,
        vendor_name=vendor_name
    )
    return payments


@router.get("/{payment_id}", response_model=schemas.AdvancePayment)
def read_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(requires_roles(
        models.UserRole.ADMIN,
        models.UserRole.AGENT_MANAGER,
        models.UserRole.FINANCE
    ))
):
    db_payment = crud.get_payment(db, payment_id=payment_id)
    if db_payment is None:
        raise HTTPException(status_code=404, detail="Payment not found")
    return db_payment


@router.post("/", response_model=schemas.AdvancePayment, status_code=status.HTTP_201_CREATED)
def create_payment(
    payment: schemas.AdvancePaymentCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(requires_roles(
        models.UserRole.ADMIN,
        models.UserRole.AGENT_MANAGER,
        models.UserRole.FINANCE
    ))
):
    db_payment = crud.create_payment(db, payment=payment, user_id=current_user.id)
    AuditLogger.log_create(db, current_user, "payment", db_payment, request)
    db.commit()
    return db_payment


@router.put("/{payment_id}", response_model=schemas.AdvancePayment)
def update_payment(
    payment_id: int,
    payment: schemas.AdvancePaymentUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(requires_roles(
        models.UserRole.ADMIN,
        models.UserRole.AGENT_MANAGER,
        models.UserRole.FINANCE
    ))
):
    db_payment_old = crud.get_payment(db, payment_id=payment_id)
    if db_payment_old is None:
        raise HTTPException(status_code=404, detail="Payment not found")
    old_snapshot = AuditLogger.snapshot(db_payment_old)
    try:
        db_payment = crud.update_payment(db, payment_id=payment_id, payment=payment)
        AuditLogger.log_update(db, current_user, "payment", old_snapshot, db_payment, request)
        db.commit()
        return db_payment
    except VersionConflictError as e:
        raise HTTPException(status_code=409, detail=str(e))
