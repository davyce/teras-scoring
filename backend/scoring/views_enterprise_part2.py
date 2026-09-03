"""
Vues API Django REST Framework pour TERAS Entreprise - PARTIE 2
Compliance, Reports, Analytics

ENDPOINTS (suite):
- GET  /api/enterprise/compliance/             Statut conformité
- GET  /api/enterprise/reports/                Liste rapports
- POST /api/enterprise/reports/generate/       Générer rapport
- GET  /api/enterprise/reports/{id}/download/  Télécharger rapport
- GET  /api/enterprise/analytics/sector/       Analytics sectorielle
- GET  /api/enterprise/analytics/trends/       Tendances & prédictions
"""

from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import FileResponse
from django.db.models import Avg, Count
from django.utils import timezone
from django.core.exceptions import ValidationError
from datetime import datetime, timedelta
from decimal import Decimal, InvalidOperation
import random

from .models_enterprise import (
    ComplianceStatus,
    EnterpriseReport,
    EnterpriseScore,
    EnterpriseClient,
    Employee,
    EnterpriseDocument,
)
from .serializers_enterprise import (
    ComplianceStatusSerializer,
    EnterpriseReportSerializer,
    EnterpriseReportGenerateSerializer,
    SectorAnalyticsSerializer,
)
from .document_parser import parse_document
from .views_enterprise_part1 import IsEnterpriseUser
from users.models import Profile


# ============================================================================
# CONFORMITÉ FISCALE
# ============================================================================

class EnterpriseComplianceView(APIView):
    """
    GET /api/enterprise/compliance/
    
    Retourne le statut de conformité fiscale de l'entreprise:
    - Taux de conformité (0-100%)
    - Note A/B/C/D/E
    - Déclarations manquantes
    - Retards de paiement
    - Pénalités
    - Alertes actives
    - Recommandations pour améliorer
    """
    permission_classes = [IsEnterpriseUser]
    
    def get(self, request):
        try:
            enterprise = request.user
            
            # Récupérer ou créer le statut de conformité
            compliance, created = ComplianceStatus.objects.get_or_create(
                enterprise=enterprise,
                defaults={
                    'compliance_rate': Decimal('72.00'),  # Valeur par défaut
                    'missing_declarations': [
                        {'type': 'Bilan fiscal Q3 2024', 'deadline': '2024-12-15'},
                    ],
                    'late_payments': 2,
                    'penalties': Decimal('150000.00'),
                    'active_alerts': [
                        {
                            'level': 'warning',
                            'message': 'Bilan fiscal Q3 2024 manquant',
                            'deadline': '2024-12-15'
                        },
                        {
                            'level': 'info',
                            'message': '2 paiements en retard détectés',
                            'action': 'Régulariser dans les 30 jours'
                        }
                    ],
                    'recommendations': [
                        'Soumettre le bilan fiscal Q3 2024 avant le 15 décembre',
                        'Régulariser les 2 paiements en retard',
                        'Mettre en place des rappels automatiques',
                    ]
                }
            )
            
            # Si créé à l'instant, recalculer le taux
            if created:
                compliance.save()  # Déclenche le calcul dans le modèle
            
            serializer = ComplianceStatusSerializer(compliance)
            
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Erreur lors du chargement de la conformité: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ============================================================================
# RAPPORTS
# ============================================================================

class EnterpriseReportsListView(generics.ListAPIView):
    """
    GET /api/enterprise/reports/
    Liste tous les rapports générés
    
    Query params:
    - report_type: Filtrer par type
    - status: Filtrer par statut
    """
    permission_classes = [IsEnterpriseUser]
    serializer_class = EnterpriseReportSerializer
    
    def get_queryset(self):
        queryset = EnterpriseReport.objects.filter(
            enterprise=self.request.user
        )
        
        report_type = self.request.query_params.get('report_type')
        if report_type:
            queryset = queryset.filter(report_type=report_type)
        
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset.order_by('-generated_at')


