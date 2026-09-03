# backend/scoring/views_government_data.py
"""
Interface Gouvernement TERAS — Données Réelles
Agrège les données des entreprises et individus par pays CEMAC
pour fournir une analyse économique complète aux décideurs publics.

Pays CEMAC couverts :
  CG — Congo Brazzaville
  CM — Cameroun
  GA — Gabon
  CF — Centrafrique
  TD — Tchad
  GQ — Guinée Équatoriale
  CD — RD Congo (associé)
"""

from django.db.models import (
    Avg, Sum, Count, Max, Min, Q, F,
    ExpressionWrapper, DecimalField, IntegerField,
)
from django.db.models.functions import TruncMonth, TruncYear, Coalesce
from django.utils import timezone
from datetime import timedelta, date
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

try:
    from users.models import Profile
except Exception:
    Profile = None

# ── Constantes CEMAC ─────────────────────────────────────────────────────────
CEMAC_COUNTRIES = {
    'CG': {'name': 'Congo Brazzaville', 'capital': 'Brazzaville', 'currency': 'XAF'},
    'CM': {'name': 'Cameroun',          'capital': 'Yaoundé',      'currency': 'XAF'},
    'GA': {'name': 'Gabon',             'capital': 'Libreville',   'currency': 'XAF'},
    'CF': {'name': 'Centrafrique',      'capital': 'Bangui',       'currency': 'XAF'},
    'TD': {'name': 'Tchad',             'capital': 'N\'Djamena',   'currency': 'XAF'},
    'GQ': {'name': 'Guinée Équatoriale','capital': 'Malabo',       'currency': 'XAF'},
    'CD': {'name': 'RD Congo',          'capital': 'Kinshasa',     'currency': 'CDF'},
}

SECTORS = {
    'commerce':    'Commerce & Distribution',
    'agriculture': 'Agriculture & Élevage',
    'services':    'Services',
    'industrie':   'Industrie & Manufacture',
    'transport':   'Transport & Logistique',
    'construction':'Construction & BTP',
    'energie':     'Énergie & Mines',
    'finance':     'Finance & Assurance',
    'sante':       'Santé',
    'education':   'Éducation & Formation',
    'tech':        'Technologies & Numérique',
    'tourisme':    'Tourisme & Hôtellerie',
}

CEMAC_MAP_CENTERS = {
    'CG': {'latitude': -4.263360, 'longitude': 15.242885},
    'CM': {'latitude': 3.848033,  'longitude': 11.502075},
    'GA': {'latitude': 0.416198,  'longitude': 9.467268},
    'CF': {'latitude': 4.394674,  'longitude': 18.558189},
    'TD': {'latitude': 12.134846, 'longitude': 15.055742},
    'GQ': {'latitude': 3.750000,  'longitude': 8.783333},
    'CD': {'latitude': -4.441931, 'longitude': 15.266293},
}


def _get_models():
    from scoring.models_bank import BankEnterprise, BankClient, LoanApplication
    return BankEnterprise, BankClient, LoanApplication


def _get_user_model():
    from django.contrib.auth import get_user_model
    return get_user_model()


def _normalize_cemac_country(value):
    if not value:
        return None
    code = str(value).upper().strip()
    return code if code in CEMAC_COUNTRIES else None


def _compute_user_risk_level(score):
    if score is None:
        return None
    if score >= 700:
        return 'low'
    if score >= 500:
        return 'medium'
    return 'high'


def _get_latest_user_scores(user_ids):
    from .models import TerasScore

    latest_scores = {}
    for score in TerasScore.objects.filter(user_id__in=user_ids).order_by('user_id', '-created_at'):
        latest_scores.setdefault(score.user_id, score)
    return latest_scores


def _build_full_name(user):
    full_name = f"{getattr(user, 'first_name', '') or ''} {getattr(user, 'last_name', '') or ''}".strip()
    return full_name or getattr(user, 'username', '') or getattr(user, 'email', '')


def _serialize_type_breakdown(type_counts):
    order = ['individual', 'enterprise', 'bank', 'government', 'admin']
    return [{'user_type': key, 'count': type_counts.get(key, 0)} for key in order if type_counts.get(key, 0) > 0]


def _build_government_map_queryset(request):
    User = _get_user_model()
    queryset = User.objects.all()

    if Profile is not None:
        queryset = queryset.select_related('profile').filter(
            profile__latitude__isnull=False,
            profile__longitude__isnull=False,
        )
    else:
        return User.objects.none()

    queryset = queryset.filter(country__in=list(CEMAC_COUNTRIES.keys()))

    country_filter = _normalize_cemac_country(request.query_params.get('country'))
    if request.query_params.get('country') and country_filter is None:
        return None
    if country_filter:
        queryset = queryset.filter(country=country_filter)

    user_type = (request.query_params.get('type') or '').strip()
    if user_type:
        queryset = queryset.filter(user_type=user_type)

    status_filter = (request.query_params.get('status') or '').strip().lower()
    if status_filter == 'active':
        queryset = queryset.filter(is_active=True)
    elif status_filter in ('inactive', 'suspended'):
        queryset = queryset.filter(is_active=False)

    source_filter = (request.query_params.get('source') or '').strip().lower()
    if source_filter:
        queryset = queryset.filter(profile__location_source=source_filter)

    return queryset.order_by('-date_joined')


