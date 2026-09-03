# scoring/serializers_admin.py
"""
Sérialiseurs Admin pour TERAS
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import ScoreHistory
from users.models import Profile

User = get_user_model()


class UserListSerializer(serializers.ModelSerializer):
    """Sérialiseur pour la liste des utilisateurs (vue d'ensemble)"""
    
    role = serializers.SerializerMethodField()
    last_score = serializers.SerializerMethodField()
    score_change = serializers.SerializerMethodField()
    risk_level = serializers.SerializerMethodField()
    transaction_count = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'user_type',
            'role',
            'is_active',
            'date_joined',
            'last_login',
            'last_score',
            'score_change',
            'risk_level',
            'transaction_count',
        ]
    
    def get_role(self, obj):
        return getattr(obj, 'role', 'USER_BASIC')
    
    def get_last_score(self, obj):
        last = ScoreHistory.objects.filter(user=obj).first()
        return int(last.score) if last else None
    
    def get_score_change(self, obj):
        scores = ScoreHistory.objects.filter(user=obj).order_by('-created_at')[:2]
        if len(scores) >= 2:
            diff = scores[0].score - scores[1].score
            return round((diff / scores[1].score) * 100, 2) if scores[1].score > 0 else 0
        return 0
    
    def get_risk_level(self, obj):
        last_score = self.get_last_score(obj)
        if not last_score:
            return 'unknown'
        if last_score < 450:
            return 'high'
        elif last_score < 650:
            return 'medium'
        return 'low'
    
    def get_transaction_count(self, obj):
        return ScoreHistory.objects.filter(user=obj).count()


class ScoreHistoryDetailSerializer(serializers.ModelSerializer):
    """Sérialiseur détaillé pour l'historique des scores"""
    
    class Meta:
        model = ScoreHistory
        fields = [
            'id',
            'score',
            'score_total',
            'profile_type',
            'breakdown',
            'transactions',
            'epargne',
            'revenus',
            'actifs',
            'social',
            'created_at',
        ]


class UserDetailSerializer(serializers.ModelSerializer):
    """Sérialiseur détaillé pour un utilisateur"""
    
    role = serializers.SerializerMethodField()
    profile = serializers.SerializerMethodField()
    last_score = serializers.SerializerMethodField()
    score_history = serializers.SerializerMethodField()
    statistics = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'user_type',
            'role',
            'is_active',
            'is_staff',
            'date_joined',
            'last_login',
            'profile',
            'last_score',
            'score_history',
            'statistics',
        ]
        read_only_fields = ['id', 'date_joined', 'last_login']
    
    def get_role(self, obj):
        return getattr(obj, 'role', 'USER_BASIC')
    
    def get_profile(self, obj):
        try:
            profile = obj.profile
            return {
                'id': profile.id,
                'bio': profile.bio,
                'created_at': profile.created_at.isoformat(),
            }
        except Profile.DoesNotExist:
            return None
    
    def get_last_score(self, obj):
        last = self.context.get('last_score')
        if last:
            return {
                'score': int(last.score),
                'breakdown': last.breakdown,
                'created_at': last.created_at.isoformat(),
            }
        return None
    
    def get_score_history(self, obj):
        history = self.context.get('score_history', [])
        return [{
            'score': int(h.score),
            'created_at': h.created_at.isoformat(),
        } for h in history]
    
    def get_statistics(self, obj):
        scores = ScoreHistory.objects.filter(user=obj)
        
        if not scores.exists():
            return {
                'total_calculations': 0,
                'average_score': 0,
                'min_score': 0,
                'max_score': 0,
            }
        
        score_values = [s.score for s in scores]
        
        return {
            'total_calculations': scores.count(),
            'average_score': round(sum(score_values) / len(score_values), 2),
            'min_score': int(min(score_values)),
            'max_score': int(max(score_values)),
        }


class ValidationRequestSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les demandes de validation"""
    
    request_type = serializers.SerializerMethodField()
    priority = serializers.SerializerMethodField()
    documents = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'user_type',
            'date_joined',
            'request_type',
            'priority',
            'documents',
        ]
    
    def get_request_type(self, obj):
        if obj.user_type == 'entreprise':
            return 'enterprise_verification'
        elif obj.user_type == 'regional':
            return 'regional_access'
        return 'account_creation'
    
    def get_priority(self, obj):
        # Priorité basée sur le type et la date
        if obj.user_type in ['entreprise', 'regional']:
            return 'high'
        return 'medium'
    
    def get_documents(self, obj):
        # Retourne les documents uploadés par l'utilisateur
        try:
            from users.models import UploadedDocument
            docs = UploadedDocument.objects.filter(user=obj)
            return [{
                'id': doc.id,
                'name': doc.file.name.split('/')[-1],
                'category': doc.category,
                'uploaded_at': doc.uploaded_at.isoformat(),
            } for doc in docs]
        except:
            return []


class AnalyticsSerializer(serializers.Serializer):
    """Sérialiseur pour les analytics"""
    
    kpis = serializers.DictField()
    users_by_type = serializers.ListField()
    score_distribution = serializers.DictField()
    recent_registrations = serializers.ListField()
