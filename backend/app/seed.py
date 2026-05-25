from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models import (
    User, Supplier, Customer, Product, Purchase, Grading, Allocation,
    CreditSale, Payment, ExceptionRecord,
)
from app.auth import hash_password


def seed_all(db: Session):
    if db.query(User).first():
        return

    # Users
    users = [
        User(username="admin", name="陈经理", role="stall_manager",
             hashed_password=hash_password("admin123")),
        User(username="picker", name="李配货", role="picker",
             hashed_password=hash_password("picker123")),
        User(username="finance", name="王会计", role="finance",
             hashed_password=hash_password("finance123")),
    ]
    db.add_all(users)

    # Suppliers
    suppliers = [
        Supplier(name="烟台果源合作社", contact="张师傅 13900000001", region="山东烟台"),
        Supplier(name="阿克苏丝路果业", contact="阿总 13900000002", region="新疆阿克苏"),
        Supplier(name="赣南绿橙基地", contact="刘总 13900000003", region="江西赣州"),
        Supplier(name="海南芒果庄园", contact="黄经理 13900000004", region="海南三亚"),
    ]
    db.add_all(suppliers)
    db.flush()

    # Products
    products = [
        Product(name="红富士苹果", category="苹果", unit="斤", purchase_ref_price=3.2),
        Product(name="阿克苏冰糖心", category="苹果", unit="斤", purchase_ref_price=4.5),
        Product(name="赣南脐橙", category="柑橘", unit="斤", purchase_ref_price=2.8),
        Product(name="金煌芒果", category="芒果", unit="斤", purchase_ref_price=5.6),
        Product(name="阳山水蜜桃", category="桃", unit="斤", purchase_ref_price=6.5),
        Product(name="黑美人西瓜", category="西瓜", unit="斤", purchase_ref_price=1.3),
    ]
    db.add_all(products)
    db.flush()

    # Customers
    customers = [
        Customer(name="好又多连锁（一店）", phone="021-80000001", stall_code="A-12", credit_limit=50000),
        Customer(name="大润发生鲜部", phone="021-80000002", stall_code="B-03", credit_limit=80000),
        Customer(name="小区菜篮子", phone="18912345001", stall_code="C-07", credit_limit=20000),
        Customer(name="老王水果摊", phone="13612345002", stall_code="D-15", credit_limit=10000),
        Customer(name="盒马鲜生采配", phone="400-000-0001", stall_code="E-01", credit_limit=120000),
    ]
    db.add_all(customers)
    db.flush()

    now = datetime.now()

    # Purchase 1: 正常单 - 烟台红富士 (将完全分级配货)
    p1 = Purchase(
        code="CG20260520-001",
        supplier_id=suppliers[0].id,
        product_id=products[0].id,
        gross_kg=12000, tare_kg=800, net_kg=11200,
        unit_price=3.2, total_amount=11200 * 3.2,
        truck_no="鲁F-88888", warehouse_in="冷库A-03",
        purchase_date=now - timedelta(days=5),
        operator="陈经理", remark="早上到货，整体品相不错",
    )
    db.add(p1)

    # Purchase 2: 异常单 - 阿克苏冰糖心，到货损耗大，客诉 + 赔付
    p2 = Purchase(
        code="CG20260521-002",
        supplier_id=suppliers[1].id,
        product_id=products[1].id,
        gross_kg=8600, tare_kg=600, net_kg=8000,
        unit_price=4.5, total_amount=8000 * 4.5,
        truck_no="新A-66666", warehouse_in="冷库A-05",
        purchase_date=now - timedelta(days=4),
        operator="陈经理", remark="部分压伤，需分级时仔细处理",
    )
    db.add(p2)

    # Purchase 3: 赣南脐橙 - 超期货款未回
    p3 = Purchase(
        code="CG20260510-003",
        supplier_id=suppliers[2].id,
        product_id=products[2].id,
        gross_kg=15000, tare_kg=1000, net_kg=14000,
        unit_price=2.8, total_amount=14000 * 2.8,
        truck_no="赣B-12345", warehouse_in="冷库B-02",
        purchase_date=now - timedelta(days=15),
        operator="陈经理", remark="老客户长期供货",
    )
    db.add(p3)

    # Purchase 4: 金煌芒果 - 刚到货，未分级
    p4 = Purchase(
        code="CG20260524-004",
        supplier_id=suppliers[3].id,
        product_id=products[3].id,
        gross_kg=4200, tare_kg=300, net_kg=3900,
        unit_price=5.6, total_amount=3900 * 5.6,
        truck_no="琼A-23456", warehouse_in="冷库C-01",
        purchase_date=now - timedelta(days=1),
        operator="陈经理", remark="热带水果，尽快分级配货",
    )
    db.add(p4)

    # Purchase 5: 水蜜桃 - 高损耗，有客诉待处理
    p5 = Purchase(
        code="CG20260515-005",
        supplier_id=suppliers[0].id,
        product_id=products[4].id,
        gross_kg=2400, tare_kg=200, net_kg=2200,
        unit_price=6.5, total_amount=2200 * 6.5,
        truck_no="鲁F-77777", warehouse_in="冷库A-08",
        purchase_date=now - timedelta(days=10),
        operator="陈经理", remark="货架期短",
    )
    db.add(p5)

    db.flush()

    # --- Grading ---
    # 苹果正常单
    g1a = Grading(purchase_id=p1.id, grade="A", weight_kg=7200, ratio=0.64,
                  unit_cost=3.2, remark="精品大果")
    g1b = Grading(purchase_id=p1.id, grade="B", weight_kg=3200, ratio=0.29,
                  unit_cost=3.2, remark="标准果")
    g1c = Grading(purchase_id=p1.id, grade="C", weight_kg=560, ratio=0.05,
                  unit_cost=3.2, remark="小果")
    g1d = Grading(purchase_id=p1.id, grade="损耗", weight_kg=240, ratio=0.02,
                  unit_cost=3.2, remark="压伤腐烂")
    db.add_all([g1a, g1b, g1c, g1d])

    # 阿克苏：损耗异常大
    g2a = Grading(purchase_id=p2.id, grade="A", weight_kg=2800, ratio=0.35,
                  unit_cost=4.5, remark="上层完好")
    g2b = Grading(purchase_id=p2.id, grade="B", weight_kg=2400, ratio=0.30,
                  unit_cost=4.5, remark="轻微压伤")
    g2d = Grading(purchase_id=p2.id, grade="损耗", weight_kg=2800, ratio=0.35,
                  unit_cost=4.5, remark="运输过程中压伤严重，已拍照存档")
    db.add_all([g2a, g2b, g2d])

    # 脐橙
    g3a = Grading(purchase_id=p3.id, grade="A", weight_kg=9800, ratio=0.70,
                  unit_cost=2.8)
    g3b = Grading(purchase_id=p3.id, grade="B", weight_kg=3500, ratio=0.25,
                  unit_cost=2.8)
    g3d = Grading(purchase_id=p3.id, grade="损耗", weight_kg=700, ratio=0.05,
                  unit_cost=2.8, remark="少量干疤")
    db.add_all([g3a, g3b, g3d])

    # 芒果：未分级，只先估了一小部分
    g4a = Grading(purchase_id=p4.id, grade="A", weight_kg=1200, ratio=0.31,
                  unit_cost=5.6, remark="待继续分级")
    db.add(g4a)

    # 水蜜桃：高损耗
    g5a = Grading(purchase_id=p5.id, grade="A", weight_kg=800, ratio=0.36,
                  unit_cost=6.5)
    g5b = Grading(purchase_id=p5.id, grade="B", weight_kg=500, ratio=0.23,
                  unit_cost=6.5)
    g5d = Grading(purchase_id=p5.id, grade="损耗", weight_kg=900, ratio=0.41,
                  unit_cost=6.5, remark="高温变质，整批损失较大")
    db.add_all([g5a, g5b, g5d])

    db.flush()

    # --- Allocation & CreditSale ---
    # 苹果配货
    a1 = Allocation(purchase_id=p1.id, customer_id=customers[0].id,
                    grade="A", qty_kg=4000, unit_price=6.8,
                    total_amount=4000 * 6.8, status="已提货",
                    allocated_at=now - timedelta(days=4), operator="李配货")
    a2 = Allocation(purchase_id=p1.id, customer_id=customers[1].id,
                    grade="A", qty_kg=3200, unit_price=6.8,
                    total_amount=3200 * 6.8, status="已提货",
                    allocated_at=now - timedelta(days=4), operator="李配货")
    a3 = Allocation(purchase_id=p1.id, customer_id=customers[2].id,
                    grade="B", qty_kg=3200, unit_price=4.5,
                    total_amount=3200 * 4.5, status="已提货",
                    allocated_at=now - timedelta(days=3), operator="李配货")
    a4 = Allocation(purchase_id=p1.id, customer_id=customers[3].id,
                    grade="C", qty_kg=560, unit_price=2.0,
                    total_amount=560 * 2.0, status="待提货",
                    allocated_at=now - timedelta(days=2), operator="李配货",
                    remark="小果给老王处理")
    db.add_all([a1, a2, a3, a4])

    # 阿克苏配货：客诉单
    a5 = Allocation(purchase_id=p2.id, customer_id=customers[4].id,
                    grade="A", qty_kg=2000, unit_price=9.0,
                    total_amount=2000 * 9.0, status="已退货",
                    allocated_at=now - timedelta(days=3), operator="李配货",
                    remark="盒马反馈部分果实心部褐变，已退回 500 斤")
    a6 = Allocation(purchase_id=p2.id, customer_id=customers[0].id,
                    grade="B", qty_kg=2400, unit_price=5.5,
                    total_amount=2400 * 5.5, status="已提货",
                    allocated_at=now - timedelta(days=3), operator="李配货")
    a7 = Allocation(purchase_id=p2.id, customer_id=customers[3].id,
                    grade="A", qty_kg=800, unit_price=9.0,
                    total_amount=800 * 9.0, status="已提货",
                    allocated_at=now - timedelta(days=3), operator="李配货")
    db.add_all([a5, a6, a7])

    # 脐橙配货：长期赊销，部分逾期
    a8 = Allocation(purchase_id=p3.id, customer_id=customers[1].id,
                    grade="A", qty_kg=6000, unit_price=5.5,
                    total_amount=6000 * 5.5, status="已提货",
                    allocated_at=now - timedelta(days=14), operator="李配货")
    a9 = Allocation(purchase_id=p3.id, customer_id=customers[0].id,
                    grade="A", qty_kg=3800, unit_price=5.5,
                    total_amount=3800 * 5.5, status="已提货",
                    allocated_at=now - timedelta(days=13), operator="李配货")
    a10 = Allocation(purchase_id=p3.id, customer_id=customers[2].id,
                     grade="B", qty_kg=3500, unit_price=3.8,
                     total_amount=3500 * 3.8, status="已提货",
                     allocated_at=now - timedelta(days=12), operator="李配货")
    db.add_all([a8, a9, a10])

    # 水蜜桃配货
    a11 = Allocation(purchase_id=p5.id, customer_id=customers[4].id,
                     grade="A", qty_kg=800, unit_price=12.0,
                     total_amount=800 * 12.0, status="已退货",
                     allocated_at=now - timedelta(days=9), operator="李配货",
                     remark="盒马反馈货架期不足，已退回")
    a12 = Allocation(purchase_id=p5.id, customer_id=customers[2].id,
                     grade="B", qty_kg=500, unit_price=8.0,
                     total_amount=500 * 8.0, status="已提货",
                     allocated_at=now - timedelta(days=9), operator="李配货")
    db.add_all([a11, a12])

    db.flush()

    # --- Credit Sales & Payments ---
    # 苹果：已结清
    cs1 = CreditSale(allocation_id=a1.id, customer_id=customers[0].id,
                     total_amount=a1.total_amount, paid_amount=a1.total_amount,
                     balance=0, due_date=now - timedelta(days=1),
                     status="已结清", created_at=now - timedelta(days=4))
    cs2 = CreditSale(allocation_id=a2.id, customer_id=customers[1].id,
                     total_amount=a2.total_amount, paid_amount=a2.total_amount,
                     balance=0, due_date=now - timedelta(days=1),
                     status="已结清", created_at=now - timedelta(days=4))
    cs3 = CreditSale(allocation_id=a3.id, customer_id=customers[2].id,
                     total_amount=a3.total_amount, paid_amount=8000,
                     balance=a3.total_amount - 8000, due_date=now - timedelta(days=1),
                     status="部分回款", created_at=now - timedelta(days=3))
    cs4 = CreditSale(allocation_id=a4.id, customer_id=customers[3].id,
                     total_amount=a4.total_amount, paid_amount=0,
                     balance=a4.total_amount, due_date=now + timedelta(days=7),
                     status="赊销中", created_at=now - timedelta(days=2))
    db.add_all([cs1, cs2, cs3, cs4])

    # 阿克苏：盒马赔付单
    cs5 = CreditSale(allocation_id=a5.id, customer_id=customers[4].id,
                     total_amount=a5.total_amount, paid_amount=0,
                     balance=a5.total_amount, due_date=now + timedelta(days=5),
                     status="赊销中", created_at=now - timedelta(days=3),
                     remark="客诉中，待处理")
    cs6 = CreditSale(allocation_id=a6.id, customer_id=customers[0].id,
                     total_amount=a6.total_amount, paid_amount=a6.total_amount,
                     balance=0, due_date=now, status="已结清",
                     created_at=now - timedelta(days=3))
    cs7 = CreditSale(allocation_id=a7.id, customer_id=customers[3].id,
                     total_amount=a7.total_amount, paid_amount=3000,
                     balance=a7.total_amount - 3000, due_date=now + timedelta(days=3),
                     status="部分回款", created_at=now - timedelta(days=3))
    db.add_all([cs5, cs6, cs7])

    # 脐橙：逾期未回
    cs8 = CreditSale(allocation_id=a8.id, customer_id=customers[1].id,
                     total_amount=a8.total_amount, paid_amount=0,
                     balance=a8.total_amount,
                     due_date=now - timedelta(days=3), status="逾期",
                     created_at=now - timedelta(days=14),
                     remark="大润发已拖 3 天")
    cs9 = CreditSale(allocation_id=a9.id, customer_id=customers[0].id,
                     total_amount=a9.total_amount, paid_amount=a9.total_amount,
                     balance=0, due_date=now - timedelta(days=3), status="已结清",
                     created_at=now - timedelta(days=13))
    cs10 = CreditSale(allocation_id=a10.id, customer_id=customers[2].id,
                      total_amount=a10.total_amount, paid_amount=5000,
                      balance=a10.total_amount - 5000,
                      due_date=now - timedelta(days=1), status="逾期",
                      created_at=now - timedelta(days=12))
    db.add_all([cs8, cs9, cs10])

    # 水蜜桃：客诉
    cs11 = CreditSale(allocation_id=a11.id, customer_id=customers[4].id,
                      total_amount=a11.total_amount, paid_amount=0,
                      balance=a11.total_amount, due_date=now + timedelta(days=5),
                      status="赊销中", created_at=now - timedelta(days=9),
                      remark="退货争议中")
    cs12 = CreditSale(allocation_id=a12.id, customer_id=customers[2].id,
                      total_amount=a12.total_amount, paid_amount=a12.total_amount,
                      balance=0, due_date=now - timedelta(days=5), status="已结清",
                      created_at=now - timedelta(days=9))
    db.add_all([cs11, cs12])
    db.flush()

    # Payments
    db.add_all([
        Payment(sale_id=cs1.id, amount=cs1.total_amount, method="转账",
                paid_at=now - timedelta(days=1), operator="王会计"),
        Payment(sale_id=cs2.id, amount=cs2.total_amount, method="转账",
                paid_at=now - timedelta(days=1), operator="王会计"),
        Payment(sale_id=cs3.id, amount=8000, method="微信",
                paid_at=now - timedelta(days=1), operator="王会计"),
        Payment(sale_id=cs6.id, amount=cs6.total_amount, method="转账",
                paid_at=now, operator="王会计"),
        Payment(sale_id=cs7.id, amount=3000, method="现金",
                paid_at=now - timedelta(days=1), operator="王会计"),
        Payment(sale_id=cs9.id, amount=cs9.total_amount, method="转账",
                paid_at=now - timedelta(days=3), operator="王会计"),
        Payment(sale_id=cs10.id, amount=5000, method="微信",
                paid_at=now - timedelta(days=5), operator="王会计"),
        Payment(sale_id=cs12.id, amount=cs12.total_amount, method="现金",
                paid_at=now - timedelta(days=5), operator="王会计"),
    ])
    db.flush()

    # --- Exceptions ---
    db.add_all([
        ExceptionRecord(
            type="损耗", related_type="purchase", related_id=p2.id,
            title="阿克苏到货压伤损耗 2800 斤",
            description="运输过程中上层堆叠压伤，卸货时发现，已拍照（单号 XJ-20260521-002）。",
            evidence="冷库A-05 现场照片 3 张", amount=2800 * 4.5,
            status="待处理", handler="陈经理",
            created_at=now - timedelta(days=4),
        ),
        ExceptionRecord(
            type="客诉", related_type="allocation", related_id=a5.id,
            title="盒马退回冰糖心 500 斤",
            description="盒马反馈部分果实心部褐变，已退回 500 斤，现场有照片和视频。",
            evidence="盒马退货单 HM-20260522-009",
            amount=500 * 9.0, status="处理中", handler="陈经理",
            created_at=now - timedelta(days=3),
        ),
        ExceptionRecord(
            type="赔付", related_type="allocation", related_id=a5.id,
            title="盒马冰糖心赔付协商",
            description="拟赔付 500 斤 * 9 元 = 4500 元，待盒马确认。",
            evidence="微信聊天记录 5-22",
            amount=4500, status="处理中", handler="王会计",
            created_at=now - timedelta(days=2),
        ),
        ExceptionRecord(
            type="回款逾期", related_type="sale", related_id=cs8.id,
            title="大润发脐橙货款逾期 3 天",
            description="货款 33000 元应于 3 天前到账，多次催促仍未到账。",
            evidence="对账单 0522",
            amount=33000, status="待处理", handler="王会计",
            created_at=now - timedelta(days=3),
        ),
        ExceptionRecord(
            type="回款逾期", related_type="sale", related_id=cs10.id,
            title="菜篮子脐橙货款逾期",
            description="菜篮子小额客户，部分货款逾期。",
            evidence="微信聊天",
            amount=cs10.balance, status="处理中", handler="王会计",
            created_at=now - timedelta(days=1),
        ),
        ExceptionRecord(
            type="损耗", related_type="purchase", related_id=p5.id,
            title="水蜜桃整批损耗 41%",
            description="高温运输变质，900 斤全部报废，损失约 5850 元。",
            evidence="冷库A-08 报废单",
            amount=5850, status="已处理", handler="陈经理",
            created_at=now - timedelta(days=9),
        ),
        ExceptionRecord(
            type="客诉", related_type="allocation", related_id=a11.id,
            title="盒马退回水蜜桃 800 斤",
            description="货架期不足，整批退回，争议金额 9600 元。",
            evidence="盒马退货单 HM-20260516-003",
            amount=9600, status="待处理", handler="陈经理",
            created_at=now - timedelta(days=8),
        ),
    ])

    db.commit()
