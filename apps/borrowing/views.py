from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Book, BookCategory, BorrowRecord, BorrowStatus
from .serializers import (
    BookSerializer, BookListSerializer, BookCategorySerializer, BorrowRecordSerializer
)
from apps.common.permissions import IsManager
from apps.audit.services import OverdueReminderService


class BookCategoryViewSet(viewsets.ModelViewSet):
    queryset = BookCategory.objects.all()
    serializer_class = BookCategorySerializer
    permission_classes = [IsManager]


class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.select_related('venue', 'category').all()
    serializer_class = BookSerializer
    permission_classes = [IsManager]

    def get_serializer_class(self):
        if self.action == 'list':
            return BookListSerializer
        return BookSerializer


class BorrowRecordViewSet(viewsets.ModelViewSet):
    queryset = BorrowRecord.objects.select_related('book', 'borrower', 'operator').all()
    serializer_class = BorrowRecordSerializer
    permission_classes = [IsManager]

    def perform_create(self, serializer):
        serializer.save(operator=self.request.user, created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def return_book(self, request, pk=None):
        borrow = self.get_object()
        if borrow.status in [BorrowStatus.RETURNED, BorrowStatus.LOST]:
            return Response({'error': '该借阅已处理'}, status=status.HTTP_400_BAD_REQUEST)

        borrow.status = BorrowStatus.RETURNED
        borrow.return_date = timezone.now()
        borrow.save()

        book = borrow.book
        book.available_copies += 1
        book.status = 'available'
        book.save()

        OverdueReminderService.close_borrow_reminder(borrow, operator=request.user)

        serializer = self.get_serializer(borrow)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def renew(self, request, pk=None):
        borrow = self.get_object()
        if borrow.status not in [BorrowStatus.BORROWED, BorrowStatus.RENEWED]:
            return Response({'error': '当前状态不可续借'}, status=status.HTTP_400_BAD_REQUEST)

        config = borrow.venue.borrow_config if hasattr(borrow.venue, 'borrow_config') else None
        max_renew = config.max_renew_count if config else 2

        if borrow.renew_count >= max_renew:
            return Response({'error': '已达到最大续借次数'}, status=status.HTTP_400_BAD_REQUEST)

        borrow.renew_count += 1
        borrow.status = BorrowStatus.RENEWED
        from datetime import timedelta
        days = config.max_borrow_days if config else 30
        borrow.due_date = borrow.due_date + timedelta(days=days)
        borrow.save()

        serializer = self.get_serializer(borrow)
        return Response(serializer.data)
