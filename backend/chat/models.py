"""
TERAS Chat Models
Modèles pour stocker l'historique des conversations du chatbot IA
✅ AVEC CONVERSATIONS + EXPORT PDF
"""

from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class ChatLog(models.Model):
    """
    Enregistrement des conversations avec l'assistant IA TERAS
    """
    CONTEXT_CHOICES = [
        ('government', 'Gouvernement'),
        ('admin', 'Administration'),
        ('enterprise', 'Entreprise'),
        ('individual', 'Individuel'),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='chat_logs',
        verbose_name='Utilisateur'
    )

    context = models.CharField(
        max_length=20,
        choices=CONTEXT_CHOICES,
        default='government',
        verbose_name='Contexte'
    )

    user_message = models.TextField(
        verbose_name='Message utilisateur'
    )

    assistant_response = models.TextField(
        verbose_name='Réponse assistant'
    )

    timestamp = models.DateTimeField(
        default=timezone.now,
        verbose_name='Horodatage',
        db_index=True
    )

    session_id = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='ID de session',
        help_text='Identifiant de la session de conversation'
    )

    tokens_used = models.IntegerField(
        default=0,
        verbose_name='Tokens utilisés'
    )

    model_version = models.CharField(
        max_length=50,
        default='claude-sonnet-4',
        verbose_name='Version du modèle'
    )

    response_time_ms = models.IntegerField(
        default=0,
        verbose_name='Temps de réponse (ms)'
    )

    user_feedback = models.IntegerField(
        null=True,
        blank=True,
        choices=[(1, 'Mauvais'), (2, 'Moyen'), (3, 'Bon'), (4, 'Très bon'), (5, 'Excellent')],
        verbose_name='Feedback utilisateur'
    )

    metadata = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Métadonnées',
        help_text='Données supplémentaires sur la conversation'
    )

    class Meta:
        verbose_name = 'Log de conversation'
        verbose_name_plural = 'Logs de conversations'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', '-timestamp']),
            models.Index(fields=['context', '-timestamp']),
            models.Index(fields=['session_id']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.timestamp.strftime('%Y-%m-%d %H:%M')} - {self.context}"

    def get_conversation_length(self):
        """Retourne le nombre total de caractères dans la conversation"""
        return len(self.user_message) + len(self.assistant_response)

    def was_helpful(self):
        """Vérifie si l'utilisateur a trouvé la réponse utile"""
        return self.user_feedback and self.user_feedback >= 3


class ChatSession(models.Model):
    """
    Session de conversation regroupant plusieurs échanges
    """
    session_id = models.CharField(
        max_length=100,
        unique=True,
        primary_key=True,
        verbose_name='ID de session'
    )

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='chat_sessions',
        verbose_name='Utilisateur'
    )

    context = models.CharField(
        max_length=20,
        choices=ChatLog.CONTEXT_CHOICES,
        default='government',
        verbose_name='Contexte'
    )

    started_at = models.DateTimeField(
        default=timezone.now,
        verbose_name='Début de session'
    )

    last_activity = models.DateTimeField(
        auto_now=True,
        verbose_name='Dernière activité'
    )

    is_active = models.BooleanField(
        default=True,
        verbose_name='Session active'
    )

    total_messages = models.IntegerField(
        default=0,
        verbose_name='Total de messages'
    )

    total_tokens = models.IntegerField(
        default=0,
        verbose_name='Total de tokens'
    )

    summary = models.TextField(
        blank=True,
        verbose_name='Résumé de la session'
    )

    class Meta:
        verbose_name = 'Session de chat'
        verbose_name_plural = 'Sessions de chat'
        ordering = ['-last_activity']

    def __str__(self):
        return f"{self.user.username} - Session {self.session_id[:8]}... - {self.total_messages} messages"

    def get_duration(self):
        """Retourne la durée de la session"""
        return (self.last_activity - self.started_at).total_seconds()

    def get_logs(self):
        """Retourne tous les logs de cette session"""
        return ChatLog.objects.filter(session_id=self.session_id)


