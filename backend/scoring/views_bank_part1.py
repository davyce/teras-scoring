# backend/scoring/views_bank_part1.py
"""
Vues Bank TERAS — Partie 1
Dashboard, Clients (NIU), Entreprises
Auto-création de compte TERAS à la création d'un client/entreprise
"""

import re
import random
import string
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, BasePermission
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework import status
from django.db.models import Q, Avg, Sum, Count
from django.utils import timezone
from datetime import timedelta

from .models_bank import BankClient, BankEnterprise, LoanApplication, FinancialProduct
from .serializers_bank import (
    BankClientSerializer,
    BankClientCreateSerializer,
    BankClientDetailSerializer,
    BankEnterpriseSerializer,
    BankEnterpriseCreateSerializer,
    BankEnterpriseDetailSerializer,
    LoanApplicationListSerializer,
)


# ─── Permissions ─────────────────────────────────────────────────────────────

class IsBankUser(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        user_type = getattr(request.user, 'user_type', None)
        return user_type in ('bank', 'admin') or request.user.is_staff


# ─── Pagination ───────────────────────────────────────────────────────────────

class StandardPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


def _is_bank_admin(user):
    user_type = getattr(user, 'user_type', None)
    return user_type == 'admin' or getattr(user, 'is_staff', False)


def _scope_by_bank_owner(queryset, user, owner_field='bank_owner'):
    if _is_bank_admin(user):
        return queryset
    if queryset.model is LoanApplication and owner_field == 'bank_owner':
        direct_scope = Q(bank_owner=user)
        inherited_scope = Q(bank_owner__isnull=True) & (
            (
                Q(applicant_type='individual', client__isnull=False) &
                (Q(client__bank_owner=user) | Q(client__bank_owner__isnull=True))
            ) |
            (
                Q(applicant_type='enterprise', enterprise__isnull=False) &
                (Q(enterprise__bank_owner=user) | Q(enterprise__bank_owner__isnull=True))
            ) |
            (
                Q(client__isnull=True, enterprise__isnull=True) &
                (Q(product__bank_owner=user) | Q(product__bank_owner__isnull=True))
            )
        )
        return queryset.filter(direct_scope | inherited_scope).distinct()
    return queryset.filter(
        Q(**{owner_field: user}) |
        Q(**{f'{owner_field}__isnull': True})
    )


def _get_request_bank_owner(user):
    return None if _is_bank_admin(user) else user


def _resolve_bank_owner_for_application(user, client=None, enterprise=None, product=None):
    if not _is_bank_admin(user):
        return user

    for obj in (client, enterprise, product):
        owner = getattr(obj, 'bank_owner', None)
        if owner is not None:
            return owner
    return None


def _safe_float(value, default=0.0):
    try:
        return float(value or 0)
    except (TypeError, ValueError):
        return default


def _band_from_score(score):
    score = int(score or 0)
    if score >= 900:
        return 'A+'
    if score >= 800:
        return 'A'
    if score >= 700:
        return 'B'
    if score >= 600:
        return 'C'
    if score >= 500:
        return 'D'
    return 'E'


def _build_enterprise_financial_passport(enterprise):
    recent_apps_qs = enterprise.applications.order_by('-created_at')
    recent_apps = LoanApplicationListSerializer(recent_apps_qs[:5], many=True).data

    passport = {
        'identity': {
            'name': enterprise.name,
            'legal_name': enterprise.legal_name,
            'registration_number': enterprise.registration_number,
            'tax_id': enterprise.tax_id,
            'enterprise_type': enterprise.enterprise_type,
            'sector': enterprise.sector,
            'join_date': enterprise.join_date.isoformat() if enterprise.join_date else None,
            'status': enterprise.status,
        },
        'contact': {
            'email': enterprise.email,
            'phone': enterprise.phone,
            'address': enterprise.address,
            'city': enterprise.city,
            'country': enterprise.country,
        },
        'metrics': {
            'annual_revenue': _safe_float(enterprise.annual_revenue),
            'estimated_monthly_revenue': _safe_float(enterprise.monthly_income),
            'employees_count': enterprise.employees_count,
            'crm_limit': _safe_float(enterprise.crm_limit),
            'active_loans_count': enterprise.active_loans_count,
            'total_borrowed': _safe_float(enterprise.total_borrowed),
            'documented_assets_total_xaf': 0,
            'invoice_amount_total_xaf': 0,
            'collateral_value_xaf': 0,
        },
        'applications_summary': {
            'total': recent_apps_qs.count(),
            'pending': recent_apps_qs.filter(status='pending').count(),
            'approved': recent_apps_qs.filter(status='approved').count(),
            'active': recent_apps_qs.filter(status='disbursed').count(),
            'rejected': recent_apps_qs.filter(status='rejected').count(),
            'cancelled': recent_apps_qs.filter(status='cancelled').count(),
        },
        'credit_capacity': {
            'monthly_repayment_capacity': _safe_float(enterprise.crm_limit),
            'recommended_limit_6m': round(_safe_float(enterprise.crm_limit) * 6 * 0.85),
            'recommended_limit_12m': round(_safe_float(enterprise.crm_limit) * 12 * 0.85),
        },
        'recent_applications': recent_apps,
        'documents': {
            'total_docs': 0,
            'validated_docs': 0,
            'pending_docs': 0,
            'last_processed_at': None,
            'analyzed_docs': 0,
            'applied_docs': 0,
        },
        'score': {
            'value': enterprise.teras_score,
            'band': enterprise.teras_band or _band_from_score(enterprise.teras_score),
            'computed_at': None,
            'sector_average': None,
            'percentile': None,
            'pillars': [],
        },
    }

    if not enterprise.user_id:
        return passport

    try:
        from .models_enterprise import EnterpriseDocument, EnterpriseScore

        docs_qs = EnterpriseDocument.objects.filter(enterprise_id=enterprise.user_id).order_by('-processed_at', '-uploaded_at')
        docs_list = list(docs_qs)
        latest_processed = next((doc for doc in docs_list if doc.processed_at), None)
        latest_analyzed = next((doc for doc in docs_list if doc.analysis_summary), None)
        latest_score = EnterpriseScore.objects.filter(enterprise_id=enterprise.user_id).order_by('-computed_at').first()
        latest_input = latest_score.input_data if latest_score and latest_score.input_data else {}
        passport['documents'] = {
            'total_docs': len(docs_list),
            'validated_docs': sum(1 for doc in docs_list if doc.status == 'validated'),
            'pending_docs': sum(1 for doc in docs_list if doc.status in ['pending', 'processing']),
            'last_processed_at': latest_processed.processed_at.isoformat() if latest_processed and latest_processed.processed_at else None,
            'analyzed_docs': sum(1 for doc in docs_list if doc.analysis_summary),
            'applied_docs': sum(1 for doc in docs_list if (doc.analysis_summary or {}).get('applied_to_teras')),
            'latest_summary': latest_analyzed.analysis_summary if latest_analyzed else None,
            'document_intelligence': {
                'categories': latest_input.get('categories', sorted({doc.category for doc in docs_list})),
                'completeness_ratio': latest_input.get('completeness_ratio', round(min(1.0, len(docs_list) / 6), 3) if docs_list else 0.0),
                'avg_monthly_revenue_xaf': latest_input.get('avg_monthly_revenue_xaf', 0),
                'avg_monthly_cashflow_xaf': latest_input.get('avg_monthly_cashflow_xaf', 0),
                'avg_authenticity': latest_input.get('avg_authenticity', 0),
                'assets_documented_total_xaf': latest_input.get('assets_documented_total_xaf', 0),
                'assets_verified_count': latest_input.get('assets_verified_count', 0),
                'invoice_amount_total_xaf': latest_input.get('invoice_amount_total_xaf', 0),
                'invoices_analyzed_count': latest_input.get('invoices_analyzed_count', 0),
                'collateral_value_xaf': latest_input.get('collateral_value_xaf', 0),
                'collateral_strength': latest_input.get('collateral_strength', 'low'),
                'asset_proof_types': latest_input.get('asset_proof_types', []),
                'dossier_quality': latest_input.get('dossier_quality', 'a_structurer'),
                'alerts': latest_input.get('alerts', []),
            },
        }
        passport['metrics'].update({
            'documented_assets_total_xaf': latest_input.get('assets_documented_total_xaf', 0),
            'invoice_amount_total_xaf': latest_input.get('invoice_amount_total_xaf', 0),
            'collateral_value_xaf': latest_input.get('collateral_value_xaf', 0),
        })

        if latest_score:
            pillar_meta = {
                'T': ('Transparence fiscale', 300),
                'E': ('Emploi local', 250),
                'R': ('Retention et fidelite', 150),
                'A': ('Activite economique', 200),
                'S': ('Stabilite sociale', 100),
            }
            raw_breakdown = latest_score.breakdown or {}
            pillars = []
            for code, (label, max_points) in pillar_meta.items():
                ratio = min(1.0, max(0.0, _safe_float(raw_breakdown.get(code), 0.0)))
                pillars.append({
                    'code': code,
                    'label': label,
                    'ratio': round(ratio, 4),
                    'weighted_points': round(ratio * max_points),
                    'max_points': max_points,
                })

            passport['score'] = {
                'value': latest_score.score,
                'band': enterprise.teras_band or _band_from_score(latest_score.score),
                'computed_at': latest_score.computed_at.isoformat() if latest_score.computed_at else None,
                'sector_average': latest_score.sector_average,
                'percentile': latest_score.percentile,
                'pillars': pillars,
            }
    except Exception:
        pass

    return passport


def _build_client_financial_passport(client):
    passport = {
        'identity': {
            'first_name': client.first_name,
            'last_name': client.last_name,
            'niu': client.niu,
            'occupation': client.occupation,
            'join_date': client.join_date.isoformat() if client.join_date else None,
            'status': client.status,
        },
        'contact': {
            'email': client.email,
            'phone': client.phone,
            'address': client.address,
            'city': client.city,
            'country': client.country,
        },
        'metrics': {
            'monthly_income': _safe_float(client.monthly_income),
            'crm_limit': _safe_float(client.crm_limit),
            'active_loans_count': client.active_loans_count,
            'total_borrowed': _safe_float(client.total_borrowed),
        },
        'credit_capacity': {
            'monthly_repayment_capacity': _safe_float(client.crm_limit),
            'recommended_limit_6m': round(_safe_float(client.crm_limit) * 6 * 0.85),
            'recommended_limit_12m': round(_safe_float(client.crm_limit) * 12 * 0.85),
        },
        'documents': {
            'total_docs': 0,
            'analyzed_docs': 0,
            'applied_docs': 0,
            'latest_processed_at': None,
            'latest_category': None,
        },
        'score': {
            'value': client.teras_score,
            'band': client.teras_band or _band_from_score(client.teras_score),
            'computed_at': None,
            'pillars': {},
        },
        'analysis': {
            'latest_strengths': [],
            'latest_risks': [],
            'latest_recommendations': [],
            'dashboard_updates': {},
        },
    }

    if not client.user_id:
        return passport

    try:
        from .models import Asset, Income, Recommendation, TerasScore, UserDocument
        from .views_user import _build_user_document_intelligence

        docs_qs = UserDocument.objects.filter(user_id=client.user_id).order_by('-processed_at', '-uploaded_at')
        docs_list = list(docs_qs)
        latest_processed = next((doc for doc in docs_list if doc.processed_at), None)
        latest_analyzed = next((doc for doc in docs_list if doc.ai_analysis), None)
        document_intelligence = _build_user_document_intelligence(client.user)

        passport['documents'] = {
            'total_docs': len(docs_list),
            'analyzed_docs': sum(1 for doc in docs_list if doc.ai_analysis),
            'applied_docs': sum(1 for doc in docs_list if doc.generated_score_id),
            'latest_processed_at': latest_processed.processed_at.isoformat() if latest_processed and latest_processed.processed_at else None,
            'latest_category': latest_processed.category if latest_processed else None,
            'coverage_ratio': round(min(1.0, len(docs_list) / 4), 3) if docs_list else 0.0,
            'document_categories': sorted({doc.category for doc in docs_list}),
            'proof_asset_docs': document_intelligence.get('proof_asset_docs', 0),
            'proof_asset_docs_applied': document_intelligence.get('proof_assets_applied', 0),
            'latest_proof_label': document_intelligence.get('latest_proof_label'),
            'latest_proof_filename': document_intelligence.get('latest_proof_filename'),
        }

        latest_score = TerasScore.objects.filter(user_id=client.user_id).order_by('-created_at').first()
        if latest_score:
            passport['score'] = {
                'value': latest_score.score,
                'band': client.teras_band or _band_from_score(latest_score.score),
                'computed_at': latest_score.created_at.isoformat() if latest_score.created_at else None,
                'pillars': latest_score.breakdown,
            }

        if latest_analyzed and latest_analyzed.ai_analysis:
            passport['analysis'] = {
                'latest_strengths': latest_analyzed.ai_analysis.get('strengths', []),
                'latest_risks': latest_analyzed.ai_analysis.get('risks', []),
                'latest_recommendations': latest_analyzed.ai_analysis.get('recommended_actions', []),
                'dashboard_updates': latest_analyzed.ai_analysis.get('dashboard_updates', {}),
                'latest_summary_meta': {
                    'document_type': latest_analyzed.ai_analysis.get('document_type') or latest_analyzed.category,
                    'estimated_change': (latest_analyzed.ai_analysis.get('score_impact') or {}).get('estimated_change', 0),
                    'confidence': (latest_analyzed.ai_analysis.get('score_impact') or {}).get('confidence', latest_analyzed.confidence),
                    'analyzed_at': latest_analyzed.processed_at.isoformat() if latest_analyzed.processed_at else None,
                },
                'asset_intelligence': {
                    'proof_asset_docs': document_intelligence.get('proof_asset_docs', 0),
                    'proof_assets_applied': document_intelligence.get('proof_assets_applied', 0),
                    'documented_assets_total_xaf': document_intelligence.get('documented_assets_total_xaf', 0),
                    'latest_asset_value_xaf': document_intelligence.get('latest_asset_value_xaf', 0),
                    'collateral_candidate_value_xaf': document_intelligence.get('collateral_candidate_value_xaf', 0),
                    'latest_proof_label': document_intelligence.get('latest_proof_label'),
                    'latest_proof_filename': document_intelligence.get('latest_proof_filename'),
                    'asset_proof_strength': document_intelligence.get('asset_proof_strength', 'none'),
                    'alerts': document_intelligence.get('alerts', []),
                },
            }
        else:
            passport['analysis']['asset_intelligence'] = {
                'proof_asset_docs': document_intelligence.get('proof_asset_docs', 0),
                'proof_assets_applied': document_intelligence.get('proof_assets_applied', 0),
                'documented_assets_total_xaf': document_intelligence.get('documented_assets_total_xaf', 0),
                'latest_asset_value_xaf': document_intelligence.get('latest_asset_value_xaf', 0),
                'collateral_candidate_value_xaf': document_intelligence.get('collateral_candidate_value_xaf', 0),
                'latest_proof_label': document_intelligence.get('latest_proof_label'),
                'latest_proof_filename': document_intelligence.get('latest_proof_filename'),
                'asset_proof_strength': document_intelligence.get('asset_proof_strength', 'none'),
                'alerts': document_intelligence.get('alerts', []),
            }

        monthly_income = Income.objects.filter(user_id=client.user_id, verified=True).aggregate(total=Sum('amount'))['total'] or 0
        total_assets = Asset.objects.filter(user_id=client.user_id, verified=True).aggregate(total=Sum('estimated_value'))['total'] or 0
        pending_recommendations = Recommendation.objects.filter(user_id=client.user_id, completed=False).count()

        passport['metrics'].update({
            'verified_income_total': _safe_float(monthly_income),
            'verified_assets_total': _safe_float(total_assets),
            'documented_assets_total_xaf': document_intelligence.get('documented_assets_total_xaf', 0),
            'collateral_candidate_value_xaf': document_intelligence.get('collateral_candidate_value_xaf', 0),
            'pending_recommendations': pending_recommendations,
        })
    except Exception:
        pass

    return passport


def _serialize_bank_client_detail(client):
    data = BankClientDetailSerializer(client).data
    data['crm_limit'] = client.crm_limit
    data['financial_passport'] = _build_client_financial_passport(client)

    if client.teras_account_email:
        data['teras_account'] = {
            'email': client.teras_account_email,
            'created': True,
        }

    passport_score = data['financial_passport'].get('score') or {}
    if passport_score.get('value') is not None:
        data['teras_score'] = passport_score.get('value')
    if passport_score.get('band'):
        data['teras_band'] = passport_score.get('band')
    if passport_score.get('pillars'):
        data['score_breakdown'] = passport_score.get('pillars')
    return data


def _serialize_bank_enterprise_detail(enterprise):
    data = BankEnterpriseDetailSerializer(enterprise).data
    data['crm_limit'] = enterprise.crm_limit
    data['financial_passport'] = _build_enterprise_financial_passport(enterprise)

    score_payload = data['financial_passport'].get('score') or {}
    if score_payload:
        if score_payload.get('value') is not None:
            data['teras_score'] = score_payload.get('value')
        if score_payload.get('band'):
            data['teras_band'] = score_payload.get('band')
        data['score_breakdown'] = score_payload.get('pillars', [])

    if enterprise.teras_account_email:
        data['teras_account'] = {
            'email': enterprise.teras_account_email,
            'created': True,
        }
    return data


# ─── Helpers auto-compte ──────────────────────────────────────────────────────

def _slugify(text):
    """Transforme un texte en slug ASCII pour email"""
    text = text.lower().strip()
    text = re.sub(r'[àáâãäå]', 'a', text)
    text = re.sub(r'[èéêë]', 'e', text)
    text = re.sub(r'[ìíîï]', 'i', text)
    text = re.sub(r'[òóôõö]', 'o', text)
    text = re.sub(r'[ùúûü]', 'u', text)
    text = re.sub(r'[çć]', 'c', text)
    text = re.sub(r'[^a-z0-9]', '', text)
    return text


def _generate_password(seed: str, length: int = 8) -> str:
    """Génère un mot de passe mémorisable : Teras@XXXX"""
    suffix = seed[:4].upper() if len(seed) >= 4 else seed.upper()
    rand   = ''.join(random.choices(string.digits, k=2))
    return f"Teras@{suffix}{rand}"


def _create_teras_account(email: str, password: str, user_type: str, first_name: str = '', last_name: str = ''):
    """Crée un compte CustomUser TERAS et retourne (user, created)"""
    from django.contrib.auth import get_user_model
    User = get_user_model()

    # Éviter les doublons d'email
    base_email = email
    counter    = 1
    while User.objects.filter(email=email).exists():
        parts = base_email.split('@')
        email = f"{parts[0]}{counter}@{parts[1]}"
        counter += 1

    user = User.objects.create_user(
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name,
        user_type=user_type,
        is_active=True,
    )
    return user, email


# ─── Dashboard ───────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsBankUser])
def bank_dashboard(request):
    try:
        now        = timezone.now()
        last_month = now - timedelta(days=30)
        prev_month = now - timedelta(days=60)

        clients_qs      = _scope_by_bank_owner(BankClient.objects.all(), request.user)
        enterprises_qs  = _scope_by_bank_owner(BankEnterprise.objects.all(), request.user)
        applications_qs = _scope_by_bank_owner(LoanApplication.objects.all(), request.user)
        products_qs     = _scope_by_bank_owner(FinancialProduct.objects.all(), request.user)

        total_clients  = clients_qs.filter(status='active').count()
        clients_last   = clients_qs.filter(created_at__gte=last_month).count()
        clients_prev   = clients_qs.filter(created_at__gte=prev_month, created_at__lt=last_month).count()
        clients_growth = round(((clients_last - clients_prev) / max(clients_prev, 1)) * 100, 1)

        active_loans = applications_qs.filter(status='disbursed').count()
        loans_last   = applications_qs.filter(status__in=['approved','disbursed'], created_at__gte=last_month).count()
        loans_prev   = applications_qs.filter(status__in=['approved','disbursed'], created_at__gte=prev_month, created_at__lt=last_month).count()
        loans_growth = round(((loans_last - loans_prev) / max(loans_prev, 1)) * 100, 1)

        portfolio_value  = float(applications_qs.filter(status='disbursed').aggregate(t=Sum('requested_amount'))['t'] or 0)
        portfolio_last   = float(applications_qs.filter(status='disbursed', created_at__gte=last_month).aggregate(t=Sum('requested_amount'))['t'] or 0)
        portfolio_prev_v = float(applications_qs.filter(status='disbursed', created_at__gte=prev_month, created_at__lt=last_month).aggregate(t=Sum('requested_amount'))['t'] or 0)
        portfolio_growth = round(((portfolio_last - portfolio_prev_v) / max(portfolio_prev_v, 1)) * 100, 1)

        avg_score      = round(float(clients_qs.filter(teras_score__isnull=False).aggregate(a=Avg('teras_score'))['a'] or 0))
        avg_score_prev = float(clients_qs.filter(teras_score__isnull=False, created_at__lt=last_month).aggregate(a=Avg('teras_score'))['a'] or avg_score)
        score_growth   = round(((avg_score - avg_score_prev) / max(avg_score_prev, 1)) * 100, 1)

        recent_apps  = applications_qs.select_related('client','enterprise','product').order_by('-created_at')[:8]
        top_products = [
            {'name': p.name, 'volume': float(p.total_vol or 0), 'count': p.nb or 0}
            for p in products_qs.annotate(
                total_vol=Sum('applications__requested_amount'), nb=Count('applications')
            ).filter(is_active=True).order_by('-total_vol')[:4]
        ]

        return Response({
            'total_clients':       total_clients,
            'clients_growth':      clients_growth,
            'active_loans':        active_loans,
            'loans_growth':        loans_growth,
            'portfolio_value':     portfolio_value,
            'portfolio_growth':    portfolio_growth,
            'avg_score':           avg_score,
            'score_growth':        score_growth,
            'recent_applications': LoanApplicationListSerializer(recent_apps, many=True).data,
            'top_products':        top_products,
            'portfolio_health': {
                'on_time_rate':    100.0,
                'late_rate':       0.0,
                'collection_rate': 100.0,
                'avg_roi':         11.5,
            },
        })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ─── Clients particuliers ─────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsBankUser])
