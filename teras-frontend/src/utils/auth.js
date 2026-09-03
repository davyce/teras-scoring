// @ts-nocheck
/**
 * Fonctions d'authentification et API TERAS
 * @module utils/auth
 */
// ============================================================================
// CONFIGURATION
// ============================================================================
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
// ============================================================================
// AUTHENTIFICATION
// ============================================================================
/**
 * Connexion utilisateur
 */
export async function loginRequest(username, password) {
    const res = await fetch(`${API_BASE}/api/auth/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw {
            status: res.status,
            message: "Identifiants invalides",
            payload: error
        };
    }
    return res.json(); // { access, refresh }
}
/**
 * Inscription utilisateur
 */
export async function registerRequest(payload) {
    const res = await fetch(`${API_BASE}/api/auth/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw {
            status: res.status,
            message: "Inscription impossible",
            payload: error
        };
    }
    return res.json();
}
/**
 * Récupérer les informations de l'utilisateur connecté
 */
export async function getMe() {
    const token = localStorage.getItem("teras_access_token") || localStorage.getItem("teras_token");
    if (!token) {
        throw new Error("No token");
    }
    const res = await fetch(`${API_BASE}/api/users/me/`, {
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
    });
    if (!res.ok) {
        if (res.status === 401) {
            // Token expiré ou invalide
            localStorage.removeItem("teras_access_token");
            localStorage.removeItem("teras_token");
            throw new Error("Token expired");
        }
        throw new Error("Impossible de charger le profil");
    }
    return res.json();
}
/**
 * Rafraîchir le token d'accès
 */
export async function refreshToken(refreshToken) {
    const res = await fetch(`${API_BASE}/api/auth/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refreshToken }),
    });
    if (!res.ok) {
        throw new Error("Impossible de rafraîchir le token");
    }
    return res.json(); // { access }
}
// ============================================================================
// GESTION DU PROFIL
// ============================================================================
/**
 * Mettre à jour le profil utilisateur
 */
export async function updateUserProfile(data) {
    const token = localStorage.getItem("teras_access_token") || localStorage.getItem("teras_token");
    if (!token) {
        throw new Error("No token");
    }
    const res = await fetch(`${API_BASE}/api/users/me/`, {
        method: "PATCH",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw {
            status: res.status,
            message: "Impossible de mettre à jour le profil",
            payload: error
        };
    }
    return res.json();
}
/**
 * Upload d'avatar
 */
export async function uploadAvatar(file) {
    const token = localStorage.getItem("teras_access_token") || localStorage.getItem("teras_token");
    if (!token) {
        throw new Error("No token");
    }
    const formData = new FormData();
    formData.append("avatar", file);
    const res = await fetch(`${API_BASE}/api/users/me/avatar/`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
        },
        body: formData,
    });
    if (!res.ok) {
        throw new Error("Erreur lors de l'upload de l'avatar");
    }
    return res.json(); // { avatar_url }
}
/**
 * Changer le mot de passe
 */
export async function changePassword(currentPassword, newPassword) {
    const token = localStorage.getItem("teras_access_token") || localStorage.getItem("teras_token");
    if (!token) {
        throw new Error("No token");
    }
    const res = await fetch(`${API_BASE}/api/users/me/change-password/`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword,
        }),
    });
    if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw {
            status: res.status,
            message: "Erreur lors du changement de mot de passe",
            payload: error
        };
    }
    return res.json();
}
// ============================================================================
// HELPER FUNCTION
// ============================================================================
/**
 * Vérifie si le token est encore valide
 */
export function isTokenValid() {
    const token = localStorage.getItem("teras_access_token") || localStorage.getItem("teras_token");
    if (!token)
        return false;
    try {
        // Décoder le JWT pour vérifier l'expiration
        const payload = JSON.parse(atob(token.split('.')[1]));
        const exp = payload.exp * 1000; // Convertir en millisecondes
        return Date.now() < exp;
    }
    catch {
        return false;
    }
}
/**
 * Déconnexion (nettoie le localStorage)
 */
export function logout() {
    localStorage.removeItem("teras_access_token");
    localStorage.removeItem("teras_token");
    localStorage.removeItem("teras_refresh_token");
    localStorage.removeItem("teras_user");
    localStorage.removeItem("teras-auth"); // Zustand persist
}
