# backend/ai/serializers.py
"""
TERAS AI Serializers
"""

from rest_framework import serializers
from .models import IndexedDocument, RAGQuery, KnowledgeBase, DocumentEmbedding


class DocumentEmbeddingSerializer(serializers.ModelSerializer):
    """Serializer pour DocumentEmbedding"""
    
    class Meta:
        model = DocumentEmbedding
        fields = [
            'id', 'doc_id', 'collection', 'title', 'source',
            'content', 'metadata', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'content_hash']


class IndexedDocumentSerializer(serializers.ModelSerializer):
    """Serializer pour IndexedDocument"""
    
    indexed_by_username = serializers.CharField(
        source='indexed_by.username',
        read_only=True,
        default=''
    )
    
    class Meta:
        model = IndexedDocument
        fields = [
            'id', 'title', 'document_type', 'source',
            'content', 'content_hash', 'status',
            'vector_id', 'chunk_count', 'metadata',
            'created_at', 'updated_at', 'indexed_at',
            'indexed_by', 'indexed_by_username'
        ]
        read_only_fields = [
            'content_hash', 'vector_id', 'chunk_count',
            'indexed_at', 'status'
        ]


class IndexedDocumentListSerializer(serializers.ModelSerializer):
    """Serializer light pour liste"""
    
    indexed_by_username = serializers.CharField(
        source='indexed_by.username',
        read_only=True,
        default=''
    )
    
    class Meta:
        model = IndexedDocument
        fields = [
            'id', 'title', 'document_type', 'status',
            'chunk_count', 'created_at', 'indexed_by_username'
        ]


class RAGQuerySerializer(serializers.ModelSerializer):
    """Serializer pour RAGQuery"""
    
    user_username = serializers.CharField(
        source='user.username',
        read_only=True,
        default=''
    )
    
    class Meta:
        model = RAGQuery
        fields = [
            'id', 'query', 'user', 'user_username',
            'documents_found', 'documents_used',
            'response', 'response_time_ms',
            'metadata', 'created_at'
        ]
        read_only_fields = ['created_at']


class KnowledgeBaseSerializer(serializers.ModelSerializer):
    """Serializer pour KnowledgeBase"""
    
    class Meta:
        model = KnowledgeBase
        fields = [
            'id', 'category', 'title', 'content',
            'keywords', 'priority', 'is_active',
            'indexed_document', 'created_at', 'updated_at'
        ]


class RAGChatRequestSerializer(serializers.Serializer):
    """Serializer pour requête RAG chat"""
    
    query = serializers.CharField(required=True, max_length=5000)
    document_types = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        allow_empty=True,
        default=[]
    )
    n_results = serializers.IntegerField(
        default=5,
        min_value=1,
        max_value=20
    )
    conversation_history = serializers.ListField(
        required=False,
        allow_empty=True,
        default=[]
    )


class RAGChatResponseSerializer(serializers.Serializer):
    """Serializer pour réponse RAG chat"""
    
    response = serializers.CharField()
    sources = serializers.ListField()
    documents_found = serializers.IntegerField()
    documents_used = serializers.IntegerField()
    response_time_ms = serializers.IntegerField()
    tokens_used = serializers.IntegerField()


class SemanticSearchRequestSerializer(serializers.Serializer):
    """Serializer pour recherche sémantique"""
    
    query = serializers.CharField(required=True, max_length=2000)
    document_types = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        default=[]
    )
    n_results = serializers.IntegerField(
        default=10,
        min_value=1,
        max_value=50
    )


class DocumentIndexRequestSerializer(serializers.Serializer):
    """Serializer pour indexation document"""
    
    title = serializers.CharField(required=True, max_length=500)
    content = serializers.CharField(required=True)
    document_type = serializers.ChoiceField(
        choices=[
            'legislation', 'documentation', 'faq',
            'case_study', 'policy', 'guide', 'general'
        ],
        default='general'
    )
    source = serializers.CharField(required=False, allow_blank=True, default='')
    metadata = serializers.JSONField(required=False, default=dict)
