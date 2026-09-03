# backend/scoring/views_user.py
"""
✅ FICHIER COMPLET FINAL - VERSION AMÉLIORÉE
✅ Support banques Congo-Brazzaville
✅ Changement mot de passe
✅ Statistiques documents
✅ ✅ KYC User (submit/status/list)
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import check_password
from django.db import models
from django.utils import timezone
from datetime import datetime, timedelta

User = get_user_model()

from .models import (
    TerasScore,
    Transaction,
    Income,
    Asset,
    Recommendation,
    UserDocument,
    KYCRequest,
)

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


# ============================================
# DASHBOARD
# ============================================

class UserDashboardView(APIView):
    """GET /api/scoring/user/dashboard/ - Dashboard complet"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        try:
            current_score = TerasScore.objects.filter(user=user).latest('created_at')
            score_data = {
                'score': current_score.score,
                'level': current_score.level_display,
                'breakdown': current_score.breakdown,
            }
        except TerasScore.DoesNotExist:
            score_data = {'score': 0, 'level': 'Débutant', 'breakdown': {'T': 0, 'E': 0, 'R': 0, 'A': 0, 'S': 0}}

        thirty_days_ago = datetime.now() - timedelta(days=30)

        documents_count = UserDocument.objects.filter(user=user).count()

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

        # ✅ Ajout info KYC rapide
        latest_kyc = KYCRequest.objects.filter(user=user).order_by('-submitted_at').first()
        kyc_info = None
        if latest_kyc:
            kyc_info = {
                "id": latest_kyc.id,
                "status": latest_kyc.status,
                "document_type": latest_kyc.document_type,
                "submitted_at": latest_kyc.submitted_at.isoformat(),
                "reviewed_at": latest_kyc.reviewed_at.isoformat() if latest_kyc.reviewed_at else None,
                "rejection_reason": latest_kyc.rejection_reason,
            }

        return Response({
            'user': {
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'user_type': getattr(user, 'user_type', 'individual'),
            },
            'score': score_data,
            'stats_30j': stats_30j,
            'evolution': evolution_data,
            'recommendations': recommendations,
            'credit_capacity': credit_capacity,
            'kyc': kyc_info,
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

        total_transactions = Transaction.objects.filter(user=user).count()
        total_income = Income.objects.filter(user=user).aggregate(total=models.Sum('amount'))['total'] or 0
        total_assets = Asset.objects.filter(user=user).count()

        documents_count = UserDocument.objects.filter(user=user).count()
        recommendations_count = Recommendation.objects.filter(user=user, completed=False).count()

        bank_id = getattr(user, 'bank', '') or ''
        bank_name = BANQUES_CONGO.get(bank_id, bank_id) if bank_id else ''

        # ✅ Info KYC (latest)
        latest_kyc = KYCRequest.objects.filter(user=user).order_by('-submitted_at').first()
        kyc_info = None
        if latest_kyc:
            kyc_info = {
                "id": latest_kyc.id,
                "status": latest_kyc.status,
                "document_type": latest_kyc.document_type,
                "submitted_at": latest_kyc.submitted_at.isoformat(),
                "reviewed_at": latest_kyc.reviewed_at.isoformat() if latest_kyc.reviewed_at else None,
                "rejection_reason": latest_kyc.rejection_reason,
            }

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
                'phone': getattr(user, 'phone', '') or '',
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
            },
            'kyc': kyc_info,
        }, status=status.HTTP_200_OK)

    def put(self, request):
        user = request.user
        data = request.data

        allowed_fields = [
            'first_name', 'last_name', 'phone', 'region',
            'bank', 'bank_account', 'country'
        ]

        updated_fields = []

        for field in allowed_fields:
            if field in data:
                if hasattr(user, field):
                    setattr(user, field, data[field])
                    updated_fields.append(field)

        if updated_fields:
            user.save(update_fields=updated_fields)

        return Response({
            'message': 'Profil mis à jour avec succès',
            'updated_fields': updated_fields
        }, status=status.HTTP_200_OK)


# ============================================
# ✅ NOUVEAU : CHANGEMENT MOT DE PASSE
# ============================================

