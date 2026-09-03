# backend/support/admin.py
"""
TERAS Support Admin
Interface Django Admin pour gérer les tickets de support
"""

from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from .models import SupportTicket, TicketMessage


class TicketMessageInline(admin.TabularInline):
    """Inline pour afficher les messages dans le ticket"""
    model = TicketMessage
    extra = 0
    fields = ['sender', 'content_preview', 'is_admin_message', 'is_read', 'created_at']
    readonly_fields = ['sender', 'content_preview', 'is_admin_message', 'created_at']
    can_delete = False
    
    def content_preview(self, obj):
        """Aperçu du contenu du message"""
        preview = obj.content[:100]
        if len(obj.content) > 100:
            preview += '...'
        return preview
    content_preview.short_description = 'Contenu'


@admin.register(SupportTicket)
class SupportTicketAdmin(admin.ModelAdmin):
    """Admin pour les tickets de support"""
    
    list_display = [
        'ticket_number', 'user_link', 'subject_short',
        'category_badge', 'priority_badge', 'status_badge',
        'assigned_to', 'message_count', 'created_at'
    ]
    
    list_filter = [
        'status', 'category', 'priority',
        'created_at', 'assigned_to'
    ]
    
    search_fields = [
        'ticket_number', 'subject', 'description',
        'user__username', 'user__email'
    ]
    
    readonly_fields = [
        'ticket_number', 'user', 'message_count',
        'created_at', 'updated_at', 'resolved_at', 'closed_at',
        'is_read_by_admin', 'is_read_by_user'
    ]
    
    inlines = [TicketMessageInline]
    
    fieldsets = (
        ('Informations Ticket', {
            'fields': (
                'ticket_number', 'user', 'subject', 'description',
                'category', 'priority', 'attachment'
            )
        }),
        ('Gestion', {
            'fields': (
                'status', 'assigned_to', 'message_count'
            )
        }),
        ('Suivi Lecture', {
            'fields': (
                'is_read_by_admin', 'is_read_by_user'
            ),
            'classes': ('collapse',)
        }),
        ('Dates', {
            'fields': (
                'created_at', 'updated_at', 'resolved_at', 'closed_at'
            ),
            'classes': ('collapse',)
        }),
    )
    
    date_hierarchy = 'created_at'
    ordering = ['-created_at']
    
    def user_link(self, obj):
        """Lien vers l'utilisateur"""
        url = reverse('admin:users_customuser_change', args=[obj.user.id])
        return format_html('<a href="{}">{}</a>', url, obj.user.username)
    user_link.short_description = 'Utilisateur'
    
    def subject_short(self, obj):
        """Sujet tronqué"""
        if len(obj.subject) > 50:
            return obj.subject[:50] + '...'
        return obj.subject
    subject_short.short_description = 'Sujet'
    
    def category_badge(self, obj):
        """Badge coloré pour catégorie"""
        colors = {
            'account': '#3B82F6',      # Blue
            'credit': '#10B981',       # Green
            'technical': '#F59E0B',    # Orange
            'security': '#EF4444',     # Red
            'score': '#8B5CF6',        # Purple
            'other': '#6B7280'         # Gray
        }
        color = colors.get(obj.category, '#6B7280')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px; font-size: 11px;">{}</span>',
            color,
            obj.get_category_display()
        )
    category_badge.short_description = 'Catégorie'
    
    def priority_badge(self, obj):
        """Badge coloré pour priorité"""
        colors = {
            'low': '#10B981',      # Green
            'medium': '#F59E0B',   # Orange
            'high': '#EF4444',     # Red
            'urgent': '#DC2626'    # Dark Red
        }
        color = colors.get(obj.priority, '#6B7280')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px; font-size: 11px;">{}</span>',
            color,
            obj.get_priority_display()
        )
    priority_badge.short_description = 'Priorité'
    
    def status_badge(self, obj):
        """Badge coloré pour statut"""
        colors = {
            'open': '#F59E0B',           # Orange
            'in_progress': '#3B82F6',    # Blue
            'waiting_user': '#8B5CF6',   # Purple
            'resolved': '#10B981',       # Green
            'closed': '#6B7280'          # Gray
        }
        color = colors.get(obj.status, '#6B7280')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px; font-size: 11px;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = 'Statut'
    
    # Actions groupées
    actions = [
        'mark_in_progress',
        'mark_resolved',
        'mark_closed',
        'assign_to_me'
    ]
    
    def mark_in_progress(self, request, queryset):
        """Marquer comme en cours"""
        count = queryset.update(status=SupportTicket.STATUS_IN_PROGRESS)
        self.message_user(request, f"{count} ticket(s) marqué(s) comme en cours")
    mark_in_progress.short_description = "Marquer comme en cours"
    
    def mark_resolved(self, request, queryset):
        """Marquer comme résolu"""
        from django.utils import timezone
        count = queryset.update(
            status=SupportTicket.STATUS_RESOLVED,
            resolved_at=timezone.now()
        )
        self.message_user(request, f"{count} ticket(s) marqué(s) comme résolu(s)")
    mark_resolved.short_description = "Marquer comme résolu"
    
    def mark_closed(self, request, queryset):
        """Marquer comme fermé"""
        from django.utils import timezone
        count = queryset.update(
            status=SupportTicket.STATUS_CLOSED,
            closed_at=timezone.now()
        )
        self.message_user(request, f"{count} ticket(s) fermé(s)")
    mark_closed.short_description = "Fermer les tickets"
    
    def assign_to_me(self, request, queryset):
        """Assigner à moi"""
        count = queryset.update(assigned_to=request.user)
        self.message_user(request, f"{count} ticket(s) assigné(s) à vous")
    assign_to_me.short_description = "M'assigner les tickets"


@admin.register(TicketMessage)
class TicketMessageAdmin(admin.ModelAdmin):
    """Admin pour les messages de tickets"""
    
    list_display = [
        'ticket_link', 'sender', 'content_preview',
        'message_type', 'is_read', 'created_at'
    ]
    
    list_filter = [
        'is_admin_message', 'is_read', 'created_at'
    ]
    
    search_fields = [
        'ticket__ticket_number', 'sender__username', 'content'
    ]
    
    readonly_fields = [
        'ticket', 'sender', 'created_at'
    ]
    
    date_hierarchy = 'created_at'
    ordering = ['-created_at']
    
    def ticket_link(self, obj):
        """Lien vers le ticket"""
        url = reverse('admin:support_supportticket_change', args=[obj.ticket.id])
        return format_html('<a href="{}">{}</a>', url, obj.ticket.ticket_number)
    ticket_link.short_description = 'Ticket'
    
    def content_preview(self, obj):
        """Aperçu du contenu"""
        preview = obj.content[:80]
        if len(obj.content) > 80:
            preview += '...'
        return preview
    content_preview.short_description = 'Contenu'
    
    def message_type(self, obj):
        """Type de message"""
        if obj.is_admin_message:
            return format_html(
                '<span style="color: #3B82F6; font-weight: bold;">Admin</span>'
            )
        return format_html(
            '<span style="color: #6B7280;">Utilisateur</span>'
        )
    message_type.short_description = 'Type'
