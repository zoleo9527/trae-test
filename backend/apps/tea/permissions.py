from rest_framework.permissions import BasePermission, SAFE_METHODS

ROLE_SALES = 'sales'
ROLE_APPROVER = 'approver'
ROLE_WAREHOUSE = 'warehouse'
ROLE_ADMIN = 'admin'

ROLE_GROUPS = {
    ROLE_SALES: ['can_submit_price', 'can_submit_activity'],
    ROLE_APPROVER: ['can_approve_price', 'can_approve_activity'],
    ROLE_WAREHOUSE: [],
    ROLE_ADMIN: [],
}


class IsSales(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.groups.filter(name='sales').exists() or request.user.is_staff


class IsApprover(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.groups.filter(name='approver').exists() or request.user.is_staff


class IsWarehouse(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.groups.filter(name='warehouse').exists() or request.user.is_staff


class IsAdminOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return request.user and request.user.is_staff


class CanApprovePrice(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_staff:
            return True
        return request.user.groups.filter(name='approver').exists() or request.user.has_perm('tea.can_approve_price')


class CanSubmitPrice(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_staff:
            return True
        return request.user.groups.filter(name='sales').exists() or request.user.has_perm('tea.can_submit_price')


class CanApproveActivity(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_staff:
            return True
        return request.user.groups.filter(name='approver').exists() or request.user.has_perm('tea.can_approve_activity')


class CanSubmitActivity(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_staff:
            return True
        return request.user.groups.filter(name='sales').exists() or request.user.has_perm('tea.can_submit_activity')
