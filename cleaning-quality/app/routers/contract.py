from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.contract import ContractCreate, ContractUpdate, ContractFollowUp, ContractOut
from app.schemas.operator import OperatorContext
from app.dependencies import get_operator_context
from app.services.state_machine import StateTransitionError
from app.services.idempotency import check_idempotency, create_idempotency_record, DuplicateSubmissionError, MissingIdempotencyKeyError
from app.services import contract as svc

router = APIRouter(prefix="/contracts", tags=["合同续约"])


@router.get("", response_model=list[ContractOut])
def list_contracts(project_id: Optional[int] = None, status: Optional[str] = None, db: Session = Depends(get_db)):
    return svc.get_contracts(db, project_id, status)


@router.get("/{contract_id}", response_model=ContractOut)
def get_contract(contract_id: int, db: Session = Depends(get_db)):
    c = svc.get_contract(db, contract_id)
    if not c:
        raise HTTPException(404, "合同不存在")
    return c


@router.post("", response_model=ContractOut, status_code=201)
def create_contract(
    data: ContractCreate,
    db: Session = Depends(get_db),
    operator: OperatorContext = Depends(get_operator_context),
    x_idempotency_key: Optional[str] = Header(None, alias="X-Idempotency-Key"),
):
    if not x_idempotency_key:
        raise MissingIdempotencyKeyError("contract")
    try:
        check_idempotency(db, x_idempotency_key, "contract", operator.operator_id)
        c = svc.create_contract(db, data, operator.operator_id, operator.operator_name, operator.operator_role)
        create_idempotency_record(db, x_idempotency_key, "contract", c.id, operator.operator_id)
        db.commit()
        db.refresh(c)
        return c
    except DuplicateSubmissionError as e:
        db.rollback()
        raise HTTPException(409, str(e))
    except MissingIdempotencyKeyError as e:
        db.rollback()
        raise HTTPException(400, str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(400, str(e))


@router.put("/{contract_id}", response_model=ContractOut)
def update_contract(
    contract_id: int,
    data: ContractUpdate,
    db: Session = Depends(get_db),
    operator: OperatorContext = Depends(get_operator_context),
):
    try:
        c = svc.update_contract(db, contract_id, data, operator.operator_id, operator.operator_name, operator.operator_role)
    except (ValueError, StateTransitionError) as e:
        raise HTTPException(400, str(e))
    if not c:
        raise HTTPException(404, "合同不存在")
    return c


@router.post("/{contract_id}/followup", response_model=ContractOut)
def followup_contract(
    contract_id: int,
    data: ContractFollowUp,
    db: Session = Depends(get_db),
    operator: OperatorContext = Depends(get_operator_context),
):
    try:
        c = svc.followup_contract(db, contract_id, data, operator.operator_id, operator.operator_name, operator.operator_role)
    except (ValueError, StateTransitionError) as e:
        raise HTTPException(400, str(e))
    if not c:
        raise HTTPException(404, "合同不存在")
    return c
