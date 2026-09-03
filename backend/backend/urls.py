# backend/backend/urls.py
"""
Configuration des URLs principales TERAS
✅ AVEC COMPATIBILITÉ pour anciennes et nouvelles URLs
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # ========================================
    # ADMIN DJANGO
    # ========================================
    path('admin/', admin.site.urls),
    
    # ========================================
    # ✅ USERS & AUTHENTICATION (NOUVELLE URL)
    # ========================================
    path('api/users/', include('users.urls')),
    # Routes: /api/users/auth/login/, /api/users/settings/, etc.
    
    # ========================================
    # ✅ COMPATIBILITÉ (ANCIENNE URL)
    # ========================================
    path('api/', include('users.urls')),
    # Routes: /api/auth/login/, /api/health/, etc. (pour compatibilité frontend)
    
    # ========================================
    # SCORING (USER & ADMIN)
    # ========================================
    path('api/scoring/', include('scoring.urls')),
    path('api/scoring/bank/', include('scoring.urls_bank')),
    path('api/scoring/government/', include('scoring.urls_government')),
    path('api/scoring/enterprise/', include('scoring.urls_enterprise')),
    
    # ========================================
    # CHAT
    # ========================================
    path('api/chat/', include('chat.urls')),
    
    # ========================================
    # AI & RAG
    # ========================================
    path('api/ai/', include('ai.urls')),
    
    # ========================================
    # LEGISLATION
    # ========================================
    path('api/legislation/', include('legislation.urls')),
]

# ========================================
# MEDIA & STATIC FILES (DEV)
# ========================================
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
