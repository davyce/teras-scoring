#!/usr/bin/env python3
"""
Generateur principal du dataset synthetique TERAS Congo.

Cette etape genere les profils maitres et les fichiers de seed, sans encore
produire les documents PDF/PNG/JPG detailes.
"""

from __future__ import annotations

import argparse
import csv
import json
import random
from collections import Counter
from dataclasses import dataclass
from datetime import date, datetime
from pathlib import Path
from typing import Any

from openpyxl import Workbook


ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = ROOT / "dataset_config.json"


@dataclass
class City:
    name: str
    region: str
    latitude: float
    longitude: float
    neighbourhoods: list[str]
    roads: list[str]


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Generer le dataset synthetique TERAS Congo")
    parser.add_argument("--seed", type=int, default=242, help="Seed pseudo-aleatoire reproductible")
    parser.add_argument("--users", type=int, default=30, help="Nombre de profils utilisateurs")
    parser.add_argument("--companies", type=int, default=30, help="Nombre de profils entreprises")
    parser.add_argument("--banks", type=int, default=3, help="Nombre de banques fictives")
    parser.add_argument("--config", type=Path, default=CONFIG_PATH, help="Chemin du fichier de configuration JSON")
    parser.add_argument("--docs-only", action="store_true", help="Reserve pour generation documentaire ulterieure")
    parser.add_argument("--import-only", action="store_true", help="Reserve pour l'import ulterieur dans TERAS")
    parser.add_argument("--force", action="store_true", help="Ecraser les fichiers existants sans protection supplementaire")
    return parser


