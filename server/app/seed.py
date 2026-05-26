from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.models import User, Order, OrderItem, OrderConfig, Arrival, Installation, SampleLending, ReplacementPart, OrderTimeline


USERS = [
    {"username": "admin", "password": "admin123", "role": "admin", "display_name": "系统管理员"},
    {"username": "sales01", "password": "sales123", "role": "sales", "display_name": "陈晓-销售顾问"},
    {"username": "sales02", "password": "sales123", "role": "sales", "display_name": "王磊-销售顾问"},
    {"username": "manager", "password": "manager123", "role": "manager", "display_name": "李娜-展厅经理"},
    {"username": "installer", "password": "install123", "role": "installer", "display_name": "张师傅-安装协调"},
]

ORDERS = [
    {
        "order_no": "SO20260501001",
        "customer_name": "王建国",
        "customer_phone": "13812345678",
        "customer_address": "北京市朝阳区望京SOHO T1-1801",
        "total_amount": 68500,
        "deposit_amount": 20000,
        "status": "after_sales",
        "sales_idx": 0,
        "manager_idx": 3,
        "expected_days": 30,
        "remarks": "客户要求加急处理，因婚房紧急入住",
        "items": [
            {"product_name": "北欧简约三人位沙发", "product_code": "SOFA-N3-BLK", "quantity": 1, "unit_price": 12800},
            {"product_name": "轻奢大理石茶几", "product_code": "CTB-MAR-WHT", "quantity": 1, "unit_price": 5600},
            {"product_name": "实木餐桌（1.8m）", "product_code": "DTB-WDN-180", "quantity": 1, "unit_price": 8900},
            {"product_name": "餐椅×4", "product_code": "CHR-WDN-4", "quantity": 1, "unit_price": 6400},
        ],
        "configs": [
            {"config_type": "颜色", "config_key": "沙发颜色", "config_value": "深灰色（定制色号#4A5568）", "config_description": "客户指定的非标准色，需与供应商确认色卡"},
            {"config_type": "材质", "config_key": "茶几台面", "config_value": "爵士白大理石", "config_description": "需确认库存是否有此款式"},
            {"config_type": "尺寸", "config_key": "餐桌长度", "config_value": "1.8m（标准）", "item_idx": 2},
        ],
        "arrivals": [
            {"item_idx": 0, "arrival_offset": 25, "quantity": 1, "tracking_no": "SF1234567890", "status": "arrived", "warehouse": "A区-12", "is_partial": False, "damaged": 0, "missing": 0, "remarks": "外观完好，已入库"},
            {"item_idx": 1, "arrival_offset": 27, "quantity": 1, "tracking_no": "SF1234567891", "status": "arrived", "warehouse": "A区-12", "is_partial": False, "damaged": 1, "missing": 0, "remarks": "茶几一角有轻微磕碰，已拍照记录，客户暂未签收"},
            {"item_idx": 2, "arrival_offset": 30, "quantity": 1, "tracking_no": "SF1234567892", "status": "arrived", "warehouse": "B区-05", "is_partial": False, "damaged": 0, "missing": 0, "remarks": "完好"},
            {"item_idx": 3, "arrival_offset": 30, "quantity": 1, "tracking_no": "SF1234567892", "status": "partial", "warehouse": "B区-05", "is_partial": True, "damaged": 0, "missing": 1, "remarks": "到货仅3把椅子，缺1把，供应商承诺5日内补发"},
        ],
        "installations": [
            {"item_idx": 0, "scheduled_offset": 32, "installer": "张师傅", "contact": "王建国", "phone": "13812345678", "status": "completed", "start_offset": 32, "end_offset": 32},
            {"item_idx": 2, "scheduled_offset": 32, "installer": "张师傅", "contact": "王建国", "phone": "13812345678", "status": "completed", "start_offset": 32, "end_offset": 32},
        ],
        "samples": [
            {"sample_name": "深灰色布艺小样", "sample_code": "FAB-GRY-001", "lent_to": "王建国", "due_offset": 7, "returned_offset": 5, "status": "returned", "condition": "完好"},
            {"sample_name": "爵士白大理石样板", "sample_code": "STN-MAR-002", "lent_to": "王建国", "due_offset": 7, "returned_offset": None, "status": "overdue", "condition": None, "remarks": "已超期3天未归还，客户称忘记，电话催促中"},
        ],
        "replacements": [
            {"item_idx": 3, "part_name": "餐椅（补发）", "part_code": "CHR-WDN-1", "quantity": 1, "reason": "到货缺失1把，供应商补发", "status": "arrived", "requested_offset": 30, "ordered_offset": 30, "arrived_offset": 35, "installed_offset": None, "confirmed_offset": None},
            {"item_idx": 1, "part_name": "茶几角修复件", "part_code": "CTB-REP-001", "quantity": 1, "reason": "到货磕碰损坏，需更换角套", "status": "pending", "requested_offset": 27, "ordered_offset": None, "arrived_offset": None, "installed_offset": None, "confirmed_offset": None},
        ],
        "timeline_events": [
            {"event_type": "order_created", "event_description": "订单创建，总金额68,500元，定金20,000元已收", "time_offset": 0},
            {"event_type": "config_confirmed", "event_description": "定制配置已确认：沙发深灰色、茶几爵士白大理石", "time_offset": 2},
            {"event_type": "status_change", "event_description": "订单状态变更为：生产中", "time_offset": 3},
            {"event_type": "sample_lent", "event_description": "借出样品：深灰色布艺小样、爵士白大理石样板", "time_offset": 0},
            {"event_type": "arrival_partial", "event_description": "沙发到货，入库A区-12", "time_offset": 25},
            {"event_type": "arrival_damaged", "event_description": "茶几到货发现磕碰，已拍照记录", "time_offset": 27},
            {"event_type": "arrival_missing", "event_description": "餐椅到货缺1把，申请补发", "time_offset": 30},
            {"event_type": "installation_completed", "event_description": "沙发、餐桌安装完成", "time_offset": 32},
            {"event_type": "sample_overdue", "event_description": "大理石样板超期未归还", "time_offset": 10},
            {"event_type": "replacement_arrived", "event_description": "补发餐椅已到货", "time_offset": 35},
        ],
    },
    {
        "order_no": "SO20260510002",
        "customer_name": "刘芳",
        "customer_phone": "13987654321",
        "customer_address": "上海市浦东新区陆家嘴环路1000号",
        "total_amount": 45200,
        "deposit_amount": 15000,
        "status": "installing",
        "sales_idx": 1,
        "manager_idx": 3,
        "expected_days": 45,
        "remarks": "客户对安装要求较高，需提前电话确认",
        "items": [
            {"product_name": "意式真皮床（1.8m）", "product_code": "BED-LTH-180", "quantity": 1, "unit_price": 18800},
            {"product_name": "床头柜×2", "product_code": "NST-LTH-2", "quantity": 1, "unit_price": 3600},
            {"product_name": "床垫（独立袋装弹簧）", "product_code": "MAT-SPR-180", "quantity": 1, "unit_price": 8800},
            {"product_name": "衣柜（定制2.4m）", "product_code": "WRD-CST-240", "quantity": 1, "unit_price": 14000},
        ],
        "configs": [
            {"config_type": "颜色", "config_key": "床架颜色", "config_value": "咖啡色", "item_idx": 0},
            {"config_type": "尺寸", "config_key": "衣柜宽度", "config_value": "2.4m", "item_idx": 3, "confirmed": False},
            {"config_type": "内部结构", "config_key": "衣柜内部", "config_value": "左挂衣区+右抽屉3层+中层叠放", "item_idx": 3},
        ],
        "arrivals": [
            {"item_idx": 0, "arrival_offset": 40, "quantity": 1, "tracking_no": "YT9876543210", "status": "arrived", "warehouse": "C区-03", "is_partial": False, "damaged": 0, "missing": 0, "remarks": "完好"},
            {"item_idx": 1, "arrival_offset": 40, "quantity": 1, "tracking_no": "YT9876543210", "status": "arrived", "warehouse": "C区-03", "is_partial": False, "damaged": 0, "missing": 0, "remarks": "完好"},
            {"item_idx": 2, "arrival_offset": 42, "quantity": 1, "tracking_no": "YT9876543211", "status": "arrived", "warehouse": "C区-03", "is_partial": False, "damaged": 0, "missing": 0, "remarks": "完好"},
        ],
        "installations": [
            {"item_idx": 0, "scheduled_offset": 46, "installer": "李师傅", "contact": "刘芳", "phone": "13987654321", "status": "scheduled", "start_offset": None, "end_offset": None},
        ],
        "samples": [],
        "replacements": [],
        "timeline_events": [
            {"event_type": "order_created", "event_description": "订单创建，总金额45,200元，定金15,000元已收", "time_offset": 0},
            {"event_type": "config_pending", "event_description": "衣柜尺寸和内部结构待客户最终确认", "time_offset": 1},
            {"event_type": "status_change", "event_description": "订单状态变更为：生产中", "time_offset": 5},
            {"event_type": "status_change", "event_description": "订单状态变更为：已发货", "time_offset": 35},
            {"event_type": "arrival", "event_description": "床、床头柜到货", "time_offset": 40},
            {"event_type": "arrival", "event_description": "床垫到货", "time_offset": 42},
            {"event_type": "installation_scheduled", "event_description": "安装预约：5月26日 李师傅", "time_offset": 16},
        ],
    },
    {
        "order_no": "SO20260515003",
        "customer_name": "赵强",
        "customer_phone": "13566778899",
        "customer_address": "广州市天河区珠江新城富力中心2205",
        "total_amount": 128600,
        "deposit_amount": 40000,
        "status": "partial_arrived",
        "sales_idx": 0,
        "manager_idx": 3,
        "expected_days": 60,
        "remarks": "大客户全屋定制，配置复杂，需多方确认",
        "items": [
            {"product_name": "定制整体橱柜（L型4.2m）", "product_code": "KTC-CST-420", "quantity": 1, "unit_price": 42000},
            {"product_name": "定制岛台（1.8m）", "product_code": "ISL-CST-180", "quantity": 1, "unit_price": 18600},
            {"product_name": "定制书房书柜（3.0m）", "product_code": "BKC-CST-300", "quantity": 1, "unit_price": 15800},
            {"product_name": "定制电视柜（2.4m）", "product_code": "TVC-CST-240", "quantity": 1, "unit_price": 12800},
            {"product_name": "玄关柜定制", "product_code": "ENR-CST-120", "quantity": 1, "unit_price": 9800},
            {"product_name": "阳台储物柜定制", "product_code": "BLC-CST-150", "quantity": 1, "unit_price": 7600},
            {"product_name": "五金配件包", "product_code": "HDW-PKG-001", "quantity": 1, "unit_price": 22000},
        ],
        "configs": [
            {"config_type": "板材", "config_key": "柜体板材", "config_value": "多层实木板（E0级）"},
            {"config_type": "门板", "config_key": "橱柜门板", "config_value": "吸塑门板-暖白色", "item_idx": 0},
            {"config_type": "台面", "config_key": "橱柜台面", "config_value": "石英石-鱼肚白", "item_idx": 0},
            {"config_type": "门板", "config_key": "书柜门板", "config_value": "玻璃门+实木组合", "item_idx": 2},
            {"config_type": "五金", "config_key": "拉手", "config_value": "黑色长拉手（定制长度）"},
            {"config_type": "灯光", "config_key": "感应灯带", "config_value": "橱柜下方+书柜内部", "confirmed": False},
        ],
        "arrivals": [
            {"item_idx": 0, "arrival_offset": 55, "quantity": 1, "tracking_no": "JD5566778899", "status": "arrived", "warehouse": "D区-01", "is_partial": True, "damaged": 0, "missing": 0, "remarks": "橱柜柜体已到，门板未到，分批发货"},
            {"item_idx": 2, "arrival_offset": 55, "quantity": 1, "tracking_no": "JD5566778899", "status": "arrived", "warehouse": "D区-02", "is_partial": False, "damaged": 0, "missing": 0, "remarks": "书柜完好"},
            {"item_idx": 6, "arrival_offset": 50, "quantity": 1, "tracking_no": "JD4455667788", "status": "arrived", "warehouse": "D区-03", "is_partial": False, "damaged": 0, "missing": 0, "remarks": "五金配件包完好"},
        ],
        "installations": [],
        "samples": [
            {"sample_name": "暖白吸塑门板样板", "sample_code": "SMP-WHT-001", "lent_to": "赵强", "due_offset": 10, "returned_offset": 8, "status": "returned", "condition": "完好"},
            {"sample_name": "石英石台面样板", "sample_code": "SMP-QRT-001", "lent_to": "赵强", "due_offset": 10, "returned_offset": 9, "status": "returned", "condition": "完好"},
            {"sample_name": "黑色拉手样品", "sample_code": "SMP-HDL-001", "lent_to": "赵强", "due_offset": 10, "returned_offset": None, "status": "lent", "condition": None, "remarks": "客户暂留对比"},
        ],
        "replacements": [],
        "timeline_events": [
            {"event_type": "order_created", "event_description": "大客户订单创建，全屋定制总金额128,600元，定金40,000元", "time_offset": 0},
            {"event_type": "config_confirmed", "event_description": "板材、门板、台面配置已确认", "time_offset": 7},
            {"event_type": "config_pending", "event_description": "感应灯带配置待确认", "time_offset": 7},
            {"event_type": "status_change", "event_description": "订单状态变更为：生产中", "time_offset": 10},
            {"event_type": "sample_lent", "event_description": "借出3件样板供客户确认", "time_offset": 3},
            {"event_type": "status_change", "event_description": "订单状态变更为：已发货", "time_offset": 45},
            {"event_type": "arrival_partial", "event_description": "橱柜柜体、书柜、五金到货，门板未到", "time_offset": 55},
        ],
    },
    {
        "order_no": "SO20260520004",
        "customer_name": "孙丽",
        "customer_phone": "13611223344",
        "customer_address": "深圳市南山区科技园南区T3栋",
        "total_amount": 23800,
        "deposit_amount": 8000,
        "status": "shipped",
        "sales_idx": 1,
        "manager_idx": 3,
        "expected_days": 35,
        "remarks": None,
        "items": [
            {"product_name": "儿童上下铺床（1.2m）", "product_code": "BED-KID-120", "quantity": 1, "unit_price": 9800},
            {"product_name": "儿童书桌（带书架）", "product_code": "DSK-KID-120", "quantity": 1, "unit_price": 6800},
            {"product_name": "儿童衣柜（1.5m）", "product_code": "WRD-KID-150", "quantity": 1, "unit_price": 7200},
        ],
        "configs": [
            {"config_type": "颜色", "config_key": "儿童房家具颜色", "config_value": "天蓝色+白色", "confirmed": True},
            {"config_type": "材质", "config_key": "安全等级", "config_value": "儿童专用E0级板材", "confirmed": True},
        ],
        "arrivals": [],
        "installations": [],
        "samples": [
            {"sample_name": "天蓝色板材小样", "sample_code": "SMP-BLU-001", "lent_to": "孙丽", "due_offset": 5, "returned_offset": 4, "status": "returned", "condition": "完好"},
        ],
        "replacements": [],
        "timeline_events": [
            {"event_type": "order_created", "event_description": "订单创建，儿童房三件套23,800元，定金8,000元", "time_offset": 0},
            {"event_type": "config_confirmed", "event_description": "颜色和材质配置已确认", "time_offset": 2},
            {"event_type": "status_change", "event_description": "订单状态变更为：生产中", "time_offset": 5},
            {"event_type": "status_change", "event_description": "订单状态变更为：已发货", "time_offset": 16},
        ],
    },
    {
        "order_no": "SO20260522005",
        "customer_name": "周伟",
        "customer_phone": "13899887766",
        "customer_address": "成都市高新区天府大道中段1388号",
        "total_amount": 89200,
        "deposit_amount": 30000,
        "status": "producing",
        "sales_idx": 0,
        "manager_idx": 3,
        "expected_days": 50,
        "remarks": "客户要求6月15日前全部安装完成，时间较紧",
        "items": [
            {"product_name": "客厅三人位沙发（定制）", "product_code": "SOFA-CST-3", "quantity": 1, "unit_price": 16800},
            {"product_name": "客厅单人位沙发（定制）", "product_code": "SOFA-CST-1", "quantity": 1, "unit_price": 8600},
            {"product_name": "客厅茶几（岩板）", "product_code": "CTB-RCK-001", "quantity": 1, "unit_price": 4800},
            {"product_name": "餐厅餐桌（1.6m）", "product_code": "DTB-160", "quantity": 1, "unit_price": 7200},
            {"product_name": "餐椅×6", "product_code": "CHR-6", "quantity": 1, "unit_price": 9600},
            {"product_name": "主卧真皮床（1.8m）", "product_code": "BED-M-LTH-180", "quantity": 1, "unit_price": 15800},
            {"product_name": "主卧床头柜×2", "product_code": "NST-M-2", "quantity": 1, "unit_price": 3800},
            {"product_name": "次卧布艺床（1.5m）", "product_code": "BED-S-FAB-150", "quantity": 1, "unit_price": 9200},
            {"product_name": "次卧床头柜×2", "product_code": "NST-S-2", "quantity": 1, "unit_price": 3400},
        ],
        "configs": [
            {"config_type": "颜色", "config_key": "客厅沙发颜色", "config_value": "米白色（定制）", "item_idx": 0},
            {"config_type": "颜色", "config_key": "单人沙发颜色", "config_value": "深棕色（定制）", "item_idx": 1},
            {"config_type": "材质", "config_key": "茶几台面", "config_value": "岩板-意大利灰", "item_idx": 2},
            {"config_type": "颜色", "config_key": "餐桌颜色", "config_value": "胡桃木色", "item_idx": 3},
            {"config_type": "颜色", "config_key": "主卧床颜色", "config_value": "浅灰色真皮", "item_idx": 5},
        ],
        "arrivals": [],
        "installations": [],
        "samples": [],
        "replacements": [],
        "timeline_events": [
            {"event_type": "order_created", "event_description": "订单创建，全屋家具89,200元，定金30,000元", "time_offset": 0},
            {"event_type": "config_confirmed", "event_description": "5项配置已全部确认", "time_offset": 4},
            {"event_type": "status_change", "event_description": "订单状态变更为：生产中", "time_offset": 6},
        ],
    },
    {
        "order_no": "SO20260524006",
        "customer_name": "吴敏",
        "customer_phone": "13755443322",
        "customer_address": "杭州市西湖区文三路399号",
        "total_amount": 15600,
        "deposit_amount": 5000,
        "status": "confirmed",
        "sales_idx": 1,
        "manager_idx": 3,
        "expected_days": 30,
        "remarks": "客户纠结颜色选择，已多次沟通",
        "items": [
            {"product_name": "单人休闲椅", "product_code": "CHR-REL-001", "quantity": 1, "unit_price": 5800},
            {"product_name": "边几", "product_code": "SDE-001", "quantity": 1, "unit_price": 2200},
            {"product_name": "落地灯", "product_code": "LMP-FLR-001", "quantity": 1, "unit_price": 3600},
            {"product_name": "地毯（2m×3m）", "product_code": "CRT-230", "quantity": 1, "unit_price": 4000},
        ],
        "configs": [
            {"config_type": "颜色", "config_key": "休闲椅颜色", "config_value": "墨绿（暂定，待最终确认）", "confirmed": False},
        ],
        "arrivals": [],
        "installations": [],
        "samples": [
            {"sample_name": "墨绿色布艺样", "sample_code": "SMP-GRN-001", "lent_to": "吴敏", "due_offset": 3, "returned_offset": None, "status": "lent", "condition": None, "remarks": "客户带回家对比"},
        ],
        "replacements": [],
        "timeline_events": [
            {"event_type": "order_created", "event_description": "订单创建，15,600元，定金5,000元", "time_offset": 0},
            {"event_type": "config_pending", "event_description": "休闲椅颜色待客户最终确认", "time_offset": 1},
            {"event_type": "sample_lent", "event_description": "借出墨绿色布艺样供客户对比", "time_offset": 1},
        ],
    },
]


