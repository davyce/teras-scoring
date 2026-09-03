/**
 * Fonctions API spécifiques à TERAS
 * @module utils/api
 */
import { authGet, authPost } from "./authFetch";
// ============================================================================
// CONFIGURATION
// ============================================================================
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
// ============================================================================
// AUTH API
// ============================================================================
/**
 * Connexion utilisateur
 */
export async function loginRequest(username, password) {
    return authPost("/api/auth/login/", {
        username,
        password,
    });
}
/**
 * Inscription utilisateur
 */
export async function registerRequest(payload) {
    return authPost("/api/auth/register/", payload);
}
/**
 * Récupérer le profil utilisateur complet
 */
export async function getMe() {
    return authGet("/api/users/me/");
}
/**
 * Refresh token
 */
export async function refreshToken(refresh) {
    return authPost("/api/auth/refresh/", { refresh });
}
/**
 * Déconnexion (blacklist le refresh token)
 */
export async function logoutRequest(refresh) {
    return authPost("/api/auth/logout/", { refresh });
}
// ============================================================================
// DASHBOARD API
// ============================================================================
/**
 * Récupérer le dashboard TERAS complet
 */
export async function getDashboard() {
    return authGet("/api/teras/dashboard/");
}
// ============================================================================
// DOCUMENTS API
// ============================================================================
/**
 * Upload un document (relevé bancaire, bulletin de salaire, etc.)
 */
export async function uploadDocument(file, category) {
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
        const error = new Error(`Upload failed: ${response.status}`);
        error.status = response.status;
        throw error;
    }
    return response.json();
}
