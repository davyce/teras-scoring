# backend/support/apps.py
"""
TERAS Support App Configuration
"""

from django.apps import AppConfig


class SupportConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'support'
    verbose_name = 'Système de Support TERAS'
    
    def ready(self):
        """Initialisation de l'app au démarrage"""
        # Import des signals si nécessaire
        # import support.signals
        pass
