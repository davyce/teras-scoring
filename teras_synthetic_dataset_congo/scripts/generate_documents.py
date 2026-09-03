#!/usr/bin/env python3
"""
Generation des documents synthetiques utilisateur, entreprise et banque.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import random
import subprocess
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw, ImageFilter, ImageFont
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


ROOT = Path(__file__).resolve().parents[1]
PROJECT_ROOT = ROOT.parent
SCRIPTS_DIR = ROOT / "scripts"
SEEDS_DIR = ROOT / "seeds"
CONFIG_PATH = ROOT / "dataset_config.json"
MAPPING_CSV = ROOT / "mapping" / "profile_document_mapping.csv"
MAPPING_XLSX = ROOT / "mapping" / "profile_document_mapping.xlsx"
WORKBOOK_SPEC_PATH = SCRIPTS_DIR / "workbook_specs.json"
BUILDER_PATH = SCRIPTS_DIR / "build_workbooks.mjs"
NODE_MODULES_LINK = SCRIPTS_DIR / "node_modules"
BUNDLED_NODE_MODULES = Path.home() / ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules"
BUNDLED_NODE = Path.home() / ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Generer les documents du dataset TERAS Congo")
    parser.add_argument("--profile-type", choices=["users", "companies", "banks", "all"], default="all")
    parser.add_argument("--limit", type=int, default=0, help="Limiter le nombre de profils traites")
    parser.add_argument("--force", action="store_true", help="Regenerer meme si les fichiers existent deja")
    return parser


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload: Any) -> None:
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def write_csv(path: Path, rows: list[dict[str, Any]], headers: list[str]) -> None:
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=headers)
        writer.writeheader()
        for row in rows:
            writer.writerow({key: row.get(key, "") for key in headers})


def load_config() -> dict[str, Any]:
    return load_json(CONFIG_PATH)


def stable_rng(*parts: str) -> random.Random:
    digest = hashlib.sha256("::".join(parts).encode("utf-8")).hexdigest()
    return random.Random(int(digest[:16], 16))


def format_fcfa(value: float | int) -> str:
    return f"{int(round(value)):,}".replace(",", " ") + " FCFA"


def month_anchor(profile_id: str) -> date:
    rng = stable_rng(profile_id, "month")
    month = rng.choice([1, 2, 3, 4])
    day = rng.randint(1, 20)
    return date(2026, month, day)


def dirty_quality_config(config: dict[str, Any]) -> dict[str, Any]:
    return config.get("document_quality", {})


def is_dirty_profile(seed: dict[str, Any], profile_type: str, quality_config: dict[str, Any]) -> bool:
    scenario_id = seed.get("scenario_id", "")
    if profile_type == "user":
        return scenario_id in set(quality_config.get("dirty_user_scenarios", []))
    if profile_type == "company":
        return scenario_id in set(quality_config.get("dirty_company_scenarios", []))
    return False


def dirty_document_targets(profile_type: str, quality_config: dict[str, Any]) -> set[str]:
    return set(quality_config.get("dirty_document_targets", {}).get(profile_type, []))


def document_variant(seed: dict[str, Any], profile_type: str, file_name: str, quality_config: dict[str, Any]) -> tuple[str, list[str]]:
    if not is_dirty_profile(seed, profile_type, quality_config):
        return "clean", []
    if file_name not in dirty_document_targets(profile_type, quality_config):
        return "clean", []

    if file_name.endswith(".png"):
        return "dirty", ["blur", "tilt", "low_contrast", "scanner_shadow", "noise"]
    if file_name.endswith(".xlsx"):
        return "dirty", ["preamble_rows", "blank_rows", "mixed_amount_style"]
    if file_name.endswith(".pdf"):
        return "dirty", ["alt_headers", "copy_stamp", "layout_shift"]
    return "dirty", ["metadata_noise"]


def subtitle_for_quality(base_subtitle: str, document_quality: str, degradation_tags: list[str]) -> str:
    if document_quality != "dirty":
        return base_subtitle
    tag_text = ", ".join(degradation_tags[:3])
    return f"{base_subtitle} - copie terrain degradee ({tag_text})"


def join_tags(tags: list[str]) -> str:
    return ",".join(tags)


def register_document(
    manifest: dict[str, Any],
    mapping_rows: list[dict[str, Any]],
    profile_id: str,
    profile_type: str,
    bank_id: str,
    file_name: str,
    file_type: str,
    upload_order: int,
    extraction_goal: str,
    expected_fields: str,
    document_quality: str,
    degradation_tags: list[str],
) -> None:
    relative_path = f"{profile_type}s/{profile_id}/{file_name}" if profile_type != "company" else f"companies/{profile_id}/{file_name}"
    if profile_type == "bank":
        relative_path = f"banks/{profile_id}/{file_name}"
    elif profile_type == "user":
        relative_path = f"users/{profile_id}/{file_name}"

    entry = {
        "file_name": file_name,
        "file_type": file_type,
        "upload_order": upload_order,
        "relative_path": relative_path,
        "extraction_goal": extraction_goal,
        "expected_fields": expected_fields,
        "document_quality": document_quality,
        "degradation_tags": degradation_tags,
    }
    manifest["documents"].append(entry)
    mapping_rows.append({
        "profile_id": profile_id,
        "profile_type": profile_type,
        "bank_id": bank_id,
        "file_name": file_name,
        "file_type": file_type,
        "relative_path": relative_path,
        "upload_order": upload_order,
        "extraction_goal": extraction_goal,
        "expected_fields": expected_fields,
        "document_quality": document_quality,
        "degradation_tags": join_tags(degradation_tags),
    })


def sample_styles():
    styles = getSampleStyleSheet()
    if "Section" not in styles:
        styles.add(ParagraphStyle(name="Section", parent=styles["Heading2"], fontSize=13, leading=16, textColor=colors.HexColor("#1D4ED8")))
    if "Body" not in styles:
        styles.add(ParagraphStyle(name="Body", parent=styles["BodyText"], fontSize=10.5, leading=14))
    return styles


def build_pdf(
    path: Path,
    title: str,
    subtitle: str,
    info_rows: list[tuple[str, str]],
    table_headers: list[str] | None = None,
    table_rows: list[list[str]] | None = None,
    document_quality: str = "clean",
    degradation_tags: list[str] | None = None,
) -> None:
    styles = sample_styles()
    degradation_tags = degradation_tags or []
    story = [
        Paragraph(title, styles["Title"]),
        Spacer(1, 0.2 * cm),
        Paragraph(subtitle, styles["Body"]),
        Spacer(1, 0.35 * cm),
    ]

    if document_quality == "dirty":
        story.extend([
            Paragraph("Copie terrain numérisée - qualité non homogène", styles["Body"]),
            Spacer(1, 0.2 * cm),
        ])

    if info_rows:
        info_data = [["Champ", "Valeur"], *info_rows]
        info_table = Table(info_data, colWidths=[5 * cm, 10.5 * cm])
        info_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0F172A")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
            ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#F8FAFC")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#F8FAFC"), colors.HexColor("#EEF2FF")]),
        ]))
        story.extend([info_table, Spacer(1, 0.4 * cm)])

    if table_headers and table_rows:
        table_data = [table_headers, *table_rows]
        data_table = Table(table_data, repeatRows=1)
        data_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1E293B")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#94A3B8")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
            ("FONTSIZE", (0, 0), (-1, -1), 8.5),
        ]))
        story.append(Paragraph("Donnees structurees", styles["Section"]))
        story.append(Spacer(1, 0.15 * cm))
        story.append(data_table)

    doc = SimpleDocTemplate(str(path), pagesize=A4, leftMargin=1.6 * cm, rightMargin=1.6 * cm, topMargin=1.4 * cm, bottomMargin=1.2 * cm)
    doc.build(story)


def create_ocr_image(path: Path, title: str, lines: list[str], seed: str, document_quality: str = "clean", degradation_tags: list[str] | None = None) -> None:
    rng = stable_rng(seed, "ocr")
    degradation_tags = degradation_tags or []
    image = Image.new("L", (1240, 1754), color=245)
    draw = ImageDraw.Draw(image)
    font = ImageFont.load_default()

    draw.rectangle((60, 60, 1180, 1690), outline=90, width=3)
    draw.text((90, 95), title, fill=25, font=font)
    y = 180
    for line in lines:
        draw.text((100 + rng.randint(-8, 8), y), line, fill=rng.randint(25, 70), font=font)
        y += 58 + rng.randint(-8, 8)

    for _ in range(120):
        x1 = rng.randint(70, 1160)
        y1 = rng.randint(120, 1660)
        x2 = x1 + rng.randint(-45, 45)
        y2 = y1 + rng.randint(-12, 12)
        draw.line((x1, y1, x2, y2), fill=rng.randint(170, 225), width=1)

    if document_quality == "dirty":
        if "scanner_shadow" in degradation_tags:
            draw.rectangle((880, 70, 1170, 1680), fill=218)
        if "copy_stamp" in degradation_tags:
            draw.text((820, 145), "COPIE", fill=140, font=font)
        if "noise" in degradation_tags:
            for _ in range(420):
                x = rng.randint(70, 1160)
                y = rng.randint(90, 1670)
                draw.point((x, y), fill=rng.randint(90, 210))
        if "tilt" in degradation_tags:
            image = image.rotate(rng.uniform(-2.6, 2.6), resample=Image.BICUBIC, fillcolor=240)
        if "low_contrast" in degradation_tags:
            image = image.point(lambda p: max(0, min(255, int((p - 128) * 0.82 + 140))))
        blur_radius = 1.35 if "blur" in degradation_tags else 0.8
    else:
        blur_radius = 0.6

    image = image.filter(ImageFilter.GaussianBlur(radius=blur_radius))
    image.save(path)


def ensure_node_resolution() -> None:
    if not NODE_MODULES_LINK.exists():
        NODE_MODULES_LINK.symlink_to(BUNDLED_NODE_MODULES, target_is_directory=True)


def workbook_spec(output_path: Path, sheets: dict[str, list[list[Any]]]) -> dict[str, Any]:
    return {
        "outputPath": str(output_path),
        "sheets": [{"name": name, "rows": rows} for name, rows in sheets.items()],
    }


def build_user_statement(seed: dict[str, Any]) -> list[dict[str, Any]]:
    rng = stable_rng(seed["profile_id"], "user-statement")
    start = month_anchor(seed["profile_id"])
    income = int(seed["monthly_income"])
    opening = int(income * rng.uniform(0.4, 1.2))
    transactions: list[dict[str, Any]] = []
    balance = opening
    tx_date = start

    def append(label: str, category: str, credit: int = 0, debit: int = 0):
        nonlocal balance, tx_date
        balance += credit - debit
        transactions.append({
            "date": tx_date.isoformat(),
            "reference": f"TX-{seed['profile_id'].upper()}-{len(transactions)+1:03d}",
            "label": label,
            "category": category,
            "credit": credit,
            "debit": debit,
            "balance": balance,
        })
        tx_date += timedelta(days=rng.randint(1, 4))

    if seed["professional_status"] == "salaried":
        append(f"Virement salaire {seed['employer']}", "income", credit=income)
    else:
        append("Recette activite commerciale", "income", credit=int(income * 0.55))
        append("Encaissement clients cash", "income", credit=int(income * 0.35))

    append("Loyer mensuel", "housing", debit=int(income * 0.22))
    append("Achat alimentation", "living", debit=int(income * 0.18))
    append("Transport urbain", "transport", debit=int(income * 0.08))
    append("Recharge Mobile Money", "telecom", debit=int(income * 0.05))
    append("Paiement electricite", "utilities", debit=int(income * 0.07))

    if seed["expected_risk_level"] in {"high", "medium"}:
        append("Soutien familial", "family", debit=int(income * 0.09))
    if seed["expected_score_band"] in {"A", "B"}:
        append("Depot epargne", "savings", debit=int(income * 0.12))
        append("Remboursement tontine", "community", credit=int(income * 0.06))
    else:
        append("Retrait urgence sante", "health", debit=int(income * 0.11))

    return transactions


def build_user_budget_rows(seed: dict[str, Any], statement: list[dict[str, Any]]) -> list[list[Any]]:
    total_credit = sum(row["credit"] for row in statement)
    total_debit = sum(row["debit"] for row in statement)
    closing = statement[-1]["balance"]
    return [
        ["Indicateur", "Valeur"],
        ["Revenu mensuel de reference", int(seed["monthly_income"])],
        ["Credits observes", total_credit],
        ["Debits observes", total_debit],
        ["Solde de cloture", closing],
        ["Bande de score attendue", seed["expected_score_band"]],
        ["Risque attendu", seed["expected_risk_level"]],
    ]


def build_company_statement(seed: dict[str, Any]) -> list[dict[str, Any]]:
    rng = stable_rng(seed["profile_id"], "company-statement")
    start = month_anchor(seed["profile_id"])
    monthly_revenue = int(seed["annual_revenue"] / 12)
    opening = int(monthly_revenue * rng.uniform(0.3, 0.8))
    transactions: list[dict[str, Any]] = []
    balance = opening
    tx_date = start

    def append(label: str, category: str, credit: int = 0, debit: int = 0):
        nonlocal balance, tx_date
        balance += credit - debit
        transactions.append({
            "date": tx_date.isoformat(),
            "reference": f"ENT-{seed['profile_id'].upper()}-{len(transactions)+1:03d}",
            "label": label,
            "category": category,
            "credit": credit,
            "debit": debit,
            "balance": balance,
        })
        tx_date += timedelta(days=rng.randint(1, 5))

    append("Reglement client principal", "sales", credit=int(monthly_revenue * 0.42))
    append("Ventes complementaires", "sales", credit=int(monthly_revenue * 0.26))
    append("Achat matieres premieres", "purchase", debit=int(monthly_revenue * 0.21))
    append("Paiement salaires", "payroll", debit=int(monthly_revenue * 0.17))
    append("Transport et logistique", "logistics", debit=int(monthly_revenue * 0.09))
    append("Electricite et eau", "utilities", debit=int(monthly_revenue * 0.05))
    if seed["expected_risk_level"] == "high":
        append("Rattrapage dette fournisseur", "supplier", debit=int(monthly_revenue * 0.12))
    else:
        append("Depot reserve tresorerie", "treasury", debit=int(monthly_revenue * 0.08))
    append("Encaissement Mobile Money", "sales", credit=int(monthly_revenue * 0.18))
    return transactions


def build_sales_rows(seed: dict[str, Any]) -> list[list[Any]]:
    rng = stable_rng(seed["profile_id"], "sales")
    rows = [["Date", "Facture", "Client", "Produit/Service", "Montant HT", "Mode de paiement"]]
    anchor = month_anchor(seed["profile_id"])
    for index in range(1, 9):
        amount = int((seed["annual_revenue"] / 12) * rng.uniform(0.06, 0.18))
        rows.append([
            (anchor + timedelta(days=index * 3)).isoformat(),
            f"FAC-{seed['profile_id'].upper()}-{index:03d}",
            f"Client {index:02d} {seed['city']}",
            seed["main_activity"],
            amount,
            rng.choice(["Virement", "Cheque", "Mobile Money"]),
        ])
    return rows


def build_purchase_rows(seed: dict[str, Any]) -> list[list[Any]]:
    rng = stable_rng(seed["profile_id"], "purchases")
    rows = [["Date", "Bon", "Fournisseur", "Nature achat", "Montant", "Statut"]]
    anchor = month_anchor(seed["profile_id"])
    for index in range(1, 7):
        amount = int((seed["annual_revenue"] / 12) * rng.uniform(0.03, 0.11))
        rows.append([
            (anchor + timedelta(days=index * 4)).isoformat(),
            f"ACH-{seed['profile_id'].upper()}-{index:03d}",
            f"Fournisseur {index:02d} {seed['city']}",
            rng.choice(["Intrants", "Transport", "Sous-traitance", "Maintenance"]),
            amount,
            rng.choice(["payé", "a payer"]),
        ])
    return rows


def dirty_preface_rows(title: str, profile_id: str) -> list[list[Any]]:
    return [
        [f"COPIE NUMERISEE - {title}"],
        [f"Reference terrain: {profile_id.upper()} / controle manuel requis"],
        [],
    ]


def maybe_dirty_rows(rows: list[list[Any]], document_quality: str, profile_id: str, title: str) -> list[list[Any]]:
    if document_quality != "dirty":
        return rows

    dirty_rows = dirty_preface_rows(title, profile_id)
    if rows:
        dirty_rows.append(rows[0])
        for index, row in enumerate(rows[1:], start=1):
            dirty_rows.append(row)
            if index % 3 == 0:
                dirty_rows.append(["" for _ in row])
        return dirty_rows
    return dirty_rows


def user_assets(seed: dict[str, Any]) -> list[dict[str, Any]]:
    rng = stable_rng(seed["profile_id"], "user-assets")
    templates = [
        ("Moto utilitaire", f"Moto TVS HLX - {seed['city']}", rng.randint(650000, 1150000), "facture simple"),
        ("Parcelle familiale", f"Terrain periurbain - {seed['city']}", rng.randint(2500000, 7800000), "attestation locale"),
        ("Materiel commercial", f"Stock et equipements - {seed['job_title']}", rng.randint(280000, 1350000), "inventaire"),
        ("Epargne mobile money", "Solde de precaution cumule", rng.randint(90000, 420000), "capture operateur"),
    ]
    selected = templates[: 2 + (1 if seed["expected_score_band"] in {"A", "B", "C"} else 0)]
    return [
        {
            "asset_type": asset_type,
            "description": description,
            "estimated_value": value,
            "proof_mode": proof,
            "ownership_status": rng.choice(["detenu", "usage familial", "co-acquis"]),
        }
        for asset_type, description, value, proof in selected
    ]


def company_assets(seed: dict[str, Any]) -> list[dict[str, Any]]:
    rng = stable_rng(seed["profile_id"], "company-assets")
    templates = [
        ("Vehicule utilitaire", f"Fourgon de livraison - {seed['city']}", rng.randint(4200000, 11800000), "carte grise"),
        ("Equipement principal", seed["main_activity"], rng.randint(1500000, 6900000), "facture fournisseur"),
        ("Stock valorise", f"Stock courant {seed['sector']}", rng.randint(1100000, 5300000), "inventaire de cloture"),
        ("Materiel informatique", "PC, imprimantes, routeurs", rng.randint(450000, 2400000), "bon de livraison"),
    ]
    selected = templates[: 3 + (1 if seed["expected_score_band"] in {"A", "B"} else 0)]
    return [
        {
            "asset_type": asset_type,
            "description": description,
            "estimated_value": value,
            "proof_mode": proof,
            "depreciation_note": rng.choice(["amorti lineaire", "valeur usage", "non amorti"]),
        }
        for asset_type, description, value, proof in selected
    ]


def company_invoice_count(seed: dict[str, Any]) -> int:
    expected = int(seed["expected_document_count"])
    return max(2, min(4, expected - 6))


def user_extra_docs(seed: dict[str, Any]) -> list[str]:
    extras: list[str] = []
    if int(seed["expected_document_count"]) >= 7:
        extras.append("employment_certificate.pdf")
    if int(seed["expected_document_count"]) >= 8:
        extras.append("budget_note.pdf")
    return extras


def build_bank_portfolio_rows(bank_seed: dict[str, Any], users: list[dict[str, Any]], companies: list[dict[str, Any]]) -> dict[str, list[list[Any]]]:
    user_rows = [["Profile", "Nom", "Ville", "Emploi", "Score attendu", "Risque"]] + [
        [row["profile_id"], row["full_name_or_company_name"], row["city"], row["job_title"], row["expected_score_band"], row["expected_risk_level"]]
        for row in users
    ]
    company_rows = [["Profile", "Entreprise", "Ville", "Secteur", "Score attendu", "Risque"]] + [
        [row["profile_id"], row["company_name"], row["city"], row["sector"], row["expected_score_band"], row["expected_risk_level"]]
        for row in companies
    ]
    summary_rows = [
        ["Indicateur", "Valeur"],
        ["Banque", bank_seed["bank_name"]],
        ["Code", bank_seed["institution_code"]],
        ["Utilisateurs rattaches", len(users)],
        ["Entreprises rattachees", len(companies)],
        ["Portefeuille total", len(users) + len(companies)],
    ]
    return {"Summary": summary_rows, "Users": user_rows, "Companies": company_rows}


def build_regional_coverage_rows(bank_seed: dict[str, Any]) -> list[list[Any]]:
    rows = [["Zone", "Type couverture", "Priorite"]]
    for index, zone in enumerate(bank_seed["zones_covered"], start=1):
        rows.append([zone, "commerciale", index])
    return rows


def write_user_documents(
    seed: dict[str, Any],
    credentials_map: dict[str, dict[str, Any]],
    workbook_specs: list[dict[str, Any]],
    mapping_rows: list[dict[str, Any]],
    quality_config: dict[str, Any],
    force: bool,
) -> None:
    folder = ROOT / "users" / seed["profile_id"]
    folder.mkdir(parents=True, exist_ok=True)
    credential = credentials_map.get(seed["profile_id"], {})
    statement = build_user_statement(seed)
    extra_docs = user_extra_docs(seed)
    assets = user_assets(seed)
    profile_quality = "dirty" if is_dirty_profile(seed, "user", quality_config) else "clean"

    profile_payload = {
        "seed": seed,
        "login": credential,
        "profile_quality": profile_quality,
        "generated_at": datetime.now().isoformat(timespec="seconds"),
    }
    write_json(folder / "profile.json", profile_payload)

    identity_quality, identity_tags = document_variant(seed, "user", "identity_card.pdf", quality_config)
    build_pdf(
        folder / "identity_card.pdf",
        "Carte d'identite synthetique TERAS",
        subtitle_for_quality("Document fictif genere pour demonstration OCR/PDF - Republique du Congo", identity_quality, identity_tags),
        [
            ("Nom complet", seed["full_name_or_company_name"]),
            ("NIU", seed["niu"]),
            ("Date de naissance", seed["date_of_birth"]),
            ("Telephone", seed["phone"]),
            ("Ville", seed["city"]),
            ("Adresse", seed["address"]),
        ],
        document_quality=identity_quality,
        degradation_tags=identity_tags,
    )
    address_quality, address_tags = document_variant(seed, "user", "proof_of_address.pdf", quality_config)
    build_pdf(
        folder / "proof_of_address.pdf",
        "Justificatif de domicile",
        subtitle_for_quality("Attestation synthetique de residence", address_quality, address_tags),
        [
            ("Titulaire", seed["full_name_or_company_name"]),
            ("Adresse", seed["address"]),
            ("Ville", seed["city"]),
            ("Region", seed["region"]),
            ("Pays", seed["country"]),
        ],
        document_quality=address_quality,
        degradation_tags=address_tags,
    )
    statement_quality, statement_tags = document_variant(seed, "user", "bank_statement.pdf", quality_config)
    build_pdf(
        folder / "bank_statement.pdf",
        "Releve bancaire particulier",
        subtitle_for_quality(f"Compte de demonstration rattache a {seed['bank_id']}", statement_quality, statement_tags),
        [
            ("Client", seed["full_name_or_company_name"]),
            ("Profession", seed["job_title"]),
            ("Employeur", seed["employer"]),
            ("Revenu mensuel", format_fcfa(seed["monthly_income"])),
        ],
        ["Date opération", "Reference", "Libelle / particulars", "Categorie", "Deposit", "Withdrawal", "Running Balance"] if statement_quality == "dirty" else ["Date", "Reference", "Libelle", "Categorie", "Credit", "Debit", "Solde"],
        [[row["date"], row["reference"], row["label"], row["category"], format_fcfa(row["credit"]), format_fcfa(row["debit"]), format_fcfa(row["balance"])] for row in statement],
        document_quality=statement_quality,
        degradation_tags=statement_tags,
    )
    if "employment_certificate.pdf" in extra_docs:
        employment_quality, employment_tags = document_variant(seed, "user", "employment_certificate.pdf", quality_config)
        build_pdf(
            folder / "employment_certificate.pdf",
            "Attestation professionnelle",
            subtitle_for_quality("Support synthetique pour validation de revenus", employment_quality, employment_tags),
            [
                ("Salarie", seed["full_name_or_company_name"]),
                ("Structure", seed["employer"]),
                ("Fonction", seed["job_title"]),
                ("Revenu de reference", format_fcfa(seed["monthly_income"])),
            ],
            document_quality=employment_quality,
            degradation_tags=employment_tags,
        )
    if "budget_note.pdf" in extra_docs:
        budget_quality, budget_tags = document_variant(seed, "user", "budget_note.pdf", quality_config)
        build_pdf(
            folder / "budget_note.pdf",
            "Note de budget familial",
            subtitle_for_quality("Synthese qualitative des charges declarees", budget_quality, budget_tags),
            [
                ("Profil", seed["full_name_or_company_name"]),
                ("Scenario", seed["scenario_label"]),
                ("Risque attendu", seed["expected_risk_level"]),
                ("Ville", seed["city"]),
            ],
            document_quality=budget_quality,
            degradation_tags=budget_tags,
        )

    build_pdf(
        folder / "asset_declaration.pdf",
        "Declaration simplifiee des actifs",
        "Document propre de demonstration pour justificatifs d'actifs individuels",
        [
            ("Titulaire", seed["full_name_or_company_name"]),
            ("Ville", seed["city"]),
            ("Scenario", seed["scenario_label"]),
            ("Valeur totale estimee", format_fcfa(sum(asset["estimated_value"] for asset in assets))),
        ],
        ["Type actif", "Description", "Valeur estimee", "Preuve", "Statut"],
        [
            [
                asset["asset_type"],
                asset["description"],
                format_fcfa(asset["estimated_value"]),
                asset["proof_mode"],
                asset["ownership_status"],
            ]
            for asset in assets
        ],
        document_quality="clean",
        degradation_tags=[],
    )

    ocr_quality, ocr_tags = document_variant(seed, "user", "ocr_scan.png", quality_config)
    create_ocr_image(
        folder / "ocr_scan.png",
        "Extrait document identitaire",
        [
            f"Nom: {seed['full_name_or_company_name']}",
            f"NIU: {seed['niu']}",
            f"Ville: {seed['city']}",
            f"Adresse: {seed['address']}",
            f"Telephone: {seed['phone']}",
        ],
        seed["profile_id"],
        document_quality=ocr_quality,
        degradation_tags=ocr_tags,
    )

    budget_quality, budget_tags = document_variant(seed, "user", "income_expenses.xlsx", quality_config)
    transaction_sheet = maybe_dirty_rows([["Date", "Reference", "Libelle", "Categorie", "Credit", "Debit", "Solde"]] + [
        [row["date"], row["reference"], row["label"], row["category"], row["credit"], row["debit"], row["balance"]]
        for row in statement
    ], budget_quality, seed["profile_id"], "Transactions budget menage")
    budget_sheet = maybe_dirty_rows(build_user_budget_rows(seed, statement), budget_quality, seed["profile_id"], "Synthese budget menage")
    user_workbook_sheets = {
        "Transactions": transaction_sheet,
        "Budget": budget_sheet,
    } if budget_quality == "dirty" else {
        "Budget": budget_sheet,
        "Transactions": transaction_sheet,
    }
    workbook_specs.append(
        workbook_spec(
            folder / "income_expenses.xlsx",
            user_workbook_sheets,
        )
    )
    workbook_specs.append(
        workbook_spec(
            folder / "asset_inventory.xlsx",
            {
                "Assets": [
                    ["Type actif", "Description", "Valeur estimee XAF", "Mode de preuve", "Statut de detention"],
                    *[
                        [
                            asset["asset_type"],
                            asset["description"],
                            asset["estimated_value"],
                            asset["proof_mode"],
                            asset["ownership_status"],
                        ]
                        for asset in assets
                    ],
                ],
            },
        )
    )

    files = [
        ("profile.json", "json", 1, "seed_profile", "identity,contact,login"),
        ("identity_card.pdf", "pdf", 2, "ocr_identity", "full_name,niu,date_of_birth,address"),
        ("proof_of_address.pdf", "pdf", 3, "address_validation", "address,city,region"),
        ("bank_statement.pdf", "pdf", 4, "statement_parsing", "credits,debits,balance"),
        ("income_expenses.xlsx", "xlsx", 5, "income_expense_excel", "income,expense,closing_balance"),
        ("ocr_scan.png", "png", 6, "ocr_image", "niu,address,phone"),
        ("asset_declaration.pdf", "pdf", 7, "asset_proof_pdf", "asset_type,estimated_value,ownership"),
        ("asset_inventory.xlsx", "xlsx", 8, "asset_inventory_excel", "asset_type,estimated_value,proof_mode"),
    ]
    order = 9
    for extra in extra_docs:
        files.append((extra, "pdf", order, "supporting_document", extra.replace(".pdf", "")))
        order += 1

    manifest = {
        "profile_id": seed["profile_id"],
        "profile_type": "user",
        "bank_id": seed["bank_id"],
        "scenario": seed["scenario_label"],
        "profile_quality": profile_quality,
        "documents": [],
    }
    for file_name, file_type, upload_order, extraction_goal, expected_fields in files:
        document_quality, degradation_tags = document_variant(seed, "user", file_name, quality_config)
        if file_name.startswith("asset_"):
            document_quality, degradation_tags = "clean", []
        register_document(
            manifest,
            mapping_rows,
            seed["profile_id"],
            "user",
            seed["bank_id"],
            file_name,
            file_type,
            upload_order,
            extraction_goal,
            expected_fields,
            document_quality,
            degradation_tags,
        )
    write_json(folder / "manifest.json", manifest)


def write_company_documents(
    seed: dict[str, Any],
    credentials_map: dict[str, dict[str, Any]],
    workbook_specs: list[dict[str, Any]],
    mapping_rows: list[dict[str, Any]],
    quality_config: dict[str, Any],
    force: bool,
) -> None:
    folder = ROOT / "companies" / seed["profile_id"]
    folder.mkdir(parents=True, exist_ok=True)
    credential = credentials_map.get(seed["profile_id"], {})
    statement = build_company_statement(seed)
    invoice_count = company_invoice_count(seed)
    assets = company_assets(seed)
    profile_quality = "dirty" if is_dirty_profile(seed, "company", quality_config) else "clean"

    write_json(
        folder / "company_profile.json",
        {
            "seed": seed,
            "login": credential,
            "profile_quality": profile_quality,
            "generated_at": datetime.now().isoformat(timespec="seconds"),
        },
    )

    statement_quality, statement_tags = document_variant(seed, "company", "bank_statement_enterprise.pdf", quality_config)
    build_pdf(
        folder / "bank_statement_enterprise.pdf",
        "Releve bancaire entreprise",
        subtitle_for_quality("Flux financiers synthetiques pour parsing PDF", statement_quality, statement_tags),
        [
            ("Entreprise", seed["company_name"]),
            ("Dirigeant", seed["leader_name"]),
            ("Activite", seed["main_activity"]),
            ("CA annuel", format_fcfa(seed["annual_revenue"])),
        ],
        ["Date opération", "Reference", "Libelle / particulars", "Categorie", "Deposit", "Withdrawal", "Running Balance"] if statement_quality == "dirty" else ["Date", "Reference", "Libelle", "Categorie", "Credit", "Debit", "Solde"],
        [[row["date"], row["reference"], row["label"], row["category"], format_fcfa(row["credit"]), format_fcfa(row["debit"]), format_fcfa(row["balance"])] for row in statement],
        document_quality=statement_quality,
        degradation_tags=statement_tags,
    )

    contract_quality, contract_tags = document_variant(seed, "company", "supplier_contract.pdf", quality_config)
    build_pdf(
        folder / "supplier_contract.pdf",
        "Contrat fournisseur / client",
        subtitle_for_quality("Convention commerciale synthetique", contract_quality, contract_tags),
        [
            ("Entreprise", seed["company_name"]),
            ("Secteur", seed["sector"]),
            ("Activite principale", seed["main_activity"]),
            ("Ville", seed["city"]),
        ],
        document_quality=contract_quality,
        degradation_tags=contract_tags,
    )

    build_pdf(
        folder / "asset_statement.pdf",
        "Etat simplifie des actifs immobilises",
        "Document propre de demonstration pour justificatifs d'actifs entreprise",
        [
            ("Entreprise", seed["company_name"]),
            ("Secteur", seed["sector"]),
            ("Ville", seed["city"]),
            ("Valeur totale estimee", format_fcfa(sum(asset["estimated_value"] for asset in assets))),
        ],
        ["Type actif", "Description", "Valeur estimee", "Preuve", "Depreciation"],
        [
            [
                asset["asset_type"],
                asset["description"],
                format_fcfa(asset["estimated_value"]),
                asset["proof_mode"],
                asset["depreciation_note"],
            ]
            for asset in assets
        ],
        document_quality="clean",
        degradation_tags=[],
    )

    ocr_quality, ocr_tags = document_variant(seed, "company", "ocr_scan.png", quality_config)
    create_ocr_image(
        folder / "ocr_scan.png",
        "Extrait piece entreprise",
        [
            f"Raison sociale: {seed['legal_name']}",
            f"RCCM: {seed['registration_number']}",
            f"NIU: {seed['tax_id']}",
            f"Ville: {seed['city']}",
            f"Dirigeant: {seed['leader_name']}",
        ],
        seed["profile_id"],
        document_quality=ocr_quality,
        degradation_tags=ocr_tags,
    )

    sales_quality, _sales_tags = document_variant(seed, "company", "sales_register.xlsx", quality_config)
    purchase_quality, _purchase_tags = document_variant(seed, "company", "purchase_register.xlsx", quality_config)
    workbook_specs.append(workbook_spec(folder / "sales_register.xlsx", {"Sales": maybe_dirty_rows(build_sales_rows(seed), sales_quality, seed["profile_id"], "Registre des ventes")})) 
    workbook_specs.append(workbook_spec(folder / "purchase_register.xlsx", {"Purchases": maybe_dirty_rows(build_purchase_rows(seed), purchase_quality, seed["profile_id"], "Registre des achats")}))
    workbook_specs.append(
        workbook_spec(
            folder / "fixed_assets_register.xlsx",
            {
                "Assets": [
                    ["Type actif", "Description", "Valeur brute XAF", "Mode de preuve", "Observation"],
                    *[
                        [
                            asset["asset_type"],
                            asset["description"],
                            asset["estimated_value"],
                            asset["proof_mode"],
                            asset["depreciation_note"],
                        ]
                        for asset in assets
                    ],
                ],
            },
        )
    )

    rng = stable_rng(seed["profile_id"], "invoices")
    invoice_files: list[str] = []
    for index in range(1, invoice_count + 1):
        invoice_name = f"invoice_{index:02d}.pdf"
        invoice_files.append(invoice_name)
        invoice_quality, invoice_tags = document_variant(seed, "company", invoice_name, quality_config)
        build_pdf(
            folder / invoice_name,
            f"Facture client {index:02d}",
            subtitle_for_quality("Facture synthetique pour analyse OCR/PDF", invoice_quality, invoice_tags),
            [
                ("Fournisseur", seed["company_name"]),
                ("Client", f"Client {index:02d} {seed['city']}"),
                ("Prestation", seed["main_activity"]),
                ("Montant HT", format_fcfa(int((seed["annual_revenue"] / 12) * rng.uniform(0.08, 0.17)))),
            ],
            document_quality=invoice_quality,
            degradation_tags=invoice_tags,
        )

    files = [
        ("company_profile.json", "json", 1, "company_seed_profile", "registration,tax_id,contacts"),
        ("bank_statement_enterprise.pdf", "pdf", 2, "enterprise_statement", "credits,debits,balance"),
        ("sales_register.xlsx", "xlsx", 3, "sales_excel", "dates,amounts,clients"),
        ("purchase_register.xlsx", "xlsx", 4, "purchase_excel", "dates,amounts,suppliers"),
        ("supplier_contract.pdf", "pdf", 5, "contract_parsing", "counterparty,activity,city"),
        ("ocr_scan.png", "png", 6, "ocr_enterprise", "registration_number,tax_id,leader"),
        ("asset_statement.pdf", "pdf", 7, "enterprise_asset_pdf", "asset_type,estimated_value,proof_mode"),
        ("fixed_assets_register.xlsx", "xlsx", 8, "enterprise_asset_excel", "asset_type,estimated_value,depreciation"),
    ]
    upload_order = 9
    for invoice_name in invoice_files:
        files.append((invoice_name, "pdf", upload_order, "invoice_parsing", "amount,client,service"))
        upload_order += 1

    manifest = {
        "profile_id": seed["profile_id"],
        "profile_type": "company",
        "bank_id": seed["bank_id"],
        "scenario": seed["scenario_label"],
        "profile_quality": profile_quality,
        "documents": [],
    }
    for file_name, file_type, order, extraction_goal, expected_fields in files:
        document_quality, degradation_tags = document_variant(seed, "company", file_name, quality_config)
        if "asset" in file_name:
            document_quality, degradation_tags = "clean", []
        register_document(
            manifest,
            mapping_rows,
            seed["profile_id"],
            "company",
            seed["bank_id"],
            file_name,
            file_type,
            order,
            extraction_goal,
            expected_fields,
            document_quality,
            degradation_tags,
        )
    write_json(folder / "manifest.json", manifest)


def write_bank_documents(
    seed: dict[str, Any],
    bank_users: list[dict[str, Any]],
    bank_companies: list[dict[str, Any]],
    credentials_map: dict[str, dict[str, Any]],
    workbook_specs: list[dict[str, Any]],
    mapping_rows: list[dict[str, Any]],
    force: bool,
) -> None:
    folder = ROOT / "banks" / seed["profile_id"]
    folder.mkdir(parents=True, exist_ok=True)

    write_json(
        folder / "bank_profile.json",
        {
            "seed": seed,
            "login": credentials_map.get(seed["profile_id"], {}),
            "profile_quality": "clean",
            "portfolio_summary": {
                "users": len(bank_users),
                "companies": len(bank_companies),
            },
        },
    )

    build_pdf(
        folder / "institution_sheet.pdf",
        "Fiche institutionnelle banque",
        "Presentation synthetique de l'etablissement",
        [
            ("Banque", seed["bank_name"]),
            ("Code", seed["institution_code"]),
            ("Ville siege", seed["city"]),
            ("Adresse", seed["address"]),
            ("Email", seed["email"]),
            ("Zones couvertes", ", ".join(seed["zones_covered"])),
        ],
    )
    build_pdf(
        folder / "credit_products.pdf",
        "Catalogue produits credit",
        "Offre simplifiee de demonstration",
        [
            ("Produit 1", "Avance salaire / 6 mois / 6.5%"),
            ("Produit 2", "Credit PME / 18 mois / 9.5%"),
            ("Produit 3", "Ligne tresorerie entreprise / 12 mois / 8.2%"),
        ],
    )
    build_pdf(
        folder / "coverage_note.pdf",
        "Note de couverture territoriale",
        "Resume des zones prioritaires et reseaux",
        [(f"Zone {idx}", zone) for idx, zone in enumerate(seed["zones_covered"], start=1)],
    )

    portfolio_sheets = build_bank_portfolio_rows(seed, bank_users, bank_companies)
    workbook_specs.append(workbook_spec(folder / "portfolio_snapshot.xlsx", portfolio_sheets))

    files = [
        ("bank_profile.json", "json", 1, "bank_seed_profile", "institution_code,address,city"),
        ("institution_sheet.pdf", "pdf", 2, "bank_profile_pdf", "bank_name,address,zones"),
        ("credit_products.pdf", "pdf", 3, "product_catalog", "products,rates,duration"),
        ("coverage_note.pdf", "pdf", 4, "regional_coverage_note", "zones,city"),
        ("portfolio_snapshot.xlsx", "xlsx", 5, "portfolio_excel", "clients,companies,risk"),
    ]

    manifest = {
        "profile_id": seed["profile_id"],
        "profile_type": "bank",
        "bank_id": seed["bank_id"],
        "profile_quality": "clean",
        "documents": [],
    }
    for file_name, file_type, order, extraction_goal, expected_fields in files:
        register_document(
            manifest,
            mapping_rows,
            seed["profile_id"],
            "bank",
            seed["bank_id"],
            file_name,
            file_type,
            order,
            extraction_goal,
            expected_fields,
            "clean",
            [],
        )
    write_json(folder / "manifest.json", manifest)


def export_mapping_workbooks(mapping_rows: list[dict[str, Any]], workbook_specs: list[dict[str, Any]]) -> None:
    headers = [
        "profile_id",
        "profile_type",
        "bank_id",
        "file_name",
        "file_type",
        "relative_path",
        "upload_order",
        "extraction_goal",
        "expected_fields",
        "document_quality",
        "degradation_tags",
    ]
    write_csv(MAPPING_CSV, mapping_rows, headers)

    profile_counts: dict[str, int] = {}
    for row in mapping_rows:
        profile_counts[row["profile_id"]] = profile_counts.get(row["profile_id"], 0) + 1

    workbook_specs.append(
        workbook_spec(
            MAPPING_XLSX,
            {
                "Mapping": [headers] + [[row.get(header, "") for header in headers] for row in mapping_rows],
                "ByProfile": [["profile_id", "document_count"]] + [[profile_id, count] for profile_id, count in sorted(profile_counts.items())],
            },
        )
    )


def run_workbook_builder(workbook_specs: list[dict[str, Any]]) -> None:
    ensure_node_resolution()
    write_json(WORKBOOK_SPEC_PATH, {"workbooks": workbook_specs})
    subprocess.run(
        [str(BUNDLED_NODE), str(BUILDER_PATH), str(WORKBOOK_SPEC_PATH)],
        cwd=PROJECT_ROOT,
        check=True,
    )


def update_readme(document_count: int, workbook_count: int, dirty_document_count: int, asset_document_count: int) -> None:
    readme = ROOT / "README.md"
    lines = [
        "# TERAS Synthetic Dataset Congo",
        "",
        "Ce dossier contient un jeu de donnees synthetiques realistes destine a TERAS, centre sur la Republique du Congo.",
        "",
        "## Objectif",
        "",
        "Preparer un dataset de demonstration et de QA permettant de tester :",
        "",
        "- la creation de profils banque, utilisateur et entreprise",
        "- l'upload de documents separes",
        "- l'OCR et le parsing PDF / Excel",
        "- l'enrichissement automatique",
        "- le calcul de score TERAS",
        "- la remontee des agregats vers les vues gouvernement Congo",
        "",
        "## Etat actuel",
        "",
        "- 63 profils synthetiques generes et importables dans TERAS",
        f"- {document_count} documents profil generes dans les dossiers `users/`, `companies/` et `banks/`",
        f"- {dirty_document_count} documents marques `dirty` pour tests OCR/PDF plus severes",
        f"- {asset_document_count} documents propres d'actifs individuels et entreprise",
        f"- {workbook_count} classeurs `.xlsx` generes pour mapping, budgets, ventes, achats et portefeuilles",
        "- identifiants de connexion exportes dans `seeds/login_credentials.*`",
        "",
        "## Structure",
        "",
        "- `mapping/` : correspondance profil -> documents",
        "- `seeds/` : exports de seed, identifiants et SQL optionnel",
        "- `master-data/` : fichiers maitres globaux",
        "- `users/` : sous-dossiers utilisateurs avec documents reels",
        "- `companies/` : sous-dossiers entreprises avec documents reels",
        "- `banks/` : sous-dossiers banques avec documents reels",
        "- `government/` : apercus et agregats cibles",
        "- `scripts/` : generateurs, importeurs et validateurs dataset",
        "",
    ]
    readme.write_text("\n".join(lines), encoding="utf-8")


def update_dataset_summary(document_count: int, user_count: int, company_count: int, bank_count: int, dirty_document_count: int, asset_document_count: int) -> None:
    path = ROOT / "DATASET_SUMMARY.md"
    if not path.exists():
        return
    previous = path.read_text(encoding="utf-8").rstrip()
    section = [
        "",
        "## Documents generes",
        "",
        f"- Utilisateurs documentes : {user_count}",
        f"- Entreprises documentees : {company_count}",
        f"- Banques documentees : {bank_count}",
        f"- Total documents generes : {document_count}",
        f"- Documents dirty controles : {dirty_document_count}",
        f"- Documents d'actifs propres : {asset_document_count}",
    ]
    replacement = "\n".join(section)
    if "## Documents generes" in previous:
        previous = previous.split("## Documents generes", 1)[0].rstrip()
    path.write_text(previous + "\n\n" + replacement + "\n", encoding="utf-8")


def maybe_limit(rows: list[dict[str, Any]], limit: int) -> list[dict[str, Any]]:
    return rows[:limit] if limit > 0 else rows


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()

    config = load_config()
    quality_config = dirty_quality_config(config)
    banks = load_json(SEEDS_DIR / "banks_seed.json")
    users = load_json(SEEDS_DIR / "users_seed.json")
    companies = load_json(SEEDS_DIR / "companies_seed.json")
    credentials = load_json(SEEDS_DIR / "login_credentials.json").get("credentials", [])
    credentials_map = {row["profile_id"]: row for row in credentials}

    workbook_specs: list[dict[str, Any]] = []
    mapping_rows: list[dict[str, Any]] = []
    generated_documents = 0

    selected_users = maybe_limit(users, args.limit) if args.profile_type in {"users", "all"} else []
    selected_companies = maybe_limit(companies, args.limit) if args.profile_type in {"companies", "all"} else []
    selected_banks = maybe_limit(banks, args.limit) if args.profile_type in {"banks", "all"} else []

    for seed in selected_users:
        write_user_documents(seed, credentials_map, workbook_specs, mapping_rows, quality_config, args.force)
    for seed in selected_companies:
        write_company_documents(seed, credentials_map, workbook_specs, mapping_rows, quality_config, args.force)
    for seed in selected_banks:
        bank_users = [row for row in users if row["bank_id"] == seed["bank_id"]]
        bank_companies = [row for row in companies if row["bank_id"] == seed["bank_id"]]
        write_bank_documents(seed, bank_users, bank_companies, credentials_map, workbook_specs, mapping_rows, args.force)

    export_mapping_workbooks(mapping_rows, workbook_specs)
    run_workbook_builder(workbook_specs)

    generated_documents = len(mapping_rows)
    dirty_document_count = sum(1 for row in mapping_rows if row.get("document_quality") == "dirty")
    asset_document_count = sum(1 for row in mapping_rows if "asset" in row["file_name"])
    update_readme(generated_documents, len(workbook_specs), dirty_document_count, asset_document_count)
    if args.profile_type == "all" and args.limit == 0:
        update_dataset_summary(generated_documents, len(selected_users), len(selected_companies), len(selected_banks), dirty_document_count, asset_document_count)

    print("Documents synthetiques generes.")
    print(f"Type cible : {args.profile_type}")
    print(f"Documents traces dans le mapping : {generated_documents}")
    print(f"Classeurs exportes : {len(workbook_specs)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
