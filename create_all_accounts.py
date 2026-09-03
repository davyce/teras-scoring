import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

print("🏗️  CRÉATION DE TOUS LES COMPTES TEST TERAS")
print("=" * 70)

accounts = [
    {
        'email': 'banque@test.cd',
        'password': 'Test1234!',
        'first_name': 'Banque',
        'last_name': 'Centrale',
        'user_type': 'bank',
    },
    {
        'email': 'gouv@test.cd',
        'password': 'Test1234!',
        'first_name': 'Ministère',
        'last_name': 'Finance',
        'user_type': 'government',
    },
    {
        'email': 'entreprise@test.cd',
        'password': 'Test1234!',
        'first_name': 'Entreprise',
        'last_name': 'Congo SA',
        'user_type': 'enterprise',
    },
    {
        'email': 'user@test.cd',
        'password': 'Test1234!',
        'first_name': 'Jean',
        'last_name': 'Mukendi',
        'user_type': 'individual',
    },
    {
        'email': 'admin@teras.cd',
        'password': 'Test1234!',
        'first_name': 'Admin',
        'last_name': 'TERAS',
        'user_type': 'admin',
    },
]

for account in accounts:
    email = account['email']

    # Supprimer si existe
    User.objects.filter(email=email).delete()

    try:
        # Utiliser le custom manager qui gère user_type correctement
        user = User.objects.create_user(
            email=account['email'],
            password=account['password'],
            first_name=account['first_name'],
            last_name=account['last_name'],
            user_type=account['user_type'],
        )

        if account['user_type'] == 'admin':
            user.is_staff = True
            user.is_superuser = True
            user.save()

        print(f"✅ {account['user_type']:15} | {email:30}")

    except Exception as e:
        print(f"❌ {account['user_type']:15} | {email:30} | Erreur: {e}")

print("\n" + "=" * 70)
print("✅ COMPTES CRÉÉS")
print("=" * 70)
print("Mot de passe pour tous: Test1234!")
print("\nComptes disponibles:")
for account in accounts:
    print(f"  • {account['user_type']:15} → {account['email']}")
print("=" * 70)