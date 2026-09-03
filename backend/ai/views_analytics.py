# backend/ai/views_analytics.py - VERSION AVEC FILTRES AVANCÉS
"""
Endpoints Analytics RAG pour TERAS
Dashboard complet avec filtres avancés
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Count, Avg, Q, Sum, F
from django.db.models.functions import TruncDate, TruncWeek, TruncMonth
from django.utils import timezone
from datetime import datetime, timedelta
from collections import Counter
import json

from .models import RAGQuery
from users.permissions import IsAdminUser


def apply_filters(queryset, request):
    """
    Applique les filtres avancés au queryset
    
    Filtres supportés:
    - days: nombre de jours (défaut: 30)
    - start_date: date début (YYYY-MM-DD)
    - end_date: date fin (YYYY-MM-DD)
    - user_id: ID utilisateur spécifique
    - user_type: type utilisateur (admin, individual, etc.)
    - response_time_min: temps min en ms
    - response_time_max: temps max en ms
    - docs_used_min: nombre min docs utilisés
    - docs_used_max: nombre max docs utilisés
    - doc_type: type de document (legislation, documentation, etc.)
    """
    
    # Filtre temporel
    if request.GET.get('start_date') or request.GET.get('end_date'):
        start_date_raw = request.GET.get('start_date')
        end_date_raw = request.GET.get('end_date')

        if start_date_raw:
            start_date = timezone.make_aware(datetime.strptime(start_date_raw, '%Y-%m-%d'))
            queryset = queryset.filter(created_at__gte=start_date)

        if end_date_raw:
            end_date = timezone.make_aware(datetime.strptime(end_date_raw, '%Y-%m-%d') + timedelta(days=1))
            queryset = queryset.filter(created_at__lt=end_date)
    else:
        days = int(request.GET.get('days', 30))
        if days > 0:
            start_date = timezone.now() - timedelta(days=days)
            queryset = queryset.filter(created_at__gte=start_date)
    
    # Filtre utilisateur
    if request.GET.get('user_id'):
        queryset = queryset.filter(user_id=request.GET.get('user_id'))
    
    if request.GET.get('user_type'):
        queryset = queryset.filter(user__user_type=request.GET.get('user_type'))
    
    # Filtre temps de réponse
    if request.GET.get('response_time_min'):
        queryset = queryset.filter(response_time_ms__gte=int(request.GET.get('response_time_min')))
    
    if request.GET.get('response_time_max'):
        queryset = queryset.filter(response_time_ms__lte=int(request.GET.get('response_time_max')))
    
    # Filtre documents utilisés
    if request.GET.get('docs_used_min'):
        queryset = queryset.filter(documents_used__gte=int(request.GET.get('docs_used_min')))
    
    if request.GET.get('docs_used_max'):
        queryset = queryset.filter(documents_used__lte=int(request.GET.get('docs_used_max')))
    
    # Filtre type de document (recherche dans metadata)
    if request.GET.get('doc_type'):
        doc_type = request.GET.get('doc_type')
        # Filtrer les requêtes qui contiennent ce type dans leurs sources
        filtered_ids = []
        for q in queryset:
            if q.metadata and 'sources' in q.metadata:
                for source in q.metadata['sources']:
                    if source.get('type') == doc_type:
                        filtered_ids.append(q.id)
                        break
        queryset = queryset.filter(id__in=filtered_ids)
    
    return queryset


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def rag_analytics_overview(request):
    """
    Vue d'ensemble analytics RAG avec filtres
    GET /api/ai/analytics/overview/?days=30&user_type=admin&response_time_max=3000
    """
    # Appliquer filtres
    queries = apply_filters(RAGQuery.objects.all(), request)
    
    # Métriques principales
    total_queries = queries.count()
    avg_response_time = queries.aggregate(avg=Avg('response_time_ms'))['avg'] or 0
    avg_docs_found = queries.aggregate(avg=Avg('documents_found'))['avg'] or 0
    avg_docs_used = queries.aggregate(avg=Avg('documents_used'))['avg'] or 0
    
    # Utilisateurs actifs
    active_users = queries.values('user').distinct().count()
    
    # Tokens utilisés
    total_tokens = 0
    for q in queries:
        if q.metadata and 'tokens_used' in q.metadata:
            total_tokens += q.metadata['tokens_used']
    
    # Évolution par jour
    daily_stats = list(
        queries.annotate(date=TruncDate('created_at'))
        .values('date')
        .annotate(count=Count('id'), avg_time=Avg('response_time_ms'))
        .order_by('date')
    )
    
    # Filtres actifs
    active_filters = {
        'days': request.GET.get('days', '30'),
        'start_date': request.GET.get('start_date'),
        'end_date': request.GET.get('end_date'),
        'user_type': request.GET.get('user_type'),
        'response_time_range': f"{request.GET.get('response_time_min', '0')}-{request.GET.get('response_time_max', '∞')}",
        'docs_used_range': f"{request.GET.get('docs_used_min', '0')}-{request.GET.get('docs_used_max', '∞')}",
        'doc_type': request.GET.get('doc_type'),
    }
    
    return Response({
        'metrics': {
            'total_queries': total_queries,
            'avg_response_time_ms': round(avg_response_time, 0),
            'avg_documents_found': round(avg_docs_found, 1),
            'avg_documents_used': round(avg_docs_used, 1),
            'active_users': active_users,
            'total_tokens': total_tokens,
            'estimated_cost_usd': round(total_tokens * 0.000003, 2)
        },
        'daily_stats': daily_stats,
        'active_filters': active_filters
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def rag_analytics_queries(request):
    """
    Analytics détaillées des requêtes avec filtres
    GET /api/ai/analytics/queries/?days=30&doc_type=legislation
    """
    queries = apply_filters(RAGQuery.objects.all(), request)
    
    # Top 10 requêtes
    top_queries = list(
        queries.values('query')
        .annotate(count=Count('id'))
        .order_by('-count')[:10]
    )
    
    # Distribution temps de réponse
    response_time_distribution = {
        'fast': queries.filter(response_time_ms__lt=1000).count(),
        'medium': queries.filter(response_time_ms__gte=1000, response_time_ms__lt=3000).count(),
        'slow': queries.filter(response_time_ms__gte=3000).count()
    }
    
    # Requêtes par heure
    queries_by_hour = [0] * 24
    for q in queries:
        hour = q.created_at.hour
        queries_by_hour[hour] += 1
    
    return Response({
        'top_queries': top_queries,
        'response_time_distribution': response_time_distribution,
        'queries_by_hour': queries_by_hour
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def rag_analytics_documents(request):
    """
    Analytics des documents avec filtres
    GET /api/ai/analytics/documents/?days=30&doc_type=documentation
    """
    queries = apply_filters(RAGQuery.objects.all(), request)
    
    # Compter sources utilisées
    source_counter = Counter()
    doc_type_counter = Counter()
    
    for query in queries:
        if query.metadata and 'sources' in query.metadata:
            for source in query.metadata['sources']:
                title = source.get('title', 'Unknown')
                doc_type = source.get('type', 'unknown')
                source_counter[title] += 1
                doc_type_counter[doc_type] += 1
    
    # Top 15 documents
    top_documents = [
        {'title': title, 'count': count}
        for title, count in source_counter.most_common(15)
    ]
    
    # Distribution par type
    documents_by_type = [
        {'type': doc_type, 'count': count}
        for doc_type, count in doc_type_counter.items()
    ]
    
    # Taux d'utilisation
    total_found = queries.aggregate(sum=Sum('documents_found'))['sum'] or 0
    total_used = queries.aggregate(sum=Sum('documents_used'))['sum'] or 0
    usage_rate = round((total_used / total_found * 100), 1) if total_found > 0 else 0
    
    return Response({
        'top_documents': top_documents,
        'documents_by_type': documents_by_type,
        'usage_stats': {
            'total_found': total_found,
            'total_used': total_used,
            'usage_rate_percent': usage_rate
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def rag_analytics_users(request):
    """
    Analytics par utilisateur avec filtres
    GET /api/ai/analytics/users/?days=30&user_type=admin
    """
    queries = apply_filters(RAGQuery.objects.all(), request)
    
    # Top utilisateurs
    top_users = list(
        queries.values('user__username', 'user__user_type')
        .annotate(
            query_count=Count('id'),
            avg_response_time=Avg('response_time_ms')
        )
        .order_by('-query_count')[:10]
    )
    
    # Distribution par type
    queries_by_user_type = list(
        queries.values('user__user_type')
        .annotate(count=Count('id'))
        .order_by('-count')
    )
    
    return Response({
        'top_users': top_users,
        'queries_by_user_type': queries_by_user_type
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def rag_analytics_trends(request):
    """
    Tendances temporelles avec filtres
    GET /api/ai/analytics/trends/?days=90
    """
    queries = apply_filters(RAGQuery.objects.all(), request)
    
    # Tendances hebdomadaires
    weekly_trends = list(
        queries.annotate(week=TruncWeek('created_at'))
        .values('week')
        .annotate(
            count=Count('id'),
            avg_time=Avg('response_time_ms'),
            avg_docs=Avg('documents_used')
        )
        .order_by('week')
    )
    
    # Tendances mensuelles
    monthly_trends = list(
        queries.annotate(month=TruncMonth('created_at'))
        .values('month')
        .annotate(
            count=Count('id'),
            avg_time=Avg('response_time_ms'),
            unique_users=Count('user', distinct=True)
        )
        .order_by('month')
    )
    
    # Croissance
    if len(weekly_trends) >= 2:
        last_week = weekly_trends[-1]['count']
        prev_week = weekly_trends[-2]['count']
        growth_rate = round(((last_week - prev_week) / prev_week * 100), 1) if prev_week > 0 else 0
    else:
        growth_rate = 0
    
    return Response({
        'weekly_trends': weekly_trends,
        'monthly_trends': monthly_trends,
        'growth_rate_percent': growth_rate
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def rag_analytics_export(request):
    """
    Export données avec filtres
    GET /api/ai/analytics/export/?format=json&days=30
    """
    format_type = request.GET.get('format', 'json')
    queries = apply_filters(RAGQuery.objects.all().select_related('user'), request)
    
    data = []
    for q in queries:
        data.append({
            'timestamp': q.created_at.isoformat(),
            'user': q.user.username if q.user else 'Anonymous',
            'user_type': q.user.user_type if q.user else 'unknown',
            'query': q.query,
            'documents_found': q.documents_found,
            'documents_used': q.documents_used,
            'response_time_ms': q.response_time_ms,
            'response_length': len(q.response) if q.response else 0
        })
    
    return Response({
        'total_records': len(data),
        'data': data,
        'filters_applied': {
            'days': request.GET.get('days'),
            'start_date': request.GET.get('start_date'),
            'end_date': request.GET.get('end_date'),
            'user_type': request.GET.get('user_type'),
            'doc_type': request.GET.get('doc_type'),
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def rag_analytics_filter_options(request):
    """
    NOUVEAU: Retourne les options disponibles pour les filtres
    GET /api/ai/analytics/filter-options/
    """
    # Types de documents disponibles
    doc_types = set()
    for q in RAGQuery.objects.all():
        if q.metadata and 'sources' in q.metadata:
            for source in q.metadata['sources']:
                if source.get('type'):
                    doc_types.add(source.get('type'))
    
    # Types d'utilisateurs
    from django.contrib.auth import get_user_model
    User = get_user_model()
    user_types = list(
        User.objects.exclude(user_type__isnull=True)
        .exclude(user_type='')
        .order_by('user_type')
        .values_list('user_type', flat=True)
        .distinct()
    )
    
    # Utilisateurs actifs (pour dropdown)
    active_users = list(
        RAGQuery.objects.values('user__id', 'user__username')
        .annotate(query_count=Count('id'))
        .order_by('-query_count')[:20]
    )
    
    return Response({
        'doc_types': sorted(list(doc_types)),
        'user_types': sorted(user_types),
        'active_users': active_users,
        'response_time_presets': [
            {'label': 'Rapide (<1s)', 'min': 0, 'max': 1000},
            {'label': 'Moyen (1-3s)', 'min': 1000, 'max': 3000},
            {'label': 'Lent (>3s)', 'min': 3000, 'max': 999999},
        ],
        'docs_used_presets': [
            {'label': 'Peu (1-3)', 'min': 1, 'max': 3},
            {'label': 'Moyen (4-6)', 'min': 4, 'max': 6},
            {'label': 'Beaucoup (7+)', 'min': 7, 'max': 999},
        ]
    })
