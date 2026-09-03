# backend/scripts/create_test_bank_data.py
"""
Script pour créer les données de test pour l'interface Bank
Exécuter: python manage.py shell < scripts/create_test_bank_data.py
"""

from django.contrib.auth import get_user_model
from scoring.models_bank import BankClient, BankEnterprise, FinancialProduct, LoanApplication
from datetime import date, datetime, timedelta
from decimal import Decimal

User = get_user_model()

print("🏦 Création des données de test pour l'interface Bank...")

# 1. Créer le compte utilisateur banque
print("\n1️⃣ Création du compte bank...")
bank_user, created = User.objects.get_or_create(
    email='bank@teras.com',
    defaults={
        'username': 'bank_user',
        'first_name': 'Bank',
        'last_name': 'Manager',
        'user_type': 'bank',
        'is_active': True,
    }
)
if created:
    bank_user.set_password('bank123')
    bank_user.save()
    print(f"✅ Compte créé: {bank_user.email} / bank123")
else:
    print(f"ℹ️  Compte existant: {bank_user.email}")

# 2. Créer les clients particuliers
print("\n2️⃣ Création de 10 clients particuliers...")

clients_data = [
    {
        'first_name': 'Jean', 'last_name': 'Mukendi',
        'email': 'jean.mukendi@email.cd', 'phone': '+243 81 234 5678',
        'date_of_birth': date(1985, 3, 15), 'national_id': 'CIV-2024-00145',
        'address': '12 Avenue Lumumba', 'city': 'Kinshasa',
        'occupation': 'Ingénieur', 'monthly_income': Decimal('350000'),
        'teras_score': 720, 'teras_band': 'B', 'active_loans_count': 1,
        'total_borrowed': Decimal('2500000'), 'status': 'active'
    },
    {
        'first_name': 'Marie', 'last_name': 'Kanda',
        'email': 'marie.kanda@email.cd', 'phone': '+243 82 345 6789',
        'date_of_birth': date(1990, 7, 22), 'national_id': 'CIV-2024-00287',
        'address': '45 Boulevard du 30 Juin', 'city': 'Kinshasa',
        'occupation': 'Commerçante', 'monthly_income': Decimal('220000'),
        'teras_score': 680, 'teras_band': 'C', 'active_loans_count': 1,
        'total_borrowed': Decimal('1200000'), 'status': 'active'
    },
    {
        'first_name': 'Paul', 'last_name': 'Nzambi',
        'email': 'paul.nzambi@email.cd', 'phone': '+243 83 456 7890',
        'date_of_birth': date(1982, 11, 8), 'national_id': 'CIV-2024-00512',
        'address': '78 Avenue Kasavubu', 'city': 'Kinshasa',
        'occupation': 'Directeur Commercial', 'monthly_income': Decimal('580000'),
        'teras_score': 760, 'teras_band': 'B', 'active_loans_count': 2,
        'total_borrowed': Decimal('4200000'), 'status': 'active'
    },
    {
        'first_name': 'Sophie', 'last_name': 'Ikolo',
        'email': 'sophie.ikolo@email.cd', 'phone': '+243 84 567 8901',
        'date_of_birth': date(1988, 5, 19), 'national_id': 'CIV-2024-00634',
        'address': '23 Rue de la Gombe', 'city': 'Kinshasa',
        'occupation': 'Médecin', 'monthly_income': Decimal('750000'),
        'teras_score': 750, 'teras_band': 'B', 'active_loans_count': 1,
        'total_borrowed': Decimal('12000000'), 'status': 'active'
    },
    {
        'first_name': 'David', 'last_name': 'Lombe',
        'email': 'david.lombe@email.cd', 'phone': '+243 85 678 9012',
        'date_of_birth': date(1992, 2, 14), 'national_id': 'CIV-2024-00723',
        'address': '56 Avenue Kasa-Vubu', 'city': 'Lubumbashi',
        'occupation': 'Entrepreneur', 'monthly_income': Decimal('420000'),
        'teras_score': 760, 'teras_band': 'B', 'active_loans_count': 1,
        'total_borrowed': Decimal('4200000'), 'status': 'active'
    },
    {
        'first_name': 'Thomas', 'last_name': 'Kongo',
        'email': 'thomas.kongo@email.cd', 'phone': '+243 86 789 0123',
        'date_of_birth': date(1987, 9, 3), 'national_id': 'CIV-2024-00789',
        'address': '89 Boulevard Lumumba', 'city': 'Kinshasa',
        'occupation': 'Chef d\'Entreprise', 'monthly_income': Decimal('920000'),
        'teras_score': 780, 'teras_band': 'B', 'active_loans_count': 1,
        'total_borrowed': Decimal('15000000'), 'status': 'active'
    },
    {
        'first_name': 'Patrick', 'last_name': 'Moukoko',
        'email': 'patrick.moukoko@email.cd', 'phone': '+243 87 890 1234',
        'date_of_birth': date(1995, 6, 28), 'national_id': 'CIV-2024-00823',
        'address': '34 Rue de la Paix', 'city': 'Brazzaville',
        'occupation': 'Vendeur', 'monthly_income': Decimal('150000'),
        'teras_score': 580, 'teras_band': 'D', 'active_loans_count': 1,
        'total_borrowed': Decimal('350000'), 'status': 'active'
    },
    {
        'first_name': 'Alice', 'last_name': 'Mbemba',
        'email': 'alice.mbemba@email.cd', 'phone': '+243 88 901 2345',
        'date_of_birth': date(1991, 4, 17), 'national_id': 'CIV-2024-00891',
        'address': '67 Avenue Mobutu', 'city': 'Kinshasa',
        'occupation': 'Enseignante', 'monthly_income': Decimal('280000'),
        'teras_score': 650, 'teras_band': 'C', 'active_loans_count': 0,
        'total_borrowed': Decimal('800000'), 'status': 'active'
    },
    {
        'first_name': 'Robert', 'last_name': 'Ngoma',
        'email': 'robert.ngoma@email.cd', 'phone': '+243 89 012 3456',
        'date_of_birth': date(1993, 8, 25), 'national_id': 'CIV-2024-00934',
        'address': '12 Rue de l\'Équateur', 'city': 'Kisangani',
        'occupation': 'Agriculteur', 'monthly_income': Decimal('180000'),
        'teras_score': 620, 'teras_band': 'C', 'active_loans_count': 1,
        'total_borrowed': Decimal('900000'), 'status': 'active'
    },
    {
        'first_name': 'Christine', 'last_name': 'Malala',
        'email': 'christine.malala@email.cd', 'phone': '+243 81 123 4567',
        'date_of_birth': date(1989, 12, 10), 'national_id': 'CIV-2024-01012',
        'address': '90 Avenue Patrice Lumumba', 'city': 'Kinshasa',
        'occupation': 'Comptable', 'monthly_income': Decimal('385000'),
        'teras_score': 740, 'teras_band': 'B', 'active_loans_count': 1,
        'total_borrowed': Decimal('3200000'), 'status': 'active'
    },
]

