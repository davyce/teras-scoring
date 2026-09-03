#!/usr/bin/env python3
"""
audit_register.py — Audit complet du processus d'inscription TERAS
Exécuter depuis la racine du projet : python audit_register.py
"""
import os, sys, json, requests

sys.path.insert(0, 'backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

import django
django.setup()

BASE = "http://localhost:8000/api"
PASS = "Test1234!"
RESULTS = []

def check(label, ok, detail=""):
    status = "✅" if ok else "❌"
    print(f"  {status} {label}" + (f" — {detail}" if detail else ""))
    RESULTS.append({"label": label, "ok": ok, "detail": detail})
    return ok

print("\n" + "="*60)
print("AUDIT PROCESSUS INSCRIPTION TERAS")
print("="*60)

# ── 1. Modèle User ─────────────────────────────────────────────
print("\n[1] Modèle User")
from django.contrib.auth import get_user_model
User = get_user_model()

fields = {f.name for f in User._meta.get_fields() if hasattr(f, 'name')}
required_fields = ['email', 'user_type', 'first_name', 'last_name', 'phone',
                   'country', 'region', 'address', 'is_active']

for f in required_fields:
    check(f"Champ '{f}' existe", f in fields)

user_types = [c[0] for c in User._meta.get_field('user_type').choices] \
    if hasattr(User._meta.get_field('user_type'), 'choices') else []
check("Types utilisateur définis", len(user_types) > 0, str(user_types))
check("Type 'individual' présent", 'individual' in user_types)
check("Type 'enterprise' présent", 'enterprise' in user_types)
check("Type 'bank' présent",       'bank' in user_types)
check("Type 'government' présent", 'government' in user_types)
check("Type 'admin' présent",      'admin' in user_types)

# ── 2. Endpoints auth ──────────────────────────────────────────
print("\n[2] Endpoints d'authentification")

# Register individuel
try:
    r = requests.post(f"{BASE}/auth/register/", json={
        "email": f"test_audit_{os.getpid()}@teras.cd",
        "password": PASS,
        "user_type": "individual",
        "first_name": "Audit",
        "last_name": "Test",
    }, timeout=5)
    check("POST /auth/register/ répond", r.status_code in (200, 201, 400),
          f"Status {r.status_code}")

    if r.status_code in (200, 201):
        data = r.json()
        check("Retourne access token", 'access' in data or 'tokens' in data)
        check("Retourne user info",    'user' in data)
        if 'user' in data:
            check("user.user_type présent", 'user_type' in data['user'])
            check("user_type = individual", data['user'].get('user_type') == 'individual')
        test_email = f"test_audit_{os.getpid()}@teras.cd"
    else:
        check("Erreur register", False, r.text[:100])
        test_email = None
except Exception as e:
    check("POST /auth/register/ accessible", False, str(e))
    test_email = None

# Register entreprise
try:
    r = requests.post(f"{BASE}/auth/register/", json={
        "email": f"test_ent_{os.getpid()}@teras.cd",
        "password": PASS,
        "user_type": "enterprise",
        "first_name": "Entreprise",
        "last_name": "Test",
        "company_name": "Test SARL",
    }, timeout=5)
    check("Register type 'enterprise' fonctionne", r.status_code in (200, 201),
          f"Status {r.status_code}")
except Exception as e:
    check("Register entreprise", False, str(e))

# Login
try:
    r = requests.post(f"{BASE}/auth/login/", json={
        "email": "jean@teras.cd", "password": "jean1234!"
    }, timeout=5)
    check("POST /auth/login/ répond", r.status_code == 200, f"Status {r.status_code}")
    if r.status_code == 200:
        data   = r.json()
        token  = data.get('access')
        check("Login retourne access token",  bool(token))
        check("Login retourne refresh token", bool(data.get('refresh')))
        check("Login retourne user.user_type",bool(data.get('user', {}).get('user_type')))
except Exception as e:
    check("POST /auth/login/ accessible", False, str(e))
    token = None

# /me/
if token:
    try:
        r = requests.get(f"{BASE}/auth/me/",
            headers={"Authorization": f"Bearer {token}"}, timeout=5)
        check("GET /auth/me/ fonctionne", r.status_code == 200, f"Status {r.status_code}")
        if r.status_code == 200:
            me = r.json()
            check("me.email présent",     bool(me.get('email')))
            check("me.user_type présent", bool(me.get('user_type')))
            check("me.first_name présent",bool(me.get('first_name')) or me.get('first_name') == '')
    except Exception as e:
        check("GET /auth/me/", False, str(e))

# ── 3. Champs manquants dans Register ──────────────────────────
print("\n[3] Champs du formulaire d'inscription")

# Tester avec champs complets
try:
    r = requests.post(f"{BASE}/auth/register/", json={
        "email": f"full_test_{os.getpid()}@teras.cd",
        "password": PASS,
        "user_type": "individual",
        "first_name": "Marie",
        "last_name":  "Ngouabi",
        "phone":      "+242 06 123 4567",
        "country":    "CG",
        "city":       "Brazzaville",
        "address":    "Bacongo, Brazzaville",
    }, timeout=5)
    check("Register avec phone/country/city accepté",
          r.status_code in (200, 201), f"Status {r.status_code}: {r.text[:80]}")
except Exception as e:
    check("Register champs complets", False, str(e))

# ── 4. RoleBasedRedirect ───────────────────────────────────────
print("\n[4] Redirection après login")

roles_redirects = {
    'individual':  '/mon-espace',
    'enterprise':  '/enterprise/dashboard',
    'bank':        '/bank/dashboard',
    'government':  '/government/dashboard',
    'admin':       '/admin/dashboard',
}
from users.models import CustomUser if hasattr(django, '_') else None
try:
    from users.models import CustomUser
    for utype, expected_path in roles_redirects.items():
        users_of_type = User.objects.filter(user_type=utype, is_active=True).first()
        check(f"Un user '{utype}' existe en base", bool(users_of_type),
              users_of_type.email if users_of_type else "MANQUANT")
except Exception as e:
    check("Vérification users par type", False, str(e))

# ── 5. Password validation ─────────────────────────────────────
print("\n[5] Validation mot de passe")

try:
    r = requests.post(f"{BASE}/auth/register/", json={
        "email": f"weak_{os.getpid()}@teras.cd",
        "password": "123",
        "user_type": "individual",
    }, timeout=5)
    check("Mot de passe trop court refusé", r.status_code == 400,
          f"Status {r.status_code}")
except Exception as e:
    check("Validation password", False, str(e))

# ── RÉSUMÉ ─────────────────────────────────────────────────────
print("\n" + "="*60)
total  = len(RESULTS)
passed = sum(1 for r in RESULTS if r['ok'])
failed = total - passed
print(f"RÉSUMÉ : {passed}/{total} checks OK — {failed} problème(s)")
print("="*60)

if failed:
    print("\nProblèmes à corriger :")
    for r in RESULTS:
        if not r['ok']:
            print(f"  ❌ {r['label']}" + (f" ({r['detail']})" if r['detail'] else ""))
