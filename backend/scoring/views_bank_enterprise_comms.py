# backend/scoring/views_bank_enterprise_comms.py
"""
Communication Banque ↔ Entreprise
- La banque crée des profils entreprise avec accès à l'interface
- L'entreprise peut demander des produits financiers
- Messagerie bidirectionnelle
"""
import os
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

User = get_user_model()


def _get_models():
    from scoring.models_bank import (
        BankEnterprise, LoanApplication, FinancialProduct, BankMessage
    )
    return BankEnterprise, LoanApplication, FinancialProduct, BankMessage


# ─────────────────────────────────────────────────────────────────────────────
# 1. Messages banque → entreprise (côté entreprise)
# ─────────────────────────────────────────────────────────────────────────────

class EnterpriseMessagesView(APIView):
    """GET /api/scoring/enterprise/bank-messages/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        _, _, _, BankMessage = _get_models()
        msgs = BankMessage.objects.filter(recipient=request.user).order_by('-created_at')[:50]
        data = [
            {
                'id':          m.id,
                'type':        m.message_type,
                'subject':     m.subject,
                'body':        m.body,
                'is_read':     m.is_read,
                'created_at':  m.created_at.isoformat(),
                'sender_name': m.sender_name or 'TERAS Banque',
                'related_application_id': m.related_application_id,
            }
            for m in msgs
        ]
        return Response({'messages': data, 'unread_count': sum(1 for m in data if not m['is_read'])})


class EnterpriseMarkMessageReadView(APIView):
    """POST /api/scoring/enterprise/bank-messages/<id>/read/"""
    permission_classes = [IsAuthenticated]

    def post(self, request, message_id):
        _, _, _, BankMessage = _get_models()
        try:
            m = BankMessage.objects.get(id=message_id, recipient=request.user)
            m.is_read = True
            m.save(update_fields=['is_read'])
            return Response({'success': True})
        except BankMessage.DoesNotExist:
            return Response({'error': 'Message introuvable'}, status=404)


class EnterpriseMarkAllReadView(APIView):
    """POST /api/scoring/enterprise/bank-messages/read-all/"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        _, _, _, BankMessage = _get_models()
        BankMessage.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
        return Response({'success': True})


# ─────────────────────────────────────────────────────────────────────────────
# 2. Demandes de crédit (côté entreprise)
# ─────────────────────────────────────────────────────────────────────────────

