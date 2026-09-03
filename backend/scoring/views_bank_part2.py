# backend/scoring/views_bank_part2.py
"""
Vues Bank TERAS — Partie 2
Produits financiers, Demandes de crédit, Simulateur
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q
from django.utils import timezone
from decimal import Decimal

from .models_bank import FinancialProduct, LoanApplication, BankClient, BankEnterprise
from .serializers_bank import (
    FinancialProductSerializer,
    FinancialProductCreateSerializer,
    LoanApplicationListSerializer,
    LoanApplicationDetailSerializer,
    LoanApplicationCreateSerializer,
    LoanApplicationReviewSerializer,
    SimulatorRequestSerializer,
)
from .views_bank_part1 import (
    IsBankUser,
    StandardPagination,
    _get_request_bank_owner,
    _is_bank_admin,
    _resolve_bank_owner_for_application,
    _scope_by_bank_owner,
)


# ─── Produits financiers ──────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsBankUser])
def bank_products_list(request):
    """Liste des produits financiers actifs"""
    qs = _scope_by_bank_owner(FinancialProduct.objects.all(), request.user).order_by('-created_at')
    active_only = request.query_params.get('active', 'true')
    if active_only.lower() == 'true':
        qs = qs.filter(is_active=True)
    serializer = FinancialProductSerializer(qs, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsBankUser])
def bank_product_create(request):
    """Créer un nouveau produit financier"""
    serializer = FinancialProductCreateSerializer(data=request.data)
    if serializer.is_valid():
        product = serializer.save(bank_owner=_get_request_bank_owner(request.user))
        return Response(
            FinancialProductSerializer(product).data,
            status=status.HTTP_201_CREATED
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsBankUser])
def bank_product_detail(request, product_id):
    """Détail d'un produit financier"""
    try:
        product = _scope_by_bank_owner(FinancialProduct.objects.all(), request.user).get(id=product_id)
    except FinancialProduct.DoesNotExist:
        return Response({'error': 'Produit introuvable'}, status=status.HTTP_404_NOT_FOUND)
    return Response(FinancialProductSerializer(product).data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated, IsBankUser])
def bank_product_update(request, product_id):
    """Mettre à jour un produit financier"""
    try:
        product = _scope_by_bank_owner(FinancialProduct.objects.all(), request.user).get(id=product_id)
    except FinancialProduct.DoesNotExist:
        return Response({'error': 'Produit introuvable'}, status=status.HTTP_404_NOT_FOUND)

    serializer = FinancialProductSerializer(product, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated, IsBankUser])
def bank_product_delete(request, product_id):
    """Désactiver un produit (soft delete)"""
    try:
        product = _scope_by_bank_owner(FinancialProduct.objects.all(), request.user).get(id=product_id)
    except FinancialProduct.DoesNotExist:
        return Response({'error': 'Produit introuvable'}, status=status.HTTP_404_NOT_FOUND)

    product.is_active = False
    product.save()
    return Response({'message': 'Produit désactivé'})


# ─── Demandes de crédit ───────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsBankUser])
def bank_applications_list(request):
    """Liste toutes les demandes avec filtres"""
    qs = _scope_by_bank_owner(LoanApplication.objects.all(), request.user).select_related(
        'client', 'enterprise', 'product'
    ).order_by('-created_at')

    status_filter = request.query_params.get('status')
    if status_filter:
        qs = qs.filter(status=status_filter)

    search = request.query_params.get('search', '').strip()
    if search:
        qs = qs.filter(application_id__icontains=search)

    paginator  = StandardPagination()
    page       = paginator.paginate_queryset(qs, request)
    serializer = LoanApplicationListSerializer(page, many=True)
    return paginator.get_paginated_response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsBankUser])
def bank_applications_pending(request):
    """Demandes en attente de décision"""
    qs = _scope_by_bank_owner(LoanApplication.objects.all(), request.user).filter(
        status__in=['pending', 'review']
    ).select_related('client', 'enterprise', 'product').order_by('-created_at')
    serializer = LoanApplicationListSerializer(qs, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsBankUser])
def bank_applications_approved(request):
    """Demandes approuvées / décaissées"""
    qs = _scope_by_bank_owner(LoanApplication.objects.all(), request.user).filter(
        status__in=['approved', 'disbursed']
    ).select_related('client', 'enterprise', 'product').order_by('-created_at')
    serializer = LoanApplicationListSerializer(qs, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsBankUser])
