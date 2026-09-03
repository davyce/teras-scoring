# users/auth_urls.py
"""
URLs d'authentification JWT pour TERAS
Inclut dans users/urls.py via path("", include("users.auth_urls"))
"""

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views_auth import CustomTokenObtainPairView

urlpatterns = [
    # Login CUSTOM avec retour user_type (NOUVEAU)
    path("auth/login/", CustomTokenObtainPairView.as_view(), name="custom_login"),
    
    # Login JWT standard (ANCIEN - garde pour compatibilité)
    path("token/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    
    # Refresh token
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]
