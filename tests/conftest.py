# tests/conftest.py
import pytest
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

@pytest.fixture
def user(db):
    u = User.objects.create_user(username="alice", password="pass1234")
    # profile via signal
    u.profile.teras_type = "basic"
    u.profile.region = "CEMAC"
    u.profile.save()
    return u

@pytest.fixture
def auth_client(user):
    client = APIClient()
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")
    return client