def bank_applications_rejected(request):
    """Demandes rejetées"""
    qs = _scope_by_bank_owner(LoanApplication.objects.all(), request.user).filter(
        status='rejected'
    ).select_related('client', 'enterprise', 'product').order_by('-created_at')
    serializer = LoanApplicationListSerializer(qs, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsBankUser])
def bank_application_submit(request):
    """Soumettre une nouvelle demande de crédit"""
    serializer = LoanApplicationCreateSerializer(data=request.data)
    if serializer.is_valid():
        client = serializer.validated_data.get('client')
        enterprise = serializer.validated_data.get('enterprise')
        product = serializer.validated_data.get('product')

        if not _is_bank_admin(request.user):
            for obj, label in ((client, 'client'), (enterprise, 'entreprise'), (product, 'produit')):
                if obj is not None and getattr(obj, 'bank_owner_id', None) not in (None, request.user.id):
                    return Response({'error': f'{label.capitalize()} non rattaché à votre banque.'}, status=status.HTTP_403_FORBIDDEN)

        # Quand la BANQUE soumet = proposition → statut approved (client accepte/décline)
        application = serializer.save(
            status='approved',
            bank_owner=_resolve_bank_owner_for_application(request.user, client=client, enterprise=enterprise, product=product),
        )
        application.calculate_payments()
        if application.client and application.client.teras_score:
            score = application.client.teras_score
            application.teras_score_at_application = score
            application.risk_level = 'low' if score >= 750 else 'medium' if score >= 600 else 'high' if score >= 450 else 'critical'
        from django.utils import timezone
        application.reviewed_by = request.user
        application.reviewed_at = timezone.now()
        application.save()

        # Notifier le client
        try:
            from .views_bank_notifications import notify_application_status_change
            notify_application_status_change(application)
        except Exception:
            pass

        return Response(
            LoanApplicationDetailSerializer(application).data,
            status=status.HTTP_201_CREATED
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsBankUser])
def bank_application_detail(request, application_id):
    """Détail d'une demande de crédit"""
    try:
        application = _scope_by_bank_owner(LoanApplication.objects.all(), request.user).select_related(
            'client', 'enterprise', 'product', 'reviewed_by'
        ).get(id=application_id)
    except LoanApplication.DoesNotExist:
        return Response({'error': 'Demande introuvable'}, status=status.HTTP_404_NOT_FOUND)

    return Response(LoanApplicationDetailSerializer(application).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsBankUser])
def bank_application_review(request, application_id):
    """Approuver ou rejeter une demande"""
    try:
        application = _scope_by_bank_owner(LoanApplication.objects.all(), request.user).get(id=application_id)
    except LoanApplication.DoesNotExist:
        return Response({'error': 'Demande introuvable'}, status=status.HTTP_404_NOT_FOUND)

    if application.status not in ('pending', 'review'):
        return Response(
            {'error': f'Impossible de traiter une demande avec le statut: {application.status}'},
            status=status.HTTP_400_BAD_REQUEST
        )

    serializer = LoanApplicationReviewSerializer(data=request.data)
    if serializer.is_valid():
        application.status           = serializer.validated_data['status']
        # Notifier le client du changement
        try:
            from .views_bank_notifications import notify_application_status_change
            notify_application_status_change(application)
        except Exception:
            pass
        application.reviewed_by      = request.user
        application.reviewed_at      = timezone.now()
        application.rejection_reason = serializer.validated_data.get('rejection_reason', '')
        application.save()

        return Response(LoanApplicationDetailSerializer(application).data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─── Simulateur de crédit ─────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsBankUser])