def load_config(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def slugify(value: str) -> str:
    mapping = str.maketrans({
        "a": "a",
        "b": "b",
        "c": "c",
        "d": "d",
        "e": "e",
        "f": "f",
        "g": "g",
        "h": "h",
        "i": "i",
        "j": "j",
        "k": "k",
        "l": "l",
        "m": "m",
        "n": "n",
        "o": "o",
        "p": "p",
        "q": "q",
        "r": "r",
        "s": "s",
        "t": "t",
        "u": "u",
        "v": "v",
        "w": "w",
        "x": "x",
        "y": "y",
        "z": "z",
        "A": "a",
        "B": "b",
        "C": "c",
        "D": "d",
        "E": "e",
        "F": "f",
        "G": "g",
        "H": "h",
        "I": "i",
        "J": "j",
        "K": "k",
        "L": "l",
        "M": "m",
        "N": "n",
        "O": "o",
        "P": "p",
        "Q": "q",
        "R": "r",
        "S": "s",
        "T": "t",
        "U": "u",
        "V": "v",
        "W": "w",
        "X": "x",
        "Y": "y",
        "Z": "z",
        "à": "a",
        "â": "a",
        "ä": "a",
        "á": "a",
        "ç": "c",
        "é": "e",
        "è": "e",
        "ê": "e",
        "ë": "e",
        "î": "i",
        "ï": "i",
        "ô": "o",
        "ö": "o",
        "ù": "u",
        "û": "u",
        "ü": "u",
        "ÿ": "y",
    })
    safe = value.translate(mapping).lower()
    return "".join(char for char in safe if char.isalnum())


def jitter_coordinate(base: float, rng: random.Random, span: float = 0.035) -> float:
    return round(base + rng.uniform(-span, span), 6)


def city_lookup(config: dict[str, Any]) -> dict[str, City]:
    lookup: dict[str, City] = {}
    for item in config["cities"]:
        lookup[item["name"]] = City(
            name=item["name"],
            region=item["region"],
            latitude=item["latitude"],
            longitude=item["longitude"],
            neighbourhoods=item["neighbourhoods"],
            roads=item["roads"],
        )
    return lookup


def balanced_assignments(labels: list[str], total: int, rng: random.Random) -> list[str]:
    if total % len(labels) != 0:
        raise ValueError("Le total doit etre divisible par le nombre de banques pour conserver l'equilibre.")
    per_label = total // len(labels)
    values: list[str] = []
    for label in labels:
        values.extend([label] * per_label)
    rng.shuffle(values)
    return values


def scenario_slots(scenarios: list[dict[str, Any]], total: int, rng: random.Random) -> list[dict[str, Any]]:
    values: list[dict[str, Any]] = []
    while len(values) < total:
        values.extend(scenarios)
    values = values[:total]
    rng.shuffle(values)
    return values


def choose_city(config: dict[str, Any], rng: random.Random) -> City:
    choice = rng.choices(config["cities"], weights=[item["weight"] for item in config["cities"]], k=1)[0]
    return City(
        name=choice["name"],
        region=choice["region"],
        latitude=choice["latitude"],
        longitude=choice["longitude"],
        neighbourhoods=choice["neighbourhoods"],
        roads=choice["roads"],
    )


def build_address(city: City, rng: random.Random, business: bool = False) -> str:
    road = rng.choice(city.roads)
    area = rng.choice(city.neighbourhoods)
    number = rng.randint(3, 188)
    prefix = "Avenue" if business and "Boulevard" not in road and "Rue" not in road else ""
    if prefix:
        return f"{prefix} {road}, {area}, {city.name}"
    return f"{road}, {area}, {city.name}"


def build_phone(index: int, rng: random.Random) -> str:
    prefix = rng.choice(["06", "05", "04"])
    suffix = f"{index:06d}"[-6:]
    return f"+242 {prefix} {suffix[:3]} {suffix[3:]}"


def derive_user_income(job_title: str, scenario_band: str, rng: random.Random) -> int:
    base_ranges = {
        "Fonctionnaire": (280000, 520000),
        "Enseignant": (180000, 320000),
        "Infirmier": (220000, 380000),
        "Commercant": (160000, 480000),
        "Chauffeur": (140000, 300000),
        "Logisticien": (260000, 500000),
        "Agent administratif": (180000, 320000),
        "Entrepreneur individuel": (170000, 450000),
        "Technicien": (220000, 420000),
        "Vendeur": (130000, 260000),
        "Consultant indépendant": (250000, 650000),
        "Artisan": (120000, 280000),
    }
    low, high = base_ranges.get(job_title, (150000, 350000))
    value = rng.randint(low, high)
    band_factor = {
        "A": 1.20,
        "B": 1.05,
        "C": 0.95,
        "D": 0.82,
        "E": 0.70,
    }[scenario_band]
    adjusted = int(round(value * band_factor, -3))
    return max(adjusted, 90000)


def derive_company_revenue(size_label: str, scenario_band: str, rng: random.Random) -> int:
    base_ranges = {
        "TPE": (9000000, 30000000),
        "PME": (25000000, 150000000),
        "Structure semi-formelle": (4000000, 12000000),
    }
    low, high = base_ranges.get(size_label, (8000000, 25000000))
    value = rng.randint(low, high)
    band_factor = {
        "A": 1.30,
        "B": 1.10,
        "C": 0.95,
        "D": 0.80,
        "E": 0.65,
    }[scenario_band]
    adjusted = int(round(value * band_factor, -3))
    return max(adjusted, 3500000)


def build_birthdate(rng: random.Random, min_age: int = 23, max_age: int = 58) -> str:
    age = rng.randint(min_age, max_age)
    year = date.today().year - age
    month = rng.randint(1, 12)
    day = rng.randint(1, 28)
    return date(year, month, day).isoformat()


def write_json(path: Path, payload: Any) -> None:
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def write_csv(path: Path, rows: list[dict[str, Any]], headers: list[str]) -> None:
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=headers)
        writer.writeheader()
        for row in rows:
            writer.writerow({key: row.get(key, "") for key in headers})


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


