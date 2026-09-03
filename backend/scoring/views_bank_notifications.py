# backend/scoring/views_bank_notifications.py
"""
Endpoints côté CLIENT pour :
  - Voir les messages/notifications envoyés par la banque
  - Suivre ses demandes de crédit
  - Accepter / décliner une offre approuvée

Routes (à ajouter dans urls.py sous /api/scoring/user/) :
  GET  /api/scoring/user/bank-messages/           → liste messages banque
  POST /api/scoring/user/bank-messages/<id>/read/ → marquer lu
  GET  /api/scoring/user/my-applications/         → mes demandes de crédit
  POST /api/scoring/user/my-applications/<id>/accept/ → accepter une offre
"""

import os
import requests
from datetime import datetime
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

ANTHROPIC_HEADERS = {
    "x-api-key":         os.environ.get("ANTHROPIC_API_KEY", ""),
    "content-type":      "application/json",
    "anthropic-version": "2023-06-01",
}


# ─────────────────────────────────────────────────────────────────────────────
# Modèle BankMessage (créé à la volée si pas encore en DB)
# ─────────────────────────────────────────────────────────────────────────────

def _get_or_create_message_model():
    """Import lazy pour éviter les erreurs si la migration n'est pas faite."""
    try:
        from scoring.models_bank import BankMessage
        return BankMessage
    except ImportError:
        return None


# ─────────────────────────────────────────────────────────────────────────────
# 1. Messages banque → client
# ─────────────────────────────────────────────────────────────────────────────

class ClientBankMessagesView(APIView):
    """GET /api/scoring/user/bank-messages/ — messages reçus de la banque"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        BankMessage = _get_or_create_message_model()
        if not BankMessage:
            return Response({"messages": [], "unread_count": 0})

        msgs = BankMessage.objects.filter(
            recipient=request.user
        ).order_by("-created_at")[:50]

        data = [
            {
                "id":         m.id,
                "type":       m.message_type,
                "subject":    m.subject,
                "body":       m.body,
                "is_read":    m.is_read,
                "created_at": m.created_at.isoformat(),
                "sender_name": m.sender_name or "TERAS Banque",
                "related_application_id": m.related_application_id,
            }
            for m in msgs
        ]
        unread = sum(1 for m in data if not m["is_read"])
        return Response({"messages": data, "unread_count": unread})


class ClientMarkMessageReadView(APIView):
    """POST /api/scoring/user/bank-messages/<id>/read/"""
    permission_classes = [IsAuthenticated]

    def post(self, request, message_id):
        BankMessage = _get_or_create_message_model()
        if not BankMessage:
            return Response({"success": True})
        try:
            m = BankMessage.objects.get(id=message_id, recipient=request.user)
            m.is_read = True
            m.save(update_fields=["is_read"])
            return Response({"success": True})
        except Exception as e:
            return Response({"error": str(e)}, status=404)


class ClientMarkAllReadView(APIView):
    """POST /api/scoring/user/bank-messages/read-all/"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        BankMessage = _get_or_create_message_model()
        if BankMessage:
            BankMessage.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
        return Response({"success": True})


# ─────────────────────────────────────────────────────────────────────────────
# 2. Demandes de crédit du client
# ─────────────────────────────────────────────────────────────────────────────

