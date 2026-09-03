#!/usr/bin/env python
"""
Script pour créer de VRAIES données TERAS pour jean@teras.cd
VERSION CORRIGÉE ET ALIGNÉE SUR LES MODÈLES ACTUELS

À exécuter :
    python manage.py shell < create_real_data.py
"""

from users.models import CustomUser
from scoring.models import TerasScore, Transaction, Income, Asset, Recommendation
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
import random

# Récupérer l'utilisateur
user = CustomUser.objects.get(email='jean@teras.cd')

print(f"📊 Création de données réelles pour {user.email}...")

# ============================================
# 1. CRÉER DES TRANSACTIONS (90 derniers jours)
# ============================================

print("\n1️⃣ Création de 50 transactions...")

transaction_types = ['credit', 'debit']
channels = ['mobile_money', 'bank', 'cash', 'card']
descriptions = [
    'Salaire mensuel',
    'Vente produits',
    'Paiement service',
    'Achat supermarché',
    'Retrait ATM',
    'Transfert ZOLA',
    'Paiement facture',
    'Épargne',
]

Transaction.objects.filter(user=user).delete()

for _ in range(50):
    days_ago = random.randint(0, 90)
    date = timezone.now() - timedelta(days=days_ago)

    trans_type = random.choice(transaction_types)

    if trans_type == 'credit':
        amount = Decimal(random.randint(50000, 350000))
    else:
        amount = Decimal(random.randint(10000, 180000))

    Transaction.objects.create(
        user=user,
        amount=amount,
        transaction_type=trans_type,
        description=random.choice(descriptions),
        channel=random.choice(channels),
        created_at=date,
    )

print(f"   ✅ {Transaction.objects.filter(user=user).count()} transactions créées")

# ============================================
# 2. CRÉER DES REVENUS (6 derniers mois)
# ============================================

print("\n2️⃣ Création de 6 revenus mensuels...")

Income.objects.filter(user=user).delete()

for i in range(6):
    created_date = timezone.now() - timedelta(days=30 * i)

    # Revenu mensuel autour de 500 000 FCFA
    base_income = 500000
    variation = random.randint(-25000, 30000)
    amount = Decimal(base_income + variation)

    Income.objects.create(
        user=user,
        source='Salaire',
        amount=amount,
        is_recurring=True,
        verified=True,
        created_at=created_date,
    )

print(f"   ✅ {Income.objects.filter(user=user).count()} revenus créés")

# ============================================
# 3. CRÉER DES ACTIFS
# ============================================

print("\n3️⃣ Création de 3 actifs...")

Asset.objects.filter(user=user).delete()

# Patrimoine un peu plus solide pour une démo crédible
assets_data = [
    {'type': 'vehicle', 'value': 18000000, 'desc': 'Moto Yamaha 2022'},
    {'type': 'real_estate', 'value': 125000000, 'desc': 'Terrain à Pointe-Noire'},
    {'type': 'equipment', 'value': 9000000, 'desc': 'Équipement de commerce et stock'},
]

for asset_data in assets_data:
    Asset.objects.create(
        user=user,
        asset_type=asset_data['type'],
        description=asset_data['desc'],
        estimated_value=Decimal(asset_data['value']),
        verified=True,
        created_at=timezone.now() - timedelta(days=random.randint(30, 400)),
    )

print(f"   ✅ {Asset.objects.filter(user=user).count()} actifs créés")

# ============================================
# 4. CRÉER DES RECOMMANDATIONS
# ============================================

print("\n4️⃣ Création de 8 recommandations...")

Recommendation.objects.filter(user=user).delete()

recommendations_data = [
    {
        'category': 'transactions',
        'priority': 'high',
        'title': 'Augmentez votre fréquence de transactions',
        'description': 'Effectuez au moins 15 transactions par mois pour améliorer votre score.',
        'impact': '+45 points',
        'completed': False,
        'completed_at': None,
    },
    {
        'category': 'epargne',
        'priority': 'high',
        'title': 'Constituez une épargne de sécurité',
        'description': 'Épargnez 15% de vos revenus chaque mois pendant 3 mois.',
        'impact': '+50 points',
        'completed': False,
        'completed_at': None,
    },
    {
        'category': 'revenus',
        'priority': 'medium',
        'title': 'Stabilisez vos revenus',
        'description': 'Maintenez des entrées régulières sur 4 mois consécutifs.',
        'impact': '+35 points',
        'completed': False,
        'completed_at': None,
    },
    {
        'category': 'documents',
        'priority': 'high',
        'title': 'Ajoutez vos relevés bancaires',
        'description': 'Uploadez 3 mois de relevés pour validation.',
        'impact': '+60 points',
        'completed': False,
        'completed_at': None,
    },
    {
        'category': 'social',
        'priority': 'medium',
        'title': 'Rejoignez une tontine',
        'description': 'La participation à une association reconnue améliore le score social.',
        'impact': '+25 points',
        'completed': False,
        'completed_at': None,
    },
    {
        'category': 'actifs',
        'priority': 'low',
        'title': 'Formalisez vos biens',
        'description': 'Obtenez des documents officiels pour vos actifs.',
        'impact': '+30 points',
        'completed': False,
        'completed_at': None,
    },
    {
        'category': 'transactions',
        'priority': 'medium',
        'title': 'Diversifiez vos canaux',
        'description': 'Utilisez au moins 3 canaux différents : mobile money, banque, carte ou cash.',
        'impact': '+20 points',
        'completed': True,
        'completed_at': timezone.now() - timedelta(days=15),
    },
    {
        'category': 'epargne',
        'priority': 'low',
        'title': 'Automatisez votre épargne',
        'description': 'Mettez en place des virements automatiques mensuels.',
        'impact': '+15 points',
        'completed': True,
        'completed_at': timezone.now() - timedelta(days=5),
    },
]

