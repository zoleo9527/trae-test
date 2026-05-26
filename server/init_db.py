"""
初始化数据库 - 生成演示数据
运行: python -m server.init_db
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime, date, timedelta
from server.app.database import SessionLocal, engine, Base
from server.app import models, crud, schemas

Base.metadata.create_all(bind=engine)

db = SessionLocal()

print("开始初始化数据库...")

try:
    if db.query(models.OptometryOrder).count() > 0:
        print("数据库已有数据，跳过初始化")
        db.close()
        sys.exit(0)

    stores = ["南京路旗舰店", "中山公园店", "陆家嘴店", "五角场店", "徐家汇店"]
    optometrists = ["张医生", "李医生", "王医生", "赵医生", "陈医生"]
    processors = ["刘加工", "周加工", "吴加工"]
    handlers = ["售后-孙", "售后-钱", "售后-郑"]
    repair_types = ["镜片更换", "镜架维修", "重制镜片", "清洁保养", "度数调整"]
    repair_reasons = [
        "镜片出现划痕",
        "镜架变形",
        "度数不舒适",
        "镜片镀膜脱落",
        "鼻托断裂",
        "螺丝松动",
        "顾客佩戴不适",
        "左右度数有误"
    ]
    lens_brands = ["蔡司", "依视路", "豪雅", "凯米", "明月"]
    lens_types = ["单光", "渐进多焦点", "抗蓝光", "变色", "偏光"]
    frame_models = ["全框-钛架", "半框-TR90", "无框-记忆钛", "板材框", "金属框"]

    print("创建验光单...")
    optometry_orders = []
    for i in range(15):
        obj = schemas.OptometryOrderCreate(
            order_no=f"YG{20260101 + i:08d}",
            customer_name=f"客户{i+1:03d}",
            customer_phone=f"138{10000000 + i:08d}",
            store_name=stores[i % len(stores)],
            optometrist=optometrists[i % len(optometrists)],
            exam_date=date.today() - timedelta(days=i * 2),
            left_sph=-1.0 - (i % 5) * 0.5,
            left_cyl=-0.5 + (i % 3) * 0.25,
            left_axis=90 + (i * 10) % 180,
            right_sph=-1.5 - (i % 4) * 0.5,
            right_cyl=-0.25 + (i % 2) * 0.25,
            right_axis=45 + (i * 15) % 180,
            pd=60.0 + (i % 5) * 0.5,
            lens_type=lens_types[i % len(lens_types)],
            lens_brand=lens_brands[i % len(lens_brands)],
            frame_model=frame_models[i % len(frame_models)],
        )
        order = crud.create_optometry_order(db, obj)
        optometry_orders.append(order)

    print("创建返修单...")
    statuses = ["待处理", "处理中", "待镜片", "镜片调拨中", "镜片丢失", "返修中", "已完成", "已驳回", "退款中", "已退款", "需回查"]
    for i, order in enumerate(optometry_orders[:12]):
        status = statuses[i % len(statuses)]
        extra = {}
        if status == "已驳回":
            extra["reject_reason"] = "超出保修范围"
        if status == "退款中":
            extra["refund_amount"] = 500.0 + i * 100
            extra["refund_reason"] = "顾客佩戴不适，无法适应"
        if status == "已完成":
            extra["completed_at"] = datetime.now() - timedelta(days=i)

        lens_status = "库存充足"
        if status in ["待镜片", "镜片调拨中"]:
            lens_status = "库存不足"
        if status == "镜片丢失":
            lens_status = "已丢失"

        obj = schemas.RepairOrderCreate(
            repair_no=crud.generate_repair_no(db),
            optometry_order_id=order.id,
            optometry_order_no=order.order_no,
            customer_name=order.customer_name,
            customer_phone=order.customer_phone,
            store_name=order.store_name,
            repair_type=repair_types[i % len(repair_types)],
            repair_reason=repair_reasons[i % len(repair_reasons)],
            processor=processors[i % len(processors)],
            handler=handlers[i % len(handlers)],
            status=status,
            priority="加急" if i % 3 == 0 else "普通",
            lens_status=lens_status,
        )
        repair = crud.create_repair_order(db, obj)

        if extra:
            for key, value in extra.items():
                setattr(repair, key, value)
            db.commit()
            db.refresh(repair)

        if status in ["待镜片", "镜片调拨中"]:
            transfer_obj = schemas.LensTransferCreate(
                repair_order_id=repair.id,
                transfer_no=crud.generate_transfer_no(db),
                from_store=stores[(i + 2) % len(stores)],
                to_store=order.store_name,
                lens_spec=f"{order.lens_brand} {order.lens_type} 左{order.left_sph}/{order.left_cyl} 右{order.right_sph}/{order.right_cyl}",
                quantity=1,
                status="调拨中" if status == "镜片调拨中" else "待发货",
            )
            crud.create_lens_transfer(db, transfer_obj)

        if status == "镜片丢失":
            transfer_obj = schemas.LensTransferCreate(
                repair_order_id=repair.id,
                transfer_no=crud.generate_transfer_no(db),
                from_store=stores[(i + 2) % len(stores)],
                to_store=order.store_name,
                lens_spec=f"{order.lens_brand} {order.lens_type} 左{order.left_sph}/{order.left_cyl} 右{order.right_sph}/{order.right_cyl}",
                quantity=1,
                status="已发货",
                is_lost=1,
                lost_reason="物流过程中丢失，快递公司确认",
            )
            crud.create_lens_transfer(db, transfer_obj)

        if status in ["退款中", "已退款"]:
            refund_obj = schemas.RefundRecordCreate(
                repair_order_id=repair.id,
                refund_no=crud.generate_refund_no(db),
                amount=extra.get("refund_amount", 500.0),
                reason=extra.get("refund_reason", "顾客佩戴不适"),
                applicant=handlers[i % len(handlers)],
                status="已退款" if status == "已退款" else "待审批",
            )
            refund = crud.create_refund_record(db, refund_obj)
            if status == "已退款":
                refund.approver = "店长-审批"
                refund.approved_at = datetime.now() - timedelta(days=1)
                refund.paid_at = datetime.now() - timedelta(hours=2)
                db.commit()

    print("创建回访记录...")
    repairs = db.query(models.RepairOrder).all()
    for i, repair in enumerate(repairs[:8]):
        visit_obj = schemas.VisitRecordCreate(
            repair_order_id=repair.id,
            visit_no=crud.generate_visit_no(db),
            visit_type="佩戴回访" if i % 2 == 0 else "售后回访",
            planned_date=date.today() - timedelta(days=i) + timedelta(days=7),
            visitor=handlers[i % len(handlers)] if i % 3 != 0 else None,
            content="电话回访，确认佩戴舒适度" if i % 2 == 0 else "到店回访，检查眼镜状况",
            result="满意" if i % 4 == 0 else None,
            customer_feedback="佩戴舒适，无不适" if i % 4 == 0 else None,
            status="已回访" if i % 2 == 0 else "待回访",
            actual_date=date.today() - timedelta(days=i) + timedelta(days=7) if i % 2 == 0 else None,
        )
        crud.create_visit_record(db, visit_obj)

    print("初始化完成！")
    print(f"  - 验光单: {db.query(models.OptometryOrder).count()} 条")
    print(f"  - 返修单: {db.query(models.RepairOrder).count()} 条")
    print(f"  - 状态历史: {db.query(models.StatusHistory).count()} 条")
    print(f"  - 镜片调拨: {db.query(models.LensTransfer).count()} 条")
    print(f"  - 退款记录: {db.query(models.RefundRecord).count()} 条")
    print(f"  - 回访记录: {db.query(models.VisitRecord).count()} 条")

except Exception as e:
    print(f"初始化失败: {e}")
    import traceback
    traceback.print_exc()
finally:
    db.close()