# ─────────────────────────────────────────────────────────────────────────────
# 1. Dashboard gouvernemental — vue d'ensemble CEMAC
# ─────────────────────────────────────────────────────────────────────────────

def _get_user_country(user):
    """Retourne le pays du compte gouvernement (ex: 'CG'), ou None si CEMAC global."""
    return getattr(user, 'country', None) or None


def _is_own_country(user, country_code):
    """Vérifie si ce pays appartient à l'utilisateur gouvernement."""
    uc = _get_user_country(user)
    return uc is None or uc.upper() == country_code.upper()


def _anonymize_country(c: dict) -> dict:
    """Masque les détails sensibles d'un pays étranger — garde seulement l'agrégé."""
    return {
        'code':           c['code'],
        'name':           c['name'],
        'capital':        c['capital'],
        'enterprises':    c['enterprises'],
        'individuals':    c['individuals'],
        'avg_score':      c['avg_score'],
        'annual_revenue': c['annual_revenue'],
        'employees':      c['employees'],
        'active':         c['active'],
        'is_own_country': False,
        'restricted':     True,
    }


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def government_overview(request):
    """
    GET /api/scoring/government/overview/
    Vue d'ensemble économique de toute la zone CEMAC.
    """
    BankEnterprise, BankClient, LoanApplication = _get_models()
    User = _get_user_model()

    # ── Entreprises ──────────────────────────────────────────────────────────
    ent_total  = BankEnterprise.objects.count()
    ent_active = BankEnterprise.objects.filter(status='active').count()
    ent_avg_score = round(float(
        BankEnterprise.objects.filter(teras_score__isnull=False)
        .aggregate(avg=Avg('teras_score'))['avg'] or 0
    ))
    ent_revenue = float(
        BankEnterprise.objects.aggregate(total=Sum('annual_revenue'))['total'] or 0
    )
    ent_employees = BankEnterprise.objects.aggregate(total=Sum('employees_count'))['total'] or 0

    # ── Individus ────────────────────────────────────────────────────────────
    ind_total     = BankClient.objects.count()
    ind_avg_score = round(float(
        BankClient.objects.filter(teras_score__isnull=False)
        .aggregate(avg=Avg('teras_score'))['avg'] or 0
    ))
    ind_income = float(
        BankClient.objects.aggregate(total=Sum('monthly_income'))['total'] or 0
    ) * 12  # annualisé

    # ── Crédits ──────────────────────────────────────────────────────────────
    loan_total    = LoanApplication.objects.count()
    loan_active   = LoanApplication.objects.filter(status='disbursed').count()
    loan_volume   = float(
        LoanApplication.objects.filter(status__in=['approved', 'disbursed'])
        .aggregate(total=Sum('requested_amount'))['total'] or 0
    )
    loan_approval = round(
        LoanApplication.objects.filter(status__in=['approved', 'disbursed']).count() /
        max(LoanApplication.objects.count(), 1) * 100, 1
    )

    # ── Par pays ─────────────────────────────────────────────────────────────
    by_country = []
    for code, info in CEMAC_COUNTRIES.items():
        ents  = BankEnterprise.objects.filter(country=code)
        inds  = BankClient.objects.filter(country=code)
        count = ents.count() + inds.count()
        if count == 0 and code not in ('CG', 'CM', 'GA'):
            continue  # Masquer pays sans données sauf les principaux
        
        avg_s = round(float(
            ents.filter(teras_score__isnull=False)
            .aggregate(avg=Avg('teras_score'))['avg'] or 0
        ))
        rev = float(ents.aggregate(total=Sum('annual_revenue'))['total'] or 0)
        emps = ents.aggregate(total=Sum('employees_count'))['total'] or 0

        by_country.append({
            'code':        code,
            'name':        info['name'],
            'capital':     info['capital'],
            'enterprises': ents.count(),
            'individuals': inds.count(),
            'avg_score':   avg_s,
            'annual_revenue': rev,
            'employees':   emps,
            'active':      ents.filter(status='active').count(),
        })

    # Tagger le pays de l'utilisateur
    user_country = _get_user_country(request.user)
    for entry in by_country:
        entry['is_own_country'] = (user_country is None or entry['code'] == user_country)

    by_country.sort(key=lambda x: x['enterprises'] + x['individuals'], reverse=True)

    return Response({
        'summary': {
            'enterprises':        ent_total,
            'enterprises_active': ent_active,
            'individuals':        ind_total,
            'total_employees':    ent_employees,
            'avg_enterprise_score': ent_avg_score,
            'avg_individual_score': ind_avg_score,
            'total_annual_revenue': ent_revenue,
            'total_individual_income': ind_income,
            'loans_total':        loan_total,
            'loans_active':       loan_active,
            'loans_volume':       loan_volume,
            'loan_approval_rate': loan_approval,
        },
        'by_country': by_country,
        'generated_at': timezone.now().isoformat(),
    })


