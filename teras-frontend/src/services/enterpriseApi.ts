/**
 * Service API pour l'interface TERAS Entreprise
 * Version ENRICHIE - Fusion des endpoints existants + nouveaux
 * Gestion de tous les appels API pour les entreprises
 * ✅ BASE_URL corrigé : /api/scoring/enterprise
 */

import { authFetch } from '../utils/authFetch';

const BASE_URL = '/api/scoring/enterprise';  // ✅ CORRIGÉ (était /api/enterprise)

// ============================================
// TYPES TYPESCRIPT
// ============================================

export interface EnterpriseClient {
  id: number;
  name: string;
  client_type: 'individual' | 'sme' | 'enterprise';
  client_type_display: string;
  kyc_id: string;
  internal_ref?: string;
  teras_score: number;
  risk_level: 'low' | 'medium' | 'high';
  risk_level_display: string;
  status: 'active' | 'pending' | 'suspended' | 'archived';
  status_display: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  employee_id: string;
  position: string;
  department?: string;
  hire_date: string;
  employment_type: 'full_time' | 'part_time' | 'contract' | 'intern';
  employment_type_display: string;
  salary?: number;
  is_local: boolean;
  status: 'active' | 'on_leave' | 'terminated';
  status_display: string;
  termination_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EnterpriseDocument {
  id: number;
  category: 'tax' | 'financial' | 'payroll' | 'legal' | 'other';
  category_display: string;
  title: string;
  file: string;
  file_url: string;
  file_size: number;
  period?: string;
  period_start?: string;
  period_end?: string;
  status: 'pending' | 'processing' | 'processed' | 'failed';
  status_display: string;
  analysis_summary?: string;
  validation_notes?: string;
  uploaded_at: string;
  processed_at?: string;
}

export interface ComplianceStatus {
  id: number;
  compliance_rate: number;
  compliance_grade: 'A' | 'B' | 'C' | 'D' | 'E';
  last_tax_filing?: string;
  missing_declarations: string[];
  late_payments: number;
  penalties: number;
  active_alerts: string[];
  alerts_count: number;
  recommendations: string[];
  recommendations_count: number;
  last_audit_date?: string;
  next_audit_date?: string;
  updated_at: string;
}

export interface EnterpriseReport {
  id: number;
  report_type: 'quarterly' | 'annual' | 'sector_comparison' | 'custom';
  report_type_display: string;
  title: string;
  period_start: string;
  period_end: string;
  period_label: string;
  file?: string;
  file_url?: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  status_display: string;
  generated_at?: string;
  downloaded_count: number;
}

export interface EnterpriseDashboard {
  current_score: number;
  score_trend: 'up' | 'down' | 'stable';
  score_change: number;
  breakdown: {
    T: number;
    E: number;
    R: number;
    A: number;
    S: number;
  };
  total_clients: number;
  active_clients: number;
  total_employees: number;
  local_employees: number;
  compliance_rate: number;
  score_history: Array<{
    id: number;
    score: number;
    score_label: string;
    computed_at: string;
  }>;
  sector_comparison: {
    your_score: number;
    sector_average: number;
    percentile: number;
  };
  active_alerts: string[];
  recommendations: string[];
  document_intelligence?: {
    documents_total: number;
    documents_analyzed: number;
    documents_applied: number;
    categories: string[];
    completeness_ratio: number;
    avg_monthly_revenue_xaf: number;
    avg_monthly_cashflow_xaf: number;
    avg_authenticity: number;
    assets_documented_total_xaf?: number;
    assets_verified_count?: number;
    invoice_amount_total_xaf?: number;
    invoices_analyzed_count?: number;
    collateral_value_xaf?: number;
    collateral_strength?: string;
    asset_proof_types?: string[];
    dossier_quality: string;
    latest_processed_at?: string | null;
    latest_summary?: any;
    alerts?: string[];
  };
}

export interface SectorAnalytics {
  sector: string;
  your_score: number;
  sector_average: number;
  percentile: number;
  ranking: number;
  total_companies: number;
  distribution: Record<string, number>;
  top_performers: Array<{ name: string; score: number }>;
  sector_recommendations: string[];
}

export interface Transaction {
  id: number;
  date: string;
  type: 'credit' | 'debit';
  category: string;
  description: string;
  amount: number;
  balance: number;
  reference: string;
  status: 'completed' | 'pending' | 'failed';
}

export interface SupportTicket {
  id: string;
  subject: string;
  category: 'technique' | 'facturation' | 'score' | 'documents' | 'autre';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_user' | 'resolved' | 'closed';
  created_at: string;
  updated_at: string;
  messages: TicketMessage[];
  attachments: TicketAttachment[];
  assigned_to?: string;
}

export interface TicketMessage {
  id: string;
  sender: 'user' | 'admin';
  sender_name: string;
  message: string;
  created_at: string;
}

export interface TicketAttachment {
  id: number;
  filename: string;
  file_size: number;
  uploaded_at: string;
}

export interface Notification {
  id: number;
  type: 'info' | 'success' | 'warning' | 'alert';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  category: 'score' | 'document' | 'employee' | 'compliance' | 'system';
}

// ============================================
// HELPER — parse réponse robuste
// ============================================

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`HTTP ${response.status}: ${text.slice(0, 200)}`);
  }
  return response.json();
}