clients = []
for data in clients_data:
    client, created = BankClient.objects.get_or_create(
        email=data['email'],
        defaults=data
    )
    clients.append(client)
    if created:
        print(f"   ✅ {client.get_full_name()} - Score: {client.teras_score}")

print(f"✅ {len(clients)} clients créés")

# 3. Créer les entreprises clientes
print("\n3️⃣ Création de 5 entreprises clientes...")

enterprises_data = [
    {
        'name': 'Restaurant Le Fleuve',
        'legal_name': 'Restaurant Le Fleuve SARL',
        'registration_number': 'ENT-KIN-2024-001',
        'tax_id': 'TAX-CD-2024-12345',
        'enterprise_type': 'pme',
        'email': 'contact@lefleuve.cd',
        'phone': '+243 81 555 0001',
        'address': '145 Boulevard du 30 Juin',
        'city': 'Kinshasa',
        'annual_revenue': Decimal('28000000'),
        'employees_count': 15,
        'teras_score': 780,
        'teras_band': 'B',
        'active_loans_count': 1,
        'total_borrowed': Decimal('3500000'),
        'status': 'active'
    },
    {
        'name': 'Transport Mboka',
        'legal_name': 'Transport Mboka SPRL',
        'registration_number': 'ENT-KIN-2024-002',
        'tax_id': 'TAX-CD-2024-23456',
        'enterprise_type': 'pme',
        'email': 'info@transportmboka.cd',
        'phone': '+243 82 555 0002',
        'address': '78 Avenue de la Liberation',
        'city': 'Kinshasa',
        'annual_revenue': Decimal('42000000'),
        'employees_count': 28,
        'teras_score': 710,
        'teras_band': 'B',
        'active_loans_count': 1,
        'total_borrowed': Decimal('2800000'),
        'status': 'active'
    },
    {
        'name': 'Startup Tech Innovation',
        'legal_name': 'Tech Innovation SARL',
        'registration_number': 'ENT-KIN-2024-003',
        'tax_id': 'TAX-CD-2024-34567',
        'enterprise_type': 'startup',
        'email': 'hello@techinnovation.cd',
        'phone': '+243 83 555 0003',
        'address': '23 Avenue de l\'Université',
        'city': 'Kinshasa',
        'annual_revenue': Decimal('18000000'),
        'employees_count': 8,
        'teras_score': 690,
        'teras_band': 'C',
        'active_loans_count': 1,
        'total_borrowed': Decimal('1500000'),
        'status': 'active'
    },
    {
        'name': 'Pharmacie Santé Plus',
        'legal_name': 'Pharmacie Santé Plus SARL',
        'registration_number': 'ENT-KIN-2024-004',
        'tax_id': 'TAX-CD-2024-45678',
        'enterprise_type': 'pme',
        'email': 'contact@santeplus.cd',
        'phone': '+243 84 555 0004',
        'address': '56 Avenue de la Victoire',
        'city': 'Lubumbashi',
        'annual_revenue': Decimal('35000000'),
        'employees_count': 12,
        'teras_score': 750,
        'teras_band': 'B',
        'active_loans_count': 0,
        'total_borrowed': Decimal('0'),
        'status': 'active'
    },
    {
        'name': 'Construction Bâtir Avenir',
        'legal_name': 'Construction Bâtir Avenir SA',
        'registration_number': 'ENT-KIN-2024-005',
        'tax_id': 'TAX-CD-2024-56789',
        'enterprise_type': 'grande_entreprise',
        'email': 'info@batiravenir.cd',
        'phone': '+243 85 555 0005',
        'address': '89 Boulevard Kasa-Vubu',
        'city': 'Kinshasa',
        'annual_revenue': Decimal('125000000'),
        'employees_count': 85,
        'teras_score': 820,
        'teras_band': 'A',
        'active_loans_count': 0,
        'total_borrowed': Decimal('0'),
        'status': 'active'
    },
]

