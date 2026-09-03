"""
bank_setup.py — Script de mise en place de la banque TERAS
Lance depuis la racine du projet :
  python bank_setup.py
"""
import os, sys, django
os.chdir(os.path.dirname(os.path.abspath(__file__)) + "/backend")
sys.path.insert(0, '.')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from decimal import Decimal
from scoring.models_bank import FinancialProduct

# ── Produits financiers CEMAC / Congo Brazzaville ────────────────────────────

PRODUCTS = [
    {
        "name":         "Microcrédit Tontine ZOLA",
        "product_type": "microcredit",
        "description":  "Microcrédit express pour les membres de tontines et groupements informels. Accès rapide via ZOLA mobile money. Idéal pour les petits commerçants et vendeurs du marché.",
        "features":     ["Déblocage en 24h", "Sans garantie < 100k FCFA", "Remboursement flexible", "Intégré ZOLA mobile money"],
        "requirements": ["NIU valide", "3 mois d'activité ZOLA", "Aucun défaut actif"],
        "risk_level":   "high",
        "min_amount":   Decimal("25000"),
        "max_amount":   Decimal("300000"),
        "min_duration_months": 1,
        "max_duration_months": 3,
        "interest_rate":  Decimal("12.00"),
        "origination_fee": Decimal("1.00"),
        "min_score_required": 350,
        "max_age": 70,
        "min_income": Decimal("50000"),
        "is_default": True,
    },
    {
        "name":         "Avance sur Salaire",
        "product_type": "salary",
        "description":  "Avance jusqu'à 3 mois de salaire pour les fonctionnaires et employés du secteur formel. Remboursement par prélèvement sur salaire.",
        "features":     ["Jusqu'à 3 salaires", "Taux préférentiel fonctionnaires", "Prélèvement automatique", "Réponse en 48h"],
        "requirements": ["Fiche de paie 3 derniers mois", "NIU", "Attestation employeur", "Domiciliation salaire"],
        "risk_level":   "low",
        "min_amount":   Decimal("100000"),
        "max_amount":   Decimal("1500000"),
        "min_duration_months": 1,
        "max_duration_months": 6,
        "interest_rate":  Decimal("6.00"),
        "origination_fee": Decimal("1.00"),
        "min_score_required": 500,
        "max_age": 62,
        "min_income": Decimal("150000"),
        "is_default": True,
    },
    {
        "name":         "Crédit Consommation Starter",
        "product_type": "personal",
        "description":  "Crédit personnel pour besoins courants : équipement ménager, frais médicaux, événements familiaux. Idéal pour les clients avec historique ZOLA régulier.",
        "features":     ["Pas de justificatif d'usage", "Taux fixe garanti", "Remboursement mensuel", "Assurance décès incluse"],
        "requirements": ["NIU", "Score TERAS ≥ 500", "Revenu vérifiable", "1 garant ou épargne bloquée"],
        "risk_level":   "medium",
        "min_amount":   Decimal("100000"),
        "max_amount":   Decimal("1000000"),
        "min_duration_months": 3,
        "max_duration_months": 12,
        "interest_rate":  Decimal("10.00"),
        "origination_fee": Decimal("1.50"),
        "min_score_required": 500,
        "max_age": 65,
        "min_income": Decimal("100000"),
        "is_default": True,
    },
    {
        "name":         "Crédit Auto Moto",
        "product_type": "auto",
        "description":  "Financement de véhicules utilitaires, motos-taxis et voitures personnelles. Le véhicule sert de garantie. Adapté aux chauffeurs indépendants.",
        "features":     ["Financement jusqu'à 80% du véhicule", "Gage du véhicule en garantie", "Assurance auto obligatoire", "Expertise locale gratuite"],
        "requirements": ["NIU", "Permis de conduire", "Devis fournisseur", "Score TERAS ≥ 550", "Apport 20%"],
        "risk_level":   "medium",
        "min_amount":   Decimal("500000"),
        "max_amount":   Decimal("10000000"),
        "min_duration_months": 12,
        "max_duration_months": 48,
        "interest_rate":  Decimal("9.00"),
        "origination_fee": Decimal("1.50"),
        "min_score_required": 550,
        "max_age": 60,
        "min_income": Decimal("200000"),
        "is_default": True,
    },
    {
        "name":         "Crédit PME Croissance",
        "product_type": "pme",
        "description":  "Financement des petites et moyennes entreprises pour fonds de roulement, équipements et développement. Éligible aux entreprises avec RCCM et NIU fiscal.",
        "features":     ["Fonds de roulement ou investissement", "Franchise possible 3 mois", "Accompagnement TERAS IA", "Connexion écosystème SFEC"],
        "requirements": ["RCCM valide", "NIU fiscal", "Bilans 2 derniers exercices", "Score TERAS entreprise ≥ 600", "Plan d'affaires"],
        "risk_level":   "medium",
        "min_amount":   Decimal("1000000"),
        "max_amount":   Decimal("50000000"),
        "min_duration_months": 6,
        "max_duration_months": 60,
        "interest_rate":  Decimal("11.00"),
        "origination_fee": Decimal("2.00"),
        "min_score_required": 600,
        "max_age": 70,
        "min_income": Decimal("500000"),
        "is_default": True,
    },
    {
        "name":         "Crédit Immobilier Habitat",
        "product_type": "immobilier",
        "description":  "Acquisition, construction ou rénovation de logement à Brazzaville et dans les grandes villes du Congo. Taux fixe sur toute la durée.",
        "features":     ["Financement jusqu'à 70% de la valeur", "Taux fixe garanti", "Durée jusqu'à 20 ans", "Assurance habitation incluse"],
        "requirements": ["NIU", "Titre foncier ou bail emphytéotique", "Score TERAS ≥ 650", "Apport 30%", "Acte notarié"],
        "risk_level":   "low",
        "min_amount":   Decimal("5000000"),
        "max_amount":   Decimal("150000000"),
        "min_duration_months": 60,
        "max_duration_months": 240,
        "interest_rate":  Decimal("8.50"),
        "origination_fee": Decimal("2.00"),
        "min_score_required": 650,
        "max_age": 55,
        "min_income": Decimal("400000"),
        "is_default": True,
    },
    {
        "name":         "Crédit Éducation Avenir",
        "product_type": "education",
        "description":  "Financement des frais de scolarité, formations professionnelles et études supérieures. Remboursement différé possible pendant les études.",
        "features":     ["Différé de remboursement 12 mois", "Taux réduit étudiant", "Paiement direct à l'établissement", "Renouvellement annuel automatique"],
        "requirements": ["NIU du garant (parent/tuteur)", "Attestation d'inscription", "Score TERAS garant ≥ 450"],
        "risk_level":   "medium",
        "min_amount":   Decimal("200000"),
        "max_amount":   Decimal("5000000"),
        "min_duration_months": 12,
        "max_duration_months": 60,
        "interest_rate":  Decimal("7.50"),
        "origination_fee": Decimal("1.00"),
        "min_score_required": 450,
        "max_age": 70,
        "min_income": Decimal("100000"),
        "is_default": True,
    },
    {
        "name":         "Crédit Agricole Saison",
        "product_type": "agricole",
        "description":  "Financement des activités agricoles et d'élevage dans les zones rurales du Congo. Remboursement calé sur les cycles de récolte.",
        "features":     ["Remboursement post-récolte", "Financement intrants et équipements", "Suivi agronomique", "Assurance récolte disponible"],
        "requirements": ["NIU", "Attestation d'exploitation", "Score TERAS ≥ 400", "Superficie déclarée"],
        "risk_level":   "high",
        "min_amount":   Decimal("100000"),
        "max_amount":   Decimal("5000000"),
        "min_duration_months": 6,
        "max_duration_months": 18,
        "interest_rate":  Decimal("8.00"),
        "origination_fee": Decimal("1.00"),
        "min_score_required": 400,
        "max_age": 70,
        "min_income": Decimal("50000"),
        "is_default": True,
    },
]


def seed_products():
    created = 0
    updated = 0
    for p in PRODUCTS:
        obj, is_new = FinancialProduct.objects.update_or_create(
            name=p["name"],
            defaults=p,
        )
        if is_new:
            created += 1
            print(f"  ✅ Créé : {obj.name}")
        else:
            updated += 1
            print(f"  🔄 Mis à jour : {obj.name}")
    print(f"\nRésultat : {created} créés, {updated} mis à jour")
    print(f"Total produits : {FinancialProduct.objects.count()}")


if __name__ == "__main__":
    print("🏦 Peuplement des produits financiers TERAS Bank (CEMAC/Congo)...")
    seed_products()
    print("\n✅ Terminé !")
