// @ts-nocheck
// teras-frontend/src/services/api.ts
/**
 * Service API TERAS avec gestion JWT
 * Client HTTP configuré avec intercepteurs pour l'authentification
 */
// Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
// Token storage
const TOKEN_KEY = 'teras_access_token';
const REFRESH_KEY = 'teras_refresh_token';
export const tokenStorage = {
    getAccessToken: () => localStorage.getItem(TOKEN_KEY),
    getRefreshToken: () => localStorage.getItem(REFRESH_KEY),
    setTokens: (access, refresh) => {
        localStorage.setItem(TOKEN_KEY, access);
        localStorage.setItem(REFRESH_KEY, refresh);
    },
    clearTokens: () => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_KEY);
    },
};
// HTTP Client
class ApiClient {
    constructor(baseURL) {
        this.baseURL = baseURL;
    }
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const accessToken = tokenStorage.getAccessToken();
        // Headers par défaut
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };
        // Ajouter le token JWT si disponible
        if (accessToken && !endpoint.includes('/token/')) {
            headers['Authorization'] = `Bearer ${accessToken}`;
        }
        try {
            const response = await fetch(url, {
                ...options,
                headers,
            });
            // Gestion du refresh token si 401
            if (response.status === 401 && !endpoint.includes('/token/')) {
                const refreshed = await this.refreshAccessToken();
                if (refreshed) {
                    // Retry la requête avec le nouveau token
                    headers['Authorization'] = `Bearer ${tokenStorage.getAccessToken()}`;
                    const retryResponse = await fetch(url, { ...options, headers });
                    const data = await retryResponse.json();
                    return { data };
                }
                else {
                    // Refresh failed, logout
                    tokenStorage.clearTokens();
                    window.location.href = '/login';
                    throw new Error('Session expirée');
                }
            }
            const data = await response.json();
            if (!response.ok) {
                return {
                    error: data.error || data.detail || 'Erreur serveur',
                };
            }
            return { data };
        }
        catch (error) {
            return {
                error: error.message || 'Erreur de connexion',
            };
        }
    }
    // Méthodes HTTP
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }
    async post(endpoint, body) {
        return this.request(endpoint, {
            method: 'POST',
            body: body ? JSON.stringify(body) : undefined,
        });
    }
    async put(endpoint, body) {
        return this.request(endpoint, {
            method: 'PUT',
            body: body ? JSON.stringify(body) : undefined,
        });
    }
    async patch(endpoint, body) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: body ? JSON.stringify(body) : undefined,
        });
    }
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
    // Refresh token
    async refreshAccessToken() {
        const refreshToken = tokenStorage.getRefreshToken();
        if (!refreshToken)
            return false;
        try {
            const response = await fetch(`${this.baseURL}/token/refresh/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh: refreshToken }),
            });
            if (response.ok) {
                const data = await response.json();
                tokenStorage.setTokens(data.access, data.refresh);
                return true;
            }
            return false;
        }
        catch {
            return false;
        }
    }
}
// Instance du client
const apiClient = new ApiClient(API_BASE_URL);
// ============================================================================
// AUTH API
// ============================================================================
export const authApi = {
    /**
     * Connexion
     */
    async login(credentials) {
        const response = await apiClient.post('/token/', credentials);
        if (response.data) {
            tokenStorage.setTokens(response.data.access, response.data.refresh);
        }
        return response;
    },
    /**
     * Inscription
     */
    async register(data) {
        return apiClient.post('/register/', data);
    },
    /**
     * Déconnexion
     */
    async logout() {
        const refreshToken = tokenStorage.getRefreshToken();
        const response = await apiClient.post('/logout/', { refresh: refreshToken });
        tokenStorage.clearTokens();
        return response;
    },
    /**
     * Profil utilisateur
     */
    async me() {
        return apiClient.get('/me/');
    },
    /**
     * Vérifier si l'utilisateur est authentifié
     */
    isAuthenticated() {
        return !!tokenStorage.getAccessToken();
    },
};
export const scoringApi = {
    /**
     * Calculer un score TERAS
     */
    async compute(input) {
        return apiClient.post('/v1/scoring/compute/', input);
    },
    /**
     * Récupérer l'historique des scores
     */
    async getHistory() {
        return apiClient.get('/v1/scoring/history/');
    },
    /**
     * Exporter les scores en CSV
     */
    async exportCSV() {
        const token = tokenStorage.getAccessToken();
        const url = `${API_BASE_URL}/v1/scoring/export/`;
        window.open(`${url}?token=${token}`, '_blank');
    },
};
// ============================================================================
// DOCUMENTS API
// ============================================================================
export const documentsApi = {
    /**
     * Liste des documents
     */
    async list() {
        return apiClient.get('/documents/');
    },
    /**
     * Upload un document
     */
    async upload(file, category) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', category);
        const token = tokenStorage.getAccessToken();
        const response = await fetch(`${API_BASE_URL}/documents/upload/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
        });
        const data = await response.json();
        return { data };
    },
};
// Export du client
export default apiClient;
