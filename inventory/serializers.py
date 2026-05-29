from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    UserProfile, Customer, Part, Order, OrderItem, OrderStatusLog,
    OrderRemark, Payment, CollectionReminder, ReminderRemark
)


class UserSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source='profile.role', read_only=True)
    role_display = serializers.CharField(source='profile.get_role_display', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'role', 'role_display']


class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = UserProfile
        fields = '__all__'


class CustomerSerializer(serializers.ModelSerializer):
    available_credit = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    credit_status_display = serializers.CharField(source='get_credit_status_display', read_only=True)

    class Meta:
        model = Customer
        fields = '__all__'


class PartSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = Part
        fields = '__all__'


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = '__all__'


class OrderStatusLogSerializer(serializers.ModelSerializer):
    operator_name = serializers.CharField(source='operator.get_full_name', read_only=True)
    from_status_display = serializers.SerializerMethodField()
    to_status_display = serializers.SerializerMethodField()

    def get_from_status_display(self, obj):
        if obj.from_status:
            return dict(Order.STATUS_CHOICES).get(obj.from_status, obj.from_status)
        return ''

    def get_to_status_display(self, obj):
        return dict(Order.STATUS_CHOICES).get(obj.to_status, obj.to_status)

    class Meta:
        model = OrderStatusLog
        fields = '__all__'


class OrderRemarkSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.get_full_name', read_only=True)

    class Meta:
        model = OrderRemark
        fields = '__all__'


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    status_logs = OrderStatusLogSerializer(many=True, read_only=True)
    remarks = OrderRemarkSerializer(many=True, read_only=True)
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    sales_person_name = serializers.CharField(source='sales_person.get_full_name', read_only=True)
    warehouse_person_name = serializers.CharField(source='warehouse_person.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    unpaid_amount = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)

    class Meta:
        model = Order
        fields = '__all__'


class OrderListSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    sales_person_name = serializers.CharField(source='sales_person.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    unpaid_amount = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'order_no', 'customer_name', 'sales_person_name', 'status', 'status_display',
                  'total_amount', 'paid_amount', 'unpaid_amount', 'due_date', 'is_overdue', 'created_at']


class PaymentSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    method_display = serializers.CharField(source='get_method_display', read_only=True)
    operator_name = serializers.CharField(source='operator.get_full_name', read_only=True)
    confirm_person_name = serializers.CharField(source='confirm_person.get_full_name', read_only=True)
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    order_no = serializers.CharField(source='order.order_no', read_only=True)

    class Meta:
        model = Payment
        fields = '__all__'


class ReminderRemarkSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.get_full_name', read_only=True)

    class Meta:
        model = ReminderRemark
        fields = '__all__'


class CollectionReminderSerializer(serializers.ModelSerializer):
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    assignee_name = serializers.CharField(source='assignee.get_full_name', read_only=True)
    creator_name = serializers.CharField(source='creator.get_full_name', read_only=True)
    order_no = serializers.CharField(source='order.order_no', read_only=True)
    customer_name = serializers.CharField(source='order.customer.name', read_only=True)
    unpaid_amount = serializers.DecimalField(source='order.unpaid_amount', max_digits=12, decimal_places=2, read_only=True)
    remarks = ReminderRemarkSerializer(many=True, read_only=True)

    class Meta:
        model = CollectionReminder
        fields = [
            'id', 'order', 'assignee', 'creator', 'title', 'content',
            'priority', 'priority_display', 'status', 'status_display',
            'due_date', 'result', 'created_at', 'completed_at',
            'assignee_name', 'creator_name', 'order_no', 'customer_name',
            'unpaid_amount', 'remarks'
        ]


class DashboardStatsSerializer(serializers.Serializer):
    total_orders = serializers.IntegerField()
    pending_orders = serializers.IntegerField()
    overdue_orders = serializers.IntegerField()
    total_receivable = serializers.DecimalField(max_digits=14, decimal_places=2)
    today_collections = serializers.DecimalField(max_digits=12, decimal_places=2)
    pending_reminders = serializers.IntegerField()