# ─────────────────────────────────────────────────────────────────────────────
# 2. Détail par pays
# ─────────────────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def government_country_detail(request, country_code):
    """
    GET /api/scoring/government/countries/<code>/
    Analyse approfondie d'un pays CEMAC.
    """
    if country_code.upper() not in CEMAC_COUNTRIES:
        return Response({'error': f"Pays '{country_code}' non reconnu dans la zone CEMAC"}, status=400)

    # Contrôle d'accès : gouvernement national = uniquement ses données détaillées
    if not _is_own_country(request.user, country_code):
        # Retourner version agrégée anonymisée pour pays étranger
        BankEnterprise2, BankClient2, LoanApplication2 = _get_models()
        c_info = CEMAC_COUNTRIES[country_code.upper()]
        ents2 = BankEnterprise2.objects.filter(country=country_code.upper())
        inds2 = BankClient2.objects.filter(country=country_code.upper())
        return Response({
            'country':      {'code': country_code.upper(), 'name': c_info['name'], 'capital': c_info['capital'], 'currency': c_info['currency']},
            'restricted':   True,
            'message':      f"Accès restreint — données détaillées réservées au gouvernement de {c_info['name']}",
            'enterprises':  {'total': ents2.count(), 'avg_score': round(float(ents2.filter(teras_score__isnull=False).aggregate(avg=Avg('teras_score'))['avg'] or 0)), 'annual_revenue': float(ents2.aggregate(total=Sum('annual_revenue'))['total'] or 0)},
            'individuals':  {'total': inds2.count(), 'avg_score': round(float(inds2.filter(teras_score__isnull=False).aggregate(avg=Avg('teras_score'))['avg'] or 0))},
            'loans':        {'total': 0, 'active_volume': 0},
            'generated_at': timezone.now().isoformat(),
        })

    BankEnterprise, BankClient, LoanApplication = _get_models()
    code = country_code.upper()
    info = CEMAC_COUNTRIES[code]
    now  = timezone.now()

    # ── Entreprises du pays ───────────────────────────────────────────────────
    ents = BankEnterprise.objects.filter(country=code)

    # Score distribution entreprises
    score_bands_ent = {
        'A (900-1000)': ents.filter(teras_score__gte=900).count(),
        'B (750-899)':  ents.filter(teras_score__gte=750, teras_score__lt=900).count(),
        'C (600-749)':  ents.filter(teras_score__gte=600, teras_score__lt=750).count(),
        'D (400-599)':  ents.filter(teras_score__gte=400, teras_score__lt=600).count(),
        'E (<400)':     ents.filter(teras_score__lt=400).count(),
        'Non calculé':  ents.filter(teras_score__isnull=True).count(),
    }

    # Par type d'entreprise
    by_type = []
    for etype, elabel in BankEnterprise.ENTERPRISE_TYPE_CHOICES:
        q = ents.filter(enterprise_type=etype)
        if q.count() > 0:
            by_type.append({
                'type':     etype,
                'label':    elabel,
                'count':    q.count(),
                'avg_score': round(float(q.filter(teras_score__isnull=False).aggregate(avg=Avg('teras_score'))['avg'] or 0)),
                'revenue':  float(q.aggregate(total=Sum('annual_revenue'))['total'] or 0),
                'employees': q.aggregate(total=Sum('employees_count'))['total'] or 0,
            })
    by_type.sort(key=lambda x: x['count'], reverse=True)

    # ── Individus du pays ─────────────────────────────────────────────────────
    inds = BankClient.objects.filter(country=code)
    score_bands_ind = {
        'A (900-1000)': inds.filter(teras_score__gte=900).count(),
        'B (750-899)':  inds.filter(teras_score__gte=750, teras_score__lt=900).count(),
        'C (600-749)':  inds.filter(teras_score__gte=600, teras_score__lt=750).count(),
        'D (400-599)':  inds.filter(teras_score__gte=400, teras_score__lt=600).count(),
        'E (<400)':     inds.filter(teras_score__lt=400).count(),
        'Non calculé':  inds.filter(teras_score__isnull=True).count(),
    }

    # ── Crédits du pays ───────────────────────────────────────────────────────
    ent_ids = ents.values_list('id', flat=True)
    ind_ids = inds.values_list('id', flat=True)
    loans_ent = LoanApplication.objects.filter(enterprise_id__in=ent_ids)
    loans_ind = LoanApplication.objects.filter(client_id__in=ind_ids)
    loans_all = LoanApplication.objects.filter(
        Q(enterprise_id__in=ent_ids) | Q(client_id__in=ind_ids)
    )

    # Par statut crédit
    loan_by_status = {}
    for st, label in LoanApplication.STATUS_CHOICES:
        c = loans_all.filter(status=st).count()
        if c > 0:
            loan_by_status[label] = {
                'count':  c,
                'volume': float(loans_all.filter(status=st).aggregate(total=Sum('requested_amount'))['total'] or 0),
            }

    # Tendance mensuelle crédit (6 mois)
    loan_trend = []
    for i in range(5, -1, -1):
        d = now - timedelta(days=30 * i)
        month_start = date(d.year, d.month, 1)
        if d.month == 12:
            month_end = date(d.year + 1, 1, 1)
        else:
            month_end = date(d.year, d.month + 1, 1)

        m_loans = loans_all.filter(
            created_at__date__gte=month_start,
            created_at__date__lt=month_end,
        )
        loan_trend.append({
            'month':  d.strftime('%b %Y'),
            'count':  m_loans.count(),
            'volume': float(m_loans.aggregate(total=Sum('requested_amount'))['total'] or 0),
            'approved': m_loans.filter(status__in=['approved', 'disbursed']).count(),
        })

    # ── Top entreprises ───────────────────────────────────────────────────────
    top_ents = ents.filter(teras_score__isnull=False).order_by('-teras_score')[:10]
    top_enterprises = [
        {
            'id':             e.id,
            'name':           e.name,
            'sector':         e.sector,
            'enterprise_type': e.enterprise_type,
            'teras_score':    e.teras_score,
            'teras_band':     e.teras_band,
            'annual_revenue': float(e.annual_revenue),
            'employees_count': e.employees_count,
            'city':           e.city,
            'status':         e.status,
            'active_loans':   loans_ent.filter(enterprise=e, status='disbursed').count(),
        }
        for e in top_ents
    ]

    # ── Villes principales ────────────────────────────────────────────────────
    cities_ent = (
        ents.values('city')
        .annotate(count=Count('id'), avg_score=Avg('teras_score'), revenue=Sum('annual_revenue'))
        .order_by('-count')[:8]
    )
    cities_ind = (
        inds.values('city')
        .annotate(count=Count('id'), avg_score=Avg('teras_score'))
        .order_by('-count')[:8]
    )

    return Response({
        'country': {
            'code':     code,
            'name':     info['name'],
            'capital':  info['capital'],
            'currency': info['currency'],
        },
        'enterprises': {
            'total':       ents.count(),
            'active':      ents.filter(status='active').count(),
            'avg_score':   round(float(ents.filter(teras_score__isnull=False).aggregate(avg=Avg('teras_score'))['avg'] or 0)),
            'annual_revenue': float(ents.aggregate(total=Sum('annual_revenue'))['total'] or 0),
            'total_employees': ents.aggregate(total=Sum('employees_count'))['total'] or 0,
            'score_distribution': score_bands_ent,
            'by_type':     by_type,
            'top_enterprises': top_enterprises,
            'by_city':     list(cities_ent),
        },
        'individuals': {
            'total':     inds.count(),
            'avg_score': round(float(inds.filter(teras_score__isnull=False).aggregate(avg=Avg('teras_score'))['avg'] or 0)),
            'total_monthly_income': float(inds.aggregate(total=Sum('monthly_income'))['total'] or 0),
            'score_distribution': score_bands_ind,
            'by_city':   list(cities_ind),
        },
        'loans': {
            'total':        loans_all.count(),
            'enterprise':   loans_ent.count(),
            'individual':   loans_ind.count(),
            'active_volume': float(loans_all.filter(status='disbursed').aggregate(total=Sum('requested_amount'))['total'] or 0),
            'by_status':    loan_by_status,
            'trend_6months': loan_trend,
        },
        'generated_at': timezone.now().isoformat(),
    })


