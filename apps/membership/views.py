from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import MembershipPlan, MembershipCard, RechargeRecord, ConsumptionRecord
from .serializers import (
    MembershipPlanSerializer, MembershipCardSerializer,
    RechargeRecordSerializer, ConsumptionRecordSerializer,
    RechargeCreateSerializer, ConsumptionCreateSerializer,
    CardCreateSerializer, CardStatusUpdateSerializer
)
from .services import (
    MembershipPlanService, MembershipCardService,
    RechargeService, ConsumptionService
)
from apps.core.permissions import IsDirector, IsFrontDesk
from apps.core.services import ExportService, AuditService
from apps.core.models_audit import AuditLog
from apps.core.exceptions import PermissionDeniedException


class MembershipPlanViewSet(viewsets.ModelViewSet):
    queryset = MembershipPlan.objects.all()
    serializer_class = MembershipPlanSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsDirector()]
        return super().get_permissions()

    def list(self, request):
        plan_type = request.query_params.get('plan_type')
        is_active = request.query_params.get('is_active')
        search = request.query_params.get('search')

        queryset = MembershipPlanService.list_plans(
            plan_type=plan_type, is_active=is_active, search=search
        )
        page = self.paginate_queryset(queryset)
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)

    def perform_create(self, serializer):
        plan = MembershipPlanService.create_plan(self.request.user, **serializer.validated_data)
        serializer.instance = plan


