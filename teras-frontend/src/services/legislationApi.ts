// frontend/src/services/legislationApi.ts
/**
 * Service API pour la gestion de la base législative CEMAC
 * Endpoints: /api/admin/legislation/*
 */

const API_BASE_URL = 'http://localhost:8000';

/**
 * Helper pour les appels API avec authentification
 */
async function authFetch(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('teras_access_token');
  
  const headers: HeadersInit = {
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
// TYPES
// ============================================================

export interface LegislationListParams {
  country?: string;
  category?: string;
  indexed?: boolean;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface LegislationDocument {
  id: number;
  country: string;
  country_display: string;
  category: string;
  category_display: string;
  title: string;
  description: string;
  filename: string;
  file_size: number;
  page_count: number;
  upload_date: string;
  uploaded_by: number;
  uploaded_by_name: string;
  effective_date: string | null;
  language: string;
  tags: string[];
  indexed: boolean;
  indexed_at: string | null;
  chunks_count: number;
  referenced_count: number;
  last_used: string | null;
  is_active: boolean;
}

// ============================================================
// API METHODS
// ============================================================

export const legislationApi = {
  /**
   * GET /api/admin/legislation/
   * Récupérer la liste des documents législatifs
   */
  list: async (params: LegislationListParams = {}) => {
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
  getDetail: async (id: number) => {
    return authFetch(`/api/admin/legislation/${id}/`);
  },

  /**
   * POST /api/admin/legislation/upload/
   * Upload un nouveau document législatif
   */
  upload: async (formData: FormData) => {
    return authFetch('/api/admin/legislation/upload/', {
      method: 'POST',
      body: formData, // FormData gère automatiquement le Content-Type
    });
  },

  /**
   * DELETE /api/admin/legislation/{id}/
   * Supprimer un document législatif (soft delete)
   */
  delete: async (id: number) => {
    return authFetch(`/api/admin/legislation/${id}/`, {
      method: 'DELETE',
    });
  },

  /**
   * POST /api/admin/legislation/{id}/reindex/
   * Réindexer un document législatif
   */
  reindex: async (id: number) => {
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
  semanticSearch: async (query: string, filters?: {
    country?: string;
    category?: string;
  }) => {
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
