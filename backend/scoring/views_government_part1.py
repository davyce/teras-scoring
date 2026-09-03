# backend/scoring/views_government_part1.py
"""
Vues pour l'interface Government TERAS - Partie 1
VERSION CONGO-BRAZZAVILLE avec données enrichies
Dashboard, Régions, Secteurs
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from datetime import timedelta
from django.contrib.auth import get_user_model
from django.db.models import Avg, Count, Sum
from django.db.models.functions import TruncDate
from django.utils import timezone

User = get_user_model()


class IsGovernmentUser(IsAuthenticated):
    """Permission : utilisateur de type government"""
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return request.user.user_type == 'government'


class StandardPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


def _score_values():
    from .models import TerasScore
    from .models_bank import BankClient, BankEnterprise

    scores = list(TerasScore.objects.filter(is_simulated=False).values_list('score', flat=True))
    scores += list(BankEnterprise.objects.filter(teras_score__isnull=False).values_list('teras_score', flat=True))
    scores += list(BankClient.objects.filter(teras_score__isnull=False).values_list('teras_score', flat=True))
    return [int(score) for score in scores if score is not None]


def _average_score():
    scores = _score_values()
    return round(sum(scores) / len(scores)) if scores else 0


def _safe_count_scores(day):
    from .models import TerasScore
    return TerasScore.objects.filter(created_at__date=day, is_simulated=False).count()


def _latest_user_score_map():
    from .models import TerasScore

    latest = {}
    for row in (
        TerasScore.objects.filter(is_simulated=False)
        .order_by('user_id', '-created_at')
        .values('user_id', 'score')
    ):
        latest.setdefault(row['user_id'], row['score'])
    return latest


def _build_regions_from_data():
    from .models_bank import BankClient, BankEnterprise

    user_scores = _latest_user_score_map()
    regions = {}

    def add_region(name, active=False, score=None):
        key = (name or '').strip()
        if not key:
            return
        item = regions.setdefault(key, {'name': key, 'total_users': 0, 'active_users': 0, 'scores': []})
        item['total_users'] += 1
        if active:
            item['active_users'] += 1
        if score is not None:
            item['scores'].append(int(score))

    for user in User.objects.exclude(region__isnull=True).exclude(region='').only('id', 'region', 'is_active'):
        add_region(user.region, active=user.is_active, score=user_scores.get(user.id))

    for enterprise in BankEnterprise.objects.only('city', 'status', 'teras_score'):
        add_region(enterprise.city, active=enterprise.status == 'active', score=enterprise.teras_score)

    for client in BankClient.objects.only('city', 'status', 'teras_score'):
        add_region(client.city, active=client.status == 'active', score=client.teras_score)

    result = []
    for idx, item in enumerate(sorted(regions.values(), key=lambda r: r['total_users'], reverse=True), start=1):
        scores = item.pop('scores')
        total = item['total_users']
        item.update({
            'id': idx,
            'code': item['name'][:3].upper(),
            'population': 0,
            'avg_score': round(sum(scores) / len(scores)) if scores else 0,
            'active_rate': round(item['active_users'] / total, 2) if total else 0,
        })
        result.append(item)
    return result


def _build_sectors_from_data():
    from .models_bank import BankEnterprise

    sectors = []
    for idx, row in enumerate(
        BankEnterprise.objects.values('sector')
        .annotate(
            businesses=Count('id'),
            avg_score=Avg('teras_score'),
            revenue=Sum('annual_revenue'),
            employees=Sum('employees_count'),
        )
        .order_by('-businesses'),
        start=1,
    ):
        name = row['sector'] or 'Non classifié'
        sectors.append({
            'id': idx,
            'name': name,
            'code': name[:3].upper(),
            'businesses': row['businesses'],
            'avg_score': round(float(row['avg_score'] or 0)),
            'growth': 0,
            'revenue': float(row['revenue'] or 0),
            'employees': row['employees'] or 0,
        })
    return sectors


def _recent_activity_from_data(limit=8):
    from .models import TerasScore
    from .models_government import ActivityLog

    activities = []
    for log in ActivityLog.objects.select_related('user').order_by('-timestamp')[:limit]:
        activities.append({
            'id': f'activity-{log.id}',
            'user': log.user.email if log.user else 'Système',
            'type': log.get_action_display(),
            'score': log.score or 0,
            'timestamp': log.timestamp.isoformat(),
        })

    remaining = max(limit - len(activities), 0)
    if remaining:
        for score in TerasScore.objects.select_related('user').filter(is_simulated=False).order_by('-created_at')[:remaining]:
            activities.append({
                'id': f'score-{score.id}',
                'user': score.user.email,
                'type': 'Score calculé',
                'score': score.score,
                'timestamp': score.created_at.isoformat(),
            })

    remaining = max(limit - len(activities), 0)
    if remaining:
        for user in User.objects.order_by('-date_joined')[:remaining]:
            activities.append({
                'id': f'user-{user.id}',
                'user': user.email,
                'type': 'Nouvel utilisateur',
                'score': 0,
                'timestamp': user.date_joined.isoformat(),
            })

    return activities[:limit]


# ==================== DASHBOARD ====================

@api_view(['GET'])
@permission_classes([IsGovernmentUser])
def government_dashboard(request):
    """
    Dashboard principal du gouvernement
    GET /api/government/dashboard/
    """
    
    total_users = User.objects.count()
    active_users = User.objects.filter(is_active=True).count()
    today = timezone.localdate()
    
    metrics = {
        'total_population': total_users,
        'active_users': active_users,
        'average_score': _average_score(),
        'scores_today': _safe_count_scores(today),
        'monthly_growth': User.objects.filter(date_joined__date__gte=today - timedelta(days=29)).count(),
    }
    
    users_by_type = list(
        User.objects.values('user_type')
        .annotate(count=Count('id'))
        .order_by('user_type')
    )
    
    data = {
        'metrics': metrics,
        'users_by_type': users_by_type,
        'recent_activity': _recent_activity_from_data(),
        'regions_summary': _build_regions_from_data()[:5],
        'sectors_summary': _build_sectors_from_data()[:5],
    }
    
    return Response(data)


# ==================== RÉGIONS ====================

@api_view(['GET'])
@permission_classes([IsGovernmentUser])
def government_regions_list(request):
    """
    Liste des régions du Congo-Brazzaville
    GET /api/government/regions/
    """
    
    regions_with_rate = _build_regions_from_data()
    total_users = sum(r['total_users'] for r in regions_with_rate)
    
    return Response({
        'total_users': total_users,
        'regions': regions_with_rate
    })


@api_view(['GET'])
@permission_classes([IsGovernmentUser])
def government_region_detail(request, region_id):
    """
    Détails d'une région
    GET /api/government/regions/{id}/
    """
    
    regions = _build_regions_from_data()
    region = next((r for r in regions if r['id'] == region_id), None)
    if not region:
        return Response(
            {'error': 'Région non trouvée'},
            status=status.HTTP_404_NOT_FOUND
        )
    region_copy = region.copy()
    region_copy['alerts'] = []
    return Response(region_copy)


# ==================== SECTEURS ====================

@api_view(['GET'])
@permission_classes([IsGovernmentUser])
def government_sectors_list(request):
    """
    Liste des secteurs économiques
    GET /api/government/sectors/
    """
    
    sectors = _build_sectors_from_data()
    total_enterprises = sum(s['businesses'] for s in sectors)
    
    return Response({
        'total_enterprises': total_enterprises,
        'sectors': sectors
    })


@api_view(['GET'])
@permission_classes([IsGovernmentUser])
def government_sector_detail(request, sector_id):
    """
    Détails d'un secteur
    GET /api/government/sectors/{id}/
    """
    
    sectors = _build_sectors_from_data()
    sector = next((s for s in sectors if s['id'] == sector_id), None)
    if not sector:
        return Response(
            {'error': 'Secteur non trouvé'},
            status=status.HTTP_404_NOT_FOUND
        )
    sector_copy = sector.copy()
    sector_copy['alerts'] = []
    return Response(sector_copy)


# ==================== ANALYTICS ====================

@api_view(['GET'])
@permission_classes([IsGovernmentUser])
def government_analytics_trends(request):
    """
    Tendances et évolutions
    GET /api/government/analytics/trends/
    """
    
    period = request.query_params.get('period', '30d')
    days_by_period = {
        '7d': 7,
        '30d': 30,
        '90d': 90,
        '6m': 180,
        '12m': 365,
    }
    days = days_by_period.get(period, 30)
    today = timezone.localdate()
    start_date = today - timedelta(days=days - 1)

    from .models import TerasScore

    users_by_day = {
        row['day']: row['count']
        for row in (
            User.objects.filter(date_joined__date__gte=start_date)
            .annotate(day=TruncDate('date_joined'))
            .values('day')
            .annotate(count=Count('id'))
        )
    }
    scores_by_day = {
        row['day']: {
            'count': row['count'],
            'avg_score': round(float(row['avg_score'] or 0)),
        }
        for row in (
            TerasScore.objects.filter(created_at__date__gte=start_date, is_simulated=False)
            .annotate(day=TruncDate('created_at'))
            .values('day')
            .annotate(count=Count('id'), avg_score=Avg('score'))
        )
    }

    running_users = User.objects.filter(date_joined__date__lt=start_date).count()
    last_avg_score = round(float(
        TerasScore.objects.filter(created_at__date__lt=start_date, is_simulated=False)
        .aggregate(avg=Avg('score'))['avg'] or 0
    ))

    users_evolution = []
    scores_evolution = []
    for offset in range(days):
        day = start_date + timedelta(days=offset)
        new_users = users_by_day.get(day, 0)
        running_users += new_users

        score_point = scores_by_day.get(day)
        if score_point and score_point['avg_score']:
            last_avg_score = score_point['avg_score']

        users_evolution.append({
            'date': day.isoformat(),
            'count': running_users,
            'new_users': new_users,
        })
        scores_evolution.append({
            'date': day.isoformat(),
            'count': score_point['count'] if score_point else 0,
            'avg_score': last_avg_score,
        })

    data = {
        'period': period,
        'users_evolution': users_evolution,
        'scores_evolution': scores_evolution,
    }
    
    return Response(data)


@api_view(['GET'])
@permission_classes([IsGovernmentUser])
def government_analytics_comparison(request):
    """
    Comparaison régionale/sectorielle
    GET /api/government/analytics/comparison/
    """
    
    comparison_type = request.query_params.get('type', 'regions')
    ids = request.query_params.get('ids', '')
    
    if not ids:
        return Response(
            {'error': 'IDs requis pour la comparaison'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    ids_list = [int(id) for id in ids.split(',') if id.isdigit()]
    
    if comparison_type == 'regions':
        items = [r for r in _build_regions_from_data() if r['id'] in ids_list]
    elif comparison_type == 'sectors':
        items = [s for s in _build_sectors_from_data() if s['id'] in ids_list]
    else:
        return Response(
            {'error': 'Type de comparaison invalide'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    return Response({
        'type': comparison_type,
        'items': items
    })