class EnterpriseMyApplicationsView(APIView):
    """GET /api/scoring/enterprise/my-applications/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        BankEnterprise, LoanApplication, _, _ = _get_models()
        try:
            ent = BankEnterprise.objects.filter(user=request.user).first()
            if not ent:
                return Response({'applications': [], 'summary': {}})

            apps = LoanApplication.objects.filter(enterprise=ent).order_by('-created_at')
            data = []
            for a in apps:
                data.append({
                    'id':                         a.id,
                    'application_id':             a.application_id,
                    'product_name':               a.product.name if a.product else '—',
                    'product_type':               a.product.product_type if a.product else '—',
                    'requested_amount':           str(a.requested_amount),
                    'duration_months':            a.duration_months,
                    'monthly_payment':            str(a.monthly_payment),
                    'total_repayment':            str(a.total_repayment),
                    'interest_rate':              str(a.product.interest_rate) if a.product else '0',
                    'purpose':                    a.purpose,
                    'status':                     a.status,
                    'teras_score_at_application': a.teras_score_at_application,
                    'rejection_reason':           a.rejection_reason,
                    'reviewed_at':                a.reviewed_at.isoformat() if a.reviewed_at else None,
                    'created_at':                 a.created_at.isoformat(),
                    'features':                   a.product.features if a.product else [],
                })

            summary = {
                'total':    len(data),
                'pending':  sum(1 for a in data if a['status'] == 'pending'),
                'approved': sum(1 for a in data if a['status'] in ('approved', 'disbursed')),
                'active':   sum(1 for a in data if a['status'] == 'disbursed'),
                'rejected': sum(1 for a in data if a['status'] == 'rejected'),
            }
            return Response({'applications': data, 'summary': summary})
        except Exception as e:
            return Response({'error': str(e), 'applications': [], 'summary': {}}, status=500)


class EnterpriseAcceptApplicationView(APIView):
    """POST /api/scoring/enterprise/my-applications/<id>/accept/"""
    permission_classes = [IsAuthenticated]

    def post(self, request, application_id):
        BankEnterprise, LoanApplication, _, BankMessage = _get_models()
        try:
            ent = BankEnterprise.objects.filter(user=request.user).first()
            if not ent:
                return Response({'error': 'Profil entreprise non trouvé'}, status=404)

            app = LoanApplication.objects.get(id=application_id, enterprise=ent)
            if app.status != 'approved':
                return Response({'error': f"Statut '{app.status}' — impossible d'accepter"}, status=400)

            app.status      = 'disbursed'
            app.reviewed_at = timezone.now()
            app.save(update_fields=['status', 'reviewed_at'])

            # Notification confirmation
            BankMessage.objects.create(
                recipient=request.user,
                message_type='info',
                subject='Crédit entreprise accepté — virement en cours',
                body=(
                    f"Votre financement de {float(app.requested_amount):,.0f} FCFA "
                    f"({app.product.name if app.product else 'crédit'}) a été accepté.\n\n"
                    f"Mensualité : {float(app.monthly_payment):,.0f} FCFA/mois pendant {app.duration_months} mois.\n"
                    f"Les fonds seront virés sur votre compte professionnel sous 24–48h."
                ),
                related_application_id=app.application_id,
            )
            return Response({'success': True, 'status': 'disbursed'})
        except LoanApplication.DoesNotExist:
            return Response({'error': 'Demande introuvable'}, status=404)
        except Exception as e:
            return Response({'error': str(e)}, status=500)


class EnterpriseDeclineApplicationView(APIView):
    """POST /api/scoring/enterprise/my-applications/<id>/decline/"""
    permission_classes = [IsAuthenticated]

    def post(self, request, application_id):
        BankEnterprise, LoanApplication, _, _ = _get_models()
        try:
            ent = BankEnterprise.objects.filter(user=request.user).first()
            if not ent:
                return Response({'error': 'Profil entreprise non trouvé'}, status=404)
            app = LoanApplication.objects.get(id=application_id, enterprise=ent)
            if app.status not in ('approved', 'pending'):
                return Response({'error': f"Statut '{app.status}' non modifiable"}, status=400)
            app.status           = 'cancelled'
            app.rejection_reason = request.data.get('reason', "Refus par l'entreprise")
            app.reviewed_at      = timezone.now()
            app.save(update_fields=['status', 'rejection_reason', 'reviewed_at'])
            return Response({'success': True, 'status': 'cancelled'})
        except LoanApplication.DoesNotExist:
            return Response({'error': 'Demande introuvable'}, status=404)
        except Exception as e:
            return Response({'error': str(e)}, status=500)


class EnterpriseRequestApplicationView(APIView):
    """POST /api/scoring/enterprise/my-applications/request/ — L'entreprise demande un crédit"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        BankEnterprise, LoanApplication, FinancialProduct, _ = _get_models()
        try:
            product_id       = request.data.get('product_id')
            requested_amount = request.data.get('requested_amount')
            duration_months  = request.data.get('duration_months')
            purpose          = request.data.get('purpose', '')

            if not all([product_id, requested_amount, duration_months, purpose]):
                return Response({'error': 'product_id, requested_amount, duration_months, purpose requis'}, status=400)

            product = FinancialProduct.objects.get(id=product_id, is_active=True)

            # Profil entreprise
            ent = BankEnterprise.objects.filter(user=request.user).first()
            if not ent:
                return Response({'error': 'Profil entreprise non trouvé. Contactez votre conseiller bancaire.'}, status=404)

            if ent.bank_owner_id is None and product.bank_owner_id is not None:
                ent.bank_owner = product.bank_owner
                ent.save(update_fields=['bank_owner'])

            if (
                ent.bank_owner_id is not None
                and product.bank_owner_id is not None
                and ent.bank_owner_id != product.bank_owner_id
            ):
                return Response(
                    {'error': "Ce produit dépend d'une autre banque que celle liée à votre entreprise."},
                    status=400,
                )

            from decimal import Decimal
            rate    = float(product.interest_rate) / 100 / 12
            n       = int(duration_months)
            amount  = float(requested_amount)
            monthly = amount * (rate * (1+rate)**n) / ((1+rate)**n - 1) if rate > 0 else amount / n

            app = LoanApplication.objects.create(
                applicant_type='enterprise',
                enterprise=ent,
                product=product,
                requested_amount=Decimal(str(requested_amount)),
                duration_months=n,
                purpose=purpose,
                monthly_payment=Decimal(str(round(monthly, 2))),
                total_repayment=Decimal(str(round(monthly * n, 2))),
                teras_score_at_application=ent.teras_score,
                status='pending',
                bank_owner=ent.bank_owner or product.bank_owner,
            )
            return Response({
                'success': True,
                'application_id': app.application_id,
                'message': 'Demande transmise à votre conseiller bancaire. Délai de réponse : 24–48h.',
            })
        except FinancialProduct.DoesNotExist:
            return Response({'error': 'Produit introuvable'}, status=404)
        except Exception as e:
            return Response({'error': str(e)}, status=500)


