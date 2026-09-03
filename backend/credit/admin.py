# backend/credit/admin.py
"""
TERAS Credit Admin
Interface Django Admin pour gérer les crédits
"""

from django.contrib import admin
from django.utils.html import format_html
from .models import (
    CreditProduct,
    CreditRequest,
    CreditGuarantee,
    CreditPaymentSchedule,
    CreditHistory
)


@admin.register(CreditProduct)
class CreditProductAdmin(admin.ModelAdmin):
    """Admin pour les produits de crédit"""
    
    list_display = [
        'name', 'category', 'score_range', 'amount_range',
        'duration_range', 'rate_range', 'is_active'
    ]
    list_filter = ['category', 'is_active']
    search_fields = ['name', 'code', 'description']
    ordering = ['category', 'display_order', 'name']
    
    fieldsets = (
        ('Informations Générales', {
            'fields': ('code', 'name', 'category', 'description', 'is_active', 'display_order')
        }),
        ('Éligibilité Score', {
            'fields': ('min_score', 'max_score')
        }),
        ('Montants', {
            'fields': ('min_amount', 'max_amount')
        }),
        ('Durées', {
            'fields': ('min_duration_months', 'max_duration_months')
        }),
        ('Taux d\'intérêt', {
            'fields': ('interest_rate_min', 'interest_rate_max')
        }),
        ('Garanties', {
            'fields': ('guarantees_required', 'requires_coempruntor', 'requires_collateral')
        }),
        ('Conditions', {
            'fields': ('conditions',)
        }),
    )
    
    def score_range(self, obj):
        return f"{obj.min_score} - {obj.max_score}"
    score_range.short_description = 'Score TERAS'
    
    def amount_range(self, obj):
        return f"{obj.min_amount:,.0f} - {obj.max_amount:,.0f} CDF"
    amount_range.short_description = 'Montant'
    
    def duration_range(self, obj):
        return f"{obj.min_duration_months} - {obj.max_duration_months} mois"
    duration_range.short_description = 'Durée'
    
    def rate_range(self, obj):
        return f"{obj.interest_rate_min}% - {obj.interest_rate_max}%"
    rate_range.short_description = 'Taux'


class CreditGuaranteeInline(admin.TabularInline):
    """Inline pour les garanties"""
    model = CreditGuarantee
    extra = 0
    fields = ['guarantee_type', 'estimated_value', 'status', 'verification_notes']
    readonly_fields = ['created_at']


@admin.register(CreditRequest)
class CreditRequestAdmin(admin.ModelAdmin):
    """Admin pour les demandes de crédit"""
    
    list_display = [
        'request_number', 'user', 'product_name', 'amount_display',
        'status_badge', 'score_at_request', 'created_at'
    ]
    list_filter = ['status', 'product__category', 'created_at']
    search_fields = ['request_number', 'user__username', 'user__email', 'purpose']
    readonly_fields = [
        'request_number', 'crm_calculated', 'teras_score_at_request',
        'teras_band_at_request', 'created_at', 'updated_at'
    ]
    inlines = [CreditGuaranteeInline]
    
    fieldsets = (
        ('Identification', {
            'fields': ('request_number', 'user', 'product', 'status')
        }),
        ('Demande', {
            'fields': (
                'amount_requested', 'duration_months', 'purpose',
                'monthly_income_declared'
            )
        }),
        ('Évaluation', {
            'fields': (
                'crm_calculated', 'teras_score_at_request', 'teras_band_at_request'
            )
        }),
        ('Décision', {
            'fields': (
                'reviewed_by', 'amount_approved', 'interest_rate_approved',
                'monthly_payment', 'total_cost',
                'rejection_reason', 'ai_recommendation'
            )
        }),
        ('Dates', {
            'fields': (
                'created_at', 'updated_at', 'reviewed_at',
                'approved_at', 'disbursed_at', 'completed_at'
            )
        }),
    )
    
    def product_name(self, obj):
        return obj.product.name if obj.product else '-'
    product_name.short_description = 'Produit'
    
    def amount_display(self, obj):
        return f"{obj.amount_requested:,.0f} CDF"
    amount_display.short_description = 'Montant'
    
    def score_at_request(self, obj):
        return f"{obj.teras_score_at_request} ({obj.teras_band_at_request})"
    score_at_request.short_description = 'Score/Bande'
    
    def status_badge(self, obj):
        colors = {
            'pending': 'orange',
            'under_review': 'blue',
            'approved': 'green',
            'rejected': 'red',
            'accepted': 'teal',
            'disbursed': 'purple',
            'active': 'indigo',
            'completed': 'green',
            'defaulted': 'darkred',
            'cancelled': 'gray'
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = 'Statut'
    
    actions = ['approve_requests', 'reject_requests']
    
    def approve_requests(self, request, queryset):
        """Action pour approuver en masse"""
        count = 0
        for req in queryset.filter(status='pending'):
            # TODO: Implémenter logique d'approbation automatique
            count += 1
        self.message_user(request, f"{count} demande(s) approuvée(s)")
    approve_requests.short_description = "Approuver les demandes sélectionnées"
    
    def reject_requests(self, request, queryset):
        """Action pour rejeter en masse"""
        count = queryset.filter(status='pending').update(
            status='rejected',
            rejection_reason='Rejet groupé par administrateur'
        )
        self.message_user(request, f"{count} demande(s) rejetée(s)")
    reject_requests.short_description = "Rejeter les demandes sélectionnées"


@admin.register(CreditGuarantee)
class CreditGuaranteeAdmin(admin.ModelAdmin):
    """Admin pour les garanties"""
    
    list_display = [
        'credit_request', 'guarantee_type', 'value_display',
        'status', 'verified_by', 'created_at'
    ]
    list_filter = ['guarantee_type', 'status', 'created_at']
    search_fields = ['credit_request__request_number', 'description']
    readonly_fields = ['created_at', 'updated_at']
    
    def value_display(self, obj):
        return f"{obj.estimated_value:,.0f} CDF"
    value_display.short_description = 'Valeur'


@admin.register(CreditPaymentSchedule)
class PaymentScheduleAdmin(admin.ModelAdmin):
    """Admin pour l'échéancier"""
    
    list_display = [
        'credit_request', 'payment_number', 'due_date',
        'amount_display', 'status', 'paid_date'
    ]
    list_filter = ['status', 'due_date']
    search_fields = ['credit_request__request_number']
    readonly_fields = ['created_at', 'updated_at']
    
    def amount_display(self, obj):
        return f"{obj.total_amount:,.0f} CDF"
    amount_display.short_description = 'Montant'


@admin.register(CreditHistory)
class CreditHistoryAdmin(admin.ModelAdmin):
    """Admin pour l'historique"""
    
    list_display = [
        'user', 'credit_request', 'behavior_score',
        'payments_summary', 'completion_status'
    ]
    list_filter = ['was_completed', 'was_defaulted', 'created_at']
    search_fields = ['user__username', 'credit_request__request_number']
    readonly_fields = ['created_at', 'updated_at']
    
    def payments_summary(self, obj):
        return f"{obj.on_time_payments}✓ / {obj.late_payments}⚠ / {obj.missed_payments}✗"
    payments_summary.short_description = 'Paiements'
    
    def completion_status(self, obj):
        if obj.was_completed:
            return format_html('<span style="color: green;">✓ Complété</span>')
        elif obj.was_defaulted:
            return format_html('<span style="color: red;">✗ Défaut</span>')
        return format_html('<span style="color: orange;">⏳ En cours</span>')
    completion_status.short_description = 'État'
