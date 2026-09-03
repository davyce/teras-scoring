# backend/scoring/views_admin.py
"""
Vues Admin TERAS - VERSION COMPLÈTE
✅ Dashboard Admin
✅ Gestion Users
✅ Analytics
✅ Activities
✅ KYC Admin (list/detail/approve/reject)
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db.models import Avg, Count, Q
from django.db.models.functions import TruncDate
from datetime import timedelta
from collections import defaultdict

from .models import TerasScore, KYCRequest

User = get_user_model()

try:
    from users.models import Profile
except Exception:
    Profile = None


# ============================================================================
# PERMISSIONS
# ============================================================================

class IsAdminUser(permissions.BasePermission):
    """Permission admin"""

    def has_permission(self, request, view):
        return (
                request.user and
                request.user.is_authenticated and
                (request.user.is_staff or getattr(request.user, "user_type", "") == 'admin')
        )


# ============================================================================
# RÉGIONS CONGO-BRAZZAVILLE
# ============================================================================

REGIONS_CONGO = [
    'Brazzaville', 'Pointe-Noire', 'Bouenza', 'Cuvette', 'Cuvette-Ouest',
    'Kouilou', 'Lékoumou', 'Likouala', 'Niari', 'Plateaux', 'Pool', 'Sangha'
]

SECTEURS_ECONOMIQUES = [
    'Commerce', 'Agriculture', 'Services', 'Transport', 'BTP',
    'Industrie', 'Télécoms', 'Santé', 'Éducation', 'Finance'
]


def _compute_risk_level(score):
    if score is None:
        return None
    if score >= 700:
        return 'low'
    if score >= 500:
        return 'medium'
    return 'high'


def _latest_scores_for_user_ids(user_ids):
    latest_scores = {}
    for score in TerasScore.objects.filter(user_id__in=user_ids).order_by('user_id', '-created_at'):
        latest_scores.setdefault(score.user_id, score)
    return latest_scores


def _build_admin_user_queryset():
    queryset = User.objects.all()
    if Profile is not None:
        queryset = queryset.select_related('profile')
    return queryset.order_by('-date_joined')


def _get_user_region(user):
    region = (getattr(user, 'region', '') or '').strip()
    if region:
        return region
    profile = getattr(user, 'profile', None)
    city = (getattr(profile, 'city', '') or '').strip() if profile else ''
    return city or 'Non renseigné'


def _get_user_sector(user):
    sector = (getattr(user, 'sector', '') or '').strip()
    if sector:
        return sector
    user_type = getattr(user, 'user_type', '') or 'individual'
    if user_type == 'enterprise':
        return 'Entreprise non classifiée'
    if user_type == 'bank':
        return 'Finance'
    if user_type == 'government':
        return 'Administration publique'
    return 'Non renseigné'


def _score_band(score):
    if score is None:
        return None
    if score < 300:
        return 'debutant'
    if score < 500:
        return 'bronze'
    if score < 650:
        return 'argent'
    if score < 800:
        return 'or'
    return 'diamant'


def _apply_admin_user_filters(queryset, request):
    search = request.query_params.get('search', '').strip()
    user_type = request.query_params.get('type', '').strip()
    region = request.query_params.get('region', '').strip()
    status_filter = request.query_params.get('status', '').strip()
    kyc_filter = request.query_params.get('kyc', '').strip()

    if search:
        queryset = queryset.filter(
            Q(email__icontains=search) |
            Q(username__icontains=search) |
            Q(first_name__icontains=search) |
            Q(last_name__icontains=search) |
            Q(region__icontains=search) |
            Q(profile__city__icontains=search) |
            Q(profile__address__icontains=search)
        )

    if user_type and hasattr(User, 'user_type'):
        queryset = queryset.filter(user_type=user_type)

    if region and hasattr(User, 'region'):
        queryset = queryset.filter(region=region)

    if status_filter == 'active':
        queryset = queryset.filter(is_active=True)
    elif status_filter == 'suspended':
        queryset = queryset.filter(is_active=False)

    if kyc_filter and hasattr(User, 'kyc_status'):
        queryset = queryset.filter(kyc_status=kyc_filter)

    return queryset


# ============================================================================
# DASHBOARD ADMIN
# ============================================================================

class AdminDashboardView(APIView):
    """
    GET /api/scoring/admin/dashboard/
    Dashboard principal admin avec métriques et activités récentes
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        try:
            users = list(_build_admin_user_queryset())
            total_users = len(users)
            active_users = sum(1 for user in users if getattr(user, 'is_active', False))

            # Utilisateurs par type
            individual_users = sum(1 for user in users if getattr(user, 'user_type', '') == 'individual')
            enterprise_users = sum(1 for user in users if getattr(user, 'user_type', '') == 'enterprise')

            # Nouveaux utilisateurs cette semaine
            week_ago = timezone.now() - timedelta(days=7)
            new_users_week = sum(1 for user in users if user.date_joined >= week_ago)

            # Score moyen
            avg_score = TerasScore.objects.aggregate(avg=Avg('score'))['avg'] or 0

            current_period_start = timezone.now() - timedelta(days=30)
            previous_period_start = current_period_start - timedelta(days=30)
            current_avg = (
                TerasScore.objects.filter(created_at__gte=current_period_start)
                .aggregate(avg=Avg('score'))['avg']
            )
            previous_avg = (
                TerasScore.objects.filter(
                    created_at__gte=previous_period_start,
                    created_at__lt=current_period_start,
                ).aggregate(avg=Avg('score'))['avg']
            )
            score_trend = round(float((current_avg or 0) - (previous_avg or 0)), 1)

            # KYC stats
            kyc_pending = KYCRequest.objects.filter(status='pending').count()
            kyc_approved = KYCRequest.objects.filter(status='approved').count()
            kyc_rejected = KYCRequest.objects.filter(status='rejected').count()

            latest_scores = _latest_scores_for_user_ids([user.id for user in users])
            scored_users = 0
            risk_distribution = {'low': 0, 'medium': 0, 'high': 0}
            for score in latest_scores.values():
                risk_level = _compute_risk_level(getattr(score, 'score', None))
                if not risk_level:
                    continue
                scored_users += 1
                risk_distribution[risk_level] += 1

            # Métriques
            metrics = {
                'total_users': total_users,
                'active_users': active_users,
                'suspended_users': total_users - active_users,
                'individual_users': individual_users,
                'enterprise_users': enterprise_users,
                'new_users_week': new_users_week,
                'avg_score': round(avg_score, 1),
                'score_trend': score_trend,
                'total_transactions': TerasScore.objects.count(),
                'fraud_alerts': risk_distribution['high'],
                'critical_alerts': sum(
                    1 for score in latest_scores.values() if (getattr(score, 'score', 0) or 0) < 350
                ),
                'kyc_pending': kyc_pending,
                'kyc_approved': kyc_approved,
                'kyc_rejected': kyc_rejected,
                'scored_users': scored_users,
            }

            # Activités récentes
            recent_activities = []
            recent_users = users[:10]
            for i, u in enumerate(recent_users):
                recent_activities.append({
                    'id': str(i + 1),
                    'user_id': u.id,
                    'username': u.username,
                    'action': 'Inscription',
                    'details': f"Nouvel utilisateur: {u.email}",
                    'status': 'success',
                    'timestamp': u.date_joined.isoformat(),
                    'region': _get_user_region(u),
                })

            # Stats par région
            regions_stats = {
                region: {'count': 0, 'active': 0, 'avg_score': 0}
                for region in REGIONS_CONGO
            }
            dynamic_regions = {}
            sectors_stats = {}
            region_scores = {}
            for region in REGIONS_CONGO:
                region_scores[region] = []

            for user in users:
                region = _get_user_region(user)
                bucket = regions_stats.get(region)
                if bucket is None:
                    bucket = dynamic_regions.setdefault(region, {'count': 0, 'active': 0, 'avg_score': 0})
                    region_scores.setdefault(region, [])
                bucket['count'] += 1
                if getattr(user, 'is_active', False):
                    bucket['active'] += 1

                score_obj = latest_scores.get(user.id)
                score_value = getattr(score_obj, 'score', None) if score_obj else None
                if score_value is not None:
                    region_scores.setdefault(region, []).append(float(score_value))

                sector = _get_user_sector(user)
                sectors_stats[sector] = sectors_stats.get(sector, 0) + 1

            regions_stats.update(dynamic_regions)
            for region_name, payload in regions_stats.items():
                scores = region_scores.get(region_name, [])
                payload['avg_score'] = round(sum(scores) / len(scores), 1) if scores else 0

            sorted_sector_items = sorted(
                sectors_stats.items(),
                key=lambda item: item[1],
                reverse=True,
            )
            sectors_stats = {name: count for name, count in sorted_sector_items[:8]}

            fraud_alerts_recent = []
            for user in users:
                score_obj = latest_scores.get(user.id)
                score_value = getattr(score_obj, 'score', None) if score_obj else None
                if score_value is None or score_value >= 500:
                    continue
                severity = 'critical' if score_value < 350 else 'high'
                fraud_alerts_recent.append({
                    'id': f'fraud-{user.id}',
                    'username': user.username or user.email,
                    'severity': severity,
                    'description': (
                        f"Score TERAS faible ({int(score_value)}) "
                        f"sur le profil de {_get_user_region(user)}."
                    ),
                    'detected_at': (getattr(score_obj, 'created_at', None) or user.date_joined).isoformat(),
                    'auto_action': 'Surveillance renforcée du dossier',
                })
            fraud_alerts_recent.sort(key=lambda item: item['detected_at'], reverse=True)

            return Response({
                'metrics': metrics,
                'recent_activities': recent_activities,
                'regions_stats': regions_stats,
                'sectors_stats': sectors_stats,
                'risk_distribution': risk_distribution,
                'system_health': {
                    'api_status': 'operational',
                    'database_status': 'healthy',
                    'ai_service': 'active',
                    'uptime_percentage': 99.9,
                    'response_time_avg': 118,
                    'active_connections': active_users,
                },
                'fraud_alerts_recent': fraud_alerts_recent[:5],
            })

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================================================
# GESTION DES UTILISATEURS
# ============================================================================

