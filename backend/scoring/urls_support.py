# backend/scoring/urls_support.py
"""
TERAS Support System - URLs
Routes pour le système de tickets support
"""

from django.urls import path

from .views_support_user import (
    UserTicketListView,
    UserTicketCreateView,
    UserTicketDetailView,
    UserTicketReplyView,
    UserTicketCloseView,
    UserTicketReopenView,
)

from .views_support_admin import (
    AdminTicketListView,
    AdminTicketStatsView,
    AdminTicketDetailView,
    AdminTicketReplyView,
    AdminTicketAssignView,
    AdminTicketStatusView,
    AdminTicketPriorityView,
    AdminListView,
)


# URLs User Support
user_support_urlpatterns = [
    path('tickets/', UserTicketListView.as_view(), name='user-tickets-list'),
    path('tickets/create/', UserTicketCreateView.as_view(), name='user-tickets-create'),
    path('tickets/<int:ticket_id>/', UserTicketDetailView.as_view(), name='user-tickets-detail'),
    path('tickets/<int:ticket_id>/reply/', UserTicketReplyView.as_view(), name='user-tickets-reply'),
    path('tickets/<int:ticket_id>/close/', UserTicketCloseView.as_view(), name='user-tickets-close'),
    path('tickets/<int:ticket_id>/reopen/', UserTicketReopenView.as_view(), name='user-tickets-reopen'),
]


# URLs Admin Support
admin_support_urlpatterns = [
    path('tickets/', AdminTicketListView.as_view(), name='admin-tickets-list'),
    path('stats/', AdminTicketStatsView.as_view(), name='admin-tickets-stats'),
    path('admins/', AdminListView.as_view(), name='admin-list'),
    path('tickets/<int:ticket_id>/', AdminTicketDetailView.as_view(), name='admin-tickets-detail'),
    path('tickets/<int:ticket_id>/reply/', AdminTicketReplyView.as_view(), name='admin-tickets-reply'),
    path('tickets/<int:ticket_id>/assign/', AdminTicketAssignView.as_view(), name='admin-tickets-assign'),
    path('tickets/<int:ticket_id>/status/', AdminTicketStatusView.as_view(), name='admin-tickets-status'),
    path('tickets/<int:ticket_id>/priority/', AdminTicketPriorityView.as_view(), name='admin-tickets-priority'),
]


"""
========================================
ENDPOINTS DISPONIBLES
========================================

USER SUPPORT (/api/scoring/user/support/):
------------------------------------------
GET    /tickets/                    Liste des tickets de l'utilisateur
POST   /tickets/create/             Créer un nouveau ticket
GET    /tickets/<id>/               Détails d'un ticket
POST   /tickets/<id>/reply/         Répondre à un ticket
POST   /tickets/<id>/close/         Clôturer un ticket
POST   /tickets/<id>/reopen/        Rouvrir un ticket

ADMIN SUPPORT (/api/scoring/admin/support/):
--------------------------------------------
GET    /tickets/                    Liste de tous les tickets
GET    /stats/                      Statistiques globales
GET    /admins/                     Liste des admins (pour assignation)
GET    /tickets/<id>/               Détails d'un ticket
POST   /tickets/<id>/reply/         Répondre à un ticket
POST   /tickets/<id>/assign/        Assigner à un admin
POST   /tickets/<id>/status/        Changer le statut
POST   /tickets/<id>/priority/      Changer la priorité
"""
