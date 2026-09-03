# backend/credit/apps.py
"""
TERAS Credit App Configuration
"""

from django.apps import AppConfig


class CreditConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'credit'
    verbose_name = 'Système de Crédit TERAS'
    
    def ready(self):
        """Initialisation de l'app au démarrage"""
        # Import des signals si nécessaire
        # import credit.signals
        pass
