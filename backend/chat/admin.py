"""
TERAS Chat Admin Interface
Interface d'administration Django pour le chatbot avec design moderne et coloré
"""

from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Count, Avg
from django.utils import timezone
from datetime import timedelta
import csv
from django.http import HttpResponse
from .models import ChatLog, ChatSession, ChatFeedback, CommonQuestion


@admin.register(ChatLog)
class ChatLogAdmin(admin.ModelAdmin):
    """
    Interface admin pour les logs de conversation avec badges colorés
    """
    list_display = [
        'id',
        'user_link',
        'context_badge',
        'message_preview',
        'timestamp',
        'tokens_used',
        'response_time_display',
        'feedback_stars'
    ]

    list_filter = [
        'context',
        'timestamp',
        'user_feedback',
        'model_version'
    ]

    search_fields = [
        'user__username',
        'user__email',
        'user_message',
        'assistant_response'
    ]

    readonly_fields = [
        'timestamp',
        'full_conversation_display',
        'tokens_used',
        'response_time_ms',
        'model_version'
    ]

    date_hierarchy = 'timestamp'

    list_per_page = 50

    actions = ['mark_helpful', 'export_to_csv']

    fieldsets = (
        ('Utilisateur', {
            'fields': ('user', 'context', 'timestamp')
        }),
        ('Conversation', {
            'fields': ('full_conversation_display',),
            'classes': ('wide',)
        }),
        ('Métriques', {
            'fields': ('tokens_used', 'response_time_ms', 'model_version', 'user_feedback'),
            'classes': ('collapse',)
        }),
        ('Métadonnées', {
            'fields': ('session_id', 'metadata'),
            'classes': ('collapse',)
        }),
    )

    def user_link(self, obj):
        """Lien vers l'utilisateur avec icône"""
        return format_html(
            '<a href="/admin/users/customuser/{}/change/" style="text-decoration: none;">'
            '👤 <strong>{}</strong></a>',
            obj.user.id,
            obj.user.username
        )

    user_link.short_description = 'Utilisateur'

    def context_badge(self, obj):
        """Badge coloré pour le contexte"""
        colors = {
            'government': '#10b981',  # Green
            'admin': '#3b82f6',  # Blue
            'enterprise': '#8b5cf6',  # Purple
            'individual': '#f59e0b'  # Orange
        }
        color = colors.get(obj.context, '#6b7280')

        return format_html(
            '<span style="background-color: {}; color: white; padding: 4px 12px; '
            'border-radius: 12px; font-size: 11px; font-weight: 600; '
            'text-transform: uppercase; letter-spacing: 0.5px;">{}</span>',
            color,
            obj.get_context_display()
        )

    context_badge.short_description = 'Contexte'

    def message_preview(self, obj):
        """Aperçu du message avec style"""
        preview = obj.user_message[:60]
        if len(obj.user_message) > 60:
            preview += '...'

        return format_html(
            '<div style="max-width: 300px; font-size: 13px; color: #374151;">'
            '💬 {}</div>',
            preview
        )

    message_preview.short_description = 'Message'

    def response_time_display(self, obj):
        """Affichage du temps de réponse avec couleur"""
        ms = obj.response_time_ms

        if ms < 1000:
            color = '#10b981'  # Vert - rapide
            icon = '⚡'
        elif ms < 3000:
            color = '#f59e0b'  # Orange - moyen
            icon = '⏱️'
        else:
            color = '#ef4444'  # Rouge - lent
            icon = '🐌'

        return format_html(
            '<span style="color: {}; font-weight: 600;">{} {}ms</span>',
            color,
            icon,
            ms
        )

    response_time_display.short_description = 'Temps'

    def feedback_stars(self, obj):
        """Affichage des étoiles de feedback"""
        if obj.user_feedback:
            stars = '⭐' * obj.user_feedback
            return format_html('<span style="font-size: 16px;">{}</span>', stars)
        return format_html('<span style="color: #9ca3af;">Pas de feedback</span>')

    feedback_stars.short_description = 'Feedback'

    def full_conversation_display(self, obj):
        """Affichage complet de la conversation avec style"""
        return format_html(
            '<div style="background: #f9fafb; padding: 20px; border-radius: 8px; '
            'border: 1px solid #e5e7eb;">'

            '<div style="margin-bottom: 20px;">'
            '<div style="background: #3b82f6; color: white; padding: 8px 12px; '
            'border-radius: 6px 6px 0 0; font-weight: 600;">👤 Utilisateur</div>'
            '<div style="background: white; padding: 15px; border: 1px solid #3b82f6; '
            'border-top: none; border-radius: 0 0 6px 6px; white-space: pre-wrap;">{}</div>'
            '</div>'

            '<div>'
            '<div style="background: #10b981; color: white; padding: 8px 12px; '
            'border-radius: 6px 6px 0 0; font-weight: 600;">🤖 Assistant IA</div>'
            '<div style="background: white; padding: 15px; border: 1px solid #10b981; '
            'border-top: none; border-radius: 0 0 6px 6px; white-space: pre-wrap;">{}</div>'
            '</div>'

            '</div>',
            obj.user_message,
            obj.assistant_response
        )

    full_conversation_display.short_description = 'Conversation complète'

    def mark_helpful(self, request, queryset):
        """Action pour marquer comme utile (5 étoiles)"""
        updated = queryset.update(user_feedback=5)
        self.message_user(request, f'{updated} conversations marquées comme utiles (⭐⭐⭐⭐⭐)')

    mark_helpful.short_description = '⭐ Marquer comme utile (5 étoiles)'

    def export_to_csv(self, request, queryset):
        """Export des conversations en CSV"""
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="chat_logs.csv"'

        writer = csv.writer(response)
        writer.writerow([
            'ID', 'Utilisateur', 'Email', 'Contexte', 'Message',
            'Réponse', 'Timestamp', 'Tokens', 'Temps (ms)', 'Feedback'
        ])

        for log in queryset:
            writer.writerow([
                log.id,
                log.user.username,
                log.user.email,
                log.context,
                log.user_message,
                log.assistant_response,
                log.timestamp,
                log.tokens_used,
                log.response_time_ms,
                log.user_feedback or 'N/A'
            ])

        return response

    export_to_csv.short_description = '📥 Exporter en CSV'


