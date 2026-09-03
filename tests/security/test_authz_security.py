import pytest
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from scoring.models import KYCRequest
from scoring.models_bank import BankMessage


PRIVILEGED_ROLES = ("admin", "bank", "government", "enterprise")


def authenticated_client(user):
    client = APIClient()
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
    return client


@pytest.fixture
def user_factory(db):
    def make_user(email, user_type="individual", password="Str0ngTest!234", **extra_fields):
        User = get_user_model()
        username = extra_fields.pop("username", email.split("@", 1)[0])
        return User.objects.create_user(
            email=email,
            username=username,
            password=password,
            user_type=user_type,
            **extra_fields,
        )

    return make_user


@pytest.mark.django_db
@pytest.mark.parametrize("requested_role", PRIVILEGED_ROLES)
def test_public_registration_cannot_self_assign_privileged_roles(requested_role):
    client = APIClient()

    response = client.post(
        "/api/auth/register/",
        {
            "email": f"{requested_role}.self-register@example.test",
            "password": "Str0ngTest!234",
            "first_name": "Privilege",
            "last_name": "Probe",
            "user_type": requested_role,
        },
        format="json",
    )

    assert response.status_code in {400, 403}, response.data

    User = get_user_model()
    created = User.objects.filter(email=f"{requested_role}.self-register@example.test").first()
    if created is not None:
        assert created.user_type == "individual"
        assert not created.is_staff
        assert not created.is_superuser


@pytest.mark.django_db
def test_individual_user_cannot_list_admin_users(user_factory):
    user_factory("victim@example.test")
    attacker = user_factory("attacker@example.test")
    client = authenticated_client(attacker)

    response = client.get("/api/scoring/admin/users/")

    assert response.status_code == 403


@pytest.mark.django_db
def test_individual_user_cannot_suspend_another_user(user_factory):
    victim = user_factory("victim@example.test")
    attacker = user_factory("attacker@example.test")
    client = authenticated_client(attacker)

    response = client.post(f"/api/scoring/admin/users/{victim.id}/suspend/", {}, format="json")

    victim.refresh_from_db()
    assert response.status_code == 403
    assert victim.is_active is True


@pytest.mark.django_db
def test_individual_user_cannot_approve_kyc_request(user_factory):
    owner = user_factory("kyc-owner@example.test")
    attacker = user_factory("attacker@example.test")
    kyc = KYCRequest.objects.create(
        user=owner,
        document_type=KYCRequest.DOC_ID_CARD,
        document_file=SimpleUploadedFile(
            "id-card.pdf",
            b"%PDF-1.4 minimal test content",
            content_type="application/pdf",
        ),
    )
    client = authenticated_client(attacker)

    response = client.post(f"/api/scoring/admin/kyc/requests/{kyc.id}/approve/", {}, format="json")

    kyc.refresh_from_db()
    assert response.status_code == 403
    assert kyc.status == KYCRequest.STATUS_PENDING
    assert kyc.reviewed_by is None


@pytest.mark.django_db
def test_individual_user_cannot_send_bank_message(user_factory):
    recipient = user_factory("recipient@example.test")
    attacker = user_factory("attacker@example.test")
    client = authenticated_client(attacker)

    response = client.post(
        "/api/scoring/bank/send-message/",
        {
            "recipient_email": recipient.email,
            "message_type": "offer",
            "subject": "Unauthorized offer",
            "body": "This message must not be accepted from a non-bank account.",
        },
        format="json",
    )

    assert response.status_code == 403
    assert BankMessage.objects.filter(recipient=recipient, subject="Unauthorized offer").count() == 0
