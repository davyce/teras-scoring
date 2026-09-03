/**
 * Types TypeScript partagés - TERAS IA APP
 * @module types
 * @version 2.0.0
 */

// ============================================================================
// USER & AUTHENTICATION
// ============================================================================

export type UserRole = "user" | "admin" | "analyst" | "partner" | "enterprise" | "government";

export type KYCStatus = "pending" | "verified" | "rejected" | "expired";

export type UserLevel = "bronze" | "silver" | "gold" | "platinum" | "diamond";

export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  phone?: string;
  country?: string;
  city?: string;
  address?: string;
  date_of_birth?: string;
  avatar_url?: string;
  level: UserLevel;
  kyc_status: KYCStatus;
  is_verified: boolean;
  profile_completion: number;
  created_at: string;
  updated_at?: string;
  last_login?: string;
}

export interface AuthState {
  access: string | null;
  refresh: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  confirm_password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  country?: string;
  role?: UserRole;
  organization_id?: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  new_password: string;
  confirm_password: string;
}

// ============================================================================
// SCORE TERAS
// ============================================================================

export type ProfileType = "basic" | "entreprise" | "regional" | "government";

export type ScoreSource = "manual" | "zola" | "zone" | "sfec" | "api" | "document";

export type ScoreBand = "A" | "B" | "C" | "D" | "E";

export interface ScoreBreakdown {
  T: number; // Transactions (0-100)
  E: number; // Épargne (0-100)
  R: number; // Revenus (0-100)
  A: number; // Actifs (0-100)
  S: number; // Social (0-100)
}

export interface Score {
  id: string;
  user_id: string;
  score: number; // 0-1000
  band: ScoreBand;
  profile_type: ProfileType;
  breakdown: ScoreBreakdown;
  previous_score?: number;
  change?: number;
  reason_codes: string[];
  raw_data: Record<string, any>;
  source: ScoreSource;
  confidence: number;
  model_version: string;
  computed_at: string;
  expires_at?: string;
  created_at: string;
}

export interface ScoreHistory {
  date: string;
  score: number;
  band: ScoreBand;
  change?: number;
}

export interface ScoreRequest {
  profile_type: ProfileType;
  signals: ScoreSignals;
  consent_id: string;
  explain?: boolean;
}

export interface ScoreSignals {
  transactions?: Transaction[];
  income?: IncomeData;
  savings?: SavingsData;
  assets?: Asset[];
  social?: SocialData;
}

// ============================================================================
// TERAS BASIC (Individus)
// ============================================================================

export interface Transaction {
  id?: string;
  date: string;
  amount: number;
  currency: string;
  type: "credit" | "debit";
  channel: string;
  description?: string;
  category?: string;
  mcc?: string;
  balance?: number;
}

export interface IncomeData {
  monthly_avg: number;
  verified: boolean;
  sources: IncomeSource[];
  variance?: number;
  trend?: "up" | "down" | "stable";
}

export interface IncomeSource {
  type: "salary" | "business" | "rental" | "investment" | "other";
  amount: number;
  frequency: "monthly" | "weekly" | "annual" | "irregular";
  verified: boolean;
}

export interface SavingsData {
  monthly_deposit_avg: number;
  streak_months: number;
  total_balance: number;
  volatility?: number;
}

export interface Asset {
  id?: string;
  kind: "real_estate" | "vehicle" | "equipment" | "investment" | "crypto" | "other";
  declared_value: number;
  currency: string;
  verified: boolean;
  risk_coefficient?: number;
}

export interface SocialData {
  rating_avg: number;
  reviews_count: number;
  negative_incidents_12m: number;
  community_score?: number;
  references?: Reference[];
}

export interface Reference {
  type: "employer" | "landlord" | "business_partner" | "community";
  rating: number;
  verified: boolean;
}

// ============================================================================
// TERAS ENTREPRISE
// ============================================================================

export interface Enterprise {
  id: string;
  tax_id: string;
  legal_name: string;
  trade_name?: string;
  sector: string;
  employees_count: number;
  founded_date?: string;
  address: string;
  city: string;
  country: string;
  owner_id: string;
  teras_score?: number;
  teras_band?: ScoreBand;
  status: "active" | "inactive" | "suspended";
  created_at: string;
}

