"""
Sérialiseurs Django REST Framework pour TERAS Entreprise
Gestion de la sérialisation/désérialisation des modèles Enterprise
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models_enterprise import (
    EnterpriseClient,
    Employee,
    EnterpriseDocument,
    ComplianceStatus,
    EnterpriseReport,
    EnterpriseScore
)

User = get_user_model()


class EnterpriseClientSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour la liste des clients (vue simplifiée)
    """
    client_type_display = serializers.CharField(source='get_client_type_display', read_only=True)
    risk_level_display = serializers.CharField(source='get_risk_level_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = EnterpriseClient
        fields = [
            'id',
            'name',
            'client_type',
            'client_type_display',
            'kyc_id',
            'internal_ref',
            'teras_score',
            'risk_level',
            'risk_level_display',
            'status',
            'status_display',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'risk_level']


class EnterpriseClientDetailSerializer(serializers.ModelSerializer):
    """
    Sérialiseur détaillé pour un client (vue complète avec documents et historique)
    """
    client_type_display = serializers.CharField(source='get_client_type_display', read_only=True)
    risk_level_display = serializers.CharField(source='get_risk_level_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    # Documents associés (récupérés via related_name si besoin)
    # documents = EnterpriseDocumentSerializer(many=True, read_only=True, source='client_documents')
    
    class Meta:
        model = EnterpriseClient
        fields = [
            'id',
            'name',
            'client_type',
            'client_type_display',
            'kyc_id',
            'internal_ref',
            'teras_score',
            'risk_level',
            'risk_level_display',
            'status',
            'status_display',
            'notes',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'risk_level']


class EnterpriseClientCreateSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour la création d'un nouveau client
    """
    class Meta:
        model = EnterpriseClient
        fields = [
            'name',
            'client_type',
            'kyc_id',
            'internal_ref',
            'notes',
        ]
    
    def create(self, validated_data):
        # Ajouter l'entreprise depuis le contexte (request.user)
        validated_data['enterprise'] = self.context['request'].user
        return super().create(validated_data)


class EmployeeSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour les employés
    """
    employment_type_display = serializers.CharField(source='get_employment_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    full_name = serializers.CharField(read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Employee
        fields = [
            'id',
            'first_name',
            'last_name',
            'full_name',
            'employee_id',
            'position',
            'department',
            'hire_date',
            'employment_type',
            'employment_type_display',
            'salary',
            'is_local',
            'status',
            'status_display',
            'termination_date',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class EmployeeCreateSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour la création d'un employé
    """
    class Meta:
        model = Employee
        fields = [
            'first_name',
            'last_name',
            'employee_id',
            'position',
            'department',
            'hire_date',
            'employment_type',
            'salary',
            'is_local',
        ]
    
    def create(self, validated_data):
        # Ajouter l'entreprise depuis le contexte
        validated_data['enterprise'] = self.context['request'].user
        return super().create(validated_data)


class EnterpriseDocumentSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour les documents entreprise
    """
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    file_url = serializers.SerializerMethodField()
    file_size = serializers.SerializerMethodField()
    
    class Meta:
        model = EnterpriseDocument
        fields = [
            'id',
            'category',
            'category_display',
            'title',
            'file',
            'file_url',
            'file_size',
            'period',
            'period_start',
            'period_end',
            'status',
            'status_display',
            'analysis_summary',
            'validation_notes',
            'uploaded_at',
            'processed_at',
        ]
        read_only_fields = ['id', 'uploaded_at', 'processed_at', 'analysis_summary']
    
    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
        return None
    
    def get_file_size(self, obj):
        if obj.file:
            return obj.file.size
        return None


class EnterpriseDocumentUploadSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour l'upload de documents
    """
    class Meta:
        model = EnterpriseDocument
        fields = [
            'category',
            'title',
            'file',
            'period',
            'period_start',
            'period_end',
        ]
    
    def create(self, validated_data):
        # Ajouter l'entreprise depuis le contexte
        validated_data['enterprise'] = self.context['request'].user
        return super().create(validated_data)


class ComplianceStatusSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour le statut de conformité
    """
    compliance_grade = serializers.SerializerMethodField()
    alerts_count = serializers.SerializerMethodField()
    recommendations_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ComplianceStatus
        fields = [
            'id',
            'compliance_rate',
            'compliance_grade',
            'last_tax_filing',
            'missing_declarations',
            'late_payments',
            'penalties',
            'active_alerts',
            'alerts_count',
            'recommendations',
            'recommendations_count',
            'last_audit_date',
            'next_audit_date',
            'updated_at',
        ]
        read_only_fields = ['id', 'updated_at']
    
    def get_compliance_grade(self, obj):
        """Retourne une note A/B/C/D/E basée sur le taux"""
        rate = float(obj.compliance_rate)
        if rate >= 90:
            return 'A'
        elif rate >= 80:
            return 'B'
        elif rate >= 70:
            return 'C'
        elif rate >= 60:
            return 'D'
        else:
            return 'E'
    
    def get_alerts_count(self, obj):
        return len(obj.active_alerts) if obj.active_alerts else 0
    
    def get_recommendations_count(self, obj):
        return len(obj.recommendations) if obj.recommendations else 0


class EnterpriseReportSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour les rapports
    """
    report_type_display = serializers.CharField(source='get_report_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    file_url = serializers.SerializerMethodField()
    period_label = serializers.SerializerMethodField()
    
    class Meta:
        model = EnterpriseReport
        fields = [
            'id',
            'report_type',
            'report_type_display',
            'title',
            'period_start',
            'period_end',
            'period_label',
            'file',
            'file_url',
            'status',
            'status_display',
            'generated_at',
            'downloaded_count',
        ]
        read_only_fields = ['id', 'generated_at', 'downloaded_count']
    
    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
        return None
    
    def get_period_label(self, obj):
        """Génère un label lisible pour la période"""
        start = obj.period_start.strftime('%d/%m/%Y')
        end = obj.period_end.strftime('%d/%m/%Y')
        return f"{start} - {end}"


class EnterpriseReportGenerateSerializer(serializers.Serializer):
    """
    Sérialiseur pour la génération de rapports
    """
    report_type = serializers.ChoiceField(
        choices=['quarterly', 'annual', 'sector_comparison', 'custom']
    )
    period_start = serializers.DateField()
    period_end = serializers.DateField()
    format = serializers.ChoiceField(
        choices=['pdf', 'excel'],
        default='pdf'
    )
    
    def validate(self, data):
        """Valide que period_end > period_start"""
        if data['period_end'] <= data['period_start']:
            raise serializers.ValidationError(
                "La date de fin doit être postérieure à la date de début"
            )
        return data


class EnterpriseScoreSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour l'historique des scores
    """
    score_label = serializers.SerializerMethodField()
    
    class Meta:
        model = EnterpriseScore
        fields = [
            'id',
            'score',
            'score_label',
            'breakdown',
            'sector',
            'sector_average',
            'percentile',
            'computed_at',
        ]
        read_only_fields = ['id', 'computed_at']
    
    def get_score_label(self, obj):
        """Retourne un label pour le graphique"""
        return obj.computed_at.strftime('%b %Y')


class EnterpriseDashboardSerializer(serializers.Serializer):
    """
    Sérialiseur pour le dashboard Enterprise (données agrégées)
    """
    # Score actuel
    current_score = serializers.IntegerField()
    score_trend = serializers.CharField()
    score_change = serializers.IntegerField()
    
    # Breakdown des piliers
    breakdown = serializers.DictField()
    
    # KPIs
    total_clients = serializers.IntegerField()
    active_clients = serializers.IntegerField()
    total_employees = serializers.IntegerField()
    local_employees = serializers.IntegerField()
    compliance_rate = serializers.DecimalField(max_digits=5, decimal_places=2)
    
    # Historique scores (12 derniers mois)
    score_history = EnterpriseScoreSerializer(many=True)
    
    # Comparaison sectorielle
    sector_comparison = serializers.DictField()
    
    # Alertes
    active_alerts = serializers.ListField()
    
    # Recommandations
    recommendations = serializers.ListField()


class SectorAnalyticsSerializer(serializers.Serializer):
    """
    Sérialiseur pour les analytics sectorielles
    """
    sector = serializers.CharField()
    your_score = serializers.IntegerField()
    sector_average = serializers.IntegerField()
    percentile = serializers.IntegerField()
    ranking = serializers.IntegerField()
    total_companies = serializers.IntegerField()
    
    # Distribution des scores dans le secteur
    distribution = serializers.DictField()
    
    # Top performers
    top_performers = serializers.ListField()
    
    # Recommandations basées sur le secteur
    sector_recommendations = serializers.ListField()
