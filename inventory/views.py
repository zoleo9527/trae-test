from django.utils import timezone
from django.db.models import Sum, Q, Count
from django.contrib.auth.models import User
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import (
    Customer, Part, Order, OrderItem, OrderRemark,
    Payment, CollectionReminder, ReminderRemark
)
from .serializers import (
    CustomerSerializer, PartSerializer, OrderSerializer, OrderListSerializer,
    OrderRemarkSerializer, PaymentSerializer, CollectionReminderSerializer,
    ReminderRemarkSerializer, DashboardStatsSerializer, UserSerializer
)
from .permissions import IsBoss, IsSales, IsWarehouse, IsBossOrSales, IsBossOrWarehouse
from .services import OrderWorkflowService


class LoginView(TokenObtainPairView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            user = User.objects.get(username=request.data['username'])
            response.data['user'] = UserSerializer(user).data
        return response


class DashboardViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        today = timezone.now().date()

        total_orders = Order.objects.count()
        pending_orders = Order.objects.filter(
            status__in=['INQUIRY', 'INQUIRY_APPROVED', 'LOCKED', 'DELIVERED', 'SETTLED']
        ).count()

        overdue_orders = Order.objects.filter(
            status__in=['SETTLED', 'PAID_PARTIAL', 'OVERDUE'],
            due_date__lt=today
        ).count()

        total_receivable = Order.objects.filter(
            status__in=['SETTLED', 'PAID_PARTIAL', 'OVERDUE']
        ).aggregate(total=Sum('total_amount') - Sum('paid_amount'))['total'] or 0

        today_collections = Payment.objects.filter(
            status='CONFIRMED',
            confirmed_at__date=today
        ).aggregate(total=Sum('amount'))['total'] or 0

        pending_reminders = CollectionReminder.objects.filter(
            status__in=['PENDING', 'IN_PROGRESS']
        ).count()

        data = {
            'total_orders': total_orders,
            'pending_orders': pending_orders,
            'overdue_orders': overdue_orders,
            'total_receivable': total_receivable,
            'today_collections': today_collections,
            'pending_reminders': pending_reminders,
        }

        serializer = DashboardStatsSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def order_trend(self, request):
        from datetime import timedelta
        days = int(request.query_params.get('days', 7))
        data = []
        for i in range(days - 1, -1, -1):
            date = timezone.now().date() - timedelta(days=i)
            count = Order.objects.filter(created_at__date=date).count()
            data.append({'date': date.isoformat(), 'count': count})
        return Response(data)

    @action(detail=False, methods=['get'])
    def overdue_by_customer(self, request):
        today = timezone.now().date()
        orders = Order.objects.filter(
            status__in=['SETTLED', 'PAID_PARTIAL', 'OVERDUE'],
            due_date__lt=today
        ).select_related('customer')

        customer_data = {}
        for order in orders:
            customer_id = order.customer.id
            if customer_id not in customer_data:
                customer_data[customer_id] = {
                    'customer_id': customer_id,
                    'customer_name': order.customer.name,
                    'unpaid_amount': 0,
                    'order_count': 0
                }
            customer_data[customer_id]['unpaid_amount'] += float(order.unpaid_amount)
            customer_data[customer_id]['order_count'] += 1

        return Response(list(customer_data.values()))

    @action(detail=False, methods=['get'])
    def sales_performance(self, request):
        from django.db.models import Count
        sales_orders = Order.objects.values('sales_person', 'sales_person__first_name', 'sales_person__last_name') \
            .annotate(order_count=Count('id'), total_amount=Sum('total_amount'))

        data = []
        for item in sales_orders:
            if item['sales_person']:
                data.append({
                    'sales_id': item['sales_person'],
                    'sales_name': f"{item['sales_person__first_name']}{item['sales_person__last_name']}",
                    'order_count': item['order_count'],
                    'total_amount': float(item['total_amount'])
                })
        return Response(data)


class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [IsBossOrSales]

    def get_queryset(self):
        queryset = super().get_queryset()
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(credit_status=status)
        return queryset


class PartViewSet(viewsets.ModelViewSet):
    queryset = Part.objects.all()
    serializer_class = PartSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        keyword = self.request.query_params.get('keyword')
        if keyword:
            queryset = queryset.filter(
                Q(name__icontains=keyword) | Q(part_code__icontains=keyword) | Q(model__icontains=keyword)
            )
        return queryset


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all().select_related('customer', 'sales_person', 'warehouse_person')
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return OrderListSerializer
        return OrderSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
        customer_id = self.request.query_params.get('customer_id')
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        is_overdue = self.request.query_params.get('is_overdue')
        if is_overdue == 'true':
            today = timezone.now().date()
            queryset = queryset.filter(
                status__in=['SETTLED', 'PAID_PARTIAL', 'OVERDUE'],
                due_date__lt=today
            )
        return queryset

    @action(detail=True, methods=['post'], permission_classes=[IsBossOrSales])
    def approve_inquiry(self, request, pk=None):
        order = self.get_object()
        remark = request.data.get('remark', '')
        try:
            order = OrderWorkflowService.approve_inquiry(order, request.user, remark)
            return Response(OrderSerializer(order).data)
        except ValueError as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[IsBossOrWarehouse])
    def lock_stock(self, request, pk=None):
        order = self.get_object()
        remark = request.data.get('remark', '')
        try:
            order = OrderWorkflowService.lock_stock(order, request.user, remark)
            return Response(OrderSerializer(order).data)
        except ValueError as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[IsBossOrWarehouse])
    def deliver(self, request, pk=None):
        order = self.get_object()
        remark = request.data.get('remark', '')
        try:
            order = OrderWorkflowService.deliver_order(order, request.user, remark)
            return Response(OrderSerializer(order).data)
        except ValueError as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[IsBossOrSales])
    def settle(self, request, pk=None):
        order = self.get_object()
        remark = request.data.get('remark', '')
        try:
            order = OrderWorkflowService.settle_order(order, request.user, remark)
            return Response(OrderSerializer(order).data)
        except ValueError as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[IsBossOrSales])
    def request_return(self, request, pk=None):
        order = self.get_object()
        items_data = request.data.get('items', [])
        remark = request.data.get('remark', '')
        try:
            order = OrderWorkflowService.request_return(order, request.user, items_data, remark)
            return Response(OrderSerializer(order).data)
        except ValueError as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[IsBoss])
    def approve_return(self, request, pk=None):
        order = self.get_object()
        remark = request.data.get('remark', '')
        try:
            order = OrderWorkflowService.approve_return(order, request.user, remark)
            return Response(OrderSerializer(order).data)
        except ValueError as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[IsBoss])
    def reject_return(self, request, pk=None):
        order = self.get_object()
        remark = request.data.get('remark', '')
        try:
            order = OrderWorkflowService.reject_return(order, request.user, remark)
            return Response(OrderSerializer(order).data)
        except ValueError as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def add_remark(self, request, pk=None):
        order = self.get_object()
        content = request.data.get('content', '')
        is_internal = request.data.get('is_internal', False)
        if not content:
            return Response({'message': '备注内容不能为空'}, status=status.HTTP_400_BAD_REQUEST)
        remark = OrderRemark.objects.create(
            order=order,
            author=request.user,
            content=content,
            is_internal=is_internal
        )
        return Response(OrderRemarkSerializer(remark).data)

    @action(detail=False, methods=['post'], permission_classes=[IsBossOrSales])
    def create_inquiry(self, request):
        customer_id = request.data.get('customer_id')
        items = request.data.get('items', [])
        credit_days = request.data.get('credit_days', 30)

        if not customer_id or not items:
            return Response({'message': '客户和商品不能为空'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            customer = Customer.objects.get(id=customer_id)
            items_data = []
            for item in items:
                part = Part.objects.get(id=item['part_id'])
                items_data.append({
                    'part': part,
                    'quantity': item['quantity'],
                    'unit_price': item.get('unit_price', part.sale_price)
                })

            order = OrderWorkflowService.create_inquiry(
                customer=customer,
                sales_person=request.user,
                items_data=items_data,
                credit_days=credit_days
            )
            return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)
        except (Customer.DoesNotExist, Part.DoesNotExist) as e:
            return Response({'message': str(e)}, status=status.HTTP_404_NOT_FOUND)


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all().select_related('order', 'customer', 'operator', 'confirm_person')
    serializer_class = PaymentSerializer
    permission_classes = [IsBossOrSales]

    def get_queryset(self):
        queryset = super().get_queryset()
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
        order_id = self.request.query_params.get('order_id')
        if order_id:
            queryset = queryset.filter(order_id=order_id)
        return queryset

    def create(self, request, *args, **kwargs):
        order_id = request.data.get('order_id')
        amount = request.data.get('amount')
        method = request.data.get('method', 'BANK')
        remark = request.data.get('remark', '')

        try:
            order = Order.objects.get(id=order_id)
            payment = Payment.objects.create(
                payment_no=OrderWorkflowService.generate_payment_no(),
                order=order,
                customer=order.customer,
                amount=amount,
                method=method,
                operator=request.user,
                remark=remark
            )
            return Response(PaymentSerializer(payment).data, status=status.HTTP_201_CREATED)
        except Order.DoesNotExist:
            return Response({'message': '订单不存在'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'], permission_classes=[IsBoss])
    def confirm(self, request, pk=None):
        payment = self.get_object()
        remark = request.data.get('remark', '')
        try:
            payment = OrderWorkflowService.confirm_payment(payment, request.user, remark)
            return Response(PaymentSerializer(payment).data)
        except ValueError as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[IsBoss])
    def reject(self, request, pk=None):
        payment = self.get_object()
        if payment.status != 'PENDING':
            return Response({'message': '当前状态不允许驳回'}, status=status.HTTP_400_BAD_REQUEST)
        payment.status = 'REJECTED'
        payment.confirm_person = request.user
        payment.save()
        return Response(PaymentSerializer(payment).data)


class CollectionReminderViewSet(viewsets.ModelViewSet):
    queryset = CollectionReminder.objects.all().select_related('order', 'assignee', 'creator')
    serializer_class = CollectionReminderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
        assignee_id = self.request.query_params.get('assignee_id')
        if assignee_id:
            queryset = queryset.filter(assignee_id=assignee_id)
        priority = self.request.query_params.get('priority')
        if priority:
            queryset = queryset.filter(priority=priority)
        return queryset

    def create(self, request, *args, **kwargs):
        order_id = request.data.get('order_id')
        assignee_id = request.data.get('assignee_id')
        title = request.data.get('title')
        content = request.data.get('content')
        priority = request.data.get('priority', 'MEDIUM')
        due_date = request.data.get('due_date')

        if not all([order_id, assignee_id, title, content]):
            return Response({'message': '必填字段不能为空'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            order = Order.objects.get(id=order_id)
            assignee = User.objects.get(id=assignee_id)
            reminder = CollectionReminder.objects.create(
                order=order,
                assignee=assignee,
                creator=request.user,
                title=title,
                content=content,
                priority=priority,
                due_date=due_date
            )
            return Response(CollectionReminderSerializer(reminder).data, status=status.HTTP_201_CREATED)
        except (Order.DoesNotExist, User.DoesNotExist) as e:
            return Response({'message': str(e)}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        reminder = self.get_object()
        if reminder.status != 'PENDING':
            return Response({'message': '只有待处理的催办可以开始'}, status=status.HTTP_400_BAD_REQUEST)
        reminder.status = 'IN_PROGRESS'
        reminder.save()
        return Response(CollectionReminderSerializer(reminder).data)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        reminder = self.get_object()
        if reminder.status != 'IN_PROGRESS':
            return Response({'message': '只有处理中的催办可以完成'}, status=status.HTTP_400_BAD_REQUEST)
        reminder.status = 'COMPLETED'
        reminder.result = request.data.get('result', '')
        reminder.completed_at = timezone.now()
        reminder.save()
        return Response(CollectionReminderSerializer(reminder).data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        reminder = self.get_object()
        reminder.status = 'CANCELLED'
        reminder.save()
        return Response(CollectionReminderSerializer(reminder).data)

    @action(detail=True, methods=['post'])
    def add_remark(self, request, pk=None):
        reminder = self.get_object()
        content = request.data.get('content', '')
        if not content:
            return Response({'message': '备注内容不能为空'}, status=status.HTTP_400_BAD_REQUEST)
        remark = ReminderRemark.objects.create(
            reminder=reminder,
            author=request.user,
            content=content
        )
        return Response(ReminderRemarkSerializer(remark).data)


class CurrentUserView(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
