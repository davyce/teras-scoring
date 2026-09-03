"""
Script de création de données de test pour TERAS Entreprise
Crée un compte entreprise avec:
- Score TERAS Entreprise: 720
- 5 clients B2B mockés
- 10 employés mockés
- Documents mockés
- Conformité à 72%
- Historique de scores (6 mois)

USAGE:
python manage.py shell < scripts/create_test_enterprise_data.py
"""

import os
import django
from datetime import datetime, timedelta
from decimal import Decimal

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from scoring.models_enterprise import (
    EnterpriseClient,
    Employee,
    EnterpriseDocument,
    ComplianceStatus,
    EnterpriseReport,
    EnterpriseScore
)

User = get_user_model()

print("=" * 80)
print("CRÉATION DES DONNÉES DE TEST POUR TERAS ENTREPRISE")
print("=" * 80)

# ============================================================================
# 1. CRÉER LE COMPTE ENTREPRISE
# ============================================================================

print("\n[1/7] Création du compte Enterprise...")

try:
    enterprise_user = User.objects.get(email='enterprise@teras.com')
    print(f"   ✅ Compte existe déjà: {enterprise_user.email}")
except User.DoesNotExist:
    enterprise_user = User.objects.create_user(
        email='enterprise@teras.com',
        password='ent123',
        username='enterprise_demo',
        first_name='Entreprise',
        last_name='DEMO Congo',
        user_type='enterprise',
        is_active=True  # Déjà validé pour les tests
    )
    print(f"   ✅ Compte créé: {enterprise_user.email}")

# ============================================================================
# 2. CRÉER LES CLIENTS B2B
# ============================================================================

print("\n[2/7] Création des clients B2B (5 clients)...")

clients_data = [
    {
        'name': 'Client TERAS BASIC 001',
        'client_type': 'individual',
        'kyc_id': 'KYC-IND-2024-001',
        'internal_ref': 'CLT-001',
        'teras_score': 735,
        'status': 'active',
        'notes': 'Particulier avec bon historique de paiement'
    },
    {
        'name': 'Boutique Marchand OYO',
        'client_type': 'pme',
        'kyc_id': 'KYC-PME-2024-002',
        'internal_ref': 'CLT-002',
        'teras_score': 610,
        'status': 'active',
        'notes': 'PME dans le commerce de détail'
    },
    {
        'name': 'Transport Urbain Brazzaville',
        'client_type': 'company',
        'kyc_id': 'KYC-ENT-2024-003',
        'internal_ref': 'CLT-003',
        'teras_score': 480,
        'status': 'active',
        'notes': 'Entreprise de transport, quelques retards'
    },
    {
        'name': 'Restaurant Le Mbongo',
        'client_type': 'pme',
        'kyc_id': 'KYC-PME-2024-004',
        'internal_ref': 'CLT-004',
        'teras_score': 820,
        'status': 'active',
        'notes': 'Excellent client, toujours à jour'
    },
    {
        'name': 'Nouveau Prospect Tech SA',
        'client_type': 'company',
        'kyc_id': 'KYC-ENT-2024-005',
        'internal_ref': 'CLT-005',
        'teras_score': None,  # Pas encore scoré
        'status': 'pending',
        'notes': 'Dossier en cours d\'analyse'
    },
]

for client_data in clients_data:
    client, created = EnterpriseClient.objects.get_or_create(
        enterprise=enterprise_user,
        kyc_id=client_data['kyc_id'],
        defaults=client_data
    )
    status_icon = "🆕" if created else "✅"
    print(f"   {status_icon} {client.name} - Score: {client.teras_score or 'N/A'}")

# ============================================================================
# 3. CRÉER LES EMPLOYÉS
# ============================================================================

print("\n[3/7] Création des employés (10 employés)...")

