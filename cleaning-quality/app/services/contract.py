from typing import Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.contract import Contract
from app.schemas.contract import ContractCreate, ContractUpdate, ContractFollowUp
from app.services.audit import log_audit
from app.services.state_machine import validate_contract_transition


def get_contracts(db: Session, project_id: Optional[int] = None, status: Optional[str] = None) -> list[Contract]:
    q = db.query(Contract)
    if project_id is not None:
        q = q.filter(Contract.project_id == project_id)
    if status is not None:
        q = q.filter(Contract.status == status)
    return q.order_by(Contract.end_date.asc()).all()


def get_contract(db: Session, contract_id: int) -> Optional[Contract]:
    return db.query(Contract).filter(Contract.id == contract_id).first()


def create_contract(db: Session, data: ContractCreate, operator_id: str, operator_name: str, operator_role: str) -> Contract:
    contract = Contract(**data.model_dump())
    db.add(contract)
    db.flush()
    log_audit(
        db, "contract", contract.id, "create",
        operator_id, operator_name, operator_role,
        new_values=data.model_dump(),
    )
    db.commit()
    db.refresh(contract)
    return contract


def update_contract(db: Session, contract_id: int, data: ContractUpdate, operator_id: str, operator_name: str, operator_role: str) -> Optional[Contract]:
    contract = get_contract(db, contract_id)
    if not contract:
        return None
    if data.status is not None:
        validate_contract_transition(contract.status, data.status)
    old_values = {k: getattr(contract, k) for k in data.model_dump(exclude_unset=True)}
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(contract, k, v)
    log_audit(
        db, "contract", contract.id, "update",
        operator_id, operator_name, operator_role,
        old_values=old_values,
        new_values=data.model_dump(exclude_unset=True),
    )
    db.commit()
    db.refresh(contract)
    return contract


def followup_contract(db: Session, contract_id: int, data: ContractFollowUp, operator_id: str, operator_name: str, operator_role: str) -> Optional[Contract]:
    contract = get_contract(db, contract_id)
    if not contract:
        return None
    old_values = {
        "followup_result": contract.followup_result,
        "followup_by": contract.followup_by,
    }
    contract.followup_result = data.followup_result
    contract.followup_by = data.followup_by
    contract.followup_date = data.followup_date or datetime.utcnow()
    if contract.status == "renewal_pending":
        validate_contract_transition(contract.status, "renewing")
        contract.status = "renewing"
    log_audit(
        db, "contract", contract.id, "followup",
        operator_id, operator_name, operator_role,
        old_values=old_values,
        new_values={"followup_result": data.followup_result, "followup_by": data.followup_by, "status": contract.status},
    )
    db.commit()
    db.refresh(contract)
    return contract


def count_expiring_soon(db: Session, days: int = 30) -> int:
    now = datetime.utcnow()
    cutoff = now + timedelta(days=days)
    return (
        db.query(Contract)
        .filter(
            Contract.status.in_(["active", "renewal_pending"]),
            Contract.end_date <= cutoff,
            Contract.end_date >= now,
        )
        .count()
    )
