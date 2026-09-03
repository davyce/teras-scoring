// src/services/adminApi.ts - Service API Admin TERAS (CLEAN + KYC)
import { authFetch } from "./authFetch";

/**
 * IMPORTANT
 * Tes routes Admin sont:
 * /api/scoring/admin/...  (backend/backend/urls.py + scoring/urls_admin.py)
 */
const API_BASE = "/api/scoring/admin";

// ==================== TYPES ====================

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface AdminMetrics {
  total_users: number;
  active_users: number;
  suspended_users: number;
  enterprise_users: number;
  new_users_week: number;
  avg_score: number;
  total_transactions: number;
  fraud_alerts: number;
  critical_alerts: number;
}

export interface Activity {
  id: string;
  user_id: number;
  username: string;
  action: string;
  details: string;
  status: "success" | "warning" | "error";
  timestamp: string;
  ip_address?: string;
  region?: string;
}

export interface DashboardData {
  metrics: AdminMetrics;
  recent_activities: Activity[];
  regions_stats: Record<string, any>;
  sectors_stats: Record<string, any>;
  risk_distribution: Record<string, any>;
  system_health: Record<string, any>;
  fraud_alerts_recent: any[];
}

export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  phone?: string;
  phone_number?: string;
  region?: string;
  city?: string;
  address?: string;
  user_type: string;
  is_active: boolean;
  date_joined?: string;
  last_login?: string | null;
  score?: number | null;
  level?: string;
  risk_level?: "low" | "medium" | "high" | null;
  kyc_status?: string;
  sector?: string;
  latitude?: number | null;
  longitude?: number | null;
  location_source?: string;
  location_updated_at?: string | null;
}

export interface UsersListResponse {
  users: User[];
  total: number;
  page: number;
  page_size: number;
}

export interface AdminMapUser extends User {
  full_name: string;
  latitude: number;
  longitude: number;
}

export interface UsersMapResponse {
  users: AdminMapUser[];
  total: number;
  geolocated_count: number;
}

export interface UserDetail extends Record<string, any> {}
export interface AnalyticsData extends Record<string, any> {}

// ==================== ✅ KYC TYPES ====================

export type KYCStatus = "pending" | "approved" | "rejected";

export interface KYCRequestUser {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

export interface KYCRequest {
  id: number;
  status: KYCStatus;

  // selon ton backend (adaptable)
  document_type?: string;

  // lien complet si backend le renvoie
  document_url?: string;

  // fallback: si backend renvoie un path
  document?: string;

  submitted_at?: string;
  reviewed_at?: string;

  rejection_reason?: string;
  admin_comment?: string;

