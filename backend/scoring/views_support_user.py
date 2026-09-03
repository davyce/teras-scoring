# backend/scoring/views_support_user.py
"""
TERAS Support System - Vues User
Endpoints pour les utilisateurs
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.utils import timezone

from .models_support import SupportTicket, TicketMessage


class UserTicketListView(APIView):
    """
    GET /api/scoring/user/support/tickets/
    Liste des tickets de l'utilisateur connecté
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        status_filter = request.query_params.get('status', None)
        
        tickets = SupportTicket.objects.filter(user=user).order_by('-updated_at')
        
        if status_filter:
            if status_filter == 'open':
                tickets = tickets.filter(status__in=['open', 'in_progress', 'waiting_user'])
            elif status_filter == 'closed':
                tickets = tickets.filter(status__in=['resolved', 'closed'])
            else:
                tickets = tickets.filter(status=status_filter)
        
        data = []
        for t in tickets[:50]:
            last_msg = t.last_message
            data.append({
                'id': t.id,
                'ticket_number': t.ticket_number,
                'subject': t.subject,
                'category': t.category,
                'category_display': t.get_category_display(),
                'priority': t.priority,
                'priority_display': t.get_priority_display(),
                'status': t.status,
                'status_display': t.get_status_display(),
                'is_read': t.is_read_by_user,
                'message_count': t.message_count,
                'last_message': {
                    'content': last_msg.content[:100] if last_msg else None,
                    'is_admin': last_msg.is_admin_message if last_msg else False,
                    'created_at': last_msg.created_at.isoformat() if last_msg else None,
                } if last_msg else None,
                'created_at': t.created_at.isoformat(),
                'updated_at': t.updated_at.isoformat(),
            })
        
        # Stats
        stats = {
            'total': SupportTicket.objects.filter(user=user).count(),
            'open': SupportTicket.objects.filter(user=user, status__in=['open', 'in_progress', 'waiting_user']).count(),
            'resolved': SupportTicket.objects.filter(user=user, status='resolved').count(),
            'closed': SupportTicket.objects.filter(user=user, status='closed').count(),
            'unread': SupportTicket.objects.filter(user=user, is_read_by_user=False).count(),
        }
        
        return Response({
            'tickets': data,
            'stats': stats,
        })


class UserTicketCreateView(APIView):
    """
    POST /api/scoring/user/support/tickets/create/
    Créer un nouveau ticket
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        user = request.user
        
        subject = request.data.get('subject', '').strip()
        description = request.data.get('description', '').strip()
        category = request.data.get('category', SupportTicket.CATEGORY_GENERAL)
        priority = request.data.get('priority', SupportTicket.PRIORITY_MEDIUM)
        
        # Validation
        if not subject:
            return Response({'error': 'Le sujet est requis'}, status=status.HTTP_400_BAD_REQUEST)
        if not description:
            return Response({'error': 'La description est requise'}, status=status.HTTP_400_BAD_REQUEST)
        if len(subject) > 200:
            return Response({'error': 'Le sujet ne doit pas dépasser 200 caractères'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Vérifier catégorie valide
        valid_categories = [c[0] for c in SupportTicket.CATEGORY_CHOICES]
        if category not in valid_categories:
            category = SupportTicket.CATEGORY_GENERAL
        
        # Créer le ticket
        ticket = SupportTicket.objects.create(
            user=user,
            subject=subject,
            description=description,
            category=category,
            priority=priority,
        )
        
        # Gérer pièce jointe si présente
        attachment = request.FILES.get('attachment')
        if attachment:
            ticket.attachment = attachment
            ticket.save()
        
        return Response({
            'success': True,
            'message': 'Ticket créé avec succès',
            'ticket': {
                'id': ticket.id,
                'ticket_number': ticket.ticket_number,
                'subject': ticket.subject,
                'status': ticket.status,
                'created_at': ticket.created_at.isoformat(),
            }
        }, status=status.HTTP_201_CREATED)


class UserTicketDetailView(APIView):
    """
    GET /api/scoring/user/support/tickets/<ticket_id>/
    Détails d'un ticket avec messages
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, ticket_id):
        user = request.user
        
        ticket = SupportTicket.objects.filter(id=ticket_id, user=user).first()
        if not ticket:
            return Response({'error': 'Ticket non trouvé'}, status=status.HTTP_404_NOT_FOUND)
        
        # Marquer comme lu par l'utilisateur
        if not ticket.is_read_by_user:
            ticket.is_read_by_user = True
            ticket.save()
        
        # Marquer les messages admin comme lus
        ticket.messages.filter(is_admin_message=True, is_read=False).update(is_read=True)
        
        # Messages
        messages = []
        for msg in ticket.messages.all():
            messages.append({
                'id': msg.id,
                'content': msg.content,
                'is_admin_message': msg.is_admin_message,
                'sender_name': msg.sender.get_full_name() or msg.sender.username,
                'attachment': msg.attachment.url if msg.attachment else None,
                'created_at': msg.created_at.isoformat(),
            })
        
        return Response({
            'ticket': {
                'id': ticket.id,
                'ticket_number': ticket.ticket_number,
                'subject': ticket.subject,
                'description': ticket.description,
                'category': ticket.category,
                'category_display': ticket.get_category_display(),
                'priority': ticket.priority,
                'priority_display': ticket.get_priority_display(),
                'status': ticket.status,
                'status_display': ticket.get_status_display(),
                'attachment': ticket.attachment.url if ticket.attachment else None,
                'assigned_to': {
                    'id': ticket.assigned_to.id,
                    'name': ticket.assigned_to.get_full_name() or ticket.assigned_to.username,
                } if ticket.assigned_to else None,
                'created_at': ticket.created_at.isoformat(),
                'updated_at': ticket.updated_at.isoformat(),
                'resolved_at': ticket.resolved_at.isoformat() if ticket.resolved_at else None,
            },
            'messages': messages,
        })