employees_data = [
    {
        'first_name': 'Jean',
        'last_name': 'Makaya',
        'employee_id': 'EMP-2024-001',
        'position': 'Directeur Commercial',
        'department': 'Ventes',
        'hire_date': datetime(2022, 1, 15).date(),
        'employment_type': 'permanent',
        'salary': Decimal('800000.00'),
        'is_local': True,
        'status': 'active'
    },
    {
        'first_name': 'Marie',
        'last_name': 'Nkounkou',
        'employee_id': 'EMP-2024-002',
        'position': 'Comptable',
        'department': 'Finance',
        'hire_date': datetime(2023, 3, 1).date(),
        'employment_type': 'permanent',
        'salary': Decimal('500000.00'),
        'is_local': True,
        'status': 'active'
    },
    {
        'first_name': 'Paul',
        'last_name': 'Mboungou',
        'employee_id': 'EMP-2024-003',
        'position': 'Analyste Crédit',
        'department': 'Risques',
        'hire_date': datetime(2023, 6, 1).date(),
        'employment_type': 'permanent',
        'salary': Decimal('450000.00'),
        'is_local': True,
        'status': 'active'
    },
    {
        'first_name': 'Grace',
        'last_name': 'Okemba',
        'employee_id': 'EMP-2024-004',
        'position': 'Assistante Administrative',
        'department': 'Administration',
        'hire_date': datetime(2024, 1, 15).date(),
        'employment_type': 'contract',
        'salary': Decimal('300000.00'),
        'is_local': True,
        'status': 'active'
    },
    {
        'first_name': 'David',
        'last_name': 'Bitemo',
        'employee_id': 'EMP-2024-005',
        'position': 'Commercial',
        'department': 'Ventes',
        'hire_date': datetime(2023, 9, 1).date(),
        'employment_type': 'permanent',
        'salary': Decimal('400000.00'),
        'is_local': True,
        'status': 'active'
    },
    {
        'first_name': 'Sophie',
        'last_name': 'Nganga',
        'employee_id': 'EMP-2024-006',
        'position': 'Responsable RH',
        'department': 'Ressources Humaines',
        'hire_date': datetime(2022, 5, 1).date(),
        'employment_type': 'permanent',
        'salary': Decimal('600000.00'),
        'is_local': True,
        'status': 'active'
    },
    {
        'first_name': 'Thomas',
        'last_name': 'Mabiala',
        'employee_id': 'EMP-2024-007',
        'position': 'IT Support',
        'department': 'Informatique',
        'hire_date': datetime(2023, 11, 1).date(),
        'employment_type': 'contract',
        'salary': Decimal('350000.00'),
        'is_local': True,
        'status': 'active'
    },
    {
        'first_name': 'Esther',
        'last_name': 'Mvou',
        'employee_id': 'EMP-2024-008',
        'position': 'Stagiaire Marketing',
        'department': 'Marketing',
        'hire_date': datetime(2024, 7, 1).date(),
        'employment_type': 'intern',
        'salary': Decimal('150000.00'),
        'is_local': True,
        'status': 'active'
    },
    {
        'first_name': 'Patrick',
        'last_name': 'Koumba',
        'employee_id': 'EMP-2024-009',
        'position': 'Agent de Sécurité',
        'department': 'Sécurité',
        'hire_date': datetime(2023, 2, 1).date(),
        'employment_type': 'contract',
        'salary': Decimal('250000.00'),
        'is_local': True,
        'status': 'active'
    },
    {
        'first_name': 'Lydie',
        'last_name': 'Ngouabi',
        'employee_id': 'EMP-2024-010',
        'position': 'Responsable Conformité',
        'department': 'Conformité',
        'hire_date': datetime(2022, 8, 1).date(),
        'employment_type': 'permanent',
        'salary': Decimal('700000.00'),
        'is_local': True,
        'status': 'active'
    },
]

for emp_data in employees_data:
    employee, created = Employee.objects.get_or_create(
        enterprise=enterprise_user,
        employee_id=emp_data['employee_id'],
        defaults=emp_data
    )
    status_icon = "🆕" if created else "✅"
    print(f"   {status_icon} {employee.full_name} - {employee.position}")

# ============================================================================
# 4. CRÉER LES DOCUMENTS
# ============================================================================

print("\n[4/7] Création des documents (3 documents)...")

documents_data = [
    {
        'category': 'tax_filing',
        'title': 'Déclaration Fiscale Q3 2024',
        'period': 'Q3 2024',
        'period_start': datetime(2024, 7, 1).date(),
        'period_end': datetime(2024, 9, 30).date(),
        'status': 'validated',
    },
    {
        'category': 'balance_sheet',
        'title': 'Bilan Comptable 2023',
        'period': 'Année 2023',
        'period_start': datetime(2023, 1, 1).date(),
        'period_end': datetime(2023, 12, 31).date(),
        'status': 'validated',
    },
    {
        'category': 'payroll',
        'title': 'Registre Paie Octobre 2024',
        'period': 'Octobre 2024',
        'period_start': datetime(2024, 10, 1).date(),
        'period_end': datetime(2024, 10, 31).date(),
        'status': 'processing',
    },
]

for doc_data in documents_data:
    # Note: On ne crée pas de vrais fichiers, juste les entrées DB
    doc, created = EnterpriseDocument.objects.get_or_create(
        enterprise=enterprise_user,
        title=doc_data['title'],
        defaults=doc_data
    )
    status_icon = "🆕" if created else "✅"
    print(f"   {status_icon} {doc.title} - {doc.get_status_display()}")

# ============================================================================
# 5. CRÉER LE STATUT DE CONFORMITÉ
# ============================================================================

print("\n[5/7] Création du statut de conformité...")

compliance_data = {
    'compliance_rate': Decimal('72.00'),
    'last_tax_filing': datetime(2024, 9, 30).date(),
    'missing_declarations': [
        {
            'type': 'Bilan fiscal Q3 2024',
            'deadline': '2024-12-15',
            'severity': 'warning'
        }
    ],
    'late_payments': 2,
    'penalties': Decimal('150000.00'),
    'active_alerts': [
        {
            'id': 'ALT-001',
            'level': 'warning',
            'message': 'Bilan fiscal Q3 2024 manquant',
            'deadline': '2024-12-15',
            'created_at': '2024-11-01'
        },
        {
            'id': 'ALT-002',
            'level': 'info',
            'message': '2 paiements en retard détectés',
            'action': 'Régulariser dans les 30 jours',
            'created_at': '2024-11-15'
        }
    ],
    'recommendations': [
        'Soumettre le bilan fiscal Q3 2024 avant le 15 décembre',
        'Régulariser les 2 paiements en retard (total: 150 000 FCFA)',
        'Mettre en place des rappels automatiques pour les échéances fiscales',
        'Consulter un expert-comptable pour optimiser la conformité'
    ],
    'last_audit_date': datetime(2024, 6, 1).date(),
    'next_audit_date': datetime(2025, 6, 1).date(),
}

