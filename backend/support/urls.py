# backend/support/urls.py
"""
TERAS Support URLs
Routes pour l'API de support
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SupportTicketViewSet

# Router REST
router = DefaultRouter()
router.register(r'tickets', SupportTicketViewSet, basename='support-ticket')

app_name = 'support'

urlpatterns = [
    path('', include(router.urls)),
]
