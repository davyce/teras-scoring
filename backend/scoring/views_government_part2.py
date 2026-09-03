# backend/scoring/views_government_part2.py
"""
Vues pour l'interface Government TERAS - Partie 2.
Alertes, rapports et paramètres branchés sur les données réelles.
"""

from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.db.models import Avg, Count, Q, Sum
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .models import KYCRequest, TerasScore
from .models_bank import BankClient, BankEnterprise, LoanApplication
from .models_government import ActivityLog, Alert, GovernmentReport, GovernmentSettings
from .views_government_part1 import IsGovernmentUser

User = get_user_model()


# ==================== ALERTES ====================

def _serialize_alert(alert):
    return {
        'id': alert.id,
        'title': alert.title,
        'description': alert.description,
        'severity': alert.severity,
        'type': alert.category,
        'category': alert.category,
        'status': alert.status,
        'impact_score': alert.impact_score,
        'affected_users': alert.affected_users,
        'recommendations': alert.recommendations,
        'timestamp': alert.created_at.isoformat(),
        'created_at': alert.created_at.isoformat(),
        'resolved_at': alert.resolved_at.isoformat() if alert.resolved_at else None,
    }


@api_view(['GET'])
@permission_classes([IsGovernmentUser])
def government_alerts_list(request):
    """
    Liste des alertes.
    GET /api/government/alerts/
    """
    queryset = Alert.objects.all()

    severity = request.query_params.get('severity')
    if severity:
        queryset = queryset.filter(severity=severity)

    status_filter = request.query_params.get('status')
    if status_filter:
        queryset = queryset.filter(status=status_filter)

    alerts = [_serialize_alert(alert) for alert in queryset.order_by('-created_at')[:100]]
    stats = {
        'total': Alert.objects.count(),
        'active': Alert.objects.filter(status='active').count(),
        'critical': Alert.objects.filter(status='active', severity='critical').count(),
    }

    return Response({
        'count': len(alerts),
        'stats': stats,
        'alerts': alerts,
    })


@api_view(['GET'])
@permission_classes([IsGovernmentUser])
def government_alert_detail(request, alert_id):
    """
    Détails d'une alerte.
    GET /api/government/alerts/{id}/
    """
    alert = get_object_or_404(Alert, id=alert_id)
    return Response(_serialize_alert(alert))


@api_view(['POST'])
@permission_classes([IsGovernmentUser])
def government_alert_create(request):
    """
    Créer une alerte.
    POST /api/government/alerts/
    """
    title = (request.data.get('title') or '').strip()
    if not title:
        return Response({'error': 'title requis'}, status=status.HTTP_400_BAD_REQUEST)

    severity = request.data.get('severity', 'medium')
    if severity not in dict(Alert.SEVERITY_CHOICES):
        severity = 'medium'

    category = request.data.get('category') or request.data.get('type') or 'economic'
    if category not in dict(Alert.CATEGORY_CHOICES):
        category = 'economic'

    alert = Alert.objects.create(
        title=title,
        description=request.data.get('description', ''),
        severity=severity,
        category=category,
        impact_score=int(request.data.get('impact_score') or 50),
        affected_users=int(request.data.get('affected_users') or 0),
        recommendations=request.data.get('recommendations') or [],
    )

    return Response(_serialize_alert(alert), status=status.HTTP_201_CREATED)


@api_view(['PATCH'])
@permission_classes([IsGovernmentUser])
def government_alert_update_status(request, alert_id):
    """
    Mettre à jour le statut d'une alerte.
    PATCH /api/government/alerts/{id}/status/
    """
    alert = get_object_or_404(Alert, id=alert_id)
    next_status = request.data.get('status', 'active')
    if next_status not in dict(Alert.STATUS_CHOICES):
        return Response({'error': 'Statut invalide'}, status=status.HTTP_400_BAD_REQUEST)

    alert.status = next_status
    alert.resolved_at = timezone.now() if next_status == 'resolved' else None
    alert.save(update_fields=['status', 'resolved_at', 'updated_at'])

    return Response(_serialize_alert(alert))


# ==================== RAPPORTS ====================

def _safe_float(value):
    return float(value or 0)


def _safe_int(value):
    return int(value or 0)


def _parse_period(request, report_type):
    today = timezone.localdate()
    raw_start = request.data.get('period_start') or request.query_params.get('period_start')
    raw_end = request.data.get('period_end') or request.query_params.get('period_end')

    if raw_start and raw_end:
        return date.fromisoformat(raw_start), date.fromisoformat(raw_end)

    days_by_type = {
        'monthly': 30,
        'quarterly': 90,
        'annual': 365,
        'regional': 90,
        'sectoral': 90,
        'custom': 30,
    }
    days = days_by_type.get(report_type, 30)
    return today - timedelta(days=days - 1), today


