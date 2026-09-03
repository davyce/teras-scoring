# backend/scoring/models_support.py
"""
TERAS Support Models - Wrapper
Ce fichier sert de pont entre l'ancien système (scoring) et le nouveau (support)
Il réexporte simplement les modèles du module support
"""

# Importer les modèles depuis le nouveau module support
from support.models import SupportTicket, TicketMessage

# Réexporter pour compatibilité
__all__ = ['SupportTicket', 'TicketMessage']
