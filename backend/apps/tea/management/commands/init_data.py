from decimal import Decimal

from django.contrib.auth.models import Group, Permission, User
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.tea.models import (
    ActivitySubmission, Batch, InventoryRecord, Order, OrderItem,
    PriceApproval, Product, Shipment, ShipmentItem, Store, Warehouse,
)


class Command(BaseCommand):
    help = '初始化茶叶经销系统演示数据'

    def handle(self, *args, **options):
        self._create_groups()
        users = self._create_users()
        products = self._create_products()
        warehouses = self._create_warehouses()
        stores = self._create_stores(warehouses)
        batches = self._create_batches(products, warehouses, users['admin'])
        self._create_price_approvals(products, users)
        self._create_activity_submissions(products, users)
        self._create_orders(stores, products, users)
        self._create_shipments(users)
        self.stdout.write(self.style.SUCCESS('演示数据初始化完成！'))
        self.stdout.write('登录账号:')
        for name, user in users.items():
            self.stdout.write(f'  {name}: {user.username} / tea12345')

    def _create_groups(self):
        groups_data = {
            'sales': ['can_submit_price', 'can_submit_activity'],
            'approver': ['can_approve_price', 'can_approve_activity'],
            'warehouse': [],
            'admin': [],
        }
        for group_name, perm_codenames in groups_data.items():
            group, _ = Group.objects.get_or_create(name=group_name)
            for codename in perm_codenames:
                try:
                    perm = Permission.objects.get(codename=codename)
                    group.permissions.add(perm)
                except Permission.DoesNotExist:
                    pass

    def _create_users(self):
        users = {}
        for name in ['admin', 'sales', 'approver', 'warehouse']:
            user, created = User.objects.get_or_create(
                username=name,
                defaults={'email': f'{name}@tea.local', 'is_staff': True},
            )
            if created:
                user.set_password('tea12345')
                user.save()
            if name != 'admin':
                group = Group.objects.filter(name=name).first()
                if group:
                    user.groups.add(group)
            else:
                user.is_superuser = True
                user.save()
            users[name] = user
        return users

    def _create_products(self):
        products_data = [
            {'sku': 'TEA-G-001', 'name': '明前龙井', 'category': 'green',
             'base_unit_price': Decimal('580.00'), 'unit': '斤',
             'spec': '500g/斤，西湖产区'},
            {'sku': 'TEA-G-002', 'name': '碧螺春', 'category': 'green',
             'base_unit_price': Decimal('420.00'), 'unit': '斤',
             'spec': '500g/斤，洞庭山产区'},
            {'sku': 'TEA-B-001', 'name': '正山小种', 'category': 'black',
             'base_unit_price': Decimal('360.00'), 'unit': '斤',
             'spec': '500g/斤，桐木关产区'},
            {'sku': 'TEA-B-002', 'name': '祁门红茶', 'category': 'black',
             'base_unit_price': Decimal('280.00'), 'unit': '斤',
             'spec': '500g/斤，祁门产区'},
            {'sku': 'TEA-O-001', 'name': '大红袍', 'category': 'oolong',
             'base_unit_price': Decimal('680.00'), 'unit': '斤',
             'spec': '500g/斤，武夷山产区'},
            {'sku': 'TEA-O-002', 'name': '铁观音', 'category': 'oolong',
             'base_unit_price': Decimal('320.00'), 'unit': '斤',
             'spec': '500g/斤，安溪产区'},
            {'sku': 'TEA-W-001', 'name': '白毫银针', 'category': 'white',
             'base_unit_price': Decimal('880.00'), 'unit': '斤',
             'spec': '500g/斤，福鼎产区'},
            {'sku': 'TEA-D-001', 'name': '普洱熟茶饼', 'category': 'dark',
             'base_unit_price': Decimal('450.00'), 'unit': '饼',
             'spec': '357g/饼，勐海产区'},
        ]
        products = []
        for data in products_data:
            product, _ = Product.objects.get_or_create(sku=data['sku'], defaults=data)
            products.append(product)
        return products

    def _create_warehouses(self):
        warehouses_data = [
            {'code': 'WH-N', 'name': '华北分仓', 'region': 'north',
             'address': '北京市朝阳区XX路XX号', 'phone': '010-88888888'},
            {'code': 'WH-E', 'name': '华东分仓', 'region': 'east',
             'address': '上海市浦东新区XX路XX号', 'phone': '021-66666666'},
            {'code': 'WH-S', 'name': '华南分仓', 'region': 'south',
             'address': '广州市天河区XX路XX号', 'phone': '020-77777777'},
            {'code': 'WH-W', 'name': '华西分仓', 'region': 'west',
             'address': '成都市锦江区XX路XX号', 'phone': '028-55555555'},
        ]
        warehouses = []
        for data in warehouses_data:
            wh, _ = Warehouse.objects.get_or_create(code=data['code'], defaults=data)
            warehouses.append(wh)
        return warehouses

    def _create_stores(self, warehouses):
        stores_data = [
            {'code': 'ST-N-001', 'name': '北京王府井店', 'region': 'north',
             'phone': '010-11111111', 'address': '北京市东城区王府井大街'},
            {'code': 'ST-N-002', 'name': '天津滨海店', 'region': 'north',
             'phone': '022-22222222', 'address': '天津市滨海新区'},
            {'code': 'ST-E-001', 'name': '上海南京路店', 'region': 'east',
             'phone': '021-33333333', 'address': '上海市黄浦区南京东路'},
            {'code': 'ST-E-002', 'name': '杭州西湖店', 'region': 'east',
             'phone': '0571-44444444', 'address': '杭州市西湖区'},
            {'code': 'ST-S-001', 'name': '广州天河店', 'region': 'south',
             'phone': '020-55555555', 'address': '广州市天河区'},
            {'code': 'ST-S-002', 'name': '深圳福田店', 'region': 'south',
             'phone': '0755-66666666', 'address': '深圳市福田区'},
            {'code': 'ST-W-001', 'name': '成都春熙店', 'region': 'west',
             'phone': '028-77777777', 'address': '成都市锦江区春熙路'},
            {'code': 'ST-W-002', 'name': '重庆解放碑店', 'region': 'west',
             'phone': '023-88888888', 'address': '重庆市渝中区解放碑'},
        ]
        stores = []
        for data in stores_data:
            warehouse = next((w for w in warehouses if w.region == data['region']), None)
            data['responsible_warehouse'] = warehouse
            store, _ = Store.objects.get_or_create(code=data['code'], defaults=data)
            stores.append(store)
        return stores

    def _create_batches(self, products, warehouses, admin_user):
        today = timezone.now().date()
        for i, product in enumerate(products):
            wh = warehouses[i % len(warehouses)]
            batch_no = f'B{product.sku}-{today.strftime("%Y%m%d")}'
            batch, _ = Batch.objects.get_or_create(
                batch_no=batch_no,
                defaults={
                    'product': product,
                    'warehouse': wh,
                    'production_date': today,
                    'initial_quantity': Decimal('500.00'),
                    'unit_cost': product.base_unit_price * Decimal('0.6'),
                    'created_by': admin_user,
                },
            )
            InventoryRecord.objects.get_or_create(
                batch=batch,
                change_type='inbound',
                reference_type='manual',
                defaults={
                    'direction': 1,
                    'change_quantity': Decimal('500.00'),
                    'balance_after': Decimal('500.00'),
                    'created_by': admin_user,
                },
            )

    def _create_price_approvals(self, products, users):
        today = timezone.now().date()
        product = products[0]
        pa1, _ = PriceApproval.objects.get_or_create(
            code='PA-202601-001',
            defaults={
                'product': product,
                'store': None,
                'proposed_unit_price': Decimal('520.00'),
                'effective_from': today,
                'effective_to': today + timezone.timedelta(days=30),
                'reason': '春节促销，明前龙井全部门店推广',
                'status': 'approved',
                'submitter': users['sales'],
                'approver': users['approver'],
                'approved_at': timezone.now(),
                'created_by': users['sales'],
            },
        )
        product2 = products[2]
        pa2, _ = PriceApproval.objects.get_or_create(
            code='PA-202601-002',
            defaults={
                'product': product2,
                'store': None,
                'proposed_unit_price': Decimal('300.00'),
                'effective_from': today,
                'effective_to': today + timezone.timedelta(days=15),
                'reason': '新品推广，正山小种全门店试饮',
                'status': 'approved',
                'submitter': users['sales'],
                'approver': users['approver'],
                'approved_at': timezone.now(),
                'created_by': users['sales'],
            },
        )
        pa3, _ = PriceApproval.objects.get_or_create(
            code='PA-202601-003',
            defaults={
                'product': products[4],
                'store': None,
                'proposed_unit_price': Decimal('600.00'),
                'effective_from': today + timezone.timedelta(days=5),
                'effective_to': today + timezone.timedelta(days=20),
                'reason': '大红袍新品上市推广',
                'status': 'pending',
                'submitter': users['sales'],
                'created_by': users['sales'],
            },
        )
        pa4, _ = PriceApproval.objects.get_or_create(
            code='PA-202601-004',
            defaults={
                'product': products[6],
                'store': None,
                'proposed_unit_price': Decimal('800.00'),
                'effective_from': today,
                'effective_to': today + timezone.timedelta(days=10),
                'reason': '白毫银针高端推广',
                'status': 'rejected',
                'submitter': users['sales'],
                'approver': users['approver'],
                'rejection_reason': '活动价与基础价差距过大，请重新评估',
                'created_by': users['sales'],
            },
        )

    def _create_activity_submissions(self, products, users):
        today = timezone.now().date()
        pa1 = PriceApproval.objects.filter(code='PA-202601-001').first()
        if pa1:
            ActivitySubmission.objects.get_or_create(
                code='AS-202601-001',
                defaults={
                    'price_approval': pa1,
                    'activity_type': 'festival',
                    'activity_name': '春节明前龙井推广活动',
                    'activity_period_from': today,
                    'activity_period_to': today + timezone.timedelta(days=30),
                    'target_sales_quantity': Decimal('200.00'),
                    'budget': Decimal('50000.00'),
                    'description': '春节期间全部门店推广明前龙井，配合试饮和满减活动',
                    'status': 'approved',
                    'submitter': users['sales'],
                    'approver': users['approver'],
                    'approved_at': timezone.now(),
                    'created_by': users['sales'],
                },
            )
        pa2 = PriceApproval.objects.filter(code='PA-202601-002').first()
        if pa2:
            ActivitySubmission.objects.get_or_create(
                code='AS-202601-002',
                defaults={
                    'price_approval': pa2,
                    'activity_type': 'trial',
                    'activity_name': '正山小种试饮推广',
                    'activity_period_from': today,
                    'activity_period_to': today + timezone.timedelta(days=15),
                    'target_sales_quantity': Decimal('100.00'),
                    'budget': Decimal('20000.00'),
                    'description': '正山小种新品全门店试饮，收集反馈',
                    'status': 'pending',
                    'submitter': users['sales'],
                    'created_by': users['sales'],
                },
            )
        pa3 = PriceApproval.objects.filter(code='PA-202601-004').first()
        if pa3:
            ActivitySubmission.objects.get_or_create(
                code='AS-202601-003',
                defaults={
                    'price_approval': pa3,
                    'activity_type': 'new_product',
                    'activity_name': '白毫银针高端品鉴',
                    'activity_period_from': today,
                    'activity_period_to': today + timezone.timedelta(days=10),
                    'target_sales_quantity': Decimal('50.00'),
                    'budget': Decimal('30000.00'),
                    'description': '白毫银针高端客户品鉴会',
                    'status': 'rejected',
                    'submitter': users['sales'],
                    'approver': users['approver'],
                    'rejection_reason': '价格审批已被驳回',
                    'created_by': users['sales'],
                },
            )

    def _create_orders(self, stores, products, users):
        today = timezone.now().date()
        store = stores[0]
        activity = ActivitySubmission.objects.filter(code='AS-202601-001').first()
        order, _ = Order.objects.get_or_create(
            code='OR-202601-001',
            defaults={
                'store': store,
                'activity': activity,
                'status': 'confirmed',
                'total_amount': Decimal('10400.00'),
                'note': '春节促销首单',
                'submitter': users['sales'],
                'confirmed_at': timezone.now(),
                'created_by': users['sales'],
            },
        )
        OrderItem.objects.get_or_create(
            order=order,
            product=products[0],
            defaults={
                'quantity': Decimal('20.00'),
                'unit_price': Decimal('520.00'),
                'activity_price_applied': True,
                'created_by': users['sales'],
            },
        )
        Order.objects.get_or_create(
            code='OR-202601-002',
            defaults={
                'store': stores[1],
                'activity': activity,
                'status': 'draft',
                'total_amount': Decimal('0.00'),
                'note': '',
                'submitter': users['sales'],
                'created_by': users['sales'],
            },
        )

    def _create_shipments(self, users):
        order = Order.objects.filter(code='OR-202601-001').first()
        if not order:
            return
        warehouse = order.store.responsible_warehouse
        if not warehouse:
            warehouse = Warehouse.objects.filter(region=order.store.region).first()
        shipment, _ = Shipment.objects.get_or_create(
            code='SH-202601-001',
            defaults={
                'order': order,
                'from_warehouse': warehouse,
                'tracking_no': 'SF1234567890',
                'status': 'shipped',
                'shipped_at': timezone.now(),
                'note': '顺丰快递',
                'created_by': users['warehouse'],
            },
        )
        order_item = order.items.first()
        if order_item:
            batch = Batch.objects.filter(product=order_item.product).first()
            if batch:
                ShipmentItem.objects.get_or_create(
                    shipment=shipment,
                    order_item=order_item,
                    defaults={
                        'batch': batch,
                        'shipped_quantity': Decimal('20.00'),
                        'created_by': users['warehouse'],
                    },
                )
