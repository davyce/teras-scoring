# tests/test_teras_api.py
import pytest

@pytest.mark.django_db
def test_config_put_get(auth_client):
    payload = {
        "weights": {"T":0.28,"E":0.18,"R":0.22,"A":0.20,"S":0.12},
        "ranges": {
            "transactions":[0,200000],
            "epargne":[0,60000],
            "revenus":[0,250000],
            "actifs":[0,1500000],
            "social":[0,1],
        }
    }
    r = auth_client.put("/api/config/", payload, format="json")
    assert r.status_code == 200
    r2 = auth_client.get("/api/config/")
    assert r2.status_code == 200
    assert r2.json()["weights"]["T"] == 0.28

@pytest.mark.django_db
def test_evaluate_and_get_score(auth_client, user):
    sample = {
        "transactions": 120000,
        "epargne": 15000,
        "revenus": 90000,
        "actifs": 300000,
        "social": 0.8
    }
    r = auth_client.post("/api/evaluate/", sample, format="json")
    assert r.status_code == 200
    assert "score" in r.json()
    r2 = auth_client.get(f"/api/score/{user.id}/")
    assert r2.status_code == 200
    assert "score" in r2.json()

@pytest.mark.django_db
def test_switch_mode(auth_client):
    r = auth_client.patch("/api/teras/mode/", {"teras_type": "regional", "region": "UEMOA"}, format="json")
    assert r.status_code == 200
    data = r.json()
    assert data["teras_type"] == "regional"
    assert data["region"] == "UEMOA"
