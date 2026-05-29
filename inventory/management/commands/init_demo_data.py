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

        self.create_users()
        self.create_customers()
        self.create_parts()
        self.create_orders_with_workflow()
        self.create_payments_with_workflow()
        self.create_reminders_with_remarks()

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

    def create_customers(self):
        self.stdout.write('Creating customers...')

        customers_data = [
            {'name': '顺通汽修厂', 'contact': '刘经理', 'phone': '13800138001', 'credit_limit': 50000, 'credit_days': 30},
            {'name': '宏达维修中心', 'contact': '陈厂长', 'phone': '13800138002', 'credit_limit': 30000, 'credit_days': 15},
            {'name': '鑫达汽车服务', 'contact': '周总', 'phone': '13800138003', 'credit_limit': 100000, 'credit_days': 45},
            {'name': '快修哥连锁', 'contact': '吴店长', 'phone': '13800138004', 'credit_limit': 20000, 'credit_days': 7},
            {'name': '老友记汽修', 'contact': '老孙', 'phone': '13800138005', 'credit_limit': 15000, 'credit_days': 30},
        ]

        for data in customers_data:
            Customer.objects.get_or_create(name=data['name'], defaults=data)

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

        for data in parts_data:
            Part.objects.get_or_create(part_code=data['part_code'], defaults=data)

    def _create_order(self, customer, sales_person, parts_data_items):
        items_data = []
        for item in parts_data_items:
            items_data.append({
                'part': item['part'],
                'quantity': item['quantity'],
                'unit_price': item['part'].sale_price
            })
        return OrderWorkflowService.create_inquiry(customer, sales_person, items_data, credit_days=customer.credit_days)

    def create_orders_with_workflow(self):
        self.stdout.write('Creating orders with real workflow...')

        sales1 = User.objects.get(username='sales1')
        sales2 = User.objects.get(username='sales2')
        warehouse = User.objects.get(username='warehouse')
        boss = User.objects.get(username='boss')
        customers = list(Customer.objects.all())
        parts = list(Part.objects.all())

        order_inquiry = self._create_order(customers[0], sales1, [
            {'part': parts[0], 'quantity': 2},
            {'part': parts[1], 'quantity': 1}
        ])
        self.stdout.write(f'  - 询价中订单: {order_inquiry.order_no}')

        order_approved = self._create_order(customers[1], sales1, [
            {'part': parts[2], 'quantity': 4},
            {'part': parts[3], 'quantity': 1}
        ])
        OrderWorkflowService.approve_inquiry(order_approved, sales1, '客户确认价格，急单')
        self.stdout.write(f'  - 询价已确认: {order_approved.order_no}')

        order_locked = self._create_order(customers[2], sales2, [
            {'part': parts[4], 'quantity': 2},
            {'part': parts[5], 'quantity': 1}
        ])
        OrderWorkflowService.approve_inquiry(order_locked, sales2, '大客户月结')
        OrderWorkflowService.lock_stock(order_locked, warehouse, '库存已核对，待配送')
        self.stdout.write(f'  - 已锁库: {order_locked.order_no}')

        order_delivered = self._create_order(customers[0], sales1, [
            {'part': parts[6], 'quantity': 10},
            {'part': parts[7], 'quantity': 1}
        ])
        OrderWorkflowService.approve_inquiry(order_delivered, sales1)
        OrderWorkflowService.lock_stock(order_delivered, warehouse)
        OrderWorkflowService.deliver_order(order_delivered, warehouse, '客户上门自提')
        self.stdout.write(f'  - 已出库: {order_delivered.order_no}')

        order_settled = self._create_order(customers[2], sales2, [
            {'part': parts[8], 'quantity': 5},
            {'part': parts[9], 'quantity': 10}
        ])
        OrderWorkflowService.approve_inquiry(order_settled, sales2)
        OrderWorkflowService.lock_stock(order_settled, warehouse)
        OrderWorkflowService.deliver_order(order_settled, warehouse)
        OrderWorkflowService.settle_order(order_settled, boss, '月结账单')
        self.stdout.write(f'  - 已结算: {order_settled.order_no}')

        order_partial = self._create_order(customers[1], sales1, [
            {'part': parts[0], 'quantity': 10},
            {'part': parts[3], 'quantity': 2},
            {'part': parts[8], 'quantity': 3}
        ])
        OrderWorkflowService.approve_inquiry(order_partial, sales1)
        OrderWorkflowService.lock_stock(order_partial, warehouse)
        OrderWorkflowService.deliver_order(order_partial, warehouse)
        OrderWorkflowService.settle_order(order_partial, boss)
        self.stdout.write(f'  - 已结算(将部分回款): {order_partial.order_no}')

        order_paid = self._create_order(customers[3], sales2, [
            {'part': parts[1], 'quantity': 5},
            {'part': parts[4], 'quantity': 2}
        ])
        OrderWorkflowService.approve_inquiry(order_paid, sales2)
        OrderWorkflowService.lock_stock(order_paid, warehouse)
        OrderWorkflowService.deliver_order(order_paid, warehouse)
        OrderWorkflowService.settle_order(order_paid, boss)
        self.stdout.write(f'  - 已结算(将结清): {order_paid.order_no}')

        order_return = self._create_order(customers[4], sales1, [
            {'part': parts[2], 'quantity': 8},
            {'part': parts[6], 'quantity': 2}
        ])
        OrderWorkflowService.approve_inquiry(order_return, sales1)
        OrderWorkflowService.lock_stock(order_return, warehouse)
        OrderWorkflowService.deliver_order(order_return, warehouse)
        OrderWorkflowService.settle_order(order_return, boss)
        first_item = order_return.items.first()
        items_data = [{'item_id': first_item.id, 'quantity': 2, 'reason': '型号不对，拿错了'}]
        OrderWorkflowService.request_return(order_return, sales1, items_data, '客户反馈火花塞型号不符，需要退货')
        self.stdout.write(f'  - 退货申请中: {order_return.order_no}')

        order_overdue = self._create_order(customers[0], sales1, [
            {'part': parts[5], 'quantity': 2},
            {'part': parts[9], 'quantity': 6}
        ])
        OrderWorkflowService.approve_inquiry(order_overdue, sales1)
        OrderWorkflowService.lock_stock(order_overdue, warehouse)
        OrderWorkflowService.deliver_order(order_overdue, warehouse)
        OrderWorkflowService.settle_order(order_overdue, boss)
        order_overdue.due_date = timezone.now().date() - timedelta(days=15)
        order_overdue.save()
        self.stdout.write(f'  - 已逾期: {order_overdue.order_no} (到期日: {order_overdue.due_date})')

        OrderRemark.objects.create(order=order_settled, author=sales2, content='客户要求送货上门，已安排配送')
        OrderRemark.objects.create(order=order_settled, author=warehouse, content='货物已发出，走顺丰，注意签收', is_internal=True)
        OrderRemark.objects.create(order=order_return, author=sales1, content='客户说型号不对，我核对了确实是BKR6E不是BKR5E，需要退货重发')
        OrderRemark.objects.create(order=order_overdue, author=sales1, content='已催过两次，客户说资金紧张')

    def create_payments_with_workflow(self):
        self.stdout.write('Creating payments with real workflow confirmation...')

        boss = User.objects.get(username='boss')
        sales1 = User.objects.get(username='sales1')
        sales2 = User.objects.get(username='sales2')

        settled_orders = list(Order.objects.filter(status='SETTLED'))
        if len(settled_orders) >= 2:
            order_partial = settled_orders[0]
            partial_amount = order_partial.total_amount * Decimal('0.5')
            payment_pending1 = Payment.objects.create(
                payment_no=OrderWorkflowService.generate_payment_no(),
                order=order_partial,
                customer=order_partial.customer,
                amount=partial_amount,
                method='BANK',
                status='PENDING',
                operator=sales1,
                remark='客户说先付一半，剩下的下周'
            )
            self.stdout.write(f'  - 待确认回款: {payment_pending1.payment_no} ({partial_amount}元)')

            payment1 = Payment.objects.create(
                payment_no=OrderWorkflowService.generate_payment_no(),
                order=order_partial,
                customer=order_partial.customer,
                amount=partial_amount,
                method='BANK',
                status='PENDING',
                operator=sales1,
                remark='客户预付50%，银行转账'
            )
            OrderWorkflowService.confirm_payment(payment1, boss, '部分回款已确认')
            self.stdout.write(f'  - 部分回款已确认: {payment1.payment_no} ({partial_amount}元) → 订单状态: {order_partial.status}')

            order_paid = settled_orders[1]
            full_amount = order_paid.total_amount
            payment2 = Payment.objects.create(
                payment_no=OrderWorkflowService.generate_payment_no(),
                order=order_paid,
                customer=order_paid.customer,
                amount=full_amount,
                method='WECHAT',
                status='PENDING',
                operator=sales2,
                remark='微信转账，现场支付'
            )
            OrderWorkflowService.confirm_payment(payment2, boss, '已结清')
            self.stdout.write(f'  - 全款已确认: {payment2.payment_no} ({full_amount}元) → 订单状态: {order_paid.status}')

        overdue_order = Order.objects.filter(due_date__lt=timezone.now().date()).first()
        if overdue_order:
            payment_pending = Payment.objects.create(
                payment_no=OrderWorkflowService.generate_payment_no(),
                order=overdue_order,
                customer=overdue_order.customer,
                amount=2000,
                method='BANK',
                status='PENDING',
                operator=sales1,
                remark='客户说今天下午安排转2000先'
            )
            self.stdout.write(f'  - 逾期单待确认: {payment_pending.payment_no} (2000元)')

    def create_reminders_with_remarks(self):
        self.stdout.write('Creating collection reminders with remarks...')

        boss = User.objects.get(username='boss')
        sales1 = User.objects.get(username='sales1')
        sales2 = User.objects.get(username='sales2')

        overdue_order = Order.objects.filter(due_date__lt=timezone.now().date()).first()
        if overdue_order:
            reminder1 = CollectionReminder.objects.create(
                order=overdue_order,
                assignee=sales1,
                creator=boss,
                title='顺通汽修厂逾期款项紧急催办',
                content=f'该客户已逾期15天，未回款金额 ¥{overdue_order.unpaid_amount}，请立即联系客户确认回款时间，必要时上门催收',
                priority='URGENT',
                status='IN_PROGRESS',
                due_date=timezone.now().date() + timedelta(days=3)
            )
            ReminderRemark.objects.create(
                reminder=reminder1,
                author=sales1,
                content='已电话联系刘经理，客户说下周一安排付款，先转一部分'
            )
            ReminderRemark.objects.create(
                reminder=reminder1,
                author=boss,
                content='跟紧，这家是老客户但最近资金有点紧，下周一再跟进一次'
            )
            self.stdout.write(f'  - 紧急催办(进行中): {reminder1.title}')

        partial_orders = list(Order.objects.filter(status='PAID_PARTIAL'))
        if partial_orders:
            reminder2 = CollectionReminder.objects.create(
                order=partial_orders[0],
                assignee=sales1,
                creator=boss,
                title='宏达维修中心剩余款项催办',
                content='已付50%，剩下的要在账期内收完',
                priority='HIGH',
                status='PENDING',
                due_date=partial_orders[0].due_date
            )
            self.stdout.write(f'  - 高优先级催办(待处理): {reminder2.title}')

        settled_orders = list(Order.objects.filter(status='SETTLED'))
        if len(settled_orders) >= 1:
            reminder3 = CollectionReminder.objects.create(
                order=settled_orders[0],
                assignee=sales2,
                creator=boss,
                title='鑫达汽车服务到期提醒',
                content='账期将到，提前跟客户打个招呼',
                priority='MEDIUM',
                status='PENDING',
                due_date=settled_orders[0].due_date
            )
            self.stdout.write(f'  - 普通催办(待处理): {reminder3.title}')
