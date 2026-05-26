from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Sum, Q
from apps.weight.models import WeightTicket
from apps.credit.models import CreditRecord, RepaymentRecord
from .serializers import UserSerializer


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        pending_weighs = WeightTicket.objects.filter(status='pending').count()
        rejected_weighs = WeightTicket.objects.filter(status='rejected').count()
        review_weighs = WeightTicket.objects.filter(status='review').count()

        pending_credits = CreditRecord.objects.filter(status='pending').count()
        rejected_credits = CreditRecord.objects.filter(status='rejected').count()

        total_credit = CreditRecord.objects.filter(
            status='approved'
        ).aggregate(total=Sum('amount'))['total'] or 0

        total_repaid = RepaymentRecord.objects.filter(
            status='approved'
        ).aggregate(total=Sum('amount'))['total'] or 0

        remaining_credit = total_credit - total_repaid

        recent_pending = WeightTicket.objects.filter(
            status='pending'
        ).order_by('-created_at')[:5]

        pending_list = []
        for ticket in recent_pending:
            pending_list.append({
                'id': ticket.id,
                'ticket_no': ticket.ticket_no,
                'customer_name': ticket.customer.name if ticket.customer else '未知',
                'waste_type': ticket.waste_type.name if ticket.waste_type else '未知',
                'net_weight': float(ticket.net_weight),
                'amount': float(ticket.total_amount),
                'created_at': ticket.created_at.strftime('%Y-%m-%d %H:%M')
            })

        return Response({
            'pending': {
                'weights': pending_weighs,
                'credits': pending_credits
            },
            'rejected': {
                'weights': rejected_weighs,
                'credits': rejected_credits
            },
            'review': {
                'weights': review_weighs
            },
            'credit_summary': {
                'total_credit': float(total_credit),
                'total_repaid': float(total_repaid),
                'remaining': float(remaining_credit)
            },
            'recent_pending': pending_list
        })


class UserInfoView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
