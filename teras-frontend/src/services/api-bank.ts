// src/services/api-bank.ts
// Couche API centralisée pour l'interface Banque TERAS
// Utilise authFetch du projet (clé: teras_access_token)

import { authFetch } from './authFetch';

const BASE = '/api/scoring/bank';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BankDashboardData {
  total_clients: number;
  clients_growth: number;
  active_loans: number;
  loans_growth: number;
  portfolio_value: number;
  portfolio_growth: number;
  avg_score: number;
  score_growth: number;
  recent_applications: LoanApplicationSummary[];
  top_products: TopProduct[];
  portfolio_health: PortfolioHealth;
}

export interface PortfolioHealth {
  on_time_rate: number;
  late_rate: number;
  collection_rate: number;
  avg_roi: number;
}

export interface TopProduct {
  name: string;
  volume: number;
  count: number;
  color?: string;
}

export interface ScoreBreakdown {
  T: number;
  E: number;
  R: number;
  A: number;
  S: number;
}

export interface BankClient {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  age: number;
  national_id: string;
  address: string;
  city: string;
  country: string;
  occupation: string;
  monthly_income: number;
  teras_score: number | null;
  teras_band: string;
  active_loans_count: number;
  total_borrowed: number;
  status: string;
  join_date: string;
  created_at: string;
  applications?: LoanApplicationSummary[];
  score_breakdown?: ScoreBreakdown;
  reason_codes?: string[];
  risk_level?: string;
  crm_limit?: number;
}

export interface LoanApplicationSummary {
  id: number;
  application_id: string;
  applicant_type: string;
  client_name: string | null;
  enterprise_name: string | null;
  product_name: string;
  requested_amount: number;
  duration_months: number;
  monthly_payment: number;
  teras_score_at_application: number | null;
  risk_level: string;
  status: string;
  created_at: string;
}

export interface LoanApplicationDetail extends LoanApplicationSummary {
  client: BankClient | null;
  purpose: string;
  total_repayment: number;
  rejection_reason: string;
  reviewed_at: string | null;
  reviewed_by_name: string | null;
}

export interface BankEnterprise {
  id: number;
  name: string;
  legal_name: string;
  registration_number: string;
  tax_id: string;
  enterprise_type: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  annual_revenue: number;
  employees_count: number;
  teras_score: number | null;
  teras_band: string;
  active_loans_count: number;
  total_borrowed: number;
  status: string;
  join_date: string;
  created_at: string;
}

export interface FinancialProduct {
  id: number;
  name: string;
  product_type: string;
  description: string;
  min_amount: number;
  max_amount: number;
  min_duration_months: number;
  max_duration_months: number;
  interest_rate: number;
  min_score_required: number;
  is_active: boolean;
}

