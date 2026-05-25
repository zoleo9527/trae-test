from sqlalchemy import (
    Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
)
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    role = Column(String, nullable=False)  # stall_manager / picker / finance
    hashed_password = Column(String, nullable=False)


class Supplier(Base):
    __tablename__ = "suppliers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    contact = Column(String)
    region = Column(String)


class Customer(Base):
    __tablename__ = "customers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    phone = Column(String)
    stall_code = Column(String)  # 档口号
    credit_limit = Column(Float, default=0)


class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    category = Column(String)  # 苹果 / 西瓜 / 桃子 ...
    unit = Column(String, default="斤")
    purchase_ref_price = Column(Float, default=0)


class Purchase(Base):
    __tablename__ = "purchases"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True)  # 过磅单号
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    gross_kg = Column(Float)
    tare_kg = Column(Float)
    net_kg = Column(Float)
    unit_price = Column(Float)
    total_amount = Column(Float)
    truck_no = Column(String)
    warehouse_in = Column(String, default="未入库")  # 冷库位
    purchase_date = Column(DateTime, default=datetime.now)
    operator = Column(String)
    remark = Column(Text)

    supplier = relationship("Supplier")
    product = relationship("Product")
    gradings = relationship("Grading", back_populates="purchase", cascade="all, delete-orphan")
    allocations = relationship("Allocation", back_populates="purchase", cascade="all, delete-orphan")


class Grading(Base):
    __tablename__ = "gradings"
    id = Column(Integer, primary_key=True, index=True)
    purchase_id = Column(Integer, ForeignKey("purchases.id"))
    grade = Column(String)  # A / B / C / 损耗
    weight_kg = Column(Float)
    ratio = Column(Float)
    unit_cost = Column(Float)  # 分级后单位成本
    remark = Column(Text)
    created_at = Column(DateTime, default=datetime.now)

    purchase = relationship("Purchase", back_populates="gradings")


class Allocation(Base):
    __tablename__ = "allocations"
    id = Column(Integer, primary_key=True, index=True)
    purchase_id = Column(Integer, ForeignKey("purchases.id"))
    customer_id = Column(Integer, ForeignKey("customers.id"))
    grade = Column(String)
    qty_kg = Column(Float)
    unit_price = Column(Float)
    total_amount = Column(Float)
    status = Column(String, default="待提货")  # 待提货 / 已提货 / 已退货
    allocated_at = Column(DateTime, default=datetime.now)
    operator = Column(String)
    remark = Column(Text)

    purchase = relationship("Purchase", back_populates="allocations")
    customer = relationship("Customer")
    sales = relationship("CreditSale", back_populates="allocation", cascade="all, delete-orphan")


class CreditSale(Base):
    __tablename__ = "credit_sales"
    id = Column(Integer, primary_key=True, index=True)
    allocation_id = Column(Integer, ForeignKey("allocations.id"))
    customer_id = Column(Integer, ForeignKey("customers.id"))
    total_amount = Column(Float)
    paid_amount = Column(Float, default=0)
    balance = Column(Float)
    due_date = Column(DateTime)
    status = Column(String, default="赊销中")  # 赊销中 / 部分回款 / 已结清 / 逾期
    created_at = Column(DateTime, default=datetime.now)
    remark = Column(Text)

    allocation = relationship("Allocation", back_populates="sales")
    customer = relationship("Customer")
    payments = relationship("Payment", back_populates="sale", cascade="all, delete-orphan")


class Payment(Base):
    __tablename__ = "payments"
    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("credit_sales.id"))
    amount = Column(Float)
    method = Column(String)  # 现金 / 微信 / 转账
    paid_at = Column(DateTime, default=datetime.now)
    operator = Column(String)
    remark = Column(Text)

    sale = relationship("CreditSale", back_populates="payments")


class ExceptionRecord(Base):
    __tablename__ = "exceptions"
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String)  # 损耗 / 客诉 / 赔付 / 回款逾期
    related_type = Column(String)  # purchase / allocation / sale
    related_id = Column(Integer)
    title = Column(String)
    description = Column(Text)
    evidence = Column(Text)  # 照片/单据编号等
    amount = Column(Float, default=0)
    status = Column(String, default="待处理")  # 待处理 / 处理中 / 已处理 / 已驳回
    handler = Column(String)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    remark = Column(Text)
