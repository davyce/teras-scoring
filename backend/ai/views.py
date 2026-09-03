# backend/ai/views.py
"""
TERAS AI Views
API endpoints pour RAG system
Compatible Python 3.14
"""

from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.db.models import Count, Avg
from datetime import timedelta
from django.utils import timezone

from .models import IndexedDocument, RAGQuery, KnowledgeBase
from .serializers import (
    IndexedDocumentSerializer,
    IndexedDocumentListSerializer,
    RAGQuerySerializer,
    KnowledgeBaseSerializer,
    RAGChatRequestSerializer,
    SemanticSearchRequestSerializer,
    DocumentIndexRequestSerializer,
)
from .rag_service import get_rag_service
from .vector_store import get_vector_store


class IndexedDocumentViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour gérer les documents indexés
    """
    queryset = IndexedDocument.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return IndexedDocumentListSerializer
        return IndexedDocumentSerializer
    
    def get_queryset(self):
        qs = IndexedDocument.objects.all()
        
        # Filtres
        doc_type = self.request.query_params.get('type')
        status_filter = self.request.query_params.get('status')
        search = self.request.query_params.get('search')
        
        if doc_type:
            qs = qs.filter(document_type=doc_type)
        if status_filter:
            qs = qs.filter(status=status_filter)
        if search:
            qs = qs.filter(title__icontains=search)
        
        return qs.order_by('-created_at')
    
    @action(detail=True, methods=['post'])
    def reindex(self, request, pk=None):
        """Réindexer un document"""
        doc = self.get_object()
        
        try:
            rag_service = get_rag_service()
            rag_service.index_document(
                title=doc.title,
                content=doc.content,
                document_type=doc.document_type,
                source=doc.source,
                metadata=doc.metadata,
                user=request.user
            )
            return Response({'message': 'Document réindexé avec succès'})
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Statistiques des documents indexés"""
        vector_store = get_vector_store()
        
        # Stats par type
        by_type = IndexedDocument.objects.values('document_type').annotate(
            count=Count('id')
        )
        
        # Stats par statut
        by_status = IndexedDocument.objects.values('status').annotate(
            count=Count('id')
        )
        
        # Stats collections
        from .models import IndexedDocument as ID
        collection_stats = {
            'total': ID.objects.count(),
            'indexed': ID.objects.filter(status='indexed').count(),
        }
        
        return Response({
            'total': IndexedDocument.objects.count(),
            'total_documents': IndexedDocument.objects.filter(status='indexed').count(),
            'by_type': list(by_type),
            'by_status': list(by_status),
            'collections': collection_stats,
            'vector_store_available': vector_store.is_available(),
        })


class RAGChatViewSet(viewsets.ViewSet):
    """
    ViewSet pour le chat RAG
    """
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['post'])
    def chat(self, request):
        """Chat avec RAG"""
        serializer = RAGChatRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            rag_service = get_rag_service()
            
            if not rag_service.is_available():
                return Response(
                    {'error': 'Service RAG non disponible'},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )
            
            result = rag_service.chat_with_rag(
                query=serializer.validated_data['query'],
                document_types=serializer.validated_data.get('document_types'),
                n_results=serializer.validated_data.get('n_results', 5),
                user=request.user,
                conversation_history=serializer.validated_data.get('conversation_history')
            )
            
            return Response(result)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def search(self, request):
        """Recherche sémantique"""
        serializer = SemanticSearchRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            rag_service = get_rag_service()
            
            results = rag_service.semantic_search(
                query=serializer.validated_data['query'],
                document_types=serializer.validated_data.get('document_types'),
                n_results=serializer.validated_data.get('n_results', 10)
            )
            
            return Response({
                'query': serializer.validated_data['query'],
                'results': results,
                'count': len(results)
            })
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DocumentIndexViewSet(viewsets.ViewSet):
    """
    ViewSet pour indexer des documents
    """
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['post'], url_path='index')
    def index_document(self, request):
        """Indexer un document"""
        serializer = DocumentIndexRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            rag_service = get_rag_service()
            
            doc = rag_service.index_document(
                title=serializer.validated_data['title'],
                content=serializer.validated_data['content'],
                document_type=serializer.validated_data.get('document_type', 'general'),
                source=serializer.validated_data.get('source', ''),
                metadata=serializer.validated_data.get('metadata'),
                user=request.user
            )
            
            return Response({
                'success': True,
                'document_id': doc.id,
                'title': doc.title,
                'status': doc.status,
                'chunk_count': doc.chunk_count
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'], url_path='bulk')
    def bulk_index(self, request):
        """Indexer plusieurs documents"""
        documents = request.data.get('documents', [])
        
        if not documents:
            return Response(
                {'error': 'Liste de documents requise'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            rag_service = get_rag_service()
            results = []
            
            for doc_data in documents:
                try:
                    doc = rag_service.index_document(
                        title=doc_data['title'],
                        content=doc_data['content'],
                        document_type=doc_data.get('document_type', 'general'),
                        source=doc_data.get('source', ''),
                        metadata=doc_data.get('metadata'),
                        user=request.user
                    )
                    results.append({
                        'title': doc.title,
                        'status': 'success',
                        'document_id': doc.id
                    })
                except Exception as e:
                    results.append({
                        'title': doc_data.get('title', 'Unknown'),
                        'status': 'error',
                        'error': str(e)
                    })
            
            return Response({
                'total': len(documents),
                'success': len([r for r in results if r['status'] == 'success']),
                'results': results
            })
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class RAGQueryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet pour l'historique des requêtes RAG
    """
    queryset = RAGQuery.objects.all()
    serializer_class = RAGQuerySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        qs = RAGQuery.objects.all()
        
        # Filtrer par utilisateur si pas admin
        if not self.request.user.is_staff:
            qs = qs.filter(user=self.request.user)
        
        return qs.order_by('-created_at')[:100]


class KnowledgeBaseViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour la base de connaissances
    """
    queryset = KnowledgeBase.objects.filter(is_active=True)
    serializer_class = KnowledgeBaseSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        qs = KnowledgeBase.objects.filter(is_active=True)
        
        category = self.request.query_params.get('category')
        search = self.request.query_params.get('search')
        
        if category:
            qs = qs.filter(category=category)
        if search:
            qs = qs.filter(title__icontains=search)
        
        return qs


class AIStatusView(APIView):
    """
    GET /api/ai/status/
    Statut global du service AI
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        rag_service = get_rag_service()
        vector_store = get_vector_store()
        
        return Response({
            'rag_available': rag_service.is_available(),
            'vector_store_available': vector_store.is_available(),
            'anthropic_configured': rag_service.client is not None,
            'cohere_configured': vector_store.embedding_service.is_available(),
            'indexed_documents': IndexedDocument.objects.filter(status='indexed').count(),
            'total_queries': RAGQuery.objects.count(),
        })
