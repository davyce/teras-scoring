# backend/legislation/serializers.py

from rest_framework import serializers
from .models import LegislationDocument, LegislationComment

class LegislationDocumentSerializer(serializers.ModelSerializer):
    """Serializer pour les documents de législation"""
    
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    file_url = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    
    class Meta:
        model = LegislationDocument
        fields = [
            'id',
            'title',
            'reference',
            'type',
            'category',
            'country',
            'publication_date',
            'effective_date',
            'summary',
            'full_text',
            'file',
            'file_url',
            'file_size',
            'file_type',
            'tags',
            'status',
            'ai_analysis',
            'ai_analyzed_at',
            'extracted_text',
            'created_by',
            'created_by_name',
            'created_at',
            'updated_at',
            'comments_count',
        ]
        read_only_fields = ['created_at', 'updated_at', 'ai_analyzed_at']
    
    def get_file_url(self, obj):
        """Retourne l'URL complète du fichier"""
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
        return None
    
    def get_comments_count(self, obj):
        """Nombre de commentaires"""
        return obj.comments.count()


class LegislationCommentSerializer(serializers.ModelSerializer):
    """Serializer pour les commentaires"""
    
    user_name = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = LegislationComment
        fields = ['id', 'document', 'user', 'user_name', 'content', 'created_at']
        read_only_fields = ['created_at']
