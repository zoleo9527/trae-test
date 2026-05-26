from fastapi import APIRouter, HTTPException
from typing import List

from ..models import Member, MemberIn, StoredValueIn, StoredValueRecord
from ..store import store

router = APIRouter(prefix="/members", tags=["members"])


@router.get("", response_model=List[Member])
def list_members() -> List[Member]:
    return list(store.members.values())


@router.post("", response_model=Member)
def create_member(payload: MemberIn) -> Member:
    member = Member(**payload.model_dump())
    store.members[member.id] = member
    return member


@router.get("/{member_id}", response_model=Member)
def get_member(member_id: str) -> Member:
    m = store.members.get(member_id)
    if not m:
        raise HTTPException(status_code=404, detail="会员不存在")
    return m


@router.get("/{member_id}/stored-value", response_model=List[StoredValueRecord])
def list_member_stored_value(member_id: str) -> List[StoredValueRecord]:
    if member_id not in store.members:
        raise HTTPException(status_code=404, detail="会员不存在")
    return [r for r in store.stored_value.values() if r.member_id == member_id]


@router.post("/{member_id}/stored-value", response_model=StoredValueRecord)
def add_stored_value(member_id: str, payload: StoredValueIn) -> StoredValueRecord:
    if member_id not in store.members:
        raise HTTPException(status_code=404, detail="会员不存在")
    rec = StoredValueRecord(**payload.model_dump())
    store.stored_value[rec.id] = rec
    member = store.members[member_id]
    if payload.type == "recharge":
        member.balance += payload.amount
    elif payload.type == "consume":
        member.balance -= payload.amount
    elif payload.type == "refund":
        member.balance += payload.amount
    return rec
