import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()

from apps.core.models import User
from apps.core.services import AuditService
from apps.core.models_audit import AuditLog
from apps.attendance.models import ReconciliationRecord
from apps.complaint.models import Complaint
from apps.complaint.services import ComplaintService
from django.utils import timezone
from decimal import Decimal

print("=" * 60)
print("验证修复效果")
print("=" * 60)

user = User.objects.filter(role='director').first()
print(f'\n测试用户: {user.username} ({user.role})')

# 1. 测试审计日志序列化
print('\n1. 测试审计日志序列化...')
try:
    AuditService.log_action(
        user=user,
        action=AuditLog.Action.CREATE,
        instance=None,
        new_value={
            'name': '测试',
            'amount': Decimal('100.50'),
            'date': timezone.now().date(),
            'user_obj': user,
            'count': 5
        }
    )
    print('   ✅ 序列化成功！Decimal和datetime对象已正确处理')
except Exception as e:
    print(f'   ❌ 失败: {e}')

# 2. 测试对账记录状态
print('\n2. 测试对账记录状态...')
statuses = [s[0] for s in ReconciliationRecord.Status.choices]
print(f'   可用状态: {statuses}')
has_partial = 'partial' in statuses
print(f'   PARTIAL 状态存在: {"✅" if has_partial else "❌"}')

# 3. 测试投诉权限
print('\n3. 测试投诉权限...')
complaint = Complaint.objects.filter(status='submitted').first()
if complaint:
    print(f'   测试投诉: {complaint.title}')
    
    # 测试馆长可以标记为处理中
    try:
        ComplaintService.update_status(user, complaint, 'processing')
        print('   ✅ 馆长可以标记为处理中')
        complaint.status = 'submitted'
        complaint.save()
    except Exception as e:
        print(f'   ❌ 馆长标记为处理中失败: {e}')

    # 测试前台不能标记为处理中
    frontdesk = User.objects.filter(role='front_desk').first()
    if frontdesk:
        try:
            ComplaintService.update_status(frontdesk, complaint, 'processing')
            print('   ❌ 前台不应能标记为处理中但成功了')
            complaint.status = 'submitted'
            complaint.save()
        except Exception as e:
            print(f'   ✅ 前台不能标记为处理中（权限正确）: {str(e)[:50]}')

# 4. 测试投诉分配权限
print('\n4. 测试投诉分配权限...')
complaint = Complaint.objects.filter(status='submitted').first()
if complaint:
    coach = User.objects.filter(role='coach').first()
    if coach:
        try:
            ComplaintService.assign_complaint(coach, complaint, user.id)
            print('   ❌ 教练不应能分配投诉但成功了')
        except Exception as e:
            print(f'   ✅ 教练不能分配投诉（权限正确）: {str(e)[:50]}')

# 5. 测试投诉升级权限
print('\n5. 测试投诉升级权限...')
if complaint:
    coach = User.objects.filter(role='coach').first()
    if coach:
        try:
            ComplaintService.escalate(coach, complaint)
            print('   ❌ 教练不应能升级投诉但成功了')
        except Exception as e:
            print(f'   ✅ 教练不能升级投诉（权限正确）: {str(e)[:50]}')

print('\n' + '=' * 60)
print('验证完成！')
print('=' * 60)
