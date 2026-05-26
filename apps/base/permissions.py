from rest_framework.permissions import BasePermission
from .models import UserRole


def get_user_role(user):
    try:
        return user.user_role.role
    except UserRole.DoesNotExist:
        if user.is_staff or user.is_superuser:
            return 'site_admin'
        return None


def has_any_role(user, roles):
    user_role = get_user_role(user)
    if user_role == 'site_admin' or user.is_superuser:
        return True
    return user_role in roles


class IsSiteAdmin(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        return get_user_role(request.user) == 'site_admin'


class IsOperator(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        return has_any_role(request.user, ['site_admin', 'operator'])


class IsFinance(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        return has_any_role(request.user, ['site_admin', 'finance'])


class CanManageCustomer(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        return has_any_role(request.user, ['site_admin', 'operator'])


class CanManageWeight(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        return has_any_role(request.user, ['site_admin', 'operator'])


class CanManageCredit(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        return has_any_role(request.user, ['site_admin', 'finance'])


class CanViewAuditLog(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        return get_user_role(request.user) == 'site_admin'


class CanApproveWeight(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        return has_any_role(request.user, ['site_admin'])


class CanApproveCredit(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        return has_any_role(request.user, ['site_admin', 'finance'])
