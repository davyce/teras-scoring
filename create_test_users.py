# teras-backend/create_test_users.py
"""
Script pour créer des utilisateurs de test TERAS
Usage: python manage.py shell < create_test_users.py
"""

from django.contrib.auth import get_user_model
from django.db import IntegrityError

User = get_user_model()

# Liste des utilisateurs de test
test_users = [
    {
        'email': 'admin@teras.com',
        'username': 'admin',
        'password': 'admin123',
        'first_name': 'Admin',
        'last_name': 'TERAS',
        'user_type': 'admin',
        'is_staff': True,
        'is_superuser': True,
    },
    {
        'email': 'gov@teras.com',
        'username': 'gouvernement',
        'password': 'gov123',
        'first_name': 'Ministère',
        'last_name': 'Finances',
        'user_type': 'government',
    },
    {
        'email': 'enterprise@teras.com',
        'username': 'entreprise',
        'password': 'teras2024',
        'first_name': 'Société',
        'last_name': 'Exemple',
        'user_type': 'enterprise',
    },
    {
        'email': 'user@teras.com',
        'username': 'utilisateur',
        'password': 'user123',
        'first_name': 'Jean',
        'last_name': 'Dupont',
        'user_type': 'individual',
    },
    {
        'email': 'bank@teras.com',
        'username': 'banque',
        'password': 'bank123',
        'first_name': 'Banque',
        'last_name': 'Centrale',
        'user_type': 'bank',
    },
]

print("🔧 Création des utilisateurs de test TERAS...")
print("=" * 60)

for user_data in test_users:
    try:
        # Vérifier si l'utilisateur existe déjà
        if User.objects.filter(email=user_data['email']).exists():
            print(f"⚠️  {user_data['email']} existe déjà - ignoré")
            continue
        
        # Créer l'utilisateur
        if user_data.get('is_superuser'):
            user = User.objects.create_superuser(
                email=user_data['email'],
                username=user_data['username'],
                password=user_data['password'],
                first_name=user_data['first_name'],
                last_name=user_data['last_name'],
            )
            if hasattr(user, 'user_type'):
                user.user_type = user_data['user_type']
                user.save()
        else:
            user = User.objects.create_user(
                email=user_data['email'],
                username=user_data['username'],
                password=user_data['password'],
                first_name=user_data['first_name'],
                last_name=user_data['last_name'],
            )
            if hasattr(user, 'user_type'):
                user.user_type = user_data['user_type']
                user.save()
            
            if user_data.get('is_staff'):
                user.is_staff = True
                user.save()
        
        print(f"✅ {user_data['email']} ({user_data['user_type']}) créé avec succès")
        
    except IntegrityError as e:
        print(f"❌ Erreur lors de la création de {user_data['email']}: {e}")
    except Exception as e:
        print(f"❌ Erreur inattendue pour {user_data['email']}: {e}")

print("=" * 60)
print("✅ Processus terminé !")
print("\n📋 Comptes de test créés :")
print("-" * 60)
print("👤 Admin       : admin@teras.com / admin123")
print("🏛️  Gouv.       : gov@teras.com / gov123")
print("🏢 Entreprise  : enterprise@teras.com / teras2024")
print("👤 Utilisateur : user@teras.com / user123")
print("🏦 Banque      : bank@teras.com / bank123")
print("-" * 60)
