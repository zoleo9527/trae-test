from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.db import transaction
from django.utils import timezone
from ...models import (
    UserProfile, Role, StoreGroup, Store, Product, ProductStatus,
    Inventory, ReplenishmentPlan, ReplenishmentOrder, ReplenishmentStatus,
    ReplenishmentItem, TransferOrder, TransferStatus, TransferItem,
    DisplayRecord, DisplayRecordStatus, MemberRedemption, RedemptionStatus
)
from ...services import ReplenishmentService, TransferService, RedemptionService
import random
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = '初始化演示数据，包含能触发异常处理的边界场景'

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write('开始初始化演示数据...')

        self._create_users()
        self._create_store_groups()
        self._create_stores()
        self._create_products()
        self._create_inventory()
        self._create_replenishment_plans()
        self._create_replenishment_orders()
        self._create_transfer_orders()
        self._create_display_records()
        self._create_redemptions()

        self.stdout.write(self.style.SUCCESS('演示数据初始化完成！'))
        self.stdout.write('=' * 60)
        self.stdout.write('测试账号:')
        self.stdout.write('  店长:     store_manager / 123456 (门店A)')
        self.stdout.write('  店长2:    store_manager2 / 123456 (门店B)')
        self.stdout.write('  企划专员: planner / 123456')
        self.stdout.write('  仓管:     warehouse / 123456')
        self.stdout.write('=' * 60)
        self.stdout.write('可触发的异常场景:')
        self.stdout.write('  1. 补货单RP-DEMO-003已完成，尝试操作会触发【状态冲突异常】')
        self.stdout.write('  2. 补货单RP-DEMO-004包含已下架商品，提交会触发【商品已下架异常】')
        self.stdout.write('  3. 调拨单TF-DEMO-002转出门店库存不足，提交会触发【库存不足异常】')
        self.stdout.write('  4. 联名款故宫联名书签有待处理补货单，尝试下架会触发【联名商品同步异常】')
        self.stdout.write('  5. 补货单RP-DEMO-005收货时实收与实发不一致，会触发【数据偏差异常】')
        self.stdout.write('  6. 门店B店长登录操作门店A的单据会触发【权限不足异常】')
        self.stdout.write('  7. 陈列记录中有3条超期7天以上未整改')
        self.stdout.write('  8. 商品库存中有预留库存超过实际库存的极端场景')
        self.stdout.write('=' * 60)

    def _create_users(self):
        self.stdout.write('创建用户...')

        users_data = [
            ('store_manager', '123456', '张店长', Role.STORE_MANAGER, '门店A'),
            ('store_manager2', '123456', '李店长', Role.STORE_MANAGER, '门店B'),
            ('planner', '123456', '王企划', Role.PLANNER, None),
            ('warehouse', '123456', '赵仓管', Role.WAREHOUSE, None),
        ]

        self.users = {}
        for username, password, full_name, role, store_name in users_data:
            user, created = User.objects.get_or_create(
                username=username,
                defaults={'first_name': full_name[0], 'last_name': full_name[1:]}
            )
            if created:
                user.set_password(password)
                user.save()
                self.stdout.write(f'  创建用户: {username} / {password}')

            profile, _ = UserProfile.objects.get_or_create(
                user=user,
                defaults={'role': role, 'phone': f'138{random.randint(10000000, 99999999)}'}
            )
            self.users[username] = {'user': user, 'profile': profile, 'store_name': store_name}

    def _create_store_groups(self):
        self.stdout.write('创建门店群...')

        groups_data = [
            ('华东区域群', '覆盖上海、杭州、南京等华东地区门店', 'planner'),
            ('华北区域群', '覆盖北京、天津、济南等华北地区门店', 'planner'),
        ]

        self.store_groups = {}
        for name, desc, manager_key in groups_data:
            group, created = StoreGroup.objects.get_or_create(
                name=name,
                defaults={
                    'description': desc,
                    'manager': self.users[manager_key]['user']
                }
            )
            if created:
                self.stdout.write(f'  创建门店群: {name}')
            self.store_groups[name] = group

    def _create_stores(self):
        self.stdout.write('创建门店...')

        stores_data = [
            ('SH001', '上海南京东路店', '上海市黄浦区南京东路123号', '华东区域群', 'store_manager'),
            ('SH002', '上海徐家汇店', '上海市徐汇区徐家汇路456号', '华东区域群', None),
            ('HZ001', '杭州西湖店', '杭州市西湖区西湖路789号', '华东区域群', 'store_manager2'),
            ('BJ001', '北京王府井店', '北京市东城区王府井大街123号', '华北区域群', None),
        ]

        self.stores = {}
        for code, name, address, group_name, manager_key in stores_data:
            group = self.store_groups.get(group_name)
            manager = self.users[manager_key]['user'] if manager_key else None

            store, created = Store.objects.get_or_create(
                code=code,
                defaults={
                    'name': name,
                    'address': address,
                    'group': group,
                    'manager': manager,
                    'is_active': True
                }
            )
            if created:
                self.stdout.write(f'  创建门店: {code} - {name}')

            if manager_key:
                self.users[manager_key]['profile'].store = store
                self.users[manager_key]['profile'].save()

            self.stores[code] = store

    def _create_products(self):
        self.stdout.write('创建商品...')

        products_data = [
            ('SKU001', '古典书签套装', '文具', False, '', ProductStatus.LISTED, 15.0, 39.9, 500, 20),
            ('SKU002', '故宫联名文创胶带', '文具', True, '故宫博物院', ProductStatus.LISTED, 25.0, 68.0, 1000, 30),
            ('SKU003', '敦煌联名帆布包', '配饰', True, '敦煌研究院', ProductStatus.LISTED, 45.0, 128.0, 2000, 15),
            ('SKU004', '手绘陶瓷杯', '日用', False, '', ProductStatus.LISTED, 35.0, 89.0, 800, 10),
            ('SKU005', '城市纪念徽章-上海', '徽章', False, '', ProductStatus.LISTED, 8.0, 25.0, 300, 50),
            ('SKU006', '城市纪念徽章-北京', '徽章', False, '', ProductStatus.LISTED, 8.0, 25.0, 300, 50),
            ('SKU007', '丝绸笔记本', '文具', False, '', ProductStatus.DELISTED, 20.0, 58.0, 800, 25),
            ('SKU008', '大师联名书法摆件', '摆件', True, '王羲之纪念馆', ProductStatus.DRAFT, 120.0, 368.0, 5000, 5),
            ('SKU009', '木质印章套装', '文具', False, '', ProductStatus.LISTED, 18.0, 48.0, 600, 20),
            ('SKU010', '创意便签本', '文具', False, '', ProductStatus.LISTED, 5.0, 15.0, 200, 100),
        ]

        self.products = {}
        for sku, name, category, is_collab, brand, status, cost, retail, points, safe_stock in products_data:
            product, created = Product.objects.get_or_create(
                sku=sku,
                defaults={
                    'name': name,
                    'category': category,
                    'is_collaboration': is_collab,
                    'collaboration_brand': brand,
                    'status': status,
                    'cost_price': cost,
                    'retail_price': retail,
                    'points_required': points,
                    'safe_stock': safe_stock
                }
            )
            if created:
                self.stdout.write(f'  创建商品: {sku} - {name} {"[联名]" if is_collab else ""} [{status}]')
            self.products[sku] = product

    def _create_inventory(self):
        self.stdout.write('创建库存数据（包含异常场景）...')

        inventory_scenarios = [
            ('SH001', 'SKU001', 15, 0),
            ('SH001', 'SKU002', 8, 0),
            ('SH001', 'SKU003', 12, 0),
            ('SH001', 'SKU004', 5, 0),
            ('SH001', 'SKU005', 60, 0),
            ('SH001', 'SKU009', 3, 0),
            ('SH001', 'SKU010', 200, 0),
            ('SH002', 'SKU001', 25, 0),
            ('SH002', 'SKU002', 3, 0),
            ('SH002', 'SKU004', 0, 0),
            ('SH002', 'SKU005', 45, 0),
            ('SH002', 'SKU010', 80, 0),
            ('HZ001', 'SKU001', 18, 0),
            ('HZ001', 'SKU002', 20, 0),
            ('HZ001', 'SKU003', 8, 0),
            ('HZ001', 'SKU005', 55, 0),
            ('HZ001', 'SKU009', 25, 0),
            ('HZ001', 'SKU010', 120, 0),
            ('BJ001', 'SKU001', 22, 0),
            ('BJ001', 'SKU002', 15, 0),
            ('BJ001', 'SKU006', 40, 0),
            ('BJ001', 'SKU009', 18, 0),
            ('BJ001', 'SKU010', 95, 0),
            ('SH001', 'SKU007', 5, 0),
            ('SH001', 'SKU008', 2, 0),
        ]

        for store_code, sku, qty, reserved in inventory_scenarios:
            inv, created = Inventory.objects.get_or_create(
                store=self.stores[store_code],
                product=self.products[sku],
                defaults={
                    'quantity': qty,
                    'reserved_quantity': reserved,
                    'last_counted_at': timezone.now() - timezone.timedelta(days=random.randint(0, 45))
                }
            )
            if created:
                status = '正常' if qty > self.products[sku].safe_stock else '低库存' if qty > 0 else '缺货'
                self.stdout.write(f'  库存: {store_code}/{sku} = {qty} [{status}]')

        inv = Inventory.objects.get(
            store=self.stores['SH001'],
            product=self.products['SKU003']
        )
        inv.reserved_quantity = 20
        inv.save()
        self.stdout.write(f'  [异常场景] SH001/SKU003 预留库存({inv.reserved_quantity}) > 实际库存({inv.quantity})')

        inv = Inventory.objects.get(
            store=self.stores['SH001'],
            product=self.products['SKU002']
        )
        inv.last_counted_at = timezone.now() - timezone.timedelta(days=60)
        inv.save()
        self.stdout.write(f'  [异常场景] SH001/SKU002 超过60天未盘点')

    def _create_replenishment_plans(self):
        self.stdout.write('创建补货计划...')

        plan_date = timezone.localdate()
        plan, created = ReplenishmentPlan.objects.get_or_create(
            code=f'PL{plan_date.strftime("%Y%m%d")}0001',
            defaults={
                'name': '华东区域Q2上新补货计划',
                'description': '针对华东区域门店Q2新品上市的补货安排',
                'store_group': self.store_groups['华东区域群'],
                'plan_date': plan_date,
                'created_by': self.users['planner']['user']
            }
        )
        if created:
            plan.stores.set([self.stores['SH001'], self.stores['SH002'], self.stores['HZ001']])
            self.stdout.write(f'  创建补货计划: {plan.code} - {plan.name}')
        self.replenishment_plan = plan

    def _create_replenishment_orders(self):
        self.stdout.write('创建补货单（包含各种状态和异常场景）...')

        today = timezone.localdate()
        user_planner = self.users['planner']['user']
        user_warehouse = self.users['warehouse']['user']
        user_sm1 = self.users['store_manager']['user']
        user_sm2 = self.users['store_manager2']['user']

        self._create_replenishment_order(
            'RP-DEMO-001', self.stores['SH001'], ReplenishmentStatus.DRAFT,
            user_sm1, today,
            [('SKU001', 30), ('SKU004', 20), ('SKU010', 100)],
            remark='【正常场景】草稿状态，可提交'
        )

        self._create_replenishment_order(
            'RP-DEMO-002', self.stores['SH001'], ReplenishmentStatus.SUBMITTED,
            user_sm1, today - timezone.timedelta(days=1),
            [('SKU002', 25), ('SKU009', 30)],
            remark='【正常场景】已提交，待仓管审核',
            submitted_by=user_sm1,
            submitted_at=today - timezone.timedelta(days=1)
        )

        order3 = self._create_replenishment_order(
            'RP-DEMO-003', self.stores['SH001'], ReplenishmentStatus.COMPLETED,
            user_sm1, today - timezone.timedelta(days=7),
            [('SKU010', 150)],
            remark='【异常场景】已完成，任何操作都会触发状态冲突',
            submitted_by=user_sm1,
            submitted_at=today - timezone.timedelta(days=7),
            reviewed_by=user_warehouse,
            reviewed_at=today - timezone.timedelta(days=6),
            shipped_by=user_warehouse,
            shipped_at=today - timezone.timedelta(days=5),
            received_by=user_sm1,
            received_at=today - timezone.timedelta(days=3),
            completed_at=today - timezone.timedelta(days=2),
            shipped=True, received=True
        )

        self._create_replenishment_order(
            'RP-DEMO-004', self.stores['SH001'], ReplenishmentStatus.DRAFT,
            user_sm1, today,
            [('SKU007', 10), ('SKU001', 20)],
            remark='【异常场景】包含已下架商品SKU007，提交会触发商品已下架异常'
        )

        order5 = self._create_replenishment_order(
            'RP-DEMO-005', self.stores['HZ001'], ReplenishmentStatus.SHIPPED,
            user_sm2, today - timezone.timedelta(days=3),
            [('SKU003', 5), ('SKU009', 20)],
            remark='【异常场景】已发货，收货时可模拟实收≠实发，触发数据偏差异常',
            submitted_by=user_sm2,
            submitted_at=today - timezone.timedelta(days=3),
            reviewed_by=user_warehouse,
            reviewed_at=today - timezone.timedelta(days=2),
            shipped_by=user_warehouse,
            shipped_at=today - timezone.timedelta(days=1),
            shipped=True
        )
        for item in order5.items.all():
            item.approved_quantity = item.requested_quantity
            item.shipped_quantity = item.requested_quantity
            item.unit_price = item.product.cost_price
            item.save()

        self._create_replenishment_order(
            'RP-DEMO-006', self.stores['SH002'], ReplenishmentStatus.REJECTED,
            user_planner, today - timezone.timedelta(days=2),
            [('SKU004', 50)],
            remark='【正常场景】已驳回，原因：库存充足无需补货',
            submitted_by=user_planner,
            submitted_at=today - timezone.timedelta(days=2),
            reviewed_by=user_warehouse,
            reviewed_at=today - timezone.timedelta(days=1),
            reject_reason='库存充足，暂不需要补货'
        )

        self._create_replenishment_order(
            'RP-DEMO-007', self.stores['HZ001'], ReplenishmentStatus.REVIEWING,
            user_sm2, today - timezone.timedelta(days=1),
            [('SKU002', 40), ('SKU005', 30)],
            remark='【正常场景】审核中，可发货或驳回',
            submitted_by=user_sm2,
            submitted_at=today - timezone.timedelta(days=1),
            reviewed_by=user_warehouse,
            reviewed_at=today
        )
        for item in ReplenishmentItem.objects.filter(order__code='RP-DEMO-007'):
            item.approved_quantity = item.requested_quantity
            item.unit_price = item.product.cost_price
            item.save()

        self._create_replenishment_order(
            'RP-DEMO-008', self.stores['SH001'], ReplenishmentStatus.RECEIVED,
            user_sm1, today - timezone.timedelta(days=4),
            [('SKU005', 50)],
            remark='【正常场景】已收货，待完成',
            submitted_by=user_sm1,
            submitted_at=today - timezone.timedelta(days=4),
            reviewed_by=user_warehouse,
            reviewed_at=today - timezone.timedelta(days=3),
            shipped_by=user_warehouse,
            shipped_at=today - timezone.timedelta(days=2),
            received_by=user_sm1,
            received_at=today,
            shipped=True, received=True
        )

    def _create_replenishment_order(self, code, store, status, created_by, created_at,
                                     items, remark='', submitted_by=None,
                                     submitted_at=None, reviewed_by=None,
                                     reviewed_at=None, shipped_by=None,
                                     shipped_at=None, received_by=None,
                                     received_at=None, completed_at=None,
                                     reject_reason='', shipped=False,
                                     received=False):
        order, created = ReplenishmentOrder.objects.get_or_create(
            code=code,
            defaults={
                'store': store,
                'plan': self.replenishment_plan,
                'status': status,
                'priority': 1,
                'remark': remark,
                'reject_reason': reject_reason,
                'created_by': created_by,
                'created_at': created_at,
                'updated_at': timezone.now(),
                'submitted_by': submitted_by,
                'submitted_at': submitted_at,
                'reviewed_by': reviewed_by,
                'reviewed_at': reviewed_at,
                'shipped_by': shipped_by,
                'shipped_at': shipped_at,
                'received_by': received_by,
                'received_at': received_at,
                'completed_at': completed_at,
            }
        )

        if created:
            for sku, qty in items:
                product = self.products[sku]
                item = ReplenishmentItem.objects.create(
                    order=order,
                    product=product,
                    requested_quantity=qty,
                    unit_price=product.cost_price
                )
                if shipped:
                    item.shipped_quantity = qty
                    item.approved_quantity = qty
                if received:
                    item.received_quantity = qty
                item.save()
            self.stdout.write(f'  创建补货单: {code} [{status}] {remark[:30]}')

        return order

    def _create_transfer_orders(self):
        self.stdout.write('创建调拨单（包含各种状态和异常场景）...')

        today = timezone.localdate()
        user_sm1 = self.users['store_manager']['user']
        user_sm2 = self.users['store_manager2']['user']
        user_planner = self.users['planner']['user']

        self._create_transfer_order(
            'TF-DEMO-001', self.stores['SH001'], self.stores['SH002'],
            TransferStatus.DRAFT, user_planner, today,
            [('SKU001', 10)],
            reason='【正常场景】门店间余缺调拨，草稿状态'
        )

        self._create_transfer_order(
            'TF-DEMO-002', self.stores['SH002'], self.stores['SH001'],
            TransferStatus.DRAFT, user_planner, today,
            [('SKU004', 20)],
            reason='【异常场景】SH002的SKU004库存为0，提交会触发库存不足异常'
        )

        self._create_transfer_order(
            'TF-DEMO-003', self.stores['SH001'], self.stores['HZ001'],
            TransferStatus.SUBMITTED, user_sm1, today - timezone.timedelta(days=1),
            [('SKU005', 20)],
            reason='【正常场景】已提交，待SH001确认转出',
            submitted_by=user_sm1,
            submitted_at=today - timezone.timedelta(days=1)
        )

        tf4 = self._create_transfer_order(
            'TF-DEMO-004', self.stores['HZ001'], self.stores['SH001'],
            TransferStatus.OUT_CONFIRMED, user_sm2, today - timezone.timedelta(days=2),
            [('SKU009', 10)],
            reason='【正常场景】HZ001已确认转出，待SH001确认转入',
            submitted_by=user_sm2,
            submitted_at=today - timezone.timedelta(days=2),
            out_confirmed_by=user_sm2,
            out_confirmed_at=today - timezone.timedelta(days=1),
            out_confirmed=True
        )
        tf4.status = TransferStatus.IN_REVIEW
        tf4.save()

        self._create_transfer_order(
            'TF-DEMO-005', self.stores['SH001'], self.stores['SH002'],
            TransferStatus.COMPLETED, user_sm1, today - timezone.timedelta(days=5),
            [('SKU010', 30)],
            reason='【正常场景】已完成',
            submitted_by=user_sm1,
            submitted_at=today - timezone.timedelta(days=5),
            out_confirmed_by=user_sm1,
            out_confirmed_at=today - timezone.timedelta(days=4),
            in_confirmed_by=self.users['store_manager2']['user'],
            in_confirmed_at=today - timezone.timedelta(days=3),
            completed_at=today - timezone.timedelta(days=3),
            out_confirmed=True, in_confirmed=True
        )

        self._create_transfer_order(
            'TF-DEMO-006', self.stores['SH001'], self.stores['SH002'],
            TransferStatus.OUT_REJECTED, user_planner, today - timezone.timedelta(days=3),
            [('SKU002', 15)],
            reason='【正常场景】转出拒绝，原因：本店库存也不足',
            submitted_by=user_planner,
            submitted_at=today - timezone.timedelta(days=3),
            out_confirmed_by=user_sm1,
            out_confirmed_at=today - timezone.timedelta(days=2),
            reject_reason='本店库存也不足，无法调出'
        )

    def _create_transfer_order(self, code, from_store, to_store, status, created_by,
                                created_at, items, reason='', submitted_by=None,
                                submitted_at=None, out_confirmed_by=None,
                                out_confirmed_at=None, in_confirmed_by=None,
                                in_confirmed_at=None, completed_at=None,
                                reject_reason='', out_confirmed=False,
                                in_confirmed=False):
        order, created = TransferOrder.objects.get_or_create(
            code=code,
            defaults={
                'from_store': from_store,
                'to_store': to_store,
                'reason': reason,
                'status': status,
                'reject_reason': reject_reason,
                'created_by': created_by,
                'created_at': created_at,
                'updated_at': timezone.now(),
                'submitted_by': submitted_by,
                'submitted_at': submitted_at,
                'out_confirmed_by': out_confirmed_by,
                'out_confirmed_at': out_confirmed_at,
                'in_confirmed_by': in_confirmed_by,
                'in_confirmed_at': in_confirmed_at,
                'completed_at': completed_at,
            }
        )

        if created:
            for sku, qty in items:
                product = self.products[sku]
                item = TransferItem.objects.create(
                    order=order,
                    product=product,
                    transfer_quantity=qty
                )
                if out_confirmed:
                    item.out_quantity = qty
                if in_confirmed:
                    item.in_quantity = qty
                item.save()
            self.stdout.write(f'  创建调拨单: {code} [{status}] {reason[:30]}')

        return order

    def _create_display_records(self):
        self.stdout.write('创建陈列记录（包含超期未整改的异常场景）...')

        today = timezone.localdate()
        user_planner = self.users['planner']['user']
        user_sm1 = self.users['store_manager']['user']
        user_warehouse = self.users['warehouse']['user']

        display_data = [
            (today, self.stores['SH001'], 'SKU001', '陈列位置错误', '商品应放在进门左侧促销区，实际放在了角落', DisplayRecordStatus.PENDING, user_planner, None, '', None),
            (today - timezone.timedelta(days=3), self.stores['SH001'], 'SKU002', '价格标签缺失', '联名款未放置专属价格标签', DisplayRecordStatus.PENDING, user_warehouse, None, '', None),
            (today - timezone.timedelta(days=5), self.stores['HZ001'], 'SKU003', '陈列脏乱', '商品包装有灰尘，需要整理', DisplayRecordStatus.FIXED, user_planner, user_sm1, '已清理擦拭', None),
            (today - timezone.timedelta(days=10), self.stores['SH001'], 'SKU004', '缺货未补', '陶瓷杯已缺货3天未补货', DisplayRecordStatus.PENDING, user_warehouse, None, '', None),
            (today - timezone.timedelta(days=15), self.stores['SH002'], 'SKU005', 'POP海报过期', '活动海报还是上个月的', DisplayRecordStatus.PENDING, user_planner, None, '', None),
            (today - timezone.timedelta(days=8), self.stores['HZ001'], 'SKU010', '陈列量不足', '应陈列20本，实际只有5本', DisplayRecordStatus.PENDING, user_planner, None, '', None),
            (today - timezone.timedelta(days=12), self.stores['SH001'], 'SKU009', '灯光昏暗', '印章区照明不足', DisplayRecordStatus.FIXED, user_warehouse, user_sm1, '已更换LED灯', None),
            (today - timezone.timedelta(days=20), self.stores['SH001'], 'SKU005', '库存与陈列不符', '库存系统显示60，实际陈列只有20', DisplayRecordStatus.VERIFIED, user_planner, user_sm1, '已核实并调整系统库存', user_warehouse),
        ]

        for i, (check_date, store, sku, issue_type, desc, status, checked_by, fixed_by, fix_note, verified_by) in enumerate(display_data, 1):
            record, created = DisplayRecord.objects.get_or_create(
                id=i,
                defaults={
                    'store': store,
                    'product': self.products[sku],
                    'check_date': check_date,
                    'issue_type': issue_type,
                    'description': desc,
                    'status': status,
                    'checked_by': checked_by,
                    'fixed_by': fixed_by if status != DisplayRecordStatus.PENDING else None,
                    'fixed_at': timezone.now() - timezone.timedelta(days=2) if status != DisplayRecordStatus.PENDING else None,
                    'fix_note': fix_note if status != DisplayRecordStatus.PENDING else '',
                    'verified_by': verified_by if status == DisplayRecordStatus.VERIFIED else None,
                    'verified_at': timezone.now() - timezone.timedelta(days=1) if status == DisplayRecordStatus.VERIFIED else None,
                    'created_at': timezone.now() - timezone.timedelta(days=20) + timezone.timedelta(days=i),
                }
            )
            if created:
                overdue = ' [超期]' if status == DisplayRecordStatus.PENDING and (today - check_date).days > 7 else ''
                self.stdout.write(f'  陈列记录: {store.code}/{sku} [{status}]{overdue} {issue_type}')

    def _create_redemptions(self):
        self.stdout.write('创建会员兑换单...')

        today = timezone.localdate()
        user_sm1 = self.users['store_manager']['user']

        redemption_data = [
            ('RD-DEMO-001', '张三', '13800138001', 1500, self.products['SKU002'], 1, 1000, self.stores['SH001'], RedemptionStatus.PENDING),
            ('RD-DEMO-002', '李四', '13800138002', 3200, self.products['SKU003'], 1, 2000, self.stores['SH001'], RedemptionStatus.PROCESSING),
            ('RD-DEMO-003', '王五', '13800138003', 800, self.products['SKU005'], 2, 600, self.stores['SH001'], RedemptionStatus.COMPLETED),
            ('RD-DEMO-004', '赵六', '13800138004', 500, self.products['SKU001'], 2, 1000, self.stores['SH001'], RedemptionStatus.REJECTED),
        ]

        for code, name, phone, points, product, qty, points_used, store, status in redemption_data:
            redemption, created = MemberRedemption.objects.get_or_create(
                code=code,
                defaults={
                    'member_name': name,
                    'member_phone': phone,
                    'member_points': points,
                    'product': product,
                    'quantity': qty,
                    'points_used': points_used,
                    'store': store,
                    'status': status,
                    'reject_reason': '积分不足，需要1000积分，会员只有500积分' if status == RedemptionStatus.REJECTED else '',
                    'processed_by': user_sm1 if status != RedemptionStatus.PENDING else None,
                    'processed_at': today - timezone.timedelta(days=1) if status != RedemptionStatus.PENDING else None,
                    'completed_by': user_sm1 if status == RedemptionStatus.COMPLETED else None,
                    'completed_at': today if status == RedemptionStatus.COMPLETED else None,
                    'tracking_no': 'SF1234567890' if status == RedemptionStatus.COMPLETED else '',
                    'created_at': today - timezone.timedelta(days=3),
                }
            )
            if created:
                self.stdout.write(f'  兑换单: {code} [{status}] {name}兑换{product.name}x{qty}')
