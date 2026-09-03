# backend/scoring/permissions.py
from rest_framework.permissions import BasePermission, SAFE_METHODS

TERAS_ADMIN_GROUP = "TERAS_ADMIN"

class IsTerasAdminOrReadOnly(BasePermission):
    """
    - GET/HEAD/OPTIONS: autorisés à tous
    - Méthodes d'écriture (POST/PUT/PATCH/DELETE): réservées aux utilisateurs
      authentifiés ET membre du groupe TERAS_ADMIN ou is_staff/superuser
    """
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser or user.is_staff:
            return True
        return user.groups.filter(name=TERAS_ADMIN_GROUP).exists()
