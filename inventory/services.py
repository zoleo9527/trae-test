from django.utils import timezone
from django.db import transaction
from .models import Order, OrderStatusLog, OrderItem, Customer, Payment
from django.contrib.auth.models import User


class OrderWorkflowService:
    @staticmethod
    def generate_order_no():
        date_str = timezone.now().strftime('%Y%m%d')
        last_order = Order.objects.filter(order_no__startswith=f'ORD{date_str}').order_by('-order_no').first()
        if last_order:
            seq = int(last_order.order_no[-4:]) + 1
        else:
            seq = 1
        return f'ORD{date_str}{seq:04d}'

    @staticmethod
    def generate_payment_no():
        date_str = timezone.now().strftime('%Y%m%d')
        last_payment = Payment.objects.filter(payment_no__startswith=f'PAY{date_str}').order_by('-payment_no').first()
        if last_payment:
            seq = int(last_payment.payment_no[-4:]) + 1
        else:
            seq = 1
        return f'PAY{date_str}{seq:04d}'

    @staticmethod
    @transaction.atomic
    def create_inquiry(customer, sales_person, items_data, credit_days=30):
        order = Order.objects.create(
            order_no=OrderWorkflowService.generate_order_no(),
            customer=customer,
            sales_person=sales_person,
            status='INQUIRY',
            credit_days=credit_days
        )

        total_amount = 0
        for item_data in items_data:
            part = item_data['part']
            quantity = item_data['quantity']
            unit_price = item_data.get('unit_price', part.sale_price)
            subtotal = quantity * unit_price
            total_amount += subtotal

            OrderItem.objects.create(
                order=order,
                part=part,
                part_name=part.name,
                part_code=part.part_code,
                spec=part.spec,
                quantity=quantity,
                unit_price=unit_price,
                subtotal=subtotal
            )

        order.total_amount = total_amount
        order.save()

        OrderStatusLog.objects.create(
            order=order,
            to_status='INQUIRY',
            operator=sales_person,
            remark='创建询价单'
        )

        return order

    @staticmethod
    @transaction.atomic
    def approve_inquiry(order, operator, remark=''):
        if order.status != 'INQUIRY':
            raise ValueError('当前状态不允许确认询价')

        if order.customer.available_credit < order.total_amount:
            raise ValueError('客户信用额度不足')

        old_status = order.status
        order.status = 'INQUIRY_APPROVED'
        order.save()

        OrderStatusLog.objects.create(
            order=order,
            from_status=old_status,
            to_status='INQUIRY_APPROVED',
            operator=operator,
            remark=remark or '询价已确认'
        )

        return order

    @staticmethod
    @transaction.atomic
    def lock_stock(order, operator, remark=''):
        if order.status != 'INQUIRY_APPROVED':
            raise ValueError('当前状态不允许锁库')

        for item in order.items.all():
            if item.part.stock_qty < item.quantity:
                raise ValueError(f'配件 {item.part_name} 库存不足')

        for item in order.items.all():
            item.part.stock_qty -= item.quantity
            item.part.save()

        old_status = order.status
        order.status = 'LOCKED'
        order.warehouse_person = operator
        order.save()

        OrderStatusLog.objects.create(
            order=order,
            from_status=old_status,
            to_status='LOCKED',
            operator=operator,
            remark=remark or '已锁库'
        )

        return order

    @staticmethod
    @transaction.atomic
    def deliver_order(order, operator, remark=''):
        if order.status != 'LOCKED':
            raise ValueError('当前状态不允许出库')

        old_status = order.status
        order.status = 'DELIVERED'
        order.save()

        OrderStatusLog.objects.create(
            order=order,
            from_status=old_status,
            to_status='DELIVERED',
            operator=operator,
            remark=remark or '已出库'
        )

        return order

    @staticmethod
    @transaction.atomic
    def settle_order(order, operator, remark=''):
        if order.status not in ['DELIVERED', 'RETURNED']:
            raise ValueError('当前状态不允许结算')

        old_status = order.status
        order.status = 'SETTLED'
        order.due_date = timezone.now().date() + timezone.timedelta(days=order.credit_days)
        order.save()

        order.customer.credit_used += order.total_amount
        order.customer.save()

        OrderStatusLog.objects.create(
            order=order,
            from_status=old_status,
            to_status='SETTLED',
            operator=operator,
            remark=remark or '已结算'
        )

        return order

    @staticmethod
    @transaction.atomic
    def request_return(order, operator, items_data, remark=''):
        if order.status not in ['DELIVERED', 'SETTLED', 'PAID_PARTIAL', 'PAID']:
            raise ValueError('当前状态不允许申请退货')

        for item_data in items_data:
            item = OrderItem.objects.get(id=item_data['item_id'])
            if item.quantity - item.return_quantity < item_data['quantity']:
                raise ValueError(f'配件 {item.part_name} 退货数量超过可退数量')

        old_status = order.status
        order.status = 'RETURN_REQUESTED'
        order.save()

        for item_data in items_data:
            item = OrderItem.objects.get(id=item_data['item_id'])
            item.return_quantity += item_data['quantity']
            item.return_reason = item_data.get('reason', '')
            item.save()

        OrderStatusLog.objects.create(
            order=order,
            from_status=old_status,
            to_status='RETURN_REQUESTED',
            operator=operator,
            remark=remark or '申请退货'
        )

        return order

    @staticmethod
    @transaction.atomic
    def approve_return(order, operator, remark=''):
        if order.status != 'RETURN_REQUESTED':
            raise ValueError('当前状态不允许批准退货')

        for item in order.items.all():
            if item.return_quantity > 0:
                item.part.stock_qty += item.return_quantity
                item.part.save()
                item.is_returned = True
                item.save()

        return_amount = sum(item.return_quantity * item.unit_price for item in order.items.all())
        order.total_amount -= return_amount

        old_status = order.status
        order.status = 'RETURN_APPROVED'
        order.save()

        OrderStatusLog.objects.create(
            order=order,
            from_status=old_status,
            to_status='RETURN_APPROVED',
            operator=operator,
            remark=remark or '退货已批准'
        )

        return order

    @staticmethod
    @transaction.atomic
    def reject_return(order, operator, remark=''):
        if order.status != 'RETURN_REQUESTED':
            raise ValueError('当前状态不允许驳回退货')

        for item in order.items.all():
            item.return_quantity = 0
            item.return_reason = ''
            item.save()

        old_status = order.status
        order.status = 'RETURN_REJECTED'
        order.save()

        OrderStatusLog.objects.create(
            order=order,
            from_status=old_status,
            to_status='RETURN_REJECTED',
            operator=operator,
            remark=remark or '退货已驳回'
        )

        return order

    @staticmethod
    @transaction.atomic
    def confirm_payment(payment, operator, remark=''):
        if payment.status != 'PENDING':
            raise ValueError('当前状态不允许确认回款')

        order = payment.order
        old_order_status = order.status

        payment.status = 'CONFIRMED'
        payment.confirm_person = operator
        payment.confirmed_at = timezone.now()
        payment.save()

        order.paid_amount += payment.amount
        if order.paid_amount >= order.total_amount:
            new_status = 'PAID'
            order.customer.credit_used -= order.total_amount
        else:
            new_status = 'PAID_PARTIAL'
            order.customer.credit_used -= payment.amount
        order.status = new_status
        order.save()
        order.customer.save()

        OrderStatusLog.objects.create(
            order=order,
            from_status=old_order_status,
            to_status=new_status,
            operator=operator,
            remark=f'确认回款 {payment.amount} 元'
        )

        return payment
