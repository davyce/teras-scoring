# backend/support/views.py
"""
TERAS Support Views
API REST pour le système de tickets de support
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Count, Avg, F, ExpressionWrapper, DurationField
from django.utils import timezone
from datetime import timedelta

from .models import SupportTicket, TicketMessage
from .serializers import (
    SupportTicketListSerializer,
    SupportTicketDetailSerializer,
    SupportTicketCreateSerializer,
    SupportTicketUpdateSerializer,
    TicketMessageSerializer,
    TicketMessageCreateSerializer,
    TicketStatsSerializer
)
from .permissions import IsTicketOwnerOrStaff


class SupportTicketViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour les tickets de support
    
    Endpoints:
    - GET /api/support/tickets/ - Liste mes tickets
    - POST /api/support/tickets/ - Créer un ticket
    - GET /api/support/tickets/{id}/ - Détails d'un ticket
    - PATCH /api/support/tickets/{id}/ - Mettre à jour (admin)
    - POST /api/support/tickets/{id}/close/ - Fermer un ticket
    - POST /api/support/tickets/{id}/reopen/ - Rouvrir un ticket
    - POST /api/support/tickets/{id}/reply/ - Répondre à un ticket
    - POST /api/support/tickets/{id}/mark-read/ - Marquer comme lu
    - GET /api/support/tickets/stats/ - Statistiques
    """
    
    permission_classes = [IsAuthenticated, IsTicketOwnerOrStaff]
    
    def get_queryset(self):
        """
        Utilisateur voit uniquement ses tickets
        Admin/Staff voit tous les tickets
        """
        user = self.request.user
        
        if user.is_staff or getattr(user, 'user_type', None) in ['admin', 'support']:
            # Admin voit tout
            queryset = SupportTicket.objects.all()
        else:
            # Utilisateur voit uniquement ses tickets
            queryset = SupportTicket.objects.filter(user=user)
        
        # Préchargement des relations
        queryset = queryset.select_related('user', 'assigned_to')
        queryset = queryset.prefetch_related('messages', 'messages__sender')
        
        # Filtres via query params
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        category_filter = self.request.query_params.get('category')
        if category_filter:
            queryset = queryset.filter(category=category_filter)
        
        priority_filter = self.request.query_params.get('priority')
        if priority_filter:
            queryset = queryset.filter(priority=priority_filter)
        
        # Tri par défaut : tickets ouverts d'abord, puis par date
        return queryset.order_by(
            '-status',  # Open > In Progress > Resolved > Closed
            '-priority',  # High > Medium > Low
            '-updated_at'
        )
    
    def get_serializer_class(self):
        """Choisir le serializer selon l'action"""
        if self.action == 'list':
            return SupportTicketListSerializer
        elif self.action == 'create':
            return SupportTicketCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return SupportTicketUpdateSerializer
        return SupportTicketDetailSerializer
    
    def create(self, request, *args, **kwargs):
        """Créer un nouveau ticket"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        ticket = serializer.save()
        
        # Retourner avec serializer détaillé
        output_serializer = SupportTicketDetailSerializer(ticket)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)
    
    def retrieve(self, request, *args, **kwargs):
        """
        Récupérer un ticket et marquer les messages comme lus
        """
        ticket = self.get_object()
        
        # Marquer messages comme lus selon le type d'utilisateur
        if request.user.is_staff:
            # Admin marque messages utilisateur comme lus
            ticket.messages.filter(
                is_admin_message=False,
                is_read=False
            ).update(is_read=True)
            ticket.is_read_by_admin = True
            ticket.save(update_fields=['is_read_by_admin'])
        else:
            # User marque messages admin comme lus
            ticket.messages.filter(
                is_admin_message=True,
                is_read=False
            ).update(is_read=True)
            ticket.is_read_by_user = True
            ticket.save(update_fields=['is_read_by_user'])
        
        serializer = self.get_serializer(ticket)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def reply(self, request, pk=None):
        """
        Répondre à un ticket
        POST /api/support/tickets/{id}/reply/
        Body: {content, attachment?}
        """
        ticket = self.get_object()
        
        # Vérifier que le ticket n'est pas fermé
        if ticket.status == SupportTicket.STATUS_CLOSED:
            return Response(
                {'error': 'Impossible de répondre à un ticket fermé'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Créer le message
        serializer = TicketMessageCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        message = TicketMessage.objects.create(
            ticket=ticket,
            sender=request.user,
            content=serializer.validated_data['content'],
            attachment=serializer.validated_data.get('attachment'),
            is_admin_message=request.user.is_staff
        )
        
        # Mettre à jour le statut du ticket
        if request.user.is_staff:
            # Admin répond → passer en "in_progress" si ouvert
            if ticket.status == SupportTicket.STATUS_OPEN:
                ticket.status = SupportTicket.STATUS_IN_PROGRESS
            ticket.is_read_by_user = False
        else:
            # User répond → passer en "waiting_user" vers "open"
            if ticket.status == SupportTicket.STATUS_WAITING_USER:
                ticket.status = SupportTicket.STATUS_IN_PROGRESS
            ticket.is_read_by_admin = False
        
        ticket.message_count += 1
        ticket.last_message = message
        ticket.save()
        
        # Retourner le message créé
        output_serializer = TicketMessageSerializer(message)
        return Response({
            'message': 'Réponse ajoutée avec succès',
            'ticket_message': output_serializer.data
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def close(self, request, pk=None):
        """
        Fermer un ticket
        POST /api/support/tickets/{id}/close/
        """
        ticket = self.get_object()
        
        if ticket.status == SupportTicket.STATUS_CLOSED:
            return Response(
                {'error': 'Ce ticket est déjà fermé'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        ticket.status = SupportTicket.STATUS_CLOSED
        ticket.closed_at = timezone.now()
        ticket.save()
        
        serializer = self.get_serializer(ticket)
        return Response({
            'message': 'Ticket fermé avec succès',
            'ticket': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def reopen(self, request, pk=None):
        """
        Rouvrir un ticket fermé
        POST /api/support/tickets/{id}/reopen/
        """
        ticket = self.get_object()
        
        if ticket.status != SupportTicket.STATUS_CLOSED:
            return Response(
                {'error': 'Seul un ticket fermé peut être rouvert'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        ticket.status = SupportTicket.STATUS_OPEN
        ticket.closed_at = None
        ticket.resolved_at = None
        ticket.save()
        
        serializer = self.get_serializer(ticket)
        return Response({
            'message': 'Ticket rouvert avec succès',
            'ticket': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """
        Marquer un ticket comme résolu (admin uniquement)
        POST /api/support/tickets/{id}/resolve/
        """
        if not request.user.is_staff:
            return Response(
                {'error': 'Seul le support peut résoudre un ticket'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        ticket = self.get_object()
        
        if ticket.status == SupportTicket.STATUS_RESOLVED:
            return Response(
                {'error': 'Ce ticket est déjà résolu'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        ticket.status = SupportTicket.STATUS_RESOLVED
        ticket.resolved_at = timezone.now()
        ticket.save()
        
        serializer = self.get_serializer(ticket)
        return Response({
            'message': 'Ticket marqué comme résolu',
            'ticket': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        """
        Assigner un ticket à un agent (admin uniquement)
        POST /api/support/tickets/{id}/assign/
        Body: {assigned_to: user_id}
        """
        if not request.user.is_staff:
            return Response(
                {'error': 'Seul le support peut assigner un ticket'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        ticket = self.get_object()
        assigned_to_id = request.data.get('assigned_to')
        
        if assigned_to_id:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            try:
                assigned_user = User.objects.get(id=assigned_to_id, is_staff=True)
                ticket.assigned_to = assigned_user
                ticket.save()
                
                serializer = self.get_serializer(ticket)
                return Response({
                    'message': f'Ticket assigné à {assigned_user.get_full_name()}',
                    'ticket': serializer.data
                })
            except User.DoesNotExist:
                return Response(
                    {'error': 'Utilisateur introuvable ou non autorisé'},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            # Désassigner
            ticket.assigned_to = None
            ticket.save()
            serializer = self.get_serializer(ticket)
            return Response({
                'message': 'Ticket désassigné',
                'ticket': serializer.data
            })
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Statistiques sur les tickets
        GET /api/support/tickets/stats/
        """
        user = request.user
        
        # Base queryset selon permissions
        if user.is_staff:
            queryset = SupportTicket.objects.all()
        else:
            queryset = SupportTicket.objects.filter(user=user)
        
        # Stats par statut
        total = queryset.count()
        open_count = queryset.filter(status=SupportTicket.STATUS_OPEN).count()
        in_progress = queryset.filter(status=SupportTicket.STATUS_IN_PROGRESS).count()
        waiting_user = queryset.filter(status=SupportTicket.STATUS_WAITING_USER).count()
        resolved = queryset.filter(status=SupportTicket.STATUS_RESOLVED).count()
        closed = queryset.filter(status=SupportTicket.STATUS_CLOSED).count()
        
        # Stats par catégorie
        by_category = dict(
            queryset.values('category').annotate(count=Count('id')).values_list('category', 'count')
        )
        
        # Stats par priorité
        by_priority = dict(
            queryset.values('priority').annotate(count=Count('id')).values_list('priority', 'count')
        )
        
        # Temps moyen de résolution (tickets résolus)
        resolved_tickets = queryset.filter(resolved_at__isnull=False)
        if resolved_tickets.exists():
            avg_resolution = resolved_tickets.annotate(
                resolution_time=ExpressionWrapper(
                    F('resolved_at') - F('created_at'),
                    output_field=DurationField()
                )
            ).aggregate(avg=Avg('resolution_time'))['avg']
            avg_resolution_hours = avg_resolution.total_seconds() / 3600 if avg_resolution else 0
        else:
            avg_resolution_hours = 0
        
        # Temps moyen première réponse (admin)
        tickets_with_admin_response = queryset.filter(
            messages__is_admin_message=True
        ).distinct()
        
        if tickets_with_admin_response.exists():
            # Approximation simple
            avg_response_hours = 2.5  # TODO: Calculer vraiment
        else:
            avg_response_hours = 0
        
        stats_data = {
            'total': total,
            'open': open_count,
            'in_progress': in_progress,
            'waiting_user': waiting_user,
            'resolved': resolved,
            'closed': closed,
            'by_category': by_category,
            'by_priority': by_priority,
            'avg_resolution_time_hours': round(avg_resolution_hours, 1),
            'avg_response_time_hours': round(avg_response_hours, 1)
        }
        
        serializer = TicketStatsSerializer(stats_data)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def categories(self, request):
        """
        Liste des catégories disponibles
        GET /api/support/tickets/categories/
        """
        categories = [
            {'value': choice[0], 'label': choice[1]}
            for choice in SupportTicket.CATEGORY_CHOICES
        ]
        return Response(categories)
    
    @action(detail=False, methods=['get'])
    def priorities(self, request):
        """
        Liste des priorités disponibles
        GET /api/support/tickets/priorities/
        """
        priorities = [
            {'value': choice[0], 'label': choice[1]}
            for choice in SupportTicket.PRIORITY_CHOICES
        ]
        return Response(priorities)