# ─────────────────────────────────────────────────────────────────────────────
# 3. Analyse sectorielle CEMAC
# ─────────────────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def government_sectors_analysis(request):
    """
    GET /api/scoring/government/sectors/
    Analyse des secteurs économiques sur toute la zone CEMAC.
    """
    BankEnterprise, BankClient, LoanApplication = _get_models()
    country = request.query_params.get('country', '')  # filtre optionnel

    user_country = _get_user_country(request.user)
    ents = BankEnterprise.objects.filter(status='active')
    if country:
        ents = ents.filter(country=country.upper())
    elif user_country:
        # Par défaut : données nationales + possibilité de voir CEMAC
        ents = ents.filter(country=user_country)

    # Agréger par secteur (champ libre → normalisation approximative)
    sector_data = {}
    for e in ents.select_related():
        sector_raw = (e.sector or 'non_classifié').lower().strip()
        # Normalisation approximative
        sector_key = 'autres'
        for key in ['commerce', 'agriculture', 'transport', 'construction',
                    'energie', 'finance', 'sante', 'education', 'tech', 'tourisme',
                    'industrie', 'services']:
            if key in sector_raw or sector_raw.startswith(key[:5]):
                sector_key = key
                break

        if sector_key not in sector_data:
            sector_data[sector_key] = {
                'sector':    sector_key,
                'label':     SECTORS.get(sector_key, sector_key.title()),
                'count':     0,
                'revenue':   0.0,
                'employees': 0,
                'scores':    [],
                'countries': set(),
            }
        sector_data[sector_key]['count']    += 1
        sector_data[sector_key]['revenue']  += float(e.annual_revenue or 0)
        sector_data[sector_key]['employees']+= e.employees_count or 0
        sector_data[sector_key]['countries'].add(e.country)
        if e.teras_score:
            sector_data[sector_key]['scores'].append(e.teras_score)

    # Finaliser
    result = []
    for k, v in sector_data.items():
        scores = v.pop('scores')
        countries = v.pop('countries')
        v['avg_score']  = round(sum(scores) / len(scores)) if scores else 0
        v['countries']  = sorted(list(countries))
        v['country_count'] = len(countries)
        # Crédit dans ce secteur (approx via entreprises)
        result.append(v)

    result.sort(key=lambda x: x['revenue'], reverse=True)

    # KPIs globaux
    total_ents   = ents.count()
    total_rev    = float(ents.aggregate(total=Sum('annual_revenue'))['total'] or 0)
    total_emps   = ents.aggregate(total=Sum('employees_count'))['total'] or 0
    top_sector   = result[0]['label'] if result else '—'

    return Response({
        'summary': {
            'total_enterprises': total_ents,
            'total_revenue':     total_rev,
            'total_employees':   total_emps,
            'sectors_count':     len(result),
            'top_sector':        top_sector,
        },
        'sectors':      result,
        'country_filter': country or 'CEMAC',
        'generated_at': timezone.now().isoformat(),
    })


