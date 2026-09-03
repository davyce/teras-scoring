# admin/views_validation.py
"""
Views Admin pour la validation de documents TERAS
"""

from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.pagination import PageNumberPagination
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db.models import Q, Count
from django.shortcuts import get_object_or_404

from users.models import Document, ValidationDecision, LegislationDocument
from users.serializers_extended import (
    DocumentListSerializer,
    DocumentDetailSerializer,
    DocumentUploadSerializer,
    DocumentApproveSerializer,
    DocumentRejectSerializer,
    DocumentFlagSerializer,
    ValidationDecisionSerializer,
    LegislationDocumentListSerializer,
    LegislationDocumentDetailSerializer,
    LegislationDocumentUploadSerializer,
    UserReportSerializer,
)

User = get_user_model()


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


# ============================================================
# VALIDATION CENTER
# ============================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def validation_queue(request):
    """
    GET /api/admin/validation/queue/
    
    Liste des documents en attente de validation
    
    Query params:
    - user_type: individual|enterprise|government|bank|admin
    - document_type: national_id|bank_statement|etc
    - status: pending|under_review|flagged
    - risk: low|medium|high
    - country: CG|CM|GA|etc
    - search: texte libre (nom, email)
    - page: numéro de page
    - page_size: taille page (default 20)
    """
    
    # Filtres
    queryset = Document.objects.select_related('user', 'verified_by').all()
    
    # Filtre par type utilisateur
    user_type = request.query_params.get('user_type')
    if user_type:
        queryset = queryset.filter(user__user_type=user_type)
    
    # Filtre par type de document
    doc_type = request.query_params.get('document_type')
    if doc_type:
        queryset = queryset.filter(document_type=doc_type)
    
    # Filtre par statut
    doc_status = request.query_params.get('status', 'pending')
    if doc_status and doc_status != 'all':
        queryset = queryset.filter(status=doc_status)
    
    # Filtre par pays
    country = request.query_params.get('country')
    if country:
        queryset = queryset.filter(user__country=country)
    
    # Filtre par risque (basé sur analyse IA)
    risk = request.query_params.get('risk')
    if risk == 'high':
        queryset = queryset.filter(
            ai_analyzed=True,
            ai_analysis_json__fraud_indicators__score__gte=70
        )
    elif risk == 'medium':
        queryset = queryset.filter(
            ai_analyzed=True,
            ai_analysis_json__fraud_indicators__score__gte=30,
            ai_analysis_json__fraud_indicators__score__lt=70
        )
    elif risk == 'low':
        queryset = queryset.filter(
            ai_analyzed=True,
            ai_analysis_json__fraud_indicators__score__lt=30
        )
    
    # Recherche textuelle
    search = request.query_params.get('search')
    if search:
        queryset = queryset.filter(
            Q(user__email__icontains=search) |
            Q(user__first_name__icontains=search) |
            Q(user__last_name__icontains=search) |
            Q(user__username__icontains=search)
        )
    
    # Tri
    queryset = queryset.order_by('-uploaded_at')
    
    # Pagination
    paginator = StandardResultsSetPagination()
    page = paginator.paginate_queryset(queryset, request)
    
    serializer = DocumentListSerializer(page, many=True)
    
    # Stats
    stats = {
        'total': queryset.count(),
        'pending': Document.objects.filter(status='pending').count(),
        'under_review': Document.objects.filter(status='under_review').count(),
        'flagged': Document.objects.filter(status='flagged').count(),
        'by_type': list(Document.objects.filter(
            status='pending'
        ).values('document_type').annotate(count=Count('id'))),
    }
    
    return paginator.get_paginated_response({
        'documents': serializer.data,
        'stats': stats,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def document_detail(request, document_id):
    """
    GET /api/admin/documents/{id}/
    
    Détails complets d'un document pour validation
    """
    
    document = get_object_or_404(
        Document.objects.select_related('user', 'verified_by', 'admin_uploader'),
        id=document_id
    )
    
    serializer = DocumentDetailSerializer(
        document, 
        context={'request': request}
    )
    
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def approve_document(request, document_id):
    """
    POST /api/admin/documents/{id}/approve/
    
    Approuver un document
    
    Body:
    {
        "notes": "Document valide, toutes vérifications OK",
        "mark_as_reference": false
    }
    """
    
    document = get_object_or_404(Document, id=document_id)
    serializer = DocumentApproveSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    # Mettre à jour le document
    document.status = 'approved'
    document.verified_at = timezone.now()
    document.verified_by = request.user
    document.admin_notes = serializer.validated_data.get('notes', '')
    document.save()
    
    # Créer décision
    ValidationDecision.objects.create(
        document=document,
        admin=request.user,
        decision='approve',
        notes=serializer.validated_data.get('notes', ''),
        ai_assisted=document.ai_analyzed,
        ai_recommendation_followed=(
            document.ai_recommendation == 'approve' if document.ai_analyzed else None
        ),
    )
    
    # TODO: Envoyer email notification user
    
    return Response({
        'success': True,
        'message': 'Document approuvé avec succès',
        'document': DocumentDetailSerializer(document, context={'request': request}).data,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def reject_document(request, document_id):
    """
    POST /api/admin/documents/{id}/reject/
    
    Rejeter un document
    
    Body:
    {
        "reason": "illegible",
        "details": "Photo trop floue, impossible de lire les informations",
        "request_new_document": true
    }
    """
    
    document = get_object_or_404(Document, id=document_id)
    serializer = DocumentRejectSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    # Mettre à jour le document
    document.status = 'rejected'
    document.verified_at = timezone.now()
    document.verified_by = request.user
    document.rejection_reason = f"{serializer.validated_data['reason']}: {serializer.validated_data['details']}"
    document.save()
    
    # Créer décision
    ValidationDecision.objects.create(
        document=document,
        admin=request.user,
        decision='reject',
        reason=serializer.validated_data['reason'],
        notes=serializer.validated_data['details'],
        ai_assisted=document.ai_analyzed,
        ai_recommendation_followed=(
            document.ai_recommendation == 'reject' if document.ai_analyzed else None
        ),
    )
    
    # TODO: Envoyer email notification user
    
    return Response({
        'success': True,
        'message': 'Document rejeté',
        'document': DocumentDetailSerializer(document, context={'request': request}).data,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def flag_document(request, document_id):
    """
    POST /api/admin/documents/{id}/flag/
    
    Signaler un document comme suspect
    
    Body:
    {
        "reason": "Incohérences détectées dans les dates",
        "severity": "high"
    }
    """
    
    document = get_object_or_404(Document, id=document_id)
    serializer = DocumentFlagSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    # Mettre à jour le document
    document.status = 'flagged'
    document.admin_notes = f"[FLAGGED - {serializer.validated_data['severity'].upper()}] {serializer.validated_data['reason']}"
    document.save()
    
    # Créer décision
    ValidationDecision.objects.create(
        document=document,
        admin=request.user,
        decision='flag',
        reason=serializer.validated_data['reason'],
        notes=f"Severity: {serializer.validated_data['severity']}",
        ai_assisted=document.ai_analyzed,
    )
    
    return Response({
        'success': True,
        'message': 'Document signalé',
        'document': DocumentDetailSerializer(document, context={'request': request}).data,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def analyze_document(request, document_id):
    """
    POST /api/admin/documents/{id}/analyze/
    
    Lancer l'analyse IA d'un document
    """
    
    document = get_object_or_404(Document, id=document_id)
    
    # TODO: Implémenter analyse IA avec Celery task
    # from admin.tasks import analyze_document_task
    # task = analyze_document_task.delay(document.id)
    
    # Pour l'instant, mock
    document.ai_analyzed = True
    document.ai_analyzed_at = timezone.now()
    document.ai_confidence_score = 85.0
    document.ai_recommendation = 'approve'
    document.ai_analysis_json = {
        'extracted_data': {},
        'checks': {},
        'fraud_indicators': {'score': 15, 'severity': 'low'},
        'compliance': {'is_compliant': True},
        'confidence_score': 85,
        'recommendation': 'approve',
        'reason': 'Document appears valid'
    }
    document.save()
    
    return Response({
        'success': True,
        'message': 'Analyse IA lancée',
        'analysis': document.ai_analysis_json,
    })


# ============================================================
# UPLOAD ADMIN POUR USERS
# ============================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def upload_document_for_user(request, user_id):
    """
    POST /api/admin/users/{user_id}/upload-document/
    
    Upload d'un document pour le compte d'un utilisateur
    
    FormData:
    - file: File
    - document_type: string
    - admin_notes: string
    - auto_approve: boolean (default true)
    """
    
    user = get_object_or_404(User, id=user_id)
    
    serializer = DocumentUploadSerializer(
        data={
            'user': user.id,
            'document_type': request.data.get('document_type'),
            'file': request.FILES.get('file'),
            'admin_notes': request.data.get('admin_notes', ''),
            'uploaded_by_admin': request.data.get('auto_approve', 'true') == 'true',
        },
        context={'request': request}
    )
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    document = serializer.save()
    
    # TODO: Envoyer email notification user
    
    return Response({
        'success': True,
        'message': 'Document uploadé et approuvé pour l\'utilisateur',
        'document': DocumentDetailSerializer(document, context={'request': request}).data,
    }, status=status.HTTP_201_CREATED)


# ============================================================
# USER REPORT
# ============================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def user_report(request, user_id):
    """
    GET /api/admin/users/{id}/report/
    
    Rapport complet avec analyse IA pour un utilisateur
    """
    
    user = get_object_or_404(User, id=user_id)
    serializer = UserReportSerializer(user, context={'request': request})
    
    return Response(serializer.data)


# ============================================================
# LÉGISLATION
# ============================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def legislation_list(request):
    """
    GET /api/admin/legislation/
    
    Liste des documents législatifs
    
    Query params:
    - country: CG|CM|GA|etc
    - category: kyc|banking|business|tax|labor
    - indexed: true|false
    - search: texte libre
    """
    
    queryset = LegislationDocument.objects.all()
    
    # Filtres
    country = request.query_params.get('country')
    if country:
        queryset = queryset.filter(country=country)
    
    category = request.query_params.get('category')
    if category:
        queryset = queryset.filter(category=category)
    
    indexed = request.query_params.get('indexed')
    if indexed == 'true':
        queryset = queryset.filter(indexed=True)
    elif indexed == 'false':
        queryset = queryset.filter(indexed=False)
    
    search = request.query_params.get('search')
    if search:
        queryset = queryset.filter(
            Q(title__icontains=search) |
            Q(description__icontains=search)
        )
    
    queryset = queryset.filter(is_active=True).order_by('-upload_date')
    
    # Pagination
    paginator = StandardResultsSetPagination()
    page = paginator.paginate_queryset(queryset, request)
    
    serializer = LegislationDocumentListSerializer(page, many=True)
    
    return paginator.get_paginated_response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def legislation_upload(request):
    """
    POST /api/admin/legislation/upload/
    
    Upload d'un document législatif
    
    FormData:
    - file: PDF file
    - country: CG|CM|etc
    - category: kyc|banking|etc
    - title: string
    - description: string (optional)
    - effective_date: YYYY-MM-DD (optional)
    - language: fr|en (default fr)
    - tags: ["tag1", "tag2"] (optional)
    """
    
    serializer = LegislationDocumentUploadSerializer(
        data=request.data,
        context={'request': request}
    )
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    document = serializer.save()
    
    # TODO: Lancer indexation asynchrone
    # from admin.tasks import index_legislation_task
    # index_legislation_task.delay(document.id)
    
    return Response({
        'success': True,
        'message': 'Document législatif uploadé. Indexation en cours...',
        'document': LegislationDocumentDetailSerializer(
            document, 
            context={'request': request}
        ).data,
    }, status=status.HTTP_201_CREATED)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated, IsAdminUser])
def legislation_delete(request, legislation_id):
    """
    DELETE /api/admin/legislation/{id}/
    
    Supprimer un document législatif
    """
    
    document = get_object_or_404(LegislationDocument, id=legislation_id)
    
    # Soft delete
    document.is_active = False
    document.save()
    
    # TODO: Supprimer vecteurs de la base vectorielle
    
    return Response({
        'success': True,
        'message': 'Document législatif supprimé',
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def legislation_reindex(request, legislation_id):
    """
    POST /api/admin/legislation/{id}/reindex/
    
    Réindexer un document législatif
    """
    
    document = get_object_or_404(LegislationDocument, id=legislation_id)
    
    # TODO: Relancer indexation
    # from admin.tasks import index_legislation_task
    # index_legislation_task.delay(document.id)
    
    return Response({
        'success': True,
        'message': 'Réindexation lancée',
    })
