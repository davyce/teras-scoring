// src/utils/authFetch.ts ET src/services/authFetch.ts
/**
 * authFetch - Wrapper fetch avec JWT automatique
 * VERSION CORRIGÉE - Utilise les bonnes clés localStorage
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
// ✅ CORRECTION : Utiliser les mêmes clés que AuthContext et auth.ts
const STORAGE_KEYS = {
    ACCESS_TOKEN: 'teras_access_token',
    REFRESH_TOKEN: 'teras_refresh_token',
    USER: 'teras_user',
};
/**
 * Récupère le token d'accès depuis le localStorage
 */
function getAccessToken() {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
}
/**
 * Récupère le refresh token depuis le localStorage
 */
function getRefreshToken() {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
}
/**
 * Sauvegarde les tokens dans le localStorage
 */
function saveTokens(accessToken, refreshToken) {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    if (refreshToken) {
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    }
}
/**
 * Supprime les tokens du localStorage
 */
function clearTokens() {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
}
/**
 * Tente de refresh le token
 */
async function refreshAccessToken() {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
        return null;
    }
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/token/refresh/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refresh: refreshToken }),
        });
        if (!response.ok) {
            clearTokens();
            return null;
        }
        const data = await response.json();
        if (data.access) {
            saveTokens(data.access);
            return data.access;
        }
        return null;
    }
    catch (error) {
        console.error('Erreur refresh token:', error);
        clearTokens();
        return null;
    }
}
/**
 * Fetch avec authentification JWT automatique
 */
export async function authFetch(url, options = {}) {
    const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
    let accessToken = getAccessToken();
    const headers = new Headers(options.headers);
    if (accessToken) {
        headers.set('Authorization', `Bearer ${accessToken}`);
    }
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
    }
    let response = await fetch(fullUrl, {
        ...options,
        headers,
    });
    if (response.status === 401) {
        const newToken = await refreshAccessToken();
        if (newToken) {
            headers.set('Authorization', `Bearer ${newToken}`);
            response = await fetch(fullUrl, {
                ...options,
                headers,
            });
        }
        else {
            if (typeof window !== 'undefined') {
                window.location.href = '/login';
            }
            throw new Error('Session expirée, veuillez vous reconnecter');
        }
    }
    return response;
}
/**
 * Helper pour faire un GET avec authFetch
 */
export async function authGet(url) {
    const response = await authFetch(url);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
}
/**
 * Helper pour faire un POST avec authFetch
 */
export async function authPost(url, data) {
    const response = await authFetch(url, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
}
/**
 * Helper pour faire un PUT avec authFetch
 */
export async function authPut(url, data) {
    const response = await authFetch(url, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
}
/**
 * Helper pour faire un DELETE avec authFetch
 */
export async function authDelete(url) {
    const response = await authFetch(url, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
}
/**
 * Envoie un message au chatbot IA
 */
export async function sendChatMessage(message) {
    return authPost('/api/chat/message/', { message });
}
// Exporter les fonctions de gestion des tokens
export { getAccessToken, getRefreshToken, saveTokens, clearTokens };
