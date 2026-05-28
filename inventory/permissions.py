from rest_framework.permissions import BasePermission, SAFE_METHODS
from .models import Role, ReplenishmentStatus, TransferStatus, DisplayRecordStatus
from .exceptions import PermissionDeniedException


class IsStoreManager(BasePermission):
    """店长权限"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and getattr(request.user.profile, 'role', None) == Role.STORE_MANAGER

    def has_object_permission(self, request, view, obj):
        if not self.has_permission(request, view):
            return False
        if hasattr(obj, 'store'):
            return obj.store == request.user.profile.store
        if hasattr(obj, 'from_store'):
            return obj.from_store == request.user.profile.store or obj.to_store == request.user.profile.store
        return True


class IsPlanner(BasePermission):
    """企划专员权限"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and getattr(request.user.profile, 'role', None) == Role.PLANNER


class IsWarehouse(BasePermission):
    """仓管权限"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and getattr(request.user.profile, 'role', None) == Role.WAREHOUSE


class IsStoreManagerOrPlanner(BasePermission):
    """店长或企划专员"""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        role = getattr(request.user.profile, 'role', None)
        return role in [Role.STORE_MANAGER, Role.PLANNER]


class IsPlannerOrWarehouse(BasePermission):
    """企划专员或仓管"""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        role = getattr(request.user.profile, 'role', None)
        return role in [Role.PLANNER, Role.WAREHOUSE]


class ReplenishmentPermission(BasePermission):
    """补货单权限控制"""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        role = getattr(request.user.profile, 'role', None)
        if view.action in ['list', 'retrieve']:
            return True
        if view.action in ['create', 'submit']:
            return role in [Role.STORE_MANAGER, Role.PLANNER]
        if view.action in ['review', 'reject', 'process', 'ship']:
            return role == Role.WAREHOUSE
        if view.action == 'receive':
            return role == Role.STORE_MANAGER
        if view.action == 'cancel':
            return role in [Role.STORE_MANAGER, Role.PLANNER, Role.WAREHOUSE]
        return True

    def has_object_permission(self, request, view, obj):
        role = getattr(request.user.profile, 'role', None)
        user_store = getattr(request.user.profile, 'store', None)

        if view.action in ['list', 'retrieve']:
            if role == Role.STORE_MANAGER:
                return obj.store == user_store
            return True

        if view.action in ['create', 'submit']:
            if role == Role.STORE_MANAGER:
                return obj.store == user_store
            return True

        if view.action == 'receive':
            return role == Role.STORE_MANAGER and obj.store == user_store

        if view.action == 'cancel':
            if role == Role.STORE_MANAGER:
                return obj.store == user_store and obj.status in [
                    ReplenishmentStatus.DRAFT, ReplenishmentStatus.SUBMITTED
                ]
            if role == Role.WAREHOUSE:
                return obj.status in [
                    ReplenishmentStatus.SUBMITTED, ReplenishmentStatus.REVIEWING
                ]
            return role == Role.PLANNER

        return True


class TransferPermission(BasePermission):
    """调拨单权限控制"""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        role = getattr(request.user.profile, 'role', None)
        if view.action in ['list', 'retrieve']:
            return True
        if view.action in ['create', 'submit']:
            return role in [Role.STORE_MANAGER, Role.PLANNER]
        if view.action in ['out_confirm', 'out_reject']:
            return role == Role.STORE_MANAGER
        if view.action in ['in_confirm', 'in_reject']:
            return role == Role.STORE_MANAGER
        if view.action == 'cancel':
            return True
        return True

    def has_object_permission(self, request, view, obj):
        role = getattr(request.user.profile, 'role', None)
        user_store = getattr(request.user.profile, 'store', None)

        if view.action in ['list', 'retrieve']:
            if role == Role.STORE_MANAGER:
                return obj.from_store == user_store or obj.to_store == user_store
            return True

        if view.action in ['out_confirm', 'out_reject']:
            return role == Role.STORE_MANAGER and obj.from_store == user_store

        if view.action in ['in_confirm', 'in_reject']:
            return role == Role.STORE_MANAGER and obj.to_store == user_store

        if view.action == 'cancel':
            if role == Role.STORE_MANAGER:
                return (obj.from_store == user_store or obj.to_store == user_store) and \
                       obj.status in [TransferStatus.DRAFT, TransferStatus.SUBMITTED]
            return role in [Role.PLANNER, Role.WAREHOUSE]

        return True


class DisplayRecordPermission(BasePermission):
    """陈列记录权限控制"""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        role = getattr(request.user.profile, 'role', None)
        if view.action in ['list', 'retrieve']:
            return True
        if view.action == 'create':
            return role in [Role.PLANNER, Role.WAREHOUSE]
        if view.action == 'fix':
            return role == Role.STORE_MANAGER
        if view.action == 'verify':
            return role in [Role.PLANNER, Role.WAREHOUSE]
        return True

    def has_object_permission(self, request, view, obj):
        role = getattr(request.user.profile, 'role', None)
        user_store = getattr(request.user.profile, 'store', None)

        if view.action in ['list', 'retrieve']:
            if role == Role.STORE_MANAGER:
                return obj.store == user_store
            return True

        if view.action == 'fix':
            return role == Role.STORE_MANAGER and obj.store == user_store

        return True


def check_role_permission(user, allowed_roles, message=None):
    """检查用户角色权限"""
    role = getattr(user.profile, 'role', None) if hasattr(user, 'profile') else None
    if role not in allowed_roles:
        raise PermissionDeniedException(
            detail=message or f'需要以下角色之一: {", ".join([Role(r).label for r in allowed_roles])}'
        )


def check_store_permission(user, store, message=None):
    """检查用户门店权限"""
    user_store = getattr(user.profile, 'store', None) if hasattr(user, 'profile') else None
    if user_store != store:
        raise PermissionDeniedException(
            detail=message or '您没有权限操作该门店的数据'
        )
