#!/usr/bin/env python
import os
import django
from datetime import datetime, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from apps.customer.models import Customer, WasteType
from apps.weight.models import WeightTicket
from apps.credit.models import CreditRecord, RepaymentRecord, CreditReminder
from apps.base.models import UserRole


def init_users():
    print('Creating users...')
    UserRole.objects.filter(user__username__in=['admin', 'manager', 'operator', 'finance']).delete()
    User.objects.filter(username__in=['admin', 'manager', 'operator', 'finance']).delete()

    admin = User.objects.create_superuser(
        username='admin',
        email='admin@example.com',
        password='admin123456',
        is_staff=True
    )
    UserRole.objects.create(user=admin, role='site_admin', description='超级管理员')
    print(f'Created admin user: admin / admin123456 (超级管理员)')

    manager = User.objects.create_user(
        username='manager',
        email='manager@example.com',
        password='manager123456',
        is_staff=True
    )
    UserRole.objects.create(user=manager, role='site_admin', description='站点管理员')
    print(f'Created manager user: manager / manager123456 (站点管理员)')

    operator = User.objects.create_user(
        username='operator',
        email='operator@example.com',
        password='operator123456'
    )
    UserRole.objects.create(user=operator, role='operator', description='过磅员')
    print(f'Created operator user: operator / operator123456 (过磅员)')

    finance = User.objects.create_user(
        username='finance',
        email='finance@example.com',
        password='finance123456'
    )
    UserRole.objects.create(user=finance, role='finance', description='财务')
    print(f'Created finance user: finance / finance123456 (财务)')

    return admin, manager, operator, finance


def init_waste_types(admin):
    print('Creating waste types...')
    WasteType.objects.all().delete()

    waste_types = [
        {'code': 'WT001', 'name': '废纸', 'category': '纸张类', 'unit': 'kg', 'default_price': 1.50},
        {'code': 'WT002', 'name': '废塑料', 'category': '塑料类', 'unit': 'kg', 'default_price': 2.00},
        {'code': 'WT003', 'name': '废铁', 'category': '金属类', 'unit': 'kg', 'default_price': 3.00},
        {'code': 'WT004', 'name': '废铝', 'category': '金属类', 'unit': 'kg', 'default_price': 8.00},
        {'code': 'WT005', 'name': '废铜', 'category': '金属类', 'unit': 'kg', 'default_price': 25.00},
        {'code': 'WT006', 'name': '废玻璃', 'category': '玻璃类', 'unit': 'kg', 'default_price': 0.50},
    ]

    for wt in waste_types:
        WasteType.objects.create(
            **wt,
            created_by=admin,
            updated_by=admin,
            is_active=True
        )
        print(f'Created waste type: {wt["name"]}')


def init_customers(admin):
    print('Creating customers...')
    Customer.objects.all().delete()

    customers = [
        {
            'code': 'C001', 'name': '张三废品收购站', 'type': 'company',
            'contact': '张三', 'phone': '13800138001',
            'company_name': '张三废品收购站', 'credit_limit': 50000, 'credit_level': 'A'
        },
        {
            'code': 'C002', 'name': '李四', 'type': 'individual',
            'contact': '李四', 'phone': '13800138002',
            'id_card': '110101199001011234', 'credit_limit': 10000, 'credit_level': 'B'
        },
        {
            'code': 'C003', 'name': '王五再生资源', 'type': 'company',
            'contact': '王五', 'phone': '13800138003',
            'company_name': '王五再生资源有限公司', 'credit_limit': 100000, 'credit_level': 'A'
        },
        {
            'code': 'C004', 'name': '赵六', 'type': 'individual',
            'contact': '赵六', 'phone': '13800138004',
            'id_card': '110101199002025678', 'credit_limit': 5000, 'credit_level': 'C'
        },
    ]

    for cust in customers:
        Customer.objects.create(
            **cust,
            created_by=admin,
            updated_by=admin,
            is_active=True
        )
        print(f'Created customer: {cust["name"]}')