export interface EnterpriseScoreRequest {
  partner_ref: string;
  company: {
    tax_id: string;
    legal_name: string;
    employees: number;
    sector: string;
  };
  signals: EnterpriseSignals;
}

export interface EnterpriseSignals {
  tax_filings?: TaxFilings;
  invoices?: InvoicesData;
  retention?: RetentionData;
  activity?: ActivityData;
  social_stability?: SocialStabilityData;
}

export interface TaxFilings {
  declared_months_12m: number;
  late_filings: number;
  corrections: number;
  compliance_rate: number;
}

export interface InvoicesData {
  count_12m: number;
  total_12m: number;
  currency: string;
  avg_value: number;
}

export interface RetentionData {
  repeat_buyers_rate: number;
  customer_churn_rate: number;
  nps_score?: number;
  avg_customer_lifetime: number;
}

export interface ActivityData {
  revenue_12m: number;
  revenue_trend_12m: "up" | "down" | "stable";
  seasonality_index: number;
  client_diversity: number;
}

export interface SocialStabilityData {
  open_litigations: number;
  avg_payment_delay_days: number;
  employee_turnover_rate: number;
  sanctions_count: number;
}

// ============================================================================
// TERAS GOVERNMENT (Organismes Gouvernementaux)
// ============================================================================

export type GovernmentAgencyType =
  | "ministry"
  | "tax_authority"
  | "central_bank"
  | "statistics_office"
  | "regulatory_body"
  | "local_government"
  | "social_security"
  | "customs"
  | "other";

export interface GovernmentAgency {
  id: string;
  name: string;
  code: string;
  type: GovernmentAgencyType;
  country: string;
  region?: string;
  parent_agency_id?: string;
  contact_email: string;
  admin_users: string[];
  permissions: GovernmentPermission[];
  api_quota: number;
  api_usage: number;
  status: "active" | "inactive" | "pending_approval";
  created_at: string;
}

export type GovernmentPermission =
  | "view_individual_scores"
  | "view_enterprise_scores"
  | "view_aggregated_data"
  | "view_regional_statistics"
  | "export_reports"
  | "access_raw_data"
  | "manage_policies"
  | "audit_access";

export interface RegionalStatistics {
  region: string;
  period: string;
  total_users: number;
  total_enterprises: number;
  avg_individual_score: number;
  avg_enterprise_score: number;
  score_distribution: ScoreDistribution;
  economic_indicators: EconomicIndicators;
  trends: TrendData[];
}

export interface ScoreDistribution {
  band_A: number;
  band_B: number;
  band_C: number;
  band_D: number;
  band_E: number;
}

export interface EconomicIndicators {
  formal_employment_rate: number;
  banking_inclusion_rate: number;
  tax_compliance_rate: number;
  credit_access_rate: number;
  default_rate: number;
  avg_transaction_volume: number;
}

export interface TrendData {
  date: string;
  metric: string;
  value: number;
  change_percent: number;
}

export interface GovernmentReport {
  id: string;
  agency_id: string;
  report_type: GovernmentReportType;
  title: string;
  period_start: string;
  period_end: string;
  regions: string[];
  data: Record<string, any>;
  generated_at: string;
  generated_by: string;
  format: "pdf" | "excel" | "json";
  file_url?: string;
}

export type GovernmentReportType =
  | "economic_health"
  | "tax_compliance"
  | "credit_risk"
  | "regional_comparison"
  | "sector_analysis"
  | "fraud_detection"
  | "inclusion_metrics";

export interface PolicyConfig {
  id: string;
  agency_id: string;
  name: string;
  description: string;
  rules: PolicyRule[];
  effective_date: string;
  expires_at?: string;
  status: "draft" | "active" | "expired";
  created_by: string;
}

export interface PolicyRule {
  condition: string;
  action: string;
  parameters: Record<string, any>;
}

// ============================================================================
// DOCUMENTS
// ============================================================================

export type DocumentType = "pdf" | "excel" | "image" | "ofx" | "csv" | "other";

export type DocumentStatus = "uploaded" | "processing" | "parsed" | "failed" | "expired";

export type DocumentCategory =
  | "bank_statement"
  | "invoice"
  | "salary_slip"
  | "tax_return"
  | "id_document"
  | "proof_of_address"
  | "business_registration"
  | "other";