class ClientMyApplicationsView(APIView):
    """GET /api/scoring/user/my-applications/ — demandes de crédit du client connecté"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            from scoring.models_bank import LoanApplication, BankClient

            # Chercher le profil BankClient lié à ce user
            client_profiles = BankClient.objects.filter(user=request.user)
            if not client_profiles.exists():
                return Response({"applications": [], "summary": {}})

            client = client_profiles.first()
            apps = LoanApplication.objects.filter(client=client).order_by("-created_at")

            data = []
            for a in apps:
                data.append({
                    "id":                         a.id,
                    "application_id":             a.application_id,
                    "product_name":               a.product.name if a.product else "—",
                    "product_type":               a.product.product_type if a.product else "—",
                    "requested_amount":           str(a.requested_amount),
                    "duration_months":            a.duration_months,
                    "monthly_payment":            str(a.monthly_payment),
                    "total_repayment":            str(a.total_repayment),
                    "interest_rate":              str(a.product.interest_rate) if a.product else "0",
                    "purpose":                    a.purpose,
                    "status":                     a.status,
                    "teras_score_at_application": a.teras_score_at_application,
                    "risk_level":                 a.risk_level,
                    "rejection_reason":           a.rejection_reason,
                    "reviewed_at":                a.reviewed_at.isoformat() if a.reviewed_at else None,
                    "created_at":                 a.created_at.isoformat(),
                    "features":                   a.product.features if a.product else [],
                })

            summary = {
                "total":    len(data),
                "pending":  sum(1 for a in data if a["status"] == "pending"),
                "approved": sum(1 for a in data if a["status"] in ("approved", "disbursed")),
                "rejected": sum(1 for a in data if a["status"] == "rejected"),
                "active":   sum(1 for a in data if a["status"] == "disbursed"),
            }
            return Response({"applications": data, "summary": summary})

        except Exception as e:
            return Response({"error": str(e), "applications": [], "summary": {}},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ClientAcceptApplicationView(APIView):
    """
    POST /api/scoring/user/my-applications/<id>/accept/
    Le client accepte une offre approuvée → passe en 'disbursed'
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, application_id):
        try:
            from scoring.models_bank import LoanApplication, BankClient

            client = BankClient.objects.filter(user=request.user).first()
            if not client:
                return Response({"error": "Profil client non trouvé"}, status=404)

            app = LoanApplication.objects.get(id=application_id, client=client)

            if app.status != "approved":
                return Response({"error": f"Impossible d'accepter une demande avec le statut '{app.status}'"}, status=400)

            app.status      = "disbursed"
            app.reviewed_at = timezone.now()
            app.save(update_fields=["status", "reviewed_at"])

            # Créer un message de confirmation
            _send_system_message(
                recipient=request.user,
                message_type="info",
                subject="Crédit accepté — virement en cours !",
                body=(
                    f"Félicitations ! Votre crédit de {app.requested_amount:,.0f} FCFA "
                    f"({app.product.name}) a été accepté. Les fonds seront virés sur votre compte sous 24–48h.\n\n"
                    f"Mensualité : {app.monthly_payment:,.0f} FCFA/mois pendant {app.duration_months} mois.\n"
                    f"Premier remboursement dans 30 jours."
                ),
                related_application_id=app.application_id,
            )

            return Response({"success": True, "status": "disbursed",
                             "message": "Crédit accepté. Décaissement en cours."})

        except LoanApplication.DoesNotExist:
            return Response({"error": "Demande introuvable"}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=500)


class ClientDeclineApplicationView(APIView):
    """POST /api/scoring/user/my-applications/<id>/decline/"""
    permission_classes = [IsAuthenticated]

    def post(self, request, application_id):
        try:
            from scoring.models_bank import LoanApplication, BankClient
            client = BankClient.objects.filter(user=request.user).first()
            if not client:
                return Response({"error": "Profil client non trouvé"}, status=404)

            app = LoanApplication.objects.get(id=application_id, client=client)
            if app.status not in ("approved", "pending"):
                return Response({"error": f"Statut '{app.status}' non modifiable"}, status=400)

            app.status           = "cancelled"
            app.rejection_reason = request.data.get("reason", "Refus par le client")
            app.reviewed_at      = timezone.now()
            app.save(update_fields=["status", "rejection_reason", "reviewed_at"])

            return Response({"success": True, "status": "cancelled"})
        except LoanApplication.DoesNotExist:
            return Response({"error": "Demande introuvable"}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=500)


# ─────────────────────────────────────────────────────────────────────────────
# 3. Endpoint banque → envoyer un message à un client
# ─────────────────────────────────────────────────────────────────────────────