# ─────────────────────────────────────────────────────────────────────────────
# 4. Indicateurs macroéconomiques CEMAC
# ─────────────────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def government_macro_indicators(request):
    """
    GET /api/scoring/government/macro/
    Indicateurs macroéconomiques calculés depuis les données TERAS.
    """
    BankEnterprise, BankClient, LoanApplication = _get_models()

    now    = timezone.now()
    since  = now - timedelta(days=365)

    # ── Volume économique total ───────────────────────────────────────────────
    gdp_proxy = float(
        BankEnterprise.objects.aggregate(total=Sum('annual_revenue'))['total'] or 0
    ) + float(
        BankClient.objects.aggregate(total=Sum('monthly_income'))['total'] or 0
    ) * 12

    # ── Emploi formel ─────────────────────────────────────────────────────────
    formal_jobs      = BankEnterprise.objects.aggregate(total=Sum('employees_count'))['total'] or 0
    local_jobs_rate  = round(
        formal_jobs / max(BankEnterprise.objects.count(), 1) * 100, 1
    ) if formal_jobs else 0

    # ── Inclusion financière ──────────────────────────────────────────────────
    total_actors    = BankEnterprise.objects.count() + BankClient.objects.count()
    banked_actors   = (
        BankEnterprise.objects.filter(active_loans_count__gt=0).count() +
        BankClient.objects.filter(active_loans_count__gt=0).count()
    )
    inclusion_rate  = round(banked_actors / max(total_actors, 1) * 100, 1)

    # ── Score TERAS moyen global ──────────────────────────────────────────────
    avg_ent_score = round(float(
        BankEnterprise.objects.filter(teras_score__isnull=False)
        .aggregate(avg=Avg('teras_score'))['avg'] or 0
    ))
    avg_ind_score = round(float(
        BankClient.objects.filter(teras_score__isnull=False)
        .aggregate(avg=Avg('teras_score'))['avg'] or 0
    ))

    # ── Crédit & risque ───────────────────────────────────────────────────────
    loan_total_volume = float(
        LoanApplication.objects.filter(status__in=['approved', 'disbursed'])
        .aggregate(total=Sum('requested_amount'))['total'] or 0
    )
    default_rate = round(
        LoanApplication.objects.filter(status='cancelled').count() /
        max(LoanApplication.objects.count(), 1) * 100, 1
    )
    approval_rate = round(
        LoanApplication.objects.filter(status__in=['approved', 'disbursed']).count() /
        max(LoanApplication.objects.count(), 1) * 100, 1
    )

    # ── Répartition par pays ──────────────────────────────────────────────────
    cemac_distribution = []
    for code, info in CEMAC_COUNTRIES.items():
        ents = BankEnterprise.objects.filter(country=code).count()
        inds = BankClient.objects.filter(country=code).count()
        if ents + inds > 0:
            cemac_distribution.append({
                'code':    code,
                'name':    info['name'],
                'enterprises': ents,
                'individuals': inds,
                'total':   ents + inds,
                'share':   round((ents + inds) / max(total_actors, 1) * 100, 1),
            })
    cemac_distribution.sort(key=lambda x: x['total'], reverse=True)

    # ── Tendance trimestrielle (nouvelles entreprises) ────────────────────────
    growth_trend = []
    for i in range(3, -1, -1):
        q_start = now - timedelta(days=90 * (i + 1))
        q_end   = now - timedelta(days=90 * i)
        new_ents = BankEnterprise.objects.filter(
            created_at__gte=q_start, created_at__lt=q_end
        ).count()
        new_inds = BankClient.objects.filter(
            join_date__gte=q_start.date(), join_date__lt=q_end.date()
        ).count()
        growth_trend.append({
            'quarter': f"Q{4-i} {q_start.year}",
            'new_enterprises': new_ents,
            'new_individuals': new_inds,
        })

    return Response({
        'gdp_proxy':          gdp_proxy,
        'formal_jobs':        formal_jobs,
        'inclusion_rate':     inclusion_rate,
        'avg_enterprise_score': avg_ent_score,
        'avg_individual_score': avg_ind_score,
        'loan_total_volume':  loan_total_volume,
        'default_rate':       default_rate,
        'approval_rate':      approval_rate,
        'total_actors':       total_actors,
        'cemac_distribution': cemac_distribution,
        'growth_trend':       growth_trend,
        'generated_at':       timezone.now().isoformat(),
    })