class ChatFeedback(models.Model):
    """
    Feedback détaillé sur les réponses du chatbot
    """
    chat_log = models.OneToOneField(
        ChatLog,
        on_delete=models.CASCADE,
        related_name='detailed_feedback',
        verbose_name='Log de conversation'
    )

    rating = models.IntegerField(
        choices=[(1, '⭐'), (2, '⭐⭐'), (3, '⭐⭐⭐'), (4, '⭐⭐⭐⭐'), (5, '⭐⭐⭐⭐⭐')],
        verbose_name='Note'
    )

    is_accurate = models.BooleanField(
        default=True,
        verbose_name='Réponse précise'
    )

    is_helpful = models.BooleanField(
        default=True,
        verbose_name='Réponse utile'
    )

    is_clear = models.BooleanField(
        default=True,
        verbose_name='Réponse claire'
    )

    comment = models.TextField(
        blank=True,
        verbose_name='Commentaire'
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Date de création'
    )

    class Meta:
        verbose_name = 'Feedback détaillé'
        verbose_name_plural = 'Feedbacks détaillés'
        ordering = ['-created_at']

    def __str__(self):
        return f"Feedback {self.rating}⭐ - {self.chat_log}"


class CommonQuestion(models.Model):
    """
    Questions fréquentes et leurs réponses suggérées
    """
    CATEGORY_CHOICES = [
        ('scores', 'Scores TERAS'),
        ('reports', 'Rapports'),
        ('regions', 'Régions'),
        ('sectors', 'Secteurs'),
        ('alerts', 'Alertes'),
        ('enterprise', 'Entreprises'),
        ('general', 'Général'),
    ]

    category = models.CharField(
        max_length=20,
        choices=CATEGORY_CHOICES,
        verbose_name='Catégorie'
    )

    question = models.TextField(
        verbose_name='Question'
    )

    suggested_response = models.TextField(
        verbose_name='Réponse suggérée'
    )

    keywords = models.JSONField(
        default=list,
        verbose_name='Mots-clés',
        help_text='Mots-clés pour la détection'
    )

    usage_count = models.IntegerField(
        default=0,
        verbose_name="Nombre d'utilisations"
    )

    is_active = models.BooleanField(
        default=True,
        verbose_name='Active'
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Date de création'
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Dernière modification'
    )

    class Meta:
        verbose_name = 'Question fréquente'
        verbose_name_plural = 'Questions fréquentes'
        ordering = ['-usage_count']

    def __str__(self):
        return f"{self.get_category_display()} - {self.question[:50]}..."

    def increment_usage(self):
        """Incrémente le compteur d'utilisation"""
        self.usage_count += 1
        self.save(update_fields=['usage_count'])


# ===================================================================
# ✅ NOUVEAUX MODÈLES - CONVERSATIONS + EXPORT PDF
# ===================================================================

class ChatConversation(models.Model):
    """Conversations sauvegardées avec l'IA"""
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_conversations')
    title = models.CharField(max_length=200, verbose_name="Titre")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Métadonnées
    message_count = models.IntegerField(default=0)
    is_archived = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'chat_conversations'
        ordering = ['-updated_at']
        verbose_name = "Conversation IA"
        verbose_name_plural = "Conversations IA"
    
    def __str__(self):
        return f"{self.title} - {self.user.username}"


class ChatMessage(models.Model):
    """Messages individuels dans une conversation"""
    
    ROLE_CHOICES = [
        ('user', 'Utilisateur'),
        ('assistant', 'Assistant IA'),
        ('system', 'Système'),
    ]
    
    conversation = models.ForeignKey(
        ChatConversation,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    content = models.TextField(verbose_name="Contenu")
    timestamp = models.DateTimeField(auto_now_add=True)
    
    # Métadonnées optionnelles
    metadata = models.JSONField(default=dict, blank=True)
    
    class Meta:
        db_table = 'chat_messages'
        ordering = ['timestamp']
        verbose_name = "Message"
        verbose_name_plural = "Messages"
    
    def __str__(self):
        return f"{self.role}: {self.content[:50]}..."


class ChatExport(models.Model):
    """Historique des exports PDF"""
    
    conversation = models.ForeignKey(
        ChatConversation,
        on_delete=models.CASCADE,
        related_name='exports'
    )
    exported_at = models.DateTimeField(auto_now_add=True)
    file = models.FileField(upload_to='chat_exports/%Y/%m/', blank=True, null=True)
    file_size = models.IntegerField(null=True, blank=True)
    
    class Meta:
        db_table = 'chat_exports'
        ordering = ['-exported_at']
    
    def __str__(self):
        return f"Export {self.conversation.title} - {self.exported_at}"