// ============================================
// API CLASS
// ============================================

class EnterpriseAPI {

  // ==================== DASHBOARD ====================

  async getDashboard(): Promise<EnterpriseDashboard> {
    const r = await authFetch(`${BASE_URL}/dashboard/`);
    const data = await parseResponse<any>(r);
    // Le backend retourne {success, score, kpis, ...} — on normalise
    if (data.score) {
      return {
        current_score: data.score.current,
        score_trend: data.score.trend || 'stable',
        score_change: data.score.change_month || 0,
        breakdown: {
          T: data.score.breakdown?.T?.score || 0,
          E: data.score.breakdown?.E?.score || 0,
          R: data.score.breakdown?.R?.score || 0,
          A: data.score.breakdown?.A?.score || 0,
          S: data.score.breakdown?.S?.score || 0,
        },
        total_clients: data.kpis?.clients_total || 0,
        active_clients: data.kpis?.clients_active || 0,
        total_employees: data.kpis?.employees_total || 0,
        local_employees: data.kpis?.employees_local || 0,
        compliance_rate: data.kpis?.compliance_rate || 0,
        score_history: data.score_history || [],
        sector_comparison: {
          your_score: data.score.current || 0,
          sector_average: data.score.sector_average || 695,
          percentile: data.score.percentile || 50,
        },
        active_alerts: data.alerts || [],
        recommendations: (data.recommendations || []).map((r: any) => r.action || r),
        document_intelligence: data.document_intelligence,
      };
    }
    return data;
  }

  // ==================== CLIENTS ====================

  async getClients(): Promise<EnterpriseClient[]> {
    const r = await authFetch(`${BASE_URL}/clients/`);
    const data = await parseResponse<any>(r);
    return data.clients || data;
  }

  async getClient(id: number): Promise<EnterpriseClient> {
    const r = await authFetch(`${BASE_URL}/clients/${id}/`);
    const data = await parseResponse<any>(r);
    return data.client || data;
  }