@admin.register(ChatSession)
class ChatSessionAdmin(admin.ModelAdmin):
    """
    Interface admin pour les sessions de chat
    """
    list_display = [
        'session_id_short',
        'user_link',
        'context_badge',
        'status_badge',
        'total_messages',
        'total_tokens',
        'started_at',
        'duration_display'
    ]

    list_filter = [
        'context',
        'is_active',
        'started_at'
    ]

    search_fields = [
        'session_id',
        'user__username',
        'user__email'
    ]

    readonly_fields = [
        'session_id',
        'started_at',
        'last_activity',
        'messages_list'
    ]

    def session_id_short(self, obj):
        """ID de session raccourci"""
        return format_html(
            '<code style="background: #f3f4f6; padding: 4px 8px; '
            'border-radius: 4px; font-size: 12px;">{}</code>',
            obj.session_id[:12] + '...'
        )

    session_id_short.short_description = 'Session ID'

    def user_link(self, obj):
        """Lien vers l'utilisateur"""
        return format_html(
            '<a href="/admin/users/customuser/{}/change/">'
            '👤 {}</a>',
            obj.user.id,
            obj.user.username
        )

    user_link.short_description = 'Utilisateur'

    def context_badge(self, obj):
        """Badge coloré pour le contexte"""
        colors = {
            'government': '#10b981',
            'admin': '#3b82f6',
            'enterprise': '#8b5cf6',
            'individual': '#f59e0b'
        }
        color = colors.get(obj.context, '#6b7280')

        return format_html(
            '<span style="background: {}; color: white; padding: 4px 10px; '
            'border-radius: 10px; font-size: 11px; font-weight: 600;">{}</span>',
            color,
            obj.get_context_display()
        )

    context_badge.short_description = 'Contexte'

    def status_badge(self, obj):
        """Badge de statut actif/inactif"""
        if obj.is_active:
            return format_html(
                '<span style="color: #10b981; font-weight: 600;">🟢 Active</span>'
            )
        return format_html(
            '<span style="color: #6b7280; font-weight: 600;">⚫ Inactive</span>'
        )

    status_badge.short_description = 'Statut'

    def duration_display(self, obj):
        """Affichage de la durée"""
        duration = obj.get_duration()
        hours = int(duration // 3600)
        minutes = int((duration % 3600) // 60)
        seconds = int(duration % 60)

        if hours > 0:
            text = f'{hours}h {minutes}m'
        elif minutes > 0:
            text = f'{minutes}m {seconds}s'
        else:
            text = f'{seconds}s'

        return format_html(
            '<span style="font-family: monospace; color: #6b7280;">⏱️ {}</span>',
            text
        )

    duration_display.short_description = 'Durée'

    def messages_list(self, obj):
        """Liste des 5 premiers messages"""
        logs = obj.get_logs()[:5]

        html = '<div style="background: #f9fafb; padding: 15px; border-radius: 8px;">'

        for log in logs:
            preview = log.user_message[:50]
            if len(log.user_message) > 50:
                preview += '...'

            html += f'''
            <div style="margin-bottom: 10px; padding: 10px; background: white; 
                        border-left: 3px solid #3b82f6; border-radius: 4px;">
                <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">
                    {log.timestamp.strftime('%H:%M:%S')}
                </div>
                <div style="color: #374151;">💬 {preview}</div>
            </div>
            '''

        total = obj.total_messages
        if total > 5:
            html += f'<div style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 10px;">... et {total - 5} autres messages</div>'

        html += '</div>'

        return format_html(html)

    messages_list.short_description = 'Messages'


@admin.register(ChatFeedback)
class ChatFeedbackAdmin(admin.ModelAdmin):
    """
    Interface admin pour les feedbacks
    """
    list_display = [
        'id',
        'rating_stars',
        'user_name',
        'conversation_preview',
        'accuracy_badge',
        'helpful_badge',
        'clear_badge',
        'created_at'
    ]

    list_filter = [
        'rating',
        'is_accurate',
        'is_helpful',
        'is_clear',
        'created_at'
    ]

    search_fields = [
        'chat_log__user__username',
        'comment'
    ]

    readonly_fields = ['chat_log', 'created_at']

    def rating_stars(self, obj):
        """Affichage des étoiles"""
        stars = '⭐' * obj.rating
        return format_html('<span style="font-size: 18px;">{}</span>', stars)

    rating_stars.short_description = 'Note'

    def user_name(self, obj):
        """Nom de l'utilisateur"""
        return obj.chat_log.user.username

    user_name.short_description = 'Utilisateur'

    def conversation_preview(self, obj):
        """Aperçu de la conversation"""
        preview = obj.chat_log.user_message[:40]
        if len(obj.chat_log.user_message) > 40:
            preview += '...'
        return format_html('<span style="color: #6b7280;">💬 {}</span>', preview)

    conversation_preview.short_description = 'Conversation'

    def accuracy_badge(self, obj):
        """Badge précision"""
        if obj.is_accurate:
            return format_html('<span style="color: #10b981;">✓ Précis</span>')
        return format_html('<span style="color: #ef4444;">✗ Imprécis</span>')

    accuracy_badge.short_description = 'Précision'

    def helpful_badge(self, obj):
        """Badge utilité"""
        if obj.is_helpful:
            return format_html('<span style="color: #10b981;">✓ Utile</span>')
        return format_html('<span style="color: #ef4444;">✗ Pas utile</span>')

    helpful_badge.short_description = 'Utilité'

    def clear_badge(self, obj):
        """Badge clarté"""
        if obj.is_clear:
            return format_html('<span style="color: #10b981;">✓ Clair</span>')
        return format_html('<span style="color: #ef4444;">✗ Confus</span>')

    clear_badge.short_description = 'Clarté'


@admin.register(CommonQuestion)
class CommonQuestionAdmin(admin.ModelAdmin):
    """
    Interface admin pour les questions fréquentes
    """
    list_display = [
        'id',
        'category_badge',
        'question_preview',
        'usage_count_display',
        'status_badge',
        'updated_at'
    ]

    list_filter = [
        'category',
        'is_active',
        'created_at'
    ]

    search_fields = [
        'question',
        'suggested_response'
    ]

    readonly_fields = ['usage_count', 'created_at', 'updated_at']

    actions = ['activate', 'deactivate', 'reset_usage_count']

    def category_badge(self, obj):
        """Badge de catégorie coloré"""
        colors = {
            'scores': '#3b82f6',
            'reports': '#8b5cf6',
            'regions': '#10b981',
            'sectors': '#f59e0b',
            'alerts': '#ef4444',
            'enterprise': '#06b6d4',
            'general': '#6b7280'
        }
        color = colors.get(obj.category, '#6b7280')

        return format_html(
            '<span style="background: {}; color: white; padding: 4px 10px; '
            'border-radius: 10px; font-size: 11px; font-weight: 600;">{}</span>',
            color,
            obj.get_category_display()
        )

    category_badge.short_description = 'Catégorie'

    def question_preview(self, obj):
        """Aperçu de la question"""
        preview = obj.question[:60]
        if len(obj.question) > 60:
            preview += '...'
        return format_html(
            '<div style="color: #374151; font-weight: 500;">❓ {}</div>',
            preview
        )

    question_preview.short_description = 'Question'

    def usage_count_display(self, obj):
        """Compteur d'utilisation avec style"""
        if obj.usage_count > 100:
            color = '#10b981'
            icon = '🔥'
        elif obj.usage_count > 50:
            color = '#f59e0b'
            icon = '⭐'
        else:
            color = '#6b7280'
            icon = '📊'

        return format_html(
            '<span style="color: {}; font-weight: 600; font-family: monospace;">'
            '{} {} fois</span>',
            color,
            icon,
            obj.usage_count
        )

    usage_count_display.short_description = 'Utilisations'

    def status_badge(self, obj):
        """Badge de statut"""
        if obj.is_active:
            return format_html(
                '<span style="background: #10b981; color: white; padding: 4px 10px; '
                'border-radius: 10px; font-size: 11px; font-weight: 600;">✓ ACTIVE</span>'
            )
        return format_html(
            '<span style="background: #6b7280; color: white; padding: 4px 10px; '
            'border-radius: 10px; font-size: 11px; font-weight: 600;">✗ INACTIVE</span>'
        )

    status_badge.short_description = 'Statut'

    def activate(self, request, queryset):
        """Activer les questions"""
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} questions activées')

    activate.short_description = '✓ Activer'

    def deactivate(self, request, queryset):
        """Désactiver les questions"""
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} questions désactivées')

    deactivate.short_description = '✗ Désactiver'

    def reset_usage_count(self, request, queryset):
        """Réinitialiser le compteur"""
        updated = queryset.update(usage_count=0)
        self.message_user(request, f'Compteurs réinitialisés pour {updated} questions')

    reset_usage_count.short_description = '🔄 Réinitialiser compteur'


# Configuration du site admin
admin.site.site_header = "TERAS IA - Administration"
admin.site.site_title = "TERAS Admin"
admin.site.index_title = "Tableau de bord administrateur"