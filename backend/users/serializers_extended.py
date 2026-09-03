# users/serializers_extended.py
"""
Serializers étendus pour le système de validation TERAS
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import (
    Document, 
    ValidationDecision, 
    LegislationDocument,
    Profile
)

User = get_user_model()


# ============================================================
# DOCUMENT SERIALIZERS
# ============================================================

class DocumentListSerializer(serializers.ModelSerializer):
    """Serializer pour la liste des documents (validation queue)"""
    
    user_name = serializers.SerializerMethodField()
    user_email = serializers.SerializerMethodField()
    user_type = serializers.CharField(source='user.user_type', read_only=True)
    user_country = serializers.CharField(source='user.country', read_only=True)
    user_region = serializers.CharField(source='user.region', read_only=True)
    
    document_type_display = serializers.CharField(
        source='get_document_type_display', 
        read_only=True
    )
    status_display = serializers.CharField(
        source='get_status_display', 
        read_only=True
    )
    
    risk_level = serializers.SerializerMethodField()
    days_pending = serializers.SerializerMethodField()
    
    class Meta:
        model = Document
        fields = [
            'id',
            'user',
            'user_name',
            'user_email',
            'user_type',
            'user_country',
            'user_region',
            'document_type',
            'document_type_display',
            'filename',
            'file_size',
            'status',
            'status_display',
            'uploaded_at',
            'verified_at',
            'ai_analyzed',
            'ai_confidence_score',
            'ai_recommendation',
            'risk_level',
            'days_pending',
            'uploaded_by_admin',
        ]
        read_only_fields = ['id', 'uploaded_at', 'verified_at']
    
    def get_user_name(self, obj):
        return obj.user.get_full_name()
    
    def get_user_email(self, obj):
        return obj.user.email
    
    def get_risk_level(self, obj):
        """Calcule le niveau de risque basé sur l'analyse IA"""
        if not obj.ai_analyzed or not obj.ai_analysis_json:
            return 'unknown'
        
        fraud_score = obj.ai_analysis_json.get('fraud_indicators', {}).get('score', 0)
        
        if fraud_score > 70:
            return 'high'
        elif fraud_score > 30:
            return 'medium'
        return 'low'
    
    def get_days_pending(self, obj):
        """Nombre de jours en attente"""
        if obj.status != 'pending':
            return 0
        delta = timezone.now() - obj.uploaded_at
        return delta.days


class DocumentDetailSerializer(serializers.ModelSerializer):
    """Serializer détaillé pour un document (viewer)"""
    
    user_detail = serializers.SerializerMethodField()
    document_type_display = serializers.CharField(
        source='get_document_type_display', 
        read_only=True
    )
    status_display = serializers.CharField(
        source='get_status_display', 
        read_only=True
    )
    file_url = serializers.SerializerMethodField()
    validation_history = serializers.SerializerMethodField()
    
    class Meta:
        model = Document
        fields = [
            'id',
            'user',
            'user_detail',
            'document_type',
            'document_type_display',
            'file',
            'file_url',
            'filename',
            'file_size',
            'mime_type',
            'status',
            'status_display',
            'uploaded_at',
            'verified_at',
            'verified_by',
            'uploaded_by_admin',
            'admin_uploader',
            'ai_analyzed',
            'ai_analyzed_at',
            'ai_confidence_score',
            'ai_recommendation',
            'ai_analysis_json',
            'extracted_data',
            'admin_notes',
            'rejection_reason',
            'expiry_date',
            'validation_history',
        ]
        read_only_fields = [
            'id', 
            'uploaded_at', 
            'verified_at', 
            'ai_analyzed',
            'ai_analyzed_at'
        ]
    
    def get_user_detail(self, obj):
        """Informations utilisateur complètes"""
        user = obj.user
        return {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'full_name': user.get_full_name(),
            'user_type': user.user_type,
            'country': user.country,
            'region': user.region,
            'sector': user.sector,
            'kyc_status': user.kyc_status,
            'kyc_completion': user.kyc_completion_percentage,
            'date_joined': user.date_joined.isoformat(),
        }
    
    def get_file_url(self, obj):
        """URL complète du fichier"""
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None
    
    def get_validation_history(self, obj):
        """Historique des décisions"""
        decisions = obj.validation_history.all()[:5]
        return ValidationDecisionSerializer(decisions, many=True).data


