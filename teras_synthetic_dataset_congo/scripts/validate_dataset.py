#!/usr/bin/env python3
"""
Validation structurelle du dataset synthetique TERAS Congo.
"""

from __future__ import annotations

import argparse
import csv
import json
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = ROOT / "dataset_config.json"


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Valider le dataset synthetique TERAS Congo")
    parser.add_argument("--strict", action="store_true", help="Verifie aussi les fichiers xlsx et les agrégats gouvernement")
    return parser


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def ensure(condition: bool, message: str, errors: list[str]) -> None:
    if not condition:
        errors.append(message)


def read_csv_rows(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def validate_required_paths(errors: list[str]) -> None:
    required = [
        ROOT / "README.md",
        ROOT / "DATASET_SUMMARY.md",
        ROOT / "IMPORT_PLAN.md",
        ROOT / "SCORE_LOGIC.md",
        ROOT / "TERAS_DATASET_EXECUTION_PLAN.md",
        ROOT / "dataset_config.json",
        ROOT / "mapping" / "profile_document_mapping.csv",
        ROOT / "mapping" / "profile_document_mapping.xlsx",
        ROOT / "mapping" / "bank_distribution_summary.xlsx",
        ROOT / "master-data" / "master_profiles.csv",
        ROOT / "master-data" / "master_profiles.json",
        ROOT / "master-data" / "master_profiles.xlsx",
        ROOT / "master-data" / "government_feed_preview.xlsx",
        ROOT / "government" / "congo_government_rollup.json",
        ROOT / "government" / "congo_government_rollup.xlsx",
        ROOT / "seeds" / "banks_seed.json",
        ROOT / "seeds" / "users_seed.json",
        ROOT / "seeds" / "companies_seed.json",
        ROOT / "seeds" / "combined_seed.json",
    ]
    for path in required:
        ensure(path.exists(), f"Fichier manquant: {path.relative_to(ROOT)}", errors)


def validate_counts(config: dict, banks: list[dict], users: list[dict], companies: list[dict], errors: list[str]) -> None:
    ensure(len(banks) == 3, "Le dataset doit contenir exactement 3 banques.", errors)
    ensure(len(users) == 30, "Le dataset doit contenir exactement 30 utilisateurs.", errors)
    ensure(len(companies) == 30, "Le dataset doit contenir exactement 30 entreprises.", errors)
    ensure(len(config["banks"]) >= 3, "La configuration doit definir au moins 3 banques.", errors)


def validate_unique_ids(banks: list[dict], users: list[dict], companies: list[dict], errors: list[str]) -> None:
    all_ids = [item["profile_id"] for item in banks + users + companies]
    ensure(len(all_ids) == len(set(all_ids)), "Collision detectee sur les profile_id.", errors)

    all_emails = [item["email"] for item in banks + users + companies]
    ensure(len(all_emails) == len(set(all_emails)), "Collision detectee sur les emails.", errors)


def validate_bank_distribution(users: list[dict], companies: list[dict], errors: list[str]) -> None:
    user_counts = Counter(item["bank_id"] for item in users)
    company_counts = Counter(item["bank_id"] for item in companies)
    for bank_id in ["bank_001", "bank_002", "bank_003"]:
        ensure(user_counts[bank_id] == 10, f"{bank_id} doit avoir 10 utilisateurs (actuel: {user_counts[bank_id]}).", errors)
        ensure(company_counts[bank_id] == 10, f"{bank_id} doit avoir 10 entreprises (actuel: {company_counts[bank_id]}).", errors)


def validate_locations(config: dict, users: list[dict], companies: list[dict], errors: list[str]) -> None:
    allowed_cities = {item["name"] for item in config["cities"]}
    for profile in users + companies:
        ensure(profile["city"] in allowed_cities, f"Ville hors perimetre Congo: {profile['profile_id']} -> {profile['city']}", errors)
        latitude = float(profile["latitude"])
        longitude = float(profile["longitude"])
        ensure(-5.5 <= latitude <= 3.5, f"Latitude hors plage Congo pour {profile['profile_id']}: {latitude}", errors)
        ensure(10.0 <= longitude <= 19.5, f"Longitude hors plage Congo pour {profile['profile_id']}: {longitude}", errors)


def validate_master_files(banks: list[dict], users: list[dict], companies: list[dict], errors: list[str]) -> None:
    master_rows = read_csv_rows(ROOT / "master-data" / "master_profiles.csv")
    expected_total = len(banks) + len(users) + len(companies)
    ensure(len(master_rows) == expected_total, f"master_profiles.csv doit contenir {expected_total} lignes (actuel: {len(master_rows)}).", errors)

    master_json = load_json(ROOT / "master-data" / "master_profiles.json")
    ensure(len(master_json.get("profiles", [])) == expected_total, "master_profiles.json ne contient pas le bon nombre de profils.", errors)


def validate_government_rollup(banks: list[dict], users: list[dict], companies: list[dict], errors: list[str]) -> None:
    payload = load_json(ROOT / "government" / "congo_government_rollup.json")
    expected_total = len(banks) + len(users) + len(companies)
    ensure(payload.get("summary", {}).get("profiles_total") == expected_total, "Le rollup gouvernement ne reflète pas le total de profils.", errors)
    ensure(payload.get("summary", {}).get("users") == len(users), "Le rollup gouvernement ne reflète pas le nombre d'utilisateurs.", errors)
    ensure(payload.get("summary", {}).get("companies") == len(companies), "Le rollup gouvernement ne reflète pas le nombre d'entreprises.", errors)


def validate_credentials_files(banks: list[dict], users: list[dict], companies: list[dict], errors: list[str]) -> None:
    json_path = ROOT / "seeds" / "login_credentials.json"
    xlsx_path = ROOT / "seeds" / "login_credentials.xlsx"
    if not json_path.exists() and not xlsx_path.exists():
        return

    ensure(json_path.exists(), "login_credentials.json est manquant alors qu'un export credentials est attendu.", errors)
    ensure(xlsx_path.exists(), "login_credentials.xlsx est manquant alors qu'un export credentials est attendu.", errors)
    if not json_path.exists():
        return

    payload = load_json(json_path)
    credentials = payload.get("credentials", [])
    expected_total = len(banks) + len(users) + len(companies)
    ensure(len(credentials) == expected_total, f"login_credentials.json doit contenir {expected_total} lignes (actuel: {len(credentials)}).", errors)

    profile_ids = [row.get("profile_id") for row in credentials]
    ensure(len(profile_ids) == len(set(profile_ids)), "Les profile_id des identifiants doivent etre uniques.", errors)
    for row in credentials:
        ensure(bool(row.get("login_email")), f"Email de connexion manquant pour {row.get('profile_id')}.", errors)
        ensure(bool(row.get("password")), f"Mot de passe manquant pour {row.get('profile_id')}.", errors)


def validate_generated_documents(config: dict, banks: list[dict], users: list[dict], companies: list[dict], errors: list[str]) -> None:
    manifests = list((ROOT / "users").glob("*/manifest.json")) + list((ROOT / "companies").glob("*/manifest.json")) + list((ROOT / "banks").glob("*/manifest.json"))
    if not manifests:
        return

    expected_profiles = {row["profile_id"] for row in banks + users + companies}
    found_profiles = {path.parent.name for path in manifests}
    ensure(found_profiles == expected_profiles, "Les manifests documentaires ne couvrent pas tous les profils attendus.", errors)

    mapping_rows = read_csv_rows(ROOT / "mapping" / "profile_document_mapping.csv")
    ensure(len(mapping_rows) > 0, "Le mapping documentaire ne doit pas etre vide lorsque des manifests existent.", errors)

    mapped_paths = {row["relative_path"] for row in mapping_rows}
    dirty_targets = {
        "user": set(config.get("document_quality", {}).get("dirty_user_scenarios", [])),
        "company": set(config.get("document_quality", {}).get("dirty_company_scenarios", [])),
    }
    dirty_found = {"user": 0, "company": 0}
    required_asset_docs = {
        "users": {"asset_declaration.pdf", "asset_inventory.xlsx"},
        "companies": {"asset_statement.pdf", "fixed_assets_register.xlsx"},
    }
    for manifest_path in manifests:
        payload = load_json(manifest_path)
        profile_id = payload["profile_id"]
        documents = payload.get("documents", [])
        ensure(len(documents) > 0, f"Aucun document declare dans {manifest_path.relative_to(ROOT)}", errors)
        ensure(payload.get("profile_quality") in {"clean", "dirty"}, f"profile_quality manquant ou invalide dans {manifest_path.relative_to(ROOT)}", errors)
        profile_folder_name = manifest_path.parent.parent.name
        if profile_folder_name in required_asset_docs:
            file_names = {document["file_name"] for document in documents}
            missing_assets = required_asset_docs[profile_folder_name] - file_names
            ensure(not missing_assets, f"Documents d'actifs manquants pour {profile_id}: {sorted(missing_assets)}", errors)
        for document in documents:
            relative_path = document["relative_path"]
            full_path = ROOT / relative_path
            ensure(full_path.exists(), f"Document manquant: {relative_path}", errors)
            ensure(relative_path in mapped_paths, f"Document absent du mapping: {relative_path}", errors)
            ensure(document.get("document_quality") in {"clean", "dirty"}, f"document_quality invalide pour {relative_path}", errors)
            ensure(isinstance(document.get("degradation_tags", []), list), f"degradation_tags doit etre une liste pour {relative_path}", errors)
            if document.get("document_quality") == "dirty":
                dirty_found[payload["profile_type"]] = dirty_found.get(payload["profile_type"], 0) + 1
        metadata_name = "profile.json" if manifest_path.parent.parent.name == "users" else "company_profile.json" if manifest_path.parent.parent.name == "companies" else "bank_profile.json"
        ensure((manifest_path.parent / metadata_name).exists(), f"Fichier metadata manquant pour {profile_id}", errors)

    scenario_map = {
        "user": {row["profile_id"]: row.get("scenario_id") for row in users},
        "company": {row["profile_id"]: row.get("scenario_id") for row in companies},
    }
    for manifest_path in manifests:
        payload = load_json(manifest_path)
        profile_type = payload["profile_type"]
        if profile_type not in {"user", "company"}:
            continue
        scenario_id = scenario_map[profile_type].get(payload["profile_id"])
        if scenario_id in dirty_targets[profile_type]:
            ensure(
                any(document.get("document_quality") == "dirty" for document in payload.get("documents", [])),
                f"Profil cible dirty sans document dirty: {payload['profile_id']}",
                errors,
            )


def validate_upload_results(errors: list[str]) -> None:
    json_path = ROOT / "seeds" / "upload_results.json"
    xlsx_path = ROOT / "seeds" / "upload_results.xlsx"
    if not json_path.exists() and not xlsx_path.exists():
        return

    ensure(json_path.exists(), "upload_results.json est manquant alors qu'un journal d'upload est attendu.", errors)
    ensure(xlsx_path.exists(), "upload_results.xlsx est manquant alors qu'un journal d'upload est attendu.", errors)
    if not json_path.exists():
        return

    payload = load_json(json_path)
    results = payload.get("results", [])
    summary = payload.get("summary", {})
    ensure(len(results) > 0, "upload_results.json ne doit pas etre vide.", errors)
    uploaded_total = sum(1 for row in results if row.get("status") in {"uploaded", "skipped", "dry-run"})
    ensure(uploaded_total > 0, "Le journal d'upload doit contenir au moins une action exploitable.", errors)
    ensure(summary.get("profiles", 0) >= 0, "Le resume d'upload doit contenir un compteur de profils.", errors)


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()

    errors: list[str] = []
    validate_required_paths(errors)
    if errors:
        print("Validation echee.")
        for error in errors:
            print(f"- {error}")
        return 1

    config = load_json(CONFIG_PATH)
    banks = load_json(ROOT / "seeds" / "banks_seed.json")
    users = load_json(ROOT / "seeds" / "users_seed.json")
    companies = load_json(ROOT / "seeds" / "companies_seed.json")

    validate_counts(config, banks, users, companies, errors)
    validate_unique_ids(banks, users, companies, errors)
    validate_bank_distribution(users, companies, errors)
    validate_locations(config, users, companies, errors)
    validate_master_files(banks, users, companies, errors)
    validate_credentials_files(banks, users, companies, errors)
    validate_generated_documents(config, banks, users, companies, errors)
    validate_upload_results(errors)

    if args.strict:
        validate_government_rollup(banks, users, companies, errors)

    if errors:
        print("Validation echee.")
        for error in errors:
            print(f"- {error}")
        return 1

    print("Validation dataset OK.")
    print(f"Banques: {len(banks)} | Utilisateurs: {len(users)} | Entreprises: {len(companies)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
