#backend/scoring/views_kyc.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from .models import KYCRequest
from .upload_utils import validate_upload, ALLOWED_DOCUMENT_EXTENSIONS


class UserKYCSubmitView(APIView):
    """
    POST /api/scoring/user/kyc/submit/
    multipart/form-data:
      - document_type: id_card|passport|driver_license|other
      - document_file: file
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        doc_type = request.data.get("document_type", KYCRequest.DOC_ID_CARD)
        doc_file = request.FILES.get("document_file")

        if not doc_file:
            return Response({"error": "document_file requis (upload)"}, status=status.HTTP_400_BAD_REQUEST)

        valid, err_response = validate_upload(doc_file, allowed_extensions=ALLOWED_DOCUMENT_EXTENSIONS)
        if not valid:
            return err_response

        allowed = {c[0] for c in KYCRequest.DOCUMENT_CHOICES}
        if doc_type not in allowed:
            return Response(
                {"error": f"document_type invalide. Choix: {sorted(list(allowed))}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # éviter spam
        if KYCRequest.objects.filter(user=user, status=KYCRequest.STATUS_PENDING).exists():
            return Response({"error": "Une demande KYC est déjà en attente"}, status=status.HTTP_409_CONFLICT)

        kyc = KYCRequest.objects.create(
            user=user,
            document_type=doc_type,
            document_file=doc_file,
            status=KYCRequest.STATUS_PENDING,
        )

        return Response({
            "message": "Demande KYC soumise",
            "kyc": {
                "id": kyc.id,
                "status": kyc.status,
                "document_type": kyc.document_type,
                "submitted_at": kyc.submitted_at.isoformat(),
            }
        }, status=status.HTTP_201_CREATED)


class UserKYCStatusView(APIView):
    """GET /api/scoring/user/kyc/status/ - dernière demande"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        kyc = KYCRequest.objects.filter(user=request.user).order_by("-submitted_at").first()
        if not kyc:
            return Response({"kyc": None}, status=status.HTTP_200_OK)

        return Response({
            "kyc": {
                "id": kyc.id,
                "status": kyc.status,
                "document_type": kyc.document_type,
                "submitted_at": kyc.submitted_at.isoformat(),
                "reviewed_at": kyc.reviewed_at.isoformat() if kyc.reviewed_at else None,
                "rejection_reason": kyc.rejection_reason,
            }
        }, status=status.HTTP_200_OK)


class UserKYCListView(APIView):
    """GET /api/scoring/user/kyc/requests/ - liste des demandes"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = KYCRequest.objects.filter(user=request.user).order_by("-submitted_at")[:50]
        data = [{
            "id": k.id,
            "status": k.status,
            "document_type": k.document_type,
            "submitted_at": k.submitted_at.isoformat(),
            "reviewed_at": k.reviewed_at.isoformat() if k.reviewed_at else None,
            "rejection_reason": k.rejection_reason,
        } for k in qs]
        return Response({"count": len(data), "requests": data}, status=status.HTTP_200_OK)
