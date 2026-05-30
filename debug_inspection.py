import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.utils import timezone
from apps.inspections.models import InspectionRecord, InspectionStatus
from apps.audit.services import OverdueReminderService

now = timezone.now()
print(f'当前时间: {now}')

inspections = InspectionRecord.objects.filter(status__in=['submitted', 'needs_review'])
for insp in inspections:
    print(f'巡检: {insp.title}, status={insp.status}')
    print(f'  created_at: {insp.created_at}')
    print(f'  updated_at: {insp.updated_at}')
    print(f'  review_time: {insp.review_time}')
    base_time, is_active = OverdueReminderService._get_overdue_base_time(insp)
    print(f'  base_time: {base_time}, is_active: {is_active}')
    days = (now - base_time).days if base_time else 0
    print(f'  days: {days}')
    od, is_od, level = OverdueReminderService._calculate_overdue(insp)
    print(f'  overdue_days={od}, is_overdue={is_od}, level={level}')
    print()
