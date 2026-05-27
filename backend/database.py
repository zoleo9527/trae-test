from datetime import datetime, date
from typing import List, Dict, Optional
from uuid import uuid4


class InMemoryDB:
    def __init__(self):
        self.users: List[Dict] = []
        self.customers: List[Dict] = []
        self.orders: List[Dict] = []
        self.routes: List[Dict] = []
        self.deliveries: List[Dict] = []
        self.exceptions: List[Dict] = []
        self.bucket_transactions: List[Dict] = []
        self._init_demo_data()

    def _init_demo_data(self):
        self.users = [
            {
                "id": "admin_001",
                "username": "admin",
                "password": "admin123",
                "name": "张站长",
                "role": "station_master",
                "phone": "13800138001",
                "avatar": "👨‍💼"
            },
            {
                "id": "driver_001",
                "username": "driver1",
                "password": "123456",
                "name": "李师傅",
                "role": "driver",
                "phone": "13800138002",
                "avatar": "🚚"
            },
            {
                "id": "driver_002",
                "username": "driver2",
                "password": "123456",
                "name": "王师傅",
                "role": "driver",
                "phone": "13800138003",
                "avatar": "🚛"
            },
            {
                "id": "cs_001",
                "username": "cs1",
                "password": "123456",
                "name": "刘客服",
                "role": "customer_service",
                "phone": "13800138004",
                "avatar": "👩‍💻"
            }
        ]

        self.customers = [
            {
                "id": "cust_001",
                "name": "阳光小区A座1001",
                "contact": "陈女士",
                "phone": "13900139001",
                "address": "阳光路88号阳光小区A座1001室",
                "water_type": "18.9L桶装纯净水",
                "price_per_bucket": 25,
                "deposit_buckets": 5,
                "total_buckets_delivered": 156,
                "total_buckets_returned": 148,
                "outstanding_buckets": 8
            },
            {
                "id": "cust_002",
                "name": "创新科技有限公司",
                "contact": "周经理",
                "phone": "13900139002",
                "address": "科技园区创新大厦15楼",
                "water_type": "18.9L桶装矿泉水",
                "price_per_bucket": 30,
                "deposit_buckets": 20,
                "total_buckets_delivered": 892,
                "total_buckets_returned": 870,
                "outstanding_buckets": 22
            },
            {
                "id": "cust_003",
                "name": "第一幼儿园",
                "contact": "王园长",
                "phone": "13900139003",
                "address": "文化路12号第一幼儿园后勤处",
                "water_type": "18.9L桶装纯净水",
                "price_per_bucket": 22,
                "deposit_buckets": 15,
                "total_buckets_delivered": 420,
                "total_buckets_returned": 405,
                "outstanding_buckets": 15
            },
            {
                "id": "cust_004",
                "name": "幸福里B栋302",
                "contact": "李先生",
                "phone": "13900139004",
                "address": "幸福大道66号幸福里B栋302室",
                "water_type": "18.9L桶装纯净水",
                "price_per_bucket": 25,
                "deposit_buckets": 3,
                "total_buckets_delivered": 78,
                "total_buckets_returned": 73,
                "outstanding_buckets": 5
            },
            {
                "id": "cust_005",
                "name": "悦美美容院",
                "contact": "张院长",
                "phone": "13900139005",
                "address": "商业步行街18号悦美美容院",
                "water_type": "18.9L桶装矿泉水",
                "price_per_bucket": 30,
                "deposit_buckets": 8,
                "total_buckets_delivered": 234,
                "total_buckets_returned": 225,
                "outstanding_buckets": 9
            },
            {
                "id": "cust_006",
                "name": "金盾律师事务所",
                "contact": "赵律师",
                "phone": "13900139006",
                "address": "金融中心A座22楼2205",
                "water_type": "18.9L桶装矿泉水",
                "price_per_bucket": 30,
                "deposit_buckets": 12,
                "total_buckets_delivered": 356,
                "total_buckets_returned": 340,
                "outstanding_buckets": 16
            }
        ]

        today = date.today()

        self.orders = [
            {
                "id": "ord_20260527_001",
                "customer_id": "cust_001",
                "customer_name": "阳光小区A座1001",
                "order_date": today.isoformat(),
                "water_type": "18.9L桶装纯净水",
                "quantity": 3,
                "price_per_bucket": 25,
                "total_amount": 75,
                "status": "pending",
                "delivery_route_id": "route_20260527_01",
                "delivery_sequence": 1,
                "note": "请上午10点前送到",
                "created_at": "2026-05-27T08:30:00",
                "signed_photo_url": None,
                "delivered_quantity": 0,
                "returned_empty_buckets": 0,
                "actual_delivered_at": None,
                "recipient_signature": None,
                "is_rescheduled": False
            },
            {
                "id": "ord_20260527_002",
                "customer_id": "cust_002",
                "customer_name": "创新科技有限公司",
                "order_date": today.isoformat(),
                "water_type": "18.9L桶装矿泉水",
                "quantity": 10,
                "price_per_bucket": 30,
                "total_amount": 300,
                "status": "pending",
                "delivery_route_id": None,
                "delivery_sequence": None,
                "note": "送到前台即可",
                "created_at": "2026-05-27T07:45:00",
                "signed_photo_url": None,
                "delivered_quantity": 0,
                "returned_empty_buckets": 0,
                "actual_delivered_at": None,
                "recipient_signature": None,
                "is_rescheduled": True
            },
            {
                "id": "ord_20260527_003",
                "customer_id": "cust_003",
                "customer_name": "第一幼儿园",
                "order_date": today.isoformat(),
                "water_type": "18.9L桶装纯净水",
                "quantity": 8,
                "price_per_bucket": 22,
                "total_amount": 176,
                "status": "exception",
                "delivery_route_id": "route_20260527_01",
                "delivery_sequence": 3,
                "note": "请送到后勤仓库",
                "created_at": "2026-05-27T07:30:00",
                "signed_photo_url": None,
                "delivered_quantity": 0,
                "returned_empty_buckets": 0,
                "actual_delivered_at": None,
                "recipient_signature": None,
                "is_rescheduled": False
            },
            {
                "id": "ord_20260527_004",
                "customer_id": "cust_004",
                "customer_name": "幸福里B栋302",
                "order_date": today.isoformat(),
                "water_type": "18.9L桶装纯净水",
                "quantity": 2,
                "price_per_bucket": 25,
                "total_amount": 50,
                "status": "delivered",
                "delivery_route_id": "route_20260527_01",
                "delivery_sequence": 4,
                "note": "",
                "created_at": "2026-05-27T09:15:00",
                "signed_photo_url": "https://picsum.photos/400/300?random=1",
                "delivered_quantity": 2,
                "returned_empty_buckets": 2,
                "actual_delivered_at": "2026-05-27T10:20:00",
                "recipient_signature": "李先生",
                "is_rescheduled": False
            },
            {
                "id": "ord_20260527_005",
                "customer_id": "cust_005",
                "customer_name": "悦美美容院",
                "order_date": today.isoformat(),
                "water_type": "18.9L桶装矿泉水",
                "quantity": 5,
                "price_per_bucket": 30,
                "total_amount": 150,
                "status": "exception",
                "delivery_route_id": "route_20260527_01",
                "delivery_sequence": 5,
                "note": "",
                "created_at": "2026-05-27T08:00:00",
                "signed_photo_url": None,
                "delivered_quantity": 3,
                "returned_empty_buckets": 0,
                "actual_delivered_at": "2026-05-27T11:05:00",
                "recipient_signature": None,
                "is_rescheduled": False
            },
            {
                "id": "ord_20260527_006",
                "customer_id": "cust_006",
                "customer_name": "金盾律师事务所",
                "order_date": today.isoformat(),
                "water_type": "18.9L桶装矿泉水",
                "quantity": 6,
                "price_per_bucket": 30,
                "total_amount": 180,
                "status": "pending",
                "delivery_route_id": "route_20260527_02",
                "delivery_sequence": 1,
                "note": "22楼前台签收",
                "created_at": "2026-05-27T08:10:00",
                "signed_photo_url": None,
                "delivered_quantity": 0,
                "returned_empty_buckets": 0,
                "actual_delivered_at": None,
                "recipient_signature": None,
                "is_rescheduled": False
            }
        ]

        self.routes = [
            {
                "id": "route_20260527_01",
                "name": "城东线-2026-05-27",
                "driver_id": "driver_001",
                "driver_name": "李师傅",
                "date": today.isoformat(),
                "status": "in_progress",
                "total_orders": 4,
                "delivered_orders": 1,
                "pending_orders": 1,
                "exception_orders": 2,
                "total_buckets": 18,
                "delivered_buckets": 5,
                "returned_buckets": 2,
                "start_time": "2026-05-27T09:00:00",
                "end_time": None,
                "vehicle_no": "京A·12345",
                "estimated_return_time": "2026-05-27T16:00:00"
            },
            {
                "id": "route_20260527_02",
                "name": "城西线-2026-05-27",
                "driver_id": "driver_002",
                "driver_name": "王师傅",
                "date": today.isoformat(),
                "status": "pending",
                "total_orders": 1,
                "delivered_orders": 0,
                "pending_orders": 1,
                "exception_orders": 0,
                "total_buckets": 6,
                "delivered_buckets": 0,
                "returned_buckets": 0,
                "start_time": None,
                "end_time": None,
                "vehicle_no": "京A·67890",
                "estimated_return_time": "2026-05-27T12:00:00"
            },
            {
                "id": "route_20260526_01",
                "name": "城东线-2026-05-26",
                "driver_id": "driver_001",
                "driver_name": "李师傅",
                "date": "2026-05-26",
                "status": "completed",
                "total_orders": 8,
                "delivered_orders": 7,
                "pending_orders": 0,
                "exception_orders": 1,
                "total_buckets": 42,
                "delivered_buckets": 38,
                "returned_buckets": 35,
                "start_time": "2026-05-26T09:00:00",
                "end_time": "2026-05-26T15:30:00",
                "vehicle_no": "京A·12345",
                "estimated_return_time": "2026-05-26T16:00:00"
            }
        ]

        self.deliveries = []

        self.exceptions = [
            {
                "id": "exc_001",
                "order_id": "ord_20260527_005",
                "route_id": "route_20260527_01",
                "type": "shortage",
                "title": "送水数量不足",
                "description": "客户订购5桶水，但车上只剩3桶，已与客户沟通下午补送2桶",
                "reported_by": "李师傅",
                "reported_at": "2026-05-27T11:05:00",
                "status": "pending",
                "handled_by": None,
                "handled_at": None,
                "resolution": None,
                "photos": ["https://picsum.photos/400/300?random=2"]
            },
            {
                "id": "exc_002",
                "order_id": "ord_20260527_003",
                "route_id": "route_20260527_01",
                "type": "bucket_dispute",
                "title": "空桶数量争议",
                "description": "客户说有8个空桶待回收，但上次记录只欠6个，请客服核实",
                "reported_by": "李师傅",
                "reported_at": "2026-05-27T11:30:00",
                "status": "pending",
                "handled_by": None,
                "handled_at": None,
                "resolution": None,
                "photos": ["https://picsum.photos/400/300?random=3"]
            },
            {
                "id": "exc_003",
                "order_id": "ord_20260527_002",
                "route_id": "route_20260527_01",
                "type": "customer_absent",
                "title": "客户不在",
                "description": "前台说今天不收货，让明天再送",
                "reported_by": "李师傅",
                "reported_at": "2026-05-27T10:00:00",
                "status": "resolved",
                "handled_by": "刘客服",
                "handled_at": "2026-05-27T10:15:00",
                "resolution": "已与周经理确认改到明天上午配送",
                "photos": []
            }
        ]

        self.bucket_transactions = [
            {
                "id": "bt_001",
                "customer_id": "cust_001",
                "customer_name": "阳光小区A座1001",
                "order_id": "ord_20260527_004",
                "type": "delivery",
                "buckets_change": 2,
                "balance_before": 6,
                "balance_after": 8,
                "operator": "李师傅",
                "created_at": "2026-05-27T10:20:00",
                "note": "配送2桶"
            },
            {
                "id": "bt_002",
                "customer_id": "cust_001",
                "customer_name": "阳光小区A座1001",
                "order_id": "ord_20260527_004",
                "type": "return",
                "buckets_change": -2,
                "balance_before": 8,
                "balance_after": 6,
                "operator": "李师傅",
                "created_at": "2026-05-27T10:20:00",
                "note": "回收空桶2个"
            }
        ]


db = InMemoryDB()
