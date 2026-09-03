# backend/scoring/urls_admin.py
"""
URLs Admin TERAS - Routes enrichies
✅ + KYC Admin routes
"""

from django.urls import path
from .views_admin import (
    AdminDashboardView,
    AdminUsersListView,
    AdminUserDetailView,
    AdminAnalyticsView,
    AdminActivitiesView,
    AdminUserSuspendView,
    AdminUserRestoreView,

    # ✅ KYC
    AdminKYCRequestsListView,
    AdminKYCRequestDetailView,
    AdminKYCApproveView,
    AdminKYCRejectView,
)

urlpatterns = [
    # Dashboard
    path('admin/dashboard/', AdminDashboardView.as_view(), name='admin-dashboard'),

    # Users Management
    path('admin/users/', AdminUsersListView.as_view(), name='admin-users-list'),
    path('admin/users/<int:user_id>/', AdminUserDetailView.as_view(), name='admin-user-detail'),
    path('admin/users/<int:user_id>/suspend/', AdminUserSuspendView.as_view(), name='admin-user-suspend'),
    path('admin/users/<int:user_id>/restore/', AdminUserRestoreView.as_view(), name='admin-user-restore'),

    # Analytics
    path('admin/analytics/', AdminAnalyticsView.as_view(), name='admin-analytics'),

    # Activities
    path('admin/activities/', AdminActivitiesView.as_view(), name='admin-activities'),

    # ✅ KYC
    path('admin/kyc/requests/', AdminKYCRequestsListView.as_view(), name='admin-kyc-requests'),
    path('admin/kyc/requests/<int:kyc_id>/', AdminKYCRequestDetailView.as_view(), name='admin-kyc-detail'),
    path('admin/kyc/requests/<int:kyc_id>/approve/', AdminKYCApproveView.as_view(), name='admin-kyc-approve'),
    path('admin/kyc/requests/<int:kyc_id>/reject/', AdminKYCRejectView.as_view(), name='admin-kyc-reject'),
]