# ─────────────────────────────────────────────────────────────────────────────
# 3. Produits financiers accessibles aux entreprises
# ─────────────────────────────────────────────────────────────────────────────

class EnterpriseProductsView(APIView):
    """GET /api/scoring/enterprise/products/ — produits PME/entreprise"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        BankEnterprise, _, FinancialProduct, _ = _get_models()
        # Produits orientés entreprise
        enterprise_types = ['pme', 'agricole', 'immobilier', 'other', 'personal', 'auto', 'education']
        ent = BankEnterprise.objects.filter(user=request.user).first()
        products = FinancialProduct.objects.filter(is_active=True)
        if ent and ent.bank_owner_id:
            products = products.filter(Q(bank_owner=ent.bank_owner) | Q(bank_owner__isnull=True))
        products = products.filter(product_type__in=enterprise_types)
        data = [
            {
                'id':                   p.id,
                'name':                 p.name,
                'product_type':         p.product_type,
                'description':          p.description,
                'features':             p.features,
                'requirements':         p.requirements,
                'min_amount':           str(p.min_amount),
                'max_amount':           str(p.max_amount),
                'min_duration_months':  p.min_duration_months,
                'max_duration_months':  p.max_duration_months,
                'interest_rate':        str(p.interest_rate),
                'origination_fee':      str(p.origination_fee),
                'min_score_required':   p.min_score_required,
                'is_active':            p.is_active,
            }
            for p in products
        ]
        return Response(data)


# ─────────────────────────────────────────────────────────────────────────────
# 4. Profil entreprise (pour l'interface entreprise)
# ─────────────────────────────────────────────────────────────────────────────

class EnterpriseProfileBankView(APIView):
    """GET /api/scoring/enterprise/bank-profile/ — infos du profil banque de l'entreprise"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        BankEnterprise, _, _, _ = _get_models()
        try:
            ent = BankEnterprise.objects.filter(user=request.user).first()
            if not ent:
                return Response({'has_bank_profile': False, 'message': 'Aucun profil bancaire. Contactez votre conseiller.'})

            return Response({
                'has_bank_profile':    True,
                'id':                  ent.id,
                'name':                ent.name,
                'legal_name':          ent.legal_name,
                'registration_number': ent.registration_number,
                'tax_id':              ent.tax_id,
                'enterprise_type':     ent.enterprise_type,
                'sector':              ent.sector,
                'email':               ent.email,
                'phone':               ent.phone,
                'city':                ent.city,
                'country':             ent.country,
                'teras_score':         ent.teras_score,
                'teras_band':          ent.teras_band,
                'crm_limit':           ent.crm_limit,
                'active_loans_count':  ent.active_loans_count,
                'total_borrowed':      str(ent.total_borrowed),
                'teras_account_email': ent.teras_account_email,
                'status':              ent.status,
                'join_date':           ent.join_date.isoformat() if ent.join_date else None,
            })
        except Exception as e:
            return Response({'error': str(e)}, status=500)