compliance, created = ComplianceStatus.objects.update_or_create(
    enterprise=enterprise_user,
    defaults=compliance_data
)
status_icon = "🆕" if created else "✅"
print(f"   {status_icon} Conformité: {compliance.compliance_rate}%")

# ============================================================================
# 6. CRÉER L'HISTORIQUE DES SCORES (6 mois)
# ============================================================================

print("\n[6/7] Création de l'historique des scores (6 derniers mois)...")

# Scores mensuels avec évolution progressive
scores_history = [
    # (mois_decalage, score, breakdown)
    (-5, 680, {'T': 0.68, 'E': 0.70, 'R': 0.65, 'A': 0.72, 'S': 0.60}),
    (-4, 695, {'T': 0.70, 'E': 0.72, 'R': 0.66, 'A': 0.73, 'S': 0.62}),
    (-3, 705, {'T': 0.71, 'E': 0.73, 'R': 0.68, 'A': 0.74, 'S': 0.64}),
    (-2, 710, {'T': 0.72, 'E': 0.74, 'R': 0.69, 'A': 0.75, 'S': 0.65}),
    (-1, 715, {'T': 0.73, 'E': 0.75, 'R': 0.70, 'A': 0.76, 'S': 0.66}),
    (0,  720, {'T': 0.74, 'E': 0.76, 'R': 0.71, 'A': 0.77, 'S': 0.67}),  # Actuel
]

for months_ago, score, breakdown in scores_history:
    computed_at = datetime.now() + timedelta(days=months_ago * 30)
    
    score_obj, created = EnterpriseScore.objects.get_or_create(
        enterprise=enterprise_user,
        computed_at=computed_at,
        defaults={
            'score': score,
            'breakdown': breakdown,
            'sector': 'Finance et Services',
            'sector_average': 680,
            'percentile': 65,
            'input_data': {
                'total_clients': 5,
                'total_employees': 10,
                'compliance_rate': 72,
            }
        }
    )
    status_icon = "🆕" if created else "✅"
    month_label = computed_at.strftime('%b %Y')
    print(f"   {status_icon} {month_label}: Score {score}")

# ============================================================================
# 7. CRÉER UN RAPPORT EXEMPLE
# ============================================================================

print("\n[7/7] Création d'un rapport exemple...")

report_data = {
    'report_type': 'quarterly',
    'title': 'Rapport Trimestriel Q3 2024',
    'period_start': datetime(2024, 7, 1).date(),
    'period_end': datetime(2024, 9, 30).date(),
    'status': 'ready',
    'report_data': {
        'period': {
            'start': '2024-07-01',
            'end': '2024-09-30'
        },
        'average_score': 710,
        'total_clients': 5,
        'total_employees': 10,
        'compliance_rate': 72,
    }
}

report, created = EnterpriseReport.objects.get_or_create(
    enterprise=enterprise_user,
    title=report_data['title'],
    defaults=report_data
)
status_icon = "🆕" if created else "✅"
print(f"   {status_icon} {report.title} - {report.get_status_display()}")

# ============================================================================
# RÉCAPITULATIF
# ============================================================================

print("\n" + "=" * 80)
print("✅ DONNÉES DE TEST CRÉÉES AVEC SUCCÈS !")
print("=" * 80)

print("\n📊 RÉCAPITULATIF:")
print(f"   • Compte Entreprise: {enterprise_user.email}")
print(f"   • Password: ent123")
print(f"   • Score TERAS: 720/1000")
print(f"   • Clients B2B: {EnterpriseClient.objects.filter(enterprise=enterprise_user).count()}")
print(f"   • Employés: {Employee.objects.filter(enterprise=enterprise_user).count()}")
print(f"   • Documents: {EnterpriseDocument.objects.filter(enterprise=enterprise_user).count()}")
print(f"   • Conformité: {compliance.compliance_rate}%")
print(f"   • Historique scores: 6 mois")
print(f"   • Rapports: 1")

print("\n🔐 CONNEXION:")
print("   URL: http://localhost:5173/login")
print("   Email: enterprise@teras.com")
print("   Password: ent123")

print("\n🎯 PROCHAINE ÉTAPE:")
print("   1. Démarrer le backend: python manage.py runserver")
print("   2. Démarrer le frontend: cd frontend && npm run dev")
print("   3. Se connecter avec le compte enterprise")
print("   4. Tester le dashboard Enterprise")

print("\n" + "=" * 80)
