# backend/support/permissions.py
from rest_framework.permissions import BasePermission


class IsTicketOwnerOrStaff(BasePermission):
    """Propriétaire du ticket ou staff."""
    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return True
        return obj.user == request.user


class IsOwnerOrAdmin(BasePermission):
    """Propriétaire ou admin."""
    def has_object_permission(self, request, view, obj):
        if request.user.is_staff or getattr(request.user, 'user_type', '') == 'admin':
            return True
        return getattr(obj, 'user', None) == request.user
