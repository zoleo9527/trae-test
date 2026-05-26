from rest_framework.permissions import BasePermission, IsAuthenticated
from .models import User


class IsDirector(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == User.Role.DIRECTOR


class IsCoachSupervisor(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in [
            User.Role.DIRECTOR,
            User.Role.COACH_SUPERVISOR
        ]


class IsFrontDesk(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in [
            User.Role.DIRECTOR,
            User.Role.COACH_SUPERVISOR,
            User.Role.FRONT_DESK
        ]


class IsCoach(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in [
            User.Role.DIRECTOR,
            User.Role.COACH_SUPERVISOR,
            User.Role.COACH
        ]