def seed_database(db: Session):
    if db.query(User).first():
        return

    users = []
    for u in USERS:
        user = User(**u)
        db.add(user)
        db.flush()
        users.append(user)

    db.flush()

    base_date = datetime(2026, 5, 1)

    for order_data in ORDERS:
        order = Order(
            order_no=order_data["order_no"],
            customer_name=order_data["customer_name"],
            customer_phone=order_data["customer_phone"],
            customer_address=order_data["customer_address"],
            total_amount=order_data["total_amount"],
            deposit_amount=order_data["deposit_amount"],
            status=order_data["status"],
            sales_consultant_id=users[order_data["sales_idx"]].id,
            showroom_manager_id=users[order_data["manager_idx"]].id,
            expected_delivery_date=base_date + timedelta(days=order_data["expected_days"]),
            remarks=order_data.get("remarks"),
            created_at=base_date,
            updated_at=base_date,
        )
        db.add(order)
        db.flush()

        items = []
        for item_data in order_data["items"]:
            item = OrderItem(
                order_id=order.id,
                product_name=item_data["product_name"],
                product_code=item_data["product_code"],
                quantity=item_data["quantity"],
                unit_price=item_data["unit_price"],
                subtotal=item_data["quantity"] * item_data["unit_price"],
                status="pending",
            )
            db.add(item)
            db.flush()
            items.append(item)

        for cfg in order_data.get("configs", []):
            item_id = items[cfg["item_idx"]].id if "item_idx" in cfg else None
            config = OrderConfig(
                order_id=order.id,
                item_id=item_id,
                config_type=cfg["config_type"],
                config_key=cfg["config_key"],
                config_value=cfg["config_value"],
                config_description=cfg.get("config_description"),
                confirmed=cfg.get("confirmed", True),
                confirmed_by=users[3].id if cfg.get("confirmed", True) else None,
                confirmed_at=base_date + timedelta(days=2) if cfg.get("confirmed", True) else None,
            )
            db.add(config)

        for arr in order_data.get("arrivals", []):
            item_id = items[arr["item_idx"]].id if "item_idx" in arr else None
            arrival = Arrival(
                order_id=order.id,
                item_id=item_id,
                arrival_date=base_date + timedelta(days=arr["arrival_offset"]),
                quantity=arr["quantity"],
                tracking_no=arr["tracking_no"],
                status=arr["status"],
                received_by=users[3].id,
                warehouse_location=arr.get("warehouse"),
                remarks=arr.get("remarks"),
                is_partial=arr.get("is_partial", False),
                damaged_qty=arr.get("damaged", 0),
                missing_qty=arr.get("missing", 0),
            )
            db.add(arrival)

        for inst in order_data.get("installations", []):
            item_id = items[inst["item_idx"]].id if "item_idx" in inst else None
            install = Installation(
                order_id=order.id,
                item_id=item_id,
                scheduled_date=base_date + timedelta(days=inst["scheduled_offset"]),
                installer=inst["installer"],
                contact_name=inst["contact"],
                contact_phone=inst["phone"],
                status=inst["status"],
                actual_start_date=base_date + timedelta(days=inst["start_offset"]) if inst.get("start_offset") else None,
                actual_end_date=base_date + timedelta(days=inst["end_offset"]) if inst.get("end_offset") else None,
            )
            db.add(install)

        for samp in order_data.get("samples", []):
            sample = SampleLending(
                order_id=order.id,
                sample_name=samp["sample_name"],
                sample_code=samp.get("sample_code"),
                lent_by=users[0].id,
                lent_to=samp["lent_to"],
                lent_date=base_date + timedelta(days=3),
                due_date=base_date + timedelta(days=samp["due_offset"]),
                returned_date=base_date + timedelta(days=samp["returned_offset"]) if samp.get("returned_offset") else None,
                status=samp["status"],
                condition=samp.get("condition"),
                remarks=samp.get("remarks"),
            )
            db.add(sample)

        for rep in order_data.get("replacements", []):
            item_id = items[rep["item_idx"]].id if "item_idx" in rep else None
            replacement = ReplacementPart(
                order_id=order.id,
                item_id=item_id,
                part_name=rep["part_name"],
                part_code=rep.get("part_code"),
                quantity=rep["quantity"],
                reason=rep["reason"],
                status=rep["status"],
                requested_by=users[0].id,
                requested_date=base_date + timedelta(days=rep["requested_offset"]),
                ordered_date=base_date + timedelta(days=rep["ordered_offset"]) if rep.get("ordered_offset") else None,
                arrived_date=base_date + timedelta(days=rep["arrived_offset"]) if rep.get("arrived_offset") else None,
                installed_date=base_date + timedelta(days=rep["installed_offset"]) if rep.get("installed_offset") else None,
                confirmed_by=users[3].id if rep.get("confirmed_offset") else None,
                confirmed_date=base_date + timedelta(days=rep["confirmed_offset"]) if rep.get("confirmed_offset") else None,
            )
            db.add(replacement)

        for evt in order_data.get("timeline_events", []):
            timeline = OrderTimeline(
                order_id=order.id,
                event_type=evt["event_type"],
                event_description=evt["event_description"],
                event_time=base_date + timedelta(days=evt["time_offset"]),
                operator_name=users[3].display_name,
            )
            db.add(timeline)

    db.commit()