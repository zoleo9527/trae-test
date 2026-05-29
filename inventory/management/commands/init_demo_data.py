from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from django.db import transaction
from datetime import timedelta
from decimal import Decimal
from inventory.models import (
    UserProfile, Customer, Part, Order, OrderItem, OrderStatusLog,
    OrderRemark, Payment, CollectionReminder, ReminderRemark
)
from inventory.services import OrderWorkflowService


class Command(BaseCommand):
    help = 'Initialize demo data'

    def handle(self, *args, **options):
        self.stdout.write('Creating demo data...')

        boss, sales1, sales2, warehouse = self.create_users()
        customers = self.create_customers()
        parts = self.create_parts()

        st = customers[0]  # 顺通汽修厂
        hd = customers[1]  # 宏达维修中心
        xd = customers[2]  # 鑫达汽车服务
        kx = customers[3]  # 快修哥连锁
        lyj = customers[4]  # 老友记汽修

        self.stdout.write('Creating orders with real workflow...')
        order_inquiry = self._create_order(st, sales1, [
            {'part': parts[0], 'quantity': 2},
            {'part': parts[1], 'quantity': 1}
        ])
        self.stdout.write(f'  - 询价中: {order_inquiry.order_no} ({st.name})')

        order_approved = self._create_order(hd, sales1, [
            {'part': parts[2], 'quantity': 4},
            {'part': parts[3], 'quantity': 1}
        ])
        OrderWorkflowService.approve_inquiry(order_approved, sales1, '客户确认价格，急单')
        self.stdout.write(f'  - 询价已确认: {order_approved.order_no} ({hd.name})')

        order_locked = self._create_order(xd, sales2, [
            {'part': parts[4], 'quantity': 2},
            {'part': parts[5], 'quantity': 1}
        ])
        OrderWorkflowService.approve_inquiry(order_locked, sales2, '大客户月结')
        OrderWorkflowService.lock_stock(order_locked, warehouse, '库存已核对，待配送')
        self.stdout.write(f'  - 已锁库: {order_locked.order_no} ({xd.name})')

        order_delivered = self._create_order(st, sales1, [
            {'part': parts[6], 'quantity': 10},
            {'part': parts[7], 'quantity': 1}
        ])
        OrderWorkflowService.approve_inquiry(order_delivered, sales1)
        OrderWorkflowService.lock_stock(order_delivered, warehouse)
        OrderWorkflowService.deliver_order(order_delivered, warehouse, '客户上门自提')
        self.stdout.write(f'  - 已出库: {order_delivered.order_no} ({st.name})')

        order_settled_xd = self._create_order(xd, sales2, [
            {'part': parts[8], 'quantity': 5},
            {'part': parts[9], 'quantity': 10}
        ])
        OrderWorkflowService.approve_inquiry(order_settled_xd, sales2)
        OrderWorkflowService.lock_stock(order_settled_xd, warehouse)
        OrderWorkflowService.deliver_order(order_settled_xd, warehouse)
        OrderWorkflowService.settle_order(order_settled_xd, boss, '月结账单')
        self.stdout.write(f'  - 已结算(将到期): {order_settled_xd.order_no} ({xd.name})')

        order_partial_hd = self._create_order(hd, sales1, [
            {'part': parts[0], 'quantity': 10},
            {'part': parts[3], 'quantity': 2},
            {'part': parts[8], 'quantity': 3}
        ])
        OrderWorkflowService.approve_inquiry(order_partial_hd, sales1)
        OrderWorkflowService.lock_stock(order_partial_hd, warehouse)
        OrderWorkflowService.deliver_order(order_partial_hd, warehouse)
        OrderWorkflowService.settle_order(order_partial_hd, boss)
        self.stdout.write(f'  - 已结算(将部分回款): {order_partial_hd.order_no} ({hd.name})')

        order_paid_kx = self._create_order(kx, sales2, [
            {'part': parts[1], 'quantity': 5},
            {'part': parts[4], 'quantity': 2}
        ])
        OrderWorkflowService.approve_inquiry(order_paid_kx, sales2)
        OrderWorkflowService.lock_stock(order_paid_kx, warehouse)
        OrderWorkflowService.deliver_order(order_paid_kx, warehouse)
        OrderWorkflowService.settle_order(order_paid_kx, boss)
        self.stdout.write(f'  - 已结算(将结清): {order_paid_kx.order_no} ({kx.name})')

        order_return_lyj = self._create_order(lyj, sales1, [
            {'part': parts[2], 'quantity': 8},
            {'part': parts[6], 'quantity': 2}
        ])
        OrderWorkflowService.approve_inquiry(order_return_lyj, sales1)
        OrderWorkflowService.lock_stock(order_return_lyj, warehouse)
        OrderWorkflowService.deliver_order(order_return_lyj, warehouse)
        OrderWorkflowService.settle_order(order_return_lyj, boss)
        first_item = order_return_lyj.items.first()
        items_data = [{'item_id': first_item.id, 'quantity': 2, 'reason': '型号不对，拿错了'}]
        OrderWorkflowService.request_return(order_return_lyj, sales1, items_data, '客户反馈火花塞型号不符，需要退货')
        self.stdout.write(f'  - 退货申请中: {order_return_lyj.order_no} ({lyj.name})')

        order_return_approved_xd = self._create_order(xd, sales2, [
            {'part': parts[1], 'quantity': 3},
            {'part': parts[4], 'quantity': 1}
        ])
        OrderWorkflowService.approve_inquiry(order_return_approved_xd, sales2)
        OrderWorkflowService.lock_stock(order_return_approved_xd, warehouse)
        OrderWorkflowService.deliver_order(order_return_approved_xd, warehouse)
        OrderWorkflowService.settle_order(order_return_approved_xd, boss)
        ra_item = order_return_approved_xd.items.first()
        ra_items = [{'item_id': ra_item.id, 'quantity': 1, 'reason': '质量问题，外观有划痕'}]
        OrderWorkflowService.request_return(order_return_approved_xd, sales2, ra_items, '客户收货时发现空气滤清器外包装破损')
        OrderWorkflowService.approve_return(order_return_approved_xd, boss, '情况属实，同意退货')
        self.stdout.write(f'  - 退货已批准: {order_return_approved_xd.order_no} ({xd.name})')

        order_return_rejected_hd = self._create_order(hd, sales1, [
            {'part': parts[3], 'quantity': 2},
            {'part': parts[8], 'quantity': 1}
        ])
        OrderWorkflowService.approve_inquiry(order_return_rejected_hd, sales1)
        OrderWorkflowService.lock_stock(order_return_rejected_hd, warehouse)
        OrderWorkflowService.deliver_order(order_return_rejected_hd, warehouse)
        rr_item = order_return_rejected_hd.items.first()
        rr_items = [{'item_id': rr_item.id, 'quantity': 1, 'reason': '不想买了，无理由退货'}]
        OrderWorkflowService.request_return(order_return_rejected_hd, sales1, rr_items, '客户说尺寸不合适想退货')
        OrderWorkflowService.reject_return(order_return_rejected_hd, boss, '无质量问题不支持无理由退货，已跟客户解释清楚')
        self.stdout.write(f'  - 退货已驳回: {order_return_rejected_hd.order_no} ({hd.name})')

        order_overdue_st = self._create_order(st, sales1, [
            {'part': parts[5], 'quantity': 2},
            {'part': parts[9], 'quantity': 6}
        ])
        OrderWorkflowService.approve_inquiry(order_overdue_st, sales1)
        OrderWorkflowService.lock_stock(order_overdue_st, warehouse)
        OrderWorkflowService.deliver_order(order_overdue_st, warehouse)
        OrderWorkflowService.settle_order(order_overdue_st, boss)
        order_overdue_st.due_date = timezone.now().date() - timedelta(days=15)
        order_overdue_st.save()
        self.stdout.write(f'  - 已逾期: {order_overdue_st.order_no} ({st.name}, 到期日: {order_overdue_st.due_date})')

        OrderRemark.objects.create(order=order_settled_xd, author=sales2, content='客户要求送货上门，已安排配送')
        OrderRemark.objects.create(order=order_settled_xd, author=warehouse, content='货物已发出，走顺丰，注意签收', is_internal=True)
        OrderRemark.objects.create(order=order_return_lyj, author=sales1, content='客户说型号不对，我核对了确实是BKR6E不是BKR5E，需要退货重发')
        OrderRemark.objects.create(order=order_return_approved_xd, author=sales2, content='客户拍照反馈外包装有划痕，已同意退货')
        OrderRemark.objects.create(order=order_return_rejected_hd, author=boss, content='无质量问题，已跟客户沟通不支持无理由退货')
        OrderRemark.objects.create(order=order_overdue_st, author=sales1, content='已催过两次，客户说资金紧张')
        OrderRemark.objects.create(order=order_partial_hd, author=sales1, content='客户说先付一半，剩下的下周')

        self.stdout.write('Creating payments with real workflow confirmation...')

        payment_pending_partial = Payment.objects.create(
            payment_no=OrderWorkflowService.generate_payment_no(),
            order=order_partial_hd,
            customer=order_partial_hd.customer,
            amount=order_partial_hd.total_amount * Decimal('0.5'),
            method='BANK',
            status='PENDING',
            operator=sales1,
            remark='客户预付50%，银行转账'
        )
        self.stdout.write(f'  - 待确认回款: {payment_pending_partial.payment_no} ({payment_pending_partial.amount}元, {hd.name})')

        partial_amount_hd = order_partial_hd.total_amount * Decimal('0.5')
        payment_confirmed_partial = Payment.objects.create(
            payment_no=OrderWorkflowService.generate_payment_no(),
            order=order_partial_hd,
            customer=order_partial_hd.customer,
            amount=partial_amount_hd,
            method='BANK',
            status='PENDING',
            operator=sales1,
            remark='客户先付一半，银行转账'
        )
        OrderWorkflowService.confirm_payment(payment_confirmed_partial, boss, '部分回款已确认')
        self.stdout.write(f'  - 部分回款已确认: {payment_confirmed_partial.payment_no} ({partial_amount_hd}元) → {order_partial_hd.status} ({hd.name})')

        full_amount_kx = order_paid_kx.total_amount
        payment_full_kx = Payment.objects.create(
            payment_no=OrderWorkflowService.generate_payment_no(),
            order=order_paid_kx,
            customer=order_paid_kx.customer,
            amount=full_amount_kx,
            method='WECHAT',
            status='PENDING',
            operator=sales2,
            remark='微信转账，现场支付'
        )
        OrderWorkflowService.confirm_payment(payment_full_kx, boss, '已结清')
        self.stdout.write(f'  - 全款已确认: {payment_full_kx.payment_no} ({full_amount_kx}元) → {order_paid_kx.status} ({kx.name})')

        payment_pending_overdue = Payment.objects.create(
            payment_no=OrderWorkflowService.generate_payment_no(),
            order=order_overdue_st,
            customer=order_overdue_st.customer,
            amount=Decimal('2000'),
            method='BANK',
            status='PENDING',
            operator=sales1,
            remark='客户说今天下午安排转2000先'
        )
        self.stdout.write(f'  - 逾期单待确认: {payment_pending_overdue.payment_no} (2000元, {st.name})')

        self.stdout.write('Creating collection reminders with remarks...')

        reminder_urgent = CollectionReminder.objects.create(
            order=order_overdue_st,
            assignee=sales1,
            creator=boss,
            title=f'{order_overdue_st.customer.name}逾期款项紧急催办',
            content=f'该客户已逾期15天，未回款金额 ¥{order_overdue_st.unpaid_amount}，请立即联系客户确认回款时间，必要时上门催收',
            priority='URGENT',
            status='IN_PROGRESS',
            due_date=timezone.now().date() + timedelta(days=3)
        )
        ReminderRemark.objects.create(
            reminder=reminder_urgent,
            author=sales1,
            content='已电话联系刘经理，客户说下周一安排付款，先转一部分'
        )
        ReminderRemark.objects.create(
            reminder=reminder_urgent,
            author=boss,
            content='跟紧，这家是老客户但最近资金有点紧，下周一再跟进一次'
        )
        self.stdout.write(f'  - 紧急催办(进行中): {reminder_urgent.title}')

        reminder_high = CollectionReminder.objects.create(
            order=order_partial_hd,
            assignee=sales1,
            creator=boss,
            title=f'{order_partial_hd.customer.name}剩余款项催办',
            content=f'已付50%，剩余 ¥{order_partial_hd.unpaid_amount} 要在账期内收完',
            priority='HIGH',
            status='PENDING',
            due_date=order_partial_hd.due_date
        )
        self.stdout.write(f'  - 高优先级催办(待处理): {reminder_high.title}')

        reminder_medium = CollectionReminder.objects.create(
            order=order_settled_xd,
            assignee=sales2,
            creator=boss,
            title=f'{order_settled_xd.customer.name}到期提醒',
            content='账期将到，提前跟客户打个招呼',
            priority='MEDIUM',
            status='PENDING',
            due_date=order_settled_xd.due_date
        )
        self.stdout.write(f' - 普通催办(待处理): {reminder_medium.title}')

        self.stdout.write(self.style.SUCCESS('Demo data created successfully!'))

    def create_users(self):
        self.stdout.write('Creating users...')

        boss, _ = User.objects.get_or_create(
            username='boss',
            defaults={'first_name': '张', 'last_name': '老板', 'email': 'boss@example.com'}
        )
        boss.set_password('123456')
        boss.save()
        boss.profile.role = 'BOSS'
        boss.profile.save()

        sales1, _ = User.objects.get_or_create(
            username='sales1',
            defaults={'first_name': '李', 'last_name': '销售', 'email': 'sales1@example.com'}
        )
        sales1.set_password('123456')
        sales1.save()
        sales1.profile.role = 'SALES'
        sales1.profile.save()

        sales2, _ = User.objects.get_or_create(
            username='sales2',
            defaults={'first_name': '王', 'last_name': '销售', 'email': 'sales2@example.com'}
        )
        sales2.set_password('123456')
        sales2.save()
        sales2.profile.role = 'SALES'
        sales2.profile.save()

        warehouse, _ = User.objects.get_or_create(
            username='warehouse',
            defaults={'first_name': '赵', 'last_name': '库管', 'email': 'warehouse@example.com'}
        )
        warehouse.set_password('123456')
        warehouse.save()
        warehouse.profile.role = 'WAREHOUSE'
        warehouse.profile.save()

        return boss, sales1, sales2, warehouse

    def create_customers(self):
        self.stdout.write('Creating customers...')

        customers_data = [
            {'name': '顺通汽修厂', 'contact': '刘经理', 'phone': '13800138001', 'credit_limit': 50000, 'credit_days': 30},
            {'name': '宏达维修中心', 'contact': '陈厂长', 'phone': '13800138002', 'credit_limit': 30000, 'credit_days': 15},
            {'name': '鑫达汽车服务', 'contact': '周总', 'phone': '13800138003', 'credit_limit': 100000, 'credit_days': 45},
            {'name': '快修哥连锁', 'contact': '吴店长', 'phone': '13800138004', 'credit_limit': 20000, 'credit_days': 7},
            {'name': '老友记汽修', 'contact': '老孙', 'phone': '13800138005', 'credit_limit': 15000, 'credit_days': 30},
        ]

        customers = []
        for data in customers_data:
            c, _ = Customer.objects.get_or_create(name=data['name'], defaults=data)
            customers.append(c)
        return customers

    def create_parts(self):
        self.stdout.write('Creating parts...')

        parts_data = [
            {'part_code': 'ENG-001', 'name': '机油滤清器', 'brand': '博世', 'model': 'AF0041', 'category': 'ENGINE', 'spec': '通用型', 'stock_qty': 100, 'cost_price': 25, 'sale_price': 45},
            {'part_code': 'ENG-002', 'name': '空气滤清器', 'brand': '曼牌', 'model': 'C27009', 'category': 'ENGINE', 'spec': '大众专用', 'stock_qty': 50, 'cost_price': 35, 'sale_price': 68},
            {'part_code': 'ENG-003', 'name': '火花塞', 'brand': 'NGK', 'model': 'BKR6E', 'category': 'ENGINE', 'spec': '镍合金', 'stock_qty': 200, 'cost_price': 18, 'sale_price': 35},
            {'part_code': 'CHS-001', 'name': '前刹车片', 'brand': '布雷博', 'model': 'P85072', 'category': 'CHASSIS', 'spec': '前轮', 'stock_qty': 30, 'cost_price': 180, 'sale_price': 320},
            {'part_code': 'CHS-002', 'name': '减震器', 'brand': 'KYB', 'model': '334325', 'category': 'CHASSIS', 'spec': '前减', 'stock_qty': 20, 'cost_price': 280, 'sale_price': 480},
            {'part_code': 'ELE-001', 'name': '蓄电池', 'brand': '瓦尔塔', 'model': '6-QW-60', 'category': 'ELECTRIC', 'spec': '12V 60AH', 'stock_qty': 15, 'cost_price': 320, 'sale_price': 520},
            {'part_code': 'ELE-002', 'name': '大灯灯泡', 'brand': '飞利浦', 'model': 'H7', 'category': 'ELECTRIC', 'spec': '55W', 'stock_qty': 80, 'cost_price': 28, 'sale_price': 55},
            {'part_code': 'BDY-001', 'name': '前保险杠', 'brand': '原厂', 'model': '大众朗逸', 'category': 'BODY', 'spec': '带烤漆', 'stock_qty': 5, 'cost_price': 580, 'sale_price': 980},
            {'part_code': 'OIL-001', 'name': '全合成机油', 'brand': '美孚', 'model': '一号 5W-30', 'category': 'OIL', 'spec': '4L', 'stock_qty': 60, 'cost_price': 220, 'sale_price': 380},
            {'part_code': 'OIL-002', 'name': '变速箱油', 'brand': '采埃孚', 'model': 'AV6', 'category': 'OIL', 'spec': '1L', 'stock_qty': 40, 'cost_price': 85, 'sale_price': 150},
        ]

        parts = []
        for data in parts_data:
            p, _ = Part.objects.get_or_create(part_code=data['part_code'], defaults=data)
            parts.append(p)
        return parts

    def _create_order(self, customer, sales_person, parts_data_items):
        items_data = []
        for item in parts_data_items:
            items_data.append({
                'part': item['part'],
                'quantity': item['quantity'],
                'unit_price': item['part'].sale_price
            })
        return OrderWorkflowService.create_inquiry(customer, sales_person, items_data, credit_days=customer.credit_days)
