# backend/scoring/serializers_government.py
"""
Serializers pour l'interface Government TERAS
Transformation des données entre Django et JSON
"""

from rest_framework import serializers
from .models_government import (
    Region, Sector, Alert, GovernmentReport, 
    GovernmentSettings, ActivityLog
)
from django.contrib.auth import get_user_model

User = get_user_model()


class RegionSerializer(serializers.ModelSerializer):
    """Serializer pour les régions"""
    active_rate = serializers.SerializerMethodField()
    name_display = serializers.CharField(source='get_name_display', read_only=True)
    
    class Meta:
        model = Region
        fields = [
            'id', 'name', 'name_display', 'code', 'population',
            'total_users', 'active_users', 'active_rate', 'avg_score',
            'gdp', 'unemployment_rate', 'latitude', 'longitude',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_active_rate(self, obj):
        return obj.calculate_active_rate()


class SectorSerializer(serializers.ModelSerializer):
    """Serializer pour les secteurs"""
    name_display = serializers.CharField(source='get_name_display', read_only=True)
    
    class Meta:
        model = Sector
        fields = [
            'id', 'name', 'name_display', 'code', 'total_enterprises',
            'avg_score', 'growth_rate', 'gdp_contribution', 'employment',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class AlertSerializer(serializers.ModelSerializer):
    """Serializer pour les alertes"""
    severity_display = serializers.CharField(source='get_severity_display', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    region_name = serializers.CharField(source='region.get_name_display', read_only=True)
    sector_name = serializers.CharField(source='sector.get_name_display', read_only=True)
    
    class Meta:
        model = Alert
        fields = [
            'id', 'title', 'description', 
            'severity', 'severity_display',
            'category', 'category_display',
            'status', 'status_display',
            'region', 'region_name',
            'sector', 'sector_name',
            'impact_score', 'affected_users', 'recommendations',
            'created_at', 'updated_at', 'resolved_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class AlertCreateSerializer(serializers.ModelSerializer):
    """Serializer pour créer une alerte"""
    class Meta:
        model = Alert
        fields = [
            'title', 'description', 'severity', 'category',
            'region', 'sector', 'impact_score', 'affected_users',
            'recommendations'
        ]


class GovernmentReportSerializer(serializers.ModelSerializer):
    """Serializer pour les rapports"""
    report_type_display = serializers.CharField(source='get_report_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    generated_by_email = serializers.EmailField(source='generated_by.email', read_only=True)
    download_url = serializers.SerializerMethodField()
    
    class Meta:
        model = GovernmentReport
        fields = [
            'id', 'title', 'report_type', 'report_type_display',
            'status', 'status_display', 'period_start', 'period_end',
            'summary', 'data', 'file', 'download_url',
            'generated_by', 'generated_by_email', 'generated_at',
            'downloaded_count'
        ]
        read_only_fields = ['generated_at', 'downloaded_count']
    
    def get_download_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
        return None


class GovernmentReportGenerateSerializer(serializers.Serializer):
    """Serializer pour générer un rapport"""
    report_type = serializers.ChoiceField(choices=GovernmentReport.REPORT_TYPE_CHOICES)
    period_start = serializers.DateField()
    period_end = serializers.DateField()
    title = serializers.CharField(max_length=200, required=False)
    
    def validate(self, data):
        if data['period_start'] > data['period_end']:
            raise serializers.ValidationError({
                'period_end': 'La date de fin doit être après la date de début'
            })
        return data


class GovernmentSettingsSerializer(serializers.ModelSerializer):
    """Serializer pour les paramètres"""
    class Meta:
        model = GovernmentSettings
        fields = [
            'id', 'system_version', 'environment', 'maintenance_mode',
            'scoring_profile', 'scoring_region', 'scoring_country',
            'alerts_enabled', 'email_notifications',
            'threshold_low_score', 'threshold_high_risk',
            'api_rate_limit', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class ActivityLogSerializer(serializers.ModelSerializer):
    """Serializer pour les logs d'activité"""
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    region_name = serializers.CharField(source='region.get_name_display', read_only=True)
    
    class Meta:
        model = ActivityLog
        fields = [
            'id', 'action', 'action_display',
            'user', 'user_email', 'user_type', 'score',
            'region', 'region_name', 'details', 'timestamp'
        ]
        read_only_fields = ['timestamp']


class DashboardSerializer(serializers.Serializer):
    """Serializer pour le dashboard gouvernemental"""
    metrics = serializers.DictField()
    users_by_type = serializers.ListField()
    recent_activity = ActivityLogSerializer(many=True)
    regions_summary = RegionSerializer(many=True)
    sectors_summary = SectorSerializer(many=True)


class RegionDetailSerializer(RegionSerializer):
    """Serializer détaillé pour une région"""
    alerts = AlertSerializer(many=True, read_only=True)
    alert_count = serializers.SerializerMethodField()
    
    def get_alert_count(self, obj):
        return obj.alerts.filter(status='active').count()


class SectorDetailSerializer(SectorSerializer):
    """Serializer détaillé pour un secteur"""
    alerts = AlertSerializer(many=True, read_only=True)
    alert_count = serializers.SerializerMethodField()
    
    def get_alert_count(self, obj):
        return obj.alerts.filter(status='active').count()
