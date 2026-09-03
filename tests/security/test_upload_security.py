import pytest
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from scoring.models import KYCRequest, UserDocument


def authenticated_client(user):
    client = APIClient()
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
    return client


@pytest.fixture
def user(db):
    User = get_user_model()
    return User.objects.create_user(
        email="upload-probe@example.test",
        username="upload-probe",
        password="Str0ngTest!234",
        user_type="individual",
    )


@pytest.mark.django_db
def test_kyc_upload_rejects_html_payload(user):
    client = authenticated_client(user)
    payload = SimpleUploadedFile(
        "identity.html",
        b"<html><script>fetch('/token')</script></html>",
        content_type="text/html",
    )

    response = client.post(
        "/api/scoring/user/kyc/submit/",
        {
            "document_type": KYCRequest.DOC_ID_CARD,
            "document_file": payload,
        },
        format="multipart",
    )

    assert response.status_code in {400, 415}, response.data
    assert KYCRequest.objects.filter(user=user).count() == 0


@pytest.mark.django_db
def test_user_document_upload_rejects_mime_extension_mismatch(user):
    client = authenticated_client(user)
    payload = SimpleUploadedFile(
        "statement.pdf",
        b"<html><body>not a pdf</body></html>",
        content_type="text/html",
    )

    response = client.post(
        "/api/scoring/user/documents/upload/",
        {
            "category": "bank_statement",
            "file": payload,
        },
        format="multipart",
    )

    assert response.status_code in {400, 415}, response.data
    assert UserDocument.objects.filter(user=user, filename="statement.pdf").count() == 0