class AdminUsersListView(APIView):
    """
    GET /api/scoring/admin/users/
    Liste des utilisateurs avec filtres et pagination
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            page = int(request.query_params.get('page', 1))
            page_size = int(request.query_params.get('page_size', 20))

            # Query de base
            queryset = _apply_admin_user_filters(_build_admin_user_queryset(), request)

            # Pagination
            total = queryset.count()
            offset = (page - 1) * page_size
            users_page = queryset[offset:offset + page_size]
            latest_scores = _latest_scores_for_user_ids([u.id for u in users_page])

            # Sérialiser
            users_data = []
            for u in users_page:
                last_score = latest_scores.get(u.id)
                profile = getattr(u, 'profile', None)

                users_data.append({
                    'id': u.id,
                    'email': u.email,
                    'username': u.username,
                    'first_name': getattr(u, 'first_name', ''),
                    'last_name': getattr(u, 'last_name', ''),
                    'phone': getattr(profile, 'phone_number', '') if profile else '',
                    'region': getattr(u, 'region', 'Brazzaville'),
                    'city': getattr(profile, 'city', '') if profile else '',
                    'address': getattr(profile, 'address', '') if profile else '',
                    'user_type': getattr(u, 'user_type', 'individual'),
                    'is_active': u.is_active,
                    'date_joined': u.date_joined.isoformat(),
                    'last_login': u.last_login.isoformat() if u.last_login else None,
                    'score': last_score.score if last_score else None,
                    'level': last_score.level if last_score else 'debutant',
                    'risk_level': _compute_risk_level(last_score.score if last_score else None),
                    'kyc_status': getattr(u, 'kyc_status', 'pending'),
                })

            return Response({
                'users': users_data,
                'total': total,
                'page': page,
                'page_size': page_size,
                'total_pages': (total + page_size - 1) // page_size,
            })

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminUsersMapView(APIView):
    """
    GET /api/scoring/admin/users/map/
    Liste des utilisateurs géolocalisés pour la carte admin.
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        try:
            if Profile is None:
                return Response({'users': [], 'total': 0, 'message': 'Profile indisponible'})

            queryset = _apply_admin_user_filters(_build_admin_user_queryset(), request).filter(
                profile__latitude__isnull=False,
                profile__longitude__isnull=False,
            )

            users = list(queryset)
            latest_scores = _latest_scores_for_user_ids([u.id for u in users])
            users_data = []

            for user in users:
                profile = getattr(user, 'profile', None)
                last_score = latest_scores.get(user.id)
                score_value = last_score.score if last_score else None

                users_data.append({
                    'id': user.id,
                    'email': user.email,
                    'username': user.username,
                    'first_name': getattr(user, 'first_name', '') or '',
                    'last_name': getattr(user, 'last_name', '') or '',
                    'full_name': f"{getattr(user, 'first_name', '') or ''} {getattr(user, 'last_name', '') or ''}".strip() or user.username,
                    'user_type': getattr(user, 'user_type', 'individual'),
                    'region': getattr(user, 'region', '') or '',
                    'city': getattr(profile, 'city', '') if profile else '',
                    'address': getattr(profile, 'address', '') if profile else '',
                    'phone_number': getattr(profile, 'phone_number', '') if profile else '',
                    'latitude': float(profile.latitude) if profile and profile.latitude is not None else None,
                    'longitude': float(profile.longitude) if profile and profile.longitude is not None else None,
                    'location_source': getattr(profile, 'location_source', '') if profile else '',
                    'location_updated_at': profile.location_updated_at.isoformat() if profile and profile.location_updated_at else None,
                    'kyc_status': getattr(user, 'kyc_status', 'pending'),
                    'is_active': user.is_active,
                    'score': score_value,
                    'risk_level': _compute_risk_level(score_value),
                })

            return Response({
                'users': users_data,
                'total': len(users_data),
                'geolocated_count': len(users_data),
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminUserDetailView(APIView):
    """
    GET /api/scoring/admin/users/<user_id>/
    Détails d'un utilisateur spécifique
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)

            # Scores
            scores = TerasScore.objects.filter(user=user).order_by('-created_at')[:10]
            last_score = scores.first()

            # KYC
            kyc_requests = KYCRequest.objects.filter(user=user).order_by('-submitted_at')[:5]

            return Response({
                'id': user.id,
                'email': user.email,
                'username': user.username,
                'first_name': getattr(user, 'first_name', ''),
                'last_name': getattr(user, 'last_name', ''),
                'phone': getattr(user, 'phone', ''),
                'region': getattr(user, 'region', 'Brazzaville'),
                'user_type': getattr(user, 'user_type', 'individual'),
                'is_active': user.is_active,
                'is_staff': user.is_staff,
                'date_joined': user.date_joined.isoformat(),
                'last_login': user.last_login.isoformat() if user.last_login else None,
                'kyc_status': getattr(user, 'kyc_status', 'pending'),
                'last_score': {
                    'score': last_score.score if last_score else 0,
                    'level': last_score.level if last_score else 'debutant',
                    'breakdown': last_score.breakdown if last_score else {},
                    'created_at': last_score.created_at.isoformat() if last_score else None,
                } if last_score else None,
                'statistics': {
                    'total_calculations': scores.count() if hasattr(scores, 'count') else len(list(scores)),
                    'average_score': round(sum(s.score for s in TerasScore.objects.filter(user=user)) / max(TerasScore.objects.filter(user=user).count(), 1), 1),
                    'min_score': TerasScore.objects.filter(user=user).order_by('score').first().score if TerasScore.objects.filter(user=user).exists() else 0,
                    'max_score': TerasScore.objects.filter(user=user).order_by('-score').first().score if TerasScore.objects.filter(user=user).exists() else 0,
                },
                'score_history': [{
                    'id': s.id,
                    'score': s.score,
                    'level': s.level,
                    'created_at': s.created_at.isoformat(),
                } for s in scores],
                'kyc_requests': [{
                    'id': k.id,
                    'status': k.status,
                    'document_type': k.document_type,
                    'submitted_at': k.submitted_at.isoformat(),
                    'reviewed_at': k.reviewed_at.isoformat() if k.reviewed_at else None,
                } for k in kyc_requests],
            })

        except User.DoesNotExist:
            return Response({'error': 'Utilisateur non trouvé'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminUserSuspendView(APIView):
    """
    POST /api/scoring/admin/users/<user_id>/suspend/
    Suspendre un utilisateur
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
            user.is_active = False
            user.save(update_fields=['is_active'])

            return Response({
                'success': True,
                'message': f'Utilisateur {user.email} suspendu',
                'user_id': user.id,
            })

        except User.DoesNotExist:
            return Response({'error': 'Utilisateur non trouvé'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminUserRestoreView(APIView):
    """
    POST /api/scoring/admin/users/<user_id>/restore/
    Réactiver un utilisateur
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
            user.is_active = True
            user.save(update_fields=['is_active'])

            return Response({
                'success': True,
                'message': f'Utilisateur {user.email} réactivé',
                'user_id': user.id,
            })

        except User.DoesNotExist:
            return Response({'error': 'Utilisateur non trouvé'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================================================
# ANALYTICS
# ============================================================================

class AdminAnalyticsView(APIView):
    """
    GET /api/scoring/admin/analytics/
    Données analytiques pour tableaux de bord
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        try:
            now = timezone.now()
            users = list(_build_admin_user_queryset())
            user_ids = [user.id for user in users]
            latest_scores = _latest_scores_for_user_ids(user_ids)
            score_values = [score.score for score in latest_scores.values() if score.score is not None]
            total_users = len(users)
            active_users = sum(
                1 for user in users
                if user.is_active and user.last_login and user.last_login >= now - timedelta(days=30)
            )
            suspended_users = sum(1 for user in users if not user.is_active)
            recent_scores = TerasScore.objects.filter(created_at__gte=now - timedelta(days=30)).count()
            approved_kyc_users = KYCRequest.objects.filter(status='approved').values('user_id').distinct().count()
            kyc_completion_rate = round((approved_kyc_users / total_users) * 100, 1) if total_users else 0.0

            registrations_by_day = {
                row['day'].strftime('%Y-%m-%d'): row['count']
                for row in User.objects.filter(date_joined__gte=now - timedelta(days=30))
                .annotate(day=TruncDate('date_joined'))
                .values('day')
                .annotate(count=Count('id'))
            }
            scores_by_day = {
                row['day'].strftime('%Y-%m-%d'): round(row['avg_score'] or 0, 1)
                for row in TerasScore.objects.filter(created_at__gte=now - timedelta(days=30))
                .annotate(day=TruncDate('created_at'))
                .values('day')
                .annotate(avg_score=Avg('score'))
            }
            score_evolution = []
            for i in range(30):
                day = (now - timedelta(days=29 - i)).date().isoformat()
                score_evolution.append({
                    'date': day,
                    'avg_score': scores_by_day.get(day, round(sum(score_values) / len(score_values), 1) if score_values else 0),
                    'new_users': registrations_by_day.get(day, 0),
                })

            recent_registrations = []
            for i in range(6, -1, -1):
                day = (now - timedelta(days=i)).date().isoformat()
                recent_registrations.append({
                    'date': day,
                    'count': registrations_by_day.get(day, 0),
                })

            users_by_type = list(
                User.objects.values('user_type')
                .annotate(count=Count('id'))
                .order_by('user_type')
            )

            score_distribution = {
                'debutant': 0,
                'bronze': 0,
                'argent': 0,
                'or': 0,
                'diamant': 0,
            }
            for value in score_values:
                band = _score_band(value)
                if band:
                    score_distribution[band] += 1

            regions_acc = defaultdict(lambda: {
                'users': 0,
                'score_total': 0.0,
                'score_count': 0,
                'recent_users': 0,
                'previous_users': 0,
            })
            sectors_acc = defaultdict(lambda: {
                'users': 0,
                'score_total': 0.0,
                'score_count': 0,
            })

            recent_window_start = now - timedelta(days=7)
            previous_window_start = now - timedelta(days=14)
            for user in users:
                latest_score = latest_scores.get(user.id)
                region = _get_user_region(user)
                sector = _get_user_sector(user)

                regions_acc[region]['users'] += 1
                sectors_acc[sector]['users'] += 1

                if latest_score and latest_score.score is not None:
                    regions_acc[region]['score_total'] += latest_score.score
                    regions_acc[region]['score_count'] += 1
                    sectors_acc[sector]['score_total'] += latest_score.score
                    sectors_acc[sector]['score_count'] += 1

                if user.date_joined >= recent_window_start:
                    regions_acc[region]['recent_users'] += 1
                elif user.date_joined >= previous_window_start:
                    regions_acc[region]['previous_users'] += 1

            ordered_regions = list(dict.fromkeys(REGIONS_CONGO + sorted(regions_acc.keys())))
            regions_data = []
            for region in ordered_regions:
                acc = regions_acc.get(region)
                if not acc or acc['users'] == 0:
                    continue
                previous = acc['previous_users']
                recent = acc['recent_users']
                growth = round((((recent - previous) / previous) * 100), 1) if previous else (100.0 if recent else 0.0)
                regions_data.append({
                    'region': region,
                    'users': acc['users'],
                    'avg_score': round(acc['score_total'] / acc['score_count'], 1) if acc['score_count'] else 0,
                    'growth': growth,
                })

            ordered_sectors = list(dict.fromkeys(SECTEURS_ECONOMIQUES + sorted(sectors_acc.keys())))
            sectors_data = []
            for sector in ordered_sectors:
                acc = sectors_acc.get(sector)
                if not acc or acc['users'] == 0:
                    continue
                sectors_data.append({
                    'sector': sector,
                    'users': acc['users'],
                    'avg_score': round(acc['score_total'] / acc['score_count'], 1) if acc['score_count'] else 0,
                    'volume': round(acc['score_total']),
                })

            kpis = {
                'total_users': total_users,
                'active_users': active_users,
                'avg_score': round(sum(score_values) / len(score_values), 1) if score_values else 0,
                'recent_scores': recent_scores,
                'suspended_users': suspended_users,
                'kyc_completion_rate': kyc_completion_rate,
            }

            return Response({
                'kpis': kpis,
                'score_evolution': score_evolution,
                'regions': regions_data,
                'sectors': sectors_data,
                'score_distribution': score_distribution,
                'recent_registrations': recent_registrations,
                'users_by_type': users_by_type,
                'summary': {
                    **kpis,
                    'total_scores': TerasScore.objects.count(),
                },
            })

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================================================
# ACTIVITIES
# ============================================================================

class AdminActivitiesView(APIView):
    """
    GET /api/scoring/admin/activities/
    Journal des activités récentes
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        try:
            limit = max(1, min(int(request.query_params.get('limit', 50)), 200))
            status_filter = request.query_params.get('status', '')

            activities = []

            recent_users = User.objects.order_by('-date_joined')[:limit]
            for u in recent_users:
                activities.append({
                    'id': f'reg_{u.id}',
                    'user_id': u.id,
                    'username': u.username or u.email or f'Utilisateur {u.id}',
                    'action': 'USER_REGISTRATION',
                    'details': f"Inscription: {u.email}",
                    'status': 'success',
                    'timestamp': u.date_joined.isoformat(),
                    'ip_address': None,
                    'region': _get_user_region(u),
                })

            recent_logins = User.objects.filter(last_login__isnull=False).order_by('-last_login')[:limit]
            for u in recent_logins:
                activities.append({
                    'id': f'login_{u.id}',
                    'user_id': u.id,
                    'username': u.username or u.email or f'Utilisateur {u.id}',
                    'action': 'USER_LOGIN',
                    'details': 'Connexion réussie à l’interface TERAS',
                    'status': 'success',
                    'timestamp': u.last_login.isoformat(),
                    'ip_address': None,
                    'region': _get_user_region(u),
                })

            recent_scores = TerasScore.objects.select_related('user').order_by('-created_at')[:limit]
            for score in recent_scores:
                user = score.user
                activities.append({
                    'id': f'score_{score.id}',
                    'user_id': user.id,
                    'username': user.username or user.email or f'Utilisateur {user.id}',
                    'action': 'SCORE_COMPUTED',
                    'details': f"Score TERAS calculé : {score.score}/1000",
                    'status': 'success',
                    'timestamp': score.created_at.isoformat(),
                    'ip_address': None,
                    'region': _get_user_region(user),
                })

            recent_kyc = KYCRequest.objects.select_related('user').order_by('-submitted_at')[:limit]
            for k in recent_kyc:
                status_val = 'warning' if k.status == 'pending' else ('success' if k.status == 'approved' else 'error')
                activities.append({
                    'id': f'kyc_{k.id}',
                    'user_id': k.user.id,
                    'username': k.user.username or k.user.email or f'Utilisateur {k.user.id}',
                    'action': 'KYC_SUBMISSION',
                    'details': f"KYC {k.status}: {k.document_type}",
                    'status': status_val,
                    'timestamp': k.submitted_at.isoformat(),
                    'ip_address': None,
                    'region': _get_user_region(k.user),
                })

            activities.sort(key=lambda x: x['timestamp'], reverse=True)

            if status_filter in {'success', 'warning', 'error'}:
                activities = [a for a in activities if a['status'] == status_filter]

            return Response({
                'activities': activities[:limit],
                'total': len(activities),
            })

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================================================
# ✅ KYC ADMIN
# ============================================================================

class AdminKYCRequestsListView(APIView):
    """
    GET /api/scoring/admin/kyc/requests/?status=pending|approved|rejected
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        status_filter = request.query_params.get("status")
        qs = KYCRequest.objects.select_related("user", "reviewed_by").order_by("-submitted_at")

        if status_filter in {KYCRequest.STATUS_PENDING, KYCRequest.STATUS_APPROVED, KYCRequest.STATUS_REJECTED}:
            qs = qs.filter(status=status_filter)

        qs = qs[:200]

        data = []
        for k in qs:
            u = k.user
            data.append({
                "id": k.id,
                "status": k.status,
                "document_type": k.document_type,
                "document_url": request.build_absolute_uri(k.document_file.url) if k.document_file else None,
                "document": k.document_file.url if k.document_file else None,
                "submitted_at": k.submitted_at.isoformat(),
                "reviewed_at": k.reviewed_at.isoformat() if k.reviewed_at else None,
                "rejection_reason": k.rejection_reason,
                "user": {
                    "id": u.id,
                    "username": u.username,
                    "email": getattr(u, "email", ""),
                    "first_name": getattr(u, "first_name", ""),
                    "last_name": getattr(u, "last_name", ""),
                    "phone": getattr(u, "phone", ""),
                    "region": getattr(u, "region", ""),
                    "user_type": getattr(u, "user_type", "individual"),
                },
                "reviewed_by": {
                    "id": k.reviewed_by.id,
                    "email": getattr(k.reviewed_by, "email", ""),
                } if k.reviewed_by else None
            })

        return Response({"count": len(data), "requests": data}, status=status.HTTP_200_OK)


class AdminKYCRequestDetailView(APIView):
    """
    GET /api/scoring/admin/kyc/requests/<id>/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, kyc_id: int):
        k = KYCRequest.objects.select_related("user", "reviewed_by").filter(id=kyc_id).first()
        if not k:
            return Response({"error": "KYCRequest introuvable"}, status=status.HTTP_404_NOT_FOUND)

        u = k.user
        return Response({
            "request": {
                "id": k.id,
                "status": k.status,
                "document_type": k.document_type,
                "document_url": request.build_absolute_uri(k.document_file.url) if k.document_file else None,
                "document": k.document_file.url if k.document_file else None,
                "submitted_at": k.submitted_at.isoformat(),
                "reviewed_at": k.reviewed_at.isoformat() if k.reviewed_at else None,
                "rejection_reason": k.rejection_reason,
                "user": {
                    "id": u.id,
                    "username": u.username,
                    "email": getattr(u, "email", ""),
                    "first_name": getattr(u, "first_name", ""),
                    "last_name": getattr(u, "last_name", ""),
                    "phone": getattr(u, "phone", ""),
                    "region": getattr(u, "region", ""),
                    "user_type": getattr(u, "user_type", "individual"),
                },
                "reviewed_by": {
                    "id": k.reviewed_by.id,
                    "email": getattr(k.reviewed_by, "email", ""),
                } if k.reviewed_by else None
            }
        }, status=status.HTTP_200_OK)


class AdminKYCApproveView(APIView):
    """
    POST /api/scoring/admin/kyc/requests/<id>/approve/
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, kyc_id: int):
        k = KYCRequest.objects.select_related("user").filter(id=kyc_id).first()
        if not k:
            return Response({"error": "KYCRequest introuvable"}, status=status.HTTP_404_NOT_FOUND)

        if k.status != KYCRequest.STATUS_PENDING:
            return Response({"error": "Seules les demandes 'pending' peuvent être approuvées"},
                            status=status.HTTP_409_CONFLICT)

        k.approve(request.user)

        # Mettre à jour kyc_status si le champ existe
        if hasattr(k.user, "kyc_status"):
            k.user.kyc_status = "verified"
            k.user.save(update_fields=["kyc_status"])

        return Response({
            "success": True,
            "message": "Demande KYC approuvée",
            "id": k.id,
            "status": k.status
        }, status=status.HTTP_200_OK)


class AdminKYCRejectView(APIView):
    """
    POST /api/scoring/admin/kyc/requests/<id>/reject/
    body: { "reason": "..." }
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, kyc_id: int):
        k = KYCRequest.objects.select_related("user").filter(id=kyc_id).first()
        if not k:
            return Response({"error": "KYCRequest introuvable"}, status=status.HTTP_404_NOT_FOUND)

        if k.status != KYCRequest.STATUS_PENDING:
            return Response({"error": "Seules les demandes 'pending' peuvent être rejetées"},
                            status=status.HTTP_409_CONFLICT)

        reason = (request.data.get("reason") or "").strip()
        if not reason:
            return Response({"error": "reason requis"}, status=status.HTTP_400_BAD_REQUEST)

        k.reject(request.user, reason)

        # Mettre à jour kyc_status si le champ existe
        if hasattr(k.user, "kyc_status"):
            k.user.kyc_status = "rejected"
            k.user.save(update_fields=["kyc_status"])

        return Response({
            "success": True,
            "message": "Demande KYC rejetée",
            "id": k.id,
            "status": k.status,
            "reason": k.rejection_reason
        }, status=status.HTTP_200_OK)

class AdminDocumentsListView(APIView):
    """
    GET /api/scoring/admin/documents/
    Liste tous les documents uploadés par les utilisateurs
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            from users.models import UploadedDocument
            docs = UploadedDocument.objects.all().order_by('-uploaded_at')[:100]
            data = [{
                'id': d.id,
                'user': d.user.email if d.user else None,
                'file': d.file.name if d.file else None,
                'category': d.category,
                'status': d.status,
                'uploaded_at': d.uploaded_at.isoformat(),
            } for d in docs]
            return Response({'documents': data, 'count': len(data)})
        except Exception as e:
            return Response({'documents': [], 'count': 0, 'error': str(e)})