export interface SimulatorResult {
  monthly_payment: number;
  total_repayment: number;
  total_interest: number;
  interest_rate: number;
  effort_rate: number;
  crm_limit: number;
  eligible: boolean;
  errors: string[];
  recommendations: string[];
  product_name: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ─── Helper erreur ────────────────────────────────────────────────────────────

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let msg = `Erreur ${res.status}`;
    try {
      const err = await res.json();
      msg = err.detail || err.error || msg;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export async function getBankDashboard(): Promise<BankDashboardData> {
  const res = await authFetch(`${BASE}/dashboard/`);
  return handleResponse<BankDashboardData>(res);
}

// ─── Clients ─────────────────────────────────────────────────────────────────

export async function getBankClients(params?: {
  search?: string;
  score_min?: number;
  score_max?: number;
  page?: number;
}): Promise<PaginatedResponse<BankClient>> {
  const q = new URLSearchParams();
  if (params?.search)    q.set('search',    params.search);
  if (params?.score_min != null) q.set('score_min', String(params.score_min));
  if (params?.score_max != null) q.set('score_max', String(params.score_max));
  if (params?.page)      q.set('page',      String(params.page));
  const res = await authFetch(`${BASE}/clients/?${q}`);
  return handleResponse<PaginatedResponse<BankClient>>(res);
}

export async function getBankClientDetail(id: string | number): Promise<BankClient> {
  const res = await authFetch(`${BASE}/clients/${id}/`);
  return handleResponse<BankClient>(res);
}

export async function createBankClient(data: Partial<BankClient>): Promise<BankClient> {
  const res = await authFetch(`${BASE}/clients/create/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return handleResponse<BankClient>(res);
}

export async function updateBankClient(id: number, data: Partial<BankClient>): Promise<BankClient> {
  const res = await authFetch(`${BASE}/clients/${id}/update/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return handleResponse<BankClient>(res);
}

// ─── Entreprises ─────────────────────────────────────────────────────────────

export async function getBankEnterprises(params?: {
  search?: string;
  page?: number;
}): Promise<PaginatedResponse<BankEnterprise>> {
  const q = new URLSearchParams();
  if (params?.search) q.set('search', params.search);
  if (params?.page)   q.set('page',   String(params.page));
  const res = await authFetch(`${BASE}/enterprises/?${q}`);
  return handleResponse<PaginatedResponse<BankEnterprise>>(res);
}

export async function getBankEnterpriseDetail(id: string | number): Promise<BankEnterprise> {
  const res = await authFetch(`${BASE}/enterprises/${id}/`);
  return handleResponse<BankEnterprise>(res);
}

export async function createBankEnterprise(data: Partial<BankEnterprise>): Promise<BankEnterprise> {
  const res = await authFetch(`${BASE}/enterprises/create/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return handleResponse<BankEnterprise>(res);
}

// ─── Demandes de crédit ───────────────────────────────────────────────────────

export async function getPendingApplications(): Promise<LoanApplicationSummary[]> {
  const res = await authFetch(`${BASE}/applications/pending/`);
  return handleResponse<LoanApplicationSummary[]>(res);
}

export async function getApprovedApplications(): Promise<LoanApplicationSummary[]> {
  const res = await authFetch(`${BASE}/applications/approved/`);
  return handleResponse<LoanApplicationSummary[]>(res);
}

export async function getRejectedApplications(): Promise<LoanApplicationSummary[]> {
  const res = await authFetch(`${BASE}/applications/rejected/`);
  return handleResponse<LoanApplicationSummary[]>(res);
}

export async function getApplicationDetail(id: string | number): Promise<LoanApplicationDetail> {
  const res = await authFetch(`${BASE}/applications/${id}/`);
  return handleResponse<LoanApplicationDetail>(res);
}

export async function reviewApplication(
  id: number,
  decision: { status: 'approved' | 'rejected'; rejection_reason?: string }
): Promise<LoanApplicationDetail> {
  const res = await authFetch(`${BASE}/applications/${id}/review/`, {
    method: 'POST',
    body: JSON.stringify(decision),
  });
  return handleResponse<LoanApplicationDetail>(res);
}

export async function submitApplication(data: {
  applicant_type: string;
  client?: number;
  enterprise?: number;
  product: number;
  requested_amount: number;
  duration_months: number;
  purpose: string;
}): Promise<LoanApplicationDetail> {
  const res = await authFetch(`${BASE}/applications/submit/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return handleResponse<LoanApplicationDetail>(res);
}

// ─── Produits ─────────────────────────────────────────────────────────────────

export async function getFinancialProducts(): Promise<FinancialProduct[]> {
  const res = await authFetch(`${BASE}/products/`);
  const data = await handleResponse<any>(res);
  return Array.isArray(data) ? data : (data.results ?? []);
}

// ─── Simulateur ──────────────────────────────────────────────────────────────

export async function simulateCredit(params: {
  amount: number;
  duration_months: number;
  product_id: number;
  score?: number;
  monthly_income?: number;
}): Promise<SimulatorResult> {
  const res = await authFetch(`${BASE}/simulator/`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
  return handleResponse<SimulatorResult>(res);
}

// ─── Helpers visuels ─────────────────────────────────────────────────────────

export function getBandColor(band: string): string {
  const colors: Record<string, string> = {
    'A+': 'emerald', A: 'green', B: 'blue', C: 'amber', D: 'orange', E: 'red',
  };
  return colors[band] ?? 'slate';
}

export function getRiskLevel(score: number): { level: string; label: string; color: string } {
  if (score >= 750) return { level: 'low',      label: 'Risque Faible',   color: 'green'  };
  if (score >= 600) return { level: 'medium',   label: 'Risque Modéré',   color: 'amber'  };
  if (score >= 450) return { level: 'high',     label: 'Risque Élevé',    color: 'orange' };
  return              { level: 'critical', label: 'Risque Critique', color: 'red'    };
}

export function formatCFA(amount: number): string {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' CFA';
}

export function formatMillions(amount: number): string {
  if (amount >= 1_000_000) return (amount / 1_000_000).toFixed(1) + 'M CFA';
  if (amount >= 1_000)     return (amount / 1_000).toFixed(0) + 'k CFA';
  return formatCFA(amount);
}

// ─── Reason codes → labels français ──────────────────────────────────────────

export const REASON_CODE_LABELS: Record<string, { label: string; direction: 'positive' | 'negative' }> = {
  T_FREQUENCY_HIGH:    { label: 'Fréquence de transactions élevée',         direction: 'positive' },
  T_FREQUENCY_LOW:     { label: 'Fréquence de transactions faible',          direction: 'negative' },
  T_RATIO_BALANCED:    { label: 'Ratio crédit/débit équilibré',              direction: 'positive' },
  T_RATIO_UNBALANCED:  { label: 'Ratio crédit/débit déséquilibré',           direction: 'negative' },
  T_REGULARITY_STRONG: { label: 'Transactions régulières et constantes',     direction: 'positive' },
  T_REGULARITY_WEAK:   { label: 'Transactions irrégulières',                 direction: 'negative' },
  E_STREAK_STRONG:     { label: 'Épargne mensuelle régulière',               direction: 'positive' },
  E_STREAK_WEAK:       { label: 'Épargne insuffisante ou irrégulière',       direction: 'negative' },
  E_SAVINGS_HIGH:      { label: "Niveau d'épargne élevé",                    direction: 'positive' },
  E_SAVINGS_LOW:       { label: "Niveau d'épargne faible",                   direction: 'negative' },
  R_INCOME_STABLE:     { label: 'Revenus stables et vérifiés',               direction: 'positive' },
  R_VARIANCE_HIGH:     { label: 'Revenus irréguliers (forte variance)',      direction: 'negative' },
  R_INCOME_VERIFIED:   { label: 'Revenus officiellement vérifiés',           direction: 'positive' },
  A_ASSET_HIGH:        { label: 'Patrimoine déclaré solide',                 direction: 'positive' },
  A_ASSET_LOW:         { label: 'Patrimoine déclaré insuffisant',            direction: 'negative' },
  A_ASSET_VERIFIED:    { label: 'Actifs vérifiés et documentés',             direction: 'positive' },
  S_REPUTATION_GOOD:   { label: 'Bonne réputation communautaire',            direction: 'positive' },
  S_NEGATIVE_EVENTS:   { label: 'Incidents négatifs récents',                direction: 'negative' },
  S_COMMUNITY_ACTIVE:  { label: 'Participation active (tontine/association)', direction: 'positive' },
};