# ─────────────────────────────────────────────────────────────────────────────
# 5. Alerte et conformité fiscale
# ─────────────────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def government_compliance_alerts(request):
    """
    GET /api/scoring/government/compliance/
    Entreprises à faible score TERAS (risque fiscal/social) par pays.
    """
    BankEnterprise, _, LoanApplication = _get_models()
    country = request.query_params.get('country', '')
    threshold = int(request.query_params.get('threshold', 500))

    user_country = _get_user_country(request.user)
    ents = BankEnterprise.objects.filter(
        teras_score__isnull=False,
        teras_score__lt=threshold,
        status='active',
    )
    # Gouvernement national : uniquement son pays sauf si filtre explicite
    if country:
        ents = ents.filter(country=country.upper())
    elif user_country:
        ents = ents.filter(country=user_country)

    ents = ents.order_by('teras_score')[:50]

    alerts = [
        {
            'id':             e.id,
            'name':           e.name,
            'country':        e.country,
            'country_name':   CEMAC_COUNTRIES.get(e.country, {}).get('name', e.country),
            'city':           e.city,
            'sector':         e.sector,
            'teras_score':    e.teras_score,
            'teras_band':     e.teras_band,
            'enterprise_type': e.enterprise_type,
            'annual_revenue': float(e.annual_revenue or 0),
            'employees_count': e.employees_count or 0,
            'active_loans':   LoanApplication.objects.filter(enterprise=e, status='disbursed').count(),
            'risk_level':     'critique' if e.teras_score < 300 else 'élevé' if e.teras_score < 400 else 'moyen',
        }
        for e in ents
    ]

    # Résumé par pays
    by_country = {}
    for a in alerts:
        c = a['country_name']
        if c not in by_country:
            by_country[c] = {'count': 0, 'avg_score': 0, 'scores': []}
        by_country[c]['count'] += 1
        by_country[c]['scores'].append(a['teras_score'])

    country_summary = [
        {
            'country': c,
            'count':   v['count'],
            'avg_score': round(sum(v['scores']) / len(v['scores'])),
        }
        for c, v in by_country.items()
    ]

    return Response({
        'threshold':      threshold,
        'total_at_risk':  len(alerts),
        'alerts':         alerts,
        'by_country':     country_summary,
        'generated_at':   timezone.now().isoformat(),
    })


