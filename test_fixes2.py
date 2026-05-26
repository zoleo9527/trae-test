import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()

from apps.core.models import User
from apps.core.exceptions import PermissionDeniedException, ValidationException
from apps.complaint.models import Complaint
from apps.complaint.services import ComplaintService
from apps.attendance.models import ReconciliationBatch, ReconciliationRecord
from apps.attendance.services import ReconciliationService
from django.utils import timezone
from datetime import timedelta

print("=" * 70)
print("验证投诉处理接口和消课对账修复")
print("=" * 70)

# 测试1: IsCoach导入检查
print("\n1. 检查 IsCoach 导入...")
try:
    from apps.complaint.views import IsCoach
    print('   ✅ IsCoach 导入成功')
except ImportError as e:
    print(f'   ❌ 导入失败: {e}')

# 获取测试用户
director = User.objects.filter(role='director').first()
supervisor = User.objects.filter(role='coach_supervisor').first()
frontdesk = User.objects.filter(role='front_desk').first()
coach = User.objects.filter(role='coach').first()

print(f'\n测试用户:')
print(f'  馆长: {director.username}')
print(f'  教练主管: {supervisor.username}')
print(f'  前台: {frontdesk.username}')
print(f'  教练: {coach.username}')

# 测试2: 状态更新接口 - 未授权处理人返回权限不足
print('\n2. 测试状态更新权限分支...')
complaint = Complaint.objects.filter(status='submitted').first()
if complaint:
    print(f'   测试投诉: {complaint.title} (状态: {complaint.status})')
    complaint.assigned_to = coach
    complaint.save()
    
    # 前台尝试标记为处理中（应该失败，权限不足）
    try:
        ComplaintService.update_status(frontdesk, complaint, 'processing')
        print('   ❌ 前台不应能标记为处理中但成功了')
        complaint.status = 'submitted'
        complaint.save()
    except PermissionDeniedException as e:
        print(f'   ✅ 前台不能标记为处理中（正确返回权限不足）: {str(e)[:50]}')
    except ValidationException as e:
        print(f'   ⚠️  返回了校验失败而非权限不足: {str(e)[:50]}')
    
    # 处理人（教练）可以标记为处理中
    try:
        ComplaintService.update_status(coach, complaint, 'processing')
        print('   ✅ 处理人（教练）可以标记为处理中')
        complaint.status = 'submitted'
        complaint.save()
    except Exception as e:
        print(f'   ❌ 处理人标记失败: {e}')

# 测试3: 评论接口权限检查
print('\n3. 测试评论接口权限分支...')
complaint = Complaint.objects.filter(status='submitted').first()
if complaint:
    complaint.assigned_to = coach
    complaint.submitted_by = frontdesk
    complaint.save()
    
    # 无关人员尝试添加评论（应该失败）
    other_coach = User.objects.filter(role='coach').exclude(id=coach.id).first()
    if other_coach:
        try:
            ComplaintService.add_comment(other_coach, complaint, '测试评论')
            print('   ❌ 无关人员不应能添加评论但成功了')
        except PermissionDeniedException as e:
            print(f'   ✅ 无关人员不能添加评论（正确返回权限不足）: {str(e)[:50]}')
    
    # 处理人可以添加评论
    try:
        comment = ComplaintService.add_comment(coach, complaint, '处理人评论')
        print(f'   ✅ 处理人可以添加评论 (id={comment.id})')
    except Exception as e:
        print(f'   ❌ 处理人添加评论失败: {e}')
    
    # 提交人可以添加评论
    try:
        comment = ComplaintService.add_comment(frontdesk, complaint, '提交人评论')
        print(f'   ✅ 提交人可以添加评论 (id={comment.id})')
    except Exception as e:
        print(f'   ❌ 提交人添加评论失败: {e}')
    
    # 处理人可以添加内部评论
    try:
        comment = ComplaintService.add_comment(coach, complaint, '内部评论', is_internal=True)
        print(f'   ✅ 处理人可以添加内部评论 (id={comment.id})')
    except Exception as e:
        print(f'   ❌ 处理人添加内部评论失败: {e}')
    
    # 提交人不能添加内部评论
    try:
        ComplaintService.add_comment(frontdesk, complaint, '提交人尝试内部评论', is_internal=True)
        print('   ❌ 提交人不应能添加内部评论但成功了')
    except PermissionDeniedException as e:
        print(f'   ✅ 提交人不能添加内部评论（正确返回权限不足）: {str(e)[:50]}')

