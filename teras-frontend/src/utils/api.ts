// @ts-nocheck
/**
 * Fonctions API spécifiques à TERAS
 * @module utils/api
 */

import { authFetch, authGet, authPost } from "./authFetch";

// ============================================================================
// CONFIGURATION
// ============================================================================

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ============================================================================
// TYPES
// ============================================================================

export interface JwtTokens {
  access: string;
  refresh?: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  user_type: string; // 'standard' | 'admin' | 'entreprise' | 'regional'
  role: string; // 'USER_BASIC' | 'ADMIN' | 'ENTERPRISE' | 'REGIONAL'
}

export interface Profile {
  id: number;
  bio: string;
  created_at: string;
}

export interface UserWithProfile extends User {
  profile: Profile;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface ScoreHistory {
  label: string;
  score: number;
}

export interface Recommendation {
  id: number;
  title: string;
  description: string;
  impactLabel: string;
}

export interface RecentActivity {
  id: string;
  label: string;
  detail: string;
  timeAgo: string;
}

export interface RecentDoc {
  id: number;
  name: string;
  date: string;
}

export interface Alert {
  id: string;
  label: string;
}

export interface DashboardData {
  score: number | null;
  scoreLabel: string | null;
  utilization: number | null;
  paymentsOnTime: number | null;
  creditAgeYears: number | null;
  history: ScoreHistory[];
  recommendations: Recommendation[];
  recentActivities: RecentActivity[];
  recentDocs: RecentDoc[];
  alerts: Alert[];
  potentialScore: number | null;
}

export interface UploadedDocument {
  id: number;
  category: string;
  file: string;
  uploaded_at: string;
  status: string;
  analysis_summary: string;
}

export interface DocumentUploadResponse {
  detail: string;
  document: UploadedDocument;
  dashboard: DashboardData;
}

// ============================================================================
// AUTH API
// ============================================================================

/**
 * Connexion utilisateur
 */
export async function loginRequest(
  username: string,
  password: string
): Promise<JwtTokens> {
  return authPost("/api/auth/login/", {
    username,
    password,
  });
}

/**
 * Inscription utilisateur
 */
export async function registerRequest(
  payload: RegisterPayload
): Promise<User> {
  return authPost("/api/auth/register/", payload);
}

/**
 * Récupérer le profil utilisateur complet
 */
export async function getMe(): Promise<UserWithProfile> {
  return authGet("/api/users/me/");
}

/**
 * Refresh token
 */
export async function refreshToken(refresh: string): Promise<JwtTokens> {
  return authPost("/api/auth/refresh/", { refresh });
}

/**
 * Déconnexion (blacklist le refresh token)
 */
export async function logoutRequest(refresh: string): Promise<void> {
  return authPost("/api/auth/logout/", { refresh });
}

// ============================================================================
// DASHBOARD API
// ============================================================================

/**
 * Récupérer le dashboard TERAS complet
 */
export async function getDashboard(): Promise<DashboardData> {
  return authGet("/api/teras/dashboard/");
}

// ============================================================================
// DOCUMENTS API
// ============================================================================

/**
 * Upload un document (relevé bancaire, bulletin de salaire, etc.)
 */
export async function uploadDocument(
  file: File,
  category: "bank" | "payslip" | "other"
): Promise<DocumentUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("category", category);

  const token = typeof window !== "undefined"
    ? window.localStorage.getItem("teras_access_token") ||
      window.localStorage.getItem("teras_token")
    : null;

  const response = await fetch(`${API_URL}/api/documents/upload/`, {
    method: "POST",
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
    body: formData,
  });

  if (!response.ok) {
    const error: any = new Error(`Upload failed: ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return response.json();
}