for rec_data in recommendations_data:
    Recommendation.objects.create(
        user=user,
        **rec_data,
    )

print(f"   ✅ {Recommendation.objects.filter(user=user).count()} recommandations créées")

# ============================================
# 5. CRÉER L'HISTORIQUE DE SCORES (6 mois)
# ============================================

print("\n5️⃣ Création de l'historique de scores (6 mois)...")

# On garde le score le plus récent s'il existe déjà
current_score = TerasScore.objects.filter(user=user).order_by('-created_at').first()

if not current_score:
    current_score = TerasScore.objects.create(
        user=user,
        score=820,
        level='good',
        transactions_score=84,
        savings_score=72,
        income_score=86,
        assets_score=76,
        social_score=78,
        weight_t=0.25,
        weight_e=0.20,
        weight_r=0.25,
        weight_a=0.15,
        weight_s=0.15,
        reason_codes=[
            "Historique de transactions régulier",
            "Revenus récurrents vérifiés",
            "Patrimoine déclaré cohérent",
        ],
        model_version="v1.0",
        source="seed_script",
        is_simulated=False,
        created_at=timezone.now(),
    )
    print(f"   ✅ Score actuel créé: {current_score.score}")
else:
    print(f"   Score actuel conservé: {current_score.score}")

scores_progression = [
    {'months_ago': 6, 'score': 645, 'T': 68, 'E': 53, 'R': 71, 'A': 60, 'S': 63},
    {'months_ago': 5, 'score': 675, 'T': 71, 'E': 57, 'R': 74, 'A': 63, 'S': 66},
    {'months_ago': 4, 'score': 710, 'T': 74, 'E': 61, 'R': 78, 'A': 66, 'S': 69},
    {'months_ago': 3, 'score': 745, 'T': 77, 'E': 65, 'R': 81, 'A': 69, 'S': 72},
    {'months_ago': 2, 'score': 780, 'T': 81, 'E': 69, 'R': 84, 'A': 72, 'S': 75},
    {'months_ago': 1, 'score': 805, 'T': 83, 'E': 71, 'R': 85, 'A': 74, 'S': 77},
]

for score_data in scores_progression:
    date = timezone.now() - timedelta(days=30 * score_data['months_ago'])

    TerasScore.objects.create(
        user=user,
        score=score_data['score'],
        level='good' if score_data['score'] >= 750 else 'fair',
        transactions_score=score_data['T'],
        savings_score=score_data['E'],
        income_score=score_data['R'],
        assets_score=score_data['A'],
        social_score=score_data['S'],
        weight_t=0.25,
        weight_e=0.20,
        weight_r=0.25,
        weight_a=0.15,
        weight_s=0.15,
        reason_codes=[
            "Progression régulière du profil financier",
            "Amélioration de la stabilité des revenus",
            "Renforcement graduel du patrimoine",
        ],
        model_version="v1.0",
        source="seed_script",
        is_simulated=True,
        created_at=date,
    )

print(f"   ✅ {TerasScore.objects.filter(user=user).count()} scores dans l'historique")

# ============================================
# 6. RÉSUMÉ FINAL
# ============================================

print("\n" + "=" * 60)
print("✅ DONNÉES RÉELLES CRÉÉES AVEC SUCCÈS")
print("=" * 60)

latest_score = TerasScore.objects.filter(user=user).order_by('-created_at').first()

print(f"\n📊 Résumé pour {user.email}:")
print(f"   • Transactions: {Transaction.objects.filter(user=user).count()}")
print(f"   • Revenus: {Income.objects.filter(user=user).count()}")
print(f"   • Actifs: {Asset.objects.filter(user=user).count()}")
print(f"   • Recommandations: {Recommendation.objects.filter(user=user).count()}")
print(f"   • Historique scores: {TerasScore.objects.filter(user=user).count()}")

if latest_score:
    print(f"   • Score actuel: {latest_score.score} ({latest_score.level})")

print("\n🎯 Dataset prêt pour les screenshots et la démo TERAS")
print("=" * 60)