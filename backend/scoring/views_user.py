# backend/scoring/views_user.py
"""
✅ FICHIER COMPLET FINAL - VERSION AMÉLIORÉE
✅ Support banques Congo-Brazzaville
✅ Changement mot de passe
✅ Statistiques documents
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import check_password
from django.db import models
from django.db.models import Sum, Count
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal, InvalidOperation

User = get_user_model()

from .models import TerasScore, Transaction, Income, Asset, Recommendation

# Import conditionnel UserDocument
try:
    from .models import UserDocument
    USER_DOCUMENT_AVAILABLE = True
except ImportError:
    USER_DOCUMENT_AVAILABLE = False

try:
    from users.models import Profile
except Exception:
    Profile = None


# ============================================
# DONNÉES CONGO-BRAZZAVILLE
# ============================================

BANQUES_CONGO = {
    'uba': 'United Bank for Africa (UBA)',
    'lcb': 'La Congolaise de Banque (LCB)',
    'bgfi': 'BGFI Bank Congo',
    'ecobank': 'Ecobank Congo',
    'bsca': 'BSCA (Banque Sino-Congolaise pour l\'Afrique)',
    'credit_congo': 'Crédit du Congo',
    'societe_generale': 'Société Générale Congo',
    'bci': 'BCI (Banque Commerciale Internationale)',
    'mucodec': 'MUCODEC',
    'postbank': 'Postbank Congo',
    'autre': 'Autre établissement',
}

REGIONS_CONGO = [
    'Brazzaville',
    'Pointe-Noire',
    'Bouenza',
    'Cuvette',
    'Cuvette-Ouest',
    'Kouilou',
    'Lékoumou',
    'Likouala',
    'Niari',
    'Plateaux',
    'Pool',
    'Sangha',
]

DOCUMENT_CATEGORY_LABELS = {
    'general': 'Document general',
    'bank_statement': 'Releve bancaire',
    'payslip': 'Fiche de paie',
    'invoice': 'Facture',
    'proof_asset': "Justificatif d'actif",
    'identity': "Piece d'identite",
    'tax_document': 'Document fiscal',
    'other': 'Autre document',
}


def _safe_float(value, default: float = 0.0) -> float:
    try:
        return float(value or 0)
    except (TypeError, ValueError):
        return default


def _infer_document_category(filename: str, category: str = 'other') -> str:
    raw = f"{filename or ''} {category or ''}".lower().replace('-', '_')
    if any(token in raw for token in (
        'vehicle_registration',
        'carte_grise',
        'asset_declaration',
        'asset_inventory',
        'fixed_assets',
        'savings_proof',
        'proof_asset',
        'property_title',
        'titre_de_propriete',
    )):
        return 'proof_asset'
    if any(token in raw for token in (
        'identity',
        'id_card',
        'identity_card',
        'passport',
        'passeport',
        'driver_license',
        'permis',
    )):
        return 'identity'
    if any(token in raw for token in ('tax', 'fiscal', 'impot', 'patente', 'cnss')):
        return 'tax_document'
    if any(token in raw for token in ('salary', 'paie', 'bulletin', 'employment_certificate')):
        return 'payslip'
    if any(token in raw for token in ('invoice', 'facture', 'receipt', 'recu')):
        return 'invoice'
    if any(token in raw for token in ('bank_statement', 'income_expenses', 'statement', 'releve')):
        return 'bank_statement'
    return category or 'other'


def _get_or_create_profile(user):
    """Retourne le profil utilisateur, le crée si nécessaire."""
    if Profile is None:
        return None
    profile, _ = Profile.objects.get_or_create(user=user)
    return profile


def _serialize_coordinate(value):
    if value is None:
        return None
    return float(value)


def _parse_coordinate(value, field_name, min_value, max_value):
    if value in (None, '', 'null'):
        return None

    try:
        coord = Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError):
        raise ValueError(f"Champ '{field_name}' invalide.")

    if coord < Decimal(str(min_value)) or coord > Decimal(str(max_value)):
        raise ValueError(
            f"Champ '{field_name}' hors limites ({min_value} à {max_value})."
        )

    return coord


def _document_category_label(category):
    return DOCUMENT_CATEGORY_LABELS.get(category or 'general', 'Document')


def _infer_asset_proof_label(filename: str, category: str = 'proof_asset') -> str:
    name = (filename or '').lower()
    if 'vehicle' in name or 'carte_grise' in name or 'registration' in name:
        return 'Carte grise ou titre vehicule'
    if 'property' in name or 'titre' in name or 'lease' in name or 'warehouse' in name:
        return 'Titre de propriete ou bail'
    if 'invoice' in name or 'facture' in name or 'purchase' in name:
        return "Facture d'achat d'actif"
    if 'asset' in name or 'inventory' in name or 'inventaire' in name:
        return "Declaration d'actif"
    return _document_category_label(category)


def _build_user_document_intelligence(user):
    baseline = {
        'total_docs': 0,
        'analyzed_docs': 0,
        'applied_docs': 0,
        'coverage_ratio': 0.0,
        'categories': [],
        'proof_asset_docs': 0,
        'proof_assets_applied': 0,
        'documented_assets_total_xaf': 0,
        'verified_assets_total_xaf': 0,
        'latest_asset_value_xaf': 0,
        'collateral_candidate_value_xaf': 0,
        'latest_proof_label': None,
        'latest_proof_filename': None,
        'latest_processed_at': None,
        'asset_proof_strength': 'none',
        'alerts': [],
    }

    if not USER_DOCUMENT_AVAILABLE:
        return baseline

    try:
        docs = list(UserDocument.objects.filter(user=user).order_by('-processed_at', '-uploaded_at'))
        verified_assets_total = _safe_float(
            Asset.objects.filter(user=user, verified=True).aggregate(total=Sum('estimated_value'))['total']
        )
        proof_docs = []
        documented_assets_total = 0.0

        for doc in docs:
            ai_analysis = doc.ai_analysis or {}
            dashboard_updates = ai_analysis.get('dashboard_updates') or {}
            summary = ai_analysis.get('summary') or {}
            document_type = (
                ai_analysis.get('document_type')
                or dashboard_updates.get('document_type')
                or _infer_document_category(doc.filename, doc.category)
            )
            if document_type == 'proof_asset' or doc.category == 'proof_asset':
                proof_docs.append(doc)
                documented_assets_total += max(
                    _safe_float(summary.get('estimated_asset_value_xaf')),
                    _safe_float(dashboard_updates.get('estimated_asset_value_xaf')),
                )

        latest_proof = next(
            (
                doc for doc in proof_docs
                if doc.processed_at or doc.ai_analysis or doc.generated_score_id
            ),
            proof_docs[0] if proof_docs else None,
        )

        latest_asset_value = 0.0
        latest_proof_label = None
        latest_proof_filename = None
        latest_processed_at = None
        if latest_proof:
            latest_analysis = latest_proof.ai_analysis or {}
            latest_dashboard_updates = latest_analysis.get('dashboard_updates') or {}
            latest_summary = latest_analysis.get('summary') or {}
            latest_asset_value = max(
                _safe_float(latest_summary.get('estimated_asset_value_xaf')),
                _safe_float(latest_dashboard_updates.get('estimated_asset_value_xaf')),
            )
            latest_proof_label = _infer_asset_proof_label(latest_proof.filename, latest_proof.category)
            latest_proof_filename = latest_proof.filename
            latest_processed_at = (
                latest_proof.processed_at.isoformat()
                if latest_proof.processed_at else None
            )

        collateral_base = max(documented_assets_total, verified_assets_total)
        collateral_candidate_value = round(collateral_base * 0.60) if collateral_base > 0 else 0
        if collateral_candidate_value >= 2_000_000 or len(proof_docs) >= 3:
            asset_proof_strength = 'strong'
        elif collateral_candidate_value >= 750_000 or len(proof_docs) >= 1:
            asset_proof_strength = 'medium'
        elif proof_docs:
            asset_proof_strength = 'light'
        else:
            asset_proof_strength = 'none'

        alerts = []
        if not proof_docs:
            alerts.append("Aucun justificatif d'actif n'a encore ete applique au dossier.")
        elif not any(doc.generated_score_id for doc in proof_docs):
            alerts.append("Les preuves d'actifs sont presentes mais n'ont pas encore ete appliquees au moteur TERAS.")
        if proof_docs and verified_assets_total <= 0:
            alerts.append("Les actifs documentes demandent encore une verification ou une application explicite.")

        return {
            'total_docs': len(docs),
            'analyzed_docs': sum(1 for doc in docs if doc.ai_analysis),
            'applied_docs': sum(1 for doc in docs if doc.generated_score_id),
            'coverage_ratio': round(min(1.0, len(docs) / 4), 3) if docs else 0.0,
            'categories': sorted({doc.category for doc in docs}),
            'proof_asset_docs': len(proof_docs),
            'proof_assets_applied': sum(1 for doc in proof_docs if doc.generated_score_id),
            'documented_assets_total_xaf': round(documented_assets_total),
            'verified_assets_total_xaf': round(verified_assets_total),
            'latest_asset_value_xaf': round(latest_asset_value),
            'collateral_candidate_value_xaf': collateral_candidate_value,
            'latest_proof_label': latest_proof_label,
            'latest_proof_filename': latest_proof_filename,
            'latest_processed_at': latest_processed_at,
            'asset_proof_strength': asset_proof_strength,
            'alerts': alerts,
        }
    except Exception:
        return baseline


# ============================================
# DASHBOARD
# ============================================

class UserDashboardView(APIView):
    """GET /api/scoring/user/dashboard/ - Dashboard complet"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user

        scores_qs = list(TerasScore.objects.filter(user=user).order_by('-created_at')[:2])
        current_score = scores_qs[0] if scores_qs else None
        if current_score:
            previous_score = scores_qs[1].score if len(scores_qs) > 1 else 0
            score_data = {
                'score': current_score.score,
                'current': current_score.score,
                'previous': previous_score,
                'change_month': current_score.score - previous_score,
                'level': current_score.level_display,
                'breakdown': current_score.breakdown,
                'computed_at': current_score.created_at.isoformat() if current_score.created_at else None,
            }
        else:
            score_data = {
                'score': 0,
                'current': 0,
                'previous': 0,
                'change_month': 0,
                'level': 'Débutant',
                'breakdown': {'T': 0, 'E': 0, 'R': 0, 'A': 0, 'S': 0},
                'computed_at': None,
            }

        thirty_days_ago = datetime.now() - timedelta(days=30)

        # Documents count
        documents_count = 0
        if USER_DOCUMENT_AVAILABLE:
            try:
                documents_count = UserDocument.objects.filter(user=user).count()
            except:
                pass

        document_intelligence = _build_user_document_intelligence(user)
        stats_30j = {
            'transactions_count': Transaction.objects.filter(user=user, created_at__gte=thirty_days_ago).count(),
            'total_volume': float(Transaction.objects.filter(user=user, created_at__gte=thirty_days_ago).aggregate(total=models.Sum('amount'))['total'] or 0),
            'documents_uploaded': documents_count,
            'recommendations_completed': Recommendation.objects.filter(user=user, completed=True, completed_at__gte=thirty_days_ago).count(),
        }

        six_months_ago = datetime.now() - timedelta(days=180)
        evolution_data = [
            {'date': score.created_at.isoformat(), 'score': score.score}
            for score in TerasScore.objects.filter(user=user, created_at__gte=six_months_ago).order_by('created_at')
        ]

        recommendations = [
            {
                'id': rec.id,
                'category': rec.category,
                'priority': rec.priority,
                'title': rec.title,
                'description': rec.description,
                'impact': rec.impact,
                'completed': rec.completed,
            }
            for rec in Recommendation.objects.filter(user=user, completed=False).order_by('-priority', '-created_at')[:5]
        ]

        credit_capacity = self.calculate_credit_capacity(user, score_data['score'])
        recent_activities = []
        if document_intelligence.get('latest_processed_at'):
            recent_activities.append({
                'type': 'document',
                'label': (
                    f"Preuve d'actif traitee : {document_intelligence.get('latest_proof_label') or 'document actif'}"
                    if document_intelligence.get('proof_asset_docs')
                    else 'Document traite dans votre dossier'
                ),
                'status': 'success' if document_intelligence.get('applied_docs') else 'pending',
                'created_at': document_intelligence['latest_processed_at'],
            })
        if current_score and score_data['computed_at']:
            recent_activities.append({
                'type': 'score',
                'label': f"Score TERAS actualise a {current_score.score}/1000",
                'status': 'success',
                'created_at': score_data['computed_at'],
            })
        if recommendations:
            recent_activities.append({
                'type': 'alert',
                'label': recommendations[0]['title'],
                'status': 'pending',
                'created_at': timezone.now().isoformat(),
            })
        recent_activities = sorted(
            recent_activities,
            key=lambda item: item.get('created_at') or '',
            reverse=True,
        )[:4]
        
        return Response({
            'user': {
                'id': user.id, 
                'email': user.email, 
                'first_name': user.first_name, 
                'last_name': user.last_name, 
                'user_type': getattr(user, 'user_type', 'individual'),
            },
            'score': score_data,
            'teras_score': score_data['score'],
            'stats_30j': stats_30j,
            'evolution': evolution_data,
            'score_history': evolution_data,
            'recommendations': recommendations,
            'credit_capacity': credit_capacity,
            'document_intelligence': document_intelligence,
            'recent_activities': recent_activities,
        }, status=status.HTTP_200_OK)
    
    def calculate_credit_capacity(self, user, score):
        if score < 400:
            return {'monthly_capacity': 0, 'max_loan_amount': 0, 'eligible': False}
        
        three_months_ago = datetime.now() - timedelta(days=90)
        incomes = Income.objects.filter(user=user, created_at__gte=three_months_ago)
        
        if incomes.exists():
            avg_income = incomes.aggregate(avg=models.Avg('amount'))['avg'] or 0
            monthly_capacity = float(avg_income) * 0.30
        else:
            monthly_capacity = 0
        
        return {
            'monthly_capacity': int(monthly_capacity),
            'max_loan_amount': int(monthly_capacity * 6 * 0.85),
            'eligible': score >= 400 and monthly_capacity > 0,
        }


