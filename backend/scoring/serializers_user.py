# backend/scoring/serializers_user.py
"""
TERAS IA APP - Serializers pour l'interface User
"""

from rest_framework import serializers
from .models import (
    User, TerasScore, Recommendation, Document,
    Transaction, Asset, Income
)


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer pour le profil utilisateur"""
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name',
            'phone_number', 'address', 'city', 'country',
            'date_joined', 'kyc_status', 'user_type'
        ]
        read_only_fields = ['id', 'email', 'date_joined', 'user_type']


class TerasScoreSerializer(serializers.ModelSerializer):
    """Serializer pour les scores TERAS"""
    
    breakdown = serializers.SerializerMethodField()
    level = serializers.SerializerMethodField()
    
    class Meta:
        model = TerasScore
        fields = [
            'score_id', 'score', 'band', 'model_version',
            'computed_at', 'breakdown', 'level', 'reason_codes'
        ]
    
    def get_breakdown(self, obj):
        return {
            'T': round(obj.T * 100, 1),
            'E': round(obj.E * 100, 1),
            'R': round(obj.R * 100, 1),
            'A': round(obj.A * 100, 1),
            'S': round(obj.S * 100, 1),
        }
    
    def get_level(self, obj):
        if obj.score >= 900:
            return {'name': 'Platine', 'color': '#E5E4E2'}
        elif obj.score >= 750:
            return {'name': 'Or', 'color': '#FFD700'}
        elif obj.score >= 600:
            return {'name': 'Argent', 'color': '#C0C0C0'}
        elif obj.score >= 500:
            return {'name': 'Bronze', 'color': '#CD7F32'}
        else:
            return {'name': 'Débutant', 'color': '#808080'}


class RecommendationSerializer(serializers.ModelSerializer):
    """Serializer pour les recommandations"""
    
    class Meta:
        model = Recommendation
        fields = [
            'id', 'title', 'description', 'category',
            'priority', 'impact', 'is_completed',
            'created_at', 'completed_at'
        ]


class DocumentSerializer(serializers.ModelSerializer):
    """Serializer pour les documents"""
    
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Document
        fields = [
            'id', 'doc_type', 'file_path', 'file_url',
            'status', 'uploaded_at', 'verified_at',
            'verification_notes'
        ]
        read_only_fields = ['id', 'uploaded_at', 'verified_at']
    
    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file_path and request:
            return request.build_absolute_uri(obj.file_path.url)
        return None


class TransactionSerializer(serializers.ModelSerializer):
    """Serializer pour les transactions"""
    
    class Meta:
        model = Transaction
        fields = [
            'id', 'tx_type', 'amount', 'currency',
            'description', 'status', 'created_at'
        ]


class AssetSerializer(serializers.ModelSerializer):
    """Serializer pour les actifs"""
    
    class Meta:
        model = Asset
        fields = [
            'id', 'asset_type', 'declared_value',
            'verified_value', 'description',
            'created_at', 'verified'
        ]


class IncomeSerializer(serializers.ModelSerializer):
    """Serializer pour les revenus"""
    
    class Meta:
        model = Income
        fields = [
            'id', 'source', 'monthly_amount',
            'verified', 'created_at'
        ]


class UserDashboardSerializer(serializers.Serializer):
    """Serializer complexe pour le dashboard"""
    
    user = UserProfileSerializer()
    score = TerasScoreSerializer()
    stats = serializers.DictField()
    score_evolution = serializers.ListField()
    recommendations = RecommendationSerializer(many=True)
    recent_documents = DocumentSerializer(many=True)
    credit_capacity = serializers.DictField()
    next_actions = serializers.ListField()


class ScoreHistorySerializer(serializers.Serializer):
    """Serializer pour l'historique des scores"""
    
    period_days = serializers.IntegerField()
    chart_data = serializers.ListField()
    trend = serializers.DictField()
    events = serializers.ListField()
    stats = serializers.DictField()
