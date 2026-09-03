/**
 * Types pour le système d'authentification multi-rôles TERAS
 * @module types/auth.types
 */

// ============================================================================
// TYPES DE BASE
// ============================================================================

// Types de comptes disponibles
export type AccountType = 'individual' | 'enterprise' | 'government' | 'partner' | 'admin';

// Statuts KYC
export type KYCStatus = 'pending' | 'verified' | 'rejected' | 'not_started';

// Niveaux TERAS
export type TerasLevel = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

// Bandes de score
export type ScoreBand = 'A' | 'B' | 'C' | 'D' | 'E';

// ============================================================================
// INTERFACES UTILISATEURS
// ============================================================================

// Interface de base pour tous les utilisateurs
export interface BaseUser {
  id: number | string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  account_type: AccountType;
  role?: string;
  user_type?: string;
  created_at: string;
  updated_at?: string;
  is_active: boolean;
  is_verified: boolean;
  kyc_status: KYCStatus;
  avatar_url?: string;
}

// Utilisateur Individuel (TERAS Basic)
export interface IndividualUser extends BaseUser {
  account_type: 'individual';
  date_of_birth?: string;
  address?: string;
  city?: string;
  country: string;
  national_id?: string;
  teras_score?: number;
  teras_level?: TerasLevel;
  profile_completion: number;
}

// Utilisateur Entreprise (TERAS Entreprise)
export interface EnterpriseUser extends BaseUser {
  account_type: 'enterprise';
  company_name: string;
  legal_name: string;
  tax_id: string;
  sector: string;
  employee_count?: number;
  address?: string;
  city?: string;
  country: string;
  legal_representative: {
    first_name: string;
    last_name: string;
    position: string;
    email: string;
    phone?: string;
  };
  teras_enterprise_score?: number;
  teras_level?: TerasLevel;
  profile_completion: number;
}

// Opérateur Gouvernemental
export interface GovernmentUser extends BaseUser {
  account_type: 'government';
  institution: string;
  institution_code?: string;
  department?: string;
  position: string;
  employee_id: string;
  country: string;
  region?: string;
  access_level: 'viewer' | 'analyst' | 'supervisor' | 'admin';
  permissions: GovernmentPermission[];
}

// Partenaire Financier (Banques, ZOLA, SFEC)
export interface PartnerUser extends BaseUser {
  account_type: 'partner';
  partner_type: 'bank' | 'microfinance' | 'zola' | 'sfec' | 'other';
  organization_name: string;
  license_number?: string;
  contact_person: {
    first_name: string;
    last_name: string;
    position: string;
    email: string;
    phone?: string;
  };
  country: string;
  api_access: boolean;
  api_key?: string;
  allowed_scopes: APIScope[];
}

// Administrateur TERAS
export interface AdminUser extends BaseUser {
  account_type: 'admin';
  admin_role: 'super_admin' | 'admin' | 'support';
  permissions: AdminPermission[];
}

// Type union pour tous les utilisateurs
export type User = IndividualUser | EnterpriseUser | GovernmentUser | PartnerUser | AdminUser;

// ============================================================================
// PERMISSIONS
// ============================================================================

// Permissions Gouvernementales
export type GovernmentPermission =
  | 'view_individual_scores'
  | 'view_enterprise_scores'
  | 'view_aggregated_stats'
  | 'view_tax_compliance'
  | 'export_reports'
  | 'manage_alerts'
  | 'view_regional_data'
  | 'view_national_data';

// Scopes API pour les partenaires
export type APIScope =
  | 'score.read'
  | 'score.write'
  | 'ingest.write'
  | 'admin.partner';

// Permissions Admin
export type AdminPermission =
  | 'manage_users'
  | 'manage_enterprises'
  | 'manage_government'
  | 'manage_partners'
  | 'manage_system'
  | 'view_all_data'
  | 'manage_scoring_models';

// ============================================================================
// DONNÉES D'INSCRIPTION
// ============================================================================

export interface IndividualRegisterData {
  account_type: 'individual';
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  password: string;
  country: string;
  accept_terms: boolean;
}

export interface EnterpriseRegisterData {
  account_type: 'enterprise';
  company_name: string;
  legal_name: string;
  tax_id: string;
  sector: string;
  country: string;
  representative_first_name: string;
  representative_last_name: string;
  representative_position: string;
  email: string;
  phone?: string;
  password: string;
  accept_terms: boolean;
}

export interface GovernmentRegisterData {
  account_type: 'government';
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  institution: string;
  department?: string;
  position: string;
  employee_id: string;
  country: string;
  password: string;
  accept_terms: boolean;
}

export interface PartnerRegisterData {
  account_type: 'partner';
  partner_type: 'bank' | 'microfinance' | 'zola' | 'sfec' | 'other';
  organization_name: string;
  license_number?: string;
  contact_first_name: string;
  contact_last_name: string;
  contact_position: string;
  email: string;
  phone?: string;
  country: string;
  password: string;
  accept_terms: boolean;
}

export type RegisterData =
  | IndividualRegisterData
  | EnterpriseRegisterData
  | GovernmentRegisterData
  | PartnerRegisterData;

// ============================================================================
// RÉPONSES API
// ============================================================================

export interface AuthTokens {
  access: string;
  refresh?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  tokens?: AuthTokens;
  message?: string;
  errors?: Record<string, string | string[]>;
  requires_approval?: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  remember_me?: boolean;
}

// ============================================================================
// CONFIGURATION UI
// ============================================================================

export interface AccountTypeConfig {
  type: AccountType;
  label: string;
  description: string;
  icon: string;
  color: string;
  gradient: string;
  features: string[];
  requires_approval: boolean;
}

export const ACCOUNT_TYPES_CONFIG: AccountTypeConfig[] = [
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
export function isIndividualUser(user: User): user is IndividualUser {
  return user.account_type === 'individual';
}

/**
 * Vérifie si un utilisateur est de type entreprise
 */
export function isEnterpriseUser(user: User): user is EnterpriseUser {
  return user.account_type === 'enterprise';
}

/**
 * Vérifie si un utilisateur est de type gouvernement
 */
export function isGovernmentUser(user: User): user is GovernmentUser {
  return user.account_type === 'government';
}

/**
 * Vérifie si un utilisateur est de type partenaire
 */
export function isPartnerUser(user: User): user is PartnerUser {
  return user.account_type === 'partner';
}

/**
 * Vérifie si un utilisateur est admin
 */
export function isAdminUser(user: User): user is AdminUser {
  return user.account_type === 'admin';
}

/**
 * Obtient le nom complet de l'utilisateur
 */
export function getUserFullName(user: User): string {
  return `${user.first_name} ${user.last_name}`;
}

/**
 * Obtient le dashboard path selon le type d'utilisateur
 */
export function getDashboardPath(accountType: AccountType): string {
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
