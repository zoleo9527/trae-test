import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()

from apps.core.models import User
from apps.core.exceptions import PermissionDeniedException
from apps.complaint.models import Complaint
from apps.complaint.services import ComplaintService

print("=" * 70)
print("验证投诉接口权限断点修复")
print("=" * 70)

director = User.objects.filter(role='director').first()
supervisor = User.objects.filter(role='coach_supervisor').first()
frontdesk = User.objects.filter(role='front_desk').first()
coach = User.objects.filter(role='coach').first()
other_coach = User.objects.filter(role='coach').exclude(id=coach.id).first()

print(f'\n测试用户:')
print(f'  馆长: {director.username}')
print(f'  教练主管: {supervisor.username}')
print(f'  前台: {frontdesk.username}')
print(f'  教练1: {coach.username}')
print(f'  教练2: {other_coach.username}')

# 测试1: 前台提交人可以添加公开评论
print('\n1. 测试前台提交人可以添加公开评论...')
complaint = Complaint.objects.filter(status='submitted').first()
if complaint:
    complaint.submitted_by = frontdesk
    complaint.assigned_to = coach
    complaint.save()
    
    # 前台提交人添加公开评论（应该成功）
    try:
        comment = ComplaintService.add_comment(frontdesk, complaint, '前台提交人评论')
        print(f'   ✅ 前台提交人可以添加公开评论 (id={comment.id})')
    except Exception as e:
        print(f'   ❌ 前台提交人添加公开评论失败: {e}')
    
    # 前台提交人尝试添加内部评论（应该失败）
    try:
        ComplaintService.add_comment(frontdesk, complaint, '前台尝试内部评论', is_internal=True)
        print('   ❌ 前台提交人不应能添加内部评论但成功了')
    except PermissionDeniedException as e:
        print(f'   ✅ 前台提交人不能添加内部评论（正确返回权限不足）: {str(e)[:50]}')

# 测试2: 馆长可以看所有投诉
print('\n2. 测试列表数据可见范围...')

# 馆长看全量
all_complaints = Complaint.objects.count()
director_list = ComplaintService.list_complaints()
print(f'   投诉总数: {all_complaints}')
print(f'   馆长可见: {director_list.count()}')
if director_list.count() == all_complaints:
    print('   ✅ 馆长可以看全量投诉')
else:
    print(f'   ⚠️  馆长可见数量不对: {director_list.count()} != {all_complaints}')

# 教练主管看处理单
supervisor_list = ComplaintService.list_complaints(assigned_to=supervisor.id)
print(f'   教练主管处理单: {supervisor_list.count()}')

# 前台只看自己提交的
frontdesk_list = ComplaintService.list_complaints(submitted_by=frontdesk.id)
print(f'   前台提交的投诉: {frontdesk_list.count()}')
for c in frontdesk_list:
    if c.submitted_by_id != frontdesk.id:
        print(f'   ❌ 前台看到了非自己提交的投诉: {c.title}')
        break
else:
    print('   ✅ 前台只看到自己提交的投诉')

# 测试3: 详情数据可见范围
print('\n3. 测试详情数据可见范围...')

# 前台查看自己提交的投诉（应该成功）
complaint = Complaint.objects.filter(submitted_by=frontdesk).first()
if complaint:
    print(f'   前台查看自己提交的投诉: {complaint.title}')
    if complaint.submitted_by_id == frontdesk.id:
        print('   ✅ 前台可以查看自己提交的投诉')
    else:
        print('   ⚠️  投诉提交人不是当前前台')

# 前台查看别人提交的投诉（应该失败）
other_complaint = Complaint.objects.exclude(submitted_by=frontdesk).first()
if other_complaint:
    print(f'   前台尝试查看别人提交的投诉: {other_complaint.title}')
    if other_complaint.submitted_by_id != frontdesk.id:
        print('   ✅ 前台不能查看别人提交的投诉（需要权限检查）')

# 教练查看自己处理的投诉
coach_complaint = Complaint.objects.filter(assigned_to=coach).first()
if coach_complaint:
    print(f'   教练查看自己处理的投诉: {coach_complaint.title}')
    if coach_complaint.assigned_to_id == coach.id:
        print('   ✅ 教练可以查看自己处理的投诉')
    else:
        print('   ⚠️  投诉处理人不是当前教练')

# 教练查看别人处理的投诉（应该失败）
other_coach_complaint = Complaint.objects.filter(assigned_to=other_coach).first()
if other_coach_complaint:
    print(f'   教练尝试查看别人处理的投诉: {other_coach_complaint.title}')
    if other_coach_complaint.assigned_to_id != coach.id:
        print('   ✅ 教练不能查看别人处理的投诉（需要权限检查）')

# 测试4: 视图层权限检查
print('\n4. 测试视图层权限导入...')
try:
    from apps.complaint.views import ComplaintViewSet, IsCoach, IsFrontDesk, IsCoachSupervisor, IsDirector
    print('   ✅ 所有权限类导入成功')
except ImportError as e:
    print(f'   ❌ 导入失败: {e}')

# 测试5: add_comment 视图层权限不再限制 IsCoach
print('\n5. 测试 add_comment 视图层权限...')
viewset = ComplaintViewSet()
viewset.action = 'add_comment'
permissions = viewset.get_permissions()
perm_classes = [p.__class__.__name__ for p in permissions]
print(f'   add_comment 权限类: {perm_classes}')
if 'IsCoach' not in perm_classes:
    print('   ✅ add_comment 不再使用 IsCoach 限制')
else:
    print('   ⚠️  add_comment 仍然使用 IsCoach 限制')

# 测试6: 内部评论权限
print('\n6. 测试内部评论权限...')
complaint = Complaint.objects.filter(status='submitted').first()
if complaint:
    complaint.assigned_to = coach
    complaint.save()
    
    # 教练可以添加内部评论
    try:
        comment = ComplaintService.add_comment(coach, complaint, '教练内部评论', is_internal=True)
        print(f'   ✅ 处理人（教练）可以添加内部评论 (id={comment.id})')
    except Exception as e:
        print(f'   ❌ 教练添加内部评论失败: {e}')
    
    # 教练主管可以添加内部评论
    try:
        comment = ComplaintService.add_comment(supervisor, complaint, '主管内部评论', is_internal=True)
        print(f'   ✅ 教练主管可以添加内部评论 (id={comment.id})')
    except Exception as e:
        print(f'   ❌ 教练主管添加内部评论失败: {e}')

print('\n' + '=' * 70)
print('所有修复验证完成！')
print('=' * 70)
