from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.contract import ContractCreate, ContractUpdate, ContractFollowUp, ContractOut
from app.services import contract as svc

router = APIRouter(prefix="/contracts", tags=["合同续约"])


def _op():
    return "op_default", "默认操作员", "project_manager"


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
def create_contract(data: ContractCreate, db: Session = Depends(get_db)):
    op_id, op_name, op_role = _op()
    try:
        return svc.create_contract(db, data, op_id, op_name, op_role)
    except Exception as e:
        raise HTTPException(400, str(e))


@router.put("/{contract_id}", response_model=ContractOut)
def update_contract(contract_id: int, data: ContractUpdate, db: Session = Depends(get_db)):
    op_id, op_name, op_role = _op()
    try:
        c = svc.update_contract(db, contract_id, data, op_id, op_name, op_role)
    except ValueError as e:
        raise HTTPException(400, str(e))
    if not c:
        raise HTTPException(404, "合同不存在")
    return c


@router.post("/{contract_id}/followup", response_model=ContractOut)
def followup_contract(contract_id: int, data: ContractFollowUp, db: Session = Depends(get_db)):
    op_id, op_name, op_role = _op()
    try:
        c = svc.followup_contract(db, contract_id, data, op_id, op_name, op_role)
    except ValueError as e:
        raise HTTPException(400, str(e))
    if not c:
        raise HTTPException(404, "合同不存在")
    return c