class ChangePasswordView(APIView):
    """POST /api/scoring/user/change-password/ - Changer mot de passe"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')

        if not current_password or not new_password:
            return Response({'error': 'Mot de passe actuel et nouveau mot de passe requis'}, status=status.HTTP_400_BAD_REQUEST)

        if not check_password(current_password, user.password):
            return Response({'error': 'Mot de passe actuel incorrect'}, status=status.HTTP_400_BAD_REQUEST)

        if len(new_password) < 8:
            return Response({'error': 'Le nouveau mot de passe doit contenir au moins 8 caractères'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()

        return Response({'message': 'Mot de passe modifié avec succès'}, status=status.HTTP_200_OK)


# ============================================
# ✅ NOUVEAU : LISTE DES BANQUES
# ============================================

class BanquesCongoView(APIView):
    """GET /api/scoring/user/banques/ - Liste des banques du Congo"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        banques = [{'id': k, 'name': v} for k, v in BANQUES_CONGO.items()]
        return Response({'banques': banques, 'regions': REGIONS_CONGO}, status=status.HTTP_200_OK)


# ============================================
# ✅ KYC - USER
# ============================================

class UserKYCSubmitView(APIView):
    """
    POST /api/scoring/user/kyc/submit/
    multipart/form-data:
      - document_type: id_card|passport|driver_license|other
      - document_file: file
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        doc_type = request.data.get("document_type", KYCRequest.DOC_ID_CARD)
        doc_file = request.FILES.get("document_file")

        if not doc_file:
            return Response({"error": "document_file requis (upload)"}, status=status.HTTP_400_BAD_REQUEST)

        allowed = {c[0] for c in KYCRequest.DOCUMENT_CHOICES}
        if doc_type not in allowed:
            return Response({"error": f"document_type invalide. Choix: {sorted(list(allowed))}"}, status=status.HTTP_400_BAD_REQUEST)

        # Empêcher spam: si une demande pending existe déjà, refuser (tu peux changer cette règle si tu veux)
        if KYCRequest.objects.filter(user=user, status=KYCRequest.STATUS_PENDING).exists():
            return Response({"error": "Une demande KYC est déjà en attente"}, status=status.HTTP_409_CONFLICT)

        kyc = KYCRequest.objects.create(
            user=user,
            document_type=doc_type,
            document_file=doc_file,
            status=KYCRequest.STATUS_PENDING,
        )

        return Response({
            "message": "Demande KYC soumise",
            "kyc": {
                "id": kyc.id,
                "status": kyc.status,
                "document_type": kyc.document_type,
                "submitted_at": kyc.submitted_at.isoformat(),
            }
        }, status=status.HTTP_201_CREATED)


class UserKYCStatusView(APIView):
    """GET /api/scoring/user/kyc/status/ - dernière demande"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        kyc = KYCRequest.objects.filter(user=request.user).order_by("-submitted_at").first()
        if not kyc:
            return Response({"kyc": None}, status=status.HTTP_200_OK)

        return Response({
            "kyc": {
                "id": kyc.id,
                "status": kyc.status,
                "document_type": kyc.document_type,
                "submitted_at": kyc.submitted_at.isoformat(),
                "reviewed_at": kyc.reviewed_at.isoformat() if kyc.reviewed_at else None,
                "rejection_reason": kyc.rejection_reason,
            }
        }, status=status.HTTP_200_OK)


class UserKYCListView(APIView):
    """GET /api/scoring/user/kyc/requests/ - liste des demandes"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = KYCRequest.objects.filter(user=request.user).order_by("-submitted_at")[:50]
        data = [{
            "id": k.id,
            "status": k.status,
            "document_type": k.document_type,
            "submitted_at": k.submitted_at.isoformat(),
            "reviewed_at": k.reviewed_at.isoformat() if k.reviewed_at else None,
            "rejection_reason": k.rejection_reason,
        } for k in qs]
        return Response({"count": len(data), "requests": data}, status=status.HTTP_200_OK)


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
            current_score = None

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
            'score_level': current_score.level_display if current_score else 'Débutant',
            'score_value': score,
            'crm_available': int(crm),
            'crm_used': int(monthly_payment),
            'crm_used_percent': int(crm_used_percent),
            'max_loan_for_duration': int(max_loan_for_duration),
            'avg_income': int(avg_income),
            'alternative_scenarios': alternative_scenarios,
            'warnings': warnings,
        }, status=status.HTTP_200_OK)
