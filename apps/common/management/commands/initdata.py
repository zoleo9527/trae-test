from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.venues.models import Venue, VenueArea
from apps.devices.models import Device
from apps.inspections.models import InspectionPlan, CheckItem, CheckItemCategory

User = get_user_model()


class Command(BaseCommand):
    help = 'Initialize demo data'

    def handle(self, *args, **options):
        self.stdout.write('Creating demo users...')
        admin_user, _ = User.objects.get_or_create(
            username='admin', defaults={
                'email': 'admin@example.com', 'role': 'admin', 'is_staff': True, 'is_superuser': True
            })
        admin_user.set_password('admin123')
        admin_user.save()

        manager, _ = User.objects.get_or_create(
            username='manager', defaults={'email': 'manager@example.com', 'role': 'manager'})
        manager.set_password('manager123')
        manager.save()

        inspector, _ = User.objects.get_or_create(
            username='inspector', defaults={'email': 'inspector@example.com', 'role': 'inspector'})
        inspector.set_password('inspector123')
        inspector.save()

        maintenance, _ = User.objects.get_or_create(
            username='maintenance', defaults={'email': 'maintenance@example.com', 'role': 'maintenance'})
        maintenance.set_password('maintenance123')
        maintenance.save()

        volunteer, _ = User.objects.get_or_create(
            username='volunteer', defaults={'email': 'volunteer@example.com', 'role': 'volunteer'})
        volunteer.set_password('volunteer123')
        volunteer.save()

        reader, _ = User.objects.get_or_create(
            username='reader', defaults={'email': 'reader@example.com', 'role': 'reader'})
        reader.set_password('reader123')
        reader.save()

        self.stdout.write(self.style.SUCCESS('Users created'))

        self.stdout.write('Creating demo venues...')
        venue1, _ = Venue.objects.get_or_create(
            code='LIB001', defaults={
                'name': '城市书房·中心馆',
                'address': '市中心文化广场1号',
                'manager': manager,
                'phone': '0571-88888888',
                'status': 'open',
                'area': 500,
                'seat_count': 200
            })

        venue2, _ = Venue.objects.get_or_create(
            code='LIB002', defaults={
                'name': '城市书房·社区分馆',
                'address': '幸福街道100号',
                'manager': manager,
                'phone': '0571-88888889',
                'status': 'open',
                'area': 200,
                'seat_count': 80
            })

        self.stdout.write(self.style.SUCCESS('Venues created'))

        self.stdout.write('Creating venue areas...')
        areas_data = [
            (venue1, 'AREA001', '阅览区'),
            (venue1, 'AREA002', '借阅区'),
            (venue1, 'AREA003', '电子阅览区'),
            (venue2, 'AREA001', '综合阅览区'),
        ]
        for venue, code, name in areas_data:
            VenueArea.objects.get_or_create(venue=venue, code=code, defaults={'name': name})

        self.stdout.write(self.style.SUCCESS('Venue areas created'))

        self.stdout.write('Creating demo devices...')
        area1 = VenueArea.objects.filter(venue=venue1, code='AREA001').first()
        devices_data = [
            (venue1, area1, 'DEV001', '中央空调-1号', 'air_conditioner', '格力', 'KFR-72LW'),
            (venue1, area1, 'DEV002', '台式电脑-A01', 'computer', '联想', 'ThinkCentre M90'),
            (venue1, area1, 'DEV003', '打印机-P01', 'printer', '惠普', 'LaserJet Pro M403d'),
        ]
        for venue, area, code, name, category, brand, model in devices_data:
            Device.objects.get_or_create(
                code=code, defaults={
                    'venue': venue, 'area': area, 'name': name,
                    'category': category, 'brand': brand, 'model': model,
                    'status': 'normal'
                })

        self.stdout.write(self.style.SUCCESS('Devices created'))

        self.stdout.write('Creating inspection plans...')
        plan1, _ = InspectionPlan.objects.get_or_create(
            venue=venue1, name='日常巡检计划', defaults={
                'type': 'daily', 'description': '每日例行巡检', 'is_active': True
            })

        check_items_data = [
            (plan1, CheckItemCategory.ENVIRONMENT, '室内温度检查', '温度是否适宜，温度22-26℃', True, 1),
            (plan1, CheckItemCategory.ENVIRONMENT, '环境卫生检查', '地面整洁，无杂物', True, 2),
            (plan1, CheckItemCategory.FACILITY, '照明设备检查', '所有照明正常工作', True, 3),
            (plan1, CheckItemCategory.SECURITY, '消防设施检查', '消防器材完好有效', True, 4),
            (plan1, CheckItemCategory.SERVICE, '服务规范检查', '工作人员在岗，服务规范', False, 5),
        ]
        for plan, category, name, desc, required, order in check_items_data:
            CheckItem.objects.get_or_create(
                plan=plan, name=name, defaults={
                    'category': category, 'description': desc,
                    'is_required': required, 'sort_order': order
                })

        self.stdout.write(self.style.SUCCESS('Inspection plans created'))
        self.stdout.write(self.style.SUCCESS('All demo data initialized successfully!'))
