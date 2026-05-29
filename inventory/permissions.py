from rest_framework.permissions import BasePermission, IsAuthenticated


class IsBoss(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.profile.role == 'BOSS'


class IsSales(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.profile.role == 'SALES'


class IsWarehouse(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.profile.role == 'WAREHOUSE'


class IsBossOrSales(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.profile.role in ['BOSS', 'SALES']


class IsBossOrWarehouse(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.profile.role in ['BOSS', 'WAREHOUSE']
