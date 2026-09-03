# backend/scoring/urls_user.py
"""
TERAS IA APP - URLs pour l'interface User (Individual)
✅ + KYC endpoints
"""

from django.urls import path
from .views_user import (
    UserDashboardView,
    UserScoreDetailView,
    UserRecommendationsView,
    UserDocumentsView,
    UserHistoryView,
    UserProfileView,
    UserTransactionsView,
    UserCreditSimulationView,
    ChangePasswordView,
    BanquesCongoView,
    # ✅ KYC
    UserKYCSubmitView,
    UserKYCStatusView,
    UserKYCListView,
)

app_name = 'user'

urlpatterns = [
    path('dashboard/', UserDashboardView.as_view(), name='dashboard'),
    path('score/detail/', UserScoreDetailView.as_view(), name='score-detail'),
    path('recommendations/', UserRecommendationsView.as_view(), name='recommendations'),
    path('documents/', UserDocumentsView.as_view(), name='documents'),
    path('history/', UserHistoryView.as_view(), name='history'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('transactions/', UserTransactionsView.as_view(), name='transactions'),
    path('credit/simulate/', UserCreditSimulationView.as_view(), name='credit-simulate'),

    # ✅ Nouveaux (déjà présents dans ton urls.py principal)
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('banques/', BanquesCongoView.as_view(), name='banques'),

    # ✅ KYC
    path('kyc/submit/', UserKYCSubmitView.as_view(), name='kyc-submit'),
    path('kyc/status/', UserKYCStatusView.as_view(), name='kyc-status'),
    path('kyc/requests/', UserKYCListView.as_view(), name='kyc-requests'),
]