# ============================================
# SCORE DÉTAILLÉ
# ============================================

class UserScoreDetailView(APIView):
    """GET /api/scoring/user/score/detail/ - Score détaillé"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            current_score = TerasScore.objects.filter(user=request.user).latest('created_at')
            return Response({
                'score': current_score.score,
                'level': current_score.level_display,
                'breakdown': {
                    'T': {'value': current_score.transactions_score, 'max': 100, 'weight': current_score.weight_t, 'label': 'Transactions'},
                    'E': {'value': current_score.savings_score, 'max': 100, 'weight': current_score.weight_e, 'label': 'Épargne'},
                    'R': {'value': current_score.income_score, 'max': 100, 'weight': current_score.weight_r, 'label': 'Revenus'},
                    'A': {'value': current_score.assets_score, 'max': 100, 'weight': current_score.weight_a, 'label': 'Actifs'},
                    'S': {'value': current_score.social_score, 'max': 100, 'weight': current_score.weight_s, 'label': 'Social'},
                },
                'reason_codes': current_score.reason_codes,
                'model_version': current_score.model_version,
                'computed_at': current_score.created_at.isoformat(),
            }, status=status.HTTP_200_OK)
        except TerasScore.DoesNotExist:
            return Response({'error': 'Aucun score trouvé', 'score': 0}, status=status.HTTP_404_NOT_FOUND)


# ============================================
# RECOMMANDATIONS
# ============================================

class UserRecommendationsView(APIView):
    """GET /api/scoring/user/recommendations/ - Recommandations IA"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        recommendations = Recommendation.objects.filter(
            user=request.user,
            completed=False
        ).order_by('-priority', '-created_at')[:10]
        
        data = [
            {
                'id': rec.id,
                'category': rec.category,
                'priority': rec.priority,
                'title': rec.title,
                'description': rec.description,
                'impact': rec.impact,
                'completed': rec.completed,
            }
            for rec in recommendations
        ]
        
        return Response(data, status=status.HTTP_200_OK)