def update_summary_markdown(path: Path, metadata: dict[str, Any], banks: list[dict[str, Any]], users: list[dict[str, Any]], companies: list[dict[str, Any]]) -> None:
    cities = Counter(profile["city"] for profile in users + companies)
    sectors = Counter(company["sector"] for company in companies)
    lines = [
        "# Dataset Summary",
        "",
        "## Generation",
        "",
        f"- Date de generation : {metadata['generated_at']}",
        f"- Seed : {metadata['seed']}",
        f"- Banques : {len(banks)}",
        f"- Utilisateurs : {len(users)}",
        f"- Entreprises : {len(companies)}",
        f"- Total profils : {len(banks) + len(users) + len(companies)}",
        "",
        "## Banques generees",
        "",
    ]
    for bank in banks:
        lines.append(f"- {bank['profile_id']} : {bank['bank_name']} ({bank['city']})")
    lines.extend([
        "",
        "## Villes couvertes",
        "",
    ])
    for city, count in sorted(cities.items()):
        lines.append(f"- {city} : {count} profils")
    lines.extend([
        "",
        "## Secteurs entreprise les plus representes",
        "",
    ])
    for sector, count in sectors.most_common(8):
        lines.append(f"- {sector} : {count}")
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def build_bank_rows(config: dict[str, Any], total: int) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    banks_config = config["banks"][:total]
    for index, item in enumerate(banks_config, start=1):
        rows.append({
            "profile_id": f"bank_{index:03d}",
            "profile_type": "bank",
            "bank_id": f"bank_{index:03d}",
            "bank_name": item["name"],
            "institution_code": item["institution_code"],
            "address": item["address"],
            "city": item["city"],
            "country": "CG",
            "phone": item["phone"],
            "email": item["email"],
            "zones_covered": item["zones_covered"],
            "latitude": item["latitude"],
            "longitude": item["longitude"],
            "status": "active",
            "type": "bank",
            "government_country_visibility": "CG",
            "expected_document_count": 5,
            "expected_score_band": "B",
        })
    return rows


def build_user_rows(config: dict[str, Any], total: int, bank_ids: list[str], rng: random.Random) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    assignments = balanced_assignments(bank_ids, total, rng)
    scenarios = scenario_slots(config["user_scenarios"], total, rng)
    for index in range(1, total + 1):
        gender = rng.choice(["M", "F"])
        first_name = rng.choice(config["names"]["male_first_names"] if gender == "M" else config["names"]["female_first_names"])
        last_name = rng.choice(config["names"]["last_names"])
        city = choose_city(config, rng)
        job = rng.choice(config["user_jobs"])
        scenario = scenarios[index - 1]
        employer = rng.choice(job["employers"])
        monthly_income = derive_user_income(job["title"], scenario["expected_score_band"], rng)
        latitude = jitter_coordinate(city.latitude, rng)
        longitude = jitter_coordinate(city.longitude, rng)
        rows.append({
            "profile_id": f"user_{index:03d}",
            "profile_type": "user",
            "bank_id": assignments[index - 1],
            "first_name": first_name,
            "last_name": last_name,
            "full_name_or_company_name": f"{first_name} {last_name}",
            "gender": gender,
            "date_of_birth": build_birthdate(rng),
            "phone": build_phone(index, rng),
            "email": f"{slugify(first_name)}.{slugify(last_name)}.{index:03d}@teras.cg",
            "niu": f"CG-NIU-2026-{index:04d}",
            "address": build_address(city, rng),
            "city": city.name,
            "region": city.region,
            "country": "CG",
            "latitude": latitude,
            "longitude": longitude,
            "job_title": job["title"],
            "employer": employer,
            "professional_status": job["status"],
            "monthly_income": monthly_income,
            "kyc_status": scenario["kyc_status"],
            "scenario_id": scenario["id"],
            "scenario_label": scenario["label"],
            "status": scenario["status"],
            "sector_or_job": job["title"],
            "expected_document_count": scenario["expected_document_count"],
            "expected_score_band": scenario["expected_score_band"],
            "expected_risk_level": scenario["risk_level"],
            "government_country_visibility": "CG",
            "account_type": "individual",
            "user_type": "individual",
        })
    return rows