def _score_values():
    teras_scores = list(
        TerasScore.objects.filter(is_simulated=False).values_list('score', flat=True)
    )
    enterprise_scores = list(
        BankEnterprise.objects.filter(teras_score__isnull=False).values_list('teras_score', flat=True)
    )
    client_scores = list(
        BankClient.objects.filter(teras_score__isnull=False).values_list('teras_score', flat=True)
    )
    return [int(score) for score in teras_scores + enterprise_scores + client_scores if score is not None]


def _risk_distribution(scores):
    return {
        'low': sum(1 for score in scores if score >= 700),
        'medium': sum(1 for score in scores if 500 <= score < 700),
        'high': sum(1 for score in scores if score < 500),
    }


def _build_report_dataset(period_start, period_end):
    scores = _score_values()
    risk_distribution = _risk_distribution(scores)
    avg_score = round(sum(scores) / len(scores)) if scores else 0

    loan_base = LoanApplication.objects.all()
    approved_loans = loan_base.filter(status__in=['approved', 'disbursed'])
    period_loans = loan_base.filter(created_at__date__gte=period_start, created_at__date__lte=period_end)
    period_scores = TerasScore.objects.filter(created_at__date__gte=period_start, created_at__date__lte=period_end)

    sectors = []
    for row in (
        BankEnterprise.objects.values('sector')
        .annotate(
            businesses=Count('id'),
            avg_score=Avg('teras_score'),
            revenue=Sum('annual_revenue'),
            employees=Sum('employees_count'),
        )
        .order_by('-businesses')[:10]
    ):
        sectors.append({
            'name': row['sector'] or 'Non classifié',
            'businesses': row['businesses'],
            'avg_score': round(_safe_float(row['avg_score'])),
            'revenue': _safe_float(row['revenue']),
            'employees': _safe_int(row['employees']),
        })

    regions = []
    for row in (
        User.objects.exclude(region__isnull=True)
        .exclude(region='')
        .values('region')
        .annotate(
            total=Count('id'),
            active=Count('id', filter=Q(is_active=True)),
            avg_score=Avg('teras_scores__score'),
        )
        .order_by('-total')[:10]
    ):
        regions.append({
            'name': row['region'],
            'total_users': row['total'],
            'active_users': row['active'],
            'avg_score': round(_safe_float(row['avg_score'])),
        })

    loan_status = []
    for status_code, label in LoanApplication.STATUS_CHOICES:
        qs = loan_base.filter(status=status_code)
        loan_status.append({
            'status': status_code,
            'label': label,
            'count': qs.count(),
            'volume': _safe_float(qs.aggregate(total=Sum('requested_amount'))['total']),
        })

    kyc_status = []
    for status_code, label in KYCRequest.STATUS_CHOICES:
        kyc_status.append({
            'status': status_code,
            'label': label,
            'count': KYCRequest.objects.filter(status=status_code).count(),
        })

    total_users = User.objects.count()
    summary = {
        'total_users': total_users,
        'new_users': User.objects.filter(date_joined__date__gte=period_start, date_joined__date__lte=period_end).count(),
        'active_users': User.objects.filter(is_active=True).count(),
        'avg_score': avg_score,
        'scores_calculated': period_scores.count(),
        'total_actors': total_users + BankEnterprise.objects.count() + BankClient.objects.count(),
        'enterprises': BankEnterprise.objects.count(),
        'enterprise_active': BankEnterprise.objects.filter(status='active').count(),
        'individuals': BankClient.objects.count(),
        'loans_total': loan_base.count(),
        'loans_period': period_loans.count(),
        'loans_volume': _safe_float(approved_loans.aggregate(total=Sum('requested_amount'))['total']),
        'approval_rate': round(approved_loans.count() / max(loan_base.count(), 1) * 100, 1),
        'at_risk': risk_distribution['high'],
        'kyc_pending': KYCRequest.objects.filter(status=KYCRequest.STATUS_PENDING).count(),
    }

    return {
        'summary': summary,
        'data': {
            'period': {'start': period_start.isoformat(), 'end': period_end.isoformat()},
            'risk_distribution': risk_distribution,
            'sectors': sectors,
            'regions': regions,
            'loan_status': loan_status,
            'kyc_status': kyc_status,
            'generated_from': 'teras_database',
        },
    }


def _serialize_report(report):
    return {
        'id': str(report.id),
        'title': report.title,
        'type': report.report_type,
        'report_type': report.report_type,
        'status': report.status,
        'period': {
            'start': report.period_start.isoformat(),
            'end': report.period_end.isoformat(),
        },
        'summary': report.summary,
        'data': report.data,
        'generated_at': report.generated_at.isoformat(),
        'download_url': f'/api/scoring/government/reports/{report.id}/download/',
    }


@api_view(['GET'])
@permission_classes([IsGovernmentUser])
def government_reports_list(request):
    """
    Liste des rapports.
    GET /api/government/reports/
    """
    queryset = GovernmentReport.objects.all()
    report_type = request.query_params.get('type')
    if report_type:
        queryset = queryset.filter(report_type=report_type)

    reports = [_serialize_report(report) for report in queryset.order_by('-generated_at')[:50]]
    return Response({'count': len(reports), 'reports': reports})