# ─────────────────────────────────────────────────────────────────────────────
# 5. Banque → envoyer message à une entreprise
# ─────────────────────────────────────────────────────────────────────────────

class BankSendEnterpriseMessageView(APIView):
    """POST /api/scoring/bank/send-enterprise-message/"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        _, _, _, BankMessage = _get_models()
        BankEnterprise, _, _, _ = _get_models()

        enterprise_id = request.data.get('enterprise_id')
        subject       = request.data.get('subject', '')
        body          = request.data.get('body', '')
        msg_type      = request.data.get('type', 'info')
        app_id        = request.data.get('related_application_id', '')

        if not enterprise_id or not subject or not body:
            return Response({'error': 'enterprise_id, subject, body requis'}, status=400)

        try:
            ent = BankEnterprise.objects.get(id=enterprise_id)
            if not ent.user:
                return Response({'error': "L'entreprise n'a pas de compte TERAS"}, status=400)

            BankMessage.objects.create(
                recipient=ent.user,
                message_type=msg_type,
                subject=subject,
                body=body,
                sender_name='TERAS Banque',
                related_application_id=app_id,
            )
            return Response({'success': True, 'message': f'Message envoyé à {ent.name}'})
        except BankEnterprise.DoesNotExist:
            return Response({'error': 'Entreprise introuvable'}, status=404)
        except Exception as e:
            return Response({'error': str(e)}, status=500)


# ─────────────────────────────────────────────────────────────────────────────
# Helper notification entreprise
# ─────────────────────────────────────────────────────────────────────────────

def notify_enterprise_application_status(application):
    """Notifie l'entreprise d'un changement de statut de sa demande."""
    try:
        if not application.enterprise or not application.enterprise.user:
            return
        _, _, _, BankMessage = _get_models()
        user    = application.enterprise.user
        product = application.product.name if application.product else 'financement'
        amount  = f"{float(application.requested_amount):,.0f} FCFA"

        if application.status == 'approved':
            BankMessage.objects.create(
                recipient=user,
                message_type='offer',
                subject=f'🎉 Votre demande de {product} est approuvée !',
                body=(
                    f"Excellente nouvelle ! Votre demande de financement {product} "
                    f"d'un montant de {amount} a été approuvée.\n\n"
                    f"Mensualité : {float(application.monthly_payment):,.0f} FCFA/mois\n"
                    f"Durée : {application.duration_months} mois\n\n"
                    f"Connectez-vous à votre espace TERAS Entreprise pour accepter l'offre."
                ),
                related_application_id=application.application_id,
            )
        elif application.status == 'rejected':
            BankMessage.objects.create(
                recipient=user,
                message_type='alert',
                subject=f'Demande de {product} — Décision',
                body=(
                    f"Après étude de votre dossier, nous ne pouvons pas accorder "
                    f"votre demande de {product} ({amount}).\n\n"
                    f"Motif : {application.rejection_reason or 'Critères non remplis.'}\n\n"
                    f"Contactez votre conseiller pour plus d'informations."
                ),
                related_application_id=application.application_id,
            )
    except Exception as e:
        print(f"notify_enterprise error: {e}")
