# backend/credit/permissions.py
from rest_framework.permissions import BasePermission

class IsOwnerOrAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.is_staff or getattr(request.user, "user_type", "") == "admin":
            return True
        return getattr(obj, "user", None) == request.user
