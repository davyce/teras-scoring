# backend/scoring/serializers_bank.py
"""
Serializers pour l'interface Bank TERAS — Congo Brazzaville
NIU remplace national_id, features/requirements ajoutés aux produits
"""

from rest_framework import serializers
from .models_bank import BankClient, BankEnterprise, FinancialProduct, LoanApplication
from django.contrib.auth import get_user_model

User = get_user_model()


class BankClientSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    age       = serializers.SerializerMethodField()
    crm_limit = serializers.SerializerMethodField()
    bank_owner_id = serializers.IntegerField(read_only=True)
    # Alias national_id → niu pour compatibilité frontend existant
    national_id = serializers.CharField(source='niu', read_only=True)

    class Meta:
        model  = BankClient
        fields = [
            'id', 'first_name', 'last_name', 'full_name', 'email', 'phone',
            'date_of_birth', 'age', 'niu', 'national_id',
            'address', 'city', 'country',
            'occupation', 'monthly_income',
            'teras_score', 'teras_band',
            'active_loans_count', 'total_borrowed',
            'bank_owner_id',
            'status', 'join_date',
            'teras_account_email',
            'teras_account_password',
            'crm_limit',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'join_date', 'teras_account_email', 'teras_account_password', 'crm_limit', 'created_at', 'updated_at']

    def get_full_name(self, obj):
        return obj.get_full_name()

    def get_age(self, obj):
        from datetime import date
        today = date.today()
        dob   = obj.date_of_birth
        return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

    def get_crm_limit(self, obj):
        return obj.crm_limit


class BankClientCreateSerializer(serializers.ModelSerializer):
    # Accepter 'national_id' comme alias de 'niu'
    national_id = serializers.CharField(write_only=True, required=False)

    class Meta:
        model  = BankClient
        fields = [
            'first_name', 'last_name', 'email', 'phone', 'date_of_birth',
            'niu', 'national_id',
            'address', 'city', 'country',
            'occupation', 'monthly_income',
        ]

    def validate(self, data):
        # Fusionner national_id → niu
        if 'national_id' in data and 'niu' not in data:
            data['niu'] = data.pop('national_id')
        elif 'national_id' in data:
            data.pop('national_id')
        if not data.get('niu'):
            raise serializers.ValidationError({'niu': 'Le NIU est obligatoire.'})
        return data


class BankClientDetailSerializer(BankClientSerializer):
    applications = serializers.SerializerMethodField()

    class Meta(BankClientSerializer.Meta):
        fields = BankClientSerializer.Meta.fields + ['applications']

    def get_applications(self, obj):
        return LoanApplicationListSerializer(obj.applications.all()[:5], many=True).data


class BankEnterpriseSerializer(serializers.ModelSerializer):
    crm_limit = serializers.SerializerMethodField()
    bank_owner_id = serializers.IntegerField(read_only=True)

    class Meta:
        model  = BankEnterprise
        fields = [
            'id', 'name', 'legal_name', 'registration_number', 'tax_id',
            'enterprise_type', 'sector', 'email', 'phone',
            'address', 'city', 'country',
            'annual_revenue', 'employees_count',
            'teras_score', 'teras_band',
            'active_loans_count', 'total_borrowed',
            'bank_owner_id',
            'status', 'join_date',
            'teras_account_email',
            'teras_account_password',
            'crm_limit',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'join_date', 'teras_account_email', 'teras_account_password', 'crm_limit', 'created_at', 'updated_at']

    def get_crm_limit(self, obj):
        return obj.crm_limit


class BankEnterpriseCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = BankEnterprise
        fields = [
            'name', 'legal_name', 'registration_number', 'tax_id',
            'enterprise_type', 'sector', 'email', 'phone',
            'address', 'city', 'country',
            'annual_revenue', 'employees_count',
        ]


class BankEnterpriseDetailSerializer(BankEnterpriseSerializer):
    applications = serializers.SerializerMethodField()

    class Meta(BankEnterpriseSerializer.Meta):
        fields = BankEnterpriseSerializer.Meta.fields + ['applications']

    def get_applications(self, obj):
        return LoanApplicationListSerializer(obj.applications.all()[:5], many=True).data


class FinancialProductSerializer(serializers.ModelSerializer):
    product_type_display = serializers.CharField(source='get_product_type_display', read_only=True)
    risk_level_display   = serializers.CharField(source='get_risk_level_display',   read_only=True)
    band_required        = serializers.SerializerMethodField()
    bank_owner_id        = serializers.IntegerField(read_only=True)

    class Meta:
        model  = FinancialProduct
        fields = [
            'id', 'name', 'product_type', 'product_type_display',
            'description', 'features', 'requirements',
            'risk_level', 'risk_level_display',
            'min_amount', 'max_amount',
            'min_duration_months', 'max_duration_months',
            'interest_rate', 'origination_fee',
            'min_score_required', 'band_required',
            'max_age', 'min_income',
            'bank_owner_id',
            'total_disbursed', 'applications_count',
            'is_active', 'is_default',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'total_disbursed', 'applications_count', 'created_at', 'updated_at']

    def get_band_required(self, obj):
        score = obj.min_score_required
        if score >= 900: return 'A'
        if score >= 750: return 'B'
        if score >= 600: return 'C'
        if score >= 400: return 'D'
        return 'E'


class FinancialProductCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = FinancialProduct
        fields = [
            'name', 'product_type', 'description', 'features', 'requirements',
            'risk_level',
            'min_amount', 'max_amount',
            'min_duration_months', 'max_duration_months',
            'interest_rate', 'origination_fee',
            'min_score_required', 'max_age', 'min_income',
        ]


class LoanApplicationListSerializer(serializers.ModelSerializer):
    client          = serializers.PrimaryKeyRelatedField(read_only=True)
    enterprise      = serializers.PrimaryKeyRelatedField(read_only=True)
    client_name     = serializers.SerializerMethodField()
    enterprise_name = serializers.SerializerMethodField()
    product_name    = serializers.CharField(source='product.name', read_only=True)
    product_type    = serializers.CharField(source='product.product_type', read_only=True)
    interest_rate   = serializers.DecimalField(source='product.interest_rate', max_digits=6, decimal_places=2, read_only=True)
    bank_owner_id   = serializers.IntegerField(read_only=True)

    class Meta:
        model  = LoanApplication
        fields = [
            'id', 'application_id', 'applicant_type',
            'client', 'enterprise',
            'client_name', 'enterprise_name', 'product_name',
            'product_type', 'interest_rate',
            'requested_amount', 'duration_months', 'monthly_payment', 'total_repayment',
            'teras_score_at_application', 'risk_level', 'bank_owner_id', 'status', 'created_at',
        ]

    def get_client_name(self, obj):
        return obj.client.get_full_name() if obj.client else None

    def get_enterprise_name(self, obj):
        return obj.enterprise.name if obj.enterprise else None


class LoanApplicationDetailSerializer(serializers.ModelSerializer):
    client          = BankClientSerializer(read_only=True)
    enterprise      = BankEnterpriseSerializer(read_only=True)
    product         = FinancialProductSerializer(read_only=True)
    reviewed_by_name = serializers.SerializerMethodField()
    bank_owner_id   = serializers.IntegerField(read_only=True)

    class Meta:
        model  = LoanApplication
        fields = [
            'id', 'application_id', 'applicant_type', 'client', 'enterprise',
            'product', 'requested_amount', 'duration_months', 'purpose',
            'monthly_payment', 'total_repayment',
            'teras_score_at_application', 'risk_level',
            'bank_owner_id',
            'status', 'reviewed_by', 'reviewed_by_name',
            'reviewed_at', 'rejection_reason',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['application_id', 'monthly_payment', 'total_repayment', 'created_at', 'updated_at']

    def get_reviewed_by_name(self, obj):
        return obj.reviewed_by.email if obj.reviewed_by else None


class LoanApplicationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = LoanApplication
        fields = ['applicant_type', 'client', 'enterprise', 'product', 'requested_amount', 'duration_months', 'purpose']

    def validate(self, data):
        if data['applicant_type'] == 'individual' and not data.get('client'):
            raise serializers.ValidationError("Client requis pour un particulier")
        if data['applicant_type'] == 'enterprise' and not data.get('enterprise'):
            raise serializers.ValidationError("Entreprise requise pour une entreprise")
        product = data['product']
        amount  = data['requested_amount']
        if amount < product.min_amount or amount > product.max_amount:
            raise serializers.ValidationError(
                f"Montant doit être entre {product.min_amount:,.0f} et {product.max_amount:,.0f} FCFA"
            )
        duration = data['duration_months']
        if duration < product.min_duration_months or duration > product.max_duration_months:
            raise serializers.ValidationError(
                f"Durée doit être entre {product.min_duration_months} et {product.max_duration_months} mois"
            )
        return data


class LoanApplicationReviewSerializer(serializers.Serializer):
    status           = serializers.ChoiceField(choices=['approved', 'rejected'])
    rejection_reason = serializers.CharField(required=False, allow_blank=True)

    def validate(self, data):
        if data['status'] == 'rejected' and not data.get('rejection_reason'):
            raise serializers.ValidationError("Raison de rejet requise")
        return data


class SimulatorRequestSerializer(serializers.Serializer):
    amount          = serializers.DecimalField(max_digits=15, decimal_places=2)
    duration_months = serializers.IntegerField()
    product_id      = serializers.IntegerField()
    score           = serializers.IntegerField(required=False)


class SimulatorResponseSerializer(serializers.Serializer):
    monthly_payment  = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_repayment  = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_interest   = serializers.DecimalField(max_digits=15, decimal_places=2)
    interest_rate    = serializers.DecimalField(max_digits=5, decimal_places=2)
    eligible         = serializers.BooleanField()
    recommendations  = serializers.ListField()
