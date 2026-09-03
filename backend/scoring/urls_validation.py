# admin/urls_validation.py
"""
URLs pour le système de validation TERAS
"""

from django.urls import path
from . import views_validation

urlpatterns = [
    # Validation Center
    path('validation/queue/', 
         views_validation.validation_queue, 
         name='validation-queue'),
    
    path('documents/<int:document_id>/', 
         views_validation.document_detail, 
         name='document-detail'),
    
    path('documents/<int:document_id>/approve/', 
         views_validation.approve_document, 
         name='document-approve'),
    
    path('documents/<int:document_id>/reject/', 
         views_validation.reject_document, 
         name='document-reject'),
    
    path('documents/<int:document_id>/flag/', 
         views_validation.flag_document, 
         name='document-flag'),
    
    path('documents/<int:document_id>/analyze/', 
         views_validation.analyze_document, 
         name='document-analyze'),
    
    # Upload Admin
    path('users/<int:user_id>/upload-document/', 
         views_validation.upload_document_for_user, 
         name='upload-for-user'),
    
    # User Report
    path('users/<int:user_id>/report/', 
         views_validation.user_report, 
         name='user-report'),
    
    # Législation
    path('legislation/', 
         views_validation.legislation_list, 
         name='legislation-list'),
    
    path('legislation/upload/', 
         views_validation.legislation_upload, 
         name='legislation-upload'),
    
    path('legislation/<int:legislation_id>/', 
         views_validation.legislation_delete, 
         name='legislation-delete'),
    
    path('legislation/<int:legislation_id>/reindex/', 
         views_validation.legislation_reindex, 
         name='legislation-reindex'),
]