export interface Document {
  id: string;
  user_id: string;
  name: string;
  type: DocumentType;
  category: DocumentCategory;
  size: number;
  mime_type: string;
  status: DocumentStatus;
  confidence?: number;
  uploaded_at: string;
  processed_at?: string;
  expires_at?: string;
  tags: string[];
  parsed_data?: ParsedDocumentData;
  error_message?: string;
}

export interface ParsedDocumentData {
  rows?: number;
  period?: {
    from: string;
    to: string;
  };
  account?: {
    iban?: string;
    currency: string;
  };
  transactions?: Transaction[];
  summary?: Record<string, any>;
}

export interface DocumentUploadRequest {
  file: File;
  category: DocumentCategory;
  consent_id: string;
  parsing_profile?: "auto" | "bank" | "invoices";
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

export type NotificationType =
  | "score_change"
  | "document_processed"
  | "document_failed"
  | "kyc_update"
  | "security_alert"
  | "achievement"
  | "reminder"
  | "system"
  | "partner_offer";

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  read_at?: string;
  created_at: string;
  expires_at?: string;
  action_url?: string;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
}

export interface NotificationSettings {
  score_changes: NotificationPreferences;
  documents: NotificationPreferences;
  security: NotificationPreferences;
  reminders: NotificationPreferences;
  partner_offers: NotificationPreferences;
}

// ============================================================================
// CONSENT & COMPLIANCE
// ============================================================================

export interface Consent {
  id: string;
  user_id: string;
  scope: string[];
  purpose: string;
  allowed_targets: string[];
  granted_at: string;
  expires_at?: string;
  revoked_at?: string;
  status: "active" | "expired" | "revoked";
}

export interface AuditLog {
  id: string;
  user_id?: string;
  agency_id?: string;
  action: string;
  resource_type: string;
  resource_id: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

// ============================================================================
// API RESPONSES
// ============================================================================

export interface ApiError {
  code: string;
  detail?: string;
  message?: string;
  errors?: Record<string, string[]>;
  timestamp?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    page?: number;
    per_page?: number;
    total?: number;
    total_pages?: number;
  };
}

export interface PaginatedResponse<T> {
  results: T[];
  count: number;
  next?: string;
  previous?: string;
}

// ============================================================================
// WEBHOOKS
// ============================================================================

export type WebhookEvent =
  | "score.computed"
  | "score.updated"
  | "document.parsed"
  | "document.failed"
  | "user.verified"
  | "enterprise.created"
  | "anomaly.detected";

export interface WebhookConfig {
  id: string;
  partner_id: string;
  url: string;
  events: WebhookEvent[];
  secret: string;
  active: boolean;
  created_at: string;
}

export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: Record<string, any>;
  signature: string;
}

// ============================================================================
// UI STATE
// ============================================================================

export type ViewMode = "grid" | "list";

export type Theme = "light" | "dark" | "system";

export interface UIState {
  theme: Theme;
  sidebarCollapsed: boolean;
  language: string;
  notifications_enabled: boolean;
}

export interface FilterOptions {
  search?: string;
  status?: string;
  category?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

// ============================================================================
// DASHBOARD WIDGETS
// ============================================================================

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  config?: Record<string, any>;
  visible: boolean;
}

export type WidgetType =
  | "score_gauge"
  | "score_history"
  | "pillars_breakdown"
  | "notifications"
  | "recent_activity"
  | "documents_summary"
  | "quick_actions"
  | "regional_map"
  | "statistics_chart"
  | "compliance_meter";

// ============================================================================
// PARTNERS & INTEGRATIONS
// ============================================================================

export type PartnerType = "bank" | "microfinance" | "fintech" | "employer" | "merchant" | "government";

export interface Partner {
  id: string;
  name: string;
  type: PartnerType;
  logo_url?: string;
  api_key_prefix: string;
  allowed_scopes: string[];
  webhook_url?: string;
  status: "active" | "inactive" | "pending";
  created_at: string;
}

export interface Integration {
  id: string;
  user_id: string;
  partner_id: string;
  partner_name: string;
  connected_at: string;
  last_sync?: string;
  status: "connected" | "disconnected" | "error";
  permissions: string[];
}