class MembershipCardViewSet(viewsets.ModelViewSet):
    queryset = MembershipCard.objects.all()
    serializer_class = MembershipCardSerializer
    http_method_names = ['get', 'post', 'head', 'options']

    def get_permissions(self):
        if self.action in ['create', 'update_status']:
            return [IsFrontDesk()]
        return super().get_permissions()

    def list(self, request):
        student_id = request.query_params.get('student_id')
        status_val = request.query_params.get('status')
        plan_type = request.query_params.get('plan_type')
        search = request.query_params.get('search')
        expire_soon = request.query_params.get('expire_soon') == '1'

        queryset = MembershipCardService.list_cards(
            student_id=student_id, status=status_val, plan_type=plan_type,
            search=search, expire_soon=expire_soon
        )

        if request.query_params.get('export') == '1':
            if request.user.role != 'director':
                raise PermissionDeniedException('只有馆长可以导出数据')
            fields = [
                {'label': '卡号', 'value': 'card_number', 'width': 20},
                {'label': '学员', 'value': lambda o: o.student.name, 'width': 12},
                {'label': '套餐', 'value': lambda o: o.plan.name, 'width': 15},
                {'label': '余额', 'value': 'balance', 'width': 10},
                {'label': '剩余次数', 'value': 'remaining_times', 'width': 10},
                {'label': '状态', 'value': lambda o: o.get_status_display(), 'width': 10},
                {'label': '生效日期', 'value': 'start_date', 'width': 12},
                {'label': '到期日期', 'value': 'end_date', 'width': 12},
            ]
            return ExportService.export_to_excel(queryset, fields, 'memberships')

        page = self.paginate_queryset(queryset)
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)

    def create(self, request):
        serializer = CardCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        card = MembershipCardService.create_card(
            request.user,
            serializer.validated_data['student_id'],
            serializer.validated_data['plan_id'],
            serializer.validated_data.get('start_date'),
            serializer.validated_data.get('notes', '')
        )
        return Response({
            'code': 200,
            'message': '开卡成功',
            'data': MembershipCardSerializer(card).data
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        card = self.get_object()
        serializer = CardStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        card = MembershipCardService.update_card_status(
            request.user, card,
            serializer.validated_data['status'],
            serializer.validated_data.get('notes', '')
        )
        return Response({
            'code': 200,
            'message': '状态更新成功',
            'data': MembershipCardSerializer(card).data
        })

    @action(detail=True, methods=['get'])
    def chain(self, request, pk=None):
        data = MembershipCardService.get_card_chain(pk)
        return Response({
            'code': 200,
            'message': 'success',
            'data': {
                'card': MembershipCardSerializer(data['card']).data,
                'recharges': RechargeRecordSerializer(data['recharges'], many=True).data,
                'consumptions': ConsumptionRecordSerializer(data['consumptions'], many=True).data,
                'stats': {
                    'total_recharged': str(data['stats']['total_recharged']),
                    'total_consumed': str(data['stats']['total_consumed']),
                    'recharge_count': data['stats']['recharge_count'],
                    'consumption_count': data['stats']['consumption_count'],
                }
            }
        })


class RechargeRecordViewSet(viewsets.ModelViewSet):
    queryset = RechargeRecord.objects.all()
    serializer_class = RechargeRecordSerializer
    http_method_names = ['get', 'post', 'head', 'options']

    def get_permissions(self):
        if self.action in ['create']:
            return [IsFrontDesk()]
        return super().get_permissions()

    def list(self, request):
        membership_id = request.query_params.get('membership_id')
        payment_method = request.query_params.get('payment_method')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        operator_id = request.query_params.get('operator_id')

        queryset = RechargeService.list_records(
            membership_id=membership_id, payment_method=payment_method,
            start_date=start_date, end_date=end_date, operator_id=operator_id
        )
        page = self.paginate_queryset(queryset)
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)

    def create(self, request):
        serializer = RechargeCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        record = RechargeService.recharge(
            request.user,
            serializer.validated_data['membership_id'],
            serializer.validated_data['plan_id'],
            serializer.validated_data['payment_method'],
            serializer.validated_data.get('transaction_no', ''),
            serializer.validated_data.get('notes', '')
        )
        return Response({
            'code': 200,
            'message': '充值成功',
            'data': RechargeRecordSerializer(record).data
        }, status=status.HTTP_201_CREATED)


class ConsumptionRecordViewSet(viewsets.ModelViewSet):
    queryset = ConsumptionRecord.objects.all()
    serializer_class = ConsumptionRecordSerializer
    http_method_names = ['get', 'post', 'head', 'options']

    def get_permissions(self):
        if self.action in ['create', 'reconcile']:
            return [IsFrontDesk()]
        if self.action in ['financial_report']:
            return [IsDirector()]
        return super().get_permissions()

    def list(self, request):
        membership_id = request.query_params.get('membership_id')
        consumption_type = request.query_params.get('consumption_type')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        operator_id = request.query_params.get('operator_id')
        schedule_id = request.query_params.get('schedule_id')

        queryset = ConsumptionService.list_records(
            membership_id=membership_id, consumption_type=consumption_type,
            start_date=start_date, end_date=end_date,
            operator_id=operator_id, schedule_id=schedule_id
        )

        if request.query_params.get('export') == '1':
            if request.user.role != 'director':
                raise PermissionDeniedException('只有馆长可以导出数据')
            fields = [
                {'label': '消费时间', 'value': 'created_at', 'width': 20},
                {'label': '卡号', 'value': lambda o: o.membership.card_number, 'width': 20},
                {'label': '学员', 'value': lambda o: o.membership.student.name, 'width': 12},
                {'label': '消费类型', 'value': lambda o: o.get_consumption_type_display(), 'width': 12},
                {'label': '金额', 'value': 'amount', 'width': 10},
                {'label': '扣次', 'value': 'times_deducted', 'width': 8},
                {'label': '经办人', 'value': lambda o: o.operator.username if o.operator else '', 'width': 12},
                {'label': '关联课程', 'value': lambda o: o.related_schedule.course.name if o.related_schedule else '', 'width': 20},
            ]
            return ExportService.export_to_excel(queryset, fields, 'consumptions')

        page = self.paginate_queryset(queryset)
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)

    def create(self, request):
        serializer = ConsumptionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        record = ConsumptionService.consume(
            request.user,
            serializer.validated_data['membership_id'],
            serializer.validated_data['consumption_type'],
            serializer.validated_data['amount'],
            serializer.validated_data.get('times', 0),
            serializer.validated_data.get('schedule_id'),
            serializer.validated_data.get('enrollment_id'),
            serializer.validated_data.get('notes', '')
        )
        return Response({
            'code': 200,
            'message': '消费成功',
            'data': ConsumptionRecordSerializer(record).data
        }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'])
    def reconcile(self, request):
        schedule_id = request.data.get('schedule_id')
        if not schedule_id:
            return Response({
                'code': 400,
                'message': '缺少schedule_id参数',
                'data': None
            }, status=400)

        results = ConsumptionService.reconcile_for_schedule(request.user, schedule_id)
        success_count = sum(1 for r in results if r['success'])
        fail_count = len(results) - success_count

        return Response({
            'code': 200,
            'message': f'消课对账完成，成功{success_count}条，失败{fail_count}条',
            'data': results
        })

    @action(detail=False, methods=['get'])
    def financial_report(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        report = ConsumptionService.get_financial_report(start_date, end_date)

        report['total_recharge'] = str(report['total_recharge'])
        report['total_consumption'] = str(report['total_consumption'])
        report['net_cash_flow'] = str(report['net_cash_flow'])
        for item in report['recharge_by_method']:
            item['total'] = str(item['total'])
        for item in report['consumption_by_type']:
            item['total'] = str(item['total'])

        return Response({
            'code': 200,
            'message': 'success',
            'data': report
        })
