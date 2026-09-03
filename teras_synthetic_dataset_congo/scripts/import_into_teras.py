#!/usr/bin/env python3
"""
Importe le dataset synthetique TERAS dans la base locale Django.

Objectifs:
- creer/metre a jour 3 comptes banque de demonstration
- injecter les clients et entreprises via les vraies vues banque
- recuperer / stabiliser les identifiants de connexion exploitables
- exporter un recapitulatif JSON + XLSX des acces de demo
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from datetime import datetime
from decimal import Decimal
from pathlib import Path
from typing import Any

from openpyxl import Workbook


ROOT = Path(__file__).resolve().parents[1]
PROJECT_ROOT = ROOT.parent
SEEDS_DIR = ROOT / "seeds"

if str(PROJECT_ROOT / "backend") not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT / "backend"))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")

import django  # noqa: E402

django.setup()

from django.contrib.auth import get_user_model  # noqa: E402
from django.db import transaction  # noqa: E402
from django.utils import timezone  # noqa: E402
from rest_framework.test import APIClient, APIRequestFactory, force_authenticate  # noqa: E402

from scoring.models_bank import BankClient, BankEnterprise  # noqa: E402
from scoring.views_bank_part1 import bank_client_create, bank_enterprise_create  # noqa: E402
from users.models import Profile  # noqa: E402


User = get_user_model()


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Importer le dataset synthetique dans TERAS local")
    parser.add_argument("--seed-dir", type=Path, default=SEEDS_DIR, help="Dossier contenant les seeds JSON")
    parser.add_argument("--credentials-json", type=Path, default=SEEDS_DIR / "login_credentials.json", help="Sortie JSON des identifiants")
    parser.add_argument("--credentials-xlsx", type=Path, default=SEEDS_DIR / "login_credentials.xlsx", help="Sortie XLSX des identifiants")
    parser.add_argument("--reset-bank-passwords", action="store_true", help="Reinitialiser a chaque execution les mots de passe des comptes banque")
    return parser


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload: Any) -> None:
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def write_workbook(path: Path, sheets: dict[str, list[dict[str, Any]]], headers_by_sheet: dict[str, list[str]]) -> None:
    workbook = Workbook()
    first = True
    for sheet_name, rows in sheets.items():
        sheet = workbook.active if first else workbook.create_sheet(title=sheet_name)
        sheet.title = sheet_name
        first = False
        headers = headers_by_sheet[sheet_name]
        sheet.append(headers)
        for row in rows:
            sheet.append([row.get(header, "") for header in headers])
    workbook.save(path)


def slugify(value: str) -> str:
    value = value.lower().strip()
    value = re.sub(r"[àáâãäå]", "a", value)
    value = re.sub(r"[èéêë]", "e", value)
    value = re.sub(r"[ìíîï]", "i", value)
    value = re.sub(r"[òóôõö]", "o", value)
    value = re.sub(r"[ùúûü]", "u", value)
    value = re.sub(r"[çć]", "c", value)
    value = re.sub(r"[^a-z0-9]", "", value)
    return value


def demo_bank_password(bank_seed: dict[str, Any]) -> str:
    suffix = bank_seed["institution_code"].replace("-", "")[-6:].upper()
    return f"TerasBank@{suffix}"


def demo_client_password(client_seed: dict[str, Any]) -> str:
    suffix = re.sub(r"[^A-Za-z0-9]", "", client_seed["niu"])[-6:].upper()
    return f"TerasUser@{suffix}"


def demo_enterprise_password(company_seed: dict[str, Any]) -> str:
    suffix = re.sub(r"[^A-Za-z0-9]", "", company_seed["registration_number"])[-6:].upper()
    return f"TerasEnt@{suffix}"


def decimal_or_none(value: Any) -> Decimal | None:
    if value in (None, ""):
        return None
    return Decimal(str(value))


def update_profile_from_seed(profile: Profile, seed: dict[str, Any]) -> None:
    profile.phone_number = seed.get("phone")
    profile.address = seed.get("address")
    profile.city = seed.get("city")
    profile.country = seed.get("country")
    profile.latitude = decimal_or_none(seed.get("latitude"))
    profile.longitude = decimal_or_none(seed.get("longitude"))
    profile.location_source = "dataset-seed"
    profile.location_updated_at = timezone.now()
    profile.save()


def ensure_bank_user(bank_seed: dict[str, Any], reset_password: bool) -> tuple[User, dict[str, Any]]:
    password = demo_bank_password(bank_seed)
    user, created = User.objects.get_or_create(
        email=bank_seed["email"],
        defaults={
            "username": bank_seed["email"],
            "user_type": "bank",
            "first_name": bank_seed["bank_name"],
            "last_name": "",
            "company_name": bank_seed["bank_name"],
            "company_registration": bank_seed["institution_code"],
            "country": bank_seed["country"],
            "region": bank_seed["city"],
            "sector": "Banque",
            "is_active": True,
            "kyc_status": "approved",
        },
    )

    fields_to_update: list[str] = []
    desired_values = {
        "username": bank_seed["email"],
        "user_type": "bank",
        "first_name": bank_seed["bank_name"],
        "last_name": "",
        "company_name": bank_seed["bank_name"],
        "company_registration": bank_seed["institution_code"],
        "country": bank_seed["country"],
        "region": bank_seed["city"],
        "sector": "Banque",
        "is_active": True,
        "kyc_status": "approved",
    }
    for field, desired in desired_values.items():
        if getattr(user, field) != desired:
            setattr(user, field, desired)
            fields_to_update.append(field)

    if created or reset_password:
        user.set_password(password)
        fields_to_update.append("password")

    if fields_to_update:
        user.save(update_fields=list(dict.fromkeys(fields_to_update)))

    profile, _ = Profile.objects.get_or_create(user=user)
    update_profile_from_seed(profile, bank_seed)

    credential = {
        "profile_id": bank_seed["profile_id"],
        "profile_type": "bank",
        "bank_id": bank_seed["bank_id"],
        "display_name": bank_seed["bank_name"],
        "login_email": user.email,
        "password": password,
        "source": "bank_account",
        "status": "created" if created else "updated",
        "city": bank_seed["city"],
    }
    return user, credential


def build_client_payload(seed: dict[str, Any]) -> dict[str, Any]:
    return {
        "first_name": seed["first_name"],
        "last_name": seed["last_name"],
        "email": seed["email"],
        "phone": seed["phone"],
        "date_of_birth": seed["date_of_birth"],
        "niu": seed["niu"],
        "address": seed["address"],
        "city": seed["city"],
        "country": seed["country"],
        "occupation": seed["job_title"],
        "monthly_income": seed["monthly_income"],
    }


def build_company_payload(seed: dict[str, Any]) -> dict[str, Any]:
    return {
        "name": seed["company_name"],
        "legal_name": seed["legal_name"],
        "registration_number": seed["registration_number"],
        "tax_id": seed["tax_id"],
        "enterprise_type": seed["enterprise_type"],
        "sector": seed["sector"],
        "email": seed["email"],
        "phone": seed["phone"],
        "address": seed["address"],
        "city": seed["city"],
        "country": seed["country"],
        "annual_revenue": seed["annual_revenue"],
        "employees_count": seed["employees_count"],
    }


def call_bank_view(view_func, path: str, payload: dict[str, Any], bank_user: User):
    factory = APIRequestFactory()
    request = factory.post(path, payload, format="json")
    force_authenticate(request, user=bank_user)
    return view_func(request)


def ensure_linked_user_profile(seed: dict[str, Any], user: User | None) -> None:
    if user is None:
        return

    desired = {
        "username": user.email,
        "first_name": seed.get("first_name") or seed.get("company_name") or user.first_name,
        "last_name": seed.get("last_name", ""),
        "country": seed.get("country"),
        "region": seed.get("region") or seed.get("city"),
        "sector": seed.get("sector") or seed.get("job_title"),
        "user_type": seed["user_type"],
        "is_active": True,
    }
    updated_fields: list[str] = []
    for field, value in desired.items():
        if getattr(user, field) != value:
            setattr(user, field, value)
            updated_fields.append(field)

    if updated_fields:
        user.save(update_fields=updated_fields)

    profile, _ = Profile.objects.get_or_create(user=user)
    update_profile_from_seed(profile, seed)


def ensure_existing_client_credentials(client: BankClient, seed: dict[str, Any]) -> None:
    if client.user is None:
        demo_password = demo_client_password(seed)
        user_email = client.teras_account_email or f"{slugify(client.first_name)}.{slugify(client.last_name)}.{re.sub(r'[^A-Za-z0-9]', '', client.niu)[:6].lower()}@teras.cg"
        user, created = User.objects.get_or_create(
            email=user_email,
            defaults={
                "username": user_email,
                "user_type": "individual",
                "first_name": client.first_name,
                "last_name": client.last_name,
                "country": client.country,
                "region": client.city,
                "sector": client.occupation,
                "is_active": True,
            },
        )
        if created or not client.teras_account_password:
            user.set_password(demo_password)
            user.save(update_fields=["password"])
            client.teras_account_password = demo_password
        client.user = user
        client.teras_account_email = user.email
        client.save(update_fields=["user", "teras_account_email", "teras_account_password"])
    elif not client.teras_account_password:
        demo_password = demo_client_password(seed)
        client.user.set_password(demo_password)
        client.user.save(update_fields=["password"])
        client.teras_account_password = demo_password
        client.teras_account_email = client.user.email
        client.save(update_fields=["teras_account_email", "teras_account_password"])

    ensure_linked_user_profile(seed, client.user)


def ensure_existing_enterprise_credentials(enterprise: BankEnterprise, seed: dict[str, Any]) -> None:
    if enterprise.user is None:
        demo_password = demo_enterprise_password(seed)
        user_email = enterprise.teras_account_email or f"{slugify(enterprise.name)[:20]}.{re.sub(r'[^A-Za-z0-9]', '', enterprise.registration_number)[:6].lower()}@teras.cg"
        user, created = User.objects.get_or_create(
            email=user_email,
            defaults={
                "username": user_email,
                "user_type": "enterprise",
                "first_name": enterprise.name,
                "last_name": "",
                "company_name": enterprise.legal_name,
                "company_registration": enterprise.registration_number,
                "employee_count": enterprise.employees_count,
                "country": enterprise.country,
                "region": enterprise.city,
                "sector": enterprise.sector,
                "is_active": True,
            },
        )
        if created or not enterprise.teras_account_password:
            user.set_password(demo_password)
            user.save(update_fields=["password"])
            enterprise.teras_account_password = demo_password
        enterprise.user = user
        enterprise.teras_account_email = user.email
        enterprise.save(update_fields=["user", "teras_account_email", "teras_account_password"])
    elif not enterprise.teras_account_password:
        demo_password = demo_enterprise_password(seed)
        enterprise.user.set_password(demo_password)
        enterprise.user.save(update_fields=["password"])
        enterprise.teras_account_password = demo_password
        enterprise.teras_account_email = enterprise.user.email
        enterprise.save(update_fields=["teras_account_email", "teras_account_password"])

    ensure_linked_user_profile(seed, enterprise.user)


def sync_client_fields(client: BankClient, bank_user: User, seed: dict[str, Any]) -> None:
    client.bank_owner = bank_user
    client.first_name = seed["first_name"]
    client.last_name = seed["last_name"]
    client.phone = seed["phone"]
    client.date_of_birth = seed["date_of_birth"]
    client.niu = seed["niu"]
    client.address = seed["address"]
    client.city = seed["city"]
    client.country = seed["country"]
    client.occupation = seed["job_title"]
    client.monthly_income = Decimal(str(seed["monthly_income"]))
    client.status = "active"
    client.save()


def sync_enterprise_fields(enterprise: BankEnterprise, bank_user: User, seed: dict[str, Any]) -> None:
    enterprise.bank_owner = bank_user
    enterprise.name = seed["company_name"]
    enterprise.legal_name = seed["legal_name"]
    enterprise.registration_number = seed["registration_number"]
    enterprise.tax_id = seed["tax_id"]
    enterprise.enterprise_type = seed["enterprise_type"]
    enterprise.sector = seed["sector"]
    enterprise.phone = seed["phone"]
    enterprise.address = seed["address"]
    enterprise.city = seed["city"]
    enterprise.country = seed["country"]
    enterprise.annual_revenue = Decimal(str(seed["annual_revenue"]))
    enterprise.employees_count = int(seed["employees_count"])
    enterprise.status = "active"
    enterprise.save()


def import_client(seed: dict[str, Any], bank_user: User) -> tuple[BankClient, dict[str, Any]]:
    existing = BankClient.objects.filter(email=seed["email"]).first() or BankClient.objects.filter(niu=seed["niu"]).first()
    created = False
    if existing is None:
        response = call_bank_view(
            bank_client_create,
            "/api/scoring/bank/clients/create/",
            build_client_payload(seed),
            bank_user,
        )
        if response.status_code != 201:
            raise RuntimeError(f"Echec creation client {seed['profile_id']}: {response.status_code} {response.data}")
        existing = BankClient.objects.get(email=seed["email"])
        created = True
    else:
        sync_client_fields(existing, bank_user, seed)

    ensure_existing_client_credentials(existing, seed)

    credential = {
        "profile_id": seed["profile_id"],
        "profile_type": "individual",
        "bank_id": seed["bank_id"],
        "display_name": f"{existing.first_name} {existing.last_name}",
        "login_email": existing.teras_account_email or (existing.user.email if existing.user else ""),
        "password": existing.teras_account_password,
        "source": "auto_created_client_account" if created else "existing_client_account",
        "status": "created" if created else "reused",
        "city": existing.city,
    }
    return existing, credential


def import_company(seed: dict[str, Any], bank_user: User) -> tuple[BankEnterprise, dict[str, Any]]:
    existing = BankEnterprise.objects.filter(email=seed["email"]).first() or BankEnterprise.objects.filter(registration_number=seed["registration_number"]).first()
    created = False
    if existing is None:
        response = call_bank_view(
            bank_enterprise_create,
            "/api/scoring/bank/enterprises/create/",
            build_company_payload(seed),
            bank_user,
        )
        if response.status_code != 201:
            raise RuntimeError(f"Echec creation entreprise {seed['profile_id']}: {response.status_code} {response.data}")
        existing = BankEnterprise.objects.get(email=seed["email"])
        created = True
    else:
        sync_enterprise_fields(existing, bank_user, seed)

    ensure_existing_enterprise_credentials(existing, seed)

    credential = {
        "profile_id": seed["profile_id"],
        "profile_type": "enterprise",
        "bank_id": seed["bank_id"],
        "display_name": existing.name,
        "login_email": existing.teras_account_email or (existing.user.email if existing.user else ""),
        "password": existing.teras_account_password,
        "source": "auto_created_enterprise_account" if created else "existing_enterprise_account",
        "status": "created" if created else "reused",
        "city": existing.city,
    }
    return existing, credential


def verify_login(email: str, password: str) -> bool:
    client = APIClient()
    response = client.post("/api/auth/login/", {"email": email, "password": password}, format="json")
    return response.status_code == 200 and bool(response.data.get("access"))


def export_credentials(credentials: list[dict[str, Any]], json_path: Path, xlsx_path: Path) -> None:
    payload = {
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "credentials": credentials,
    }
    write_json(json_path, payload)

    headers = ["profile_id", "profile_type", "bank_id", "display_name", "login_email", "password", "source", "status", "city"]
    write_workbook(
        xlsx_path,
        {
            "Credentials": credentials,
            "Banks": [row for row in credentials if row["profile_type"] == "bank"],
            "Individuals": [row for row in credentials if row["profile_type"] == "individual"],
            "Enterprises": [row for row in credentials if row["profile_type"] == "enterprise"],
        },
        {
            "Credentials": headers,
            "Banks": headers,
            "Individuals": headers,
            "Enterprises": headers,
        },
    )


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()

    banks_seed = load_json(args.seed_dir / "banks_seed.json")
    users_seed = load_json(args.seed_dir / "users_seed.json")
    companies_seed = load_json(args.seed_dir / "companies_seed.json")

    bank_users: dict[str, User] = {}
    credentials: list[dict[str, Any]] = []

    for bank_seed in banks_seed:
        bank_user, bank_credential = ensure_bank_user(bank_seed, reset_password=args.reset_bank_passwords)
        bank_users[bank_seed["bank_id"]] = bank_user
        credentials.append(bank_credential)

    for user_seed in users_seed:
        bank_user = bank_users[user_seed["bank_id"]]
        _, credential = import_client(user_seed, bank_user)
        credentials.append(credential)

    for company_seed in companies_seed:
        bank_user = bank_users[company_seed["bank_id"]]
        _, credential = import_company(company_seed, bank_user)
        credentials.append(credential)

    credentials.sort(key=lambda item: item["profile_id"])
    export_credentials(credentials, args.credentials_json, args.credentials_xlsx)

    sample_bank = next(row for row in credentials if row["profile_type"] == "bank")
    sample_user = next(row for row in credentials if row["profile_type"] == "individual")
    sample_company = next(row for row in credentials if row["profile_type"] == "enterprise")

    checks = {
        "bank_login_ok": verify_login(sample_bank["login_email"], sample_bank["password"]),
        "user_login_ok": verify_login(sample_user["login_email"], sample_user["password"]),
        "enterprise_login_ok": verify_login(sample_company["login_email"], sample_company["password"]),
    }

    print("Import TERAS termine.")
    print(f"Banques: {len([row for row in credentials if row['profile_type'] == 'bank'])}")
    print(f"Utilisateurs: {len([row for row in credentials if row['profile_type'] == 'individual'])}")
    print(f"Entreprises: {len([row for row in credentials if row['profile_type'] == 'enterprise'])}")
    print(f"Fichier JSON: {args.credentials_json}")
    print(f"Fichier XLSX: {args.credentials_xlsx}")
    print(json.dumps(checks, ensure_ascii=False))
    if not all(checks.values()):
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