class DocumentUploadSerializer(serializers.ModelSerializer):
    """Serializer pour l'upload de documents"""
    
    class Meta:
        model = Document
        fields = [
            'user',
            'document_type',
            'file',
            'admin_notes',
            'uploaded_by_admin',
        ]
    
    def create(self, validated_data):
        # Récupérer l'admin depuis le context
        request = self.context.get('request')
        
        if validated_data.get('uploaded_by_admin'):
            validated_data['admin_uploader'] = request.user
            validated_data['status'] = 'approved'
            validated_data['verified_by'] = request.user
            validated_data['verified_at'] = timezone.now()
        
        return super().create(validated_data)


# ============================================================
# VALIDATION DECISION SERIALIZERS
# ============================================================

class ValidationDecisionSerializer(serializers.ModelSerializer):
    """Serializer pour les décisions de validation"""
    
    admin_name = serializers.SerializerMethodField()
    decision_display = serializers.CharField(
        source='get_decision_display', 
        read_only=True
    )
    
    class Meta:
        model = ValidationDecision
        fields = [
            'id',
            'document',
            'admin',
            'admin_name',
            'decision',
            'decision_display',
            'reason',
            'notes',
            'ai_assisted',
            'ai_recommendation_followed',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_admin_name(self, obj):
        if obj.admin:
            return obj.admin.get_full_name()
        return None


class DocumentApproveSerializer(serializers.Serializer):
    """Serializer pour approuver un document"""
    
    notes = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text="Notes optionnelles"
    )
    mark_as_reference = serializers.BooleanField(
        default=False,
        help_text="Marquer comme document de référence"
    )


class DocumentRejectSerializer(serializers.Serializer):
    """Serializer pour rejeter un document"""
    
    reason = serializers.ChoiceField(
        choices=[
            ('expired', 'Document expiré'),
            ('illegible', 'Photo ou texte illisible'),
            ('inconsistent', 'Informations incohérentes'),
            ('fraud_suspected', 'Suspicion de fraude'),
            ('poor_quality', 'Mauvaise qualité'),
            ('incomplete', 'Document incomplet'),
            ('wrong_type', 'Mauvais type de document'),
            ('other', 'Autre'),
        ],
        help_text="Raison du rejet"
    )
    
    details = serializers.CharField(
        required=True,
        help_text="Détails du rejet"
    )
    
    request_new_document = serializers.BooleanField(
        default=True,
        help_text="Demander un nouveau document à l'utilisateur"
    )


class DocumentFlagSerializer(serializers.Serializer):
    """Serializer pour signaler un document"""
    
    reason = serializers.CharField(
        required=True,
        help_text="Raison du signalement"
    )
    
    severity = serializers.ChoiceField(
        choices=['low', 'medium', 'high', 'critical'],
        default='medium'
    )


# ============================================================
# LEGISLATION SERIALIZERS
# ============================================================

class LegislationDocumentListSerializer(serializers.ModelSerializer):
    """Serializer pour la liste des documents législatifs"""
    
    country_display = serializers.CharField(
        source='get_country_display',
        read_only=True
    )
    category_display = serializers.CharField(
        source='get_category_display',
        read_only=True
    )
    uploaded_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = LegislationDocument
        fields = [
            'id',
            'country',
            'country_display',
            'category',
            'category_display',
            'title',
            'filename',
            'file_size',
            'page_count',
            'upload_date',
            'uploaded_by',
            'uploaded_by_name',
            'effective_date',
            'language',
            'tags',
            'indexed',
            'indexed_at',
            'chunks_count',
            'referenced_count',
            'last_used',
            'is_active',
        ]
        read_only_fields = [
            'id',
            'upload_date',
            'indexed',
            'indexed_at',
            'chunks_count',
            'referenced_count',
            'last_used'
        ]
    
    def get_uploaded_by_name(self, obj):
        if obj.uploaded_by:
            return obj.uploaded_by.get_full_name()
        return None


