# backend/credit/urls.py
"""
TERAS Credit URLs
Routes pour l'API de crédit
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CreditProductViewSet,
    CreditRequestViewSet,
    CreditSimulatorViewSet,
    CRMCalculatorViewSet
)

# Router REST
router = DefaultRouter()
router.register(r'products', CreditProductViewSet, basename='credit-product')
router.register(r'requests', CreditRequestViewSet, basename='credit-request')
router.register(r'simulator', CreditSimulatorViewSet, basename='credit-simulator')
router.register(r'crm', CRMCalculatorViewSet, basename='crm-calculator')

app_name = 'credit'

urlpatterns = [
    path('', include(router.urls)),
]
