# backend/support/models.py
"""
TERAS Support Models
Modèles pour le système de tickets de support
"""

import uuid
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class SupportTicket(models.Model):
    """
    Ticket de support créé par un utilisateur
    """
    
    STATUS_OPEN = 'open'
    STATUS_IN_PROGRESS = 'in_progress'
    STATUS_WAITING_USER = 'waiting_user'
    STATUS_RESOLVED = 'resolved'
    STATUS_CLOSED = 'closed'
    
    STATUS_CHOICES = [
        (STATUS_OPEN, 'Ouvert'),
        (STATUS_IN_PROGRESS, 'En cours de traitement'),
        (STATUS_WAITING_USER, 'En attente de réponse utilisateur'),
        (STATUS_RESOLVED, 'Résolu'),
        (STATUS_CLOSED, 'Fermé'),
    ]
    
    CATEGORY_ACCOUNT = 'account'
    CATEGORY_CREDIT = 'credit'
    CATEGORY_TECHNICAL = 'technical'
    CATEGORY_SECURITY = 'security'
    CATEGORY_SCORE = 'score'
    CATEGORY_OTHER = 'other'
    
    CATEGORY_CHOICES = [
        (CATEGORY_ACCOUNT, 'Compte et profil'),
        (CATEGORY_CREDIT, 'Crédit et remboursement'),
        (CATEGORY_TECHNICAL, 'Problème technique'),
        (CATEGORY_SECURITY, 'Sécurité'),
        (CATEGORY_SCORE, 'Score TERAS'),
        (CATEGORY_OTHER, 'Autre'),
    ]
    
    PRIORITY_LOW = 'low'
    PRIORITY_MEDIUM = 'medium'
    PRIORITY_HIGH = 'high'
    PRIORITY_URGENT = 'urgent'
    
    PRIORITY_CHOICES = [
        (PRIORITY_LOW, 'Basse'),
        (PRIORITY_MEDIUM, 'Moyenne'),
        (PRIORITY_HIGH, 'Haute'),
        (PRIORITY_URGENT, 'Urgente'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ticket_number = models.CharField(max_length=50, unique=True, editable=False)
    
    # Utilisateur
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='support_tickets'
    )
    
    # Contenu du ticket
    subject = models.CharField(max_length=200)
    description = models.TextField()
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    priority = models.CharField(
        max_length=20,
        choices=PRIORITY_CHOICES,
        default=PRIORITY_MEDIUM
    )
    
    # Statut
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_OPEN
    )
    
    # Assignation
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_tickets',
        limit_choices_to={'is_staff': True}
    )
    
    # Fichier joint initial
    attachment = models.FileField(
        upload_to='support/attachments/%Y/%m/',
        null=True,
        blank=True
    )
    
    # Métadonnées
    message_count = models.IntegerField(default=0)
    last_message = models.ForeignKey(
        'TicketMessage',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='+'
    )
    
    # Flags de lecture
    is_read_by_admin = models.BooleanField(default=False)
    is_read_by_user = models.BooleanField(default=True)
    
    # Dates
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    closed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Ticket de support"
        verbose_name_plural = "Tickets de support"
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['status', 'priority']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.ticket_number} - {self.subject}"
    
    def save(self, *args, **kwargs):
        if not self.ticket_number:
            # Générer numéro unique
            timestamp = timezone.now().strftime('%Y%m%d%H%M%S')
            self.ticket_number = f"TKT-{timestamp}-{str(uuid.uuid4())[:8].upper()}"
        super().save(*args, **kwargs)


class TicketMessage(models.Model):
    """
    Message dans un ticket de support
    (peut venir de l'utilisateur ou de l'admin/support)
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ticket = models.ForeignKey(
        SupportTicket,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    sender = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='ticket_messages'
    )
    
    # Contenu
    content = models.TextField()
    attachment = models.FileField(
        upload_to='support/messages/%Y/%m/',
        null=True,
        blank=True
    )
    
    # Type de message
    is_admin_message = models.BooleanField(
        default=False,
        help_text="Message envoyé par le support"
    )
    
    # Lecture
    is_read = models.BooleanField(default=False)
    
    # Dates
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['created_at']
        verbose_name = "Message de ticket"
        verbose_name_plural = "Messages de ticket"
        indexes = [
            models.Index(fields=['ticket', 'created_at']),
            models.Index(fields=['is_admin_message', 'is_read']),
        ]
    
    def __str__(self):
        sender_type = "Support" if self.is_admin_message else "Utilisateur"
        return f"{sender_type} - {self.ticket.ticket_number} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"
    
    def save(self, *args, **kwargs):
        # Déterminer automatiquement si c'est un message admin
        if self.sender.is_staff:
            self.is_admin_message = True
        
        super().save(*args, **kwargs)
        
        # Mettre à jour le ticket
        self.ticket.message_count = self.ticket.messages.count()
        self.ticket.last_message = self
        self.ticket.updated_at = timezone.now()
        self.ticket.save(update_fields=['message_count', 'last_message', 'updated_at'])
