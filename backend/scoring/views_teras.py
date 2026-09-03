# backend/scoring/views_teras.py
"""
Vues pour le dashboard TERAS et l'upload de documents
✅ IMPORTS CORRIGÉS pour structure avec sous-modules
"""

from datetime import timedelta

from django.utils import timezone
from django.contrib.auth import get_user_model

from rest_framework import permissions, status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.views import APIView

from users.models import UploadedDocument
from users.serializers import UploadedDocumentSerializer

# ✅ CORRIGÉ : Import depuis models.py à la racine de scoring/
from .models import CreditScore, ScoreHistory
from .upload_utils import validate_upload, ALLOWED_FINANCIAL_EXTENSIONS

User = get_user_model()


# =========================
#   UPLOAD DOCUMENT
# =========================

class DocumentUploadView(APIView):
    """
    POST /api/documents/upload/

    Champs attendus:
      - file: fichier (pdf, jpg, png, etc.)
      - category: 'bank' | 'payslip' | 'other'
    """

    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, *args, **kwargs):
        file = request.FILES.get("file")
        category = request.data.get("category", UploadedDocument.CATEGORY_OTHER)

        if not file:
            return Response(
                {"detail": "Aucun fichier fourni."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        valid, err_response = validate_upload(file, allowed_extensions=ALLOWED_FINANCIAL_EXTENSIONS)
        if not valid:
            return err_response

        if category not in dict(UploadedDocument.CATEGORY_CHOICES):
            category = UploadedDocument.CATEGORY_OTHER

        # 1️⃣ On enregistre le document
        doc = UploadedDocument.objects.create(
            user=request.user,
            file=file,
            category=category,
            status="pending",
        )

        # 2️⃣ Simulation d'analyse automatique
        simulate_analysis_for_user(request.user, latest_doc=doc)

        # 3️⃣ On renvoie le doc + le dashboard à jour
        serialized_doc = UploadedDocumentSerializer(doc).data
        dashboard = build_dashboard_for_user(request.user)

        return Response(
            {
                "detail": "Document reçu et analyse simulée effectuée.",
                "document": serialized_doc,
                "dashboard": dashboard,
            },
            status=status.HTTP_201_CREATED,
        )


# =========================
#   DASHBOARD MON ESPACE
# =========================

class TerasDashboardView(APIView):
    """
    GET /api/teras/dashboard/

    Utilisé par le frontend MonEspace.tsx
    Retourne un objet:
      {
        score, scoreLabel, utilization, paymentsOnTime, creditAgeYears,
        history, recommendations, recentActivities, recentDocs, alerts, potentialScore
      }
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        data = build_dashboard_for_user(request.user)
        return Response(data, status=status.HTTP_200_OK)


# =========================
#   HELPERS
# =========================

def simulate_analysis_for_user(user: User, latest_doc: UploadedDocument | None = None) -> int | None:
    """
    Simulation simple pour tester le flux:
    - On regarde les documents de l'utilisateur
    - On calcule un score TERAS simulé
    - On met à jour le dernier document comme 'processed'
    - On enregistre un CreditScore + ScoreHistory

    ⚠️ Ce n'est PAS ton algo final, juste un mock propre pour la démo.
    """

    # Tous les docs de l'utilisateur
    docs = UploadedDocument.objects.filter(user=user)

    if not docs.exists():
        return None

    # Comptage par type
    bank_count = docs.filter(category=UploadedDocument.CATEGORY_BANK).count()
    payslip_count = docs.filter(category=UploadedDocument.CATEGORY_PAYSLIP).count()
    other_count = docs.filter(category=UploadedDocument.CATEGORY_OTHER).count()

    # Base: 580, puis on ajoute selon les pièces fournies
    score = 580
    if bank_count >= 1:
        score += 30
    if payslip_count >= 1:
        score += 30
    if bank_count + payslip_count >= 3:
        score += 20
    if other_count >= 1:
        score += 10

    # On borne le score
    score = max(520, min(850, score))

    # Marquer le dernier doc comme analysé
    if latest_doc:
        latest_doc.status = "processed"
        latest_doc.analysis_summary = (
            f"Document catégorisé '{latest_doc.category}'. "
            f"Pris en compte dans le calcul simulé du score TERAS ({score})."
        )
        latest_doc.save(update_fields=["status", "analysis_summary"])

    # Enregistrer le score dans CreditScore et ScoreHistory
    try:
        CreditScore.objects.create(
            user=user,
            score=score,
        )
    except Exception:
        # Si le modèle a des champs obligatoires en plus, adapter selon ton schema
        pass

    try:
        ScoreHistory.objects.create(
            user=user,
            score=score,
        )
    except Exception:
        pass

    return score


def build_dashboard_for_user(user: User) -> dict:
    """
    Construit l'objet dashboard utilisé par le frontend.
    Utilisé :
      - lors du GET /api/teras/dashboard/
      - après upload de document pour renvoyer un dashboard à jour
    """

    # ---- Score actuel ----
    latest_score = (
        CreditScore.objects.filter(user=user)
        .order_by("-id")
        .first()
    )

    score_value = getattr(latest_score, "score", None)

    score_label = None
    if score_value is not None:
        if score_value >= 760:
            score_label = "Excellent"
        elif score_value >= 700:
            score_label = "Très bon"
        elif score_value >= 640:
            score_label = "Correct"
        else:
            score_label = "À améliorer"

    # ---- Historique score ----
    history_qs = (
        ScoreHistory.objects.filter(user=user)
        .order_by("-id")[:6]
    )

    history = []
    for item in reversed(list(history_qs)):
        created = getattr(item, "created_at", None) or getattr(
            item, "timestamp", None
        ) or getattr(item, "date", None)
        label = created.strftime("%b") if created else ""
        history.append(
            {
                "label": label,
                "score": getattr(item, "score", 0),
            }
        )

    # ---- Documents récents ----
    docs_qs = (
        UploadedDocument.objects.filter(user=user)
        .order_by("-uploaded_at")[:5]
    )
    recent_docs = [
        {
            "id": d.id,
            "name": d.file.name.split("/")[-1],
            "date": d.uploaded_at.strftime("%d/%m/%Y"),
        }
        for d in docs_qs
    ]

    # ---- Activité récente ----
    activities = []
    if latest_score:
        created = getattr(latest_score, "created_at", None) or timezone.now()
        activities.append(
            {
                "id": "score-update",
                "label": "Score TERAS mis à jour",
                "detail": f"Nouveau score : {score_value}",
                "timeAgo": _time_ago(created),
            }
        )
    for d in docs_qs:
        activities.append(
            {
                "id": f"doc-{d.id}",
                "label": "Document analysé" if d.status == "processed" else "Document importé",
                "detail": d.file.name.split("/")[-1],
                "timeAgo": _time_ago(d.uploaded_at),
            }
        )

    # ---- Recommandations IA simulées ----
    recommendations = []
    potential_score = None

    if score_value is not None:
        if score_value < 700:
            recommendations.append(
                {
                    "id": 1,
                    "title": "Stabiliser vos flux bancaires",
                    "description": "Ajoutez au moins 3 mois de relevés bancaires consécutifs pour renforcer la confiance.",
                    "impactLabel": "+10 à +25 pts",
                }
            )
        if score_value < 760:
            recommendations.append(
                {
                    "id": 2,
                    "title": "Justifier vos revenus",
                    "description": "Téléversez vos bulletins de salaire ou justificatifs d'activité pour solidifier votre profil.",
                    "impactLabel": "+15 à +30 pts",
                }
            )
        potential_score = min(850, score_value + 40)

    # ---- Alertes simples ----
    alerts = []
    if score_value is not None and score_value < 640:
        alerts.append(
            {
                "id": "low-score",
                "label": "Votre score est en dessous du seuil optimal. Consultez vos recommandations IA.",
            }
        )
    if not docs_qs.exists():
        alerts.append(
            {
                "id": "no-docs",
                "label": "Aucun document récent. Ajoutez des relevés et bulletins pour améliorer la précision du score.",
            }
        )

    # ---- Placeholder pour d'autres indicateurs (à brancher plus tard) ----
    utilization = None
    paymentsOnTime = None
    creditAgeYears = None

    return {
        "score": score_value,
        "scoreLabel": score_label,
        "utilization": utilization,
        "paymentsOnTime": paymentsOnTime,
        "creditAgeYears": creditAgeYears,
        "history": history,
        "recommendations": recommendations,
        "recentActivities": activities,
        "recentDocs": recent_docs,
        "alerts": alerts,
        "potentialScore": potential_score,
    }


def _time_ago(dt):
    if not dt:
        return ""
    now = timezone.now()
    diff = now - dt
    if diff < timedelta(minutes=1):
        return "À l'instant"
    if diff < timedelta(hours=1):
        m = int(diff.seconds / 60)
        return f"Il y a {m} min"
    if diff < timedelta(days=1):
        h = int(diff.seconds / 3600)
        return f"Il y a {h} h"
    d = diff.days
    return f"Il y a {d} j"