def init_sample_data(admin):
    print('Creating sample data...')

    customer1 = Customer.objects.get(code='C001')
    customer2 = Customer.objects.get(code='C002')
    wt_paper = WasteType.objects.get(code='WT001')
    wt_plastic = WasteType.objects.get(code='WT002')
    wt_iron = WasteType.objects.get(code='WT003')

    now = datetime.now()

    ticket1 = WeightTicket.objects.create(
        ticket_no=f'BD{now.strftime("%Y%m%d")}0001',
        customer=customer1,
        waste_type=wt_paper,
        gross_weight=5000,
        tare_weight=500,
        net_weight=4500,
        unit_price=1.50,
        total_amount=6750,
        payment_method='credit',
        status='pending',
        weigh_time=now - timedelta(hours=2),
        vehicle_no='京A12345',
        driver='司机A',
        created_by=admin,
        updated_by=admin
    )
    print(f'Created weight ticket: {ticket1.ticket_no}')

    ticket2 = WeightTicket.objects.create(
        ticket_no=f'BD{now.strftime("%Y%m%d")}0002',
        customer=customer2,
        waste_type=wt_plastic,
        gross_weight=1200,
        tare_weight=100,
        net_weight=1100,
        unit_price=2.00,
        total_amount=2200,
        payment_method='cash',
        status='approved',
        weigh_time=now - timedelta(hours=5),
        vehicle_no='京B67890',
        driver='司机B',
        created_by=admin,
        updated_by=admin,
        reviewed_by=admin,
        reviewed_at=now - timedelta(hours=4)
    )
    print(f'Created weight ticket: {ticket2.ticket_no}')

    ticket3 = WeightTicket.objects.create(
        ticket_no=f'BD{now.strftime("%Y%m%d")}0003',
        customer=customer1,
        waste_type=wt_iron,
        gross_weight=3000,
        tare_weight=300,
        net_weight=2700,
        unit_price=3.00,
        total_amount=8100,
        payment_method='credit',
        status='review',
        weigh_time=now - timedelta(days=1),
        vehicle_no='京A12345',
        driver='司机A',
        created_by=admin,
        updated_by=admin
    )
    print(f'Created weight ticket: {ticket3.ticket_no}')

    credit1 = CreditRecord.objects.create(
        record_no=f'SZ{now.strftime("%Y%m%d")}0001',
        customer=customer1,
        amount=6750,
        due_date=(now + timedelta(days=30)).date(),
        status='approved',
        created_by=admin,
        updated_by=admin,
        reviewed_by=admin,
        reviewed_at=now - timedelta(hours=1)
    )
    print(f'Created credit record: {credit1.record_no}')

    credit2 = CreditRecord.objects.create(
        record_no=f'SZ{now.strftime("%Y%m%d")}0002',
        customer=customer2,
        amount=5000,
        due_date=(now + timedelta(days=15)).date(),
        status='pending',
        created_by=admin,
        updated_by=admin
    )
    print(f'Created credit record: {credit2.record_no}')

    repayment1 = RepaymentRecord.objects.create(
        record_no=f'HK{now.strftime("%Y%m%d")}0001',
        customer=customer1,
        credit_record=credit1,
        amount=2000,
        payment_method='transfer',
        payment_time=now - timedelta(days=2),
        status='approved',
        created_by=admin,
        updated_by=admin,
        reviewed_by=admin,
        reviewed_at=now - timedelta(days=2)
    )
    print(f'Created repayment record: {repayment1.record_no}')

    reminder1 = CreditReminder.objects.create(
        customer=customer1,
        credit_record=credit1,
        type='due_soon',
        title='赊账即将到期提醒',
        content=f'客户{customer1.name}的赊账金额{credit1.amount}元即将到期，请及时联系客户回款。',
        reminder_date=(now + timedelta(days=5)).date(),
        is_read=False,
        is_handled=False,
        created_by=admin,
        updated_by=admin
    )
    print(f'Created credit reminder: {reminder1.title}')

    reminder2 = CreditReminder.objects.create(
        customer=customer2,
        type='overdue',
        title='逾期账款提醒',
        content=f'客户{customer2.name}有逾期账款未结清，请尽快跟进处理。',
        reminder_date=now.date(),
        is_read=False,
        is_handled=False,
        created_by=admin,
        updated_by=admin
    )
    print(f'Created credit reminder: {reminder2.title}')


def main():
    print('=' * 50)
    print('Initializing data for Waste Recycling System')
    print('=' * 50)

    admin, manager, operator, finance = init_users()
    print()

    init_waste_types(admin)
    print()

    init_customers(admin)
    print()

    init_sample_data(admin)
    print()

    print('=' * 50)
    print('Data initialization completed!')
    print('=' * 50)
    print()
    print('Admin URL: http://localhost:8000/admin/')
    print('API URL: http://localhost:8000/api/')
    print()
    print('Default accounts:')
    print('  - admin / admin123456 (超级管理员 - 所有权限)')
    print('  - manager / manager123456 (站点管理员 - 审核权限)')
    print('  - operator / operator123456 (过磅员 - 磅单操作权限)')
    print('  - finance / finance123456 (财务 - 赊账回款权限)')


if __name__ == '__main__':
    main()
