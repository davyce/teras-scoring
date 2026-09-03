# backend/users/urls.py
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views_auth import (
    CustomTokenObtainPairView, RegisterView, LogoutView,
    MeView, ChangePasswordView,
)
from .views import UserSettingsView, DocumentListView, health_check

urlpatterns = [
    # ── Auth JWT ────────────────────────────────────────────────────────────
    path('auth/login/',            CustomTokenObtainPairView.as_view(), name='login'),
    path('auth/register/',         RegisterView.as_view(),              name='register'),
    path('auth/logout/',           LogoutView.as_view(),                name='logout'),
    path('auth/token/refresh/',    TokenRefreshView.as_view(),          name='token_refresh'),
    path('auth/change-password/',  ChangePasswordView.as_view(),        name='change-password'),

    # ── Profil utilisateur ────────────────────────────────────────────────
    path('auth/me/',               MeView.as_view(),                    name='me'),

    # ── Compatibilité anciennes URLs ──────────────────────────────────────
    path('token/',                 CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/',         TokenRefreshView.as_view(),          name='token_refresh_compat'),

    # ── Autres endpoints user ─────────────────────────────────────────────
    path('settings/',              UserSettingsView.as_view(),          name='user-settings'),
    path('documents/',             DocumentListView.as_view(),          name='documents'),
    path('health/',                health_check,                        name='health'),
]
