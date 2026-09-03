# backend/credit/views.py
"""
TERAS Credit Views
API REST pour le système de crédit ZOLA
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from decimal import Decimal

from .models import CreditProduct, CreditRequest, CreditGuarantee, CreditPaymentSchedule
from .serializers import (
    CreditProductSerializer,
    CreditProductWithEligibilitySerializer,
    CreditRequestSerializer,
    CreditRequestCreateSerializer,
    CreditSimulationSerializer,
    CRMCalculatorSerializer,
    PaymentScheduleSerializer,
    CreditHistorySerializer
)
from .utils import (
    get_crm_with_adjustments,
    calculate_loan_details,
    get_all_eligible_products,
    is_loan_sustainable
)
from .permissions import IsOwnerOrAdmin


class CreditProductViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet pour les produits de crédit
    GET /api/credit/products/ - Liste tous les produits
    GET /api/credit/products/{id}/ - Détail d'un produit
    GET /api/credit/products/with-eligibility/ - Produits avec éligibilité calculée
    """
    permission_classes = [IsAuthenticated]
    queryset = CreditProduct.objects.filter(is_active=True).order_by('category', 'display_order')
    
    def get_serializer_class(self):
        if self.action == 'with_eligibility':
            return CreditProductWithEligibilitySerializer
        return CreditProductSerializer
    
    @action(detail=False, methods=['get'])
    def with_eligibility(self, request):
        """
        Liste des produits avec statut d'éligibilité pour l'utilisateur
        GET /api/credit/products/with-eligibility/
        """
        products = self.get_queryset()
        serializer = CreditProductWithEligibilitySerializer(
            products,
            many=True,
            context={'request': request}
        )
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def categories(self, request):
        """
        Liste des catégories de produits disponibles
        GET /api/credit/products/categories/
        """
        categories = [
            {'value': 'seed', 'label': 'SEED - Test/Urgence', 'order': 1},
            {'value': 'starter', 'label': 'STARTER - Trésorerie', 'order': 2},
            {'value': 'growth', 'label': 'GROWTH - Stock/Équipement', 'order': 3},
            {'value': 'pro', 'label': 'PRO - Expansion', 'order': 4},
        ]
        return Response(categories)


class CreditRequestViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour les demandes de crédit
    GET /api/credit/requests/ - Mes demandes
    POST /api/credit/requests/ - Créer une demande
    GET /api/credit/requests/{id}/ - Détail demande
    PATCH /api/credit/requests/{id}/accept/ - Accepter l'offre
    """
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]
    
    def get_queryset(self):
        """Utilisateur voit uniquement ses demandes, admin voit tout"""
        user = self.request.user
        if user.is_staff or user.user_type == 'admin':
            return CreditRequest.objects.all().select_related('user', 'product')
        return CreditRequest.objects.filter(user=user).select_related('product')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CreditRequestCreateSerializer
        return CreditRequestSerializer
    
    def create(self, request, *args, **kwargs):
        """
        Créer une nouvelle demande de crédit
        POST /api/credit/requests/
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        credit_request = serializer.save()
        
        # Retourner avec serializer complet
        output_serializer = CreditRequestSerializer(credit_request)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        """
        Accepter une offre de crédit approuvée
        POST /api/credit/requests/{id}/accept/
        """
        credit_request = self.get_object()
        
        # Vérifier statut
        if credit_request.status != CreditRequest.STATUS_APPROVED:
            return Response(
                {'error': 'Cette demande n\'est pas dans un état approuvé'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Accepter l'offre
        try:
            credit_request.accept_offer()
            serializer = self.get_serializer(credit_request)
            return Response({
                'message': 'Offre acceptée avec succès',
                'credit_request': serializer.data
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def schedule(self, request, pk=None):
        """
        Récupérer l'échéancier de paiement
        GET /api/credit/requests/{id}/schedule/
        """
        credit_request = self.get_object()
        schedule = credit_request.payment_schedule.all().order_by('payment_number')
        serializer = PaymentScheduleSerializer(schedule, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Statistiques des demandes de l'utilisateur
        GET /api/credit/requests/stats/
        """
        user = request.user
        queryset = CreditRequest.objects.filter(user=user)
        
        stats = {
            'total': queryset.count(),
            'pending': queryset.filter(status='pending').count(),
            'under_review': queryset.filter(status='under_review').count(),
            'approved': queryset.filter(status='approved').count(),
            'rejected': queryset.filter(status='rejected').count(),
            'active': queryset.filter(status='active').count(),
            'completed': queryset.filter(status='completed').count(),
            'total_borrowed': sum(
                float(r.amount_approved or 0)
                for r in queryset.filter(status__in=['disbursed', 'active', 'completed'])
            ),
            'total_repaid': sum(
                float(r.total_cost or 0)
                for r in queryset.filter(status='completed')
            )
        }
        
        return Response(stats)


class CreditSimulatorViewSet(viewsets.ViewSet):
    """
    ViewSet pour simuler un crédit
    POST /api/credit/simulator/ - Simuler un crédit
    """
    permission_classes = [IsAuthenticated]
    
    def create(self, request):
        """
        Simuler un crédit avec calculs complets
        POST /api/credit/simulator/
        Body: {product_id, amount, duration_months}
        """
        serializer = CreditSimulationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        product = serializer.validated_data['product']
        amount = serializer.validated_data['amount']
        duration_months = serializer.validated_data['duration_months']
        
        # Calculer détails du prêt
        loan_details = calculate_loan_details(
            amount=amount,
            duration_months=duration_months,
            annual_rate=product.get_average_rate()
        )
        
        # Calculer CRM utilisateur
        crm_data = get_crm_with_adjustments(request.user)
        
        # Taux d'effort
        sustainability = is_loan_sustainable(
            monthly_payment=loan_details['monthly_payment'],
            net_revenue=crm_data['net_revenue']
        )
        
        return Response({
            'product': {
                'id': str(product.id),
                'name': product.name,
                'category': product.category
            },
            'amount': float(amount),
            'duration_months': duration_months,
            'annual_rate': float(product.get_average_rate()),
            'monthly_payment': float(loan_details['monthly_payment']),
            'total_cost': float(loan_details['total_cost']),
            'total_interest': float(loan_details['total_interest']),
            'effective_rate': float(loan_details['effective_rate']),
            'crm': {
                'adjusted_crm': float(crm_data['adjusted_crm']),
                'net_revenue': float(crm_data['net_revenue']),
                'revenue_avg': float(crm_data['revenue_avg'])
            },
            'sustainability': sustainability,
            'payment_schedule': loan_details['payment_schedule']
        })


class CRMCalculatorViewSet(viewsets.ViewSet):
    """
    ViewSet pour calculer le CRM d'un utilisateur
    GET /api/credit/crm/ - Mon CRM
    """
    permission_classes = [IsAuthenticated]
    
    def list(self, request):
        """
        Calculer le CRM de l'utilisateur authentifié
        GET /api/credit/crm/
        """
        serializer = CRMCalculatorSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        
        transaction_days = serializer.validated_data['transaction_days']
        
        # Calculer CRM avec ajustements
        crm_data = get_crm_with_adjustments(request.user)
        
        return Response({
            'user_id': request.user.id,
            'username': request.user.username,
            'calculation_period_days': transaction_days,
            'revenue_avg': float(crm_data['revenue_avg']),
            'vital_expenses': float(crm_data['vital_expenses']),
            'net_revenue': float(crm_data['net_revenue']),
            'base_crm': float(crm_data['base_crm']),
            'adjusted_crm': float(crm_data['adjusted_crm']),
            'score_band': crm_data['score_band'],
            'adjustment_factor': crm_data['adjustment_factor'],
            'max_monthly_payment': float(crm_data['max_monthly_payment']),
            'calculated_at': crm_data['calculated_at']
        })
    
    @action(detail=False, methods=['post'])
    def max_loan(self, request):
        """
        Calculer montant maximum empruntable
        POST /api/credit/crm/max-loan/
        Body: {duration_months}
        """
        duration_months = request.data.get('duration_months', 6)
        
        try:
            duration_months = int(duration_months)
            if duration_months < 1 or duration_months > 24:
                return Response(
                    {'error': 'Durée doit être entre 1 et 24 mois'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except ValueError:
            return Response(
                {'error': 'Durée invalide'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        crm_data = get_crm_with_adjustments(request.user)
        
        # Calculer avec taux moyen (18%)
        from .utils import calculate_max_sustainable_amount
        max_loan_data = calculate_max_sustainable_amount(
            net_revenue=crm_data['net_revenue'],
            duration_months=duration_months,
            annual_rate=Decimal('18.0')
        )
        
        return Response({
            'duration_months': duration_months,
            'crm': float(crm_data['adjusted_crm']),
            'net_revenue': float(crm_data['net_revenue']),
            'max_amount': float(max_loan_data['max_amount']),
            'max_monthly_payment': float(max_loan_data['max_monthly_payment']),
            'effort_rate': max_loan_data['effort_rate'],
            'note': 'Calcul basé sur taux moyen 18%/an et effort max 30%'
        })