def bank_simulator(request):
    """
    Simuler un crédit ZOLA/TERAS
    Calcule mensualité, total, taux effectif, éligibilité
    Applique la règle CRM = 30% des revenus nets
    """
    try:
        amount         = Decimal(str(request.data.get('amount', 0)))
        duration       = int(request.data.get('duration_months', 12))
        product_id     = request.data.get('product_id')
        score          = int(request.data.get('score', 0))
        monthly_income = Decimal(str(request.data.get('monthly_income', 0)))

        if not product_id:
            return Response({'error': 'product_id requis'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            product = _scope_by_bank_owner(FinancialProduct.objects.filter(is_active=True), request.user).get(id=product_id)
        except FinancialProduct.DoesNotExist:
            return Response({'error': 'Produit introuvable ou inactif'}, status=status.HTTP_404_NOT_FOUND)

        # Calcul mensualité (formule prêt amortissable)
        rate = float(product.interest_rate) / 100 / 12
        n    = duration
        amt  = float(amount)

        if rate > 0:
            monthly_payment = amt * (rate * (1 + rate) ** n) / ((1 + rate) ** n - 1)
        else:
            monthly_payment = amt / n

        total_repayment = monthly_payment * n
        total_interest  = total_repayment - amt

        # Éligibilité
        eligible     = True
        errors       = []
        recommendations = []

        # Vérif score minimum
        if score > 0 and score < product.min_score_required:
            eligible = False
            errors.append(
                f'Score TERAS insuffisant ({score} < {product.min_score_required} requis)'
            )
            recommendations.append(
                f'Améliorer le score de {product.min_score_required - score} points pour être éligible'
            )

        # Vérif montant
        if amount < product.min_amount:
            eligible = False
            errors.append(f'Montant minimum: {product.min_amount} CFA')
        if amount > product.max_amount:
            eligible = False
            errors.append(f'Montant maximum: {product.max_amount} CFA')

        # Vérif durée
        if duration < product.min_duration_months:
            eligible = False
            errors.append(f'Durée minimum: {product.min_duration_months} mois')
        if duration > product.max_duration_months:
            eligible = False
            errors.append(f'Durée maximum: {product.max_duration_months} mois')

        # Vérif CRM (30% règle ZOLA)
        crm_limit = 0
        effort_rate = 0
        if monthly_income > 0:
            crm_limit   = float(monthly_income) * 0.30
            effort_rate = (monthly_payment / float(monthly_income)) * 100

            if monthly_payment > crm_limit:
                eligible = False
                errors.append(
                    f'Mensualité ({round(monthly_payment):,} CFA) dépasse le CRM ({round(crm_limit):,} CFA = 30% revenus)'
                )
                recommendations.append(
                    'Réduire le montant demandé ou allonger la durée pour respecter la règle des 30%'
                )

        if eligible and score >= 700:
            recommendations.append('Profil excellent — taux préférentiel applicable')
        if eligible and score >= 600:
            recommendations.append('Éligible — traitement standard')

        return Response({
            'monthly_payment':    round(monthly_payment, 0),
            'total_repayment':    round(total_repayment, 0),
            'total_interest':     round(total_interest, 0),
            'interest_rate':      float(product.interest_rate),
            'effort_rate':        round(effort_rate, 1),
            'crm_limit':          round(crm_limit, 0),
            'eligible':           eligible,
            'errors':             errors,
            'recommendations':    recommendations,
            'product_name':       product.name,
        })

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ─── Analytics ────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsBankUser])
def bank_analytics(request):
    """Analytics globales du portefeuille banque — données réelles"""
    try:
        from django.db.models import Avg, Sum, Count, Q
        from django.utils import timezone
        from datetime import timedelta, date
        from collections import defaultdict

        period = request.query_params.get('period', 'month')
        days   = 7 if period == 'week' else (30 if period == 'month' else (90 if period == 'quarter' else 365))
        since  = timezone.now() - timedelta(days=days)

        clients_qs = _scope_by_bank_owner(BankClient.objects.all(), request.user)
        applications_qs = _scope_by_bank_owner(LoanApplication.objects.all(), request.user)
        products_qs = _scope_by_bank_owner(FinancialProduct.objects.all(), request.user)

        # ── Overview ──────────────────────────────────────────────────────────
        total_clients   = clients_qs.count()
        active_loans    = applications_qs.filter(status='disbursed').count()
        pending_count   = applications_qs.filter(status='pending').count()
        approved_count  = applications_qs.filter(status__in=['approved', 'disbursed']).count()
        rejected_count  = applications_qs.filter(status='rejected').count()

        portfolio_value = float(
            applications_qs.filter(status='disbursed')
            .aggregate(total=Sum('requested_amount'))['total'] or 0
        )
        total_interest = float(
            applications_qs.filter(status='disbursed')
            .aggregate(total=Sum('total_repayment'))['total'] or 0
        ) - portfolio_value

        avg_ticket_data = applications_qs.filter(status='disbursed').aggregate(avg=Avg('requested_amount'))
        avg_ticket = float(avg_ticket_data['avg'] or 0)

        avg_score = round(float(
            clients_qs.filter(teras_score__isnull=False)
            .aggregate(avg=Avg('teras_score'))['avg'] or 0
        ))

        # ── Score distribution ────────────────────────────────────────────────
        total_with_score = clients_qs.filter(teras_score__isnull=False).count() or 1
        bands = [
            ('A (900-1000)', 900, 1000),
            ('B (750-899)',  750,  899),
            ('C (600-749)',  600,  749),
            ('D (400-599)',  400,  599),
            ('E (<400)',       0,  399),
        ]
        score_distribution = []
        for label, lo, hi in bands:
            count = clients_qs.filter(teras_score__gte=lo, teras_score__lte=hi).count()
            score_distribution.append({
                'band':       label,
                'count':      count,
                'percentage': round((count / total_with_score) * 100, 1),
            })

        # ── Performance par produit ───────────────────────────────────────────
        products = products_qs
        product_perf = []
        for p in products:
            apps = applications_qs.filter(product=p, status__in=['approved', 'disbursed'])
            vol  = float(apps.aggregate(s=Sum('requested_amount'))['s'] or 0)
            cnt  = apps.count()
            product_perf.append({
                'product':   p.name,
                'volume':    vol,
                'count':     cnt,
                'avgTicket': round(vol / cnt) if cnt else 0,
                'rate':      float(p.interest_rate),
            })
        product_perf = sorted(product_perf, key=lambda x: x['volume'], reverse=True)

        # ── Volume par mois (6 derniers mois) ────────────────────────────────
        volumes_by_month = []
        for i in range(5, -1, -1):
            d = timezone.now() - timedelta(days=30 * i)
            month_start = date(d.year, d.month, 1)
            if d.month == 12:
                month_end = date(d.year + 1, 1, 1)
            else:
                month_end = date(d.year, d.month + 1, 1)

            apps_month = applications_qs.filter(
                created_at__date__gte=month_start,
                created_at__date__lt=month_end,
                status__in=['approved', 'disbursed'],
            )
            vol   = float(apps_month.aggregate(s=Sum('requested_amount'))['s'] or 0)
            count = apps_month.count()
            volumes_by_month.append({
                'month':  d.strftime('%b'),
                'volume': vol,
                'loans':  count,
            })

        # ── Métriques risque ──────────────────────────────────────────────────
        total_apps = applications_qs.count() or 1
        cancelled  = applications_qs.filter(status='cancelled').count()
        default_rate = round((cancelled / total_apps) * 100, 1)
        approval_rate = round((approved_count / max(approved_count + rejected_count, 1)) * 100, 1)

        return Response({
            'overview': {
                'totalRevenue':  round(total_interest),
                'revenueGrowth': 0,
                'totalLoans':    active_loans,
                'loansGrowth':   0,
                'activeClients': total_clients,
                'clientsGrowth': 0,
                'avgTicket':     round(avg_ticket),
                'ticketGrowth':  0,
                'portfolioValue': portfolio_value,
            },
            'volumesByMonth':     volumes_by_month,
            'scoreDistribution':  score_distribution,
            'productPerformance': product_perf,
            'riskMetrics': {
                'portfolioHealth':  round(100 - default_rate, 1),
                'defaultRate':      default_rate,
                'collectionRate':   round(100 - default_rate * 0.5, 1),
                'avgDelay':         0,
                'provisions':       round(portfolio_value * 0.05),
            },
            'trends': {
                'approvalRate':          approval_rate,
                'avgProcessingTime':     1.0,
                'customerSatisfaction':  4.5,
                'repeatCustomers':       0,
            },
            'counts': {
                'total_clients':  total_clients,
                'active_loans':   active_loans,
                'pending_count':  pending_count,
                'approved_count': approved_count,
                'rejected_count': rejected_count,
                'avg_score':      avg_score,
                'approval_rate':  approval_rate,
            },
        })
    except Exception as e:
        import traceback
        return Response({'error': str(e), 'detail': traceback.format_exc()}, status=500)