def build_company_rows(config: dict[str, Any], total: int, bank_ids: list[str], rng: random.Random) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    assignments = balanced_assignments(bank_ids, total, rng)
    scenarios = scenario_slots(config["company_scenarios"], total, rng)
    legal_forms = config["company_legal_forms"]
    size_profiles = config["company_sizes"]
    company_name_tokens = config["company_name_tokens"]

    for index in range(1, total + 1):
        city = choose_city(config, rng)
        sector = rng.choice(config["company_sectors"])
        scenario = scenarios[index - 1]
        leader_first = rng.choice(config["names"]["male_first_names"] + config["names"]["female_first_names"])
        leader_last = rng.choice(config["names"]["last_names"])
        legal_form = rng.choice(legal_forms)
        size = rng.choice(size_profiles)
        token = rng.choice(company_name_tokens)
        enterprise_type = rng.choice(["pme", "grande_entreprise", "startup", "association", "cooperative"])
        company_name = f"{token} {sector['label'].split()[0]} {city.name}"
        legal_name = f"{company_name} {legal_form}"
        annual_revenue = derive_company_revenue(size["label"], scenario["expected_score_band"], rng)
        latitude = jitter_coordinate(city.latitude, rng, span=0.03)
        longitude = jitter_coordinate(city.longitude, rng, span=0.03)
        rows.append({
            "profile_id": f"company_{index:03d}",
            "profile_type": "company",
            "bank_id": assignments[index - 1],
            "company_name": company_name,
            "full_name_or_company_name": company_name,
            "legal_name": legal_name,
            "legal_form": legal_form,
            "registration_number": f"RCCM-CG-2026-{index:04d}",
            "tax_id": f"NIU-CG-ENT-2026-{index:04d}",
            "enterprise_type": enterprise_type,
            "sector": sector["label"],
            "main_activity": rng.choice(sector["activities"]),
            "leader_name": f"{leader_first} {leader_last}",
            "size_label": size["label"],
            "employees_count": rng.randint(size["min_employees"], size["max_employees"]),
            "annual_revenue": annual_revenue,
            "email": f"{slugify(company_name)}.{index:03d}@teras.cg",
            "phone": build_phone(300 + index, rng),
            "address": build_address(city, rng, business=True),
            "city": city.name,
            "region": city.region,
            "country": "CG",
            "latitude": latitude,
            "longitude": longitude,
            "administrative_status": scenario["administrative_status"],
            "status": scenario["status"],
            "scenario_id": scenario["id"],
            "scenario_label": scenario["label"],
            "sector_or_job": sector["label"],
            "expected_document_count": scenario["expected_document_count"],
            "expected_score_band": scenario["expected_score_band"],
            "expected_risk_level": scenario["risk_level"],
            "government_country_visibility": "CG",
            "account_type": "enterprise",
            "user_type": "enterprise",
        })
    return rows


def build_master_profiles(banks: list[dict[str, Any]], users: list[dict[str, Any]], companies: list[dict[str, Any]]) -> list[dict[str, Any]]:
    master: list[dict[str, Any]] = []
    for bank in banks:
        master.append({
            "profile_id": bank["profile_id"],
            "profile_type": bank["profile_type"],
            "full_name_or_company_name": bank["bank_name"],
            "bank_id": bank["bank_id"],
            "city": bank["city"],
            "address": bank["address"],
            "sector_or_job": "Banque",
            "status": bank["status"],
            "country": bank["country"],
            "latitude": bank["latitude"],
            "longitude": bank["longitude"],
            "expected_document_count": bank["expected_document_count"],
            "expected_score_band": bank["expected_score_band"],
            "government_country_visibility": bank["government_country_visibility"],
        })
    for profile in users + companies:
        master.append({
            "profile_id": profile["profile_id"],
            "profile_type": profile["profile_type"],
            "full_name_or_company_name": profile["full_name_or_company_name"],
            "bank_id": profile["bank_id"],
            "city": profile["city"],
            "address": profile["address"],
            "sector_or_job": profile["sector_or_job"],
            "status": profile["status"],
            "country": profile["country"],
            "latitude": profile["latitude"],
            "longitude": profile["longitude"],
            "expected_document_count": profile["expected_document_count"],
            "expected_score_band": profile["expected_score_band"],
            "government_country_visibility": profile["government_country_visibility"],
        })
    return master


