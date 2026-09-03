# backend/ai/urls.py
"""
TERAS AI URLs - Version Complete
Compatible Python 3.14 (Cohere + Anthropic, sans ChromaDB)
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    IndexedDocumentViewSet,
    RAGChatViewSet,
    DocumentIndexViewSet,
    RAGQueryViewSet,
    KnowledgeBaseViewSet,
    AIStatusView,
)

from .views_cohere import (
    CohereStatusView,
    CohereChatView,
    CohereSearchView,
    CohereRAGView,
    CohereSummarizeView,
    CohereClassifyTicketView,
    CohereClassifyDocumentView,
    CohereRerankView,
    CohereIndexDocumentView,
)

app_name = 'ai'

# Router pour les ViewSets
router = DefaultRouter()
router.register(r'documents', IndexedDocumentViewSet, basename='document')
router.register(r'rag', RAGChatViewSet, basename='rag')
router.register(r'index', DocumentIndexViewSet, basename='index')
router.register(r'queries', RAGQueryViewSet, basename='query')
router.register(r'knowledge', KnowledgeBaseViewSet, basename='knowledge')

# URLs Cohere
cohere_urlpatterns = [
    path('status/', CohereStatusView.as_view(), name='cohere-status'),
    path('chat/', CohereChatView.as_view(), name='cohere-chat'),
    path('search/', CohereSearchView.as_view(), name='cohere-search'),
    path('rag/', CohereRAGView.as_view(), name='cohere-rag'),
    path('summarize/', CohereSummarizeView.as_view(), name='cohere-summarize'),
    path('classify-ticket/', CohereClassifyTicketView.as_view(), name='cohere-classify-ticket'),
    path('classify-document/', CohereClassifyDocumentView.as_view(), name='cohere-classify-document'),
    path('rerank/', CohereRerankView.as_view(), name='cohere-rerank'),
    path('index/', CohereIndexDocumentView.as_view(), name='cohere-index'),
]

urlpatterns = [
    # Statut global
    path('status/', AIStatusView.as_view(), name='ai-status'),
    
    # ViewSets (REST)
    path('', include(router.urls)),
    
    # Cohere endpoints
    path('cohere/', include((cohere_urlpatterns, 'cohere'))),
]


"""
========================================
ENDPOINTS AI DISPONIBLES
========================================

GÉNÉRAL:
GET    /api/ai/status/                  Statut global du service AI

DOCUMENTS INDEXÉS:
GET    /api/ai/documents/               Liste documents indexés
POST   /api/ai/documents/               Créer/indexer document
GET    /api/ai/documents/{id}/          Détails document
PUT    /api/ai/documents/{id}/          Modifier document
DELETE /api/ai/documents/{id}/          Supprimer document
POST   /api/ai/documents/{id}/reindex/  Ré-indexer document
GET    /api/ai/documents/stats/         Stats collections

RAG (Claude):
POST   /api/ai/rag/chat/                Chat avec RAG
POST   /api/ai/rag/search/              Recherche sémantique

INDEXATION:
POST   /api/ai/index/index/             Indexer document rapide
POST   /api/ai/index/bulk/              Indexer batch

HISTORIQUE:
GET    /api/ai/queries/                 Historique requêtes RAG
GET    /api/ai/queries/{id}/            Détails requête

BASE DE CONNAISSANCES:
GET    /api/ai/knowledge/               Liste KB
POST   /api/ai/knowledge/               Créer entrée KB
GET    /api/ai/knowledge/{id}/          Détails entrée KB

COHERE:
GET    /api/ai/cohere/status/           Statut Cohere
POST   /api/ai/cohere/chat/             Chat Cohere
POST   /api/ai/cohere/search/           Recherche sémantique
POST   /api/ai/cohere/rag/              RAG Question-Réponse
POST   /api/ai/cohere/summarize/        Résumé de texte
POST   /api/ai/cohere/classify-ticket/  Classification ticket
POST   /api/ai/cohere/classify-document/ Classification document
POST   /api/ai/cohere/rerank/           Reranking
POST   /api/ai/cohere/index/            Indexer un document
"""

# Analytics routes
from .views_analytics import (
    rag_analytics_overview, rag_analytics_queries,
    rag_analytics_documents, rag_analytics_users,
    rag_analytics_trends, rag_analytics_export, rag_analytics_filter_options
)

urlpatterns += [
    path('analytics/overview/', rag_analytics_overview, name='rag-analytics-overview'),
    path('analytics/queries/', rag_analytics_queries, name='rag-analytics-queries'),
    path('analytics/documents/', rag_analytics_documents, name='rag-analytics-documents'),
    path('analytics/users/', rag_analytics_users, name='rag-analytics-users'),
    path('analytics/trends/', rag_analytics_trends, name='rag-analytics-trends'),
    path('analytics/export/', rag_analytics_export, name='rag-analytics-export'),
    path('analytics/filter-options/', rag_analytics_filter_options, name='rag-analytics-filter-options'),
    path('analytics/filter-options/', rag_analytics_filter_options, name='rag-analytics-filter-options'),
]
