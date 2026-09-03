# backend/legislation/views.py

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Q
import os

from .models import LegislationDocument, LegislationComment
from .serializers import LegislationDocumentSerializer, LegislationCommentSerializer
from .ai_analyzer import LegislationAIAnalyzer


class LegislationViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour la gestion des documents de législation
    
    Endpoints:
    - GET /api/legislation/ - Liste tous les documents
    - POST /api/legislation/ - Créer un nouveau document (avec upload)
    - GET /api/legislation/{id}/ - Détails d'un document
    - PUT/PATCH /api/legislation/{id}/ - Modifier un document
    - DELETE /api/legislation/{id}/ - Supprimer un document
    - POST /api/legislation/{id}/analyze/ - Analyser avec IA
    - POST /api/legislation/{id}/add_comment/ - Ajouter un commentaire
    - GET /api/legislation/search/ - Recherche avancée
    """
    
    queryset = LegislationDocument.objects.all()
    serializer_class = LegislationDocumentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filtrage de la queryset"""
        queryset = super().get_queryset()
        
        # Filtres via query params
        document_type = self.request.query_params.get('type')
        country = self.request.query_params.get('country')
        status_filter = self.request.query_params.get('status')
        search = self.request.query_params.get('search')
        
        if document_type:
            queryset = queryset.filter(type=document_type)
        
        if country:
            queryset = queryset.filter(country=country)
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(reference__icontains=search) |
                Q(summary__icontains=search)
            )
        
        return queryset
    
    def perform_create(self, serializer):
        """Création avec attribution de l'utilisateur"""
        document = serializer.save(created_by=self.request.user)
        
        # Si un fichier est uploadé, extraire la taille et le type
        if document.file:
            document.file_size = document.file.size
            document.file_type = self._get_mime_type(document.file.name)
            document.save()
    
    def _get_mime_type(self, filename: str) -> str:
        """Détermine le type MIME basé sur l'extension"""
        extension = filename.split('.')[-1].lower()
        
        mime_types = {
            'pdf': 'application/pdf',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'xls': 'application/vnd.ms-excel',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'doc': 'application/msword',
            'txt': 'text/plain',
        }
        
        return mime_types.get(extension, 'application/octet-stream')
    
    @action(detail=True, methods=['post'])
    def analyze(self, request, pk=None):
        """
        Analyse le document avec l'IA Claude
        
        POST /api/legislation/{id}/analyze/
        
        Returns:
            - analysis: Analyse structurée du document
            - extracted_text: Texte extrait
        """
        document = self.get_object()
        
        if not document.file:
            return Response(
                {'error': 'Aucun fichier à analyser'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Initialiser l'analyseur IA
            analyzer = LegislationAIAnalyzer()
            
            # Analyser le document
            result = analyzer.analyze_document(
                document.file.path,
                document.file_type
            )
            
            if not result.get('success'):
                return Response(
                    {'error': result.get('error', 'Erreur d\'analyse')},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # Sauvegarder l'analyse
            document.ai_analysis = result.get('analysis', {})
            document.extracted_text = result.get('extracted_text', '')
            document.ai_analyzed_at = timezone.now()
            
            # Auto-compléter le résumé si vide
            if not document.summary and document.ai_analysis:
                document.summary = document.ai_analysis.get('summary', '')
            
            document.save()
            
            serializer = self.get_serializer(document)
            return Response(serializer.data)
            
        except Exception as e:
            return Response(
                {'error': f'Erreur lors de l\'analyse: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def add_comment(self, request, pk=None):
        """
        Ajoute un commentaire sur le document
        
        POST /api/legislation/{id}/add_comment/
        Body: {"content": "Mon commentaire"}
        """
        document = self.get_object()
        
        content = request.data.get('content')
        if not content:
            return Response(
                {'error': 'Le contenu du commentaire est requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        comment = LegislationComment.objects.create(
            document=document,
            user=request.user,
            content=content
        )
        
        serializer = LegislationCommentSerializer(comment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['get'])
    def comments(self, request, pk=None):
        """
        Liste les commentaires d'un document
        
        GET /api/legislation/{id}/comments/
        """
        document = self.get_object()
        comments = document.comments.all()
        serializer = LegislationCommentSerializer(comments, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Statistiques globales
        
        GET /api/legislation/stats/
        """
        total = LegislationDocument.objects.count()
        by_type = {}
        by_country = {}
        by_status = {}
        
        for doc_type, _ in LegislationDocument.TYPE_CHOICES:
            by_type[doc_type] = LegislationDocument.objects.filter(type=doc_type).count()
        
        for country, _ in LegislationDocument.COUNTRY_CHOICES:
            by_country[country] = LegislationDocument.objects.filter(country=country).count()
        
        for doc_status, _ in LegislationDocument.STATUS_CHOICES:
            by_status[doc_status] = LegislationDocument.objects.filter(status=doc_status).count()
        
        return Response({
            'total': total,
            'by_type': by_type,
            'by_country': by_country,
            'by_status': by_status,
        })
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """
        Télécharge le fichier du document
        
        GET /api/legislation/{id}/download/
        """
        document = self.get_object()
        
        if not document.file:
            return Response(
                {'error': 'Aucun fichier disponible'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        from django.http import FileResponse
        return FileResponse(
            document.file.open('rb'),
            as_attachment=True,
            filename=os.path.basename(document.file.name)
        )