def bank_clients_list(request):
    qs = _scope_by_bank_owner(BankClient.objects.all(), request.user).order_by('-created_at')

    search = request.query_params.get('search', '').strip()
    if search:
        qs = qs.filter(
            Q(first_name__icontains=search) |
            Q(last_name__icontains=search)  |
            Q(email__icontains=search)      |
            Q(niu__icontains=search)
        )

    if request.query_params.get('score_min'):
        qs = qs.filter(teras_score__gte=int(request.query_params['score_min']))
    if request.query_params.get('score_max'):
        qs = qs.filter(teras_score__lte=int(request.query_params['score_max']))
    if request.query_params.get('status'):
        qs = qs.filter(status=request.query_params['status'])

    paginator  = StandardPagination()
    page       = paginator.paginate_queryset(qs, request)
    serializer = BankClientSerializer(page, many=True)
    return paginator.get_paginated_response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsBankUser])
def bank_client_create(request):
    """
    Crée un client particulier ET génère automatiquement un compte TERAS
    avec email et mot de passe basés sur le NIU.
    """
    # Accepter 'niu' ou 'national_id' dans le payload
    data = request.data.copy()
    if 'national_id' in data and 'niu' not in data:
        data['niu'] = data.pop('national_id')

    serializer = BankClientCreateSerializer(data=data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    client = serializer.save(bank_owner=_get_request_bank_owner(request.user))

    # ── Auto-création compte TERAS ──────────────────────────────────────────
    first_slug = _slugify(client.first_name)
    last_slug  = _slugify(client.last_name)
    niu_clean  = re.sub(r'[^a-zA-Z0-9]', '', client.niu)

    account_email    = f"{first_slug}.{last_slug}.{niu_clean[:6].lower()}@teras.cg"
    account_password = _generate_password(niu_clean)

    teras_user = None
    try:
        teras_user, actual_email = _create_teras_account(
            email=account_email,
            password=account_password,
            user_type='individual',
            first_name=client.first_name,
            last_name=client.last_name,
        )
        client.user                 = teras_user
        client.teras_account_email  = actual_email
        client.teras_account_password = account_password
        client.save(update_fields=['user', 'teras_account_email', 'teras_account_password'])
        account_email = actual_email
    except Exception as e:
        print(f"Auto-account creation failed: {e}", flush=True)

    response_data = BankClientSerializer(client).data
    response_data['teras_account'] = {
        'email':    account_email,
        'password': account_password,
        'message':  f"Compte TERAS créé. Le client peut se connecter sur l'application TERAS avec ces identifiants et les modifier.",
        'login_url': '/login',
        'created':  teras_user is not None,
    }
    return Response(response_data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsBankUser])
