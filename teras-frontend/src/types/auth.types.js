/**
 * Types pour le système d'authentification multi-rôles TERAS
 * @module types/auth.types
 */
export const ACCOUNT_TYPES_CONFIG = [
    {
        type: 'individual',
        label: 'Particulier',
        description: 'Pour les citoyens souhaitant gérer leur score TERAS personnel',
        icon: 'User',
        color: 'sky',
        gradient: 'from-sky-500 to-blue-600',
        features: [
            'Score TERAS personnel sur 1000',
            'Suivi des 5 piliers T.E.R.A.S',
            'Accès aux micro-crédits ZOLA',
            'Historique et recommandations IA'
        ],
        requires_approval: false
    },
    {
        type: 'enterprise',
        label: 'Entreprise',
        description: 'Pour les sociétés, marchands et organisations',
        icon: 'Building2',
        color: 'purple',
        gradient: 'from-purple-500 to-indigo-600',
        features: [
            'Score TERAS Entreprise',
            'Gestion de la conformité fiscale',
            'Suivi des employés',
            'Accès aux partenariats SFEC/ZOLA'
        ],
        requires_approval: true
    },
    {
        type: 'government',
        label: 'Opérateur Gouvernemental',
        description: 'Pour les institutions publiques et administrations',
        icon: 'Landmark',
        color: 'amber',
        gradient: 'from-amber-500 to-orange-600',
        features: [
            'Tableaux de bord régionaux',
            'Statistiques agrégées',
            'Suivi de conformité fiscale',
            'Rapports et exports'
        ],
        requires_approval: true
    },
    {
        type: 'partner',
        label: 'Partenaire Financier',
        description: 'Pour les banques, microfinance et partenaires ZOLA/SFEC',
        icon: 'Handshake',
        color: 'green',
        gradient: 'from-green-500 to-emerald-600',
        features: [
            'Accès API TERAS',
            'Consultation des scores',
            'Intégration systèmes',
            'Webhooks et notifications'
        ],
        requires_approval: true
    }
];
// ============================================================================
// LISTES DE RÉFÉRENCE
// ============================================================================
export const BUSINESS_SECTORS = [
    { value: 'retail', label: 'Commerce de détail' },
    { value: 'wholesale', label: 'Commerce de gros' },
    { value: 'services', label: 'Services' },
    { value: 'manufacturing', label: 'Industrie / Fabrication' },
    { value: 'agriculture', label: 'Agriculture' },
    { value: 'construction', label: 'BTP / Construction' },
    { value: 'transport', label: 'Transport / Logistique' },
    { value: 'hospitality', label: 'Hôtellerie / Restauration' },
    { value: 'health', label: 'Santé' },
    { value: 'education', label: 'Éducation' },
    { value: 'technology', label: 'Technologie / IT' },
    { value: 'finance', label: 'Finance / Assurance' },
    { value: 'ngo', label: 'ONG / Association' },
    { value: 'other', label: 'Autre' }
];
export const GOVERNMENT_INSTITUTIONS = [
    { value: 'ministry_finance', label: 'Ministère des Finances' },
    { value: 'ministry_economy', label: "Ministère de l'Économie" },
    { value: 'ministry_commerce', label: 'Ministère du Commerce' },
    { value: 'tax_authority', label: 'Direction Générale des Impôts' },
    { value: 'customs', label: 'Direction Générale des Douanes' },
    { value: 'central_bank', label: 'Banque Centrale' },
    { value: 'statistics', label: 'Institut National de Statistique' },
    { value: 'social_security', label: 'Sécurité Sociale' },
    { value: 'local_gov', label: 'Administration Locale' },
    { value: 'other', label: 'Autre Institution' }
];
export const PARTNER_TYPES = [
    { value: 'bank', label: 'Banque' },
    { value: 'microfinance', label: 'Microfinance' },
    { value: 'zola', label: 'Partenaire ZOLA' },
    { value: 'sfec', label: 'Partenaire SFEC' },
    { value: 'other', label: 'Autre' }
];
export const COUNTRIES = [
    { value: 'CG', label: 'Congo (Brazzaville)' },
    { value: 'CD', label: 'RD Congo (Kinshasa)' },
    { value: 'GA', label: 'Gabon' },
    { value: 'CM', label: 'Cameroun' },
    { value: 'CF', label: 'République Centrafricaine' },
    { value: 'TD', label: 'Tchad' },
    { value: 'GQ', label: 'Guinée Équatoriale' }
];
// ============================================================================
// HELPERS
// ============================================================================
/**
 * Vérifie si un utilisateur est de type individuel
 */
export function isIndividualUser(user) {
    return user.account_type === 'individual';
}
/**
 * Vérifie si un utilisateur est de type entreprise
 */
export function isEnterpriseUser(user) {
    return user.account_type === 'enterprise';
}
/**
 * Vérifie si un utilisateur est de type gouvernement
 */
export function isGovernmentUser(user) {
    return user.account_type === 'government';
}
/**
 * Vérifie si un utilisateur est de type partenaire
 */
export function isPartnerUser(user) {
    return user.account_type === 'partner';
}
/**
 * Vérifie si un utilisateur est admin
 */
export function isAdminUser(user) {
    return user.account_type === 'admin';
}
/**
 * Obtient le nom complet de l'utilisateur
 */
export function getUserFullName(user) {
    return `${user.first_name} ${user.last_name}`;
}
/**
 * Obtient le dashboard path selon le type d'utilisateur
 */
export function getDashboardPath(accountType) {
    switch (accountType) {
        case 'individual':
            return '/mon-espace';
        case 'enterprise':
            return '/enterprise/dashboard';
        case 'government':
            return '/gov/dashboard';
        case 'partner':
            return '/partner/dashboard';
        case 'admin':
            return '/admin/dashboard';
        default:
            return '/mon-espace';
    }
}
