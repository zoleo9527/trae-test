from fastapi import Header, HTTPException, Depends
from typing import Optional
from app.schemas.operator import OperatorContext


def get_operator_context(
    x_operator_id: Optional[str] = Header(None, alias="X-Operator-Id"),
    x_operator_name: Optional[str] = Header(None, alias="X-Operator-Name"),
    x_operator_role: Optional[str] = Header(None, alias="X-Operator-Role"),
) -> OperatorContext:
    if not x_operator_id or not x_operator_name or not x_operator_role:
        raise HTTPException(
            status_code=401,
            detail="缺少操作人上下文，请在请求头中提供 X-Operator-Id, X-Operator-Name, X-Operator-Role",
        )
    return OperatorContext(
        operator_id=x_operator_id,
        operator_name=x_operator_name,
        operator_role=x_operator_role,
    )
