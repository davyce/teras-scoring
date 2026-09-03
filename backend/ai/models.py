# backend/ai/models.py
"""
TERAS AI Models
Models pour RAG system et knowledge base
Compatible Python 3.14 (sans ChromaDB)
"""

import hashlib
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class DocumentEmbedding(models.Model):
    """
    Stockage des embeddings de documents
    Remplace ChromaDB pour compatibilité Python 3.14
    """
    
    # Identifiant unique du document
    doc_id = models.CharField(max_length=255, unique=True, db_index=True)
    
    # Collection (équivalent aux collections ChromaDB)
    collection = models.CharField(max_length=100, db_index=True)
    
    # Contenu
    content = models.TextField()
    title = models.CharField(max_length=500, blank=True, default='')
    source = models.CharField(max_length=500, blank=True, default='')
    
    # Embedding (stocké en JSON - liste de floats)
    embedding = models.JSONField(default=list, null=True, blank=True)
    
    # Métadonnées additionnelles
    metadata = models.JSONField(default=dict)
    
    # Hash pour déduplication
    content_hash = models.CharField(max_length=64, db_index=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Document Embedding"
        verbose_name_plural = "Document Embeddings"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['collection', 'created_at']),
            models.Index(fields=['content_hash']),
        ]
    
    def __str__(self):
        return f"[{self.collection}] {self.title or self.doc_id[:50]}"
    
    def save(self, *args, **kwargs):
        if not self.content_hash:
            self.content_hash = hashlib.sha256(
                self.content.encode('utf-8')
            ).hexdigest()
        super().save(*args, **kwargs)


class IndexedDocument(models.Model):
    """
    Documents indexés dans la base vectorielle
    """
    DOCUMENT_TYPES = [
        ('legislation', 'Législation'),
        ('documentation', 'Documentation'),
        ('faq', 'FAQ'),
        ('case_study', "Cas d'usage"),
        ('policy', 'Politique'),
        ('guide', 'Guide'),
        ('general', 'Général'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('indexing', 'Indexation en cours'),
        ('indexed', 'Indexé'),
        ('failed', 'Échec'),
    ]
    
    # Métadonnées document
    title = models.CharField(max_length=500, verbose_name="Titre")
    document_type = models.CharField(
        max_length=20,
        choices=DOCUMENT_TYPES,
        default='general',
        verbose_name="Type de document"
    )
    source = models.CharField(
        max_length=500,
        blank=True,
        default='',
        verbose_name="Source",
        help_text="URL ou référence source"
    )
    
    # Contenu
    content = models.TextField(verbose_name="Contenu texte")
    content_hash = models.CharField(
        max_length=64,
        unique=True,
        verbose_name="Hash contenu",
        help_text="SHA256 hash pour déduplication"
    )
    
    # Métadonnées extraction
    extracted_from = models.CharField(
        max_length=500,
        blank=True,
        default='',
        verbose_name="Extrait de",
        help_text="Fichier original si applicable"
    )
    
    # Indexation
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name="Statut indexation"
    )
    vector_id = models.CharField(
        max_length=100,
        blank=True,
        default='',
        verbose_name="ID dans vector store"
    )
    chunk_count = models.IntegerField(
        default=0,
        verbose_name="Nombre de chunks"
    )
    
    # Métadonnées supplémentaires (JSON)
    metadata = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Métadonnées"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    indexed_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Date d'indexation"
    )
    
    # User tracking
    indexed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='indexed_documents'
    )
    
    class Meta:
        verbose_name = "Document indexé"
        verbose_name_plural = "Documents indexés"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['document_type', '-created_at']),
            models.Index(fields=['content_hash']),
        ]
    
    def __str__(self):
        return f"{self.title} ({self.get_document_type_display()})"
    
    def mark_as_indexed(self, vector_id: str, chunk_count: int):
        """Marquer le document comme indexé"""
        self.status = 'indexed'
        self.vector_id = vector_id
        self.chunk_count = chunk_count
        self.indexed_at = timezone.now()
        self.save(update_fields=['status', 'vector_id', 'chunk_count', 'indexed_at'])
    
    def mark_as_failed(self):
        """Marquer l'indexation comme échouée"""
        self.status = 'failed'
        self.save(update_fields=['status'])


class RAGQuery(models.Model):
    """
    Historique des requêtes RAG pour analytics
    """
    query = models.TextField(verbose_name="Requête")
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='rag_queries'
    )
    
    # Résultats
    documents_found = models.IntegerField(
        default=0,
        verbose_name="Documents trouvés"
    )
    documents_used = models.IntegerField(
        default=0,
        verbose_name="Documents utilisés"
    )
    
    # Réponse
    response = models.TextField(
        blank=True,
        default='',
        verbose_name="Réponse générée"
    )
    response_time_ms = models.IntegerField(
        default=0,
        verbose_name="Temps de réponse (ms)"
    )
    
    # Métadonnées
    metadata = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Métadonnées"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Requête RAG"
        verbose_name_plural = "Requêtes RAG"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.query[:50]}... ({self.documents_found} docs)"


class KnowledgeBase(models.Model):
    """
    Base de connaissances organisée par catégories
    """
    CATEGORY_CHOICES = [
        ('teras_scoring', 'TERAS Scoring'),
        ('legislation', 'Législation CEMAC'),
        ('compliance', 'Conformité'),
        ('fiscal', 'Fiscalité'),
        ('procedures', 'Procédures'),
        ('faq', 'FAQ'),
        ('glossary', 'Glossaire'),
    ]
    
    category = models.CharField(
        max_length=50,
        choices=CATEGORY_CHOICES,
        verbose_name="Catégorie"
    )
    title = models.CharField(max_length=500, verbose_name="Titre")
    content = models.TextField(verbose_name="Contenu")
    
    # Relations
    indexed_document = models.ForeignKey(
        IndexedDocument,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='knowledge_entries'
    )
    
    # Métadonnées
    keywords = models.JSONField(
        default=list,
        verbose_name="Mots-clés"
    )
    priority = models.IntegerField(
        default=0,
        verbose_name="Priorité"
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name="Actif"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Entrée base de connaissances"
        verbose_name_plural = "Base de connaissances"
        ordering = ['-priority', 'category', 'title']
    
    def __str__(self):
        return f"{self.get_category_display()} - {self.title}"


class ChatSession(models.Model):
    """
    Session de chat pour le RAG
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='ai_chat_sessions'
    )
    
    title = models.CharField(max_length=255, blank=True, default='Nouvelle conversation')
    context_type = models.CharField(max_length=50, default='general')
    system_prompt = models.TextField(blank=True, default='')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Session Chat IA"
        verbose_name_plural = "Sessions Chat IA"
        ordering = ['-updated_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.title}"


class ChatMessage(models.Model):
    """
    Message dans une session de chat
    """
    ROLE_USER = 'user'
    ROLE_ASSISTANT = 'assistant'
    ROLE_SYSTEM = 'system'
    
    ROLE_CHOICES = [
        (ROLE_USER, 'Utilisateur'),
        (ROLE_ASSISTANT, 'Assistant'),
        (ROLE_SYSTEM, 'Système'),
    ]
    
    session = models.ForeignKey(
        ChatSession,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    content = models.TextField()
    sources = models.JSONField(default=list)
    metadata = models.JSONField(default=dict)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Message Chat IA"
        verbose_name_plural = "Messages Chat IA"
        ordering = ['created_at']
    
    def __str__(self):
        return f"[{self.role}] {self.content[:50]}..."