  user?: KYCRequestUser;
}

export interface KYCRequestsResponse {
  requests: KYCRequest[];
}

export interface KYCRequestDetailResponse {
  request: KYCRequest;
}

export interface KYCActionResponse {
  success: boolean;
  message?: string;
}

// ==================== HELPERS ====================

async function parseError(response: Response, fallback: string) {
  try {
    const j = await response.json();
    return (j as any)?.detail || (j as any)?.error || fallback;
  } catch {
    return fallback;
  }
}

// ==================== ADMIN API ====================

export async function getDashboard(): Promise<ApiResponse<DashboardData>> {
  try {
    const response = await authFetch(`${API_BASE}/dashboard/`);
    if (!response.ok) return { error: await parseError(response, "Erreur dashboard") };
    return { data: await response.json() };
  } catch (e: any) {
    return { error: e?.message || "Erreur réseau" };
  }
}

export async function getUsers(params?: {
  search?: string;
  type?: string;
  region?: string;
  risk?: string;
  status?: string;
  page?: number;
  page_size?: number;
}): Promise<ApiResponse<UsersListResponse>> {
  try {
    const qp = new URLSearchParams();
    if (params?.search) qp.append("search", params.search);
    if (params?.type) qp.append("type", params.type);
    if (params?.region) qp.append("region", params.region);
    if (params?.risk) qp.append("risk", params.risk);
    if (params?.status) qp.append("status", params.status);
    if (params?.page) qp.append("page", String(params.page));
    if (params?.page_size) qp.append("page_size", String(params.page_size));

    const url = `${API_BASE}/users/${qp.toString() ? `?${qp.toString()}` : ""}`;
    const response = await authFetch(url);
    if (!response.ok) return { error: await parseError(response, "Erreur de chargement users") };
    return { data: await response.json() };
  } catch (e: any) {
    return { error: e?.message || "Erreur réseau" };
  }
}

export async function getUsersMap(params?: {
  search?: string;
  type?: string;
  region?: string;
  status?: string;
  kyc?: string;
}): Promise<ApiResponse<UsersMapResponse>> {
  try {
    const qp = new URLSearchParams();
    if (params?.search) qp.append("search", params.search);
    if (params?.type) qp.append("type", params.type);
    if (params?.region) qp.append("region", params.region);
    if (params?.status) qp.append("status", params.status);
    if (params?.kyc) qp.append("kyc", params.kyc);

    const url = `${API_BASE}/users/map/${qp.toString() ? `?${qp.toString()}` : ""}`;
    const response = await authFetch(url);
    if (!response.ok) return { error: await parseError(response, "Erreur de chargement carte utilisateurs") };
    return { data: await response.json() };
  } catch (e: any) {
    return { error: e?.message || "Erreur réseau" };
  }
}

export async function getUserDetail(userId: number): Promise<ApiResponse<UserDetail>> {
  try {
    const response = await authFetch(`${API_BASE}/users/${userId}/`);
    if (!response.ok) return { error: await parseError(response, "Utilisateur introuvable") };
    return { data: await response.json() };
  } catch (e: any) {
    return { error: e?.message || "Erreur réseau" };
  }
}

export async function suspendUser(userId: number): Promise<ApiResponse<{ success: boolean; message: string }>> {
  try {
    const response = await authFetch(`${API_BASE}/users/${userId}/suspend/`, { method: "POST" });
    if (!response.ok) return { error: await parseError(response, "Erreur de suspension") };
    return { data: await response.json() };
  } catch (e: any) {
    return { error: e?.message || "Erreur réseau" };
  }
}

export async function restoreUser(userId: number): Promise<ApiResponse<{ success: boolean; message: string }>> {
  try {
    const response = await authFetch(`${API_BASE}/users/${userId}/restore/`, { method: "POST" });
    if (!response.ok) return { error: await parseError(response, "Erreur de réactivation") };
    return { data: await response.json() };
  } catch (e: any) {
    return { error: e?.message || "Erreur réseau" };
  }
}

export async function getAnalytics(): Promise<ApiResponse<AnalyticsData>> {
  try {
    const response = await authFetch(`${API_BASE}/analytics/`);
    if (!response.ok) return { error: await parseError(response, "Erreur analytics") };
    return { data: await response.json() };
  } catch (e: any) {
    return { error: e?.message || "Erreur réseau" };
  }
}

export async function getActivities(params?: {
  status?: string;
  limit?: number;
}): Promise<ApiResponse<Activity[]>> {
  try {
    const qp = new URLSearchParams();
    if (params?.status) qp.append("status", params.status);
    if (params?.limit) qp.append("limit", String(params.limit));

    const url = `${API_BASE}/activities/${qp.toString() ? `?${qp.toString()}` : ""}`;
    const response = await authFetch(url);
    if (!response.ok) return { error: await parseError(response, "Erreur activités") };

    const data = await response.json();
    return { data: (data?.activities ?? data) as Activity[] };
  } catch (e: any) {
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

export async function getKYCRequests(params?: { status?: KYCStatus }): Promise<ApiResponse<KYCRequestsResponse>> {
  try {
    const qp = new URLSearchParams();
    if (params?.status) qp.append("status", params.status);

    const url = `${API_BASE}/kyc/requests/${qp.toString() ? `?${qp.toString()}` : ""}`;
    const response = await authFetch(url);
    if (!response.ok) return { error: await parseError(response, "Erreur chargement KYC") };

    const data = await response.json();
    const normalized: KYCRequestsResponse = Array.isArray(data) ? { requests: data } : data;
    return { data: normalized };
  } catch (e: any) {
    return { error: e?.message || "Erreur réseau" };
  }
}

export async function getKYCRequestDetail(kycId: number): Promise<ApiResponse<KYCRequestDetailResponse>> {
  try {
    const response = await authFetch(`${API_BASE}/kyc/requests/${kycId}/`);
    if (!response.ok) return { error: await parseError(response, "Erreur détail KYC") };

    const data = await response.json();
    const normalized: KYCRequestDetailResponse = data?.request ? data : { request: data };
    return { data: normalized };
  } catch (e: any) {
    return { error: e?.message || "Erreur réseau" };
  }
}

export async function approveKYCRequest(kycId: number): Promise<ApiResponse<KYCActionResponse>> {
  try {
    const response = await authFetch(`${API_BASE}/kyc/requests/${kycId}/approve/`, { method: "POST" });
    if (!response.ok) return { error: await parseError(response, "Erreur validation KYC") };
    return { data: await response.json() };
  } catch (e: any) {
    return { error: e?.message || "Erreur réseau" };
  }
}

export async function rejectKYCRequest(kycId: number, reason: string): Promise<ApiResponse<KYCActionResponse>> {
  try {
    const response = await authFetch(`${API_BASE}/kyc/requests/${kycId}/reject/`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
    if (!response.ok) return { error: await parseError(response, "Erreur rejet KYC") };
    return { data: await response.json() };
  } catch (e: any) {
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