def bank_client_detail(request, client_id):
    try:
        client = _scope_by_bank_owner(BankClient.objects.all(), request.user).get(id=client_id)
    except BankClient.DoesNotExist:
        return Response({'error': 'Client introuvable'}, status=status.HTTP_404_NOT_FOUND)

    return Response(_serialize_bank_client_detail(client))


@api_view(['PATCH'])
@permission_classes([IsAuthenticated, IsBankUser])
def bank_client_update(request, client_id):
    try:
        client = _scope_by_bank_owner(BankClient.objects.all(), request.user).get(id=client_id)
    except BankClient.DoesNotExist:
        return Response({'error': 'Client introuvable'}, status=status.HTTP_404_NOT_FOUND)

    data = request.data.copy()
    if 'national_id' in data and 'niu' not in data:
        data['niu'] = data.pop('national_id')

    serializer = BankClientSerializer(client, data=data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─── Entreprises ──────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsBankUser])
def bank_enterprises_list(request):
    qs = _scope_by_bank_owner(BankEnterprise.objects.all(), request.user).order_by('-created_at')

    search = request.query_params.get('search', '').strip()
    if search:
        qs = qs.filter(
            Q(name__icontains=search)        |
            Q(legal_name__icontains=search)  |
            Q(email__icontains=search)       |
            Q(tax_id__icontains=search)      |
            Q(registration_number__icontains=search)
        )
    if request.query_params.get('score_min'):
        qs = qs.filter(teras_score__gte=int(request.query_params['score_min']))

    paginator  = StandardPagination()
    page       = paginator.paginate_queryset(qs, request)
    serializer = BankEnterpriseSerializer(page, many=True)
    return paginator.get_paginated_response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsBankUser])