# ─────────────────────────────────────────────────────────────────────────────
# 6. Rapport IA gouvernemental enrichi (données réelles)
# ─────────────────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def government_ai_context(request):
    """
    GET /api/scoring/government/ai-context/
    Fournit le contexte de données réelles pour enrichir les rapports IA gouvernementaux.
    """
    BankEnterprise, BankClient, LoanApplication = _get_models()

    # Snapshot compact pour le prompt IA
    ents = BankEnterprise.objects.all()
    inds = BankClient.objects.all()
    loans = LoanApplication.objects.all()

    context = {
        'zone': 'CEMAC',
        'date': timezone.now().strftime('%d %B %Y'),
        'enterprises': {
            'total':    ents.count(),
            'active':   ents.filter(status='active').count(),
            'avg_score': round(float(ents.filter(teras_score__isnull=False).aggregate(avg=Avg('teras_score'))['avg'] or 0)),
            'revenue_total_xaf': float(ents.aggregate(total=Sum('annual_revenue'))['total'] or 0),
            'employees_total':   ents.aggregate(total=Sum('employees_count'))['total'] or 0,
        },
        'individuals': {
            'total':    inds.count(),
            'avg_score': round(float(inds.filter(teras_score__isnull=False).aggregate(avg=Avg('teras_score'))['avg'] or 0)),
            'income_monthly_xaf': float(inds.aggregate(total=Sum('monthly_income'))['total'] or 0),
        },
        'credit': {
            'total_applications': loans.count(),
            'active_volume_xaf':  float(loans.filter(status='disbursed').aggregate(total=Sum('requested_amount'))['total'] or 0),
            'approval_rate_pct':  round(loans.filter(status__in=['approved','disbursed']).count() / max(loans.count(),1) * 100, 1),
            'default_rate_pct':   round(loans.filter(status='cancelled').count() / max(loans.count(),1) * 100, 1),
        },
        'countries': {
            code: {
                'enterprises': ents.filter(country=code).count(),
                'individuals': inds.filter(country=code).count(),
                'avg_score':   round(float(ents.filter(country=code, teras_score__isnull=False).aggregate(avg=Avg('teras_score'))['avg'] or 0)),
                'revenue_xaf': float(ents.filter(country=code).aggregate(total=Sum('annual_revenue'))['total'] or 0),
            }
            for code, _ in CEMAC_COUNTRIES.items()
        },
    }
    return Response(context)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def government_users_map(request):
    """
    GET /api/scoring/government/users/map/
    Carte CEMAC des utilisateurs géolocalisés.

    Règle d'accès :
    - gouvernement national : détail précis pour son pays, vue agrégée pour les autres
    - compte global sans pays CEMAC défini : détail complet sur toute la CEMAC
    """
    if getattr(request.user, 'user_type', '') not in ('government', 'admin', 'regional'):
        return Response({'error': 'Accès réservé aux comptes gouvernementaux.'}, status=403)

    queryset = _build_government_map_queryset(request)
    if queryset is None:
        return Response({'error': 'Filtre pays invalide pour la zone CEMAC.'}, status=400)

    viewer_country = _normalize_cemac_country(_get_user_country(request.user))
    selected_country = _normalize_cemac_country(request.query_params.get('country'))
    access_mode = 'cemac_full_detail' if viewer_country is None else 'national_detail'

    if viewer_country is None:
        detailed_users = list(queryset)
        aggregated_users = []
    else:
        if selected_country and selected_country != viewer_country:
            detailed_users = []
            aggregated_users = list(queryset.filter(country=selected_country))
        else:
            detailed_users = list(queryset.filter(country=viewer_country))
            aggregated_users = list(queryset.exclude(country=viewer_country)) if selected_country is None else []

    score_map = _get_latest_user_scores([user.id for user in list(detailed_users) + list(aggregated_users)])
    markers = []

    for user in detailed_users:
        profile = getattr(user, 'profile', None)
        score = score_map.get(user.id)
        score_value = score.score if score else None

        markers.append({
            'id': f'user-{user.id}',
            'marker_type': 'user',
            'restricted': False,
            'country': user.country,
            'country_name': CEMAC_COUNTRIES.get(user.country, {}).get('name', user.country),
            'latitude': float(profile.latitude) if profile and profile.latitude is not None else None,
            'longitude': float(profile.longitude) if profile and profile.longitude is not None else None,
            'full_name': _build_full_name(user),
            'user_type': getattr(user, 'user_type', 'individual'),
            'city': getattr(profile, 'city', '') if profile else '',
            'address': getattr(profile, 'address', '') if profile else '',
            'is_active': user.is_active,
            'score': score_value,
            'risk_level': _compute_user_risk_level(score_value),
            'location_source': getattr(profile, 'location_source', '') if profile else '',
            'location_updated_at': profile.location_updated_at.isoformat() if profile and profile.location_updated_at else None,
            'detail_scope': 'national',
        })

    aggregate_by_country = {}
    for user in aggregated_users:
        country = _normalize_cemac_country(getattr(user, 'country', None))
        if not country:
            continue

        data = aggregate_by_country.setdefault(country, {
            'count': 0,
            'active_users': 0,
            'scores': [],
            'type_counts': {},
        })
        data['count'] += 1
        if user.is_active:
            data['active_users'] += 1
        data['type_counts'][getattr(user, 'user_type', 'individual')] = data['type_counts'].get(getattr(user, 'user_type', 'individual'), 0) + 1
        score = score_map.get(user.id)
        if score:
            data['scores'].append(score.score)

    for country, data in aggregate_by_country.items():
        center = CEMAC_MAP_CENTERS.get(country, {'latitude': 1.5, 'longitude': 15.5})
        avg_score = round(sum(data['scores']) / len(data['scores'])) if data['scores'] else None

        markers.append({
            'id': f'country-{country}',
            'marker_type': 'country',
            'restricted': True,
            'country': country,
            'country_name': CEMAC_COUNTRIES.get(country, {}).get('name', country),
            'latitude': center['latitude'],
            'longitude': center['longitude'],
            'city': CEMAC_COUNTRIES.get(country, {}).get('capital', ''),
            'total_users': data['count'],
            'active_users': data['active_users'],
            'avg_score': avg_score,
            'type_breakdown': _serialize_type_breakdown(data['type_counts']),
            'location_source': 'country-capital-anchor',
            'detail_scope': 'aggregated-country',
            'message': f"Données détaillées réservées au gouvernement de {CEMAC_COUNTRIES.get(country, {}).get('name', country)}.",
        })

    markers.sort(key=lambda marker: (marker['marker_type'] != 'user', marker['country']))

    return Response({
        'viewer_country': viewer_country,
        'viewer_country_name': CEMAC_COUNTRIES.get(viewer_country, {}).get('name') if viewer_country else 'CEMAC',
        'access_mode': access_mode,
        'filters': {
            'country': selected_country,
            'type': (request.query_params.get('type') or '').strip() or None,
            'status': (request.query_params.get('status') or '').strip() or None,
            'source': (request.query_params.get('source') or '').strip() or None,
        },
        'summary': {
            'detailed_users': len([marker for marker in markers if marker['marker_type'] == 'user']),
            'aggregated_markers': len([marker for marker in markers if marker['marker_type'] == 'country']),
            'total_geolocated': len(detailed_users) + len(aggregated_users),
        },
        'markers': markers,
        'generated_at': timezone.now().isoformat(),
    })