# ─── AI Chat ─────────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsBankUser])
def bank_ai_chat(request):
    """Chat IA pour l'interface Banque via Claude Sonnet 4"""
    import requests as req_lib
    import os

    try:
        message = request.data.get('message', '').strip()
        if not message:
            return Response({'error': 'Message vide'}, status=400)

        from django.db.models import Avg, Sum, Count
        clients_qs = _scope_by_bank_owner(BankClient.objects.all(), request.user)
        applications_qs = _scope_by_bank_owner(LoanApplication.objects.all(), request.user)

        total_clients   = clients_qs.count()
        active_loans    = applications_qs.filter(status='disbursed').count()
        portfolio_value = float(
            applications_qs.filter(status='disbursed')
            .aggregate(total=Sum('requested_amount'))['total'] or 0
        )
        avg_score = round(float(
            clients_qs.filter(teras_score__isnull=False)
            .aggregate(avg=Avg('teras_score'))['avg'] or 0
        ))

        system_prompt = f"""Tu es un assistant bancaire expert TERAS pour la région CEMAC (Afrique Centrale).
Tu aides les agents bancaires à analyser les demandes de crédit, comprendre les scores TERAS et optimiser leur portefeuille.

CONTEXTE ACTUEL DU PORTEFEUILLE :
- Clients totaux : {total_clients}
- Crédits actifs : {active_loans}
- Valeur portefeuille : {portfolio_value:,.0f} FCFA
- Score TERAS moyen : {avg_score}/1000

RÈGLES ZOLA/TERAS :
- CRM = 30% des revenus nets mensuels (plafond de remboursement)
- Score ≥750 : Taux 5-7% (Pro), Score 600-749 : 8-10% (Growth), Score 500-599 : 10-12% (Starter)
- KYC obligatoire avant tout octroi
- Garantie requise pour montants >1M FCFA

Réponds en français, de manière professionnelle et concise."""

        api_resp = req_lib.post(
            'https://api.anthropic.com/v1/messages',
            headers={{
                'x-api-key': os.getenv('ANTHROPIC_API_KEY', ''),
                'content-type': 'application/json',
                'anthropic-version': '2023-06-01',
            }},
            json={{
                'model': 'claude-sonnet-4-20250514',
                'max_tokens': 800,
                'system': system_prompt,
                'messages': [{{'role': 'user', 'content': message}}]
            }},
            timeout=30
        )
        api_resp.raise_for_status()
        data = api_resp.json()
        response_text = data['content'][0]['text']

        return Response({{'response': response_text}})

    except Exception as e:
        return Response({{
            'response': f"Service IA temporairement indisponible. Erreur : {{str(e)[:100]}}"
        }})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def client_products_list(request):
    """Produits financiers accessibles aux clients (lecture seule)"""
    from .models_bank import FinancialProduct
    from .serializers_bank import FinancialProductSerializer

    qs = FinancialProduct.objects.filter(is_active=True).order_by('min_score_required', 'min_amount')
    client = BankClient.objects.filter(user=request.user).first()
    if client and client.bank_owner_id:
        qs = qs.filter(Q(bank_owner=client.bank_owner) | Q(bank_owner__isnull=True))
    return Response(FinancialProductSerializer(qs, many=True).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsBankUser])
