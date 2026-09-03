# backend/scoring/serializers.py
"""
Serializers centralisés pour l'app scoring
✅ ABSOLUMENT TOUS LES SERIALIZERS - VERSION FINALE
"""
from rest_framework import serializers
from scoring.models import CreditScore, ScoreHistory
from users.models import CustomUser


# ==========================================
# SERIALIZERS DE BASE (CORE)
# ==========================================

class ScoreHistorySerializer(serializers.ModelSerializer):
    """Serializer pour l'historique des scores TERAS"""

    class Meta:
        model = ScoreHistory
        fields = '__all__'


class ScoreInputSerializer(serializers.Serializer):
    """Serializer pour les données d'entrée du calcul de score"""
    txn_count_90d = serializers.IntegerField(required=False, default=0)
    txn_amount_90d = serializers.FloatField(required=False, default=0.0)
    monthly_deposit_avg = serializers.FloatField(required=False, default=0.0)
    streak_months = serializers.IntegerField(required=False, default=0)
    income_avg = serializers.FloatField(required=False, default=0.0)
    income_verified = serializers.BooleanField(required=False, default=False)
    assets_value = serializers.FloatField(required=False, default=0.0)
    rating_avg = serializers.FloatField(required=False, default=0.0)
    reviews_count = serializers.IntegerField(required=False, default=0)
    profile_type = serializers.ChoiceField(
        choices=['basic', 'enterprise'],
        default='basic',
        required=False
    )


class ScoreOutputSerializer(serializers.Serializer):
    """Serializer pour la sortie du calcul de score"""
    score = serializers.FloatField()
    score_total = serializers.FloatField()
    band = serializers.CharField(max_length=1)
    transactions = serializers.FloatField()
    epargne = serializers.FloatField()
    revenus = serializers.FloatField()
    actifs = serializers.FloatField()
    social = serializers.FloatField()
    profile_type = serializers.CharField(max_length=50)
    created_at = serializers.DateTimeField(required=False)
    breakdown = serializers.JSONField(required=False)
    recommendations = serializers.ListField(required=False)


# ==========================================
# SERIALIZERS ADMIN
# ==========================================

class UserListSerializer(serializers.ModelSerializer):
    """Liste des utilisateurs pour l'admin"""
    score = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'first_name', 'last_name', 'user_type', 'is_active', 'date_joined', 'score']

    def get_score(self, obj):
        latest_score = CreditScore.objects.filter(user=obj).order_by('-id').first()
        return latest_score.score if latest_score else None


class UserDetailSerializer(serializers.ModelSerializer):
    """Détails d'un utilisateur"""

    class Meta:
        model = CustomUser
        fields = '__all__'


class BulkScoreSerializer(serializers.Serializer):
    """Recalcul en masse des scores"""
    user_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False
    )
    recalculate_all = serializers.BooleanField(default=False, required=False)


class ScoreUpdateSerializer(serializers.Serializer):
    """Mise à jour manuelle d'un score"""
    score = serializers.FloatField(min_value=0, max_value=1000)
    reason = serializers.CharField(max_length=500, required=False, allow_blank=True)
    manual_override = serializers.BooleanField(default=True)


class ValidationRequestSerializer(serializers.Serializer):
    """Demande de validation d'un utilisateur ou document"""
    user_id = serializers.IntegerField(required=False)
    document_id = serializers.IntegerField(required=False)
    action = serializers.ChoiceField(
        choices=['approve', 'reject', 'pending'],
        default='pending'
    )
    notes = serializers.CharField(max_length=1000, required=False, allow_blank=True)
    validated_by = serializers.IntegerField(required=False)


class AnalyticsSerializer(serializers.Serializer):
    """Statistiques et analytics pour l'admin"""
    # Statistiques générales
    total_users = serializers.IntegerField(required=False)
    active_users = serializers.IntegerField(required=False)
    pending_validations = serializers.IntegerField(required=False)

    # Statistiques de scores
    avg_score = serializers.FloatField(required=False)
    min_score = serializers.FloatField(required=False)
    max_score = serializers.FloatField(required=False)

    # Distribution par bande
    band_distribution = serializers.DictField(required=False)

    # Tendances temporelles
    score_trend = serializers.ListField(required=False)
    user_growth = serializers.ListField(required=False)

    # Métriques métier
    total_credit_volume = serializers.FloatField(required=False)
    default_rate = serializers.FloatField(required=False)

    # Données complémentaires
    period = serializers.CharField(max_length=50, required=False)
    last_updated = serializers.DateTimeField(required=False)


# ==========================================
# SERIALIZERS USER (INDIVIDUAL)
# ==========================================

class UserScoreSerializer(serializers.ModelSerializer):
    """Score d'un utilisateur individuel"""

    class Meta:
        model = CreditScore
        fields = '__all__'
        read_only_fields = ['user', 'created_at', 'updated_at']


class UserProfileSerializer(serializers.ModelSerializer):
    """Profil utilisateur"""
    latest_score = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'first_name', 'last_name', 'user_type', 'latest_score']
        read_only_fields = ['user_type']

    def get_latest_score(self, obj):
        latest = CreditScore.objects.filter(user=obj).order_by('-id').first()
        return latest.score if latest else None


# ==========================================
# SERIALIZERS ENTERPRISE
# ==========================================

class EnterpriseScoreSerializer(serializers.Serializer):
    """Score entreprise (5 piliers TERAS Entreprise)"""
    company_name = serializers.CharField(max_length=255)
    tax_id = serializers.CharField(max_length=100)
    transparency_fiscal = serializers.FloatField(min_value=0, max_value=100)
    emploi_local = serializers.FloatField(min_value=0, max_value=100)
    retention = serializers.FloatField(min_value=0, max_value=100)
    activite = serializers.FloatField(min_value=0, max_value=100)
    stabilite_sociale = serializers.FloatField(min_value=0, max_value=100)


# ==========================================
# SERIALIZERS GOVERNMENT
# ==========================================

class RegionStatsSerializer(serializers.Serializer):
    """Statistiques régionales"""
    region_name = serializers.CharField(max_length=100)
    total_users = serializers.IntegerField()
    avg_score = serializers.FloatField()
    total_credit_volume = serializers.FloatField()


class SectorStatsSerializer(serializers.Serializer):
    """Statistiques sectorielles"""
    sector_name = serializers.CharField(max_length=100)
    total_enterprises = serializers.IntegerField()
    avg_score = serializers.FloatField()
    employment_rate = serializers.FloatField()


# ==========================================
# SERIALIZERS BANK
# ==========================================

class LoanApplicationSerializer(serializers.Serializer):
    """Demande de prêt"""
    user_id = serializers.IntegerField()
    amount = serializers.FloatField(min_value=0)
    duration_months = serializers.IntegerField(min_value=1, max_value=360)
    purpose = serializers.CharField(max_length=500)


class CreditDecisionSerializer(serializers.Serializer):
    """Décision de crédit"""
    approved = serializers.BooleanField()
    score = serializers.FloatField()
    max_amount = serializers.FloatField()
    suggested_rate = serializers.FloatField()
    conditions = serializers.ListField(child=serializers.CharField(), required=False)