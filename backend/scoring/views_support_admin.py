# backend/scoring/views_support_admin.py
"""
TERAS Support System - Vues Admin
Endpoints pour les administrateurs
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import BasePermission
from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta

from .models_support import SupportTicket, TicketMessage

User = get_user_model()


class IsAdminUser(BasePermission):
    """Permission admin"""
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            (request.user.is_staff or getattr(request.user, "user_type", "") == 'admin')
        )


class AdminTicketListView(APIView):
    """
    GET /api/scoring/admin/support/tickets/
    Liste de tous les tickets (avec filtres)
    """
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        status_filter = request.query_params.get('status', None)
        category_filter = request.query_params.get('category', None)
        priority_filter = request.query_params.get('priority', None)
        assigned_filter = request.query_params.get('assigned', None)
        search = request.query_params.get('search', '')
        
        tickets = SupportTicket.objects.select_related('user', 'assigned_to').order_by('-updated_at')
        
        # Filtres
        if status_filter:
            if status_filter == 'open':
                tickets = tickets.filter(status__in=['open', 'in_progress', 'waiting_user'])
            elif status_filter == 'closed':
                tickets = tickets.filter(status__in=['resolved', 'closed'])
            else:
                tickets = tickets.filter(status=status_filter)
        
        if category_filter:
            tickets = tickets.filter(category=category_filter)
        
        if priority_filter:
            tickets = tickets.filter(priority=priority_filter)
        
        if assigned_filter:
            if assigned_filter == 'unassigned':
                tickets = tickets.filter(assigned_to__isnull=True)
            elif assigned_filter == 'me':
                tickets = tickets.filter(assigned_to=request.user)
            else:
                try:
                    tickets = tickets.filter(assigned_to_id=int(assigned_filter))
                except ValueError:
                    pass
        
        if search:
            tickets = tickets.filter(
                Q(ticket_number__icontains=search) |
                Q(subject__icontains=search) |
                Q(user__email__icontains=search) |
                Q(user__username__icontains=search)
            )
        
        data = []
        for t in tickets[:100]:
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
                'is_read': t.is_read_by_admin,
                'message_count': t.message_count,
                'user': {
                    'id': t.user.id,
                    'email': t.user.email,
                    'name': t.user.get_full_name() or t.user.username,
                },
                'assigned_to': {
                    'id': t.assigned_to.id,
                    'name': t.assigned_to.get_full_name() or t.assigned_to.username,
                } if t.assigned_to else None,
                'last_message': {
                    'content': last_msg.content[:100] if last_msg else None,
                    'is_admin': last_msg.is_admin_message if last_msg else False,
                    'created_at': last_msg.created_at.isoformat() if last_msg else None,
                } if last_msg else None,
                'created_at': t.created_at.isoformat(),
                'updated_at': t.updated_at.isoformat(),
            })
        
        return Response({
            'tickets': data,
            'total': tickets.count(),
        })


class AdminTicketStatsView(APIView):
    """
    GET /api/scoring/admin/support/stats/
    Statistiques globales du support
    """
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        today = timezone.now().date()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)
        
        # Totaux par statut
        total = SupportTicket.objects.count()
        open_tickets = SupportTicket.objects.filter(status__in=['open', 'in_progress', 'waiting_user']).count()
        unassigned = SupportTicket.objects.filter(assigned_to__isnull=True, status__in=['open', 'in_progress']).count()
        unread = SupportTicket.objects.filter(is_read_by_admin=False).count()
        
        # Par statut
        by_status = {
            'open': SupportTicket.objects.filter(status='open').count(),
            'in_progress': SupportTicket.objects.filter(status='in_progress').count(),
            'waiting_user': SupportTicket.objects.filter(status='waiting_user').count(),
            'resolved': SupportTicket.objects.filter(status='resolved').count(),
            'closed': SupportTicket.objects.filter(status='closed').count(),
        }
        
        # Par priorité (tickets ouverts)
        by_priority = {
            'urgent': SupportTicket.objects.filter(priority='urgent', status__in=['open', 'in_progress', 'waiting_user']).count(),
            'high': SupportTicket.objects.filter(priority='high', status__in=['open', 'in_progress', 'waiting_user']).count(),
            'medium': SupportTicket.objects.filter(priority='medium', status__in=['open', 'in_progress', 'waiting_user']).count(),
            'low': SupportTicket.objects.filter(priority='low', status__in=['open', 'in_progress', 'waiting_user']).count(),
        }
        
        # Par catégorie
        by_category = {}
        for cat_code, cat_name in SupportTicket.CATEGORY_CHOICES:
            by_category[cat_code] = SupportTicket.objects.filter(category=cat_code).count()
        
        # Nouveaux cette semaine
        new_this_week = SupportTicket.objects.filter(created_at__date__gte=week_ago).count()
        resolved_this_week = SupportTicket.objects.filter(resolved_at__date__gte=week_ago).count()
        
        # Temps de réponse moyen (approximatif)
        # ...
        
        return Response({
            'overview': {
                'total': total,
                'open': open_tickets,
                'unassigned': unassigned,
                'unread': unread,
                'new_this_week': new_this_week,
                'resolved_this_week': resolved_this_week,
            },
            'by_status': by_status,
            'by_priority': by_priority,
            'by_category': by_category,
        })


class AdminTicketDetailView(APIView):
    """
    GET /api/scoring/admin/support/tickets/<ticket_id>/
    Détails d'un ticket
    """
    permission_classes = [IsAdminUser]
    
    def get(self, request, ticket_id):
        ticket = SupportTicket.objects.select_related('user', 'assigned_to').filter(id=ticket_id).first()
        if not ticket:
            return Response({'error': 'Ticket non trouvé'}, status=status.HTTP_404_NOT_FOUND)
        
        # Marquer comme lu par admin
        if not ticket.is_read_by_admin:
            ticket.is_read_by_admin = True
            ticket.save()
        
        # Marquer messages user comme lus
        ticket.messages.filter(is_admin_message=False, is_read=False).update(is_read=True)
        
        # Messages
        messages = []
        for msg in ticket.messages.all():
            messages.append({
                'id': msg.id,
                'content': msg.content,
                'is_admin_message': msg.is_admin_message,
                'sender': {
                    'id': msg.sender.id,
                    'name': msg.sender.get_full_name() or msg.sender.username,
                    'email': msg.sender.email,
                },
                'attachment': msg.attachment.url if msg.attachment else None,
                'is_read': msg.is_read,
                'created_at': msg.created_at.isoformat(),
            })
        
        # Infos user
        user_tickets_count = SupportTicket.objects.filter(user=ticket.user).count()
        
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
                'created_at': ticket.created_at.isoformat(),
                'updated_at': ticket.updated_at.isoformat(),
                'resolved_at': ticket.resolved_at.isoformat() if ticket.resolved_at else None,
                'closed_at': ticket.closed_at.isoformat() if ticket.closed_at else None,
            },
            'user': {
                'id': ticket.user.id,
                'email': ticket.user.email,
                'username': ticket.user.username,
                'name': ticket.user.get_full_name(),
                'phone': getattr(ticket.user, 'phone', ''),
                'region': getattr(ticket.user, 'region', ''),
                'tickets_count': user_tickets_count,
            },
            'assigned_to': {
                'id': ticket.assigned_to.id,
                'name': ticket.assigned_to.get_full_name() or ticket.assigned_to.username,
                'email': ticket.assigned_to.email,
            } if ticket.assigned_to else None,
            'messages': messages,
        })


class AdminTicketReplyView(APIView):
    """
    POST /api/scoring/admin/support/tickets/<ticket_id>/reply/
    Répondre à un ticket (en tant qu'admin)
    """
    permission_classes = [IsAdminUser]
    
    def post(self, request, ticket_id):
        admin = request.user
        
        ticket = SupportTicket.objects.filter(id=ticket_id).first()
        if not ticket:
            return Response({'error': 'Ticket non trouvé'}, status=status.HTTP_404_NOT_FOUND)
        
        content = request.data.get('content', '').strip()
        if not content:
            return Response({'error': 'Le message est requis'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Auto-assigner si pas assigné
        if not ticket.assigned_to:
            ticket.assigned_to = admin
            ticket.save()
        
        # Créer le message
        message = TicketMessage.objects.create(
            ticket=ticket,
            sender=admin,
            content=content,
            is_admin_message=True,
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


class AdminTicketAssignView(APIView):
    """
    POST /api/scoring/admin/support/tickets/<ticket_id>/assign/
    Assigner un ticket à un admin
    """
    permission_classes = [IsAdminUser]
    
    def post(self, request, ticket_id):
        ticket = SupportTicket.objects.filter(id=ticket_id).first()
        if not ticket:
            return Response({'error': 'Ticket non trouvé'}, status=status.HTTP_404_NOT_FOUND)
        
        admin_id = request.data.get('admin_id')
        
        if admin_id:
            admin = User.objects.filter(id=admin_id, is_staff=True).first()
            if not admin:
                admin = User.objects.filter(id=admin_id, user_type='admin').first()
            if not admin:
                return Response({'error': 'Admin non trouvé'}, status=status.HTTP_404_NOT_FOUND)
            ticket.assign_to(admin)
            message = f"Ticket assigné à {admin.get_full_name() or admin.username}"
        else:
            # Auto-assigner à l'admin actuel
            ticket.assign_to(request.user)
            message = "Ticket auto-assigné"
        
        return Response({
            'success': True,
            'message': message,
            'assigned_to': {
                'id': ticket.assigned_to.id,
                'name': ticket.assigned_to.get_full_name() or ticket.assigned_to.username,
            }
        })


class AdminTicketStatusView(APIView):
    """
    POST /api/scoring/admin/support/tickets/<ticket_id>/status/
    Changer le statut d'un ticket
    """
    permission_classes = [IsAdminUser]
    
    def post(self, request, ticket_id):
        ticket = SupportTicket.objects.filter(id=ticket_id).first()
        if not ticket:
            return Response({'error': 'Ticket non trouvé'}, status=status.HTTP_404_NOT_FOUND)
        
        new_status = request.data.get('status')
        valid_statuses = [s[0] for s in SupportTicket.STATUS_CHOICES]
        
        if new_status not in valid_statuses:
            return Response({'error': f'Statut invalide. Valides: {valid_statuses}'}, status=status.HTTP_400_BAD_REQUEST)
        
        old_status = ticket.status
        
        if new_status == 'resolved':
            ticket.mark_resolved()
        elif new_status == 'closed':
            ticket.close()
        else:
            ticket.status = new_status
            ticket.save()
        
        return Response({
            'success': True,
            'message': f'Statut changé de {old_status} à {new_status}',
            'ticket_number': ticket.ticket_number,
            'new_status': ticket.status,
            'new_status_display': ticket.get_status_display(),
        })


class AdminTicketPriorityView(APIView):
    """
    POST /api/scoring/admin/support/tickets/<ticket_id>/priority/
    Changer la priorité d'un ticket
    """
    permission_classes = [IsAdminUser]
    
    def post(self, request, ticket_id):
        ticket = SupportTicket.objects.filter(id=ticket_id).first()
        if not ticket:
            return Response({'error': 'Ticket non trouvé'}, status=status.HTTP_404_NOT_FOUND)
        
        new_priority = request.data.get('priority')
        valid_priorities = [p[0] for p in SupportTicket.PRIORITY_CHOICES]
        
        if new_priority not in valid_priorities:
            return Response({'error': f'Priorité invalide. Valides: {valid_priorities}'}, status=status.HTTP_400_BAD_REQUEST)
        
        ticket.priority = new_priority
        ticket.save()
        
        return Response({
            'success': True,
            'message': f'Priorité changée à {ticket.get_priority_display()}',
            'new_priority': ticket.priority,
        })


class AdminListView(APIView):
    """
    GET /api/scoring/admin/support/admins/
    Liste des admins pour assignation
    """
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        # Récupérer les admins
        admins = User.objects.filter(
            Q(is_staff=True) | Q(user_type='admin')
        ).distinct()
        
        data = []
        for admin in admins:
            assigned_count = SupportTicket.objects.filter(
                assigned_to=admin,
                status__in=['open', 'in_progress', 'waiting_user']
            ).count()
            
            data.append({
                'id': admin.id,
                'username': admin.username,
                'name': admin.get_full_name() or admin.username,
                'email': admin.email,
                'assigned_tickets': assigned_count,
            })
        
        return Response({'admins': data})
