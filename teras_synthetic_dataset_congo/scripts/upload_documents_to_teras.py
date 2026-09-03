#!/usr/bin/env python3
"""
Upload automatique des documents synthetiques du dataset dans TERAS local.
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
PROJECT_ROOT = ROOT.parent
SCRIPTS_DIR = ROOT / "scripts"
MAPPING_CSV = ROOT / "mapping" / "profile_document_mapping.csv"
LOGIN_JSON = ROOT / "seeds" / "login_credentials.json"
UPLOAD_RESULTS_JSON = ROOT / "seeds" / "upload_results.json"
UPLOAD_RESULTS_XLSX = ROOT / "seeds" / "upload_results.xlsx"
WORKBOOK_SPEC_PATH = SCRIPTS_DIR / "workbook_specs.json"
BUILDER_PATH = SCRIPTS_DIR / "build_workbooks.mjs"
BUNDLED_NODE = Path.home() / ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"

if str(PROJECT_ROOT / "backend") not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT / "backend"))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")

import django  # noqa: E402

django.setup()

from django.conf import settings  # noqa: E402
from django.contrib.auth import get_user_model  # noqa: E402
from rest_framework.test import APIClient  # noqa: E402

from scoring.models_enterprise import EnterpriseDocument  # noqa: E402


User = get_user_model()


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Uploader automatiquement les documents du dataset dans TERAS")
    parser.add_argument("--profile-type", choices=["users", "companies", "banks", "all"], default="all")
    parser.add_argument("--limit", type=int, default=0, help="Limiter le nombre de profils par type")
    parser.add_argument("--dry-run", action="store_true", help="Simuler les uploads sans envoyer de fichier")
    return parser


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload: Any) -> None:
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def read_csv_rows(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def title_from_filename(file_name: str) -> str:
    return file_name.replace(".pdf", "").replace(".xlsx", "").replace(".png", "").replace("_", " ").strip().title()


def ensure_workbook(results: list[dict[str, Any]]) -> None:
    payload = {
        "workbooks": [
            {
                "outputPath": str(UPLOAD_RESULTS_XLSX),
                "sheets": [
                    {
                        "name": "Uploads",
                        "rows": [
                            ["profile_id", "profile_type", "file_name", "endpoint", "status", "http_status", "detail"],
                            *[
                                [
                                    row["profile_id"],
                                    row["profile_type"],
                                    row["file_name"],
                                    row["endpoint"],
                                    row["status"],
                                    row["http_status"],
                                    row["detail"],
                                ]
                                for row in results
                            ],
                        ],
                    }
                ],
            }
        ]
    }
    write_json(WORKBOOK_SPEC_PATH, payload)
    import subprocess

    subprocess.run([str(BUNDLED_NODE), str(BUILDER_PATH), str(WORKBOOK_SPEC_PATH)], cwd=PROJECT_ROOT, check=True)


def login(email: str, password: str) -> tuple[APIClient, str | None, str | None]:
    client = APIClient()
    response = client.post("/api/auth/login/", {"email": email, "password": password}, format="json")
    if response.status_code != 200:
        detail = response.data.get("error", response.data) if hasattr(response, "data") else response.content.decode("utf-8", errors="ignore")
        return client, None, str(detail)

    token = response.data.get("access")
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    return client, token, None


def profile_filter(profile_type: str) -> set[str]:
    if profile_type == "users":
        return {"user"}
    if profile_type == "companies":
        return {"company"}
    if profile_type == "banks":
        return {"bank"}
    return {"user", "company", "bank"}


def apply_limit(rows: list[dict[str, str]], limit: int) -> list[dict[str, str]]:
    if limit <= 0:
        return rows

    counts: dict[str, int] = {}
    selected: list[dict[str, str]] = []
    for row in rows:
        profile_id = row["profile_id"]
        counts.setdefault(profile_id, 0)
        if counts[profile_id] == 0:
            if sum(1 for value in counts.values() if value > 0) >= limit:
                continue
        counts[profile_id] += 1
        selected.append(row)
    return selected


def supported_for_upload(row: dict[str, str]) -> bool:
    if row["file_type"] == "json":
        return False
    if row["file_name"] == "manifest.json":
        return False
    return True


def user_upload_type(file_name: str, extraction_goal: str) -> str:
    lowered = file_name.lower()
    if "statement" in lowered:
        return "bank_statement"
    if "asset" in lowered:
        return "proof_asset"
    if "employment" in lowered or "salary" in lowered:
        return "salary_slip"
    if "invoice" in lowered:
        return "invoice"
    return "other"


def enterprise_category(file_name: str) -> str:
    lowered = file_name.lower()
    if lowered.startswith("invoice_"):
        return "invoice"
    if "asset_statement" in lowered or "fixed_assets" in lowered or "asset_inventory" in lowered:
        return "balance_sheet"
    if "vehicle_registration" in lowered or "warehouse_lease_or_title" in lowered or "property_title" in lowered:
        return "other"
    if "contract" in lowered:
        return "contract"
    if "statement" in lowered:
        return "bank_statement"
    return "other"


def bank_doc_type(row: dict[str, str]) -> str:
    return row["extraction_goal"] or row["file_type"] or "bank_document"


def user_duplicate_exists(user: User, file_name: str) -> bool:
    doc_dir = Path(settings.MEDIA_ROOT) / "documents" / str(user.id)
    if not doc_dir.exists():
        return False
    suffix = "_" + file_name.replace(" ", "_")
    return any(path.is_file() and path.name.endswith(suffix) for path in doc_dir.iterdir())


def bank_duplicate_exists(user: User, file_name: str) -> bool:
    doc_dir = Path(settings.MEDIA_ROOT) / "bank_documents" / str(user.id) / "_general"
    if not doc_dir.exists():
        return False
    suffix = "_" + file_name.replace(" ", "_")
    return any(path.is_file() and path.name.endswith(suffix) for path in doc_dir.iterdir())


def enterprise_duplicate_exists(user: User, title: str, category: str) -> bool:
    return EnterpriseDocument.objects.filter(enterprise=user, title=title, category=category).exists()


def upload_one(client: APIClient, user: User, row: dict[str, str], dry_run: bool) -> dict[str, Any]:
    profile_type = row["profile_type"]
    relative_path = ROOT / row["relative_path"]
    endpoint = ""
    status = "skipped"
    http_status = ""
    detail = ""

    if not relative_path.exists():
        return {
            "profile_id": row["profile_id"],
            "profile_type": profile_type,
            "file_name": row["file_name"],
            "endpoint": "n/a",
            "status": "failed",
            "http_status": "",
            "detail": f"Fichier introuvable: {row['relative_path']}",
        }

    if profile_type == "user":
        if user_duplicate_exists(user, row["file_name"]):
            return {
                "profile_id": row["profile_id"],
                "profile_type": profile_type,
                "file_name": row["file_name"],
                "endpoint": "/api/scoring/user/documents/upload/",
                "status": "skipped",
                "http_status": "",
                "detail": "Document deja present pour cet utilisateur",
            }
        endpoint = "/api/scoring/user/documents/upload/"
        payload = {
            "doc_type": user_upload_type(row["file_name"], row["extraction_goal"]),
            "description": f"Dataset TERAS Congo - {row['extraction_goal']}",
            "apply_to_score": "0",
        }
    elif profile_type == "company":
        category = enterprise_category(row["file_name"])
        title = title_from_filename(row["file_name"])
        if enterprise_duplicate_exists(user, title, category):
            return {
                "profile_id": row["profile_id"],
                "profile_type": profile_type,
                "file_name": row["file_name"],
                "endpoint": "/api/scoring/enterprise/documents/upload/",
                "status": "skipped",
                "http_status": "",
                "detail": "Document entreprise deja present",
            }
        endpoint = "/api/scoring/enterprise/documents/upload/"
        payload = {
            "category": category,
            "title": title,
            "period": "Q1 2026",
            "period_start": "2026-01-01",
            "period_end": "2026-03-31",
        }
    else:
        if bank_duplicate_exists(user, row["file_name"]):
            return {
                "profile_id": row["profile_id"],
                "profile_type": profile_type,
                "file_name": row["file_name"],
                "endpoint": "/api/scoring/bank/documents/upload/",
                "status": "skipped",
                "http_status": "",
                "detail": "Document banque deja present",
            }
        endpoint = "/api/scoring/bank/documents/upload/"
        payload = {
            "doc_type": bank_doc_type(row),
            "notes": f"Dataset TERAS Congo - {row['extraction_goal']}",
        }

    if dry_run:
        return {
            "profile_id": row["profile_id"],
            "profile_type": profile_type,
            "file_name": row["file_name"],
            "endpoint": endpoint,
            "status": "dry-run",
            "http_status": "",
            "detail": "Upload simule",
        }

    with relative_path.open("rb") as handle:
        payload["file"] = handle
        response = client.post(endpoint, payload, format="multipart")

    http_status = str(response.status_code)
    if response.status_code in {200, 201}:
        status = "uploaded"
        response_data = getattr(response, "data", {})
        detail = str(response_data.get("filename") or response_data.get("id") or "ok")
    else:
        status = "failed"
        response_data = getattr(response, "data", response.content.decode("utf-8", errors="ignore"))
        detail = str(response_data)

    return {
        "profile_id": row["profile_id"],
        "profile_type": profile_type,
        "file_name": row["file_name"],
        "endpoint": endpoint,
        "status": status,
        "http_status": http_status,
        "detail": detail[:300],
    }


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()

    mapping_rows = [row for row in read_csv_rows(MAPPING_CSV) if row["profile_type"] in profile_filter(args.profile_type) and supported_for_upload(row)]
    mapping_rows.sort(key=lambda row: (row["profile_id"], int(row["upload_order"])))
    mapping_rows = apply_limit(mapping_rows, args.limit)

    credentials = {row["profile_id"]: row for row in load_json(LOGIN_JSON)["credentials"]}

    grouped: dict[str, list[dict[str, str]]] = {}
    for row in mapping_rows:
        grouped.setdefault(row["profile_id"], []).append(row)

    results: list[dict[str, Any]] = []
    summary = {"profiles": 0, "uploaded": 0, "skipped": 0, "failed": 0, "dry-run": 0}

    for profile_id, rows in grouped.items():
        summary["profiles"] += 1
        credential = credentials.get(profile_id)
        if not credential:
            for row in rows:
                result = {
                    "profile_id": profile_id,
                    "profile_type": row["profile_type"],
                    "file_name": row["file_name"],
                    "endpoint": "",
                    "status": "failed",
                    "http_status": "",
                    "detail": "Identifiants manquants",
                }
                results.append(result)
                summary["failed"] += 1
            continue

        client, _token, login_error = login(credential["login_email"], credential["password"])
        if login_error:
            for row in rows:
                result = {
                    "profile_id": profile_id,
                    "profile_type": row["profile_type"],
                    "file_name": row["file_name"],
                    "endpoint": "",
                    "status": "failed",
                    "http_status": "401",
                    "detail": f"Echec login: {login_error}",
                }
                results.append(result)
                summary["failed"] += 1
            continue

        user = User.objects.get(email=credential["login_email"])
        for row in rows:
            result = upload_one(client, user, row, args.dry_run)
            results.append(result)
            summary[result["status"]] = summary.get(result["status"], 0) + 1

    payload = {
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "summary": summary,
        "results": results,
    }
    write_json(UPLOAD_RESULTS_JSON, payload)
    ensure_workbook(results)

    print("Upload TERAS termine.")
    print(json.dumps(summary, ensure_ascii=False))
    return 0 if summary["failed"] == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