CONGO_DEPTS = [
    {'dept':'Brazzaville',  'capital':'Brazzaville',  'region':'Sud',    'cities':['Brazzaville']},
    {'dept':'Kouilou',      'capital':'Pointe-Noire', 'region':'Sud',    'cities':['Pointe-Noire']},
    {'dept':'Niari',        'capital':'Dolisie',      'region':'Sud',    'cities':['Dolisie','Mossendjo']},
    {'dept':'Bouenza',      'capital':'Madingou',     'region':'Sud',    'cities':['Madingou','Nkayi']},
    {'dept':'Lékoumou',     'capital':'Sibiti',       'region':'Sud',    'cities':['Sibiti']},
    {'dept':'Pool',         'capital':'Kinkala',      'region':'Sud',    'cities':['Kinkala']},
    {'dept':'Plateaux',     'capital':'Djambala',     'region':'Centre', 'cities':['Djambala']},
    {'dept':'Cuvette',      'capital':'Owando',       'region':'Centre', 'cities':['Owando','Makoua','Mossaka']},
    {'dept':'Cuvette-Ouest','capital':'Ewo',          'region':'Centre', 'cities':['Ewo']},
    {'dept':'Sangha',       'capital':'Ouesso',       'region':'Nord',   'cities':['Ouesso']},
    {'dept':'Likouala',     'capital':'Impfondo',     'region':'Nord',   'cities':['Impfondo']},
]

COUNTRY_DEPTS = {'CG': CONGO_DEPTS}

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def government_regions(request):
    BankEnterprise, BankClient, LoanApplication = _get_models()
    user_country = _get_user_country(request.user) or 'CG'
    depts = COUNTRY_DEPTS.get(user_country, CONGO_DEPTS)
    country_info = CEMAC_COUNTRIES.get(user_country, {'name': user_country})
    result = []
    for dept_info in depts:
        cities = dept_info['cities']
        ents = BankEnterprise.objects.filter(country=user_country, city__in=cities)
        inds = BankClient.objects.filter(country=user_country, city__in=cities)
        ent_ids = ents.values_list('id', flat=True)
        ind_ids = inds.values_list('id', flat=True)
        loans = LoanApplication.objects.filter(Q(enterprise_id__in=ent_ids)|Q(client_id__in=ind_ids))
        avg_score = round(float(ents.filter(teras_score__isnull=False).aggregate(avg=Avg('teras_score'))['avg'] or 0))
        revenue = float(ents.aggregate(total=Sum('annual_revenue'))['total'] or 0)
        top_ents = [{'name':e.name,'sector':e.sector or e.enterprise_type,'city':e.city,'teras_score':e.teras_score,'annual_revenue':float(e.annual_revenue or 0),'employees_count':e.employees_count or 0} for e in ents.filter(teras_score__isnull=False).order_by('-teras_score')[:5]]
        sector_counts = {}
        for e in ents:
            s = e.sector or 'autres'
            sector_counts[s] = sector_counts.get(s,0)+1
        result.append({
            'dept': dept_info['dept'], 'capital': dept_info['capital'],
            'region': dept_info.get('region',''), 'cities': cities,
            'enterprises': ents.count(), 'individuals': inds.count(),
            'avg_score': avg_score, 'annual_revenue': revenue,
            'employees': ents.aggregate(total=Sum('employees_count'))['total'] or 0,
            'loans_total': loans.count(), 'loans_active': loans.filter(status='disbursed').count(),
            'loans_volume': float(loans.filter(status='disbursed').aggregate(total=Sum('requested_amount'))['total'] or 0),
            'top_enterprises': top_ents,
            'score_distribution': {'A (≥750)':ents.filter(teras_score__gte=750).count(),'B (600-749)':ents.filter(teras_score__gte=600,teras_score__lt=750).count(),'C (400-599)':ents.filter(teras_score__gte=400,teras_score__lt=600).count(),'D (<400)':ents.filter(teras_score__lt=400).count()},
            'top_sectors': [{'sector':s,'count':c} for s,c in sorted(sector_counts.items(),key=lambda x:-x[1])[:3]],
        })
    all_ents = BankEnterprise.objects.filter(country=user_country)
    return Response({'country':{'code':user_country,'name':country_info['name']},'summary':{'total_departments':len(result),'total_enterprises':all_ents.count(),'total_individuals':BankClient.objects.filter(country=user_country).count(),'total_revenue':float(all_ents.aggregate(total=Sum('annual_revenue'))['total'] or 0),'total_employees':all_ents.aggregate(total=Sum('employees_count'))['total'] or 0,'avg_score':round(float(all_ents.filter(teras_score__isnull=False).aggregate(avg=Avg('teras_score'))['avg'] or 0))},'departments':result,'generated_at':timezone.now().isoformat()})