# 测试4: 分配和升级接口 - 未授权返回权限不足
print('\n4. 测试分配和升级权限分支...')
complaint = Complaint.objects.filter(status='submitted').first()
if complaint:
    # 教练尝试分配（应该失败，权限不足）
    try:
        ComplaintService.assign_complaint(coach, complaint, director.id)
        print('   ❌ 教练不应能分配投诉但成功了')
    except PermissionDeniedException as e:
        print(f'   ✅ 教练不能分配投诉（正确返回权限不足）: {str(e)[:50]}')
    except ValidationException as e:
        print(f'   ⚠️  返回了校验失败而非权限不足: {str(e)[:50]}')
    
    # 教练尝试升级（应该失败，权限不足）
    try:
        ComplaintService.escalate(coach, complaint, '测试升级')
        print('   ❌ 教练不应能升级投诉但成功了')
    except PermissionDeniedException as e:
        print(f'   ✅ 教练不能升级投诉（正确返回权限不足）: {str(e)[:50]}')
    except ValidationException as e:
        print(f'   ⚠️  返回了校验失败而非权限不足: {str(e)[:50]}')

# 测试5: 消课对账总金额计算
print('\n5. 测试消课对账总金额计算...')
from apps.membership.models import ConsumptionRecord

# 清理旧的对账批次
ReconciliationBatch.objects.all().delete()

# 创建一个测试对账批次
start_date = timezone.now().date() - timedelta(days=3)
end_date = timezone.now().date()

try:
    batch = ReconciliationService.create_batch(director, start_date, end_date, '测试对账')
    print(f'   创建对账批次: {batch.id} ({start_date} ~ {end_date})')
    
    # 检查是否有已完成的排班
    from apps.schedule.models import Schedule
    completed_schedules = Schedule.objects.filter(
        start_time__date__gte=start_date,
        start_time__date__lte=end_date,
        status='completed'
    )
    print(f'   找到 {completed_schedules.count()} 个已完成排班')
    
    # 手动创建一些消费记录用于测试
    test_amount = 0
    for schedule in completed_schedules[:2]:
        from apps.membership.models import MembershipCard
        card = MembershipCard.objects.filter(status='active').first()
        if card:
            cr = ConsumptionRecord.objects.create(
                membership=card,
                consumption_type='course',
                amount=150,
                times_deducted=1,
                related_schedule=schedule,
                operator=director,
                notes='测试消费'
            )
            test_amount += 150
            print(f'   创建测试消费记录: schedule={schedule.id}, amount=150')
    
    if test_amount > 0:
        print(f'   手动创建的消费记录总金额: {test_amount}')
    
    # 处理批次
    print('   处理对账批次...')
    processed_batch = ReconciliationService.process_batch(director, batch.id)
    
    # 查询真实消费记录总金额
    from django.db.models import Sum
    real_amount = ConsumptionRecord.objects.filter(
        related_schedule__start_time__date__gte=start_date,
        related_schedule__start_time__date__lte=end_date
    ).aggregate(total=Sum('amount'))['total'] or 0
    
    print(f'   批次计算总金额: {processed_batch.total_amount}')
    print(f'   真实消费记录总金额: {real_amount}')
    
    if processed_batch.total_amount == real_amount:
        print('   ✅ 对账批次总金额与真实消费记录一致')
    else:
        print(f'   ⚠️  金额不一致: 批次={processed_batch.total_amount}, 真实={real_amount}')
        
except Exception as e:
    print(f'   对账测试出错: {e}')
    import traceback
    traceback.print_exc()

print('\n' + '=' * 70)
print('所有修复验证完成！')
print('=' * 70)