enterprises = []
for data in enterprises_data:
    enterprise, created = BankEnterprise.objects.get_or_create(
        email=data['email'],
        defaults=data
    )
    enterprises.append(enterprise)
    if created:
        print(f"   ✅ {enterprise.name} - Score: {enterprise.teras_score}")

print(f"✅ {len(enterprises)} entreprises créées")

# 4. Créer les produits financiers
print("\n4️⃣ Création de 6 produits financiers...")

products_data = [
    {
        'name': 'Crédit Personnel',
        'product_type': 'personal',
        'description': 'Crédit personnel pour vos projets personnels',
        'min_amount': Decimal('50000'),
        'max_amount': Decimal('5000000'),
        'min_duration_months': 6,
        'max_duration_months': 60,
        'interest_rate': Decimal('12.0'),
        'min_score_required': 600,
        'max_age': 65,
        'min_income': Decimal('150000'),
        'is_active': True,
    },
    {
        'name': 'Crédit Auto',
        'product_type': 'auto',
        'description': 'Financement pour l\'achat de véhicules',
        'min_amount': Decimal('500000'),
        'max_amount': Decimal('15000000'),
        'min_duration_months': 12,
        'max_duration_months': 84,
        'interest_rate': Decimal('10.0'),
        'min_score_required': 650,
        'max_age': 60,
        'min_income': Decimal('300000'),
        'is_active': True,
    },
    {
        'name': 'Crédit Immobilier',
        'product_type': 'immobilier',
        'description': 'Financement pour l\'achat ou construction de logement',
        'min_amount': Decimal('5000000'),
        'max_amount': Decimal('100000000'),
        'min_duration_months': 60,
        'max_duration_months': 300,
        'interest_rate': Decimal('8.0'),
        'min_score_required': 700,
        'max_age': 55,
        'min_income': Decimal('500000'),
        'is_active': True,
    },
    {
        'name': 'Crédit PME',
        'product_type': 'pme',
        'description': 'Crédit pour développer votre PME',
        'min_amount': Decimal('1000000'),
        'max_amount': Decimal('50000000'),
        'min_duration_months': 12,
        'max_duration_months': 120,
        'interest_rate': Decimal('9.0'),
        'min_score_required': 680,
        'max_age': 70,
        'min_income': Decimal('0'),
        'is_active': True,
    },
    {
        'name': 'Crédit Agricole',
        'product_type': 'agricole',
        'description': 'Financement pour activités agricoles',
        'min_amount': Decimal('200000'),
        'max_amount': Decimal('10000000'),
        'min_duration_months': 6,
        'max_duration_months': 48,
        'interest_rate': Decimal('7.5'),
        'min_score_required': 550,
        'max_age': 70,
        'min_income': Decimal('100000'),
        'is_active': True,
    },
    {
        'name': 'Crédit Éducation',
        'product_type': 'education',
        'description': 'Financement des études supérieures',
        'min_amount': Decimal('100000'),
        'max_amount': Decimal('3000000'),
        'min_duration_months': 12,
        'max_duration_months': 60,
        'interest_rate': Decimal('6.0'),
        'min_score_required': 600,
        'max_age': 45,
        'min_income': Decimal('200000'),
        'is_active': True,
    },
]