  async createClient(data: {
    name: string;
    client_type: string;
    kyc_id: string;
    internal_ref?: string;
    notes?: string;
  }): Promise<EnterpriseClient> {
    const r = await authFetch(`${BASE_URL}/clients/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const resp = await parseResponse<any>(r);
    return resp.client || resp;
  }

  async updateClient(id: number, data: Partial<EnterpriseClient>): Promise<EnterpriseClient> {
    const r = await authFetch(`${BASE_URL}/clients/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    const resp = await parseResponse<any>(r);
    return resp.client || resp;
  }

  async deleteClient(id: number): Promise<void> {
    await authFetch(`${BASE_URL}/clients/${id}/`, { method: 'DELETE' });
  }

  // ==================== EMPLOYEES ====================

  async getEmployees(): Promise<Employee[]> {
    const r = await authFetch(`${BASE_URL}/employees/`);
    const data = await parseResponse<any>(r);
    return data.employees || data;
  }

  async getEmployee(id: number): Promise<Employee> {
    const r = await authFetch(`${BASE_URL}/employees/${id}/`);
    const data = await parseResponse<any>(r);
    return data.employee || data;
  }

  async createEmployee(data: {
    first_name: string;
    last_name: string;
    employee_id: string;
    position: string;
    department?: string;
    hire_date: string;
    employment_type: string;
    salary?: number;
    is_local?: boolean;
  }): Promise<Employee> {
    const r = await authFetch(`${BASE_URL}/employees/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const resp = await parseResponse<any>(r);
    return resp.employee || resp;
  }

  async updateEmployee(id: number, data: Partial<Employee>): Promise<Employee> {
    const r = await authFetch(`${BASE_URL}/employees/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    const resp = await parseResponse<any>(r);
    return resp.employee || resp;
  }

  async deleteEmployee(id: number): Promise<void> {
    await authFetch(`${BASE_URL}/employees/${id}/`, { method: 'DELETE' });
  }

  // ==================== DOCUMENTS ====================

  async getDocuments(): Promise<EnterpriseDocument[]> {
    const r = await authFetch(`${BASE_URL}/documents/`);
    const data = await parseResponse<any>(r);
    return data.documents || data;
  }

  async uploadDocument(formData: FormData): Promise<EnterpriseDocument> {
    const r = await authFetch(`${BASE_URL}/documents/upload/`, {
      method: 'POST',
      body: formData,
    });
    const resp = await parseResponse<any>(r);
    return resp.document || resp;
  }

  async deleteDocument(id: number): Promise<void> {
    await authFetch(`${BASE_URL}/documents/${id}/`, { method: 'DELETE' });
  }

  async downloadDocument(id: number): Promise<Blob> {
    const r = await authFetch(`${BASE_URL}/documents/${id}/download/`);
    return r.blob();
  }

  // ==================== COMPLIANCE ====================

  async getCompliance(): Promise<ComplianceStatus> {
    const r = await authFetch(`${BASE_URL}/compliance/`);
    const data = await parseResponse<any>(r);
    return data.compliance || data;
  }

  // ==================== REPORTS ====================

  async getReports(): Promise<EnterpriseReport[]> {
    const r = await authFetch(`${BASE_URL}/reports/`);
    const data = await parseResponse<any>(r);
    return data.reports || data;
  }

  async generateReport(data: {
    report_type: string;
    period_start: string;
    period_end: string;
    format?: 'pdf' | 'excel';
  }): Promise<EnterpriseReport> {
    const r = await authFetch(`${BASE_URL}/reports/generate/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const resp = await parseResponse<any>(r);
    return resp.report || resp;
  }

  async downloadReport(id: number): Promise<Blob> {
    const r = await authFetch(`${BASE_URL}/reports/${id}/download/`);
    return r.blob();
  }

  // ==================== ANALYTICS ====================

  async getSectorAnalytics(): Promise<SectorAnalytics> {
    const r = await authFetch(`${BASE_URL}/analytics/sector/`);
    const data = await parseResponse<any>(r);
    return data.analytics || data;
  }

  async getTrends(): Promise<any> {
    const r = await authFetch(`${BASE_URL}/analytics/trends/`);
    const data = await parseResponse<any>(r);
    return data.trends || data;
  }

  // ==================== TRANSACTIONS ====================

  async getTransactions(params?: {
    start_date?: string;
    end_date?: string;
    type?: 'credit' | 'debit';
    category?: string;
  }): Promise<Transaction[]> {
    const q = new URLSearchParams();
    if (params?.start_date) q.append('start_date', params.start_date);
    if (params?.end_date)   q.append('end_date', params.end_date);
    if (params?.type)       q.append('type', params.type);
    if (params?.category)   q.append('category', params.category);
    const r = await authFetch(`${BASE_URL}/transactions/${q.toString() ? `?${q}` : ''}`);
    return parseResponse<Transaction[]>(r);
  }

  async exportTransactions(params: {
    start_date: string;
    end_date: string;
    format: 'csv' | 'excel';
  }): Promise<{ download_url: string }> {
    const r = await authFetch(`${BASE_URL}/transactions/export/`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
    return parseResponse<{ download_url: string }>(r);
  }

  // ==================== SUPPORT ====================

  async getTickets(): Promise<SupportTicket[]> {
    const r = await authFetch(`${BASE_URL}/support/`);
    return parseResponse<SupportTicket[]>(r);
  }

  async getTicket(id: string): Promise<SupportTicket> {
    const r = await authFetch(`${BASE_URL}/support/${id}/`);
    return parseResponse<SupportTicket>(r);
  }

  async createTicket(formData: FormData): Promise<SupportTicket> {
    const r = await authFetch(`${BASE_URL}/support/`, {
      method: 'POST',
      body: formData,
    });
    return parseResponse<SupportTicket>(r);
  }

  async replyTicket(id: string, message: string): Promise<TicketMessage> {
    const r = await authFetch(`${BASE_URL}/support/${id}/reply/`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
    return parseResponse<TicketMessage>(r);
  }

  async closeTicket(id: string): Promise<void> {
    await authFetch(`${BASE_URL}/support/${id}/close/`, { method: 'POST' });
  }

  // ==================== NOTIFICATIONS ====================

  async getNotifications(): Promise<Notification[]> {
    const r = await authFetch(`${BASE_URL}/notifications/`);
    return parseResponse<Notification[]>(r);
  }

  async markAsRead(id: number): Promise<void> {
    await authFetch(`${BASE_URL}/notifications/${id}/read/`, { method: 'POST' });
  }

  async markAllAsRead(): Promise<void> {
    await authFetch(`${BASE_URL}/notifications/read-all/`, { method: 'POST' });
  }

  async deleteNotification(id: number): Promise<void> {
    await authFetch(`${BASE_URL}/notifications/${id}/`, { method: 'DELETE' });
  }

  // ==================== AI ASSISTANT ====================

  async sendChatMessage(message: string, context?: any): Promise<{ response: string; suggestions?: string[] }> {
    const r = await authFetch(`${BASE_URL}/ai/chat/`, {
      method: 'POST',
      body: JSON.stringify({ message, context }),
    });
    return parseResponse<{ response: string; suggestions?: string[] }>(r);
  }

  // ==================== SETTINGS ====================

  async getSettings(): Promise<any> {
    const r = await authFetch(`${BASE_URL}/settings/`);
    return parseResponse<any>(r);
  }

  async updateSettings(data: any): Promise<any> {
    const r = await authFetch(`${BASE_URL}/settings/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return parseResponse<any>(r);
  }
}

// Export singleton
export const enterpriseApi = new EnterpriseAPI();
export default enterpriseApi;
