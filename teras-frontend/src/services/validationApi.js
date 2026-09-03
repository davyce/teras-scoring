// frontend/src/services/validationApi.ts
/**
 * Service API pour la validation de documents TERAS
 * Endpoints: /api/admin/validation/* et /api/admin/documents/*
 */
const API_BASE_URL = 'http://localhost:8000';
/**
 * Helper pour les appels API avec authentification
 */
async function authFetch(url, options = {}) {
    const token = localStorage.getItem('teras_access_token');
    const headers = {
        ...options.headers,
    };
    // Ajouter Authorization si token existe
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    // Ajouter Content-Type si body est JSON (pas FormData)
    if (options.body && !(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }
    const response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers,
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Erreur réseau' }));
        throw new Error(error.detail || `Erreur ${response.status}`);
    }
    return response.json();
}
// ============================================================
// API METHODS
// ============================================================
export const validationApi = {
    /**
     * GET /api/admin/validation/queue/
     * Récupérer la file d'attente des documents à valider
     */
    getValidationQueue: async (params = {}) => {
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                queryParams.append(key, value.toString());
            }
        });
        const queryString = queryParams.toString();
        const url = `/api/admin/validation/queue/${queryString ? '?' + queryString : ''}`;
        return authFetch(url);
    },
    /**
     * GET /api/admin/documents/{id}/
     * Récupérer les détails d'un document
     */
    getDocument: async (id) => {
        return authFetch(`/api/admin/documents/${id}/`);
    },
    /**
     * POST /api/admin/documents/{id}/approve/
     * Approuver un document
     */
    approveDocument: async (id, data) => {
        return authFetch(`/api/admin/documents/${id}/approve/`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },
    /**
     * POST /api/admin/documents/{id}/reject/
     * Rejeter un document
     */
    rejectDocument: async (id, data) => {
        return authFetch(`/api/admin/documents/${id}/reject/`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },
    /**
     * POST /api/admin/documents/{id}/flag/
     * Signaler un document comme suspect
     */
    flagDocument: async (id, data) => {
        return authFetch(`/api/admin/documents/${id}/flag/`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },
    /**
     * POST /api/admin/documents/{id}/analyze/
     * Lancer l'analyse IA d'un document
     */
    analyzeDocument: async (id) => {
        return authFetch(`/api/admin/documents/${id}/analyze/`, {
            method: 'POST',
        });
    },
    /**
     * POST /api/admin/users/{user_id}/upload-document/
     * Upload un document pour un utilisateur (par admin)
     */
    uploadForUser: async (userId, formData) => {
        return authFetch(`/api/admin/users/${userId}/upload-document/`, {
            method: 'POST',
            body: formData, // FormData gère automatiquement le Content-Type
        });
    },
    /**
     * GET /api/admin/users/{id}/report/
     * Récupérer le rapport complet d'un utilisateur
     */
    getUserReport: async (userId) => {
        return authFetch(`/api/admin/users/${userId}/report/`);
    },
    /**
     * GET /api/admin/users/search/
     * Rechercher des utilisateurs (pour autocomplete)
     */
    searchUsers: async (searchTerm) => {
        const queryParams = new URLSearchParams({ search: searchTerm });
        return authFetch(`/api/admin/users/search/?${queryParams}`);
    },
};
export default validationApi;