# ============================================
# DOCUMENTS (SIMPLE)
# ============================================

class UserDocumentsView(APIView):
    """GET /api/scoring/user/documents/ - Documents (vue simple)"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        if not USER_DOCUMENT_AVAILABLE:
            return Response({'documents': [], 'total': 0, 'message': 'Module documents non disponible'}, status=status.HTTP_200_OK)
        
        try:
            documents = UserDocument.objects.filter(user=request.user).order_by('-uploaded_at')
            data = [
                {
                    'id': doc.id,
                    'filename': doc.filename,
                    'status': doc.status,
                    'category': doc.category,
                    'uploaded_at': doc.uploaded_at.isoformat(),
                }
                for doc in documents
            ]
            return Response({'documents': data, 'total': len(data)}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'documents': [], 'total': 0, 'error': str(e)}, status=status.HTTP_200_OK)


# ============================================
# HISTORIQUE
# ============================================

class UserHistoryView(APIView):
    """GET /api/scoring/user/history/ - Historique scores"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        one_year_ago = datetime.now() - timedelta(days=365)
        history = TerasScore.objects.filter(user=request.user, created_at__gte=one_year_ago).order_by('-created_at')
        
        data = [
            {
                'id': score.id,
                'score': score.score,
                'level': score.level_display,
                'breakdown': score.breakdown,
                'date': score.created_at.isoformat(),
                'created_at': score.created_at.isoformat(),
                'model_version': score.model_version,
                'is_simulated': getattr(score, 'is_simulated', False) or 'manual-compute' in score.model_version,
                'source': getattr(score, 'source', self._get_score_source(score.model_version)),
            }
            for score in history
        ]
        
        return Response(data, status=status.HTTP_200_OK)
    
    def _get_score_source(self, model_version: str) -> str:
        """Détermine la source du score"""
        if 'manual-compute' in model_version:
            return 'computed'
        elif 'document' in model_version:
            return 'document'
        else:
            return 'system'


