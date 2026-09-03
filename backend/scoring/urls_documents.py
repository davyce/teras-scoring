# backend/scoring/urls_documents.py
"""
Routes URL pour gestion documents
À ajouter dans urls.py principal
"""

from django.urls import path
from .views_documents import (
    UserDocumentsView,
    UserDocumentUploadView,
    UserDocumentDownloadView,
    UserDocumentDeleteView,
    UserDocumentAnalyzeView
)

# Routes documents (à ajouter dans le prefixe 'user/')
document_urls = [
    # Liste documents
    path('documents/', 
         UserDocumentsView.as_view(), 
         name='user-documents'),
    
    # Upload document
    path('documents/upload/', 
         UserDocumentUploadView.as_view(), 
         name='user-document-upload'),
    
    # Download document
    path('documents/<int:document_id>/download/', 
         UserDocumentDownloadView.as_view(), 
         name='user-document-download'),
    
    # Delete document
    path('documents/<int:document_id>/', 
         UserDocumentDeleteView.as_view(), 
         name='user-document-delete'),
    
    # Analyser document avec IA
    path('documents/<int:document_id>/analyze/', 
         UserDocumentAnalyzeView.as_view(), 
         name='user-document-analyze'),
]
