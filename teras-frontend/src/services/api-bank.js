// src/services/api-bank.ts
// Couche API centralisée pour l'interface Banque TERAS
// Utilise authFetch du projet (clé: teras_access_token)
import { authFetch } from './authFetch';
const BASE = '/api/scoring/bank';
// ─── Helper erreur ────────────────────────────────────────────────────────────
async function handleResponse(res) {
    if (!res.ok) {
        let msg = `Erreur ${res.status}`;
        try {
            const err = await res.json();
            msg = err.detail || err.error || msg;
        }
        catch { }
        throw new Error(msg);
    }
    return res.json();
}
// ─── Dashboard ───────────────────────────────────────────────────────────────
export async function getBankDashboard() {
    const res = await authFetch(`${BASE}/dashboard/`);
    return handleResponse(res);
}
// ─── Clients ─────────────────────────────────────────────────────────────────
export async function getBankClients(params) {
    const q = new URLSearchParams();
    if (params?.search)
        q.set('search', params.search);
    if (params?.score_min != null)
        q.set('score_min', String(params.score_min));
    if (params?.score_max != null)
        q.set('score_max', String(params.score_max));
    if (params?.page)
        q.set('page', String(params.page));
    const res = await authFetch(`${BASE}/clients/?${q}`);
    return handleResponse(res);
}
export async function getBankClientDetail(id) {
    const res = await authFetch(`${BASE}/clients/${id}/`);
    return handleResponse(res);
}
export async function createBankClient(data) {
    const res = await authFetch(`${BASE}/clients/create/`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    return handleResponse(res);
}
export async function updateBankClient(id, data) {
    const res = await authFetch(`${BASE}/clients/${id}/update/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
    return handleResponse(res);
}
// ─── Entreprises ─────────────────────────────────────────────────────────────
export async function getBankEnterprises(params) {
    const q = new URLSearchParams();
    if (params?.search)
        q.set('search', params.search);
    if (params?.page)
        q.set('page', String(params.page));
    const res = await authFetch(`${BASE}/enterprises/?${q}`);
    return handleResponse(res);
}
export async function getBankEnterpriseDetail(id) {
    const res = await authFetch(`${BASE}/enterprises/${id}/`);
    return handleResponse(res);
}
export async function createBankEnterprise(data) {
    const res = await authFetch(`${BASE}/enterprises/create/`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    return handleResponse(res);
}
// ─── Demandes de crédit ───────────────────────────────────────────────────────
export async function getPendingApplications() {
    const res = await authFetch(`${BASE}/applications/pending/`);
    return handleResponse(res);
}
export async function getApprovedApplications() {
    const res = await authFetch(`${BASE}/applications/approved/`);
    return handleResponse(res);
}
export async function getRejectedApplications() {
    const res = await authFetch(`${BASE}/applications/rejected/`);
    return handleResponse(res);
}
export async function getApplicationDetail(id) {
    const res = await authFetch(`${BASE}/applications/${id}/`);
    return handleResponse(res);
}
export async function reviewApplication(id, decision) {
    const res = await authFetch(`${BASE}/applications/${id}/review/`, {
        method: 'POST',
        body: JSON.stringify(decision),
    });
    return handleResponse(res);
}
export async function submitApplication(data) {
    const res = await authFetch(`${BASE}/applications/submit/`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    return handleResponse(res);
}
// ─── Produits ─────────────────────────────────────────────────────────────────
export async function getFinancialProducts() {
    const res = await authFetch(`${BASE}/products/`);
    const data = await handleResponse(res);
    return Array.isArray(data) ? data : (data.results ?? []);
}
// ─── Simulateur ──────────────────────────────────────────────────────────────
export async function simulateCredit(params) {
    const res = await authFetch(`${BASE}/simulator/`, {
        method: 'POST',
        body: JSON.stringify(params),
    });
    return handleResponse(res);
}
// ─── Helpers visuels ─────────────────────────────────────────────────────────
export function getBandColor(band) {
    const colors = {
        'A+': 'emerald', A: 'green', B: 'blue', C: 'amber', D: 'orange', E: 'red',
    };
    return colors[band] ?? 'slate';
}
export function getRiskLevel(score) {
    if (score >= 750)
        return { level: 'low', label: 'Risque Faible', color: 'green' };
    if (score >= 600)
        return { level: 'medium', label: 'Risque Modéré', color: 'amber' };
    if (score >= 450)
        return { level: 'high', label: 'Risque Élevé', color: 'orange' };
    return { level: 'critical', label: 'Risque Critique', color: 'red' };
}
export function formatCFA(amount) {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' CFA';
}
export function formatMillions(amount) {
    if (amount >= 1000000)
        return (amount / 1000000).toFixed(1) + 'M CFA';
    if (amount >= 1000)
        return (amount / 1000).toFixed(0) + 'k CFA';
    return formatCFA(amount);
}
// ─── Reason codes → labels français ──────────────────────────────────────────
export const REASON_CODE_LABELS = {
    T_FREQUENCY_HIGH: { label: 'Fréquence de transactions élevée', direction: 'positive' },
    T_FREQUENCY_LOW: { label: 'Fréquence de transactions faible', direction: 'negative' },
    T_RATIO_BALANCED: { label: 'Ratio crédit/débit équilibré', direction: 'positive' },
    T_RATIO_UNBALANCED: { label: 'Ratio crédit/débit déséquilibré', direction: 'negative' },
    T_REGULARITY_STRONG: { label: 'Transactions régulières et constantes', direction: 'positive' },
    T_REGULARITY_WEAK: { label: 'Transactions irrégulières', direction: 'negative' },
    E_STREAK_STRONG: { label: 'Épargne mensuelle régulière', direction: 'positive' },
    E_STREAK_WEAK: { label: 'Épargne insuffisante ou irrégulière', direction: 'negative' },
    E_SAVINGS_HIGH: { label: "Niveau d'épargne élevé", direction: 'positive' },
    E_SAVINGS_LOW: { label: "Niveau d'épargne faible", direction: 'negative' },
    R_INCOME_STABLE: { label: 'Revenus stables et vérifiés', direction: 'positive' },
    R_VARIANCE_HIGH: { label: 'Revenus irréguliers (forte variance)', direction: 'negative' },
    R_INCOME_VERIFIED: { label: 'Revenus officiellement vérifiés', direction: 'positive' },
    A_ASSET_HIGH: { label: 'Patrimoine déclaré solide', direction: 'positive' },
    A_ASSET_LOW: { label: 'Patrimoine déclaré insuffisant', direction: 'negative' },
    A_ASSET_VERIFIED: { label: 'Actifs vérifiés et documentés', direction: 'positive' },
    S_REPUTATION_GOOD: { label: 'Bonne réputation communautaire', direction: 'positive' },
    S_NEGATIVE_EVENTS: { label: 'Incidents négatifs récents', direction: 'negative' },
    S_COMMUNITY_ACTIVE: { label: 'Participation active (tontine/association)', direction: 'positive' },
};