# ============================================
# ✅ PROFIL UTILISATEUR AMÉLIORÉ
# ============================================

class UserProfileView(APIView):
    """
    GET /api/scoring/user/profile/ - Profil complet
    PUT /api/scoring/user/profile/ - Mise à jour profil
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        profile = _get_or_create_profile(user)
        
        # Score actuel
        try:
            current_score = TerasScore.objects.filter(user=user).latest('created_at')
            score_info = {
                'score': current_score.score, 
                'level': current_score.level_display,
                'breakdown': current_score.breakdown,
            }
        except TerasScore.DoesNotExist:
            score_info = {
                'score': 0, 
                'level': 'Débutant',
                'breakdown': {'T': 0, 'E': 0, 'R': 0, 'A': 0, 'S': 0}
            }
        
        # Statistiques
        total_transactions = Transaction.objects.filter(user=user).count()
        total_income = Income.objects.filter(user=user).aggregate(total=models.Sum('amount'))['total'] or 0
        total_assets = Asset.objects.filter(user=user).count()
        
        # Documents count
        documents_count = 0
        if USER_DOCUMENT_AVAILABLE:
            try:
                documents_count = UserDocument.objects.filter(user=user).count()
            except:
                pass
        
        # Recommendations count
        recommendations_count = Recommendation.objects.filter(user=user, completed=False).count()
        
        # Récupérer le nom de la banque
        bank_id = getattr(user, 'bank', '') or ''
        bank_name = BANQUES_CONGO.get(bank_id, bank_id) if bank_id else ''
        
        return Response({
            'user': {
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name or '',
                'last_name': user.last_name or '',
                'user_type': getattr(user, 'user_type', 'individual'),
                'country': getattr(user, 'country', 'Congo-Brazzaville') or 'Congo-Brazzaville',
                'region': getattr(user, 'region', '') or '',
                'kyc_status': getattr(user, 'kyc_status', 'pending') or 'pending',
                'phone': getattr(profile, 'phone_number', '') or '' if profile else '',
                'phone_number': getattr(profile, 'phone_number', '') or '' if profile else '',
                'address': getattr(profile, 'address', '') or '' if profile else '',
                'city': getattr(profile, 'city', '') or '' if profile else '',
                'latitude': _serialize_coordinate(profile.latitude) if profile else None,
                'longitude': _serialize_coordinate(profile.longitude) if profile else None,
                'location_source': getattr(profile, 'location_source', '') or '' if profile else '',
                'location_updated_at': profile.location_updated_at.isoformat() if profile and profile.location_updated_at else None,
                'bank': bank_id,
                'bank_name': bank_name,
                'bank_account': getattr(user, 'bank_account', '') or '',
                'date_joined': user.date_joined.isoformat() if user.date_joined else None,
            },
            'score': score_info,
            'stats': {
                'total_transactions': total_transactions,
                'total_income': float(total_income),
                'total_assets': total_assets,
                'documents_count': documents_count,
                'recommendations_count': recommendations_count,
            }
        }, status=status.HTTP_200_OK)
    
    def put(self, request):
        user = request.user
        data = request.data
        profile = _get_or_create_profile(user)
        
        # Champs modifiables sur CustomUser
        allowed_user_fields = [
            'first_name', 'last_name', 'region',
            'bank', 'bank_account', 'country'
        ]
        
        updated_user_fields = []
        updated_profile_fields = []
        
        for field in allowed_user_fields:
            if field in data:
                if hasattr(user, field):
                    setattr(user, field, data[field])
                    updated_user_fields.append(field)
        
        if updated_user_fields:
            user.save(update_fields=updated_user_fields)

        if profile:
            if 'phone' in data and 'phone_number' not in data:
                profile.phone_number = data['phone']
                updated_profile_fields.append('phone_number')

            profile_fields = ['phone_number', 'address', 'city']
            for field in profile_fields:
                if field in data:
                    setattr(profile, field, data[field])
                    updated_profile_fields.append(field)

            location_fields_provided = False
            try:
                if 'latitude' in data:
                    profile.latitude = _parse_coordinate(data.get('latitude'), 'latitude', -90, 90)
                    updated_profile_fields.append('latitude')
                    location_fields_provided = True

                if 'longitude' in data:
                    profile.longitude = _parse_coordinate(data.get('longitude'), 'longitude', -180, 180)
                    updated_profile_fields.append('longitude')
                    location_fields_provided = True
            except ValueError as exc:
                return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

            if 'location_source' in data:
                profile.location_source = data.get('location_source') or ''
                updated_profile_fields.append('location_source')
                location_fields_provided = True

            if location_fields_provided:
                profile.location_updated_at = timezone.now()
                updated_profile_fields.append('location_updated_at')

            if updated_profile_fields:
                profile.save(update_fields=list(dict.fromkeys(updated_profile_fields)))

        if not updated_user_fields and not updated_profile_fields:
            return Response({
                'message': 'Aucun champ modifié',
                'updated_user_fields': [],
                'updated_profile_fields': [],
            }, status=status.HTTP_200_OK)
        
        return Response({
            'message': 'Profil mis à jour avec succès',
            'updated_user_fields': updated_user_fields,
            'updated_profile_fields': list(dict.fromkeys(updated_profile_fields)),
        }, status=status.HTTP_200_OK)


# ============================================
# ✅ NOUVEAU : CHANGEMENT MOT DE PASSE
# ============================================

class ChangePasswordView(APIView):
    """POST /api/users/change-password/ - Changer mot de passe"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        user = request.user
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')
        
        # Validation
        if not current_password or not new_password:
            return Response({
                'error': 'Mot de passe actuel et nouveau mot de passe requis'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Vérifier le mot de passe actuel
        if not check_password(current_password, user.password):
            return Response({
                'error': 'Mot de passe actuel incorrect'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validation nouveau mot de passe
        if len(new_password) < 8:
            return Response({
                'error': 'Le nouveau mot de passe doit contenir au moins 8 caractères'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Changer le mot de passe
        user.set_password(new_password)
        user.save()
        
        return Response({
            'message': 'Mot de passe modifié avec succès'
        }, status=status.HTTP_200_OK)


# ============================================
# ✅ NOUVEAU : LISTE DES BANQUES
# ============================================

class BanquesCongoView(APIView):
    """GET /api/scoring/user/banques/ - Liste des banques du Congo"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        banques = [
            {'id': k, 'name': v} 
            for k, v in BANQUES_CONGO.items()
        ]
        return Response({
            'banques': banques,
            'regions': REGIONS_CONGO
        }, status=status.HTTP_200_OK)


# ============================================
# TRANSACTIONS
# ============================================

class UserTransactionsView(APIView):
    """GET /api/scoring/user/transactions/ - Transactions"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        limit = int(request.GET.get('limit', 50))
        days = int(request.GET.get('days', 30))
        since = datetime.now() - timedelta(days=days)
        
        transactions = Transaction.objects.filter(user=request.user, created_at__gte=since).order_by('-created_at')[:limit]
        
        data = [
            {
                'id': tx.id,
                'amount': float(tx.amount),
                'transaction_type': tx.transaction_type,
                'channel': tx.channel,
                'description': tx.description,
                'created_at': tx.created_at.isoformat(),
            }
            for tx in transactions
        ]
        
        return Response({'transactions': data, 'total': len(data)}, status=status.HTTP_200_OK)


# ============================================
# SIMULATION CRÉDIT
# ============================================

class UserCreditSimulationView(APIView):
    """POST /api/scoring/user/credit/simulate/ - Simulation crédit"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        user = request.user
        amount = float(request.data.get('amount', 0))
        duration = int(request.data.get('duration', 6))
        
        if amount <= 0 or duration <= 0:
            return Response({'error': 'Montant et durée requis'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            current_score = TerasScore.objects.filter(user=user).latest('created_at')
            score = current_score.score
        except TerasScore.DoesNotExist:
            score = 0
        
        three_months_ago = datetime.now() - timedelta(days=90)
        incomes = Income.objects.filter(user=user, created_at__gte=three_months_ago)
        avg_income = float(incomes.aggregate(avg=models.Avg('amount'))['avg'] or 0) if incomes.exists() else 0
        
        crm = avg_income * 0.30
        monthly_payment = amount / duration
        is_feasible = monthly_payment <= crm and score >= 400
        
        if score >= 900:
            interest_rate, rate_num = '5-7%', 0.06
        elif score >= 750:
            interest_rate, rate_num = '8-10%', 0.09
        elif score >= 600:
            interest_rate, rate_num = '10-12%', 0.11
        elif score >= 400:
            interest_rate, rate_num = '12-15%', 0.135
        else:
            interest_rate, rate_num = '15%+', 0.15
        
        total_interest = amount * rate_num * (duration / 12)
        total_cost = amount + total_interest
        crm_used_percent = (monthly_payment / crm * 100) if crm > 0 else 0
        max_loan_for_duration = crm * duration * 0.85
        
        alternative_scenarios = []
        warnings = []
        
        if not is_feasible:
            if crm > 0:
                feasible_amount = crm * duration * 0.85
                if feasible_amount > 0:
                    alternative_scenarios.append({
                        'label': 'Montant réduit sur même durée',
                        'duration': duration,
                        'amount': int(feasible_amount),
                        'monthly_payment': int(feasible_amount / duration),
                        'total_cost': int(feasible_amount * (1 + rate_num * (duration / 12))),
                        'is_feasible': True,
                    })
            
            warnings.append({'type': 'error', 'message': f'Mensualité trop élevée ({int(monthly_payment)} FCFA > CRM {int(crm)} FCFA)'})
        
        if score < 600:
            warnings.append({'type': 'warning', 'message': f'Score bas ({score}) - conditions moins avantageuses'})
        
        if crm_used_percent > 80:
            warnings.append({'type': 'warning', 'message': f'CRM utilisé à {int(crm_used_percent)}% - peu de marge'})
        
        return Response({
            'is_feasible': is_feasible,
            'amount': int(amount),
            'duration': duration,
            'monthly_payment': int(monthly_payment),
            'total_cost': int(total_cost),
            'total_interest': int(total_interest),
            'interest_rate': interest_rate,
            'score_level': current_score.level_display if score > 0 else 'Débutant',
            'score_value': score,
            'crm_available': int(crm),
            'crm_used': int(monthly_payment),
            'crm_used_percent': int(crm_used_percent),
            'max_loan_for_duration': int(max_loan_for_duration),
            'avg_income': int(avg_income),
            'alternative_scenarios': alternative_scenarios,
            'warnings': warnings,
        }, status=status.HTTP_200_OK)


# ============================================
# CALCULATEUR SCORE MANUEL
# ============================================

class ComputeScoreView(APIView):
    """
    POST /api/scoring/user/compute/ - Calcule le score TERAS
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            data = request.data
            
            piliers = {
                'transactions': int(data.get('transactions', 0)),
                'epargne': int(data.get('epargne', 0)),
                'revenus': int(data.get('revenus', 0)),
                'actifs': int(data.get('actifs', 0)),
                'social': int(data.get('social', 0))
            }
            
            # Valider les limites
            if not (0 <= piliers['transactions'] <= 300):
                return Response({'error': 'Transactions doit être entre 0 et 300'}, status=status.HTTP_400_BAD_REQUEST)
            if not (0 <= piliers['epargne'] <= 150):
                return Response({'error': 'Épargne doit être entre 0 et 150'}, status=status.HTTP_400_BAD_REQUEST)
            if not (0 <= piliers['revenus'] <= 200):
                return Response({'error': 'Revenus doit être entre 0 et 200'}, status=status.HTTP_400_BAD_REQUEST)
            if not (0 <= piliers['actifs'] <= 150):
                return Response({'error': 'Actifs doit être entre 0 et 150'}, status=status.HTTP_400_BAD_REQUEST)
            if not (0 <= piliers['social'] <= 200):
                return Response({'error': 'Social doit être entre 0 et 200'}, status=status.HTTP_400_BAD_REQUEST)
            
            score_total = sum(piliers.values())
            
            # Déterminer le niveau
            if score_total >= 900:
                level, level_display, db_level = 'A', 'Or', 'diamant'
            elif score_total >= 750:
                level, level_display, db_level = 'B', 'Argent', 'or'
            elif score_total >= 600:
                level, level_display, db_level = 'C', 'Bronze', 'argent'
            elif score_total >= 400:
                level, level_display, db_level = 'D', 'Cuivre', 'bronze'
            else:
                level, level_display, db_level = 'E', 'Fer', 'debutant'
            
            breakdown = {
                'T': piliers['transactions'],
                'E': piliers['epargne'],
                'R': piliers['revenus'],
                'A': piliers['actifs'],
                'S': piliers['social']
            }
            
            # Sauvegarder
            teras_score = TerasScore.objects.create(
                user=request.user,
                score=score_total,
                level=db_level,
                transactions_score=int(piliers['transactions'] / 3),
                savings_score=int(piliers['epargne'] / 1.5),
                income_score=int(piliers['revenus'] / 2),
                assets_score=int(piliers['actifs'] / 1.5),
                social_score=int(piliers['social'] / 2),
                source='computed',
                is_simulated=False,
                model_version='manual-compute-1.0'
            )
            
            return Response({
                'score': score_total,
                'breakdown': breakdown,
                'profile_type': 'basic',
                'level': level,
                'level_display': level_display,
                'history_id': teras_score.id,
                'created_at': teras_score.created_at.isoformat()
            }, status=status.HTTP_200_OK)
            
        except ValueError as e:
            return Response({'error': f'Valeurs invalides: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': f'Erreur lors du calcul: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
