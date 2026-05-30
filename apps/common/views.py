from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q
from django.utils import timezone
from apps.inspections.models import InspectionRecord, InspectionStatus
from apps.repairs.models import RepairTicket, RepairStatus
from apps.activities.models import ActivityRegistration, RegistrationStatus, VolunteerFeedback
from apps.borrowing.models import BorrowRecord, BorrowStatus


def get_user_venue_ids(user):
    if user.role == 'admin':
        return None
    user_venues_qs = getattr(user, 'venues', None)
    if user_venues_qs is not None:
        return list(user_venues_qs.values_list('venue_id', flat=True))
    return []


def filter_by_venue(queryset, user, venue_field='venue_id'):
    venue_ids = get_user_venue_ids(user)
    if venue_ids is None:
        return queryset
    if venue_ids:
        return queryset.filter(**{f'{venue_field}__in': venue_ids})
    return queryset.none()


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    user = request.user

    inspection_qs = filter_by_venue(InspectionRecord.objects.all(), user)
    repair_qs = filter_by_venue(RepairTicket.objects.all(), user)

    inspection_stats = {
        'pending_review': inspection_qs.filter(
            status__in=[InspectionStatus.SUBMITTED, InspectionStatus.REVIEWING]
        ).count(),
        'rejected': inspection_qs.filter(
            status=InspectionStatus.REJECTED
        ).count(),
        'needs_review': inspection_qs.filter(
            status=InspectionStatus.NEEDS_REVIEW
        ).count(),
        'completed': inspection_qs.filter(
            status=InspectionStatus.COMPLETED
        ).count(),
    }

    repair_stats = {
        'pending': repair_qs.filter(
            status=RepairStatus.PENDING
        ).count(),
        'in_progress': repair_qs.filter(
            status__in=[RepairStatus.ASSIGNED, RepairStatus.IN_PROGRESS]
        ).count(),
        'needs_confirm': repair_qs.filter(
            status=RepairStatus.NEEDS_CONFIRM
        ).count(),
        'rejected': repair_qs.filter(
            status=RepairStatus.REJECTED
        ).count(),
        'completed': repair_qs.filter(
            status=RepairStatus.COMPLETED
        ).count(),
        'overdue': repair_qs.filter(
            is_overdue=True
        ).exclude(status=RepairStatus.COMPLETED).count(),
    }

    pending_items = []

    pending_inspections = inspection_qs.filter(
        status__in=[InspectionStatus.SUBMITTED, InspectionStatus.REVIEWING, InspectionStatus.NEEDS_REVIEW]
    ).select_related('venue', 'inspector')[:10]

    for item in pending_inspections:
        pending_items.append({
            'type': 'inspection',
            'id': item.id,
            'title': item.title,
            'status': item.status,
            'status_display': item.get_status_display(),
            'venue': item.venue.name if item.venue else '',
            'creator': item.inspector.username if item.inspector else '',
            'created_at': item.created_at,
        })

    pending_repairs = repair_qs.filter(
        status__in=[RepairStatus.PENDING, RepairStatus.ASSIGNED, RepairStatus.IN_PROGRESS, RepairStatus.NEEDS_CONFIRM]
    ).select_related('venue', 'reporter')[:10]

    for item in pending_repairs:
        pending_items.append({
            'type': 'repair',
            'id': item.id,
            'title': f'{item.ticket_no} - {item.title}',
            'status': item.status,
            'status_display': item.get_status_display(),
            'venue': item.venue.name if item.venue else '',
            'creator': item.reporter.username if item.reporter else '',
            'created_at': item.created_at,
        })

    pending_items.sort(key=lambda x: x['created_at'], reverse=True)

    my_tasks = []
    if user.role == 'inspector':
        my_inspections = InspectionRecord.objects.filter(
            inspector=user,
            status__in=[InspectionStatus.DRAFT, InspectionStatus.NEEDS_REVIEW]
        )[:10]
        for item in my_inspections:
            my_tasks.append({
                'type': 'inspection',
                'id': item.id,
                'title': item.title,
                'status': item.status,
                'status_display': item.get_status_display(),
                'created_at': item.created_at,
            })

    if user.role == 'maintenance':
        my_repairs = RepairTicket.objects.filter(
            assignee=user,
            status__in=[RepairStatus.ASSIGNED, RepairStatus.IN_PROGRESS]
        )[:10]
        for item in my_repairs:
            my_tasks.append({
                'type': 'repair',
                'id': item.id,
                'title': f'{item.ticket_no} - {item.title}',
                'status': item.status,
                'status_display': item.get_status_display(),
                'created_at': item.created_at,
            })

    my_tasks.sort(key=lambda x: x['created_at'], reverse=True)

    return Response({
        'inspection_stats': inspection_stats,
        'repair_stats': repair_stats,
        'pending_items': pending_items[:15],
        'my_tasks': my_tasks,
    })