products = []
for data in products_data:
    product, created = FinancialProduct.objects.get_or_create(
        name=data['name'],
        defaults=data
    )
    products.append(product)
    if created:
        print(f"   ✅ {product.name} - Taux: {product.interest_rate}%")

print(f"✅ {len(products)} produits créés")

# 5. Créer des demandes de crédit
print("\n5️⃣ Création de 8 demandes de crédit...")

applications_data = [
    {
        'applicant_type': 'individual',
        'client': clients[1],  # Marie Kanda
        'product': products[0],  # Crédit Personnel
        'requested_amount': Decimal('1200000'),
        'duration_months': 24,
        'purpose': 'Extension de boutique',
        'status': 'pending',
    },
    {
        'applicant_type': 'individual',
        'client': clients[0],  # Jean Mukendi
        'product': products[0],  # Crédit Personnel
        'requested_amount': Decimal('2500000'),
        'duration_months': 36,
        'purpose': 'Achat d\'équipement professionnel',
        'status': 'approved',
    },
    {
        'applicant_type': 'individual',
        'client': clients[2],  # Paul Nzambi
        'product': products[1],  # Crédit Auto
        'requested_amount': Decimal('4200000'),
        'duration_months': 48,
        'purpose': 'Achat véhicule utilitaire',
        'status': 'pending',
    },
    {
        'applicant_type': 'enterprise',
        'enterprise': enterprises[0],  # Restaurant Le Fleuve
        'product': products[3],  # Crédit PME
        'requested_amount': Decimal('3500000'),
        'duration_months': 36,
        'purpose': 'Rénovation et équipement cuisine',
        'status': 'approved',
    },
    {
        'applicant_type': 'individual',
        'client': clients[7],  # Alice Mbemba
        'product': products[5],  # Crédit Éducation
        'requested_amount': Decimal('800000'),
        'duration_months': 24,
        'purpose': 'Master en Éducation',
        'status': 'review',
    },
    {
        'applicant_type': 'enterprise',
        'enterprise': enterprises[2],  # Tech Innovation
        'product': products[3],  # Crédit PME
        'requested_amount': Decimal('1500000'),
        'duration_months': 18,
        'purpose': 'Développement application mobile',
        'status': 'approved',
    },
    {
        'applicant_type': 'individual',
        'client': clients[6],  # Patrick Moukoko
        'product': products[0],  # Crédit Personnel
        'requested_amount': Decimal('350000'),
        'duration_months': 12,
        'purpose': 'Stock marchandises',
        'status': 'rejected',
    },
    {
        'applicant_type': 'individual',
        'client': clients[8],  # Robert Ngoma
        'product': products[4],  # Crédit Agricole
        'requested_amount': Decimal('900000'),
        'duration_months': 18,
        'purpose': 'Achat semences et engrais',
        'status': 'rejected',
    },
]

