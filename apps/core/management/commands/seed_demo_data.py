from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from apps.schedule.models import Course, Student, Schedule, Enrollment
from apps.membership.models import MembershipPlan, MembershipCard, RechargeRecord, ConsumptionRecord
from apps.membership.services import MembershipCardService
from apps.complaint.models import Complaint, ComplaintComment
from apps.attendance.models import AttendanceSummary

User = get_user_model()


class Command(BaseCommand):
    help = '生成演示数据'

    def handle(self, *args, **kwargs):
        self.stdout.write('开始生成演示数据...')

        self.create_users()
        self.create_courses()
        self.create_students()
        self.create_membership_plans()
        self.create_membership_cards()
        self.create_schedules()
        self.create_enrollments()
        self.create_complaints()
        self.create_attendance_summaries()

        self.stdout.write(self.style.SUCCESS('演示数据生成完成！'))

    def create_users(self):
        self.stdout.write('创建用户...')

        users_data = [
            {'username': 'director', 'role': 'director', 'password': '123456', 'email': 'director@pool.com', 'is_staff': True, 'is_superuser': True},
            {'username': 'coach_sup', 'role': 'coach_supervisor', 'password': '123456', 'email': 'coach_sup@pool.com', 'is_staff': True},
            {'username': 'frontdesk1', 'role': 'front_desk', 'password': '123456', 'email': 'frontdesk1@pool.com'},
            {'username': 'frontdesk2', 'role': 'front_desk', 'password': '123456', 'email': 'frontdesk2@pool.com'},
            {'username': 'coach1', 'role': 'coach', 'password': '123456', 'email': 'coach1@pool.com'},
            {'username': 'coach2', 'role': 'coach', 'password': '123456', 'email': 'coach2@pool.com'},
            {'username': 'coach3', 'role': 'coach', 'password': '123456', 'email': 'coach3@pool.com'},
        ]

        for data in users_data:
            password = data.pop('password')
            user, created = User.objects.get_or_create(username=data['username'], defaults=data)
            if created:
                user.set_password(password)
                user.save()
                self.stdout.write(f'  创建用户: {user.username} ({user.get_role_display()})')

    def create_courses(self):
        self.stdout.write('创建课程模板...')
        courses_data = [
            {'name': '幼儿启蒙班', 'course_type': 'small_group', 'level': 'beginner', 'duration': 45, 'max_students': 6, 'min_students': 3},
            {'name': '儿童基础班', 'course_type': 'group', 'level': 'beginner', 'duration': 60, 'max_students': 12, 'min_students': 5},
            {'name': '青少年进阶班', 'course_type': 'group', 'level': 'intermediate', 'duration': 90, 'max_students': 10, 'min_students': 4},
            {'name': '成人入门班', 'course_type': 'small_group', 'level': 'beginner', 'duration': 60, 'max_students': 8, 'min_students': 3},
            {'name': '私教一对一', 'course_type': 'private', 'level': 'intermediate', 'duration': 60, 'max_students': 1, 'min_students': 1},
            {'name': '竞技训练班', 'course_type': 'group', 'level': 'advanced', 'duration': 120, 'max_students': 8, 'min_students': 4},
            {'name': '水中康复班', 'course_type': 'small_group', 'level': 'beginner', 'duration': 45, 'max_students': 4, 'min_students': 1},
        ]

        for data in courses_data:
            course, created = Course.objects.get_or_create(name=data['name'], defaults=data)
            if created:
                self.stdout.write(f'  创建课程: {course.name}')

    def create_students(self):
        self.stdout.write('创建学员...')
        students_data = [
            {'name': '张小明', 'gender': 'male', 'phone': '13800138001', 'swim_level': 'beginner', 'emergency_contact': '张父', 'emergency_phone': '13800138011'},
            {'name': '李小红', 'gender': 'female', 'phone': '13800138002', 'swim_level': 'beginner', 'emergency_contact': '李母', 'emergency_phone': '13800138022'},
            {'name': '王小强', 'gender': 'male', 'phone': '13800138003', 'swim_level': 'intermediate', 'emergency_contact': '王父', 'emergency_phone': '13800138033'},
            {'name': '陈小美', 'gender': 'female', 'phone': '13800138004', 'swim_level': 'intermediate', 'emergency_contact': '陈母', 'emergency_phone': '13800138044'},
            {'name': '刘大伟', 'gender': 'male', 'phone': '13800138005', 'swim_level': 'advanced', 'emergency_contact': '刘妻', 'emergency_phone': '13800138055'},
            {'name': '赵雅琴', 'gender': 'female', 'phone': '13800138006', 'swim_level': 'beginner', 'emergency_contact': '赵夫', 'emergency_phone': '13800138066'},
            {'name': '孙浩然', 'gender': 'male', 'phone': '13800138007', 'swim_level': 'beginner', 'emergency_contact': '孙父', 'emergency_phone': '13800138077'},
            {'name': '周思琪', 'gender': 'female', 'phone': '13800138008', 'swim_level': 'intermediate', 'emergency_contact': '周母', 'emergency_phone': '13800138088'},
            {'name': '吴俊杰', 'gender': 'male', 'phone': '13800138009', 'swim_level': 'advanced', 'emergency_contact': '吴父', 'emergency_phone': '13800138099'},
            {'name': '郑雨萱', 'gender': 'female', 'phone': '13800138010', 'swim_level': 'beginner', 'emergency_contact': '郑母', 'emergency_phone': '13800138100'},
            {'name': '钱多多', 'gender': 'female', 'phone': '13800138011', 'swim_level': 'beginner', 'emergency_contact': '钱姐', 'emergency_phone': '13800138111'},
            {'name': '许壮壮', 'gender': 'male', 'phone': '13800138012', 'swim_level': 'intermediate', 'emergency_contact': '许哥', 'emergency_phone': '13800138122', 'health_notes': '过敏性鼻炎'},
        ]

        for data in students_data:
            student, created = Student.objects.get_or_create(name=data['name'], phone=data['phone'], defaults=data)
            if created:
                self.stdout.write(f'  创建学员: {student.name}')

    def create_membership_plans(self):
        self.stdout.write('创建储值套餐...')
        plans_data = [
            {'name': '10次次卡', 'plan_type': 'times', 'price': 2000, 'value': 2000, 'times': 10, 'description': '适合偶尔上课的学员'},
            {'name': '30次次卡', 'plan_type': 'times', 'price': 5000, 'value': 6000, 'times': 30, 'description': '老客户推荐，赠送1000元'},
            {'name': '季卡', 'plan_type': 'duration', 'price': 3000, 'value': 3000, 'duration_days': 90, 'description': '季度内不限次数'},
            {'name': '年卡', 'plan_type': 'duration', 'price': 8000, 'value': 10000, 'duration_days': 365, 'description': '年度内不限次数，赠送2000元'},
            {'name': '储值卡1000', 'plan_type': 'prepaid', 'price': 1000, 'value': 1000, 'description': '普通储值卡'},
            {'name': '储值卡5000', 'plan_type': 'prepaid', 'price': 5000, 'value': 5500, 'description': '送500元'},
        ]

        for data in plans_data:
            plan, created = MembershipPlan.objects.get_or_create(name=data['name'], defaults=data)
            if created:
                self.stdout.write(f'  创建套餐: {plan.name}')

    def create_membership_cards(self):
        self.stdout.write('创建储值卡...')
        director = User.objects.get(username='director')
        students = Student.objects.all()
        plans = MembershipPlan.objects.all()

        card_assignments = [
            (0, 1, 0),  # 张小明 - 30次次卡
            (1, 0, 0),  # 李小红 - 10次次卡
            (2, 3, 0),  # 王小强 - 年卡
            (3, 2, 0),  # 陈小美 - 季卡
            (4, 5, 0),  # 刘大伟 - 储值卡5000
            (5, 4, 0),  # 赵雅琴 - 储值卡1000
            (6, 1, 0),  # 孙浩然 - 30次次卡
            (7, 0, 0),  # 周思琪 - 10次次卡
            (8, 3, 0),  # 吴俊杰 - 年卡
            (9, 4, 0),  # 郑雨萱 - 储值卡1000
            (10, 0, 0),  # 钱多多 - 10次次卡 (余额不足)
        ]

        for student_idx, plan_idx, _ in card_assignments:
            student = students[student_idx]
            plan = plans[plan_idx]

            existing = MembershipCard.objects.filter(student=student, plan=plan).first()
            if not existing:
                card = MembershipCard.objects.create(
                    student=student,
                    plan=plan,
                    card_number=MembershipCardService.generate_card_number(),
                    balance=plan.value,
                    remaining_times=plan.times,
                    start_date=timezone.now().date() - timedelta(days=30),
                    end_date=timezone.now().date() + timedelta(days=plan.duration_days) if plan.duration_days else None,
                    created_by=director
                )

                RechargeRecord.objects.create(
                    membership=card,
                    plan=plan,
                    amount=plan.price,
                    value_added=plan.value,
                    times_added=plan.times,
                    payment_method='wechat',
                    operator=director,
                    notes='开卡充值'
                )
                self.stdout.write(f'  创建储值卡: {student.name} - {plan.name}')

        qianduoduo = Student.objects.get(name='钱多多')
        qianduoduo_card = MembershipCard.objects.filter(student=qianduoduo).first()
        if qianduoduo_card and qianduoduo_card.remaining_times:
            qianduoduo_card.remaining_times = 1
            qianduoduo_card.balance = 50
            qianduoduo_card.save()
            self.stdout.write(f'  设置钱多多卡余额不足（剩余{qianduoduo_card.remaining_times}次）')

    def create_schedules(self):
        self.stdout.write('创建排班...')
        coach_sup = User.objects.get(username='coach_sup')
        coaches = User.objects.filter(role='coach')
        courses = Course.objects.all()
        now = timezone.now()

        schedules_data = []

        for i in range(5):
            course = courses[i % courses.count()]
            coach = coaches[i % coaches.count()]
            start_time = now + timedelta(days=i + 1, hours=9)
            end_time = start_time + timedelta(minutes=course.duration)

            schedules_data.append({
                'course': course,
                'coach': coach,
                'start_time': start_time,
                'end_time': end_time,
                'status': 'published',
                'max_students': course.max_students,
                'pool_lane': f'{i + 1}号泳道',
                'created_by': coach_sup,
            })

        for i in range(3):
            course = courses[i % courses.count()]
            coach = coaches[i % coaches.count()]
            start_time = now - timedelta(days=i + 1, hours=10 - i)
            end_time = start_time + timedelta(minutes=course.duration)

            schedules_data.append({
                'course': course,
                'coach': coach,
                'start_time': start_time,
                'end_time': end_time,
                'status': 'completed',
                'max_students': course.max_students,
                'pool_lane': f'{(i + 3) % 5 + 1}号泳道',
                'created_by': coach_sup,
            })

        schedules_data.append({
            'course': courses[2],
            'coach': coaches[0],
            'start_time': now + timedelta(days=1, hours=14),
            'end_time': now + timedelta(days=1, hours=15, minutes=30),
            'status': 'confirmed',
            'max_students': courses[2].max_students,
            'pool_lane': '5号泳道',
            'created_by': coach_sup,
        })

        for data in schedules_data:
            schedule = Schedule.objects.create(**data)
            self.stdout.write(f'  创建排班: {schedule}')

    def create_enrollments(self):
        self.stdout.write('创建报名记录...')
        frontdesk = User.objects.get(username='frontdesk1')
        schedules = Schedule.objects.all()
        students = Student.objects.all()

        enrollments_data = []

        for sched in schedules:
            num_students = min(sched.max_students, 5)
            for i in range(num_students):
                student = students[(sched.id + i) % students.count()]

                existing = Enrollment.objects.filter(schedule=sched, student=student).first()
                if existing:
                    continue

                status = 'enrolled'
                if sched.status == 'completed':
                    status = 'attended' if i < 4 else ('absent' if i == 4 else 'leave_approved')

                enrollments_data.append({
                    'schedule': sched,
                    'student': student,
                    'status': status,
                })

        for data in enrollments_data:
            enrollment = Enrollment.objects.create(**data)
            if enrollment.status == 'attended':
                enrollment.attendance_time = enrollment.schedule.start_time
                enrollment.save()

            if enrollment.status == 'leave_approved':
                enrollment.leave_reason = '感冒发烧，请假一次'
                enrollment.leave_approved_by = frontdesk
                enrollment.leave_approved_at = enrollment.schedule.start_time - timedelta(hours=2)
                enrollment.save()

            self.stdout.write(f'  报名: {enrollment.student.name} -> {enrollment.schedule.course.name} ({enrollment.get_status_display()})')

    def create_complaints(self):
        self.stdout.write('创建投诉和现场问题...')
        frontdesk = User.objects.get(username='frontdesk1')
        coach_sup = User.objects.get(username='coach_sup')
        director = User.objects.get(username='director')
        students = Student.objects.all()

        complaints_data = [
            {
                'title': '水质浑浊有异味',
                'category': 'water_quality',
                'priority': 'high',
                'status': 'processing',
                'description': '今天泳池水看起来很浑浊，还有一股消毒水味道太重，孩子呛到后一直咳嗽。',
                'reporter_name': '张父',
                'reporter_phone': '13800138011',
                'student': students[0],
                'location': '比赛池深水区',
                'assigned_to': coach_sup,
                'submitted_by': frontdesk,
                'expected_resolve_time': timezone.now() + timedelta(hours=4),
            },
            {
                'title': '更衣柜门锁坏了',
                'category': 'facility',
                'priority': 'medium',
                'status': 'submitted',
                'description': '女更衣室123号柜门锁坏了，关上就打不开，差点误事。',
                'reporter_name': '李母',
                'reporter_phone': '13800138022',
                'location': '女更衣室',
                'assigned_to': None,
                'submitted_by': frontdesk,
            },
            {
                'title': '教练迟到20分钟',
                'category': 'coach',
                'priority': 'high',
                'status': 'resolved',
                'description': '周六上午10点的课，教练迟到了20分钟才到，孩子们在池边等很久。',
                'reporter_name': '王父',
                'reporter_phone': '13800138033',
                'student': students[2],
                'location': '训练池',
                'assigned_to': coach_sup,
                'submitted_by': frontdesk,
                'resolution': '已批评教练，安排免费补课一次。',
                'actual_resolve_time': timezone.now() - timedelta(days=1),
            },
            {
                'title': '希望增加晚上8点的课程',
                'category': 'schedule',
                'priority': 'low',
                'status': 'assigned',
                'description': '我们几个家长都是上班族，下班太晚赶不上7点的课，能不能开个8点的班？',
                'reporter_name': '刘妻',
                'reporter_phone': '13800138055',
                'assigned_to': director,
                'submitted_by': frontdesk,
            },
            {
                'title': '前台办理业务太慢',
                'category': 'service',
                'priority': 'medium',
                'status': 'closed',
                'description': '周末人多的时候，办个充值要等半小时，建议加开窗口或者提前线上办理。',
                'reporter_name': '赵夫',
                'reporter_phone': '13800138066',
                'assigned_to': director,
                'submitted_by': frontdesk,
                'resolution': '已优化流程，增加了自助充值机。',
                'actual_resolve_time': timezone.now() - timedelta(days=3),
            },
            {
                'title': '紧急：孩子泳池边滑倒磕破头',
                'category': 'facility',
                'priority': 'urgent',
                'status': 'processing',
                'description': '地面太滑没有警示牌，孩子跑的时候滑倒磕到头部，已经送医院。请立即处理地面防滑问题！',
                'reporter_name': '孙父',
                'reporter_phone': '13800138077',
                'student': students[6],
                'location': '泳池入口处',
                'assigned_to': director,
                'submitted_by': frontdesk,
                'expected_resolve_time': timezone.now() + timedelta(hours=1),
            },
            {
                'title': '课程进度太慢',
                'category': 'coach',
                'priority': 'low',
                'status': 'submitted',
                'description': '孩子学了两个月还不会换气，是不是课程安排有问题？',
                'reporter_name': '周母',
                'reporter_phone': '13800138088',
                'student': students[7],
                'assigned_to': None,
                'submitted_by': frontdesk,
            },
        ]

        for data in complaints_data:
            complaint = Complaint.objects.create(**data)
            self.stdout.write(f'  创建投诉: [{complaint.get_priority_display()}] {complaint.title} ({complaint.get_status_display()})')

        c1 = Complaint.objects.get(title='水质浑浊有异味')
        ComplaintComment.objects.create(
            complaint=c1,
            author=coach_sup,
            content='已联系水处理公司，下午来人处理。明天早上可以恢复正常。',
            is_internal=True
        )

        c6 = Complaint.objects.get(title__contains='滑倒磕破头')
        ComplaintComment.objects.create(
            complaint=c6,
            author=director,
            content='已送医，孩子情况稳定。已放置防滑垫和警示牌，正在排查全馆安全隐患。',
            is_internal=False
        )
        ComplaintComment.objects.create(
            complaint=c6,
            author=director,
            content='通知保险公司，启动理赔流程。',
            is_internal=True
        )

    def create_attendance_summaries(self):
        self.stdout.write('创建考勤汇总...')
        for i in range(7):
            date = (timezone.now() - timedelta(days=i + 1)).date()
            AttendanceSummary.objects.update_or_create(
                date=date,
                defaults={
                    'total_schedules': 3 + (i % 3),
                    'total_enrollments': 15 + (i % 5) * 2,
                    'attended_count': 12 + (i % 4) * 2,
                    'absent_count': 2 + (i % 2),
                    'leave_count': 1 + (i % 2),
                    'attendance_rate': round(85 + i * 1.5, 2),
                    'total_consumption': 2000 + i * 200,
                }
            )
            self.stdout.write(f'  生成汇总: {date}')