@api_view(['GET'])
@permission_classes([IsGovernmentUser])
def government_report_detail(request, report_id):
    """
    Détails d'un rapport.
    GET /api/government/reports/{id}/
    """
    report = get_object_or_404(GovernmentReport, id=report_id)
    return Response(_serialize_report(report))


@api_view(['POST'])
@permission_classes([IsGovernmentUser])
def government_report_generate(request):
    """
    Générer un nouveau rapport.
    POST /api/government/reports/generate/
    """
    allowed_types = {choice[0] for choice in GovernmentReport.REPORT_TYPE_CHOICES}
    report_type = request.data.get('report_type') or request.query_params.get('report_type') or 'monthly'
    if report_type not in allowed_types:
        report_type = 'custom'

    try:
        period_start, period_end = _parse_period(request, report_type)
    except ValueError:
        return Response({'error': 'Période invalide. Format attendu YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)

    if period_start > period_end:
        return Response({'error': 'period_start doit être avant period_end.'}, status=status.HTTP_400_BAD_REQUEST)

    dataset = _build_report_dataset(period_start, period_end)
    title = request.data.get('title') or (
        f"Rapport TERAS {report_type} — {period_start.strftime('%d/%m/%Y')} au {period_end.strftime('%d/%m/%Y')}"
    )

    report = GovernmentReport.objects.create(
        title=title,
        report_type=report_type,
        status='ready',
        period_start=period_start,
        period_end=period_end,
        summary=dataset['summary'],
        data=dataset['data'],
        generated_by=request.user,
    )

    ActivityLog.objects.create(
        action='report_generated',
        user=request.user,
        user_type=getattr(request.user, 'user_type', ''),
        details={'report_id': report.id, 'report_type': report.report_type},
    )

    return Response(_serialize_report(report), status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsGovernmentUser])
def government_report_download(request, report_id):
    """
    Télécharger un rapport.
    GET /api/government/reports/{id}/download/
    """
    report = get_object_or_404(GovernmentReport, id=report_id)
    report.downloaded_count += 1
    report.save(update_fields=['downloaded_count'])

    return Response({
        'message': 'Rapport prêt. Export PDF à brancher sur le générateur documentaire.',
        'report': _serialize_report(report),
    })


# ==================== PARAMÈTRES ====================

def _settings_payload(settings_obj):
    return {
        'system': {
            'version': settings_obj.system_version,
            'environment': settings_obj.environment,
            'maintenance_mode': settings_obj.maintenance_mode,
        },
        'scoring': {
            'active_profile': settings_obj.scoring_profile,
            'region': settings_obj.scoring_region,
            'country': settings_obj.scoring_country,
        },
        'alerts': {
            'enabled': settings_obj.alerts_enabled,
            'email_notifications': settings_obj.email_notifications,
            'threshold_low_score': settings_obj.threshold_low_score,
            'threshold_high_risk': settings_obj.threshold_high_risk,
        },
    }


def _get_settings_object():
    settings_obj, _ = GovernmentSettings.objects.get_or_create(id=1)
    return settings_obj


@api_view(['GET'])
@permission_classes([IsGovernmentUser])
def government_settings_get(request):
    """
    Récupérer les paramètres.
    GET /api/government/settings/
    """
    return Response(_settings_payload(_get_settings_object()))


@api_view(['PATCH'])
@permission_classes([IsGovernmentUser])
def government_settings_update(request):
    """
    Mettre à jour les paramètres.
    PATCH /api/government/settings/
    """
    settings_obj = _get_settings_object()

    if 'system' in request.data:
        system_data = request.data['system']
        settings_obj.system_version = system_data.get('version', settings_obj.system_version)
        settings_obj.environment = system_data.get('environment', settings_obj.environment)
        settings_obj.maintenance_mode = system_data.get('maintenance_mode', settings_obj.maintenance_mode)

    if 'scoring' in request.data:
        scoring_data = request.data['scoring']
        settings_obj.scoring_profile = scoring_data.get('active_profile', settings_obj.scoring_profile)
        settings_obj.scoring_region = scoring_data.get('region', settings_obj.scoring_region)
        settings_obj.scoring_country = scoring_data.get('country', settings_obj.scoring_country)

    if 'alerts' in request.data:
        alerts_data = request.data['alerts']
        settings_obj.alerts_enabled = alerts_data.get('enabled', settings_obj.alerts_enabled)
        settings_obj.email_notifications = alerts_data.get('email_notifications', settings_obj.email_notifications)
        settings_obj.threshold_low_score = alerts_data.get('threshold_low_score', settings_obj.threshold_low_score)
        settings_obj.threshold_high_risk = alerts_data.get('threshold_high_risk', settings_obj.threshold_high_risk)

    settings_obj.save()
    return Response(_settings_payload(settings_obj))
