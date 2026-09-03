# backend/scoring/views_bank.py
"""
Point d'entrée pour toutes les vues Bank
Combine views_bank_part1 et views_bank_part2
"""

from .views_bank_part1 import (
    IsBankUser,
    StandardPagination,
    bank_dashboard,
    bank_clients_list,
    bank_client_create,
    bank_client_detail,
    bank_client_refresh_passport,
    bank_client_update,
    bank_enterprises_list,
    bank_enterprise_create,
    bank_enterprise_detail,
    bank_enterprise_refresh_passport,
    bank_enterprise_update,
)

from .views_bank_part2 import (
    bank_analytics,
    bank_ai_chat,
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

__all__ = [
    'IsBankUser',
    'StandardPagination',
    'bank_dashboard',
    'bank_clients_list',
    'bank_client_create',
    'bank_client_detail',
    'bank_client_refresh_passport',
    'bank_client_update',
    'bank_enterprises_list',
    'bank_enterprise_create',
    'bank_enterprise_detail',
    'bank_enterprise_refresh_passport',
    'bank_enterprise_update',
    'bank_products_list',
    'bank_product_create',
    'bank_product_detail',
    'bank_product_update',
    'bank_product_delete',
    'bank_applications_list',
    'bank_application_submit',
    'bank_application_detail',
    'bank_application_review',
    'bank_applications_pending',
    'bank_applications_approved',
    'bank_applications_rejected',
    'bank_simulator',
    'bank_analytics',
    'bank_ai_chat',
]
