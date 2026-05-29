from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
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
        self.create_orders_and_workflow()
        self.create_payments()
        self.create_reminders()

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

    def create_orders_and_workflow(self):
        self.stdout.write('Creating orders and workflow...')

        sales1 = User.objects.get(username='sales1')
        sales2 = User.objects.get(username='sales2')
        warehouse = User.objects.get(username='warehouse')
        boss = User.objects.get(username='boss')
        customers = list(Customer.objects.all())
        parts = list(Part.objects.all())

        order1 = self._create_order(customers[0], sales1, [parts[0], parts[1]], 'INQUIRY')
        order2 = self._create_order(customers[1], sales1, [parts[2], parts[3]], 'INQUIRY_APPROVED')
        OrderWorkflowService.approve_inquiry(order2, sales1, '客户确认价格')

        order3 = self._create_order(customers[2], sales2, [parts[4], parts[5]], 'LOCKED')
        OrderWorkflowService.approve_inquiry(order3, sales2, '大客户价格确认')
        OrderWorkflowService.lock_stock(order3, warehouse, '已核对库存')

        order4 = self._create_order(customers[0], sales1, [parts[6], parts[7]], 'DELIVERED')
        OrderWorkflowService.approve_inquiry(order4, sales1)
        OrderWorkflowService.lock_stock(order4, warehouse)
        OrderWorkflowService.deliver_order(order4, warehouse, '客户自提')

        order5 = self._create_order(customers[2], sales2, [parts[8], parts[9]], 'SETTLED')
        OrderWorkflowService.approve_inquiry(order5, sales2)
        OrderWorkflowService.lock_stock(order5, warehouse)
        OrderWorkflowService.deliver_order(order5, warehouse)
        OrderWorkflowService.settle_order(order5, boss, '月结')

        order6 = self._create_order(customers[1], sales1, [parts[0], parts[3], parts[8]], 'PAID_PARTIAL')
        OrderWorkflowService.approve_inquiry(order6, sales1)
        OrderWorkflowService.lock_stock(order6, warehouse)
        OrderWorkflowService.deliver_order(order6, warehouse)
        OrderWorkflowService.settle_order(order6, boss)

        order7 = self._create_order(customers[3], sales2, [parts[1], parts[4]], 'PAID')
        OrderWorkflowService.approve_inquiry(order7, sales2)
        OrderWorkflowService.lock_stock(order7, warehouse)
        OrderWorkflowService.deliver_order(order7, warehouse)
        OrderWorkflowService.settle_order(order7, boss)

        order8 = self._create_order(customers[4], sales1, [parts[2], parts[6]], 'RETURN_REQUESTED')
        OrderWorkflowService.approve_inquiry(order8, sales1)
        OrderWorkflowService.lock_stock(order8, warehouse)
        OrderWorkflowService.deliver_order(order8, warehouse)
        OrderWorkflowService.settle_order(order8, boss)
        items_data = [{'item_id': order8.items.first().id, 'quantity': 1, 'reason': '型号不对'}]
        OrderWorkflowService.request_return(order8, sales1, items_data, '客户反馈配件型号不符')

        order9 = self._create_order(customers[0], sales1, [parts[5], parts[9]], 'OVERDUE')
        OrderWorkflowService.approve_inquiry(order9, sales1)
        OrderWorkflowService.lock_stock(order9, warehouse)
        OrderWorkflowService.deliver_order(order9, warehouse)
        OrderWorkflowService.settle_order(order9, boss)
        order9.due_date = timezone.now().date() - timedelta(days=15)
        order9.save()

        OrderRemark.objects.create(order=order5, author=sales2, content='客户要求送货上门，已安排')
        OrderRemark.objects.create(order=order5, author=warehouse, content='货物已发出，注意签收', is_internal=True)
        OrderRemark.objects.create(order=order8, author=sales1, content='客户说火花塞型号不对，需要核实')

    def _create_order(self, customer, sales_person, parts, target_status):
        items_data = []
        for i, part in enumerate(parts):
            qty = 2 if i == 0 else 1
            items_data.append({
                'part': part,
                'quantity': qty,
                'unit_price': part.sale_price
            })
        return OrderWorkflowService.create_inquiry(customer, sales_person, items_data, credit_days=customer.credit_days)

    def create_payments(self):
        self.stdout.write('Creating payments...')

        boss = User.objects.get(username='boss')
        sales1 = User.objects.get(username='sales1')
        sales2 = User.objects.get(username='sales2')

        order6 = Order.objects.filter(status='PAID_PARTIAL').first()
        if order6:
            payment = Payment.objects.create(
                payment_no=OrderWorkflowService.generate_payment_no(),
                order=order6,
                customer=order6.customer,
                amount=order6.total_amount * 0.5,
                method='BANK',
                status='CONFIRMED',
                operator=sales1,
                confirm_person=boss,
                confirmed_at=timezone.now(),
                remark='客户预付50%'
            )
            order6.paid_amount = payment.amount
            order6.save()

        order7 = Order.objects.filter(status='PAID').first()
        if order7:
            Payment.objects.create(
                payment_no=OrderWorkflowService.generate_payment_no(),
                order=order7,
                customer=order7.customer,
                amount=order7.total_amount,
                method='WECHAT',
                status='CONFIRMED',
                operator=sales2,
                confirm_person=boss,
                confirmed_at=timezone.now(),
                remark='微信转账已结清'
            )
            order7.paid_amount = order7.total_amount
            order7.save()

        order9 = Order.objects.filter(status='OVERDUE').first()
        if order9:
            Payment.objects.create(
                payment_no=OrderWorkflowService.generate_payment_no(),
                order=order9,
                customer=order9.customer,
                amount=2000,
                method='BANK',
                status='PENDING',
                operator=sales1,
                remark='客户说下午转账'
            )

    def create_reminders(self):
        self.stdout.write('Creating reminders...')

        boss = User.objects.get(username='boss')
        sales1 = User.objects.get(username='sales1')
        sales2 = User.objects.get(username='sales2')

        overdue_order = Order.objects.filter(status='OVERDUE').first()
        if overdue_order:
            reminder = CollectionReminder.objects.create(
                order=overdue_order,
                assignee=sales1,
                creator=boss,
                title='顺通汽修厂逾期款项催办',
                content='该客户已逾期15天，请尽快联系客户确认回款时间',
                priority='URGENT',
                status='IN_PROGRESS',
                due_date=timezone.now().date() + timedelta(days=3)
            )
            ReminderRemark.objects.create(
                reminder=reminder,
                author=sales1,
                content='已电话联系客户，客户说下周一安排付款'
            )

        settled_orders = Order.objects.filter(status='SETTLED')
        for i, order in enumerate(settled_orders[:2]):
            CollectionReminder.objects.create(
                order=order,
                assignee=sales2 if i == 0 else sales1,
                creator=boss,
                title=f'{order.customer.name}到期提醒',
                content=f'账期将到，请提前跟客户确认付款事宜',
                priority='MEDIUM',
                status='PENDING',
                due_date=order.due_date
            )