class LegislationDocumentDetailSerializer(serializers.ModelSerializer):
    """Serializer détaillé pour un document législatif"""
    
    country_display = serializers.CharField(
        source='get_country_display',
        read_only=True
    )
    category_display = serializers.CharField(
        source='get_category_display',
        read_only=True
    )
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = LegislationDocument
        fields = '__all__'
        read_only_fields = [
            'id',
            'upload_date',
            'indexed',
            'indexed_at',
            'chunks_count',
            'vector_ids',
            'referenced_count',
            'last_used'
        ]
    
    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None


class LegislationDocumentUploadSerializer(serializers.ModelSerializer):
    """Serializer pour l'upload de documents législatifs"""
    
    class Meta:
        model = LegislationDocument
        fields = [
            'country',
            'category',
            'title',
            'description',
            'file',
            'effective_date',
            'language',
            'tags',
        ]
    
    def create(self, validated_data):
        # Récupérer l'admin depuis le context
        request = self.context.get('request')
        validated_data['uploaded_by'] = request.user
        
        return super().create(validated_data)


# ============================================================
# USER REPORT SERIALIZERS
# ============================================================

class UserReportSerializer(serializers.Serializer):
    """Serializer pour le rapport complet d'un utilisateur"""
    
    user = serializers.SerializerMethodField()
    teras_score = serializers.SerializerMethodField()
    kyc = serializers.SerializerMethodField()
    documents = serializers.SerializerMethodField()
    ai_insights = serializers.SerializerMethodField()
    activities = serializers.SerializerMethodField()
    statistics = serializers.SerializerMethodField()
    
    def get_user(self, obj):
        """Informations utilisateur"""
        return {
            'id': obj.id,
            'username': obj.username,
            'email': obj.email,
            'first_name': obj.first_name,
            'last_name': obj.last_name,
            'full_name': obj.get_full_name(),
            'user_type': obj.user_type,
            'country': obj.country,
            'region': obj.region,
            'sector': obj.sector,
            'company_name': obj.company_name,
            'is_active': obj.is_active,
            'date_joined': obj.date_joined.isoformat(),
            'last_login': obj.last_login.isoformat() if obj.last_login else None,
        }
    
    def get_teras_score(self, obj):
        """Score TERAS avec historique"""
        from scoring.models import ScoreHistory
        
        last_score = ScoreHistory.objects.filter(user=obj).first()
        history = ScoreHistory.objects.filter(user=obj).order_by('-created_at')[:10]
        
        return {
            'current_score': int(last_score.score) if last_score else None,
            'breakdown': last_score.breakdown if last_score else None,
            'history': [{
                'score': int(h.score),
                'created_at': h.created_at.isoformat(),
            } for h in history],
        }
    
    def get_kyc(self, obj):
        """Statut KYC"""
        required_docs = obj.get_required_document_types()
        uploaded_docs = Document.objects.filter(user=obj).values_list('document_type', flat=True)
        approved_docs = Document.objects.filter(
            user=obj, 
            status='approved'
        ).values_list('document_type', flat=True)
        
        return {
            'status': obj.kyc_status,
            'completion_percentage': obj.kyc_completion_percentage,
            'verified_at': obj.kyc_verified_at.isoformat() if obj.kyc_verified_at else None,
            'can_apply_for_credit': obj.can_apply_for_credit(),
            'required_documents': required_docs,
            'uploaded_documents': list(uploaded_docs),
            'approved_documents': list(approved_docs),
            'missing_documents': list(set(required_docs) - set(uploaded_docs)),
        }
    
    def get_documents(self, obj):
        """Résumé des documents"""
        docs = Document.objects.filter(user=obj)
        
        return {
            'total': docs.count(),
            'pending': docs.filter(status='pending').count(),
            'approved': docs.filter(status='approved').count(),
            'rejected': docs.filter(status='rejected').count(),
            'flagged': docs.filter(status='flagged').count(),
            'recent': DocumentListSerializer(
                docs.order_by('-uploaded_at')[:5], 
                many=True
            ).data,
        }
    
    def get_ai_insights(self, obj):
        """Insights générés par l'IA"""
        # TODO: Implémenter génération insights IA
        # Pour l'instant, retourne des données de base
        
        from scoring.models import ScoreHistory
        last_score = ScoreHistory.objects.filter(user=obj).first()
        
        if not last_score:
            return None
        
        score = int(last_score.score)
        
        # Calcul niveau de risque
        if score < 450:
            risk_level = 'high'
            risk_score = 75
        elif score < 650:
            risk_level = 'medium'
            risk_score = 45
        else:
            risk_level = 'low'
            risk_score = 15
        
        return {
            'risk_assessment': {
                'level': risk_level,
                'score': risk_score,
                'factors': self._get_risk_factors(obj, score),
            },
            'creditworthiness': {
                'score': score,
                'max_loan_amount': self._calculate_max_loan(score),
                'recommended_rate': self._calculate_rate(score),
                'reasoning': self._get_credit_reasoning(score),
            },
            'recommendations': self._get_recommendations(obj, score),
        }
    
    def _get_risk_factors(self, user, score):
        """Facteurs de risque"""
        factors = []
        
        if score < 450:
            factors.append("Score TERAS faible")
        if user.kyc_status != 'approved':
            factors.append("KYC non approuvé")
        if Document.objects.filter(user=user, status='rejected').exists():
            factors.append("Documents rejetés")
        
        if not factors:
            factors.append("Aucun facteur de risque majeur")
        
        return factors
    
    def _calculate_max_loan(self, score):
        """Calcul montant max crédit"""
        if score < 450:
            return 50000
        elif score < 650:
            return 500000
        elif score < 800:
            return 2000000
        return 5000000
    
    def _calculate_rate(self, score):
        """Calcul taux recommandé"""
        if score < 450:
            return 15.0
        elif score < 650:
            return 10.0
        elif score < 800:
            return 7.0
        return 5.0
    
    def _get_credit_reasoning(self, score):
        """Raisonnement crédit"""
        if score >= 800:
            return "Excellent profil, très faible risque"
        elif score >= 650:
            return "Bon profil, risque modéré"
        elif score >= 450:
            return "Profil acceptable, nécessite surveillance"
        return "Profil à risque, crédit limité recommandé"
    
    def _get_recommendations(self, user, score):
        """Recommandations"""
        recs = []
        
        if user.kyc_status != 'approved':
            recs.append({
                'type': 'kyc',
                'priority': 'high',
                'message': 'Compléter la vérification KYC',
                'action': 'Demander documents manquants'
            })
        
        if score < 650:
            recs.append({
                'type': 'score',
                'priority': 'medium',
                'message': 'Améliorer le score TERAS',
                'action': 'Augmenter épargne et régularité transactions'
            })
        
        if Document.objects.filter(user=user, status='rejected').exists():
            recs.append({
                'type': 'documents',
                'priority': 'high',
                'message': 'Résoudre problèmes documents',
                'action': 'Contacter utilisateur pour nouveaux documents'
            })
        
        return recs
    
    def get_activities(self, obj):
        """Activités récentes"""
        # TODO: Implémenter système d'activités
        return []
    
    def get_statistics(self, obj):
        """Statistiques"""
        from scoring.models import ScoreHistory
        
        scores = ScoreHistory.objects.filter(user=obj)
        docs = Document.objects.filter(user=obj)
        
        if scores.exists():
            score_values = [s.score for s in scores]
            return {
                'total_score_calculations': scores.count(),
                'average_score': round(sum(score_values) / len(score_values), 2),
                'min_score': int(min(score_values)),
                'max_score': int(max(score_values)),
                'total_documents': docs.count(),
                'account_age_days': (timezone.now() - obj.date_joined).days,
            }
        
        return {
            'total_score_calculations': 0,
            'average_score': 0,
            'min_score': 0,
            'max_score': 0,
            'total_documents': docs.count(),
            'account_age_days': (timezone.now() - obj.date_joined).days,
        }