class UserTicketReplyView(APIView):
    """
    POST /api/scoring/user/support/tickets/<ticket_id>/reply/
    Répondre à un ticket
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, ticket_id):
        user = request.user
        
        ticket = SupportTicket.objects.filter(id=ticket_id, user=user).first()
        if not ticket:
            return Response({'error': 'Ticket non trouvé'}, status=status.HTTP_404_NOT_FOUND)
        
        if ticket.status == SupportTicket.STATUS_CLOSED:
            return Response({'error': 'Ce ticket est clôturé. Veuillez en créer un nouveau.'}, status=status.HTTP_400_BAD_REQUEST)
        
        content = request.data.get('content', '').strip()
        if not content:
            return Response({'error': 'Le message est requis'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Créer le message
        message = TicketMessage.objects.create(
            ticket=ticket,
            sender=user,
            content=content,
            is_admin_message=False,
        )
        
        # Gérer pièce jointe
        attachment = request.FILES.get('attachment')
        if attachment:
            message.attachment = attachment
            message.save()
        
        return Response({
            'success': True,
            'message': {
                'id': message.id,
                'content': message.content,
                'created_at': message.created_at.isoformat(),
            }
        }, status=status.HTTP_201_CREATED)


class UserTicketCloseView(APIView):
    """
    POST /api/scoring/user/support/tickets/<ticket_id>/close/
    Clôturer un ticket (par l'utilisateur)
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, ticket_id):
        user = request.user
        
        ticket = SupportTicket.objects.filter(id=ticket_id, user=user).first()
        if not ticket:
            return Response({'error': 'Ticket non trouvé'}, status=status.HTTP_404_NOT_FOUND)
        
        if ticket.status == SupportTicket.STATUS_CLOSED:
            return Response({'error': 'Ce ticket est déjà clôturé'}, status=status.HTTP_400_BAD_REQUEST)
        
        ticket.close()
        
        return Response({
            'success': True,
            'message': 'Ticket clôturé',
            'ticket_number': ticket.ticket_number,
        })


class UserTicketReopenView(APIView):
    """
    POST /api/scoring/user/support/tickets/<ticket_id>/reopen/
    Rouvrir un ticket clôturé
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, ticket_id):
        user = request.user
        
        ticket = SupportTicket.objects.filter(id=ticket_id, user=user).first()
        if not ticket:
            return Response({'error': 'Ticket non trouvé'}, status=status.HTTP_404_NOT_FOUND)
        
        if ticket.status not in [SupportTicket.STATUS_RESOLVED, SupportTicket.STATUS_CLOSED]:
            return Response({'error': 'Seuls les tickets résolus/clôturés peuvent être rouverts'}, status=status.HTTP_400_BAD_REQUEST)
        
        reason = request.data.get('reason', '').strip()
        
        ticket.reopen()
        
        # Ajouter un message expliquant la réouverture
        if reason:
            TicketMessage.objects.create(
                ticket=ticket,
                sender=user,
                content=f"[Ticket rouvert] {reason}",
                is_admin_message=False,
            )
        
        return Response({
            'success': True,
            'message': 'Ticket rouvert',
            'ticket_number': ticket.ticket_number,
        })