def bank_enterprise_create(request):
    """
    Crée une entreprise cliente ET génère automatiquement un compte TERAS entreprise.
    """
    serializer = BankEnterpriseCreateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    enterprise = serializer.save(bank_owner=_get_request_bank_owner(request.user))

    # ── Auto-création compte TERAS entreprise ──────────────────────────────
    name_slug  = _slugify(enterprise.name)[:20]
    rccm_clean = re.sub(r'[^a-zA-Z0-9]', '', enterprise.registration_number)

    account_email    = f"{name_slug}.{rccm_clean[:6].lower()}@teras.cg"
    account_password = _generate_password(rccm_clean)

    teras_user = None
    try:
        teras_user, actual_email = _create_teras_account(
            email=account_email,
            password=account_password,
            user_type='enterprise',
            first_name=enterprise.name,
            last_name='',
        )
        enterprise.user                  = teras_user
        enterprise.teras_account_email   = actual_email
        enterprise.teras_account_password = account_password
        enterprise.save(update_fields=['user', 'teras_account_email', 'teras_account_password'])
        account_email = actual_email
    except Exception as e:
        print(f"Enterprise auto-account failed: {e}", flush=True)

    response_data = BankEnterpriseSerializer(enterprise).data
    response_data['teras_account'] = {
        'email':    account_email,
        'password': account_password,
        'message':  "Compte TERAS Entreprise créé. L'entreprise peut se connecter sur l'interface Entreprise TERAS.",
        'login_url': '/login',
        'created':  teras_user is not None,
    }
    return Response(response_data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsBankUser])
