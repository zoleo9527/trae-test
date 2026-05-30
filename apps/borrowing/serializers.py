from rest_framework import serializers
from .models import Book, BookCategory, BorrowRecord
from apps.common.serializers import SimpleVenueSerializer, SimpleUserSerializer


class BookCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = BookCategory
        fields = '__all__'


class BookSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    venue_info = SimpleVenueSerializer(source='venue', read_only=True)
    category_info = BookCategorySerializer(source='category', read_only=True)

    class Meta:
        model = Book
        fields = '__all__'


class BookListSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    venue_name = serializers.CharField(source='venue.name', read_only=True)

    class Meta:
        model = Book
        fields = ['id', 'title', 'barcode', 'author', 'publisher', 'status', 'status_display', 'venue_name']


class BorrowRecordSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    book_info = BookListSerializer(source='book', read_only=True)
    borrower_info = SimpleUserSerializer(source='borrower', read_only=True)
    operator_info = SimpleUserSerializer(source='operator', read_only=True)

    class Meta:
        model = BorrowRecord
        fields = '__all__'