class BankSendMessageView(APIView):
    """
    POST /api/scoring/bank/send-message/
    Utilisé par le modal "Envoyer un message" dans BankClientDetail
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from django.contrib.auth import get_user_model
        User = get_user_model()

        recipient_email = request.data.get("recipient_email")
        subject         = request.data.get("subject", "")
        body            = request.data.get("body", "")
        message_type    = request.data.get("type", "info")
        app_id          = request.data.get("related_application_id", "")

        if not recipient_email or not subject or not body:
            return Response({"error": "recipient_email, subject et body sont requis"}, status=400)

        try:
            recipient = User.objects.get(email=recipient_email)
        except User.DoesNotExist:
            # Essayer via BankClient
            try:
                from scoring.models_bank import BankClient
                bc = BankClient.objects.get(email=recipient_email)
                if bc.user:
                    recipient = bc.user
                else:
                    return Response({"error": "Client sans compte TERAS"}, status=404)
            except Exception:
                return Response({"error": f"Destinataire {recipient_email} introuvable"}, status=404)

        _send_system_message(
            recipient=recipient,
            message_type=message_type,
            subject=subject,
            body=body,
            sender_name=f"TERAS Banque",
            related_application_id=app_id,
        )
        return Response({"success": True, "message": f"Message envoyé à {recipient_email}"})


# ─────────────────────────────────────────────────────────────────────────────
# Helper interne
# ─────────────────────────────────────────────────────────────────────────────

def _send_system_message(recipient, message_type: str, subject: str, body: str,
                         sender_name: str = "TERAS Banque",
                         related_application_id: str = ""):
    """Crée un BankMessage en DB."""
    try:
        from scoring.models_bank import BankMessage
        BankMessage.objects.create(
            recipient=recipient,
            message_type=message_type,
            subject=subject,
            body=body,
            sender_name=sender_name,
            related_application_id=related_application_id,
        )
    except Exception as e:
        print(f"_send_system_message error: {e}", flush=True)


# ─────────────────────────────────────────────────────────────────────────────
# 4. Notifications auto lors d'un changement de statut (signal helper)
# ─────────────────────────────────────────────────────────────────────────────

def notify_application_status_change(application):
    """
    Appelé depuis bank_application_review pour notifier le client.
    """
    target_user = None
    is_enterprise = False

    if application.client and application.client.user:
        target_user = application.client.user
    elif application.enterprise and application.enterprise.user:
        target_user = application.enterprise.user
        is_enterprise = True

    if not target_user:
        return

    product = application.product.name if application.product else "crédit"
    amount  = f"{application.requested_amount:,.0f} FCFA"
    workspace_label = "TERAS Entreprise" if is_enterprise else "TERAS"

    if application.status == "approved":
        _send_system_message(
            recipient=target_user,
            message_type="offer",
            subject=f"🎉 Votre demande de {product} est approuvée !",
            body=(
                f"Bonne nouvelle ! Votre demande de {product} d'un montant de {amount} "
                f"a été approuvée par notre équipe.\n\n"
                f"Mensualité : {application.monthly_payment:,.0f} FCFA/mois\n"
                f"Durée : {application.duration_months} mois\n\n"
                f"Connectez-vous à votre espace {workspace_label} pour accepter l'offre et déclencher le décaissement."
            ),
            related_application_id=application.application_id,
        )
    elif application.status == "rejected":
        reason = application.rejection_reason or "Critères d'éligibilité non remplis."
        _send_system_message(
            recipient=target_user,
            message_type="alert",
            subject=f"Votre demande de {product} n'a pas pu être acceptée",
            body=(
                f"Après étude de votre dossier, nous ne sommes pas en mesure d'accorder "
                f"votre demande de {product} de {amount}.\n\n"
                f"Motif : {reason}\n\n"
                f"Pour améliorer votre score TERAS et accéder à nos produits, "
                f"consultez les recommandations de votre espace TERAS.\n\n"
                f"Cordialement,\nL'équipe TERAS Banque"
            ),
            related_application_id=application.application_id,
        )


class ClientRequestApplicationView(APIView):
    """
    POST /api/scoring/user/my-applications/request/
    Le client connecté soumet lui-même une demande de crédit
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            from scoring.models_bank import BankClient, FinancialProduct, LoanApplication
            from decimal import Decimal

            product_id       = request.data.get("product_id")
            requested_amount = request.data.get("requested_amount")
            duration_months  = request.data.get("duration_months")
            purpose          = request.data.get("purpose", "")

            if not all([product_id, requested_amount, duration_months, purpose]):
                return Response({"error": "product_id, requested_amount, duration_months et purpose requis"}, status=400)

            product = FinancialProduct.objects.get(id=product_id, is_active=True)

            # Chercher ou créer un profil BankClient
            client = BankClient.objects.filter(user=request.user).first()
            if not client:
                # Créer un profil minimal
                client = BankClient.objects.create(
                    user=request.user,
                    first_name=request.user.first_name or request.user.email.split("@")[0],
                    last_name=request.user.last_name or "",
                    email=request.user.email,
                    phone=getattr(request.user, "phone", ""),
                    date_of_birth="1990-01-01",
                    niu=f"AUTO-{request.user.id}",
                    address="À compléter",
                    city="Brazzaville",
                    bank_owner=product.bank_owner,
                )
            elif client.bank_owner_id is None and product.bank_owner_id is not None:
                client.bank_owner = product.bank_owner
                client.save(update_fields=["bank_owner"])

            if (
                client.bank_owner_id is not None
                and product.bank_owner_id is not None
                and client.bank_owner_id != product.bank_owner_id
            ):
                return Response(
                    {"error": "Ce produit n'est pas rattaché à votre banque actuelle."},
                    status=400,
                )

            # Calculer mensualité
            rate   = float(product.interest_rate) / 100 / 12
            n      = int(duration_months)
            amount = float(requested_amount)
            monthly = amount * (rate * (1+rate)**n) / ((1+rate)**n - 1) if rate > 0 else amount / n

            app = LoanApplication.objects.create(
                applicant_type="individual",
                client=client,
                product=product,
                requested_amount=Decimal(str(requested_amount)),
                duration_months=n,
                purpose=purpose,
                monthly_payment=Decimal(str(round(monthly, 2))),
                total_repayment=Decimal(str(round(monthly * n, 2))),
                teras_score_at_application=client.teras_score,
                status="pending",
                bank_owner=client.bank_owner or product.bank_owner,
            )

            return Response({
                "success": True,
                "application_id": app.application_id,
                "message": "Votre demande a été transmise à votre conseiller bancaire.",
            })

        except FinancialProduct.DoesNotExist:
            return Response({"error": "Produit introuvable"}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=500)
