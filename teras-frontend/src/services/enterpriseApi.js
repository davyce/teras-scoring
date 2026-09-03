/**
 * Service API pour l'interface TERAS Entreprise
 * Version ENRICHIE - Fusion des endpoints existants + nouveaux
 * Gestion de tous les appels API pour les entreprises
 * ✅ BASE_URL corrigé : /api/scoring/enterprise
 */
import { authFetch } from '../utils/authFetch';
const BASE_URL = '/api/scoring/enterprise'; // ✅ CORRIGÉ (était /api/enterprise)
// ============================================
// HELPER — parse réponse robuste
// ============================================
async function parseResponse(response) {
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
    async getDashboard() {
        const r = await authFetch(`${BASE_URL}/dashboard/`);
        const data = await parseResponse(r);
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
                recommendations: (data.recommendations || []).map((r) => r.action || r),
                document_intelligence: data.document_intelligence,
            };
        }
        return data;
    }
    // ==================== CLIENTS ====================
    async getClients() {
        const r = await authFetch(`${BASE_URL}/clients/`);
        const data = await parseResponse(r);
        return data.clients || data;
    }
    async getClient(id) {
        const r = await authFetch(`${BASE_URL}/clients/${id}/`);
        const data = await parseResponse(r);
        return data.client || data;
    }
    async createClient(data) {
        const r = await authFetch(`${BASE_URL}/clients/`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
        const resp = await parseResponse(r);
        return resp.client || resp;
    }
    async updateClient(id, data) {
        const r = await authFetch(`${BASE_URL}/clients/${id}/`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
        const resp = await parseResponse(r);
        return resp.client || resp;
    }
    async deleteClient(id) {
        await authFetch(`${BASE_URL}/clients/${id}/`, { method: 'DELETE' });
    }
    // ==================== EMPLOYEES ====================
    async getEmployees() {
        const r = await authFetch(`${BASE_URL}/employees/`);
        const data = await parseResponse(r);
        return data.employees || data;
    }
    async getEmployee(id) {
        const r = await authFetch(`${BASE_URL}/employees/${id}/`);
        const data = await parseResponse(r);
        return data.employee || data;
    }
    async createEmployee(data) {
        const r = await authFetch(`${BASE_URL}/employees/`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
        const resp = await parseResponse(r);
        return resp.employee || resp;
    }
    async updateEmployee(id, data) {
        const r = await authFetch(`${BASE_URL}/employees/${id}/`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
        const resp = await parseResponse(r);
        return resp.employee || resp;
    }
    async deleteEmployee(id) {
        await authFetch(`${BASE_URL}/employees/${id}/`, { method: 'DELETE' });
    }
    // ==================== DOCUMENTS ====================
    async getDocuments() {
        const r = await authFetch(`${BASE_URL}/documents/`);
        const data = await parseResponse(r);
        return data.documents || data;
    }
    async uploadDocument(formData) {
        const r = await authFetch(`${BASE_URL}/documents/upload/`, {
            method: 'POST',
            body: formData,
        });
        const resp = await parseResponse(r);
        return resp.document || resp;
    }
    async deleteDocument(id) {
        await authFetch(`${BASE_URL}/documents/${id}/`, { method: 'DELETE' });
    }
    async downloadDocument(id) {
        const r = await authFetch(`${BASE_URL}/documents/${id}/download/`);
        return r.blob();
    }
    // ==================== COMPLIANCE ====================
    async getCompliance() {
        const r = await authFetch(`${BASE_URL}/compliance/`);
        const data = await parseResponse(r);
        return data.compliance || data;
    }
    // ==================== REPORTS ====================
    async getReports() {
        const r = await authFetch(`${BASE_URL}/reports/`);
        const data = await parseResponse(r);
        return data.reports || data;
    }
    async generateReport(data) {
        const r = await authFetch(`${BASE_URL}/reports/generate/`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
        const resp = await parseResponse(r);
        return resp.report || resp;
    }
    async downloadReport(id) {
        const r = await authFetch(`${BASE_URL}/reports/${id}/download/`);
        return r.blob();
    }
    // ==================== ANALYTICS ====================
    async getSectorAnalytics() {
        const r = await authFetch(`${BASE_URL}/analytics/sector/`);
        const data = await parseResponse(r);
        return data.analytics || data;
    }
    async getTrends() {
        const r = await authFetch(`${BASE_URL}/analytics/trends/`);
        const data = await parseResponse(r);
        return data.trends || data;
    }
    // ==================== TRANSACTIONS ====================
    async getTransactions(params) {
        const q = new URLSearchParams();
        if (params?.start_date)
            q.append('start_date', params.start_date);
        if (params?.end_date)
            q.append('end_date', params.end_date);
        if (params?.type)
            q.append('type', params.type);
        if (params?.category)
            q.append('category', params.category);
        const r = await authFetch(`${BASE_URL}/transactions/${q.toString() ? `?${q}` : ''}`);
        return parseResponse(r);
    }
    async exportTransactions(params) {
        const r = await authFetch(`${BASE_URL}/transactions/export/`, {
            method: 'POST',
            body: JSON.stringify(params),
        });
        return parseResponse(r);
    }
    // ==================== SUPPORT ====================
    async getTickets() {
        const r = await authFetch(`${BASE_URL}/support/`);
        return parseResponse(r);
    }
    async getTicket(id) {
        const r = await authFetch(`${BASE_URL}/support/${id}/`);
        return parseResponse(r);
    }
    async createTicket(formData) {
        const r = await authFetch(`${BASE_URL}/support/`, {
            method: 'POST',
            body: formData,
        });
        return parseResponse(r);
    }
    async replyTicket(id, message) {
        const r = await authFetch(`${BASE_URL}/support/${id}/reply/`, {
            method: 'POST',
            body: JSON.stringify({ message }),
        });
        return parseResponse(r);
    }
    async closeTicket(id) {
        await authFetch(`${BASE_URL}/support/${id}/close/`, { method: 'POST' });
    }
    // ==================== NOTIFICATIONS ====================
    async getNotifications() {
        const r = await authFetch(`${BASE_URL}/notifications/`);
        return parseResponse(r);
    }
    async markAsRead(id) {
        await authFetch(`${BASE_URL}/notifications/${id}/read/`, { method: 'POST' });
    }
    async markAllAsRead() {
        await authFetch(`${BASE_URL}/notifications/read-all/`, { method: 'POST' });
    }
    async deleteNotification(id) {
        await authFetch(`${BASE_URL}/notifications/${id}/`, { method: 'DELETE' });
    }
    // ==================== AI ASSISTANT ====================
    async sendChatMessage(message, context) {
        const r = await authFetch(`${BASE_URL}/ai/chat/`, {
            method: 'POST',
            body: JSON.stringify({ message, context }),
        });
        return parseResponse(r);
    }
    // ==================== SETTINGS ====================
    async getSettings() {
        const r = await authFetch(`${BASE_URL}/settings/`);
        return parseResponse(r);
    }
    async updateSettings(data) {
        const r = await authFetch(`${BASE_URL}/settings/`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
        return parseResponse(r);
    }
}
// Export singleton
export const enterpriseApi = new EnterpriseAPI();
export default enterpriseApi;
