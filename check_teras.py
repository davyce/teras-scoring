# check_teras.py (à la racine, à côté de manage.py)
"""
Script de vérification avant migrations.
Exécuter avec :  python check_teras.py
"""
import os
import sys

print("🔍 Vérification de l'environnement Django...")
if not os.path.exists("manage.py"):
    sys.exit("❌ Erreur : Fichier manage.py introuvable. Lance ce script depuis la racine du projet TERAS.")

print("📁 Vérification de la structure des fichiers...")
required_files = [
    "scoring/__init__.py",
    "scoring/models.py",
    "scoring/views.py",
    "scoring/urls.py",
    "scoring/serializers.py",
    "scoring/engine/teras.py",
    "scoring/config/teras_config.json",
]
missing = [f for f in required_files if not os.path.exists(f)]
if missing:
    print("❌ Fichiers manquants :", ", ".join(missing))
    sys.exit("⚠️ Corrige ces fichiers avant de continuer.")
print("✅ Structure OK")

print("🧠 Vérification du moteur TERAS...")
try:
    from scoring.engine.teras import TerasScoring
    engine = TerasScoring()  # v0.2 : lit la config JSON
    sample = engine.compute(60, 40, 50, 70, 80)
    print(f"✅ Moteur TERAS opérationnel. Score test = {sample['score']}")
except Exception as e:
    sys.exit(f"❌ Erreur d'import ou de calcul TERAS : {e}")

print("⚙️ Vérification de la configuration Django...")
try:
    import django
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
    django.setup()
    from django.apps import apps
    if apps.is_installed("scoring"):
        print("✅ App 'scoring' bien installée dans settings.INSTALLED_APPS")
    else:
        print("⚠️ App 'scoring' non détectée dans INSTALLED_APPS")
except Exception as e:
    sys.exit(f"❌ Problème de configuration Django : {e}")

print("🗃️ Test d'import du modèle ScoreHistory...")
try:
    from scoring.models import ScoreHistory
    print("✅ Modèle ScoreHistory importé avec succès.")
except Exception as e:
    sys.exit(f"❌ Erreur d'import modèle ScoreHistory : {e}")

print("\n🎉 Vérification complète réussie ! TERAS est prêt pour les migrations.")
print("➡️ Étapes suivantes :")
print("   python manage.py makemigrations && python manage.py migrate && python manage.py runserver")
