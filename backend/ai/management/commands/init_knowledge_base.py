# backend/ai/management/commands/init_knowledge_base.py
"""
Commande Django pour initialiser la base de connaissances TERAS
Usage: python manage.py init_knowledge_base
"""

from django.core.management.base import BaseCommand
from ai.document_indexer import get_indexer
from ai.models import KnowledgeBase


class Command(BaseCommand):
    help = 'Initialise la base de connaissances TERAS avec documentation de base'
    
    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('🚀 Initialisation base de connaissances TERAS...'))
        
        indexer = get_indexer()
        
        # Documentation TERAS de base
        documents = [
            {
                'title': 'TERAS Basic - Vue d\'ensemble',
                'content': '''Le système TERAS Basic évalue les individus sur 1000 points répartis sur 5 piliers:

T - Transactions (300 points):
Analyse la fréquence, régularité, ratio crédit/débit et diversité des canaux de transaction.
Formule: T = 0.35*fréquence + 0.25*régularité + 0.20*mix + 0.20*ratio

E - Épargne (150 points):
Évalue les dépôts récurrents, constance (streak) et volatilité.
Formule: E = 0.6*dépôts_moyens + 0.4*streak_mois

R - Revenus (200 points):
Mesure la moyenne mobile vérifiée, variance et stabilité des revenus.
Formule: R = 0.5*revenus_moyens + 0.5*(1-variance)

A - Actifs (150 points):
Somme pondérée des biens avec coefficient de risque par type.
Formule: A = normalize(Σ(valeur_i * coeff_risque_i))

S - Social (200 points):
Réputation ZONE, historique litiges, score communautaire.
Formule: S = 0.5*réputation + 0.3*volume_avis + 0.2*(1-incidents)

Score final TERAS = 0.30*T + 0.15*E + 0.20*R + 0.15*A + 0.20*S

Les individus sont classés en 5 bandes:
- A (900-1000): Excellent - Pré-approuvé, limites supérieures, taux 5-7%
- B (750-899): Très bon - Approuvé standard, taux 8-10%
- C (600-749): Bon - Approuvé conditionnel, taux 10-12%
- D (400-599): Moyen - Restreint, éducation financière, taux 12-15%
- E (<400): Faible - Refus ou suivi renforcé''',
                'document_type': 'documentation',
                'source': 'Documentation TERAS v1.0',
                'metadata': {'priority': 10, 'category': 'scoring', 'version': '1.0'}
            },
            
            {
                'title': 'TERAS Entreprise - Vue d\'ensemble',
                'content': '''Le système TERAS Entreprise évalue les sociétés sur 1000 points répartis sur 5 axes:

T - Transparence fiscale (250 points):
Vérifie cohérence ventes déclarées, facturation SFEC, déclarations impôts.
Objectif: assurer fiscalité juste et prédictive.

E - Emploi local (150 points):
Évalue taux emploi local, stabilité personnel, formation continue.
Objectif: encourager création et stabilité emploi.

R - Rétention/Fidélité (200 points):
Mesure fidélité clientèle, stabilité contrats et personnel.
Objectif: valoriser structures pérennes.

A - Activité économique (250 points):
Analyse fréquence et diversité opérations commerciales, CA réel, flux POS.
Objectif: évaluer vitalité économique.

S - Stabilité sociale (150 points):
Participation initiatives sociales, environnementales, communautaires.
Objectif: promouvoir responsabilité sociétale.

Score final TERAS Entreprise = 0.30*T + 0.25*E + 0.15*R + 0.20*A + 0.10*S

Le score TERAS des employés contribue au score global de leur entreprise.
Les entreprises bien notées (TERAS+) offrent avantages préférentiels à leurs employés et clients.''',
                'document_type': 'documentation',
                'source': 'Documentation TERAS Entreprise v1.0',
                'metadata': {'priority': 10, 'category': 'scoring', 'version': '1.0'}
            },
            
            {
                'title': 'CRM - Capacité de Remboursement Mensuelle',
                'content': '''La formule CRM (Customer Risk/Relationship Metric) détermine la capacité de remboursement:

CRM = 30% des revenus nets moyens sur 90 jours

Calcul des revenus nets:
Revenus nets = Entrées moyennes mensuelles - Sorties vitales estimées

Si sorties vitales inconnues:
Appliquer panier de base forfaitaire (40-50% des entrées)

Plafond de crédit:
Plafond = CRM × durée (mois) × 0.85 (marge de sécurité)

Exemple concret:
- Entrées moyennes: 200,000 FCFA/mois
- Sorties vitales: 100,000 FCFA
- Revenus nets: 100,000 FCFA
- CRM = 30,000 FCFA
- Durée: 6 mois
- Plafond ≈ 30,000 × 6 × 0.85 = 153,000 FCFA

Règle d'or: Taux d'effort (mensualité/entrées nettes) ≤ 30%

Produits de crédit ZOLA:
1. Seed (<500): 14-30j, 25-100k FCFA, test urgence
2. Starter (500-599): 1-3 mois, 100-300k FCFA, trésorerie micro-biz
3. Growth (600-699): 3-6 mois, 300-1M FCFA, stock, équipement
4. Pro (≥700): 6-24 mois, 1-5M FCFA, équipement, moto, kiosque''',
                'document_type': 'documentation',
                'source': 'Protocole ZOLA Crédit',
                'metadata': {'priority': 9, 'category': 'credit', 'version': '1.0'}
            },
            
            {
                'title': 'Banding des scores TERAS',
                'content': '''Classification des scores TERAS en 5 bandes:

A (900-1000): Excellent
- Pré-approuvé automatiquement
- Limites de crédit supérieures
- Taux préférentiels: 5-7%
- Durée maximale: jusqu'à 24 mois
- Bonus: -1 à -2 pts si épargne bloquée
- Accès prioritaire nouveaux produits

B (750-899): Très bon
- Approuvé standard
- Taux compétitifs: 8-10%
- Durée: jusqu'à 18 mois
- Conditions souples
- Accès programmes fidélité

C (600-749): Bon
- Approuvé conditionnel
- Garanties ou limites requises
- Taux standard: 10-12%
- Durée: jusqu'à 12 mois
- Suivi régulier recommandé

D (400-599): Moyen
- Crédit restreint
- Éducation financière recommandée
- Taux élevés: 12-15%
- Durée limitée: jusqu'à 6 mois
- Garanties obligatoires
- Programme d'accompagnement

E (<400): Faible
- Refus crédit ou suivi renforcé
- Microcrédit test uniquement (25-50k FCFA)
- Durée très courte: 14-30 jours
- Formation obligatoire
- Reconstruction du score

Bonus applicables:
- Épargne bloquée: -1 à -2 pts de taux
- Co-emprunteur solide: -1 pt
- Historique parfait 12 mois: -1 pt

Malus:
- Nouveau client sans données: +1 pt
- Activité très irrégulière: +1 pt
- Retard passé résolu: +0.5 pt''',
                'document_type': 'documentation',
                'source': 'Documentation TERAS Banding',
                'metadata': {'priority': 8, 'category': 'scoring', 'version': '1.0'}
            },
            
            {
                'title': 'FAQ - Comment améliorer son score TERAS?',
                'content': '''Pour améliorer votre score TERAS Basic:

1. Pilier Transactions (T - 300 points):
   ✅ Utilisez régulièrement ZOLA pour vos paiements quotidiens
   ✅ Diversifiez les canaux (mobile, POS, QR code)
   ✅ Maintenez un bon ratio entrées/sorties
   ✅ Évitez les périodes d'inactivité prolongées
   
   Impact: +50 à +100 points possibles

2. Pilier Épargne (E - 150 points):
   ✅ Effectuez des dépôts réguliers même petits (5000-10000 FCFA/mois)
   ✅ Construisez un "streak" de plusieurs mois consécutifs
   ✅ Évitez de vider complètement votre épargne
   ✅ Utilisez l'épargne automatique si disponible
   
   Impact: +30 à +60 points possibles

3. Pilier Revenus (R - 200 points):
   ✅ Stabilisez vos sources de revenus
   ✅ Diversifiez vos sources (salaire + activité secondaire)
   ✅ Documentez vos revenus réguliers
   ✅ Évitez les variations importantes inexpliquées
   
   Impact: +40 à +80 points possibles

4. Pilier Actifs (A - 150 points):
   ✅ Déclarez vos biens (terrain, véhicule, matériel)
   ✅ Fournissez preuves simples de possession
   ✅ Privilégiez actifs avec titres formels
   ✅ Mettez à jour régulièrement vos déclarations
   
   Impact: +30 à +70 points possibles

5. Pilier Social (S - 200 points):
   ✅ Obtenez de bons avis sur ZONE
   ✅ Évitez les litiges et réclamations
   ✅ Participez aux programmes communautaires
   ✅ Rejoignez tontines/associations vérifiées
   ✅ Soyez parrainé par membre de confiance
   
   Impact: +40 à +100 points possibles

Actions prioritaires pour amélioration rapide (3-6 mois):
1. Utiliser ZOLA quotidiennement (même petites transactions)
2. Épargner 10-15% des revenus mensuels de façon régulière
3. Maintenir historique sans incidents ni retards
4. Documenter toute activité économique formelle
5. Obtenir 5-10 avis positifs sur ZONE

Exemples de progression:
- Score initial 450 → 6 mois d'usage régulier → Score 580-620
- Score initial 620 → 12 mois d'excellence → Score 720-780
- Score initial 780 → Maintien + épargne → Score 850-920

Temps moyen pour amélioration significative (+100 points): 6-12 mois''',
                'document_type': 'faq',
                'source': 'FAQ TERAS',
                'metadata': {'priority': 9, 'category': 'faq', 'version': '1.0'}
            },
            
            {
                'title': 'Législation CEMAC - Contexte fiscal',
                'content': '''La zone CEMAC (Communauté Économique et Monétaire de l'Afrique Centrale) comprend:
- Cameroun
- Congo (Brazzaville)
- Gabon
- Guinée Équatoriale
- République Centrafricaine
- Tchad

Système fiscal CEMAC:
- TVA harmonisée: généralement 18-19%
- Impôt sur les sociétés: 25-35% selon pays
- Retenue à la source: 5-20% selon type revenus
- Taxe professionnelle: variable selon activité

Le système TERAS Entreprise prend en compte:
- Déclarations fiscales mensuelles/trimestrielles
- Cohérence entre CA déclaré et flux POS SFEC
- Régularité des paiements taxes
- Conformité aux obligations sociales (CNSS, etc.)

Transparence fiscale (pilier T - 250 points):
- Déclarations à jour: +100 points
- Cohérence CA/facturation: +80 points
- Paiements réguliers: +70 points

Non-conformité pénalise fortement le score TERAS Entreprise.''',
                'document_type': 'legislation',
                'source': 'Documentation Législation CEMAC',
                'metadata': {'priority': 7, 'category': 'legislation', 'region': 'CEMAC'}
            }
        ]
        
        # Indexer documents
        self.stdout.write('📄 Indexation documents de base...')
        indexed_docs = indexer.index_bulk(documents=documents)
        
        self.stdout.write(
            self.style.SUCCESS(f'✅ {len(indexed_docs)}/{len(documents)} documents indexés')
        )
        
        # Créer entrées KnowledgeBase
        self.stdout.write('📚 Création entrées Knowledge Base...')
        kb_entries = [
            {
                'category': 'teras_scoring',
                'title': 'Formule TERAS Basic',
                'content': 'Score TERAS Basic = 0.30*T + 0.15*E + 0.20*R + 0.15*A + 0.20*S sur 1000 points',
                'keywords': ['teras', 'score', 'formule', 'basic', 'individuel', 'calcul'],
                'priority': 10
            },
            {
                'category': 'teras_scoring',
                'title': 'Formule TERAS Entreprise',
                'content': 'Score TERAS Entreprise = 0.30*T + 0.25*E + 0.15*R + 0.20*A + 0.10*S sur 1000 points',
                'keywords': ['teras', 'score', 'formule', 'entreprise', 'société', 'calcul'],
                'priority': 10
            },
            {
                'category': 'fiscal',
                'title': 'Formule CRM',
                'content': 'CRM (Capacité Remboursement Mensuelle) = 30% des revenus nets moyens sur 90 jours',
                'keywords': ['crm', 'crédit', 'capacité', 'remboursement', 'zola'],
                'priority': 9
            },
            {
                'category': 'teras_scoring',
                'title': 'Bandes de score',
                'content': 'A (900-1000), B (750-899), C (600-749), D (400-599), E (<400)',
                'keywords': ['bande', 'classification', 'score', 'niveau'],
                'priority': 8
            },
            {
                'category': 'procedures',
                'title': 'Amélioration score - Actions prioritaires',
                'content': 'Usage quotidien ZOLA, épargne 10-15% mensuelle, zéro retard, documentation activité, avis positifs',
                'keywords': ['amélioration', 'conseil', 'progression', 'augmenter'],
                'priority': 9
            },
            {
                'category': 'legislation',
                'title': 'Zone CEMAC',
                'content': 'Cameroun, Congo, Gabon, Guinée Équatoriale, RCA, Tchad - TVA harmonisée 18-19%',
                'keywords': ['cemac', 'zone', 'pays', 'législation', 'fiscal'],
                'priority': 7
            }
        ]
        
        created_count = 0
        for entry in kb_entries:
            kb, created = KnowledgeBase.objects.get_or_create(
                category=entry['category'],
                title=entry['title'],
                defaults={
                    'content': entry['content'],
                    'keywords': entry['keywords'],
                    'priority': entry['priority']
                }
            )
            if created:
                created_count += 1
        
        self.stdout.write(
            self.style.SUCCESS(f'✅ {created_count} entrées KB créées')
        )
        
        # Stats finales
        stats = indexer.get_collection_stats()
        self.stdout.write('\n📊 Statistiques des collections:')
        for doc_type, stat in stats.items():
            if isinstance(stat, dict) and 'count' in stat:
                self.stdout.write(f'  - {doc_type}: {stat["count"]} documents')
        
        self.stdout.write(
            self.style.SUCCESS('\n✨ Base de connaissances initialisée avec succès!')
        )
