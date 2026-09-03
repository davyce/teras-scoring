# backend/ai/admin.py
"""
TERAS AI Admin
Interface Django Admin pour RAG system
"""

from django.contrib import admin
from .models import IndexedDocument, RAGQuery, KnowledgeBase


@admin.register(IndexedDocument)
class IndexedDocumentAdmin(admin.ModelAdmin):
    """Admin pour IndexedDocument"""
    
    list_display = [
        'title', 'document_type', 'status',
        'chunk_count', 'indexed_at', 'indexed_by'
    ]
    list_filter = ['document_type', 'status', 'indexed_at']
    search_fields = ['title', 'content', 'source']
    readonly_fields = [
        'content_hash', 'vector_id', 'chunk_count',
        'indexed_at', 'created_at', 'updated_at'
    ]
    
    fieldsets = (
        ('Informations générales', {
            'fields': ('title', 'document_type', 'source')
        }),
        ('Contenu', {
            'fields': ('content', 'content_hash')
        }),
        ('Indexation', {
            'fields': (
                'status', 'vector_id', 'chunk_count',
                'indexed_at', 'indexed_by'
            )
        }),
        ('Métadonnées', {
            'fields': ('metadata', 'extracted_from')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def get_readonly_fields(self, request, obj=None):
        """Rendre content_hash readonly après création"""
        if obj:  # Editing existing
            return self.readonly_fields + ('content_hash',)
        return self.readonly_fields


@admin.register(RAGQuery)
class RAGQueryAdmin(admin.ModelAdmin):
    """Admin pour RAGQuery"""
    
    list_display = [
        'truncated_query', 'user', 'documents_found',
        'documents_used', 'response_time_ms', 'created_at'
    ]
    list_filter = ['created_at', 'user']
    search_fields = ['query', 'response']
    readonly_fields = ['created_at']
    
    fieldsets = (
        ('Requête', {
            'fields': ('query', 'user')
        }),
        ('Résultats', {
            'fields': (
                'documents_found', 'documents_used',
                'response', 'response_time_ms'
            )
        }),
        ('Métadonnées', {
            'fields': ('metadata',)
        }),
        ('Timestamp', {
            'fields': ('created_at',)
        })
    )
    
    def truncated_query(self, obj):
        """Affiche requête tronquée"""
        return obj.query[:50] + '...' if len(obj.query) > 50 else obj.query
    truncated_query.short_description = 'Requête'


@admin.register(KnowledgeBase)
class KnowledgeBaseAdmin(admin.ModelAdmin):
    """Admin pour KnowledgeBase"""
    
    list_display = [
        'title', 'category', 'priority',
        'is_active', 'updated_at'
    ]
    list_filter = ['category', 'is_active', 'priority']
    search_fields = ['title', 'content', 'keywords']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Informations', {
            'fields': ('category', 'title', 'priority', 'is_active')
        }),
        ('Contenu', {
            'fields': ('content',)
        }),
        ('Métadonnées', {
            'fields': ('keywords', 'indexed_document')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    actions = ['activate', 'deactivate']
    
    def activate(self, request, queryset):
        """Active les entrées sélectionnées"""
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} entrées activées')
    activate.short_description = 'Activer les entrées sélectionnées'
    
    def deactivate(self, request, queryset):
        """Désactive les entrées sélectionnées"""
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} entrées désactivées')
    deactivate.short_description = 'Désactiver les entrées sélectionnées'
