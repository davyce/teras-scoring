import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// @ts-nocheck
import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, TrendingUp, AlertCircle, FileText, DollarSign, BarChart3, Loader2, } from 'lucide-react';
import terasLogoUrl from '../../assets/logo-teras.svg'; // ✅ CHEMIN CORRIGÉ
export default function BankChat() {
    const [messages, setMessages] = useState([
        {
            id: '1',
            role: 'assistant',
            content: "👋 Bonjour ! Je suis l'**Assistant IA TERAS Bank**, propulsé par Claude Sonnet 4.\n\nJe peux vous aider avec :\n\n📊 **Analyse du portefeuille** - Performance, santé, croissance\n🎯 **Gestion des risques** - Identification, prévention, provisions\n🚀 **Opportunités** - Segments à potentiel, cross-sell, refinancement\n📈 **Performance produits** - Rentabilité, optimisation, nouveaux produits\n🔢 **Scoring TERAS** - Distribution, tendances, recommandations\n💰 **Simulations** - Calculs de crédit, taux, mensualités\n\nComment puis-je vous assister aujourd'hui ?",
            timestamp: new Date(),
            suggestions: [
                "Analyse complète du portefeuille",
                "Clients à risque élevé",
                "Opportunités de croissance",
                "Performance des produits"
            ]
        }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    useEffect(() => {
        scrollToBottom();
    }, [messages]);
    // Contexte TERAS pour l'IA
    const terasContext = {
        totalLoans: 156,
        totalClients: 1247,
        portfolioValue: 145000000,
        defaultRate: 4.5,
        avgScore: 704,
        recentApplications: 12,
        approvalRate: 68.5,
        topProducts: ['Crédit Immobilier', 'Crédit PME', 'Crédit Auto'],
    };
    // Scénarios de réponses enrichis pour la démo
    const getAIResponse = async (userMessage) => {
        const lowerMessage = userMessage.toLowerCase();
        // SCÉNARIO 1 : Analyse détaillée du portefeuille
        if (lowerMessage.includes('portefeuille') || lowerMessage.includes('portfolio')) {
            return `📊 **Analyse Complète du Portefeuille TERAS Bank**

**📈 Vue d'Ensemble**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• **Crédits Actifs** : ${terasContext.totalLoans} crédits
• **Encours Total** : ${(terasContext.portfolioValue / 1000000).toFixed(1)}M FCFA
• **Score Santé Global** : 87.2% ⭐ (Excellent)
• **Taux de Défaut** : ${terasContext.defaultRate}% ✅ (Sous contrôle)
• **Score TERAS Moyen** : ${terasContext.avgScore}/1000
• **Croissance Trimestrielle** : +18.2%

**📊 Répartition par Produit**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏠 **Crédit Immobilier** : 45M (31%)
   → 12 crédits • Taux moyen 10.5% • Défaut 0%

🏢 **Crédit PME** : 38M (26%)
   → 24 crédits • Taux moyen 12% • Défaut 4.2%

🚗 **Crédit Auto** : 28M (19%)
   → 35 crédits • Taux moyen 11.5% • Défaut 2.8%

💼 **Fonds de Roulement** : 21M (14%)
   → 48 crédits • Taux moyen 13.5% • Défaut 6.1%

👤 **Microfinance** : 13M (10%)
   → 37 crédits • Taux moyen 15% • Défaut 12%

**🎯 Performance & KPIs**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ **Paiements à Jour** : 85% (133 crédits)
⚠️ **Retards 1-10 jours** : 10% (16 crédits)
🔴 **Retards >10 jours** : 5% (7 crédits)

**Revenus Annualisés** : 17.2M FCFA
**Marge Nette** : 12.8M FCFA (74.4%)
**ROE** : 18.3% • **ROA** : 8.7%

**🚨 Points d'Attention**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ 4 crédits nécessitent intervention immédiate
⚠️ Concentration élevée : Top 5 clients = 32% de l'encours
⚠️ Microfinance : défaut élevé (12%) → revoir scoring

**💡 Recommandations Stratégiques**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. **Action Immédiate** : Contacter les 4 crédits en retard >10j
   → Proposer plans de rattrapage personnalisés
   → Éviter dégradation vers défaut

2. **Diversification** : Réduire concentration
   → Cibler 15-20 nouveaux clients moyens
   → PME secteur santé (23 prospects identifiés)

3. **Optimisation Produits** :
   → Microfinance : hausser critères score minimal à 620
   → Fonds Roulement : augmenter taux de 0.5pt
   → Crédit Immo : profiter du 0% défaut pour croître

4. **Croissance** : Capitaliser sur la santé du portefeuille
   → Augmenter exposition PME de 10M (+26%)
   → Lancer "Crédit Équipement Tech" (secteur prometteur)

**Voulez-vous approfondir un segment spécifique ?**`;
        }
        // SCÉNARIO 2 : Analyse des risques détaillée
        if (lowerMessage.includes('risque') || lowerMessage.includes('risk')) {
            return `🎯 **Analyse Approfondie des Risques - TERAS Bank**

**🚨 Vue d'Ensemble des Risques**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• **Clients à Risque Élevé** : 7 profils (4.5% du portefeuille)
• **Encours à Risque** : 8.9M FCFA (6.1% du total)
• **Provisions Actuelles** : 11.2M FCFA (7.7%)
• **Provisions Recommandées** : 12.5M FCFA (+11.6%)
• **Taux de Couverture** : 140% → Cible: 156%

**📊 Critères de Détection Automatique**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 Score TERAS < 600
🔴 Retards de paiement > 5 jours consécutifs
🔴 Variation revenus > 30% sur 3 mois
🔴 Secteur d'activité en difficulté
🔴 Ratio d'endettement > 45%
🔴 Historique incidents bancaires

**🔍 Top 5 Crédits Prioritaires**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**#1 - LOAN-2024-007** 🔴 Critique
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Client : David LOMBE (Commerce)
Montant : 3.2M FCFA restant
Retard : 12 jours (mensualité 285K)
Score TERAS : 760 → 720 → 695 (↓↓ tendance)
Revenus : Baisse de 35% (580K → 377K)
Probabilité Défaut : 28%

**Actions Recommandées** :
✓ Contact immédiat (dans 24h)
✓ Rencontre physique + audit activité
✓ Plan restructuration : allonger durée 6→9 mois
✓ Réduire mensualité à 190K (-33%)
✓ Provision : 900K (28% de l'encours)

**#2 - LOAN-2024-016** 🟠 Élevé
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Client : Robert NGOMA (Transport)
Montant : 1.8M FCFA
Retard : 8 jours (mensualité 165K)
Score TERAS : 620 (stable mais limite)
Secteur : Transport (-22% activité régionale)
Probabilité Défaut : 18%

**Actions** :
✓ Appel vérification revenus
✓ Demander justificatifs 3 derniers mois
✓ Si revenus confirmés → rappel simple
✓ Sinon → restructuration douce
✓ Provision : 324K (18%)

**#3 - LOAN-2024-020** 🟡 Moyen
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Client : Patrick MOUKOKO (Microfinance)
Montant : 780K FCFA
Retard : 5 jours (mensualité 52K)
Score TERAS : 580 (microfinance typique)
Probabilité Défaut : 12%

**Actions** :
✓ Visite agent terrain cette semaine
✓ Vérifier activité commerciale
✓ Rappel + conseil gestion trésorerie
✓ Provision : 94K (12%)

**#4 - LOAN-2024-031** 🟡 Moyen
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Client : Marie KALONJI (Commerce)
Montant : 1.5M FCFA
Retard : 3 jours (prem retard)
Score TERAS : 742 → 718 (alerte baisse)
Revenus : Variation +38% (suspect)
Probabilité Défaut : 8%

**Actions** :
✓ Surveillance rapprochée
✓ Vérifier origine hausse revenus
✓ Si anormal → enquête fraude
✓ Provision : 120K (8%)

**#5 - LOAN-2024-042** 🟢 Faible
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Client : Jean MASSAMBA (PME Santé)
Montant : 950K FCFA
Retard : 2 jours (occasion ponctuelle)
Score TERAS : 788 (excellent historique)
Probabilité Défaut : 3%

**Actions** :
✓ Rappel courtoisie
✓ Pas d'action supplémentaire
✓ Provision : 29K (3%)

**📈 Suivi & Monitoring**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• **Revue Hebdomadaire** : Tous les vendredis 14h
• **Alertes Automatiques** : Email + SMS si dégradation
• **Reporting Mensuel** : Comité crédit (1er de chaque mois)
• **Stress Test Trimestriel** : Simulation crise économique

**💰 Impact Financier**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Provisions Actuelles : 11.2M
Provisions Recommandées : 12.5M
Delta : +1.3M (+11.6%)
Impact P&L : -1.3M sur Q1 2025

**Voulez-vous le plan d'action détaillé pour un client ?**`;
        }
        // SCÉNARIO 3 : Opportunités de croissance
        if (lowerMessage.includes('opportunité') || lowerMessage.includes('croissance') || lowerMessage.includes('business')) {
            return `🚀 **Opportunités de Croissance TERAS Bank**

**💎 Segments à Fort Potentiel Identifiés**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**#1 - PME Secteur Santé** 🏥 [PRIORITÉ HAUTE]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**Analyse du Segment** :
• Entreprises éligibles : 23 PME (score TERAS > 700)
• Demande moyenne : 4.5M FCFA par entreprise
• Volume potentiel total : ~103M FCFA
• Taux suggéré : 11-12% (vs 12% actuel PME)
• Défaut secteur : 2.1% (vs 4.2% PME général)

**Pourquoi ce secteur** :
✓ Croissance annuelle : +15% (secteur en boom)
✓ Paiements État garantis (cliniques conventionnées)
✓ Besoin équipement médical (forte demande)
✓ Clientèle fidèle et récurrente
✓ Marge élevée dans santé privée

**Top 5 Prospects Ready** :
1. **Clinique SANTÉ+** (Pointe-Noire)
   → Demande 8.5M • Score 842 • 15 ans activité
   → Équipement scanner + rénovation

2. **Pharmacie CENTRALE** (Brazzaville)
   → Demande 3.2M • Score 791 • Chaîne 4 points
   → Expansion + stock

3. **Labo BIOMED** (Dolisie)
   → Demande 5.1M • Score 776 • Contrats État
   → Matériel laboratoire

4. **Cabinet Dentaire LUMIÈRE** (Pointe-Noire)
   → Demande 2.8M • Score 812 • Excellente réputation
   → Équipement 3D + fauteuils

5. **Centre OPTIQUE VISION** (Brazzaville)
   → Demande 4.2M • Score 758 • Partenariats assurances
   → Stock verres + machines

**Plan d'Action Immédiat** :
📧 Campagne email personnalisée (templates prêts)
📞 Appels directeurs (agenda à partager)
🤝 Événement "Santé & Financement" mi-janvier
📄 Offre packagée avec assurance matériel
⏱️ Délai décision : 48h (accéléré)

**ROI Estimé** : 11.3M revenus / 8.2M marge sur 3 ans

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**#2 - Clients Premium (Score A/A+)** ⭐ [QUICK WIN]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**Analyse du Segment** :
• Clients identifiés : 83 profils excellents
• Score TERAS : 800-1000
• Historique : 0 retard sur 24+ mois
• Opportunité : Cross-sell Crédit Auto/Immo
• Ticket moyen : 3.2M FCFA
• Taux de conversion : 35% (benchmark)

**Produits Proposés** :
🚗 **Crédit Auto Premium**
   → Taux VIP : 9.5% (vs 11.5% standard)
   → Montant : 2-8M • Durée : 12-48 mois
   → Assurance incluse

🏠 **Crédit Immobilier Fast-Track**
   → Taux VIP : 9% (vs 10.5% standard)
   → Approbation 72h (vs 2 semaines)
   → Apport : 10% (vs 20%)

**Volume Estimé** :
83 clients × 35% conversion × 3.2M = 92.9M FCFA

**Plan d'Action** :
📱 SMS + Email personnalisés VIP
📞 Appels chargés compte dédiés
🎁 Offre limitée 30 jours
💳 Carte Gold TERAS offerte
⚡ Décision express 48-72h

**ROI Estimé** : 9.2M revenus / 6.8M marge sur 3 ans

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**#3 - Refinancement Crédits Externes** 💰 [VOLUME]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**Analyse du Marché** :
• Clients cible : 45 avec crédits ailleurs
• Taux concurrent : 15-18%
• Notre offre : 12-13% (-3 à -5 points!)
• Encours externe total : ~67M FCFA
• Potentiel captation : 65% = 43.6M FCFA

**Avantages Client** :
✓ Économie mensuelle : 15-25%
✓ Regroupement crédits possible
✓ Une seule mensualité
✓ Meilleur suivi + conseils
✓ Application TERAS incluse

**Marge Competitive** :
Taux concurrent : 15-18%
Notre taux : 12-13%
Client économise : 2-5 points
Nous captons : Volume + fidélisation

**Top 10 Prospects** :
[Liste détaillée disponible]
Total encours : 28.3M
Économies clients : 720K/an
Notre revenu : 3.4M sur durée restante

**Plan d'Action** :
📊 Calculateur automatique sur site web
📞 Démarchage téléphonique ciblé
📧 Campagne "Libérez-vous de vos crédits"
🎯 Offre flash : Frais dossier offerts
⏱️ Simulation en 5min, réponse 24h

**ROI Estimé** : 5.2M revenus / 3.9M marge sur durée moyenne

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**📊 Synthèse Globale des Opportunités**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

| Segment | Volume | Revenus 3 ans | Marge | Effort |
|---------|--------|---------------|-------|--------|
| PME Santé | 103M | 11.3M | 8.2M | ⭐⭐⭐ |
| Clients A/A+ | 93M | 9.2M | 6.8M | ⭐ |
| Refinancement | 44M | 5.2M | 3.9M | ⭐⭐ |
| **TOTAL** | **240M** | **25.7M** | **18.9M** | - |

**Impact Business** :
→ Croissance portefeuille : +165% en 12 mois
→ Diversification risque : -22% concentration
→ Revenus additionnels : +25.7M sur 3 ans
→ Marge nette : +18.9M (+147% vs actuel)

**Prochaines Étapes** :
1. Valider budget marketing : 2.1M
2. Former équipe commerciale : 5 jours
3. Lancer campagne PME Santé : Semaine 1
4. Activer clients A/A+ : Semaine 2
5. Déployer refinancement : Semaine 3-4

**Voulez-vous le détail d'un segment ou le plan d'exécution complet ?**`;
        }
        // SCÉNARIO 4 : Performance produits
        if (lowerMessage.includes('produit') || lowerMessage.includes('performance') || lowerMessage.includes('rentab')) {
            return `📈 **Analyse Performance Produits TERAS Bank**

**🏆 Classement par Rentabilité**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**#1 - Crédit Immobilier** 🏠 [CHAMPION]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**Chiffres Clés** :
• Encours : 45M FCFA (31% du portefeuille)
• Nombre crédits : 12
• Ticket moyen : 3.75M FCFA
• Durée moyenne : 18 mois
• Taux moyen : 10.5%

**Performance** :
✅ Taux de défaut : 0% (PARFAIT!)
✅ Paiements à jour : 100%
✅ Marge nette annuelle : 4.2M FCFA
✅ ROE : 24.3% • ROA : 11.2%
✅ NPS Clients : 87/100 (Excellent)

**Analyse Détaillée** :
→ Profil clients : Cadres supérieurs + entrepreneurs
→ Score TERAS moyen : 826 (très élevé)
→ Garanties : Hypothèque + assurance décès
→ Taux remboursement anticipé : 8% (faible = bon)

**Opportunités** :
📈 Croissance : +35% possible (marché sous-pénétré)
💡 Nouveau : "Crédit Rénovation" (4-6M, 12 mois)
🎯 Cible : Propriétaires existants (68 prospects)
💰 Potentiel : +15M encours, +1.4M marge

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**#2 - Crédit PME Croissance** 🏢 [SOLIDE]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**Chiffres Clés** :
• Encours : 38M FCFA (26%)
• Nombre crédits : 24
• Ticket moyen : 1.58M FCFA
• Durée moyenne : 14 mois
• Taux moyen : 12%

**Performance** :
✅ Taux de défaut : 4.2% (acceptable)
⚠️ Retards occasionnels : 12%
✅ Marge nette : 4.1M FCFA
✅ ROE : 21.8% • ROA : 10.1%
📊 NPS : 78/100 (Bon)

**Secteurs Performants** :
🥇 Santé : 8M (défaut 0%, marge 35%)
🥈 Distribution : 12M (défaut 3%, marge 28%)
🥉 Services : 11M (défaut 6%, marge 24%)
🔴 Construction : 7M (défaut 14%, marge 15%) ⚠️

**Actions d'Optimisation** :
→ Réduire exposition Construction (-30%)
→ Augmenter Santé (+50% = +4M)
→ Créer "Pack PME Digitale" (services tech)
→ Alléger procédures pour renouvellements

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**#3 - Crédit Auto Premium** 🚗 [CROISSANCE]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**Chiffres Clés** :
• Encours : 28M FCFA (19%)
• Nombre crédits : 35
• Ticket moyen : 800K FCFA
• Durée moyenne : 24 mois
• Taux moyen : 11.5%

**Performance** :
✅ Défaut : 2.8% (très bon)
✅ Retards : 6% (contrôlé)
✅ Marge nette : 2.9M FCFA
✅ ROE : 19.4% • ROA : 9.3%
📊 NPS : 82/100 (Très bon)

**Insights** :
→ Véhicules neufs : défaut 1.2%
→ Véhicules occasion : défaut 5.8%
→ Partenariats concessionnaires : +45% volume
→ Assurance auto incluse : +12% satisfaction

**Opportunités** :
🚀 Partenariat 3 nouveaux concessionnaires
💡 "Crédit Moto" pour motos Premium
🎯 Volume additionnel : +18M encours
💰 Marge additionnelle : +1.9M

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**⚠️ Produits à Optimiser**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Microfinance** 👤 [ATTENTION]
• Encours : 13M (10%)
• Défaut : 12% (trop élevé!)
• Marge : 1.8M (14% ROE)

**Problèmes** :
🔴 Scoring insuffisant (min 550 → hausser à 620)
🔴 Suivi terrain insuffisant
🔴 Éducation financière clients faible

**Actions** :
✓ Revoir critères éligibilité
✓ Formation agents + visites hebdo
✓ App mobile avec alertes/rappels
✓ Ateliers gestion financière mensuels

**Impact Estimé** :
→ Réduction défaut : 12% → 7% (-42%)
→ Marge : +680K (+38%)

**Fonds de Roulement** 💼 [MARGES FAIBLES]
• Encours : 21M (14%)
• Marges : 18% (vs 24% cible)
• Taux : 13.5% (bas pour risque)

**Actions** :
→ Augmenter taux : +0.5pt (13.5% → 14%)
→ Réduire durée max : 12 → 9 mois
→ Exiger garanties stocks améliorées
→ Impact : +420K marge annuelle

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**💡 Nouveaux Produits Recommandés**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**1. Crédit Équipement Tech** 💻
→ Cible : PME digitales + freelances tech
→ Montant : 500K - 3M
→ Taux : 11%
→ Durée : 12-18 mois
→ Marché : 45 prospects identifiés
→ Volume : ~67M potentiel

**2. Crédit Agricole Saison** 🌾
→ Cible : Agriculteurs + agribusiness
→ Montant : 1-5M
→ Taux : 10%
→ Durée : 6-9 mois (cycle culture)
→ Garantie : Récolte future
→ Partenaire : État (subvention possible)

**3. Pack "Premier Crédit Entrepreneur"** 🚀
→ Cible : 18-35 ans, 1ère entreprise
→ Montant : 300K - 1.5M
→ Taux progressif : 12→10% si bon paiement
→ Accompagnement : Mentor + formation
→ Impact social : Fort

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**📊 Synthèse Globale**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Revenus par Produit** (annualisés) :
• Crédit Immobilier : 4.2M (33%)
• Crédit PME : 4.1M (32%)
• Crédit Auto : 2.9M (23%)
• Microfinance : 1.8M (14%)
• Fonds Roulement : 0.8M (6%)

**Recommandation Stratégique** :
→ Doubler exposition Crédit Immobilier (+45M)
→ Croître PME Santé sélectivement (+15M)
→ Maintenir Auto, améliorer partenariats
→ Réformer Microfinance (scoring strict)
→ Optimiser Fonds Roulement (taux +0.5pt)
→ Lancer 2 nouveaux produits en Q1 2025

**Impact Global** :
Marge actuelle : 12.8M
Marge optimisée : 17.3M (+35%)
Timeline : 12-18 mois

**Souhaitez-vous le plan d'action détaillé d'un produit ?**`;
        }
        // Réponse par défaut améliorée
        return `Merci pour votre question ! 

Je suis l'**Assistant IA TERAS Bank** et je peux vous fournir des analyses détaillées sur :

📊 **Portefeuille** 
   → Performance, santé, répartition, KPIs

🎯 **Risques**
   → Identification clients, provisions, actions

🚀 **Opportunités**
   → Segments potentiel, cross-sell, refinancement

📈 **Produits**
   → Rentabilité, optimisation, nouveaux produits

🔢 **Scoring TERAS**
   → Distribution, tendances, recommandations

💰 **Simulations**
   → Calculs crédit, mensualités, rentabilité

Posez-moi une question plus spécifique pour obtenir une analyse complète avec recommandations actionnables !

Par exemple :
• "Analyse complète du portefeuille"
• "Quels sont nos clients à risque ?"
• "Opportunités de croissance Q1 2025"
• "Performance des produits immobiliers"`;
    };
    const handleSend = async () => {
        if (!input.trim() || isTyping)
            return;
        const userMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMessage]);
        const userInput = input;
        setInput('');
        setIsTyping(true);
        try {
            const res = await authFetch('/api/scoring/bank/ai/chat/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userInput }),
            });
            const data = res.ok ? await res.json() : null;
            const reply = data?.response || data?.message || 'Je rencontre une difficulté technique. Réessayez.';
            setMessages(prev => [...prev, {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: reply,
                    timestamp: new Date(),
                }]);
        }
        catch {
            setMessages(prev => [...prev, {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: 'Service temporairement indisponible.',
                    timestamp: new Date(),
                }]);
        }
        finally {
            setIsTyping(false);
        }
    };
    const handleSuggestionClick = (suggestion) => {
        setInput(suggestion);
        inputRef.current?.focus();
    };
    const formatTime = (date) => {
        return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    };
    return (_jsxs("div", { className: "h-[calc(100vh-8rem)] flex flex-col", children: [_jsx("div", { className: "bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6 mb-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: "w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center p-2", children: _jsx("img", { src: terasLogoUrl, alt: "TERAS", className: "w-full h-full object-contain" }) }), _jsxs("div", { children: [_jsxs("h1", { className: "text-2xl font-bold text-white flex items-center gap-2", children: ["Assistant IA TERAS", _jsx("span", { className: "px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded-lg", children: "\u25CF En ligne" })] }), _jsx("p", { className: "text-slate-400 text-sm mt-1", children: "Analyse intelligente \u2022 Insights temps r\u00E9el \u2022 Recommandations personnalis\u00E9es" })] })] }), _jsx("div", { className: "flex items-center gap-3", children: _jsxs("div", { className: "text-right", children: [_jsx("p", { className: "text-slate-400 text-xs", children: "Contexte charg\u00E9" }), _jsxs("p", { className: "text-white text-sm font-semibold", children: [terasContext.totalLoans, " cr\u00E9dits \u2022 ", terasContext.totalClients, " clients"] })] }) })] }) }), _jsxs("div", { className: "flex-1 bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl overflow-hidden flex flex-col", children: [_jsxs("div", { className: "flex-1 overflow-y-auto p-6 space-y-6", children: [messages.map((message) => (_jsxs("div", { className: `flex gap-4 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`, children: [_jsx("div", { className: `w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${message.role === 'user'
                                            ? 'bg-gradient-to-br from-blue-500 to-cyan-500'
                                            : 'bg-gradient-to-br from-purple-500 to-pink-500'}`, children: message.role === 'user' ? (_jsx(User, { className: "w-5 h-5 text-white" })) : (_jsx(Bot, { className: "w-5 h-5 text-white" })) }), _jsxs("div", { className: `flex-1 max-w-3xl ${message.role === 'user' ? 'flex flex-col items-end' : ''}`, children: [_jsx("div", { className: `rounded-2xl p-4 ${message.role === 'user'
                                                    ? 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30'
                                                    : 'bg-slate-800/50 border border-slate-700/50'}`, children: _jsx("p", { className: "text-white whitespace-pre-line leading-relaxed", children: message.content }) }), _jsxs("div", { className: `flex items-center gap-2 mt-2 text-xs text-slate-400 ${message.role === 'user' ? 'flex-row-reverse' : ''}`, children: [_jsx("span", { children: formatTime(message.timestamp) }), message.role === 'assistant' && (_jsx("span", { className: "px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded", children: "IA" }))] }), message.role === 'assistant' && message.suggestions && (_jsx("div", { className: "flex flex-wrap gap-2 mt-4", children: message.suggestions.map((suggestion, idx) => (_jsx("button", { onClick: () => handleSuggestionClick(suggestion), className: "px-3 py-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 hover:border-blue-500/50 rounded-lg text-slate-300 hover:text-white text-sm transition-all", children: suggestion }, idx))) }))] })] }, message.id))), isTyping && (_jsxs("div", { className: "flex gap-4", children: [_jsx("div", { className: "w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0", children: _jsx(Bot, { className: "w-5 h-5 text-white" }) }), _jsx("div", { className: "bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Loader2, { className: "w-4 h-4 text-purple-400 animate-spin" }), _jsx("span", { className: "text-slate-400 text-sm", children: "L'assistant analyse vos donn\u00E9es..." })] }) })] })), _jsx("div", { ref: messagesEndRef })] }), _jsxs("div", { className: "border-t border-slate-800 p-4", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("div", { className: "flex-1 relative", children: [_jsx("input", { ref: inputRef, type: "text", value: input, onChange: (e) => setInput(e.target.value), onKeyPress: (e) => e.key === 'Enter' && handleSend(), placeholder: "Posez votre question sur les cr\u00E9dits, clients, risques...", className: "w-full px-4 py-3 pr-12 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20", disabled: isTyping }), _jsx(Sparkles, { className: "absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" })] }), _jsxs("button", { onClick: handleSend, disabled: !input.trim() || isTyping, className: "px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2", children: [_jsx(Send, { className: "w-5 h-5" }), _jsx("span", { className: "hidden sm:inline", children: "Envoyer" })] })] }), _jsxs("div", { className: "flex flex-wrap gap-2 mt-3", children: [_jsxs("button", { onClick: () => setInput("Analyse complète du portefeuille"), className: "px-3 py-1.5 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 rounded-lg text-slate-300 hover:text-white text-xs transition-all flex items-center gap-1.5", children: [_jsx(BarChart3, { className: "w-3.5 h-3.5" }), "Portefeuille"] }), _jsxs("button", { onClick: () => setInput("Liste des clients à risque élevé"), className: "px-3 py-1.5 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 rounded-lg text-slate-300 hover:text-white text-xs transition-all flex items-center gap-1.5", children: [_jsx(AlertCircle, { className: "w-3.5 h-3.5" }), "Risques"] }), _jsxs("button", { onClick: () => setInput("Opportunités de croissance identifiées"), className: "px-3 py-1.5 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 rounded-lg text-slate-300 hover:text-white text-xs transition-all flex items-center gap-1.5", children: [_jsx(TrendingUp, { className: "w-3.5 h-3.5" }), "Opportunit\u00E9s"] }), _jsxs("button", { onClick: () => setInput("Performance des produits financiers"), className: "px-3 py-1.5 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 rounded-lg text-slate-300 hover:text-white text-xs transition-all flex items-center gap-1.5", children: [_jsx(DollarSign, { className: "w-3.5 h-3.5" }), "Produits"] }), _jsxs("button", { onClick: () => setInput("Insights score TERAS"), className: "px-3 py-1.5 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 rounded-lg text-slate-300 hover:text-white text-xs transition-all flex items-center gap-1.5", children: [_jsx(FileText, { className: "w-3.5 h-3.5" }), "Scoring"] })] })] })] })] }));
}
