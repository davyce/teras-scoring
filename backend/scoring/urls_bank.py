# backend/scoring/urls_bank.py
"""
URLs pour l'interface Bank TERAS
"""

from django.urls import path
from .views_bank import (
    bank_analytics,
    bank_ai_chat,
    bank_dashboard,
    bank_clients_list,
    bank_client_create,
    bank_client_detail,
    bank_client_update,
    bank_enterprises_list,
    bank_enterprise_create,
    bank_enterprise_detail,
    bank_enterprise_update,
    bank_products_list,
    bank_product_create,
    bank_product_detail,
    bank_product_update,
    bank_product_delete,
    bank_applications_list,
    bank_application_submit,
    bank_application_detail,
    bank_application_review,
    bank_applications_pending,
    bank_applications_approved,
    bank_applications_rejected,
    bank_simulator,
)

urlpatterns = [
    # Dashboard
    path('dashboard/', bank_dashboard, name='bank_dashboard'),
    
    # Clients particuliers
    path('clients/', bank_clients_list, name='bank_clients_list'),
    path('clients/create/', bank_client_create, name='bank_client_create'),
    path('clients/<int:client_id>/', bank_client_detail, name='bank_client_detail'),
    path('clients/<int:client_id>/update/', bank_client_update, name='bank_client_update'),
    
    # Entreprises
    path('enterprises/', bank_enterprises_list, name='bank_enterprises_list'),
    path('enterprises/create/', bank_enterprise_create, name='bank_enterprise_create'),
    path('enterprises/<int:enterprise_id>/', bank_enterprise_detail, name='bank_enterprise_detail'),
    path('enterprises/<int:enterprise_id>/update/', bank_enterprise_update, name='bank_enterprise_update'),
    
    # Produits financiers
    path('products/', bank_products_list, name='bank_products_list'),
    path('products/create/', bank_product_create, name='bank_product_create'),
    path('products/<int:product_id>/', bank_product_detail, name='bank_product_detail'),
    path('products/<int:product_id>/update/', bank_product_update, name='bank_product_update'),
    path('products/<int:product_id>/delete/', bank_product_delete, name='bank_product_delete'),
    
    # Demandes de crédit
    path('applications/', bank_applications_list, name='bank_applications_list'),
    path('applications/submit/', bank_application_submit, name='bank_application_submit'),
    path('applications/<int:application_id>/', bank_application_detail, name='bank_application_detail'),
    path('applications/<int:application_id>/review/', bank_application_review, name='bank_application_review'),
    path('applications/pending/', bank_applications_pending, name='bank_applications_pending'),
    path('applications/approved/', bank_applications_approved, name='bank_applications_approved'),
    path('applications/rejected/', bank_applications_rejected, name='bank_applications_rejected'),
    
    # Simulateur
    path('simulator/', bank_simulator, name='bank_simulator'),
    # Analytics & AI
    path('analytics/', bank_analytics, name='bank_analytics'),
    path('ai/chat/', bank_ai_chat, name='bank_ai_chat'),
]