applications = []
for data in applications_data:
    # Créer l'application
    app = LoanApplication.objects.create(**data)
    
    # Capturer le score
    if app.client:
        app.teras_score_at_application = app.client.teras_score
    elif app.enterprise:
        app.teras_score_at_application = app.enterprise.teras_score
    
    # Calculer les paiements
    app.calculate_payments()
    
    # Niveau de risque
    score = app.teras_score_at_application or 500
    if score >= 750:
        app.risk_level = 'low'
    elif score >= 600:
        app.risk_level = 'medium'
    else:
        app.risk_level = 'high'
    
    # Si rejeté, ajouter raison
    if app.status == 'rejected':
        app.rejection_reason = 'Score TERAS insuffisant pour ce type de crédit'
        app.reviewed_by = bank_user
        app.reviewed_at = datetime.now()
    elif app.status == 'approved':
        app.reviewed_by = bank_user
        app.reviewed_at = datetime.now()
    
    app.save()
    applications.append(app)
    
    status_emoji = '✅' if app.status == 'approved' else '⏳' if app.status == 'pending' else '❌'
    client_name = app.client.get_full_name() if app.client else app.enterprise.name
    print(f"   {status_emoji} {app.application_id} - {client_name} - {app.get_status_display()}")

print(f"✅ {len(applications)} demandes créées")

# 6. Mise à jour des statistiques produits
print("\n6️⃣ Mise à jour des statistiques produits...")
for product in products:
    approved_apps = LoanApplication.objects.filter(
        product=product,
        status__in=['approved', 'disbursed']
    )
    product.applications_count = approved_apps.count()
    product.total_disbursed = approved_apps.aggregate(
        total=Sum('requested_amount')
    )['total'] or Decimal('0')
    product.save()
    if product.applications_count > 0:
        print(f"   ✅ {product.name}: {product.applications_count} crédits, {product.total_disbursed} CFA")

# Résumé
print("\n" + "="*60)
print("🎉 DONNÉES DE TEST CRÉÉES AVEC SUCCÈS !")
print("="*60)
print(f"""
📊 RÉSUMÉ:
   • Compte Bank: bank@teras.com / bank123
   • Clients Particuliers: {len(clients)}
   • Entreprises: {len(enterprises)}
   • Produits Financiers: {len(products)}
   • Demandes de Crédit: {len(applications)}
     - En attente: {sum(1 for a in applications if a.status == 'pending')}
     - Approuvées: {sum(1 for a in applications if a.status == 'approved')}
     - Rejetées: {sum(1 for a in applications if a.status == 'rejected')}

🔗 CONNEXION:
   POST http://localhost:8000/api/auth/login/
   Body: {{"email": "bank@teras.com", "password": "bank123"}}

✅ Backend Bank prêt à être utilisé !
""")