def bank_application_update_amount(request, application_id):
    """La banque modifie le montant d'un crédit approuvé (avant acceptation client)"""
    try:
        app = _scope_by_bank_owner(LoanApplication.objects.all(), request.user).get(id=application_id)
    except LoanApplication.DoesNotExist:
        return Response({'error': 'Demande introuvable'}, status=status.HTTP_404_NOT_FOUND)

    if app.status != 'approved':
        return Response({'error': 'Seuls les crédits en attente d\'acceptation peuvent être modifiés'}, status=400)

    new_amount   = request.data.get('requested_amount')
    new_duration = request.data.get('duration_months')
    reason       = request.data.get('reason', '')

    if not new_amount or not new_duration:
        return Response({'error': 'requested_amount et duration_months requis'}, status=400)

    from decimal import Decimal
    app.requested_amount = Decimal(str(new_amount))
    app.duration_months  = int(new_duration)
    app.calculate_payments()
    app.save()

    # Notifier le client de la modification
    try:
        from .views_bank_notifications import _send_system_message
        if app.client and app.client.user:
            _send_system_message(
                recipient=app.client.user,
                message_type='info',
                subject='Votre offre de crédit a été mise à jour',
                body=(
                    f'Bonjour {app.client.first_name},\n\n'
                    f'Votre conseiller a mis à jour votre offre de crédit :\n\n'
                    f'• Produit : {app.product.name if app.product else "—"}\n'
                    f'• Nouveau montant : {float(app.requested_amount):,.0f} FCFA\n'
                    f'• Mensualité : {float(app.monthly_payment):,.0f} FCFA/mois\n'
                    f'• Durée : {app.duration_months} mois\n'
                    + (f'• Motif : {reason}\n' if reason else '') +
                    f'\nConnectez-vous à TERAS pour accepter ou décliner cette offre mise à jour.'
                ),
                related_application_id=app.application_id,
            )
    except Exception:
        pass

    return Response({
        'success': True,
        'requested_amount': str(app.requested_amount),
        'monthly_payment':  str(app.monthly_payment),
        'duration_months':  app.duration_months,
    })
