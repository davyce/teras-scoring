# backend/credit/utils.py
"""
Utilitaires crédit TERAS — réexporte depuis utils/
"""
from .utils.crm_calculator import get_crm_with_adjustments, calculate_crm
from .utils.loan_calculator import (
    calculate_loan_details, calculate_monthly_payment,
    is_loan_sustainable, calculate_max_sustainable_amount
)
from .utils.eligibility_checker import get_all_eligible_products, check_product_eligibility

__all__ = [
    "get_crm_with_adjustments", "calculate_crm",
    "calculate_loan_details", "calculate_monthly_payment",
    "is_loan_sustainable", "calculate_max_sustainable_amount",
    "get_all_eligible_products", "check_product_eligibility",
]
