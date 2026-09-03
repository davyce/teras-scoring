// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Types
interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
  helpful: number;
}

interface GuideSection {
  id: string;
  title: string;
  icon: string;
  content: string[];
  videoUrl?: string;
}

interface SupportTicket {
  id: string;
  subject: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: string;
  updatedAt: string;
  messages: Array<{
    id: string;
    sender: 'user' | 'support';
    senderName: string;
    content: string;
    timestamp: string;
    attachments?: string[];
  }>;
}

const UserHelp: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'guide' | 'faq' | 'support' | 'tickets'>('guide');
  const [selectedGuideSection, setSelectedGuideSection] = useState<string>('getting-started');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFAQs, setFilteredFAQs] = useState<FAQ[]>([]);
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  
  // Support Chat
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  const [newTicket, setNewTicket] = useState({
    subject: '',
    category: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    message: '',
    attachments: [] as File[]
  });
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketReply, setTicketReply] = useState('');
  const [loading, setLoading] = useState(false);

  // Guide d'utilisation complet
  const guideSections: GuideSection[] = [
    {
      id: 'getting-started',
      title: '🚀 Bien Démarrer',
      icon: '🚀',
      content: [
        '**Bienvenue sur TERAS IA APP !** Votre plateforme intelligente de scoring crédit.',
        '',
        '### Étape 1 : Compléter votre profil',
        '- Allez dans **Mon Espace** > **Profil**',
        '- Renseignez vos informations personnelles (nom, prénom, date de naissance)',
        '- Ajoutez vos coordonnées (téléphone, email)',
        '- Téléchargez votre pièce d\'identité pour validation KYC',
        '',
        '### Étape 2 : Connecter votre compte ZOLA',
        '- Dans **Mon Espace**, cliquez sur "Connecter ZOLA"',
        '- Autorisez TERAS à accéder à vos transactions (les 3 derniers mois minimum)',
        '- Cette étape est essentielle pour calculer votre score TERAS',
        '',
        '### Étape 3 : Calculer votre score',
        '- Allez dans **Calcul de Score**',
        '- Remplissez les informations sur vos revenus, épargne, et actifs',
        '- Uploadez vos relevés bancaires si disponibles',
        '- Cliquez sur "Calculer mon score TERAS"',
        '',
        '### Étape 4 : Explorer les options de crédit',
        '- Visitez la page **Crédit** pour voir les produits financiers disponibles',
        '- Votre éligibilité est calculée automatiquement selon votre score',
        '- Utilisez le simulateur pour estimer vos mensualités',
        '',
        '💡 **Astuce** : Plus vous utilisez ZOLA régulièrement, plus votre score s\'améliore !'
      ]
    },
    {
      id: 'understanding-score',
      title: '📊 Comprendre Votre Score',
      icon: '📊',
      content: [
        '## Le Score TERAS : Comment ça marche ?',
        '',
        'Votre score TERAS est calculé sur **1000 points** et se base sur 5 piliers :',
        '',
        '### T - Transactions (300 points - 30%)',
        '**Ce qui compte :**',
        '- Fréquence de vos transactions ZOLA (paiements, transferts)',
        '- Régularité : Êtes-vous actif tous les jours ou par intermittence ?',
        '- Diversité : Utilisez-vous plusieurs canaux (mobile, POS, carte) ?',
        '- Équilibre : Ratio entre entrées et sorties d\'argent',
        '',
        '**Comment l\'améliorer :**',
        '✅ Utilisez ZOLA pour vos paiements quotidiens',
        '✅ Évitez les longues périodes d\'inactivité',
        '✅ Diversifiez vos modes de paiement',
        '',
        '### E - Épargne (150 points - 15%)',
        '**Ce qui compte :**',
        '- Montant moyen épargné par mois',
        '- Constance : Nombre de mois consécutifs avec épargne (streak)',
        '- Croissance : Votre épargne augmente-t-elle dans le temps ?',
        '',
        '**Comment l\'améliorer :**',
        '✅ Mettez en place un virement automatique mensuel (même 5 000 CDF)',
        '✅ Ne touchez pas à votre épargne pendant au moins 3 mois',
        '✅ Augmentez progressivement le montant épargné',
        '',
        '### R - Revenus (200 points - 20%)',
        '**Ce qui compte :**',
        '- Montant moyen de vos revenus mensuels',
        '- Stabilité : Vos revenus sont-ils réguliers ou erratiques ?',
        '- Vérification : Revenus attestés (bulletin de paie, factures SFEC)',
        '',
        '**Comment l\'améliorer :**',
        '✅ Déclarez tous vos revenus (salaire, ventes, prestations)',
        '✅ Utilisez les factures SFEC pour vos transactions commerciales',
        '✅ Évitez les mois sans revenus (diversifiez vos sources)',
        '',
        '### A - Actifs (150 points - 15%)',
        '**Ce qui compte :**',
        '- Valeur des biens que vous possédez (moto, terrain, équipement)',
        '- Qualité de la preuve : Photos, factures, carte grise, titre foncier',
        '- Facilité de saisie en cas de défaut (moto > crypto)',
        '',
        '**Comment l\'améliorer :**',
        '✅ Déclarez vos biens avec preuves (photos HD, documents)',
        '✅ Priorisez les actifs facilement valorisables (véhicule, équipement)',
        '✅ Mettez à jour la valeur de vos actifs régulièrement',
        '',
        '### S - Social (200 points - 20%)',
        '**Ce qui compte :**',
        '- Votre note moyenne sur ZONE (avis clients)',
        '- Nombre d\'évaluations positives',
        '- Historique de litiges ou incidents',
        '- Participation communautaire (tontines, associations)',
        '',
        '**Comment l\'améliorer :**',
        '✅ Collectez des avis clients sur ZONE',
        '✅ Résolvez rapidement tout litige ou réclamation',
        '✅ Évitez les retards de paiement',
        '',
        '## Bandes de Score',
        '',
        '- **A+ (900-1000)** : Excellent - Accès aux meilleurs taux (6-8% /an)',
        '- **A (800-899)** : Très bon - Crédits jusqu\'à 5M CDF (8-12% /an)',
        '- **B (700-799)** : Bon - Crédits jusqu\'à 2M CDF (12-18% /an)',
        '- **C (600-699)** : Moyen - Crédits jusqu\'à 500K CDF (18-24% /an)',
        '- **D (500-599)** : Faible - Micro-crédits avec éducation financière',
        '- **E (<500)** : Refus - Plan d\'amélioration 6 mois'
      ]
    },
    {
      id: 'credit-process',
      title: '💳 Demander un Crédit',
      icon: '💳',
      content: [
        '## Processus de Demande de Crédit',
        '',
        '### 1. Vérifier votre éligibilité',
        '- Allez dans **Crédit** > **Produits Disponibles**',
        '- Les produits auxquels vous êtes **éligible immédiatement** sont en vert ✅',
        '- Les produits **sous conditions** sont en orange ⚠️',
        '- Les produits **non accessibles** sont grisés',
        '',
        '### 2. Choisir le bon produit',
        '**SEED** (Score <500) : 25-100K CDF, 14-30 jours',
        '- Pour : Premier crédit test, urgence ponctuelle',
        '- Garanties : Aucune',
        '',
        '**STARTER** (Score 500-599) : 100-300K CDF, 1-3 mois',
        '- Pour : Trésorerie micro-entreprise',
        '- Garanties : Co-emprunteur ou gage',
        '',
        '**GROWTH** (Score 600-699) : 300K-1M CDF, 3-6 mois',
        '- Pour : Stock, équipement professionnel',
        '- Garanties : Gage matériel obligatoire',
        '',
        '**PRO** (Score 700+) : 1-5M CDF, 6-24 mois',
        '- Pour : Expansion, moto-taxi, local commercial',
        '- Garanties : Selon montant',
        '',
        '### 3. Utiliser le simulateur',
        '- Allez dans **Crédit** > **Simulateur**',
        '- Entrez le montant souhaité et la durée',
        '- Vérifiez que votre **taux d\'effort ≤ 30%**',
        '- Si > 30%, réduisez le montant ou augmentez la durée',
        '',
        '### 4. Remplir le formulaire',
        '**Informations requises :**',
        '- Montant exact (entre min et max du produit)',
        '- Durée de remboursement',
        '- **Motif détaillé** (minimum 20 caractères)',
        '  Exemple : "Achat de stock de poissons frais pour mon commerce au marché Total. Besoin de 500K CDF pour acheter en gros et augmenter ma marge."',
        '- Revenus mensuels déclarés',
        '- Garanties (si requises)',
        '',
        '### 5. Fournir les garanties',
        '',
        '**Co-emprunteur :**',
        '- Personne de confiance qui s\'engage à rembourser si vous ne pouvez pas',
        '- Doit avoir un score TERAS ≥ 600',
        '- Documents : Copie CNI, justificatif revenus',
        '',
        '**Gage moto/véhicule :**',
        '- Photos HD (4 angles + carte grise)',
        '- Valeur ≥ 70% du crédit demandé',
        '- Nantissement notarié pour montants > 1M CDF',
        '',
        '**Gage équipement :**',
        '- Photos + facture d\'achat',
        '- Équipement professionnel (congélateur, groupe électrogène, etc.)',
        '',
        '### 6. Validation & Décaissement',
        '',
        '**Timeline :**',
        '- **J+0** : Soumission demande → Statut "En attente"',
        '- **J+1 à J+2** : Examen par la banque → Statut "En examen"',
        '- **J+2** : Décision → "Approuvé" ou "Refusé"',
        '- **J+3** : Décaissement sur compte ZOLA (si approuvé)',
        '',
        '**Si approuvé :**',
        '✅ Vous recevez une notification email + SMS',
        '✅ Consultez les détails (mensualité, échéances)',
        '✅ Acceptez l\'offre en ligne',
        '✅ Argent disponible sous 24h sur ZOLA',
        '',
        '**Si refusé :**',
        'ℹ️ Vous recevez un feedback détaillé',
        'ℹ️ L\'assistant IA vous propose un plan d\'amélioration',
        'ℹ️ Nouvelle demande possible après 30 jours'
      ]
    },
    {
      id: 'improving-score',
      title: '📈 Améliorer Votre Score',
      icon: '📈',
      content: [
        '## Plan d\'Action pour Améliorer Votre Score',
        '',
        '### 🎯 Objectif : +100 points en 3-6 mois',
        '',
        '#### Mois 1-2 : Actions Immédiates (+40 pts)',
        '',
        '**1. Épargne Régulière** (+25 pts)',
        '- Mettez en place un virement automatique de 10-15K CDF/mois',
        '- Ne touchez pas à cette épargne pendant 3 mois minimum',
        '- Bonus : Si vous maintenez 6 mois → +40 pts au total',
        '',
        '**2. Déclarer vos Actifs** (+15 pts)',
        '- Prenez des photos HD de votre moto/congélateur/équipement',
        '- Scannez vos documents (carte grise, facture)',
        '- Allez dans Mon Espace > Actifs > Ajouter un bien',
        '',
        '#### Mois 3-4 : Consolidation (+30 pts)',
        '',
        '**3. Transactions Régulières** (+15 pts)',
        '- Utilisez ZOLA tous les jours (même pour petits montants)',
        '- Diversifiez : Mobile + POS + Carte (si possible)',
        '- Évitez les "trous" d\'inactivité',
        '',
        '**4. Avis Clients ZONE** (+15 pts)',
        '- Demandez à 10-15 clients satisfaits de vous noter',
        '- Répondez professionnellement aux avis (même négatifs)',
        '- Visez une note moyenne ≥ 4.5/5',
        '',
        '#### Mois 5-6 : Optimisation (+30 pts)',
        '',
        '**5. Stabiliser vos Revenus** (+20 pts)',
        '- Diversifiez vos sources de revenus',
        '- Utilisez les factures SFEC pour vos ventes',
        '- Évitez les mois "à zéro"',
        '',
        '**6. Résoudre tout Incident** (+10 pts)',
        '- Réglez tout litige ou retard de paiement',
        '- Contactez les créanciers pour plan de paiement',
        '- Évitez les découverts bancaires',
        '',
        '### 💡 Exemples Concrets',
        '',
        '**Cas 1 : Marie, Score 550 → 680 en 4 mois**',
        '- Épargne 15K CDF/mois pendant 4 mois → +30 pts',
        '- Déclaré son congélateur (200K CDF) → +20 pts',
        '- Collecté 18 avis clients (4.6/5) → +25 pts',
        '- Transactions ZOLA quotidiennes → +20 pts',
        '- Stabilisé revenus (80K CDF/mois) → +15 pts',
        '- **TOTAL : +110 pts → Passage en Bande C !**',
        '',
        '**Cas 2 : Paul, Score 420 → 520 en 6 mois**',
        '- Épargne 5K CDF/mois pendant 6 mois → +35 pts',
        '- Augmenté fréquence transactions → +30 pts',
        '- Résolu un litige avec fournisseur → +15 pts',
        '- Revenus régularisés (50K CDF/mois) → +20 pts',
        '- **TOTAL : +100 pts → Éligible STARTER !**',
        '',
        '### ⚠️ Erreurs à Éviter',
        '',
        '❌ Retirer l\'épargne avant 3 mois (perd le bonus streak)',
        '❌ Longs périodes sans transactions ZOLA',
        '❌ Déclarer des actifs sans preuves (rejeté)',
        '❌ Ignorer les avis négatifs clients',
        '❌ Multiplier les demandes de crédit refusées'
      ]
    },
    {
      id: 'security-privacy',
      title: '🔐 Sécurité & Confidentialité',
      icon: '🔐',
      content: [
        '## Vos Données en Toute Sécurité',
        '',
        '### 🛡️ Comment TERAS Protège Vos Données',
        '',
        '**Chiffrement de Bout en Bout**',
        '- Toutes vos données sont chiffrées AES-256 (standard bancaire)',
        '- Connexions sécurisées HTTPS/TLS 1.3',
        '- Mots de passe hashés (jamais stockés en clair)',
        '',
        '**Accès Restreint**',
        '- Vos données ne sont visibles que par vous et les agents autorisés',
        '- Authentification à deux facteurs (2FA) disponible',
        '- Déconnexion automatique après 1h d\'inactivité',
        '',
        '**Conformité RGPD & Loi Congolaise**',
        '- Vous êtes propriétaire de vos données',
        '- Droit d\'accès, rectification, suppression',
        '- Export de vos données possible (JSON/PDF)',
        '',
        '### 🔑 Conseils de Sécurité',
        '',
        '**Mot de passe fort :**',
        '✅ Minimum 12 caractères',
        '✅ Mélange majuscules, minuscules, chiffres, symboles',
        '✅ Unique (ne pas réutiliser)',
        '✅ Changez-le tous les 6 mois',
        '',
        '**Évitez :**',
        '❌ Partager votre mot de passe',
        '❌ Vous connecter sur ordinateur public',
        '❌ Cliquer sur liens suspects (phishing)',
        '❌ Donner vos codes par téléphone',
        '',
        '### 📞 En Cas de Problème',
        '',
        '**Compte compromis ?**',
        '1. Changez immédiatement votre mot de passe',
        '2. Contactez le support (chat ou email)',
        '3. Vérifiez vos transactions récentes',
        '4. Activez la 2FA',
        '',
        '**Transaction suspecte ?**',
        '1. Signalez-la dans Mon Espace > Transactions',
        '2. Ouvrez un ticket support (catégorie "Sécurité")',
        '3. Nous enquêtons sous 24h',
        '',
        '### 🗑️ Supprimer Vos Données',
        '',
        'Conformément au RGPD, vous pouvez demander la suppression de vos données :',
        '',
        '1. Allez dans **Mon Espace** > **Paramètres**',
        '2. Cliquez sur "Supprimer mon compte"',
        '3. Confirmez par email',
        '4. Vos données sont supprimées sous 30 jours',
        '',
        '⚠️ **Attention** : Cette action est irréversible et supprime :',
        '- Votre score TERAS',
        '- Votre historique de crédit',
        '- Tous vos documents uploadés',
        '',
        '📄 Les données légales sont conservées 5 ans (obligation légale)'
      ]
    },
    {
      id: 'troubleshooting',
      title: '🔧 Résolution de Problèmes',
      icon: '🔧',
      content: [
        '## Problèmes Fréquents & Solutions',
        '',
        '### 1. "Mon score n\'est pas calculé"',
        '',
        '**Causes possibles :**',
        '- Données insuffisantes (< 3 mois d\'activité ZOLA)',
        '- Compte ZOLA non connecté',
        '- Documents KYC non validés',
        '',
        '**Solutions :**',
        '✅ Vérifiez que votre compte ZOLA est bien connecté',
        '✅ Attendez au moins 3 mois d\'activité ZOLA régulière',
        '✅ Complétez votre profil à 100%',
        '✅ Uploadez vos documents d\'identité',
        '',
        '### 2. "Mes documents ne se téléchargent pas"',
        '',
        '**Vérifications :**',
        '- Format accepté : PDF, JPG, PNG (< 10 MB)',
        '- Connexion internet stable',
        '- Navigateur à jour (Chrome, Firefox, Safari)',
        '',
        '**Solutions :**',
        '✅ Réduisez la taille du fichier (compressez)',
        '✅ Essayez un autre format',
        '✅ Videz le cache de votre navigateur',
        '✅ Désactivez temporairement les extensions (bloqueurs de pub)',
        '',
        '### 3. "Ma demande de crédit a été refusée"',
        '',
        '**Raisons fréquentes :**',
        '- Score TERAS insuffisant pour le produit',
        '- Taux d\'effort > 30% (mensualité trop élevée)',
        '- Garanties insuffisantes ou invalides',
        '- Historique d\'impayés récents',
        '',
        '**Que faire ?**',
        '✅ Consultez le feedback détaillé dans "Mes Demandes"',
        '✅ Suivez le plan d\'action proposé par l\'assistant IA',
        '✅ Améliorez votre score pendant 3-6 mois',
        '✅ Réessayez avec un montant plus faible',
        '',
        '### 4. "Je ne reçois pas les notifications"',
        '',
        '**Vérifications :**',
        '- Email correct dans votre profil',
        '- Vérifiez vos spams/courrier indésirable',
        '- Notifications activées dans Paramètres',
        '',
        '**Solutions :**',
        '✅ Ajoutez noreply@teras.ai à vos contacts',
        '✅ Allez dans Paramètres > Notifications',
        '✅ Cochez "Recevoir notifications par email"',
        '✅ Testez avec "Envoyer notification test"',
        '',
        '### 5. "L\'application est lente"',
        '',
        '**Causes :**',
        '- Connexion internet faible',
        '- Navigateur surchargé (trop d\'onglets)',
        '- Cache navigateur plein',
        '',
        '**Solutions :**',
        '✅ Vérifiez votre connexion (min 2 Mbps)',
        '✅ Fermez les onglets inutiles',
        '✅ Videz le cache : Ctrl+Maj+Suppr (PC) / Cmd+Maj+Suppr (Mac)',
        '✅ Utilisez Chrome ou Firefox (recommandés)',
        '',
        '### 6. "Je n\'arrive pas à me connecter"',
        '',
        '**Mot de passe oublié ?**',
        '1. Cliquez sur "Mot de passe oublié" sur la page de connexion',
        '2. Entrez votre email',
        '3. Vérifiez votre boîte mail (valable 1h)',
        '4. Créez un nouveau mot de passe',
        '',
        '**Compte bloqué ?**',
        '- Après 5 tentatives ratées, compte bloqué 30 min',
        '- Contactez le support si blocage persistant',
        '',
        '### 🆘 Aucune Solution ne Fonctionne ?',
        '',
        'Contactez notre support :',
        '- **Chat support** : Disponible 24/7',
        '- **Email** : support@teras.ai',
        '- **WhatsApp** : +242 06 XXX XX XX',
        '- **Temps de réponse** : < 4h en journée'
      ]
    }
  ];

  // FAQ complète
  const allFAQs: FAQ[] = [
    // Score TERAS
    {
      id: 'faq-001',
      category: 'Score TERAS',
      question: 'Qu\'est-ce que le score TERAS et à quoi sert-il ?',
      answer: 'Le score TERAS est une note sur 1000 points qui évalue votre crédibilité financière. Il se base sur 5 piliers : Transactions, Épargne, Revenus, Actifs, et Social. Plus votre score est élevé, plus vous accédez à des crédits avantageux (montants élevés, taux bas). Il remplace le système classique qui exclut 80% de la population.',
      helpful: 245
    },
    {
      id: 'faq-002',
      category: 'Score TERAS',
      question: 'Combien de temps faut-il pour calculer mon score ?',
      answer: 'Le calcul est instantané (<5 secondes) une fois que vous avez complété votre profil et connecté votre compte ZOLA. Cependant, pour un score fiable, nous recommandons au moins 3 mois d\'activité ZOLA régulière.',
      helpful: 189
    },
    {
      id: 'faq-003',
      category: 'Score TERAS',
      question: 'Mon score peut-il baisser ?',
      answer: 'Oui, votre score évolue en temps réel selon votre comportement financier. Il peut baisser si : vous cessez d\'utiliser ZOLA, vous retirez votre épargne, vous accumulez des retards de paiement, ou vos revenus chutent. Mais il peut aussi remonter rapidement en reprenant de bonnes pratiques !',
      helpful: 167
    },
    // Crédit
    {
      id: 'faq-004',
      category: 'Crédit',
      question: 'Quel montant puis-je emprunter avec mon score ?',
      answer: 'Cela dépend de votre score ET de votre CRM (capacité de remboursement). Exemples : Score 550 (Bande D) → 100-300K CDF | Score 650 (Bande C) → 300K-1M CDF | Score 750 (Bande B) → 1-2M CDF | Score 850 (Bande A) → 2-5M CDF. Utilisez le simulateur pour un calcul précis.',
      helpful: 312
    },
    {
      id: 'faq-005',
      category: 'Crédit',
      question: 'Combien de temps pour obtenir mon crédit ?',
      answer: 'En moyenne 2-3 jours ouvrés : J+0 (soumission) → J+1-2 (examen banque) → J+2 (décision) → J+3 (décaissement si approuvé). Pour les crédits SEED (<100K CDF) et scores A/A+, le décaissement peut être en 24h.',
      helpful: 278
    },
    {
      id: 'faq-006',
      category: 'Crédit',
      question: 'Quelles garanties dois-je fournir ?',
      answer: 'Cela dépend du montant : <500K CDF → Co-emprunteur suffit | 500K-1M CDF → Gage matériel (moto, équipement) | >1M CDF → Nantissement notarié ou hypothèque. Les garanties réduisent le risque et peuvent améliorer vos conditions (taux plus bas).',
      helpful: 201
    },
    {
      id: 'faq-007',
      category: 'Crédit',
      question: 'Puis-je rembourser en avance sans pénalités ?',
      answer: 'Oui ! Le remboursement anticipé est gratuit et même encouragé. Vous économisez sur les intérêts et améliorez votre score TERAS (+10-20 pts). Contactez votre banque pour déclencher le remboursement anticipé.',
      helpful: 156
    },
    // Sécurité
    {
      id: 'faq-008',
      category: 'Sécurité',
      question: 'Mes données sont-elles en sécurité ?',
      answer: 'Absolument. TERAS utilise le chiffrement AES-256 (standard bancaire), des connexions HTTPS/TLS 1.3, et est conforme au RGPD. Vos données ne sont jamais vendues à des tiers. Seuls vous et les agents autorisés y ont accès.',
      helpful: 223
    },
    {
      id: 'faq-009',
      category: 'Sécurité',
      question: 'Que faire si je soupçonne une fraude sur mon compte ?',
      answer: 'Agissez immédiatement : 1) Changez votre mot de passe, 2) Ouvrez un ticket support (catégorie "Sécurité"), 3) Vérifiez vos transactions récentes, 4) Activez la 2FA. Nous enquêtons sous 24h et bloquons toute activité suspecte.',
      helpful: 134
    },
    // Technique
    {
      id: 'faq-010',
      category: 'Technique',
      question: 'Pourquoi mes documents ne se téléchargent pas ?',
      answer: 'Vérifiez : 1) Format accepté (PDF, JPG, PNG), 2) Taille < 10 MB, 3) Connexion internet stable, 4) Navigateur à jour. Essayez de compresser votre fichier ou d\'utiliser un autre format. Si le problème persiste, contactez le support.',
      helpful: 178
    },
    {
      id: 'faq-011',
      category: 'Technique',
      question: 'L\'application est lente, que faire ?',
      answer: 'Solutions rapides : 1) Vérifiez votre connexion (min 2 Mbps), 2) Fermez les onglets inutiles, 3) Videz le cache navigateur (Ctrl+Maj+Suppr), 4) Utilisez Chrome ou Firefox (recommandés). Si lenteur persiste, signalez-le au support.',
      helpful: 145
    },
    // Amélioration Score
    {
      id: 'faq-012',
      category: 'Amélioration',
      question: 'Comment passer de 650 à 750 en 3 mois ?',
      answer: 'Plan d\'action : 1) Épargne 15K CDF/mois pendant 3 mois (+30 pts), 2) Déclarez vos actifs (moto, équipement) (+20-30 pts), 3) Transactions ZOLA quotidiennes (+15 pts), 4) Collectez 10-15 avis clients ZONE (+15 pts), 5) Stabilisez vos revenus (+10 pts). Total : +90-100 pts = Objectif 750 atteint !',
      helpful: 267
    },
    {
      id: 'faq-013',
      category: 'Amélioration',
      question: 'L\'épargne régulière améliore vraiment mon score ?',
      answer: 'Oui, c\'est l\'action la plus impactante ! Épargner 10-15K CDF/mois pendant 3 mois = +25-30 pts. Le "streak" (mois consécutifs) est valorisé : 3 mois = +25 pts, 6 mois = +40 pts, 12 mois = +60 pts. Ne retirez pas votre épargne !',
      helpful: 198
    }
  ];

  useEffect(() => {
    if (searchQuery) {
      const filtered = allFAQs.filter(faq =>
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredFAQs(filtered);
    } else {
      setFilteredFAQs(allFAQs);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (activeTab === 'tickets') {
      fetchTickets();
    }
  }, [activeTab]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/scoring/user/support/tickets/');
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.tickets ?? data.results ?? []);
      setTickets(list);
    } catch (error: any) {
      console.error('Erreur récupération tickets:', error.message);
      setTickets([]); // état vide propre, pas de mock
    } finally {
      setLoading(false);
    }
  };

  const submitNewTicket = async () => {
    if (!newTicket.subject || !newTicket.category || !newTicket.message) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);
    try {
      // TODO: Remplacer par vraie API call
      const ticket: SupportTicket = {
        id: `ticket-${Date.now()}`,
        subject: newTicket.subject,
        category: newTicket.category,
        priority: newTicket.priority,
        status: 'open',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [
          {
            id: `msg-${Date.now()}`,
            sender: 'user',
            senderName: user?.first_name || 'Vous',
            content: newTicket.message,
            timestamp: new Date().toISOString()
          }
        ]
      };

      setTickets([ticket, ...tickets]);
      setShowNewTicketForm(false);
      setNewTicket({
        subject: '',
        category: '',
        priority: 'medium',
        message: '',
        attachments: []
      });
      
      alert('✅ Votre ticket a été créé ! Nous vous répondrons sous 4h.');
    } catch (error) {
      console.error('Erreur création ticket:', error);
      alert('❌ Erreur lors de la création du ticket. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const sendTicketReply = async () => {
    if (!selectedTicket || !ticketReply.trim()) return;

    try {
      const newMessage = {
        id: `msg-${Date.now()}`,
        sender: 'user' as const,
        senderName: user?.first_name || 'Vous',
        content: ticketReply,
        timestamp: new Date().toISOString()
      };

      const updatedTicket = {
        ...selectedTicket,
        messages: [...selectedTicket.messages, newMessage],
        updatedAt: new Date().toISOString()
      };

      setSelectedTicket(updatedTicket);
      setTickets(tickets.map(t => t.id === updatedTicket.id ? updatedTicket : t));
      setTicketReply('');
    } catch (error) {
      console.error('Erreur envoi réponse:', error);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <span className="px-2 py-1 rounded text-xs font-semibold bg-red-500 text-white">🔴 Haute</span>;
      case 'medium':
        return <span className="px-2 py-1 rounded text-xs font-semibold bg-yellow-500 text-white">🟡 Moyenne</span>;
      case 'low':
        return <span className="px-2 py-1 rounded text-xs font-semibold bg-green-500 text-white">🟢 Basse</span>;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-500 text-white">🆕 Ouvert</span>;
      case 'in_progress':
        return <span className="px-2 py-1 rounded text-xs font-semibold bg-purple-500 text-white">⏳ En Cours</span>;
      case 'resolved':
        return <span className="px-2 py-1 rounded text-xs font-semibold bg-green-500 text-white">✅ Résolu</span>;
      case 'closed':
        return <span className="px-2 py-1 rounded text-xs font-semibold bg-gray-500 text-white">🔒 Fermé</span>;
      default:
        return null;
    }
  };

  const renderMarkdown = (content: string) => {
    return content.split('\n').map((line, idx) => {
      // Titres
      if (line.startsWith('### ')) {
        return <h3 key={idx} className="text-xl font-bold text-white mt-6 mb-3">{line.replace('### ', '')}</h3>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={idx} className="text-2xl font-bold text-white mt-8 mb-4">{line.replace('## ', '')}</h2>;
      }
      // Gras
      if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={idx} className="font-bold text-white mt-2">{line.replace(/\*\*/g, '')}</p>;
      }
      // Liste
      if (line.startsWith('- ') || line.startsWith('✅ ') || line.startsWith('❌ ')) {
        return (
          <li key={idx} className="text-gray-300 ml-6 mb-1">
            {line.replace(/^- |^✅ |^❌ /, '')}
          </li>
        );
      }
      // Ligne vide
      if (line === '') {
        return <div key={idx} className="h-2"></div>;
      }
      // Texte normal
      return <p key={idx} className="text-gray-300 mb-2">{line}</p>;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            💬 Centre d'Aide TERAS
          </h1>
          <p className="text-gray-400">
            Trouvez des réponses à vos questions ou contactez notre support
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={() => setActiveTab('guide')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'guide'
                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/50'
                : 'bg-white/10 text-gray-400 hover:bg-white/20'
            }`}
          >
            📖 Guide d'Utilisation
          </button>
          <button
            onClick={() => setActiveTab('faq')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'faq'
                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/50'
                : 'bg-white/10 text-gray-400 hover:bg-white/20'
            }`}
          >
            ❓ FAQ
          </button>
          <button
            onClick={() => setActiveTab('support')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'support'
                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/50'
                : 'bg-white/10 text-gray-400 hover:bg-white/20'
            }`}
          >
            💬 Chat Support
          </button>
          <button
            onClick={() => setActiveTab('tickets')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all relative ${
              activeTab === 'tickets'
                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/50'
                : 'bg-white/10 text-gray-400 hover:bg-white/20'
            }`}
          >
            🎫 Mes Tickets
            {tickets.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                {tickets.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'guide' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar Sections */}
            <div className="lg:col-span-1">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 sticky top-4">
                <h3 className="text-lg font-bold text-white mb-4">Sections</h3>
                <div className="space-y-2">
                  {guideSections.map(section => (
                    <button
                      key={section.id}
                      onClick={() => setSelectedGuideSection(section.id)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                        selectedGuideSection === section.id
                          ? 'bg-cyan-500 text-white shadow-lg'
                          : 'bg-white/5 text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">{section.icon}</span>
                        <span className="text-sm font-semibold">{section.title.replace(section.icon + ' ', '')}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="lg:col-span-3">
              {guideSections
                .filter(s => s.id === selectedGuideSection)
                .map(section => (
                  <div
                    key={section.id}
                    className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8"
                  >
                    <h2 className="text-3xl font-bold text-white mb-6">{section.title}</h2>
                    <div className="prose prose-invert max-w-none">
                      {renderMarkdown(section.content.join('\n'))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {activeTab === 'faq' && (
          <div>
            {/* Search Bar */}
            <div className="mb-6">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher dans la FAQ..."
                className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* FAQ Categories */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {['Score TERAS', 'Crédit', 'Sécurité', 'Technique', 'Amélioration'].map(category => {
                const categoryFAQs = filteredFAQs.filter(faq => faq.category === category);
                if (categoryFAQs.length === 0) return null;

                return (
                  <div key={category} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-white mb-4">{category}</h3>
                    <div className="space-y-4">
                      {categoryFAQs.map(faq => (
                        <div key={faq.id} className="bg-white/5 rounded-lg overflow-hidden">
                          <button
                            onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                            className="w-full text-left px-4 py-3 flex justify-between items-center hover:bg-white/10 transition-all"
                          >
                            <span className="text-white font-semibold pr-4">{faq.question}</span>
                            <svg
                              className={`w-5 h-5 text-cyan-400 flex-shrink-0 transition-transform ${
                                expandedFAQ === faq.id ? 'rotate-180' : ''
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          {expandedFAQ === faq.id && (
                            <div className="px-4 pb-4">
                              <p className="text-gray-300 text-sm mb-3">{faq.answer}</p>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2 text-xs text-gray-400">
                                  <span>👍 {faq.helpful} personnes ont trouvé ceci utile</span>
                                </div>
                                <button className="text-cyan-400 text-xs hover:underline">
                                  Ceci vous a-t-il aidé ?
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredFAQs.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-2xl font-bold text-white mb-2">Aucun résultat trouvé</h3>
                <p className="text-gray-400 mb-6">
                  Essayez avec d'autres mots-clés ou contactez notre support
                </p>
                <button
                  onClick={() => setActiveTab('support')}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all"
                >
                  Contacter le Support
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'support' && (
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">💬</div>
              <h2 className="text-3xl font-bold text-white mb-2">
                Besoin d'aide ? Contactez-nous !
              </h2>
              <p className="text-gray-300">
                Notre équipe répond en moyenne en moins de 4 heures
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">📧 Email</h3>
                <p className="text-gray-300 mb-4">support@teras.ai</p>
                <p className="text-gray-400 text-sm">Réponse sous 4h en journée</p>
              </div>

              <div className="bg-gradient-to-br from-purple-500/20 to-pink-600/20 border border-purple-500/30 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">📱 WhatsApp</h3>
                <p className="text-gray-300 mb-4">+242 06 XXX XX XX</p>
                <p className="text-gray-400 text-sm">Disponible 9h-18h (LUN-SAM)</p>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={() => {
                  setShowNewTicketForm(true);
                  setActiveTab('tickets');
                }}
                className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all"
              >
                🎫 Ouvrir un Ticket Support
              </button>
              <p className="text-gray-400 text-sm mt-4">
                Créez un ticket pour un suivi personnalisé de votre demande
              </p>
            </div>
          </div>
        )}

        {activeTab === 'tickets' && (
          <div>
            {!showNewTicketForm && !selectedTicket && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white">Mes Tickets de Support</h2>
                  <button
                    onClick={() => setShowNewTicketForm(true)}
                    className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all"
                  >
                    + Nouveau Ticket
                  </button>
                </div>

                {tickets.length === 0 ? (
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-12 text-center">
                    <div className="text-6xl mb-4">🎫</div>
                    <h3 className="text-2xl font-bold text-white mb-2">Aucun ticket ouvert</h3>
                    <p className="text-gray-400 mb-6">
                      Vous n'avez pas encore contacté le support. Créez un ticket si vous avez besoin d'aide !
                    </p>
                    <button
                      onClick={() => setShowNewTicketForm(true)}
                      className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all"
                    >
                      Créer mon premier ticket
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tickets.map(ticket => (
                      <div
                        key={ticket.id}
                        onClick={() => setSelectedTicket(ticket)}
                        className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 hover:shadow-xl hover:shadow-cyan-500/20 transition-all cursor-pointer"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-xl font-bold text-white mb-1">{ticket.subject}</h3>
                            <p className="text-gray-400 text-sm">
                              Créé le {new Date(ticket.createdAt).toLocaleDateString('fr-FR')} à{' '}
                              {new Date(ticket.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            {getStatusBadge(ticket.status)}
                            {getPriorityBadge(ticket.priority)}
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <span>📁 {ticket.category}</span>
                          <span>💬 {ticket.messages.length} message(s)</span>
                          <span>🕐 Mis à jour {new Date(ticket.updatedAt).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {showNewTicketForm && !selectedTicket && (
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white">Créer un Ticket Support</h2>
                  <button
                    onClick={() => setShowNewTicketForm(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-gray-300 text-sm font-semibold mb-2">
                      Sujet du ticket *
                    </label>
                    <input
                      type="text"
                      value={newTicket.subject}
                      onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                      placeholder="Ex: Problème d'upload de document"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-gray-300 text-sm font-semibold mb-2">
                        Catégorie *
                      </label>
                      <select
                        value={newTicket.category}
                        onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                      >
                        <option value="">Sélectionner</option>
                        <option value="Technique">Technique</option>
                        <option value="Crédit">Crédit</option>
                        <option value="Score TERAS">Score TERAS</option>
                        <option value="Sécurité">Sécurité</option>
                        <option value="Compte">Compte</option>
                        <option value="Autre">Autre</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-300 text-sm font-semibold mb-2">
                        Priorité
                      </label>
                      <select
                        value={newTicket.priority}
                        onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value as any })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                      >
                        <option value="low">🟢 Basse</option>
                        <option value="medium">🟡 Moyenne</option>
                        <option value="high">🔴 Haute</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-300 text-sm font-semibold mb-2">
                      Description du problème * (minimum 20 caractères)
                    </label>
                    <textarea
                      value={newTicket.message}
                      onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
                      rows={6}
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                      placeholder="Décrivez votre problème en détail..."
                    />
                    <p className="text-gray-400 text-xs mt-1">
                      {newTicket.message.length}/20 caractères minimum
                    </p>
                  </div>

                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                    <p className="text-yellow-400 text-sm font-semibold mb-2">💡 Conseil</p>
                    <p className="text-gray-300 text-sm">
                      Plus votre description est détaillée, plus nous pourrons vous aider rapidement. 
                      Incluez des captures d'écran si possible et les étapes pour reproduire le problème.
                    </p>
                  </div>
                </div>

                <div className="flex space-x-4 mt-8">
                  <button
                    onClick={() => setShowNewTicketForm(false)}
                    className="flex-1 py-3 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-all"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={submitNewTicket}
                    disabled={loading || !newTicket.subject || !newTicket.category || newTicket.message.length < 20}
                    className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Création...' : 'Créer le Ticket'}
                  </button>
                </div>
              </div>
            )}

            {selectedTicket && !showNewTicketForm && (
              <div>
                <div className="flex items-center mb-6">
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="mr-4 text-gray-400 hover:text-white transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white">{selectedTicket.subject}</h2>
                    <p className="text-gray-400 text-sm">Ticket #{selectedTicket.id}</p>
                  </div>
                  <div className="flex space-x-2">
                    {getStatusBadge(selectedTicket.status)}
                    {getPriorityBadge(selectedTicket.priority)}
                  </div>
                </div>

                {/* Messages */}
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 mb-6">
                  <div className="space-y-6 mb-6 max-h-[500px] overflow-y-auto">
                    {selectedTicket.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] ${message.sender === 'user' ? 'order-2' : 'order-1'}`}>
                          <div className="flex items-center mb-2">
                            <span className={`text-sm font-semibold ${message.sender === 'user' ? 'text-cyan-400' : 'text-purple-400'}`}>
                              {message.senderName}
                            </span>
                            <span className="text-gray-500 text-xs ml-2">
                              {new Date(message.timestamp).toLocaleDateString('fr-FR')} à{' '}
                              {new Date(message.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div
                            className={`p-4 rounded-lg ${
                              message.sender === 'user'
                                ? 'bg-cyan-500 text-white'
                                : 'bg-white/10 text-gray-300'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-line">{message.content}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedTicket.status !== 'closed' && (
                    <div className="border-t border-white/10 pt-4">
                      <div className="flex space-x-2">
                        <textarea
                          value={ticketReply}
                          onChange={(e) => setTicketReply(e.target.value)}
                          rows={3}
                          placeholder="Écrivez votre réponse..."
                          className="flex-1 px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-cyan-500 resize-none"
                        />
                        <button
                          onClick={sendTicketReply}
                          disabled={!ticketReply.trim()}
                          className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Envoyer
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedTicket.status === 'closed' && (
                    <div className="border-t border-white/10 pt-4">
                      <div className="bg-gray-500/20 border border-gray-500/30 rounded-lg p-4 text-center">
                        <p className="text-gray-400">🔒 Ce ticket est fermé. Ouvrez un nouveau ticket pour nous recontacter.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default UserHelp;
