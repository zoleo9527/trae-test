from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict


class LoginReq(BaseModel):
    username: str
    password: str


class UserOut(BaseModel):
    id: int
    username: str
    name: str
    role: str

    class Config:
        from_attributes = True


class SupplierOut(BaseModel):
    id: int
    name: str
    contact: str
    region: str

    class Config:
        from_attributes = True


class CustomerOut(BaseModel):
    id: int
    name: str
    phone: str
    stall_code: str
    credit_limit: float

    class Config:
        from_attributes = True


class ProductOut(BaseModel):
    id: int
    name: str
    category: str
    unit: str
    purchase_ref_price: float

    class Config:
        from_attributes = True


# --- Purchase ---
class PurchaseIn(BaseModel):
    supplier_id: int
    product_id: int
    gross_kg: float
    tare_kg: float
    unit_price: float
    truck_no: Optional[str] = None
    warehouse_in: Optional[str] = None
    remark: Optional[str] = None


class PurchaseOut(BaseModel):
    id: int
    code: str
    supplier_id: int
    supplier_name: Optional[str] = None
    supplier_contact: Optional[str] = None
    supplier_region: Optional[str] = None
    product_id: int
    product_name: Optional[str] = None
    gross_kg: float
    tare_kg: float
    net_kg: float
    unit_price: float
    total_amount: float
    truck_no: Optional[str]
    warehouse_in: Optional[str]
    purchase_date: datetime
    operator: Optional[str]
    remark: Optional[str]
    graded_kg: float = 0
    allocated_kg: float = 0
    loss_kg: float = 0

    class Config:
        from_attributes = True


# --- Grading ---
class GradingIn(BaseModel):
    purchase_id: int
    grade: str
    weight_kg: float
    remark: Optional[str] = None


class GradingOut(BaseModel):
    id: int
    purchase_id: int
    grade: str
    weight_kg: float
    ratio: float
    unit_cost: float
    remark: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# --- Allocation ---
class AllocationIn(BaseModel):
    purchase_id: int
    customer_id: int
    grade: str
    qty_kg: float
    unit_price: float
    remark: Optional[str] = None


class AllocationOut(BaseModel):
    id: int
    purchase_id: int
    purchase_code: Optional[str] = None
    customer_id: int
    customer_name: Optional[str] = None
    customer_stall: Optional[str] = None
    grade: str
    qty_kg: float
    unit_price: float
    total_amount: float
    status: str
    allocated_at: datetime
    operator: Optional[str]
    remark: Optional[str]

    class Config:
        from_attributes = True


class AllocationStatusUpdate(BaseModel):
    status: str


# --- Credit Sale ---
class CreditSaleIn(BaseModel):
    allocation_id: int
    due_date: Optional[datetime] = None
    remark: Optional[str] = None


class CreditSaleOut(BaseModel):
    id: int
    allocation_id: int
    customer_id: int
    customer_name: Optional[str] = None
    total_amount: float
    paid_amount: float
    balance: float
    due_date: Optional[datetime]
    status: str
    created_at: datetime
    remark: Optional[str]

    class Config:
        from_attributes = True


class PaymentIn(BaseModel):
    sale_id: int
    amount: float
    method: str = "现金"
    operator: Optional[str] = None
    remark: Optional[str] = None


class PaymentOut(BaseModel):
    id: int
    sale_id: int
    amount: float
    method: str
    paid_at: datetime
    operator: Optional[str]
    remark: Optional[str]

    class Config:
        from_attributes = True


# --- Exception ---
class ExceptionIn(BaseModel):
    type: str
    related_type: str
    related_id: int
    title: str
    description: Optional[str] = None
    evidence: Optional[str] = None
    amount: float = 0
    handler: Optional[str] = None
    remark: Optional[str] = None


class ExceptionOut(BaseModel):
    id: int
    type: str
    related_type: str
    related_id: int
    title: str
    description: Optional[str]
    evidence: Optional[str]
    amount: float
    status: str
    handler: Optional[str]
    created_at: datetime
    updated_at: datetime
    remark: Optional[str]

    class Config:
        from_attributes = True


class ExceptionStatusUpdate(BaseModel):
    status: str
    remark: Optional[str] = None


# --- Review (continuous trace panel) ---
class TraceNode(BaseModel):
    key: str
    label: str
    data: dict


class TraceOut(BaseModel):
    purchase: dict
    gradings: List[dict]
    allocations: List[dict]
    sales: List[dict]
    payments: List[dict]
    exceptions: List[dict]


class DashboardStats(BaseModel):
    purchase_count: int
    purchase_net_kg: float
    purchase_total_amount: float
    graded_ratio: float
    allocated_ratio: float
    loss_ratio: float
    credit_balance: float
    overdue_count: int
    open_exception_count: int