def build_government_rollup(banks: list[dict[str, Any]], users: list[dict[str, Any]], companies: list[dict[str, Any]]) -> dict[str, Any]:
    profiles = users + companies
    by_city = Counter(profile["city"] for profile in profiles)
    by_type = Counter(profile["profile_type"] for profile in profiles)
    by_bank = Counter(profile["bank_id"] for profile in profiles)
    by_sector = Counter(profile["sector_or_job"] for profile in profiles)
    by_risk = Counter(profile["expected_risk_level"] for profile in profiles)

    bank_labels = {bank["bank_id"]: bank["bank_name"] for bank in banks}
    return {
        "country": "CG",
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "summary": {
            "banks": len(banks),
            "users": len(users),
            "companies": len(companies),
            "profiles_total": len(banks) + len(users) + len(companies),
        },
        "by_city": [{"city": city, "profiles": count} for city, count in sorted(by_city.items())],
        "by_profile_type": [{"profile_type": profile_type, "profiles": count} for profile_type, count in sorted(by_type.items())],
        "by_bank": [{"bank_id": bank_id, "bank_name": bank_labels.get(bank_id, bank_id), "profiles": count} for bank_id, count in sorted(by_bank.items())],
        "by_sector": [{"sector_or_job": sector, "profiles": count} for sector, count in by_sector.most_common()],
        "by_risk_band": [{"risk_level": level, "profiles": count} for level, count in sorted(by_risk.items())],
    }


def build_bank_distribution_rows(banks: list[dict[str, Any]], users: list[dict[str, Any]], companies: list[dict[str, Any]]) -> list[dict[str, Any]]:
    user_counts = Counter(profile["bank_id"] for profile in users)
    company_counts = Counter(profile["bank_id"] for profile in companies)
    rows: list[dict[str, Any]] = []
    for bank in banks:
        users_count = user_counts[bank["bank_id"]]
        companies_count = company_counts[bank["bank_id"]]
        rows.append({
            "bank_id": bank["bank_id"],
            "bank_name": bank["bank_name"],
            "expected_users": users_count,
            "expected_companies": companies_count,
            "expected_total_clients": users_count + companies_count,
        })
    return rows