def bank_enterprise_detail(request, enterprise_id):
    try:
        enterprise = _scope_by_bank_owner(BankEnterprise.objects.all(), request.user).get(id=enterprise_id)
    except BankEnterprise.DoesNotExist:
        return Response({'error': 'Entreprise introuvable'}, status=status.HTTP_404_NOT_FOUND)

    return Response(_serialize_bank_enterprise_detail(enterprise))


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsBankUser])
def bank_client_refresh_passport(request, client_id):
    try:
        client = _scope_by_bank_owner(BankClient.objects.all(), request.user).get(id=client_id)
    except BankClient.DoesNotExist:
        return Response({'error': 'Client introuvable'}, status=status.HTTP_404_NOT_FOUND)

    data = _serialize_bank_client_detail(client)
    data['message'] = "Passeport financier client rafraichi a partir des analyses deja stockees."
    return Response(data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsBankUser])
def bank_enterprise_refresh_passport(request, enterprise_id):
    try:
        enterprise = _scope_by_bank_owner(BankEnterprise.objects.all(), request.user).get(id=enterprise_id)
    except BankEnterprise.DoesNotExist:
        return Response({'error': 'Entreprise introuvable'}, status=status.HTTP_404_NOT_FOUND)

    recompute = str(request.data.get('recompute', '1')).lower() not in {'0', 'false', 'no'}
    if recompute and enterprise.user_id:
        try:
            from .models_enterprise import EnterpriseDocument
            from .views_enterprise_part1 import _recompute_enterprise_from_documents

            has_analyzed_docs = EnterpriseDocument.objects.filter(
                enterprise_id=enterprise.user_id,
            ).exclude(analysis_summary__isnull=True).exclude(analysis_summary={}).exists()
            if has_analyzed_docs:
                _recompute_enterprise_from_documents(enterprise.user)
        except Exception:
            pass

    data = _serialize_bank_enterprise_detail(enterprise)
    data['message'] = "Passeport financier entreprise rafraichi a partir du dossier applique."
    return Response(data, status=status.HTTP_200_OK)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated, IsBankUser])
def bank_enterprise_update(request, enterprise_id):
    try:
        enterprise = _scope_by_bank_owner(BankEnterprise.objects.all(), request.user).get(id=enterprise_id)
    except BankEnterprise.DoesNotExist:
        return Response({'error': 'Entreprise introuvable'}, status=status.HTTP_404_NOT_FOUND)

    serializer = BankEnterpriseSerializer(enterprise, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