class EnterpriseReportGenerateView(APIView):
    """
    POST /api/enterprise/reports/generate/
    
    Génère un nouveau rapport TERAS Entreprise
    
    Body:
    {
        "report_type": "quarterly|annual|sector_comparison|custom",
        "period_start": "2024-07-01",
        "period_end": "2024-09-30",
        "format": "pdf|excel"
    }
    
    Le rapport est généré de manière asynchrone.
    Status initial: "generating", puis "ready" ou "failed"
    """
    permission_classes = [IsEnterpriseUser]
    
    def post(self, request):
        serializer = EnterpriseReportGenerateSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            enterprise = request.user
            data = serializer.validated_data
            
            # Générer le titre du rapport
            report_type_labels = {
                'quarterly': 'Rapport Trimestriel',
                'annual': 'Rapport Annuel',
                'sector_comparison': 'Comparaison Sectorielle',
                'custom': 'Rapport Personnalisé'
            }
            
            title = f"{report_type_labels[data['report_type']]} - {data['period_start'].strftime('%B %Y')}"
            
            # Créer le rapport (status: generating)
            report = EnterpriseReport.objects.create(
                enterprise=enterprise,
                report_type=data['report_type'],
                title=title,
                period_start=data['period_start'],
                period_end=data['period_end'],
                status='generating'
            )
            
            # TODO: Lancer la génération asynchrone (Celery task)
            # Pour l'instant, on simule une génération instantanée
            report.status = 'ready'
            report.report_data = self._generate_report_data(enterprise, data)
            report.save()
            
            serializer = EnterpriseReportSerializer(report, context={'request': request})
            
            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED
            )
            
        except Exception as e:
            return Response(
                {'error': f'Erreur lors de la génération du rapport: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _generate_report_data(self, enterprise, params):
        """
        Génère les données du rapport
        En production, ceci serait une tâche Celery qui génère un PDF
        """
        period_start = params['period_start']
        period_end = params['period_end']
        
        # Récupérer les données de la période
        scores = EnterpriseScore.objects.filter(
            enterprise=enterprise,
            computed_at__gte=period_start,
            computed_at__lte=period_end
        ).order_by('computed_at')
        
        avg_score = scores.aggregate(Avg('score'))['score__avg'] or 0
        
        clients_count = EnterpriseClient.objects.filter(
            enterprise=enterprise,
            created_at__lte=period_end
        ).count()
        
        employees_count = Employee.objects.filter(
            enterprise=enterprise,
            hire_date__lte=period_end,
            status='active'
        ).count()
        
        return {
            'period': {
                'start': period_start.isoformat(),
                'end': period_end.isoformat()
            },
            'average_score': round(avg_score),
            'total_clients': clients_count,
            'total_employees': employees_count,
            'scores_history': list(scores.values('score', 'computed_at')),
        }


class EnterpriseReportDownloadView(APIView):
    """
    GET /api/enterprise/reports/{id}/download/
    
    Télécharge le fichier PDF du rapport
    Incrémente le compteur de téléchargements
    """
    permission_classes = [IsEnterpriseUser]
    
    def get(self, request, pk):
        try:
            report = EnterpriseReport.objects.get(
                pk=pk,
                enterprise=request.user
            )
            
            if report.status != 'ready':
                return Response(
                    {'error': 'Le rapport n\'est pas encore prêt'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if not report.file:
                return Response(
                    {'error': 'Fichier non disponible'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Incrémenter le compteur
            report.downloaded_count += 1
            report.save(update_fields=['downloaded_count'])
            
            # Retourner le fichier
            return FileResponse(
                report.file.open('rb'),
                as_attachment=True,
                filename=f"rapport_teras_{report.id}.pdf"
            )
            
        except EnterpriseReport.DoesNotExist:
            return Response(
                {'error': 'Rapport non trouvé'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Erreur lors du téléchargement: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ============================================================================
# ANALYTICS & COMPARAISONS SECTORIELLES
# ============================================================================

class EnterpriseSectorAnalyticsView(APIView):
    """
    GET /api/enterprise/analytics/sector/
    
    Retourne une analyse comparative par rapport au secteur:
    - Score de l'entreprise vs moyenne sectorielle
    - Percentile dans le secteur
    - Distribution des scores
    - Top performers du secteur
    - Recommandations basées sur le secteur
    """
    permission_classes = [IsEnterpriseUser]
    
    def get(self, request):
        try:
            enterprise = request.user
            
            # Score actuel de l'entreprise
            latest_score = EnterpriseScore.objects.filter(
                enterprise=enterprise
            ).order_by('-computed_at').first()
            
            if not latest_score:
                return Response(
                    {'error': 'Aucun score disponible'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            your_score = latest_score.score
            sector = latest_score.sector or 'Commerce général'
            
            # SIMULATION: En production, calculer depuis toutes les entreprises du secteur
            # Pour l'instant, on simule des données
            sector_average = 680
            percentile = self._calculate_percentile(your_score, sector_average)
            ranking = 23
            total_companies = 150
            
            # Distribution des scores dans le secteur (simulé)
            distribution = {
                'excellent': 12,  # 800-1000
                'bon': 35,        # 650-799
                'moyen': 58,      # 500-649
                'faible': 32,     # 350-499
                'critique': 13    # 0-349
            }
            
            # Top performers (simulé)
            top_performers = [
                {'rank': 1, 'score': 895, 'name': 'Entreprise Leader A'},
                {'rank': 2, 'score': 878, 'name': 'Entreprise Leader B'},
                {'rank': 3, 'score': 865, 'name': 'Entreprise Leader C'},
            ]
            
            # Recommandations sectorielles
            sector_recommendations = self._generate_sector_recommendations(
                your_score,
                sector_average,
                sector
            )
            
            analytics_data = {
                'sector': sector,
                'your_score': your_score,
                'sector_average': sector_average,
                'percentile': percentile,
                'ranking': ranking,
                'total_companies': total_companies,
                'distribution': distribution,
                'top_performers': top_performers,
                'sector_recommendations': sector_recommendations,
            }
            
            return Response(analytics_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Erreur lors du chargement des analytics: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _calculate_percentile(self, your_score, sector_average):
        """Calcule le percentile basé sur le score"""
        if your_score >= sector_average + 100:
            return random.randint(85, 95)
        elif your_score >= sector_average:
            return random.randint(60, 84)
        elif your_score >= sector_average - 100:
            return random.randint(40, 59)
        else:
            return random.randint(10, 39)
    
    def _generate_sector_recommendations(self, your_score, sector_avg, sector):
        """Génère des recommandations basées sur la performance sectorielle"""
        recommendations = []
        
        gap = sector_avg - your_score
        
        if gap > 50:
            recommendations.append(
                f"Votre score est {gap} points sous la moyenne du secteur {sector}. "
                "Priorisez l'amélioration de la transparence fiscale."
            )
        elif gap > 0:
            recommendations.append(
                f"Vous êtes {gap} points sous la moyenne. "
                "Augmentez votre taux d'emploi local pour progresser."
            )
        else:
            recommendations.append(
                f"Excellent ! Vous êtes {abs(gap)} points au-dessus de la moyenne. "
                "Maintenez vos bonnes pratiques."
            )
        
        # Recommandations spécifiques au secteur
        if sector == 'Commerce général':
            recommendations.append(
                "Dans le commerce, la rétention client est clé. "
                "Mettez en place un programme de fidélité."
            )
        elif sector == 'Transport':
            recommendations.append(
                "Dans le transport, la conformité fiscale et la maintenance "
                "des actifs sont critiques."
            )
        
        return recommendations


class EnterpriseTrendsView(APIView):
    """
    GET /api/enterprise/analytics/trends/
    
    Retourne les tendances et prédictions:
    - Évolution des scores sur 12 mois
    - Prédiction du score à 3 mois
    - Tendances par pilier
    - Évolution du nombre de clients
    - Évolution du nombre d'employés
    """
    permission_classes = [IsEnterpriseUser]
    
    def get(self, request):
        try:
            enterprise = request.user
            
            # Scores des 12 derniers mois
            twelve_months_ago = timezone.now() - timedelta(days=365)
            scores = EnterpriseScore.objects.filter(
                enterprise=enterprise,
                computed_at__gte=twelve_months_ago
            ).order_by('computed_at')
            
            scores_data = list(scores.values('score', 'breakdown', 'computed_at'))
            
            # Prédiction simple (moyenne des 3 derniers mois + tendance)
            if len(scores_data) >= 3:
                recent_scores = [s['score'] for s in scores_data[-3:]]
                avg_recent = sum(recent_scores) / len(recent_scores)
                trend = recent_scores[-1] - recent_scores[0]
                predicted_score = int(avg_recent + trend)
            else:
                predicted_score = scores_data[-1]['score'] if scores_data else 0
            
            # Tendances par pilier
            pillar_trends = self._calculate_pillar_trends(scores_data)
            
            # Évolution clients
            clients_trend = self._calculate_clients_trend(enterprise, twelve_months_ago)
            
            # Évolution employés
            employees_trend = self._calculate_employees_trend(enterprise, twelve_months_ago)
            
            trends_data = {
                'scores_history': scores_data,
                'predicted_score_3m': predicted_score,
                'pillar_trends': pillar_trends,
                'clients_trend': clients_trend,
                'employees_trend': employees_trend,
            }
            
            return Response(trends_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Erreur lors du calcul des tendances: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _calculate_pillar_trends(self, scores_data):
        """Calcule la tendance de chaque pilier"""
        if not scores_data:
            return {}
        
        pillars = ['T', 'E', 'R', 'A', 'S']
        trends = {}
        
        for pillar in pillars:
            values = [s['breakdown'].get(pillar, 0) for s in scores_data if s.get('breakdown')]
            if values:
                trend = 'up' if values[-1] > values[0] else ('down' if values[-1] < values[0] else 'stable')
                change = round((values[-1] - values[0]) * 100, 1)
                trends[pillar] = {
                    'trend': trend,
                    'change_percent': change,
                    'current': values[-1]
                }
        
        return trends
    
    def _calculate_clients_trend(self, enterprise, start_date):
        """Calcule l'évolution du nombre de clients"""
        clients_by_month = []
        current_date = start_date
        
        while current_date <= timezone.now():
            count = EnterpriseClient.objects.filter(
                enterprise=enterprise,
                created_at__lte=current_date
            ).count()
            
            clients_by_month.append({
                'month': current_date.strftime('%b %Y'),
                'count': count
            })
            
            # Mois suivant
            if current_date.month == 12:
                current_date = current_date.replace(year=current_date.year + 1, month=1)
            else:
                current_date = current_date.replace(month=current_date.month + 1)
        
        return clients_by_month[-12:]  # 12 derniers mois
    
    def _calculate_employees_trend(self, enterprise, start_date):
        """Calcule l'évolution du nombre d'employés"""
        employees_by_month = []
        current_date = start_date
        
        while current_date <= timezone.now():
            count = Employee.objects.filter(
                enterprise=enterprise,
                hire_date__lte=current_date,
                status='active'
            ).count()
            
            employees_by_month.append({
                'month': current_date.strftime('%b %Y'),
                'count': count
            })
            
            # Mois suivant
            if current_date.month == 12:
                current_date = current_date.replace(year=current_date.year + 1, month=1)
            else:
                current_date = current_date.replace(month=current_date.month + 1)
        
        return employees_by_month[-12:]  # 12 derniers mois

# ============================================================================
# PROFILE  GET / PATCH
# ============================================================================

def _get_latest_score(user):
    try:
        latest = EnterpriseScore.objects.filter(enterprise=user).order_by('-computed_at').first()
        return latest.score if latest else 0
    except Exception:
        return 0

def _get_kyc_status(user):
    try:
        from .models_kyc import KYCRequest
        kyc = KYCRequest.objects.filter(user=user).order_by('-submitted_at').first()
        return kyc.status if kyc else 'pending'
    except Exception:
        return 'pending'


def _get_or_create_profile(user):
    profile, _ = Profile.objects.get_or_create(user=user)
    return profile


def _serialize_coordinate(value):
    if value in (None, ''):
        return None
    return float(value)


def _parse_coordinate(value, field_name, min_value, max_value):
    if value in (None, '', 'null'):
        return None

    try:
        coord = Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError):
        raise ValidationError(f"Champ '{field_name}' invalide.")

    if coord < Decimal(str(min_value)) or coord > Decimal(str(max_value)):
        raise ValidationError(f"Champ '{field_name}' hors limites ({min_value} à {max_value}).")

    return coord

def _user_to_profile(user):
    profile = _get_or_create_profile(user)
    return {
        'company_name':    getattr(user, 'company_name', None) or user.get_full_name() or user.username,
        'legal_form':      getattr(user, 'legal_form', None) or '',
        'tax_id':          getattr(user, 'tax_id', None) or '',
        'rccm':            getattr(user, 'rccm', None) or '',
        'email':           user.email or '',
        'phone':           getattr(profile, 'phone_number', None) or '',
        'address':         getattr(profile, 'address', None) or '',
        'city':            getattr(profile, 'city', None) or '',
        'country':         getattr(user, 'country', None) or getattr(profile, 'country', None) or 'CG',
        'latitude':        _serialize_coordinate(profile.latitude),
        'longitude':       _serialize_coordinate(profile.longitude),
        'location_source': getattr(profile, 'location_source', None) or '',
        'location_updated_at': profile.location_updated_at.isoformat() if profile.location_updated_at else None,
        'website':         getattr(user, 'website', None) or '',
        'sector':          getattr(user, 'sector', None) or '',
        'employees_count': getattr(user, 'employees_count', None) or 0,
        'description':     getattr(user, 'bio', None) or '',
        'teras_score':     _get_latest_score(user),
        'kyc_status':      _get_kyc_status(user),
    }


class EnterpriseProfileView(APIView):
    """
    GET   /api/scoring/enterprise/profile/
    PATCH /api/scoring/enterprise/profile/
    """
    permission_classes = [IsEnterpriseUser]

    def get(self, request):
        return Response(_user_to_profile(request.user))

    def patch(self, request):
        user = request.user
        data = request.data
        profile = _get_or_create_profile(user)
        DIRECT = ['email', 'first_name', 'last_name']
        CUSTOM = ['company_name', 'legal_form', 'tax_id', 'rccm',
                  'country', 'website', 'sector', 'employees_count']

        for field in DIRECT:
            if field in data:
                setattr(user, field, data[field])
        for field in CUSTOM:
            if field in data and hasattr(user, field):
                setattr(user, field, data[field])
        if 'description' in data and hasattr(user, 'bio'):
            user.bio = data['description']

        if 'phone' in data:
            profile.phone_number = data.get('phone') or ''
        if 'address' in data:
            profile.address = data.get('address') or ''
        if 'city' in data:
            profile.city = data.get('city') or ''
        if 'country' in data:
            profile.country = data.get('country') or ''

        location_fields_provided = False
        try:
            if 'latitude' in data:
                profile.latitude = _parse_coordinate(data.get('latitude'), 'latitude', -90, 90)
                location_fields_provided = True

            if 'longitude' in data:
                profile.longitude = _parse_coordinate(data.get('longitude'), 'longitude', -180, 180)
                location_fields_provided = True
        except ValidationError as exc:
            message = exc.messages[0] if getattr(exc, 'messages', None) else str(exc)
            return Response({'error': message}, status=status.HTTP_400_BAD_REQUEST)

        if 'location_source' in data:
            profile.location_source = data.get('location_source') or ''
            location_fields_provided = True

        if location_fields_provided:
            profile.location_updated_at = timezone.now()

        try:
            user.save()
        except Exception:
            pass

        try:
            profile.save()
        except Exception:
            pass

        return Response(_user_to_profile(user))


# ============================================================================
# TRANSACTIONS  GET
# ============================================================================

def _safe_transaction_float(value, default: float = 0.0) -> float:
    try:
        if value in (None, ''):
            return default
        return float(value)
    except (TypeError, ValueError, InvalidOperation):
        return default


def _normalize_transaction_date(value) -> str | None:
    if not value:
        return None
    if hasattr(value, 'isoformat'):
        return value.isoformat()[:10]

    text = str(value).strip()
    if not text:
        return None

    for fmt in (
        '%Y-%m-%d',
        '%d/%m/%Y',
        '%d-%m-%Y',
        '%Y/%m/%d',
        '%Y-%m-%dT%H:%M:%S',
        '%Y-%m-%d %H:%M:%S',
    ):
        try:
            return datetime.strptime(text[:19], fmt).date().isoformat()
        except ValueError:
            continue

    if len(text) >= 10:
        return text[:10]
    return None


def _enterprise_transaction_category(description: str, tx_type: str) -> str:
    desc = (description or '').lower()

    if any(token in desc for token in ('salaire', 'salary', 'paie', 'payroll', 'remuneration')):
        return 'Salaires'
    if any(token in desc for token in ('impot', 'tax', 'tva', 'fiscal', 'douane')):
        return 'Impots'
    if any(token in desc for token in ('loyer', 'rent', 'bail', 'lease')):
        return 'Loyer'
    if any(token in desc for token in ('fournisseur', 'supplier', 'achat', 'purchase', 'approvisionnement')):
        return 'Fournisseurs'
    if any(token in desc for token in ('electricite', 'eau', 'telecom', 'internet', 'service', 'frais', 'commission', 'abonnement', 'maintenance')):
        return 'Services'
    if tx_type == 'credit' or any(token in desc for token in ('vente', 'client', 'encaissement', 'versement', 'depot', 'virement recu', 'payment received')):
        return 'Ventes'
    return 'Autre'


def _normalize_enterprise_transaction(raw_txn: dict, index: int, document: EnterpriseDocument) -> dict | None:
    date_value = _normalize_transaction_date(raw_txn.get('date'))
    amount = abs(_safe_transaction_float(raw_txn.get('amount_xaf') or raw_txn.get('amount')))
    if not date_value or amount <= 0:
        return None

    tx_type = str(raw_txn.get('type') or '').lower()
    if tx_type not in ('credit', 'debit'):
        tx_type = 'credit'

    description = str(
        raw_txn.get('description')
        or raw_txn.get('label')
        or raw_txn.get('memo')
        or f'Transaction issue du document {document.title}'
    ).strip()
    balance = _safe_transaction_float(raw_txn.get('balance'))
    reference = str(raw_txn.get('reference') or raw_txn.get('hash') or f'DOC-{document.id}-{index + 1}')

    return {
        'id': document.id * 1000 + index + 1,
        'date': date_value,
        'type': tx_type,
        'category': _enterprise_transaction_category(description, tx_type),
        'description': description[:255],
        'amount': round(amount, 2),
        'balance': round(balance, 2),
        'reference': reference[:120],
        'status': 'completed',
    }


def _document_can_feed_transactions(document: EnterpriseDocument, document_role: str, summary: dict, parser_summary: dict) -> bool:
    if isinstance(summary.get('extracted_transactions'), list) and summary.get('extracted_transactions'):
        return True
    if isinstance(parser_summary.get('transactions'), list) and parser_summary.get('transactions'):
        return True

    raw = ' '.join(filter(None, [
        document_role,
        document.category,
        getattr(document, 'title', ''),
        getattr(getattr(document, 'file', None), 'name', ''),
    ])).lower().replace('-', '_')

    return any(token in raw for token in (
        'bank_statement',
        'statement',
        'releve',
        'invoice',
        'facture',
        'sales_register',
        'purchase_register',
        'income_expenses',
        'journal',
        'cashbook',
        'vente',
        'achat',
    ))


def _synthesize_enterprise_document_transactions(document: EnterpriseDocument, summary: dict, document_role: str) -> list[dict]:
    metrics = summary.get('extracted_metrics') or {}
    amount = _safe_transaction_float(metrics.get('invoice_amount_xaf'))
    if amount <= 0:
        return []

    raw = ' '.join(filter(None, [
        document_role,
        document.category,
        getattr(document, 'title', ''),
        getattr(getattr(document, 'file', None), 'name', ''),
    ])).lower()

    tx_type = 'debit' if any(token in raw for token in ('purchase', 'achat', 'supplier', 'fournisseur')) else 'credit'
    description = document.title or f"Flux documenté {document.id}"
    date_value = None
    if getattr(document, 'period_end', None):
        date_value = document.period_end.isoformat()
    elif getattr(document, 'processed_at', None):
        date_value = document.processed_at.date().isoformat()
    elif getattr(document, 'uploaded_at', None):
        date_value = document.uploaded_at.date().isoformat()

    if not date_value:
        return []

    return [{
        'date': date_value,
        'description': description,
        'amount': amount,
        'amount_xaf': amount,
        'type': tx_type,
        'category': _enterprise_transaction_category(description, tx_type),
        'balance': 0,
        'reference': f'DOC-{document.id}',
    }]


def _collect_document_transactions(document: EnterpriseDocument) -> list[dict]:
    summary = document.analysis_summary or {}
    parser_summary = summary.get('parser_result') or {}
    document_role = (
        summary.get('document_role')
        or (summary.get('document_signals') or {}).get('document_role')
        or document.category
    )

    raw_transactions = []
    if isinstance(summary.get('extracted_transactions'), list):
        raw_transactions = summary.get('extracted_transactions') or []
    elif isinstance(parser_summary.get('transactions'), list):
        raw_transactions = parser_summary.get('transactions') or []

    if not raw_transactions and not _document_can_feed_transactions(document, document_role, summary, parser_summary):
        return []

    if not raw_transactions and document.file:
        parse_result = parse_document(document.file.path, document.file.name)
        if parse_result.get('parsing_success'):
            raw_transactions = parse_result.get('transactions') or []
            if raw_transactions:
                summary = {
                    **summary,
                    'parser_result': {
                        **parser_summary,
                        'transactions_count': len(raw_transactions),
                        'transactions': raw_transactions[:200],
                        'quality': parse_result.get('quality', parser_summary.get('quality', {})),
                        'teras_signals': parse_result.get('teras_signals', parser_summary.get('teras_signals', {})),
                        'recommendations': parse_result.get('recommendations', parser_summary.get('recommendations', [])),
                    },
                }
                document.analysis_summary = summary
                document.save(update_fields=['analysis_summary'])

    if not raw_transactions:
        raw_transactions = _synthesize_enterprise_document_transactions(document, summary, document_role)

    normalized: list[dict] = []
    for index, raw_txn in enumerate(raw_transactions[:400]):
        item = _normalize_enterprise_transaction(raw_txn, index, document)
        if item:
            normalized.append(item)
    return normalized


class EnterpriseTransactionsView(APIView):
    """GET /api/scoring/enterprise/transactions/"""
    permission_classes = [IsEnterpriseUser]

    def get(self, request):
        try:
            tx_type = request.query_params.get('type')
            category = request.query_params.get('category')
            start_date = request.query_params.get('start_date')
            end_date = request.query_params.get('end_date')

            documents = EnterpriseDocument.objects.filter(enterprise=request.user).exclude(file='').order_by(
                '-period_end', '-processed_at', '-uploaded_at'
            )
            transactions: list[dict] = []
            for document in documents:
                transactions.extend(_collect_document_transactions(document))

            if tx_type in {'credit', 'debit'}:
                transactions = [txn for txn in transactions if txn['type'] == tx_type]
            if category:
                transactions = [txn for txn in transactions if txn['category'] == category]
            if start_date:
                transactions = [txn for txn in transactions if txn['date'] >= start_date]
            if end_date:
                transactions = [txn for txn in transactions if txn['date'] <= end_date]

            transactions.sort(key=lambda txn: (txn['date'], txn['id']), reverse=True)
            return Response(transactions)
        except Exception as exc:
            return Response(
                {'error': f'Erreur lors du chargement des transactions: {str(exc)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


# ============================================================================
# NOTIFICATIONS
# ============================================================================

from rest_framework.decorators import api_view, permission_classes as drf_permission_classes

class EnterpriseNotificationsView(APIView):
    """GET /api/scoring/enterprise/notifications/"""
    permission_classes = [IsEnterpriseUser]

    def get(self, request):
        try:
            from .models_enterprise import EnterpriseNotification
            notifs = EnterpriseNotification.objects.filter(
                enterprise=request.user).order_by('-timestamp')
            from .serializers_enterprise import EnterpriseNotificationSerializer
            return Response(EnterpriseNotificationSerializer(notifs, many=True).data)
        except Exception:
            return Response([])

@api_view(['POST'])
@drf_permission_classes([IsEnterpriseUser])
def enterprise_notification_read(request, pk):
    try:
        from .models_enterprise import EnterpriseNotification
        n = EnterpriseNotification.objects.get(pk=pk, enterprise=request.user)
        n.read = True; n.save()
        return Response({'success': True})
    except Exception:
        return Response({'success': False}, status=404)

@api_view(['POST'])
@drf_permission_classes([IsEnterpriseUser])
def enterprise_notifications_read_all(request):
    try:
        from .models_enterprise import EnterpriseNotification
        EnterpriseNotification.objects.filter(enterprise=request.user, read=False).update(read=True)
    except Exception:
        pass
    return Response({'success': True})

@api_view(['DELETE'])
@drf_permission_classes([IsEnterpriseUser])
def enterprise_notification_delete(request, pk):
    try:
        from .models_enterprise import EnterpriseNotification
        EnterpriseNotification.objects.filter(pk=pk, enterprise=request.user).delete()
    except Exception:
        pass
    return Response({'success': True})


# ============================================================================
# SETTINGS  GET / PUT
# ============================================================================

class EnterpriseSettingsView(APIView):
    """GET/PUT /api/scoring/enterprise/settings/"""
    permission_classes = [IsEnterpriseUser]

    def _settings(self, user):
        return {
            'notifications': {
                'email_alerts':      getattr(user, 'notif_email', True),
                'score_updates':     getattr(user, 'notif_score', True),
                'compliance_alerts': getattr(user, 'notif_compliance', True),
                'weekly_report':     getattr(user, 'notif_weekly', False),
            },
            'privacy': {
                'show_score_public': getattr(user, 'score_public', False),
                'data_sharing':      getattr(user, 'data_sharing', False),
            },
            'interface': {
                'language': getattr(user, 'language', 'fr'),
                'timezone': getattr(user, 'timezone', 'Africa/Brazzaville'),
            },
        }

    def get(self, request):
        return Response(self._settings(request.user))

    def put(self, request):
        user = request.user
        for key, attr in [('email_alerts','notif_email'),('score_updates','notif_score'),
                           ('compliance_alerts','notif_compliance'),('weekly_report','notif_weekly')]:
            v = request.data.get('notifications', {}).get(key)
            if v is not None and hasattr(user, attr):
                setattr(user, attr, v)
        for key, attr in [('show_score_public','score_public'),('data_sharing','data_sharing')]:
            v = request.data.get('privacy', {}).get(key)
            if v is not None and hasattr(user, attr):
                setattr(user, attr, v)
        try:
            user.save()
        except Exception:
            pass
        return Response(self._settings(user))


# ============================================================================
# SUPPORT TICKETS
# ============================================================================

class EnterpriseSupportTicketsView(APIView):
    """GET/POST /api/scoring/enterprise/support/tickets/"""
    permission_classes = [IsEnterpriseUser]

    CATEGORY_FROM_FRONT = {
        'technique': 'technical',
        'facturation': 'other',
        'score': 'score',
        'documents': 'technical',
        'autre': 'other',
    }

    CATEGORY_TO_FRONT = {
        'technical': 'technique',
        'score': 'score',
        'other': 'autre',
        'account': 'autre',
        'credit': 'autre',
        'security': 'autre',
    }

    def _serialize_message(self, message):
        sender_name = (
            message.sender.get_full_name().strip()
            if hasattr(message.sender, 'get_full_name') and message.sender.get_full_name().strip()
            else getattr(message.sender, 'email', 'Support TERAS')
        )
        return {
            'id': str(message.id),
            'sender': 'admin' if getattr(message, 'is_admin_message', False) else 'user',
            'sender_name': sender_name,
            'message': getattr(message, 'content', ''),
            'created_at': message.created_at.isoformat(),
        }

    def _serialize_ticket(self, ticket):
        messages = [self._serialize_message(msg) for msg in ticket.messages.order_by('created_at')]
        if not messages and getattr(ticket, 'description', ''):
            messages = [{
                'id': f'{ticket.id}-initial',
                'sender': 'user',
                'sender_name': (
                    ticket.user.get_full_name().strip()
                    if hasattr(ticket.user, 'get_full_name') and ticket.user.get_full_name().strip()
                    else getattr(ticket.user, 'email', 'Entreprise')
                ),
                'message': ticket.description,
                'created_at': ticket.created_at.isoformat(),
            }]

        attachments = []
        if getattr(ticket, 'attachment', None):
            try:
                attachments.append({
                    'id': f'{ticket.id}-attachment',
                    'filename': ticket.attachment.name.split('/')[-1],
                    'file_size': ticket.attachment.size,
                    'uploaded_at': ticket.created_at.isoformat(),
                })
            except Exception:
                pass

        return {
            'id': str(ticket.id),
            'subject': ticket.subject,
            'category': self.CATEGORY_TO_FRONT.get(getattr(ticket, 'category', 'other'), 'autre'),
            'priority': getattr(ticket, 'priority', 'medium'),
            'status': ticket.status,
            'created_at': ticket.created_at.isoformat(),
            'updated_at': ticket.updated_at.isoformat(),
            'messages': messages,
            'attachments': attachments,
            'assigned_to': getattr(getattr(ticket, 'assigned_to', None), 'get_full_name', lambda: '')() or getattr(getattr(ticket, 'assigned_to', None), 'email', None),
        }

    def get(self, request):
        try:
            from .models_support import SupportTicket
            tickets = SupportTicket.objects.filter(user=request.user).order_by('-created_at')
            return Response([self._serialize_ticket(ticket) for ticket in tickets])
        except Exception:
            return Response([])

    def post(self, request):
        try:
            from .models_support import SupportTicket, TicketMessage
            raw_category = request.data.get('category', 'autre')
            attachment = request.FILES.get('attachment')
            t = SupportTicket.objects.create(
                user=request.user,
                subject=request.data.get('subject',''),
                description=request.data.get('message',''),
                category=self.CATEGORY_FROM_FRONT.get(raw_category, 'other'),
                priority=request.data.get('priority','medium'),
                status='open',
                attachment=attachment,
            )
            if request.data.get('message', '').strip():
                TicketMessage.objects.create(
                    ticket=t,
                    sender=request.user,
                    content=request.data.get('message', '').strip(),
                )
            return Response(self._serialize_ticket(t), status=201)
        except Exception as e:
            return Response({'error': str(e)}, status=400)

@api_view(['POST'])
@drf_permission_classes([IsEnterpriseUser])
def enterprise_support_ticket_reply(request, pk):
    try:
        from .models_support import SupportTicket, TicketMessage
        ticket = SupportTicket.objects.get(pk=pk, user=request.user)
        content = request.data.get('message', '').strip()
        if not content:
            return Response({'error': 'Message vide'}, status=400)

        msg = TicketMessage.objects.create(
            ticket=ticket,
            sender=request.user,
            content=content,
        )
        if ticket.status in ['resolved', 'closed']:
            ticket.status = 'open'
            ticket.save(update_fields=['status', 'updated_at'])
        return Response({
            'id': str(msg.id),
            'sender': 'user',
            'sender_name': request.user.get_full_name().strip() or request.user.email,
            'message': msg.content,
            'created_at': msg.created_at.isoformat(),
        }, status=201)
    except Exception as e:
        return Response({'error': str(e)}, status=400)

@api_view(['POST'])
@drf_permission_classes([IsEnterpriseUser])
def enterprise_support_ticket_close(request, pk):
    try:
        from .models_support import SupportTicket
        t = SupportTicket.objects.get(pk=pk, user=request.user)
        t.status = 'closed'; t.save()
        return Response({'success': True})
    except Exception as e:
        return Response({'error': str(e)}, status=400)


# ============================================================================
# AI ASSISTANT CHAT
# ============================================================================

import requests as http_requests
from django.conf import settings as django_settings

class EnterpriseAIChatView(APIView):
    """POST /api/scoring/enterprise/ai/chat/"""
    permission_classes = [IsEnterpriseUser]

    def post(self, request):
        message = request.data.get('message', '').strip()
        if not message:
            return Response({'error': 'Message vide'}, status=400)

        user = request.user
        score = _get_latest_score(user)
        system = f"""Tu es l'assistant IA TERAS Entreprise, expert en scoring financier CEMAC.
Entreprise: {getattr(user,'company_name',user.username)} | Score: {score}/1000
Secteur: {getattr(user,'sector','Non renseigné')} | Ville: {getattr(user,'city','Non renseignée')}
Réponds en français, de façon professionnelle et concise. Exemples concrets CEMAC (FCFA)."""

        try:
            api_key = getattr(django_settings, 'ANTHROPIC_API_KEY', '')
            if not api_key:
                raise ValueError("Clé API manquante")
            resp = http_requests.post(
                'https://api.anthropic.com/v1/messages',
                headers={'x-api-key': api_key, 'anthropic-version': '2023-06-01',
                         'content-type': 'application/json'},
                json={'model': 'claude-sonnet-4-5', 'max_tokens': 1024,
                      'system': system,
                      'messages': [{'role': 'user', 'content': message}]},
                timeout=30,
            )
            resp.raise_for_status()
            return Response({'response': resp.json()['content'][0]['text'], 'suggestions': []})
        except Exception as e:
            return Response({
                'response': "Je suis l'assistant TERAS Entreprise. Service temporairement indisponible.",
                'suggestions': ["Comment améliorer mon score TERAS ?",
                                "Quels documents dois-je soumettre ?",
                                "Comment fonctionne la conformité fiscale CEMAC ?"],
            })
