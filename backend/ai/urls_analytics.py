# backend/ai/urls_analytics.py
"""
URLs Analytics RAG
À ajouter dans backend/ai/urls.py
"""

from django.urls import path
from .views_analytics import (
    rag_analytics_overview,
    rag_analytics_queries,
    rag_analytics_documents,
    rag_analytics_users,
    rag_analytics_trends,
    rag_analytics_export
)

# Ajouter ces URLs dans ai/urls.py:
"""
# Analytics RAG
path('analytics/overview/', rag_analytics_overview, name='rag-analytics-overview'),
path('analytics/queries/', rag_analytics_queries, name='rag-analytics-queries'),
path('analytics/documents/', rag_analytics_documents, name='rag-analytics-documents'),
path('analytics/users/', rag_analytics_users, name='rag-analytics-users'),
path('analytics/trends/', rag_analytics_trends, name='rag-analytics-trends'),
path('analytics/export/', rag_analytics_export, name='rag-analytics-export'),
"""
