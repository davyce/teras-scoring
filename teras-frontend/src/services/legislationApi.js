// frontend/src/services/legislationApi.ts
/**
 * Service API pour la gestion de la base législative CEMAC
 * Endpoints: /api/admin/legislation/*
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
export const legislationApi = {
    /**
     * GET /api/admin/legislation/
     * Récupérer la liste des documents législatifs
     */
    list: async (params = {}) => {
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                queryParams.append(key, value.toString());
            }
        });
        const queryString = queryParams.toString();
        const url = `/api/admin/legislation/${queryString ? '?' + queryString : ''}`;
        return authFetch(url);
    },
    /**
     * GET /api/admin/legislation/{id}/
     * Récupérer les détails d'un document législatif
     */
    getDetail: async (id) => {
        return authFetch(`/api/admin/legislation/${id}/`);
    },
    /**
     * POST /api/admin/legislation/upload/
     * Upload un nouveau document législatif
     */
    upload: async (formData) => {
        return authFetch('/api/admin/legislation/upload/', {
            method: 'POST',
            body: formData, // FormData gère automatiquement le Content-Type
        });
    },
    /**
     * DELETE /api/admin/legislation/{id}/
     * Supprimer un document législatif (soft delete)
     */
    delete: async (id) => {
        return authFetch(`/api/admin/legislation/${id}/`, {
            method: 'DELETE',
        });
    },
    /**
     * POST /api/admin/legislation/{id}/reindex/
     * Réindexer un document législatif
     */
    reindex: async (id) => {
        return authFetch(`/api/admin/legislation/${id}/reindex/`, {
            method: 'POST',
        });
    },
    /**
     * GET /api/admin/legislation/stats/
     * Récupérer les statistiques de la base législative
     */
    getStats: async () => {
        return authFetch('/api/admin/legislation/stats/');
    },
    /**
     * POST /api/admin/legislation/search/
     * Recherche sémantique dans la législation (via vecteurs)
     */
    semanticSearch: async (query, filters) => {
        return authFetch('/api/admin/legislation/search/', {
            method: 'POST',
            body: JSON.stringify({
                query,
                ...filters,
            }),
        });
    },
};
export default legislationApi;
