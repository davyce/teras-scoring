// src/services/adminApi.ts - Service API Admin TERAS (CLEAN + KYC)
import { authFetch } from "./authFetch";
/**
 * IMPORTANT
 * Tes routes Admin sont:
 * /api/scoring/admin/...  (backend/backend/urls.py + scoring/urls_admin.py)
 */
const API_BASE = "/api/scoring/admin";
// ==================== HELPERS ====================
async function parseError(response, fallback) {
    try {
        const j = await response.json();
        return j?.detail || j?.error || fallback;
    }
    catch {
        return fallback;
    }
}
// ==================== ADMIN API ====================
export async function getDashboard() {
    try {
        const response = await authFetch(`${API_BASE}/dashboard/`);
        if (!response.ok)
            return { error: await parseError(response, "Erreur dashboard") };
        return { data: await response.json() };
    }
    catch (e) {
        return { error: e?.message || "Erreur réseau" };
    }
}
export async function getUsers(params) {
    try {
        const qp = new URLSearchParams();
        if (params?.search)
            qp.append("search", params.search);
        if (params?.type)
            qp.append("type", params.type);
        if (params?.region)
            qp.append("region", params.region);
        if (params?.risk)
            qp.append("risk", params.risk);
        if (params?.status)
            qp.append("status", params.status);
        if (params?.page)
            qp.append("page", String(params.page));
        if (params?.page_size)
            qp.append("page_size", String(params.page_size));
        const url = `${API_BASE}/users/${qp.toString() ? `?${qp.toString()}` : ""}`;
        const response = await authFetch(url);
        if (!response.ok)
            return { error: await parseError(response, "Erreur de chargement users") };
        return { data: await response.json() };
    }
    catch (e) {
        return { error: e?.message || "Erreur réseau" };
    }
}
export async function getUsersMap(params) {
    try {
        const qp = new URLSearchParams();
        if (params?.search)
            qp.append("search", params.search);
        if (params?.type)
            qp.append("type", params.type);
        if (params?.region)
            qp.append("region", params.region);
        if (params?.status)
            qp.append("status", params.status);
        if (params?.kyc)
            qp.append("kyc", params.kyc);
        const url = `${API_BASE}/users/map/${qp.toString() ? `?${qp.toString()}` : ""}`;
        const response = await authFetch(url);
        if (!response.ok)
            return { error: await parseError(response, "Erreur de chargement carte utilisateurs") };
        return { data: await response.json() };
    }
    catch (e) {
        return { error: e?.message || "Erreur réseau" };
    }
}
export async function getUserDetail(userId) {
    try {
        const response = await authFetch(`${API_BASE}/users/${userId}/`);
        if (!response.ok)
            return { error: await parseError(response, "Utilisateur introuvable") };
        return { data: await response.json() };
    }
    catch (e) {
        return { error: e?.message || "Erreur réseau" };
    }
}
export async function suspendUser(userId) {
    try {
        const response = await authFetch(`${API_BASE}/users/${userId}/suspend/`, { method: "POST" });
        if (!response.ok)
            return { error: await parseError(response, "Erreur de suspension") };
        return { data: await response.json() };
    }
    catch (e) {
        return { error: e?.message || "Erreur réseau" };
    }
}
export async function restoreUser(userId) {
    try {
        const response = await authFetch(`${API_BASE}/users/${userId}/restore/`, { method: "POST" });
        if (!response.ok)
            return { error: await parseError(response, "Erreur de réactivation") };
        return { data: await response.json() };
    }
    catch (e) {
        return { error: e?.message || "Erreur réseau" };
    }
}
export async function getAnalytics() {
    try {
        const response = await authFetch(`${API_BASE}/analytics/`);
        if (!response.ok)
            return { error: await parseError(response, "Erreur analytics") };
        return { data: await response.json() };
    }
    catch (e) {
        return { error: e?.message || "Erreur réseau" };
    }
}
export async function getActivities(params) {
    try {
        const qp = new URLSearchParams();
        if (params?.status)
            qp.append("status", params.status);
        if (params?.limit)
            qp.append("limit", String(params.limit));
        const url = `${API_BASE}/activities/${qp.toString() ? `?${qp.toString()}` : ""}`;
        const response = await authFetch(url);
        if (!response.ok)
            return { error: await parseError(response, "Erreur activités") };
        const data = await response.json();
        return { data: (data?.activities ?? data) };
    }
    catch (e) {
        return { error: e?.message || "Erreur réseau" };
    }
}
// ==================== ✅ KYC (ALIGNÉ SUR urls_admin.py) ====================
/**
 * GET  /api/scoring/admin/kyc/requests/
 * GET  /api/scoring/admin/kyc/requests/<kyc_id>/
 * POST /api/scoring/admin/kyc/requests/<kyc_id>/approve/
 * POST /api/scoring/admin/kyc/requests/<kyc_id>/reject/
 */
export async function getKYCRequests(params) {
    try {
        const qp = new URLSearchParams();
        if (params?.status)
            qp.append("status", params.status);
        const url = `${API_BASE}/kyc/requests/${qp.toString() ? `?${qp.toString()}` : ""}`;
        const response = await authFetch(url);
        if (!response.ok)
            return { error: await parseError(response, "Erreur chargement KYC") };
        const data = await response.json();
        const normalized = Array.isArray(data) ? { requests: data } : data;
        return { data: normalized };
    }
    catch (e) {
        return { error: e?.message || "Erreur réseau" };
    }
}
export async function getKYCRequestDetail(kycId) {
    try {
        const response = await authFetch(`${API_BASE}/kyc/requests/${kycId}/`);
        if (!response.ok)
            return { error: await parseError(response, "Erreur détail KYC") };
        const data = await response.json();
        const normalized = data?.request ? data : { request: data };
        return { data: normalized };
    }
    catch (e) {
        return { error: e?.message || "Erreur réseau" };
    }
}
export async function approveKYCRequest(kycId) {
    try {
        const response = await authFetch(`${API_BASE}/kyc/requests/${kycId}/approve/`, { method: "POST" });
        if (!response.ok)
            return { error: await parseError(response, "Erreur validation KYC") };
        return { data: await response.json() };
    }
    catch (e) {
        return { error: e?.message || "Erreur réseau" };
    }
}
export async function rejectKYCRequest(kycId, reason) {
    try {
        const response = await authFetch(`${API_BASE}/kyc/requests/${kycId}/reject/`, {
            method: "POST",
            body: JSON.stringify({ reason }),
        });
        if (!response.ok)
            return { error: await parseError(response, "Erreur rejet KYC") };
        return { data: await response.json() };
    }
    catch (e) {
        return { error: e?.message || "Erreur réseau" };
    }
}
// Export tout
export const adminApi = {
    getDashboard,
    getUsers,
    getUsersMap,
    getUserDetail,
    suspendUser,
    restoreUser,
    getAnalytics,
    getActivities,
    // KYC
    getKYCRequests,
    getKYCRequestDetail,
    approveKYCRequest,
    rejectKYCRequest,
};
export default adminApi;
