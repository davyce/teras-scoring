# backend/ai/apps.py
"""
TERAS AI App Configuration
"""

from django.apps import AppConfig


class AiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'ai'
    verbose_name = 'TERAS AI & RAG'
    
    def ready(self):
        """Actions au démarrage de l'app"""
        pass