def write_outputs(metadata: dict[str, Any], banks: list[dict[str, Any]], users: list[dict[str, Any]], companies: list[dict[str, Any]], master_profiles: list[dict[str, Any]], government_rollup: dict[str, Any], bank_distribution: list[dict[str, Any]]) -> None:
    write_json(ROOT / "seeds" / "banks_seed.json", banks)
    write_json(ROOT / "seeds" / "users_seed.json", users)
    write_json(ROOT / "seeds" / "companies_seed.json", companies)
    write_json(ROOT / "seeds" / "combined_seed.json", {
        "metadata": metadata,
        "banks": banks,
        "users": users,
        "companies": companies,
    })

    master_headers = [
        "profile_id", "profile_type", "full_name_or_company_name", "bank_id", "city",
        "address", "sector_or_job", "status", "country", "latitude", "longitude",
        "expected_document_count", "expected_score_band", "government_country_visibility",
    ]
    write_csv(ROOT / "master-data" / "master_profiles.csv", master_profiles, master_headers)
    write_json(ROOT / "master-data" / "master_profiles.json", {"metadata": metadata, "profiles": master_profiles})
    write_workbook(
        ROOT / "master-data" / "master_profiles.xlsx",
        {
            "Profiles": master_profiles,
            "Banks": banks,
            "Users": users,
            "Companies": companies,
        },
        {
            "Profiles": master_headers,
            "Banks": [
                "profile_id", "bank_id", "bank_name", "institution_code", "city", "address",
                "country", "phone", "email", "latitude", "longitude", "status",
            ],
            "Users": [
                "profile_id", "bank_id", "full_name_or_company_name", "gender", "date_of_birth", "niu",
                "email", "phone", "city", "address", "job_title", "employer", "professional_status",
                "monthly_income", "kyc_status", "scenario_label", "expected_score_band",
            ],
            "Companies": [
                "profile_id", "bank_id", "company_name", "legal_form", "registration_number", "tax_id",
                "enterprise_type", "sector", "main_activity", "leader_name", "size_label", "employees_count",
                "annual_revenue", "city", "address",
                "administrative_status", "scenario_label", "expected_score_band",
            ],
        },
    )

    write_json(ROOT / "government" / "congo_government_rollup.json", government_rollup)
    write_workbook(
        ROOT / "government" / "congo_government_rollup.xlsx",
        {
            "Summary": [{
                "metric_group": "summary",
                "metric_name": key,
                "dimension": "CG",
                "value": value,
            } for key, value in government_rollup["summary"].items()],
            "ByCity": [{
                "metric_group": "city",
                "metric_name": "profiles",
                "dimension": row["city"],
                "value": row["profiles"],
            } for row in government_rollup["by_city"]],
            "ByType": [{
                "metric_group": "type",
                "metric_name": row["profile_type"],
                "dimension": "CG",
                "value": row["profiles"],
            } for row in government_rollup["by_profile_type"]],
            "ByBank": [{
                "metric_group": "bank",
                "metric_name": row["bank_name"],
                "dimension": row["bank_id"],
                "value": row["profiles"],
            } for row in government_rollup["by_bank"]],
            "BySector": [{
                "metric_group": "sector",
                "metric_name": row["sector_or_job"],
                "dimension": "CG",
                "value": row["profiles"],
            } for row in government_rollup["by_sector"]],
            "ByRisk": [{
                "metric_group": "risk",
                "metric_name": row["risk_level"],
                "dimension": "CG",
                "value": row["profiles"],
            } for row in government_rollup["by_risk_band"]],
        },
        {
            "Summary": ["metric_group", "metric_name", "dimension", "value"],
            "ByCity": ["metric_group", "metric_name", "dimension", "value"],
            "ByType": ["metric_group", "metric_name", "dimension", "value"],
            "ByBank": ["metric_group", "metric_name", "dimension", "value"],
            "BySector": ["metric_group", "metric_name", "dimension", "value"],
            "ByRisk": ["metric_group", "metric_name", "dimension", "value"],
        },
    )

    write_workbook(
        ROOT / "master-data" / "government_feed_preview.xlsx",
        {
            "GovernmentPreview": [
                {
                    "country": "CG",
                    "city": profile["city"],
                    "profile_type": profile["profile_type"],
                    "bank_id": profile["bank_id"],
                    "sector": profile["sector_or_job"],
                    "risk_band": profile["expected_score_band"],
                    "document_count": profile["expected_document_count"],
                }
                for profile in master_profiles
                if profile["profile_type"] in {"user", "company"}
            ]
        },
        {
            "GovernmentPreview": [
                "country", "city", "profile_type", "bank_id",
                "sector", "risk_band", "document_count",
            ]
        },
    )

    write_workbook(
        ROOT / "mapping" / "bank_distribution_summary.xlsx",
        {"Distribution": bank_distribution},
        {"Distribution": ["bank_id", "bank_name", "expected_users", "expected_companies", "expected_total_clients"]},
    )


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()

    if args.docs_only or args.import_only:
        print("Ce mode est reserve pour une etape ulterieure.")
        return 0

    config = load_config(args.config)
    rng = random.Random(args.seed)

    if args.banks != 3:
        raise SystemExit("Cette etape est configuree pour 3 banques afin de respecter le cadrage TERAS.")
    if args.users != 30 or args.companies != 30:
        raise SystemExit("Cette etape attend 30 utilisateurs et 30 entreprises pour respecter la repartition cible.")

    banks = build_bank_rows(config, args.banks)
    bank_ids = [bank["bank_id"] for bank in banks]
    users = build_user_rows(config, args.users, bank_ids, rng)
    companies = build_company_rows(config, args.companies, bank_ids, rng)

    metadata = {
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "seed": args.seed,
        "country": "CG",
        "banks_count": len(banks),
        "users_count": len(users),
        "companies_count": len(companies),
        "profiles_total": len(banks) + len(users) + len(companies),
        "config_file": str(args.config.name),
    }

    master_profiles = build_master_profiles(banks, users, companies)
    government_rollup = build_government_rollup(banks, users, companies)
    bank_distribution = build_bank_distribution_rows(banks, users, companies)

    write_outputs(metadata, banks, users, companies, master_profiles, government_rollup, bank_distribution)
    update_summary_markdown(ROOT / "DATASET_SUMMARY.md", metadata, banks, users, companies)

    print("Dataset synthetique genere.")
    print(f"Seed: {args.seed}")
    print(f"Banques: {len(banks)} | Utilisateurs: {len(users)} | Entreprises: {len(companies)}")
    for row in bank_distribution:
        print(f"{row['bank_id']}: {row['expected_users']} utilisateurs / {row['expected_companies']} entreprises")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
