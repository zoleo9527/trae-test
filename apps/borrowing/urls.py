from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BookViewSet, BookCategoryViewSet, BorrowRecordViewSet

router = DefaultRouter()
router.register(r'books', BookViewSet)
router.register(r'book-categories', BookCategoryViewSet)
router.register(r'borrows', BorrowRecordViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
